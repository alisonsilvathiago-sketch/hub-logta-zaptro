import React, { useState, useMemo } from 'react';
import { Download, Plus, Trash2, Calculator, Save, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';
import type { ColaboradorRhProfile, RhFinanceConfig, RhFinanceRule, Benefit, FinanceRuleBase, FinanceRuleRecurrence } from '../../ponto/colaboradorRhStorage';
import { loadCollaboratorFinancePayments, resolveColaboradorHolerites, holeriteStatusLabel, holeriteStatusClass, downloadHoleritePdf, downloadHoleritesCsv, competenciaLabel } from '../../lib/rhColaboradorFinance';

function RuleBuilderModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (rule: RhFinanceRule) => void;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'fixo' | 'percentual'>('fixo');
  const [amount, setAmount] = useState('');
  const [base, setBase] = useState<FinanceRuleBase>('salario_bruto');
  const [recurrence, setRecurrence] = useState<FinanceRuleRecurrence>('mensal');
  const [installments, setInstallments] = useState('');

  const handleSave = () => {
    if (!name || !amount) return;
    onSave({
      id: `rule-${Date.now()}`,
      name,
      type,
      amount: Number(amount),
      base: type === 'percentual' ? base : 'fixo',
      recurrence,
      totalInstallments: recurrence === 'parcelado' ? Number(installments) : undefined,
      installmentsPaid: recurrence === 'parcelado' ? 0 : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-[32px] bg-white p-6 shadow-xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 font-bold">✕</button>
        <h3 className="text-lg font-black text-gray-900 mb-6">Criar Regra de Desconto</h3>

        <div className="space-y-4">
          <label className="block">
            <span className="text-[10px] font-black uppercase text-gray-400">Nome da Regra</span>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Pensão, Empréstimo..." className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm" />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-[10px] font-black uppercase text-gray-400">Tipo de Cálculo</span>
              <select value={type} onChange={e => setType(e.target.value as any)} className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm">
                <option value="fixo">Valor Fixo (R$)</option>
                <option value="percentual">Percentual (%)</option>
              </select>
            </label>
            <label className="block">
              <span className="text-[10px] font-black uppercase text-gray-400">Valor / %</span>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm" />
            </label>
          </div>

          {type === 'percentual' && (
            <label className="block">
              <span className="text-[10px] font-black uppercase text-gray-400">Base de Cálculo</span>
              <select value={base} onChange={e => setBase(e.target.value as any)} className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm">
                <option value="salario_bruto">Salário Bruto</option>
                <option value="salario_liquido">Salário Líquido Estimado</option>
              </select>
            </label>
          )}

          <label className="block">
            <span className="text-[10px] font-black uppercase text-gray-400">Recorrência</span>
            <select value={recurrence} onChange={e => setRecurrence(e.target.value as any)} className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm">
              <option value="unica">Única Vez</option>
              <option value="mensal">Mensal / Contínua</option>
              <option value="parcelado">Parcelado</option>
            </select>
          </label>

          {recurrence === 'parcelado' && (
            <label className="block">
              <span className="text-[10px] font-black uppercase text-gray-400">Quantidade de Parcelas</span>
              <input type="number" value={installments} onChange={e => setInstallments(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm" />
            </label>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-xl px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100">Cancelar</button>
          <button onClick={handleSave} className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white hover:bg-primary/90">Salvar Regra</button>
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children, defaultOpen = true }: any) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-[32px] border border-gray-200 bg-white overflow-hidden shadow-sm">
      <button 
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
      >
        <h3 className="text-[14px] font-black text-gray-900 flex items-center gap-2">
          <Icon size={18} className="text-primary" />
          {title}
        </h3>
        {open ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
      </button>
      {open && (
        <div className="px-6 pb-6 border-t border-gray-100 pt-6">
          {children}
        </div>
      )}
    </div>
  );
}

export function ColaboradorFinanceiroTab({
  profile,
  companyId,
  onSaveConfig,
  onSaveSalary,
}: {
  profile: ColaboradorRhProfile;
  companyId: string;
  onSaveConfig: (cfg: RhFinanceConfig) => void;
  onSaveSalary: (salary: number, note: string) => void;
}) {
  const config = profile.financialConfig || { rules: [], benefits: [] };

  const payments = useMemo(
    () => loadCollaboratorFinancePayments(companyId, profile),
    [companyId, profile]
  );
  
  // Create a dynamic profile reference for live simulation
  const dynamicProfile = useMemo(() => ({
    ...profile,
    financialConfig: config,
    currentSalary: profile.currentSalary,
  }), [profile, config]);

  const holerites = useMemo(
    () => resolveColaboradorHolerites(dynamicProfile, payments),
    [dynamicProfile, payments]
  );

  const [salaryDraft, setSalaryDraft] = useState(profile.currentSalary ? String(profile.currentSalary) : '');
  const [salaryNote, setSalaryNote] = useState('');

  const [benType, setBenType] = useState('');
  const [benAmount, setBenAmount] = useState('');

  const [showRuleModal, setShowRuleModal] = useState(false);
  const [selectedHolerite, setSelectedHolerite] = useState<any>(null);

  const handleAddRule = (rule: RhFinanceRule) => {
    onSaveConfig({ ...config, rules: [...config.rules, rule] });
    setShowRuleModal(false);
  };

  const removeRule = (id: string) => {
    onSaveConfig({ ...config, rules: config.rules.filter((d) => d.id !== id) });
  };

  const handleAddBen = () => {
    if (!benType || !benAmount) return;
    const newConfig = { ...config };
    newConfig.benefits.push({
      id: `ben-${Date.now()}`,
      type: benType,
      amount: Number(benAmount),
    });
    onSaveConfig(newConfig);
    setBenType('');
    setBenAmount('');
  };

  const removeBen = (id: string) => {
    onSaveConfig({ ...config, benefits: config.benefits.filter((d) => d.id !== id) });
  };

  const activeHolerite = holerites[0];

  return (
    <div className="space-y-6 pb-20">
      
      {/* HEADER FIXO / RESUMO */}
      <div className="sticky top-0 z-10 rounded-[32px] border border-gray-200 bg-white/90 backdrop-blur-md p-6 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div>
          <h2 className="text-[16px] font-black text-gray-900 flex items-center gap-2">💰 Central Financeira RH</h2>
          <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mt-1">Fechamento em tempo real</p>
        </div>
        
        {activeHolerite && (
          <div className="flex flex-wrap gap-6 items-center">
            <div>
              <p className="text-[9px] font-black uppercase text-gray-400">Bruto Previsto</p>
              <p className="text-sm font-bold text-gray-900">R$ {activeHolerite.grossSalary.toLocaleString('pt-BR')}</p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-gray-400">Descontos</p>
              <p className="text-sm font-bold text-red-700">R$ {activeHolerite.discounts.toLocaleString('pt-BR')}</p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-gray-400">Benefícios (Extras)</p>
              <p className="text-sm font-bold text-emerald-600">R$ {config.benefits.reduce((acc, b) => acc + b.amount, 0).toLocaleString('pt-BR')}</p>
            </div>
            <div className="border-l pl-6">
              <p className="text-[10px] font-black uppercase text-primary">Líquido Projetado</p>
              <p className="text-lg font-black text-gray-900">R$ {activeHolerite.netSalary.toLocaleString('pt-BR')}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* COLUNA ESQUERDA (1) */}
        <div className="space-y-6">
          <SectionCard title="1. Salário & Reajustes" icon={Calculator}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="min-w-0 flex-1">
                <span className="text-[9px] font-black uppercase text-gray-400">Novo salário base (R$)</span>
                <input
                  type="number"
                  value={salaryDraft}
                  onChange={(e) => setSalaryDraft(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold bg-gray-50"
                />
              </label>
              <label className="min-w-0 flex-1">
                <span className="text-[9px] font-black uppercase text-gray-400">Motivo (Ex: Promoção)</span>
                <input
                  type="text"
                  value={salaryNote}
                  onChange={(e) => setSalaryNote(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 text-sm bg-gray-50"
                />
              </label>
              <button
                onClick={() => {
                  onSaveSalary(Number(salaryDraft), salaryNote);
                  setSalaryNote('');
                }}
                className="rounded-xl bg-gray-900 px-5 py-2 text-xs font-bold text-white"
              >
                <Save size={14} className="inline mr-1" /> Salvar Base
              </button>
            </div>
          </SectionCard>

          <SectionCard title="4. Simulação Holerite Atual (Tempo Real)" icon={Calculator}>
            {activeHolerite ? (
              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                <div className="bg-gray-50 px-5 py-4 flex justify-between items-center border-b border-gray-100">
                  <span className="font-black text-sm text-gray-900">Prévia: {competenciaLabel(activeHolerite.competencia)}</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-100 text-amber-800">
                    Simulação Viva
                  </span>
                </div>
                
                <div className="px-5 py-4 border-b border-gray-50">
                  <p className="text-[9px] font-black uppercase text-gray-400 mb-3">Detalhamento Dinâmico</p>
                  <div className="space-y-2">
                    {activeHolerite.lines?.map((l: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-gray-600 font-medium">{l.label}</span>
                        <span className={`font-black ${l.type === 'desconto' ? 'text-red-600' : 'text-gray-900'}`}>
                          {l.type === 'desconto' ? '-' : '+'} R$ {l.amount.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-4 grid grid-cols-2 gap-4">
                   <div>
                     <p className="text-[10px] font-black uppercase text-gray-500">Total Proventos</p>
                     <p className="text-base font-black text-gray-900">R$ {activeHolerite.grossSalary.toLocaleString('pt-BR')}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-[10px] font-black uppercase text-red-400">Total Descontos</p>
                     <p className="text-base font-black text-red-600">R$ {activeHolerite.discounts.toLocaleString('pt-BR')}</p>
                   </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Defina o salário do colaborador para simular.</p>
            )}
          </SectionCard>
        </div>

        {/* COLUNA DO MEIO (2) */}
        <div className="space-y-6">
          <SectionCard title="2. Construtor de Descontos" icon={TrendingDown}>
            <div className="flex justify-between items-center mb-4">
              <p className="text-xs text-gray-500">Regras dinâmicas de descontos aplicadas automaticamente no fechamento.</p>
              <button onClick={() => setShowRuleModal(true)} className="inline-flex items-center gap-1 rounded-lg bg-primary/10 text-primary px-3 py-1.5 text-xs font-bold hover:bg-primary/20">
                <Plus size={14} /> Nova Regra
              </button>
            </div>
            
            {config.rules.length === 0 ? (
              <div className="bg-gray-50 border border-dashed rounded-xl p-6 text-center">
                <p className="text-sm text-gray-400 font-semibold">Nenhuma regra de desconto configurada.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-[10px] uppercase font-black text-gray-400">
                      <th className="py-2 px-3">Regra</th>
                      <th className="py-2 px-3">Tipo</th>
                      <th className="py-2 px-3">Valor / %</th>
                      <th className="py-2 px-3">Recorrência</th>
                      <th className="py-2 px-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {config.rules.map(r => (
                      <tr key={r.id} className="group hover:bg-gray-50/50">
                        <td className="py-3 px-3 font-bold text-gray-900">{r.name}</td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-600">
                            {r.type === 'percentual' ? `% sobre ${r.base}` : 'Fixo'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-red-600">
                          {r.type === 'percentual' ? `${r.amount}%` : `R$ ${r.amount.toLocaleString('pt-BR')}`}
                        </td>
                        <td className="py-3 px-3">
                          {r.recurrence === 'parcelado' ? (
                            <span className="text-xs text-gray-500">Parcelado ({r.installmentsPaid || 0}/{r.totalInstallments})</span>
                          ) : (
                            <span className="capitalize text-xs text-gray-500">{r.recurrence}</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button onClick={() => removeRule(r.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          <SectionCard title="3. Benefícios Ativos" icon={Plus}>
            <div className="flex gap-2 mb-4 items-end">
              <label className="flex-1">
                <span className="text-[9px] font-black uppercase text-gray-400">Descrição (Ex: VR, VA)</span>
                <input type="text" value={benType} onChange={e => setBenType(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm mt-1 bg-gray-50" />
              </label>
              <label className="w-32">
                <span className="text-[9px] font-black uppercase text-gray-400">Valor (R$)</span>
                <input type="number" value={benAmount} onChange={e => setBenAmount(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm mt-1 bg-gray-50" />
              </label>
              <button onClick={handleAddBen} className="bg-emerald-600 text-white rounded-xl px-4 py-2 text-xs font-bold mb-[2px] hover:bg-emerald-700">Add</button>
            </div>
            <ul className="space-y-2">
              {config.benefits.map(d => (
                <li key={d.id} className="flex justify-between items-center bg-emerald-50/30 p-3 rounded-xl border border-emerald-100">
                  <span className="text-sm font-bold text-gray-900">{d.type}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-emerald-700 font-bold">R$ {d.amount}</span>
                    <button onClick={() => removeBen(d.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>

        {/* COLUNA DIREITA (3) */}
        <div className="space-y-6">
          <SectionCard title="5. Histórico de Holerites Fechados" icon={Download} defaultOpen={false}>
            <div className="space-y-3">
              <div className="flex justify-end mb-4">
                <button onClick={() => downloadHoleritesCsv(holerites, profile)} className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-[10px] font-bold text-gray-700 hover:bg-gray-50">
                  <Download size={14} /> Baixar Histórico (CSV)
                </button>
              </div>
              {holerites.map((h) => (
                <div 
                  key={h.id} 
                  className="border rounded-2xl overflow-hidden mb-3 cursor-pointer hover:border-primary transition-colors bg-white shadow-sm"
                  onClick={() => setSelectedHolerite(h)}
                >
                  <div className="flex items-center gap-3 px-5 py-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-gray-900">{competenciaLabel(h.competencia)}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${holeriteStatusClass(h.status)}`}>
                          {holeriteStatusLabel(h.status)}
                        </span>
                      </div>
                      {h.financeTransactionId && (
                        <p className="text-[10px] font-semibold text-primary mt-1">Vinculado Financeiro (Pago em {h.paidAt ? new Date(h.paidAt).toLocaleDateString('pt-BR') : ''})</p>
                      )}
                    </div>
                    
                    <div className="shrink-0 text-right">
                      <p className="text-[10px] font-bold uppercase text-gray-400">Líquido</p>
                      <p className="text-sm font-black text-gray-900">R$ {h.netSalary.toLocaleString('pt-BR')}</p>
                    </div>
                    
                    <button 
                      onClick={(e) => { e.stopPropagation(); downloadHoleritePdf(h, profile); }} 
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-gray-900 px-2.5 py-1.5 text-[9px] font-bold text-white hover:bg-black ml-4"
                    >
                      <Download size={12} /> PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
      {/* POPUP DE HOLERITE MANTIDO DA TAREFA ANTERIOR */}
      {selectedHolerite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-[32px] bg-white p-6 shadow-xl overflow-hidden relative">
            <button 
              onClick={() => setSelectedHolerite(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 font-bold"
            >
              ✕
            </button>
            <h3 className="text-lg font-black text-gray-900 mb-6">Documento Holerite</h3>
            
            <div className="border rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
                <span className="font-black text-sm">{competenciaLabel(selectedHolerite.competencia)}</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${holeriteStatusClass(selectedHolerite.status)}`}>
                  {holeriteStatusLabel(selectedHolerite.status)}
                </span>
              </div>
              <div className="grid gap-3 px-4 py-3 sm:grid-cols-3">
                <div>
                  <p className="text-[9px] font-black uppercase text-gray-400">Bruto</p>
                  <p className="text-sm font-bold text-gray-900">R$ {selectedHolerite.grossSalary.toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-gray-400">Descontos</p>
                  <p className="text-sm font-bold text-red-700">R$ {selectedHolerite.discounts.toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-gray-400">Pago em</p>
                  <p className="text-sm font-bold text-gray-900">{selectedHolerite.paidAt ? new Date(selectedHolerite.paidAt).toLocaleDateString('pt-BR') : '—'}</p>
                </div>
              </div>
              <div className="px-4 py-3 border-t bg-gray-50/50 max-h-64 overflow-y-auto">
                <p className="text-[9px] font-black uppercase text-gray-400 mb-2">Detalhamento</p>
                <div className="space-y-1">
                  {selectedHolerite.lines?.map((l: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-gray-600">{l.label}</span>
                      <span className={`font-bold ${l.type === 'desconto' ? 'text-red-600' : 'text-gray-900'}`}>
                        {l.type === 'desconto' ? '-' : ''} R$ {l.amount.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button 
                onClick={(e) => { e.stopPropagation(); downloadHoleritePdf(selectedHolerite, profile); }}
                className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-black"
              >
                <Download size={14} /> Baixar PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {showRuleModal && <RuleBuilderModal onClose={() => setShowRuleModal(false)} onSave={handleAddRule} />}
    </div>
  );
}
