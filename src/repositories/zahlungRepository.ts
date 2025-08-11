import { vermyDb } from '@/db/vermyDb';
import type { Finanzbuchung } from '@/types/entities';
import type { Repository, ListParams } from './baseRepository';
import { applySearchAndFilters, softDelete } from './baseRepository';

const SEARCH_FIELDS: (keyof Finanzbuchung)[] = ['beschreibung', 'art', 'referenz', 'status'];

export const zahlungRepository: Repository<Finanzbuchung> = {
  async list(params?: ListParams<Finanzbuchung>) {
    const all = await vermyDb.finanzbuchungen.where('id').notEqual('').toArray();
    const active = all.filter((i) => !(i as any).deleted_at);
    return applySearchAndFilters(active, params, SEARCH_FIELDS);
  },
  async get(id: string) {
    return (await vermyDb.finanzbuchungen.get(id)) || null;
  },
  async create(data) {
    const now = new Date();
    const item: Finanzbuchung = {
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
      version: 1,
      immobilie_id: '',
      art: 'Miete',
      kategorie: 'Einnahme',
      betrag: 0,
      datum: now,
      beschreibung: '',
      status: 'Offen',
      ...data,
    } as Finanzbuchung;
    await vermyDb.finanzbuchungen.add(item);
    return item;
  },
  async update(id, data) {
    const existing = await vermyDb.finanzbuchungen.get(id);
    if (!existing) throw new Error('Nicht gefunden');
    const updated: Finanzbuchung = { ...existing, ...data, updated_at: new Date(), version: (existing.version || 0) + 1 };
    await vermyDb.finanzbuchungen.put(updated);
    return updated;
  },
  async remove(id) {
    await softDelete(vermyDb.finanzbuchungen as any, id);
  },
};
