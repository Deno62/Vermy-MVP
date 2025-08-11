import { supabase } from '@/integrations/supabase/client';
import { handleGet, handleList, handleMutation, nowIso, softDelete, friendlyError } from './repoUtils';

export interface MieterListParams {
  search?: string;
  immobilienId?: string;
}

async function ensureHauptmieterUniqueness(params: { immobilien_id?: string | null; mieterIdToExclude?: string; hauptmieter?: boolean }) {
  const { immobilien_id, mieterIdToExclude, hauptmieter } = params;
  if (!hauptmieter || !immobilien_id) return; // Only enforce when setting to true and an immobilie is provided

  // Check if immobilie is a Wohnung; only then enforce the uniqueness
  const { data: immo } = await supabase
    .from('immobilien')
    .select('id, typ')
    .eq('id', immobilien_id)
    .maybeSingle();

  if (immo?.typ !== 'Wohnung') return;

  let query = supabase
    .from('mieter')
    .select('id')
    .eq('immobilien_id', immobilien_id)
    .eq('hauptmieter', true)
    .is('deleted_at', null)
    .limit(1);

  if (mieterIdToExclude) query = query.neq('id', mieterIdToExclude);

  const { data: existing, error } = await query;
  if (error) {
    console.error('mieter.ensureHauptmieterUniqueness error', error);
    // Fail closed to prevent duplicates
    throw new Error('Konnte Hauptmieter-Eindeutigkeit nicht prüfen. Bitte später erneut versuchen.');
  }
  if (Array.isArray(existing) && existing.length > 0) {
    throw new Error('Es existiert bereits ein Hauptmieter für diese Wohnung.');
  }
}

export const mieterRepo = {
  async list(params?: MieterListParams) {
    let query = supabase.from('mieter').select('*').is('deleted_at', null);

    if (params?.immobilienId) query = query.eq('immobilien_id', params.immobilienId);

    const term = (params?.search || '').toString().trim();
    if (term) {
      const like = `%${term}%`;
      query = query.or(
        ['vorname', 'nachname', 'email', 'telefon', 'status']
          .map((f) => `${f}.ilike.${like}`)
          .join(',')
      );
    }

    const res = await query.order('created_at', { ascending: false });
    return handleList<any>(res as any, 'mieter');
  },

  async get(id: string) {
    const res = await supabase.from('mieter').select('*').eq('id', id).maybeSingle();
    return handleGet<any>(res as any, 'mieter');
  },

  async create(data: any) {
    try {
      await ensureHauptmieterUniqueness({ immobilien_id: data?.immobilien_id, hauptmieter: data?.hauptmieter });
      const res = await supabase.from('mieter').insert(data as any).select('*').single();
      return handleMutation<any>(res as any, 'create', 'mieter');
    } catch (e) {
      console.error('mieter.create guard error', e);
      throw new Error(friendlyError('create', 'Mieter'));
    }
  },

  async update(id: string, data: any) {
    try {
      const targetImmoId = data?.immobilien_id;
      if (data?.hauptmieter === true) {
        let immoId = targetImmoId;
        if (!immoId) {
          const current = await supabase.from('mieter').select('immobilien_id').eq('id', id).maybeSingle();
          immoId = (current.data as any)?.immobilien_id;
        }
        await ensureHauptmieterUniqueness({ immobilien_id: immoId, mieterIdToExclude: id, hauptmieter: data?.hauptmieter });
      }

      const res = await supabase
        .from('mieter')
        .update({ ...data, updated_at: nowIso() } as any)
        .eq('id', id)
        .select('*')
        .single();
      return handleMutation<any>(res as any, 'update', 'mieter');
    } catch (e) {
      console.error('mieter.update guard error', e);
      throw new Error(friendlyError('update', 'Mieter'));
    }
  },

  async remove(id: string) {
    await softDelete('mieter', id);
  },
};
