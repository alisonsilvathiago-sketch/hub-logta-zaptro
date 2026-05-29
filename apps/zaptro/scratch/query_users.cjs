const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envPath = '/Volumes/PODCAST/PROJETOS/hub-logta-zaptro/apps/zaptro/server/.env.local';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
        process.env[key] = val;
      }
    }
  });
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server/.env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  console.log("Connecting to:", supabaseUrl);
  
  // 1. Get user by email
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) {
    console.error("Error listing auth users:", usersError.message);
  } else {
    console.log(`\nFound ${users.length} auth users:`);
    users.forEach(u => {
      console.log(`- ID: ${u.id}, Email: ${u.email}, Confirmed: ${u.email_confirmed_at ? 'YES' : 'NO'}`);
    });
  }

  // 2. Get profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*');
  
  if (profilesError) {
    console.error("Error listing profiles:", profilesError.message);
  } else {
    console.log(`\nFound ${profiles.length} profiles in 'profiles' table:`);
    profiles.forEach(p => {
      console.log(`- ID: ${p.id}, Email: ${p.email}, Full Name: ${p.full_name}, tem_zaptro: ${p.tem_zaptro}, status_zaptro: ${p.status_zaptro}, company_id: ${p.company_id}`);
    });
  }
}

main();
