export function getPlatform() {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
  const isMac = /mac|iphone|ipad/.test(ua);

  return {
    isMac,
    cmd: isMac ? '⌘' : 'Ctrl',
    alt: isMac ? '⌥' : 'Alt',
    shift: isMac ? '⇧' : 'Shift',
    enter: 'Enter',
    esc: 'Esc',
    backspace: isMac ? '⌫' : 'Backspace'
  };
}
