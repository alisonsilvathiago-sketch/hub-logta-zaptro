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
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  const email = 'zaptro@teste.com';
  const password = '123456';
  const userId = '9e933cbf-0cd5-44ec-aa42-18efd6af9183'; // Use the same ID from profiles

  console.log(`Ensuring auth user for ${email}...`);

  // 1. Delete if it exists in auth.users under a different ID to prevent duplicate key
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (!listError && users) {
    const existing = users.find(u => u.email.toLowerCase() === email);
    if (existing && existing.id !== userId) {
      console.log(`Deleting duplicate auth user with ID ${existing.id}...`);
      await supabase.auth.admin.deleteUser(existing.id);
    }
  }

  // 2. Create or update the user with the exact ID we want
  const { data, error } = await supabase.auth.admin.createUser({
    id: userId,
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: {
      full_name: 'Usuário Teste Zaptro',
      role: 'ADMIN'
    }
  });

  if (error) {
    // If it already exists, let's update it
    if (error.message.includes('already exists') || error.message.includes('already registered')) {
      console.log("User already exists in auth. Updating password and confirming email...");
      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        {
          password: password,
          email_confirm: true
        }
      );
      if (updateError) {
        console.error("Error updating user:", updateError.message);
      } else {
        console.log("Successfully updated and confirmed user!");
      }
    } else {
      console.error("Error creating user:", error.message);
    }
  } else {
    console.log("Successfully created and confirmed user with ID:", data.user.id);
  }
}

main();
