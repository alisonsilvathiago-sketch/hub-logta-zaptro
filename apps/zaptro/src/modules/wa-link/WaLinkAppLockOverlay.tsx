import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { getWaLinkLockPin, setWaLinkAppLocked } from './waLinkInboxPrefs';

type Props = {
  onUnlocked: () => void;
};

const WaLinkAppLockOverlay: React.FC<Props> = ({ onUnlocked }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const saved = getWaLinkLockPin();
    if (!saved) {
      setWaLinkAppLocked(false);
      onUnlocked();
      return;
    }
    if (pin === saved) {
      setPin('');
      setError(null);
      setWaLinkAppLocked(false);
      onUnlocked();
      return;
    }
    setError('PIN incorrecto. Tente novamente.');
    setPin('');
  };

  return (
    <div className="wa-app-lock-overlay" role="dialog" aria-label="Desbloquear conversas">
      <form className="wa-app-lock-card" onSubmit={submit}>
        <span className="wa-app-lock-icon" aria-hidden>
          <Lock size={28} strokeWidth={1.75} />
        </span>
        <h2>Conversas bloqueadas</h2>
        <p>Digite o seu PIN de 4 dígitos para continuar.</p>
        <input
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          autoComplete="off"
          placeholder="••••"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          autoFocus
        />
        {error ? <p className="wa-app-lock-error">{error}</p> : null}
        <button type="submit" disabled={pin.length !== 4}>
          Desbloquear
        </button>
      </form>
    </div>
  );
};

export default WaLinkAppLockOverlay;
