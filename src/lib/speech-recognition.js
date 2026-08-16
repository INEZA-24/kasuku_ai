export const SPEECH_RECOGNITION_LOCALES = Object.freeze({
  English: "en-US",
  Kinyarwanda: "rw-RW",
});

export const VISITOR_SPEECH_RECOGNITION_OPTIONS = Object.freeze([
  Object.freeze({
    id: "normal",
    title: "Start normally",
    helper: "Best for English speech.",
    recognitionLanguage: "English",
  }),
  Object.freeze({
    id: "kinyarwanda",
    title: "Better Kinyarwanda recognition",
    helper: "Better for Rwandan names and local vocabulary.",
    recognitionLanguage: "Kinyarwanda",
  }),
]);

export function getVisitorSpeechRecognitionLanguage(optionId) {
  return (
    VISITOR_SPEECH_RECOGNITION_OPTIONS.find(
      (option) => option.id === optionId,
    )?.recognitionLanguage ?? null
  );
}

export function shouldShowVisitorSpeechChoice(speakerSide) {
  return speakerSide === "visitor";
}

export function getSpeechRecognitionLocale(language) {
  return SPEECH_RECOGNITION_LOCALES[language] ?? null;
}

export function getSpeechRecognitionConstructor(browserWindow) {
  return (
    browserWindow?.SpeechRecognition ??
    browserWindow?.webkitSpeechRecognition ??
    null
  );
}

export function getSpeechRecognitionErrorMessage(errorCode, language) {
  switch (errorCode) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone access is blocked. You can still type your message.";
    case "audio-capture":
      return "No working microphone was found. You can still type your message.";
    case "no-speech":
      return "We didn't hear anything. Try again or type your message.";
    case "network":
      return "Voice recognition lost its connection. You can still type your message.";
    case "language-not-supported":
      return `${language} voice input isn't supported by this browser. You can still type.`;
    default:
      return "Voice input stopped unexpectedly. Try again or type your message.";
  }
}

export function extractSpeechTranscript(event) {
  const transcripts = [];
  const startIndex = Number.isInteger(event?.resultIndex)
    ? event.resultIndex
    : 0;

  for (let index = startIndex; index < (event?.results?.length ?? 0); index += 1) {
    const transcript = event.results[index]?.[0]?.transcript;

    if (typeof transcript === "string" && transcript.trim()) {
      transcripts.push(transcript.trim());
    }
  }

  return transcripts.join(" ").trim();
}

export function mergeSpeechTranscript(currentText, transcript) {
  const existing = currentText.trim();
  const recognized = transcript.trim();

  if (!existing) {
    return recognized;
  }

  if (!recognized) {
    return existing;
  }

  return `${existing} ${recognized}`;
}

function joinTranscriptSegments(segments) {
  return [...segments.entries()]
    .sort(([leftIndex], [rightIndex]) => leftIndex - rightIndex)
    .map(([, transcript]) => transcript)
    .join(" ")
    .trim();
}

export function createSpeechTranscriptAccumulator() {
  const finalSegments = new Map();
  const interimSegments = new Map();

  function getSnapshot() {
    const finalTranscript = joinTranscriptSegments(finalSegments);
    const interimTranscript = joinTranscriptSegments(interimSegments);

    return {
      finalTranscript,
      interimTranscript,
      combinedTranscript: [finalTranscript, interimTranscript]
        .filter(Boolean)
        .join(" ")
        .trim(),
    };
  }

  return {
    reset() {
      finalSegments.clear();
      interimSegments.clear();
    },
    update(event) {
      const resultCount = event?.results?.length ?? 0;
      const startIndex = Number.isInteger(event?.resultIndex)
        ? event.resultIndex
        : 0;

      for (const index of [...interimSegments.keys()]) {
        if (index >= resultCount) {
          interimSegments.delete(index);
        }
      }

      for (let index = startIndex; index < resultCount; index += 1) {
        const result = event.results[index];
        const rawTranscript = result?.[0]?.transcript;
        const transcript =
          typeof rawTranscript === "string" ? rawTranscript.trim() : "";

        if (result?.isFinal) {
          interimSegments.delete(index);

          if (transcript) {
            finalSegments.set(index, transcript);
          } else {
            finalSegments.delete(index);
          }

          continue;
        }

        if (finalSegments.has(index)) {
          interimSegments.delete(index);
          continue;
        }

        if (transcript) {
          interimSegments.set(index, transcript);
        } else {
          interimSegments.delete(index);
        }
      }

      return getSnapshot();
    },
    getSnapshot,
  };
}

export function createSpeechRecognitionSession({
  RecognitionConstructor,
  language,
  onStatusChange,
  onTranscript,
  onError,
}) {
  const locale = getSpeechRecognitionLocale(language);

  if (!RecognitionConstructor || !locale) {
    return null;
  }

  const recognition = new RecognitionConstructor();
  const transcriptAccumulator = createSpeechTranscriptAccumulator();
  let cancelled = false;
  let disposed = false;
  let failed = false;
  let ended = false;

  recognition.lang = locale;
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    if (!disposed) {
      onStatusChange("listening");
    }
  };

  recognition.onresult = (event) => {
    if (disposed || cancelled || ended) {
      return;
    }

    const transcriptState = transcriptAccumulator.update(event);

    if (transcriptState.combinedTranscript) {
      onTranscript(transcriptState.combinedTranscript, transcriptState);
    }
  };

  recognition.onerror = (event) => {
    if (disposed || cancelled || ended || event?.error === "aborted") {
      return;
    }

    failed = true;
    ended = true;
    onStatusChange("error");
    onError(getSpeechRecognitionErrorMessage(event?.error, language));
  };

  recognition.onend = () => {
    if (disposed || ended) {
      return;
    }

    ended = true;

    if (!cancelled && !failed) {
      onStatusChange("idle");
    }
  };

  return {
    locale,
    start() {
      transcriptAccumulator.reset();
      cancelled = false;
      failed = false;
      ended = false;
      recognition.start();
    },
    cancel() {
      if (disposed) {
        return;
      }

      cancelled = true;

      try {
        recognition.abort();
      } catch {
        // An already-ended recognition instance may reject abort().
      }

      onStatusChange("idle");
    },
    dispose() {
      if (disposed) {
        return;
      }

      disposed = true;
      cancelled = true;
      recognition.onstart = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;

      try {
        recognition.abort();
      } catch {
        // A recognition instance that never started may reject abort().
      }
    },
  };
}
