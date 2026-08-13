import {
  createInterpretationMessages,
  isSupportedContext,
} from "./prompt.js";
import {
  RECENT_HISTORY_LIMIT,
  SPEAKER_SIDES,
} from "../../../lib/conversation.js";

const EJOCHAT_URL = "https://api.ejolabs.com/api/v1/subiza";

const ALLOWED_LANGUAGES = new Set([
  "English",
  "Kinyarwanda",
  "French",
  "Swahili",
]);

const MAX_MESSAGE_LENGTH = 2000;
const MAX_INTERPRETATION_LENGTH = 4000;

function errorResponse(error, status) {
  return Response.json({ error }, { status });
}

function validateHistory(history) {
  if (history === undefined) {
    return null;
  }

  if (!Array.isArray(history)) {
    return "Conversation history must be an array.";
  }

  if (history.length > RECENT_HISTORY_LIMIT) {
    return `Conversation history must contain ${RECENT_HISTORY_LIMIT} turns or fewer.`;
  }

  for (const turn of history) {
    if (!turn || typeof turn !== "object" || Array.isArray(turn)) {
      return "Conversation history contains an invalid turn.";
    }

    if (!SPEAKER_SIDES.includes(turn.speakerSide)) {
      return "Conversation history contains an invalid speaker side.";
    }

    if (
      typeof turn.originalText !== "string" ||
      !turn.originalText.trim() ||
      turn.originalText.trim().length > MAX_MESSAGE_LENGTH
    ) {
      return "Conversation history contains invalid original text.";
    }

    if (
      typeof turn.interpretedText !== "string" ||
      !turn.interpretedText.trim() ||
      turn.interpretedText.trim().length > MAX_INTERPRETATION_LENGTH
    ) {
      return "Conversation history contains invalid interpreted text.";
    }

    if (
      !ALLOWED_LANGUAGES.has(turn.sourceLanguage) ||
      !ALLOWED_LANGUAGES.has(turn.targetLanguage) ||
      turn.sourceLanguage === turn.targetLanguage
    ) {
      return "Conversation history contains an invalid language direction.";
    }
  }

  return null;
}

function validateRequestBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "The request body must be a JSON object.";
  }

  const { message, sourceLanguage, targetLanguage, context } = body;

  if (typeof message !== "string" || !message.trim()) {
    return "Enter a message to interpret.";
  }

  if (message.trim().length > MAX_MESSAGE_LENGTH) {
    return `The message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`;
  }

  if (!ALLOWED_LANGUAGES.has(sourceLanguage)) {
    return "Choose a supported source language.";
  }

  if (!ALLOWED_LANGUAGES.has(targetLanguage)) {
    return "Choose a supported target language.";
  }

  if (sourceLanguage === targetLanguage) {
    return "Source and target languages must be different.";
  }

  if (!isSupportedContext(context)) {
    return "Choose a supported conversation context.";
  }

  if (
    body.speakerSide !== undefined &&
    !SPEAKER_SIDES.includes(body.speakerSide)
  ) {
    return "Choose a supported speaker side.";
  }

  const historyError = validateHistory(body.history);

  if (historyError) {
    return historyError;
  }

  return null;
}

export async function POST(request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return errorResponse("Send a valid JSON request.", 400);
  }

  const validationError = validateRequestBody(body);

  if (validationError) {
    return errorResponse(validationError, 400);
  }

  const apiKey = process.env.EJOCHAT_API_KEY;

  if (!apiKey) {
    return errorResponse(
      "Interpretation is not configured. Please contact the site administrator.",
      503,
    );
  }

  let upstreamResponse;

  try {
    upstreamResponse = await fetch(EJOCHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({
        messages: createInterpretationMessages({
          ...body,
          history: body.history ?? [],
          speakerSide: body.speakerSide ?? "participant-one",
        }),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(30000),
    });
  } catch {
    return errorResponse(
      "The interpretation service could not be reached. Please try again.",
      502,
    );
  }

  if (!upstreamResponse.ok) {
    return errorResponse(
      "The interpretation service is temporarily unavailable. Please try again.",
      502,
    );
  }

  let upstreamData;

  try {
    upstreamData = await upstreamResponse.json();
  } catch {
    return errorResponse(
      "The interpretation service returned an invalid response. Please try again.",
      502,
    );
  }

  const interpretation = upstreamData?.choices?.[0]?.message?.content;

  if (typeof interpretation !== "string" || !interpretation.trim()) {
    return errorResponse(
      "The interpretation service returned an invalid response. Please try again.",
      502,
    );
  }

  return Response.json({ interpretation: interpretation.trim() });
}
