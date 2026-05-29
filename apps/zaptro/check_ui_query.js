import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL=(.+)/)[1].trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/)[1].trim();

const supabase = createClient(url, key);

async function run() {
  const { data: convs } = await supabase
    .from('whatsapp_conversations')
    .select('*')
    .order('last_message_at', { ascending: false })
    .limit(1);

  if (!convs || convs.length === 0) {
    console.log('No conversations found');
    return;
  }
  
  const conversationId = convs[0].id;
  console.log('Fetching messages for:', conversationId);

  const { data, error } = await supabase
    .from('whatsapp_messages')
    .select('id,conversation_id,content,direction,created_at,from_number,to_number')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(500);

  console.log('Messages Result:', { data, error });
}
run();
