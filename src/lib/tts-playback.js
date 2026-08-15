export const TTS_FALLBACK_MESSAGE =
  "Voice is temporarily unavailable. You can still use the translation above.";

export const DEFAULT_TTS_PLAYBACK_STATE = Object.freeze({
  status: "idle",
  message: "",
});

export function isKinyarwandaTtsEligible(turn) {
  return (
    turn?.targetLanguage === "Kinyarwanda" &&
    typeof turn?.interpretedText === "string" &&
    Boolean(turn.interpretedText.trim())
  );
}

export async function requestKinyarwandaAudio(text, { fetchImpl = fetch } = {}) {
  const response = await fetchImpl("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(TTS_FALLBACK_MESSAGE);
  }

  const audio = await response.blob();

  if (!audio.size) {
    throw new Error(TTS_FALLBACK_MESSAGE);
  }

  return audio;
}

export function createTtsPlaybackManager({
  requestAudio,
  createAudio,
  createObjectUrl,
  revokeObjectUrl,
  onStateChange = () => {},
}) {
  const audioByTurn = new Map();
  const stateByTurn = new Map();
  const requestByTurn = new Map();
  let activeAudio = null;
  let disposed = false;

  function setState(turnId, state) {
    if (disposed) {
      return;
    }

    const nextState = { ...DEFAULT_TTS_PLAYBACK_STATE, ...state };
    stateByTurn.set(turnId, nextState);
    onStateChange(turnId, nextState);
  }

  async function play(turnId, entry) {
    if (activeAudio && activeAudio !== entry.audio) {
      activeAudio.pause?.();
    }

    activeAudio = entry.audio;
    entry.audio.currentTime = 0;
    setState(turnId, { status: "playing", message: "" });

    try {
      await entry.audio.play();
    } catch {
      setState(turnId, {
        status: "ready",
        message: "Voice is ready. Tap Listen again to play it.",
      });
    }
  }

  return {
    getState(turnId) {
      return stateByTurn.get(turnId) ?? DEFAULT_TTS_PLAYBACK_STATE;
    },
    async listen(turn) {
      if (disposed || !isKinyarwandaTtsEligible(turn)) {
        return;
      }

      if (stateByTurn.get(turn.id)?.status === "loading") {
        return;
      }

      const cachedAudio = audioByTurn.get(turn.id);

      if (cachedAudio) {
        await play(turn.id, cachedAudio);
        return;
      }

      const requestToken = Symbol(turn.id);
      requestByTurn.set(turn.id, requestToken);
      setState(turn.id, { status: "loading", message: "" });

      try {
        const audioBlob = await requestAudio(turn.interpretedText);

        if (disposed || requestByTurn.get(turn.id) !== requestToken) {
          return;
        }

        const objectUrl = createObjectUrl(audioBlob);
        const audio = createAudio(objectUrl);
        const entry = { audio, objectUrl };

        audio.addEventListener?.("ended", () => {
          if (audioByTurn.get(turn.id) === entry) {
            activeAudio = activeAudio === audio ? null : activeAudio;
            setState(turn.id, { status: "ready", message: "" });
          }
        });
        audio.addEventListener?.("error", () => {
          if (audioByTurn.get(turn.id) === entry) {
            setState(turn.id, {
              status: "error",
              message: TTS_FALLBACK_MESSAGE,
            });
          }
        });

        requestByTurn.delete(turn.id);
        audioByTurn.set(turn.id, entry);
        await play(turn.id, entry);
      } catch {
        if (!disposed && requestByTurn.get(turn.id) === requestToken) {
          requestByTurn.delete(turn.id);
          setState(turn.id, {
            status: "error",
            message: TTS_FALLBACK_MESSAGE,
          });
        }
      }
    },
    clearAll() {
      requestByTurn.clear();

      for (const { audio, objectUrl } of audioByTurn.values()) {
        audio.pause?.();
        revokeObjectUrl(objectUrl);
      }

      audioByTurn.clear();
      stateByTurn.clear();
      activeAudio = null;
    },
    dispose() {
      this.clearAll();
      disposed = true;
    },
  };
}
