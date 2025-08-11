import { vermyDb } from '@/db/vermyDb';
import type { Vertrag } from '@/types/entities';
import type { Repository, ListParams } from './baseRepository';
import { applySearchAndFilters, softDelete } from './baseRepository';

const SEARCH_FIELDS: (keyof Vertrag)[] = ['mietvertrags_id', 'status'];

export const vertragRepository: Repository<Vertrag> = {
  async list(params?: ListParams<Vertrag>) {
    const all = await vermyDb.vertraege.where('id').notEqual('').toArray();
    const active = all.filter((i) => !(i as any).deleted_at);
    return applySearchAndFilters(active, params, SEARCH_FIELDS);
  },
  async get(id: string) {
    return (await vermyDb.vertraege.get(id)) || null;
  },
  async create(data) {
    const now = new Date();
    const item: Vertrag = {
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
      version: 1,
      mietvertrags_id: `MV-${Math.random().toString().slice(2,6)}`,
      immobilie_id: '',
      mieter_id: '',
      mietbeginn: now,
      kaltmiete: 0,
      nebenkosten: 0,
      zahlungsintervall: 'monatlich',
      kuendigungsfrist: '3 Monate',
      status: 'aktiv',
      ...data,
    } as Vertrag;
    await vermyDb.vertraege.add(item);
    return item;
  },
  async update(id, data) {
    const existing = await vermyDb.vertraege.get(id);
    if (!existing) throw new Error('Nicht gefunden');
    const updated: Vertrag = { ...existing, ...data, updated_at: new Date(), version: (existing.version || 0) + 1 };
    await vermyDb.vertraege.put(updated);
    return updated;
  },
  async remove(id) {
    await softDelete(vermyDb.vertraege as any, id);
  },
};
