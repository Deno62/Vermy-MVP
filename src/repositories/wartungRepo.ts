import { supabase } from '@/integrations/supabase/client';
import { handleGet, handleList, handleMutation, nowIso, softDelete } from './repoUtils';

export interface WartungListParams {
  immobilienId?: string;
  status?: string;
  prioritaet?: string;
}

export const wartungRepo = {
  async list(params?: WartungListParams) {
    let query = supabase.from('wartung_maengel').select('*').is('deleted_at', null);

    if (params?.immobilienId) query = query.eq('immobilie_id', params.immobilienId);
    if (params?.status) query = query.eq('status', params.status);
    if (params?.prioritaet) query = query.eq('prioritaet', params.prioritaet);

    const res = await query.order('updated_at', { ascending: false });
    return handleList<any>(res as any, 'wartung_maengel');
  },

  async get(id: string) {
    const res = await supabase.from('wartung_maengel').select('*').eq('id', id).maybeSingle();
    return handleGet<any>(res as any, 'wartung_maengel');
  },

  async create(data: any) {
    const res = await supabase.from('wartung_maengel').insert(data as any).select('*').single();
    return handleMutation<any>(res as any, 'create', 'wartung_maengel');
  },

  async update(id: string, data: any) {
    const res = await supabase
      .from('wartung_maengel')
      .update({ ...data, updated_at: nowIso() } as any)
      .eq('id', id)
      .select('*')
      .single();
    return handleMutation<any>(res as any, 'update', 'wartung_maengel');
  },

  async remove(id: string) {
    await softDelete('wartung_maengel', id);
  },
};
