"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  createInterpretationManager,
  DEFAULT_INTERPRETATION_STATE,
} from "../lib/interpretation-request.js";

export function useInterpretation({ onSuccess }) {
  const [interpretationState, setInterpretationState] = useState(
    DEFAULT_INTERPRETATION_STATE,
  );
  const managerRef = useRef(null);
  const successCallbackRef = useRef(onSuccess);

  useEffect(() => {
    successCallbackRef.current = onSuccess;
  }, [onSuccess]);

  const getManager = useCallback(() => {
    if (!managerRef.current) {
      managerRef.current = createInterpretationManager({
        onStateChange: setInterpretationState,
        onSuccess(turn, snapshot) {
          successCallbackRef.current(turn, snapshot);
        },
      });
    }

    return managerRef.current;
  }, []);

  const submitInterpretation = useCallback(
    (snapshot) => getManager().submit(snapshot),
    [getManager],
  );
  const retryInterpretation = useCallback(
    () => getManager().retry(),
    [getManager],
  );
  const clearInterpretation = useCallback(() => {
    managerRef.current?.clear();
    setInterpretationState(DEFAULT_INTERPRETATION_STATE);
  }, []);

  useEffect(
    () => () => {
      managerRef.current?.dispose();
      managerRef.current = null;
    },
    [],
  );

  return {
    ...interpretationState,
    submitInterpretation,
    retryInterpretation,
    clearInterpretation,
  };
}
