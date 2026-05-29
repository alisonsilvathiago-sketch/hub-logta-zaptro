import { useCallback, useEffect, useState } from 'react';
import { supabaseZaptro } from '../../lib/supabase-zaptro';
import { getVisibleDemoHelpers } from '../../constants/zaptroHelpersDemo';
import { ZAPTRO_APP_ROUTES } from '../../app/zaptroAppRoutes';
import {
  buildRoleIndexEntry,
  emptyRoleIndex,
  mergeRoleIndex,
  type WaLinkContactRoleIndex,
} from './waLinkContactRoles';

export function useWaLinkContactRoleIndex(companyId: string | null | undefined) {
  const [index, setIndex] = useState<WaLinkContactRoleIndex>(emptyRoleIndex);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!companyId) {
      setIndex(emptyRoleIndex());
      return;
    }
    setLoading(true);
    try {
      const parts: WaLinkContactRoleIndex[] = [];

      const { data: drivers } = await supabaseZaptro
        .from('whatsapp_drivers')
        .select('id, name, phone, status')
        .eq('company_id', companyId);

      const driverMap = emptyRoleIndex();
      for (const d of drivers ?? []) {
        const entry = buildRoleIndexEntry(
          'driver',
          String(d.id),
          String(d.name || 'Motorista'),
          String(d.phone || ''),
          {
            subLabel: 'Motorista',
            profilePath: ZAPTRO_APP_ROUTES.driverProfile(String(d.id)),
          },
        );
        if (entry) driverMap.byPhone.set(entry[0], entry[1]);
      }
      parts.push(driverMap);

      const helperMap = emptyRoleIndex();
      for (const h of getVisibleDemoHelpers()) {
        const entry = buildRoleIndexEntry('helper', h.id, h.name, h.phone, {
          subLabel: h.employment === 'agregado' ? 'Ajudante · Agregado' : 'Ajudante',
          avatarUrl: h.photo_url ?? null,
          profilePath: `/app/motoristas/ajudantes/perfil/${encodeURIComponent(h.id)}`,
        });
        if (entry) helperMap.byPhone.set(entry[0], entry[1]);
      }
      parts.push(helperMap);

      setIndex(mergeRoleIndex(...parts));
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { index, loading, reload };
}
