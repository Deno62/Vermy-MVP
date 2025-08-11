import Dexie, { Table } from 'dexie';
import type { 
  Immobilie,
  Mieter,
  Finanzbuchung,
  Nebenkosten,
  WartungMaengel,
  Mahnwesen,
  Dokument,
  Vertrag,
} from '@/types/entities';
import { generateMockData } from '@/utils/mockData';

export class VermyDB extends Dexie {
  immobilien!: Table<Immobilie, string, Immobilie>;
  mieter!: Table<Mieter, string, Mieter>;
  finanzbuchungen!: Table<Finanzbuchung, string, Finanzbuchung>;
  nebenkosten!: Table<Nebenkosten, string, Nebenkosten>;
  wartungMaengel!: Table<WartungMaengel, string, WartungMaengel>;
  mahnwesen!: Table<Mahnwesen, string, Mahnwesen>;
  dokumente!: Table<Dokument, string, Dokument>;
  vertraege!: Table<Vertrag, string, Vertrag>;
  versions!: Table<{ id: string; version: number }, string>;

  constructor() {
    super('vermyDB');

    this.version(1).stores({
      immobilien: 'id, ort, plz, art, status',
      mieter: 'id, nachname, email, immobilie_id, status',
      finanzbuchungen: 'id, immobilie_id, mieter_id, kategorie, status, datum',
      nebenkosten: 'id, immobilie_id, jahr, status',
      wartungMaengel: 'id, immobilie_id, mieter_id, status, prioritaet, beauftragt_am',
      mahnwesen: 'id, immobilie_id, mieter_id, finanzbuchung_id, status, mahnstufe',
      dokumente: 'id, immobilie_id, mieter_id, kategorie, created_at',
      vertraege: 'id, immobilie_id, mieter_id, status, mietbeginn, mietende',
      versions: 'id'
    });
  }
}

export const vermyDb = new VermyDB();

export async function seedIfEmpty() {
  // Only seed if there are no properties yet
  const count = await vermyDb.immobilien.count();
  if (count > 0) return;

  const data = generateMockData();

  await vermyDb.transaction('rw', 
    [
      vermyDb.immobilien,
      vermyDb.mieter,
      vermyDb.finanzbuchungen,
      vermyDb.nebenkosten,
      vermyDb.wartungMaengel,
      vermyDb.mahnwesen,
      vermyDb.dokumente,
      vermyDb.vertraege,
      vermyDb.versions,
    ], async () => {
      await vermyDb.immobilien.bulkAdd(data.immobilien);
      await vermyDb.mieter.bulkAdd(data.mieter);
      await vermyDb.finanzbuchungen.bulkAdd(data.finanzbuchungen);
      await vermyDb.nebenkosten.bulkAdd(data.nebenkosten);
      await vermyDb.wartungMaengel.bulkAdd(data.wartungMaengel);
      await vermyDb.mahnwesen.bulkAdd(data.mahnwesen);
      await vermyDb.dokumente.bulkAdd(data.dokumente);
      // Verträge: Minimal aus aktiven Mietern ableiten
      const vertraege: Vertrag[] = data.mieter
        .filter(m => m.immobilie_id)
        .slice(0, 8)
        .map((m, idx) => ({
          id: crypto.randomUUID(),
          created_at: new Date(),
          updated_at: new Date(),
          version: 1,
          immobilie_id: m.immobilie_id!,
          mieter_id: m.id,
          mietbeginn: new Date(new Date().getFullYear(), Math.max(0, new Date().getMonth()-idx%6), 1),
          mietende: (idx % 4 === 1)
            ? new Date(new Date().getFullYear(), new Date().getMonth() + 1, 15)
            : undefined,
          kaltmiete: 850 + (idx * 25),
          nebenkosten: 180,
          zahlungsintervall: 'monatlich',
          kuendigungsfrist: '3 Monate',
          status: 'aktiv',
          mietvertrags_id: `MV-${String(idx+1).padStart(4,'0')}`
        }));
      await vermyDb.vertraege.bulkAdd(vertraege);
      await vermyDb.versions.put({ id: 'schema', version: 1 });
    }
  );
}
