export type SearchResult = {
  id: string;
  type: 'Immobilie' | 'Mieter' | 'Vertrag';
  title: string;
  subtitle?: string;
  route: string;
};

export async function globalSearchCompact(_query: string): Promise<SearchResult[]> {
  return [];
}
