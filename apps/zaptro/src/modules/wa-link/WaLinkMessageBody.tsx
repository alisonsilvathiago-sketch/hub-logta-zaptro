import React from 'react';
import { FileText, MapPin, Smile, User } from 'lucide-react';
import type { WaLinkMessage } from './useWaLinkInbox';

type Props = {
  message: WaLinkMessage;
};

function messageKind(m: WaLinkMessage): string {
  return String(m.message_type || 'text').toLowerCase();
}

export default function WaLinkMessageBody({ message: m }: Props) {
  const kind = messageKind(m);
  const mime = String(m.mime_type || m.media_mime_type || '').toLowerCase();
  const isAudio =
    kind === 'audio' ||
    kind === 'ptt' ||
    mime.startsWith('audio/');

  if (m.is_deleted) {
    return <span className="wa-conversas-bubble-text wa-conversas-bubble-text--muted">Mensagem apagada</span>;
  }

  if (m.reaction) {
    return (
      <span className="wa-conversas-bubble-reaction">
        Reação {m.reaction}
      </span>
    );
  }

  if (isAudio && m.media_url) {
    return (
      <div className="wa-conversas-audio">
        <audio controls preload="metadata" src={m.media_url} />
      </div>
    );
  }

  if ((kind === 'image' || mime.startsWith('image/')) && m.media_url) {
    return (
      <figure className="wa-conversas-media wa-conversas-media--image">
        <img src={m.media_url} alt={m.content || 'Imagem'} loading="lazy" />
        {m.content && m.content !== '(imagem)' ? (
          <figcaption>{m.content}</figcaption>
        ) : null}
      </figure>
    );
  }

  if ((kind === 'video' || mime.startsWith('video/')) && m.media_url) {
    return (
      <figure className="wa-conversas-media wa-conversas-media--video">
        <video controls preload="metadata" src={m.media_url} />
        {m.content && m.content !== '(vídeo)' ? (
          <figcaption>{m.content}</figcaption>
        ) : null}
      </figure>
    );
  }

  if (kind === 'sticker' && m.media_url) {
    return (
      <figure className="wa-conversas-media wa-conversas-media--sticker">
        <img src={m.media_url} alt="Figurinha" loading="lazy" />
      </figure>
    );
  }

  if (kind === 'document' || mime === 'application/pdf') {
    const name = m.file_name || m.media_file_name || m.content || 'Documento';
    return (
      <a
        className="wa-conversas-document"
        href={m.media_url || '#'}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          if (!m.media_url) e.preventDefault();
        }}
      >
        <FileText size={18} aria-hidden />
        <span>{name}</span>
      </a>
    );
  }

  if (kind === 'location' || (m.location_lat != null && m.location_lng != null)) {
    const lat = m.location_lat;
    const lng = m.location_lng;
    const mapsUrl =
      lat != null && lng != null
        ? `https://www.google.com/maps?q=${lat},${lng}`
        : null;
    return (
      <a
        className="wa-conversas-location"
        href={mapsUrl || '#'}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          if (!mapsUrl) e.preventDefault();
        }}
      >
        <MapPin size={16} aria-hidden />
        <span>{m.content || 'Localização'}</span>
      </a>
    );
  }

  if (kind === 'contact') {
    return (
      <div className="wa-conversas-contact">
        <User size={16} aria-hidden />
        <span>{m.content || 'Contato'}</span>
      </div>
    );
  }

  if (kind === 'sticker') {
    return (
      <span className="wa-conversas-bubble-text wa-conversas-bubble-text--muted">
        <Smile size={14} aria-hidden /> Figurinha
      </span>
    );
  }

  return (
    <span className="wa-conversas-bubble-text">
      {m.is_edited ? <em className="wa-conversas-edited-tag">editada </em> : null}
      {m.content}
    </span>
  );
}
