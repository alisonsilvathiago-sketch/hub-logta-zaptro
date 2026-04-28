import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { 
  Package, Search, Plus, Download, Box, Activity, History as HistoryIcon,
  User, TrendingUp, AlertCircle, MapPin, Save, Edit2, 
  Trash2, QrCode as QrCodeIcon, ArrowUpRight, ArrowDownRight,
  FileText, Calendar, Filter as FilterIcon, Search as SearchIcon, Eye, Target,
  TrendingDown, Zap, CheckCircle2, ChevronRight, BarChart3, Layers, Truck,
  Settings, ExternalLink, ShieldCheck, Clock, RefreshCw, BarChart, PieChart as PieChartIcon,
  FileBarChart, AlertTriangle, FileUp, Info, MoreVertical, ArrowLeftRight, DollarSign
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart as RechartsBarChart, Bar, PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { supabase } from '../../lib/supabase';
import LogtaModal from '../../components/Modal';
import MetricCard from '../../components/MetricCard';
import ModuleLayout from '../../layouts/ModuleLayout';

// --- Types ---
interface StockItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  min_stock: number;
  unit: string;
  status: 'NORMAL' | 'LOW' | 'OUT' | 'INACTIVE';
  active: boolean;
  location: string;
  value: number;
  cost: number;
  description?: string;
}

interface Movement {
  id: string;
  item_id: string;
  item_name: string;
  sku: string;
  type: 'ENTRADA' | 'SAIDA' | 'AJUSTE' | 'TRANSFERENCIA';
  quantity: number;
  unit_cost?: number;
  timestamp: string;
  responsible: string;
  origin: string;
  observation: string;
}

const Inventory: React.FC = () => {
  const { profile } = useAuth();
  const { company } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();
  const { tab } = useParams<{ tab: string }>();

  const activeTab = tab || 'materiais';

  const [items, setItems] = useState<StockItem[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);
  
  // Modals
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [isMovDetailModalOpen, setIsMovDetailModalOpen] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [movTypeFilter, setMovTypeFilter] = useState('ALL');

  // Form States
  const [newItem, setNewItem] = useState({
    sku: '', name: '', category: 'Peças', quantity: '', min_stock: '10',
    unit: 'UN', location: 'Almoxarifado Principal', value: '', cost: '', description: ''
  });

  const [newMovement, setNewMovement] = useState({
    type: 'ENTRADA' as Movement['type'],
    item_id: '',
    quantity: '',
    unit_cost: '',
    origin: '',
    observation: '',
    location: ''
  });

  const fetchData = async () => {
    if (!profile?.company_id) return;
    setLoading(true);
    try {
      // Mock Items
      const mockItems: StockItem[] = [
        { id: '1', sku: 'PNEU-225-MT', name: 'Pneu Aro 22.5 Bridgestone', category: 'Peças', quantity: 45, min_stock: 12, unit: 'UN', status: 'NORMAL', active: true, location: 'Prateleira A1', value: 2450, cost: 1800 },
        { id: '2', sku: 'OLEO-15W40', name: 'Óleo Motor 15W40 20L', category: 'Insumos', quantity: 8, min_stock: 15, unit: 'BD', status: 'LOW', active: true, location: 'Box 02', value: 450, cost: 320 },
        { id: '3', sku: 'FILT-COMB', name: 'Filtro Combustível Scania', category: 'Peças', quantity: 0, min_stock: 5, unit: 'UN', status: 'OUT', active: true, location: 'Prateleira B3', value: 185, cost: 120 },
        { id: '4', sku: 'LONA-01', name: 'Lona de Cobertura 12x4m', category: 'Acessórios', quantity: 3, min_stock: 2, unit: 'UN', status: 'NORMAL', active: true, location: 'Setor C', value: 1200, cost: 950 },
        { id: '5', sku: 'EPI-LUV', name: 'Luva de Proteção Vaqueta', category: 'EPI', quantity: 120, min_stock: 50, unit: 'PR', status: 'NORMAL', active: true, location: 'Almox. Central', value: 15.5, cost: 10 },
        { id: '6', sku: 'FREIO-DISC', name: 'Disco de Freio Dianteiro', category: 'Peças', quantity: 0, min_stock: 4, unit: 'UN', status: 'INACTIVE', active: false, location: 'Depósito Velho', value: 890, cost: 600 },
      ];
      setItems(mockItems);

      // Mock Movements
      const mockMovs: Movement[] = [
        { id: 'm1', item_id: '1', item_name: 'Pneu Aro 22.5 Bridgestone', sku: 'PNEU-225-MT', type: 'ENTRADA', quantity: 10, unit_cost: 1800, timestamp: '22/04/2026 14:20', responsible: 'João Silva', origin: 'NF 9921 - Revenda Pneus', observation: 'Reposição mensal' },
        { id: 'm2', item_id: '2', item_name: 'Óleo Motor 15W40 20L', sku: 'OLEO-15W40', type: 'SAIDA', quantity: 2, unit_cost: 320, timestamp: '22/04/2026 10:15', responsible: 'Ricardo M.', origin: 'Ordem de Serviço #221', observation: 'Troca de óleo Placa ABC-1234' },
        { id: 'm3', item_id: '4', item_name: 'Lona de Cobertura 12x4m', sku: 'LONA-01', type: 'AJUSTE', quantity: 1, unit_cost: 950, timestamp: '21/04/2026 16:30', responsible: 'João Silva', origin: 'Inventário Cíclico', observation: 'Ajuste de perda por rasgo' },
        { id: 'm4', item_id: '5', item_name: 'Luva de Proteção Vaqueta', sku: 'EPI-LUV', type: 'TRANSFERENCIA', quantity: 20, unit_cost: 10, timestamp: '21/04/2026 09:00', responsible: 'Ana Paula', origin: 'Almox. Central → Filial Norte', observation: 'Transferência de estoque' },
        { id: 'm5', item_id: '1', item_name: 'Pneu Aro 22.5 Bridgestone', sku: 'PNEU-225-MT', type: 'SAIDA', quantity: 4, unit_cost: 1800, timestamp: '20/04/2026 15:45', responsible: 'Joaquim', origin: 'Rota #552', observation: 'Substituição em rota' },
      ];
      setMovements(mockMovs);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
  }, [profile?.company_id]);

  const handleTabChange = (tabId: string) => {
    navigate(`/estoque/${tabId}`);
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const kpis = useMemo(() => {
    const totalMaterials = items.length;
    const activeItems = items.filter(i => i.active).length;
    const inactiveItems = items.filter(i => !i.active).length;
    const lowStock = items.filter(i => i.active && i.status === 'LOW').length;
    const outStock = items.filter(i => i.active && i.status === 'OUT').length;
    const totalValue = items.reduce((acc, i) => acc + (i.quantity * i.value), 0);
    return { totalMaterials, activeItems, inactiveItems, lowStock, outStock, totalValue };
  }, [items]);

  const movKpis = useMemo(() => {
    const entries = movements.filter(m => m.type === 'ENTRADA');
    const exits = movements.filter(m => m.type === 'SAIDA');
    const adjustments = movements.filter(m => m.type === 'AJUSTE').length;
    
    const entryVal = entries.reduce((acc, m) => acc + (m.quantity * (m.unit_cost || 0)), 0);
    const exitVal = exits.reduce((acc, m) => acc + (m.quantity * (m.unit_cost || 0)), 0);
    
    return { 
      entriesCount: entries.length, entryVal, 
      exitsCount: exits.length, exitVal,
      adjustments, balance: entryVal - exitVal
    };
  }, [movements]);

  // --- RENDERS ---

  const renderMateriais = () => (
    <div style={styles.tabContent} className="animate-fade-in">
       {/* KPIs GESTÃO DE MATERIAIS */}
        <div style={styles.kpiGrid}>
          <MetricCard 
            title="Total Materiais" 
            value={kpis.totalMaterials} 
            subtitle="Cadastrados na base" 
            icon={Box} 
            iconBg="#f1f5f9" 
            iconColor="#64748b"
            sparkData={[120, 125, 128, kpis.totalMaterials]}
          />
          <MetricCard 
            title="Ativos" 
            value={kpis.activeItems} 
            subtitle="Disponíveis p/ uso" 
            icon={CheckCircle2} 
            iconBg="#ecfdf5" 
            iconColor="#10b981"
            sparkData={[115, 118, 120, kpis.activeItems]}
          />
          <MetricCard 
            title="Inativos" 
            value={kpis.inactiveItems} 
            subtitle="Descontinuados" 
            icon={Trash2} 
            iconBg="#f8fafc" 
            iconColor="#94a3b8"
            sparkData={[5, 6, 8, kpis.inactiveItems]}
          />
          <MetricCard 
            title="Baixo Estoque" 
            value={kpis.lowStock} 
            subtitle="Ação imediata" 
            trend="Alerta" 
            trendNeg 
            icon={AlertTriangle} 
            iconBg="#fef2f2" 
            iconColor="#ef4444"
            sparkData={[2, 4, 3, kpis.lowStock]}
          />
          <MetricCard 
            title="Valor Total" 
            value={formatCurrency(kpis.totalValue)} 
            subtitle="Patrimônio" 
            icon={DollarSign} 
            iconBg="#f5f3ff" 
            iconColor="#8b5cf6"
            sparkData={[22000, 23500, 24000, kpis.totalValue]}
          />
        </div>

       <div style={styles.filterBar}>
          <div style={styles.searchWrapper}>
             <SearchIcon size={18} color="#94a3b8" />
             <input type="text" placeholder="Buscar material por nome, SKU, categoria ou localização..." style={styles.searchInput} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div style={styles.filterGroup}>
             <button style={styles.btnSecondary}><FilterIcon size={16} /> Filtros</button>
             <button style={styles.btnPrimary} onClick={() => setIsCreateModalOpen(true)}><Plus size={16} /> Novo Material</button>
          </div>
       </div>

       <div className="logta-card" style={styles.tableCard}>
          <table style={styles.table}>
             <thead>
                <tr><th style={styles.th}>Nome do Material</th><th style={styles.th}>Categoria</th><th style={styles.th}>SKU / Código</th><th style={styles.th}>Qtd. Atual</th><th style={styles.th}>Estoque Mín.</th><th style={styles.th}>Status</th><th style={styles.th}>Ações</th></tr>
             </thead>
             <tbody>
                {items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()) || i.sku.toLowerCase().includes(searchTerm.toLowerCase())).map(item => (
                   <tr key={item.id} style={styles.tr}>
                      <td style={{...styles.td, fontWeight: 700}} onClick={() => { setSelectedItem(item); setIsDetailModalOpen(true); }} className="cursor-pointer">{item.name}</td>
                      <td style={styles.td}><span style={styles.categoryBadge}>{item.category}</span></td>
                      <td style={styles.td}><code>{item.sku}</code></td>
                      <td style={styles.td}><strong style={{fontSize: '15px'}}>{item.quantity}</strong> <span style={{fontSize: '11px', color: '#94a3b8', fontWeight: 700}}>{item.unit}</span></td>
                      <td style={styles.td}>{item.min_stock} {item.unit}</td>
                      <td style={styles.td}><div style={{...styles.statusTag, backgroundColor: item.status === 'OUT' ? '#fef2f2' : item.status === 'LOW' ? '#fffbeb' : item.status === 'INACTIVE' ? '#f1f5f9' : '#ecfdf5', color: item.status === 'OUT' ? '#ef4444' : item.status === 'LOW' ? '#f59e0b' : item.status === 'INACTIVE' ? '#94a3b8' : '#10b981'}}>{item.status === 'OUT' ? '🔴 Zerado' : item.status === 'LOW' ? '🟡 Baixo' : item.status === 'INACTIVE' ? '⚪ Inativo' : '🟢 Normal'}</div></td>
                      <td style={styles.td}><div style={{display: 'flex', gap: '8px'}}><button style={styles.iconBtnTable} onClick={() => { setSelectedItem(item); setIsDetailModalOpen(true); }}><Eye size={16} /></button><button style={styles.iconBtnTable}><Edit2 size={16} /></button></div></td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );

  const renderMovimentacoes = () => (
    <div style={styles.tabContent} className="animate-fade-in">
       {/* 🔝 1. KPIs MOVIMENTAÇÕES */}
       <div style={styles.kpiGrid}>
          <MetricCard 
            title="Entradas (Mês)" 
            value={movKpis.entriesCount} 
            subtitle={formatCurrency(movKpis.entryVal)} 
            icon={ArrowUpRight} 
            iconBg="#ecfdf5" 
            iconColor="#10b981"
            sparkData={[10, 15, 12, movKpis.entriesCount]}
          />
          <MetricCard 
            title="Saídas (Mês)" 
            value={movKpis.exitsCount} 
            subtitle={formatCurrency(movKpis.exitVal)} 
            icon={ArrowDownRight} 
            iconBg="#fef2f2" 
            iconColor="#ef4444"
            sparkData={[8, 12, 10, movKpis.exitsCount]}
          />
          <MetricCard 
            title="Ajustes Realizados" 
            value={movKpis.adjustments} 
            subtitle="Inventário" 
            icon={RefreshCw} 
            iconBg="#f1f5f9" 
            iconColor="#64748b"
            sparkData={[2, 3, 1, movKpis.adjustments]}
          />
          <MetricCard 
            title="Saldo Mov." 
            value={formatCurrency(movKpis.balance)} 
            subtitle="Fluxo estoque" 
            icon={Layers} 
            iconBg="#eff6ff" 
            iconColor="#3b82f6"
            sparkData={[1000, 1200, 1100, movKpis.balance]}
          />
          <MetricCard 
            title="Mov. Suspeitas" 
            value="2" 
            subtitle="Detetado pela IA" 
            trend="Risco" 
            trendNeg
            icon={AlertCircle} 
            iconBg="#fef2f2" 
            iconColor="#ef4444"
            sparkData={[0, 1, 0, 2]}
          />
        </div>

       {/* 🔍 FILTROS + ACÇÕES */}
       <div style={styles.filterBar}>
          <div style={{display: 'flex', gap: '12px', flex: 1}}>
             <div style={styles.searchWrapper}>
                <Search size={18} color="#94a3b8" />
                <input type="text" placeholder="Buscar por material, SKU ou responsável..." style={styles.searchInput} />
             </div>
             <select style={styles.selectFilter} value={movTypeFilter} onChange={e => setMovTypeFilter(e.target.value)}>
                <option value="ALL">Todos os Tipos</option>
                <option value="ENTRADA">📥 Entradas</option>
                <option value="SAIDA">📤 Saídas</option>
                <option value="AJUSTE">🔄 Ajustes</option>
                <option value="TRANSFERENCIA">🔁 Transferências</option>
             </select>
          </div>
          <div style={{display: 'flex', gap: '10px'}}>
             <button style={{...styles.btnPrimary}} onClick={() => { setNewMovement({...newMovement, type: 'ENTRADA'}); setIsMovementModalOpen(true); }}><ArrowUpRight size={16} /> Entrada</button>
             <button style={{...styles.btnBlack}} onClick={() => { setNewMovement({...newMovement, type: 'SAIDA'}); setIsMovementModalOpen(true); }}><ArrowDownRight size={16} /> Saída</button>
             <button style={{...styles.btnSecondary}} onClick={() => { setNewMovement({...newMovement, type: 'AJUSTE'}); setIsMovementModalOpen(true); }}><RefreshCw size={16} /> Ajuste</button>
             <button style={{...styles.btnSecondary}} onClick={() => { setNewMovement({...newMovement, type: 'TRANSFERENCIA'}); setIsMovementModalOpen(true); }}><ArrowLeftRight size={16} /> Transferência</button>
          </div>
       </div>

       {/* 📋 EXTRATO DE MOVIMENTAÇÕES */}
       <div className="logta-card" style={styles.tableCard}>
          <table style={styles.table}>
             <thead>
                <tr>
                   <th style={styles.th}>Material / SKU</th>
                   <th style={styles.th}>Tipo</th>
                   <th style={styles.th}>Qtd.</th>
                   <th style={styles.th}>Custo Unit.</th>
                   <th style={styles.th}>Data / Hora</th>
                   <th style={styles.th}>Responsável</th>
                   <th style={styles.th}>Origem / Motivo</th>
                   <th style={styles.th}>Ações</th>
                </tr>
             </thead>
             <tbody>
                {movements.map(m => (
                   <tr key={m.id} style={styles.tr}>
                      <td style={styles.td}>
                         <div><strong>{m.item_name}</strong><br /><code style={{fontSize: '11px'}}>{m.sku}</code></div>
                      </td>
                      <td style={styles.td}>
                         <div style={{
                            ...styles.statusTag,
                            backgroundColor: 
                              m.type === 'ENTRADA' ? '#ecfdf5' : 
                              m.type === 'SAIDA' ? '#fef2f2' : 
                              m.type === 'AJUSTE' ? '#fffbeb' : '#f5f3ff',
                            color: 
                              m.type === 'ENTRADA' ? '#10b981' : 
                              m.type === 'SAIDA' ? '#ef4444' : 
                              m.type === 'AJUSTE' ? '#f59e0b' : '#7c3aed'
                         }}>
                            {m.type === 'ENTRADA' ? '📥 Entrada' : 
                             m.type === 'SAIDA' ? '📤 Saída' : 
                             m.type === 'AJUSTE' ? '🔄 Ajuste' : '🔁 Transf.'}
                         </div>
                      </td>
                      <td style={styles.td}><strong style={{fontSize: '15px'}}>{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</strong></td>
                      <td style={styles.td}>{m.unit_cost ? formatCurrency(m.unit_cost) : '---'}</td>
                      <td style={styles.td}>{m.timestamp}</td>
                      <td style={styles.td}><div style={{display:'flex', alignItems:'center', gap:'8px'}}><User size={14} color="#94a3b8" /> {m.responsible}</div></td>
                      <td style={styles.td}><span style={{fontSize: '12px', color: '#64748b'}} title={m.observation}>{m.origin}</span></td>
                      <td style={styles.td}><button style={styles.iconBtnTable} onClick={() => { setSelectedMovement(m); setIsMovDetailModalOpen(true); }}><Info size={16} /></button></td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );

  const renderRelatorios = () => (
    <div style={styles.tabContent} className="animate-fade-in">
       {/* 🔝 KPIs EXECUTIVOS */}
       <div style={styles.kpiGrid}>
          <MetricCard 
            title="Total de Itens" 
            value="1.542" 
            subtitle={`${items.length} Categorias`} 
            icon={Layers} 
            iconBg="#f1f5f9" 
            iconColor="#64748b"
            sparkData={[1450, 1500, 1520, 1542]}
          />
          <MetricCard 
            title="Valor em Estoque" 
            value={formatCurrency(kpis.totalValue * 1.5)} 
            subtitle="Ativo Circulante" 
            icon={DollarSign} 
            iconBg="#f5f3ff" 
            iconColor="#8b5cf6"
            sparkData={[650000, 680000, 700000, kpis.totalValue * 1.5]}
          />
          <MetricCard 
            title="Giro Médio (Mês)" 
            value="4.2x" 
            subtitle="Alta Rotatividade" 
            trend="+0.3x" 
            icon={Activity} 
            iconBg="#ecfdf5" 
            iconColor="#10b981"
            sparkData={[3.8, 4.0, 4.1, 4.2]}
          />
          <MetricCard 
            title="Abaixo do Mínimo" 
            value={kpis.lowStock} 
            subtitle="Urgente p/ Compras" 
            trend="Alerta" 
            trendNeg 
            icon={TrendingDown} 
            iconBg="#fffbeb" 
            iconColor="#f59e0b"
            sparkData={[12, 15, 10, kpis.lowStock]}
          />
          <MetricCard 
            title="Itens Zerados" 
            value={kpis.outStock} 
            subtitle="Ruptura Operacional" 
            trend="Crítico" 
            trendNeg 
            icon={AlertTriangle} 
            iconBg="#fef2f2" 
            iconColor="#ef4444"
            sparkData={[2, 3, 1, kpis.outStock]}
          />
       </div>

       {/* 📈 GRÁFICOS DE TENDÊNCIA E GIRO */}
       <div style={styles.dashboardGrid}>
          <div className="logta-card" style={{...styles.chartCard, flex: 2}}>
             <div style={styles.cardHeader}>
                <div>
                   <h3 style={styles.chartTitle}>Tendência de Valorização do Estoque</h3>
                   <p style={{margin:0, fontSize: '12px', color: '#94a3b8'}}>Valor total imobilizado nos últimos 6 meses</p>
                </div>
                <div style={styles.exportBar}>
                    <button style={styles.miniBtn}><Download size={14} /> PDF</button>
                    <button style={styles.miniBtn}><FileUp size={14} /> Excel</button>
                </div>
             </div>
             <div style={{height: '350px', marginTop:'24px'}}>
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={[
                      { n: 'Jan', val: 450000 },
                      { n: 'Fev', val: 520000 },
                      { n: 'Mar', val: 480000 },
                      { n: 'Abr', val: 610000 },
                      { n: 'Mai', val: 580000 },
                      { n: 'Jun', val: 720000 },
                   ]}>
                      <defs>
                         <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/><stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Area type="monotone" dataKey="val" stroke="var(--primary)" strokeWidth={3} fill="url(#colorVal)" />
                   </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="logta-card" style={{...styles.chartCard, flex: 1}}>
              <h3 style={styles.chartTitle}>💰 Valor por Categoria</h3>
              <div style={{height:'300px'}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={[{ name: 'Peças', value: 340000, color: '#7c3aed' }, { name: 'Insumos', value: 180000, color: '#10b981' }, { name: 'EPIs', value: 45000, color: '#f59e0b' }]} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                          <Cell fill="#7c3aed" /><Cell fill="#10b981" /><Cell fill="#f59e0b" />
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
              </div>
          </div>
       </div>

       <div style={styles.dashboardGrid}>
          {/* 🔥 PRODUTOS MAIS MOVIMENTADOS */}
          <div className="logta-card" style={{...styles.chartCard, flex: 1}}>
             <h3 style={styles.chartTitle}>🔥 Top Saídas (Consumo)</h3>
             <div style={{height: '250px', marginTop: '20px'}}>
                <ResponsiveContainer width="100%" height="100%">
                   <RechartsBarChart data={[
                      { name: 'Pneu 22.5', qty: 145 },
                      { name: 'Óleo 15W40', qty: 112 },
                      { name: 'Arla 32', qty: 98 },
                      { name: 'Filtro Scania', qty: 85 },
                   ]} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={80} />
                      <Tooltip />
                      <Bar dataKey="qty" fill="var(--primary)" radius={[0, 4, 4, 0]} />
                   </RechartsBarChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* 🐢 PRODUTOS PARADOS */}
          <div className="logta-card" style={{...styles.chartCard, flex: 1}}>
             <h3 style={styles.chartTitle}>🐢 Dinheiro Parado (+60 dias)</h3>
             <div style={{marginTop:'16px', display:'flex', flexDirection:'column', gap:'12px'}}>
                {[
                   { name: 'Lona Cobertura 12m', qty: 3, val: 3600 },
                   { name: 'Pá Mecânica Ext.', qty: 1, val: 12500 },
                   { name: 'Sensor Temp. Antigo', qty: 5, val: 2400 },
                ].map((p, i) => (
                   <div key={i} style={styles.listRow}>
                      <div style={{display:'flex', gap:'12px', alignItems:'center'}}>
                         <div style={{width: 32, height: 32, borderRadius: 8, backgroundColor: '#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center'}}><Package size={16} color="#64748b" /></div>
                         <div><strong>{p.name}</strong><br/><span style={{fontSize:'11px', color:'#94a3b8'}}>{p.qty} unidades paradas</span></div>
                      </div>
                      <div style={{textAlign: 'right'}}>
                         <strong style={{color:'#ef4444'}}>{formatCurrency(p.val)}</strong>
                         <p style={{margin:0, fontSize:'10px', color:'#94a3b8'}}>Prejuízo de Oportunidade</p>
                      </div>
                   </div>
                ))}
             </div>
             <button style={{width:'100%', marginTop:'24px', padding:'12px', borderRadius:'12px', border:'1px dashed #e2e8f0', background:'white', color:'#64748b', fontWeight:800, cursor:'pointer'}}>Ver relatório de obsolescência</button>
          </div>
       </div>

       {/* 🤖 INSIGHTS IA */}
       <div className="logta-card" style={{...styles.chartCard, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border:'none'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
             <h3 style={{...styles.chartTitle, color: 'white'}}><Zap size={18} color="#f59e0b" /> Insights Estratégicos Logta IA</h3>
             <button style={{padding: '8px 16px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', fontSize: '11px', fontWeight: 800}}>Gerar PDF para Diretoria</button>
          </div>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px'}}>
             <div style={{padding:'20px', borderRadius:'16px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)'}}>
                <p style={{margin:0, color:'#10b981', fontWeight:900, fontSize:'12px', textTransform: 'uppercase', letterSpacing: '1px'}}>OTIMIZAÇÃO</p>
                <p style={{margin:'10px 0 0 0', color:'white', opacity:0.8, fontSize:'13px', lineHeight: 1.5}}>Reduzir estoque de <strong>Pneus Aro 22.5</strong> em 15% pode liberar <strong>R$ 15.400</strong> do caixa em 45 dias sem risco operacional.</p>
             </div>
             <div style={{padding:'20px', borderRadius:'16px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)'}}>
                <p style={{margin:0, color:'#3b82f6', fontWeight:900, fontSize:'12px', textTransform: 'uppercase', letterSpacing: '1px'}}>ALERTA DE GIRO</p>
                <p style={{margin:'10px 0 0 0', color:'white', opacity:0.8, fontSize:'13px', lineHeight: 1.5}}><strong>Arla 32</strong> está saindo 22% mais rápido que a média. Sugerimos antecipar compra em 4 dias.</p>
             </div>
             <div style={{padding:'20px', borderRadius:'16px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)'}}>
                <p style={{margin:0, color:'#f59e0b', fontWeight:900, fontSize:'12px', textTransform: 'uppercase', letterSpacing: '1px'}}>RISCO DE PERDA</p>
                <p style={{margin:'10px 0 0 0', color:'white', opacity:0.8, fontSize:'13px', lineHeight: 1.5}}>Acurácia do <strong>Galpão B1</strong> caiu p/ 92%. Recomendamos inventário rotativo emergencial.</p>
             </div>
          </div>
       </div>
    </div>
  );

  const navItems = [
    { id: 'materiais', label: 'Gestão de Materiais', icon: Package },
    { id: 'movimentacoes', label: 'Movimentações', icon: RefreshCw },
    { id: 'relatorios', label: 'Análises & Custos', icon: FileBarChart },
  ];

  return (
    <ModuleLayout
      title={activeTab === 'materiais' ? 'Estoque → Gestão de Materiais' : activeTab === 'movimentacoes' ? 'Estrato de Movimentações' : 'Relatórios Estratégicos'}
      badge="CORE INVENTORY"
      items={navItems}
      activeTab={activeTab}
      onTabChange={handleTabChange}
    >
      <div style={styles.container}>
        {activeTab === 'materiais' && renderMateriais()}
        {activeTab === 'movimentacoes' && renderMovimentacoes()}
        {activeTab === 'relatorios' && renderRelatorios()}
      </div>
      
      {/* ➕ NOVO MATERIAL MODAL */}
      <LogtaModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="➕ Adicionar Novo Material ao Catálogo" width="650px">
         <form style={styles.form} onSubmit={(e) => { e.preventDefault(); toastSuccess('Material cadastrado!'); setIsCreateModalOpen(false); }}>
            <div style={styles.formGrid2}><div style={styles.inputGroup}><label style={styles.labelForm}>Nome do Material *</label><input style={styles.formInput} placeholder="Ex: Filtro de Óleo Volvo" required /></div><div style={styles.inputGroup}><label style={styles.labelForm}>SKU / Código Único</label><input style={styles.formInput} placeholder="AUTO-123-X" /></div></div>
            <div style={styles.formGrid2}><div style={styles.inputGroup}><label style={styles.labelForm}>Categoria</label><select style={styles.formInput}><option>Peças</option><option>Combustível</option><option>Insumos</option><option>Acessórios</option><option>EPI</option></select></div><div style={styles.inputGroup}><label style={styles.labelForm}>Unidade de Medida</label><select style={styles.formInput}><option>UN (Unidade)</option><option>KG (Quilograma)</option><option>L (Litro)</option><option>MT (Metro)</option><option>PR (Par)</option></select></div></div>
            <div style={styles.formGrid3}><div style={styles.inputGroup}><label style={styles.labelForm}>Estoque Mínimo</label><input style={styles.formInput} type="number" placeholder="5" /></div><div style={styles.inputGroup}><label style={styles.labelForm}>Custo Unitário (R$)</label><input style={styles.formInput} type="number" placeholder="0.00" /></div><div style={styles.inputGroup}><label style={styles.labelForm}>Localização</label><input style={styles.formInput} placeholder="Ex: Galpão B1" /></div></div>
            <div style={styles.inputGroup}><label style={styles.labelForm}>Descrição Detalhada</label><textarea style={{...styles.formInput, height: '80px'}} placeholder="Notas técnicas ou observações..." /></div>
            <button type="submit" style={styles.saveBtnFull}>Finalizar Cadastro do Material</button>
         </form>
      </LogtaModal>

      {/* 🔄 NOVA MOVIMENTAÇÃO MODAL */}
      <LogtaModal isOpen={isMovementModalOpen} onClose={() => setIsMovementModalOpen(false)} title={`🔄 Registrar ${newMovement.type.charAt(0) + newMovement.type.slice(1).toLowerCase()}`} width="600px">
         <form style={styles.form} onSubmit={(e) => { e.preventDefault(); toastSuccess('Movimentação registrada!'); setIsMovementModalOpen(false); }}>
            <div style={styles.inputGroup}>
               <label style={styles.labelForm}>Selecionar Produto *</label>
               <select style={styles.formInput} required>
                  <option value="">Selecione um item do inventário...</option>
                  {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
               </select>
            </div>
            <div style={styles.formGrid2}>
               <div style={styles.inputGroup}><label style={styles.labelForm}>Quantidade *</label><input style={styles.formInput} type="number" required placeholder="0" /></div>
               <div style={styles.inputGroup}><label style={styles.labelForm}>Custo Unitário (Opcional)</label><input style={styles.formInput} type="number" placeholder="0.00" /></div>
            </div>
            <div style={styles.inputGroup}><label style={styles.labelForm}>Origem / Destino / Documento</label><input style={styles.formInput} placeholder="Ex: NF 1234 ou Ordem de Serviço #88" /></div>
            <div style={styles.inputGroup}><label style={styles.labelForm}>Motivo / Observação</label><textarea style={{...styles.formInput, height: '80px'}} placeholder="Descreva brevemente o motivo..." /></div>
            <button type="submit" style={{...styles.saveBtnFull, backgroundColor: newMovement.type === 'ENTRADA' ? '#10b981' : newMovement.type === 'SAIDA' ? '#ef4444' : 'var(--primary)'}}>Confirmar Movimentação</button>
         </form>
      </LogtaModal>

      {/* 📌 DETALHE DO MATERIAL MODAL */}
      <LogtaModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title={selectedItem ? `Ficha Técnica: ${selectedItem.name}` : ''} width="850px">
         {selectedItem && (
            <div style={styles.detailContainer}>
               <div style={styles.detailHeader}><div style={styles.detailHero}><div style={styles.boxLarge}><Box size={40} color="var(--primary)" /></div><div style={styles.heroInfo}><h2 style={styles.heroTitle}>{selectedItem.name}</h2><div style={styles.heroBadges}><span style={styles.badgeCode}>{selectedItem.sku}</span><span style={styles.categoryBadge}>{selectedItem.category}</span></div></div></div><div style={styles.heroActions}><button style={styles.editBtn}><Edit2 size={16} /> Editar</button><button style={styles.moreBtn}><MoreVertical size={16} /></button></div></div>
               <div style={styles.detailMainGrid}><div style={styles.detailCol}><section style={styles.detailSection}><h4 style={styles.sectionTitle}>📌 Dados Gerais</h4><div style={styles.infoGrid}><div style={styles.infoItem}><span>Localização</span><strong>{selectedItem.location}</strong></div><div style={styles.infoItem}><span>Unidade</span><strong>{selectedItem.unit}</strong></div><div style={styles.infoItem}><span>Custo Médio</span><strong>{formatCurrency(selectedItem.cost)}</strong></div><div style={styles.infoItem}><span>Cadastrado em</span><strong>10/01/2026</strong></div></div></section><section style={styles.detailSection}><h4 style={styles.sectionTitle}>🔄 Histórico Recente</h4><div style={styles.miniLogList}><div style={styles.logItem}><span>25/04 14:20</span><strong>ENTRADA: +10 UN</strong> <small>via NFE 9921</small></div><div style={styles.logItem}><span>22/04 09:15</span><strong>SAÍDA: -2 UN</strong> <small>Consumo Rota Norte</small></div></div></section></div><div style={styles.detailCol}><section style={styles.statusCardDetail}><h4 style={styles.sectionTitle}>📊 Estoque Atual</h4><div style={styles.stockHero}><h1 style={{...styles.heroTitle, fontSize: '42px', color: selectedItem.status === 'OUT' ? '#ef4444' : '#0f172a'}}>{selectedItem.quantity}</h1><span>{selectedItem.unit} em estoque</span></div><div style={styles.minStockIndicator}><div style={styles.minHeader}><span>Estoque Mínimo</span><strong>{selectedItem.min_stock} {selectedItem.unit}</strong></div><div style={styles.minBar}><div style={{...styles.minFill, width: `${Math.min((selectedItem.quantity / selectedItem.min_stock) * 100, 100)}%`, backgroundColor: selectedItem.quantity < selectedItem.min_stock ? '#ef4444' : '#10b981'}} /></div></div></section><section style={styles.detailSection}><h4 style={styles.sectionTitle}>💰 Valorização</h4><div style={styles.valInfo}><p>Valor imobilizado:</p><h3 style={{color: 'var(--primary)', fontWeight: 950}}>{formatCurrency(selectedItem.quantity * selectedItem.value)}</h3></div></section></div></div>
            </div>
         )}
      </LogtaModal>

      {/* 🔎 DETALHE DA MOVIMENTAÇÃO (AUDITORIA) MODAL */}
      <LogtaModal isOpen={isMovDetailModalOpen} onClose={() => setIsMovDetailModalOpen(false)} title="🔎 Auditoria de Movimentação" width="700px">
          {selectedMovement && (
             <div style={styles.detailContainer}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
                   <div>
                      <h4 style={styles.sectionTitle}>Status do Registro</h4>
                      <span style={{...styles.statusTag, backgroundColor: '#ecfdf5', color: '#10b981'}}>✅ Validado e Sincronizado</span>
                   </div>
                   <div style={{textAlign: 'right'}}>
                      <p style={{margin:0, fontSize: '12px', color: '#94a3b8'}}>Identificador</p>
                      <strong>{selectedMovement.id.toUpperCase()}</strong>
                   </div>
                </div>
                <div style={styles.detailMainGrid}>
                   <div style={{...styles.detailCol, flex: 1.5}}>
                      <section style={styles.detailSection}>
                         <h4 style={styles.sectionTitle}>📦 Itens e Quantidade</h4>
                         <div style={{display: 'flex', gap: '16px', alignItems: 'center'}}>
                            <div style={styles.boxLarge}><Package size={32} color="var(--primary)" /></div>
                            <div>
                               <h3 style={{margin:0}}>{selectedMovement.item_name}</h3>
                               <p style={{margin:0, fontSize: '13px', color: '#64748b'}}>{selectedMovement.sku}</p>
                            </div>
                         </div>
                         <div style={{marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                            <div><span>Tipo</span><br /><strong>{selectedMovement.type}</strong></div>
                            <div><span>Quantidade</span><br /><strong style={{fontSize: '20px', color: selectedMovement.type === 'ENTRADA' ? '#10b981' : '#ef4444'}}>{selectedMovement.quantity > 0 ? `+${selectedMovement.quantity}` : selectedMovement.quantity}</strong></div>
                         </div>
                      </section>
                      <section style={styles.detailSection}>
                         <h4 style={styles.sectionTitle}>📝 Notas e Origem</h4>
                         <p style={{margin:0, fontSize: '14px', fontWeight: 700}}>{selectedMovement.origin}</p>
                         <div style={{marginTop: '12px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '12px', fontSize: '13px', fontStyle: 'italic'}}>"{selectedMovement.observation}"</div>
                      </section>
                   </div>
                   <div style={{...styles.detailCol, flex: 1}}>
                      <section style={styles.detailSection}>
                         <h4 style={styles.sectionTitle}>👤 Responsável</h4>
                         <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                            <div style={{width: 40, height: 40, borderRadius: '50%', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><User size={20} color="var(--primary)" /></div>
                            <strong>{selectedMovement.responsible}</strong>
                         </div>
                         <div style={{marginTop: '16px'}}>
                            <span>Emissão:</span><br />
                            <strong>{selectedMovement.timestamp}</strong>
                         </div>
                      </section>
                      <button style={{...styles.saveBtnFull, backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2'}}>⚠️ Solicitar Reversão</button>
                   </div>
                </div>
             </div>
          )}
      </LogtaModal>
    </ModuleLayout>
  );
};

const styles: Record<string, any> = {
  container: { padding: '0px' },
  tabContent: { display: 'flex', flexDirection: 'column', gap: '24px' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' },
  kpiCard: { backgroundColor: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  kpiInfo: { display: 'flex', flexDirection: 'column', gap: '2px' },
  kpiLabel: { fontSize: '10px', fontWeight: '900', color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' },
  kpiValue: { fontSize: '24px', fontWeight: '950', color: '#0f172a', margin: 0, letterSpacing: '-1px' },
  kpiSub: { fontSize: '10px', color: '#94a3b8', fontWeight: 700 },
  kpiSubSuccess: { fontSize: '10px', color: '#10b981', fontWeight: 800 },
  kpiSubDanger: { fontSize: '10px', color: '#ef4444', fontWeight: 800 },
  kpiSubPrimary: { fontSize: '10px', color: 'var(--primary)', fontWeight: 800 },
  kpiIconWrapper: { width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  filterBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '8px' },
  searchWrapper: { display: 'flex', alignItems: 'center', gap: '12px', flex: 1, backgroundColor: 'white', padding: '12px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', height: '52px' },
  searchInput: { border: 'none', outline: 'none', width: '100%', fontSize: '14px', fontWeight: '600' },
  filterGroup: { display: 'flex', gap: '12px' },
  btnPrimary: { height: '48px', padding: '0 24px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.2)', fontSize: '14px' },
  btnSecondary: { height: '48px', padding: '0 20px', backgroundColor: 'var(--primary-glow)', color: 'var(--primary)', border: '1px solid rgba(124, 58, 237, 0.2)', borderRadius: '14px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' },
  btnBlack: { height: '48px', padding: '0 24px', backgroundColor: '#000000', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', fontSize: '14px' },
  selectFilter: { height: '52px', padding: '0 16px', borderRadius: '16px', border: '1px solid #e2e8f0', backgroundColor: 'white', fontSize: '13px', fontWeight: 800, color: '#445569', outline: 'none' },
  tableCard: { backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '20px 24px', fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9', letterSpacing: '0.5px' },
  td: { padding: '20px 24px', fontSize: '14px', borderBottom: '1px solid #f1f5f9', color: '#1e293b' },
  tr: { transition: 'background-color 0.2s', '&:hover': { backgroundColor: '#f8fafc' } },
  categoryBadge: { padding: '4px 10px', background: '#f1f5f9', borderRadius: '8px', fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase' },
  statusTag: { padding: '5px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: '900', width: 'fit-content' },
  iconBtnTable: { width: '36px', height: '36px', borderRadius: '10px', border: 'none', background: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' },
  dashboardGrid: { display: 'flex', gap: '24px', flexWrap: 'wrap' },
  chartCard: { backgroundColor: 'white', padding: '32px', borderRadius: '32px', border: '1px solid #e2e8f0', flex: 1, minWidth: '350px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  chartTitle: { fontSize: '16px', fontWeight: '900', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' },
  insightCard: { display: 'flex', gap: '16px', padding: '16px', borderRadius: '16px', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' },
  insightIcon: { width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  insightTitle: { fontSize: '13px', fontWeight: '900', margin: 0 },
  insightText: { fontSize: '11px', color: '#64748b', margin: '4px 0 0 0', lineHeight: '1.4' },
  form: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' },
  formGrid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  formGrid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  labelForm: { fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' },
  formInput: { padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', fontWeight: '600' },
  saveBtnFull: { width: '100%', height: '52px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '900', fontSize: '15px', cursor: 'pointer', marginTop: '12px' },
  detailContainer: { padding: '32px' },
  detailHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  detailHero: { display: 'flex', gap: '20px', alignItems: 'center' },
  boxLarge: { width: '70px', height: '70px', borderRadius: '20px', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  heroInfo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  heroTitle: { fontSize: '28px', fontWeight: '950', color: '#0f172a', margin:0, letterSpacing: '-1px' },
  heroBadges: { display: 'flex', gap: '8px' },
  badgeCode: { padding: '4px 10px', backgroundColor: '#f1f5f9', color: '#64748b', borderRadius: '8px', fontSize: '11px', fontWeight: 900 },
  heroActions: { display: 'flex', gap: '12px' },
  editBtn: { padding: '8px 20px', borderRadius: '12px', backgroundColor: '#f1f5f9', color: '#1e293b', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  moreBtn: { width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'white', border: '1px solid #e2e8f0', cursor: 'pointer' },
  detailMainGrid: { display: 'flex', gap: '24px' },
  detailCol: { display: 'flex', flexDirection: 'column', gap: '24px' },
  detailSection: { padding: '24px', backgroundColor: 'white', borderRadius: '24px', border: '1px solid #f1f5f9' },
  sectionTitle: { fontSize: '13px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '20px', letterSpacing: '0.5px' },
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  infoItem: { display: 'flex', flexDirection: 'column', gap: '4px' },
  miniLogList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  logItem: { padding: '12px', backgroundColor: '#f8fafc', borderRadius: '12px', fontSize: '12px' },
  statusCardDetail: { padding: '32px', backgroundColor: '#f8fafc', borderRadius: '28px', textAlign: 'center' as const },
  stockHero: { margin: '20px 0' },
  minStockIndicator: { marginTop: '24px' },
  minHeader: { display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800, marginBottom: '8px', color: '#64748b' },
  minBar: { height: '8px', backgroundColor: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' },
  minFill: { height: '100%', borderRadius: '10px' },
  valInfo: { padding: '24px', backgroundColor: 'var(--primary-light)', borderRadius: '20px', textAlign: 'center' as const },
  exportBar: { display: 'flex', gap: '8px' },
  miniBtn: { padding: '8px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
  listRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' },
};

export default Inventory;
