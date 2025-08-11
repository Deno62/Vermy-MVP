-- Vermy MVP DB pass: idempotent schema updates + seeds
-- 1) Immobilien: self-reference and computed typ
ALTER TABLE public.immobilien
  ADD COLUMN IF NOT EXISTS parent_id uuid NULL;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_immobilien_parent_id'
  ) THEN
    ALTER TABLE public.immobilien
    ADD CONSTRAINT fk_immobilien_parent_id
    FOREIGN KEY (parent_id) REFERENCES public.immobilien(id) ON DELETE SET NULL;
  END IF;
END $$;

-- typ as hierarchy indicator (Haus/Wohnung) derived from parent_id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='immobilien' AND column_name='typ'
  ) THEN
    ALTER TABLE public.immobilien
    ADD COLUMN typ text GENERATED ALWAYS AS (
      CASE WHEN parent_id IS NULL THEN 'Haus'::text ELSE 'Wohnung'::text END
    ) STORED;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_immobilien_parent_id ON public.immobilien(parent_id);
CREATE INDEX IF NOT EXISTS idx_immobilien_typ ON public.immobilien(typ);

-- 2) Mieter: link to Immobilie + Hauptmieter flag
ALTER TABLE public.mieter
  ADD COLUMN IF NOT EXISTS immobilie_id uuid NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_mieter_immobilie_id') THEN
    ALTER TABLE public.mieter
    ADD CONSTRAINT fk_mieter_immobilie_id FOREIGN KEY (immobilie_id) REFERENCES public.immobilien(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE public.mieter
  ADD COLUMN IF NOT EXISTS hauptmieter boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_mieter_immobilien_id ON public.mieter(immobilie_id);

-- 3) Vertraege: ensure FKs
ALTER TABLE public.vertraege
  ADD COLUMN IF NOT EXISTS immobilien_id uuid,
  ADD COLUMN IF NOT EXISTS mieter_id uuid;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_vertraege_immobilien_id') THEN
    ALTER TABLE public.vertraege
    ADD CONSTRAINT fk_vertraege_immobilien_id FOREIGN KEY (immobilien_id) REFERENCES public.immobilien(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_vertraege_mieter_id') THEN
    ALTER TABLE public.vertraege
    ADD CONSTRAINT fk_vertraege_mieter_id FOREIGN KEY (mieter_id) REFERENCES public.mieter(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_vertraege_immobilien_id ON public.vertraege(immobilien_id);
CREATE INDEX IF NOT EXISTS idx_vertraege_mieter_id ON public.vertraege(mieter_id);

-- 4) Zahlungen: monthly ledger for KPIs
CREATE TABLE IF NOT EXISTS public.zahlungen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz NULL,
  version integer NOT NULL DEFAULT 1,
  vertrag_id uuid NOT NULL,
  mieter_id uuid NULL,
  monat text NOT NULL,
  betrag numeric NOT NULL,
  status text NOT NULL,
  bezahlt_am timestamptz NULL,
  CONSTRAINT chk_zahlungen_status CHECK (status IN ('bezahlt','offen','überfällig'))
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_zahlungen_vertrag') THEN
    ALTER TABLE public.zahlungen
    ADD CONSTRAINT fk_zahlungen_vertrag FOREIGN KEY (vertrag_id) REFERENCES public.vertraege(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_zahlungen_mieter') THEN
    ALTER TABLE public.zahlungen
    ADD CONSTRAINT fk_zahlungen_mieter FOREIGN KEY (mieter_id) REFERENCES public.mieter(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_zahlungen_vertrag_id ON public.zahlungen(vertrag_id);
CREATE INDEX IF NOT EXISTS idx_zahlungen_mieter_id ON public.zahlungen(mieter_id);
CREATE INDEX IF NOT EXISTS idx_zahlungen_status ON public.zahlungen(status);

-- 5) Wartung (use existing wartung_maengel): FK + checks + indexes
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_wartung_maengel_immobilie') THEN
    ALTER TABLE public.wartung_maengel
    ADD CONSTRAINT fk_wartung_maengel_immobilie FOREIGN KEY (immobilie_id) REFERENCES public.immobilien(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Allow both legacy and new value sets to avoid breaking existing data
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='chk_wartung_prioritaet') THEN
    ALTER TABLE public.wartung_maengel
    ADD CONSTRAINT chk_wartung_prioritaet CHECK (lower(prioritaet) IN ('niedrig','mittel','hoch','normal','dringend'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='chk_wartung_status') THEN
    ALTER TABLE public.wartung_maengel
    ADD CONSTRAINT chk_wartung_status CHECK (lower(status) IN ('offen','in bearbeitung','erledigt','gemeldet','verschoben'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_wartung_immobilien_id ON public.wartung_maengel(immobilie_id);
CREATE INDEX IF NOT EXISTS idx_wartung_status ON public.wartung_maengel(status);
CREATE INDEX IF NOT EXISTS idx_wartung_prioritaet ON public.wartung_maengel(prioritaet);

-- 6) Dokumente: extra linking fields
ALTER TABLE public.dokumente
  ADD COLUMN IF NOT EXISTS bezug_typ text,
  ADD COLUMN IF NOT EXISTS bezug_id uuid,
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS mime_type text,
  ADD COLUMN IF NOT EXISTS data_base64 text,
  ADD COLUMN IF NOT EXISTS erstellt_am timestamptz NOT NULL DEFAULT now();

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='chk_dokumente_bezug_typ') THEN
    ALTER TABLE public.dokumente
    ADD CONSTRAINT chk_dokumente_bezug_typ CHECK (bezug_typ IS NULL OR bezug_typ IN ('immobilie','mieter','vertrag'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_dokumente_bezug ON public.dokumente(bezug_typ, bezug_id);

-- 7) RLS for new table (keep permissive for MVP)
ALTER TABLE public.zahlungen ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated select zahlungen') THEN
    CREATE POLICY "Authenticated select zahlungen" ON public.zahlungen FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated insert zahlungen') THEN
    CREATE POLICY "Authenticated insert zahlungen" ON public.zahlungen FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated update zahlungen') THEN
    CREATE POLICY "Authenticated update zahlungen" ON public.zahlungen FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated delete zahlungen') THEN
    CREATE POLICY "Authenticated delete zahlungen" ON public.zahlungen FOR DELETE USING (true);
  END IF;
END $$;

-- 8) updated_at triggers
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_immobilien_updated_at') THEN
    CREATE TRIGGER trg_immobilien_updated_at BEFORE UPDATE ON public.immobilien FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_mieter_updated_at') THEN
    CREATE TRIGGER trg_mieter_updated_at BEFORE UPDATE ON public.mieter FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_vertraege_updated_at') THEN
    CREATE TRIGGER trg_vertraege_updated_at BEFORE UPDATE ON public.vertraege FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_wartung_maengel_updated_at') THEN
    CREATE TRIGGER trg_wartung_maengel_updated_at BEFORE UPDATE ON public.wartung_maengel FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_dokumente_updated_at') THEN
    CREATE TRIGGER trg_dokumente_updated_at BEFORE UPDATE ON public.dokumente FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_zahlungen_updated_at') THEN
    CREATE TRIGGER trg_zahlungen_updated_at BEFORE UPDATE ON public.zahlungen FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_finanzbuchungen_updated_at') THEN
    CREATE TRIGGER trg_finanzbuchungen_updated_at BEFORE UPDATE ON public.finanzbuchungen FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 9) Seed data (idempotent)
DO $$
DECLARE
  v_haus_a uuid;
  v_haus_b uuid;
  v_whg_a1 uuid;
  v_whg_a2 uuid;
  v_mieter_a1_haupt uuid;
  v_mieter_a1_mit uuid;
  v_mieter_haus_b uuid;
  v_vertrag_a1 uuid;
  v_vertrag_a2 uuid;
  v_vertrag_b uuid;
  v_today date := current_date;
  i int;
BEGIN
  -- Haus A
  SELECT id INTO v_haus_a FROM public.immobilien WHERE bezeichnung = 'Haus A' LIMIT 1;
  IF v_haus_a IS NULL THEN
    INSERT INTO public.immobilien (bezeichnung, adresse, plz, ort, art, zimmer, flaeche, status)
    VALUES ('Haus A', 'Musterstraße 1', '10115', 'Berlin', 'Haus', 0, 0, 'Verfügbar')
    RETURNING id INTO v_haus_a;
  END IF;

  -- Wohnung A1
  SELECT id INTO v_whg_a1 FROM public.immobilien WHERE bezeichnung = 'Wohnung A1' LIMIT 1;
  IF v_whg_a1 IS NULL THEN
    INSERT INTO public.immobilien (bezeichnung, adresse, plz, ort, art, zimmer, flaeche, status, parent_id, kaltmiete, nebenkosten)
    VALUES ('Wohnung A1', 'Musterstraße 1', '10115', 'Berlin', 'Wohnung', 3, 72, 'Vermietet', v_haus_a, 950, 250)
    RETURNING id INTO v_whg_a1;
  END IF;

  -- Wohnung A2
  SELECT id INTO v_whg_a2 FROM public.immobilien WHERE bezeichnung = 'Wohnung A2' LIMIT 1;
  IF v_whg_a2 IS NULL THEN
    INSERT INTO public.immobilien (bezeichnung, adresse, plz, ort, art, zimmer, flaeche, status, parent_id, kaltmiete, nebenkosten)
    VALUES ('Wohnung A2', 'Musterstraße 1', '10115', 'Berlin', 'Wohnung', 2, 58, 'Vermietet', v_haus_a, 780, 200)
    RETURNING id INTO v_whg_a2;
  END IF;

  -- Haus B
  SELECT id INTO v_haus_b FROM public.immobilien WHERE bezeichnung = 'Haus B' LIMIT 1;
  IF v_haus_b IS NULL THEN
    INSERT INTO public.immobilien (bezeichnung, adresse, plz, ort, art, zimmer, flaeche, status)
    VALUES ('Haus B', 'Beispielweg 5', '80331', 'München', 'Haus', 0, 0, 'Verfügbar')
    RETURNING id INTO v_haus_b;
  END IF;

  -- Mieter: Haupt + Mitmieter for A1
  SELECT id INTO v_mieter_a1_haupt FROM public.mieter WHERE email = 'anna.haupt@example.com' LIMIT 1;
  IF v_mieter_a1_haupt IS NULL THEN
    INSERT INTO public.mieter (anrede, vorname, nachname, email, telefon, immobilie_id, status, einzugsdatum, hauptmieter)
    VALUES ('Frau', 'Anna', 'Haupt', 'anna.haupt@example.com', '+49 30 123456', v_whg_a1, 'Aktiv', (v_today - INTERVAL '18 months'), true)
    RETURNING id INTO v_mieter_a1_haupt;
  END IF;

  SELECT id INTO v_mieter_a1_mit FROM public.mieter WHERE email = 'max.neben@example.com' LIMIT 1;
  IF v_mieter_a1_mit IS NULL THEN
    INSERT INTO public.mieter (anrede, vorname, nachname, email, telefon, immobilie_id, status, einzugsdatum, hauptmieter)
    VALUES ('Herr', 'Max', 'Neben', 'max.neben@example.com', '+49 30 654321', v_whg_a1, 'Aktiv', (v_today - INTERVAL '12 months'), false)
    RETURNING id INTO v_mieter_a1_mit;
  END IF;

  -- Mieter on Haus B
  SELECT id INTO v_mieter_haus_b FROM public.mieter WHERE email = 'peter.hausb@example.com' LIMIT 1;
  IF v_mieter_haus_b IS NULL THEN
    INSERT INTO public.mieter (anrede, vorname, nachname, email, telefon, immobilie_id, status, einzugsdatum, hauptmieter)
    VALUES ('Herr', 'Peter', 'Hausb', 'peter.hausb@example.com', '+49 89 987654', v_haus_b, 'Aktiv', (v_today - INTERVAL '6 months'), true)
    RETURNING id INTO v_mieter_haus_b;
  END IF;

  -- Verträge
  SELECT id INTO v_vertrag_a1 FROM public.vertraege WHERE mietvertrags_id = 'V-A1-001' LIMIT 1;
  IF v_vertrag_a1 IS NULL THEN
    INSERT INTO public.vertraege (mietvertrags_id, immobilien_id, mieter_id, mietbeginn, kaltmiete, nebenkosten, zahlungsintervall, kuendigungsfrist, status, notizen)
    VALUES ('V-A1-001', v_whg_a1, v_mieter_a1_haupt, (v_today - INTERVAL '18 months'), 950, 250, 'monatlich', '3 Monate', 'aktiv', 'Vertrag für Wohnung A1')
    RETURNING id INTO v_vertrag_a1;
  END IF;

  SELECT id INTO v_vertrag_a2 FROM public.vertraege WHERE mietvertrags_id = 'V-A2-001' LIMIT 1;
  IF v_vertrag_a2 IS NULL THEN
    INSERT INTO public.vertraege (mietvertrags_id, immobilien_id, mieter_id, mietbeginn, mietende, kaltmiete, nebenkosten, zahlungsintervall, kuendigungsfrist, status, notizen)
    VALUES ('V-A2-001', v_whg_a2, v_mieter_a1_haupt, (v_today - INTERVAL '10 months'), (v_today + INTERVAL '45 days'), 780, 200, 'monatlich', '3 Monate', 'aktiv', 'Vertrag endet in <60 Tagen')
    RETURNING id INTO v_vertrag_a2;
  END IF;

  SELECT id INTO v_vertrag_b FROM public.vertraege WHERE mietvertrags_id = 'V-B-001' LIMIT 1;
  IF v_vertrag_b IS NULL THEN
    INSERT INTO public.vertraege (mietvertrags_id, immobilien_id, mieter_id, mietbeginn, kaltmiete, nebenkosten, zahlungsintervall, kuendigungsfrist, status, notizen)
    VALUES ('V-B-001', v_haus_b, v_mieter_haus_b, (v_today - INTERVAL '6 months'), 1200, 300, 'monatlich', '3 Monate', 'aktiv', 'Direkter Vertrag am Haus B')
    RETURNING id INTO v_vertrag_b;
  END IF;

  -- Zahlungen history for each vertrag
  FOR i IN 0..11 LOOP
    -- A1: paid incl. current month
    INSERT INTO public.zahlungen (vertrag_id, mieter_id, monat, betrag, status, bezahlt_am)
    SELECT v_vertrag_a1, v_mieter_a1_haupt, to_char((date_trunc('month', v_today) - (i || ' months')::interval), 'YYYY-MM'), 1200,
      'bezahlt',
      CASE WHEN i >= 1 THEN (date_trunc('month', v_today) - (i || ' months')::interval) + INTERVAL '5 days' ELSE now() END
    WHERE NOT EXISTS (
      SELECT 1 FROM public.zahlungen z WHERE z.vertrag_id = v_vertrag_a1 AND z.monat = to_char((date_trunc('month', v_today) - (i || ' months')::interval), 'YYYY-MM')
    );

    -- A2: one open (current), one overdue (last month), rest paid
    INSERT INTO public.zahlungen (vertrag_id, mieter_id, monat, betrag, status, bezahlt_am)
    SELECT v_vertrag_a2, v_mieter_a1_haupt, to_char((date_trunc('month', v_today) - (i || ' months')::interval), 'YYYY-MM'), 980,
      CASE 
        WHEN i = 0 THEN 'offen'
        WHEN i = 1 THEN 'überfällig'
        ELSE 'bezahlt'
      END,
      CASE WHEN i > 1 THEN (date_trunc('month', v_today) - (i || ' months')::interval) + INTERVAL '7 days' END
    WHERE NOT EXISTS (
      SELECT 1 FROM public.zahlungen z WHERE z.vertrag_id = v_vertrag_a2 AND z.monat = to_char((date_trunc('month', v_today) - (i || ' months')::interval), 'YYYY-MM')
    );

    -- B: all paid
    INSERT INTO public.zahlungen (vertrag_id, mieter_id, monat, betrag, status, bezahlt_am)
    SELECT v_vertrag_b, v_mieter_haus_b, to_char((date_trunc('month', v_today) - (i || ' months')::interval), 'YYYY-MM'), 1500, 'bezahlt',
      (date_trunc('month', v_today) - (i || ' months')::interval) + INTERVAL '3 days'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.zahlungen z WHERE z.vertrag_id = v_vertrag_b AND z.monat = to_char((date_trunc('month', v_today) - (i || ' months')::interval), 'YYYY-MM')
    );
  END LOOP;

  -- Wartung tickets
  IF NOT EXISTS (SELECT 1 FROM public.wartung_maengel WHERE titel = 'Heizung prüfen - A1') THEN
    INSERT INTO public.wartung_maengel (immobilie_id, titel, beschreibung, kategorie, prioritaet, status, faellig_am, created_at)
    VALUES (v_whg_a1, 'Heizung prüfen - A1', 'Anlagendruck niedrig, Wartung notwendig', 'Wartung', 'hoch', 'offen', (v_today + INTERVAL '7 days'), now());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.wartung_maengel WHERE titel = 'Wasserleck - Haus A') THEN
    INSERT INTO public.wartung_maengel (immobilie_id, titel, beschreibung, kategorie, prioritaet, status, created_at)
    VALUES (v_haus_a, 'Wasserleck - Haus A', 'Leck im Kellerbereich, Installateur beauftragt', 'Reparatur', 'mittel', 'in Bearbeitung', now());
  END IF;

  -- Dokumente minimal
  IF NOT EXISTS (SELECT 1 FROM public.dokumente WHERE titel = 'Dummy PNG' AND dateiname = 'dummy.png') THEN
    INSERT INTO public.dokumente (titel, dateiname, mime_type, content_base64, data_base64, name, bezug_typ, bezug_id, notizen)
    VALUES ('Dummy PNG', 'dummy.png', 'image/png', 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB', 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB', 'dummy.png', 'immobilie', v_haus_a, 'Kleiner Testanhang <5MB');
  END IF;
END $$;
