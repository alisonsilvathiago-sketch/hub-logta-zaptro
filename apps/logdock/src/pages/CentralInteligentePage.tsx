import React, { useState } from 'react';
import { Brain, FileText, Clock, FolderOpen, Folder, Link as LinkIcon, Tag } from 'lucide-react';

export default function CentralInteligentePage() {
  const [activeFilter, setActiveFilter] = useState('todos');
  const [uploadQueue, setUploadQueue] = useState<any[]>([]);

  const timelineData = [
    {
      date: 'Hoje',
      items: [
        { id: 1, type: 'financeiro', name: 'nota_fiscal_123.pdf', action: 'Movido para: Financeiro', link: 'Vinculado à entrega #123', tag: 'Urgente', time: 'Agora mesmo', reason: 'O sistema identificou que este arquivo é financeiro e organizou automaticamente.' },
        { id: 2, type: 'entregas', name: 'comprovante_assinado.jpg', action: 'Movido para: Entregas', link: 'Vinculado ao Cliente XPTO', tag: 'Aprovado', time: 'Há 2 horas', reason: 'O sistema detectou uma assinatura de comprovante válida.' }
      ]
    },
    {
      date: 'Ontem',
      items: [
        { id: 3, type: 'clientes', name: 'contrato_social.pdf', action: 'Movido para: Clientes', link: 'Vinculado ao Cliente ABC', tag: 'Documentação', time: '14:30', reason: 'Documento jurídico identificado e classificado.' }
      ]
    }
  ];

  return (
    <div style={{ padding: '48px 64px', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#F8F9FA' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Brain size={32} color="#0061FF" />
            Central Inteligente
          </h1>
          <p style={{ fontSize: '15px', color: '#64748B', marginTop: '8px' }}>Histórico completo de automações e organizações feitas pela IA.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', backgroundColor: '#FFF', padding: '6px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          {['todos', 'financeiro', 'entregas', 'clientes'].map(f => (
            <button 
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{ padding: '8px 16px', borderRadius: '12px', border: 'none', backgroundColor: activeFilter === f ? '#0061FF' : 'transparent', color: activeFilter === f ? '#FFF' : '#64748B', fontWeight: 700, fontSize: '13px', cursor: 'pointer', textTransform: 'capitalize' }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '16px' }}>
        <div style={{ position: 'relative', paddingLeft: '24px' }}>
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '31px', width: '2px', backgroundColor: '#E2E8F0' }} />
          
          {timelineData.map(group => (
            <div key={group.date} style={{ marginBottom: '40px', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '0', top: '2px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#0061FF', border: '4px solid #F8F9FA', zIndex: 10 }} />
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#1E293B', marginLeft: '32px', marginBottom: '24px' }}>{group.date}</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginLeft: '32px' }}>
                {group.items.filter(i => activeFilter === 'todos' || i.type === activeFilter).map(item => (
                  <div key={item.id} style={{ backgroundColor: '#FFF', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #F1F1F1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FileText size={24} color="#3B82F6" />
                        </div>
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>{item.name}</div>
                          <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock size={14} /> {item.time}
                          </div>
                        </div>
                      </div>
                      <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: '#F8FAFC', color: '#0061FF', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.backgroundColor='#EFF6FF'} onMouseLeave={e => e.currentTarget.style.backgroundColor='#F8FAFC'}>
                        <FolderOpen size={16} />
                        Abrir localização
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#F1F5F9', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                        <Folder size={14} color="#64748B" /> {item.action}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#F1F5F9', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                        <LinkIcon size={14} color="#64748B" /> {item.link}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#FEF2F2', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, color: '#EF4444' }}>
                        <Tag size={14} color="#EF4444" /> {item.tag}
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#F8FAFC', borderLeft: '3px solid #0061FF', padding: '12px 16px', borderRadius: '0 12px 12px 0' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Brain size={16} color="#0061FF" />
                        Decisão da IA
                      </div>
                      <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px', lineHeight: '1.5' }}>{item.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {uploadQueue.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: '#1A1A1A',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          zIndex: 100000,
          minWidth: '300px'
        }}>
          <h4 style={{ color: '#FFF', fontSize: '14px', marginBottom: '12px', fontWeight: 600 }}>
            Fazendo upload de {uploadQueue.length} arquivo(s)
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {uploadQueue.map(item => (
              <div key={item.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{item.name}</span>
                  <span style={{ color: item.status === 'done' ? '#34D399' : '#0061FF', fontWeight: 600 }}>
                    {item.status === 'done' ? 'Concluído' : `${item.progress}%`}
                  </span>
                </div>
                <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', backgroundColor: item.status === 'done' ? '#34D399' : '#0061FF', width: `${item.progress}%`, transition: 'width 0.2s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
