const { createClient } = require('@supabase/supabase-js');

// Load environment variables from apps/zaptro/server/.env.local
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../../server/.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
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
