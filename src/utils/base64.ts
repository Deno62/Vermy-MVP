// Safe Base64 -> Blob URL helper for client-side downloads

export function createBlobUrlFromBase64(base64: string, mimeType: string): string | null {
  try {
    if (!base64) return null;
    // Remove data URL prefix if present
    const clean = base64.includes(',') ? base64.split(',')[1] : base64;
    if (typeof atob !== 'function') return null;
    const binary = atob(clean);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: mimeType || 'application/octet-stream' });
    return URL.createObjectURL(blob);
  } catch (e) {
    console.error('createBlobUrlFromBase64 error', e);
    return null;
  }
}

export function revokeBlobUrl(url?: string | null) {
  try {
    if (url) URL.revokeObjectURL(url);
  } catch (e) {
    // no-op
  }
}
