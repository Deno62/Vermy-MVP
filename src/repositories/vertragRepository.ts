import { supabase } from '@/integrations/supabase/client';
import type { Vertrag } from '@/types/entities';
import type { Repository, ListParams } from './baseRepository';

const SEARCH_FIELDS: (keyof Vertrag)[] = ['mietvertrags_id', 'status'];

export const vertragRepository: Repository<Vertrag> = {
  async list(params?: ListParams<Vertrag>) {
    let query = supabase.from('vertraege').select('*').is('deleted_at', null);

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
      console.error('vertraege.list error', error);
      return [];
    }
    return (data as any[]) as Vertrag[];
  },

  async get(id: string) {
    const { data, error } = await supabase.from('vertraege').select('*').eq('id', id).maybeSingle();
    if (error) return null;
    return data as any as Vertrag;
  },

  async create(data) {
    const { data: row, error } = await supabase.from('vertraege').insert(data as any).select('*').single();
    if (error) throw error;
    return row as any as Vertrag;
  },

  async update(id, data) {
    const { data: row, error } = await supabase.from('vertraege').update({ ...data, updated_at: new Date().toISOString() } as any).eq('id', id).select('*').single();
    if (error) throw error;
    return row as any as Vertrag;
  },

  async remove(id) {
    const { error } = await supabase.from('vertraege').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },
};
