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
  const email = 'zaptro@teste.com';
  const password = '123456';
  const userId = '9e933cbf-0cd5-44ec-aa42-18efd6af9183';

  console.log(`\n--- Resolving Profile Conflict for ${email} ---`);

  // 1. Delete the profile row first to prevent duplicate key constraint violation in trigger
  console.log("Deleting profile from public.profiles...");
  const { error: deleteProfileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (deleteProfileError) {
    console.error("Warning: Error deleting profile:", deleteProfileError.message);
  } else {
    console.log("Successfully cleared profile.");
  }

  // 2. Delete duplicate auth user if it exists
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (!listError && users) {
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      console.log(`Deleting existing auth user with ID ${existing.id}...`);
      await supabase.auth.admin.deleteUser(existing.id);
    }
  }

  // 3. Create the auth user
  console.log("Creating auth user...");
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    id: userId,
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: {
      full_name: 'Usuário Teste Zaptro',
      role: 'ADMIN'
    }
  });

  if (userError) {
    console.error("Error creating auth user:", userError.message);
    return;
  }
  
  console.log("Successfully created and confirmed auth user with ID:", userData.user.id);

  // 4. Manually re-insert the correct profile with tem_zaptro and active status
  console.log("Re-inserting correct profile...");
  const { error: insertError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email: email,
      full_name: 'Usuário Teste Zaptro',
      role: 'ADMIN',
      company_id: '00000000-0000-0000-0000-000000000001',
      tem_zaptro: true,
      status_zaptro: 'ativo',
      metadata: { modules: { whatsapp: true } }
    });

  if (insertError) {
    console.error("Error re-inserting profile:", insertError.message);
  } else {
    console.log("Successfully re-inserted correct profile!");
  }
}

main();
