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
      locale: null,
    };
  }

  if (typeof window === "undefined" || !getSpeechRecognitionConstructor(window)) {
    return {
      status: "unavailable",
      message: "Voice input is not available in this browser. You can keep typing.",
      locale,
    };
  }

  return { status: "idle", message: "", locale };
}

export function useSpeechRecognition({ language, onTranscript }) {
  const [speechState, setSpeechState] = useState({
    status: "idle",
    message: "",
    locale: getSpeechRecognitionLocale(language),
  });
  const sessionRef = useRef(null);
  const sessionIdRef = useRef(0);
  const transcriptCallbackRef = useRef(onTranscript);

  useEffect(() => {
    transcriptCallbackRef.current = onTranscript;
  }, [onTranscript]);

  const disposeSession = useCallback(() => {
    sessionIdRef.current += 1;
    sessionRef.current?.dispose();
    sessionRef.current = null;
  }, []);

  useEffect(() => {
    disposeSession();
    setSpeechState(getAvailability(language));

    return disposeSession;
  }, [disposeSession, language]);

  const startListening = useCallback((recognitionLanguage = language) => {
    disposeSession();
    const sessionId = sessionIdRef.current;

    const locale = getSpeechRecognitionLocale(recognitionLanguage);
    const RecognitionConstructor =
      typeof window === "undefined"
        ? null
        : getSpeechRecognitionConstructor(window);

    if (!locale) {
      setSpeechState({
        status: "unavailable",
        message: `Voice input is not configured for ${recognitionLanguage}. You can keep typing.`,
        locale: null,
      });
      return;
    }

    if (!RecognitionConstructor) {
      setSpeechState({
        status: "unavailable",
        message: "Voice input is not available in this browser. You can keep typing.",
        locale,
      });
      return;
    }

    let session;
    let hasTranscript = false;

    try {
      session = createSpeechRecognitionSession({
        RecognitionConstructor,
        language: recognitionLanguage,
        onStatusChange(status) {
          if (sessionId !== sessionIdRef.current) {
            return;
          }

          if (status === "idle") {
            sessionRef.current = null;
          }

          setSpeechState((current) => ({
            ...current,
            status,
            message:
              status === "idle"
                ? hasTranscript
                  ? "Transcript added. Review or edit it before sending."
                  : "Listening ended. Try again or keep typing."
                : current.message,
          }));
        },
        onTranscript(transcript, transcriptState) {
          if (sessionId !== sessionIdRef.current) {
            return;
          }

          hasTranscript = true;
          transcriptCallbackRef.current(transcript, transcriptState);
          setSpeechState({
            status: "listening",
            message: `Listening in ${recognitionLanguage} (${locale})… Transcript updates as you speak.`,
            locale,
          });
        },
        onError(message) {
          if (sessionId !== sessionIdRef.current) {
            return;
          }

          setSpeechState({ status: "error", message, locale });
        },
      });

      sessionRef.current = session;
      setSpeechState({
        status: "listening",
        message: `Listening in ${recognitionLanguage} (${locale})…`,
        locale,
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
          ? `${recognitionLanguage} speech recognition (${locale}) was rejected by this browser. You can keep typing.`
          : "Speech recognition could not start. You can keep typing your message.",
        locale,
      });
    }
  }, [disposeSession, language]);

  const cancelListening = useCallback(() => {
    const session = sessionRef.current;

    if (session) {
      sessionIdRef.current += 1;
      sessionRef.current = null;
      session.cancel();
      session.dispose();
    }

    const availability = getAvailability(language);
    setSpeechState(
      availability.status === "idle"
        ? {
            status: "idle",
            message: "Listening cancelled. You can keep typing.",
            locale: availability.locale,
          }
        : availability,
    );
  }, [language]);

  const clearSpeechMessage = useCallback(() => {
    setSpeechState(getAvailability(language));
  }, [language]);

  return {
    ...speechState,
    locale: speechState.locale,
    startListening,
    cancelListening,
    clearSpeechMessage,
  };
}
