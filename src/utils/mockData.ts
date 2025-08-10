// Mock data generator for Vermy CRM
import { 
  Immobilie, 
  Mieter, 
  Finanzbuchung, 
  Nebenkosten, 
  WartungMaengel, 
  Mahnwesen, 
  Dokument 
} from '@/types/entities';

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const getRandomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const getRandomElement = <T>(array: readonly T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

// Sample German addresses and names
const addresses = [
  { adresse: 'Musterstraße 12', plz: '10115', ort: 'Berlin' },
  { adresse: 'Hauptstraße 45', plz: '80331', ort: 'München' },
  { adresse: 'Königsallee 23', plz: '40212', ort: 'Düsseldorf' },
  { adresse: 'Hamburger Straße 78', plz: '20095', ort: 'Hamburg' },
  { adresse: 'Bahnhofstraße 34', plz: '70173', ort: 'Stuttgart' },
  { adresse: 'Rheinstraße 56', plz: '50667', ort: 'Köln' },
  { adresse: 'Marktplatz 9', plz: '60311', ort: 'Frankfurt am Main' },
  { adresse: 'Kaiserstraße 123', plz: '76133', ort: 'Karlsruhe' }
];

const firstNames = ['Anna', 'Maria', 'Klaus', 'Hans', 'Petra', 'Wolfgang', 'Sabine', 'Michael', 'Christine', 'Thomas'];
const lastNames = ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann'];

export const generateMockImmobilien = (count: number = 10): Immobilie[] => {
  const now = new Date();
  const immobilien: Immobilie[] = [];

  for (let i = 0; i < count; i++) {
    const address = getRandomElement(addresses);
    const createdAt = getRandomDate(new Date(2020, 0, 1), now);
    
    immobilien.push({
      id: generateUUID(),
      created_at: createdAt,
      updated_at: getRandomDate(createdAt, now),
      version: Math.floor(Math.random() * 5) + 1,
      bezeichnung: `${address.adresse} - ${getRandomElement(['Wohnung', 'Apartment', 'Studio'])}`,
      adresse: address.adresse,
      plz: address.plz,
      ort: address.ort,
      art: getRandomElement(['Wohnung', 'Haus', 'Gewerbe', 'Garage', 'Sonstiges']),
      zimmer: Math.floor(Math.random() * 5) + 1,
      flaeche: Math.floor(Math.random() * 100) + 30,
      baujahr: Math.floor(Math.random() * 50) + 1970,
      kaltmiete: Math.floor(Math.random() * 1500) + 500,
      nebenkosten: Math.floor(Math.random() * 300) + 100,
      kaution: Math.floor(Math.random() * 3000) + 1000,
      status: getRandomElement(['Verfügbar', 'Vermietet', 'Wartung', 'Leerstand']),
      beschreibung: 'Schöne Wohnung in zentraler Lage mit moderner Ausstattung.',
      energieausweis: getRandomElement(['A+', 'A', 'B', 'C', 'D'])
    });
  }

  return immobilien;
};

export const generateMockMieter = (immobilien: Immobilie[], count: number = 15): Mieter[] => {
  const now = new Date();
  const mieter: Mieter[] = [];

  for (let i = 0; i < count; i++) {
    const createdAt = getRandomDate(new Date(2020, 0, 1), now);
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const immobilie = getRandomElement(immobilien);
    
    mieter.push({
      id: generateUUID(),
      created_at: createdAt,
      updated_at: getRandomDate(createdAt, now),
      version: Math.floor(Math.random() * 3) + 1,
      anrede: getRandomElement(['Herr', 'Frau', 'Divers']),
      vorname: firstName,
      nachname: lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.de`,
      telefon: `0${Math.floor(Math.random() * 9) + 1}${Math.floor(Math.random() * 90000000) + 10000000}`,
      immobilie_id: Math.random() > 0.3 ? immobilie.id : undefined,
      einzugsdatum: Math.random() > 0.5 ? getRandomDate(new Date(2020, 0, 1), now) : undefined,
      auszugsdatum: Math.random() > 0.8 ? getRandomDate(new Date(2022, 0, 1), now) : undefined,
      status: getRandomElement(['Aktiv', 'Ausgezogen', 'Gekündigt']),
      notizen: Math.random() > 0.7 ? 'Zuverlässiger Mieter, pünktliche Zahlungen.' : undefined
    });
  }

  return mieter;
};

export const generateMockFinanzbuchungen = (immobilien: Immobilie[], mieter: Mieter[], count: number = 50): Finanzbuchung[] => {
  const now = new Date();
  const buchungen: Finanzbuchung[] = [];

  for (let i = 0; i < count; i++) {
    const createdAt = getRandomDate(new Date(2023, 0, 1), now);
    const immobilie = getRandomElement(immobilien);
    const mietvertragsmieter = mieter.filter(m => m.immobilie_id === immobilie.id);
    
    buchungen.push({
      id: generateUUID(),
      created_at: createdAt,
      updated_at: getRandomDate(createdAt, now),
      version: 1,
      immobilie_id: immobilie.id,
      mieter_id: mietvertragsmieter.length > 0 ? getRandomElement(mietvertragsmieter).id : undefined,
      art: getRandomElement(['Miete', 'Nebenkosten', 'Kaution', 'Reparatur', 'Verwaltung', 'Sonstiges']),
      kategorie: getRandomElement(['Einnahme', 'Ausgabe']),
      betrag: Math.floor(Math.random() * 2000) + 100,
      datum: getRandomDate(new Date(2023, 0, 1), now),
      beschreibung: 'Monatliche Mietzahlung für ' + immobilie.bezeichnung,
      referenz: `REF-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      status: getRandomElement(['Offen', 'Bezahlt', 'Überfällig', 'Storniert'])
    });
  }

  return buchungen;
};

export const generateMockData = () => {
  const immobilien = generateMockImmobilien(8);
  const mieter = generateMockMieter(immobilien, 12);
  const finanzbuchungen = generateMockFinanzbuchungen(immobilien, mieter, 30);
  
  // Generate other entities with basic structure
  const now = new Date();
  
  const nebenkosten: Nebenkosten[] = immobilien.slice(0, 5).map(immobilie => ({
    id: generateUUID(),
    created_at: getRandomDate(new Date(2023, 0, 1), now),
    updated_at: getRandomDate(new Date(2023, 0, 1), now),
    version: 1,
    immobilie_id: immobilie.id,
    jahr: 2023,
    heizkosten: Math.floor(Math.random() * 1000) + 500,
    wasser: Math.floor(Math.random() * 300) + 100,
    strom_allgemein: Math.floor(Math.random() * 200) + 50,
    müll: Math.floor(Math.random() * 150) + 50,
    hausmeister: Math.floor(Math.random() * 400) + 200,
    versicherung: Math.floor(Math.random() * 300) + 150,
    verwaltung: Math.floor(Math.random() * 500) + 300,
    sonstiges: Math.floor(Math.random() * 200) + 50,
    status: getRandomElement(['Geplant', 'Abgerechnet', 'Bezahlt'])
  }));

  const wartungMaengel: WartungMaengel[] = [];
  for (let i = 0; i < 8; i++) {
    const immobilie = getRandomElement(immobilien);
    wartungMaengel.push({
      id: generateUUID(),
      created_at: getRandomDate(new Date(2023, 0, 1), now),
      updated_at: getRandomDate(new Date(2023, 0, 1), now),
      version: 1,
      immobilie_id: immobilie.id,
      mieter_id: Math.random() > 0.5 ? getRandomElement(mieter).id : undefined,
      titel: getRandomElement(['Heizung defekt', 'Wasserschaden', 'Fenster undicht', 'Türschloss kaputt']),
      beschreibung: 'Detaillierte Beschreibung des Problems oder der Wartungsmaßnahme.',
      kategorie: getRandomElement(['Wartung', 'Reparatur', 'Mangel', 'Modernisierung']),
      prioritaet: getRandomElement(['Niedrig', 'Normal', 'Hoch', 'Dringend']),
      status: getRandomElement(['Gemeldet', 'In Bearbeitung', 'Erledigt', 'Verschoben']),
      kosten_geschaetzt: Math.floor(Math.random() * 500) + 100,
      kosten_tatsaechlich: Math.random() > 0.5 ? Math.floor(Math.random() * 600) + 150 : undefined,
      beauftragt_am: getRandomDate(new Date(2023, 0, 1), now),
      erledigt_am: Math.random() > 0.6 ? getRandomDate(new Date(2023, 6, 1), now) : undefined
    });
  }

  return {
    immobilien,
    mieter,
    finanzbuchungen,
    nebenkosten,
    wartungMaengel,
    mahnwesen: [] as Mahnwesen[],
    dokumente: [] as Dokument[]
  };
};