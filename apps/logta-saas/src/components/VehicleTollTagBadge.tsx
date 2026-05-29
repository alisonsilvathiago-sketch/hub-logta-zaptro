import { Link } from 'react-router-dom';
import type { VehicleTollTagInfo } from '../lib/vehicleTollTag';
import { formatVehiclePlateDisplay, getVehicleTollTag } from '../lib/vehicleTollTag';

type Props = {
  plate?: string;
  tag?: VehicleTollTagInfo;
  compact?: boolean;
  showLinks?: boolean;
  className?: string;
};

function ContactlessIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 16" fill="none" aria-hidden>
      <path
        d="M4 8c2.5-4 13.5-4 16 0M1 8c3.5-6 20.5-6 22 0M7 8c1.5-2 8.5-2 10 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MiniQrPlaceholder() {
  const cells = [
    [1, 1, 0, 1],
    [0, 1, 1, 0],
    [1, 0, 1, 1],
    [1, 1, 0, 1],
  ];
  return (
    <div className="grid grid-cols-4 gap-0.5 rounded-sm bg-white/95 p-0.5" aria-hidden>
      {cells.flat().map((on, i) => (
        <div key={i} className={`h-1.5 w-1.5 ${on ? 'bg-gray-900' : 'bg-transparent'}`} />
      ))}
    </div>
  );
}

function BrandWatermark({ brand }: { brand: VehicleTollTagInfo['brand'] }) {
  if (brand === 'sem-parar') {
    return (
      <svg
        className="pointer-events-none absolute -right-4 top-1/2 h-[140%] w-[55%] -translate-y-1/2 opacity-[0.12]"
        viewBox="0 0 120 80"
        fill="none"
        aria-hidden
      >
        <path d="M20 40 L95 8 L95 72 Z" fill="white" />
      </svg>
    );
  }
  if (brand === 'veloe') {
    return (
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-10 w-24 opacity-20"
        style={{
          background:
            'repeating-linear-gradient(90deg, #fff 0 4px, transparent 4px 8px), repeating-linear-gradient(0deg, #fff 0 4px, transparent 4px 8px)',
        }}
        aria-hidden
      />
    );
  }
  return null;
}

function TollTagCard({
  tag,
  plateLabel,
  compact,
}: {
  tag: VehicleTollTagInfo;
  plateLabel: string;
  compact: boolean;
}) {
  const initials = tag.provider
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (!tag.hasTag) {
    return (
      <div
        className={`relative flex items-center gap-3 overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-gray-100 px-4 shadow-sm ${
          compact ? 'h-[52px] min-w-[200px] max-w-[240px]' : 'min-h-[88px] w-full max-w-[340px]'
        }`}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-gray-400">
          —
        </div>
        <div className="min-w-0 text-left">
          <p className="text-xs font-bold text-gray-600">Sem tag de pedágio</p>
          <p className="font-mono text-[10px] font-bold text-gray-500">{plateLabel}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl shadow-md ring-1 ring-black/10 ${
        compact ? 'h-[52px] w-[220px]' : 'w-full max-w-[340px]'
      }`}
      style={{ backgroundColor: tag.cardBg, color: tag.cardFg }}
      title={`${tag.provider} · ${tag.plan} · ${tag.status}`}
    >
      <BrandWatermark brand={tag.brand} />

      <div className={`relative flex h-full items-stretch ${compact ? 'px-2.5 py-2' : 'px-4 py-4'}`}>
        {/* Logo em círculo (estilo Edenred / operadora) */}
        <div className="flex shrink-0 items-center">
          <div
            className="flex items-center justify-center rounded-full bg-white shadow-sm"
            style={{
              width: compact ? 36 : 48,
              height: compact ? 36 : 48,
            }}
          >
            <span
              className="text-center font-black leading-none"
              style={{
                color: tag.cardBg,
                fontSize: compact ? 9 : 11,
                maxWidth: compact ? 30 : 40,
              }}
            >
              {tag.brand === 'sem-parar' ? (
                <span className="block text-[8px] uppercase tracking-tighter">Sem</span>
              ) : (
                initials
              )}
            </span>
          </div>
        </div>

        {/* Conteúdo central */}
        <div className={`flex min-w-0 flex-1 flex-col justify-center ${compact ? 'px-2' : 'px-3'}`}>
          <div className="flex items-start justify-between gap-1">
            <p
              className={`truncate font-black uppercase leading-tight tracking-tight ${
                compact ? 'text-[11px]' : 'text-sm'
              }`}
            >
              {tag.provider}
            </p>
            <ContactlessIcon className={`shrink-0 opacity-90 ${compact ? 'h-3 w-5' : 'h-3.5 w-6'}`} />
          </div>
          {!compact ? (
            <p className="mt-0.5 text-[10px] font-semibold opacity-90">{tag.plan}</p>
          ) : null}
          <p
            className={`font-mono font-bold tracking-wider opacity-95 ${compact ? 'mt-0.5 text-[8px]' : 'mt-2 text-[10px]'}`}
          >
            {tag.tagNumber}
          </p>
          {!compact ? (
            <p className="mt-1.5 font-mono text-[11px] font-black tracking-widest opacity-90">{plateLabel}</p>
          ) : (
            <p className="mt-0.5 font-mono text-[8px] font-bold opacity-80">{plateLabel}</p>
          )}
        </div>

        {/* QR + status */}
        <div className={`flex shrink-0 flex-col items-end justify-between ${compact ? 'gap-1 py-0.5' : 'gap-2'}`}>
          <span
            className="rounded-md px-1.5 py-0.5 text-[8px] font-black uppercase"
            style={{
              backgroundColor: 'rgba(255,255,255,0.22)',
              color: tag.cardFg,
            }}
          >
            {tag.status}
          </span>
          <MiniQrPlaceholder />
        </div>
      </div>
    </div>
  );
}

/** Tag de pedágio no estilo cartão físico (Sem Parar, ConectCar, Veloe). */
export function VehicleTollTagBadge({ plate, tag: tagProp, compact = false, showLinks = true, className = '' }: Props) {
  const tag = tagProp ?? getVehicleTollTag(plate);
  const plateLabel = formatVehiclePlateDisplay(plate);

  if (compact) {
    return (
      <div className={className}>
        <TollTagCard tag={tag} plateLabel={plateLabel} compact />
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="logta-panel-eyebrow">Tag de pedágio no veículo</p>
        {tag.hasTag ? (
          <span className="text-[10px] font-bold uppercase text-gray-400">{tag.status}</span>
        ) : null}
      </div>

      <TollTagCard tag={tag} plateLabel={plateLabel} compact={false} />

      {showLinks && tag.plateKey ? (
        <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase text-primary">
          <Link to={`/frota/veiculos/${encodeURIComponent(plateLabel)}`} className="hover:underline">
            Ficha do veículo →
          </Link>
          {tag.hasTag ? (
            <Link to="/financeiro/operacional/controle-pedagios" className="hover:underline">
              Controle de pedágios →
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
