import React, { useRef, useState } from 'react';
import { FileUp } from 'lucide-react';
import { toast } from 'react-hot-toast';
import BarcodeScanner from '@/components/ui/BarcodeScanner';
import { logstokaApi } from '@/lib/logstokaApi';

const tabs = [
  { id: 'entry', label: 'Entrada' },
  { id: 'exit', label: 'Saída' },
  { id: 'transfer', label: 'Transferência' },
  { id: 'damage', label: 'Avaria' },
] as const;

const MovementsPage: React.FC = () => {
  const [tab, setTab] = useState<(typeof tabs)[number]['id']>('entry');
  const [lastScan, setLastScan] = useState('');
  const [quantity, setQuantity] = useState(1);
  const xmlRef = useRef<HTMLInputElement>(null);

  const quickRegister = async () => {
    if (!lastScan) {
      toast.error('Leia ou digite um SKU/código primeiro');
      return;
    }
    try {
      const item = { sku: lastScan, quantity };
      if (tab === 'entry') {
        await logstokaApi.createEntry({ sub_type: 'factory', items: [item] });
      } else if (tab === 'exit') {
        await logstokaApi.createOutput({ sub_type: 'sale', items: [item] });
      } else if (tab === 'transfer') {
        toast.error('Informe depósitos origem/destino na API ou use transferência completa');
      } else {
        await logstokaApi.createDamage({ reason: 'other', sku: lastScan, quantity });
      }
      toast.success('Movimentação registrada e estoque atualizado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao registrar');
    }
  };

  const handleXml = async (file: File) => {
    try {
      const xml = await file.text();
      const result = await logstokaApi.importXml(xml);
      toast.success(`Entrada NF-e — ${result.items} produtos (mov. ${result.movementId.slice(0, 8)}…)`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao importar XML');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black">Movimentações</h2>
        <p className="text-sm text-slate-500">Entradas, saídas, transferências e avarias com baixa automática</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-4 py-2 text-sm font-bold ${
              tab === t.id ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'entry' && (
        <div className="ls-card">
          <div className="mb-3 flex items-center gap-2 font-black">
            <FileUp size={18} className="text-emerald-600" />
            Entrada por NF-e (XML)
          </div>
          <input
            ref={xmlRef}
            type="file"
            accept=".xml"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleXml(file);
            }}
          />
          <button type="button" className="ls-btn-primary" onClick={() => xmlRef.current?.click()}>
            Importar XML da NF
          </button>
        </div>
      )}

      <BarcodeScanner
        onScan={(value) => {
          setLastScan(value);
          toast.success(`Código lido: ${value}`);
        }}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="ls-card">
          <h3 className="mb-2 font-black">Registro rápido</h3>
          <label className="ls-label">Quantidade</label>
          <input
            className="ls-input mb-4"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value) || 1)}
          />
          <p className="mb-4 text-sm text-slate-500">
            SKU/código: <strong>{lastScan || '—'}</strong>
          </p>
          <button type="button" className="ls-btn-primary" onClick={() => void quickRegister()}>
            Registrar {tabs.find((t) => t.id === tab)?.label}
          </button>
        </div>

        <div className="ls-card">
          <h3 className="mb-2 font-black">Webhook de venda</h3>
          <p className="text-sm text-slate-600">
            Vendas de marketplace disparam baixa automática via{' '}
            <code className="rounded bg-slate-100 px-1">POST /webhooks/orders</code> com header{' '}
            <code className="rounded bg-slate-100 px-1">x-company-id</code>.
          </p>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-950 p-3 text-xs text-emerald-300">
{`{
  "event": "order.paid",
  "marketplace": "shopee",
  "store": "Stock Express",
  "items": [{ "sku": "ABC-001", "quantity": 2 }]
}`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default MovementsPage;
