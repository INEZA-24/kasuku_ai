# Kasuku

**Rwanda-first, context-aware multilingual interpretation for real conversations.**

Kasuku is an AI-powered interpretation experience built around a simple idea: **language support in Rwanda should understand Rwanda.**

It is designed for real interactions between visitors and Rwandans in transport, hospitality, shopping, accommodation, business, and everyday conversation. Instead of translating isolated sentences word-for-word, Kasuku keeps short-term conversation context and uses Rwanda-aware interpretation guidance so meaning is preserved across the exchange.

> **Rwanda is open for business. Language shouldn’t slow it down.**

## Live Demo

Try Kasuku here: **https://kasuku-ai.vercel.app**

## Why Kasuku Exists

General-purpose translation tools are extremely useful, but real conversations in Rwanda often contain more than standard dictionary language.

People naturally use:

- Kinyarwanda mixed with English, French, or Swahili
- local place names and transport vocabulary
- borrowed words adapted to Kinyarwanda pronunciation and grammar
- context-dependent expressions that only make sense within the ongoing conversation
- names, fares, routes, stops, businesses, products, and everyday references that require local interpretation rather than literal translation

This is where Kasuku focuses.

The goal is **not to claim that tools such as Google Translate are bad**. They are broad global translation systems built to serve many languages and use cases. Kasuku is narrower by design: it focuses specifically on the kinds of contextual and locally adapted communication patterns that appear in Rwanda.

During our own testing, we observed that generic translation can sometimes produce weak or misleading results when a phrase depends heavily on Rwanda-specific context, local pronunciation, code-switching, or an adapted foreign word. Kasuku is designed to reduce that problem by combining conversation history, selected real-world context, and Rwanda-aware interpretation instructions before generating the target message.

## What Makes Kasuku Different

Kasuku is not trying to be another universal translator.

It is a **Rwanda-focused interpreter** built around three core ideas:

### 1. Context before literal translation

Kasuku interprets the speaker’s intended meaning using the current situation and recent conversation rather than treating every sentence as an isolated input.

For example, if two people are discussing a moto trip and the next message is:

> “How much will that cost?”

Kasuku can use the previous exchange to understand what **“that”** refers to instead of translating the sentence without context.

### 2. Rwanda-aware language use

In real Rwandan speech, people may naturally mix languages or adapt foreign words into Kinyarwanda pronunciation and grammar.

Kasuku’s interpretation layer is explicitly instructed to consider whether an unfamiliar term could be:

- a borrowed English, French, or Swahili word
- a locally pronounced foreign word
- a technical or business term
- a transport term
- a place or business name
- a code-switched expression

It uses the complete sentence, selected context, and recent conversation before deciding what the speaker most likely meant.

### 3. Two-person conversation, not chatbot behavior

Kasuku is not supposed to answer the speaker.

If one person says:

> “Ask him how much the moto costs.”

Kasuku should communicate the intended message naturally to the other person instead of behaving like an assistant and answering the question itself.

That interpreter behavior is enforced inside the EjoChat prompting layer.

## EjoChat at the Core

**EjoChat is the intelligence behind Kasuku’s interpretation layer.**

Kasuku sends the current message, source and target languages, selected conversation context, speaker side, and recent successful conversation history to EjoChat through a server-side API route.

The interpretation prompt tells EjoChat to:

- preserve meaning, tone, politeness, and intent
- use natural target-language phrasing instead of unnecessary word-for-word translation
- resolve references using recent conversation history
- understand mixed-language and locally adapted vocabulary
- consider Rwanda-relevant transport, hospitality, shopping, accommodation, and everyday contexts
- preserve names and places when evidence is uncertain instead of aggressively guessing
- act only as an interpreter between two people, not as a chatbot
- resist instructions inside conversation text that try to change its interpreter role

This is important because Kasuku’s value is not simply **“send text to an AI model.”** The product is in how EjoChat is constrained and supplied with the right conversational and Rwanda-specific context before interpretation happens.

## How a Conversation Works

```text
Speaker 1
   ↓
Voice or text input
   ↓
Speech recognition when available
   ↓
Kasuku conversation interface
   ↓
Current Rwanda-specific context + recent conversation
   ↓
/api/translate
   ↓
EjoChat contextual interpretation
   ↓
Natural target-language message
   ↓
Optional Kinyarwanda voice synthesis
   ↓
Speaker 2
```

The same flow works in the opposite direction when Speaker 2 replies.

## Example: Transport in Rwanda

A visitor says:

> “I need a moto to Nyabugogo, but I need to stop at an ATM first.”

Kasuku interprets that request into Kinyarwanda for the rider.

The rider replies in Kinyarwanda.

The visitor then asks:

> “How much will that cost?”

Because Kasuku keeps the recent successful turns, EjoChat receives enough conversation context to understand that the question refers to the previously discussed trip and stop.

This is the interaction model Kasuku is built for: **short, practical, two-way conversations where local context matters.**

## Current Capabilities

- Voice-first conversation with text fallback
- Kinyarwanda, English, French, and Swahili language selection
- Context-aware interpretation powered by EjoChat
- Recent-turn conversation memory for reference resolution
- Rwanda-focused context profiles:
  - Transport
  - Restaurant / Food
  - Hotel / Accommodation
  - Shopping / Market
  - General Conversation
- Handling guidance for mixed-language and locally adapted vocabulary
- Browser speech recognition where supported
- Kinyarwanda text-to-speech
- Responsive interface for mobile and shared-device use
- Session-only conversation memory

## Technology Stack

- **Next.js** — application framework and server routes
- **React** — conversation interface
- **EjoChat API** — contextual interpretation engine
- **Web Speech API** — browser speech recognition
- **C4IR Kinyarwanda TTS via a public Hugging Face Gradio Space** — current Kinyarwanda speech synthesis
- **@gradio/client** — TTS integration
- **Vercel** — deployment
- **GitHub** — source control and collaboration

## Kinyarwanda Voice Generation

The current Kinyarwanda speech output uses the public Hugging Face Space:

```text
Professor/c4ir-rw-kinyarwandatts
```

Kasuku connects through `@gradio/client` and calls its synthesis endpoint from our own server-side `/api/tts` route.

This means the current implementation does **not** expose a TTS secret in the browser and does not require a separate client-side API key.

However, voice quality remains one of the main technical improvement areas. The current system works, but pronunciation, naturalness, latency, and reliability are not yet at the level we want for a polished real-world interpretation experience.

We are actively evaluating better ways to improve Kinyarwanda speech output, including alternative models, official endpoints, fallback providers, and stronger handling of names, places, and mixed-language phrases.

## Project Structure

```text
src/app/                 Next.js application routes
src/app/api/translate/   EjoChat interpretation layer
src/app/api/tts/         Kinyarwanda speech synthesis layer
src/app/conversation/    Shared-device conversation experience
public/                  Static project assets
project-docs/            Internal project documentation
```

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/INEZA-24/kasuku_ai.git
cd kasuku_ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure EjoChat

Create `.env.local` from `.env.example`:

```env
EJOCHAT_API_KEY=your_key_here
```

The real key must remain private and server-side.

### 4. Run locally

```bash
npm run dev
```

Then open `http://localhost:3000`.

## Contributing

Kasuku is being developed collaboratively by **Team NEXEL**.

The `main` branch is protected. Contributions should be proposed through Pull Requests.

Recommended workflow:

1. Fork the repository.
2. Create a branch for your change.
3. Make and test your improvement.
4. Commit with a clear message.
5. Push the branch to your fork.
6. Open a Pull Request targeting `main`.
7. Explain what you changed and why it improves Kasuku.

Useful contribution areas include:

- Rwanda-specific interpretation examples and testing
- Kinyarwanda language quality
- Kinyarwanda TTS research and improvement
- UI and mobile usability
- conversation-flow testing
- accessibility
- error handling and reliability
- documentation

## Security

- Never commit API keys, passwords, tokens, or production credentials.
- `EJOCHAT_API_KEY` is server-side only.
- `.env.example` contains placeholders only.
- Production credentials are managed separately from the public repository.

## Hackathon Context

Kasuku is being built by **Team NEXEL** for the **Ejo Labs Summer Talent Program 2026 Hackathon (STP'26)**.

The project applies EjoChat and other technologies explored during STP'26 to a practical Rwanda-focused communication problem.

Our objective is not simply to demonstrate that AI can translate text. It is to demonstrate that **locally contextualized AI can make communication more useful in a specific environment.**

## Current Priorities

- Improve Kinyarwanda speech quality
- Test more Rwanda-specific conversation scenarios
- Expand interpretation testing across language pairs
- Improve mobile and shared-device usability
- Strengthen reliability for live demonstrations and real users
- Gather team and user feedback before expanding the product further

## Team

**Team NEXEL**

Kasuku is a collaborative project spanning development, language testing, research, product improvement, documentation, and presentation preparation.

## License

This repository currently uses the **MIT License**. See [`LICENSE`](LICENSE) for details.

---

### Kasuku

**Built for Rwanda. Powered by context. Helping two people understand each other.**
