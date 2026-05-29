import React from 'react';

export type FleetStatCard = {
  label: string;
  value: string | number;
  hint?: string;
  accent?: boolean;
};

type Props = {
  cards: FleetStatCard[];
};

/** Cards de resumo no topo das páginas Motoristas / Frota / Ajudantes. */
export const ZaptroFleetStatsRow: React.FC<Props> = ({ cards }) => (
  <div
    className="zaptro-fleet-stats-row"
    style={{ gridTemplateColumns: `repeat(${Math.max(cards.length, 1)}, minmax(0, 1fr))` }}
  >
    {cards.map((c) => (
      <div key={c.label} className={`zaptro-fleet-stats-row__card${c.accent ? ' zaptro-fleet-stats-row__card--accent' : ''}`}>
        <p className="zaptro-fleet-stats-row__label">{c.label}</p>
        <p style={{ margin: '8px 0 0', fontSize: 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em' }}>
          {c.value}
        </p>
        {c.hint ? <p className="zaptro-fleet-stats-row__hint">{c.hint}</p> : null}
      </div>
    ))}
  </div>
);
