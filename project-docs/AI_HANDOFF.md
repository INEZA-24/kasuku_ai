# Kasuku AI Handoff

## Project name

Kasuku

## Current milestone

M2 — Secure EjoChat server integration

Status: implementation complete as of 2026-08-12. Production build and local API validation pass. A live EjoChat request remains unverified because `EJOCHAT_API_KEY` is not available in `.env.local`.

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

## Files changed

- `project-docs/PRODUCT.md` — product vision, users, flows, scope, principles, and success criteria.
- `project-docs/SRS.md` — numbered functional and non-functional requirements, constraints, and open specifications.
- `project-docs/ARCHITECTURE.md` — logical architecture, boundaries, domain concepts, security, and resilience.
- `project-docs/DEVELOPMENT_PLAN.md` — milestone-by-milestone delivery contract from M0 through M12.
- `project-docs/TESTING.md` — test layers, coverage matrix, AI evaluation, security, and milestone gates.
- `project-docs/AI_HANDOFF.md` — current state and continuation instructions.
- `.gitignore` — ignores dependencies, Next.js output, environment secrets, logs, and Vercel state.
- `package.json` — Next.js/React dependencies and development, build, and start scripts.
- `next.config.mjs` — minimal strict-mode Next.js configuration.
- `jsconfig.json` — JavaScript project path alias configuration.
- `src/app/layout.js` — root App Router layout and Kasuku metadata, moved from `app/`.
- `src/app/page.js` — M1 interface plus M2 submission, loading, interpretation-result, and safe error states.
- `src/app/globals.css` — mobile-first styles plus M2 result, loading, and error presentation.
- `src/app/api/translate/route.js` — validated server-only EjoChat adapter.
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
- Send EjoChat an OpenAI-style `messages` array containing one carefully delimited interpreter prompt, consistent with the documented `choices[0].message.content` response shape.
- Return only the normalized `{ interpretation }` value to the browser; do not expose EjoChat payloads, statuses, or credentials.
- Use allowlists at the server boundary for the five contexts and four languages, independent of browser validation.
- Apply a 30-second upstream request timeout and map network and timeout errors to the same safe client response.
- Keep only one current M2 interpretation in UI state; conversation history remains deferred to M4.

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
- Live EjoChat success test: not run because no API key is available.

## Known issues

- The PowerShell execution policy blocks `npm.ps1`; use `npm.cmd` for npm commands on this machine.
- npm/Next.js commands were unusually slow in this OneDrive-hosted Windows workspace. A sandboxed build can fail with `spawn EPERM`; the same build succeeded with process-spawn permission.
- Live behavior and language-pair support have not been validated because provider contracts and credentials are not yet available.
- AI naturalness requires human multilingual evaluation in later milestones; it cannot be guaranteed by documentation alone.
- The microphone remains intentionally disabled; speech is out of scope until M6.
- No live EjoChat response has been verified. Add a real key only to `.env.local` and test before relying on the integration.
- Ejo Labs' public pages did not expose the upstream request-body schema. M2 uses an OpenAI-style `messages` payload inferred from the specified OpenAI-style response path; confirm this against tenant/API documentation during the live-key test.

## Unresolved questions

1. Confirm EjoChat's request-body schema, quotas, timeout guidance, and supported language pairs; the endpoint, `X-API-Key` authentication, and response content path are now defined.
2. What are the C4IR/KiNLP TTS endpoint, authentication method, payload limits, audio format, quotas, latency expectations, and usage terms?
3. Which speech-to-text implementation will be used, and which browsers/languages must it support?
4. What exact browser/session storage mechanism and session lifetime are intended for conversation history?
5. How many recent turns or tokens should be sent to EjoChat?
6. Is Kinyarwanda TTS user-triggered or automatic, and is it required whenever the target language is Kinyarwanda or merely offered?
7. What privacy notice/consent and content-retention statements are required when text or audio is sent to external providers?
8. What target browsers, devices, mobile viewport sizes, and accessibility conformance level define acceptance?
9. What input/history size limits, rate limits, and retry/timeout policies should the deployed MVP enforce?
10. Which Node.js version, package manager, styling approach, and test stack should M1 standardize?

## Exact next step

M3 — Context-aware interpretation. First add `EJOCHAT_API_KEY=<real key>` to the ignored `.env.local`, restart the local server, and verify one live M2 interpretation—including “How much will it cost?”—uses the confirmed EjoChat request schema and returns only a translated question. Then begin M3 prompt evaluation and contextual-behavior tests without adding conversation history, which remains M4.
