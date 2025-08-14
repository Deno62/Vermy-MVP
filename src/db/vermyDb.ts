import Dexie, { Table } from 'dexie';

export type UUID = string;
export type ImmobilieTyp = 'Haus' | 'Wohnung';
export type VertragStatus = 'aktiv' | 'gekündigt' | 'beendet';
export type ZahlungStatus = 'Bezahlt' | 'Offen' | 'Überfällig';

export interface Adresse {
  strasse: string;
  hausnummer: string;
  plz: string;
  ort: string;
  zusatz?: string;
}

export interface BaseRow {
  id: UUID;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Immobilie extends BaseRow {
  bezeichnung: string;
  typ: ImmobilieTyp;
  parent_id?: UUID | null;
  adresse: Adresse;
  zimmer?: number;
  flaeche_qm?: number;
  kaltmiete?: number;
  status?: string;
  notizen?: string;
}

export interface Mieter extends BaseRow {
  vorname: string;
  nachname: string;
  email?: string;
  telefon?: string;
  immobilie_id: UUID;
  hauptmieter: boolean;
  notizen?: string;
}

export interface Vertrag extends BaseRow {
  immobilie_id: UUID;
  mieter_id: UUID;
  mietvertrags_id?: string;
  mietbeginn: string;
  mietende?: string;
  kaltmiete: number;
  nebenkosten: number;
  zahlungsintervall: 'monatlich' | 'quartalsweise';
  kuendigungsfrist?: string;
  status: VertragStatus;
}

export interface Finanzbuchung extends BaseRow {
  immobilie_id?: UUID;
  mieter_id?: UUID;
  vertrag_id?: UUID;
  kategorie: 'Einnahme' | 'Ausgabe';
  art: 'Miete' | 'Nebenkosten' | 'Kaution' | 'Wartung' | 'Sonstiges';
  datum: string;
  betrag: number;
  beschreibung?: string;
  status: ZahlungStatus;
}

export interface WartungMaengel extends BaseRow {
  immobilie_id: UUID;
  mieter_id?: UUID;
  titel: string;
  kategorie?: string;
  status: 'Offen' | 'In Arbeit' | 'Erledigt';
  prioritaet?: 'Niedrig' | 'Mittel' | 'Hoch';
  beauftragt_am?: string;
  notizen?: string;
}

export interface Dokument extends BaseRow {
  immobilie_id?: UUID;
  mieter_id?: UUID;
  vertrag_id?: UUID;
  kategorie?: string;
  name: string;
  mime?: string;
  data_base64?: string;
}

export interface Nebenkosten extends BaseRow {
  immobilie_id: UUID;
  jahr: number;
  status: 'geplant' | 'im Lauf' | 'abgeschlossen';
  summe?: number;
}

export class VermyDB extends Dexie {
  immobilien!: Table<Immobilie, UUID>;
  mieter!: Table<Mieter, UUID>;
  vertraege!: Table<Vertrag, UUID>;
  finanzbuchungen!: Table<Finanzbuchung, UUID>;
  wartungen!: Table<WartungMaengel, UUID>;
  dokumente!: Table<Dokument, UUID>;
  nebenkosten!: Table<Nebenkosten, UUID>;
  versions!: Table<{ id: string; version: number }, string>;

  constructor() {
    super('vermyDB');
    this.version(1).stores({
      immobilien: 'id, typ, parent_id, created_at, updated_at',
      mieter: 'id, immobilie_id, hauptmieter, created_at',
      vertraege: 'id, immobilie_id, mieter_id, status, mietbeginn, mietende, created_at',
      finanzbuchungen: 'id, immobilie_id, mieter_id, vertrag_id, kategorie, status, datum',
      wartungen: 'id, immobilie_id, mieter_id, status, created_at',
      dokumente: 'id, immobilie_id, mieter_id, vertrag_id, created_at',
      nebenkosten: 'id, immobilie_id, jahr, status',
      versions: 'id',
    });
  }
}

export const db = new VermyDB();

export const nowIso = () => new Date().toISOString();
export const genId = () => crypto.randomUUID();
export const formatAddress = (a?: Adresse) =>
  a ? `${a.strasse} ${a.hausnummer}, ${a.plz} ${a.ort}${a.zusatz ? ' · ' + a.zusatz : ''}` : '';

export async function seedIfEmpty() {
  if (await db.immobilien.count()) return;
  const hausId = genId();
  const whgId = genId();
  const mId = genId();
  const vtId = genId();
  await db.immobilien.bulkAdd([
    {
      id: hausId, bezeichnung: 'Haus Musterstraße', typ: 'Haus', parent_id: null,
      adresse: { strasse: 'Musterstraße', hausnummer: '1', plz: '10115', ort: 'Berlin' },
      status: 'frei', created_at: nowIso(), updated_at: nowIso()
    },
    {
      id: whgId, bezeichnung: 'Whg 1 OG rechts', typ: 'Wohnung', parent_id: hausId,
      adresse: { strasse: 'Musterstraße', hausnummer: '1', plz: '10115', ort: 'Berlin' },
      zimmer: 2, flaeche_qm: 54, kaltmiete: 850, status: 'frei',
      created_at: nowIso(), updated_at: nowIso()
    },
  ]);
  await db.mieter.add({
    id: mId, vorname: 'Max', nachname: 'Mustermann', email: 'max@example.com', telefon: '030-123456',
    immobilie_id: whgId, hauptmieter: true, created_at: nowIso(), updated_at: nowIso()
  });
  await db.vertraege.add({
    id: vtId, immobilie_id: whgId, mieter_id: mId, status: 'aktiv', mietbeginn: nowIso(),
    kaltmiete: 850, nebenkosten: 180, zahlungsintervall: 'monatlich',
    created_at: nowIso(), updated_at: nowIso(), mietvertrags_id: 'MV-0001'
  });
  await db.finanzbuchungen.add({
    id: genId(), immobilie_id: whgId, mieter_id: mId, vertrag_id: vtId,
    kategorie: 'Einnahme', art: 'Miete', datum: nowIso(), betrag: 1030,
    beschreibung: 'Miete + NK', status: 'Bezahlt',
    created_at: nowIso(), updated_at: nowIso()
  });
}
