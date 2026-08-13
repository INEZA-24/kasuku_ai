# Kasuku Development Plan

## Workflow rules

- Follow milestones in order unless a documented dependency requires a narrow exception.
- Do not begin the next milestone until the current milestone's acceptance criteria and definition of done are met.
- Keep each milestone reviewable and leave the project working.
- Update `AI_HANDOFF.md` after every milestone and whenever work is handed to another contributor or AI agent.
- Never commit credentials. Do not commit or deploy unless explicitly authorized.
- Keep MVP work within the defined product scope.

## M0 — Documentation and repository foundation

**Objective:** Establish one authoritative, consistent documentation baseline before application implementation.

**Implementation scope:** Create the `project-docs` directory and the product definition, SRS, architecture, development plan, testing strategy, and AI handoff documents. Record locked decisions, scope boundaries, milestone order, dependencies, risks, and unresolved questions. Do not initialize Next.js or implement features.

**Acceptance criteria:**

- All six required documents exist and use Kasuku as the product name.
- Product purpose, contexts, languages, features, AI behavior, fallbacks, technical direction, quality requirements, and exclusions are documented.
- SRS requirements are numbered.
- Every milestone includes objective, implementation scope, acceptance criteria, dependencies, and definition of done.
- Testing covers every category requested for the MVP.
- AI handoff reflects the actual repository state and exact next step.

**Dependencies:** Approved product brief; no code or provider access required.

**Definition of done:** Documents are internally consistent and reviewed with basic repository checks; no M1 code, framework initialization, dependency installation, or commit has occurred.

## M1 — Next.js foundation and static UI shell

**Objective:** Create a runnable Next.js App Router foundation and a static, accessible mobile-first conversation shell.

**Implementation scope:** Initialize the application; establish base styling and layout; create static context and language controls, input area, conversation area, direction switch, loading/error placeholders, and optional audio control placeholder. Add secret-safe environment and Git-ignore conventions. Do not call EjoChat or speech services.

**Acceptance criteria:**

- The application runs locally using documented commands.
- The main screen is usable at representative mobile and desktop widths.
- All five contexts and four initial languages appear in accessible controls.
- Static conversation, loading, empty, and error states are visually distinguishable.
- No provider credentials or live integration code are present.

**Dependencies:** M0 complete; supported Node.js/package-manager choice confirmed.

**Definition of done:** Build, lint, and relevant static UI tests pass; documentation and handoff are updated; the UI shell is runnable without external services.

## M2 — Secure EjoChat server integration

**Objective:** Establish a secure server-only connection to EjoChat for single-turn text interpretation.

**Implementation scope:** Confirm the EjoChat contract; add server environment configuration; implement a validated App Router API route; isolate provider-specific code; normalize success and failure responses; connect typed UI submission for a single turn.

**Acceptance criteria:**

- Browser code calls only the Kasuku route and cannot access the EjoChat credential.
- A valid typed request returns and displays interpreted text.
- Invalid input and upstream failures return safe, structured errors.
- Provider behavior can be tested with mocks without live credentials.

**Dependencies:** M1 complete; EjoChat endpoint, credentials, language coverage, quotas, and request/response format available.

**Definition of done:** Unit and integration tests for validation, provider mapping, secret isolation, and basic success/failure paths pass; the app remains runnable without committing secrets.

## M3 — Context-aware interpretation

**Objective:** Make EjoChat interpretation natural, context-sensitive, and strictly interpreter-like.

**Implementation scope:** Design and test the interpreter instruction; send selected context and language direction; enforce preservation of meaning, intent, tone, and politeness; constrain output so EjoChat translates the intended communication instead of answering it.

**Acceptance criteria:**

- Each MVP context is transmitted and materially available to the model.
- Representative prompts produce natural target-language phrasing.
- Requests phrased as commands or questions are interpreted for the listener, not answered by EjoChat.
- Prompt-injection-like content in the source does not change the interpreter role in defined tests.

**Dependencies:** M2 complete; representative multilingual examples and reviewer expectations available.

**Definition of done:** Automated contract tests and a documented manual evaluation set cover all contexts and core AI behavior; regressions are recorded and the handoff is updated.

## M4 — Conversation model and history

**Objective:** Support context-aware multi-turn interpretation using ephemeral conversation history.

**Implementation scope:** Define the turn/session model; store turns in browser/session state; display chronological history; send a bounded recent-history window; handle pending, succeeded, and failed turns; preserve history through recoverable request failures.

**Acceptance criteria:**

- Successful turns appear in order with clear language labels.
- Follow-up references can be resolved from relevant prior turns.
- History is bounded before it is sent upstream.
- Refresh/end-of-session behavior matches the documented ephemeral-storage policy.
- A failed request does not erase successful history.

**Dependencies:** M3 complete; history-window and session-lifetime decisions approved.

**Definition of done:** Model/unit tests and multi-turn integration tests pass, including the “moto to Kigali Heights” reference example; no database has been introduced.

## M5 — Two-way conversation and language switching

**Objective:** Enable two people sharing one device to alternate speaking languages fluidly.

**Implementation scope:** Add direction reversal; preserve context and history across reversal; distinguish speakers/directions visually; ensure new turns use the active direction.

**Acceptance criteria:**

- One action swaps source and target languages.
- Existing history and selected context remain intact after switching.
- The next request uses the swapped direction.
- Multiple alternating turns remain understandable on a mobile screen.

**Dependencies:** M4 complete.

**Definition of done:** Direction and alternating-conversation tests pass across representative language pairs; mobile shared-device flow is manually verified.

## M6 — Speech-to-text

**Objective:** Allow spoken input without compromising the typed-input core flow.

**Implementation scope:** Select and integrate an STT approach; handle microphone permission and recording/listening states; place recognized speech into editable input; support cancellation and failure; document language/browser support.

**Acceptance criteria:**

- Supported users can dictate and review/edit recognized text before submission.
- Permission denial, unsupported browsers, no-speech, and recognition failure show clear feedback.
- Typed input remains available before, during, and after speech failure.
- No recording begins without an explicit user action.

**Dependencies:** M5 complete; STT provider/browser API and privacy behavior selected; HTTPS-capable test environment where required.

**Definition of done:** Supported speech paths and every fallback path are tested; limitations are documented; text-only conversation remains fully functional.

## M7 — Kinyarwanda TTS integration

**Objective:** Add optional Kinyarwanda playback through the C4IR/KiNLP TTS API without delaying text.

**Implementation scope:** Confirm the TTS contract; add a secure server route; identify eligible Kinyarwanda output; add independent audio generation/playback states; handle slow, failed, malformed, and unavailable audio responses.

**Acceptance criteria:**

- Interpreted text appears before and independently of audio.
- Eligible Kinyarwanda text can be played through C4IR/KiNLP.
- TTS secrets, if any, remain server-side.
- TTS failure never blocks another turn, direction switching, or text use.

**Dependencies:** M6 complete; C4IR/KiNLP endpoint, credentials, payload, audio format, quotas, and usage terms confirmed.

**Definition of done:** TTS success, slow response, timeout, and failure tests pass; audio lifecycle has no known blocking or resource-leak issue; text fallback is verified.

## M8 — Error handling and resilience

**Objective:** Make core conversation behavior robust under expected user, browser, network, and provider failures.

**Implementation scope:** Standardize client/server error states; add timeouts, safe retry behavior, duplicate prevention, input limits, malformed-response handling, and state recovery; review logs for privacy and secret leakage.

**Acceptance criteria:**

- EjoChat, STT, TTS, timeout, offline/network, invalid-input, and malformed-response failures have clear outcomes.
- Retry cannot silently duplicate successful turns.
- Existing conversation history survives recoverable failures.
- Client-facing errors reveal no secrets or stack traces.

**Dependencies:** M2–M7 complete; provider failure contracts understood.

**Definition of done:** Failure-injection tests pass for all integration boundaries; high-risk issues are resolved or explicitly accepted and documented.

## M9 — Responsive UI polish

**Objective:** Deliver an accessible, legible, efficient interface optimized for two people sharing a phone.

**Implementation scope:** Refine hierarchy, spacing, touch targets, long-message handling, scrolling, focus behavior, accessibility semantics, visual direction cues, and responsive layouts.

**Acceptance criteria:**

- Core tasks work without horizontal overflow at agreed mobile widths.
- Controls are comfortably touchable and keyboard accessible.
- Long translations and multiple turns remain readable.
- Loading, failure, active direction, and playback status do not rely on color alone.

**Dependencies:** M8 complete; target viewport/browser matrix agreed.

**Definition of done:** Responsive and accessibility checks pass at the agreed support matrix; no critical usability issues remain in the demo flow.

## M10 — Full functional testing

**Objective:** Validate the complete MVP against the SRS and demo-critical scenarios.

**Implementation scope:** Run automated and manual suites across contexts, languages, reference resolution, bidirectional use, speech fallbacks, TTS fallbacks, API failures, responsive layouts, and security controls; record traceability and defects.

**Acceptance criteria:**

- Every applicable functional and non-functional requirement has test evidence.
- Critical end-to-end journeys pass.
- No open critical/high-severity defect blocks the demo.
- Known limitations and any untested language behavior are explicit.

**Dependencies:** M9 complete; test environment, mock fixtures, devices/browsers, and provider access available.

**Definition of done:** Test report is complete, required checks pass, defects are triaged, and the release candidate remains runnable.

## M11 — GitHub/Vercel production deployment

**Objective:** Publish a secure, reproducible production deployment through GitHub and Vercel.

**Implementation scope:** Prepare production configuration; verify Git hygiene; configure Vercel environment variables; deploy; validate server routes, HTTPS microphone behavior, headers, logs, and rollback/redeployment procedure.

**Acceptance criteria:**

- The production URL loads and the complete supported flow works.
- Provider credentials exist only in protected server environment configuration.
- No secret appears in repository history, client bundles, or exposed logs.
- Deployment and rollback/redeployment steps are documented.

**Dependencies:** M10 complete; explicit authorization to commit/push/deploy; GitHub repository, Vercel project, domains/access, and production credentials available.

**Definition of done:** Authorized source is published, production smoke tests pass, security checks pass, and deployment details are recorded in the handoff.

## M12 — Hackathon demo readiness

**Objective:** Make the product, narrative, and fallback plan reliable for a live hackathon demonstration.

**Implementation scope:** Define and rehearse a concise scenario; seed safe demo examples; verify devices, connectivity, credentials, provider quotas, and production health; prepare typed and text-only fallbacks; finalize limitations and presenter notes.

**Acceptance criteria:**

- The planned demo shows context, a history-dependent interpretation, direction switching, speech input, and optional Kinyarwanda audio.
- A text-only fallback can complete the core story if speech or TTS fails.
- The demo is rehearsed on the intended device and network conditions.
- Known limitations are accurately stated and no out-of-scope claim is made.

**Dependencies:** M11 complete; demo scenario, device, connectivity, presenter, and provider quota confirmed.

**Definition of done:** At least one timed end-to-end rehearsal and one fallback rehearsal succeed; final handoff contains the production URL, runbook, known issues, and ownership.

