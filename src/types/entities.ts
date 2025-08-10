// Entity types for Vermy Real Estate CRM

export interface BaseEntity {
  id: string; // UUID
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
  version: number;
}

export interface Immobilie extends BaseEntity {
  bezeichnung: string;
  adresse: string;
  plz: string;
  ort: string;
  art: 'Wohnung' | 'Haus' | 'Gewerbe' | 'Garage' | 'Sonstiges';
  zimmer: number;
  flaeche: number;
  baujahr?: number;
  kaltmiete?: number;
  nebenkosten?: number;
  kaution?: number;
  status: 'Verfügbar' | 'Vermietet' | 'Wartung' | 'Leerstand';
  beschreibung?: string;
  energieausweis?: string;
}

export interface Mieter extends BaseEntity {
  anrede: 'Herr' | 'Frau' | 'Divers';
  vorname: string;
  nachname: string;
  email: string;
  telefon: string;
  immobilie_id?: string;
  einzugsdatum?: Date;
  auszugsdatum?: Date;
  status: 'Aktiv' | 'Ausgezogen' | 'Gekündigt';
  notizen?: string;
}

export interface Finanzbuchung extends BaseEntity {
  immobilie_id: string;
  mieter_id?: string;
  art: 'Miete' | 'Nebenkosten' | 'Kaution' | 'Reparatur' | 'Verwaltung' | 'Sonstiges';
  kategorie: 'Einnahme' | 'Ausgabe';
  betrag: number;
  datum: Date;
  beschreibung: string;
  referenz?: string;
  status: 'Offen' | 'Bezahlt' | 'Überfällig' | 'Storniert';
}

export interface Nebenkosten extends BaseEntity {
  immobilie_id: string;
  jahr: number;
  heizkosten: number;
  wasser: number;
  strom_allgemein: number;
  müll: number;
  hausmeister: number;
  versicherung: number;
  verwaltung: number;
  sonstiges: number;
  status: 'Geplant' | 'Abgerechnet' | 'Bezahlt';
}

export interface WartungMaengel extends BaseEntity {
  immobilie_id: string;
  mieter_id?: string;
  titel: string;
  beschreibung: string;
  kategorie: 'Wartung' | 'Reparatur' | 'Mangel' | 'Modernisierung';
  prioritaet: 'Niedrig' | 'Normal' | 'Hoch' | 'Dringend';
  status: 'Gemeldet' | 'In Bearbeitung' | 'Erledigt' | 'Verschoben';
  kosten_geschaetzt?: number;
  kosten_tatsaechlich?: number;
  beauftragt_am?: Date;
  erledigt_am?: Date;
}

export interface Mahnwesen extends BaseEntity {
  immobilie_id: string;
  mieter_id: string;
  finanzbuchung_id: string;
  mahnstufe: 1 | 2 | 3;
  betrag: number;
  mahngebuehr: number;
  mahndatum: Date;
  faelligkeitsdatum: Date;
  status: 'Verschickt' | 'Bezahlt' | 'Ignoriert' | 'Rechtlich';
  notizen?: string;
}

export interface Dokument extends BaseEntity {
  immobilie_id?: string;
  mieter_id?: string;
  titel: string;
  kategorie: 'Mietvertrag' | 'Kündigung' | 'Nebenkostenabrechnung' | 'Rechnung' | 'Foto' | 'Sonstiges';
  dateiname: string;
  dateipfad: string;
  dateigröße: number;
  notizen?: string;
}

// Picklist values for better data quality
export const PICKLISTS = {
  immobilie_art: ['Wohnung', 'Haus', 'Gewerbe', 'Garage', 'Sonstiges'] as const,
  immobilie_status: ['Verfügbar', 'Vermietet', 'Wartung', 'Leerstand'] as const,
  anrede: ['Herr', 'Frau', 'Divers'] as const,
  mieter_status: ['Aktiv', 'Ausgezogen', 'Gekündigt'] as const,
  buchung_art: ['Miete', 'Nebenkosten', 'Kaution', 'Reparatur', 'Verwaltung', 'Sonstiges'] as const,
  buchung_kategorie: ['Einnahme', 'Ausgabe'] as const,
  buchung_status: ['Offen', 'Bezahlt', 'Überfällig', 'Storniert'] as const,
  nebenkosten_status: ['Geplant', 'Abgerechnet', 'Bezahlt'] as const,
  wartung_kategorie: ['Wartung', 'Reparatur', 'Mangel', 'Modernisierung'] as const,
  prioritaet: ['Niedrig', 'Normal', 'Hoch', 'Dringend'] as const,
  wartung_status: ['Gemeldet', 'In Bearbeitung', 'Erledigt', 'Verschoben'] as const,
  mahnstufe: [1, 2, 3] as const,
  mahn_status: ['Verschickt', 'Bezahlt', 'Ignoriert', 'Rechtlich'] as const,
  dokument_kategorie: ['Mietvertrag', 'Kündigung', 'Nebenkostenabrechnung', 'Rechnung', 'Foto', 'Sonstiges'] as const
} as const;