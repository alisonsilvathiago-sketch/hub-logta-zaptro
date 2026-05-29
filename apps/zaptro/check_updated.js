import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL=(.+)/)[1].trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/)[1].trim();

const supabase = createClient(url, key);

async function run() {
  const { data } = await supabase
    .from('whatsapp_conversations')
    .select('id, company_id')
    .eq('company_id', '30d09353-49d5-47c6-9568-e6d4c0bbcfb2')
    .limit(5);

  console.log('Conversations with correct company_id:', data);
}
run();
