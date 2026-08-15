"use client";

import {
  useCallback,
  useEffect,
  useId,
  useReducer,
  useRef,
  useState,
} from "react";

import { useSpeechRecognition } from "../hooks/use-speech-recognition.js";
import { useTtsPlayback } from "../hooks/use-tts-playback.js";

import {
  conversationReducer,
  getLanguageDirection,
  getOtherSpeaker,
  selectRecentHistory,
  SPEAKER_LABELS,
} from "../lib/conversation.js";
import {
  getVisitorSpeechRecognitionLanguage,
  mergeSpeechTranscript,
  shouldShowVisitorSpeechChoice,
  VISITOR_SPEECH_RECOGNITION_OPTIONS,
} from "../lib/speech-recognition.js";
import { isKinyarwandaTtsEligible } from "../lib/tts-playback.js";

const contexts = [
  { name: "Transport", icon: "↗" },
  { name: "Restaurant / Food", icon: "◇" },
  { name: "Hotel / Accommodation", icon: "⌂" },
  { name: "Shopping / Market", icon: "▢" },
  { name: "General Conversation", icon: "○" },
];

const languages = ["English", "Kinyarwanda", "French", "Swahili"];
const speakerSides = ["visitor", "rwandan"];

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

function SpeakerIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17">
      <path
        d="M5 10v4h3l4 3V7l-4 3H5Zm10.5-.8a4 4 0 0 1 0 5.6m2-7.6a7 7 0 0 1 0 9.6"
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
  const visitorLanguageId = useId();
  const rwandanLanguageId = useId();
  const messageId = useId();
  const speechChoiceTitleId = useId();
  const firstSpeechChoiceRef = useRef(null);
  const speechDraftBaseRef = useRef("");
  const [context, setContext] = useState("Transport");
  const [visitorLanguage, setVisitorLanguage] = useState("English");
  const [rwandanLanguage, setRwandanLanguage] = useState("Kinyarwanda");
  const [activeSpeaker, setActiveSpeaker] = useState("visitor");
  const [message, setMessage] = useState("");
  const [turns, dispatchConversation] = useReducer(conversationReducer, []);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeechChoiceOpen, setIsSpeechChoiceOpen] = useState(false);
  const { sourceLanguage, targetLanguage } = getLanguageDirection(
    activeSpeaker,
    visitorLanguage,
    rwandanLanguage,
  );
  const listenerSide = getOtherSpeaker(activeSpeaker);
  const activeSpeakerLabel = SPEAKER_LABELS[activeSpeaker];
  const listenerLabel = SPEAKER_LABELS[listenerSide];
  const addSpeechTranscript = useCallback((transcript) => {
    setMessage(mergeSpeechTranscript(speechDraftBaseRef.current, transcript));
  }, []);
  const {
    status: speechStatus,
    message: speechMessage,
    locale: speechLocale,
    startListening,
    cancelListening,
    clearSpeechMessage,
  } = useSpeechRecognition({
    language: sourceLanguage,
    onTranscript: addSpeechTranscript,
  });
  const { clearAllAudio, getPlaybackState, listenToTurn } = useTtsPlayback();
  const isSpeechActive =
    speechStatus === "listening" || speechStatus === "processing";

  function beginSpeechRecognition(recognitionLanguage) {
    speechDraftBaseRef.current = message;
    startListening(recognitionLanguage);
  }

  useEffect(() => {
    if (!isSpeechChoiceOpen) {
      return undefined;
    }

    firstSpeechChoiceRef.current?.focus();

    function closeOnEscape(event) {
      if (event.key === "Escape") {
        setIsSpeechChoiceOpen(false);
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isSpeechChoiceOpen]);

  function handleMicrophoneClick() {
    if (isSpeechActive) {
      cancelListening();
      return;
    }

    if (shouldShowVisitorSpeechChoice(activeSpeaker)) {
      setIsSpeechChoiceOpen(true);
      return;
    }

    beginSpeechRecognition();
  }

  function startVisitorRecognition(optionId) {
    const recognitionLanguage =
      getVisitorSpeechRecognitionLanguage(optionId);

    setIsSpeechChoiceOpen(false);

    if (recognitionLanguage) {
      beginSpeechRecognition(recognitionLanguage);
    }
  }

  function changeParticipantLanguage(participant, language) {
    setIsSpeechChoiceOpen(false);
    cancelListening();

    if (participant === "visitor") {
      setVisitorLanguage(language);
    } else {
      setRwandanLanguage(language);
    }
  }

  function changeActiveSpeaker(speakerSide) {
    if (speakerSide === activeSpeaker) {
      return;
    }

    setIsSpeechChoiceOpen(false);
    cancelListening();
    setActiveSpeaker(speakerSide);
    setMessage("");
    setError("");
  }

  function startNewConversation() {
    setIsSpeechChoiceOpen(false);
    cancelListening();
    clearAllAudio();
    dispatchConversation({ type: "clear" });
    setActiveSpeaker("visitor");
    setMessage("");
    setError("");
    clearSpeechMessage();
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

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmedMessage,
          sourceLanguage,
          targetLanguage,
          context,
          speakerSide: activeSpeaker,
          history: selectRecentHistory(turns),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Interpretation failed. Please try again.");
      }

      if (typeof data?.interpretation !== "string") {
        throw new Error("Interpretation failed. Please try again.");
      }

      dispatchConversation({
        type: "add",
        turn: {
          id: globalThis.crypto.randomUUID(),
          speakerSide: activeSpeaker,
          originalText: trimmedMessage,
          interpretedText: data.interpretation.trim(),
          sourceLanguage,
          targetLanguage,
        },
      });
      setMessage("");
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
                disabled={isLoading}
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
            <p>Choose the language each person uses.</p>
          </div>
        </div>

        <div className="language-controls participant-languages">
          <div className="select-field">
            <label htmlFor={visitorLanguageId}>Visitor language</label>
            <select
              id={visitorLanguageId}
              value={visitorLanguage}
              onChange={(event) =>
                changeParticipantLanguage("visitor", event.target.value)
              }
              disabled={isLoading}
            >
              {languages.map((language) => (
                <option key={language}>{language}</option>
              ))}
            </select>
          </div>

          <div className="select-field">
            <label htmlFor={rwandanLanguageId}>Rwandan language</label>
            <select
              id={rwandanLanguageId}
              value={rwandanLanguage}
              onChange={(event) =>
                changeParticipantLanguage("rwandan", event.target.value)
              }
              disabled={isLoading}
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
          <div className="conversation-actions">
            <p className="direction-label">
              <span>{sourceLanguage}</span>
              <span aria-hidden="true">→</span>
              <span>{targetLanguage}</span>
            </p>
            <button
              className="clear-button"
              type="button"
              onClick={startNewConversation}
              disabled={!turns.length || isLoading}
            >
              New conversation
            </button>
          </div>
        </div>

        <div className="speaker-panel">
          <div className="speaker-panel-copy">
            <p className="speaker-panel-label">Whose turn is it?</p>
            <p>
              <strong>{activeSpeakerLabel}</strong>, use {sourceLanguage}. Kasuku
              will interpret into {targetLanguage} for the {listenerLabel}.
            </p>
          </div>
          <div className="speaker-switch" role="group" aria-label="Active speaker">
            {speakerSides.map((speakerSide) => {
              const direction = getLanguageDirection(
                speakerSide,
                visitorLanguage,
                rwandanLanguage,
              );
              const isActive = activeSpeaker === speakerSide;

              return (
                <button
                  type="button"
                  key={speakerSide}
                  data-active={isActive}
                  aria-pressed={isActive}
                  onClick={() => changeActiveSpeaker(speakerSide)}
                  disabled={isLoading}
                >
                  <span className="speaker-name">{SPEAKER_LABELS[speakerSide]}</span>
                  <span className="speaker-direction">
                    {direction.sourceLanguage} → {direction.targetLanguage}
                  </span>
                  <span className="speaker-status">
                    {isActive ? "Current turn" : "Tap to switch"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="conversation-canvas" aria-live="polite" aria-busy={isLoading}>
          {turns.length ? (
            <ol className="conversation-history" aria-label="Conversation history">
              {turns.map((turn) => {
                const turnSpeakerLabel = SPEAKER_LABELS[turn.speakerSide];
                const turnListenerLabel =
                  SPEAKER_LABELS[getOtherSpeaker(turn.speakerSide)];
                const ttsState = getPlaybackState(turn.id);
                const canListen = isKinyarwandaTtsEligible(turn);
                const isPreparingVoice = ttsState.status === "loading";
                const listenLabel = isPreparingVoice
                  ? "Preparing voice..."
                  : ttsState.status === "playing"
                    ? "Playing..."
                    : ttsState.status === "ready"
                      ? "Replay"
                      : ttsState.status === "error"
                        ? "Try voice again"
                        : "Listen";

                return (
                  <li
                    className="conversation-turn"
                    data-speaker-side={turn.speakerSide}
                    key={turn.id}
                  >
                    <article>
                      <div className="message-bubble original-message">
                        <p className="message-label">
                          {turnSpeakerLabel} · {turn.sourceLanguage}
                        </p>
                        <p className="message-text">{turn.originalText}</p>
                      </div>
                      <div className="message-bubble interpreted-message">
                        <p className="message-label">
                          For {turnListenerLabel} · {turn.targetLanguage}
                        </p>
                        <p className="message-text interpreted-text">
                          {turn.interpretedText}
                        </p>
                        {canListen ? (
                          <div className="tts-actions">
                            <button
                              className="listen-button"
                              type="button"
                              onClick={() => listenToTurn(turn)}
                              disabled={isPreparingVoice}
                              aria-label={`${listenLabel} to the Kinyarwanda interpretation`}
                            >
                              <SpeakerIcon />
                              <span>{listenLabel}</span>
                            </button>
                            {ttsState.message ? (
                              <p
                                className="tts-message"
                                role={
                                  ttsState.status === "error"
                                    ? "alert"
                                    : "status"
                                }
                              >
                                {ttsState.message}
                              </p>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </article>
                  </li>
                );
              })}
              {isLoading ? (
                <li className="history-loading" role="status">
                  <span className="loading-indicator" aria-hidden="true" />
                  <span>Interpreting the next message…</span>
                </li>
              ) : null}
            </ol>
          ) : isLoading ? (
            <div className="status-state">
              <span className="loading-indicator" aria-hidden="true" />
              <h3>Interpreting your message</h3>
              <p>Keeping the meaning and tone natural.</p>
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-symbol" aria-hidden="true">“</span>
              <h3>Your conversation starts here</h3>
              <p>
                Start with the {activeSpeakerLabel} in {sourceLanguage}. Kasuku
                will keep both sides in one shared conversation.
              </p>
            </div>
          )}
        </div>

        <form className="composer" onSubmit={submitMessage}>
          <label htmlFor={messageId}>
            {activeSpeakerLabel}&apos;s message in {sourceLanguage}
          </label>
          <div className="input-row">
            <textarea
              id={messageId}
              rows="2"
              value={message}
              onChange={(event) => {
                setMessage(event.target.value);

                if (speechStatus === "error") {
                  clearSpeechMessage();
                }
              }}
              placeholder={`Type in ${sourceLanguage}…`}
              maxLength="2000"
              disabled={isLoading}
            />
            <button
              className="microphone-button"
              type="button"
              data-state={speechStatus}
              aria-label={
                isSpeechActive
                  ? `Cancel ${activeSpeakerLabel} voice input`
                  : `Start ${activeSpeakerLabel} voice input in ${sourceLanguage}`
              }
              title={
                speechStatus === "unavailable"
                  ? "Voice input unavailable"
                  : isSpeechActive
                    ? "Cancel listening"
                    : `Speak in ${sourceLanguage}`
              }
              onClick={handleMicrophoneClick}
              disabled={isLoading || speechStatus === "unavailable"}
            >
              <MicrophoneIcon />
            </button>
          </div>
          {speechStatus !== "idle" || speechMessage ? (
            <div
              className="speech-feedback"
              data-state={speechStatus}
              role={speechStatus === "error" ? "alert" : "status"}
            >
              <p>
                {speechStatus === "listening" ? (
                  <span className="listening-dot" aria-hidden="true" />
                ) : null}
                {speechStatus === "processing"
                  ? "Processing transcript…"
                  : speechMessage}
              </p>
              {isSpeechActive ? (
                <button type="button" onClick={cancelListening}>
                  Cancel listening
                </button>
              ) : null}
            </div>
          ) : null}
          {speechLocale ? (
            <p className="speech-locale-note">
              Configured voice locale for {activeSpeakerLabel}: {speechLocale}
            </p>
          ) : null}
          {error ? <p className="error-message" role="alert">{error}</p> : null}
          <div className="composer-footer">
            <p>
              {sourceLanguage} → {targetLanguage} for the {listenerLabel}
            </p>
            <button
              className="send-button"
              type="submit"
              disabled={
                !message.trim() ||
                isLoading ||
                isSpeechActive ||
                sourceLanguage === targetLanguage
              }
            >
              {isLoading ? "Interpreting…" : `Interpret for ${listenerLabel}`}
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </form>

        {isSpeechChoiceOpen ? (
          <div
            className="speech-choice-backdrop"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                setIsSpeechChoiceOpen(false);
              }
            }}
          >
            <div
              className="speech-choice-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby={speechChoiceTitleId}
            >
              <h3 id={speechChoiceTitleId}>How should Kasuku listen?</h3>
              <div className="speech-choice-options">
                {VISITOR_SPEECH_RECOGNITION_OPTIONS.map((option, index) => (
                  <button
                    className="speech-choice-option"
                    type="button"
                    key={option.id}
                    ref={index === 0 ? firstSpeechChoiceRef : null}
                    onClick={() => startVisitorRecognition(option.id)}
                  >
                    <span>{option.title}</span>
                    <small>{option.helper}</small>
                    {option.id === "kinyarwanda" ? (
                      <em>Microphone recognition only</em>
                    ) : null}
                  </button>
                ))}
              </div>
              <button
                className="speech-choice-cancel"
                type="button"
                onClick={() => setIsSpeechChoiceOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <footer>
        <p>Built for conversations across Rwanda.</p>
        <p className="session-note"><span aria-hidden="true">●</span> Private session</p>
      </footer>
    </main>
  );
}
