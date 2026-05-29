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

async function cleanAndCreateUser(email, password, userId, fullName) {
  console.log(`\n--- Cleaning and recreating ${email} ---`);
  
  // 1. Fetch user by email to get their ID if it's different
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (!listError && users) {
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      console.log(`Deleting existing auth user with ID ${existing.id}...`);
      await supabase.auth.admin.deleteUser(existing.id);
    }
  }

  // Also delete by the desired ID just in case it is corrupted
  try {
    await supabase.auth.admin.deleteUser(userId);
  } catch (e) {
    // ignore if not found
  }

  // 2. Create the user using the official API (this automatically sets all non-null columns correctly)
  const { data, error } = await supabase.auth.admin.createUser({
    id: userId,
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: 'ADMIN'
    }
  });

  if (error) {
    console.error(`Failed to create ${email}:`, error.message);
  } else {
    console.log(`Successfully created and confirmed ${email} with ID:`, data.user.id);
  }
}

async function main() {
  // Fix zaptro@teste.com
  await cleanAndCreateUser(
    'zaptro@teste.com',
    '123456',
    '9e933cbf-0cd5-44ec-aa42-18efd6af9183',
    'Usuário Teste Zaptro'
  );

  // Fix logta@teste.com
  await cleanAndCreateUser(
    'logta@teste.com',
    '123456',
    '6a6f7484-68a3-4311-90bf-d5b55c828c8b',
    'Administrador Logita'
  );
}

main();
