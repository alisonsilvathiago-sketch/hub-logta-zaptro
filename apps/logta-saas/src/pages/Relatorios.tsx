import React from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Users, 
  Truck, 
  Map as MapIcon, 
  Calendar, 
  Download, 
  Filter, 
  Plus, 
  Zap, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Clock,
  Briefcase,
  FileBarChart,
  LineChart,
  BrainCircuit
} from 'lucide-react';
import { ExportFormatModal } from '../components/ExportFormatModal';
import { LogtaEmptyState } from '../components/EmptyState';
import { LogtaWaveTabStrip } from '../components/LogtaWaveTabStrip';
import { LogtaModuleHeader } from '../components/LogtaModuleHeader';

const Relatorios = () => {
  const location = useLocation();
  const [exportOpen, setExportOpen] = React.useState(false);
  
  const tabs = [
    { id: 'dashboard', label: 'BI', icon: BarChart3, path: '/relatorios/dashboard' },
    { id: 'operacional', label: 'Operacional', icon: Truck, path: '/relatorios/operacional' },
    { id: 'financeiro', label: 'Financeiro', icon: FileBarChart, path: '/relatorios/financeiro' },
    { id: 'clientes', label: 'Clientes', icon: Users, path: '/relatorios/clientes' },
  ];

  return (
    <div className="logta-page h-full w-full space-y-8 animate-in fade-in duration-700">
      <LogtaModuleHeader
        title="Relatórios"
        subtitle="Análise profunda de dados para tomada de decisão estratégica."
        tabs={<LogtaWaveTabStrip tabs={tabs} basePath="/relatorios" defaultTabId="dashboard" />}
      />

      {/* Sub-views via Routes */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <Routes>
          <Route index element={<Navigate to="/relatorios/dashboard" replace />} />
          <Route path="dashboard" element={<RelatoriosDashboardView />} />
          <Route path="operacional" element={<RelatorioOperacionalView />} />
          <Route path="financeiro" element={<RelatorioFinanceiroView />} />
          <Route path="clientes" element={<RelatorioClientesView />} />
        </Routes>
      </div>

      <ExportFormatModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Exportar relatórios"
        getTabularData={() => ({
          title: 'Relatórios Logta — resumo executivo',
          filenameBase: 'relatorios-logta-resumo',
          columns: ['Indicador', 'Valor', 'Tendência'],
          rows: [
            ['Total de Fretes', '1.242', '+8%'],
            ['Receita Total', 'R$ 842k', '+12%'],
            ['Taxa de Sucesso', '98.4%', '+0.2%'],
            ['Lucro Líquido', 'R$ 170k', '+15%'],
          ],
        })}
      />
    </div>
  );
};

// --- Sub-View Components ---

const RelatoriosDashboardView = () => {
  const hasData = true; // Simulação de dados existentes

  if (!hasData) {
    return (
      <LogtaEmptyState 
        type="relatorios" 
        onAction={() => {}}
        iaSuggestion={{
          text: "Gostaria que eu gerasse um resumo executivo automático baseado no seu faturamento do último mês?",
          actionLabel: "Gerar Resumo IA",
          onAction: () => alert('IA processando resumo...')
        }}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Executive Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total de Fretes', value: '1.242', trend: '+8%', icon: Truck },
          { label: 'Receita Total', value: 'R$ 842k', trend: '+12%', icon: TrendingUp },
          { label: 'Taxa de Sucesso', value: '98.4%', trend: '+0.2%', icon: Target },
          { label: 'Lucro Líquido', value: 'R$ 170k', trend: '+15%', icon: BarChart3 },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-gray-100 p-6 rounded-[32px] shadow-sm group hover:border-primary/20 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-gray-50 rounded-2xl text-gray-400 group-hover:text-primary transition-all">
                <s.icon size={20} />
              </div>
              <span className="text-[10px] font-black text-green-500 bg-green-50 px-2 py-1 rounded-lg">{s.trend}</span>
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal">{s.label}</p>
            <h4 className="text-[25px] font-black leading-tight text-gray-900">{s.value}</h4>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart Placeholder */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="logta-card-heading">Crescimento de Receita vs Meta</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-primary rounded-full" /> <span className="text-[10px] font-bold text-gray-400 uppercase">Receita</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-gray-100 rounded-full" /> <span className="text-[10px] font-bold text-gray-400 uppercase">Meta</span></div>
            </div>
          </div>
          <div className="h-64 flex items-end gap-3 px-4">
            {[40, 65, 55, 85, 75, 95, 100, 80, 90, 110, 105, 120].map((h, i) => (
              <div key={i} className="flex-1 space-y-2 group relative">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] font-black py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-all">
                  R$ {h}k
                </div>
                <div className="w-full bg-gray-100 rounded-t-xl group-hover:bg-primary/10 transition-all relative overflow-hidden" style={{ height: '100%' }}>
                  <div className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-xl transition-all duration-700" style={{ height: `${h}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-6 px-4 text-[10px] font-black text-gray-400 uppercase tracking-normal">
            <span>Jan</span>
            <span>Jun</span>
            <span>Dez</span>
          </div>
        </div>

        {/* Distribution Pie Chart Placeholder */}
        <div className="bg-gray-900 rounded-[40px] p-8 text-white flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold mb-8 tracking-tight text-white/90">Composição de Custos</h3>
            <div className="space-y-6">
              {[
                { label: 'Combustível', val: '45%', color: 'bg-primary' },
                { label: 'Manutenção', val: '15%', color: 'bg-blue-400' },
                { label: 'Pessoas (RH)', val: '25%', color: 'bg-yellow-500' },
                { label: 'Outros', val: '15%', color: 'bg-gray-700' },
              ].map((c, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-normal opacity-60">
                    <span>{c.label}</span>
                    <span>{c.val}</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full ${c.color}`} style={{ width: c.val }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 p-5 bg-white/5 rounded-3xl border border-white/10 flex items-center gap-4 group cursor-pointer hover:bg-white/10 transition-all">
            <BrainCircuit className="text-primary animate-pulse" />
            <div>
              <p className="text-[10px] font-black text-primary uppercase tracking-normal">IA Insight</p>
              <p className="text-xs text-gray-400 leading-relaxed font-medium">Combustível subiu 4.2% este mês. Recomendamos otimizar a Rota Sul.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RelatorioOperacionalView = () => {
  const hasData = true;

  if (!hasData) {
    return (
      <LogtaEmptyState 
        type="relatorios" 
        onAction={() => {}}
        iaSuggestion={{
          text: "Quer que eu analise seus atrasos de entrega mais recorrentes?",
          actionLabel: "Analisar Atrasos",
          onAction: () => alert('IA analisando performance operacional...')
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Tempo Médio Entrega', value: '42.5h', icon: Clock, change: '-2h', isGood: true },
          { label: 'Km Total Rodado', value: '14.2k km', icon: MapIcon, change: '+1.2k', isGood: false },
          { label: 'Ocorrências Ativas', value: '12', icon: AlertCircle, change: '-4', isGood: true },
        ].map((m, i) => (
          <div key={i} className="bg-white border border-gray-100 p-6 rounded-[32px] shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                <m.icon size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-normal">{m.label}</p>
                <h4 className="text-[25px] font-black leading-tight text-gray-900">{m.value}</h4>
              </div>
            </div>
            <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${m.isGood ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>{m.change}</span>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <h3 className="logta-card-heading">Desempenho por Região</h3>
          <button className="text-xs font-bold text-primary hover:underline">Ver Mapa de Calor</button>
        </div>
        <div className="space-y-4">
          {[
            { region: 'Grande São Paulo', success: 98, vol: 'R$ 412k', status: 'Alta Eficiência' },
            { region: 'Interior SP', success: 94, vol: 'R$ 212k', status: 'Estável' },
            { region: 'Rio de Janeiro', success: 82, vol: 'R$ 154k', status: 'Atenção (Atrasos)', warning: true },
            { region: 'Minas Gerais', success: 96, vol: 'R$ 84k', status: 'Em Crescimento' },
          ].map((r, i) => (
            <div key={i} className="p-6 bg-gray-50/50 rounded-[32px] flex items-center justify-between hover:bg-gray-100 transition-all group">
              <div className="flex items-center gap-6">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center font-black text-gray-900 group-hover:text-primary transition-all">
                  {r.region.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">{r.region}</p>
                  <p className={`text-[10px] font-bold uppercase ${r.warning ? 'text-red-500' : 'text-gray-400'}`}>{r.status}</p>
                </div>
              </div>
              <div className="flex items-center gap-12">
                <div className="text-right">
                  <p className="text-sm font-black text-gray-900">{r.vol}</p>
                  <p className="text-[10px] text-primary font-bold">{r.success}% sucesso</p>
                </div>
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${r.success}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const RelatorioFinanceiroView = () => {
  const hasData = true;

  if (!hasData) {
    return (
      <LogtaEmptyState 
        type="financeiro" 
        onAction={() => {}}
        iaSuggestion={{
          text: "Posso comparar seus gastos atuais com a média do mercado logístico para este mês?",
          actionLabel: "Benchmark IA",
          onAction: () => alert('Buscando dados de mercado...')
        }}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm">
          <h3 className="logta-card-heading mb-8">Evolução de Margem de Lucro</h3>
          <div className="h-48 flex items-end gap-1 px-4">
            {[12, 15, 14, 18, 22, 20, 24, 26, 22, 25, 28, 30].map((m, i) => (
              <div key={i} className="flex-1 bg-gray-100 rounded-t-md relative group">
                <div className="absolute bottom-0 left-0 right-0 bg-primary/40 group-hover:bg-primary transition-all rounded-t-md" style={{ height: `${m * 3}%` }} />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-[10px] font-black text-gray-400 uppercase tracking-normal px-4">
            <span>Jan</span>
            <span>Dez</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm">
          <h3 className="logta-card-heading mb-8">Análise de Inadimplência</h3>
          <div className="space-y-6">
            {[
              { label: 'Até 15 dias', val: 'R$ 42k', percent: 65, color: 'bg-yellow-400' },
              { label: '15 a 30 dias', val: 'R$ 18k', percent: 25, color: 'bg-orange-500' },
              { label: 'Acima de 30 dias', val: 'R$ 8k', percent: 10, color: 'bg-red-500' },
            ].map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold text-gray-900">{item.label}</span>
                  <span className="text-sm font-black text-gray-900">{item.val}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color}`} style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 p-5 bg-red-50 rounded-3xl border border-red-100">
            <p className="text-[10px] font-black text-red-500 uppercase tracking-normal mb-1">Impacto no Caixa</p>
            <p className="text-xs text-red-700 leading-relaxed font-medium">Inadimplência total representa 8.4% do faturamento mensal. Risco moderado.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const RelatorioClientesView = () => {
  const hasData = true;

  if (!hasData) {
    return (
      <LogtaEmptyState 
        type="clientes" 
        onAction={() => {}}
        iaSuggestion={{
          text: "Deseja que eu identifique os clientes com maior potencial de churn (cancelamento) nesta semana?",
          actionLabel: "Predição de Churn",
          onAction: () => alert('IA processando predição de retenção...')
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-[40px] p-8 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center mb-8">
          <h3 className="logta-card-heading">Ranking de Clientes Mais Lucrativos</h3>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-gray-100 text-[10px] font-black rounded-xl uppercase tracking-normal text-gray-500 hover:text-gray-900 transition-all">Trimestre</button>
            <button className="px-4 py-2 bg-primary text-white text-[10px] font-black rounded-xl uppercase tracking-normal transition-all">Mês Atual</button>
          </div>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-normal">Cliente</th>
              <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-normal text-right">Volume Fretes</th>
              <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-normal text-right">Receita Total</th>
              <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-normal text-right">Margem Líquida</th>
              <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-normal text-center">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {[
              { name: 'Logística Express SP', freights: 142, revenue: 'R$ 84k', margin: '22%', score: 98 },
              { name: 'Varejo Global LTDA', freights: 98, revenue: 'R$ 154k', margin: '18%', score: 92 },
              { name: 'Indústria Metal SA', freights: 156, revenue: 'R$ 212k', margin: '14%', score: 85 },
              { name: 'AgroBrasil Log', freights: 42, revenue: 'R$ 48k', margin: '28%', score: 95 },
            ].map((c, i) => (
              <tr key={i} className="hover:bg-gray-50/50 transition-colors group cursor-pointer">
                <td className="py-5 font-bold text-gray-900">{c.name}</td>
                <td className="py-5 text-right font-medium text-gray-600">{c.freights}</td>
                <td className="py-5 text-right font-black text-gray-900">{c.revenue}</td>
                <td className="py-5 text-right text-xs font-bold text-primary">{c.margin}</td>
                <td className="py-5">
                  <div className="flex justify-center">
                    <div className="w-10 h-10 rounded-full border-4 border-primary/20 flex items-center justify-center text-[10px] font-black text-primary">
                      {c.score}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Relatorios;
