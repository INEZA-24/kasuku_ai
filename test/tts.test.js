import assert from "node:assert/strict";
import test from "node:test";

import {
  createTtsPostHandler,
  MAX_TTS_TEXT_LENGTH,
} from "../src/app/api/tts/handler.js";
import {
  synthesizeKinyarwanda,
  TTS_PROVIDER_TIMEOUT_MS,
  TTS_DEFAULTS,
  TTS_SPACE_ID,
  TTS_SYNTHESIS_ENDPOINT,
} from "../src/app/api/tts/provider.js";
import {
  createTtsPlaybackManager,
  isKinyarwandaTtsEligible,
  TTS_CLIENT_TIMEOUT_MS,
  TTS_FALLBACK_MESSAGE,
  TTS_PLAYBACK_ERROR_MESSAGE,
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
  constructor(url, { failedPlayAttempts = 0 } = {}) {
    this.url = url;
    this.currentTime = 0;
    this.playCount = 0;
    this.pauseCount = 0;
    this.failedPlayAttempts = failedPlayAttempts;
    this.listeners = new Map();
  }

  addEventListener(event, callback) {
    this.listeners.set(event, callback);
  }

  async play() {
    this.playCount += 1;

    if (this.playCount <= this.failedPlayAttempts) {
      throw new Error("Browser playback was blocked");
    }
  }

  pause() {
    this.pauseCount += 1;
  }

  emit(event) {
    this.listeners.get(event)?.();
  }
}

function createPlaybackHarness({
  requestAudio,
  requestTimeoutMs,
  audioOptions,
} = {}) {
  const audioInstances = [];
  const revokedUrls = [];
  const states = new Map();
  let objectUrlCount = 0;
  const manager = createTtsPlaybackManager({
    requestAudio:
      requestAudio ?? (async () => new Blob(["audio"], { type: "audio/wav" })),
    createAudio(url) {
      const audio = new MockAudio(url, audioOptions);
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
    requestTimeoutMs,
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
      speed: 0.9,
    },
  });
  assert.deepEqual(TTS_DEFAULTS, { speakerName: "Male", speed: 0.9 });
  assert.match(fetchedUrl, /audio\.wav$/);
  assert.equal(result.audio.byteLength, 3);
  assert.equal(result.contentType, "audio/wav");
});

test("the TTS provider has one bounded overall timeout", async () => {
  assert.equal(TTS_PROVIDER_TIMEOUT_MS, 90000);

  await assert.rejects(
    synthesizeKinyarwanda("Muraho", {
      connect: async () => new Promise(() => {}),
      providerTimeoutMs: 5,
    }),
    /timed out/i,
  );
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
    status: "failed",
    message: TTS_PLAYBACK_ERROR_MESSAGE,
    hasPlayed: false,
  });
});

test("TTS failure cannot alter translation history or the interpretation result", async () => {
  const turn = createTurn();
  const history = [turn];
  const historyBeforeTts = structuredClone(history);
  const harness = createPlaybackHarness({
    requestAudio: async () => {
      throw new Error("TTS unavailable");
    },
  });

  await harness.manager.listen(turn);

  assert.deepEqual(history, historyBeforeTts);
  assert.equal(history[0].interpretedText, "Ndashaka moto.");
  assert.equal(harness.manager.getState(turn.id).status, "failed");
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
  assert.equal(harness.audioInstances[0].pauseCount, 1);
});

test("preparing TTS does not alter translation and ignores duplicate requests", async () => {
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

  await Promise.resolve();
  await Promise.resolve();

  assert.equal(harness.manager.getState(turn.id).status, "preparing");
  assert.equal(turn.interpretedText, "Ndashaka moto.");
  assert.equal(requestCount, 1);

  resolveAudio(new Blob(["audio"], { type: "audio/wav" }));
  await Promise.all([firstListen, duplicateListen]);

  assert.equal(harness.audioInstances[0].playCount, 1);
});

test("background preparation makes one request and never plays automatically", async () => {
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

  const firstPreparation = harness.manager.prepare(turn);
  const duplicatePreparation = harness.manager.prepare(turn);
  await Promise.resolve();

  assert.equal(harness.manager.getState(turn.id).status, "preparing");
  assert.equal(turn.interpretedText, "Ndashaka moto.");
  assert.equal(requestCount, 1);
  assert.equal(harness.audioInstances.length, 0);

  resolveAudio(new Blob(["audio"], { type: "audio/wav" }));
  await Promise.all([firstPreparation, duplicatePreparation]);

  assert.equal(harness.manager.getState(turn.id).status, "ready");
  assert.equal(harness.manager.getState(turn.id).hasPlayed, false);
  assert.equal(harness.audioInstances[0].playCount, 0);

  await harness.manager.listen(turn);

  assert.equal(requestCount, 1);
  assert.equal(harness.audioInstances[0].playCount, 1);
});

test("each message keeps an independent prepared audio cache", async () => {
  let requestCount = 0;
  const firstTurn = createTurn({ id: "turn-a", interpretedText: "Muraho." });
  const secondTurn = createTurn({ id: "turn-b", interpretedText: "Murakoze." });
  const harness = createPlaybackHarness({
    requestAudio: async () => {
      requestCount += 1;
      return new Blob([`audio-${requestCount}`], { type: "audio/wav" });
    },
  });

  await Promise.all([
    harness.manager.prepare(firstTurn),
    harness.manager.prepare(secondTurn),
  ]);

  assert.equal(requestCount, 2);
  assert.equal(harness.audioInstances.length, 2);
  assert.equal(harness.manager.getState(firstTurn.id).status, "ready");
  assert.equal(harness.manager.getState(secondTurn.id).status, "ready");

  await harness.manager.listen(firstTurn);
  harness.audioInstances[0].emit("ended");
  await harness.manager.listen(secondTurn);
  harness.audioInstances[1].emit("ended");
  await harness.manager.listen(firstTurn);

  assert.equal(requestCount, 2);
  assert.equal(harness.audioInstances[0].playCount, 2);
  assert.equal(harness.audioInstances[1].playCount, 1);
});

test("English targets never prepare Kinyarwanda audio", async () => {
  let requestCount = 0;
  const turn = createTurn({
    sourceLanguage: "Kinyarwanda",
    targetLanguage: "English",
    interpretedText: "I need a moto.",
  });
  const harness = createPlaybackHarness({
    requestAudio: async () => {
      requestCount += 1;
      return new Blob(["audio"], { type: "audio/wav" });
    },
  });

  await harness.manager.prepare(turn);

  assert.equal(requestCount, 0);
  assert.equal(harness.manager.getState(turn.id).status, "idle");
});

test("failed background audio retries only after an explicit listen", async () => {
  let requestCount = 0;
  const turn = createTurn();
  const harness = createPlaybackHarness({
    requestAudio: async () => {
      requestCount += 1;

      if (requestCount === 1) {
        throw new Error("Space sleeping");
      }

      return new Blob(["audio"], { type: "audio/wav" });
    },
  });

  await harness.manager.prepare(turn);
  await harness.manager.prepare(turn);

  assert.equal(requestCount, 1);
  assert.equal(harness.manager.getState(turn.id).status, "failed");
  assert.equal(turn.interpretedText, "Ndashaka moto.");

  await harness.manager.listen(turn);

  assert.equal(requestCount, 2);
  assert.equal(harness.manager.getState(turn.id).status, "playing");
  assert.equal(harness.audioInstances[0].playCount, 1);
});

test("a browser-side TTS timeout leaves no permanent preparing state", async () => {
  assert.equal(TTS_CLIENT_TIMEOUT_MS, 100000);
  const harness = createPlaybackHarness({
    requestTimeoutMs: 5,
    requestAudio: async () => new Promise(() => {}),
  });

  await harness.manager.prepare(createTurn());

  assert.equal(harness.manager.getState("turn-1").status, "failed");
  assert.equal(
    harness.manager.getState("turn-1").message,
    TTS_PLAYBACK_ERROR_MESSAGE,
  );
});

test("clearing while TTS is pending ignores the stale result", async () => {
  let resolveAudio;
  const pendingAudio = new Promise((resolve) => {
    resolveAudio = resolve;
  });
  const harness = createPlaybackHarness({
    requestAudio: async () => pendingAudio,
  });
  const preparation = harness.manager.prepare(createTurn());
  await Promise.resolve();

  assert.equal(harness.manager.getState("turn-1").status, "preparing");
  harness.manager.clearAll();
  resolveAudio(new Blob(["stale audio"], { type: "audio/wav" }));
  await preparation;

  assert.equal(harness.manager.getState("turn-1").status, "idle");
  assert.equal(harness.audioInstances.length, 0);
  assert.deepEqual(harness.revokedUrls, []);
});

test("playback failure keeps cached audio recoverable without regeneration", async () => {
  let requestCount = 0;
  const harness = createPlaybackHarness({
    audioOptions: { failedPlayAttempts: 1 },
    requestAudio: async () => {
      requestCount += 1;
      return new Blob(["audio"], { type: "audio/wav" });
    },
  });
  const turn = createTurn();

  await harness.manager.listen(turn);

  assert.equal(harness.manager.getState(turn.id).status, "ready");
  assert.match(harness.manager.getState(turn.id).message, /Tap Listen again/);
  assert.equal(requestCount, 1);

  await harness.manager.listen(turn);

  assert.equal(harness.manager.getState(turn.id).status, "playing");
  assert.equal(requestCount, 1);
  assert.equal(harness.audioInstances[0].playCount, 2);
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
