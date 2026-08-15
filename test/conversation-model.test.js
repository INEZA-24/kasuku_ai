import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  conversationReducer,
  getLanguageDirection,
  getOtherSpeaker,
  getParticipantDirection,
  RECENT_HISTORY_LIMIT,
  selectRecentHistory,
} from "../src/lib/conversation.js";

function makeTurn(index) {
  return {
    id: `turn-${index}`,
    speakerSide: "visitor",
    originalText: `Original ${index}`,
    interpretedText: `Interpretation ${index}`,
    sourceLanguage: "English",
    targetLanguage: "Kinyarwanda",
  };
}

test("successful turns remain chronological and retain required message fields", () => {
  const firstTurn = makeTurn(1);
  const secondTurn = makeTurn(2);
  let turns = conversationReducer([], { type: "add", turn: firstTurn });

  turns = conversationReducer(turns, { type: "add", turn: secondTurn });

  assert.deepEqual(turns, [firstTurn, secondTurn]);
  assert.deepEqual(Object.keys(selectRecentHistory(turns)[0]).sort(), [
    "interpretedText",
    "originalText",
    "sourceLanguage",
    "speakerSide",
    "targetLanguage",
  ]);
});

test("only the six most recent successful turns are selected for EjoChat", () => {
  const turns = Array.from(
    { length: RECENT_HISTORY_LIMIT + 3 },
    (_, index) => makeTurn(index + 1),
  );
  const recentHistory = selectRecentHistory(turns);

  assert.equal(recentHistory.length, RECENT_HISTORY_LIMIT);
  assert.equal(recentHistory[0].originalText, "Original 4");
  assert.equal(recentHistory.at(-1).originalText, "Original 9");
});

test("clearing starts a new conversation with no previous context", () => {
  const populatedTurns = [makeTurn(1), makeTurn(2), makeTurn(3)];
  const clearedTurns = conversationReducer(populatedTurns, { type: "clear" });

  assert.deepEqual(clearedTurns, []);
  assert.deepEqual(selectRecentHistory(clearedTurns), []);
});

test("a failed request action leaves successful history untouched", () => {
  const populatedTurns = [makeTurn(1), makeTurn(2)];
  const turnsAfterFailure = conversationReducer(populatedTurns, {
    type: "request-failed",
  });

  assert.strictEqual(turnsAfterFailure, populatedTurns);
});

test("changing the active speaker automatically reverses the language direction", () => {
  const turns = [makeTurn(1)];
  const visitorDirection = getLanguageDirection(
    "visitor",
    "English",
    "Kinyarwanda",
  );
  const rwandanDirection = getLanguageDirection(
    "rwandan",
    "English",
    "Kinyarwanda",
  );

  assert.deepEqual(visitorDirection, {
    sourceLanguage: "English",
    targetLanguage: "Kinyarwanda",
  });
  assert.deepEqual(rwandanDirection, {
    sourceLanguage: "Kinyarwanda",
    targetLanguage: "English",
  });
  assert.equal(getOtherSpeaker("visitor"), "rwandan");
  assert.equal(getOtherSpeaker("rwandan"), "visitor");
  assert.deepEqual(selectRecentHistory(turns), selectRecentHistory(turns));
});

test("switching speakers and languages does not mutate shared history", () => {
  const turns = [
    makeTurn(1),
    {
      ...makeTurn(2),
      speakerSide: "rwandan",
      originalText: "Ni byiza.",
      interpretedText: "That is fine.",
      sourceLanguage: "Kinyarwanda",
      targetLanguage: "English",
    },
  ];
  const beforeSwitch = selectRecentHistory(turns);

  getLanguageDirection("rwandan", "English", "Kinyarwanda");
  getLanguageDirection("visitor", "English", "Kinyarwanda");

  assert.deepEqual(selectRecentHistory(turns), beforeSwitch);
});

test("the inline participant direction is derived from the active speaker", () => {
  assert.deepEqual(
    getParticipantDirection("visitor", "English", "Kinyarwanda"),
    {
      sourceParticipant: "visitor",
      targetParticipant: "rwandan",
      sourceLanguage: "English",
      targetLanguage: "Kinyarwanda",
    },
  );
  assert.deepEqual(
    getParticipantDirection("rwandan", "English", "Kinyarwanda"),
    {
      sourceParticipant: "rwandan",
      targetParticipant: "visitor",
      sourceLanguage: "Kinyarwanda",
      targetLanguage: "English",
    },
  );
});

test("the only interactive participant switch is inside the composer", () => {
  const pageSource = readFileSync(
    new URL("../src/app/page.js", import.meta.url),
    "utf8",
  );
  const composerStart = pageSource.indexOf('<form className="composer"');
  const directionControl = pageSource.indexOf(
    'className="composer-direction-control"',
  );
  const textarea = pageSource.indexOf("<textarea", directionControl);

  assert.ok(composerStart >= 0);
  assert.ok(directionControl > composerStart);
  assert.ok(textarea > directionControl);
  assert.equal(pageSource.includes('className="speaker-panel"'), false);
  assert.equal(pageSource.includes('className="speaker-switch"'), false);
  assert.equal(
    pageSource.match(/const \[activeSpeaker, setActiveSpeaker\] = useState/g)
      ?.length,
    1,
  );
});
