export const ONBOARDING_STORAGE_KEY = "kasuku-onboarding-complete";

export const ONBOARDING_STEPS = Object.freeze([
  Object.freeze({
    target: "context",
    title: "Choose the conversation context",
    text: "The context helps Kasuku understand what the conversation is about.",
  }),
  Object.freeze({
    target: "direction",
    title: "Choose who is speaking",
    text: "Tap the switch whenever the other person wants to reply.",
  }),
  Object.freeze({
    target: "composer",
    title: "Speak or type naturally",
    text: "Use the microphone or type your message. Speech recognition can vary depending on your browser, device, and pronunciation.",
  }),
  Object.freeze({
    target: "assistant",
    title: "Ask Kasuku when phrasing is difficult",
    text: "If speech recognition is unclear or you are not sure how to phrase something, tap the Kasuku icon. Explain what you mean, mix languages if needed, and keep Kinyarwanda or local terms. Kasuku will suggest a clearer message that you can review before using it.",
  }),
  Object.freeze({
    target: "interpretation",
    title: "Pass the phone and continue",
    text: "Kasuku interprets the message. When Kinyarwanda voice is ready, tap Play to hear it aloud.",
  }),
]);

export const initialOnboardingState = Object.freeze({
  isOpen: false,
  stepIndex: 0,
});

export function onboardingReducer(state, action) {
  switch (action.type) {
    case "open":
      return { isOpen: true, stepIndex: 0 };
    case "next":
      return {
        isOpen: state.stepIndex < ONBOARDING_STEPS.length - 1,
        stepIndex: Math.min(state.stepIndex + 1, ONBOARDING_STEPS.length - 1),
      };
    case "back":
      return {
        ...state,
        stepIndex: Math.max(0, state.stepIndex - 1),
      };
    case "dismiss":
      return { ...state, isOpen: false };
    default:
      return state;
  }
}

export function shouldShowOnboarding(storage) {
  try {
    return storage?.getItem(ONBOARDING_STORAGE_KEY) !== "true";
  } catch {
    return true;
  }
}

export function rememberOnboardingCompletion(storage) {
  try {
    storage?.setItem(ONBOARDING_STORAGE_KEY, "true");
  } catch {
    // The tour still dismisses when storage is unavailable or blocked.
  }
}
