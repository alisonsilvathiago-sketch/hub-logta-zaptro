import React, { useState } from 'react';
import { 
  Search, Plus, MoreHorizontal, MessageSquare, 
  DollarSign, User, Calendar, ArrowRight,
  TrendingUp, CheckCircle2, XCircle, Clock,
  Filter, LayoutGrid, List as ListIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useZaptroTheme } from '../context/ZaptroThemeContext';
import { ZAPTRO_SHADOW } from '../constants/zaptroShadows';
import { notifyZaptro } from '../components/Zaptro/ZaptroNotificationSystem';
import Pagination from '@shared/components/Pagination';

// Lead Statuses
const STAGES = [
  { id: 'novo', label: 'Novo', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
  { id: 'atendimento', label: 'Em Atendimento', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
  { id: 'orcamento', label: 'Orçamento Enviado', color: '#eab308', bg: 'rgba(234, 179, 8, 0.1)' },
  { id: 'negociacao', label: 'Negociação', color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' },
  { id: 'fechado', label: 'Fechado', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
  { id: 'perdido', label: 'Perdido', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
];

export const ZaptroLeadsTab: React.FC = () => {
  const navigate = useNavigate();
  const { palette } = useZaptroTheme();
  const d = palette.mode === 'dark';
  const border = palette.sidebarBorder;
  const surface = d ? 'rgba(255,255,255,0.04)' : '#FFFFFF';
  const surface2 = d ? 'rgba(255,255,255,0.06)' : '#F8FAFC';

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<'all' | string>('all');

  // Mock Leads
  const [leads, setLeads] = useState([
    { id: 'l1', name: 'Transportes Transville', phone: '(11) 98877-6655', stage: 'negociacao', value: 'R$ 12.500,00', date: '2024-04-23', tags: ['Urgente', 'Alto Valor'], owner: 'Alison Silva' },
    { id: 'l2', name: 'Logística Express', phone: '(21) 97766-5544', stage: 'novo', value: '—', date: '2024-04-24', tags: ['Novo'], owner: 'João Santos' },
    { id: 'l3', name: 'Distribuidora Alvorada', phone: '(47) 99911-2233', stage: 'orcamento', value: 'R$ 4.200,00', date: '2024-04-22', tags: ['Recorrente'], owner: 'Alison Silva' },
    { id: 'l4', name: 'Mercado Central Ltda', phone: '(31) 98888-0000', stage: 'atendimento', value: '—', date: '2024-04-24', tags: ['Frio'], owner: 'Ana Souza' },
  ]);

  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredLeads = leads.filter(l => {
    const q = searchTerm.toLowerCase();
    const matchesText = l.name.toLowerCase().includes(q) || 
                       l.phone.includes(searchTerm);
    const matchesStage = stageFilter === 'all' || l.stage === stageFilter;
    return matchesText && matchesStage;
  });

  const totalPages = Math.ceil(filteredLeads.length / rowsPerPage);
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const getStageLeads = (stageId: string) => filteredLeads.filter(l => l.stage === stageId);

  const renderKanban = () => (
    <div style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 20, minHeight: '600px' }}>
      <style>{`
        .hover-scale { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; }
        .hover-scale:hover { transform: scale(1.02) translateY(-4px); box-shadow: 0 12px 24px -8px rgba(0,0,0,0.15) !important; }
      `}</style>
      {STAGES.map(stage => {
        const stageLeads = getStageLeads(stage.id);
        return (
          <div key={stage.id} style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: stage.color }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: palette.text, letterSpacing: '-0.01em' }}>{stage.label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted, backgroundColor: surface2, padding: '2px 8px', borderRadius: 20 }}>{stageLeads.length}</span>
              </div>
              <button className="hover-scale" style={{ background: 'transparent', border: 'none', color: palette.textMuted, cursor: 'pointer' }}>
                <Plus size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {stageLeads.map(lead => (
                <div 
                  key={lead.id} 
                  onClick={() => navigate(`/clientes/leads/perfil/${lead.id}`)}
                  className="hover-scale"
                  style={{ 
                    backgroundColor: surface, 
                    border: `1px solid ${border}`, 
                    borderRadius: 16, 
                    padding: 16, 
                    cursor: 'pointer',
                    boxShadow: d ? 'none' : ZAPTRO_SHADOW.sm,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: palette.text, letterSpacing: '-0.01em' }}>{lead.name}</h4>
                    <button style={{ background: 'transparent', border: 'none', color: palette.textMuted, cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); notifyZaptro('info', 'Ações', 'Menu de ações rápidas'); }}>
                      <MoreHorizontal size={16} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {lead.tags.map(tag => (
                      <span key={tag} style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, backgroundColor: surface2, color: palette.textMuted }}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: palette.textMuted, fontWeight: 600 }}>
                      <DollarSign size={14} />
                      <span style={{ color: lead.value !== '—' ? stage.color : palette.textMuted }}>{lead.value}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: palette.textMuted, fontWeight: 600 }}>
                      <Clock size={14} />
                      <span>{new Date(lead.date).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div style={{ borderTop: `1px solid ${border}`, paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: palette.lime, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#000' }}>
                        {lead.owner[0]}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted }}>{lead.owner.split(' ')[0]}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="hover-scale" title="WhatsApp" style={{ width: 28, height: 28, borderRadius: 8, border: 'none', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); notifyZaptro('success', 'WhatsApp', 'Abrindo conversa...'); }}>
                        <MessageSquare size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {stageLeads.length === 0 && (
                <div style={{ padding: 24, border: `2px dashed ${border}`, borderRadius: 16, textAlign: 'center', color: palette.textMuted, fontSize: 12, fontWeight: 600 }}>
                  Sem leads
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderList = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ backgroundColor: surface, borderRadius: '24px', border: `1px solid ${border}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: surface2, borderBottom: `1px solid ${border}` }}>
              <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: palette.text, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Lead</th>
              <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: palette.text, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Estágio</th>
              <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: palette.text, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Valor</th>
              <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: palette.text, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Data</th>
              <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: palette.text, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {!paginatedLeads.length ? (
              <tr>
                <td colSpan={5} style={{ padding: 48, textAlign: 'center', color: palette.textMuted, fontWeight: 700 }}>Nenhum lead encontrado.</td>
              </tr>
            ) : (
              paginatedLeads.map(lead => {
                const stage = STAGES.find(s => s.id === lead.stage);
                return (
                  <tr key={lead.id} className="hover-scale" onClick={() => navigate(`/clientes/leads/perfil/${lead.id}`)} style={{ borderBottom: `1px solid ${border}` }}>
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: palette.lime, color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{lead.name[0]}</div>
                        <div>
                          <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: palette.text }}>{lead.name}</span>
                          <span style={{ display: 'block', fontSize: 12, color: palette.textMuted, fontWeight: 600 }}>{lead.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <span style={{ padding: '6px 12px', borderRadius: 8, fontSize: 10, fontWeight: 700, letterSpacing: '0.02em', backgroundColor: stage?.bg, color: stage?.color }}>
                        {stage?.label.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '20px 24px', fontSize: 13, fontWeight: 700, color: lead.value !== '—' ? stage?.color : palette.textMuted }}>
                      {lead.value}
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: palette.textMuted }}>
                        <Calendar size={14} />
                        <span>{new Date(lead.date).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <button className="hover-scale" style={{ padding: '10px 16px', backgroundColor: surface2, color: palette.text, border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} onClick={(e) => { e.stopPropagation(); navigate(`/clientes/leads/perfil/${lead.id}`); }}>
                        Ver Detalhes <ArrowRight size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination 
        currentPage={currentPage}
        totalItems={filteredLeads.length}
        itemsPerPage={rowsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(val) => {
          setRowsPerPage(val as number);
          setCurrentPage(1);
        }}
      />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Dashboard Mini */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
        <div className="hover-scale" style={{ backgroundColor: surface, border: `1px solid ${border}`, borderRadius: 20, padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={20} color="#3b82f6" />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: palette.textMuted, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Total Leads</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: palette.text }}>{leads.length}</span>
          </div>
        </div>
        <div className="hover-scale" style={{ backgroundColor: surface, border: `1px solid ${border}`, borderRadius: 20, padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(234, 179, 8, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign size={20} color="#eab308" />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: palette.textMuted, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Em Negociação</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: palette.text }}>{leads.filter(l => l.stage === 'negociacao').length}</span>
          </div>
        </div>
        <div className="hover-scale" style={{ backgroundColor: surface, border: `1px solid ${border}`, borderRadius: 20, padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={20} color="#22c55e" />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: palette.textMuted, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Convertidos</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: palette.text }}>85%</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: '300px' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, backgroundColor: surface2, padding: '12px 18px', borderRadius: 16, border: `1px solid ${border}` }}>
            <Search size={18} color={palette.textMuted} />
            <input 
              placeholder="Buscar leads por nome ou telefone..." 
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              style={{ border: 'none', outline: 'none', fontSize: 14, fontWeight: 600, width: '100%', backgroundColor: 'transparent', color: palette.text }} 
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', backgroundColor: surface2, border: `1px solid ${border}`, borderRadius: 16 }}>
            <Filter size={16} color={palette.textMuted} />
            <select
              value={stageFilter}
              onChange={(e) => { setStageFilter(e.target.value); setCurrentPage(1); }}
              style={{ border: 'none', outline: 'none', fontSize: 13, fontWeight: 700, backgroundColor: 'transparent', color: palette.text, cursor: 'pointer', padding: '12px 0', fontFamily: 'inherit', appearance: 'none' }}
            >
              <option value="all">Filtro: Todos</option>
              {STAGES.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ display: 'flex', backgroundColor: surface2, padding: 4, borderRadius: 12, border: `1px solid ${border}` }}>
            <button 
              className="hover-scale"
              onClick={() => setViewMode('kanban')}
              style={{ padding: '8px 12px', border: 'none', borderRadius: 8, backgroundColor: viewMode === 'kanban' ? surface : 'transparent', color: viewMode === 'kanban' ? palette.text : palette.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              className="hover-scale"
              onClick={() => setViewMode('list')}
              style={{ padding: '8px 12px', border: 'none', borderRadius: 8, backgroundColor: viewMode === 'list' ? surface : 'transparent', color: viewMode === 'list' ? palette.text : palette.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <ListIcon size={16} />
            </button>
          </div>
          <button className="hover-scale" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', backgroundColor: 'rgba(217, 255, 0, 0.14)', color: '#000', border: '1px solid rgba(217, 255, 0, 1)', borderRadius: 16, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            <Plus size={18} strokeWidth={2.5} /> Novo Lead
          </button>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'kanban' ? renderKanban() : renderList()}
    </div>
  );
};
