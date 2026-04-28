import { notifyZaptroChat } from '../components/Zaptro/ZaptroNotificationSystem';
/**
 * Preferências e efeitos de alerta para novas mensagens WhatsApp (Zaptro inbox).
 * Som: Web Audio (sem ficheiro). Desktop: `Notification` API quando permitido.
 */

const LS_SOUND = 'zaptro_wa_notif_sound_v1';
const LS_DESKTOP = 'zaptro_wa_notif_desktop_v1';

export function readWaNotifSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const v = localStorage.getItem(LS_SOUND);
  if (v === null) return true;
  return v === '1';
}

export function setWaNotifSoundEnabled(on: boolean): void {
  localStorage.setItem(LS_SOUND, on ? '1' : '0');
}

/** Se o utilizador quer tentar notificações do browser (além do som). */
export function readWaNotifDesktopDesired(): boolean {
  if (typeof window === 'undefined') return true;
  const v = localStorage.getItem(LS_DESKTOP);
  if (v === null) return true;
  return v === '1';
}

export function setWaNotifDesktopDesired(on: boolean): void {
  localStorage.setItem(LS_DESKTOP, on ? '1' : '0');
}

let lastSoundAt = 0;
const SOUND_DEBOUNCE_MS = 1000;
const NOTIFICATION_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3';

/** Sinal curto tipo “ding” (respeita `readWaNotifSoundEnabled`). */
export function playWaIncomingMessageSound(): void {
  if (typeof window === 'undefined') return;
  if (!readWaNotifSoundEnabled()) return;
  const now = Date.now();
  if (now - lastSoundAt < SOUND_DEBOUNCE_MS) return;
  lastSoundAt = now;

  try {
    const audio = new Audio(NOTIFICATION_SOUND_URL);
    audio.play().catch(() => {
      /* Browser block */
    });
  } catch {
    /* ignore */
  }
}

export function getWaBrowserNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') return 'denied';
  return Notification.permission;
}

export async function requestWaBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

const NOTIF_ICON_PATH = '/zaptro-mark.svg';

export function showWaDesktopNotificationIfAllowed(params: {
  title: string;
  body: string;
  tag?: string;
  senderName?: string;
  avatarUrl?: string | null;
  onClick?: () => void;
}): void {
  if (typeof window === 'undefined') return;
  
  // 1. In-App Notification (Toast)
  if (readWaNotifDesktopDesired()) {
    notifyZaptroChat(
      params.senderName || params.title.replace('Nova mensagem — ', ''),
      params.body,
      params.avatarUrl,
      params.onClick
    );
  }

  // 2. Browser Native Notification
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && readWaNotifDesktopDesired()) {
    try {
      const n = new Notification(params.title, {
        body: params.body.slice(0, 200),
        tag: params.tag ?? 'zaptro-wa-msg',
        icon: params.avatarUrl || NOTIF_ICON_PATH,
      });
      n.onclick = () => {
        window.focus();
        if (params.onClick) params.onClick();
        n.close();
      };
    } catch {
      /* ignore */
    }
  }
}

/** Mostrar aviso estilo WhatsApp: bloqueado no browser, ainda não permitido, ou desativado nas preferências Zaptro. */
export function getWaNotificationBannerKind(): 'denied' | 'default' | 'disabled_in_app' | null {
  if (typeof window === 'undefined') return null;
  const p = getWaBrowserNotificationPermission();
  if (p === 'denied') return 'denied';
  if (!readWaNotifDesktopDesired()) return 'disabled_in_app';
  if (p === 'default') return 'default';
  return null;
}
