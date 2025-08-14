// src/repositories/immobilienRepo.ts
import { db, nowIso, genId } from '@/db/vermyDb';

export type ImmobilieTyp = 'Haus' | 'Wohnung';

export interface ImmobilienListParams {
  q?: string;
  typ?: ImmobilieTyp;
  parentId?: string | null;
  status?: string;
}

const normalize = (r: any) => ({
  id: r.id,
  bezeichnung: r.bezeichnung ?? '',
  adresse: r.adresse ?? '',
  ort: r.ort ?? '',
  plz: r.plz ?? '',
  typ: (r.typ ?? 'Wohnung') as ImmobilieTyp,
  zimmer: Number(r.zimmer ?? 0),
  flaeche_qm: Number(r.flaeche_qm ?? 0),
  kaltmiete: Number(r.kaltmiete ?? 0),
  status: r.status ?? 'frei',
  parent_id: r.parent_id ?? null,
  notizen: r.notizen ?? '',
  created_at: r.created_at ?? nowIso(),
  updated_at: r.updated_at ?? nowIso(),
});

export const immobilienRepo = {
  async list(params?: ImmobilienListParams) {
      let rows = await db.immobilien.orderBy('created_at').reverse().toArray();

      if (params?.typ) rows = rows.filter(r => r.typ === params.typ);
      if (params?.parentId !== undefined) {
        rows = rows.filter(r =>
          params.parentId === null ? r.parent_id == null : r.parent_id === params.parentId
        );
      }
      if (params?.status) rows = rows.filter(r => r.status === params.status);
      const term = (params?.q ?? '').trim().toLowerCase();
      if (term) {
        rows = rows.filter(r =>
          [r.bezeichnung, r.notizen, r.status]
            .filter(Boolean)
            .some(v => String(v).toLowerCase().includes(term))
        );
      }
      return rows;
  },

  async listHaeuser() {
      return db.immobilien.where({ typ: 'Haus', parent_id: null }).reverse().sortBy('created_at');
  },

  async listWohnungenByHaus(houseId: string) {
      return db.immobilien.where('parent_id').equals(houseId).reverse().sortBy('created_at');
  },

  async get(id: string) {
      const row = await db.immobilien.get(id);
    if (!row) throw new Error('Immobilie nicht gefunden');
    return row;
  },

  async create(data: any) {
    const row = normalize({ ...data, id: genId(), created_at: nowIso(), updated_at: nowIso() });
    if (row.typ === 'Haus') row.parent_id = null;
      await db.immobilien.add(row);
    return row;
  },

  async update(id: string, data: any) {
      const prev = await db.immobilien.get(id);
    if (!prev) throw new Error('Immobilie nicht gefunden');
    const next = normalize({ ...prev, ...data, updated_at: nowIso() });
      await db.immobilien.put(next);
    return next;
  },

  async remove(id: string) {
      const row = await db.immobilien.get(id);
      if (!row) return;
      if (row.typ === 'Haus') {
        const count = await db.immobilien.where('parent_id').equals(id).count();
        if (count > 0) throw new Error('Haus kann nicht gelöscht werden, solange Wohnungen existieren.');
      }
      if (row.typ === 'Wohnung') {
        const count = await db.mieter.where('immobilie_id').equals(id).count();
        if (count > 0) throw new Error('Wohnung kann nicht gelöscht werden, solange Mieter existieren.');
      }
      await db.immobilien.delete(id);
    },
  };
