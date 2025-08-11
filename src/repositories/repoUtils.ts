import { supabase } from '@/integrations/supabase/client';

export type RepoOp = 'list' | 'get' | 'create' | 'update' | 'remove';

export function friendlyError(op: RepoOp, entity: string): string {
  const action =
    op === 'list'
      ? 'laden'
      : op === 'get'
      ? 'laden'
      : op === 'create'
      ? 'erstellen'
      : op === 'update'
      ? 'aktualisieren'
      : 'löschen';
  return `Es ist ein Fehler beim ${action} von ${entity} aufgetreten. Bitte versuchen Sie es später erneut.`;
}

export function handleList<T>(res: { data: any; error: any }, entity: string): T[] {
  const { data, error } = res || {} as any;
  if (error) {
    console.error(`${entity}.list error`, error);
    return [] as T[];
  }
  return Array.isArray(data) ? (data as T[]) : ([] as T[]);
}

export function handleGet<T>(res: { data: any; error: any }, entity: string): T | null {
  const { data, error } = res || {} as any;
  if (error) {
    console.error(`${entity}.get error`, error);
    return null;
  }
  return (data as T) ?? null;
}

export function handleMutation<T>(res: { data: any; error: any }, op: RepoOp, entity: string): T {
  const { data, error } = res || {} as any;
  if (error) {
    console.error(`${entity}.${op} error`, error);
    throw new Error(friendlyError(op, entity));
  }
  return (data as T) as T;
}

export function nowIso(): string {
  return new Date().toISOString();
}

// Soft delete helper common to most entities
export async function softDelete(table: string, id: string): Promise<void> {
  const { error } = await supabase.from(table).update({ deleted_at: nowIso() }).eq('id', id);
  if (error) {
    console.error(`${table}.remove error`, error);
    throw new Error(friendlyError('remove', table));
  }
}
