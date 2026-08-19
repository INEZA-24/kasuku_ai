"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import styles from "./kasuku-phrase-assistant.module.css";

function getConversationContext() {
  const activeContext = document.querySelector(
    '.context-option[data-active="true"]',
  );

  return activeContext?.textContent?.trim() || "General Conversation";
}

function getSourceLanguage() {
  const label = document.querySelector(".composer > label");
  const match = label?.textContent?.match(/message in (English|Kinyarwanda|French|Swahili)/);

  return match?.[1] || "English";
}

function setControlledTextareaValue(textarea, value) {
  const descriptor = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    "value",
  );

  descriptor?.set?.call(textarea, value);
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  textarea.focus();
}

export default function KasukuPhraseAssistant() {
  const [inputRow, setInputRow] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [roughMessage, setRoughMessage] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [copyLabel, setCopyLabel] = useState("Copy");
  const dialogRef = useRef(null);

  useEffect(() => {
    setInputRow(document.querySelector(".composer .input-row"));
  }, []);

  useEffect(() => {
    const canvas = document.querySelector(".conversation-canvas");

    if (!canvas) {
      return undefined;
    }

    let previousTurnCount = canvas.querySelectorAll(".conversation-turn").length;

    const observer = new MutationObserver(() => {
      const turns = canvas.querySelectorAll(".conversation-turn");

      if (turns.length <= previousTurnCount) {
        previousTurnCount = turns.length;
        return;
      }

      previousTurnCount = turns.length;
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      window.requestAnimationFrame(() => {
        canvas.scrollTo({
          top: canvas.scrollHeight,
          behavior: reduceMotion ? "auto" : "smooth",
        });
      });
    });

    observer.observe(canvas, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    dialogRef.current?.focus();

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  async function generateSuggestion(event) {
    event.preventDefault();

    const trimmed = roughMessage.trim();

    if (!trimmed) {
      setMessage("Tell Kasuku what you are trying to say first.");
      return;
    }

    setStatus("loading");
    setMessage("");
    setSuggestion("");
    setCopyLabel("Copy");

    try {
      const response = await fetch("/api/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          sourceLanguage: getSourceLanguage(),
          context: getConversationContext(),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Kasuku could not phrase that message.");
      }

      setSuggestion(data.suggestion);
      setStatus("ready");
    } catch (error) {
      setStatus("error");
      setMessage(error?.message || "Kasuku could not phrase that message.");
    }
  }

  function useInTextBox() {
    const textarea = document.querySelector(".composer textarea");

    if (!textarea || !suggestion) {
      return;
    }

    setControlledTextareaValue(textarea, suggestion);
    setIsOpen(false);
  }

  async function copySuggestion() {
    if (!suggestion) {
      return;
    }

    try {
      await navigator.clipboard.writeText(suggestion);
      setCopyLabel("Copied");
    } catch {
      setMessage("Copy is unavailable in this browser. You can still use the text box button.");
    }
  }

  const launcher = inputRow
    ? createPortal(
        <button
          className={styles.launcher}
          type="button"
          aria-label="Ask Kasuku to help phrase this message"
          title="Help me phrase this"
          data-tour-target="assistant"
          onClick={() => {
            const currentText = document.querySelector(".composer textarea")?.value ?? "";
            setRoughMessage(currentText);
            setSuggestion("");
            setMessage("");
            setStatus("idle");
            setCopyLabel("Copy");
            setIsOpen(true);
          }}
        >
          <Image src="/kasuku.png" alt="" width={28} height={28} />
        </button>,
        inputRow,
      )
    : null;

  const dialog = isOpen
    ? createPortal(
        <div
          className={styles.backdrop}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <section
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="kasuku-assistant-title"
            ref={dialogRef}
            tabIndex={-1}
          >
            <div className={styles.headingRow}>
              <div className={styles.identity}>
                <Image src="/kasuku.png" alt="" width={42} height={42} />
                <div>
                  <p>Kasuku assistant</p>
                  <h2 id="kasuku-assistant-title">Help me phrase this</h2>
                </div>
              </div>
              <button
                className={styles.closeButton}
                type="button"
                aria-label="Close Kasuku assistant"
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
            </div>

            <p className={styles.helperText}>
              Speech recognition can vary by browser, device, and pronunciation.
              Tell Kasuku what you mean in your own words. You can mix languages
              and include Kinyarwanda names or local terms.
            </p>

            <form onSubmit={generateSuggestion}>
              <label className={styles.label} htmlFor="kasuku-rough-message">
                What are you trying to say?
              </label>
              <textarea
                id="kasuku-rough-message"
                className={styles.textarea}
                rows="4"
                maxLength="2000"
                value={roughMessage}
                onChange={(event) => setRoughMessage(event.target.value)}
                placeholder="Example: I want kubwira moto driver ko njya Nyabugogo but first I need an ATM..."
                disabled={status === "loading"}
              />
              <button
                className={styles.generateButton}
                type="submit"
                disabled={!roughMessage.trim() || status === "loading"}
              >
                {status === "loading" ? "Phrasing…" : "Ask Kasuku"}
              </button>
            </form>

            {suggestion ? (
              <div className={styles.suggestionCard} aria-live="polite">
                <p className={styles.suggestionLabel}>Kasuku suggests</p>
                <p className={styles.suggestionText}>{suggestion}</p>
                <div className={styles.actions}>
                  <button
                    className={styles.primaryAction}
                    type="button"
                    onClick={useInTextBox}
                  >
                    Use in text box
                  </button>
                  <button
                    className={styles.secondaryAction}
                    type="button"
                    onClick={() => void copySuggestion()}
                  >
                    {copyLabel}
                  </button>
                </div>
                <p className={styles.reviewNote}>
                  Review or edit the message before interpreting it.
                </p>
              </div>
            ) : null}

            {message ? (
              <p className={styles.feedback} role={status === "error" ? "alert" : "status"}>
                {message}
              </p>
            ) : null}
          </section>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      {launcher}
      {dialog}
    </>
  );
}
