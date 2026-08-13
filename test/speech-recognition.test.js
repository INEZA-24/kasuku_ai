import assert from "node:assert/strict";
import test from "node:test";

import {
  createSpeechRecognitionSession,
  extractSpeechTranscript,
  getSpeechRecognitionConstructor,
  getSpeechRecognitionErrorMessage,
  getSpeechRecognitionLocale,
  mergeSpeechTranscript,
  SPEECH_RECOGNITION_LOCALES,
} from "../src/lib/speech-recognition.js";

class MockRecognition {
  static instances = [];

  constructor() {
    this.started = false;
    this.aborted = false;
    MockRecognition.instances.push(this);
  }

  start() {
    this.started = true;
    this.onstart?.();
  }

  abort() {
    this.aborted = true;
    this.onend?.();
  }

  emitResult(...transcripts) {
    this.onresult?.({
      resultIndex: 0,
      results: transcripts.map((transcript) => [{ transcript }]),
    });
  }

  emitError(error) {
    this.onerror?.({ error });
  }

  end() {
    this.onend?.();
  }
}

function createHarness(language) {
  const statuses = [];
  const transcripts = [];
  const errors = [];
  const session = createSpeechRecognitionSession({
    RecognitionConstructor: MockRecognition,
    language,
    onStatusChange: (status) => statuses.push(status),
    onTranscript: (transcript) => transcripts.push(transcript),
    onError: (message) => errors.push(message),
  });

  return {
    errors,
    recognition: MockRecognition.instances.at(-1),
    session,
    statuses,
    transcripts,
  };
}

test("speech locales are explicit and do not silently substitute languages", () => {
  assert.deepEqual(SPEECH_RECOGNITION_LOCALES, {
    English: "en-US",
    Kinyarwanda: "rw-RW",
  });
  assert.equal(getSpeechRecognitionLocale("English"), "en-US");
  assert.equal(getSpeechRecognitionLocale("Kinyarwanda"), "rw-RW");
  assert.equal(getSpeechRecognitionLocale("French"), null);
  assert.equal(getSpeechRecognitionLocale("Swahili"), null);
});

test("SpeechRecognition uses the webkit fallback only when needed", () => {
  class StandardRecognition {}
  class WebkitRecognition {}

  assert.equal(
    getSpeechRecognitionConstructor({
      SpeechRecognition: StandardRecognition,
      webkitSpeechRecognition: WebkitRecognition,
    }),
    StandardRecognition,
  );
  assert.equal(
    getSpeechRecognitionConstructor({
      webkitSpeechRecognition: WebkitRecognition,
    }),
    WebkitRecognition,
  );
  assert.equal(getSpeechRecognitionConstructor({}), null);
});

test("English speech reaches the editable draft without automatic submission", () => {
  const harness = createHarness("English");
  let draft = "";
  let submitCount = 0;

  harness.session.start();
  harness.recognition.emitResult(
    "I need to go to Nyabugogo but I need to stop at an ATM first.",
  );
  draft = mergeSpeechTranscript(draft, harness.transcripts[0]);
  harness.recognition.end();

  assert.equal(harness.recognition.lang, "en-US");
  assert.equal(harness.recognition.continuous, false);
  assert.equal(harness.recognition.interimResults, false);
  assert.equal(harness.recognition.maxAlternatives, 1);
  assert.deepEqual(harness.statuses, ["listening", "listening", "processing", "idle"]);
  assert.equal(
    draft,
    "I need to go to Nyabugogo but I need to stop at an ATM first.",
  );
  assert.equal(submitCount, 0);
});

test("Kinyarwanda recognition requests exactly rw-RW", () => {
  const harness = createHarness("Kinyarwanda");

  harness.session.start();
  harness.recognition.emitResult("Ndashaka kujya i Nyabugogo.");
  harness.recognition.end();

  assert.equal(harness.session.locale, "rw-RW");
  assert.equal(harness.recognition.lang, "rw-RW");
  assert.deepEqual(harness.transcripts, ["Ndashaka kujya i Nyabugogo."]);
});

test("permission denial reports a short error and leaves manual text usable", () => {
  const harness = createHarness("English");
  let draft = "Typed fallback still works.";

  harness.session.start();
  harness.recognition.emitError("not-allowed");
  draft = `${draft} I can continue typing.`;
  harness.recognition.end();

  assert.equal(harness.transcripts.length, 0);
  assert.match(harness.errors[0], /Microphone access was denied/);
  assert.equal(
    draft,
    "Typed fallback still works. I can continue typing.",
  );
  assert.notEqual(harness.statuses.at(-1), "idle");
});

test("cancel stops recognition and ignores a late transcript", () => {
  const harness = createHarness("English");

  harness.session.start();
  harness.session.cancel();
  harness.recognition.emitResult("This transcript arrived too late.");

  assert.equal(harness.recognition.aborted, true);
  assert.equal(harness.statuses.at(-1), "idle");
  assert.deepEqual(harness.transcripts, []);
});

test("switching speakers cancels English before starting rw-RW", () => {
  const english = createHarness("English");

  english.session.start();
  english.session.cancel();

  const kinyarwanda = createHarness("Kinyarwanda");
  kinyarwanda.session.start();

  assert.equal(english.recognition.aborted, true);
  assert.equal(kinyarwanda.recognition.lang, "rw-RW");
  assert.equal(kinyarwanda.recognition.started, true);
});

test("clearing a conversation can cancel and then reuse the microphone", () => {
  const beforeClear = createHarness("English");

  beforeClear.session.start();
  beforeClear.session.cancel();
  beforeClear.session.dispose();

  const afterClear = createHarness("English");
  afterClear.session.start();
  afterClear.recognition.emitResult("A new conversation starts here.");
  afterClear.recognition.end();

  assert.equal(beforeClear.recognition.aborted, true);
  assert.equal(afterClear.recognition.started, true);
  assert.deepEqual(afterClear.transcripts, ["A new conversation starts here."]);
});

test("recognition error messages cover unavailable and rejected language paths", () => {
  assert.match(
    getSpeechRecognitionErrorMessage("language-not-supported", "Kinyarwanda"),
    /Kinyarwanda speech recognition is not supported/,
  );
  assert.match(
    getSpeechRecognitionErrorMessage("network", "English"),
    /could not connect/,
  );
});

test("transcript extraction joins recognized result segments", () => {
  assert.equal(
    extractSpeechTranscript({
      resultIndex: 0,
      results: [
        [{ transcript: "I need a moto" }],
        [{ transcript: "to Nyabugogo" }],
      ],
    }),
    "I need a moto to Nyabugogo",
  );
  assert.equal(
    mergeSpeechTranscript("Existing words", "new speech"),
    "Existing words new speech",
  );
});
