# Kasuku Testing Strategy

## 1. Purpose

Testing must demonstrate that Kasuku communicates the speaker's intended message naturally, retains enough conversational context, works in both language directions, degrades safely when optional speech features fail, and protects provider credentials. Each milestone adds tests appropriate to its scope and leaves the project working.

## 2. Test layers

- **Static checks:** Formatting, linting, type checking, build validation, and secret scanning when application tooling exists.
- **Unit tests:** Validation, conversation-state transitions, direction switching, prompt construction, history bounding, and error mapping.
- **Integration tests:** Next.js server routes with EjoChat and TTS calls mocked; browser state connected to API responses.
- **End-to-end tests:** User-visible flow from context/language selection through alternating conversation and fallbacks.
- **Manual language evaluation:** Human review of naturalness, meaning, tone, politeness, and reference resolution, especially for Kinyarwanda.
- **Responsive/accessibility checks:** Automated checks plus keyboard, screen-reader-oriented semantics, zoom, touch, and representative viewport review.
- **Security checks:** Repository, bundle, environment, request validation, response sanitization, and log inspection.

Automated tests should not require live paid/provider calls by default. A separate, controlled smoke suite may exercise live services when credentials and permission are available.

## 3. Core coverage matrix

### 3.1 Context selection

- Verify all five locked contexts are present and selectable.
- Verify exactly one active context is communicated with each interpretation request.
- Verify changing context affects subsequent requests without rewriting prior turns.
- Verify unsupported or manipulated context values are rejected server-side.
- Run representative interpretation cases for Transport, Restaurant / Food, Hotel / Accommodation, Shopping / Market, and General Conversation.

### 3.2 Language selection

- Verify Kinyarwanda, English, French, and Swahili appear as source and target choices.
- Verify source and target labels match the active direction and request payload.
- Verify identical source/target selection cannot produce a request.
- Verify every provider-confirmed language pair; mark unsupported pairs explicitly rather than presenting them as working.
- Verify language direction persists within the intended active session.

### 3.3 EjoChat interpretation

- Verify the server receives text, language direction, context, and bounded recent history.
- Verify the browser never calls EjoChat directly.
- Evaluate meaning, intent, tone, politeness, and natural phrasing with a repeatable multilingual fixture set.
- Test statements, questions, requests, commands, colloquial wording, and ambiguous phrases.
- Verify EjoChat interprets the message and does not answer it as a chatbot.
- Test that source content resembling system instructions does not override the interpreter role.
- Verify empty, oversized, malformed, and unsupported requests are rejected safely.

### 3.4 Conversational references

- Required regression case:
  - Previous: “I need a moto to Kigali Heights.”
  - Current: “Ask him how much it will cost.”
  - Expected semantic result: “him” resolves to the moto driver and “it” to that trip; output asks the driver the price and does not provide a price.
- Test pronouns referring to people and objects across recent turns.
- Test omitted subjects and short follow-ups such as “And for two nights?” in the Hotel context.
- Test context conflicts and ensure recent explicit conversation evidence takes precedence according to the eventual prompt policy.
- Test behavior when the required reference falls outside the bounded history window.

### 3.5 Two-way communication

- Complete at least three alternating turns across two language directions.
- Verify swapping direction exchanges source and target exactly once.
- Verify context and existing history survive the swap.
- Verify each new turn records the languages actually used.
- Verify rapid or repeated switch interactions do not corrupt direction or duplicate requests.
- Manually verify the shared-phone flow is understandable to both participants.

### 3.6 Speech fallback

- Verify supported speech input populates editable text before submission.
- Deny microphone permission and verify typing remains immediately usable.
- Simulate unsupported speech recognition, silence/no match, interrupted recording, and runtime error.
- Verify clear listening, stopped, and failure states.
- Verify no microphone recording starts without explicit user action.
- Verify typed conversation can complete end to end without any microphone capability.

### 3.7 TTS fallback

- Verify interpreted text renders before TTS completes and without initiating TTS where playback is user-triggered.
- Verify eligible Kinyarwanda output can produce and play audio.
- Simulate slow TTS, timeout, upstream error, invalid audio, playback rejection, and unsupported browser playback.
- Verify each failure is non-blocking and preserves the text and conversation.
- Verify non-Kinyarwanda output does not incorrectly invoke Kinyarwanda TTS.
- Verify repeated playback and audio cleanup according to the eventual implementation policy.

### 3.8 API failure

- Simulate offline/network failure, timeout, rate limit, authentication failure, upstream 4xx/5xx, malformed response, and unexpected exception.
- Verify safe, plain-language messages and appropriate retry availability.
- Verify existing history is preserved.
- Verify a pending request cannot be submitted twice accidentally.
- Verify retry does not duplicate a previously successful turn.
- Verify client responses do not expose stack traces, raw provider payloads, or credentials.

### 3.9 Mobile layouts and accessibility

- Test the agreed browser/device matrix, with representative narrow mobile, larger mobile, tablet, and desktop viewports.
- Verify portrait mode first; test landscape behavior where supported.
- Verify no horizontal overflow for long words/messages and enlarged text.
- Verify controls remain reachable and touch targets do not overlap.
- Verify conversation scrolling, input focus, virtual-keyboard interaction, and latest-turn visibility.
- Verify keyboard access, visible focus, accessible names, status announcements, logical heading/order, and sufficient contrast.
- Verify direction, error, loading, and audio status do not rely on color alone.

### 3.10 Secret and security handling

- Scan tracked and untracked source intended for commit for token/key patterns before every authorized commit.
- Verify secret-bearing `.env` files are ignored and only safe placeholders are documented.
- Inspect production client bundles and browser network traffic for provider keys.
- Verify direct client calls to EjoChat and C4IR/KiNLP are absent.
- Verify server validation rejects unknown contexts/languages, same-language requests, invalid shapes, and excessive input/history.
- Verify errors and logs do not contain secrets or full sensitive conversation content by default.
- Confirm repository history contains no secret before production deployment.

## 4. AI quality evaluation

AI behavior is probabilistic, so exact-string assertions alone are insufficient. Maintain a compact evaluation set tagged by context, language direction, linguistic challenge, expected meaning, required references, tone/politeness constraints, and prohibited chatbot-answer behavior. Use deterministic settings where the provider supports them and judge semantic outcomes with human review for demo-critical cases.

A result fails if it materially changes meaning, invents information, drops an important request, loses required politeness/tone, mishandles a clear reference, uses the wrong language, or answers the speaker instead of interpreting them.

## 5. Milestone gates

- M0: Document presence and consistency checks.
- M1: Build/lint/type/static accessibility and responsive shell checks.
- M2–M3: Route, validation, secret-isolation, and interpretation-contract tests.
- M4–M5: State, history, reference-resolution, and bidirectional-flow tests.
- M6–M7: Speech success and fallback tests.
- M8: Failure-injection and recovery suite.
- M9: Responsive and accessibility audit.
- M10: Full requirement traceability and regression run.
- M11: Production security and smoke tests.
- M12: Timed primary and fallback demo rehearsals.

## 6. Exit evidence

For each milestone, record commands run, automated results, manual scenarios, environment limitations, unresolved defects, and the exact next action in `AI_HANDOFF.md`. A milestone is not complete when a required test is failing or when the application is left non-runnable.

