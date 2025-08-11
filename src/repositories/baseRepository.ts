import { Table } from 'dexie';

export interface ListParams<T> {
  search?: string;
  filters?: Partial<Record<keyof T, any>>;
}

export interface Repository<T extends { id: string }> {
  list(params?: ListParams<T>): Promise<T[]>;
  get(id: string): Promise<T | null>;
  create(data: Omit<T, 'id' | 'created_at' | 'updated_at' | 'version'>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  remove(id: string): Promise<void>;
}

export function applySearchAndFilters<T>(items: T[], params?: ListParams<T>, searchFields: (keyof T)[] = []): T[] {
  const term = (params?.search || '').toString().toLowerCase();
  const filtered = items.filter((it) => {
    // filters
    const matchesFilters = params?.filters
      ? Object.entries(params.filters).every(([k, v]) => (v == null || v === '') ? true : (it as any)[k] === v)
      : true;
    if (!matchesFilters) return false;

    // search
    if (!term) return true;
    return searchFields.some((f) => {
      const val = (it as any)[f];
      return val != null && val.toString().toLowerCase().includes(term);
    });
  });
  return filtered;
}

export async function softDelete<T extends { id: string } & { deleted_at?: Date; updated_at?: Date; version?: number }>(
  table: Table<T, string>,
  id: string
) {
  const existing = await table.get(id);
  if (!existing) return;
  await table.put({
    ...existing,
    deleted_at: new Date(),
    updated_at: new Date(),
    version: (existing.version || 0) + 1,
  } as T);
}
