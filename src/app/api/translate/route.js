import {
  createInterpretationMessages,
  isSupportedContext,
} from "./prompt.js";

const EJOCHAT_URL = "https://api.ejolabs.com/api/v1/subiza";

const ALLOWED_LANGUAGES = new Set([
  "English",
  "Kinyarwanda",
  "French",
  "Swahili",
]);

const MAX_MESSAGE_LENGTH = 2000;

function errorResponse(error, status) {
  return Response.json({ error }, { status });
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
        messages: createInterpretationMessages(body),
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
