export const MAX_TTS_TEXT_LENGTH = 2000;

const TTS_UNAVAILABLE_MESSAGE =
  "Voice is temporarily unavailable. You can still use the translation above.";

function jsonError(error, status) {
  return Response.json({ error }, { status });
}

export function createTtsPostHandler({ synthesize }) {
  return async function handleTtsPost(request) {
    let body;

    try {
      body = await request.json();
    } catch {
      return jsonError("Send a valid JSON request.", 400);
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return jsonError("The request body must be a JSON object.", 400);
    }

    if (typeof body.text !== "string" || !body.text.trim()) {
      return jsonError("Enter Kinyarwanda text to speak.", 400);
    }

    const text = body.text.trim();

    if (text.length > MAX_TTS_TEXT_LENGTH) {
      return jsonError(
        `Text-to-speech is limited to ${MAX_TTS_TEXT_LENGTH} characters.`,
        400,
      );
    }

    try {
      const result = await synthesize(text);

      return new Response(result.audio, {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "Content-Type": result.contentType,
          "Content-Length": String(result.audio.byteLength),
        },
      });
    } catch {
      return jsonError(TTS_UNAVAILABLE_MESSAGE, 502);
    }
  };
}
