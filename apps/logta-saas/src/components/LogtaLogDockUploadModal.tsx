import React, { useRef, useState } from 'react';
import { FileText, Loader2, Upload } from 'lucide-react';
import { LogtaModalHeader } from './LogtaModalHeader';
import { syncAssetToLogDock, type LogDockSyncCategory } from '../lib/logDockSync';
import { showToast } from './Toast';
import { getHubLogDockDriveUrl } from '@/lib/hub';

type LogtaLogDockUploadModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  category?: LogDockSyncCategory;
  accept?: string;
  children?: React.ReactNode;
};

export function LogtaLogDockUploadModal({
  open,
  onClose,
  title = 'Enviar documento',
  category = 'xmls',
  accept = '.xml,.pdf,.zip,image/*',
  children,
}: LogtaLogDockUploadModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  if (!open) return null;

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    let ok = 0;
    for (const file of Array.from(files)) {
      const synced = await syncAssetToLogDock(file.name, category, file.size, file.type || 'application/octet-stream', {
        module: 'logta_saas_upload',
      });
      if (synced) ok += 1;
    }
    setUploading(false);
    if (ok > 0) {
      showToast('success', `${ok} arquivo(s) arquivado(s) na biblioteca LogDock.`, 'LogDock');
      onClose();
    } else {
      showToast(
        'warning',
        'Arquivo salvo localmente. Faça login ou ative o LogDock Drive no Hub para sincronizar na nuvem.',
        'LogDock'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md" onClick={onClose}>
      <div
        className="w-full max-w-lg animate-in zoom-in-95 rounded-[40px] border border-neutral-800 bg-[#18191B] p-8 shadow-2xl duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <LogtaModalHeader icon={FileText} title={title} onClose={onClose} />

        <p className="mb-6 text-sm font-medium text-neutral-400">
          Os arquivos entram na biblioteca da conta (LogDock) e ficam disponíveis no Hub · LogDock Drive.
        </p>

        {children}

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = '';
          }}
        />

        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-3 rounded-[20px] border-2 border-dashed border-neutral-700 bg-neutral-900/50 px-6 py-10 transition-colors hover:border-primary/50 hover:bg-neutral-900"
        >
          {uploading ? (
            <Loader2 className="animate-spin text-primary" size={32} />
          ) : (
            <Upload className="text-primary" size={32} />
          )}
          <span className="text-sm font-bold text-white">
            {uploading ? 'Enviando...' : 'Clique para escolher arquivos'}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-normal text-neutral-500">
            XML, PDF, imagens e outros formatos
          </span>
        </button>

        <a
          href={getHubLogDockDriveUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 block text-center text-xs font-bold text-primary hover:underline"
        >
          Abrir biblioteca completa no Hub · LogDock
        </a>
      </div>
    </div>
  );
}
