import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, X, Send, Smile, Paperclip, 
  Headset, ShieldCheck, Building2, Wallet, Plus, 
  ChevronRight, LifeBuoy, FileText, DollarSign,
  User, CheckCheck, Clock
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [step, setStep] = useState('welcome'); // welcome, department, chat
  const [selectedDept, setSelectedDept] = useState('');
  const [chat, setChat] = useState<any[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Initialize User and check for Active Conversation
  useEffect(() => {
    const initChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // In a real scenario, we'd fetch the company_id from the user's profile
      // For now, let's assume a default company or try to find it
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).maybeSingle();
      if (profile?.company_id) setCompanyId(profile.company_id);

      // Find existing open conversation in hub_conversations
      const { data: conv } = await supabase
        .from('hub_conversations')
        .select('id, status, department')
        .eq('user_id', user.id)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (conv) {
        setConversationId(conv.id);
        setSelectedDept(conv.department);
        setStep('chat');
        fetchMessages(conv.id, user.id);
        subscribeToMessages(conv.id, user.id);
      }
    };

    initChat();
  }, []);

  const fetchMessages = async (cid: string, uid: string) => {
    const { data } = await supabase
      .from('hub_messages')
      .select('*')
      .eq('conversation_id', cid)
      .order('created_at', { ascending: true });
    
    if (data) {
      setChat(data.map(m => ({
        id: m.id,
        user: m.sender_type === 'customer' ? 'Você' : m.sender_type === 'agent' ? 'Atendente' : 'Sistema',
        text: m.message_text,
        time: new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        isMe: m.sender_type === 'customer',
        type: m.type,
        metadata: m.metadata
      })));
    }
  };

  const subscribeToMessages = (cid: string, uid: string) => {
    const channel = supabase
      .channel(`chat:${cid}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'hub_messages', 
        filter: `conversation_id=eq.${cid}` 
      }, (payload) => {
        const newM = payload.new;
        setChat(prev => {
          if (prev.find(m => m.id === newM.id)) return prev;
          return [...prev, {
            id: newM.id,
            user: newM.sender_type === 'customer' ? 'Você' : newM.sender_type === 'agent' ? 'Atendente' : 'Sistema',
            text: newM.message_text,
            time: new Date(newM.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            isMe: newM.sender_type === 'customer',
            type: newM.type,
            metadata: newM.metadata
          }];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat, isOpen]);

  const startConversation = async (dept: string) => {
    if (!userId) return;
    
    setSelectedDept(dept);
    
    // 1. Create conversation in new hub_conversations table
    const { data: conv, error: cErr } = await supabase
      .from('hub_conversations')
      .insert({
        company_id: companyId,
        user_id: userId,
        department: dept,
        status: 'open',
        priority: 'medium'
      })
      .select()
      .single();

    if (cErr || !conv) return;

    setConversationId(conv.id);
    setStep('chat');

    // 2. Create automatic welcome message
    await supabase.from('hub_messages').insert({
      conversation_id: conv.id,
      sender_id: '00000000-0000-0000-0000-000000000000', // System ID
      sender_type: 'system',
      message_text: `Olá! 👋 Recebemos sua solicitação para o setor ${dept.toUpperCase()}. Um de nossos especialistas entrará em contato em breve.`,
      type: 'system'
    });

    // 3. Create Support Ticket entry
    await supabase.from('hub_tickets').insert({
      conversation_id: conv.id,
      category: dept
    });

    subscribeToMessages(conv.id, userId);
  };

  const handleSend = async () => {
    if (!msg.trim() || !conversationId || !userId) return;

    const textToSend = msg;
    setMsg('');

    await supabase.from('hub_messages').insert({
      conversation_id: conversationId,
      sender_id: userId,
      sender_type: 'customer',
      message_text: textToSend,
      type: 'text'
    });
  };

  const departments = [
    { id: 'suporte', name: 'Suporte Técnico', icon: Headset, color: '#6366F1', desc: 'Dúvidas e erros' },
    { id: 'financeiro', name: 'Financeiro', icon: Wallet, color: '#10B981', desc: 'Boletos e créditos' },
    { id: 'comercial', name: 'Comercial', icon: Building2, color: '#F59E0B', desc: 'Novos planos' },
    { id: 'operacao', name: 'Operação', icon: ShieldCheck, color: '#EF4444', desc: 'Status de entregas' },
  ];

  return (
    <div style={{ position: 'fixed', bottom: '32px', right: '32px', zIndex: 10000, fontFamily: 'Inter, sans-serif' }}>
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          style={{
            width: '72px', height: '72px', borderRadius: '24px',
            background: 'linear-gradient(135deg, #6366F1 0%, #0F172A 100%)',
            color: '#fff', border: 'none', cursor: 'pointer',
            boxShadow: '0 20px 40px rgba(99,102,241,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            position: 'relative'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08) translateY(-4px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1) translateY(0)'}
        >
          <MessageSquare size={32} />
          <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '24px', height: '24px', backgroundColor: '#EF4444', border: '4px solid #fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900' }}>1</div>
        </button>
      )}

      {isOpen && (
        <div style={{
          width: '420px', height: '640px', backgroundColor: '#fff', borderRadius: '32px',
          boxShadow: '0 40px 100px rgba(0,0,0,0.25)', border: '1px solid rgba(0,0,0,0.05)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          animation: 'chatSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <style>{`
            @keyframes chatSlideUp {
              from { opacity: 0; transform: translateY(40px) scale(0.95); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
          
          <header style={{ padding: '28px', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: 48, height: 48, borderRadius: '16px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Headset size={24} />
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '900', letterSpacing: '-0.3px' }}>Suporte Master Hub</div>
                <div style={{ fontSize: '12px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', marginTop: '2px' }}>
                  <div style={{ width: 6, height: 6, background: '#10B981', borderRadius: '50%', boxShadow: '0 0 10px #10B981' }} /> Equipe Online
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', width: 36, height: 36, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={20} />
            </button>
          </header>

          <div ref={scrollRef} style={{ flex: 1, padding: '28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: '#F8FAFC' }}>
            {step === 'welcome' && (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.5s ease' }}>
                  <div style={{ background: '#fff', padding: '20px', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0F172A', margin: '0 0 8px 0' }}>Olá! 👋</h3>
                    <p style={{ fontSize: '14px', color: '#64748B', margin: 0, lineHeight: '1.6', fontWeight: '500' }}>
                      Bem-vindo à Central de Comando. Escolha um departamento para iniciar seu atendimento imersivo.
                    </p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {departments.map(dept => (
                      <button 
                        key={dept.id}
                        onClick={() => startConversation(dept.id)}
                        style={{
                          padding: '20px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '24px',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
                          cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 8px rgba(0,0,0,0.02)'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = dept.color;
                          e.currentTarget.style.transform = 'translateY(-4px)';
                          e.currentTarget.style.boxShadow = `0 10px 20px -5px ${dept.color}20`;
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = '#E2E8F0';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.02)';
                        }}
                      >
                        <dept.icon size={28} color={dept.color} />
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '13px', fontWeight: '900', color: '#0F172A' }}>{dept.name}</div>
                          <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '600' }}>{dept.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
               </div>
            )}
            
            {step === 'chat' && chat.map(m => (
              <div key={m.id} style={{
                alignSelf: m.isMe ? 'flex-end' : 'flex-start',
                maxWidth: '85%', display: 'flex', flexDirection: 'column', gap: '4px'
              }}>
                <div style={{
                  padding: '14px 20px', borderRadius: m.isMe ? '24px 24px 4px 24px' : '24px 24px 24px 4px',
                  fontSize: '15px', lineHeight: '1.6', fontWeight: '500',
                  background: m.isMe ? 'linear-gradient(135deg, #6366F1 0%, #4338CA 100%)' : (m.type === 'system' ? '#F1F5F9' : '#fff'),
                  color: m.isMe ? '#fff' : (m.type === 'system' ? '#64748B' : '#0F172A'),
                  boxShadow: m.isMe ? '0 10px 25px rgba(99,102,241,0.2)' : '0 4px 15px rgba(0,0,0,0.05)',
                  border: m.isMe ? 'none' : '1px solid #E2E8F0',
                  fontStyle: m.type === 'system' ? 'italic' : 'normal'
                }}>
                  {m.type === 'payment_link' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <DollarSign size={20} /> <span style={{ fontWeight: '900' }}>Cobrança Gerada</span>
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: '900' }}>R$ {m.metadata?.amount}</div>
                      <button style={{ padding: '10px', borderRadius: '12px', border: 'none', backgroundColor: '#fff', color: '#6366F1', fontWeight: '900', fontSize: '12px', cursor: 'pointer' }}>PAGAR AGORA</button>
                    </div>
                  ) : m.text}
                </div>
                <div style={{ fontSize: '10px', opacity: 0.5, textAlign: m.isMe ? 'right' : 'left', fontWeight: '700', padding: '0 8px' }}>
                  {m.user} • {m.time}
                </div>
              </div>
            ))}
          </div>

          {step === 'chat' && (
            <div style={{ padding: '24px', backgroundColor: '#fff', borderTop: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#F8FAFC', padding: '12px 20px', borderRadius: '22px', border: '1px solid #E2E8F0' }}>
                <button style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><Plus size={20} /></button>
                <input 
                  value={msg} 
                  onChange={e => setMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Descreva seu problema..." 
                  style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '15px', color: '#0F172A', fontWeight: '600' }} 
                />
                <button 
                  onClick={handleSend} 
                  style={{ 
                    background: '#6366F1', border: 'none', width: 44, height: 44, borderRadius: '14px', 
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    cursor: 'pointer', boxShadow: '0 8px 16px rgba(99,102,241,0.3)', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <Send size={20} />
                </button>
              </div>
              <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '11px', color: '#94A3B8', fontWeight: '700', letterSpacing: '0.5px' }}>
                HUB MASTER v4.0 • SISTEMA DE SUPORTE IMERSIVO
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
