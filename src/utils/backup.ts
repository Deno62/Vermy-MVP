import { supabase } from '@/integrations/supabase/client';
import JSZip from 'jszip';

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

// Export backup as a ZIP file (includes JSON bundle and, if available, document files)
export async function exportBackupZip(
  onProgress?: (step: string, progress: number) => void
): Promise<Blob> {
  const bundle = await exportBackup((step, progress) => {
    onProgress?.(step, Math.min(0.9, progress * 0.9));
  });

  onProgress?.('prepare_zip', 0.9);
  const zip = new JSZip();

  // Add the full JSON bundle
  zip.file('vermy-backup.json', JSON.stringify(bundle, null, 2));

  // Optionally include document files if base64 content is present
  const docs = (bundle.data?.dokumente || []) as any[];
  let processed = 0;
  for (const doc of docs) {
    const name: string = doc.dateiname || doc.name || `dokument-${doc.id || processed}`;
    const base64: string | undefined = doc.content_base64 || doc.data_base64;
    if (base64 && typeof base64 === 'string') {
      const b64 = base64.includes(',') ? base64.split(',')[1] : base64;
      zip.file(`dokumente/${name}`, b64, { base64: true });
    }
    processed++;
  }

  onProgress?.('zipping', 0.96);
  const blob = await zip.generateAsync({ type: 'blob' });
  onProgress?.('done', 1);
  return blob;
}

export async function exportAndDownloadZip(
  onProgress?: (step: string, progress: number) => void
) {
  const blob = await exportBackupZip(onProgress);
  const date = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `vermy-backup-${date}.zip`);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
