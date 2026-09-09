'use client';

import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Eye,
  Volume2,
  VolumeX,
  CodeXml as Github,
  ArrowRight,
  Moon,
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
    title: 'The midnight studio',
    kind: '3D WORLD / INTERACTIVE',
    copy: 'A small room for big ideas. Explore the original Blender scene, its materials, and the little details that make this space feel lived in.',
    color: 'orange',
    file: '/downloads/afterhours.blend',
    label: 'Download Blender scene',
  },
  {
    id: '02',
    title: 'The creator',
    kind: 'CHARACTER DESIGN / REAL-TIME',
    copy: 'Night owl. Serial tinkerer. Probably on another cup of coffee. An original human-style creator with swept hair, a dark hoodie, and both hands resting comfortably on the desk.',
    color: 'violet',
    file: '/models/room.glb',
    label: 'Download the web scene',
  },
  {
    id: '03',
    title: 'Behind the screen',
    kind: 'CREATIVE DEVELOPMENT / OPEN SOURCE',
    copy: 'A responsive 3D homepage built with React and Three.js. Get the complete source, rebuild the room, and make it your own.',
    color: 'mint',
    file: '/downloads/portfolio-source.zip',
    label: 'Get the source code',
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
              ? 'Things made after hours.'
              : 'Hi, I’m Fabrizio.'}
          </DialogTitle>

          <DialogDescription>
            {panel === 'work'
              ? 'A collection of experiments in design, code, and play.'
              : 'A little about the person behind the screen.'}
          </DialogDescription>

          {panel === 'work' && (
            <>
              <div className="project-grid">
                {projects.map((project) => (
                  <a
                    className={`project ${project.color}`}
                    href={project.file}
                    download
                    key={project.id}
                  >
                    <div className="project-art">
                      <span>{project.id}</span>

                      {project.id === '01' ? (
                        <Moon />
                      ) : project.id === '02' ? (
                        <Eye />
                      ) : (
                        <Github />
                      )}

                      <ArrowUpRight className="project-arrow" />
                    </div>

                    <small>{project.kind}</small>
                    <h3>{project.title}</h3>
                    <p>{project.copy}</p>

                    <strong>
                      {project.label} <ArrowRight size={15} />
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
                  <Github size={18} />
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