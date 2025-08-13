import { v4 as uuid } from "uuid";

export function genId() {
return (globalThis.crypto?.randomUUID?.() ?? (uuid?.() ?? (Math.random().toString(36).slice(2) + Date.now().toString(36))));
}

export function nowIso() {
return new Date().toISOString();
}

export const newId = genId;

// Minimales DB-Objekt (Platzhalter, damit Import ‘vermyDb’ existiert)
export const db = {};
export const vermyDb = db;