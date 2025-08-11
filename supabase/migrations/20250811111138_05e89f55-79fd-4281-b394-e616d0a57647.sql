-- 1) Schema updates: hierarchy + status-related fields
-- Add columns if not exist
ALTER TABLE public.immobilien
  ADD COLUMN IF NOT EXISTS parent_id uuid NULL;

ALTER TABLE public.finanzbuchungen
  ADD COLUMN IF NOT EXISTS bezahlt_am timestamptz NULL;

ALTER TABLE public.wartung_maengel
  ADD COLUMN IF NOT EXISTS faellig_am timestamptz NULL;

-- Add FK for immobilien.parent_id to immobilien(id)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'immobilien_parent_id_fkey'
  ) THEN
    ALTER TABLE public.immobilien
      ADD CONSTRAINT immobilien_parent_id_fkey
      FOREIGN KEY (parent_id)
      REFERENCES public.immobilien(id)
      ON UPDATE CASCADE
      ON DELETE SET NULL;
  END IF;
END $$;

-- Useful index for hierarchy lookups
CREATE INDEX IF NOT EXISTS idx_immobilien_parent_id ON public.immobilien(parent_id);

-- 2) Ensure updated_at triggers exist for key tables
DROP TRIGGER IF EXISTS set_updated_at_immobilien ON public.immobilien;
CREATE TRIGGER set_updated_at_immobilien
BEFORE UPDATE ON public.immobilien
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_mieter ON public.mieter;
CREATE TRIGGER set_updated_at_mieter
BEFORE UPDATE ON public.mieter
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_vertraege ON public.vertraege;
CREATE TRIGGER set_updated_at_vertraege
BEFORE UPDATE ON public.vertraege
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_finanzbuchungen ON public.finanzbuchungen;
CREATE TRIGGER set_updated_at_finanzbuchungen
BEFORE UPDATE ON public.finanzbuchungen
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_wartung_maengel ON public.wartung_maengel;
CREATE TRIGGER set_updated_at_wartung_maengel
BEFORE UPDATE ON public.wartung_maengel
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_dokumente ON public.dokumente;
CREATE TRIGGER set_updated_at_dokumente
BEFORE UPDATE ON public.dokumente
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Seed data: 1 Haus with 3 Wohnungen, multiple Mieter, Verträge, Zahlungen, Wartung, Dokumente
DO $$
DECLARE
  v_haus_id uuid;
  v_w1_id uuid;
  v_w2_id uuid;
  v_w3_id uuid;
  v_m1_id uuid;
  v_m2_id uuid;
  v_m3_id uuid;
  v_now timestamptz := now();
BEGIN
  -- Haus
  SELECT id INTO v_haus_id FROM public.immobilien 
   WHERE bezeichnung = 'Haus Lindenstraße 12' AND parent_id IS NULL LIMIT 1;
  IF v_haus_id IS NULL THEN
    INSERT INTO public.immobilien (
      bezeichnung, adresse, plz, ort, art, status, zimmer, flaeche, baujahr, kaltmiete, nebenkosten, kaution
    ) VALUES (
      'Haus Lindenstraße 12', 'Lindenstraße 12', '10115', 'Berlin', 'Haus', 'frei', 0, NULL, 1995, NULL, NULL, NULL
    ) RETURNING id INTO v_haus_id;
  END IF;

  -- Wohnungen
  SELECT id INTO v_w1_id FROM public.immobilien WHERE bezeichnung = 'Lindenstraße 12 - Whg 1' LIMIT 1;
  IF v_w1_id IS NULL THEN
    INSERT INTO public.immobilien (
      bezeichnung, adresse, plz, ort, art, status, zimmer, flaeche, baujahr, kaltmiete, nebenkosten, kaution, parent_id
    ) VALUES (
      'Lindenstraße 12 - Whg 1', 'Lindenstraße 12', '10115', 'Berlin', 'Wohnung', 'vermietet', 2, 55, 1995, 850, 180, 1700, v_haus_id
    ) RETURNING id INTO v_w1_id;
  END IF;

  SELECT id INTO v_w2_id FROM public.immobilien WHERE bezeichnung = 'Lindenstraße 12 - Whg 2' LIMIT 1;
  IF v_w2_id IS NULL THEN
    INSERT INTO public.immobilien (
      bezeichnung, adresse, plz, ort, art, status, zimmer, flaeche, baujahr, kaltmiete, nebenkosten, kaution, parent_id
    ) VALUES (
      'Lindenstraße 12 - Whg 2', 'Lindenstraße 12', '10115', 'Berlin', 'Wohnung', 'frei', 3, 68, 1995, 980, 220, 1960, v_haus_id
    ) RETURNING id INTO v_w2_id;
  END IF;

  SELECT id INTO v_w3_id FROM public.immobilien WHERE bezeichnung = 'Lindenstraße 12 - Whg 3' LIMIT 1;
  IF v_w3_id IS NULL THEN
    INSERT INTO public.immobilien (
      bezeichnung, adresse, plz, ort, art, status, zimmer, flaeche, baujahr, kaltmiete, nebenkosten, kaution, parent_id
    ) VALUES (
      'Lindenstraße 12 - Whg 3', 'Lindenstraße 12', '10115', 'Berlin', 'Wohnung', 'vermietet', 1, 42, 1995, 700, 150, 1400, v_haus_id
    ) RETURNING id INTO v_w3_id;
  END IF;

  -- Mieter
  SELECT id INTO v_m1_id FROM public.mieter WHERE email = 'anna.mueller@example.com' LIMIT 1;
  IF v_m1_id IS NULL THEN
    INSERT INTO public.mieter (
      anrede, vorname, nachname, email, telefon, immobilie_id, status, einzugsdatum
    ) VALUES (
      'Frau', 'Anna', 'Müller', 'anna.mueller@example.com', '+49 30 123456', v_w1_id, 'aktiv', v_now - interval '1 year'
    ) RETURNING id INTO v_m1_id;
  END IF;

  SELECT id INTO v_m2_id FROM public.mieter WHERE email = 'max.schmidt@example.com' LIMIT 1;
  IF v_m2_id IS NULL THEN
    INSERT INTO public.mieter (
      anrede, vorname, nachname, email, telefon, immobilie_id, status, einzugsdatum
    ) VALUES (
      'Herr', 'Max', 'Schmidt', 'max.schmidt@example.com', '+49 30 234567', v_w3_id, 'aktiv', v_now - interval '6 months'
    ) RETURNING id INTO v_m2_id;
  END IF;

  SELECT id INTO v_m3_id FROM public.mieter WHERE email = 'haus.hubert@example.com' LIMIT 1;
  IF v_m3_id IS NULL THEN
    INSERT INTO public.mieter (
      anrede, vorname, nachname, email, telefon, immobilie_id, status, einzugsdatum
    ) VALUES (
      'Herr', 'Hubert', 'Hauser', 'haus.hubert@example.com', '+49 30 345678', v_haus_id, 'aktiv', v_now - interval '2 years'
    ) RETURNING id INTO v_m3_id;
  END IF;

  -- Verträge (use ON CONFLICT DO NOTHING on mietvertrags_id)
  INSERT INTO public.vertraege (
    mietvertrags_id, status, mietbeginn, mietende, zahlungsintervall, kuendigungsfrist, immobilie_id, mieter_id, kaltmiete, nebenkosten, notizen
  ) VALUES (
    'MV-1001', 'aktiv', v_now - interval '1 year', NULL, 'monatlich', '3 Monate', v_w1_id, v_m1_id, 850, 180, 'Standardmietvertrag'
  ) ON CONFLICT (mietvertrags_id) DO NOTHING;

  INSERT INTO public.vertraege (
    mietvertrags_id, status, mietbeginn, mietende, zahlungsintervall, kuendigungsfrist, immobilie_id, mieter_id, kaltmiete, nebenkosten, notizen
  ) VALUES (
    'MV-1002', 'gekündigt', v_now - interval '10 months', v_now + interval '45 days', 'monatlich', '3 Monate', v_w3_id, v_m2_id, 700, 150, 'Kündigung wirksam'
  ) ON CONFLICT (mietvertrags_id) DO NOTHING;

  INSERT INTO public.vertraege (
    mietvertrags_id, status, mietbeginn, mietende, zahlungsintervall, kuendigungsfrist, immobilie_id, mieter_id, kaltmiete, nebenkosten, notizen
  ) VALUES (
    'MV-1003', 'aktiv', v_now - interval '2 years', NULL, 'monatlich', '3 Monate', v_haus_id, v_m3_id, 2000, 400, 'Hausmietvertrag'
  ) ON CONFLICT (mietvertrags_id) DO NOTHING;

  -- Zahlungen (offen, überfällig, bezahlt)
  -- Offen
  INSERT INTO public.finanzbuchungen (
    beschreibung, kategorie, art, status, immobilie_id, mieter_id, betrag, datum, referenz
  ) SELECT 'Miete Juli', 'Miete', 'Soll', 'offen', v_w1_id, v_m1_id, 1030, date_trunc('month', v_now), 'R-2025-07-01'
    WHERE NOT EXISTS (SELECT 1 FROM public.finanzbuchungen WHERE referenz = 'R-2025-07-01');

  -- Überfällig (last month)
  INSERT INTO public.finanzbuchungen (
    beschreibung, kategorie, art, status, immobilie_id, mieter_id, betrag, datum, referenz
  ) SELECT 'Miete Juni', 'Miete', 'Soll', 'überfällig', v_w1_id, v_m1_id, 1030, date_trunc('month', v_now) - interval '1 month', 'R-2025-06-01'
    WHERE NOT EXISTS (SELECT 1 FROM public.finanzbuchungen WHERE referenz = 'R-2025-06-01');

  -- Bezahlt with bezahlt_am
  INSERT INTO public.finanzbuchungen (
    beschreibung, kategorie, art, status, immobilie_id, mieter_id, betrag, datum, referenz, bezahlt_am
  ) SELECT 'Miete Mai', 'Miete', 'Soll', 'bezahlt', v_w1_id, v_m1_id, 1030, date_trunc('month', v_now) - interval '2 month', 'R-2025-05-01', v_now - interval '1 month'
    WHERE NOT EXISTS (SELECT 1 FROM public.finanzbuchungen WHERE referenz = 'R-2025-05-01');

  -- Wartung Tickets
  INSERT INTO public.wartung_maengel (
    titel, beschreibung, kategorie, prioritaet, status, immobilie_id, mieter_id, kosten_geschaetzt, beauftragt_am, faellig_am
  ) SELECT 'Heizung prüfen', 'Regelmäßige Wartung der Heizungsanlage', 'Wartung', 'mittel', 'offen', v_haus_id, NULL, 150, v_now - interval '3 days', v_now + interval '7 days'
    WHERE NOT EXISTS (SELECT 1 FROM public.wartung_maengel WHERE titel = 'Heizung prüfen' AND immobilie_id = v_haus_id);

  INSERT INTO public.wartung_maengel (
    titel, beschreibung, kategorie, prioritaet, status, immobilie_id, mieter_id, kosten_geschaetzt, beauftragt_am, faellig_am
  ) SELECT 'Wasserhahn tropft', 'Reparatur im Bad', 'Reparatur', 'hoch', 'offen', v_w3_id, v_m2_id, 80, v_now - interval '1 day', v_now + interval '3 days'
    WHERE NOT EXISTS (SELECT 1 FROM public.wartung_maengel WHERE titel = 'Wasserhahn tropft' AND immobilie_id = v_w3_id);

  -- Dokumente (small base64 text file)
  IF NOT EXISTS (
    SELECT 1 FROM public.dokumente WHERE titel = 'Wohnungsübergabeprotokoll' AND dateiname = 'protokoll.txt'
  ) THEN
    INSERT INTO public.dokumente (
      titel, kategorie, dateiname, content_base64, dateigröße, immobilie_id, mieter_id, notizen
    ) VALUES (
      'Wohnungsübergabeprotokoll', 'Vertrag', 'protokoll.txt', encode('Testdokument', 'base64')::text, octet_length('Testdokument')::bigint, v_w1_id, v_m1_id, 'Beispieldatei'
    );
  END IF;
END $$;