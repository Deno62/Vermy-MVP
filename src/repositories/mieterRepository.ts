import { supabase } from '@/integrations/supabase/client';
import type { Mieter } from '@/types/entities';
import type { Repository, ListParams } from './baseRepository';

const SEARCH_FIELDS: (keyof Mieter)[] = ['vorname', 'nachname', 'email', 'telefon', 'status'];

export const mieterRepository: Repository<Mieter> = {
  async list(params?: ListParams<Mieter>) {
    let query = supabase.from('mieter').select('*').is('deleted_at', null);

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

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      console.error('mieter.list error', error);
      return [];
    }
    return (data as any[]) as Mieter[];
  },

  async get(id: string) {
    const { data, error } = await supabase.from('mieter').select('*').eq('id', id).maybeSingle();
    if (error) return null;
    return data as any as Mieter;
  },

  async create(data) {
    const { data: row, error } = await supabase.from('mieter').insert(data as any).select('*').single();
    if (error) throw error;
    return row as any as Mieter;
  },

  async update(id, data) {
    const { data: row, error } = await supabase.from('mieter').update({ ...data, updated_at: new Date().toISOString() } as any).eq('id', id).select('*').single();
    if (error) throw error;
    return row as any as Mieter;
  },

  async remove(id) {
    const { error } = await supabase.from('mieter').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },
};
