/** Marca Logta: glifo azul + wordmark (login, orçamento público, etc.). */
export function LogtaBrandWordmark({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-2.5 ${className}`.trim()} aria-label="Logta">
      <svg
        className="h-10 w-10 shrink-0 sm:h-11 sm:w-11"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path d="M10 10 V90 H90 V60 H40 V10 Z" fill="#2563EB" />
        <rect x="50" y="10" width="40" height="40" fill="#2563EB" />
      </svg>
      <div
        className="flex items-start text-[#0f172a]"
        style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}
      >
        <span className="text-2xl font-extrabold leading-none tracking-[-0.04em] sm:text-3xl">Logta</span>
        <sup className="ml-0.5 mt-0.5 text-[10px] font-extrabold leading-none sm:mt-1 sm:text-xs">®</sup>
      </div>
    </div>
  );
}
