"use client";

import { useId, useState } from "react";

const contexts = [
  { name: "Transport", icon: "↗" },
  { name: "Restaurant / Food", icon: "◇" },
  { name: "Hotel / Accommodation", icon: "⌂" },
  { name: "Shopping / Market", icon: "▢" },
  { name: "General Conversation", icon: "○" },
];

const languages = ["English", "Kinyarwanda", "French", "Swahili"];

function MicrophoneIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="21" height="21">
      <path
        d="M12 15.25a3.5 3.5 0 0 0 3.5-3.5v-5a3.5 3.5 0 1 0-7 0v5a3.5 3.5 0 0 0 3.5 3.5Zm6-3.75v.5a6 6 0 0 1-12 0v-.5M12 18v3m-3 0h6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export default function Home() {
  const sourceId = useId();
  const targetId = useId();
  const messageId = useId();
  const [context, setContext] = useState("Transport");
  const [sourceLanguage, setSourceLanguage] = useState("English");
  const [targetLanguage, setTargetLanguage] = useState("Kinyarwanda");
  const [message, setMessage] = useState("");
  const [interpretation, setInterpretation] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function swapLanguages() {
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
  }

  async function submitMessage(event) {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      setError("Enter a message to interpret.");
      return;
    }

    if (sourceLanguage === targetLanguage) {
      setError("Choose two different languages.");
      return;
    }

    setIsLoading(true);
    setError("");
    setInterpretation("");

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmedMessage,
          sourceLanguage,
          targetLanguage,
          context,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Interpretation failed. Please try again.");
      }

      if (typeof data?.interpretation !== "string") {
        throw new Error("Interpretation failed. Please try again.");
      }

      setInterpretation(data.interpretation);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Interpretation failed. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="site-header">
        <div className="brand-row">
          <span className="brand-mark" aria-hidden="true">
            K
          </span>
          <p className="brand-name">KASUKU</p>
        </div>
        <h1>Speak naturally.<br />Understand clearly.</h1>
        <p className="intro-copy">
          AI-powered contextual interpreter for everyday conversations.
        </p>
      </header>

      <section className="setup-section" aria-labelledby="context-heading">
        <div className="section-heading">
          <p className="eyebrow">01</p>
          <div>
            <h2 id="context-heading">Choose the moment</h2>
            <p>Context helps keep the conversation natural.</p>
          </div>
        </div>

        <div className="context-list" role="group" aria-label="Conversation context">
          {contexts.map((item) => {
            const isActive = context === item.name;
            return (
              <button
                className="context-option"
                data-active={isActive}
                key={item.name}
                type="button"
                aria-pressed={isActive}
                onClick={() => setContext(item.name)}
              >
                <span className="context-icon" aria-hidden="true">{item.icon}</span>
                <span>{item.name}</span>
                <span className="selection-dot" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </section>

      <section className="language-section" aria-labelledby="language-heading">
        <div className="section-heading">
          <p className="eyebrow">02</p>
          <div>
            <h2 id="language-heading">Set the languages</h2>
            <p>Choose who is speaking and who is listening.</p>
          </div>
        </div>

        <div className="language-controls">
          <div className="select-field">
            <label htmlFor={sourceId}>Source language</label>
            <select
              id={sourceId}
              value={sourceLanguage}
              onChange={(event) => setSourceLanguage(event.target.value)}
            >
              {languages.map((language) => (
                <option key={language}>{language}</option>
              ))}
            </select>
          </div>

          <button
            className="swap-button"
            type="button"
            aria-label={`Switch languages: ${sourceLanguage} to target and ${targetLanguage} to source`}
            onClick={swapLanguages}
          >
            <span aria-hidden="true">⇄</span>
          </button>

          <div className="select-field">
            <label htmlFor={targetId}>Target language</label>
            <select
              id={targetId}
              value={targetLanguage}
              onChange={(event) => setTargetLanguage(event.target.value)}
            >
              {languages.map((language) => (
                <option key={language}>{language}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="conversation-section" aria-labelledby="conversation-heading">
        <div className="conversation-topbar">
          <div>
            <p className="eyebrow">03</p>
            <h2 id="conversation-heading">Conversation</h2>
          </div>
          <p className="direction-label">
            <span>{sourceLanguage}</span>
            <span aria-hidden="true">→</span>
            <span>{targetLanguage}</span>
          </p>
        </div>

        <div className="conversation-canvas" aria-live="polite" aria-busy={isLoading}>
          {isLoading ? (
            <div className="status-state">
              <span className="loading-indicator" aria-hidden="true" />
              <h3>Interpreting your message</h3>
              <p>Keeping the meaning and tone natural.</p>
            </div>
          ) : interpretation ? (
            <article className="interpretation-result">
              <p className="result-label">Interpretation · {targetLanguage}</p>
              <p className="result-text">{interpretation}</p>
            </article>
          ) : (
            <div className="empty-state">
              <span className="empty-symbol" aria-hidden="true">“</span>
              <h3>Your conversation starts here</h3>
              <p>Type a message below. Kasuku will help both people understand each other.</p>
            </div>
          )}
        </div>

        <form className="composer" onSubmit={submitMessage}>
          <label htmlFor={messageId}>Message in {sourceLanguage}</label>
          <div className="input-row">
            <textarea
              id={messageId}
              rows="2"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={`Type in ${sourceLanguage}…`}
              maxLength="2000"
              disabled={isLoading}
            />
            <button
              className="microphone-button"
              type="button"
              aria-label="Voice input coming in a later milestone"
              title="Voice input coming soon"
              disabled
            >
              <MicrophoneIcon />
            </button>
          </div>
          {error ? <p className="error-message" role="alert">{error}</p> : null}
          <div className="composer-footer">
            <p>Kasuku interprets your words for the other person.</p>
            <button
              className="send-button"
              type="submit"
              disabled={!message.trim() || isLoading || sourceLanguage === targetLanguage}
            >
              {isLoading ? "Interpreting…" : "Send"}
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </form>
      </section>

      <footer>
        <p>Built for conversations across Rwanda.</p>
        <p className="session-note"><span aria-hidden="true">●</span> Private session</p>
      </footer>
    </main>
  );
}
