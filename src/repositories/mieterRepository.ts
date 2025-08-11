import { vermyDb } from '@/db/vermyDb';
import type { Mieter } from '@/types/entities';
import type { Repository, ListParams } from './baseRepository';
import { applySearchAndFilters, softDelete } from './baseRepository';

const SEARCH_FIELDS: (keyof Mieter)[] = ['vorname', 'nachname', 'email', 'telefon', 'status'];

export const mieterRepository: Repository<Mieter> = {
  async list(params?: ListParams<Mieter>) {
    const all = await vermyDb.mieter.where('id').notEqual('').toArray();
    const active = all.filter((i) => !(i as any).deleted_at);
    return applySearchAndFilters(active, params, SEARCH_FIELDS);
  },
  async get(id: string) {
    return (await vermyDb.mieter.get(id)) || null;
  },
  async create(data) {
    const now = new Date();
    const item: Mieter = {
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
      version: 1,
      anrede: 'Herr',
      vorname: '',
      nachname: '',
      email: '',
      telefon: '',
      status: 'Aktiv',
      ...data,
    } as Mieter;
    await vermyDb.mieter.add(item);
    return item;
  },
  async update(id, data) {
    const existing = await vermyDb.mieter.get(id);
    if (!existing) throw new Error('Nicht gefunden');
    const updated: Mieter = { ...existing, ...data, updated_at: new Date(), version: (existing.version || 0) + 1 };
    await vermyDb.mieter.put(updated);
    return updated;
  },
  async remove(id) {
    await softDelete(vermyDb.mieter as any, id);
  },
};
