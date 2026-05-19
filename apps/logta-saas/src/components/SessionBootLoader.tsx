import React, { useEffect, useRef, useState } from 'react';
import { loadOnboardingProfile } from '../lib/onboardingStorage';

/** Frases curtas — leitura rápida na tela de boot. */
const LINES = [
  (name: string) => `Olá, ${name}!`,
  () => 'Carregando…',
  () => 'Sincronizando…',
  () => 'Quase pronto…',
  () => 'Pronto!',
];

type Props = {
  open: boolean;
  onComplete: () => void;
};

export const SessionBootLoader: React.FC<Props> = ({ open, onComplete }) => {
  const [idx, setIdx] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const onboarding = loadOnboardingProfile();
  const rawName = onboarding?.fullName?.trim() || 'Usuário';
  const firstName = rawName.split(/\s+/)[0] || 'Usuário';

  useEffect(() => {
    if (!open) return;
    setIdx(0);
    const lineTimer = window.setInterval(() => {
      setIdx((i) => (i + 1) % LINES.length);
    }, 2000);

    let raf = 0;
    let done = false;
    const totalMs = Math.max(2000 * LINES.length, 10_000);
    const start = Date.now();
    const tick = () => {
      const p = Math.min(100, ((Date.now() - start) / totalMs) * 100);
      if (p >= 100) {
        if (!done) {
          done = true;
          window.clearInterval(lineTimer);
          onCompleteRef.current();
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.clearInterval(lineTimer);
      cancelAnimationFrame(raf);
    };
  }, [open]);

  if (!open) return null;

  const line = LINES[idx](firstName);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden bg-black px-6 text-white">
      <div className="relative mx-auto w-full max-w-xl px-4 text-center sm:max-w-2xl">
        <p
          className="mx-auto bg-gradient-to-r from-white to-sky-400 bg-clip-text text-3xl font-extrabold italic leading-tight tracking-tight text-transparent transition-opacity duration-500 sm:text-4xl md:text-[62px]"
          aria-live="polite"
        >
          {line}
        </p>
      </div>
    </div>
  );
};

export const LOGTA_SESSION_BOOT_FLAG = 'logta-session-boot';
