import { supabase } from '@/integrations/supabase/client';
import { handleGet, handleList, handleMutation, nowIso, softDelete } from './repoUtils';

export interface ZahlungenListParams {
  vertragId?: string;
  mieterId?: string;
  status?: 'bezahlt' | 'offen' | 'überfällig';
  monat?: string; // e.g., '2025-08'
}

export const zahlungenRepo = {
  async list(params?: ZahlungenListParams) {
    let query = supabase.from('zahlungen').select('*').is('deleted_at', null as any);

    if (params?.vertragId) query = query.eq('vertrag_id', params.vertragId);
    if (params?.mieterId) query = query.eq('mieter_id', params.mieterId);
    if (params?.status) query = query.eq('status', params.status);
    if (params?.monat) query = query.eq('monat', params.monat);

    const res = await query.order('monat', { ascending: false });
    return handleList<any>(res as any, 'zahlungen');
  },

  async get(id: string) {
    const res = await supabase.from('zahlungen').select('*').eq('id', id).maybeSingle();
    return handleGet<any>(res as any, 'zahlungen');
  },

  async create(data: any) {
    const res = await supabase.from('zahlungen').insert(data as any).select('*').single();
    return handleMutation<any>(res as any, 'create', 'zahlungen');
  },

  async update(id: string, data: any) {
    const res = await supabase
      .from('zahlungen')
      .update({ ...data, updated_at: nowIso() } as any)
      .eq('id', id)
      .select('*')
      .single();
    return handleMutation<any>(res as any, 'update', 'zahlungen');
  },

  async remove(id: string) {
    await softDelete('zahlungen', id);
  },
};
