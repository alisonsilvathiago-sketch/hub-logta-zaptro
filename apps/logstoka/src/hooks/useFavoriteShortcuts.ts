import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_FAVORITE_SHORTCUTS,
  SHORTCUT_CATALOG,
  type FavoriteShortcut,
} from '@/components/layout/inicioNavCatalog';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { isMarketplaceModuleActive } from '@/lib/marketplaceModule';
import { loadOperationalProfile } from '@/lib/operationalProfile';

const STORAGE_KEY = 'logstoka-favorite-shortcuts';

function readShortcuts(): FavoriteShortcut[] {
  if (typeof window === 'undefined') return DEFAULT_FAVORITE_SHORTCUTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_FAVORITE_SHORTCUTS;
    const parsed = JSON.parse(raw) as FavoriteShortcut[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_FAVORITE_SHORTCUTS;
  } catch {
    return DEFAULT_FAVORITE_SHORTCUTS;
  }
}

export function useFavoriteShortcuts() {
  const { companyId } = useLogstokaTenant();
  const operationalProfile = useMemo(() => loadOperationalProfile(companyId), [companyId]);
  const marketplaceActive = isMarketplaceModuleActive(companyId, operationalProfile);
  const shortcutCatalog = useMemo(
    () =>
      marketplaceActive
        ? SHORTCUT_CATALOG
        : SHORTCUT_CATALOG.filter((item) => item.id !== 'integrations'),
    [marketplaceActive],
  );

  const [shortcuts, setShortcuts] = useState<FavoriteShortcut[]>(() => readShortcuts());

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
  }, [shortcuts]);

  const addShortcut = useCallback(
    (id: string) => {
      const item = shortcutCatalog.find((entry) => entry.id === id);
      if (!item) return;
      setShortcuts((current) => {
        if (current.some((entry) => entry.id === id)) return current;
        return [...current, item];
      });
    },
    [shortcutCatalog],
  );

  const removeShortcut = useCallback((id: string) => {
    setShortcuts((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const resetShortcuts = useCallback(() => {
    setShortcuts(DEFAULT_FAVORITE_SHORTCUTS);
  }, []);

  const availableToAdd = shortcutCatalog.filter(
    (item) => !shortcuts.some((entry) => entry.id === item.id),
  );

  return { shortcuts, addShortcut, removeShortcut, resetShortcuts, availableToAdd };
}
