import { supabase } from '@/integrations/supabase/client';
import { handleGet, handleList, handleMutation } from './repoUtils';

export interface DokumenteListParams {
  bezug_typ?: 'immobilie' | 'mieter' | 'vertrag';
  bezug_id?: string;
}

export interface DokumentCreateInput {
  name: string;
  mime_type: string;
  data_base64: string;
  bezug_typ: 'immobilie' | 'mieter' | 'vertrag';
  bezug_id: string;
}

export const dokumenteRepo = {
  async list(params?: DokumenteListParams) {
    let query = supabase.from('dokumente').select('*');

    if (params?.bezug_typ) query = query.eq('bezug_typ', params.bezug_typ);
    if (params?.bezug_id) query = query.eq('bezug_id', params.bezug_id);

    const res = await query.order('erstellt_am', { ascending: false });
    return handleList<any>(res as any, 'dokumente');
  },

  async get(id: string) {
    const res = await supabase.from('dokumente').select('*').eq('id', id).maybeSingle();
    return handleGet<any>(res as any, 'dokumente');
  },

  async create(data: DokumentCreateInput) {
    const res = await supabase.from('dokumente').insert(data as any).select('*').single();
    return handleMutation<any>(res as any, 'create', 'dokumente');
  },

  async remove(id: string) {
    const res = await supabase.from('dokumente').delete().eq('id', id);
    handleMutation<any>(res as any, 'remove', 'dokumente');
  },
};
