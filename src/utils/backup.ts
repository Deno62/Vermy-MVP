import { supabase } from '@/integrations/supabase/client';

export type BackupBundle = {
  meta: { app: 'vermy'; version: number; exportedAt: string };
  data: {
    immobilien: any[];
    mieter: any[];
    finanzbuchungen: any[];
    wartungMaengel: any[];
    dokumente: any[];
    vertraege: any[];
  };
};

/**
 * Export all data to a JSON bundle
 * onProgress optional callback: (step, progress 0..1)
 */
export async function exportBackup(onProgress?: (step: string, progress: number) => void): Promise<BackupBundle> {
  onProgress?.('start', 0);
  const [immos, mieter, buchungen, wartung, dokumente, vertraege] = await Promise.all([
    supabase.from('immobilien').select('*'),
    supabase.from('mieter').select('*'),
    supabase.from('finanzbuchungen').select('*'),
    supabase.from('wartung_maengel').select('*'),
    supabase.from('dokumente').select('*'),
    supabase.from('vertraege').select('*'),
  ]);
  onProgress?.('fetched', 0.8);

  const bundle: BackupBundle = {
    meta: { app: 'vermy', version: 1, exportedAt: new Date().toISOString() },
    data: {
      immobilien: (immos.data || []) as any[],
      mieter: (mieter.data || []) as any[],
      finanzbuchungen: (buchungen.data || []) as any[],
      wartungMaengel: (wartung.data || []) as any[],
      dokumente: (dokumente.data || []) as any[],
      vertraege: (vertraege.data || []) as any[],
    },
  };

  onProgress?.('done', 1);
  return bundle;
}

/**
 * Import a previously exported bundle.
 * Validates structure and reports progress via optional callback.
 */
export async function importBackup(
  bundle: BackupBundle,
  onProgress?: (step: string, progress: number) => void
) {
  if (!bundle?.data || bundle?.meta?.app !== 'vermy') {
    throw new Error('Ungültiges Backup: Metadaten fehlen oder App-Tag falsch');
  }
  const d = bundle.data as any;

  // Basic JSON validation
  const requiredKeys = ['immobilien', 'mieter', 'finanzbuchungen', 'wartungMaengel', 'dokumente', 'vertraege'];
  const invalid = requiredKeys.filter((k) => !Array.isArray(d[k]));
  if (invalid.length > 0) {
    throw new Error('Ungültiges Backup: folgende Bereiche fehlen oder sind ungültig: ' + invalid.join(', '));
  }
  const counts = {
    immobilien: d.immobilien.length,
    mieter: d.mieter.length,
    vertraege: d.vertraege.length,
    finanzbuchungen: d.finanzbuchungen.length,
    wartungMaengel: d.wartungMaengel.length,
    dokumente: d.dokumente.length,
  };
  onProgress?.('validated', 0.05);

  // Delete children first to avoid FK violations
  onProgress?.('deleting', 0.1);
  await Promise.all([
    supabase.from('finanzbuchungen').delete().neq('id', ''),
    supabase.from('wartung_maengel').delete().neq('id', ''),
    supabase.from('dokumente').delete().neq('id', ''),
    supabase.from('vertraege').delete().neq('id', ''),
  ]);
  await Promise.all([
    supabase.from('mieter').delete().neq('id', ''),
    supabase.from('immobilien').delete().neq('id', ''),
  ]);
  onProgress?.('deleted', 0.25);

  // Insert in dependency order with progress
  // Immobilien in two passes: parents (no parent_id), then children
  const immoParents = (d.immobilien as any[]).filter((x) => !x.parent_id);
  const immoChildren = (d.immobilien as any[]).filter((x) => !!x.parent_id);
  if (immoParents.length) await supabase.from('immobilien').insert(immoParents as any);
  onProgress?.('immobilien_parents', 0.35);
  if (immoChildren.length) await supabase.from('immobilien').insert(immoChildren as any);
  onProgress?.('immobilien_children', 0.45);

  if (counts.mieter) await supabase.from('mieter').insert(d.mieter as any);
  onProgress?.('mieter', 0.55);

  if (counts.vertraege) await supabase.from('vertraege').insert(d.vertraege as any);
  onProgress?.('vertraege', 0.65);

  if (counts.finanzbuchungen) await supabase.from('finanzbuchungen').insert(d.finanzbuchungen as any);
  onProgress?.('finanzbuchungen', 0.78);

  if (counts.wartungMaengel) await supabase.from('wartung_maengel').insert(d.wartungMaengel as any);
  onProgress?.('wartung_maengel', 0.88);

  if (counts.dokumente) await supabase.from('dokumente').insert(d.dokumente as any);
  onProgress?.('dokumente', 0.96);

  onProgress?.('done', 1);
}

export function downloadJSON(obj: any, filename: string) {
  const dataStr = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(obj, null, 2));
  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute('href', dataStr);
  dlAnchor.setAttribute('download', filename);
  dlAnchor.click();
}
