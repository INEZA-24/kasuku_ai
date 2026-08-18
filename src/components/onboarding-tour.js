"use client";

import { useEffect, useReducer, useRef, useState } from "react";

import {
  initialOnboardingState,
  onboardingReducer,
  ONBOARDING_STEPS,
  rememberOnboardingCompletion,
  shouldShowOnboarding,
} from "../lib/onboarding.js";

const EDGE_GAP = 12;
const TOOLTIP_GAP = 14;
const TOOLTIP_ESTIMATED_HEIGHT = 224;

function getTargetRect(target) {
  const element = document.querySelector(`[data-tour-target="${target}"]`);

  if (!element) {
    return null;
  }

  const rect = element.getBoundingClientRect();
  const padding = 6;
  const top = Math.min(
    window.innerHeight - EDGE_GAP,
    Math.max(EDGE_GAP, rect.top - padding),
  );
  const left = Math.min(
    window.innerWidth - EDGE_GAP,
    Math.max(EDGE_GAP, rect.left - padding),
  );

  return {
    top,
    left,
    width: Math.max(
      1,
      Math.min(
        window.innerWidth - left - EDGE_GAP,
        rect.width + padding * 2,
      ),
    ),
    height: Math.max(
      1,
      Math.min(
        window.innerHeight - top - EDGE_GAP,
        rect.height + padding * 2,
      ),
    ),
  };
}

function getTooltipPosition(rect) {
  const width = Math.min(340, window.innerWidth - EDGE_GAP * 2);
  const left = Math.min(
    window.innerWidth - width - EDGE_GAP,
    Math.max(EDGE_GAP, rect.left + rect.width / 2 - width / 2),
  );
  const fitsBelow =
    rect.top + rect.height + TOOLTIP_GAP + TOOLTIP_ESTIMATED_HEIGHT <
    window.innerHeight;
  const top = fitsBelow
    ? rect.top + rect.height + TOOLTIP_GAP
    : Math.max(EDGE_GAP, rect.top - TOOLTIP_ESTIMATED_HEIGHT - TOOLTIP_GAP);

  return { left, top, width };
}

export default function OnboardingTour({ restartToken }) {
  const [state, dispatch] = useReducer(onboardingReducer, initialOnboardingState);
  const [layout, setLayout] = useState(null);
  const hasCheckedFirstVisit = useRef(false);
  const dialogRef = useRef(null);
  const step = ONBOARDING_STEPS[state.stepIndex];

  useEffect(() => {
    if (!hasCheckedFirstVisit.current) {
      hasCheckedFirstVisit.current = true;

      if (shouldShowOnboarding(window.localStorage)) {
        dispatch({ type: "open" });
      }
      return;
    }

    if (restartToken > 0) {
      dispatch({ type: "open" });
    }
  }, [restartToken]);

  useEffect(() => {
    if (!state.isOpen) {
      setLayout(null);
      return undefined;
    }

    const targetElement = document.querySelector(
      `[data-tour-target="${step.target}"]`,
    );
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    targetElement?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "center",
    });

    function updateLayout() {
      const rect = getTargetRect(step.target);

      if (rect) {
        setLayout({
          highlight: rect,
          tooltip: getTooltipPosition(rect),
        });
      }
    }

    const frame = window.requestAnimationFrame(updateLayout);
    const settleTimer = window.setTimeout(updateLayout, reduceMotion ? 0 : 320);

    window.addEventListener("resize", updateLayout);
    window.addEventListener("scroll", updateLayout, {
      capture: true,
      passive: true,
    });
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(settleTimer);
      window.removeEventListener("resize", updateLayout);
      window.removeEventListener("scroll", updateLayout, true);
    };
  }, [state.isOpen, state.stepIndex, step.target]);

  useEffect(() => {
    if (!state.isOpen) {
      return undefined;
    }

    dialogRef.current?.focus();

    function dismissOnEscape(event) {
      if (event.key === "Escape") {
        rememberOnboardingCompletion(window.localStorage);
        dispatch({ type: "dismiss" });
      }
    }

    document.addEventListener("keydown", dismissOnEscape);
    return () => document.removeEventListener("keydown", dismissOnEscape);
  }, [state.isOpen, state.stepIndex]);

  function dismiss() {
    rememberOnboardingCompletion(window.localStorage);
    dispatch({ type: "dismiss" });
  }

  function next() {
    const isLastStep = state.stepIndex === ONBOARDING_STEPS.length - 1;

    if (isLastStep) {
      rememberOnboardingCompletion(window.localStorage);
    }

    dispatch({ type: "next" });
  }

  if (!state.isOpen || !layout) {
    return null;
  }

  return (
    <div className="onboarding-layer" aria-live="polite">
      <div
        className="onboarding-highlight"
        aria-hidden="true"
        style={{
          top: layout.highlight.top,
          left: layout.highlight.left,
          width: layout.highlight.width,
          height: layout.highlight.height,
        }}
      />
      <section
        className="onboarding-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-description"
        ref={dialogRef}
        tabIndex={-1}
        style={layout.tooltip}
      >
        <div className="onboarding-progress-row">
          <span>{state.stepIndex + 1} of {ONBOARDING_STEPS.length}</span>
          <button type="button" onClick={dismiss}>Skip</button>
        </div>
        <h2 id="onboarding-title">{step.title}</h2>
        <p id="onboarding-description">{step.text}</p>
        <div className="onboarding-actions">
          {state.stepIndex > 0 ? (
            <button
              className="onboarding-back"
              type="button"
              onClick={() => dispatch({ type: "back" })}
            >
              Back
            </button>
          ) : <span />}
          <button className="onboarding-next" type="button" onClick={next}>
            {state.stepIndex === ONBOARDING_STEPS.length - 1
              ? "Start talking"
              : "Next"}
          </button>
        </div>
      </section>
    </div>
  );
}
