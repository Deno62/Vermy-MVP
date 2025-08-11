-- Create helper function for updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- IMMOBILIEN
create table if not exists public.immobilien (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version int not null default 1,
  bezeichnung text not null,
  adresse text not null,
  plz text,
  ort text,
  art text not null,
  zimmer int not null,
  flaeche numeric,
  baujahr int,
  kaltmiete numeric,
  nebenkosten numeric,
  kaution numeric,
  status text not null,
  beschreibung text,
  energieausweis text
);
create trigger trg_immobilien_updated_at before update on public.immobilien for each row execute function public.update_updated_at_column();

-- MIETER
create table if not exists public.mieter (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version int not null default 1,
  anrede text not null,
  vorname text not null,
  nachname text not null,
  email text not null,
  telefon text not null,
  immobilie_id uuid references public.immobilien(id) on delete set null,
  einzugsdatum timestamptz,
  auszugsdatum timestamptz,
  status text not null,
  notizen text
);
create trigger trg_mieter_updated_at before update on public.mieter for each row execute function public.update_updated_at_column();

-- DOKUMENTE
create table if not exists public.dokumente (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version int not null default 1,
  immobilie_id uuid references public.immobilien(id) on delete set null,
  mieter_id uuid references public.mieter(id) on delete set null,
  vertrag_id uuid,
  titel text not null,
  kategorie text not null,
  dateiname text,
  "dateigröße" bigint,
  dateipfad text,
  content_base64 text,
  notizen text
);
create trigger trg_dokumente_updated_at before update on public.dokumente for each row execute function public.update_updated_at_column();

-- VERTRAEGE
create table if not exists public.vertraege (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version int not null default 1,
  mietvertrags_id text not null unique,
  immobilie_id uuid not null references public.immobilien(id) on delete cascade,
  mieter_id uuid not null references public.mieter(id) on delete cascade,
  mietbeginn timestamptz not null,
  mietende timestamptz,
  kaltmiete numeric not null,
  nebenkosten numeric not null,
  zahlungsintervall text not null,
  kuendigungsfrist text not null,
  status text not null,
  dokument_id uuid references public.dokumente(id) on delete set null,
  notizen text
);
create trigger trg_vertraege_updated_at before update on public.vertraege for each row execute function public.update_updated_at_column();

-- FINANZBUCHUNGEN (Zahlungen/Buchungen)
create table if not exists public.finanzbuchungen (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version int not null default 1,
  immobilie_id uuid not null references public.immobilien(id) on delete cascade,
  mieter_id uuid references public.mieter(id) on delete set null,
  art text not null,
  kategorie text not null,
  betrag numeric not null,
  datum timestamptz not null,
  beschreibung text not null,
  referenz text,
  status text not null
);
create trigger trg_finanzbuchungen_updated_at before update on public.finanzbuchungen for each row execute function public.update_updated_at_column();

-- WARTUNG & MAENGEL
create table if not exists public.wartung_maengel (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  version int not null default 1,
  immobilie_id uuid not null references public.immobilien(id) on delete cascade,
  mieter_id uuid references public.mieter(id) on delete set null,
  titel text not null,
  beschreibung text,
  kategorie text not null,
  prioritaet text not null,
  status text not null,
  kosten_geschaetzt numeric,
  kosten_tatsaechlich numeric,
  beauftragt_am timestamptz,
  erledigt_am timestamptz
);
create trigger trg_wartung_updated_at before update on public.wartung_maengel for each row execute function public.update_updated_at_column();

-- Enable RLS
alter table public.immobilien enable row level security;
alter table public.mieter enable row level security;
alter table public.dokumente enable row level security;
alter table public.vertraege enable row level security;
alter table public.finanzbuchungen enable row level security;
alter table public.wartung_maengel enable row level security;

-- Policies: allow all authenticated users full access
create policy "Authenticated select immobilien" on public.immobilien for select to authenticated using (true);
create policy "Authenticated insert immobilien" on public.immobilien for insert to authenticated with check (true);
create policy "Authenticated update immobilien" on public.immobilien for update to authenticated using (true) with check (true);
create policy "Authenticated delete immobilien" on public.immobilien for delete to authenticated using (true);

create policy "Authenticated select mieter" on public.mieter for select to authenticated using (true);
create policy "Authenticated insert mieter" on public.mieter for insert to authenticated with check (true);
create policy "Authenticated update mieter" on public.mieter for update to authenticated using (true) with check (true);
create policy "Authenticated delete mieter" on public.mieter for delete to authenticated using (true);

create policy "Authenticated select dokumente" on public.dokumente for select to authenticated using (true);
create policy "Authenticated insert dokumente" on public.dokumente for insert to authenticated with check (true);
create policy "Authenticated update dokumente" on public.dokumente for update to authenticated using (true) with check (true);
create policy "Authenticated delete dokumente" on public.dokumente for delete to authenticated using (true);

create policy "Authenticated select vertraege" on public.vertraege for select to authenticated using (true);
create policy "Authenticated insert vertraege" on public.vertraege for insert to authenticated with check (true);
create policy "Authenticated update vertraege" on public.vertraege for update to authenticated using (true) with check (true);
create policy "Authenticated delete vertraege" on public.vertraege for delete to authenticated using (true);

create policy "Authenticated select finanzbuchungen" on public.finanzbuchungen for select to authenticated using (true);
create policy "Authenticated insert finanzbuchungen" on public.finanzbuchungen for insert to authenticated with check (true);
create policy "Authenticated update finanzbuchungen" on public.finanzbuchungen for update to authenticated using (true) with check (true);
create policy "Authenticated delete finanzbuchungen" on public.finanzbuchungen for delete to authenticated using (true);

create policy "Authenticated select wartung_maengel" on public.wartung_maengel for select to authenticated using (true);
create policy "Authenticated insert wartung_maengel" on public.wartung_maengel for insert to authenticated with check (true);
create policy "Authenticated update wartung_maengel" on public.wartung_maengel for update to authenticated using (true) with check (true);
create policy "Authenticated delete wartung_maengel" on public.wartung_maengel for delete to authenticated using (true);

-- Realtime
alter table public.immobilien replica identity full;
alter table public.mieter replica identity full;
alter table public.dokumente replica identity full;
alter table public.vertraege replica identity full;
alter table public.finanzbuchungen replica identity full;
alter table public.wartung_maengel replica identity full;

-- Add to realtime publication
-- If publication exists, these will be no-ops for already added tables
begin;
  -- Ensure publication exists
  do $$ begin
    perform 1 from pg_publication where pubname = 'supabase_realtime';
    if not found then
      create publication supabase_realtime;
    end if;
  end $$;
  alter publication supabase_realtime add table public.immobilien;
  alter publication supabase_realtime add table public.mieter;
  alter publication supabase_realtime add table public.dokumente;
  alter publication supabase_realtime add table public.vertraege;
  alter publication supabase_realtime add table public.finanzbuchungen;
  alter publication supabase_realtime add table public.wartung_maengel;
commit;

-- Seed demo data
insert into public.immobilien (id, bezeichnung, adresse, plz, ort, art, zimmer, flaeche, kaltmiete, nebenkosten, status)
values
  (gen_random_uuid(), 'Musterstraße 1 – Whg 3', 'Musterstraße 1', '10115', 'Berlin', 'Wohnung', 2, 55, 850, 200, 'Vermietet'),
  (gen_random_uuid(), 'Beispielallee 5 – Haus', 'Beispielallee 5', '20095', 'Hamburg', 'Haus', 5, 140, 1850, 350, 'Verfügbar'),
  (gen_random_uuid(), 'Gewerbepark 7 – Büro 2', 'Gewerbepark 7', '80331', 'München', 'Gewerbe', 3, 90, 2200, 450, 'Wartung')
returning id, bezeichnung into temporary table _immos;

-- Map immobile ids
with im as (
  select (array_agg(id))[1] as i1, (array_agg(id))[2] as i2, (array_agg(id))[3] as i3 from _immos
)
insert into public.mieter (anrede, vorname, nachname, email, telefon, immobilie_id, status)
select * from (
  values
    ('Herr','Max','Mustermann','max@example.com','+49 170 0000001',(select i1 from im),'Aktiv'),
    ('Frau','Erika','Muster','erika@example.com','+49 170 0000002',null,'Aktiv'),
    ('Herr','Peter','Schmidt','peter@example.com','+49 170 0000003',(select i1 from im),'Aktiv'),
    ('Frau','Julia','Meier','julia@example.com','+49 170 0000004',(select i2 from im),'Gekündigt'),
    ('Herr','Lukas','Fischer','lukas@example.com','+49 170 0000005',null,'Ausgezogen')
) as t(anrede,vorname,nachname,email,telefon,immobilie_id,status)
returning id into temporary table _mieter;

with im as (select (array_agg(id))[1] as i1 from _immos),
     mi as (select (array_agg(id))[1] as m1 from _mieter)
insert into public.vertraege (mietvertrags_id, immobilie_id, mieter_id, mietbeginn, mietende, kaltmiete, nebenkosten, zahlungsintervall, kuendigungsfrist, status)
values
  ('MV-1001', (select i1 from im), (select m1 from mi), now() - interval '8 months', now() + interval '30 days', 850, 200, 'monatlich', '3 Monate', 'aktiv'),
  ('MV-1002', (select i1 from im), (select m1 from mi), now() - interval '18 months', now() + interval '90 days', 850, 200, 'monatlich', '3 Monate', 'aktiv'),
  ('MV-1003', (select i1 from im), (select m1 from mi), now() - interval '26 months', now() - interval '20 days', 850, 200, 'monatlich', '3 Monate', 'abgelaufen');

-- Zahlungen/Finanzbuchungen (inkl. überfällig)
with im as (select (array_agg(id))[1] as i1 from _immos)
insert into public.finanzbuchungen (immobilie_id, art, kategorie, betrag, datum, beschreibung, status)
values
  ((select i1 from im), 'Miete', 'Einnahme', 850, now() - interval '2 days', 'Miete Juli', 'Bezahlt'),
  ((select i1 from im), 'Nebenkosten', 'Einnahme', 200, now() - interval '1 days', 'Nebenkosten Juli', 'Bezahlt'),
  ((select i1 from im), 'Miete', 'Einnahme', 850, now() - interval '33 days', 'Miete Juni', 'Überfällig'),
  ((select i1 from im), 'Reparatur', 'Ausgabe', 120, now() - interval '10 days', 'Klempner', 'Bezahlt');

-- Wartung
with im as (select (array_agg(id))[3] as i3 from _immos)
insert into public.wartung_maengel (immobilie_id, titel, beschreibung, kategorie, prioritaet, status, kosten_geschaetzt)
values
  ((select i3 from im), 'Heizung prüfen', 'Anomalie bei Heizkreisen, Termin vereinbaren', 'Wartung', 'Normal', 'In Bearbeitung', 250),
  ((select i3 from im), 'Wasserleck Keller', 'Feuchtigkeit sichtbar, Ursache klären', 'Reparatur', 'Hoch', 'Gemeldet', 400);

-- Dokumente
insert into public.dokumente (titel, kategorie, dateiname, "dateigröße", content_base64)
values
  ('Mietvertrag Muster', 'Mietvertrag', 'mietvertrag.pdf', 0, null),
  ('Kündigungsschreiben', 'Kündigung', 'kuendigung.pdf', 0, null);

-- RLS policies are permissive for authenticated; remember to configure Auth settings (Site URL & Redirects) for login flows.