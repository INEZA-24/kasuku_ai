# Kasuku Software Requirements Specification

## 1. Purpose and scope

This specification defines the hackathon MVP for Kasuku, an AI-powered contextual interpreter for everyday communication between visitors and Rwandans. It covers the functional behavior, quality attributes, boundaries, and external dependencies of the product.

## 2. Definitions

- **Interpretation:** Natural rendering of a speaker's intended message in another language while preserving meaning, intent, tone, and politeness.
- **Conversation turn:** One source message and its interpreted result, with language direction and metadata.
- **Context:** The selected real-world interaction category supplied to EjoChat.
- **Direction:** The active source-language-to-target-language pairing.
- **EjoChat:** The core language-intelligence service used for contextual interpretation.
- **TTS:** Text-to-speech audio generation. The Kinyarwanda implementation uses the C4IR/KiNLP API.
- **STT:** Speech-to-text conversion of spoken input into editable text.

## 3. Functional requirements

### 3.1 Session setup

- **FR-001:** The system shall allow the user to select exactly one context from Transport, Restaurant / Food, Hotel / Accommodation, Shopping / Market, and General Conversation.
- **FR-002:** The system shall allow the user to select a source language from Kinyarwanda, English, French, and Swahili.
- **FR-003:** The system shall allow the user to select a target language from Kinyarwanda, English, French, and Swahili.
- **FR-004:** The system shall prevent or clearly reject a request in which source and target languages are identical.
- **FR-005:** The system shall retain the selected context and language direction for the active browser session unless the user changes them.

### 3.2 Text interpretation

- **FR-006:** The system shall accept a typed source message.
- **FR-007:** The system shall prevent submission of an empty or whitespace-only message.
- **FR-008:** The browser shall send interpretation requests only to a Kasuku server-side API route.
- **FR-009:** The server-side route shall send EjoChat the source text, source language, target language, selected context, and relevant recent conversation history.
- **FR-010:** The system shall display the interpreted text with its source and target language labels.
- **FR-011:** EjoChat shall interpret naturally rather than perform mechanical word-for-word translation.
- **FR-012:** EjoChat output shall preserve the source meaning, intent, tone, and politeness as closely as the target language permits.
- **FR-013:** EjoChat shall produce only what the speaker intends to communicate and shall not answer the speaker as a chatbot.
- **FR-014:** EjoChat shall use the selected communication context when resolving meaning and choosing phrasing.

### 3.3 Conversation continuity

- **FR-015:** The system shall maintain conversation turns in browser/session state for the active session.
- **FR-016:** The system shall display conversation history in chronological order.
- **FR-017:** Interpretation requests after the first turn shall include enough recent history to support conversational continuity.
- **FR-018:** EjoChat shall use recent history to resolve references such as people, places, objects, and actions mentioned in earlier turns.
- **FR-019:** The system shall allow the user to reverse the active source and target languages.
- **FR-020:** Reversing the direction shall preserve the active conversation history and selected context.
- **FR-021:** The system shall support alternating turns so two people can communicate in both directions on one device.

### 3.4 Speech input

- **FR-022:** The system shall offer speech-to-text input when supported by the chosen implementation and browser.
- **FR-023:** Recognized speech shall populate text input so the user can review or edit it before submission.
- **FR-024:** Typed input shall remain available at all times, including when microphone access is denied, unsupported, interrupted, or fails.
- **FR-025:** The system shall show an understandable status or error when speech recognition cannot be used.

### 3.5 Kinyarwanda text-to-speech

- **FR-026:** The system shall integrate the C4IR/KiNLP Kinyarwanda TTS API for eligible Kinyarwanda interpreted output.
- **FR-027:** Kinyarwanda TTS playback shall be optional and shall never block interpretation.
- **FR-028:** The system shall display interpreted text as soon as it is available without waiting for TTS generation or playback.
- **FR-029:** A slow, unavailable, or failed TTS request shall not remove the interpreted text, block direction switching, or prevent another turn.
- **FR-030:** The system shall provide a clear, non-blocking message when audio is unavailable.

### 3.6 Errors and session behavior

- **FR-031:** The system shall show a clear loading state while an interpretation request is pending.
- **FR-032:** The system shall prevent accidental duplicate submission while the same request is pending.
- **FR-033:** The system shall handle upstream and network errors without crashing or discarding existing history.
- **FR-034:** The system shall provide a retry path after a recoverable interpretation failure.
- **FR-035:** The system shall not require an account or persistent cloud storage for MVP use.
- **FR-036:** Conversation history shall not be assumed to persist after the browser session is cleared or ends.

## 4. Non-functional requirements

### 4.1 Security and privacy

- **NFR-001:** EjoChat, C4IR/KiNLP, and other service credentials shall exist only in server-side environment variables.
- **NFR-002:** Secrets shall never be included in client bundles, browser-readable responses, logs, fixtures, screenshots, or committed files.
- **NFR-003:** Secret-bearing local environment files shall be excluded from Git.
- **NFR-004:** Server routes shall validate and constrain request fields before calling an upstream service.
- **NFR-005:** Client-facing errors shall not reveal credentials, internal stack traces, or sensitive upstream details.
- **NFR-006:** The MVP shall store conversation history only in browser/session state and shall not add a database.

### 4.2 Usability and accessibility

- **NFR-007:** The primary conversation flow shall be usable on a mobile viewport by two people sharing one phone.
- **NFR-008:** Controls and messages shall remain readable and operable without relying on color alone.
- **NFR-009:** Interactive controls shall have accessible names, visible focus states, and keyboard operation where applicable.
- **NFR-010:** Status and error feedback shall be understandable and exposed accessibly to assistive technology.
- **NFR-011:** The interface shall clearly distinguish source text, interpreted text, speaker direction, and system status.

### 4.3 Reliability and performance

- **NFR-012:** Translation text rendering shall be independent of TTS latency or failure.
- **NFR-013:** Failure of optional speech features shall not prevent typed two-way conversation.
- **NFR-014:** Existing in-session history shall remain available after a failed API request whenever the page remains loaded.
- **NFR-015:** The system shall provide immediate visual acknowledgement of user submission.
- **NFR-016:** Each development milestone shall end with the project runnable and its completed behavior verifiable.

### 4.4 Maintainability and architecture

- **NFR-017:** The application shall use Next.js with the App Router.
- **NFR-018:** External AI and TTS integrations shall be isolated behind server-side API boundaries.
- **NFR-019:** Provider-specific request and response formats shall not leak into presentation components.
- **NFR-020:** Conversation and integration behavior shall be testable with provider calls mocked or stubbed.
- **NFR-021:** Documentation shall be updated when architectural or requirement decisions change.

## 5. Constraints and exclusions

The MVP requires no database and excludes authentication, accounts, payments, maps, admin tooling, persistent cloud history, analytics dashboards, medical/emergency interpretation, and unrelated AI features.

## 6. External dependencies and open specifications

- EjoChat API access, authentication, endpoint shape, model behavior, quotas, supported language pairs, and error contract require confirmation.
- C4IR/KiNLP Kinyarwanda TTS API access, authentication, accepted text format, audio format, quotas, and latency require confirmation.
- The speech-to-text provider or browser API and its language/browser coverage require selection.
- The exact recent-history window and retention semantics require definition during M3–M4.
- Privacy messaging and consent expectations for sending conversation text/audio to providers require definition before production deployment.

