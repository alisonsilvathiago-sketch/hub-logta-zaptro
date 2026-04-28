import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Smile, Paperclip, Mic, User, Headset, ShieldCheck, Building2, Wallet, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [step, setStep] = useState('welcome'); // welcome, department, chat
  const [selectedDept, setSelectedDept] = useState('');
  const [chat, setChat] = useState<any[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Inicializar Usuário e Conversa
  useEffect(() => {
    const initChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Busca ou cria uma conversa de suporte para este usuário
      let { data: conv } = await supabase
        .from('conversations')
        .select('id')
        .eq('type', 'support')
        .contains('metadata', { user_id: user.id })
        .maybeSingle();

      if (!conv) {
        const { data: newConv } = await supabase
          .from('conversations')
          .insert({ 
            type: 'support', 
            name: `Suporte: ${user.email}`,
            metadata: { user_id: user.id, status: 'open' }
          })
          .select()
          .single();
        
        if (newConv) {
          conv = newConv;
          // Adiciona o usuário como participante
          await supabase.from('participants').insert({ conversation_id: newConv.id, user_id: user.id });
        }
      }

      if (conv) {
        setConversationId(conv.id);
        fetchMessages(conv.id, user.id);
        subscribeToMessages(conv.id, user.id);
      }
    };

    initChat();
  }, []);

  const fetchMessages = async (cid: string, uid: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', cid)
      .order('created_at', { ascending: true });
    
    if (data) {
      setChat(data.map(m => ({
        id: m.id,
        user: m.sender_id === uid ? 'Você' : 'Suporte',
        text: m.content,
        time: new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        isMe: m.sender_id === uid
      })));
    }
  };

  const subscribeToMessages = (cid: string, uid: string) => {
    const channel = supabase
      .channel(`chat:${cid}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages', 
        filter: `conversation_id=eq.${cid}` 
      }, (payload) => {
        const newM = payload.new;
        setChat(prev => {
          if (prev.find(m => m.id === newM.id)) return prev;
          return [...prev, {
            id: newM.id,
            user: newM.sender_id === uid ? 'Você' : 'Suporte',
            text: newM.content,
            time: new Date(newM.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            isMe: newM.sender_id === uid
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

  const handleSend = async () => {
    if (!msg.trim() || !conversationId || !userId) return;

    const textToSend = msg;
    setMsg('');

    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: userId,
      content: textToSend,
      type: 'text'
    });

    if (step === 'welcome') {
      setStep('chat');
    }
  };

  const selectDept = async (dept: string) => {
    if (!conversationId || !userId) return;
    setSelectedDept(dept);
    const text = `Quero falar com o setor: ${dept}`;
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: userId,
      content: text,
      type: 'text',
      metadata: { department: dept }
    });
    setStep('chat');
  };

  const departments = [
    { name: 'Atendimento', icon: Headset, color: '#6366F1' },
    { name: 'Suporte Técnico', icon: ShieldCheck, color: '#10B981' },
    { name: 'Administração', icon: Building2, color: '#F59E0B' },
    { name: 'Financeiro', icon: Wallet, color: '#EF4444' },
  ];

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, fontFamily: 'Inter, sans-serif' }}>
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          style={{
            width: '64px', height: '64px', borderRadius: '22px',
            background: 'linear-gradient(135deg, #6366F1, #4338CA)',
            color: '#fff', border: 'none', cursor: 'pointer',
            boxShadow: '0 12px 40px rgba(99,102,241,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1) translateY(-4px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1) translateY(0)'}
        >
          <MessageSquare size={30} />
          <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '22px', height: '22px', background: '#EF4444', border: '3px solid #fff', borderRadius: '50%', fontSize: '11px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
        </button>
      )}

      {isOpen && (
        <div style={{
          width: '400px', height: '600px', background: '#fff', borderRadius: '28px',
          boxShadow: '0 25px 70px rgba(0,0,0,0.2)', border: '1px solid rgba(0,0,0,0.05)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          animation: 'chatOpen 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <style>{`
            @keyframes chatOpen {
              from { opacity: 0; transform: scale(0.9) translateY(40px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
          `}</style>
          
          <div style={{ padding: '24px', background: '#0D1B3E', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: 44, height: 44, borderRadius: '14px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Headset size={22} />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '900', letterSpacing: '-0.3px' }}>Suporte Master Hub</div>
                <div style={{ fontSize: '11px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '700' }}>
                  <div style={{ width: 6, height: 6, background: '#10B981', borderRadius: '50%', boxShadow: '0 0 8px #10B981' }} /> Online Agora
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', width: 32, height: 32, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={18} />
            </button>
          </div>

          <div ref={scrollRef} style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', background: '#F8FAFC' }}>
            {chat.length === 0 && step === 'welcome' && (
               <div style={{ background: '#fff', padding: '16px', borderRadius: '24px', border: '1px solid #E2E8F0', fontSize: '14px', color: '#1A2340', lineHeight: '1.5' }}>
                  Olá! Bem-vindo ao Suporte Master do Hub Logta/Zaptro. Como podemos ajudar hoje?
               </div>
            )}
            
            {chat.map(m => (
              <div key={m.id} style={{
                alignSelf: m.isMe ? 'flex-end' : 'flex-start',
                maxWidth: '85%', padding: '14px 18px', borderRadius: m.isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                fontSize: '14px', lineHeight: '1.5',
                background: m.isMe ? '#6366F1' : '#fff',
                color: m.isMe ? '#fff' : '#1A2340',
                boxShadow: m.isMe ? '0 10px 20px rgba(99,102,241,0.15)' : '0 4px 12px rgba(0,0,0,0.03)',
                border: m.isMe ? 'none' : '1px solid #E2E8F0'
              }}>
                {m.text}
                <div style={{ fontSize: '10px', marginTop: '6px', opacity: 0.6, textAlign: 'right', fontWeight: '600' }}>{m.time}</div>
              </div>
            ))}

            {step === 'department' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                {departments.map(dept => (
                  <button 
                    key={dept.name}
                    onClick={() => selectDept(dept.name)}
                    style={{
                      padding: '14px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '24px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                      cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 8px rgba(0,0,0,0.02)'
                    }}
                  >
                    <dept.icon size={20} color={dept.color} />
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#1A2340' }}>{dept.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ padding: '20px 24px', background: '#fff', borderTop: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#F8FAFC', padding: '10px 18px', borderRadius: '18px', border: '1px solid #E2E8F0' }}>
              <button style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><Plus size={20} /></button>
              <input 
                value={msg} 
                onChange={e => setMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Escreva sua dúvida..." 
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', color: '#1A2340' }} 
              />
              <button 
                onClick={handleSend} 
                style={{ 
                  background: '#6366F1', border: 'none', width: 38, height: 38, borderRadius: '12px', 
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  cursor: 'pointer', boxShadow: '0 4px 10px rgba(99,102,241,0.3)' 
                }}
              >
                <Send size={18} />
              </button>
            </div>
            <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '10px', color: '#94A3B8', fontWeight: '600' }}>
              Hub Master v3.0 • Cérebro Logta & Zaptro
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
