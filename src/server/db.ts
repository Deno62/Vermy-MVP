import Database from "better-sqlite3";
import path from "path";
export const db = new Database(path.join(process.cwd(), "vermy.db"));
db.pragma("journal_mode = WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS immobilien (
  id TEXT PRIMARY KEY,
  bezeichnung TEXT NOT NULL,
  adresse TEXT,
  typ TEXT CHECK(typ IN ('Haus','Wohnung')) NOT NULL,
  zimmer INTEGER DEFAULT 0,
  flaeche_qm REAL DEFAULT 0,
  kaltmiete REAL DEFAULT 0,
  status TEXT DEFAULT 'frei',
  parent_id TEXT REFERENCES immobilien(id) ON DELETE SET NULL,
  notizen TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_immobilien_parent ON immobilien(parent_id);
`);
export const nowIso = () => new Date().toISOString();
