# Kasuku

**Context-aware multilingual interpretation for real conversations in Rwanda.**

Kasuku is a voice-first AI interpretation experience designed to help two people communicate naturally across language barriers using a shared device. Instead of translating isolated sentences word-for-word, Kasuku keeps short-term conversation context so each reply can be interpreted with the meaning of the ongoing exchange in mind.

> Rwanda is open for business. Language shouldn’t slow it down.

## Live Demo

Try Kasuku here: **https://kasuku-ai.vercel.app**

## Why Kasuku

Everyday conversations in transport, hospitality, shopping, accommodation, and business can break down when people do not share the same language. Traditional translators often handle one sentence at a time and can lose the context that makes a real conversation understandable.

Kasuku is built around a simpler interaction:

1. Speaker 1 speaks.
2. Kasuku interprets the message for Speaker 2.
3. Speaker 2 replies.
4. The conversation continues with context preserved for the current session.

## Current Capabilities

- Voice-first conversation with text input as a fallback
- Context-aware interpretation using recent successful conversation turns
- Support for **Kinyarwanda, English, French, and Swahili**
- Conversation contexts including:
  - Transport
  - Restaurant / Food
  - Hotel / Accommodation
  - Shopping / Market
  - General conversation
- Browser-based speech recognition where supported
- Kinyarwanda speech synthesis
- Responsive interface designed for mobile and shared-device use
- Session-only conversation memory for privacy and simplicity

## Example Use Case

A traveler can tell a moto driver:

> “I need a moto to Nyabugogo, but I need to stop at an ATM first.”

Kasuku interprets the request into Kinyarwanda. The driver can reply in Kinyarwanda, and Kasuku interprets the response back into English while retaining the context of the trip.

## Technology

Kasuku is built with:

- **Next.js** — application framework
- **React** — interface and interaction layer
- **EjoChat API** — contextual interpretation
- **Web Speech API** — browser speech recognition
- **Gradio Client + Kinyarwanda TTS service** — speech synthesis
- **Vercel** — deployment
- **GitHub** — source control and collaboration

## Architecture

```text
Speaker 1
   ↓
Speech Recognition / Text Input
   ↓
Kasuku Conversation Interface
   ↓
/api/translate
   ↓
EjoChat
   ↓
Interpreted message
   ↓
Optional /api/tts
   ↓
Speaker 2
```

The same flow works in the opposite direction for Speaker 2.

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

### 3. Configure environment variables

Create a `.env.local` file based on `.env.example`:

```env
EJOCHAT_API_KEY=your_key_here
```

Keep real API keys private. Never commit `.env.local` or production credentials to GitHub.

### 4. Run locally

```bash
npm run dev
```

Then open `http://localhost:3000` in your browser.

## Development Commands

```bash
npm run dev
npm run build
npm run start
npm test
```

## Project Structure

```text
src/app/                 Next.js application routes
src/app/api/translate/   EjoChat interpretation endpoint
src/app/api/tts/         Kinyarwanda speech endpoint
src/app/conversation/    Main interpreter experience
public/                  Static project assets
project-docs/            Internal project documentation
```

## Known Improvement Area

### Kinyarwanda Text-to-Speech

The current Kinyarwanda voice pipeline works, but pronunciation, naturalness, latency, and reliability can still be improved. This is an active area for experimentation before the final project submission.

Potential improvements include:

- evaluating alternative Kinyarwanda TTS models or services
- comparing pronunciation quality across voices
- reducing synthesis latency
- adding a fallback speech provider
- improving handling of names, locations, and mixed-language phrases

## Contributing

Contributions and improvement suggestions are welcome.

The `main` branch is protected. Please do not attempt to push changes directly to it.

Recommended workflow:

1. Fork this repository.
2. Create a branch for your change.
3. Make and test your changes.
4. Commit them with a clear message.
5. Push the branch to your fork.
6. Open a Pull Request targeting `main`.
7. Describe what you changed and why.

If you are new to GitHub, small improvements are welcome too — documentation fixes, UI refinements, bug reports, accessibility improvements, and translation feedback all help.

## Security

- Never commit API keys, passwords, tokens, or other secrets.
- The EjoChat API key is used only on the server side.
- Public environment examples must contain placeholders only.
- Production credentials are managed separately from the repository.

If you discover a security issue, avoid publishing sensitive exploit details in a public issue. Contact the project maintainers directly instead.

## Hackathon

Kasuku is being developed by **Team NEXEL** for the **Ejo Labs Summer Talent Program 2026 Hackathon (STP'26)**.

The project focuses on applying AI to a practical communication challenge in Rwanda while demonstrating responsible API usage, product design, collaboration, and real-world impact.

## Roadmap

- Improve Kinyarwanda text-to-speech quality
- Expand real-world conversation testing
- Improve interpretation reliability across supported languages
- Refine mobile and shared-device interaction
- Add stronger fallback behavior for unsupported browser speech features
- Continue usability testing with real scenarios

## Team

**Team NEXEL**

Kasuku is a collaborative hackathon project. Team members contribute across product development, testing, research, documentation, and presentation preparation.

## License

This repository currently uses the **MIT License**. See [`LICENSE`](LICENSE) for details.

---

**Kasuku — helping two people understand each other.**