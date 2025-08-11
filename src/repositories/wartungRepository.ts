import { supabase } from '@/integrations/supabase/client';
import type { WartungMaengel } from '@/types/entities';
import type { Repository, ListParams } from './baseRepository';

const SEARCH_FIELDS: (keyof WartungMaengel)[] = ['titel', 'beschreibung', 'kategorie', 'status'];

export const wartungRepository: Repository<WartungMaengel> = {
  async list(params?: ListParams<WartungMaengel>) {
    let query = supabase.from('wartung_maengel').select('*').is('deleted_at', null);

    if (params?.filters) {
      for (const [k, v] of Object.entries(params.filters)) {
        if (v != null && v !== '') query = query.eq(k, v as any);
      }
    }

    const term = (params?.search || '').toString().trim();
    if (term) {
      const like = `%${term}%`;
      query = query.or(SEARCH_FIELDS.map((f) => `${String(f)}.ilike.${like}`).join(','));
    }

    const { data, error } = await query.order('updated_at', { ascending: false });
    if (error) {
      console.error('wartung.list error', error);
      return [];
    }
    return (data as any[]) as WartungMaengel[];
  },

  async get(id: string) {
    const { data, error } = await supabase.from('wartung_maengel').select('*').eq('id', id).maybeSingle();
    if (error) return null;
    return data as any as WartungMaengel;
  },

  async create(data) {
    const { data: row, error } = await supabase.from('wartung_maengel').insert(data as any).select('*').single();
    if (error) throw error;
    return row as any as WartungMaengel;
  },

  async update(id, data) {
    const { data: row, error } = await supabase.from('wartung_maengel').update({ ...data, updated_at: new Date().toISOString() } as any).eq('id', id).select('*').single();
    if (error) throw error;
    return row as any as WartungMaengel;
  },

  async remove(id) {
    const { error } = await supabase.from('wartung_maengel').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },
};
