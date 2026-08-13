# Kasuku AI Handoff

## Project name

Kasuku

## Current milestone

M5 — Two-way conversation and language switching

Status: implementation complete as of 2026-08-13. The 12-test suite, priority live English ↔ Kinyarwanda Transport flow, cleared-history check, and production build pass.

## Completed work

- Created the complete M0 documentation set.
- Locked the product name, category, purpose, MVP contexts, initial languages, core features, AI interpreter behavior, TTS provider, technical direction, quality requirements, exclusions, and milestone sequence.
- Defined numbered functional and non-functional requirements.
- Defined the client/server/provider architecture and failure isolation strategy.
- Added objective, implementation scope, acceptance criteria, dependencies, and definition of done for M0–M12.
- Defined testing coverage for selection, AI interpretation, history/reference resolution, two-way use, speech/TTS fallbacks, API failures, responsive layouts, accessibility, and secret handling.
- Did not initialize Next.js, install dependencies, implement application features, or create a commit.
- Added a Next.js 16 App Router JavaScript application foundation using normal CSS and no Tailwind.
- Built a static, mobile-first Kasuku interface with the required header, supporting text, five context choices, four-language source/target selectors, direction switch, empty conversation state, editable message input, Send control, and disabled microphone placeholder.
- Implemented only M1-permitted local interactions: context selection, language selection, language swapping, and typing.
- Added accessible labels, pressed states, focus treatment, readable responsive layouts, and reduced-motion handling.
- Added no API routes, provider calls, translation behavior, conversation history, speech recognition, TTS, authentication, database, or fake translations.
- Preserved all existing `project-docs` files and did not create a commit.
- Installed the declared dependencies and generated `package-lock.json` for reproducible npm installs.
- Completed a successful optimized production build; the home route is statically prerendered.
- Migrated the M1 App Router files from root `app/` to `src/app/` so the requested API route and UI use one valid application root.
- Added the server-only `POST /api/translate` Route Handler for EjoChat.
- Added request validation for message, supported languages, differing language direction, context, JSON shape, and a 2,000-character message limit.
- Added an interpreter prompt that preserves meaning, intent, tone, politeness, and real-world context; requests natural output only; and explicitly prevents chatbot answers.
- Added safe handling for missing configuration, upstream network/timeout failure, non-success responses, invalid JSON, and unexpected EjoChat response structure.
- Connected the Send form to `/api/translate` with loading, single-result, error, and duplicate-submission states.
- Added `.env.example`; no `.env.local` or secret was created or committed.
- Completed M3 context-aware interpretation without starting conversation history.
- Added a maintainable server-side context-profile map with distinct situations and vocabulary guidance for Transport, Restaurant / Food, Hotel / Accommodation, Shopping / Market, and General Conversation.
- Reworked the EjoChat request into a system interpreter contract plus a separate untrusted speaker message.
- Required natural, idiomatic interpretation that preserves complete meaning, intent, tone, politeness, and formality; uses context-appropriate vocabulary; never answers or acts on the message; and returns only what the other person should receive.
- Added Node contract tests for all five supplied context examples, interpreter-only behavior, prompt-injection resistance, and route-to-provider context forwarding.
- Completed M4 without starting automatic two-way switching, speech, TTS, persistence, cloud storage, or database work.
- Replaced the single interpretation result with an in-memory React conversation model containing successful chronological turns.
- Each turn tracks an ID, participant side, original text, interpreted text, source language, and target language.
- Added paired original/interpreted message bubbles with participant and language labels, plus a `New conversation` action that clears turns and the composer without reloading.
- Added a shared six-turn recent-history selector; the browser retains all successful turns for the loaded page but sends only the six newest turns to `/api/translate`.
- Added strict server validation for history shape, speaker side, text sizes, language direction, and the six-turn limit.
- Updated the EjoChat prompt to delimit previous conversation from the current message and use history only for reference resolution while retaining interpreter-only behavior.
- Completed M5 without starting speech recognition, TTS, native functionality, automatic speaker detection, background listening, wake-word behavior, persistence, or database work.
- Replaced generic participant sides with explicit `visitor` and `rwandan` identities throughout client state, history payloads, server validation, prompts, tests, and UI labels.
- Assigned one language to each participant and made source/target direction derived from the active speaker: Visitor defaults to English → Kinyarwanda, while Rwandan automatically becomes Kinyarwanda → English.
- Added an explicit two-button active-speaker control showing each side's direction and visible `Current turn`/`Tap to switch` status text.
- Preserved the same context and successful chronological history when speakers or participant languages change; the default and priority context remains Transport.
- Added turn guidance, role-specific composer labels, listener-specific Send copy, and role-positioned message bubbles for a phone shared by two people.
- Kept the M4 six-turn server-enforced history window unchanged across both directions.
- Strengthened the interpreter prompt to identify the current speaker/listener, resolve cross-turn references, and render indirect requests as natural direct communication.

## Files changed

- `project-docs/PRODUCT.md` — product vision, users, flows, scope, principles, and success criteria.
- `project-docs/SRS.md` — numbered functional and non-functional requirements, constraints, and open specifications.
- `project-docs/ARCHITECTURE.md` — logical architecture, boundaries, domain concepts, security, and resilience.
- `project-docs/DEVELOPMENT_PLAN.md` — milestone-by-milestone delivery contract from M0 through M12.
- `project-docs/TESTING.md` — test layers, coverage matrix, AI evaluation, security, and milestone gates.
- `project-docs/AI_HANDOFF.md` — current state and continuation instructions.
- `.gitignore` — ignores dependencies, Next.js output, environment secrets, logs, and Vercel state.
- `package.json` — Next.js/React dependencies, ESM package mode, and development, build, start, and test scripts.
- `next.config.mjs` — minimal strict-mode Next.js configuration.
- `jsconfig.json` — JavaScript project path alias configuration.
- `src/app/layout.js` — root App Router layout and Kasuku metadata, moved from `app/`.
- `src/app/page.js` — explicit Visitor/Rwandan state, participant language selectors, derived direction, active-speaker control, role-aware composer, and shared history rendering.
- `src/app/globals.css` — mobile-first speaker switch, visible turn state, role-distinguished bubbles, responsive composer, and participant language layout.
- `src/app/api/translate/route.js` — validates `visitor`/`rwandan` history and defaults omitted speaker identity to Visitor.
- `src/app/api/translate/prompt.js` — names the active speaker/listener and strengthens cross-direction reference and indirect-request handling.
- `src/lib/conversation.js` — explicit speaker identities/labels, direction derivation, other-speaker lookup, reducer, and unchanged six-turn selector.
- `test/interpretation-context.test.js` — M3–M5 prompt/route contracts, including mixed-direction Rwandan history forwarding.
- `test/conversation-model.test.js` — M4/M5 chronology, six-turn window, clear/failure behavior, automatic reversal, switch-back, and history-preservation tests.
- `.env.example` — documents the required `EJOCHAT_API_KEY` variable without a real secret.

## Architectural decisions

- Use Next.js with the App Router beginning at M1.
- Access EjoChat only through a Kasuku server-side API route.
- Keep all provider credentials in server-side environment configuration and out of client code and Git.
- Keep conversation history in browser/session state for the MVP; do not add a database.
- Treat typed interpretation as the core path.
- Treat speech-to-text as optional input with typing as the fallback.
- Use the C4IR/KiNLP API for optional Kinyarwanda TTS.
- Decouple TTS from interpretation so text appears immediately and audio failure cannot block conversation.
- Send selected context and a bounded recent-history window to EjoChat.
- Keep provider-specific payloads behind server adapters/routes.
- Preserve existing in-session history across recoverable upstream failures.
- Use JavaScript rather than TypeScript for the application.
- Use plain global CSS with no Tailwind or UI dependency.
- Keep the M1 screen as one focused App Router page; extract components only when later behavior justifies it.
- Use native buttons, selects, labels, and textarea controls for a small accessible dependency-free shell.
- Disable the microphone placeholder and keep Send without a submission handler so M1 cannot imply speech or translation behavior.
- Declare Next.js 16.3.0 with React/React DOM 19.2.8, based on versions returned by the npm registry on 2026-08-12.
- Use `src/app` as the sole App Router root.
- Send EjoChat an OpenAI-style `messages` array with durable interpreter rules in a `system` message and explicitly delimited previous-conversation/current-message sections in a separate `user` message.
- Return only the normalized `{ interpretation }` value to the browser; do not expose EjoChat payloads, statuses, or credentials.
- Use allowlists at the server boundary for the five contexts and four languages, independent of browser validation.
- Apply a 30-second upstream request timeout and map network and timeout errors to the same safe client response.
- Keep context-specific situations and vocabulary in one server-side profile map so a future context can be added without branching prompt logic.
- Use the same profile map for server validation and prompt construction so accepted contexts cannot silently lack guidance.
- Keep successful conversation turns only in React memory for the loaded page; refresh or `New conversation` ends the current ephemeral session, and no browser persistence or database is used.
- Retain every successful turn in the visible page history but send only the six newest turns to EjoChat; the server independently rejects larger history payloads.
- Append a turn only after a successful interpretation so an upstream or validation failure cannot erase or corrupt prior successful turns.
- Treat participant identity and participant language assignments as authoritative; never store an independently mutable source/target direction that could drift from the active speaker.
- Derive Visitor direction as Visitor language → Rwandan language and Rwandan direction as the exact reverse; switching back reproduces the original direction.
- Keep speaker changes explicit through the shared-phone control; do not infer or automatically detect who is speaking.
- Preserve context, participant languages, and all successful turns when switching speakers. Clear only the unsent draft/error during a switch so text cannot be submitted under the wrong speaker or language.
- `New conversation` clears history and resets the active turn to Visitor without changing Transport or the selected participant languages.

## Commands run

- Listed the repository and checked for repository instructions with PowerShell `Get-ChildItem`, `Test-Path`, and `Get-Content`.
- Verified all required document paths with PowerShell `Test-Path`.
- Counted numbered SRS requirements and required milestone fields with regular-expression checks.
- Checked for unexpected Next.js/framework manifests with PowerShell `Get-ChildItem`.
- Inspected uncommitted changes with `git status --short`.
- Read all five required M0 documents and the Next.js skill guidance.
- Checked runtime versions with `node --version` and `npm.cmd --version`; Node.js is v24.14.1, while the PowerShell `npm.ps1` shim is blocked by local execution policy, so `npm.cmd` was used.
- Queried current package versions with `npm.cmd view next version`, `npm.cmd view react version`, and `npm.cmd view react-dom version`.
- Attempted `npm.cmd install` multiple times, including longer timeouts, bounded fetch settings, non-login shell execution, and a clean temporary npm cache.
- Attempted `npm.cmd run build`; it failed because the timed-out install had not created the Next.js command shim.
- Attempted the installed Next.js CLI directly with `node node_modules\\next\\dist\\bin\\next build`; it stalled because the dependency tree remained incomplete.
- Ran `node --check app\\page.js`.
- Reran `npm.cmd run build` after the delayed dependency installation completed. The sandboxed run compiled successfully but hit Windows `spawn EPERM` during page-data collection; the approved escalated rerun completed successfully.
- Read the required M0/M1 project documents, Next.js skill, and Route Handler guidance.
- Searched Ejo Labs' public site for an official request-body contract; the public API-access page confirmed key provisioning but exposed no request schema.
- Checked `.env.local` ignore behavior with `git check-ignore` and scanned source references with `rg`.
- Ran `npm.cmd run build` after migrating to `src/app`; the final build registered `/` and `/api/translate` successfully.
- Started the production server locally on port 3100 and sent POST requests to validate invalid-body and missing-key behavior, then stopped it.
- Ran `npm.cmd test`; the initial sandboxed attempt hit Windows `spawn EPERM`, and the approved process-spawn rerun passed.
- Ran the M3 contract suite again after adding route-level provider mocking; all three tests passed without warnings.
- Ran `npm.cmd run build`; the optimized Next.js 16.3.0 production build passed and registered `/api/translate` as a dynamic route.
- Ran the five supplied M3 messages through the live `/api/translate` adapter using EjoChat; every request returned HTTP 200 with interpretation-only Kinyarwanda output.
- Moved the locally configured key from tracked `.env.example` to ignored `.env.local` after testing and restored the example placeholder.
- Ran `npm.cmd test` after the M4 model, prompt, route, and clear-state changes; all 10 tests passed.
- Ran the required live three-turn Transport conversation through the Route Handler with accumulated successful history; all three EjoChat calls returned HTTP 200.
- Sent “Ask him how much it will cost.” once more with an empty history array to verify the cleared-conversation request contains no prior context.
- Ran `npm.cmd run build`; Next.js 16.3.0 compiled and generated all routes successfully.
- Attempted browser-level verification using the prescribed browser-automation skill; its `agent-browser` CLI was unavailable in this environment, so no screenshot or browser interaction run was completed.
- Ran the M5 automated suite after replacing generic participant sides and adding derived directions; all 12 tests passed.
- Ran the priority live Transport exchange through EjoChat in both directions with accumulated shared history, then sent the contextual follow-up after switching back to Visitor; all requests returned HTTP 200.
- Ran the same follow-up with an empty history array after clear to verify the cleared request carried zero prior turns.
- Reran `npm.cmd run build`; Next.js compiled successfully and retained `/` plus dynamic `/api/translate`.

## Tests performed

- Confirmed the repository initially contained only `.git` and no repository-level `AGENTS.md` instructions.
- Confirmed all six required documents exist under `project-docs/`.
- Confirmed `SRS.md` contains 36 numbered functional requirements and 21 numbered non-functional requirements.
- Confirmed all 13 milestones (M0–M12) contain objective, implementation scope, acceptance criteria, dependencies, and definition of done.
- Confirmed no `package.json` or Next.js configuration file was created.
- Confirmed Git reports only the new untracked `project-docs/` directory; no commit was created.
- No application tests were run because application initialization and feature work are intentionally outside M0.
- JavaScript syntax check for `app/page.js`: passed.
- Scope review: confirmed no `app/api` route, API integration, database, authentication, translation, conversation-history, STT, or TTS implementation was added.
- Production build: passed with Next.js 16.3.0; `/` and `/_not-found` were statically generated.
- JavaScript syntax check for `app/page.js`: passed.
- Browser testing: not performed; visual review at mobile and desktop widths remains recommended.
- Secret hygiene: `.env.local` is ignored and the only client-visible key text is the placeholder in `.env.example`; the real environment variable is read only in the server Route Handler.
- Invalid request test: `POST /api/translate` with `{}` returned HTTP 400.
- Missing-key test: a valid request without `EJOCHAT_API_KEY` returned HTTP 503 without contacting EjoChat.
- Production build: passed with `/` statically generated and `/api/translate` registered as a dynamic server route.
- Live EjoChat context test: passed for all five supplied examples from English to Kinyarwanda; every request returned HTTP 200 and translated the speaker instead of answering them.
- M3 context set test: passed; the server profile map contains exactly the five MVP contexts and produces distinct situation guidance for each.
- Transport prompt case: passed with “I need a moto to Kigali Heights, but I need to stop at an ATM first.” and transport vocabulary covering motos, destinations, fares, and stops.
- Restaurant prompt case: passed with “Can you ask if this meal contains peanuts?” and food vocabulary covering dietary needs and ingredients.
- Hotel prompt case: passed with “Tell them I already made a reservation.” and accommodation vocabulary covering reservations, rooms, check-in, and guest requests.
- Shopping prompt case: passed with “Ask her if this is the final price.” and market vocabulary covering prices, bargaining, and purchase questions.
- General prompt case: passed with “Tell him I'll come back tomorrow morning.” and explicit guidance not to assume a specialized setting.
- Interpreter-role test: passed; questions, requests, commands, and prompt-injection-like source text remain content to interpret, while the contract forbids answering the speaker and permits only the other person's message as output.
- Route forwarding test: passed with a mocked EjoChat response; the selected Shopping / Market context and exact speaker text were present in the upstream `messages` payload, and the route returned only normalized interpretation text.
- Production build after M3: passed with `/` statically generated and `/api/translate` registered as a dynamic server route.
- M4 automated suite: 10/10 passed, covering chronological turn state, required fields, six-turn selection, failure preservation, clear behavior, participant-side inference, context prompt behavior, route history forwarding, prompt separation, and server rejection above six turns.
- Live Transport turn 1: “I need a moto to Kigali Heights.” → “Ndashaka moto ijya kuri Kigali Heights.”
- Live Transport turn 2 with turn 1 supplied as history: “Ask him how much it will cost.” → “Bizatwara angahe?”, interpreted as the trip-cost question rather than answered.
- Live Transport turn 3 with turns 1–2 supplied as history: “Tell him I need to stop at an ATM first.” → “Nkeneye guhagarara kuri ATM mbere.”
- Cleared-history check: the turn-2 message sent with zero prior turns returned the generic “Ni angahe?”, confirming the request did not retain the prior moto/trip context.
- Production build after M4: passed with `/` statically generated and `/api/translate` registered as a dynamic server route.
- M5 automated suite: 12/12 passed, including Visitor English → Kinyarwanda, Rwandan Kinyarwanda → English, switching back, unchanged shared history, mixed-direction route forwarding, clear behavior, and the six-turn limit.
- Live Visitor turn: “I need a moto to Nyabugogo, but I need to stop at an ATM first.” → “Ndashaka moto ijya i Nyabugogo, ariko nkeneye kubanza guhagarara kuri ATM.”
- Live Rwandan turn after switching: “Ni byiza, ariko guhagarara kuri ATM bishobora kongera igiciro.” → “Alright, but stopping at the ATM might increase the fare.”
- Live Visitor contextual follow-up after switching back with two prior turns: “Ask him how much that will cost.” → “Bizatwara angahe?”, a natural direct question to the driver rather than an answer or assistant response.
- Clear test: the follow-up request sent after clear contained zero history turns.
- Language/speaker switching test: the derived direction reversed and restored while the history selector returned the same chronological turns.
- M5 production build: passed with `/` statically generated and `/api/translate` registered as a dynamic server route.
- M5 scope check: no speech recognition, TTS, Android/native behavior, listening, wake word, speaker detection, database, or M6 implementation was added.

## Known issues

- The PowerShell execution policy blocks `npm.ps1`; use `npm.cmd` for npm commands on this machine.
- npm/Next.js commands were unusually slow in this OneDrive-hosted Windows workspace. A sandboxed build can fail with `spawn EPERM`; the same build succeeded with process-spawn permission.
- AI naturalness requires human multilingual evaluation in later milestones; it cannot be guaranteed by documentation alone.
- The microphone remains intentionally disabled; speech is out of scope until M6.
- Live M3 evaluation currently covers only English-to-Kinyarwanda. French, Swahili, reverse directions, and broader human multilingual review remain unverified.
- Ejo Labs' public pages did not expose the upstream request-body schema. The current endpoint accepted M3's OpenAI-style `system` and `user` messages and returned the documented `choices[0].message.content` shape in five live checks, but quotas and formal contract guarantees remain undocumented.
- Browser visual/interaction verification was not completed because the cataloged `agent-browser` CLI is not installed in this environment; the layout compiled successfully and model/API behavior is covered by automated tests.
- The M5 live priority flow covers Transport and English ↔ Kinyarwanda only. Other supported contexts and language pairs remain available but were not live-tested during M5.
- The final Kinyarwanda follow-up naturally omits English reporting language and explicit pronouns; broader bilingual human review is still recommended for nuanced reference resolution.

## Unresolved questions

1. Confirm EjoChat quotas, timeout guidance, formal request-contract guarantees, and all supported language pairs; the endpoint, authentication, message roles, and response content path work in the tested English-to-Kinyarwanda flow.
2. What are the C4IR/KiNLP TTS endpoint, authentication method, payload limits, audio format, quotas, latency expectations, and usage terms?
3. Which speech-to-text implementation will be used, and which browsers/languages must it support?
4. Is Kinyarwanda TTS user-triggered or automatic, and is it required whenever the target language is Kinyarwanda or merely offered?
5. What privacy notice/consent and content-retention statements are required when text or audio is sent to external providers?
6. What target browsers, devices, mobile viewport sizes, and accessibility conformance level define acceptance?
7. What input/history size limits, rate limits, and retry/timeout policies should the deployed MVP enforce beyond the M4 six-turn window?

## Exact next step

M6 Speech-to-text
