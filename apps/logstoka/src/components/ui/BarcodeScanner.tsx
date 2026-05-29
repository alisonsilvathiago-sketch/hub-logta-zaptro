import React, { useEffect, useRef, useState } from 'react';
import { Camera, ScanLine } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (value: string) => void;
  placeholder?: string;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScan,
  placeholder = 'Leia código de barras ou digite SKU',
}) => {
  const [value, setValue] = useState('');
  const [cameraOn, setCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!cameraOn || !videoRef.current) return;
    let stream: MediaStream | null = null;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((s) => {
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => setCameraOn(false));
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [cameraOn]);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onScan(trimmed);
    setValue('');
  };

  return (
    <div className="ls-card space-y-3">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
        <ScanLine size={18} className="text-emerald-600" />
        Leitor de código de barras
      </div>
      <div className="flex gap-2">
        <input
          className="ls-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder={placeholder}
        />
        <button type="button" className="ls-btn-primary" onClick={submit}>
          OK
        </button>
        <button
          type="button"
          className="ls-btn-secondary"
          onClick={() => setCameraOn((v) => !v)}
        >
          <Camera size={16} />
        </button>
      </div>
      {cameraOn && (
        <video ref={videoRef} autoPlay playsInline className="h-40 w-full rounded-xl bg-black object-cover" />
      )}
      <p className="text-xs text-slate-500">
        Compatível com leitor USB (modo teclado) e câmera do celular.
      </p>
    </div>
  );
};

export default BarcodeScanner;
