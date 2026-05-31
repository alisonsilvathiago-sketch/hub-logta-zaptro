import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_FAVORITE_SHORTCUTS,
  SHORTCUT_CATALOG,
  type FavoriteShortcut,
} from '@/components/layout/inicioNavCatalog';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { isMarketplaceModuleActive } from '@/lib/marketplaceModule';
import { loadOperationalProfile } from '@/lib/operationalProfile';

const STORAGE_PREFIX = 'logstoka-favorite-shortcuts';

function storageKey(companyId: string | null): string {
  return companyId ? `${STORAGE_PREFIX}:${companyId}` : STORAGE_PREFIX;
}

function readShortcuts(companyId: string | null): FavoriteShortcut[] {
  if (typeof window === 'undefined') return DEFAULT_FAVORITE_SHORTCUTS;
  try {
    const raw = window.localStorage.getItem(storageKey(companyId));
    if (!raw) return DEFAULT_FAVORITE_SHORTCUTS;
    const parsed = JSON.parse(raw) as FavoriteShortcut[];
    if (!Array.isArray(parsed)) return DEFAULT_FAVORITE_SHORTCUTS;
    return parsed;
  } catch {
    return DEFAULT_FAVORITE_SHORTCUTS;
  }
}

function writeShortcuts(companyId: string | null, shortcuts: FavoriteShortcut[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey(companyId), JSON.stringify(shortcuts));
  window.dispatchEvent(new CustomEvent('logstoka:favorite-shortcuts-updated'));
}

export function useFavoriteShortcuts() {
  const { companyId } = useLogstokaTenant();
  const operationalProfile = useMemo(() => loadOperationalProfile(companyId), [companyId]);
  const marketplaceActive = isMarketplaceModuleActive(companyId, operationalProfile);
  const shortcutCatalog = useMemo(
    () =>
      marketplaceActive
        ? SHORTCUT_CATALOG
        : SHORTCUT_CATALOG.filter((item) => !['integrations', 'sales'].includes(item.id)),
    [marketplaceActive],
  );

  const [shortcuts, setShortcuts] = useState<FavoriteShortcut[]>(() => readShortcuts(companyId));

  useEffect(() => {
    setShortcuts(readShortcuts(companyId));
  }, [companyId]);

  useEffect(() => {
    const refresh = () => setShortcuts(readShortcuts(companyId));
    window.addEventListener('logstoka:favorite-shortcuts-updated', refresh);
    return () => window.removeEventListener('logstoka:favorite-shortcuts-updated', refresh);
  }, [companyId]);

  const saveShortcuts = useCallback(
    (next: FavoriteShortcut[]) => {
      setShortcuts(next);
      writeShortcuts(companyId, next);
    },
    [companyId],
  );

  const addShortcut = useCallback(
    (id: string) => {
      const item = shortcutCatalog.find((entry) => entry.id === id);
      if (!item) return;
      setShortcuts((current) => {
        if (current.some((entry) => entry.id === id)) return current;
        const next = [...current, item];
        writeShortcuts(companyId, next);
        return next;
      });
    },
    [companyId, shortcutCatalog],
  );

  const removeShortcut = useCallback(
    (id: string) => {
      setShortcuts((current) => {
        const next = current.filter((entry) => entry.id !== id);
        writeShortcuts(companyId, next);
        return next;
      });
    },
    [companyId],
  );

  const resetShortcuts = useCallback(() => {
    saveShortcuts(DEFAULT_FAVORITE_SHORTCUTS);
  }, [saveShortcuts]);

  const availableToAdd = shortcutCatalog.filter(
    (item) => !shortcuts.some((entry) => entry.id === item.id),
  );

  return {
    shortcuts,
    shortcutCatalog,
    saveShortcuts,
    addShortcut,
    removeShortcut,
    resetShortcuts,
    availableToAdd,
  };
}
