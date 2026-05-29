import { supabase } from '@/lib/supabase';

export async function uploadProductImage(companyId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${companyId}/products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('logstoka').upload(path, file, { upsert: false });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from('logstoka').getPublicUrl(path);
  return data.publicUrl;
}
