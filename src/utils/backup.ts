import { vermyDb } from '@/db/vermyDb';

export type BackupBundle = {
  meta: { app: 'vermy'; version: number; exportedAt: string };
  data: {
    immobilien: any[];
    mieter: any[];
    finanzbuchungen: any[];
    nebenkosten: any[];
    wartungMaengel: any[];
    mahnwesen: any[];
    dokumente: any[];
    vertraege: any[];
    versions: any[];
  };
};

export async function exportBackup(): Promise<BackupBundle> {
  const [immobilien, mieter, finanzbuchungen, nebenkosten, wartungMaengel, mahnwesen, dokumente, vertraege, versions] =
    await Promise.all([
      vermyDb.immobilien.toArray(),
      vermyDb.mieter.toArray(),
      vermyDb.finanzbuchungen.toArray(),
      vermyDb.nebenkosten.toArray(),
      vermyDb.wartungMaengel.toArray(),
      vermyDb.mahnwesen.toArray(),
      vermyDb.dokumente.toArray(),
      vermyDb.vertraege.toArray(),
      vermyDb.versions.toArray(),
    ]);

  return {
    meta: { app: 'vermy', version: 1, exportedAt: new Date().toISOString() },
    data: { immobilien, mieter, finanzbuchungen, nebenkosten, wartungMaengel, mahnwesen, dokumente, vertraege, versions },
  };
}

export async function importBackup(bundle: BackupBundle) {
  if (!bundle?.data) throw new Error('Ungültiges Backup');
  await vermyDb.transaction('rw', [
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
    await Promise.all([
      vermyDb.immobilien.clear(),
      vermyDb.mieter.clear(),
      vermyDb.finanzbuchungen.clear(),
      vermyDb.nebenkosten.clear(),
      vermyDb.wartungMaengel.clear(),
      vermyDb.mahnwesen.clear(),
      vermyDb.dokumente.clear(),
      vermyDb.vertraege.clear(),
      vermyDb.versions.clear(),
    ]);

    await Promise.all([
      vermyDb.immobilien.bulkAdd(bundle.data.immobilien || []),
      vermyDb.mieter.bulkAdd(bundle.data.mieter || []),
      vermyDb.finanzbuchungen.bulkAdd(bundle.data.finanzbuchungen || []),
      vermyDb.nebenkosten.bulkAdd(bundle.data.nebenkosten || []),
      vermyDb.wartungMaengel.bulkAdd(bundle.data.wartungMaengel || []),
      vermyDb.mahnwesen.bulkAdd(bundle.data.mahnwesen || []),
      vermyDb.dokumente.bulkAdd(bundle.data.dokumente || []),
      vermyDb.vertraege.bulkAdd(bundle.data.vertraege || []),
      vermyDb.versions.bulkAdd(bundle.data.versions || [{ id: 'schema', version: 1 }]),
    ]);
  });
}

export function downloadJSON(obj: any, filename: string) {
  const dataStr = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(obj, null, 2));
  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute('href', dataStr);
  dlAnchor.setAttribute('download', filename);
  dlAnchor.click();
}
