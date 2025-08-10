// IndexedDB (Dexie) utilities for Vermy CRM - keeps same API as previous LocalStorage facade
import { BaseEntity } from '@/types/entities';
import { vermyDb } from '@/db/vermyDb';
import type { Table } from 'dexie';

export class LocalStorage { // keeping name for backwards compatibility
  private static generateUUID(): string {
    // Use crypto if available for better UUIDs
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return (crypto as any).randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private static getTable<T extends BaseEntity>(storageKey: string): Table<T, string, T> {
    switch (storageKey) {
      case STORAGE_KEYS.IMMOBILIEN: return vermyDb.immobilien as unknown as Table<T, string, T>;
      case STORAGE_KEYS.MIETER: return vermyDb.mieter as unknown as Table<T, string, T>;
      case STORAGE_KEYS.FINANZBUCHUNGEN: return vermyDb.finanzbuchungen as unknown as Table<T, string, T>;
      case STORAGE_KEYS.NEBENKOSTEN: return vermyDb.nebenkosten as unknown as Table<T, string, T>;
      case STORAGE_KEYS.WARTUNG_MAENGEL: return vermyDb.wartungMaengel as unknown as Table<T, string, T>;
      case STORAGE_KEYS.MAHNWESEN: return vermyDb.mahnwesen as unknown as Table<T, string, T>;
      case STORAGE_KEYS.DOKUMENTE: return vermyDb.dokumente as unknown as Table<T, string, T>;
      case STORAGE_KEYS.VERTRAEGE: return vermyDb.vertraege as unknown as Table<T, string, T>;
      default:
        throw new Error(`Unknown storage key: ${storageKey}`);
    }
  }

  static async save<T extends BaseEntity>(storageKey: string, entity: Partial<T>): Promise<T> {
    const table = this.getTable<T>(storageKey);
    const now = new Date();

    if (entity.id) {
      const existing = await table.get(entity.id as string);
      if (existing) {
        const updated = {
          ...existing,
          ...entity,
          updated_at: now,
          version: (existing.version || 0) + 1,
        } as T;
        await table.put(updated);
        return updated;
      }
    }

    const newEntity = {
      ...entity,
      id: this.generateUUID(),
      created_at: now,
      updated_at: now,
      version: 1,
    } as T;

    await table.add(newEntity);
    return newEntity;
  }

  static async getAll<T extends BaseEntity>(storageKey: string): Promise<T[]> {
    const table = this.getTable<T>(storageKey);
    const entities = await table.toArray();
    return entities.filter(e => !e.deleted_at);
  }

  static async getById<T extends BaseEntity>(storageKey: string, id: string): Promise<T | null> {
    const table = this.getTable<T>(storageKey);
    return (await table.get(id)) || null;
  }

  static async delete<T extends BaseEntity>(storageKey: string, id: string): Promise<boolean> {
    const table = this.getTable<T>(storageKey);
    const existing = await table.get(id);
    if (!existing) return false;

    const now = new Date();
    await table.put({
      ...existing,
      deleted_at: now,
      updated_at: now,
      version: (existing.version || 0) + 1,
    } as T);
    return true;
  }

  static async search<T extends BaseEntity>(
    storageKey: string,
    searchTerm: string,
    fields: (keyof T)[]
  ): Promise<T[]> {
    const all = await this.getAll<T>(storageKey);
    const term = (searchTerm || '').toString().toLowerCase();
    if (!term) return all;
    return all.filter((entity) =>
      fields.some((field) => {
        const value = (entity as any)[field];
        return value && value.toString().toLowerCase().includes(term);
      })
    );
  }
}

// Storage keys for each entity
export const STORAGE_KEYS = {
  IMMOBILIEN: 'vermy_immobilien',
  MIETER: 'vermy_mieter',
  FINANZBUCHUNGEN: 'vermy_finanzbuchungen',
  NEBENKOSTEN: 'vermy_nebenkosten',
  WARTUNG_MAENGEL: 'vermy_wartung_maengel',
  MAHNWESEN: 'vermy_mahnwesen',
  DOKUMENTE: 'vermy_dokumente',
  VERTRAEGE: 'vermy_vertraege',
} as const;
