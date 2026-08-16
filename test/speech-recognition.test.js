import assert from "node:assert/strict";
import test from "node:test";

import { getLanguageDirection } from "../src/lib/conversation.js";
import {
  createSpeechRecognitionSession,
  extractSpeechTranscript,
  getSpeechRecognitionConstructor,
  getSpeechRecognitionErrorMessage,
  getSpeechRecognitionLocale,
  getVisitorSpeechRecognitionLanguage,
  mergeSpeechTranscript,
  shouldShowVisitorSpeechChoice,
  SPEECH_RECOGNITION_LOCALES,
  VISITOR_SPEECH_RECOGNITION_OPTIONS,
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

  emitResults(results, resultIndex = 0) {
    this.onresult?.({
      resultIndex,
      results: results.map(({ transcript, isFinal = true }) => {
        const recognitionResult = [{ transcript }];
        recognitionResult.isFinal = isFinal;
        return recognitionResult;
      }),
    });
  }

  emitResult(...transcripts) {
    this.emitResults(transcripts.map((transcript) => ({ transcript })));
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
  const transcriptStates = [];
  const errors = [];
  const session = createSpeechRecognitionSession({
    RecognitionConstructor: MockRecognition,
    language,
    onStatusChange: (status) => statuses.push(status),
    onTranscript: (transcript, transcriptState) => {
      transcripts.push(transcript);
      transcriptStates.push(transcriptState);
    },
    onError: (message) => errors.push(message),
  });

  return {
    errors,
    recognition: MockRecognition.instances.at(-1),
    session,
    statuses,
    transcripts,
    transcriptStates,
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

test("Visitor normal mode selects en-US recognition", () => {
  assert.deepEqual(
    VISITOR_SPEECH_RECOGNITION_OPTIONS.map(({ id, title, helper }) => ({
      id,
      title,
      helper,
    })),
    [
      {
        id: "normal",
        title: "Start normally",
        helper: "Best for English speech.",
      },
      {
        id: "kinyarwanda",
        title: "Better Kinyarwanda recognition",
        helper: "Better for Rwandan names and local vocabulary.",
      },
    ],
  );

  const recognitionLanguage = getVisitorSpeechRecognitionLanguage("normal");
  const harness = createHarness(recognitionLanguage);

  harness.session.start();

  assert.equal(shouldShowVisitorSpeechChoice("visitor"), true);
  assert.equal(recognitionLanguage, "English");
  assert.equal(harness.recognition.lang, "en-US");
});

test("Visitor Kinyarwanda mode changes recognition locale without changing direction", () => {
  const directionBefore = getLanguageDirection(
    "visitor",
    "English",
    "Kinyarwanda",
  );
  const recognitionLanguage =
    getVisitorSpeechRecognitionLanguage("kinyarwanda");
  const harness = createHarness(recognitionLanguage);

  harness.session.start();
  const directionAfter = getLanguageDirection(
    "visitor",
    "English",
    "Kinyarwanda",
  );

  assert.equal(recognitionLanguage, "Kinyarwanda");
  assert.equal(harness.recognition.lang, "rw-RW");
  assert.deepEqual(directionAfter, directionBefore);
  assert.deepEqual(directionAfter, {
    sourceLanguage: "English",
    targetLanguage: "Kinyarwanda",
  });
});

test("Visitor cancel choice has no recognition language and starts no session", () => {
  const instanceCount = MockRecognition.instances.length;

  assert.equal(getVisitorSpeechRecognitionLanguage("cancel"), null);
  assert.equal(MockRecognition.instances.length, instanceCount);
});

test("Rwandan microphone bypasses the choice and remains rw-RW", () => {
  const harness = createHarness("Kinyarwanda");

  harness.session.start();

  assert.equal(shouldShowVisitorSpeechChoice("rwandan"), false);
  assert.equal(harness.recognition.lang, "rw-RW");
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
  assert.equal(harness.recognition.continuous, true);
  assert.equal(harness.recognition.interimResults, true);
  assert.equal(harness.recognition.maxAlternatives, 1);
  assert.deepEqual(harness.statuses, ["listening", "idle"]);
  assert.equal(
    draft,
    "I need to go to Nyabugogo but I need to stop at an ATM first.",
  );
  assert.equal(submitCount, 0);
});

test("multiple final results are accumulated in order without duplication", () => {
  const harness = createHarness("English");

  harness.session.start();
  harness.recognition.emitResults([
    { transcript: "I need a moto", isFinal: true },
  ]);
  harness.recognition.emitResults(
    [
      { transcript: "I need a moto", isFinal: true },
      { transcript: "to Nyabugogo", isFinal: true },
    ],
    1,
  );
  harness.recognition.emitResults([
    { transcript: "I need a moto", isFinal: true },
    { transcript: "to Nyabugogo", isFinal: true },
  ]);

  assert.deepEqual(harness.transcripts, [
    "I need a moto",
    "I need a moto to Nyabugogo",
    "I need a moto to Nyabugogo",
  ]);
  assert.equal(
    harness.transcriptStates.at(-1).finalTranscript,
    "I need a moto to Nyabugogo",
  );
  assert.equal(harness.transcriptStates.at(-1).interimTranscript, "");
});

test("updated interim text is promoted to final without duplicated words", () => {
  const harness = createHarness("English");

  harness.session.start();
  harness.recognition.emitResults([
    { transcript: "I need", isFinal: false },
  ]);
  harness.recognition.emitResults([
    { transcript: "I need a moto", isFinal: false },
  ]);
  harness.recognition.emitResults([
    { transcript: "I need a moto", isFinal: true },
  ]);

  assert.deepEqual(harness.transcripts, [
    "I need",
    "I need a moto",
    "I need a moto",
  ]);
  assert.deepEqual(harness.transcriptStates.at(-1), {
    finalTranscript: "I need a moto",
    interimTranscript: "",
    combinedTranscript: "I need a moto",
  });
});

test("three final chunks remain available after natural pauses", () => {
  const harness = createHarness("English");

  harness.session.start();
  harness.recognition.emitResults([
    { transcript: "I need a moto", isFinal: true },
  ]);
  harness.recognition.emitResults(
    [
      { transcript: "I need a moto", isFinal: true },
      { transcript: "to Nyabugogo", isFinal: true },
    ],
    1,
  );
  harness.recognition.emitResults(
    [
      { transcript: "I need a moto", isFinal: true },
      { transcript: "to Nyabugogo", isFinal: true },
      { transcript: "but I need to stop at an ATM first", isFinal: true },
    ],
    2,
  );

  assert.equal(
    harness.transcripts.at(-1),
    "I need a moto to Nyabugogo but I need to stop at an ATM first",
  );
  assert.equal(harness.recognition.aborted, false);
});

test("a completed recording cannot block the next recording transcript", () => {
  const first = createHarness("English");
  let draft = "";

  first.session.start();
  first.recognition.emitResult("First recording.");
  first.recognition.end();
  draft = mergeSpeechTranscript(draft, first.transcripts.at(-1));

  const second = createHarness("English");
  second.session.start();
  second.recognition.emitResult("Second recording.");
  second.recognition.end();
  draft = mergeSpeechTranscript(draft, second.transcripts.at(-1));

  assert.deepEqual(first.transcripts, ["First recording."]);
  assert.deepEqual(second.transcripts, ["Second recording."]);
  assert.equal(draft, "First recording. Second recording.");
  assert.equal(second.statuses.at(-1), "idle");
});

test("interim-only speech remains available if recognition ends normally", () => {
  const harness = createHarness("English");

  harness.session.start();
  harness.recognition.emitResults([
    { transcript: "Latest usable words", isFinal: false },
  ]);
  harness.recognition.end();

  assert.equal(harness.transcripts.at(-1), "Latest usable words");
  assert.equal(harness.statuses.at(-1), "idle");
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
  assert.match(harness.errors[0], /Microphone access is blocked/);
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

  const nextRecording = createHarness("English");
  nextRecording.session.start();
  nextRecording.recognition.emitResult("The next recording works.");
  nextRecording.recognition.end();

  assert.deepEqual(nextRecording.transcripts, ["The next recording works."]);
});

test("switching speakers cancels English before starting rw-RW", () => {
  const english = createHarness("English");

  english.session.start();
  english.session.cancel();

  const kinyarwanda = createHarness("Kinyarwanda");
  kinyarwanda.session.start();
  kinyarwanda.recognition.emitResult("Ndashaka kujya i Kigali.");
  kinyarwanda.recognition.end();

  assert.equal(english.recognition.aborted, true);
  assert.equal(kinyarwanda.recognition.lang, "rw-RW");
  assert.equal(kinyarwanda.recognition.started, true);
  assert.deepEqual(kinyarwanda.transcripts, ["Ndashaka kujya i Kigali."]);
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
    /Kinyarwanda voice input isn't supported/,
  );
  assert.match(
    getSpeechRecognitionErrorMessage("network", "English"),
    /lost its connection/,
  );
  assert.match(
    getSpeechRecognitionErrorMessage("no-speech", "English"),
    /didn't hear anything/,
  );
  assert.match(
    getSpeechRecognitionErrorMessage("audio-capture", "English"),
    /still type/,
  );
});

test("a genuine speech error leaves no listening state and the next session works", () => {
  const failed = createHarness("English");

  failed.session.start();
  failed.recognition.emitError("network");
  failed.recognition.end();

  assert.equal(failed.statuses.at(-1), "error");
  assert.match(failed.errors.at(-1), /still type/);

  const recovered = createHarness("English");
  recovered.session.start();
  recovered.recognition.emitResult("The microphone works again.");
  recovered.recognition.end();

  assert.equal(recovered.statuses.at(-1), "idle");
  assert.deepEqual(recovered.transcripts, ["The microphone works again."]);
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
