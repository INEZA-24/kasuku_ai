export const INTERPRETATION_ERROR_MESSAGE =
  "Kasuku couldn't interpret that message. Please try again.";
export const CONNECTION_ERROR_MESSAGE =
  "Connection unavailable. Check your internet and try again.";
export const CLIENT_INTERPRETATION_TIMEOUT_MS = 35000;

export const DEFAULT_INTERPRETATION_STATE = Object.freeze({
  status: "idle",
  error: "",
  canRetry: false,
});

export class InterpretationRequestError extends Error {
  constructor(kind, message = INTERPRETATION_ERROR_MESSAGE) {
    super(message);
    this.name = "InterpretationRequestError";
    this.kind = kind;
  }
}

export function createInterpretationSnapshot({
  message,
  sourceLanguage,
  targetLanguage,
  context,
  speakerSide,
  history,
}) {
  return Object.freeze({
    message: message.trim(),
    sourceLanguage,
    targetLanguage,
    context,
    speakerSide,
    history: Object.freeze(
      history.map((turn) =>
        Object.freeze({
          speakerSide: turn.speakerSide,
          originalText: turn.originalText,
          interpretedText: turn.interpretedText,
          sourceLanguage: turn.sourceLanguage,
          targetLanguage: turn.targetLanguage,
        }),
      ),
    ),
  });
}

export async function requestInterpretation(
  snapshot,
  { fetchImpl = fetch, signal } = {},
) {
  let response;

  try {
    response = await fetchImpl("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(snapshot),
      signal,
    });
  } catch (error) {
    if (signal?.aborted || error?.name === "AbortError") {
      throw new InterpretationRequestError("cancelled");
    }

    throw new InterpretationRequestError("connection", CONNECTION_ERROR_MESSAGE);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok || typeof data?.interpretation !== "string") {
    throw new InterpretationRequestError("service");
  }

  const interpretation = data.interpretation.trim();

  if (!interpretation) {
    throw new InterpretationRequestError("service");
  }

  return interpretation;
}

function friendlyError(error) {
  return error instanceof InterpretationRequestError &&
    error.kind === "connection"
    ? CONNECTION_ERROR_MESSAGE
    : INTERPRETATION_ERROR_MESSAGE;
}

export function createInterpretationManager({
  request = requestInterpretation,
  createTurnId = () => globalThis.crypto.randomUUID(),
  timeoutMs = CLIENT_INTERPRETATION_TIMEOUT_MS,
  onStateChange = () => {},
  onSuccess = () => {},
} = {}) {
  let state = DEFAULT_INTERPRETATION_STATE;
  let activeRequest = null;
  let failedSnapshot = null;
  let sessionId = 0;
  let disposed = false;

  function setState(nextState) {
    if (disposed) {
      return;
    }

    state = { ...DEFAULT_INTERPRETATION_STATE, ...nextState };
    onStateChange(state);
  }

  function submit(snapshot) {
    if (disposed) {
      return Promise.resolve(null);
    }

    if (activeRequest) {
      return activeRequest.promise;
    }

    const ownedSnapshot = createInterpretationSnapshot(snapshot);
    const requestToken = Symbol("interpretation");
    const requestSessionId = sessionId;
    const controller = new AbortController();
    failedSnapshot = null;
    setState({ status: "loading", error: "", canRetry: false });

    const abortPromise = new Promise((_, reject) => {
      controller.signal.addEventListener(
        "abort",
        () => {
          reject(
            new InterpretationRequestError(
              controller.signal.reason === "timeout" ? "timeout" : "cancelled",
            ),
          );
        },
        { once: true },
      );
    });
    const timeoutId = setTimeout(() => controller.abort("timeout"), timeoutMs);
    const promise = Promise.race([
      Promise.resolve().then(() =>
        request(ownedSnapshot, { signal: controller.signal }),
      ),
      abortPromise,
    ])
      .then((interpretation) => {
        if (
          disposed ||
          sessionId !== requestSessionId ||
          activeRequest?.token !== requestToken
        ) {
          return null;
        }

        const turn = {
          id: createTurnId(),
          speakerSide: ownedSnapshot.speakerSide,
          originalText: ownedSnapshot.message,
          interpretedText: interpretation,
          sourceLanguage: ownedSnapshot.sourceLanguage,
          targetLanguage: ownedSnapshot.targetLanguage,
        };

        failedSnapshot = null;
        setState(DEFAULT_INTERPRETATION_STATE);
        onSuccess(turn, ownedSnapshot);
        return turn;
      })
      .catch((error) => {
        if (
          disposed ||
          sessionId !== requestSessionId ||
          activeRequest?.token !== requestToken ||
          error?.kind === "cancelled"
        ) {
          return null;
        }

        failedSnapshot = ownedSnapshot;
        setState({
          status: "error",
          error: friendlyError(error),
          canRetry: true,
        });
        return null;
      })
      .finally(() => {
        clearTimeout(timeoutId);

        if (activeRequest?.token === requestToken) {
          activeRequest = null;
        }
      });

    activeRequest = { token: requestToken, controller, promise };
    return promise;
  }

  return {
    getState() {
      return state;
    },
    getFailedSnapshot() {
      return failedSnapshot;
    },
    submit,
    retry() {
      if (!failedSnapshot || activeRequest || disposed) {
        return activeRequest?.promise ?? Promise.resolve(null);
      }

      return submit(failedSnapshot);
    },
    clear() {
      sessionId += 1;
      activeRequest?.controller.abort("cancelled");
      activeRequest = null;
      failedSnapshot = null;
      setState(DEFAULT_INTERPRETATION_STATE);
    },
    dispose() {
      if (disposed) {
        return;
      }

      disposed = true;
      sessionId += 1;
      activeRequest?.controller.abort("cancelled");
      activeRequest = null;
      failedSnapshot = null;
      state = DEFAULT_INTERPRETATION_STATE;
    },
  };
}
