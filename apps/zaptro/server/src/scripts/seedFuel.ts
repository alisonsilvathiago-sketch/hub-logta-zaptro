import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedFuel() {
  console.log('⛽ Seeding fuel prices...');
  
  const prices = [
    { type: 'gasolina', price: 5.89, variation_percentage: 1.2, updated_at: new Date() },
    { type: 'etanol', price: 3.45, variation_percentage: -0.5, updated_at: new Date() },
    { type: 'diesel', price: 6.12, variation_percentage: 0.0, updated_at: new Date() }
  ];

  for (const p of prices) {
    const { error } = await supabase.from('fuel_prices').upsert(p, { onConflict: 'type' });
    if (error) console.error(`Error seeding ${p.type}:`, error);
  }

  console.log('✅ Fuel prices seeded.');
}

seedFuel();
