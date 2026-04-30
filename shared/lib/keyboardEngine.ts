type Shortcut = {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description?: string;
  category?: string;
};

let shortcuts: Shortcut[] = [];

export function registerShortcut(s: Shortcut) {
  // Prevent duplicates
  const exists = shortcuts.find(item => 
    item.key.toLowerCase() === s.key.toLowerCase() &&
    !!item.ctrl === !!s.ctrl &&
    !!item.meta === !!s.meta &&
    !!item.shift === !!s.shift &&
    !!item.alt === !!s.alt
  );
  
  if (!exists) {
    shortcuts.push(s);
  }
}

export function initKeyboardEngine() {
  const handler = (e: KeyboardEvent) => {
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || (document.activeElement as HTMLElement)?.isContentEditable) {
      if (e.key !== 'Escape') return;
    }

    shortcuts.forEach(s => {
      const isKeyMatch = e.key.toLowerCase() === s.key.toLowerCase();
      const isModifierMatch = 
        (!!s.ctrl === e.ctrlKey) &&
        (!!s.shift === e.shiftKey) &&
        (!!s.alt === e.altKey) &&
        (!!s.meta === e.metaKey);

      if (isKeyMatch && isModifierMatch) {
        e.preventDefault();
        s.action();
      }
    });
  };

  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}

export function getAllShortcuts() {
  return shortcuts;
}

export function clearShortcuts() {
  shortcuts = [];
}
