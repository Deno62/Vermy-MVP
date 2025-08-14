import { db as vermyDb } from '@/db/vermyDb';
import type { Vertrag } from '@/types/entities';

export interface VertraegeListParams {
  search?: string;
  status?: string;
}

// Mapper zwischen API-Feldern und DB-Feldern (lokal)
function toDbPayload(input: any) {
  const { beginn, ende, ...rest } = input || {};
  return {
    ...rest,
    mietbeginn: beginn ?? input?.mietbeginn,
    mietende: ende ?? input?.mietende,
  } as Partial<Vertrag> & Record<string, any>;
}

export const vertraegeRepo = {
  async list(params?: VertraegeListParams) {
    let coll = vermyDb.vertraege
      .toCollection()
      .filter((v: any) => !v.deleted_at);

    if (params?.status) {
      coll = coll.filter((v: any) => v.status === params.status);
    }

    const term = (params?.search || '').toString().trim().toLowerCase();
    if (term) {
      coll = coll.filter((v: any) =>
        (v.mietvertrags_id ?? '').toLowerCase().includes(term)
      );
    }

    return coll.reverse().toArray();
  },

  async get(id: string) {
    const v = await vermyDb.vertraege.get(id);
    if (!v || (v as any).deleted_at) return null;
    return v;
  },

  async create(data: any) {
    try {
      const payload = toDbPayload(data);
      const rec: Vertrag = {
        id: crypto.randomUUID(),
        version: 1,
        created_at: new Date(),
        updated_at: new Date(),
        mietvertrags_id: payload.mietvertrags_id ?? '',
        mietbeginn: payload.mietbeginn,
        mietende: payload.mietende,
        status: payload.status ?? 'aktiv',
        // beliebige weitere Felder aus payload
        ...(payload as any),
      } as any;

      await vermyDb.vertraege.add(rec);
      return rec;
    } catch (e) {
      console.error('vertraege.create error', e);
      throw new Error('Vertrag konnte nicht angelegt werden.');
    }
  },

  async update(id: string, data: any) {
    try {
      const current = await vermyDb.vertraege.get(id);
      if (!current) throw new Error('Nicht gefunden');

      const payload = toDbPayload(data);
      const merged: any = {
        ...current,
        ...payload,
        updated_at: new Date(),
      };

      await vermyDb.vertraege.put(merged);
      return merged;
    } catch (e) {
      console.error('vertraege.update error', e);
      throw new Error('Vertrag konnte nicht aktualisiert werden.');
    }
  },

  async remove(id: string) {
      const cur: any = await vermyDb.vertraege.get(id);
      if (!cur) return;
      const count = await vermyDb.finanzbuchungen.where('vertrag_id').equals(id).count();
      if (count > 0) throw new Error('Vertrag ist mit Zahlungen verknüpft und kann nicht gelöscht werden.');
      cur.deleted_at = new Date().toISOString();
      await vermyDb.vertraege.put(cur);
    },
  };
