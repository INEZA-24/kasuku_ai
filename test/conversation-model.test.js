import assert from "node:assert/strict";
import test from "node:test";

import {
  conversationReducer,
  inferSpeakerSide,
  RECENT_HISTORY_LIMIT,
  selectRecentHistory,
} from "../src/lib/conversation.js";

function makeTurn(index) {
  return {
    id: `turn-${index}`,
    speakerSide: "participant-one",
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

test("reversed selected languages identify the other participant side", () => {
  const turns = [makeTurn(1)];

  assert.equal(
    inferSpeakerSide(turns, "English", "Kinyarwanda"),
    "participant-one",
  );
  assert.equal(
    inferSpeakerSide(turns, "Kinyarwanda", "English"),
    "participant-two",
  );
});
