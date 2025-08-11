import { supabase } from '@/integrations/supabase/client';
import { handleGet, handleList, handleMutation, nowIso, softDelete } from './repoUtils';

export type ImmobilieTyp = 'Haus' | 'Wohnung';

export interface ImmobilienListParams {
  search?: string;
  typ?: ImmobilieTyp;
  parentId?: string | null;
}

export const immobilienRepo = {
  async list(params?: ImmobilienListParams) {
    let query = supabase.from('immobilien').select('*').is('deleted_at', null);

    if (params?.typ) query = query.eq('typ', params.typ);
    if (params?.parentId !== undefined) {
      if (params.parentId === null) query = query.is('parent_id', null);
      else query = query.eq('parent_id', params.parentId);
    }

    const term = (params?.search || '').toString().trim();
    if (term) {
      const like = `%${term}%`;
      query = query.or(
        ['bezeichnung', 'adresse', 'ort', 'art', 'status']
          .map((f) => `${f}.ilike.${like}`)
          .join(',')
      );
    }

    const res = await query.order('created_at', { ascending: false });
    return handleList<any>(res as any, 'immobilien');
  },

  async listHaeuser() {
    const res = await supabase
      .from('immobilien')
      .select('*')
      .eq('typ', 'Haus')
      .is('parent_id', null)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    return handleList<any>(res as any, 'immobilien');
  },

  async listWohnungenByHaus(houseId: string) {
    const res = await supabase
      .from('immobilien')
      .select('*')
      .eq('parent_id', houseId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    return handleList<any>(res as any, 'immobilien');
  },

  async get(id: string) {
    const res = await supabase.from('immobilien').select('*').eq('id', id).maybeSingle();
    return handleGet<any>(res as any, 'immobilien');
  },

  async create(data: any) {
    const payload = { ...data } as any;
    const res = await supabase.from('immobilien').insert(payload).select('*').single();
    return handleMutation<any>(res as any, 'create', 'immobilien');
  },

  async update(id: string, data: any) {
    const payload = { ...data, updated_at: nowIso() } as any;
    const res = await supabase.from('immobilien').update(payload).eq('id', id).select('*').single();
    return handleMutation<any>(res as any, 'update', 'immobilien');
  },

  async remove(id: string) {
    await softDelete('immobilien', id);
  },
};
