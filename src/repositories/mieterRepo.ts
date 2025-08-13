// src/repositories/mieterRepo.ts
import { vermyDb, nowIso, genId } from '@/db/vermyDb';

export interface MieterListParams {
  search?: string;
  immobilienId?: string;
}

const normalize = (r: any) => ({
  id: r.id,
  vorname: r.vorname ?? '',
  nachname: r.nachname ?? '',
  email: r.email ?? '',
  telefon: r.telefon ?? '',
  immobilien_id: r.immobilien_id ?? null,
  hauptmieter: !!r.hauptmieter,
  status: r.status ?? 'aktiv',
  created_at: r.created_at ?? nowIso(),
  updated_at: r.updated_at ?? nowIso(),
});

export async function ensureHauptmieterUniqueness(immobilien_id?: string | null, excludeId?: string) {
  if (!immobilien_id) return;
  const mieter = await vermyDb.mieter.where('immobilien_id').equals(immobilien_id).toArray();
  const existing = mieter.find(m => m.hauptmieter && m.id !== excludeId);
  if (existing) throw new Error('Es existiert bereits ein Hauptmieter für diese Wohnung.');
}

export const mieterRepo = {
  async list(params?: MieterListParams) {
    let rows = await vermyDb.mieter.orderBy('created_at').reverse().toArray();

    if (params?.immobilienId) rows = rows.filter(r => r.immobilien_id === params.immobilienId);

    const term = (params?.search ?? '').trim().toLowerCase();
    if (term) {
      rows = rows.filter(r =>
        [r.vorname, r.nachname, r.email, r.status]
          .filter(Boolean)
          .some(v => String(v).toLowerCase().includes(term))
      );
    }
    return rows;
  },

  async get(id: string) {
    const row = await vermyDb.mieter.get(id);
    if (!row) throw new Error('Mieter nicht gefunden');
    return row;
  },

  async create(data: any) {
    const row = normalize({ ...data, id: genId(), created_at: nowIso(), updated_at: nowIso() });
    if (row.hauptmieter) await ensureHauptmieterUniqueness(row.immobilien_id);
    await vermyDb.mieter.add(row);
    return row;
  },

  async update(id: string, data: any) {
    const prev = await vermyDb.mieter.get(id);
    if (!prev) throw new Error('Mieter nicht gefunden');
    const next = normalize({ ...prev, ...data, updated_at: nowIso() });
    if (next.hauptmieter) await ensureHauptmieterUniqueness(next.immobilien_id, id);
    await vermyDb.mieter.put(next);
    return next;
  },

  async remove(id: string) {
    await vermyDb.mieter.delete(id);
  },
};
