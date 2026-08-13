export const SPEECH_RECOGNITION_LOCALES = Object.freeze({
  English: "en-US",
  Kinyarwanda: "rw-RW",
});

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
      return "Microphone access was denied. You can keep typing your message.";
    case "audio-capture":
      return "No working microphone was found. You can keep typing your message.";
    case "no-speech":
      return "No speech was heard. Try again or type your message.";
    case "network":
      return "Speech recognition could not connect. You can keep typing your message.";
    case "language-not-supported":
      return `${language} speech recognition is not supported by this browser. You can keep typing.`;
    default:
      return "Speech recognition stopped unexpectedly. You can keep typing your message.";
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
  let cancelled = false;
  let disposed = false;
  let failed = false;

  recognition.lang = locale;
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    if (!disposed) {
      onStatusChange("listening");
    }
  };

  recognition.onresult = (event) => {
    if (disposed || cancelled) {
      return;
    }

    onStatusChange("processing");
    const transcript = extractSpeechTranscript(event);

    if (transcript) {
      onTranscript(transcript);
      return;
    }

    failed = true;
    onError("No speech was recognized. Try again or type your message.");
  };

  recognition.onerror = (event) => {
    if (disposed || cancelled || event?.error === "aborted") {
      return;
    }

    failed = true;
    onError(getSpeechRecognitionErrorMessage(event?.error, language));
  };

  recognition.onend = () => {
    if (!disposed && !failed) {
      onStatusChange("idle");
    }
  };

  return {
    locale,
    start() {
      cancelled = false;
      failed = false;
      onStatusChange("listening");
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
