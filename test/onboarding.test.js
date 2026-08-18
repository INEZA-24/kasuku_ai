import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  initialOnboardingState,
  onboardingReducer,
  ONBOARDING_STEPS,
  ONBOARDING_STORAGE_KEY,
  rememberOnboardingCompletion,
  shouldShowOnboarding,
} from "../src/lib/onboarding.js";

function createStorage(initialValue = null) {
  const values = new Map();

  if (initialValue !== null) {
    values.set(ONBOARDING_STORAGE_KEY, initialValue);
  }

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

test("first visit shows onboarding and completed visits do not", () => {
  const firstVisitStorage = createStorage();
  const completedStorage = createStorage("true");

  assert.equal(shouldShowOnboarding(firstVisitStorage), true);
  assert.equal(shouldShowOnboarding(completedStorage), false);
});

test("Skip or completion stores the onboarding completion flag", () => {
  const storage = createStorage();

  rememberOnboardingCompletion(storage);

  assert.equal(storage.getItem(ONBOARDING_STORAGE_KEY), "true");
  assert.equal(shouldShowOnboarding(storage), false);
});

test("the tour moves through all four approved steps with Back support", () => {
  assert.deepEqual(ONBOARDING_STEPS.map(({ title }) => title), [
    "Choose the conversation context",
    "Choose who is speaking",
    "Speak naturally",
    "Pass the phone and continue",
  ]);

  let state = onboardingReducer(initialOnboardingState, { type: "open" });
  assert.deepEqual(state, { isOpen: true, stepIndex: 0 });

  state = onboardingReducer(state, { type: "next" });
  state = onboardingReducer(state, { type: "next" });
  assert.equal(state.stepIndex, 2);

  state = onboardingReducer(state, { type: "back" });
  assert.equal(state.stepIndex, 1);

  state = onboardingReducer(state, { type: "next" });
  state = onboardingReducer(state, { type: "next" });
  state = onboardingReducer(state, { type: "next" });
  assert.deepEqual(state, { isOpen: false, stepIndex: 3 });
});

test("dismiss closes the tour and the component maps Escape to dismissal", () => {
  const openState = onboardingReducer(initialOnboardingState, { type: "open" });
  const dismissedState = onboardingReducer(openState, { type: "dismiss" });
  const componentSource = readFileSync(
    new URL("../src/components/onboarding-tour.js", import.meta.url),
    "utf8",
  );

  assert.equal(dismissedState.isOpen, false);
  assert.match(componentSource, /event\.key === "Escape"/);
  assert.match(componentSource, /rememberOnboardingCompletion/);
});

test("How to use Kasuku can force the tour open again", () => {
  const pageSource = readFileSync(
    new URL("../src/app/conversation/page.js", import.meta.url),
    "utf8",
  );

  assert.match(pageSource, /How to use Kasuku/);
  assert.match(pageSource, /setTourRestartToken/);
  assert.match(pageSource, /restartToken=\{tourRestartToken\}/);
});
