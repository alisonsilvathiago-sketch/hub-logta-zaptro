import React, { useEffect, useRef, useState } from 'react';
import { Eraser } from 'lucide-react';
import './signaturePad.css';

type Props = {
  value?: string;
  onChange: (dataUrl: string) => void;
  label?: string;
  disabled?: boolean;
  compact?: boolean;
  fullWidth?: boolean;
};

const SignaturePad: React.FC<Props> = ({
  value = '',
  onChange,
  label = 'Assinatura',
  disabled = false,
  compact = false,
  fullWidth = false,
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(Boolean(value));
  const [canvasSize, setCanvasSize] = useState({ width: fullWidth ? 720 : compact ? 400 : 520, height: compact ? 96 : 140 });

  useEffect(() => {
    if (!fullWidth || !wrapRef.current) return;
    const el = wrapRef.current;
    const sync = () => {
      const width = Math.max(280, Math.floor(el.clientWidth));
      setCanvasSize({ width, height: compact ? 96 : 110 });
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fullWidth, compact]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#383838';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHasInk(true);
      };
      img.src = value;
    } else {
      setHasInk(false);
    }
  }, [value, canvasSize.width, canvasSize.height]);

  const pointFromEvent = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    drawing.current = true;
    canvas.setPointerCapture(event.pointerId);
    const { x, y } = pointFromEvent(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || disabled) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const { x, y } = pointFromEvent(event);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasInk(true);
  };

  const endDraw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
      onChange(canvas.toDataURL('image/png'));
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
    onChange('');
  };

  const width = fullWidth ? canvasSize.width : compact ? 400 : 520;
  const height = fullWidth ? canvasSize.height : compact ? 96 : 140;

  return (
    <div
      ref={wrapRef}
      className={`ls-signature-pad${compact ? ' ls-signature-pad--compact' : ''}${fullWidth ? ' ls-signature-pad--full' : ''}`}
    >
      <div className="ls-signature-pad__head">
        <label className="ls-label">{label}</label>
        <button type="button" className="ls-signature-pad__clear" onClick={clear} disabled={disabled || !hasInk}>
          <Eraser size={14} aria-hidden />
          Limpar
        </button>
      </div>
      <canvas
        ref={canvasRef}
        className="ls-signature-pad__canvas"
        width={width}
        height={height}
        aria-label={label}
        onPointerDown={startDraw}
        onPointerMove={draw}
        onPointerUp={endDraw}
        onPointerLeave={endDraw}
      />
      {!compact ? (
        <p className="ls-signature-pad__hint">Desenhe com o dedo ou mouse — a imagem fica salva no registro da transferência.</p>
      ) : null}
    </div>
  );
};

export default SignaturePad;
