// Local storage utilities for Vermy CRM
import { BaseEntity } from '@/types/entities';

export class LocalStorage {
  private static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  static save<T extends BaseEntity>(storageKey: string, entity: Partial<T>): T {
    const entities = this.getAll<T>(storageKey);
    const now = new Date();
    
    if (entity.id) {
      // Update existing entity
      const index = entities.findIndex(e => e.id === entity.id);
      if (index >= 0) {
        const updated = {
          ...entities[index],
          ...entity,
          updated_at: now,
          version: entities[index].version + 1
        } as T;
        entities[index] = updated;
        localStorage.setItem(storageKey, JSON.stringify(entities));
        return updated;
      }
    }
    
    // Create new entity
    const newEntity = {
      ...entity,
      id: this.generateUUID(),
      created_at: now,
      updated_at: now,
      version: 1
    } as T;
    
    entities.push(newEntity);
    localStorage.setItem(storageKey, JSON.stringify(entities));
    return newEntity;
  }

  static getAll<T extends BaseEntity>(storageKey: string): T[] {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return [];
    
    try {
      const entities = JSON.parse(stored) as T[];
      return entities
        .filter(e => !e.deleted_at)
        .map(e => ({
          ...e,
          created_at: new Date(e.created_at),
          updated_at: new Date(e.updated_at),
          deleted_at: e.deleted_at ? new Date(e.deleted_at) : undefined
        }));
    } catch {
      return [];
    }
  }

  static getById<T extends BaseEntity>(storageKey: string, id: string): T | null {
    const entities = this.getAll<T>(storageKey);
    return entities.find(e => e.id === id) || null;
  }

  static delete<T extends BaseEntity>(storageKey: string, id: string): boolean {
    const entities = JSON.parse(localStorage.getItem(storageKey) || '[]') as T[];
    const index = entities.findIndex(e => e.id === id);
    
    if (index >= 0) {
      entities[index] = {
        ...entities[index],
        deleted_at: new Date(),
        updated_at: new Date(),
        version: entities[index].version + 1
      };
      localStorage.setItem(storageKey, JSON.stringify(entities));
      return true;
    }
    
    return false;
  }

  static search<T extends BaseEntity>(
    storageKey: string, 
    searchTerm: string, 
    fields: (keyof T)[]
  ): T[] {
    const entities = this.getAll<T>(storageKey);
    const term = searchTerm.toLowerCase();
    
    return entities.filter(entity => 
      fields.some(field => {
        const value = entity[field];
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
  DOKUMENTE: 'vermy_dokumente'
} as const;