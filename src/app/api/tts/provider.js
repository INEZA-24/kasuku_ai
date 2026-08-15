import { Client } from "@gradio/client";

export const TTS_SPACE_ID = "Professor/c4ir-rw-kinyarwandatts";
export const TTS_SYNTHESIS_ENDPOINT = "/synthesize_audio";
export const TTS_DEFAULTS = Object.freeze({
  speakerName: "Male",
  speed: 1,
});

const PROVIDER_TIMEOUT_MS = 90000;
const AUDIO_FETCH_TIMEOUT_MS = 30000;

let sharedClientPromise = null;

function withTimeout(promise, timeoutMs) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error("The TTS provider timed out.")),
      timeoutMs,
    );
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

async function connectToPublicSpace() {
  if (!sharedClientPromise) {
    sharedClientPromise = Client.connect(TTS_SPACE_ID).catch((error) => {
      sharedClientPromise = null;
      throw error;
    });
  }

  return sharedClientPromise;
}

export function getGradioAudioUrl(result) {
  const audioUrl = result?.data?.[0]?.url;

  if (typeof audioUrl !== "string") {
    throw new Error("The TTS provider returned no usable audio.");
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(audioUrl);
  } catch {
    throw new Error("The TTS provider returned no usable audio.");
  }

  if (
    parsedUrl.protocol !== "https:" ||
    !parsedUrl.hostname.endsWith(".hf.space")
  ) {
    throw new Error("The TTS provider returned no usable audio.");
  }

  return parsedUrl.href;
}

export async function synthesizeKinyarwanda(
  text,
  {
    connect = connectToPublicSpace,
    fetchImpl = fetch,
    providerTimeoutMs = PROVIDER_TIMEOUT_MS,
  } = {},
) {
  const client = await withTimeout(connect(TTS_SPACE_ID), providerTimeoutMs);
  const result = await withTimeout(
    client.predict(TTS_SYNTHESIS_ENDPOINT, {
      text,
      speaker_name: TTS_DEFAULTS.speakerName,
      speed: TTS_DEFAULTS.speed,
    }),
    providerTimeoutMs,
  );
  const audioUrl = getGradioAudioUrl(result);
  const audioResponse = await fetchImpl(audioUrl, {
    cache: "no-store",
    signal: AbortSignal.timeout(AUDIO_FETCH_TIMEOUT_MS),
  });

  if (!audioResponse.ok) {
    throw new Error("The generated audio could not be downloaded.");
  }

  const audio = await audioResponse.arrayBuffer();

  if (!audio.byteLength) {
    throw new Error("The TTS provider returned empty audio.");
  }

  const upstreamContentType = audioResponse.headers.get("content-type");

  return {
    audio,
    contentType: upstreamContentType?.startsWith("audio/")
      ? upstreamContentType
      : "audio/wav",
  };
}
