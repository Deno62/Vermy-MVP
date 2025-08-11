import { supabase } from '@/integrations/supabase/client';
import { handleGet, handleList, handleMutation, nowIso, softDelete } from './repoUtils';

export interface VertraegeListParams {
  search?: string;
  status?: string;
}

// Mapper between public API and DB columns
function toDbPayload(input: any) {
  const { beginn, ende, ...rest } = input || {};
  return {
    ...rest,
    mietbeginn: beginn ?? input?.mietbeginn,
    mietende: ende ?? input?.mietende,
  } as any;
}

export const vertraegeRepo = {
  async list(params?: VertraegeListParams) {
    let query = supabase.from('vertraege').select('*').is('deleted_at', null);

    if (params?.status) query = query.eq('status', params.status);

    const term = (params?.search || '').toString().trim();
    if (term) {
      const like = `%${term}%`;
      query = query.or(['mietvertrags_id.ilike.' + like].join(','));
    }

    const res = await query.order('created_at', { ascending: false });
    return handleList<any>(res as any, 'vertraege');
  },

  async get(id: string) {
    const res = await supabase.from('vertraege').select('*').eq('id', id).maybeSingle();
    return handleGet<any>(res as any, 'vertraege');
  },

  async create(data: any) {
    const payload = toDbPayload(data);
    const res = await supabase.from('vertraege').insert(payload as any).select('*').single();
    return handleMutation<any>(res as any, 'create', 'vertraege');
  },

  async update(id: string, data: any) {
    const payload = toDbPayload({ ...data, updated_at: nowIso() });
    const res = await supabase.from('vertraege').update(payload as any).eq('id', id).select('*').single();
    return handleMutation<any>(res as any, 'update', 'vertraege');
  },

  async remove(id: string) {
    await softDelete('vertraege', id);
  },
};
