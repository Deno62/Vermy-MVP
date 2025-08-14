import { db, nowIso, genId } from '@/db/vermyDb';

export interface NebenkostenListParams {
  immobilienId?: string;
  status?: string;
  jahr?: number;
}

export const nebenkostenRepo = {
  async list(params?: NebenkostenListParams) {
    let rows = await db.nebenkosten.orderBy('jahr').reverse().toArray();
    if (params?.immobilienId) rows = rows.filter(r => r.immobilie_id === params.immobilienId);
    if (params?.status) rows = rows.filter(r => r.status === params.status);
    if (params?.jahr) rows = rows.filter(r => r.jahr === params.jahr);
    return rows;
  },
  async get(id: string) {
    return (await db.nebenkosten.get(id)) || null;
  },
  async create(data: any) {
    const row = { ...data, id: genId(), created_at: nowIso(), updated_at: nowIso() };
    await db.nebenkosten.add(row as any);
    return row;
  },
  async update(id: string, data: any) {
    const prev = await db.nebenkosten.get(id);
    if (!prev) throw new Error('Nebenkosten nicht gefunden');
    const row = { ...prev, ...data, updated_at: nowIso() };
    await db.nebenkosten.put(row as any);
    return row;
  },
  async remove(id: string) {
    await db.nebenkosten.delete(id);
  },
};
