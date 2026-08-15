# Kasuku AI Handoff

## Project name

Kasuku

## Current milestone

M7 — Kinyarwanda text-to-speech

Status: M7 plus the requested post-M7 conversation UX improvements are implemented as of 2026-08-15 and awaiting real-browser audio verification. All 49 automated tests and the production build pass. The participant direction control now sits inside the composer, Kinyarwanda audio prepares asynchronously without automatically playing, and all synthesis uses the fixed `Male` voice at speed `0.9`.

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
- Completed M6 with the browser `SpeechRecognition` API and `webkitSpeechRecognition` fallback; no paid/cloud STT provider, TTS, continuous listening, automatic turn detection, native service, background listening, or wake word was added.
- Enabled the microphone for the current Visitor or Rwandan and bound recognition to that participant's derived source language.
- Added maintainable explicit locale mapping for English (`en-US`) and Kinyarwanda (`rw-RW`); French and Swahili voice input fail visibly as unconfigured instead of silently substituting a locale.
- Added idle, listening, processing, error, and unavailable speech states, including a pulsing listening control, status feedback, configured-locale note, and visible `Cancel listening` action.
- Added transcript insertion into the existing editable composer. Recognized speech is never submitted automatically, so the participant can review or correct it before using the normal interpretation flow.
- Added lifecycle cleanup so switching participants, changing either participant language, clearing the conversation, starting another recognition attempt, or unmounting safely aborts the current short-lived recognition instance.
- Kept the textarea usable during speech errors and unavailable states, with plain-language feedback for permission denial, missing microphone, no speech, network failure, unsupported locale, and unexpected failure.
- Added no audio capture storage, audio files, audio uploads, or application-level recording retention.
- Returned speech recognition to stable M6 baseline for broad real-browser testing before selecting any further STT strategy.
- Removed all M6.1–M6.3 contextual phrase biasing, phrase boosts, `SpeechRecognitionPhrase`, `phrases-not-supported` retry logic, and experimental follow-on state machinery.
- Preserved the original browser `SpeechRecognition`/`webkitSpeechRecognition` architecture, `en-US` and `rw-RW` locales, editable non-auto-submitted transcripts, cancellation, participant switching, and typing fallback.
- Added a small Visitor-only microphone dialog that appears before every recording and offers normal English recognition, Kinyarwanda-prioritized recognition, or cancellation.
- Kept the Rwandan microphone direct: it starts immediately with `rw-RW` and does not show the Visitor dialog.
- Added outside-click and Escape dismissal, initial keyboard focus, mobile-friendly cream/bordered styling, and an explicit “Microphone recognition only” note for the Kinyarwanda option.
- Kept recognition mode ephemeral. The dialog appears for every Visitor recording, and selecting `rw-RW` never changes the Visitor language, translation direction, transcript, or interpretation request.
- Enabled `continuous` and `interimResults` on every recognition instance so normal conversational speech can span short pauses and update the editable textarea while the speaker continues.
- Added a per-session result-index accumulator that stores final and interim chunks separately, promotes interim text without duplication, and preserves every finalized phrase in order.
- Isolated every recording with a new session ID, fresh transcript accumulator, reset cancellation/error/completion flags, and stale-callback guards so completed or cancelled recordings cannot block or overwrite the next recording.
- Kept the existing draft-merge behavior intentionally: each recording owns a replaceable live transcript contribution, while a new recording starts from the textarea content that existed when its microphone session began.
- Removed no popup behavior and added no timer, automatic restart, background listening, provider, transcript correction, contextual phrase biasing, API, history, interpretation, TTS, or M7 work.
- Expanded only the server-side EjoChat interpreter contract to recognize natural Kinyarwanda mixed with English, French, or Swahili, including borrowed words, phonetic adaptations, Kinyarwanda prefixes/plurals, technical vocabulary, and local transport/place/business terms.
- Directed EjoChat to infer adapted vocabulary from the whole sentence, selected context, relevant recent history, and surrounding words, preferring well-supported intended meaning over literal word-for-word output.
- Added the supplied `amaseriveri ya Google arakomeye` semantic example so `amaseriveri` can be understood contextually as an adapted form of “servers.”
- Added a conservative evidence rule: weak phonetic resemblance cannot justify changing names, places, businesses, or technical terms; `Google is too far` must retain Google rather than become Nyabugogo.
- Reaffirmed that current text is raw source evidence, must not be rewritten or corrected, questions must be interpreted rather than answered, and output must contain only the target-language message.
- Installed the official `@gradio/client` package and inspected the public `Professor/c4ir-rw-kinyarwandatts` Space with `Client.connect()` and `client.view_api()` before implementing the provider call.
- Confirmed the named endpoint `/synthesize_audio` accepts `text` (string), `speaker_name` (`Female 1`, `Female 2`, or `Male`, default `Male`), and `speed` (number from 0.5 to 2.0, default `1`); it returns Audio `FileData` plus a Markdown timing string.
- Added independent `POST /api/tts` validation and server-only Gradio integration using fixed MVP defaults `Male` and `1.0`, with a 2,000-character limit and safe timeout/failure mapping.
- Kept provider file URLs out of the UI. The server resolves `result.data[0].url`, downloads the generated WAV, normalizes generic `application/octet-stream` to `audio/wav`, and returns only audio bytes to the browser.
- Added a small voice control only to interpretation bubbles whose target language is Kinyarwanda. Translation text renders first; a post-render effect starts TTS preparation without delaying or altering the successful turn.
- Added independent per-turn preparing, ready, playing/replay, and failed/retry states. An in-progress request can be awaited by Play without starting a duplicate generation, and audio never plays until the user explicitly presses the control.
- Cached successful audio per turn for replay, stopped other active turn audio before playback, and revoked object URLs when starting a new conversation or unmounting.
- Added friendly text-only fallback when generation or playback fails. No token or new environment variable is required by the currently public Space.
- Moved the only interactive Visitor/Rwandan control into the composer, directly above the textarea. Its left side is always the active source participant, its right side is the receiver, and its names, languages, and arrow derive from the existing active-speaker state.

## Files changed

- `project-docs/PRODUCT.md` — product vision, users, flows, scope, principles, and success criteria.
- `project-docs/SRS.md` — numbered functional and non-functional requirements, constraints, and open specifications.
- `project-docs/ARCHITECTURE.md` — logical architecture, boundaries, domain concepts, security, and resilience.
- `project-docs/DEVELOPMENT_PLAN.md` — milestone-by-milestone delivery contract from M0 through M12.
- `project-docs/TESTING.md` — test layers, coverage matrix, AI evaluation, security, and milestone gates.
- `project-docs/AI_HANDOFF.md` — current state and continuation instructions.
- `.gitignore` — ignores dependencies, Next.js output, environment secrets, logs, and Vercel state.
- `package.json` — Next.js/React dependencies, official `@gradio/client`, ESM package mode, and development, build, start, and test scripts.
- `package-lock.json` — reproducible dependency lock including `@gradio/client` 2.5.0.
- `next.config.mjs` — minimal strict-mode Next.js configuration.
- `jsconfig.json` — JavaScript project path alias configuration.
- `src/app/layout.js` — root App Router layout and Kasuku metadata, moved from `app/`.
- `src/app/page.js` — conversation/speech UI with the inline participant-direction control and Kinyarwanda-only background preparation plus Play/Replay/Retry controls.
- `src/app/globals.css` — mobile styles for the compact composer direction and message-level voice feedback.
- `src/app/api/tts/provider.js` — official Gradio client adapter for the inspected Space endpoint, fixed voice/speed defaults, provider timeouts, FileData URL resolution, and WAV download normalization.
- `src/app/api/tts/handler.js` — dependency-injectable `/api/tts` validation, binary response, and safe provider-error boundary.
- `src/app/api/tts/route.js` — independent App Router `POST /api/tts` route wiring.
- `src/app/api/translate/route.js` — validates `visitor`/`rwandan` history and defaults omitted speaker identity to Visitor.
- `src/app/api/translate/prompt.js` — names the active speaker/listener, handles cross-direction references, and adds conservative mixed-language/borrowed-word interpretation guidance without transcript rewriting.
- `src/lib/conversation.js` — explicit speaker identities/labels, participant-direction derivation, other-speaker lookup, reducer, and unchanged six-turn selector.
- `src/lib/speech-recognition.js` — locale and Visitor-mode definitions plus continuous recognition, indexed final/interim accumulation, transcript helpers, and disposable session lifecycle.
- `src/hooks/use-speech-recognition.js` — client-only lifecycle adapter with per-recording locale overrides, session IDs, stale-callback guards, normal-end cleanup, cancellation, and repeated-recording support.
- `src/hooks/use-tts-playback.js` — browser audio lifecycle adapter exposing separate background preparation and explicit playback with object-URL cleanup.
- `src/lib/tts-playback.js` — Kinyarwanda eligibility, `/api/tts` request, in-flight deduplication, per-turn caching, playback, and explicit retry manager.
- `test/interpretation-context.test.js` — M3–M5 contracts plus raw mixed-language forwarding, adapted technical semantics, and anti-guessing coverage for the supplied phrases.
- `test/conversation-model.test.js` — chronology/history coverage plus inline participant-direction derivation and composer-placement tests.
- `test/speech-recognition.test.js` — M6 locale/popup coverage plus continuous/interim configuration, ordered final accumulation, interim promotion, duplicate prevention, natural-pause, repeated-session, cancellation-recovery, and participant-switch recovery tests.
- `test/tts.test.js` — M7 provider/route coverage plus background preparation, deduplication, independent message caches, retry, replay, cleanup, and failure isolation.
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
- Keep one interactive participant control inside the composer and reorder its source/receiver display from that authoritative active-speaker state.
- Derive Visitor direction as Visitor language → Rwandan language and Rwandan direction as the exact reverse; switching back reproduces the original direction.
- Keep speaker changes explicit through the shared-phone control; do not infer or automatically detect who is speaking.
- Preserve context, participant languages, and all successful turns when switching speakers. Clear only the unsent draft/error during a switch so text cannot be submitted under the wrong speaker or language.
- `New conversation` clears history and resets the active turn to Visitor without changing Transport or the selected participant languages.
- Keep speech recognition browser-only and client-side. Kasuku creates one continuous recognition instance per user action, collects final and interim results until stop/end/error, and does not manage or retain raw audio.
- Map speech locales centrally by Kasuku language name. M6 maps only English to `en-US` and Kinyarwanda to `rw-RW`; an unmapped language disables voice with a typing fallback.
- Prefer `window.SpeechRecognition`, falling back only to `window.webkitSpeechRecognition` when the standard constructor is absent.
- Never auto-submit speech. Merge recognized text into the controlled textarea and preserve the existing manual Send action.
- Treat participant/language changes as recognition-session boundaries. Cancel first, then update the active side or locale so an old-language transcript cannot enter the new speaker's draft.
- Surface runtime rejection of `rw-RW` without substituting English or another locale; typed input and the rest of Kasuku remain available.
- Keep the stable M6 implementation free of contextual phrase biasing and post-recognition rewriting until broad real-browser testing informs any future STT strategy.
- Treat the Visitor choice as a one-recording Web Speech locale override only. Conversation direction continues to derive exclusively from active speaker plus participant languages, so optional `rw-RW` recognition cannot change English → Kinyarwanda interpretation.
- Define the Visitor choices in the speech library and pass only the selected recognition language into the existing hook; do not persist a mode or add an STT correction layer.
- Treat each microphone action as an isolated session. Reset transcript, final/interim, cancellation, failure, completion, and callback identity state before starting; invalidate old callbacks on cancel, participant/language change, clear, replacement, or unmount.
- Use `SpeechRecognitionEvent.resultIndex` and stable result indexes as accumulator keys. Repeated cumulative final results replace the same indexed segment, while current interim segments remain separate until promoted.
- Do not add an application timer or automatically restart after `onend`; continuous recognition lasts only as long as the browser session genuinely remains active and the user has not cancelled it.
- Handle borrowed and code-switched vocabulary as an interpretation concern in the server prompt, never as transcript mutation or post-STT correction.
- Permit semantic adaptation only when sentence structure, selected context, recent history, or surrounding vocabulary provides clear evidence; otherwise preserve the supplied term, name, and ambiguity.
- Keep `/api/translate` and `/api/tts` independent. A successful interpretation appends its turn immediately; TTS state never participates in conversation success or history.
- Use only Kinyarwanda interpretation targets for M7 eligibility. English, French, and Swahili target bubbles have no Listen control.
- Use the live-inspected Gradio `/synthesize_audio` contract with Kasuku's fixed `{ text, speaker_name: "Male", speed: 0.9 }` MVP payload; do not expose provider identifiers, voice, speed, or file URLs to presentation code.
- Cache generated audio only in browser memory for the active page and revoke every object URL during reset/unmount; add no audio persistence or database.
- Prepare eligible audio only after the translated turn renders, never auto-play it, and never prepare audio for an English target.
- Allow explicit retry after failure and cached replay after success, but suppress duplicate requests while a turn is preparing and never retry automatically.

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
- Ran `npm.cmd test` after M6 implementation and cancellation hardening; all 22 tests passed.
- Ran `npm.cmd run build`; the optimized Next.js 16.3.0 build passed with `/` and `/api/translate` intact.
- Checked for the cataloged `agent-browser` CLI; it is not installed in this environment.
- Attempted a non-recording headless Chrome capability probe for the Web Speech constructor and `rw-RW` configuration. Chrome returned no usable DOM result in both default and isolated-profile attempts, so the runtime capability result is recorded as inconclusive rather than supported.
- Compared all M6.1–M6.3 speech files against `HEAD` and restored the pre-M6.1 implementations without reverting unrelated project work.
- Ran `npm.cmd test` after restoring the stable M6 baseline; all 22 original tests passed.
- Ran `npm.cmd run build`; the optimized Next.js 16.3.0 production build passed with `/` static and `/api/translate` dynamic.
- Ran `npm.cmd test` after adding the Visitor speech-mode chooser; all 26 tests passed.
- Ran `npm.cmd run build` after the speech UX update; the optimized Next.js 16.3.0 production build passed with `/` static and `/api/translate` dynamic.
- Ran `npm.cmd test` after the continuous-session reliability implementation; all 31 tests passed.
- Ran `npm.cmd run build` after the reliability implementation; the optimized Next.js 16.3.0 production build passed with `/` static and `/api/translate` dynamic.
- Ran `npm.cmd test` after the mixed-language prompt update; all 34 tests passed.
- Ran `npm.cmd run build` after the interpretation-intelligence update; the optimized Next.js 16.3.0 production build passed with `/` static and `/api/translate` dynamic.
- Installed `@gradio/client` 2.5.0 with `npm.cmd install @gradio/client`; npm reported zero vulnerabilities.
- Connected to `Professor/c4ir-rw-kinyarwandatts` with the official client and ran `client.view_api()`; discovered `/get_random_sentence` and `/synthesize_audio`, with no unnamed endpoints.
- Called `/synthesize_audio` live with `{ text: "Muraho", speaker_name: "Male", speed: 1 }`; the Space returned Gradio FileData for `audio.wav` plus generation timing Markdown.
- Ran `npm.cmd test` after M7 verification; all 43 tests passed.
- Ran `npm.cmd run build`; the optimized Next.js 16.3.0 build passed and registered dynamic `/api/translate` and `/api/tts` routes.
- Ran a live request through Kasuku's own TTS handler with `Muraho`; it returned HTTP 200, `audio/wav`, and 38,444 audio bytes.

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
- M6 automated suite: 22/22 passed, including all prior conversation/interpretation tests and 10 speech-recognition cases.
- English transcript test: a mocked `en-US` browser session recognized “I need to go to Nyabugogo but I need to stop at an ATM first.” and placed it in the editable draft; the submission count remained zero.
- Kinyarwanda configuration test: the Rwandan session requested exactly `rw-RW` and delivered a mocked Kinyarwanda transcript to the draft callback without locale substitution.
- Permission-denied test: normalized to a short microphone-denied message; no transcript was inserted and manual draft editing continued.
- Recognition-unavailable test: standard constructor selection, WebKit fallback selection, and missing-constructor behavior passed.
- Cancel test: abort was called, state returned to idle, and a late transcript was ignored.
- Speaker-switch test: the active `en-US` session was aborted before a new `rw-RW` session started.
- Clear-conversation microphone test: recognition was cancelled/disposed and a fresh session worked afterward.
- Manual text fallback test: draft text remained editable and accepted more typing after a simulated speech error.
- M6 production build: passed; `/` remains static and `/api/translate` remains dynamic.
- Original M6 scope check: no TTS, background listening, auto-submit, automatic speaker/turn detection, Android/native functionality, wake word, database, or M7 implementation was added.
- Stable M6 rollback verification: source, hook, page integration, styles, and speech tests match the pre-M6.1 `HEAD` versions.
- Experimental-code scan: no contextual phrase, boost, `SpeechRecognitionPhrase`, `phrases-not-supported`, hint-builder, or retry symbol remains under `src/` or `test/`.
- Stable M6 automated suite: 22/22 passed, including M4/M5 history/direction coverage and M6 locale, transcript, non-submission, permission, cancellation, participant-switch, clear/reuse, error, and typing-fallback coverage.
- Stable M6 production build: passed; `/` remains static and `/api/translate` remains dynamic.
- Visitor normal-mode test: passed; the selection resolves to English recognition and creates an `en-US` browser session.
- Visitor Kinyarwanda-mode test: passed; the selection creates an `rw-RW` browser session while conversation direction remains English → Kinyarwanda.
- Visitor cancel test: passed; cancellation resolves to no recognition language and creates no browser recognition session.
- Rwandan direct-mode test: passed; the Rwandan side bypasses the chooser and creates an `rw-RW` session.
- Existing editable-transcript, non-auto-submit, permission, cancellation, participant-switch, clear/reuse, error, M4 history, M5 direction, and interpretation-route tests remain passing; total suite 26/26.
- Production build after the speech UX update: passed; `/` remains static and `/api/translate` remains dynamic.
- Continuous configuration test: passed; every recognition instance uses `continuous = true`, `interimResults = true`, and no application timeout.
- Multi-final tests: passed for one, two, and three final chunks across separate result events and natural pauses; all text remains ordered.
- Interim promotion test: passed; updated interim wording replaces the prior interim and is promoted to final without duplicated words.
- Repeated cumulative-results test: passed; replayed previously final indexes replace stored segments rather than appending duplicates.
- Repeated-recording test: passed; recording one ends, recording two starts with isolated state, and both independently deliver textarea transcripts.
- Recovery tests: passed after cancellation, participant switching, and clearing the conversation; stale/late events cannot populate the next session.
- Interim-only normal-end test: passed; the latest usable transcript already shown in the textarea remains when the browser ends before marking it final.
- Full automated suite after the reliability update: 31/31 passed, including unchanged popup locales, translation direction, M4 history, M5 switching, and interpretation-route coverage.
- Production build after the reliability update: passed; `/` remains static and `/api/translate` remains dynamic.
- Mixed-language prompt test: passed for Kinyarwanda combined with English, French, and local terms; every supplied current message remains byte-for-byte unchanged inside the prompt message content apart from the existing outer trim boundary.
- Adapted technical-word test: passed; the prompt explicitly connects `amaseriveri` with the context-supported “servers” meaning and preserves Google as the owner.
- Vocabulary cases covered: `ndashaka moto`, `server ya website ntabwo ikora`, `ndashaka kujya kuri ATM mbere`, and `ndashaka charger ya telefone avant kujya i Remera`.
- Anti-guessing test: passed; the prompt requires evidence, preserves names/uncertainty, and explicitly forbids changing `Google is too far` into Nyabugogo.
- Interpreter-role coverage remains passing: questions are translated rather than answered, and output is restricted to the target-language message without explanations or alternatives.
- Full automated suite after the interpretation prompt update: 34/34 passed, including unchanged speech reliability, popup locales, M4 history, M5 direction, and route forwarding.
- Production build after the interpretation prompt update: passed; `/` remains static and `/api/translate` remains dynamic.
- Live API schema test: `/synthesize_audio` requires `text`; supports `speaker_name` values `Female 1`, `Female 2`, and `Male`; supports `speed` 0.5–2.0; and returns Audio FileData plus Markdown.
- Kinyarwanda eligibility tests: target Kinyarwanda exposes TTS behavior; target English does not.
- Provider mapping test: passed for the discovered endpoint and exact fixed `{ text, speaker_name: "Male", speed: 0.9 }` payload.
- Non-blocking tests: translation objects remain unchanged during loading and failure; duplicate loading clicks do not create a second request.
- Playback tests: successful audio calls `play()`, completion enables cached replay without regeneration, and cleanup revokes the object URL.
- Validation tests: malformed JSON, empty text, and text above 2,000 characters return HTTP 400 without calling the provider.
- Provider failure test: returns HTTP 502 with the safe voice-unavailable message and no provider details.
- Live Kasuku TTS route smoke test: passed with HTTP 200, normalized `audio/wav`, and 38,444 bytes for `Muraho`.
- TTS/interpretation separation test: passed; a failed audio request cannot mutate the successful turn, interpreted text, or conversation-history array.
- Full automated M7 suite: 43/43 passed; production build passed with `/api/tts` dynamic and translation behavior unchanged.

## Post-M7 inline direction and background-audio update

Files changed for this update:

- `src/app/page.js` — moved the participant switch into the composer, derived the displayed source/receiver order from the existing active speaker, and starts eligible TTS preparation in a post-render effect.
- `src/app/globals.css` — removed the former top speaker-panel styles and added compact mobile-first composer-direction styling.
- `src/lib/conversation.js` — added a pure participant-direction descriptor derived from active participant and the existing language-direction function.
- `src/hooks/use-tts-playback.js` — exposes background preparation separately from explicit playback.
- `src/lib/tts-playback.js` — supports preparing, ready, playing, and failed per-turn states; per-turn in-flight promise deduplication; cached playback; explicit retry; and cleanup.
- `test/conversation-model.test.js` — covers both displayed directions, composer placement, removal of the old primary switch, and the single active-speaker state.
- `test/tts.test.js` — covers background preparation, translation isolation while pending, request deduplication, per-message caches, Play/Replay, English-target exclusion, and retry.
- `project-docs/AI_HANDOFF.md` — records this implementation and verification.

Architecture decisions:

- Keep the existing active speaker as the only participant authority. The composer control reorders the source and receiver around one arrow without storing another speaker or translation-direction state.
- Begin Kinyarwanda TTS in a client effect only after the successful translated turn has rendered. Translation never awaits audio, and preparation never plays audio.
- Key prepared audio, active requests, and playback state by conversation turn ID. A Play click during preparation awaits the same promise; ready audio is replayed from its cached object URL.
- Automatic failure is terminal for that attempt. Only an explicit Retry starts another request, and English-target turns never enter the preparation path.
- Both background preparation and manual retry use the same server provider adapter, which fixes the MVP voice to `Male` and speed to `0.9`; no UI speed setting is exposed.

Tests performed:

- Inline direction tests passed for Visitor → Rwandan / English → Kinyarwanda and Rwandan → Visitor / Kinyarwanda → English.
- The prior top participant switch is absent; the only interactive participant control appears inside the composer before the textarea.
- Existing Visitor recognition-choice, direct Rwandan `rw-RW`, and participant-switch cancellation tests remain passing.
- Background audio starts exactly one request per eligible message, leaves interpretation/history unchanged while pending or failed, and never auto-plays.
- Multiple Kinyarwanda turns retain independent audio objects; cached Play/Replay does not regenerate; English targets produce no request; explicit retry works after failure.
- Provider payload regression passed for `speaker_name: "Male"` and `speed: 0.9`; background preparation and retry both reach this single server-side default.
- `npm.cmd test`: 49/49 passed.
- `npm.cmd run build`: passed with `/` static and `/api/translate` plus `/api/tts` dynamic.

Remaining browser verification:

- Confirm the compact control stays visible and easy to tap on the target phone width.
- Confirm background Space wake-up latency, immediate cached Play, and explicit retry behavior under real network conditions.
- Some browsers may reject playback when Play was pressed before preparation finished and user activation expires while awaiting the network. Kasuku keeps the ready audio and permits another explicit Play.

## Known issues

- The PowerShell execution policy blocks `npm.ps1`; use `npm.cmd` for npm commands on this machine.
- npm/Next.js commands were unusually slow in this OneDrive-hosted Windows workspace. A sandboxed build can fail with `spawn EPERM`; the same build succeeded with process-spawn permission.
- AI naturalness requires human multilingual evaluation in later milestones; it cannot be guaranteed by documentation alone.
- Live M3 evaluation currently covers only English-to-Kinyarwanda. French, Swahili, reverse directions, and broader human multilingual review remain unverified.
- Ejo Labs' public pages did not expose the upstream request-body schema. The current endpoint accepted M3's OpenAI-style `system` and `user` messages and returned the documented `choices[0].message.content` shape in five live checks, but quotas and formal contract guarantees remain undocumented.
- Browser visual/interaction verification was not completed because the cataloged `agent-browser` CLI is not installed in this environment; the layout compiled successfully and model/API behavior is covered by automated tests.
- The M5 live priority flow covers Transport and English ↔ Kinyarwanda only. Other supported contexts and language pairs remain available but were not live-tested during M5.
- The final Kinyarwanda follow-up naturally omits English reporting language and explicit pronouns; broader bilingual human review is still recommended for nuanced reference resolution.
- Real English microphone capture and recognition accuracy were not testable because this environment lacks interactive browser automation and a controllable microphone input. The browser adapter and transcript-to-draft path are verified with mocks.
- Real Kinyarwanda recognition support is unverified. Kasuku requests `rw-RW` exactly, but browser/OS/vendor support varies and the installed headless Chrome probe was inconclusive; rejection is shown as an error with typing preserved.
- Browser speech recognition may require user permission, a working microphone, a secure/localhost origin, network connectivity, and browser/vendor recognition services.
- French and Swahili remain available for typed interpretation but deliberately have no M6 speech locale mapping; voice input shows unavailable for those selections.
- `SpeechRecognition` does not expose a reliable locale-support enumeration API, so accepting `recognition.lang = "rw-RW"` would not by itself prove that the runtime can recognize Kinyarwanda.
- The stable M6 baseline provides no contextual vocabulary biasing. Mixed-language words and Rwandan place-name accuracy depend entirely on the browser/OS recognition model and must be assessed through broad real-browser testing.
- Selecting “Better Kinyarwanda recognition” asks the browser for `rw-RW`; it changes recognition priority only, does not guarantee mixed-language or place-name accuracy, and may still be rejected by some browsers.
- `continuous = true` allows multiple results but does not force every browser/vendor service to keep a session open indefinitely; a browser may still emit a genuine `onend` after silence or service-side limits. Kasuku preserves collected text and allows a clean new recording instead of auto-restarting.
- Prompt rules improve EjoChat's chances of understanding mixed and adapted vocabulary but cannot guarantee every ambiguous local spelling; conservative preservation is intentional when context is insufficient.
- The public Hugging Face Space may sleep, queue, change schema, become unavailable, or impose undocumented quotas. M7 uses a bounded request, no automatic retry, and the interpreted text fallback.
- Some browsers may reject `audio.play()` after asynchronous generation under autoplay policy. Kasuku retains the generated audio and shows “Voice is ready. Tap Listen again to play it” so a second explicit click can start playback.

## Unresolved questions

1. Confirm EjoChat quotas, timeout guidance, formal request-contract guarantees, and all supported language pairs; the endpoint, authentication, message roles, and response content path work in the tested English-to-Kinyarwanda flow.
2. Confirm the public Space's production usage terms, quotas, concurrency limits, uptime expectations, and whether anonymous access will remain available for the demo.
3. What privacy notice/consent and content-retention statements are required when text or audio is sent to external providers?
4. What target browsers, devices, mobile viewport sizes, and accessibility conformance level define acceptance?
5. What input/history size limits, rate limits, and retry/timeout policies should the deployed MVP enforce beyond the M4 six-turn window?

## Exact next step

M8 Error handling and resilience
