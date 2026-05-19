const { createClient } = require('@supabase/supabase-js');

// ── CONFIGURATIONS ──
const DB1_URL = 'https://rrjnkmgkhbtapumgmhhr.supabase.co';
const DB1_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyam5rbWdraGJ0YXB1bWdtaGhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjcxMjk1NywiZXhwIjoyMDkyMjg4OTU3fQ.iNYwaN8oAJJeNrqXKNhCuGVkA2cmYLvdXSD_l-tL4Og';

const DB2_URL = 'https://kgktwaziasxgeseucsoy.supabase.co';
const DB2_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtna3R3YXppYXN4Z2VzZXVjc295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MTMyODQsImV4cCI6MjA5MjI4OTI4NH0.vej-NjFayhdrFyCvYdXeO8vfZoEDOMamYzFZuQgNE28';

async function seedDatabase1() {
  console.log('\n--- SYSTEM: ZAPTRO / HUB / LOGDOCK (DB 1) ---');
  const supabase = createClient(DB1_URL, DB1_SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const admins = [
    { email: 'zapro@teste.com', password: '123456', name: 'Zaptro Admin' },
    { email: 'logdock@teste.com', password: '123456', name: 'LogDock Admin' }
  ];

  // 1. Get or create a default company in public.empresas
  let companyId = '00000000-0000-0000-0000-000000000000';
  const { data: existingCompany, error: compFetchError } = await supabase
    .from('empresas')
    .select('id')
    .limit(1);

  if (existingCompany && existingCompany.length > 0) {
    companyId = existingCompany[0].id;
    console.log(`Found existing company in DB1: ${companyId}`);
  } else {
    // Insert a default company
    const { data: newCompany, error: compInsertError } = await supabase
      .from('empresas')
      .insert([{
        id: companyId,
        nome_fantasia: 'Admin Matriz',
        status: 'ativo'
      }])
      .select();

    if (compInsertError) {
      console.error('Error creating default company in DB1:', compInsertError.message);
    } else {
      console.log(`Created default company in DB1: ${companyId}`);
    }
  }

  for (const adm of admins) {
    console.log(`Registering ${adm.email}...`);

    // Delete existing auth user to ensure clean state
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    const existingUser = users?.users?.find(u => u.email === adm.email);

    let userId;
    if (existingUser) {
      console.log(`User ${adm.email} already exists in DB1. Updating password...`);
      userId = existingUser.id;
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        password: adm.password,
        email_confirm: true
      });
      if (updateError) console.error('Error updating user:', updateError.message);
    } else {
      // Create user using Service Role
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: adm.email,
        password: adm.password,
        email_confirm: true,
        user_metadata: { full_name: adm.name }
      });

      if (createError) {
        console.error('Error creating user:', createError.message);
        continue;
      }
      userId = newUser.user.id;
      console.log(`Created user ${adm.email} in DB1 with ID: ${userId}`);
    }

    // Upsert Profile as MASTER admin linked to company
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: adm.email,
        full_name: adm.name,
        role: 'MASTER',
        status: 'active',
        empresa_id: companyId
      });

    if (profileError) {
      console.error(`Error setting admin profile for ${adm.email}:`, profileError.message);
    } else {
      console.log(`Successfully verified and set MASTER role for ${adm.email}!`);
    }
  }
}

async function seedDatabase2() {
  console.log('\n--- SYSTEM: LOGTA SaaS (DB 2) ---');
  
  // Use DB2 anon client to sign up / sign in the user
  const supabase = createClient(DB2_URL, DB2_ANON, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const email = 'logta@teste.com';
  const password = '123456';

  console.log(`Attempting to sign in/sign up ${email} on DB2...`);
  
  // Try to sign in first
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  let userId;
  if (!signInError && signInData?.user) {
    console.log(`Successfully signed in existing user ${email}.`);
    userId = signInData.user.id;
  } else {
    console.log(`User does not exist or password mismatch. Attempting signUp...`);
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: 'Logta Admin' }
      }
    });

    if (signUpError) {
      console.error('Failed to sign up user in DB2:', signUpError.message);
      return;
    }
    
    userId = signUpData?.user?.id;
    console.log(`Successfully registered user ${email} in DB2 with ID: ${userId}`);
  }

  if (!userId) {
    console.error('Could not obtain User ID for DB2.');
    return;
  }

  // Now, since the client is authenticated as the user, we can update their profile in public.perfis!
  // Wait, let's create a client authenticated as the new user
  const authClient = createClient(DB2_URL, DB2_ANON, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  
  await authClient.auth.setSession({
    access_token: signInData?.session?.access_token || '',
    refresh_token: signInData?.session?.refresh_token || ''
  });

  console.log('Verifying and updating user profile in public.perfis...');

  const { error: profileError } = await authClient
    .from('perfis')
    .upsert({
      id: userId,
      nome: 'Logta Admin',
      cargo: 'Admin',
      nivel_acesso: 9, // highest access
      empresa_id: 'default' // Default company in empresas table
    });

  if (profileError) {
    console.error('Error updating profile in public.perfis:', profileError.message);
    console.log('Trying to insert/update profile with regular update...');
    const { error: updateError } = await authClient
      .from('perfis')
      .update({
        cargo: 'Admin',
        nivel_acesso: 9,
        empresa_id: 'default'
      })
      .eq('id', userId);
    
    if (updateError) {
      console.error('Update failed as well:', updateError.message);
    } else {
      console.log(`Successfully updated profile in public.perfis for ${email}!`);
    }
  } else {
    console.log(`Successfully verified and upserted profile in public.perfis for ${email}!`);
  }
}

async function run() {
  try {
    await seedDatabase1();
    await seedDatabase2();
    console.log('\n🌟 ALL ADMINISTRATIVE ACCOUNTS SUCCESSFULLY PROVISIONED!');
  } catch (error) {
    console.error('Critical failure in seeder script:', error);
  }
}

run();
