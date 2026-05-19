import React from 'react';
import { useParams } from 'react-router-dom';
import { Calculator } from 'lucide-react';
import { loadSharedCalculator } from '../lib/logtaCalculatorStorage';

export function LogtaCalculatorPublicView() {
  const { token = '' } = useParams();
  const snapshot = React.useMemo(() => loadSharedCalculator(token), [token]);

  if (!snapshot) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#F9FAFB] p-8 text-center">
        <Calculator size={40} className="text-gray-300" />
        <h1 className="mt-4 text-lg font-black text-gray-900">Cálculo não encontrado</h1>
        <p className="mt-2 text-sm text-gray-500">Este link expirou ou não existe.</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#F9FAFB] px-4 py-10">
      <div className="mx-auto max-w-md rounded-[32px] border border-gray-200 bg-white p-8 shadow-lg">
        <p className="text-[10px] font-black uppercase text-primary">Calculadora Logta — compartilhado</p>
        <h1 className="mt-2 text-xl font-black text-gray-900">{snapshot.title}</h1>
        <p className="mt-1 text-xs text-gray-500">{new Date(snapshot.createdAt).toLocaleString('pt-BR')}</p>
        <div className="mt-6 space-y-3">
          {snapshot.lines.map((l) => (
            <div key={l.label} className="flex justify-between text-sm">
              <span className="font-medium text-gray-600">{l.label}</span>
              <span className="font-bold text-gray-900">R$ {l.value.toLocaleString('pt-BR')}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-between border-t border-gray-100 pt-4">
          <span className="text-xs font-black uppercase text-primary">Total</span>
          <span className="text-xl font-black text-primary">R$ {snapshot.total.toLocaleString('pt-BR')}</span>
        </div>
      </div>
    </div>
  );
}
