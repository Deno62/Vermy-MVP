import { supabase } from '@/integrations/supabase/client';
import type { Finanzbuchung } from '@/types/entities';
import type { Repository, ListParams } from './baseRepository';

const SEARCH_FIELDS: (keyof Finanzbuchung)[] = ['beschreibung', 'art', 'referenz', 'status'];

export const zahlungRepository: Repository<Finanzbuchung> = {
  async list(params?: ListParams<Finanzbuchung>) {
    let query = supabase.from('finanzbuchungen').select('*').is('deleted_at', null);

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

    const { data, error } = await query.order('datum', { ascending: false });
    if (error) {
      console.error('finanzbuchungen.list error', error);
      return [];
    }
    return (data as any[]) as Finanzbuchung[];
  },

  async get(id: string) {
    const { data, error } = await supabase.from('finanzbuchungen').select('*').eq('id', id).maybeSingle();
    if (error) return null;
    return data as any as Finanzbuchung;
  },

  async create(data) {
    const { data: row, error } = await supabase.from('finanzbuchungen').insert(data as any).select('*').single();
    if (error) throw error;
    return row as any as Finanzbuchung;
  },

  async update(id, data) {
    const { data: row, error } = await supabase.from('finanzbuchungen').update({ ...data, updated_at: new Date().toISOString() } as any).eq('id', id).select('*').single();
    if (error) throw error;
    return row as any as Finanzbuchung;
  },

  async remove(id) {
    const { error } = await supabase.from('finanzbuchungen').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },
};
