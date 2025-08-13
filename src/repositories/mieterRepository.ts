import { vermyDb } from '@/db/vermyDb';
import type { Mieter } from '@/types/entities';

export async function listMieter(opts?: { search?: string; immobilieId?: string }) {
  let coll = vermyDb.mieter.toCollection();

  if (opts?.immobilieId) {
    coll = coll.filter(m => m.immobilie_id === opts.immobilieId);
  }
  if (opts?.search) {
    const s = opts.search.toLowerCase();
    coll = coll.filter(m =>
      (m.vorname ?? '').toLowerCase().includes(s) ||
      (m.nachname ?? '').toLowerCase().includes(s) ||
      (m.email ?? '').toLowerCase().includes(s) ||
      (m.telefon ?? '').toLowerCase().includes(s)
    );
  }

  return coll.reverse().toArray();
}

export async function getMieter(id: string) {
  return vermyDb.mieter.get(id);
}

export async function createMieter(data: Partial<Mieter>) {
  const id = crypto.randomUUID();
  const now = new Date();

  const rec: Mieter = {
    id,
    version: 1,
    created_at: now,
    updated_at: now,
    vorname: data.vorname ?? '',
    nachname: data.nachname ?? '',
    email: data.email ?? '',
    telefon: data.telefon ?? '',
    adresse: data.adresse,
    status: data.status ?? 'aktiv',
    immobilie_id: data.immobilie_id, // set when linking to Wohnung
    notizen: data.notizen,
  };

  await vermyDb.mieter.add(rec);
  return rec;
}

export async function updateMieter(id: string, patch: Partial<Mieter>) {
  const cur = await vermyDb.mieter.get(id);
  if (!cur) throw new Error('Nicht gefunden');
  const merged: Mieter = { ...cur, ...patch, updated_at: new Date() };
  await vermyDb.mieter.put(merged);
  return merged;
}

export async function deleteMieter(id: string) {
  await vermyDb.mieter.delete(id);
  return true;
}

export async function listMieterByWohnung(wohnungId: string) {
  return vermyDb.mieter.where('immobilie_id').equals(wohnungId).reverse().toArray();
}
