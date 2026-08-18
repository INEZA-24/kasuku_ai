import Image from "next/image";
import Link from "next/link";

import styles from "./landing.module.css";

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" width="18" height="18">
      <path d="M4 10h11m-4-4 4 4-4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function SwapIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
      <path d="M7 7h11m0 0-3-3m3 3-3 3M17 17H6m0 0 3 3m-3-3 3-3" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function MicrophoneIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
      <path d="M12 15.25a3.5 3.5 0 0 0 3.5-3.5v-5a3.5 3.5 0 1 0-7 0v5a3.5 3.5 0 0 0 3.5 3.5Zm6-3.75v.5a6 6 0 0 1-12 0v-.5M12 18v3m-3 0h6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function SpeakerIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16">
      <path d="M5 10v4h3l4 3V7l-4 3H5Zm10.5-.8a4 4 0 0 1 0 5.6m2-7.6a7 7 0 0 1 0 9.6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

const steps = [
  ["Speak", "Say what you mean naturally."],
  ["Interpret", "Kasuku communicates the intended meaning."],
  ["Reply", "Swap direction and keep talking."],
];

const scenarios = [
  "An international investor with a local supplier",
  "A foreign employee with Rwandan staff",
  "A business traveler with a moto driver",
  "A local company with an international customer",
];

export default function LandingPage() {
  return (
    <main className={styles.landing}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="Kasuku home">
          <Image src="/kasuku.png" alt="Kasuku parrot logo" width={43} height={43} priority />
          <span>Kasuku</span>
        </Link>
        <nav className={styles.desktopNav} aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#challenge">The challenge</a>
        </nav>
        <Link className={styles.headerCta} href="/conversation">
          Try Kasuku <ArrowIcon />
        </Link>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Built for conversations in a growing Rwanda</p>
          <h1>Rwanda is open for business.<br />Language shouldn&apos;t slow it down.</h1>
          <p className={styles.heroLead}>
            As Rwanda connects with more businesses, investors and professionals,
            everyday conversations increasingly happen across languages.
          </p>
          <p className={styles.heroSupport}>
            Kasuku helps two people understand each other naturally — on one shared phone.
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryCta} href="/conversation">
              Try Kasuku <ArrowIcon />
            </Link>
            <a className={styles.secondaryCta} href="#how-it-works">See how it works</a>
          </div>
        </div>
        <div className={styles.heroMark} aria-hidden="true">
          <div className={styles.logoFrame}>
            <Image src="/kasuku.png" alt="" width={260} height={260} priority />
          </div>
          <p><span>English</span><b>⇄</b><span>Kinyarwanda</span></p>
        </div>
      </section>

      <section className={styles.challenge} id="challenge" aria-labelledby="challenge-title">
        <div className={styles.sectionIntro}>
          <p className={styles.sectionTag}>The Challenge</p>
          <h2 id="challenge-title">Business is growing.<br />Conversations have to keep up.</h2>
        </div>
        <div className={styles.statsGrid}>
          <article className={styles.statCard}>
            <p className={styles.statValue}>USD 2.62B</p>
            <p>registered across 799 investment projects in 2025</p>
            <small>Source: Rwanda Development Board</small>
          </article>
          <article className={styles.statCard}>
            <p className={styles.statValue}>25,266</p>
            <p>non-resident business-purpose air arrivals in 2025 Q2</p>
            <small>Source: National Institute of Statistics of Rwanda</small>
          </article>
        </div>
        <div className={styles.scenarioGrid}>
          {scenarios.map((scenario) => (
            <p key={scenario}>{scenario}</p>
          ))}
        </div>
        <p className={styles.bridgeLine}>
          Different languages. Same need to understand each other. <strong>Kasuku bridges that moment.</strong>
        </p>
      </section>

      <section className={styles.how} id="how-it-works" aria-labelledby="how-title">
        <div className={styles.sectionIntro}>
          <p className={styles.sectionTag}>How Kasuku Works</p>
          <h2 id="how-title">A natural conversation in three steps.</h2>
        </div>
        <ol className={styles.steps}>
          {steps.map(([title, description]) => (
            <li key={title}>
              <h3>{title}</h3>
              <p>{description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.previewSection} aria-labelledby="preview-title">
        <div className={styles.previewCopy}>
          <p className={styles.sectionTag}>Built for Real Conversations</p>
          <h2 id="preview-title">Built for the moment between two people.</h2>
          <p>Speak, interpret, swap direction, and continue — without breaking the conversation.</p>
        </div>
        <div className={styles.productPreview} aria-label="Preview of the Kasuku conversation interface">
          <div className={styles.previewTopbar}>
            <div>
              <Image src="/kasuku.png" alt="" width={30} height={30} />
              <strong>Kasuku</strong>
            </div>
            <span>Transport</span>
          </div>
          <div className={styles.previewDirection}>
            <div><strong>Speaker 1</strong><small>English</small></div>
            <span><SwapIcon /></span>
            <div><strong>Speaker 2</strong><small>Kinyarwanda</small></div>
          </div>
          <div className={styles.previewMessages}>
            <article className={styles.originalPreview}>
              <small>Speaker 1 · English</small>
              <p>I need to meet my supplier in Nyabugogo, but I need to stop at an ATM first.</p>
            </article>
            <article className={styles.interpretationPreview}>
              <small>For Speaker 2 · Kinyarwanda</small>
              <p>Nkeneye guhura n&apos;umpa ibicuruzwa i Nyabugogo, ariko mbanze guhagarara kuri ATM.</p>
              <span><SpeakerIcon /> Play</span>
            </article>
          </div>
          <div className={styles.previewComposer}>
            <span>Type or speak naturally…</span>
            <i><MicrophoneIcon /></i>
          </div>
        </div>
      </section>

      <section className={styles.finalCta}>
        <div>
          <h2>Ready to Talk?</h2>
        </div>
        <Link className={styles.primaryCta} href="/conversation">
          Try Kasuku <ArrowIcon />
        </Link>
      </section>

      <footer className={styles.footer}>
        <p>© 2026 Kasuku. Built by Team NEXEL.</p>
      </footer>
    </main>
  );
}
