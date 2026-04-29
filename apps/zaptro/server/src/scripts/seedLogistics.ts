import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedLogistics() {
  console.log('🚛 Seeding logistics data (Aggregates & Actions)...');
  
  // 1. Seed Aggregates
  const aggregates = [
    { name: 'Ricardo Silva', vehicle: 'Fiat Fiorino', plate: 'ABC-1234', score: 98, status: 'ativo', total_deliveries: 145, total_earnings: 4500 },
    { name: 'Marcos Oliveira', vehicle: 'Mercedes Accelo', plate: 'XYZ-9876', score: 85, status: 'ativo', total_deliveries: 89, total_earnings: 12400 },
    { name: 'Ana Costa', vehicle: 'HR Hyundai', plate: 'KJH-5544', score: 92, status: 'ativo', total_deliveries: 210, total_earnings: 8900 }
  ];

  for (const a of aggregates) {
    await supabase.from('aggregates').upsert(a, { onConflict: 'plate' });
  }

  // 2. Seed Delivery Actions (for Fulfillment Guardian)
  const actions = [
    { order_id: 'ORD-1001', customer_name: 'Loja Central', token: 'TKN-123', status: 'pendente', expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000) },
    { order_id: 'ORD-1002', customer_name: 'Supermercado Silva', token: 'TKN-456', status: 'confirmado', responded_at: new Date() },
    { order_id: 'ORD-1003', customer_name: 'Fármacia Popular', token: 'TKN-789', status: 'reagendado', rescheduled_date: '2026-05-01', rescheduled_faixa: 'Tarde' }
  ];

  for (const ac of actions) {
    await supabase.from('delivery_actions').upsert(ac, { onConflict: 'order_id' });
  }

  // 3. Seed Exceptions
  const exceptions = [
    { type: 'DELAY', target_id: 'ORD-1004', description: 'Atraso de 45min detectado pelo GPS', priority: 'Alta', status: 'pendente' },
    { type: 'LOCATION', target_id: 'ORD-1005', description: 'Divergência de 800m no local de entrega', priority: 'Média', status: 'pendente' }
  ];

  for (const e of exceptions) {
    await supabase.from('delivery_exceptions').upsert(e, { onConflict: 'target_id' });
  }

  console.log('✅ Logistics data seeded.');
}

seedLogistics();
