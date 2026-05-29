import React, { useState, useEffect } from 'react';
import { Bell, Volume2, ShieldCheck, Save, Loader2 } from 'lucide-react';
import { supabaseZaptro } from '../../lib/supabase-zaptro';
import { useAuth } from '../../context/AuthContext';
import { useZaptroTheme } from '../../context/ZaptroThemeContext';
import { notifyZaptro } from './ZaptroNotificationSystem';
import { 
  setWaNotifSoundEnabled, 
  setWaNotifDesktopDesired,
  readWaNotifSoundEnabled,
  readWaNotifDesktopDesired
} from '../../lib/zaptroWaMessageNotifications';

const ZaptroUserPreferences: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const { isDark, palette } = useZaptroTheme();
  const [loading, setLoading] = useState(false);
  
  const [prefs, setPrefs] = useState({
    sound: readWaNotifSoundEnabled(),
    visual: readWaNotifDesktopDesired()
  });

  useEffect(() => {
    if (profile) {
      setPrefs({
        sound: profile.wa_notify_sound ?? readWaNotifSoundEnabled(),
        visual: profile.wa_notify_visual ?? readWaNotifDesktopDesired()
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile?.id) return;
    setLoading(true);
    
    try {
      const { error } = await supabaseZaptro
        .from('profiles')
        .update({
          wa_notify_sound: prefs.sound,
          wa_notify_visual: prefs.visual
        })
        .eq('id', profile.id);

      if (error) throw error;

      // Update local storage too for immediate effect without profile refresh lag
      setWaNotifSoundEnabled(prefs.sound);
      setWaNotifDesktopDesired(prefs.visual);
      
      await refreshProfile();
      notifyZaptro('success', 'Preferências salvas', 'As suas configurações de notificação foram atualizadas.');
    } catch (err: any) {
      notifyZaptro('error', 'Erro ao salvar', err.message || 'Não foi possível salvar as preferências.');
    } finally {
      setLoading(false);
    }
  };

  const cardBg = isDark ? 'rgba(255,255,255,0.03)' : '#ffffff';
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: palette.text, marginBottom: 8 }}>Notificações do WhatsApp</h3>
        <p style={{ fontSize: 14, color: palette.textMuted, fontWeight: 600 }}>
          Controle como o sistema o avisa sobre novas mensagens recebidas em tempo real.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Som */}
        <div 
          onClick={() => setPrefs(p => ({ ...p, sound: !p.sound }))}
          style={{ 
            padding: '20px', 
            borderRadius: 16, 
            backgroundColor: cardBg, 
            border: `1px solid ${border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ 
              width: 44, height: 44, borderRadius: 12, backgroundColor: prefs.sound ? 'rgba(217, 255, 0, 0.1)' : 'rgba(0,0,0,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Volume2 size={22} color={prefs.sound ? palette.lime : palette.textMuted} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: palette.text }}>Sons de notificação</div>
              <div style={{ fontSize: 13, color: palette.textMuted, fontWeight: 600 }}>Tocar um alerta sonoro ao receber mensagens.</div>
            </div>
          </div>
          <div style={{ 
            width: 44, height: 24, borderRadius: 12, 
            backgroundColor: prefs.sound ? palette.lime : (isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'),
            position: 'relative', transition: 'all 0.3s'
          }}>
            <div style={{ 
              width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff',
              position: 'absolute', top: 3, left: prefs.sound ? 23 : 3,
              transition: 'all 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }} />
          </div>
        </div>

        {/* Visual */}
        <div 
          onClick={() => setPrefs(p => ({ ...p, visual: !p.visual }))}
          style={{ 
            padding: '20px', 
            borderRadius: 16, 
            backgroundColor: cardBg, 
            border: `1px solid ${border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ 
              width: 44, height: 44, borderRadius: 12, backgroundColor: prefs.visual ? 'rgba(37, 211, 102, 0.1)' : 'rgba(0,0,0,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Bell size={22} color={prefs.visual ? '#25D366' : palette.textMuted} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: palette.text }}>Notificações visuais</div>
              <div style={{ fontSize: 13, color: palette.textMuted, fontWeight: 600 }}>Mostrar alertas no canto da tela e no browser.</div>
            </div>
          </div>
          <div style={{ 
            width: 44, height: 24, borderRadius: 12, 
            backgroundColor: prefs.visual ? '#25D366' : (isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'),
            position: 'relative', transition: 'all 0.3s'
          }}>
            <div style={{ 
              width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff',
              position: 'absolute', top: 3, left: prefs.visual ? 23 : 3,
              transition: 'all 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }} />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleSave}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 24px',
            borderRadius: 12,
            backgroundColor: '#000',
            color: palette.lime,
            border: 'none',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Salvar Alterações
        </button>
      </div>
    </div>
  );
};

export default ZaptroUserPreferences;
