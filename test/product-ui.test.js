import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const landingSource = readFileSync(
  new URL("../src/app/page.js", import.meta.url),
  "utf8",
);
const conversationSource = readFileSync(
  new URL("../src/app/conversation/page.js", import.meta.url),
  "utf8",
);
const landingStyles = readFileSync(
  new URL("../src/app/landing.module.css", import.meta.url),
  "utf8",
);
const conversationStyles = readFileSync(
  new URL("../src/app/globals.css", import.meta.url),
  "utf8",
);

test("the public root is a Rwanda-business landing page", () => {
  assert.match(landingSource, /Rwanda is open for business/);
  assert.match(landingSource, /Business is growing/);
  assert.match(landingSource, /USD 2\.62B/);
  assert.match(landingSource, /25,266/);
  assert.match(landingSource, /Rwanda Development Board/);
  assert.match(landingSource, /National Institute of Statistics of Rwanda/);
});

test("landing CTAs route to the dedicated conversation experience", () => {
  assert.ok((landingSource.match(/href="\/conversation"/g) ?? []).length >= 3);
  assert.match(landingSource, /id="how-it-works"/);
  assert.match(landingSource, /id="challenge"/);
});

test("landing sections use clean titles without report-style numbering", () => {
  assert.match(landingSource, /The Challenge/);
  assert.match(landingSource, /How Kasuku Works/);
  assert.match(landingSource, /Built for Real Conversations/);
  assert.match(landingSource, /Ready to Talk\?/);
  assert.doesNotMatch(landingSource, /["'>]0[1-4]["'<]/);
  assert.doesNotMatch(landingSource, /padStart/);
  assert.match(landingStyles, /\.sectionTag::before/);
});

test("landing footer contains only the agreed Team NEXEL copyright", () => {
  assert.match(landingSource, /© 2026 Kasuku\. Built by Team NEXEL\./);
  const footerMarkup = landingSource.match(
    /<footer className=\{styles\.footer\}>([\s\S]*?)<\/footer>/,
  )?.[1];

  assert.ok(footerMarkup);
  assert.equal((footerMarkup.match(/<p>/g) ?? []).length, 1);
  assert.doesNotMatch(footerMarkup, /<Image|Rwanda-focused/);
});

test("the parrot brand asset and existing app icon are used", () => {
  assert.ok(existsSync(new URL("../public/kasuku.png", import.meta.url)));
  assert.ok(existsSync(new URL("../src/app/icon.png", import.meta.url)));
  assert.match(landingSource, /src="\/kasuku\.png"/);
  assert.match(conversationSource, /src="\/kasuku\.png"/);
  assert.doesNotMatch(conversationSource, /className="brand-mark"/);
});

test("conversation primary UI uses neutral speaker terminology", () => {
  const conversationModel = readFileSync(
    new URL("../src/lib/conversation.js", import.meta.url),
    "utf8",
  );

  assert.match(conversationModel, /visitor: "Speaker 1"/);
  assert.match(conversationModel, /rwandan: "Speaker 2"/);
  assert.match(conversationSource, /Speaker 1 language/);
  assert.match(conversationSource, /Speaker 2 language/);
  assert.doesNotMatch(conversationSource, />Visitor</);
  assert.doesNotMatch(conversationSource, />Rwandan</);
});

test("conversation opens directly into the application without a marketing hero", () => {
  assert.doesNotMatch(conversationSource, /One phone\. One clear conversation\./);
  assert.doesNotMatch(conversationSource, /conversation-intro/);
  assert.doesNotMatch(conversationSource, /className="eyebrow">0[1-4]/);
  assert.match(conversationSource, /data-tour-target="context"/);
  assert.match(conversationSource, /className="composer"/);
});

test("the central vector swap reverses the existing active speaker state", () => {
  assert.match(conversationSource, /function SwapIcon/);
  assert.match(conversationSource, /className="direction-swap-button"/);
  assert.match(conversationSource, /changeActiveSpeaker\(getOtherSpeaker\(activeSpeaker\)\)/);
  assert.doesNotMatch(
    conversationSource,
    /className="direction-swap-button"[\s\S]{0,160}disabled=\{isLoading\}/,
  );
  assert.equal(
    conversationSource.match(/const \[activeSpeaker, setActiveSpeaker\] = useState/g)?.length,
    1,
  );
});

test("the existing microphone and voice UI remain wired into conversation", () => {
  assert.match(conversationSource, /function MicrophoneIcon/);
  assert.match(conversationSource, /function SwapIcon/);
  assert.match(conversationSource, /shouldShowVisitorSpeechChoice\(activeSpeaker\)/);
  assert.match(conversationSource, /beginSpeechRecognition/);
  assert.match(conversationSource, /prepareTurnAudio/);
  assert.match(conversationSource, /listenToTurn\(turn\)/);
  assert.match(conversationSource, /Preparing voice/);
});

test("final app surfaces retain moderately sharp control and card corners", () => {
  assert.match(landingStyles, /\.statCard[\s\S]*?border-radius: 12px/);
  assert.match(landingStyles, /\.productPreview[\s\S]*?border-radius: 13px/);
  assert.match(conversationStyles, /\.conversation-canvas[\s\S]*?border-radius: 12px/);
  assert.match(conversationStyles, /\.composer \{[\s\S]*?border-radius: 12px/);
  assert.match(conversationStyles, /\.direction-swap-button[\s\S]*?border-radius: 9px/);
});
