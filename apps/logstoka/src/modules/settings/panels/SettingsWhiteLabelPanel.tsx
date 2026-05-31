import React, { useRef } from 'react';
import { ImagePlus, Palette, RotateCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useLogstokaBranding } from '@/context/LogstokaBrandingContext';
import { DEFAULT_BRAND_PRIMARY, isDefaultBranding } from '@/lib/logstokaBranding';

const SettingsWhiteLabelPanel: React.FC = () => {
  const {
    branding,
    setPrimaryColor,
    setLogoUrl,
    setCompanyName,
    setCompanyAddress,
    setCompanyContact,
    resetBranding,
  } = useLogstokaBranding();
  const fileRef = useRef<HTMLInputElement>(null);

  const onLogoPick = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem (PNG, JPG, SVG)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLogoUrl(typeof reader.result === 'string' ? reader.result : null);
      toast.success('Logomarca aplicada no sistema');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-gray-100 pb-6">
        <h2 className="text-xl font-black text-gray-900">White Label</h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Personalize apenas o sistema WMS da sua empresa. Preto e branco permanecem padrão.
          A landing de vendas e páginas públicas não são alteradas — cada tenant com sua identidade.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div>
            <label className="ls-label flex items-center gap-2">
              <Palette size={14} />
              Cor principal da marca
            </label>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <input
                type="color"
                value={branding.primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-12 w-14 cursor-pointer rounded-xl border border-slate-200 bg-white p-1"
                aria-label="Cor principal"
              />
              <input
                type="text"
                value={branding.primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="ls-input max-w-[140px] font-mono text-sm uppercase"
                maxLength={7}
              />
              <button
                type="button"
                className="ls-btn-secondary"
                onClick={() => setPrimaryColor(DEFAULT_BRAND_PRIMARY)}
              >
                Laranja padrão
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Tudo que era laranja no app passa a usar esta cor instantaneamente (botões, badges, menu ativo, destaques).
            </p>
          </div>

          <div>
            <label className="ls-label">Nome da empresa (header e documentos)</label>
            <input
              type="text"
              className="ls-input mt-2"
              value={branding.companyName ?? ''}
              onChange={(e) => setCompanyName(e.target.value.trim() || null)}
              placeholder="Ex.: Pluma Baby Distribuidora"
            />
          </div>

          <div>
            <label className="ls-label">Endereço (rodapé dos documentos A4)</label>
            <input
              type="text"
              className="ls-input mt-2"
              value={branding.companyAddress ?? ''}
              onChange={(e) => setCompanyAddress(e.target.value.trim() || null)}
              placeholder="Rua, número · Cidade · UF · CEP"
            />
          </div>

          <div>
            <label className="ls-label">Contato (rodapé dos documentos)</label>
            <input
              type="text"
              className="ls-input mt-2"
              value={branding.companyContact ?? ''}
              onChange={(e) => setCompanyContact(e.target.value.trim() || null)}
              placeholder="telefone · e-mail · site"
            />
          </div>

          <div>
            <label className="ls-label flex items-center gap-2">
              <ImagePlus size={14} />
              Logomarca da empresa
            </label>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                {branding.logoUrl ? (
                  <img src={branding.logoUrl} alt="Logo da empresa" className="max-h-full max-w-full object-contain p-1" />
                ) : (
                  <span className="text-xs font-bold text-slate-400">Sem logo</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button type="button" className="ls-btn-primary" onClick={() => fileRef.current?.click()}>
                  Enviar logo
                </button>
                {branding.logoUrl && (
                  <button type="button" className="ls-btn-secondary text-sm" onClick={() => setLogoUrl(null)}>
                    Remover logo
                  </button>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onLogoPick(e.target.files?.[0])}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Aparece no menu lateral, topbar, documentos de conferência A4 e comprovantes impressos.
            </p>
          </div>

          {!isDefaultBranding(branding) && (
            <button type="button" className="ls-btn-secondary" onClick={() => { resetBranding(); toast.success('Identidade restaurada ao padrão LogStoka'); }}>
              <RotateCcw size={16} />
              Restaurar padrão LogStoka
            </button>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Pré-visualização ao vivo</p>
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt="" className="h-10 w-10 rounded-lg object-contain" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900 text-xs font-bold text-white">LS</div>
              )}
              <span className="font-black text-gray-900">{branding.companyName || 'Sua empresa WMS'}</span>
            </div>
            <button type="button" className="ls-btn-primary w-full">Botão primário</button>
            <span className="ls-badge inline-flex bg-[var(--ls-brand-soft)] text-[var(--ls-brand-dark)]">
              Badge operacional
            </span>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="ls-settings-nav-item ls-settings-nav-item--active pointer-events-none max-w-[200px]">
                Item menu ativo
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsWhiteLabelPanel;
