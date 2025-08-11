-- 1) Schema updates for hierarchy and statuses
-- Add parent_id to immobilien for Haus/Wohnung hierarchy
ALTER TABLE public.immobilien
  ADD COLUMN IF NOT EXISTS parent_id uuid NULL;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'immobilien_parent_fk' AND table_name='immobilien'
  ) THEN
    ALTER TABLE public.immobilien
      ADD CONSTRAINT immobilien_parent_fk
      FOREIGN KEY (parent_id)
      REFERENCES public.immobilien(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_immobilien_parent_id ON public.immobilien(parent_id);

-- Add bezahlt_am to finanzbuchungen
ALTER TABLE public.finanzbuchungen
  ADD COLUMN IF NOT EXISTS bezahlt_am timestamptz NULL;

-- Add faellig_am to wartung_maengel
ALTER TABLE public.wartung_maengel
  ADD COLUMN IF NOT EXISTS faellig_am timestamptz NULL;


-- 2) Triggers to maintain updated_at
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_update_immobilien_updated_at') THEN
    CREATE TRIGGER trg_update_immobilien_updated_at
    BEFORE UPDATE ON public.immobilien
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_update_finanzbuchungen_updated_at') THEN
    CREATE TRIGGER trg_update_finanzbuchungen_updated_at
    BEFORE UPDATE ON public.finanzbuchungen
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_update_mieter_updated_at') THEN
    CREATE TRIGGER trg_update_mieter_updated_at
    BEFORE UPDATE ON public.mieter
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_update_vertraege_updated_at') THEN
    CREATE TRIGGER trg_update_vertraege_updated_at
    BEFORE UPDATE ON public.vertraege
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_update_wartung_maengel_updated_at') THEN
    CREATE TRIGGER trg_update_wartung_maengel_updated_at
    BEFORE UPDATE ON public.wartung_maengel
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_update_dokumente_updated_at') THEN
    CREATE TRIGGER trg_update_dokumente_updated_at
    BEFORE UPDATE ON public.dokumente
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;


-- 3) Enable realtime for live KPI updates
ALTER TABLE public.immobilien REPLICA IDENTITY FULL;
ALTER TABLE public.mieter REPLICA IDENTITY FULL;
ALTER TABLE public.vertraege REPLICA IDENTITY FULL;
ALTER TABLE public.finanzbuchungen REPLICA IDENTITY FULL;
ALTER TABLE public.wartung_maengel REPLICA IDENTITY FULL;
ALTER TABLE public.dokumente REPLICA IDENTITY FULL;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.immobilien;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.mieter;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.vertraege;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.finanzbuchungen;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.wartung_maengel;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.dokumente;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
  END IF;
END $$;


-- 4) Seed data (idempotent via fixed UUIDs)
WITH
vars AS (
  SELECT 
    '00000000-0000-0000-0000-000000000101'::uuid AS haus_id,
    '00000000-0000-0000-0000-000000000111'::uuid AS whg1_id,
    '00000000-0000-0000-0000-000000000112'::uuid AS whg2_id,
    '00000000-0000-0000-0000-000000000113'::uuid AS whg3_id,
    '00000000-0000-0000-0000-000000000201'::uuid AS mieter1_id,
    '00000000-0000-0000-0000-000000000202'::uuid AS mieter2_id,
    '00000000-0000-0000-0000-000000000203'::uuid AS mieter3_id,
    '00000000-0000-0000-0000-000000000301'::uuid AS vertrag1_id,
    '00000000-0000-0000-0000-000000000302'::uuid AS vertrag2_id,
    '00000000-0000-0000-0000-000000000303'::uuid AS vertrag3_id,
    '00000000-0000-0000-0000-000000000401'::uuid AS zahl1_id,
    '00000000-0000-0000-0000-000000000402'::uuid AS zahl2_id,
    '00000000-0000-0000-0000-000000000403'::uuid AS zahl3_id,
    '00000000-0000-0000-0000-000000000501'::uuid AS wart1_id,
    '00000000-0000-0000-0000-000000000502'::uuid AS wart2_id,
    '00000000-0000-0000-0000-000000000601'::uuid AS dok1_id
),
ins_immobilien AS (
  INSERT INTO public.immobilien (id, bezeichnung, adresse, plz, ort, art, status, zimmer, flaeche, baujahr, kaltmiete, nebenkosten, kaution)
  VALUES
    ((SELECT haus_id FROM vars), 'Musterhaus', 'Hauptstraße 1', '10115', 'Berlin', 'Haus', 'verfügbar', 10, 240, 1998, NULL, NULL, NULL)
  ON CONFLICT (id) DO NOTHING
  RETURNING id
),
ins_wohnungen AS (
  INSERT INTO public.immobilien (id, bezeichnung, adresse, plz, ort, art, status, zimmer, flaeche, baujahr, kaltmiete, nebenkosten, kaution, parent_id)
  VALUES
    ((SELECT whg1_id FROM vars), 'Wohnung 1', 'Hauptstraße 1, Whg 1', '10115', 'Berlin', 'Wohnung', 'vermietet', 3, 75, 1998, 950, 250, 1900, (SELECT haus_id FROM vars)),
    ((SELECT whg2_id FROM vars), 'Wohnung 2', 'Hauptstraße 1, Whg 2', '10115', 'Berlin', 'Wohnung', 'vermietet', 2, 60, 1998, 800, 200, 1600, (SELECT haus_id FROM vars)),
    ((SELECT whg3_id FROM vars), 'Wohnung 3', 'Hauptstraße 1, Whg 3', '10115', 'Berlin', 'Wohnung', 'frei', 2, 58, 1998, 780, 180, 1560, (SELECT haus_id FROM vars))
  ON CONFLICT (id) DO NOTHING
  RETURNING id
),
ins_mieter AS (
  INSERT INTO public.mieter (id, anrede, vorname, nachname, email, telefon, status, immobilie_id, einzugsdatum, notizen)
  VALUES
    ((SELECT mieter1_id FROM vars), 'Herr', 'Max', 'Mustermann', 'max@example.com', '+49 30 123456', 'aktiv', (SELECT whg1_id FROM vars), now() - interval '2 years', 'Langzeitmieter'),
    ((SELECT mieter2_id FROM vars), 'Frau', 'Erika', 'Musterfrau', 'erika@example.com', '+49 30 654321', 'aktiv', (SELECT whg2_id FROM vars), now() - interval '1 year', NULL),
    ((SELECT mieter3_id FROM vars), 'Herr', 'Haus', 'Verwalter', 'haus@example.com', '+49 30 111222', 'aktiv', (SELECT haus_id FROM vars), now() - interval '6 months', 'Mietet gesamtes Haus')
  ON CONFLICT (id) DO NOTHING
  RETURNING id
),
ins_vertraege AS (
  INSERT INTO public.vertraege (id, mietvertrags_id, immobilie_id, mieter_id, mietbeginn, mietende, zahlungsintervall, kuendigungsfrist, kaltmiete, nebenkosten, status, notizen)
  VALUES
    ((SELECT vertrag1_id FROM vars), 'MV-1001', (SELECT whg1_id FROM vars), (SELECT mieter1_id FROM vars), (now() - interval '2 years')::timestamptz, NULL, 'monatlich', '3 Monate', 950, 250, 'aktiv', NULL),
    ((SELECT vertrag2_id FROM vars), 'MV-1002', (SELECT whg2_id FROM vars), (SELECT mieter2_id FROM vars), (now() - interval '1 year')::timestamptz, (now() + interval '30 days')::timestamptz, 'monatlich', '3 Monate', 800, 200, 'gekündigt', 'Endet in <60 Tagen'),
    ((SELECT vertrag3_id FROM vars), 'MV-HAUS-1', (SELECT haus_id FROM vars), (SELECT mieter3_id FROM vars), (now() - interval '6 months')::timestamptz, NULL, 'monatlich', '1 Monat', 2500, 500, 'aktiv', 'Hausvertrag')
  ON CONFLICT (id) DO NOTHING
  RETURNING id
),
ins_finanz AS (
  INSERT INTO public.finanzbuchungen (id, immobilie_id, mieter_id, kategorie, art, status, beschreibung, betrag, datum, bezahlt_am)
  VALUES
    ((SELECT zahl1_id FROM vars), (SELECT whg1_id FROM vars), (SELECT mieter1_id FROM vars), 'Miete', 'Einnahme', 'bezahlt', 'Miete Juli', 1200, date_trunc('month', now())::timestamptz, now() - interval '1 day'),
    ((SELECT zahl2_id FROM vars), (SELECT whg2_id FROM vars), (SELECT mieter2_id FROM vars), 'Miete', 'Einnahme', 'überfällig', 'Miete Juni', 1000, date_trunc('month', now())::timestamptz - interval '1 month', NULL),
    ((SELECT zahl3_id FROM vars), (SELECT haus_id FROM vars), (SELECT mieter3_id FROM vars), 'Heizung', 'Ausgabe', 'offen', 'Heizkosten', 600, now() - interval '10 days', NULL)
  ON CONFLICT (id) DO NOTHING
  RETURNING id
)
INSERT INTO public.wartung_maengel (id, immobilie_id, mieter_id, titel, beschreibung, kategorie, prioritaet, status, beauftragt_am, faellig_am, kosten_geschaetzt)
VALUES
  ((SELECT wart1_id FROM vars), (SELECT whg1_id FROM vars), (SELECT mieter1_id FROM vars), 'Wasserhahn tropft', 'Wasserhahn in Küche reparieren', 'Reparatur', 'mittel', 'offen', now() - interval '5 days', now() + interval '3 days', 80),
  ((SELECT wart2_id FROM vars), (SELECT haus_id FROM vars), NULL, 'Treppenhaus streichen', 'Treppenhaus neu streichen', 'Renovierung', 'hoch', 'in Bearbeitung', now() - interval '2 days', now() + interval '14 days', 1200)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.dokumente (id, titel, kategorie, dateiname, dateigröße, immobilie_id, mieter_id, vertrag_id, content_base64, notizen)
VALUES
  ('00000000-0000-0000-0000-000000000601'::uuid, 'Hausordnung', 'Dokument', 'hausordnung.txt', 24, '00000000-0000-0000-0000-000000000101'::uuid, NULL, NULL, encode(convert_to('Dies ist eine Demo-Datei', 'UTF8'), 'base64'), 'Demo')
ON CONFLICT (id) DO NOTHING;