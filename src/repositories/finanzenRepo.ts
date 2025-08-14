import { db, nowIso, genId, ZahlungStatus } from '@/db/vermyDb';

export interface FinanzenListParams {
  immobilienId?: string;
  mieterId?: string;
  vertragId?: string;
  status?: ZahlungStatus;
}

export const finanzenRepo = {
  async list(params?: FinanzenListParams) {
    let rows = await db.finanzbuchungen.orderBy('datum').reverse().toArray();
    if (params?.immobilienId) rows = rows.filter(r => r.immobilie_id === params.immobilienId);
    if (params?.mieterId) rows = rows.filter(r => r.mieter_id === params.mieterId);
    if (params?.vertragId) rows = rows.filter(r => r.vertrag_id === params.vertragId);
    if (params?.status) rows = rows.filter(r => r.status === params.status);
    return rows;
  },
  async get(id: string) {
    return (await db.finanzbuchungen.get(id)) || null;
  },
  async create(data: any) {
    const row = { ...data, id: genId(), created_at: nowIso(), updated_at: nowIso() };
    await db.finanzbuchungen.add(row as any);
    return row;
  },
  async update(id: string, data: any) {
    const prev = await db.finanzbuchungen.get(id);
    if (!prev) throw new Error('Finanzbuchung nicht gefunden');
    const row = { ...prev, ...data, updated_at: nowIso() };
    await db.finanzbuchungen.put(row as any);
    return row;
  },
  async remove(id: string) {
    await db.finanzbuchungen.delete(id);
  },
};
