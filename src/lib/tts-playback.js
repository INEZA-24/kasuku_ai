export const TTS_FALLBACK_MESSAGE =
  "Voice is temporarily unavailable. You can still use the translation.";

export const DEFAULT_TTS_PLAYBACK_STATE = Object.freeze({
  status: "idle",
  message: "",
  hasPlayed: false,
});

export const TTS_PLAYBACK_ERROR_MESSAGE = "Voice unavailable.";
export const TTS_CLIENT_TIMEOUT_MS = 100000;
export const TTS_PLAYBACK_RATE = 0.9;

export function isKinyarwandaTtsEligible(turn) {
  return (
    turn?.targetLanguage === "Kinyarwanda" &&
    typeof turn?.interpretedText === "string" &&
    Boolean(turn.interpretedText.trim())
  );
}

export async function requestKinyarwandaAudio(
  text,
  { fetchImpl = fetch, signal } = {},
) {
  const response = await fetchImpl("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    signal,
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
  requestTimeoutMs = TTS_CLIENT_TIMEOUT_MS,
  onStateChange = () => {},
}) {
  const audioByTurn = new Map();
  const listenByTurn = new Map();
  const stateByTurn = new Map();
  const requestByTurn = new Map();
  let activePlayback = null;
  let disposed = false;

  function setState(turnId, state) {
    if (disposed) {
      return;
    }

    const nextState = {
      ...DEFAULT_TTS_PLAYBACK_STATE,
      ...stateByTurn.get(turnId),
      ...state,
    };
    stateByTurn.set(turnId, nextState);
    onStateChange(turnId, nextState);
  }

  async function play(turnId, entry) {
    if (activePlayback && activePlayback.audio !== entry.audio) {
      activePlayback.audio.pause?.();

      if (audioByTurn.has(activePlayback.turnId)) {
        setState(activePlayback.turnId, { status: "ready", message: "" });
      }
    }

    activePlayback = { turnId, audio: entry.audio };
    entry.audio.currentTime = 0;
    entry.audio.playbackRate = TTS_PLAYBACK_RATE;
    setState(turnId, { status: "playing", message: "", hasPlayed: true });

    try {
      await entry.audio.play();
    } catch {
      activePlayback = null;
      setState(turnId, {
        status: "ready",
        message: "Voice is ready. Tap Listen again to play it.",
        hasPlayed: false,
      });
    }
  }

  function prepare(turn, { retry = false } = {}) {
    if (disposed || !isKinyarwandaTtsEligible(turn)) {
      return Promise.resolve(null);
    }

    const cachedAudio = audioByTurn.get(turn.id);

    if (cachedAudio) {
      return Promise.resolve(cachedAudio);
    }

    const activeRequest = requestByTurn.get(turn.id);

    if (activeRequest) {
      return activeRequest.promise;
    }

    if (stateByTurn.get(turn.id)?.status === "failed" && !retry) {
      return Promise.resolve(null);
    }

    const requestToken = Symbol(turn.id);
    const controller = new AbortController();
    setState(turn.id, {
      status: "preparing",
      message: "",
      hasPlayed: false,
    });

    const abortPromise = new Promise((_, reject) => {
      controller.signal.addEventListener(
        "abort",
        () => reject(new Error("The voice request stopped.")),
        { once: true },
      );
    });
    const timeoutId = setTimeout(
      () => controller.abort("timeout"),
      requestTimeoutMs,
    );
    const requestPromise = Promise.resolve().then(async () => {
      let pendingObjectUrl = null;

      try {
        const audioBlob = await Promise.race([
          requestAudio(turn.interpretedText, { signal: controller.signal }),
          abortPromise,
        ]);

        if (
          disposed ||
          requestByTurn.get(turn.id)?.token !== requestToken
        ) {
          return null;
        }

        const objectUrl = createObjectUrl(audioBlob);
        pendingObjectUrl = objectUrl;
        const audio = createAudio(objectUrl);
        const entry = { audio, objectUrl };

        audio.addEventListener?.("ended", () => {
          if (audioByTurn.get(turn.id) === entry) {
            activePlayback =
              activePlayback?.audio === audio ? null : activePlayback;
            setState(turn.id, {
              status: "ready",
              message: "",
              hasPlayed: true,
            });
          }
        });
        audio.addEventListener?.("error", () => {
          if (audioByTurn.get(turn.id) === entry) {
            audioByTurn.delete(turn.id);
            revokeObjectUrl(objectUrl);
            activePlayback =
              activePlayback?.audio === audio ? null : activePlayback;
            setState(turn.id, {
              status: "failed",
              message: TTS_PLAYBACK_ERROR_MESSAGE,
              hasPlayed: false,
            });
          }
        });

        audioByTurn.set(turn.id, entry);
        pendingObjectUrl = null;
        setState(turn.id, {
          status: "ready",
          message: "",
          hasPlayed: false,
        });
        return entry;
      } catch {
        if (pendingObjectUrl) {
          revokeObjectUrl(pendingObjectUrl);
        }

        if (
          !disposed &&
          requestByTurn.get(turn.id)?.token === requestToken
        ) {
          setState(turn.id, {
            status: "failed",
            message: TTS_PLAYBACK_ERROR_MESSAGE,
            hasPlayed: false,
          });
        }

        return null;
      } finally {
        clearTimeout(timeoutId);

        if (requestByTurn.get(turn.id)?.token === requestToken) {
          requestByTurn.delete(turn.id);
        }
      }
    });

    requestByTurn.set(turn.id, {
      token: requestToken,
      controller,
      promise: requestPromise,
    });
    return requestPromise;
  }

  return {
    getState(turnId) {
      return stateByTurn.get(turnId) ?? DEFAULT_TTS_PLAYBACK_STATE;
    },
    prepare,
    listen(turn) {
      if (disposed || !isKinyarwandaTtsEligible(turn)) {
        return Promise.resolve();
      }

      if (stateByTurn.get(turn.id)?.status === "playing") {
        return Promise.resolve();
      }

      const activeListen = listenByTurn.get(turn.id);

      if (activeListen) {
        return activeListen;
      }

      const listenPromise = Promise.resolve()
        .then(async () => {
          const entry =
            audioByTurn.get(turn.id) ??
            (await prepare(turn, { retry: true }));

          if (entry && !disposed) {
            await play(turn.id, entry);
          }
        })
        .finally(() => {
          if (listenByTurn.get(turn.id) === listenPromise) {
            listenByTurn.delete(turn.id);
          }
        });

      listenByTurn.set(turn.id, listenPromise);
      return listenPromise;
    },
    clearAll() {
      listenByTurn.clear();

      for (const { controller } of requestByTurn.values()) {
        controller.abort("cancelled");
      }

      requestByTurn.clear();

      for (const { audio, objectUrl } of audioByTurn.values()) {
        audio.pause?.();
        revokeObjectUrl(objectUrl);
      }

      audioByTurn.clear();
      stateByTurn.clear();
      activePlayback = null;
    },
    dispose() {
      this.clearAll();
      disposed = true;
    },
  };
}
