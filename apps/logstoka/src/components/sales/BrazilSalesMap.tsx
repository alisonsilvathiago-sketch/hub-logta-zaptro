import React, { useCallback, useMemo, useState } from 'react';
import { MapPin, Minus, Plus } from 'lucide-react';
import brazilMap from '@svg-maps/brazil';
import type { SalesByStateRow, SalesDashboardSummary } from '@/lib/salesDashboard';

type BrazilStatePath = {
  id: string;
  name: string;
  path: string;
};

type Props = {
  states: SalesByStateRow[];
  summary: SalesDashboardSummary;
  formatMoney: (value: number) => string;
  formatNumber: (value: number) => string;
};

type TooltipState = {
  id: string;
  name: string;
  x: number;
  y: number;
};

type MapMetrics = {
  label: string;
  orders: number;
  quantity: number;
  value: number;
  freight: number;
  avgTicket: number;
};

const VIEWBOX_WIDTH = 613;
const VIEWBOX_HEIGHT = 639;
const VIEWBOX_CENTER_X = VIEWBOX_WIDTH / 2;
const VIEWBOX_CENTER_Y = VIEWBOX_HEIGHT / 2;
const ZOOM_MIN = 1;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.25;

const BrazilSalesMap: React.FC<Props> = ({ states, summary, formatMoney, formatNumber }) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [zoom, setZoom] = useState(1);

  const salesByState = useMemo(() => {
    const map = new Map<string, SalesByStateRow>();
    for (const row of states) {
      map.set(row.state.toUpperCase(), row);
    }
    return map;
  }, [states]);

  const maxValue = useMemo(() => Math.max(...states.map((s) => s.value), 1), [states]);

  const activeMetrics = useMemo<MapMetrics>(() => {
    if (selectedId) {
      const row = salesByState.get(selectedId.toUpperCase());
      if (row) {
        return {
          label: row.stateName,
          orders: row.orders,
          quantity: row.pieces,
          value: row.value,
          freight: row.avgFreight,
          avgTicket: row.avgTicket,
        };
      }
    }

    return {
      label: 'Brasil',
      orders: summary.orders,
      quantity: summary.quantity,
      value: summary.value,
      freight: summary.freight,
      avgTicket: summary.avgTicket,
    };
  }, [salesByState, selectedId, summary]);

  const getStateFill = useCallback(
    (stateCode: string, isHighlighted: boolean) => {
      if (isHighlighted) return '#ffffff';

      const sales = salesByState.get(stateCode);
      if (!sales || sales.value <= 0) return '#ffedd5';

      const intensity = sales.value / maxValue;
      const r = Math.round(255 - intensity * 35);
      const g = Math.round(237 - intensity * 100);
      const b = Math.round(213 - intensity * 130);
      return `rgb(${r}, ${g}, ${b})`;
    },
    [maxValue, salesByState],
  );

  const handlePointerMove = (
    event: React.PointerEvent<SVGPathElement>,
    id: string,
    name: string,
  ) => {
    const rect = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!rect) return;

    setHoveredId(id);
    setTooltip({
      id,
      name,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  const handlePointerLeave = () => {
    setHoveredId(null);
    setTooltip(null);
  };

  const handleStateClick = (id: string) => {
    setSelectedId((current) => (current === id ? null : id));
  };

  const metricRows = [
    { label: 'Pedidos', value: formatNumber(activeMetrics.orders) },
    { label: 'Quantidade', value: formatNumber(activeMetrics.quantity) },
    { label: 'Valor', value: formatMoney(activeMetrics.value), accent: true },
    { label: 'Frete', value: formatMoney(activeMetrics.freight) },
    { label: 'Ticket Médio', value: formatMoney(activeMetrics.avgTicket) },
  ];

  return (
    <div className="ls-brazil-map">
      <div className="ls-brazil-map__head">
        <MapPin size={16} strokeWidth={2.25} aria-hidden />
        <span>Filtro por Estados</span>
      </div>

      <div className="ls-brazil-map__body">
        <div className="ls-brazil-map__canvas">
          <div className="ls-brazil-map__zoom" aria-label="Controles de zoom">
            <button
              type="button"
              className="ls-brazil-map__zoom-btn"
              aria-label="Aumentar zoom"
              disabled={zoom >= ZOOM_MAX}
              onClick={() => setZoom((current) => Math.min(ZOOM_MAX, current + ZOOM_STEP))}
            >
              <Plus size={16} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              className="ls-brazil-map__zoom-btn"
              aria-label="Diminuir zoom"
              disabled={zoom <= ZOOM_MIN}
              onClick={() => setZoom((current) => Math.max(ZOOM_MIN, current - ZOOM_STEP))}
            >
              <Minus size={16} strokeWidth={2.5} />
            </button>
          </div>

          <svg
            viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
            className="ls-brazil-map__svg"
            role="img"
            aria-label="Mapa interativo do Brasil por estado"
          >
            <g
              transform={`translate(${VIEWBOX_CENTER_X} ${VIEWBOX_CENTER_Y}) scale(${zoom}) translate(${-VIEWBOX_CENTER_X} ${-VIEWBOX_CENTER_Y})`}
            >
              {(brazilMap.locations as BrazilStatePath[]).map((location) => {
                const stateCode = location.id.toUpperCase();
                const isSelected = selectedId === location.id;
                const isHovered = hoveredId === location.id;
                const isHighlighted = isSelected || isHovered;
                const sales = salesByState.get(stateCode);
                const hasSales = Boolean(sales && sales.value > 0);

                return (
                  <path
                    key={location.id}
                    id={location.id}
                    d={location.path}
                    className={[
                      'ls-brazil-map__state',
                      hasSales ? 'ls-brazil-map__state--active' : '',
                      isSelected ? 'ls-brazil-map__state--selected' : '',
                      isHovered ? 'ls-brazil-map__state--hover' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    fill={getStateFill(stateCode, isHighlighted)}
                    stroke={isHighlighted ? '#ea580c' : '#fdba74'}
                    strokeWidth={isHighlighted ? 1.4 : 0.85}
                    onPointerMove={(event) => handlePointerMove(event, location.id, location.name)}
                    onPointerLeave={handlePointerLeave}
                    onClick={() => handleStateClick(location.id)}
                  >
                    <title>
                      {location.name}
                      {sales ? ` · ${formatMoney(sales.value)}` : ''}
                    </title>
                  </path>
                );
              })}
            </g>
          </svg>

          {tooltip ? (
            <div
              className="ls-brazil-map__tooltip"
              style={{
                left: tooltip.x,
                top: tooltip.y,
              }}
            >
              <strong>{tooltip.name}</strong>
            </div>
          ) : null}
        </div>

        <aside className="ls-brazil-map__stats" aria-live="polite">
          <p className="ls-brazil-map__stats-region">{activeMetrics.label}</p>
          {metricRows.map((row) => (
            <div key={row.label} className="ls-brazil-map__stats-row">
              <span>{row.label}</span>
              <strong className={row.accent ? 'ls-brazil-map__stats-value--accent' : undefined}>
                {row.value}
              </strong>
            </div>
          ))}
          {selectedId ? (
            <button type="button" className="ls-brazil-map__clear" onClick={() => setSelectedId(null)}>
              Ver Brasil inteiro
            </button>
          ) : null}
        </aside>
      </div>
    </div>
  );
};

export default BrazilSalesMap;
