import { vermyDb } from '@/db/vermyDb';
import type { WartungMaengel } from '@/types/entities';
import type { Repository, ListParams } from './baseRepository';
import { applySearchAndFilters, softDelete } from './baseRepository';

const SEARCH_FIELDS: (keyof WartungMaengel)[] = ['titel', 'beschreibung', 'kategorie', 'status'];

export const wartungRepository: Repository<WartungMaengel> = {
  async list(params?: ListParams<WartungMaengel>) {
    const all = await vermyDb.wartungMaengel.where('id').notEqual('').toArray();
    const active = all.filter((i) => !(i as any).deleted_at);
    return applySearchAndFilters(active, params, SEARCH_FIELDS);
  },
  async get(id: string) {
    return (await vermyDb.wartungMaengel.get(id)) || null;
  },
  async create(data) {
    const now = new Date();
    const item: WartungMaengel = {
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
      version: 1,
      immobilie_id: '',
      titel: '',
      beschreibung: '',
      kategorie: 'Wartung',
      prioritaet: 'Normal',
      status: 'Gemeldet',
      ...data,
    } as WartungMaengel;
    await vermyDb.wartungMaengel.add(item);
    return item;
  },
  async update(id, data) {
    const existing = await vermyDb.wartungMaengel.get(id);
    if (!existing) throw new Error('Nicht gefunden');
    const updated: WartungMaengel = { ...existing, ...data, updated_at: new Date(), version: (existing.version || 0) + 1 };
    await vermyDb.wartungMaengel.put(updated);
    return updated;
  },
  async remove(id) {
    await softDelete(vermyDb.wartungMaengel as any, id);
  },
};
