import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL=(.+)/)[1].trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/)[1].trim();

const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase
    .from('whatsapp_conversations')
    .select('*')
    .limit(1);

  console.log('Result:', { data, error });
}
run();
