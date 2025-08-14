export type BackupBundle = {
  meta: { app: 'vermy'; version: number; exportedAt: string };
  data: Record<string, any>;
};

export async function exportBackup(): Promise<BackupBundle> {
  return { meta: { app: 'vermy', version: 1, exportedAt: new Date().toISOString() }, data: {} };
}

export async function importBackup(_bundle: BackupBundle): Promise<void> {
  // Stub for offline mode; replaced in later steps
}

export function downloadJSON(obj: any, filename: string) {
  const dataStr = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(obj, null, 2));
  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute('href', dataStr);
  dlAnchor.setAttribute('download', filename);
  dlAnchor.click();
}
