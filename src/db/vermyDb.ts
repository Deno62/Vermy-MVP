import Dexie, { Table } from 'dexie';
import type { Immobilie, Mieter, Finanzbuchung, Nebenkosten, WartungMaengel, Mahnwesen, Dokument, Vertrag } from '@/types/entities';

class VermyDatabase extends Dexie {
  immobilien!: Table<Immobilie, string>;
  mieter!: Table<Mieter, string>;
  finanzbuchungen!: Table<Finanzbuchung, string>;
  nebenkosten!: Table<Nebenkosten, string>;
  wartungMaengel!: Table<WartungMaengel, string>;
  mahnwesen!: Table<Mahnwesen, string>;
  dokumente!: Table<Dokument, string>;
  vertraege!: Table<Vertrag, string>;

  constructor() {
    super('vermy_db');
    this.version(1).stores({
      immobilien: 'id,bezeichnung,created_at,typ,parent_id',
      mieter: 'id,vorname,nachname,created_at,immobilien_id',
      finanzbuchungen: 'id,immobilie_id,mieter_id,created_at',
      nebenkosten: 'id,immobilie_id,jahr',
      wartungMaengel: 'id,immobilie_id,mieter_id',
      mahnwesen: 'id,immobilie_id,mieter_id,finanzbuchung_id',
      dokumente: 'id,immobilie_id,mieter_id,vertrag_id',
      vertraege: 'id,immobilie_id,mieter_id',
    });
  }
}

export const vermyDb = new VermyDatabase();

export const nowIso = () => new Date().toISOString();

export const genId = () => (
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 10)
);
