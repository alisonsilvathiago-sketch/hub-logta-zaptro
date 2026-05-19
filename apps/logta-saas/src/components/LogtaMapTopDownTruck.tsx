/** Tamanho do marcador no mapa Leaflet (px). */
export const LOGTA_TRUCK_MARKER_SIZE = 72;
export const LOGTA_TRUCK_ICON_SIZE = 64;

/** SVG aponta para leste; bearing OSRM é graus a partir do norte → ajuste para CSS rotate. */
export function bearingToTruckRotation(bearingDeg: number) {
  return bearingDeg - 90;
}

/** Caminhão visto de cima (cabine escura + carreta azul) — aponta para a direita. */
export function LogtaMapTopDownTruck({ size = LOGTA_TRUCK_ICON_SIZE }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="drop-shadow-lg"
    >
      <ellipse cx="28" cy="28" rx="24" ry="14" fill="rgba(37,99,235,0.12)" />
      <rect x="30" y="14" width="22" height="28" rx="2.5" fill="#2563EB" stroke="#1D4ED8" strokeWidth="1.4" />
      <rect x="8" y="16" width="20" height="24" rx="4" fill="#1e293b" stroke="#0f172a" strokeWidth="1.2" />
      <rect x="22" y="18" width="5" height="10" rx="1" fill="#93c5fd" stroke="#2563EB" strokeWidth="0.6" />
      <rect x="32" y="18" width="16" height="4" rx="1" fill="#1e40af" opacity={0.35} />
      <circle cx="14" cy="40" r={3.2} fill="#0f172a" stroke="#fff" strokeWidth={1} />
      <circle cx="24" cy="40" r={3.2} fill="#0f172a" stroke="#fff" strokeWidth={1} />
      <circle cx="38" cy="40" r={3.2} fill="#0f172a" stroke="#fff" strokeWidth={1} />
      <circle cx="46" cy="40" r={3.2} fill="#0f172a" stroke="#fff" strokeWidth={1} />
    </svg>
  );
}

/** @param bearingDeg — direção da via (0° = norte), não graus CSS. */
export function truckMarkerHtml(bearingDeg: number) {
  const box = LOGTA_TRUCK_MARKER_SIZE;
  const half = box / 2;
  const rotationDeg = bearingToTruckRotation(bearingDeg);
  return `<div style="transform:rotate(${rotationDeg}deg);width:${box}px;height:${box}px;display:flex;align-items:center;justify-content:center;margin-left:-${half}px;margin-top:-${half}px;filter:drop-shadow(0 3px 6px rgba(0,0,0,.28));">${truckSvgString(LOGTA_TRUCK_ICON_SIZE)}</div>`;
}

function truckSvgString(size = LOGTA_TRUCK_ICON_SIZE) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg"><ellipse cx="28" cy="28" rx="24" ry="14" fill="rgba(37,99,235,0.12)"/><rect x="30" y="14" width="22" height="28" rx="2.5" fill="#2563EB" stroke="#1D4ED8" stroke-width="1.4"/><rect x="8" y="16" width="20" height="24" rx="4" fill="#1e293b" stroke="#0f172a" stroke-width="1.2"/><rect x="22" y="18" width="5" height="10" rx="1" fill="#93c5fd" stroke="#2563EB" stroke-width="0.6"/><rect x="32" y="18" width="16" height="4" rx="1" fill="#1e40af" opacity="0.35"/><circle cx="14" cy="40" r="3.2" fill="#0f172a" stroke="#fff" stroke-width="1"/><circle cx="24" cy="40" r="3.2" fill="#0f172a" stroke="#fff" stroke-width="1"/><circle cx="38" cy="40" r="3.2" fill="#0f172a" stroke="#fff" stroke-width="1"/><circle cx="46" cy="40" r="3.2" fill="#0f172a" stroke="#fff" stroke-width="1"/></svg>`;
}
