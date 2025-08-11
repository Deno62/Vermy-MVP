import { supabase } from '@/integrations/supabase/client';
import type { Dokument } from '@/types/entities';
import type { Repository, ListParams } from './baseRepository';

const SEARCH_FIELDS: (keyof Dokument)[] = ['titel', 'kategorie', 'dateiname'];

export const dokumentRepository: Repository<Dokument> = {
  async list(params?: ListParams<Dokument>) {
    let query = supabase.from('dokumente').select('*').is('deleted_at', null);

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
      console.error('dokumente.list error', error);
      return [];
    }
    return (data as any[]) as Dokument[];
  },

  async get(id: string) {
    const { data, error } = await supabase.from('dokumente').select('*').eq('id', id).maybeSingle();
    if (error) return null;
    return data as any as Dokument;
  },

  async create(data) {
    const { data: row, error } = await supabase.from('dokumente').insert(data as any).select('*').single();
    if (error) throw error;
    return row as any as Dokument;
  },

  async update(id, data) {
    const { data: row, error } = await supabase.from('dokumente').update({ ...data, updated_at: new Date().toISOString() } as any).eq('id', id).select('*').single();
    if (error) throw error;
    return row as any as Dokument;
  },

  async remove(id) {
    // hard delete for documents
    const { error } = await supabase.from('dokumente').delete().eq('id', id);
    if (error) throw error;
  },
};
