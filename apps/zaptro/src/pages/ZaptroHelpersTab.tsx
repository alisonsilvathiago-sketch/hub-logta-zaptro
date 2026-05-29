import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus } from 'lucide-react';
import { useZaptroTheme } from '../context/ZaptroThemeContext';
import { ZAPTRO_APP_ROUTES } from '../app/zaptroAppRoutes';
import { getVisibleDemoHelpers, helperEmploymentLabel } from '../constants/zaptroHelpersDemo';
import { ZAPTRO_SHADOW } from '../constants/zaptroShadows';

type Props = {
  onRegister?: () => void;
};

export const ZaptroHelpersTab: React.FC<Props> = () => {
  const navigate = useNavigate();
  const { palette } = useZaptroTheme();
  const d = palette.mode === 'dark';
  const border = palette.sidebarBorder;
  const surface = d ? 'rgba(255,255,255,0.04)' : '#FFFFFF';
  const [search, setSearch] = useState('');
  const helpers = getVisibleDemoHelpers();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return helpers.filter(
      (h) => h.name.toLowerCase().includes(q) || h.phone.includes(search) || (h.email || '').toLowerCase().includes(q),
    );
  }, [helpers, search]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div
          className="zaptro-field-wrap"
          style={{ flex: '1 1 240px', borderColor: border, backgroundColor: palette.searchBg }}
        >
          <Search size={16} color={palette.textMuted} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nome, telemóvel ou e-mail…"
            style={{ color: palette.text }}
          />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {filtered.map((h) => (
          <button
            key={h.id}
            type="button"
            onClick={() => navigate(ZAPTRO_APP_ROUTES.helperProfile(h.id))}
            style={{
              textAlign: 'left',
              padding: 20,
              borderRadius: 20,
              border: `1px solid ${border}`,
              backgroundColor: surface,
              cursor: 'pointer',
              boxShadow: d ? 'none' : ZAPTRO_SHADOW.sm,
              fontFamily: 'inherit',
            }}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: '#0f172a',
                  color: '#d9ff00',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {h.photo_url ? (
                  <img src={h.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  h.name[0]
                )}
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: palette.text }}>{h.name}</p>
                <p style={{ margin: '4px 0 0', fontSize: 11, fontWeight: 600, color: palette.textMuted }}>
                  {helperEmploymentLabel(h.employment)}
                </p>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: palette.textMuted }}>
              {h.status === 'bloqueado' ? 'Bloqueado' : h.status === 'ativo' ? 'Activo' : 'Inactivo'} · {h.phone}
              {h.cpf ? ` · CPF ${h.cpf}` : ''}
            </p>
          </button>
        ))}
        {filtered.length === 0 ? (
          <p style={{ gridColumn: '1 / -1', color: palette.textMuted, fontWeight: 600 }}>Nenhum ajudante encontrado.</p>
        ) : null}
      </div>
    </div>
  );
};
