import { supabase } from '@/integrations/supabase/client';

export type SearchResult = {
  id: string;
  type: 'Immobilie' | 'Mieter' | 'Vertrag';
  title: string;
  subtitle?: string;
  route: string;
};

function safeArray<T>(data: any): T[] {
  return Array.isArray(data) ? (data as T[]) : [];
}

export async function globalSearchCompact(query: string): Promise<SearchResult[]> {
  const q = (query || '').trim();
  if (!q) return [];

  const like = `%${q}%`;

  const [immosRes, mieterRes, vertragRes] = await Promise.all([
    supabase
      .from('immobilien')
      .select('id, bezeichnung, adresse, ort, typ')
      .or(['bezeichnung', 'adresse', 'ort'].map((f) => `${f}.ilike.${like}`).join(','))
      .limit(20),
    supabase
      .from('mieter')
      .select('id, vorname, nachname, email, telefon')
      .or(['vorname', 'nachname', 'email', 'telefon'].map((f) => `${f}.ilike.${like}`).join(','))
      .limit(20),
    supabase
      .from('vertraege')
      .select('id, mietvertrags_id, status, mietbeginn, mietende')
      .or(['mietvertrags_id'].map((f) => `${f}.ilike.${like}`).join(','))
      .limit(20),
  ]);

  const immos = safeArray<any>((immosRes as any)?.data).map<SearchResult>((r) => ({
    id: r.id,
    type: 'Immobilie',
    title: r.bezeichnung ?? 'Immobilie',
    subtitle: [r.typ, [r.adresse, r.ort].filter(Boolean).join(', ')].filter(Boolean).join(' · '),
    route: `/immobilien/${r.id}`,
  }));

  const mieter = safeArray<any>((mieterRes as any)?.data).map<SearchResult>((r) => ({
    id: r.id,
    type: 'Mieter',
    title: [r.vorname, r.nachname].filter(Boolean).join(' '),
    subtitle: [r.email, r.telefon].filter(Boolean).join(' · '),
    route: `/mieter/${r.id}`,
  }));

  const vertraege = safeArray<any>((vertragRes as any)?.data).map<SearchResult>((r) => ({
    id: r.id,
    type: 'Vertrag',
    title: r.mietvertrags_id || 'Vertrag',
    subtitle: [r.status, r.mietbeginn?.slice(0, 10), r.mietende?.slice(0, 10)].filter(Boolean).join(' · '),
    route: `/vertraege/${r.id}`,
  }));

  return [...immos, ...mieter, ...vertraege];
}
