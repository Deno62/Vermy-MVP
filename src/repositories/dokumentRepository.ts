import { vermyDb } from '@/db/vermyDb';
import type { Dokument } from '@/types/entities';
import type { Repository, ListParams } from './baseRepository';
import { applySearchAndFilters } from './baseRepository';

const SEARCH_FIELDS: (keyof Dokument)[] = ['titel', 'kategorie', 'dateiname'];

export const dokumentRepository: Repository<Dokument> = {
  async list(params?: ListParams<Dokument>) {
    const all = await vermyDb.dokumente.where('id').notEqual('').toArray();
    const active = all.filter((i) => !(i as any).deleted_at);
    return applySearchAndFilters(active, params, SEARCH_FIELDS);
  },
  async get(id: string) {
    return (await vermyDb.dokumente.get(id)) || null;
  },
  async create(data) {
    const now = new Date();
    const size = (data as any).dateigröße || 0;
    const item: Dokument = {
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
      version: 1,
      titel: '',
      kategorie: 'Sonstiges',
      dateiname: 'datei',
      dateipfad: '',
      dateigröße: size,
      ...data,
    } as Dokument;
    await vermyDb.dokumente.add(item);
    return item;
  },
  async update(id, data) {
    const existing = await vermyDb.dokumente.get(id);
    if (!existing) throw new Error('Nicht gefunden');
    const updated: Dokument = { ...existing, ...data, updated_at: new Date(), version: (existing.version || 0) + 1 };
    await vermyDb.dokumente.put(updated);
    return updated;
  },
  async remove(id) {
    // hard delete is acceptable for documents in MVP
    await vermyDb.dokumente.delete(id);
  },
};
