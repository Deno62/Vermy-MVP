import { vermyDb } from '@/db/vermyDb';
import type { Immobilie } from '@/types/entities';
import type { Repository, ListParams } from './baseRepository';
import { applySearchAndFilters, softDelete } from './baseRepository';

const SEARCH_FIELDS: (keyof Immobilie)[] = ['bezeichnung', 'adresse', 'ort', 'plz', 'art', 'status'];

export const immobilienRepository: Repository<Immobilie> = {
  async list(params?: ListParams<Immobilie>) {
    const all = await vermyDb.immobilien.where('id').notEqual('').toArray();
    const active = all.filter((i) => !(i as any).deleted_at);
    return applySearchAndFilters(active, params, SEARCH_FIELDS);
  },
  async get(id: string) {
    return (await vermyDb.immobilien.get(id)) || null;
  },
  async create(data) {
    const now = new Date();
    const item: Immobilie = {
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
      version: 1,
      bezeichnung: '',
      adresse: '',
      plz: '',
      ort: '',
      art: 'Wohnung',
      zimmer: 1,
      flaeche: 0,
      status: 'Verfügbar',
      ...data,
    } as Immobilie;
    await vermyDb.immobilien.add(item);
    return item;
  },
  async update(id, data) {
    const existing = await vermyDb.immobilien.get(id);
    if (!existing) throw new Error('Nicht gefunden');
    const updated: Immobilie = { ...existing, ...data, updated_at: new Date(), version: (existing.version || 0) + 1 };
    await vermyDb.immobilien.put(updated);
    return updated;
  },
  async remove(id) {
    await softDelete(vermyDb.immobilien as any, id);
  },
};
