export const RECENT_HISTORY_LIMIT = 6;

export const SPEAKER_SIDES = Object.freeze([
  "participant-one",
  "participant-two",
]);

export function conversationReducer(turns, action) {
  switch (action.type) {
    case "add":
      return [...turns, action.turn];
    case "clear":
      return [];
    default:
      return turns;
  }
}

export function selectRecentHistory(turns) {
  return turns.slice(-RECENT_HISTORY_LIMIT).map((turn) => ({
    speakerSide: turn.speakerSide,
    originalText: turn.originalText,
    interpretedText: turn.interpretedText,
    sourceLanguage: turn.sourceLanguage,
    targetLanguage: turn.targetLanguage,
  }));
}

export function inferSpeakerSide(turns, sourceLanguage, targetLanguage) {
  const firstTurn = turns[0];

  if (!firstTurn) {
    return "participant-one";
  }

  if (
    sourceLanguage === firstTurn.targetLanguage &&
    targetLanguage === firstTurn.sourceLanguage
  ) {
    return firstTurn.speakerSide === "participant-one"
      ? "participant-two"
      : "participant-one";
  }

  return firstTurn.speakerSide;
}
