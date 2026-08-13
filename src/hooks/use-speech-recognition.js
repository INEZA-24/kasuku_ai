"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  createSpeechRecognitionSession,
  getSpeechRecognitionConstructor,
  getSpeechRecognitionLocale,
} from "../lib/speech-recognition.js";

function getAvailability(language) {
  const locale = getSpeechRecognitionLocale(language);

  if (!locale) {
    return {
      status: "unavailable",
      message: `Voice input is not configured for ${language}. You can keep typing.`,
    };
  }

  if (typeof window === "undefined" || !getSpeechRecognitionConstructor(window)) {
    return {
      status: "unavailable",
      message: "Voice input is not available in this browser. You can keep typing.",
    };
  }

  return { status: "idle", message: "" };
}

export function useSpeechRecognition({ language, onTranscript }) {
  const [speechState, setSpeechState] = useState({
    status: "idle",
    message: "",
  });
  const sessionRef = useRef(null);
  const transcriptCallbackRef = useRef(onTranscript);

  useEffect(() => {
    transcriptCallbackRef.current = onTranscript;
  }, [onTranscript]);

  const disposeSession = useCallback(() => {
    sessionRef.current?.dispose();
    sessionRef.current = null;
  }, []);

  useEffect(() => {
    disposeSession();
    setSpeechState(getAvailability(language));

    return disposeSession;
  }, [disposeSession, language]);

  const startListening = useCallback(() => {
    disposeSession();

    const locale = getSpeechRecognitionLocale(language);
    const RecognitionConstructor =
      typeof window === "undefined"
        ? null
        : getSpeechRecognitionConstructor(window);

    if (!locale) {
      setSpeechState({
        status: "unavailable",
        message: `Voice input is not configured for ${language}. You can keep typing.`,
      });
      return;
    }

    if (!RecognitionConstructor) {
      setSpeechState({
        status: "unavailable",
        message: "Voice input is not available in this browser. You can keep typing.",
      });
      return;
    }

    let session;

    try {
      session = createSpeechRecognitionSession({
        RecognitionConstructor,
        language,
        onStatusChange(status) {
          setSpeechState((current) => ({ ...current, status }));
        },
        onTranscript(transcript) {
          transcriptCallbackRef.current(transcript);
          setSpeechState({
            status: "processing",
            message: "Transcript added. Review or edit it before sending.",
          });
        },
        onError(message) {
          setSpeechState({ status: "error", message });
        },
      });

      sessionRef.current = session;
      setSpeechState({
        status: "listening",
        message: `Listening in ${language} (${locale})…`,
      });
      session.start();
    } catch (error) {
      session?.dispose();
      sessionRef.current = null;
      const isUnsupportedLocale =
        error?.name === "NotSupportedError" ||
        error?.name === "LanguageNotSupportedError";

      setSpeechState({
        status: "error",
        message: isUnsupportedLocale
          ? `${language} speech recognition (${locale}) was rejected by this browser. You can keep typing.`
          : "Speech recognition could not start. You can keep typing your message.",
      });
    }
  }, [disposeSession, language]);

  const cancelListening = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.cancel();
      sessionRef.current.dispose();
      sessionRef.current = null;
    }

    const availability = getAvailability(language);
    setSpeechState(
      availability.status === "idle"
        ? {
            status: "idle",
            message: "Listening cancelled. You can keep typing.",
          }
        : availability,
    );
  }, [language]);

  const clearSpeechMessage = useCallback(() => {
    setSpeechState(getAvailability(language));
  }, [language]);

  return {
    ...speechState,
    locale: getSpeechRecognitionLocale(language),
    startListening,
    cancelListening,
    clearSpeechMessage,
  };
}
