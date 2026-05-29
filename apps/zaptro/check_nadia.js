import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL=(.+)/)[1].trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/)[1].trim();

const supabase = createClient(url, key);

async function run() {
  const { data: convs } = await supabase
    .from('whatsapp_conversations')
    .select('id, sender_name, sender_number')
    .ilike('sender_name', '%Nádia%')
    .limit(5);

  console.log('Nádia Convs:', convs);

  if (convs && convs.length > 0) {
    const { data: msgs } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('conversation_id', convs[0].id)
      .limit(10);
    console.log('Nádia Msgs:', msgs);
  }
}
run();
