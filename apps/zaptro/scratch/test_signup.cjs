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

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const uniqueEmail = `test_${Date.now()}@teste.com`;
  console.log(`Testing signUp with email: ${uniqueEmail}`);
  
  const { data, error } = await supabase.auth.signUp({
    email: uniqueEmail,
    password: 'password123'
  });

  if (error) {
    console.log("\n--- SIGNUP FAILED ---");
    console.log("Error Name:", error.name);
    console.log("Error Message:", error.message);
    console.log("Error Status:", error.status);
    console.log("Error Details:", JSON.stringify(error, null, 2));
  } else {
    console.log("\n--- SIGNUP SUCCESSFUL ---");
    console.log("User ID:", data.user.id);
  }
}

main();
