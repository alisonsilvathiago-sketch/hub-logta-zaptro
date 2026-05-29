import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, Pause, Plus, Send, Smile, Sticker, Trash2 } from 'lucide-react';

const COMMON_EMOJIS = [
  '😀', '😁', '😂', '🤣', '😊', '😍', '🥰', '😘', '😎', '🤔',
  '😅', '🙏', '👍', '👏', '🙌', '💪', '🔥', '✅', '❌', '⚠️',
  '📦', '🚚', '📍', '💰', '📞', '💬', '⏰', '📅', '❤️', '💚',
];

type Props = {
  value: string;
  sending: boolean;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onSendAudio?: (blob: Blob) => Promise<void> | void;
  onSendFile?: (file: File) => Promise<void> | void;
  onSendSticker?: (file: File) => Promise<void> | void;
  disabled?: boolean;
  disabledReason?: string;
};

function formatTimer(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const WaLinkComposeBar: React.FC<Props> = ({
  value,
  sending,
  onChange,
  onSubmit,
  onSendAudio,
  onSendFile,
  onSendSticker,
  disabled = false,
  disabledReason,
}) => {
  const hasText = value.trim().length > 0;
  const [recState, setRecState] = useState<'idle' | 'recording' | 'ready' | 'sending'>('idle');
  const [recSeconds, setRecSeconds] = useState(0);
  const [recBlob, setRecBlob] = useState<Blob | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stickerInputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (recState !== 'recording') return;
    const t = window.setInterval(() => setRecSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [recState]);

  useEffect(() => {
    if (!emojiOpen && !attachOpen) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (emojiRef.current?.contains(t)) return;
      setEmojiOpen(false);
      setAttachOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [emojiOpen, attachOpen]);

  const timerLabel = useMemo(() => formatTimer(recSeconds), [recSeconds]);

  const startRecording = async () => {
    if (!onSendAudio) return;
    if (recState === 'recording') return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        try {
          stream.getTracks().forEach((t) => t.stop());
        } catch {
          /* ignore */
        }
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        setRecBlob(blob.size ? blob : null);
        setRecState('ready');
      };
      setRecSeconds(0);
      setRecBlob(null);
      setRecState('recording');
      recorder.start();
    } catch {
      alert('Não foi possível acessar o microfone. Permita o áudio no browser.');
    }
  };

  const stopRecording = () => {
    const r = mediaRef.current;
    if (r && r.state !== 'inactive') r.stop();
  };

  const cancelRecording = () => {
    try {
      const r = mediaRef.current;
      if (r && r.state !== 'inactive') r.stop();
    } catch {
      /* ignore */
    }
    setRecState('idle');
    setRecSeconds(0);
    setRecBlob(null);
  };

  const sendRecording = async () => {
    if (!onSendAudio || !recBlob) return;
    setRecState('sending');
    try {
      await onSendAudio(recBlob);
      setRecState('idle');
      setRecSeconds(0);
      setRecBlob(null);
    } catch (e) {
      alert('Erro ao enviar áudio:\n' + String(e));
      setRecState('ready');
    }
  };

  const insertEmoji = (emoji: string) => {
    onChange(value + emoji);
    setEmojiOpen(false);
  };

  const handleFilePick = async (file: File | undefined, kind: 'media' | 'sticker') => {
    if (!file) return;
    setAttachOpen(false);
    try {
      if (kind === 'sticker' && onSendSticker) {
        await onSendSticker(file);
      } else if (onSendFile) {
        await onSendFile(file);
      }
    } catch (e) {
      alert('Erro ao enviar ficheiro:\n' + String(e));
    }
  };

  return (
    <form className="wa-conversas-compose" onSubmit={onSubmit}>
      <div className="wa-conversas-compose-attach-wrap" ref={emojiRef}>
        <button
          type="button"
          className="wa-conversas-compose-icon"
          title="Anexar"
          aria-label="Anexar"
          disabled={disabled || sending}
          onClick={() => {
            setAttachOpen((v) => !v);
            setEmojiOpen(false);
          }}
        >
          <Plus size={22} strokeWidth={1.75} />
        </button>
        {attachOpen ? (
          <div className="wa-conversas-compose-popover">
            <button type="button" onClick={() => fileInputRef.current?.click()}>
              Foto / vídeo / documento
            </button>
            <button type="button" onClick={() => stickerInputRef.current?.click()}>
              Figurinha (webp)
            </button>
          </div>
        ) : null}
        <input
          ref={fileInputRef}
          type="file"
          hidden
          accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx"
          onChange={(e) => {
            void handleFilePick(e.target.files?.[0], 'media');
            e.target.value = '';
          }}
        />
        <input
          ref={stickerInputRef}
          type="file"
          hidden
          accept="image/webp"
          onChange={(e) => {
            void handleFilePick(e.target.files?.[0], 'sticker');
            e.target.value = '';
          }}
        />
      </div>

      <div className="wa-conversas-compose-bar">
        {recState === 'recording' || recState === 'ready' || recState === 'sending' ? (
          <div className="wa-voice-row" style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: recState === 'recording' ? '#ef4444' : '#949494',
                flexShrink: 0,
              }}
              aria-hidden
            />
            <strong style={{ fontSize: 12, color: '#0f172a', fontWeight: 700 }}>{timerLabel}</strong>
            <span style={{ fontSize: 12, color: '#949494', fontWeight: 600 }}>
              {recState === 'recording' ? 'Gravando…' : recState === 'sending' ? 'Enviando…' : 'Pronto para enviar'}
            </span>
            <span style={{ flex: 1 }} />
            <button
              type="button"
              className="wa-conversas-compose-icon wa-conversas-compose-icon--inner"
              title={recState === 'recording' ? 'Parar' : 'Cancelar'}
              aria-label={recState === 'recording' ? 'Parar' : 'Cancelar'}
              onClick={recState === 'recording' ? stopRecording : cancelRecording}
              disabled={sending || recState === 'sending'}
            >
              {recState === 'recording' ? <Pause size={18} strokeWidth={2} /> : <Trash2 size={18} strokeWidth={2} />}
            </button>
          </div>
        ) : (
          <>
            <div className="wa-conversas-compose-emoji-wrap">
              <button
                type="button"
                className="wa-conversas-compose-icon wa-conversas-compose-icon--inner wa-conversas-compose-icon--emoji"
                title="Emoji"
                aria-label="Emoji"
                disabled={disabled || sending}
                onClick={() => {
                  setEmojiOpen((v) => !v);
                  setAttachOpen(false);
                }}
              >
                <Smile size={22} strokeWidth={1.75} />
              </button>
              {emojiOpen ? (
                <div className="wa-conversas-compose-emoji-panel">
                  {COMMON_EMOJIS.map((em) => (
                    <button key={em} type="button" onClick={() => insertEmoji(em)}>
                      {em}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <input
              type="text"
              placeholder={disabled ? (disabledReason || 'Desativado') : 'Digite uma mensagem'}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              disabled={sending || disabled}
              autoComplete="off"
            />
            {onSendSticker ? (
              <button
                type="button"
                className="wa-conversas-compose-icon wa-conversas-compose-icon--inner"
                title="Figurinha"
                aria-label="Figurinha"
                disabled={disabled || sending}
                onClick={() => stickerInputRef.current?.click()}
              >
                <Sticker size={20} strokeWidth={1.75} />
              </button>
            ) : null}
          </>
        )}
      </div>
      {hasText ? (
        <button
          type="submit"
          className="wa-conversas-compose-send"
          disabled={sending || disabled}
          title="Enviar"
          aria-label="Enviar"
        >
          <Send size={20} strokeWidth={2} />
        </button>
      ) : recState === 'ready' ? (
        <button
          type="button"
          className="wa-conversas-compose-send"
          disabled={sending || recState === 'sending'}
          title="Enviar áudio"
          aria-label="Enviar áudio"
          onClick={() => void sendRecording()}
        >
          <Send size={20} strokeWidth={2} />
        </button>
      ) : (
        <button
          type="button"
          className="wa-conversas-compose-icon"
          title="Mensagem de voz"
          aria-label="Mensagem de voz"
          onClick={() => void startRecording()}
          disabled={sending || disabled || recState === 'sending' || !onSendAudio}
        >
          <Mic size={22} strokeWidth={1.75} />
        </button>
      )}
    </form>
  );
};

export default WaLinkComposeBar;
