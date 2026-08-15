import assert from "node:assert/strict";
import test from "node:test";

import {
  createTtsPostHandler,
  MAX_TTS_TEXT_LENGTH,
} from "../src/app/api/tts/handler.js";
import {
  synthesizeKinyarwanda,
  TTS_DEFAULTS,
  TTS_SPACE_ID,
  TTS_SYNTHESIS_ENDPOINT,
} from "../src/app/api/tts/provider.js";
import {
  createTtsPlaybackManager,
  isKinyarwandaTtsEligible,
  TTS_FALLBACK_MESSAGE,
} from "../src/lib/tts-playback.js";

function createTurn(overrides = {}) {
  return {
    id: "turn-1",
    speakerSide: "visitor",
    originalText: "I need a moto.",
    interpretedText: "Ndashaka moto.",
    sourceLanguage: "English",
    targetLanguage: "Kinyarwanda",
    ...overrides,
  };
}

class MockAudio {
  constructor(url) {
    this.url = url;
    this.currentTime = 0;
    this.playCount = 0;
    this.pauseCount = 0;
    this.listeners = new Map();
  }

  addEventListener(event, callback) {
    this.listeners.set(event, callback);
  }

  async play() {
    this.playCount += 1;
  }

  pause() {
    this.pauseCount += 1;
  }

  emit(event) {
    this.listeners.get(event)?.();
  }
}

function createPlaybackHarness({ requestAudio } = {}) {
  const audioInstances = [];
  const revokedUrls = [];
  const states = new Map();
  let objectUrlCount = 0;
  const manager = createTtsPlaybackManager({
    requestAudio:
      requestAudio ?? (async () => new Blob(["audio"], { type: "audio/wav" })),
    createAudio(url) {
      const audio = new MockAudio(url);
      audioInstances.push(audio);
      return audio;
    },
    createObjectUrl() {
      objectUrlCount += 1;
      return `blob:kasuku-${objectUrlCount}`;
    },
    revokeObjectUrl(url) {
      revokedUrls.push(url);
    },
    onStateChange(turnId, state) {
      states.set(turnId, state);
    },
  });

  return {
    audioInstances,
    manager,
    revokedUrls,
    states,
  };
}

test("Kinyarwanda targets are TTS eligible and English targets are not", () => {
  assert.equal(isKinyarwandaTtsEligible(createTurn()), true);
  assert.equal(
    isKinyarwandaTtsEligible(
      createTurn({
        interpretedText: "I need a moto.",
        sourceLanguage: "Kinyarwanda",
        targetLanguage: "English",
      }),
    ),
    false,
  );
});

test("the Gradio provider uses the discovered endpoint, schema, and defaults", async () => {
  let connectedSpace;
  let prediction;
  let fetchedUrl;
  const result = await synthesizeKinyarwanda("Muraho", {
    connect: async (spaceId) => {
      connectedSpace = spaceId;
      return {
        async predict(endpoint, payload) {
          prediction = { endpoint, payload };
          return {
            data: [
              {
                url: "https://example.hf.space/gradio_api/file=audio.wav",
              },
              "Generated",
            ],
          };
        },
      };
    },
    fetchImpl: async (url) => {
      fetchedUrl = url;
      return new Response(new Uint8Array([1, 2, 3]), {
        headers: { "Content-Type": "application/octet-stream" },
      });
    },
  });

  assert.equal(connectedSpace, TTS_SPACE_ID);
  assert.deepEqual(prediction, {
    endpoint: TTS_SYNTHESIS_ENDPOINT,
    payload: {
      text: "Muraho",
      speaker_name: "Male",
      speed: 1,
    },
  });
  assert.deepEqual(TTS_DEFAULTS, { speakerName: "Male", speed: 1 });
  assert.match(fetchedUrl, /audio\.wav$/);
  assert.equal(result.audio.byteLength, 3);
  assert.equal(result.contentType, "audio/wav");
});

test("successful TTS becomes playable without mutating translation text", async () => {
  const turn = createTurn();
  const originalTurn = { ...turn };
  const harness = createPlaybackHarness();

  await harness.manager.listen(turn);

  assert.deepEqual(turn, originalTurn);
  assert.equal(harness.audioInstances.length, 1);
  assert.equal(harness.audioInstances[0].playCount, 1);
  assert.equal(harness.manager.getState(turn.id).status, "playing");
});

test("TTS failure leaves the translation intact and exposes a safe fallback", async () => {
  const turn = createTurn();
  const harness = createPlaybackHarness({
    requestAudio: async () => {
      throw new Error("private provider detail");
    },
  });

  await harness.manager.listen(turn);

  assert.equal(turn.interpretedText, "Ndashaka moto.");
  assert.deepEqual(harness.manager.getState(turn.id), {
    status: "error",
    message: TTS_FALLBACK_MESSAGE,
  });
});

test("completed audio replays from its cached URL without regenerating", async () => {
  let requestCount = 0;
  const turn = createTurn();
  const harness = createPlaybackHarness({
    requestAudio: async () => {
      requestCount += 1;
      return new Blob(["audio"], { type: "audio/wav" });
    },
  });

  await harness.manager.listen(turn);
  harness.audioInstances[0].emit("ended");
  assert.equal(harness.manager.getState(turn.id).status, "ready");

  await harness.manager.listen(turn);

  assert.equal(requestCount, 1);
  assert.equal(harness.audioInstances.length, 1);
  assert.equal(harness.audioInstances[0].playCount, 2);

  harness.manager.clearAll();
  assert.deepEqual(harness.revokedUrls, ["blob:kasuku-1"]);
});

test("loading TTS does not alter translation and ignores duplicate requests", async () => {
  let resolveAudio;
  let requestCount = 0;
  const turn = createTurn();
  const pendingAudio = new Promise((resolve) => {
    resolveAudio = resolve;
  });
  const harness = createPlaybackHarness({
    requestAudio: async () => {
      requestCount += 1;
      return pendingAudio;
    },
  });

  const firstListen = harness.manager.listen(turn);
  const duplicateListen = harness.manager.listen(turn);

  assert.equal(harness.manager.getState(turn.id).status, "loading");
  assert.equal(turn.interpretedText, "Ndashaka moto.");
  assert.equal(requestCount, 1);

  resolveAudio(new Blob(["audio"], { type: "audio/wav" }));
  await Promise.all([firstListen, duplicateListen]);

  assert.equal(harness.audioInstances[0].playCount, 1);
});

test("/api/tts rejects malformed, empty, and oversized input", async () => {
  let providerCalls = 0;
  const handler = createTtsPostHandler({
    synthesize: async () => {
      providerCalls += 1;
    },
  });
  const malformed = await handler(
    new Request("http://localhost/api/tts", {
      method: "POST",
      body: "not json",
    }),
  );
  const empty = await handler(
    new Request("http://localhost/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "   " }),
    }),
  );
  const oversized = await handler(
    new Request("http://localhost/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "a".repeat(MAX_TTS_TEXT_LENGTH + 1) }),
    }),
  );

  assert.equal(malformed.status, 400);
  assert.equal(empty.status, 400);
  assert.equal(oversized.status, 400);
  assert.equal(providerCalls, 0);
});

test("/api/tts returns audio safely and isolates provider failure", async () => {
  const audioHandler = createTtsPostHandler({
    synthesize: async () => ({
      audio: new Uint8Array([4, 5, 6]).buffer,
      contentType: "audio/wav",
    }),
  });
  const failureHandler = createTtsPostHandler({
    synthesize: async () => {
      throw new Error("Space sleeping");
    },
  });
  const request = () =>
    new Request("http://localhost/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Muraho" }),
    });
  const audioResponse = await audioHandler(request());
  const failureResponse = await failureHandler(request());

  assert.equal(audioResponse.status, 200);
  assert.equal(audioResponse.headers.get("content-type"), "audio/wav");
  assert.equal((await audioResponse.arrayBuffer()).byteLength, 3);
  assert.equal(failureResponse.status, 502);
  assert.deepEqual(await failureResponse.json(), {
    error: TTS_FALLBACK_MESSAGE,
  });
});
