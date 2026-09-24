'use client';

import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Volume2,
  VolumeX,
  CodeXml as Github,
  RotateCcw,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

import { GITHUB_URL, LINKEDIN_URL } from './profile';

const Room = lazy(() => import('./room'));

type Panel = 'work' | 'about' | null;

const projects = [
  {
    id: '01',
    title: 'RealAgent',
    kind: 'AI AGENT / NATURAL-LANGUAGE SEARCH',
    copy: 'Search real estate listings in plain English. RealAgent translates your request into validated SQL and returns readable results. When there are no exact matches, it tries alternatives that prioritize either your budget or your requested features.',
    detail:
      'Built around local LLM inference, runtime schema inspection, SQL validation, read-only database access, and a one-retry query repair loop.',
    stack: 'Python · SQLite · LangChain · Ollama · pandas',
    color: 'mint',
    href: 'https://github.com/ffalcon12/RealAgent',
    label: 'View on GitHub',
  },
];

export default function Home() {
  const [monitorIndex, setMonitorIndex] = useState(1);
  const [computer, setComputer] = useState(false);
  const [ready, setReady] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [sound, setSound] = useState(false);
  const [reset, setReset] = useState(0);

  const handleReady = useCallback(() => {
    setReady(true);
  }, []);

  const openComputer = useCallback((index = 1) => {
    if (index === 0) {
      window.open(GITHUB_URL, '_blank', 'noopener,noreferrer');
      return;
    }

    setMonitorIndex(index);
    setComputer(true);
  }, []);

  const exitComputer = useCallback(() => {
    setPanel(null);
    setComputer(false);
  }, []);

  useEffect(() => {
    if (!computer) return;

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    const timer = window.setTimeout(
      () => setPanel(monitorIndex === 2 ? 'about' : 'work'),
      reducedMotion ? 0 : 650,
    );

    return () => window.clearTimeout(timer);
  }, [computer, monitorIndex]);

  useEffect(() => {
    if (!sound) return;

    const ctx = new AudioContext();
    const master = ctx.createGain();

    master.gain.value = 0.024;
    master.connect(ctx.destination);

    const oscillators = [130.81, 196, 261.63].map(
      (frequency, index) => {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        gain.gain.value = 0.35 / (index + 1);

        oscillator.connect(gain);
        gain.connect(master);
        oscillator.start();

        return oscillator;
      },
    );

    void ctx.resume().catch(() => setSound(false));

    return () => {
      oscillators.forEach((oscillator) => oscillator.stop());
      void ctx.close();
    };
  }, [sound]);

  return (
    <main
      className={`experience ${ready ? 'is-ready' : ''} ${
        computer ? 'room-focused' : ''
      }`}
    >
      <div className="scene">
        <Suspense fallback={null}>
          <Room
            onReady={handleReady}
            reset={reset}
            focused={computer}
            onComputer={openComputer}
            monitorIndex={monitorIndex}
          />
        </Suspense>
      </div>

      <div className="vignette" />

      {!ready && (
        <div className="loading" role="status" aria-live="polite">
          <span className="brand">
            AFTERHOURS<span>™</span>
          </span>

          <div className="load-track" aria-hidden="true">
            <i />
          </div>

          <p>
            Opening the studio
            <span className="load-dots">...</span>
          </p>
        </div>
      )}

      <section className="identity">
        <h1>
          FABRIZIO <span>FALCON</span>
        </h1>

        {!computer && (
          <p className="explore-hint">
            <span className="hint-desktop">
              Hover over the screens to get to know me
            </span>
            <span className="hint-touch">
              Tap the screens to get to know me
            </span>
            <span className="hint-arrow" aria-hidden="true">
              ↘
            </span>
          </p>
        )}
      </section>

      <nav className="minimal-links" aria-label="Room screens">
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub ↗
        </a>

        <button type="button" onClick={() => openComputer(1)}>
          Projects
        </button>

        <button type="button" onClick={() => openComputer(2)}>
          About me
        </button>

        <a
          href={LINKEDIN_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          LinkedIn ↗
        </a>
      </nav>

      <footer className="utility">
        <div className="utility-right">
          <button
            type="button"
            onClick={() => {
              exitComputer();
              setReset((value) => value + 1);
            }}
            aria-label="Reset camera"
          >
            <RotateCcw size={15} />
          </button>

          <button
            type="button"
            onClick={() => setSound((value) => !value)}
            aria-pressed={sound}
          >
            {sound ? <Volume2 size={15} /> : <VolumeX size={15} />}
            <span>Sound {sound ? 'on' : 'off'}</span>
          </button>
        </div>
      </footer>

      <Dialog
        open={panel !== null}
        onOpenChange={(open) => {
          if (!open) exitComputer();
        }}
      >
        <DialogContent
          className="portfolio-dialog"
          showCloseButton
          style={{
            maxHeight: '85dvh',
            overflowY: 'auto',
            overscrollBehavior: 'contain',
          }}
        >
          <DialogTitle>
            {panel === 'work'
              ? 'Selected projects.'
              : 'Hi, I’m Fabrizio.'}
          </DialogTitle>

          <DialogDescription>
            {panel === 'work'
              ? 'Practical projects in AI, data, and software development.'
              : 'A little about the person behind the screen.'}
          </DialogDescription>

          {panel === 'work' && (
            <>
              <div
                className="project-grid"
                style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}
              >
                {projects.map((project) => (
                  <a
                    className={`project ${project.color}`}
                    href={project.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    key={project.id}
                  >
                    <div className="project-art">
                      <span>{project.id}</span>

                      <Github aria-hidden="true" />

                      <ArrowUpRight
                        className="project-arrow"
                        aria-hidden="true"
                      />
                    </div>

                    <small>{project.kind}</small>
                    <h3>{project.title}</h3>
                    <p>{project.copy}</p>
                    <p>{project.detail}</p>

                    <p style={{ color: '#a4d3c8', fontSize: '13px' }}>
                      {project.stack}
                    </p>

                    <strong>
                      {project.label}
                      <ArrowUpRight size={15} aria-hidden="true" />
                    </strong>
                  </a>
                ))}
              </div>

              <div className="profile-actions">
                <a
                  className="main-cta"
                  href={`${GITHUB_URL}?tab=repositories`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  All my repositories
                  <Github size={18} aria-hidden="true" />
                </a>
              </div>
            </>
          )}

          {panel === 'about' && (
            <div className="about-body">
              <span className="about-symbol" aria-hidden="true">
                f<span>f</span>
              </span>

              <p>
                I’m Fabrizio Falcon — a computer science and mathematics
                student, researcher, and builder.
              </p>

              <div className="bio-block">
                <h3>About me</h3>

                <p>
                  I’m a senior at the University of Kansas, double
                  majoring in Computer Science and Mathematics through
                  the Honors Program, graduating May 2027. Most of my
                  time goes into research — I’m co-first author on LACE,
                  a graph-neural-network and reinforcement-learning
                  system for feature selection, working toward a SIGMOD
                  submission under Professor Dongjie Wang.
                </p>

                <p>
                  Outside of research, I play tennis, soccer, and train
                  in martial arts. I hold the Landis Scholarship and
                  the Babcock Award.
                </p>
              </div>

              <div className="bio-columns">
                <section>
                  <h3>Skills &amp; interests</h3>

                  <p>
                    Machine learning research, reinforcement learning,
                    full-stack development, tennis, soccer, and
                    martial arts.
                  </p>
                </section>

                <section>
                  <h3>Experience &amp; education</h3>

                  <ul
                    className="bio-list"
                    style={{
                      listStyleType: 'disc',
                      paddingLeft: '1.25rem',
                      marginTop: '1rem',
                      display: 'grid',
                      gap: '0.9rem',
                      lineHeight: 1.7,
                    }}
                  >
                    <li>
                      B.S. Computer Science &amp; Mathematics,
                      University of Kansas (Honors Program),
                      expected May 2027
                    </li>

                    <li>
                      Research Assistant, Bilingual Language Lab,
                      KU — since Aug 2023
                    </li>

                    <li>
                      Co-first author, LACE — GCN + DDPG feature
                      selection, advised by Prof. Dongjie Wang
                    </li>
                  </ul>
                </section>
              </div>

              <div className="profile-actions">
                <a
                  className="main-cta"
                  href={LINKEDIN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Connect on LinkedIn
                  <span
                    aria-hidden="true"
                    style={{ fontWeight: 800 }}
                  >
                    in
                  </span>
                </a>
              </div>
            </div>
          )}

          {computer && (
            <button
              type="button"
              className="back-room"
              onClick={exitComputer}
            >
              ← Back to room
            </button>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}