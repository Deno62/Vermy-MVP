import { db, nowIso, genId } from '@/db/vermyDb';

export interface DokumenteListParams {
  immobilieId?: string;
  mieterId?: string;
  vertragId?: string;
}

export const dokumenteRepo = {
  async list(params?: DokumenteListParams) {
    let rows = await db.dokumente.orderBy('created_at').reverse().toArray();
    if (params?.immobilieId) rows = rows.filter(r => r.immobilie_id === params.immobilieId);
    if (params?.mieterId) rows = rows.filter(r => r.mieter_id === params.mieterId);
    if (params?.vertragId) rows = rows.filter(r => r.vertrag_id === params.vertragId);
    return rows;
  },
  async get(id: string) {
    return (await db.dokumente.get(id)) || null;
  },
  async create(data: any) {
    const row = { ...data, id: genId(), created_at: nowIso(), updated_at: nowIso() };
    await db.dokumente.add(row as any);
    return row;
  },
  async remove(id: string) {
    await db.dokumente.delete(id);
  },
};
