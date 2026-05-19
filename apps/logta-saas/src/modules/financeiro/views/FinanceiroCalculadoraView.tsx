import React from 'react';
import { Calculator, Sparkles } from 'lucide-react';

/** Página leve — calculadora abre no popup global do header. */
export function FinanceiroCalculadoraView() {
  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent('logta-open-calculator'));
  }, []);

  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[32px] border border-primary/20 bg-primary/5 p-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Calculator size={32} />
      </div>
      <h2 className="logta-card-heading text-xl text-gray-900">Calculadora Logta</h2>
      <p className="mt-2 max-w-md text-sm text-gray-600">
        Frete, lucro, combustível e operacional — com histórico e link público para compartilhar somas.
      </p>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent('logta-open-calculator'))}
        className="mt-6 rounded-2xl bg-primary px-6 py-3 text-xs font-bold text-white shadow-lg shadow-primary/20"
      >
        Abrir calculadora
      </button>
      <p className="mt-4 flex items-center justify-center gap-1 text-[10px] font-bold uppercase text-primary">
        <Sparkles size={12} /> Disponível em todo o sistema pelo ícone no topo
      </p>
    </div>
  );
}
