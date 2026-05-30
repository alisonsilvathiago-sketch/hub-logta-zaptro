import React, { useEffect, useId, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Loader2 } from 'lucide-react';

type Props = {
  active: boolean;
  onScan: (value: string) => void;
  onError?: (message: string) => void;
};

const QrCameraScanner: React.FC<Props> = ({ active, onScan, onError }) => {
  const reactId = useId();
  const elementId = `ls-qr-scanner-${reactId.replace(/:/g, '')}`;
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!active) {
      try {
        void scannerRef.current?.stop();
        scannerRef.current?.clear();
      } catch {
        /* ignore */
      }
      scannerRef.current = null;
      return;
    }

    let cancelled = false;
    setStarting(true);

    const scanner = new Html5Qrcode(elementId);
    scannerRef.current = scanner;

    void scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 260 }, aspectRatio: 1 },
        (decoded) => {
          if (!decoded?.trim()) return;
          onScan(decoded.trim());
        },
        () => undefined,
      )
      .catch((err: unknown) => {
        if (!cancelled) {
          onError?.(err instanceof Error ? err.message : 'Não foi possível abrir a câmera');
        }
      })
      .finally(() => {
        if (!cancelled) setStarting(false);
      });

    return () => {
      cancelled = true;
      try {
        void scanner.stop();
        scanner.clear();
      } catch {
        /* ignore */
      }
      if (scannerRef.current === scanner) scannerRef.current = null;
    };
  }, [active, elementId, onError, onScan]);

  if (!active) return null;

  return (
    <div className="ls-qr-scanner">
      <div id={elementId} className="ls-qr-scanner__viewport" />
      {starting ? (
        <div className="ls-qr-scanner__loading">
          <Loader2 size={22} className="animate-spin text-orange-500" aria-hidden />
          <span>Abrindo câmera…</span>
        </div>
      ) : null}
      <p className="ls-qr-scanner__hint">Aponte para QR Code, EAN, DataMatrix ou etiqueta do fornecedor</p>
    </div>
  );
};

export default QrCameraScanner;
