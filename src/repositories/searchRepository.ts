import { immobilienRepository } from './immobilienRepository';
import { mieterRepository } from './mieterRepository';
import { vertragRepository } from './vertragRepository';

export async function globalSearch(query: string) {
  const q = query.trim();
  if (!q) return { immobilien: [], mieter: [], vertraege: [] };
  const [immobilien, mieter, vertraege] = await Promise.all([
    immobilienRepository.list({ search: q }),
    mieterRepository.list({ search: q }),
    vertragRepository.list({ search: q }),
  ]);
  return { immobilien, mieter, vertraege };
}
