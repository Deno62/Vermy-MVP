import { supabase } from '@/integrations/supabase/client';
import type { Immobilie } from '@/types/entities';
import type { Repository, ListParams } from './baseRepository';

const SEARCH_FIELDS: (keyof Immobilie)[] = ['bezeichnung', 'adresse', 'ort', 'art', 'status'];

export const immobilienRepository: Repository<Immobilie> = {
  async list(params?: ListParams<Immobilie>) {
    let query = supabase.from('immobilien').select('*').is('deleted_at', null);

    // filters
    if (params?.filters) {
      for (const [k, v] of Object.entries(params.filters)) {
        if (v != null && v !== '') query = query.eq(k, v as any);
      }
    }

    // search
    const term = (params?.search || '').toString().trim();
    if (term) {
      const like = `%${term}%`;
      query = query.or(
        SEARCH_FIELDS.map((f) => `${String(f)}.ilike.${like}`).join(',')
      );
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      console.error('immobilien.list error', error);
      return [];
    }
    return (data as any[]) as Immobilie[];
  },

  async get(id: string) {
    const { data, error } = await supabase.from('immobilien').select('*').eq('id', id).maybeSingle();
    if (error) return null;
    return (data as any) as Immobilie | null;
  },

  async create(data) {
    const payload = { ...data } as any;
    const { data: rows, error } = await supabase.from('immobilien').insert(payload).select('*').single();
    if (error) throw error;
    return rows as any as Immobilie;
  },

  async update(id, data) {
    const payload = { ...data, updated_at: new Date().toISOString() } as any;
    const { data: rows, error } = await supabase.from('immobilien').update(payload).eq('id', id).select('*').single();
    if (error) throw error;
    return rows as any as Immobilie;
  },

  async remove(id) {
    // soft delete
    const { error } = await supabase.from('immobilien').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },
};
