import React, { useMemo, useState } from 'react';
import { Cpu, Printer, ScanLine, Scale } from 'lucide-react';
import {
  buildPrinterProfileFromKey,
  detectPrinterProfile,
  detectScannerProfile,
  loadSavedPrinter,
  loadSavedScanner,
} from '@/lib/labelDevices';
import { formatPresetSize, getLabelPreset, THERMAL_PRINTER_OPTIONS } from '@/lib/labelPresets';
import LogstokaPageHeader from '@/components/layout/LogstokaPageHeader';

const SettingsDevicesPanel: React.FC = () => {
  const [printerKey, setPrinterKey] = useState(loadSavedPrinter()?.printerKey ?? 'elgin-l42');
  const printer = useMemo(() => detectPrinterProfile(), [printerKey]);
  const scanner = useMemo(() => detectScannerProfile(), [printerKey]);
  const scannerProfile = loadSavedScanner();
  const preset = getLabelPreset(loadSavedPrinter()?.presetId ?? 'stock');

  return (
    <div className="space-y-6">
      <LogstokaPageHeader
        title="Dispositivos"
        subtitle="Impressoras térmicas, bipadores e equipamentos conectados a esta estação."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <article className="ls-card p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-[#383838]">
            <Printer size={16} />
            Impressoras
          </h2>
          <p className="mt-2 text-xs font-semibold text-[#737373]">{printer.message}</p>
          <label className="mt-3 block text-[10px] font-extrabold uppercase tracking-wider text-[#a3a3a3]">
            Perfil térmico
          </label>
          <select
            className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm font-semibold"
            value={printerKey}
            onChange={(e) => {
              setPrinterKey(e.target.value);
              buildPrinterProfileFromKey(e.target.value);
            }}
          >
            {THERMAL_PRINTER_OPTIONS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.brand} {p.model}
              </option>
            ))}
          </select>
          {printer.profile ? (
            <p className="mt-2 text-xs font-bold text-emerald-700">Ativo: {printer.profile.displayName}</p>
          ) : null}
          <p className="mt-2 text-xs text-[#737373]">
            Tamanho sugerido: <strong>{formatPresetSize(preset)}</strong>
          </p>
        </article>

        <article className="ls-card p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-[#383838]">
            <ScanLine size={16} />
            Bipadores / scanners
          </h2>
          <p className="mt-2 text-xs font-semibold text-[#737373]">{scanner.message}</p>
          {scannerProfile?.lastRead ? (
            <dl className="mt-3 space-y-1 text-xs">
              <div>
                <dt className="font-extrabold uppercase text-[#a3a3a3]">Última leitura</dt>
                <dd className="font-bold text-[#383838]">{scannerProfile.lastRead}</dd>
              </div>
              {scannerProfile.lastReadAt ? (
                <div>
                  <dt className="font-extrabold uppercase text-[#a3a3a3]">Quando</dt>
                  <dd className="font-semibold text-[#525252]">
                    {new Date(scannerProfile.lastReadAt).toLocaleString('pt-BR')}
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : (
            <p className="mt-3 text-xs text-[#737373]">
              Abra <strong>Gerar etiqueta</strong> em um produto e use &quot;Testar bipador&quot;.
            </p>
          )}
        </article>

        <article className="ls-card p-5 opacity-70 md:col-span-2">
          <h2 className="flex items-center gap-2 text-sm font-bold text-[#383838]">
            <Scale size={16} />
            Balanças e coletores
          </h2>
          <p className="mt-2 text-xs font-semibold text-[#737373]">
            Em breve: integração com balanças RS-232 e coletores Android via app companheiro.
          </p>
        </article>
      </div>

      <p className="flex items-center gap-2 text-xs font-semibold text-[#737373]">
        <Cpu size={14} />
        A IA operacional (Aiato) pode alertar sobre impressora offline e falhas de bipagem nas notificações.
      </p>
    </div>
  );
};

export default SettingsDevicesPanel;
