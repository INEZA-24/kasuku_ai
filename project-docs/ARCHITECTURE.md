# Kasuku Architecture

## 1. Architectural goals

The MVP architecture favors a small, secure, resilient Next.js application that can be demonstrated on a shared mobile device. It must keep provider credentials on the server, maintain conversation history without a database, and allow text conversation to remain functional when optional speech capabilities fail.

## 2. Locked technical direction

- Framework: Next.js
- Routing model: App Router
- EjoChat access: server-side API routes only
- Conversation persistence: browser/session state for the MVP
- Database: none for the MVP
- Speech fallback: typing
- TTS provider: C4IR/KiNLP Kinyarwanda TTS API
- TTS fallback: interpreted text
- Deployment target: GitHub and Vercel at M11

No Next.js project is initialized in M0.

## 3. Logical architecture

```text
┌──────────────────────────────── Browser ────────────────────────────────┐
│ Context/language controls                                               │
│ Text input + optional speech recognition                               │
│ Conversation UI + browser/session history                              │
│ Optional audio controls                                                 │
└───────────────┬───────────────────────────────┬─────────────────────────┘
                │ interpretation request        │ eligible TTS request
                ▼                               ▼
┌──────────────────────── Next.js server boundary ───────────────────────┐
│ Interpretation API route              Kinyarwanda TTS API route         │
│ - validate input                      - validate eligible text           │
│ - construct interpreter prompt        - call C4IR/KiNLP securely         │
│ - include bounded recent history      - normalize audio/error response  │
│ - call EjoChat securely                                                │
│ - normalize output/errors                                              │
└───────────────┬───────────────────────────────┬─────────────────────────┘
                ▼                               ▼
          EjoChat API                    C4IR/KiNLP TTS API
```

Speech-to-text may run through a browser capability or a server/provider integration; that decision is intentionally deferred until M6. In either design, recognized speech becomes editable text and typing remains available.

## 4. Responsibilities

### Browser application

- Present context and language selectors.
- Capture typed input and, when available, speech input.
- Keep the active conversation model in browser/session state.
- Render chronological turns and clear request states.
- Reverse source and target languages without losing conversation context.
- Display interpretation before initiating or completing TTS.
- Keep optional speech failures isolated from the core text flow.

### Interpretation API route

- Accept only the expected source text, source language, target language, context, and bounded history.
- Validate allowed contexts, supported languages, field sizes, and differing language direction.
- Construct an EjoChat instruction that enforces interpreter-only behavior.
- Supply recent history in a structured, unambiguous form.
- Keep credentials server-side.
- Normalize EjoChat output and map upstream failures to safe client errors.

### TTS API route

- Accept eligible Kinyarwanda text after interpretation is already available.
- Validate and constrain input.
- Call C4IR/KiNLP using server-held credentials if credentials are required.
- Return a browser-consumable audio result or safe non-blocking error.
- Avoid coupling audio success to conversation success.

## 5. Proposed domain model

The exact TypeScript representation is deferred to implementation, but the conceptual model is:

```text
ConversationSession
  context
  activeSourceLanguage
  activeTargetLanguage
  turns[]

ConversationTurn
  id
  sourceText
  interpretedText
  sourceLanguage
  targetLanguage
  status
  createdAt
  optional error metadata
  optional audio state/reference
```

History sent to EjoChat should contain only the fields needed for continuity. A bounded window protects latency, token use, and privacy. The precise boundary will be chosen and tested during M3–M4.

## 6. Interpretation contract

Each interpretation request conceptually contains:

- source text;
- source and target language identifiers;
- selected context; and
- an ordered, bounded set of recent conversation turns.

The server instruction must require EjoChat to:

- return only the message intended for the other participant;
- preserve meaning, intent, tone, and politeness;
- prefer natural target-language phrasing;
- use context and history to resolve references; and
- never answer or continue the subject matter as a chatbot.

The eventual response schema should be minimal and stable, separating successful interpreted text from normalized errors. Provider-specific payloads must remain behind the server boundary.

## 7. Asynchronous TTS flow

1. Submit an interpretation request.
2. Render interpreted text immediately on success.
3. If the result is eligible for Kinyarwanda TTS, offer or begin the separately defined audio action.
4. Update only the turn's audio state when TTS succeeds or fails.
5. Never block the next turn, direction switching, or text display on audio.

## 8. Security and privacy boundaries

- Only server routes read provider credentials.
- Public environment variables must never contain provider secrets.
- Request payloads are validated and size-limited before upstream calls.
- Logs should contain operational metadata, not full conversation bodies or secrets by default.
- Browser history is ephemeral; no database or cloud history is introduced for MVP.
- Error responses expose safe categories and retry guidance, not raw upstream payloads or stack traces.
- `.env*` secret files must be ignored by Git, with only a placeholder/example file considered later.

## 9. Resilience strategy

- Core path: typed text → interpretation → displayed text.
- Microphone failure degrades to typed text.
- TTS failure degrades to displayed text.
- EjoChat/network failure preserves existing history, marks the attempted turn safely, and allows retry.
- Duplicate submission is prevented while a request is active.
- Upstream timeouts and malformed responses are mapped to understandable errors.

## 10. Architecture decisions deferred to later milestones

- Exact EjoChat SDK/API contract and prompt/structured-output format (M2–M3)
- Conversation-history window and failed-turn representation (M3–M4)
- Speech-to-text implementation and supported-browser policy (M6)
- C4IR/KiNLP transport, audio caching/object URL lifecycle, and playback policy (M7)
- Rate limiting, timeout values, retry policy, and observability detail (M8)
- Hosting environment configuration and production headers (M11)

