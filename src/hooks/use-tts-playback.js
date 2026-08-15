"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  createTtsPlaybackManager,
  DEFAULT_TTS_PLAYBACK_STATE,
  requestKinyarwandaAudio,
} from "../lib/tts-playback.js";

export function useTtsPlayback() {
  const [playbackStates, setPlaybackStates] = useState({});
  const managerRef = useRef(null);

  const getManager = useCallback(() => {
    if (!managerRef.current) {
      managerRef.current = createTtsPlaybackManager({
        requestAudio: requestKinyarwandaAudio,
        createAudio: (url) => new Audio(url),
        createObjectUrl: (blob) => URL.createObjectURL(blob),
        revokeObjectUrl: (url) => URL.revokeObjectURL(url),
        onStateChange(turnId, state) {
          setPlaybackStates((current) => ({
            ...current,
            [turnId]: state,
          }));
        },
      });
    }

    return managerRef.current;
  }, []);

  const listenToTurn = useCallback(
    async (turn) => {
      await getManager().listen(turn);
    },
    [getManager],
  );

  const clearAllAudio = useCallback(() => {
    managerRef.current?.clearAll();
    setPlaybackStates({});
  }, []);

  useEffect(
    () => () => {
      managerRef.current?.dispose();
      managerRef.current = null;
    },
    [],
  );

  return {
    clearAllAudio,
    getPlaybackState(turnId) {
      return playbackStates[turnId] ?? DEFAULT_TTS_PLAYBACK_STATE;
    },
    listenToTurn,
  };
}
