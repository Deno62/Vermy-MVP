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

export async function exportBackup(): Promise<BackupBundle> {
  const [immos, mieter, buchungen, wartung, dokumente, vertraege] = await Promise.all([
    supabase.from('immobilien').select('*'),
    supabase.from('mieter').select('*'),
    supabase.from('finanzbuchungen').select('*'),
    supabase.from('wartung_maengel').select('*'),
    supabase.from('dokumente').select('*'),
    supabase.from('vertraege').select('*'),
  ]);

  return {
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
}

export async function importBackup(bundle: BackupBundle) {
  if (!bundle?.data) throw new Error('Ungültiges Backup');
  const d = bundle.data;

  // Delete children first to avoid FK violations
  await supabase.from('finanzbuchungen').delete().neq('id', '');
  await supabase.from('wartung_maengel').delete().neq('id', '');
  await supabase.from('dokumente').delete().neq('id', '');
  await supabase.from('vertraege').delete().neq('id', '');
  await supabase.from('mieter').delete().neq('id', '');
  await supabase.from('immobilien').delete().neq('id', '');

  // Insert parents first
  if (d.immobilien?.length) await supabase.from('immobilien').insert(d.immobilien as any);
  if (d.mieter?.length) await supabase.from('mieter').insert(d.mieter as any);
  if (d.vertraege?.length) await supabase.from('vertraege').insert(d.vertraege as any);
  if (d.finanzbuchungen?.length) await supabase.from('finanzbuchungen').insert(d.finanzbuchungen as any);
  if (d.wartungMaengel?.length) await supabase.from('wartung_maengel').insert(d.wartungMaengel as any);
  if (d.dokumente?.length) await supabase.from('dokumente').insert(d.dokumente as any);
}

export function downloadJSON(obj: any, filename: string) {
  const dataStr = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(obj, null, 2));
  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute('href', dataStr);
  dlAnchor.setAttribute('download', filename);
  dlAnchor.click();
}
