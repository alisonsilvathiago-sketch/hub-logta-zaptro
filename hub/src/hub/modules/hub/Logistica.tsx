import React, { useEffect, useRef, useState } from 'react';
import {
  RefreshCw, Layers, Bell, Maximize2, Zap, Play, ShieldCheck, DollarSign, Brain, Lock, Box, Navigation, CheckCircle2, Droplets, TrendingDown, Fuel, ShieldAlert, Anchor, Repeat, FileCheck, Share2, LocateFixed, Users, MapPin, Activity, AlertTriangle, ArrowUpRight, ArrowDownRight, Map as MapIcon, Search, List, Car, MoreHorizontal, Package, Star, TrendingUp, ArrowLeft, ArrowRight, Globe
} from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Marker,
  Popup, ZoomControl
} from 'react-leaflet';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import HubMap, { truckIcon, carIcon, problemIcon } from '../../components/HubMap';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from '@core/lib/supabase';
import { useAuth } from '@core/context/AuthContext';
import { toastSuccess, toastError, toastInfo, toastLoading, toastDismiss } from '@core/lib/toast';
import Pagination from '@shared/components/Pagination';
import HubMetricCard from '@shared/components/HubMetricCard';
import { FuelPump } from '@shared/components/FuelIntelligence';
import type { LucideIcon } from 'lucide-react';
import { hubPillTabStripStyles } from '@shared/styles/hubPillTabStripStyles';
import { HUB_PAGE_SUBTITLE, HUB_SIDEBAR_NAV_LABEL } from '@hub/styles/hubPageTypography';
import { HUB_MASTER_SECTION_NAV } from '@hub/styles/hubMasterSectionNavStyles';

// --- STYLES & HELPERS ---
const getStatusStyles = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'finalizada': return { backgroundColor: '#BFDBFE', color: '#065F46' };
    case 'problema': return { backgroundColor: '#FEE2E2', color: '#991B1B' };
    case 'atraso': return { backgroundColor: '#FEF3C7', color: '#92400E' };
    default: return { backgroundColor: '#E0E7FF', color: '#3730A3' };
  }
};

const BackButton: React.FC = () => {
  const navigate = useNavigate();
  return (
    <button 
      onClick={() => navigate('/master/logistica')}
      style={{
        border: '1px solid var(--border)',
        background: 'white',
        cursor: 'pointer',
        width: '40px',
        height: '40px',
        marginRight: '12px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#64748B',
        transition: 'all 0.2s',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}
      className="hover-scale"
    >
      <ArrowLeft size={20} />
    </button>
  );
};

const LogisticsMonitoring: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState('ALL');

  const [stats, setStats] = useState({
    total_routes: 0,
    active_vehicles: 0,
    alerts_critical: 0,
    estimated_cost: 0
  });

  const [trackingData, setTrackingData] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [optimizations, setOptimizations] = useState<any[]>([]);
  const [showAiInsights, setShowAiInsights] = useState(false);
  const hideAiInsightsTimerRef = useRef<number | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(20);
  const [totalCount, setTotalCount] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      let rQuery = supabase.from('routes').select(`
        *,
        company:companies(name, origin),
        vehicle:vehicles(plate, model, lat, lng, status),
        driver:motoristas(nome)
      `, { count: 'exact' });

      if (itemsPerPage !== 'all') {
        const from = (currentPage - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;
        rQuery = rQuery.range(from, to);
      }

      const [rRes, aRes, tRes, oRes] = await Promise.all([
        rQuery.order('created_at', { ascending: false }),
        supabase.from('alerts').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('global_tracking').select('*, company:companies(name)'),
        supabase.from('logistics_route_optimizations').select('*').order('created_at', { ascending: false }).limit(3)
      ]);

      const mergedVehicles = [...(tRes.data || [])];

      if (rRes.data) {
        setRoutes(rRes.data);
        setTotalCount(rRes.count || 0);
      }
      
      const activeAlerts = aRes.data || [];
      setAlerts(activeAlerts);

      setTrackingData(mergedVehicles);

      const activeOptimizations = oRes.data || [];
      setOptimizations(activeOptimizations);

      setStats(prev => ({
        ...prev,
        total_routes: rRes.count || 0,
        active_vehicles: mergedVehicles.length,
        alerts_critical: activeAlerts.filter((a: any) => a.type === 'critical').length
      }));
    } catch (err) {
      toastError('Erro ao sincronizar torre de controle.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const params = new URLSearchParams(window.location.search);
    const vehicleParam = params.get('vehicle');
    if (vehicleParam) {
      setSearchTerm(vehicleParam);
    }
  }, [currentPage, itemsPerPage]);

  const handleRunOptimizer = async () => {
    const tid = toastLoading('Navigator AI analisando dados da malha...');
    try {
      // Chamada real para a IA (Ollama via Proxy)
      const prompt = `Analise a situação logística atual: ${stats.total_routes} rotas ativas, ${stats.active_vehicles} veículos online e ${stats.alerts_critical} alertas críticos. 
      Gere uma sugestão curta (máximo 200 caracteres) de otimização logística de alto impacto. 
      Retorne APENAS um JSON no formato: {"title": "Título Curto", "suggestion": "Descrição da sugestão", "impact": "Impacto estimado"}`;

      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen2:0.5b', // Modelo leve para resposta rápida
          prompt: prompt,
          stream: false,
          format: 'json'
        })
      });

      let newOpt;
      if (response.ok) {
        const data = await response.json();
        const aiResponse = JSON.parse(data.response);
        newOpt = {
          title: aiResponse.title || 'Otimização Estratégica',
          suggestion: aiResponse.suggestion || 'Consolidação de carga detectada.',
          impact: aiResponse.impact || 'Economia estimada de 10%',
          status: 'ACTIVE',
          created_at: new Date().toISOString()
        };
      } else {
        throw new Error('AI offline');
      }
      
      try {
        await supabase.from('logistics_route_optimizations').insert([newOpt]);
      } catch (err) {
        console.warn('Database insert failed, falling back to local state:', err);
      }
      
      setOptimizations(prev => [newOpt, ...prev]);
      toastSuccess('Novas sugestões de inteligência disponíveis!');

      setShowAiInsights(true);
      if (hideAiInsightsTimerRef.current) {
        window.clearTimeout(hideAiInsightsTimerRef.current);
      }
      hideAiInsightsTimerRef.current = window.setTimeout(() => {
        setShowAiInsights(false);
      }, 10000);
    } catch (err) {
      console.error('AI Error:', err);
      // Fallback para simulação se a IA falhar
      const fallbackOpt = {
        title: 'Otimização de Carga (Simulado)',
        suggestion: 'Consolidação inteligente de rotas na região metropolitana detectada pela malha.',
        impact: 'Economia estimada em R$ 1.250,00',
        status: 'ACTIVE',
        created_at: new Date().toISOString()
      };
      setOptimizations(prev => [fallbackOpt, ...prev]);
      setShowAiInsights(true);
      toastInfo('Sugestão gerada via motor de regras local (IA Indisponível).');
    } finally {
      toastDismiss(tid);
    }
  };

  const mapCenter: [number, number] = [-23.5505, -46.6333];

  const filteredRoutes = routes.filter(r => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      r.driver?.nome?.toLowerCase().includes(searchLower) ||
      r.vehicle?.plate?.toLowerCase().includes(searchLower) ||
      r.company?.name?.toLowerCase().includes(searchLower);

    const activeTabUpper = activeFilterTab.toUpperCase();
    if (activeTabUpper === 'ALL' || activeTabUpper === 'TUDO') return matchesSearch;
    if (activeTabUpper === 'PROBLEMAS') return matchesSearch && (r.status === 'problema' || r.status === 'atraso');
    
    return matchesSearch && r.company?.origin?.toUpperCase() === activeTabUpper;
  });

  const filteredTracking = trackingData.filter(v => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      v.asset_name?.toLowerCase().includes(searchLower) ||
      v.company?.name?.toLowerCase().includes(searchLower) ||
      v.product_source?.toLowerCase().includes(searchLower);

    const activeTabUpper = activeFilterTab.toUpperCase();
    if (activeTabUpper === 'ALL' || activeTabUpper === 'TUDO') return matchesSearch;
    if (activeTabUpper === 'PROBLEMAS') return matchesSearch && (v.status === 'problema' || v.status === 'atraso');
    
    return matchesSearch && v.product_source?.toUpperCase() === activeTabUpper;
  });

  return (
    <div style={styles.tabContent}>
      <header style={styles.header}>
        <div style={styles.titleWrapper}>
          <BackButton />
          <div style={styles.iconBox}><Activity size={24} color="#FFF" /></div>
          <div>
            <h1 style={styles.pageTitle}>Torre de Controle Logístico</h1>
            <p style={styles.pageSub}>Monitoramento autônomo em tempo real de frotas e entregas.</p>
          </div>
        </div>

        <div style={styles.headerActions}>
          <div style={styles.searchWrapper}>
            <Search size={18} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Pesquisar por Motorista, Placa ou Empresa..."
              style={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="hub-premium-pill secondary" onClick={fetchData} style={{ padding: '8px 16px' }}>
            <RefreshCw size={18} />
          </button>
          <button className="hub-premium-pill secondary" style={{ padding: '8px 16px' }} onClick={() => {
            const sidebar = document.getElementById('logistics-sidebar');
            if (sidebar) sidebar.scrollIntoView({ behavior: 'smooth' });
            toastInfo(`Existem ${stats.alerts_critical} alertas críticos aguardando sua ação.`);
          }}>
            <Bell size={18} />
            <div style={styles.alertBadge}>{stats.alerts_critical}</div>
          </button>
        </div>
      </header>

      <div style={styles.statsGrid}>
        <KPIItem label="Rotas Ativas" value={stats.total_routes} trend="+12%" trendUp={true} icon={List} />
        <KPIItem label="Veículos Online" value={stats.active_vehicles} trend="+5" trendUp={true} icon={Car} />
        <KPIItem label="Alertas Críticos" value={stats.alerts_critical} trend="-2" trendUp={false} icon={AlertTriangle} />
        <KPIItem label="Custo Operacional" value={`R$ ${(stats.estimated_cost / 1000).toFixed(1)}k`} trend="+8%" trendUp={false} icon={TrendingUp} />
      </div>

      <div style={styles.mainLayout}>
        <div style={styles.contentCol}>
          <div style={styles.controlBar}>
            <div style={styles.filterTabsSmall}>
              {['Tudo', 'Logta', 'Problemas'].map((tab) => (
                <button
                  key={tab}
                  style={{
                    ...styles.filterTabSmall,
                    ...(activeFilterTab === tab.toLowerCase() ? styles.filterTabSmallActive : {})
                  }}
                  onClick={() => setActiveFilterTab(tab.toLowerCase())}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div style={styles.viewToggle}>
              <button style={{...styles.toggleBtn, backgroundColor: viewMode === 'map' ? '#0F172A' : 'transparent', color: viewMode === 'map' ? '#FFF' : '#94A3B8'}} onClick={() => setViewMode('map')}>
                <MapIcon size={18} /> Mapa
              </button>
              <button style={{...styles.toggleBtn, backgroundColor: viewMode === 'list' ? '#0F172A' : 'transparent', color: viewMode === 'list' ? '#FFF' : '#94A3B8'}} onClick={() => setViewMode('list')}>
                <List size={18} /> Lista
              </button>
            </div>
          </div>

          <div style={styles.viewContainer}>
            {viewMode === 'map' ? (
              <div style={styles.mapWrapper}>
                <HubMap center={mapCenter as any} zoom={13} zoomControl={false}>
                  <ZoomControl position="bottomright" />
                  {filteredTracking.map(v => (
                    <Marker key={v.id} position={[v.lat, v.lng] as any} icon={v.status === 'problema' ? problemIcon : (v.asset_type === 'van' ? carIcon : truckIcon)}>
                      <Popup>
                        <div style={styles.popupContainer}>
                          <h4 style={styles.popupTitle}>{v.asset_name || 'Equipamento'}</h4>
                          <p style={styles.popupSub}>{(v.company?.name || 'Geral')} • {v.product_source?.toUpperCase() || 'HUB'}</p>
                          <div style={{ ...styles.statusTag, backgroundColor: v.status === 'problema' ? '#FEE2E2' : '#BFDBFE' }}>
                            {v.status?.toUpperCase() || 'OFFLINE'}
                          </div>
                          <button style={styles.popupAction} onClick={() => navigate(`/master/clientes?id=${v.id}`)}>Detalhes do Asset</button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </HubMap>
              </div>
            ) : (
              <div style={styles.listWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>EMPRESA / PRODUTO</th>
                      <th style={styles.th}>VEÍCULO / EQUIPAMENTO</th>
                      <th style={styles.th}>PROGRESSO</th>
                      <th style={styles.th}>STATUS</th>
                      <th style={styles.th}>LOCALIZAÇÃO</th>
                      <th style={styles.th}>AÇÕES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTracking.map((v, i) => (
                      <tr key={i} style={styles.tr}>
                        <td style={styles.td}>
                          <div style={styles.companyCell}>
                            <div style={{
                              ...styles.sourceTag,
                              backgroundColor: v.product_source === 'logta' ? '#EFF6FF' : '#EEF2FF',
                              color: v.product_source === 'logta' ? '#059669' : '#4F46E5',
                              padding: '4px 8px',
                              borderRadius: '8px',
                              fontSize: '10px',
                              fontWeight: '800',
                              marginRight: '8px',
                              display: 'inline-block'
                            }}>
                              {v.product_source?.toUpperCase() || 'HUB'}
                            </div>
                            <span style={styles.companyName}>{v.company?.name || 'Geral'}</span>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.driverInfo}>
                            <strong>{v.asset_name || '---'}</strong>
                            <span style={styles.vehiclePlate}>PROGRESSO: {v.progress ? `${v.progress.toFixed(0)}%` : '0%'}</span>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={{ width: '120px', backgroundColor: '#F1F5F9', borderRadius: '8px', height: '8px', overflow: 'hidden' }}>
                            <div style={{ width: `${v.progress || 0}%`, backgroundColor: '#0061FF', height: '100%', borderRadius: '8px', transition: 'width 0.4s ease' }}></div>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={{ ...styles.statusBadge, ...getStatusStyles(v.status) }}>{v.status?.toUpperCase() || 'OFFLINE'}</div>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.timeInfo}>
                            <MapPin size={14} color="#0061FF" />
                            <span>{v.lat?.toFixed(4)}, {v.lng?.toFixed(4)}</span>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <button style={styles.actionBtn} onClick={() => navigate(`/master/clientes?id=${v.id}`)}>
                            <MoreHorizontal size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Pagination currentPage={currentPage} totalItems={filteredTracking.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} onItemsPerPageChange={(val) => {setItemsPerPage(val); setCurrentPage(1);}} />
              </div>
            )}
          </div>
        </div>

        <aside id="logistics-sidebar" style={styles.sidebar}>
          <div style={styles.sidebarSection}>
            <h3 style={styles.sidebarTitle}>Alertas Críticos</h3>
            <div style={styles.alertList}>
              {alerts.length > 0 ? alerts.map((a, i) => (
                <div key={i} style={{ ...styles.alertItem, borderLeftColor: a.type === 'critical' ? '#F43F5E' : '#F59E0B' }}>
                  <span style={styles.alertTime}>{new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <h4 style={styles.alertTitle}>{a.title}</h4>
                  <p style={styles.alertMsg}>{a.message}</p>
                </div>
              )) : (
                <div style={styles.emptyPanelHint}>
                  Nenhum alerta crítico na fila. A torre está monitorando em tempo real — novos eventos aparecem aqui.
                </div>
              )}
            </div>
          </div>

          <div style={{ ...styles.sidebarSection, ...(showAiInsights ? {} : styles.aiCollapsedSection) }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showAiInsights ? '16px' : 0 }}>
              <h3 style={{ ...styles.sidebarTitle, marginBottom: 0 }}>Insights IA</h3>
              <button style={styles.runAiBtn} onClick={handleRunOptimizer}><Zap size={12} /> RODAR AI</button>
            </div>
            {showAiInsights && (
              <>
                {optimizations.length > 0 ? optimizations.map((opt, i) => (
                  <div key={i} style={styles.aiCard}>
                    <Zap size={20} color="#0061FF" style={{ flexShrink: 0 }} />
                    <div>
                      <p style={styles.aiText}><strong>{opt.title}:</strong> {opt.suggestion}</p>
                      <div style={styles.aiImpact}>Impacto: {opt.impact}</div>
                    </div>
                  </div>
                )) : (
                  <div style={styles.emptyPanelHint}>
                    Toque em <strong>RODAR AI</strong> para gerar sugestões de otimização de rotas e cargas.
                  </div>
                )}
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

const LogisticsDestinations: React.FC = () => {
  const [destinos, setDestinos] = useState([
    { id: 1, name: 'Sede Central - SP', status: 'Ativo', shipments: 45, efficiency: '98%' },
    { id: 2, name: 'Filial Sul - RS', status: 'Ativo', shipments: 22, efficiency: '95%' },
    { id: 3, name: 'Centro de Distribuição - RJ', status: 'Em Manutenção', shipments: 0, efficiency: '0%' },
    { id: 4, name: 'Hub Nordeste - PE', status: 'Ativo', shipments: 18, efficiency: '92%' },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDestName, setNewDestName] = useState('');
  const [newDestStatus, setNewDestStatus] = useState('Ativo');

  /** Clientes vinculados à malha / CDs — visão rápida de saúde operacional */
  const clientesMalha = [
    { id: 'c1', nome: 'Distribuidora Norte Ltda', ok: true, destino: 'Sede Central - SP' },
    { id: 'c2', nome: 'Rede Sul Comércio', ok: true, destino: 'Filial Sul - RS' },
    { id: 'c3', nome: 'Atacado Litoral', ok: true, destino: 'Hub Nordeste - PE' },
    { id: 'c4', nome: 'CD Rio Operações', ok: false, destino: 'Centro de Distribuição - RJ', detalhe: 'CD em manutenção — sem despacho' },
  ];
  const okCount = clientesMalha.filter((c) => c.ok).length;

  const openPublicTracking = (params: {
    id: string;
    veiculo?: string;
    motorista?: string;
    origem?: string;
    destino?: string;
    status?: string;
    empresa?: string;
  }) => {
    const sp = new URLSearchParams();
    sp.set('id', params.id);
    if (params.veiculo) sp.set('veiculo', params.veiculo);
    if (params.motorista) sp.set('motorista', params.motorista);
    if (params.origem) sp.set('origem', params.origem);
    if (params.destino) sp.set('destino', params.destino);
    if (params.status) sp.set('status', params.status);
    if (params.empresa) sp.set('empresa', params.empresa);

    const url = `${window.location.origin}/rastreamento-publico?${sp.toString()}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCreateDestino = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDestName.trim()) {
      toastError('Por favor, informe o nome do destino!');
      return;
    }
    const newDest = {
      id: destinos.length + 1,
      name: newDestName,
      status: newDestStatus,
      shipments: newDestStatus === 'Ativo' ? Math.floor(Math.random() * 30) + 5 : 0,
      efficiency: newDestStatus === 'Ativo' ? `${Math.floor(Math.random() * 10) + 90}%` : '0%'
    };
    setDestinos([...destinos, newDest]);
    setNewDestName('');
    setIsModalOpen(false);
    toastSuccess('Novo centro de operação cadastrado!');
  };

  return (
    <div style={styles.destinosPageRoot}>
      <header style={styles.destinosHeader}>
        <div style={styles.titleWrapper}>
          <BackButton />
          <div>
            <h1 style={styles.destinosPageTitle}>Centros & Destinos de Operação</h1>
            <p style={styles.destinosPageSub}>Gerenciamento estratégico de pontos de entrega e CDs Logta.</p>
          </div>
        </div>
        <button className="hub-premium-pill primary" onClick={() => setIsModalOpen(true)}>Novo Destino +</button>
      </header>

      <section style={styles.destinosClientPanel} aria-label="Saúde dos clientes na malha">
        <div style={styles.destinosClientPanelHead}>
          <div style={styles.destinosClientPanelTitle}>Clientes na malha</div>
          <div style={styles.destinosClientSummary}>
            <CheckCircle2 size={18} color="#0061FF" strokeWidth={2.5} />
            <span style={styles.destinosClientSummaryText}>
              <strong>{okCount}</strong> de {clientesMalha.length} com operação OK
            </span>
          </div>
        </div>
        <ul style={styles.destinosClientList}>
          {clientesMalha.map((c) => (
            <li
              key={c.id}
              style={styles.destinosClientRow}
              role="button"
              tabIndex={0}
              onClick={() =>
                openPublicTracking({
                  id: c.id,
                  veiculo: `Operação Logta — ${c.destino}`,
                  motorista: 'Equipe Logta',
                  origem: c.destino,
                  destino: c.destino,
                  status: c.ok ? 'Em trânsito' : 'Problema / manutenção',
                  empresa: c.nome,
                })
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openPublicTracking({
                    id: c.id,
                    veiculo: `Operação Logta — ${c.destino}`,
                    motorista: 'Equipe Logta',
                    origem: c.destino,
                    destino: c.destino,
                    status: c.ok ? 'Em trânsito' : 'Problema / manutenção',
                    empresa: c.nome,
                  });
                }
              }}
            >
              {c.ok ? (
                <CheckCircle2 size={16} color="#0061FF" strokeWidth={2.5} aria-hidden />
              ) : (
                <AlertTriangle size={16} color="#F59E0B" strokeWidth={2.5} aria-hidden />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={styles.destinosClientNome}>{c.nome}</div>
                <div style={styles.destinosClientMeta}>
                  {c.destino}
                  {!c.ok && c.detalhe ? ` · ${c.detalhe}` : ''}
                </div>
              </div>
              <span
                style={{
                  ...styles.destinosClientBadge,
                  color: c.ok ? '#047857' : '#B45309',
                  backgroundColor: c.ok ? 'rgba(0, 97, 255, 0.12)' : 'rgba(245, 158, 11, 0.14)',
                }}
              >
                {c.ok ? 'OK' : 'Atenção'}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div style={styles.destinosGrid}>
        {destinos.map((destino) => (
          <div
            key={destino.id}
            style={{ ...styles.destinoCard, transition: 'transform 0.2s' }}
            className="hover-scale"
            role="button"
            tabIndex={0}
            onClick={() =>
              openPublicTracking({
                id: String(destino.id),
                veiculo: `Base / CD — ${destino.name}`,
                motorista: 'Operação',
                origem: destino.name,
                destino: destino.name,
                status: destino.status === 'Ativo' ? 'Em trânsito' : destino.status,
                empresa: destino.name,
              })
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openPublicTracking({
                  id: String(destino.id),
                  veiculo: `Base / CD — ${destino.name}`,
                  motorista: 'Operação',
                  origem: destino.name,
                  destino: destino.name,
                  status: destino.status === 'Ativo' ? 'Em trânsito' : destino.status,
                  empresa: destino.name,
                });
              }
            }}
          >
            <div style={styles.destinoIcon}>
              <MapPin size={24} color="#0061FF" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={styles.destinoTitle}>{destino.name}</h3>
              <div style={styles.destinoStats}>
                <div style={styles.destinoStat}>
                  <Box size={14} /> <span>{destino.shipments} Envios</span>
                </div>
                <div style={styles.destinoStat}>
                  <Navigation size={14} /> <span>{destino.efficiency} Eficiência</span>
                </div>
              </div>
            </div>
            <div
              style={{
                ...styles.statusBadge,
                flexShrink: 0,
                backgroundColor: destino.status === 'Ativo' ? '#BFDBFE' : '#FEE2E2',
                color: destino.status === 'Ativo' ? '#047857' : '#BE123C',
              }}
            >
              {destino.status}
            </div>
          </div>
        ))}
      </div>

      {/* Novo Destino Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '28px',
            width: '90%',
            maxWidth: '460px',
            padding: '32px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
            border: '1px solid #E2E8F0',
          }}>
            <div style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0F172A', margin: 0 }}>Novo Centro de Operação</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#FFF',
                  color: '#64748B',
                  cursor: 'pointer',
                  fontWeight: '900'
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDestino} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Nome da Filial / CD</label>
                <input 
                  type="text" 
                  placeholder="Ex: Hub Nordeste - PE" 
                  value={newDestName}
                  onChange={(e) => setNewDestName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    fontSize: '14px',
                    fontWeight: '600',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Status Operacional</label>
                <select 
                  value={newDestStatus}
                  onChange={(e) => setNewDestStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    fontSize: '14px',
                    fontWeight: '600',
                    outline: 'none',
                    backgroundColor: '#FFF'
                  }}
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Em Manutenção">Em Manutenção</option>
                </select>
              </div>

              <button 
                type="submit"
                style={{
                  backgroundColor: '#0061FF',
                  color: '#FFFFFF',
                  padding: '14px',
                  borderRadius: '14px',
                  border: 'none',
                  fontWeight: '800',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0, 97, 255, 0.2)'
                }}
              >
                Cadastrar Centro de Operação
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const LogisticsIntelligence: React.FC<{ deliveryActions: any[], refresh: () => void }> = ({ deliveryActions, refresh }) => {
  const roiData = [
    { name: 'Jan', savings: 4500, efficiency: 72 },
    { name: 'Fev', savings: 5200, efficiency: 78 },
    { name: 'Mar', savings: 6100, efficiency: 85 },
    { name: 'Abr', savings: 7800, efficiency: 94 },
  ];

  return (
    <div style={styles.tabContent}>
      <header style={styles.header}>
        <div style={styles.titleWrapper}>
          <BackButton />
          <div>
            <h1 style={styles.pageTitle}>Cérebro de Inteligência Logística</h1>
            <p style={styles.pageSub}>Análise de ROI autônomo e performance da malha logística.</p>
          </div>
        </div>
        <div style={styles.headerActions}>
           <div style={styles.statusBadgeActive}><Activity size={14} color="#0061FF" /> CÉREBRO ATIVO</div>
           <button onClick={refresh} style={styles.refreshBtn}><RefreshCw size={18} /></button>
        </div>
      </header>

      <div style={styles.kpiRow}>
        <KPIItem 
          label="Economia ROI Est." 
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deliveryActions?.length * 150 || 0)} 
          trend="+12%" 
          trendUp={true} 
          icon={DollarSign} 
          color="#0061FF" 
          iconSize={24} 
        />
        <KPIItem 
          label="Segurança (Guardian)" 
          value="98.2%" 
          trend="+2.1%" 
          trendUp={true} 
          icon={ShieldCheck} 
          color="#0061FF" 
          iconSize={24} 
        />
        <KPIItem 
          label="Performance IA" 
          value={`${((deliveryActions?.length || 1) * 1.2).toFixed(1)}x`} 
          trend="+0.5x" 
          trendUp={true} 
          icon={Zap} 
          color="#D9FF00" 
          iconSize={24} 
        />
        <KPIItem 
          label="Uso da Malha" 
          value={`${Math.min(100, (deliveryActions?.length || 0) * 5)}%`} 
          trend="+4%" 
          trendUp={true} 
          icon={Activity} 
          color="#F59E0B" 
          iconSize={24} 
        />
      </div>

      <div style={styles.splitGrid}>
        {/* Left Col: Efficiency Chart */}
        <div style={styles.chartCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={styles.cardTitle}>Evolução de Eficiência Logística</h3>
            <div style={styles.aiStatusBadge}>SAVINGS: +R$ 7.8k</div>
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={roiData}>
                <defs>
                  <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0061FF" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0061FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600, fill: '#94A3B8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600, fill: '#94A3B8'}} />
                <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)'}} />
                <Area type="monotone" dataKey="savings" stroke="#0061FF" strokeWidth={4} fill="url(#colorSavings)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div style={{ ...styles.insightCard, marginTop: '24px', backgroundColor: '#F8FAFC' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <Brain size={24} color="#0061FF" />
              <div>
                <h4 style={{ ...styles.insightTitle, margin: 0 }}>Insight do Navigator AI</h4>
                <p style={{ ...styles.insightText, margin: '4px 0 0' }}>As rotas otimizadas este mês reduziram a emissão de CO2 em 12% e economizaram 1.400 litros de combustível.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Autonomous Logs */}
        <div style={styles.chartCard}>
          <div style={styles.cardHeaderWithBadge}>
             <Brain size={18} color="#0061FF" />
             <h3 style={styles.cardTitle}>Log de Estratégias Autônomas</h3>
             <div style={styles.aiStatusBadge}>MONITORAMENTO IA ATIVO</div>
          </div>
          <div style={{ ...styles.strategyList, maxHeight: '500px', overflowY: 'auto', paddingRight: '8px' }}>
             {deliveryActions.length > 0 ? deliveryActions.map(action => (
               <div key={action.id} style={styles.strategyRow}>
                  <div style={{...styles.strategyIcon, backgroundColor: action.status === 'confirmado' ? '#EFF6FF' : action.status === 'reagendado' ? '#FFFBEB' : '#F8FAF9'}}>
                     {action.status === 'confirmado' && <CheckCircle2 size={14} color="#0061FF" />}
                     {action.status === 'reagendado' && <Repeat size={14} color="#F59E0B" />}
                     {action.status === 'pendente' && <Box size={14} color="#0061FF" />}
                  </div>
                  <div style={styles.strategyMain}>
                     <div style={styles.strategyAction}>Fulfillment: {action.status === 'confirmado' ? 'CONFIRMADO' : action.status === 'reagendado' ? 'REAGENDADO' : 'PENDENTE'}</div>
                     <div style={styles.strategyReason}>Pedido {action.order_id} • Token {action.token}</div>
                  </div>
                  <div style={styles.strategyMeta}>
                     <div style={{...styles.strategyImpact, color: action.status === 'confirmado' ? '#0061FF' : '#0061FF'}}>
                        {action.status === 'confirmado' ? 'Verificado' : 'Autônomo'}
                     </div>
                     <div style={styles.strategyTime}>{new Date(action.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
               </div>
             )) : (
               <div style={{ ...styles.emptyPanelHint, marginTop: '8px' }}>
                 <Brain size={28} color="#CBD5E1" style={{ display: 'block', margin: '0 auto 12px' }} />
                 Sem ações autônomas recentes. Assim que o Navigator processar pedidos, o histórico aparece aqui.
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

const LogisticsAggregates: React.FC<{ aggregates: any[], refresh: () => void }> = ({ aggregates, refresh }) => {
  const [selectedDriverDetails, setSelectedDriverDetails] = useState<any>(null);

  return (
    <div style={styles.tabContent}>
      <header style={styles.header}>
        <div style={styles.titleWrapper}>
          <BackButton />
          <div>
            <h1 style={styles.pageTitle}>Frota de Agregados & Parceiros</h1>
            <p style={styles.pageSub}>Gestão de terceiros, performance de agregados e score de confiabilidade.</p>
          </div>
        </div>
        <div style={styles.headerActions}>
           <button onClick={refresh} style={styles.refreshBtn}><RefreshCw size={18} /></button>
           <button style={styles.addBtn}>Novo Agregado +</button>
        </div>
      </header>

      <div style={styles.statsGrid}>
        <KPIItem label="Agregados Ativos" value={aggregates.filter(a => a.status === 'ativo').length.toString()} icon={Users} color="#0061FF" />
        <KPIItem label="Score Médio" value={(aggregates.reduce((acc, a) => acc + Number(a.score), 0) / (aggregates.length || 1)).toFixed(2)} icon={Star} color="#F59E0B" />
        <KPIItem label="Total Pagamentos" value={`R$ ${aggregates.reduce((acc, a) => acc + Number(a.total_earnings), 0).toLocaleString()}`} icon={DollarSign} color="#0061FF" />
      </div>

      <div style={styles.viewContainer}>
        <div style={styles.listWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>AGREGADO</th>
                <th style={styles.th}>VEÍCULO / PLACA</th>
                <th style={styles.th}>PERFORMANCE</th>
                <th style={styles.th}>GANHOS</th>
                <th style={styles.th}>STATUS</th>
                <th style={styles.th}>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {aggregates.map((agg) => (
                <tr 
                  key={agg.id} 
                  style={{ ...styles.tr, cursor: 'pointer' }} 
                  onClick={() => setSelectedDriverDetails(agg)}
                  className="hover-scale"
                >
                  <td style={styles.td}>
                    <div style={styles.driverInfo}>
                      <strong>{agg.name}</strong>
                      <span style={{ fontSize: '11px', color: '#94A3B8' }}>ID: {agg.id.split('-')[0]}</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.driverInfo}>
                      <span>{agg.vehicle_type}</span>
                      <strong style={{ fontSize: '12px' }}>{agg.plate}</strong>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.scoreRow}>
                      <Star size={14} color="#F59E0B" fill="#F59E0B" />
                      <strong>{agg.score}</strong>
                      <span style={{ fontSize: '12px', color: '#94A3B8' }}>({agg.total_deliveries} entregas)</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <strong style={{ color: '#0061FF' }}>R$ {Number(agg.total_earnings).toLocaleString()}</strong>
                  </td>
                  <td style={styles.td}>
                    <div style={{ ...styles.statusBadge, backgroundColor: agg.status === 'ativo' ? '#BFDBFE' : '#FEE2E2', color: agg.status === 'ativo' ? '#065F46' : '#991B1B' }}>
                      {agg.status.toUpperCase()}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <button 
                      style={styles.actionBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        const url = `${window.location.origin}/rastreamento-publico?veiculo=${encodeURIComponent(agg.vehicle_type)}&motorista=${encodeURIComponent(agg.name)}&origem=Sede+Central&destino=Entrega+Cliente&status=Em+Trânsito&empresa=Logta+SaaS`;
                        navigator.clipboard.writeText(url);
                        toast.success('Link de rastreamento copiado!');
                      }}
                      title="Compartilhar Rota"
                    >
                      <Share2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Driver Details Modal Popup */}
      {selectedDriverDetails && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '28px',
            width: '90%',
            maxWidth: '520px',
            padding: '32px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
            border: '1px solid #E2E8F0',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A', margin: 0 }}>Ficha do Colaborador</h3>
                <p style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', margin: '4px 0 0 0' }}>Parceiro / Agregado Logta</p>
              </div>
              <button 
                onClick={() => setSelectedDriverDetails(null)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#FFF',
                  color: '#64748B',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '900'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '20px', border: '1px solid #E2E8F0', marginBottom: '24px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#0061FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '20px', fontWeight: '800' }}>
                {selectedDriverDetails.name[0]}
              </div>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>{selectedDriverDetails.name}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <Star size={14} color="#F59E0B" fill="#F59E0B" />
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>{selectedDriverDetails.score}</span>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>({selectedDriverDetails.total_deliveries} entregas)</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '18px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Veículo / Placa</div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', marginTop: '6px' }}>{selectedDriverDetails.vehicle_type}</div>
                <div style={{ fontSize: '12px', fontWeight: '900', color: '#0061FF', marginTop: '2px' }}>{selectedDriverDetails.plate}</div>
              </div>
              <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '18px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Ganhos Totais</div>
                <div style={{ fontSize: '16px', fontWeight: '900', color: '#0061FF', marginTop: '6px' }}>R$ {Number(selectedDriverDetails.total_earnings).toLocaleString()}</div>
              </div>
            </div>

            <div style={{ backgroundColor: '#F0F7FF', padding: '16px', borderRadius: '18px', border: '1px solid #E0E7FF', display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <Brain size={20} color="#0061FF" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#0061FF' }}>Acompanhar em Tempo Real</div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Copie o link público para enviar ao cliente.</div>
                </div>
              </div>
              <button
                onClick={() => {
                  const url = `${window.location.origin}/rastreamento-publico?veiculo=${encodeURIComponent(selectedDriverDetails.vehicle_type)}&motorista=${encodeURIComponent(selectedDriverDetails.name)}&origem=Sede+Central&destino=Entrega+Cliente&status=Em+Trânsito&empresa=Logta+SaaS`;
                  navigator.clipboard.writeText(url);
                  toast.success('Link de rastreamento copiado!');
                }}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  color: '#0061FF',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Share2 size={12} /> Copiar Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const LogisticsSequence: React.FC = () => {
  const [activeRoute, setActiveRoute] = useState('Rota #882');
  
  return (
    <div style={styles.tabContent}>
      <header style={styles.header}>
        <div style={styles.titleWrapper}>
          <BackButton />
          <div>
            <h1 style={styles.pageTitle}>Sequenciamento & Plano de Carregamento</h1>
            <p style={styles.pageSub}>Otimização de ordem de entrega e lógica LIFO (Last-In, First-Out) para o baú.</p>
          </div>
        </div>
        <div style={styles.headerActions}>
           <select style={styles.routeSelect} value={activeRoute} onChange={e => setActiveRoute(e.target.value)}>
              <option>Rota #882</option>
              <option>Rota #885</option>
              <option>Rota #890</option>
           </select>
        </div>
      </header>

      <div style={styles.mainLayout}>
        <div style={styles.contentCol}>
          <div style={styles.chartCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
               <h3 style={styles.sidebarTitle}>Plano de Carregamento (Ordem Reversa)</h3>
               <div style={styles.aiStatusBadge}>LÓGICA LIFO ATIVA</div>
            </div>
            
            <div style={styles.loadingPlanContainer}>
               {[
                 { id: 1, client: 'Cliente A', zone: 'Frente / Porta', delivery: '1ª Entrega', load: '3º Carregar', icon: <Anchor size={18} /> },
                 { id: 2, client: 'Cliente B', zone: 'Meio do Baú', delivery: '2ª Entrega', load: '2º Carregar', icon: <Repeat size={18} /> },
                 { id: 3, client: 'Cliente C', zone: 'Fundo do Baú', delivery: '3ª Entrega', load: '1º Carregar', icon: <Package size={18} /> },
               ].map(item => (
                 <div key={item.id} style={styles.loadingStep}>
                    <div style={styles.loadingIcon}>{item.icon}</div>
                    <div style={styles.loadingMain}>
                       <div style={styles.loadingClient}>{item.client}</div>
                       <div style={styles.loadingZone}>{item.zone}</div>
                    </div>
                    <div style={styles.loadingMeta}>
                       <div style={styles.loadingDelivery}>{item.delivery}</div>
                       <div style={styles.loadingAction}>{item.load}</div>
                    </div>
                 </div>
               ))}
            </div>
            
            <button style={{ ...styles.addBtn, width: '100%', marginTop: '24px', backgroundColor: '#0F172A' }}>
               Gerar QR Codes de Carregamento
            </button>
          </div>
        </div>

        <aside style={styles.sidebar}>
           <div style={styles.sidebarSection}>
              <h3 style={styles.sidebarTitle}>Início de Rota GPS</h3>
              <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>Enviar link de navegação inteligente para o motorista.</p>
              <button style={{ ...styles.addBtn, width: '100%', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                 <Share2 size={16} /> Compartilhar link
              </button>
              <button style={{ ...styles.secondaryBtn, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}>
                 <LocateFixed size={16} /> Abrir no Google Maps
              </button>
           </div>
        </aside>
      </div>
    </div>
  );
};

const LogisticsExceptions: React.FC<{ exceptions: any[], refresh: () => void }> = ({ exceptions, refresh }) => {
  return (
    <div style={styles.tabContent}>
      <header style={styles.header}>
        <div style={styles.titleWrapper}>
          <BackButton />
          <div>
            <h1 style={styles.pageTitle}>Controle de Exceções Autônomo</h1>
            <p style={styles.pageSub}>Detecção e resolução automática de falhas operacionais, no-shows e quebras de rota.</p>
          </div>
        </div>
        <div style={styles.headerActions}>
           <button onClick={refresh} style={styles.refreshBtn}><RefreshCw size={18} /></button>
           <div style={styles.statusBadgeActive}><ShieldCheck size={14} /> MONITORAMENTO ATIVO</div>
        </div>
      </header>

      <div style={styles.kpiRow}>
         <KPIItem label="Exceções Ativas" value={exceptions.length.toString()} trend={exceptions.length > 5 ? '+Alto' : 'Baixo'} trendUp={exceptions.length > 5} icon={ShieldAlert} color="#EF4444" />
         <KPIItem label="Taxa de Confirmação" value="94.2%" trend="+2.1%" trendUp={true} icon={FileCheck} color="#0061FF" />
         <KPIItem label="Resolvido c/ IA" value="88%" trend="+5%" trendUp={true} icon={Zap} color="#0061FF" />
         <KPIItem label="Economia Perda" value="R$ 4.250" trend="+R$ 800" trendUp={true} icon={DollarSign} color="#0061FF" />
      </div>

      <div style={styles.mainLayout}>
        <div style={styles.contentCol}>
           <div style={styles.chartCard}>
              <h3 style={styles.sidebarTitle}>Fila de Exceções em Tempo Real</h3>
              <div style={styles.strategyList}>
                 {exceptions.length > 0 ? exceptions.map(item => (
                   <div key={item.id} style={styles.strategyRow}>
                      <div style={{ ...styles.strategyIcon, backgroundColor: item.priority === 'Alta' ? '#FEF2F2' : '#F8FAFC' }}>
                         <ShieldAlert size={14} color={item.priority === 'Alta' ? '#EF4444' : '#64748B'} />
                      </div>
                      <div style={styles.strategyMain}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={styles.strategyAction}>{item.type === 'DELAY' ? 'ATRASO' : item.type === 'LOCATION' ? 'LOCALIZAÇÃO' : item.type}</div>
                            <span style={{ fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px', backgroundColor: item.priority === 'Alta' ? '#EF4444' : '#64748B', color: 'white' }}>{item.priority.toUpperCase()}</span>
                         </div>
                         <div style={styles.strategyReason}>Pedido {item.order_id} • Status: {item.status === 'pendente' ? 'Pendente' : 'Resolvido'}</div>
                      </div>
                      <div style={styles.strategyMeta}>
                         <div style={{ ...styles.strategyImpact, color: '#0061FF' }}>{item.status === 'pendente' ? 'Aguardando IA' : 'Resolvido'}</div>
                         <div style={styles.strategyTime}>{new Date(item.created_at).toLocaleTimeString('pt-BR')}</div>
                      </div>
                   </div>
                 )) : <div style={{textAlign: 'center', padding: '40px', color: '#94A3B8'}}>Nenhuma exceção ativa detectada.</div>}
              </div>
           </div>
        </div>

        <aside style={styles.sidebar}>
           <div style={styles.insightCard}>
              <h4 style={styles.insightTitle}>Guardian Intelligence</h4>
              <p style={styles.insightText}>O sistema está monitorando padrões de no-show e atrasos. Se um motorista sair do geofence, um bloqueio preventivo será aplicado.</p>
              <button type="button" style={{ ...styles.outlineAccentBtn, marginTop: '12px' }}>Ver Regras de Compliance</button>
           </div>
        </aside>
      </div>
    </div>
  );
};

const LogisticsFuel: React.FC<{ fuelPrices: any[], refresh: () => void }> = ({ fuelPrices, refresh }) => {
  const [selectedFuel, setSelectedFuel] = useState('Gasolina');
  const [locationSearch, setLocationSearch] = useState('');
  const [selectedRegionDetails, setSelectedRegionDetails] = useState<any>(null);

  const normalizeType = (value?: string | null) => {
    const type = (value || '').toLowerCase();
    if (type.includes('gasolina')) return 'gasolina';
    if (type.includes('etanol') || type.includes('alcool') || type.includes('álcool')) return 'etanol';
    if (type.includes('diesel')) return 'diesel';
    if (type.includes('gnv') || type.includes('gas') || type.includes('gás')) return 'gnv';
    return type;
  };

  const fuelMeta: Record<string, { label: string; color: string }> = {
    gasolina: { label: 'Gasolina', color: '#0061FF' },
    diesel: { label: 'Diesel', color: '#EF4444' },
    etanol: { label: 'Etanol', color: '#0061FF' },
    gnv: { label: 'GNV', color: '#0EA5E9' },
  };

  const canonicalOrder = ['gasolina', 'diesel', 'etanol', 'gnv'];
  const availableFuels = fuelPrices.map(p => ({
    ...p,
    normalizedType: normalizeType(p.type)
  }));

  const averageBrazil = availableFuels.length > 0
    ? availableFuels.reduce((acc, item) => acc + Number(item.price || 0), 0) / availableFuels.length
    : 0;

  const fuelStats = [
    { label: 'Média Nacional', value: 'R$ 5,89', trend: '+1.2%', trendUp: false, icon: TrendingUp, live: true },
    { label: 'Economia IA', value: 'R$ 12k/mês', trend: 'ATIVO', trendUp: true, icon: Brain, live: true },
    { label: 'Postos ANP', value: '14.200', trend: 'SYNC', trendUp: true, icon: ShieldCheck },
    { label: 'Meta ROI', value: 'R$ 5,45', trend: 'OTIMIZADO', trendUp: true, icon: Zap, live: true },
  ];

  return (
    <div style={styles.tabContent}>
      <header style={{ ...styles.header, gap: '20px', flexWrap: 'wrap' }}>
        <div style={styles.titleWrapper}>
          <BackButton />
          <div>
            <h1 style={styles.pageTitle}>Inteligência de Combustível</h1>
            <p style={styles.pageSub}>Monitoramento analítico da malha energética e impactos no ROI.</p>
          </div>
        </div>

        {/* Relocated fuel selection tabs + sharing button next to refresh */}
        <div style={{ ...styles.headerActions, display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '8px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', padding: '4px', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            {['Gasolina', 'Etanol', 'Diesel', 'GNV'].map(f => {
              const isActive = selectedFuel === f;
              return (
                <button 
                  key={f} 
                  type="button"
                  onClick={() => setSelectedFuel(f)}
                  style={{ 
                    border: 'none',
                    borderRadius: '10px',
                    padding: '8px 16px',
                    fontSize: '11px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: isActive ? '#F1F5F9' : 'transparent',
                    color: isActive ? '#0061FF' : '#64748B',
                    boxShadow: isActive ? '0 2px 6px rgba(0, 0, 0, 0.02)' : 'none'
                  }}
                >
                  {f.toUpperCase()}
                </button>
              );
            })}
          </div>

          <button 
            style={{
              ...styles.refreshBtn,
              backgroundColor: '#FFFFFF',
              color: '#0061FF',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }} 
            onClick={() => {
              const domain = window.location.hostname === 'localhost' ? window.location.origin : 'https://logta.com.br';
              const url = `${domain}/combustivel`;
              navigator.clipboard.writeText(url);
              toast.success('Link do painel de combustível copiado!');
              window.open(url, '_blank');
            }}
            title="Abrir e Compartilhar Painel Público"
          >
            <Globe size={18} />
          </button>

          <button style={styles.refreshBtn} onClick={refresh}><RefreshCw size={18} /></button>
        </div>
      </header>

      <div style={{ ...styles.statsGrid, marginBottom: '24px' }}>
        {fuelStats.map((stat: any, i) => (
          <KPIItem key={i} label={stat.label} value={stat.value} trend={stat.trend} trendUp={stat.trendUp} icon={stat.icon} variant={i % 2 === 1 ? 'solid' : 'light'} live={stat.live} />
        ))}
      </div>

      {/* Radar de Preços - Moved to Top as requested */}
      <div style={{ ...styles.chartCard, marginBottom: '32px', border: '1px solid var(--border-light)', backgroundColor: '#FFF' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={styles.cardTitle}>Radar de Preços Brasil</h3>
            <p style={{ ...styles.pageSub, marginTop: '4px', padding: '4px 0', maxWidth: '100%' }}>Variação regional baseada em sua localização.</p>
          </div>
          <div style={styles.statusBadgeActive}>IA ACTIVE SCAN</div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {[
            { name: 'São Paulo, SP', price: 'R$ 5,65', impact: 'BAIXO' },
            { name: 'Rio de Janeiro, RJ', price: 'R$ 6,12', impact: 'ALTO' },
            { name: 'Curitiba, PR', price: 'R$ 5,78', impact: 'MÉDIO' },
            { name: 'Cuiabá, MT', price: 'R$ 5,99', impact: 'MÉDIO' },
            { name: 'Belo Horizonte, MG', price: 'R$ 5,82', impact: 'MÉDIO' },
            { name: 'Porto Alegre, RS', price: 'R$ 6,05', impact: 'ALTO' },
          ].filter(reg => 
            reg.name.toLowerCase().includes(locationSearch.toLowerCase())
          ).map((reg, i) => (
            <div key={i} style={{ 
              display: 'flex', flexDirection: 'column', gap: '10px', padding: '16px', 
              backgroundColor: '#FFF', borderRadius: '18px', border: '1px solid var(--border)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer'
            }} 
            onClick={() => setSelectedRegionDetails(reg)}
            className="hover-scale">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#1E293B' }}>{reg.name}</div>
                <div style={{ 
                  fontSize: '9px', fontWeight: '900', padding: '4px 8px', borderRadius: '20px',
                  backgroundColor: reg.impact === 'BAIXO' ? '#DBEAFE' : (reg.impact === 'ALTO' ? '#FEE2E2' : '#FEF3C7'), 
                  color: reg.impact === 'BAIXO' ? '#1E3A8A' : (reg.impact === 'ALTO' ? '#991B1B' : '#92400E') 
                }}>
                  {reg.impact}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '18px', fontWeight: '900', color: '#0F172A' }}>{reg.price}</div>
                <div style={{ fontSize: '9px', fontWeight: '800', color: '#0061FF', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0061FF', boxShadow: '0 0 8px #0061FF' }}></div> ATIVO
                </div>
              </div>
            </div>
          ))}
          {locationSearch && [
            { name: 'São Paulo', price: '5,65' } // dummy for length check
          ].filter(reg => reg.name.toLowerCase().includes(locationSearch.toLowerCase())).length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '30px', textAlign: 'center', color: '#94A3B8', fontSize: '13px', fontWeight: '600', backgroundColor: 'var(--bg-overlay)', borderRadius: '20px' }}>
              Nenhuma região encontrada para "{locationSearch}"
            </div>
          )}
        </div>
      </div>

      {/* ANP Detailed Region Modal */}
      {selectedRegionDetails && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '28px',
            width: '90%',
            maxWidth: '520px',
            padding: '32px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
            border: '1px solid #E2E8F0',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A', margin: 0 }}>Análise Detalhada ANP</h3>
                <p style={{ fontSize: '12px', color: '#64748B', fontWeight: '600', margin: '4px 0 0 0' }}>Região: {selectedRegionDetails.name}</p>
              </div>
              <button 
                onClick={() => setSelectedRegionDetails(null)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#FFF',
                  color: '#64748B',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '900'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '18px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Preço Médio Local</div>
                <div style={{ fontSize: '22px', fontWeight: '900', color: '#0F172A', marginTop: '6px' }}>{selectedRegionDetails.price}</div>
              </div>
              <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '18px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Índice de Impacto</div>
                <div style={{ 
                  fontSize: '14px', fontWeight: '900', marginTop: '12px', display: 'inline-block', padding: '4px 10px', borderRadius: '8px',
                  backgroundColor: selectedRegionDetails.impact === 'BAIXO' ? '#DBEAFE' : '#FEE2E2',
                  color: selectedRegionDetails.impact === 'BAIXO' ? '#1E3A8A' : '#991B1B'
                }}>{selectedRegionDetails.impact}</div>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', marginBottom: '12px' }}>Postos Recomendados (Menor Preço ANP)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { name: 'Posto Petrobras Master', price: (parseFloat(selectedRegionDetails.price.replace('R$', '').replace(',', '.')) - 0.15).toFixed(2).replace('.', ','), address: 'Av. das Nações, 1020' },
                  { name: 'Posto Ipiranga Express', price: (parseFloat(selectedRegionDetails.price.replace('R$', '').replace(',', '.')) - 0.08).toFixed(2).replace('.', ','), address: 'Rua das Flores, 45' },
                  { name: 'Posto Shell Smart', price: (parseFloat(selectedRegionDetails.price.replace('R$', '').replace(',', '.')) + 0.02).toFixed(2).replace('.', ','), address: 'Av. Central, 890' }
                ].map((p, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '14px' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '800', color: '#1E293B' }}>{p.name}</div>
                      <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>{p.address}</div>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '900', color: '#0061FF' }}>R$ {p.price}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ backgroundColor: '#F0F7FF', padding: '16px', borderRadius: '18px', border: '1px solid #E0E7FF', display: 'flex', gap: '12px' }}>
              <Brain size={20} color="#0061FF" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#0061FF' }}>Recomendação de Rota IA</div>
                <p style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.4', margin: '4px 0 0 0' }}>
                  Abastecer preferencialmente no <strong>Posto Petrobras Master</strong>. Economia estimada de até <strong>3.2%</strong> por litro baseada na telemetria atual da frota.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={styles.splitGrid}>
        <div style={styles.sidebarCol}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
            {['Comum', 'Aditivada', 'Premium'].map((variant, i) => {
              const basePrice = availableFuels.find(f => f.normalizedType === selectedFuel.toLowerCase())?.price || 0;
              const price = Number(basePrice) + (i === 1 ? 0.20 : (i === 2 ? 0.45 : 0));
              return (
                <HubMetricCard
                  key={variant}
                  label={`${selectedFuel} ${variant}`}
                  value={`R$ ${price.toFixed(2).replace('.', ',')}`}
                  icon={Droplets}
                  accent="#0061FF"
                  softBg="var(--bg-active)"
                />
              );
            })}
          </div>

          <div style={styles.chartCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={styles.cardTitle}>Evolução dos Custos (R$/L)</h3>
              <div style={styles.statusBadgeActive}>IA PREDICTIVE</div>
            </div>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { name: 'Jan', value: 5.45 },
                  { name: 'Fev', value: 5.62 },
                  { name: 'Mar', value: 5.58 },
                  { name: 'Abr', value: 5.89 },
                ]}>
                  <defs>
                    <linearGradient id="fuelTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0061FF" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#0061FF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94A3B8'}} />
                  <YAxis domain={['auto', 'auto']} hide />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#0061FF" strokeWidth={3} fill="url(#fuelTrend)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div style={styles.sidebarCol}>
          <div style={styles.chartCard}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <Brain size={20} color="#0061FF" />
                <h3 style={styles.cardTitle}>Insight Estratégico IA</h3>
             </div>
             <div style={{ backgroundColor: 'var(--bg-active)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: '13px', color: '#4338CA', margin: 0, lineHeight: '1.6', fontWeight: '600' }}>
                  Tendência de queda detectada no diesel para a próxima semana na região Sudeste. 
                  Recomendamos reduzir abastecimentos imediatos em 20% para aproveitar o decréscimo projetado de 4.2%.
                </p>
                <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                  <div style={{ padding: '6px 12px', backgroundColor: '#FFF', borderRadius: '10px', fontSize: '10px', fontWeight: '800', color: '#0061FF' }}>ECONOMIA ESTIMADA: R$ 2.4k</div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const KPIItem = ({
  label,
  value,
  trend,
  trendUp,
  icon: Icon,
  variant = 'light',
  live,
  color,
  iconSize = 20,
}: {
  label: string;
  value: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  icon: LucideIcon;
  variant?: 'light' | 'solid';
  live?: boolean;
  color?: string;
  iconSize?: number;
}) => {
  const accent = color || '#0061FF';
  const liveDot = live ? (
    <span
      style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        backgroundColor: '#0061FF',
        boxShadow: '0 0 6px #0061FF',
        display: 'inline-block',
        flexShrink: 0,
      }}
      aria-hidden
    />
  ) : undefined;

  const trendFooter =
    trend !== undefined && trend !== '' ? (
      <div
        style={{
          marginTop: 8,
          fontSize: 11,
          fontWeight: 800,
          color: trendUp ? '#0061FF' : '#F43F5E',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {trendUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
        {trend}
      </div>
    ) : undefined;

  return (
    <HubMetricCard
      label={label}
      value={value}
      icon={Icon}
      iconVariant={variant === 'solid' ? 'solid' : 'soft'}
      accent={accent}
      iconSize={iconSize}
      topRight={liveDot}
      footer={trendFooter}
    />
  );
};

const LOGISTICA_MODULES = [
  { id: 'controle', label: 'Torre de Controle', icon: Activity, sub: 'Monitoramento real-time' },
  { id: 'destinos', label: 'Central de Destinos', icon: MapPin, sub: 'Gestão de CDs e bases' },
  { id: 'frotas', label: 'Frotas & Agregados', icon: Users, sub: 'Gestão de motoristas' },
  { id: 'rotas', label: 'Sequenciamento', icon: Layers, sub: 'Otimização de baú' },
  { id: 'autonomo', label: 'Controle Autônomo', icon: ShieldAlert, sub: 'Gestão de exceções' },
  { id: 'estrategia', label: 'Inteligência Estratégica', icon: Zap, sub: 'Análise de ROI e IA' },
  { id: 'combustivel', label: 'Central de Combustível', icon: Fuel, sub: 'Preços e custos' },
];

const LogisticaShell: React.FC<{
  activeModuleRouteId?: string;
  children: React.ReactNode;
}> = ({ activeModuleRouteId, children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="hub-settings-layout" style={HUB_MASTER_SECTION_NAV.layout}>
      <aside style={HUB_MASTER_SECTION_NAV.sidebarWrapper}>
        <nav style={HUB_MASTER_SECTION_NAV.sidebar} aria-label="Ir para módulos da logística">
          <h2 style={HUB_MASTER_SECTION_NAV.sidebarHeading}>Operações</h2>
          <div style={HUB_MASTER_SECTION_NAV.sidebarHeadingRule} aria-hidden />
          <div style={HUB_MASTER_SECTION_NAV.sidebarSection}>
            <div className="hub-settings-section-label" style={HUB_MASTER_SECTION_NAV.sidebarSectionLabel}>Módulos</div>
            <div style={HUB_MASTER_SECTION_NAV.sidebarSectionItems}>
              {LOGISTICA_MODULES.map((mod) => {
                const active = activeModuleRouteId === mod.id;
                return (
                  <button
                    key={mod.id}
                    type="button"
                    className={`hub-sidebar-item expanded${active ? ' active' : ''}`}
                    style={{
                      textDecoration: 'none',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                    title={mod.sub}
                    onClick={() =>
                      navigate({ pathname: `/master/logistica/${mod.id}`, search: location.search })
                    }
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <mod.icon size={18} strokeWidth={2} />
                    </div>
                    <span style={{ ...HUB_SIDEBAR_NAV_LABEL, marginLeft: 12, flex: 1, textAlign: 'left' }}>
                      {mod.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      </aside>
      <main style={HUB_MASTER_SECTION_NAV.main}>{children}</main>
    </div>
  );
};

const LogisticsDashboard: React.FC<{
  stats: { total_routes: number; active_vehicles: number; alerts_critical: number };
  deliveryActions: any[];
  refresh: () => void;
  fuelPrices?: any[];
  aggregates?: any[];
  exceptions?: any[];
}> = ({ stats, deliveryActions, refresh, fuelPrices = [], aggregates = [], exceptions = [] }) => {
  const [activeKpiTab, setActiveKpiTab] = useState<
    'veiculos' | 'entregas' | 'alertas' | 'combustivel'
  >('veiculos');
  const navigate = useNavigate();
  const location = useLocation();
  const mapCenter: [number, number] = [-23.5505, -46.6333];

  const roiData = []; // Removendo mock fixo

  const kpiTabs: Array<{
    id: typeof activeKpiTab;
    label: string;
    icon: LucideIcon;
    value: React.ReactNode;
    trend?: string;
    trendUp?: boolean;
  }> = [
    {
      id: 'veiculos',
      label: 'Veículos Ativos',
      icon: Car,
      value: stats.active_vehicles,
    },
    {
      id: 'entregas',
      label: 'Entregas Hoje',
      icon: Package,
      value: stats.total_routes,
    },
    {
      id: 'alertas',
      label: 'Alertas Ativos',
      icon: AlertTriangle,
      value: stats.alerts_critical,
    },
    {
      id: 'combustivel',
      label: 'Combustível (Média)',
      icon: Droplets,
      value: fuelPrices.length > 0 
        ? `R$ ${(fuelPrices.reduce((acc, f) => acc + Number(f.price || 0), 0) / fuelPrices.length).toFixed(2).replace('.', ',')}`
        : '---',
    },
  ];

  const activeKpi = kpiTabs.find((t) => t.id === activeKpiTab) ?? kpiTabs[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', ...styles.tabContent }}>
      <header style={{ ...styles.header, marginBottom: '40px' }}>
        <div style={styles.titleWrapper}>
          <div style={{ ...styles.iconBox, backgroundColor: '#0F172A', boxShadow: '0 10px 20px rgba(99, 102, 241, 0.2)' }}><Box size={24} color="#FFF" /></div>
          <div>
            <h1 style={styles.pageTitle}>Operações</h1>
            <p style={{ ...styles.pageSub, padding: '4px 0', maxWidth: '100%' }}>Visão geral do ecossistema e performance da malha.</p>
          </div>
        </div>
        <div style={{ ...styles.headerActions, gap: '16px' }}>
          <button style={{ ...styles.refreshBtn, width: '44px', height: '44px', borderRadius: '14px', border: '1px solid #E2E8F0', backgroundColor: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)', flexShrink: 0, transition: '0.2s' }} onClick={refresh} type="button">
            <RefreshCw size={18} />
          </button>
        </div>
      </header>

      <div style={{ ...styles.statsGrid, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        {kpiTabs.map((stat, i) => (
          <KPIItem key={stat.id} label={stat.label} value={stat.value} trend={stat.trend} trendUp={stat.trendUp} icon={stat.icon} variant={i % 2 === 1 ? 'solid' : 'light'} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px', alignItems: 'start' }}>
        {/* OPERATIONAL VISUAL & CHART COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* MOCK MAP PREVIEW */}
          <div style={{ ...styles.chartCard, padding: '24px', backgroundColor: '#FFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={styles.cardTitle}>Torre de Controle Ativa</h3>
                <p style={{ ...styles.pageSub, fontSize: '11px', margin: '4px 0 0 0', padding: 0, maxWidth: '100%' }}>Sincronização GPS em tempo real de frotas e geofences.</p>
              </div>
              <div className="animate-pulse" style={styles.statusBadgeActive}>IA GUARDIAN ACTIVE</div>
            </div>

            {/* REAL INTERACTIVE LEAFLET MAP */}
            <div style={{ height: '280px', width: '100%', borderRadius: '24px', overflow: 'hidden', border: '1px solid #E2E8F0', position: 'relative' }}>
              <HubMap center={mapCenter as any} zoom={12} scrollWheelZoom={false}>
                {/* Real-time markers would go here based on tracking data */}
              </HubMap>
            </div>
          </div>

          {/* AREA CHART DE SAVINGS */}
          <div style={styles.chartCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={styles.cardTitle}>Performance da Malha (Savings)</h3>
                <p style={{ ...styles.pageSub, fontSize: '11px', margin: '4px 0 0 0', padding: 0, maxWidth: '100%' }}>Análise cumulativa de custos economizados por otimização de IA.</p>
              </div>
              <div className="animate-pulse" style={styles.statusBadgeActive}>IA OTIMIZANDO</div>
            </div>
            <div style={{ height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={roiData}>
                  <defs>
                    <linearGradient id="dashSavings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0061FF" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#0061FF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94A3B8'}} />
                  <Tooltip />
                  <Area type="monotone" dataKey="savings" stroke="#0061FF" strokeWidth={3} fill="url(#dashSavings)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
              <div style={{ ...styles.insightCard, flex: 1, backgroundColor: '#F8FAFC' }}>
                 <h4 style={{ ...styles.insightTitle, fontSize: '12px' }}>Última Otimização</h4>
                 <p style={{ ...styles.insightText, fontSize: '11px' }}>Consolidação de carga em SP gerou economia de R$ 420,00.</p>
              </div>
              <div style={{ ...styles.insightCard, flex: 1, backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' }}>
                 <h4 style={{ ...styles.insightTitle, fontSize: '12px', color: '#1D4ED8' }}>Guardian Status</h4>
                 <p style={{ ...styles.insightText, fontSize: '11px', color: '#1D4ED8' }}>98% de entregas confirmadas autonomamente hoje.</p>
              </div>
            </div>
          </div>
        </div>

        {/* 7 MODULES INTEGRATED SUMMARY LIST */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ marginBottom: '8px' }}>
            <h3 style={{ ...styles.cardTitle, fontSize: '18px' }}>Resumo Geral dos Módulos</h3>
            <p style={{ ...styles.pageSub, margin: '4px 0 0 0', padding: '4px 0', maxWidth: '100%' }}>Consolidação completa das 7 verticais de inteligência logística.</p>
          </div>

          {[
            {
              id: 'controle',
              label: '1. Torre de Controle',
              icon: Activity,
              desc: 'Rastreamento em tempo real de frotas e ordens de serviço ativas.',
              metric: `${stats.total_routes} Rotas Ativas`,
              badgeColor: '#EFF6FF',
              badgeText: '#0061FF',
            },
            {
              id: 'destinos',
              label: '2. Central de CD e Destinos',
              icon: MapPin,
              desc: 'Gestão integrada de galpões, filiais e docas de expedição.',
              metric: 'Operacional',
              badgeColor: '#EFF6FF',
              badgeText: '#0061FF',
            },
            {
              id: 'frotas',
              label: '3. Frotas & Agregados',
              icon: Users,
              desc: 'Fichas, documentos, frotas e motoristas próprios ou parceiros.',
              metric: `${aggregates.length} Colaboradores`,
              badgeColor: '#EEF2FF',
              badgeText: '#4338CA',
            },
            {
              id: 'rotas',
              label: '4. Sequenciamento de Carga',
              icon: Layers,
              desc: 'Arrumação tridimensional do baú e roteirização sequencial via IA.',
              metric: 'Inteligência LIFO',
              badgeColor: '#F5F3FF',
              badgeText: '#7C3AED',
            },
            {
              id: 'autonomo',
              label: '5. Controle Autônomo',
              icon: ShieldAlert,
              desc: 'Monitor inteligente de falhas, no-shows e alertas com geofence.',
              metric: `${exceptions.length} Exceções Ativas`,
              badgeColor: '#FEF2F2',
              badgeText: '#EF4444',
            },
            {
              id: 'estrategia',
              label: '6. Inteligência Estratégica',
              icon: Zap,
              desc: 'Performance geral, gráficos de savings, inteligência de negócios.',
              metric: 'Análise ROI',
              badgeColor: '#FFFBEB',
              badgeText: '#F59E0B',
            },
            {
              id: 'combustivel',
              label: '7. Central de Combustível',
              icon: Fuel,
              desc: 'Histórico de abastecimento ANP e otimização regional de custos.',
              metric: fuelPrices.length > 0 ? `Ref: R$ ${(fuelPrices.reduce((acc, f) => acc + Number(f.price || 0), 0) / fuelPrices.length).toFixed(2)}` : 'Preços ANP',
              badgeColor: '#F0F9FF',
              badgeText: '#0EA5E9',
            },
          ].map((mod) => (
            <div
              key={mod.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.02)',
                transition: 'all 0.2s ease',
              }}
              className="hover-scale"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
                <div style={{ ...styles.destinoIcon, width: '42px', height: '42px', borderRadius: '12px', backgroundColor: mod.badgeColor }}>
                  <mod.icon size={18} color={mod.badgeText} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#1E293B' }}>{mod.label}</span>
                    <span style={{ fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '10px', backgroundColor: mod.badgeColor, color: mod.badgeText }}>{mod.metric}</span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#64748B', margin: '4px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mod.desc}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate({ pathname: `/master/logistica/${mod.id}`, search: location.search })}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#F8FAFC',
                  color: mod.badgeText,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const LogisticaHub: React.FC = () => {
  const { subPage } = useParams();
  const navigate = useNavigate();

  const [fuelPrices, setFuelPrices] = useState<any[]>([]);
  const [aggregates, setAggregates] = useState<any[]>([]);
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [deliveryActions, setDeliveryActions] = useState<any[]>([]);
  const [stats, setStats] = useState({ total_routes: 0, active_vehicles: 0, alerts_critical: 0 });

  const fetchOperationalData = async () => {
    try {
      const [fRes, aRes, eRes, dRes, routesRes, alertsRes] = await Promise.all([
        supabase.from('fuel_prices').select('*').order('type'),
        supabase.from('aggregates').select('*').order('score', { ascending: false }),
        supabase.from('delivery_exceptions').select('*').order('created_at', { ascending: false }),
        supabase.from('delivery_actions').select('*').order('created_at', { ascending: false }),
        supabase.from('routes').select('vehicle_id', { count: 'exact' }),
        supabase.from('alerts').select('id', { count: 'exact' }).eq('type', 'critical')
      ]);

      if (fRes.data) setFuelPrices(fRes.data);
      if (aRes.data) setAggregates(aRes.data);
      if (eRes.data) setExceptions(eRes.data);
      if (dRes.data) setDeliveryActions(dRes.data);
      
      setStats({
        total_routes: routesRes.count || 0,
        active_vehicles: routesRes.data ? new Set(routesRes.data.map((r: any) => r.vehicle_id)).size : 0,
        alerts_critical: alertsRes.count || 0
      });
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  useEffect(() => {
    fetchOperationalData();
  }, []);

  const renderContent = () => {
    switch (subPage) {
      case 'controle': return <LogisticsMonitoring />;
      case 'destinos': return <LogisticsDestinations />;
      case 'frotas': return <LogisticsAggregates aggregates={aggregates} refresh={fetchOperationalData} />;
      case 'rotas': return <LogisticsSequence />;
      case 'autonomo': return <LogisticsExceptions exceptions={exceptions} refresh={fetchOperationalData} />;
      case 'estrategia': return <LogisticsIntelligence deliveryActions={deliveryActions} refresh={fetchOperationalData} />;
      case 'combustivel': return <LogisticsFuel fuelPrices={fuelPrices} refresh={fetchOperationalData} />;
      default:
        return (
          <LogisticsDashboard
            stats={stats}
            deliveryActions={deliveryActions}
            refresh={fetchOperationalData}
            fuelPrices={fuelPrices}
            aggregates={aggregates}
            exceptions={exceptions}
          />
        );
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'finalizada': return { backgroundColor: '#EFF6FF', color: '#0061FF', border: '1px solid #BFDBFE' };
      case 'problema': return { backgroundColor: '#FEF2F2', color: '#EF4444', border: '1px solid #FEE2E2' };
      case 'atraso': return { backgroundColor: '#FFFBEB', color: '#F59E0B', border: '1px solid #FEF3C7' };
      default: return { backgroundColor: '#F0F7FF', color: 'var(--accent)', border: '1px solid #E0E7FF' };
    }
  };


  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFFFFF' }} className="animate-fade-in">
      <LogisticaShell activeModuleRouteId={subPage}>
        {renderContent()}
      </LogisticaShell>
    </div>
  );
};

const styles: Record<string, any> = {
  tabHeader: { 
    padding: '48px 40px 32px', 
    backgroundColor: 'transparent', 
    display: 'flex', 
    flexDirection: 'column',
    alignItems: 'center',
    gap: '32px'
  },
  tabContainer: { 
    display: 'flex', 
    gap: '16px',
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  tabBtn: { 
    display: 'flex', 
    flexDirection: 'column',
    alignItems: 'center', 
    gap: '16px', 
    padding: '24px', 
    border: '1px solid var(--border)', 
    borderRadius: '32px', 
    backgroundColor: '#FFF', 
    cursor: 'pointer', 
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    width: '180px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)'
  },
  tabActive: { 
    borderColor: 'var(--accent)',
    backgroundColor: '#FFF', 
    boxShadow: '0 20px 25px -5px rgba(99, 102, 241, 0.1), 0 10px 10px -5px rgba(99, 102, 241, 0.04)',
    transform: 'translateY(-6px)'
  },
  tabIconBox: {
    width: '56px',
    height: '56px',
    borderRadius: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s'
  },
  tabLabel: { 
    fontSize: '13px', 
    fontWeight: '800', 
    color: 'var(--secondary)', 
    textAlign: 'center',
    lineHeight: '1.2',
    letterSpacing: '0.3px'
  },
  tabSubtitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: 'var(--text-secondary)',
    padding: '10px 24px',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '20px',
    border: '1px solid var(--border)'
  },
  tabContent: { padding: '20px 40px 80px' },
  
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  titleWrapper: { display: 'flex', alignItems: 'center', gap: '20px' },
  iconBox: { width: '56px', height: '56px', backgroundColor: 'var(--accent)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(99, 102, 241, 0.2)' },
  pageTitle: { fontSize: '29px', fontWeight: '800', color: '#000000', margin: 0, letterSpacing: 0 },
  pageSub: { ...HUB_PAGE_SUBTITLE },
  headerActions: { display: 'flex', gap: '16px', alignItems: 'center' },
  
  searchWrapper: { position: 'relative', width: '360px' },
  searchIcon: { position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' },
  searchInput: { width: '100%', padding: '14px 16px 14px 48px', borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: '#FFF', fontSize: '15px', fontWeight: '600', color: 'var(--secondary)', outline: 'none', transition: 'all 0.2s' },
  
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' },
  logisticsKpiStripWrap: {
    marginBottom: '24px',
    backgroundColor: 'transparent',
    background: 'unset',
    border: 'none',
    boxShadow: 'none',
  },
  logisticsKpiDetail: {
    marginTop: '16px',
    padding: '4px 2px 0',
    backgroundColor: 'transparent',
    border: 'none',
    boxShadow: 'none',
  },
  logisticsKpiDetailLabel: {
    fontSize: '12px',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    marginBottom: '8px',
  },
  logisticsKpiDetailValue: {
    fontSize: '23px',
    fontWeight: 800,
    color: 'var(--secondary)',
    letterSpacing: '-0.02em',
    lineHeight: 1.2,
  },
  logisticsKpiDetailTrend: {
    marginTop: '10px',
    fontSize: '13px',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  logisticsModulesWrap: {
    marginBottom: '40px',
    padding: 0,
    backgroundColor: 'transparent',
    border: 'none',
    boxShadow: 'none',
  },
  mainLayout: { display: 'grid', gridTemplateColumns: '1fr 360px', gap: '32px' },
  viewContainer: { height: '640px', backgroundColor: '#FFF', borderRadius: '32px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' },
  
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '20px 24px', fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)' },
  td: { padding: '24px', fontSize: '14px', borderBottom: '1px solid var(--bg-secondary)' },
  
  sidebarSection: { backgroundColor: '#FFF', padding: '32px', borderRadius: '32px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' },
  sidebarTitle: { fontSize: '18px', fontWeight: '800', color: 'var(--secondary)', marginBottom: '24px' },
  aiCollapsedSection: {
    height: '58px',
    padding: '0 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    boxShadow: 'none',
  },
  
  alertItem: { padding: '16px', borderLeft: '4px solid var(--border)', backgroundColor: 'var(--bg-secondary)', borderRadius: '0 16px 16px 0', marginBottom: '12px' },
  
  dashShortcut: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '20px', 
    padding: '24px', 
    backgroundColor: '#FFF', 
    borderRadius: '32px', 
    border: '1px solid var(--border)', 
    cursor: 'pointer', 
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
    textAlign: 'left'
  },
  dashShortcutIcon: { width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  fuelIconBox: { width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  fuelMain: { flex: 1 },
  fuelType: { fontSize: '11px', fontWeight: '800', color: '#94A3B8', letterSpacing: '0.8px' },
  fuelPrice: { fontSize: '24px', fontWeight: '800', color: '#0F172A', margin: '4px 0' },
  fuelVariation: { fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' },
  fuelImpact: { textAlign: 'right' },
  impactLabel: { fontSize: '10px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' },
  impactValue: { fontSize: '12px', fontWeight: '800', color: '#0061FF', marginTop: '4px' },
  regionSelector: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', color: '#475569', fontSize: '13px', fontWeight: '700' },
  fuelOperationalGrid: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' },
  fuelChartCard: { backgroundColor: 'white', padding: '32px', borderRadius: '28px', border: '1px solid var(--border)' },
  costCalculatorCard: { backgroundColor: 'var(--bg-secondary)', padding: '32px', borderRadius: '28px', border: '1px solid var(--border)' },
  calcRow: { marginBottom: '16px' },
  calcLabel: { fontSize: '12px', fontWeight: '700', color: '#64748B', marginBottom: '8px', display: 'block' },
  calcInput: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '14px', fontWeight: '600', outline: 'none' },
  calcResult: { marginTop: '24px', padding: '20px', backgroundColor: '#FFF', borderRadius: '16px', border: '1px solid #E2E8F0' },
  resultValue: { fontSize: '22px', fontWeight: '800', color: '#0061FF', marginTop: '8px' },
  emptyFuel: { gridColumn: 'span 3', padding: '48px', textAlign: 'center', color: '#94A3B8', fontWeight: '600' },
  fuelShowcase: { display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '24px', marginBottom: '24px' },
  fuelPumpCard: { backgroundColor: '#0F172A', borderRadius: '28px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', boxShadow: '0 12px 30px rgba(15, 23, 42, 0.22)' },
  fuelPumpDisplay: { backgroundColor: '#111827', borderRadius: '18px', padding: '18px', border: '1px solid rgba(148, 163, 184, 0.25)' },
  fuelPumpDisplayLabel: { color: '#94A3B8', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px' },
  fuelPumpDisplayValue: { color: '#F8FAFC', fontSize: '34px', fontWeight: '800', marginTop: '4px' },
  fuelPumpDisplaySub: { color: '#CBD5E1', fontSize: '12px', marginTop: '6px', fontWeight: '500' },
  fuelPumpBody: { backgroundColor: '#F8FAFC', borderRadius: '16px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' },
  fuelPumpLine: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '10px 12px' },
  fuelPumpType: { fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.4px' },
  fuelPumpPrice: { fontSize: '16px', color: '#0F172A' },
  fuelSummaryList: { backgroundColor: '#FFFFFF', borderRadius: '24px', border: '1px solid #E2E8F0', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' },
  fuelSummaryRow: { display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid var(--border)', borderRadius: '14px', padding: '10px 12px', backgroundColor: 'var(--bg-secondary)' },
  fuelSummaryDot: { width: '10px', height: '10px', borderRadius: '50%' },
  fuelSummaryInfo: { display: 'flex', flexDirection: 'column', flex: 1 },
  fuelSummaryLabel: { fontSize: '12px', fontWeight: '700', color: '#334155' },
  fuelSummaryPrice: { fontSize: '14px', fontWeight: '800', color: '#0F172A' },
  fuelSummaryVariation: { fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' },
  
  // New Component Styles
  scoreRow: { display: 'flex', alignItems: 'center', gap: '6px' },
  loadingPlanContainer: { display: 'flex', flexDirection: 'column', gap: '16px' },
  loadingStep: { display: 'flex', alignItems: 'center', gap: '20px', padding: '20px', backgroundColor: '#F8FAFC', borderRadius: '20px', border: '1px solid #E2E8F0' },
  loadingIcon: { width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0', color: '#0061FF' },
  loadingMain: { flex: 1 },
  loadingClient: { fontSize: '15px', fontWeight: '800', color: '#0F172A' },
  loadingZone: { fontSize: '12px', color: '#64748B', fontWeight: '600' },
  loadingMeta: { textAlign: 'right' },
  loadingDelivery: { fontSize: '13px', fontWeight: '800', color: '#0061FF' },
  loadingAction: { fontSize: '11px', color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', marginTop: '2px' },
  
  dashShortcutLabel: { fontSize: '14px', fontWeight: '800', color: '#0F172A' },
  dashShortcutSub: { fontSize: '11px', color: '#94A3B8', fontWeight: '600' },
  statusTag: { padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800' },
  popupContainer: { padding: '8px', minWidth: '160px' },
  popupTitle: { fontSize: '14px', fontWeight: '800', margin: '0 0 4px 0' },
  popupSub: { fontSize: '11px', color: '#64748B', margin: '0 0 8px 0' },
  popupAction: { width: '100%', padding: '8px', backgroundColor: '#0061FF', color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', marginTop: '8px' },
  
  // Intelligence styles
  strategyList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  strategyRow: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', backgroundColor: '#FFF', borderRadius: '16px', border: '1px solid var(--border)' },
  strategyIcon: { width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  strategyMain: { flex: 1 },
  strategyAction: { fontSize: '13px', fontWeight: '800', color: '#0F172A' },
  strategyReason: { fontSize: '11px', color: '#64748B', marginTop: '2px' },
  strategyMeta: { textAlign: 'right' },
  strategyImpact: { fontSize: '12px', fontWeight: '800' },
  strategyTime: { fontSize: '10px', color: '#94A3B8', marginTop: '2px' },
  aiStatusBadge: { padding: '6px 12px', backgroundColor: '#F0F7FF', color: '#0061FF', borderRadius: '12px', fontSize: '10px', fontWeight: '900' },
  cardTitle: { fontSize: '18px', fontWeight: '800', color: '#1E293B', margin: 0 },
  cardHeaderWithBadge: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' },
  insightCard: { padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: '#F8FAFC' },
  insightTitle: { fontSize: '13px', fontWeight: '800', color: '#1E293B', margin: '0 0 4px 0' },
  insightText: { fontSize: '12px', color: '#64748B', margin: 0, lineHeight: '1.5' },
  statusBadgeActive: { padding: '6px 12px', backgroundColor: '#EFF6FF', color: '#0061FF', borderRadius: '12px', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' },
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' },
  splitGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' },
  chartCard: { padding: '32px', backgroundColor: '#FFF', borderRadius: '32px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' },

  refreshBtn: {
    width: '44px',
    height: '44px',
    borderRadius: '14px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#475569',
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)',
    flexShrink: 0,
    transition: 'all 0.2s ease',
  },
  alertBtn: {
    position: 'relative',
    width: '44px',
    height: '44px',
    borderRadius: '14px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#475569',
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)',
  },
  alertBadge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    minWidth: '18px',
    height: '18px',
    padding: '0 5px',
    borderRadius: '9px',
    backgroundColor: '#EF4444',
    color: '#FFFFFF',
    fontSize: '10px',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    minHeight: '48px',
    padding: '0 22px',
    borderRadius: '14px',
    border: 'none',
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    fontSize: '13px',
    fontWeight: 800,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: '0 4px 14px rgba(15, 23, 42, 0.18)',
    transition: 'all 0.2s ease',
  },
  secondaryBtn: {
    minHeight: '48px',
    padding: '12px 18px',
    borderRadius: '14px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
  },
  outlineAccentBtn: {
    minHeight: '48px',
    padding: '12px 20px',
    borderRadius: '14px',
    border: '2px solid #0061FF',
    backgroundColor: '#EFF6FF',
    color: '#0061FF',
    fontSize: '13px',
    fontWeight: 800,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
  },
  routeSelect: {
    minWidth: '180px',
    minHeight: '48px',
    padding: '10px 18px',
    borderRadius: '14px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#FFFFFF',
    fontSize: '14px',
    fontWeight: 700,
    color: '#0F172A',
    outline: 'none',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
  },
  fuelTypeTab: {
    minHeight: '44px',
    padding: '0 20px',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
    fontSize: '12px',
    fontWeight: 800,
    letterSpacing: '0.04em',
    color: '#64748B',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  fuelTypeTabActive: {
    backgroundColor: '#FFFFFF',
    color: '#0061FF',
    borderColor: '#0061FF',
    boxShadow: '0 4px 14px rgba(0, 97, 255, 0.2)',
  },
  contentCol: { minWidth: 0, display: 'flex', flexDirection: 'column', gap: '16px' },
  controlBar: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '14px',
    padding: '14px 18px',
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
  },
  filterTabsSmall: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  filterTabSmall: {
    padding: '10px 18px',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
    color: '#475569',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  filterTabSmallActive: {
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    borderColor: '#0F172A',
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)',
  },
  viewToggle: {
    display: 'flex',
    gap: '4px',
    padding: '4px',
    backgroundColor: '#F1F5F9',
    borderRadius: '14px',
    border: '1px solid #E2E8F0',
  },
  toggleBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  mapWrapper: { height: '100%', minHeight: '520px', borderRadius: '24px', overflow: 'hidden' },
  listWrapper: { height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column' },
  sidebar: { display: 'flex', flexDirection: 'column', gap: '24px' },
  alertList: { display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '120px' },
  alertTime: { fontSize: '11px', color: '#94A3B8', fontWeight: 700 },
  alertTitle: { fontSize: '14px', fontWeight: 800, color: '#0F172A', margin: '6px 0 4px' },
  alertMsg: { fontSize: '12px', color: '#64748B', margin: 0, lineHeight: 1.45 },
  runAiBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 16px',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: '#0061FF',
    color: '#FFFFFF',
    fontSize: '11px',
    fontWeight: 800,
    letterSpacing: '0.04em',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(0, 97, 255, 0.3)',
  },
  actionBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#475569',
    transition: 'all 0.2s ease',
  },
  aiCard: {
    display: 'flex',
    gap: '14px',
    padding: '16px',
    backgroundColor: '#F8FAFC',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    alignItems: 'flex-start',
  },
  aiText: { fontSize: '13px', color: '#334155', margin: 0, lineHeight: 1.5 },
  aiImpact: { fontSize: '11px', fontWeight: 800, color: '#0061FF', marginTop: '8px' },
  tr: { transition: 'background 0.15s ease' },
  companyCell: { display: 'flex', flexDirection: 'column', gap: '6px' },
  sourceTag: {
    alignSelf: 'flex-start',
    fontSize: '10px',
    fontWeight: 800,
    padding: '3px 8px',
    borderRadius: '6px',
    backgroundColor: '#EEF2FF',
    color: '#4338CA',
  },
  companyName: { fontSize: '14px', fontWeight: 700, color: '#0F172A' },
  driverInfo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  vehiclePlate: { fontSize: '12px', color: '#94A3B8', fontWeight: 600 },
  routePath: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
  pathPoint: { fontSize: '13px', fontWeight: 600, color: '#334155' },
  timeInfo: { display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '13px' },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 14px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 800,
  },
  destinosPageRoot: {
    padding: '20px 40px 80px',
    backgroundColor: 'transparent',
    background: 'unset',
    maxWidth: '1100px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  destinosHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    padding: '20px 22px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '24px',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.05)',
  },
  destinosPageTitle: {
    fontSize: '29px',
    fontWeight: 800,
    color: '#000000',
    margin: 0,
    letterSpacing: 0,
      },
  destinosPageSub: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    fontWeight: 500,
    marginTop: '4px',
  },
  destinosClientPanel: {
    marginBottom: '6px',
    maxWidth: '100%',
    padding: '18px 22px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '20px',
    boxShadow: '0 10px 28px rgba(15, 23, 42, 0.04)',
  },
  destinosClientPanelHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '12px',
  },
  destinosClientPanelTitle: {
    fontSize: '11px',
    fontWeight: 800,
    color: 'var(--text-secondary)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  destinosClientSummary: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  destinosClientSummaryText: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--secondary)',
  },
  destinosClientList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    borderTop: '1px solid rgba(226, 232, 240, 0.65)',
  },
  destinosClientRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 0',
    borderBottom: 'none',
    cursor: 'pointer',
    borderRadius: '12px',
    transition: 'background-color 0.15s ease',
  },
  destinosClientNome: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--secondary)',
  },
  destinosClientMeta: {
    fontSize: '10px',
    fontWeight: 400,
    color: 'var(--text-secondary)',
    marginTop: '2px',
    lineHeight: 1.5,
  },
  destinosClientBadge: {
    fontSize: '11px',
    fontWeight: 800,
    padding: '6px 12px',
    borderRadius: '10px',
    flexShrink: 0,
  },
  destinosGrid: { display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '100%' },
  destinoCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '20px 22px',
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
  },
  destinoCardFlat: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '16px 4px 16px 0',
    backgroundColor: 'transparent',
    borderRadius: '16px',
    border: 'none',
    boxShadow: 'none',
  },
  destinoIcon: {
    width: '52px',
    height: '52px',
    borderRadius: '16px',
    backgroundColor: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  destinoIconFlat: {
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    backgroundColor: 'rgba(255, 255, 255, 0)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  destinoTitle: { fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: '0 0 10px' },
  destinoTitleFlat: {
    fontSize: '16px',
    fontWeight: 800,
    color: 'var(--secondary)',
    margin: '0 0 8px',
  },
  destinoStats: { display: 'flex', flexWrap: 'wrap', gap: '16px' },
  destinoStat: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748B', fontWeight: 600 },
  sidebarCol: { minWidth: 0, display: 'flex', flexDirection: 'column', gap: '24px' },
  emptyPanelHint: {
    textAlign: 'center',
    padding: '40px 24px',
    color: '#94A3B8',
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: 1.5,
    backgroundColor: '#F8FAFC',
    borderRadius: '16px',
    border: '1px dashed #E2E8F0',
  },
};

export default LogisticaHub;
