import assert from "node:assert/strict";
import test from "node:test";

import {
  createTranslatePostHandler,
  TRANSLATION_TIMEOUT_MS,
} from "../src/app/api/translate/route.js";
import {
  CONNECTION_ERROR_MESSAGE,
  createInterpretationManager,
  createInterpretationSnapshot,
  INTERPRETATION_ERROR_MESSAGE,
  InterpretationRequestError,
  requestInterpretation,
} from "../src/lib/interpretation-request.js";

function createHistory() {
  return [
    {
      speakerSide: "visitor",
      originalText: "I need a moto.",
      interpretedText: "Ndashaka moto.",
      sourceLanguage: "English",
      targetLanguage: "Kinyarwanda",
    },
  ];
}

function createSnapshot(overrides = {}) {
  return createInterpretationSnapshot({
    message: "How much will it cost?",
    sourceLanguage: "English",
    targetLanguage: "Kinyarwanda",
    context: "Transport",
    speakerSide: "visitor",
    history: createHistory(),
    ...overrides,
  });
}

function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

function validTranslateRequest() {
  return new Request("http://localhost/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "I need a moto.",
      sourceLanguage: "English",
      targetLanguage: "Kinyarwanda",
      context: "Transport",
      speakerSide: "visitor",
      history: [],
    }),
  });
}

test("offline translation uses a friendly connection error without raw details", async () => {
  const snapshot = createSnapshot();

  await assert.rejects(
    requestInterpretation(snapshot, {
      fetchImpl: async () => {
        throw new TypeError("getaddrinfo ENOTFOUND private-provider.example");
      },
    }),
    (error) => {
      assert.equal(error.kind, "connection");
      assert.equal(error.message, CONNECTION_ERROR_MESSAGE);
      assert.doesNotMatch(error.message, /ENOTFOUND|provider/i);
      return true;
    },
  );
});

test("translation failure preserves draft/history, clears loading, and retries the same snapshot", async () => {
  const history = createHistory();
  const historyBefore = structuredClone(history);
  const snapshot = createSnapshot({ history });
  const receivedSnapshots = [];
  const successfulTurns = [];
  let attempt = 0;
  const manager = createInterpretationManager({
    createTurnId: () => "turn-retry",
    request: async (ownedSnapshot) => {
      receivedSnapshots.push(ownedSnapshot);
      attempt += 1;

      if (attempt === 1) {
        throw new InterpretationRequestError("service", "raw EjoChat failure");
      }

      return "Bizatwara angahe?";
    },
    onSuccess: (turn) => successfulTurns.push(turn),
  });

  await manager.submit(snapshot);

  assert.equal(snapshot.message, "How much will it cost?");
  assert.deepEqual(history, historyBefore);
  assert.deepEqual(manager.getState(), {
    status: "error",
    error: INTERPRETATION_ERROR_MESSAGE,
    canRetry: true,
  });
  assert.equal(successfulTurns.length, 0);

  await manager.retry();

  assert.equal(receivedSnapshots.length, 2);
  assert.deepEqual(receivedSnapshots[1], receivedSnapshots[0]);
  assert.equal(successfulTurns.length, 1);
  assert.equal(successfulTurns[0].speakerSide, "visitor");
  assert.equal(manager.getState().status, "idle");
});

test("translation timeout reaches a controlled retryable state", async () => {
  const manager = createInterpretationManager({
    timeoutMs: 5,
    request: async () => new Promise(() => {}),
  });

  await manager.submit(createSnapshot());

  assert.deepEqual(manager.getState(), {
    status: "error",
    error: INTERPRETATION_ERROR_MESSAGE,
    canRetry: true,
  });
});

test("duplicate Interpret attempts share one request and create one turn", async () => {
  const deferred = createDeferred();
  const successfulTurns = [];
  let requestCount = 0;
  const manager = createInterpretationManager({
    createTurnId: () => "turn-once",
    request: async () => {
      requestCount += 1;
      return deferred.promise;
    },
    onSuccess: (turn) => successfulTurns.push(turn),
  });

  const first = manager.submit(createSnapshot());
  const duplicate = manager.submit(createSnapshot());
  await Promise.resolve();

  assert.equal(requestCount, 1);
  assert.equal(manager.getState().status, "loading");

  deferred.resolve("Bizatwara angahe?");
  await Promise.all([first, duplicate]);

  assert.equal(requestCount, 1);
  assert.equal(successfulTurns.length, 1);
});

test("participant switching cannot change an in-flight request's direction", async () => {
  const deferred = createDeferred();
  const successfulTurns = [];
  let currentParticipant = "visitor";
  const manager = createInterpretationManager({
    createTurnId: () => "turn-owned",
    request: async () => deferred.promise,
    onSuccess: (turn) => successfulTurns.push(turn),
  });

  const pending = manager.submit(createSnapshot());
  currentParticipant = "rwandan";
  deferred.resolve("Bizatwara angahe?");
  await pending;

  assert.equal(currentParticipant, "rwandan");
  assert.deepEqual(successfulTurns[0], {
    id: "turn-owned",
    speakerSide: "visitor",
    originalText: "How much will it cost?",
    interpretedText: "Bizatwara angahe?",
    sourceLanguage: "English",
    targetLanguage: "Kinyarwanda",
  });
});

test("clearing during translation prevents a late response from adding history", async () => {
  const deferred = createDeferred();
  const successfulTurns = [];
  const manager = createInterpretationManager({
    request: async () => deferred.promise,
    onSuccess: (turn) => successfulTurns.push(turn),
  });

  const pending = manager.submit(createSnapshot());
  manager.clear();
  deferred.resolve("Stale interpretation");
  await pending;

  assert.equal(successfulTurns.length, 0);
  assert.equal(manager.getState().status, "idle");
  assert.equal(manager.getFailedSnapshot(), null);
});

test("the server translation timeout is bounded and hides provider details", async () => {
  let observedTimeout;
  const timeoutSignal = { aborted: true };
  const handler = createTranslatePostHandler({
    getApiKey: () => "test-key",
    timeoutMs: 1234,
    createTimeoutSignal(timeoutMs) {
      observedTimeout = timeoutMs;
      return timeoutSignal;
    },
    fetchImpl: async () => {
      const error = new Error("private upstream timeout trace");
      error.name = "TimeoutError";
      throw error;
    },
  });

  const response = await handler(validTranslateRequest());
  const body = await response.json();

  assert.equal(TRANSLATION_TIMEOUT_MS, 30000);
  assert.equal(observedTimeout, 1234);
  assert.equal(response.status, 504);
  assert.match(body.error, /took too long/i);
  assert.doesNotMatch(body.error, /upstream|trace|EjoChat/i);
});

test("malformed and rate-limited provider responses remain controlled", async () => {
  const malformedHandler = createTranslatePostHandler({
    getApiKey: () => "test-key",
    fetchImpl: async () => new Response("not json", { status: 200 }),
  });
  const limitedHandler = createTranslatePostHandler({
    getApiKey: () => "test-key",
    fetchImpl: async () => new Response("private quota detail", { status: 429 }),
  });

  const malformedResponse = await malformedHandler(validTranslateRequest());
  const limitedResponse = await limitedHandler(validTranslateRequest());

  assert.equal(malformedResponse.status, 502);
  assert.equal(limitedResponse.status, 429);
  assert.doesNotMatch(
    JSON.stringify(await limitedResponse.json()),
    /private quota detail/i,
  );
});
