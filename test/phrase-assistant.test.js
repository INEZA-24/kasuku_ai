import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { POST } from "../src/app/api/assist/route.js";

const assistantSource = readFileSync(
  new URL("../src/components/kasuku-phrase-assistant.js", import.meta.url),
  "utf8",
);
const onboardingSource = readFileSync(
  new URL("../src/lib/onboarding.js", import.meta.url),
  "utf8",
);

test("phrase assistant sends a Rwanda-aware drafting prompt to EjoChat", async (t) => {
  const originalApiKey = process.env.EJOCHAT_API_KEY;
  const originalFetch = globalThis.fetch;
  let upstreamBody;

  process.env.EJOCHAT_API_KEY = "test-key";
  globalThis.fetch = async (_url, options) => {
    upstreamBody = JSON.parse(options.body);
    return new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content:
                "I would like to go to Nyabugogo, but I need to stop at an ATM first.",
            },
          },
        ],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  };

  t.after(() => {
    if (originalApiKey === undefined) {
      delete process.env.EJOCHAT_API_KEY;
    } else {
      process.env.EJOCHAT_API_KEY = originalApiKey;
    }
    globalThis.fetch = originalFetch;
  });

  const response = await POST(
    new Request("http://localhost/api/assist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "I want kubwira moto driver njya Nyabugogo but first ATM",
        sourceLanguage: "English",
        context: "Transport",
      }),
    }),
  );

  assert.equal(response.status, 200);
  assert.equal(
    (await response.json()).suggestion,
    "I would like to go to Nyabugogo, but I need to stop at an ATM first.",
  );

  const prompt = upstreamBody.messages[0].content;
  assert.match(prompt, /phrase assistant, powered by EjoChat/i);
  assert.match(prompt, /do not translate/i);
  assert.match(prompt, /Rwanda-specific place names/);
  assert.match(prompt, /Kinyarwanda terms/);
  assert.match(prompt, /code-switched words/);
  assert.match(prompt, /Never invent missing facts/);
});

test("assistant UI requires an explicit choice before using the suggestion", () => {
  assert.match(assistantSource, /Use in text box/);
  assert.match(assistantSource, />\s*\{copyLabel\}\s*</);
  assert.match(assistantSource, /Review or edit the message before interpreting it/);
  assert.doesNotMatch(assistantSource, /submitInterpretation/);
});

test("assistant updates the controlled composer rather than auto-sending", () => {
  assert.match(assistantSource, /HTMLTextAreaElement\.prototype/);
  assert.match(assistantSource, /dispatchEvent\(new Event\("input"/);
  assert.match(assistantSource, /setControlledTextareaValue\(textarea, suggestion\)/);
});

test("new conversation turns scroll the conversation canvas to the latest content", () => {
  assert.match(assistantSource, /new MutationObserver/);
  assert.match(assistantSource, /\.conversation-turn/);
  assert.match(assistantSource, /canvas\.scrollTo/);
  assert.match(assistantSource, /top: canvas\.scrollHeight/);
  assert.match(assistantSource, /prefers-reduced-motion/);
});

test("onboarding explains speech-recognition limitations and the assistant fallback", () => {
  assert.match(onboardingSource, /Speech recognition can vary/);
  assert.match(onboardingSource, /browser, device, and pronunciation/);
  assert.match(onboardingSource, /target: "assistant"/);
  assert.match(onboardingSource, /mix languages if needed/);
  assert.match(onboardingSource, /Kinyarwanda or local terms/);
});
