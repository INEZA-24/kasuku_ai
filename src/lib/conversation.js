export const RECENT_HISTORY_LIMIT = 6;

export const SPEAKER_SIDES = Object.freeze([
  "visitor",
  "rwandan",
]);

export const SPEAKER_LABELS = Object.freeze({
  visitor: "Speaker 1",
  rwandan: "Speaker 2",
});

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

export function getLanguageDirection(
  activeSpeaker,
  visitorLanguage,
  rwandanLanguage,
) {
  if (activeSpeaker === "rwandan") {
    return {
      sourceLanguage: rwandanLanguage,
      targetLanguage: visitorLanguage,
    };
  }

  return {
    sourceLanguage: visitorLanguage,
    targetLanguage: rwandanLanguage,
  };
}

export function getOtherSpeaker(activeSpeaker) {
  return activeSpeaker === "rwandan" ? "visitor" : "rwandan";
}

export function getParticipantDirection(
  activeParticipant,
  visitorLanguage,
  rwandanLanguage,
) {
  const targetParticipant = getOtherSpeaker(activeParticipant);
  const { sourceLanguage, targetLanguage } = getLanguageDirection(
    activeParticipant,
    visitorLanguage,
    rwandanLanguage,
  );

  return {
    sourceParticipant: activeParticipant,
    targetParticipant,
    sourceLanguage,
    targetLanguage,
  };
}
