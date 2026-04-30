import { supabase } from './supabase';
import { supabaseZaptro } from './supabase-zaptro';

/**
 * Chat Archiver Service
 * Automatically exports daily chat history into the Hub Drive.
 */
export const archiveDailyConversations = async (companyId: string) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    console.log(`[Chat Archiver] Arquivando conversas para empresa: ${companyId} - Dia: ${today}`);
    
    // 1. Busca mensagens do dia na Zaptro
    // Nota: Em um ambiente multi-db, isso garantiria que conversas internas fiquem salvas.
    const { data: messages, error } = await supabaseZaptro
      .from('chat_messages')
      .select(`
        id, 
        content, 
        created_at, 
        sender_id, 
        receiver_id, 
        room_id,
        profiles!sender_id (full_name)
      `)
      .eq('company_id', companyId)
      .gte('created_at', `${today}T00:00:00Z`);

    if (error) throw error;
    if (!messages || messages.length === 0) {
      return { success: true, archived: 0, message: 'Nenhuma conversa para arquivar hoje.' };
    }

    // 2. Agrupa por Thread (Canal ou Conversa Privada)
    const threads: Record<string, any[]> = {};
    messages.forEach(m => {
      const key = m.room_id || `private-${[m.sender_id, m.receiver_id].sort().join('-')}`;
      if (!threads[key]) threads[key] = [];
      threads[key].push(m);
    });

    // 3. Gera e salva um arquivo para cada thread
    let archivedCount = 0;
    for (const [threadId, threadMsgs] of Object.entries(threads)) {
      const title = threadMsgs[0].room_id ? `Canal: ${threadMsgs[0].room_id}` : 'Conversa Privada';
      const content = `--- LOG DE CONVERSA ${today} ---\n` +
                      `Origem: Zaptro App\n` +
                      `Empresa ID: ${companyId}\n` +
                      `Thread: ${threadId}\n` +
                      `-----------------------------------\n\n` +
                      threadMsgs.map(m => 
                        `[${new Date(m.created_at).toLocaleTimeString()}] ${m.profiles?.full_name || 'Usuário'}: ${m.content}`
                      ).join('\n');

      const fileName = `conversa-${threadId}-${today}.txt`;
      
      // Cria um objeto File simulado para o serviço de Drive
      const file = new File([content], fileName, { type: 'text/plain' });

      // 4. Salva no Drive via DriveIntelligence
      const { saveEntityToDrive } = await import('./driveIntelligence');
      const result = await saveEntityToDrive({
        company_id: companyId,
        type: 'zaptro',
        file,
        category: 'conversas',
        metadata: { 
          thread_id: threadId, 
          message_count: threadMsgs.length,
          archived_at: new Date().toISOString()
        }
      });

      if (result.success) archivedCount++;
    }

    return { success: true, archived: archivedCount };
  } catch (err) {
    console.error('Chat Archiver Error:', err);
    return { success: false, error: err };
  }
};
