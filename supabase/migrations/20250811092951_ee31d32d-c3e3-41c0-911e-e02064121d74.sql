-- Create helper function for updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Tables
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

-- Triggers (create if missing)
do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_immobilien_updated_at') then
    create trigger trg_immobilien_updated_at before update on public.immobilien for each row execute function public.update_updated_at_column();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_mieter_updated_at') then
    create trigger trg_mieter_updated_at before update on public.mieter for each row execute function public.update_updated_at_column();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_dokumente_updated_at') then
    create trigger trg_dokumente_updated_at before update on public.dokumente for each row execute function public.update_updated_at_column();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_vertraege_updated_at') then
    create trigger trg_vertraege_updated_at before update on public.vertraege for each row execute function public.update_updated_at_column();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_finanzbuchungen_updated_at') then
    create trigger trg_finanzbuchungen_updated_at before update on public.finanzbuchungen for each row execute function public.update_updated_at_column();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_wartung_updated_at') then
    create trigger trg_wartung_updated_at before update on public.wartung_maengel for each row execute function public.update_updated_at_column();
  end if;
end $$;

-- Enable RLS
alter table public.immobilien enable row level security;
alter table public.mieter enable row level security;
alter table public.dokumente enable row level security;
alter table public.vertraege enable row level security;
alter table public.finanzbuchungen enable row level security;
alter table public.wartung_maengel enable row level security;

-- Policies (idempotent)
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='immobilien' and policyname='Authenticated select immobilien') then
    create policy "Authenticated select immobilien" on public.immobilien for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='immobilien' and policyname='Authenticated insert immobilien') then
    create policy "Authenticated insert immobilien" on public.immobilien for insert to authenticated with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='immobilien' and policyname='Authenticated update immobilien') then
    create policy "Authenticated update immobilien" on public.immobilien for update to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='immobilien' and policyname='Authenticated delete immobilien') then
    create policy "Authenticated delete immobilien" on public.immobilien for delete to authenticated using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='mieter' and policyname='Authenticated select mieter') then
    create policy "Authenticated select mieter" on public.mieter for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='mieter' and policyname='Authenticated insert mieter') then
    create policy "Authenticated insert mieter" on public.mieter for insert to authenticated with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='mieter' and policyname='Authenticated update mieter') then
    create policy "Authenticated update mieter" on public.mieter for update to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='mieter' and policyname='Authenticated delete mieter') then
    create policy "Authenticated delete mieter" on public.mieter for delete to authenticated using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='dokumente' and policyname='Authenticated select dokumente') then
    create policy "Authenticated select dokumente" on public.dokumente for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='dokumente' and policyname='Authenticated insert dokumente') then
    create policy "Authenticated insert dokumente" on public.dokumente for insert to authenticated with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='dokumente' and policyname='Authenticated update dokumente') then
    create policy "Authenticated update dokumente" on public.dokumente for update to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='dokumente' and policyname='Authenticated delete dokumente') then
    create policy "Authenticated delete dokumente" on public.dokumente for delete to authenticated using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='vertraege' and policyname='Authenticated select vertraege') then
    create policy "Authenticated select vertraege" on public.vertraege for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='vertraege' and policyname='Authenticated insert vertraege') then
    create policy "Authenticated insert vertraege" on public.vertraege for insert to authenticated with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='vertraege' and policyname='Authenticated update vertraege') then
    create policy "Authenticated update vertraege" on public.vertraege for update to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='vertraege' and policyname='Authenticated delete vertraege') then
    create policy "Authenticated delete vertraege" on public.vertraege for delete to authenticated using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='finanzbuchungen' and policyname='Authenticated select finanzbuchungen') then
    create policy "Authenticated select finanzbuchungen" on public.finanzbuchungen for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='finanzbuchungen' and policyname='Authenticated insert finanzbuchungen') then
    create policy "Authenticated insert finanzbuchungen" on public.finanzbuchungen for insert to authenticated with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='finanzbuchungen' and policyname='Authenticated update finanzbuchungen') then
    create policy "Authenticated update finanzbuchungen" on public.finanzbuchungen for update to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='finanzbuchungen' and policyname='Authenticated delete finanzbuchungen') then
    create policy "Authenticated delete finanzbuchungen" on public.finanzbuchungen for delete to authenticated using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='wartung_maengel' and policyname='Authenticated select wartung_maengel') then
    create policy "Authenticated select wartung_maengel" on public.wartung_maengel for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='wartung_maengel' and policyname='Authenticated insert wartung_maengel') then
    create policy "Authenticated insert wartung_maengel" on public.wartung_maengel for insert to authenticated with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='wartung_maengel' and policyname='Authenticated update wartung_maengel') then
    create policy "Authenticated update wartung_maengel" on public.wartung_maengel for update to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='wartung_maengel' and policyname='Authenticated delete wartung_maengel') then
    create policy "Authenticated delete wartung_maengel" on public.wartung_maengel for delete to authenticated using (true);
  end if;
end $$;

-- Realtime
alter table public.immobilien replica identity full;
alter table public.mieter replica identity full;
alter table public.dokumente replica identity full;
alter table public.vertraege replica identity full;
alter table public.finanzbuchungen replica identity full;
alter table public.wartung_maengel replica identity full;

do $$ begin
  if not exists (select 1 from pg_publication where pubname='supabase_realtime') then
    create publication supabase_realtime;
  end if;
  begin
    alter publication supabase_realtime add table public.immobilien;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.mieter;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.dokumente;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.vertraege;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.finanzbuchungen;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.wartung_maengel;
  exception when duplicate_object then null; end;
end $$;

-- Seed demo data (idempotent)
insert into public.immobilien (bezeichnung, adresse, plz, ort, art, zimmer, flaeche, kaltmiete, nebenkosten, status)
select 'Musterstraße 1 – Whg 3', 'Musterstraße 1', '10115', 'Berlin', 'Wohnung', 2, 55, 850, 200, 'Vermietet'
where not exists (select 1 from public.immobilien where bezeichnung = 'Musterstraße 1 – Whg 3');

insert into public.immobilien (bezeichnung, adresse, plz, ort, art, zimmer, flaeche, kaltmiete, nebenkosten, status)
select 'Beispielallee 5 – Haus', 'Beispielallee 5', '20095', 'Hamburg', 'Haus', 5, 140, 1850, 350, 'Verfügbar'
where not exists (select 1 from public.immobilien where bezeichnung = 'Beispielallee 5 – Haus');

insert into public.immobilien (bezeichnung, adresse, plz, ort, art, zimmer, flaeche, kaltmiete, nebenkosten, status)
select 'Gewerbepark 7 – Büro 2', 'Gewerbepark 7', '80331', 'München', 'Gewerbe', 3, 90, 2200, 450, 'Wartung'
where not exists (select 1 from public.immobilien where bezeichnung = 'Gewerbepark 7 – Büro 2');

insert into public.mieter (anrede, vorname, nachname, email, telefon, immobilie_id, status)
select 'Herr','Max','Mustermann','max@example.com','+49 170 0000001', (select id from public.immobilien where bezeichnung='Musterstraße 1 – Whg 3' limit 1), 'Aktiv'
where not exists (select 1 from public.mieter where email='max@example.com');

insert into public.mieter (anrede, vorname, nachname, email, telefon, immobilie_id, status)
select 'Frau','Erika','Muster','erika@example.com','+49 170 0000002', null, 'Aktiv'
where not exists (select 1 from public.mieter where email='erika@example.com');

insert into public.mieter (anrede, vorname, nachname, email, telefon, immobilie_id, status)
select 'Herr','Peter','Schmidt','peter@example.com','+49 170 0000003', (select id from public.immobilien where bezeichnung='Musterstraße 1 – Whg 3' limit 1), 'Aktiv'
where not exists (select 1 from public.mieter where email='peter@example.com');

insert into public.mieter (anrede, vorname, nachname, email, telefon, immobilie_id, status)
select 'Frau','Julia','Meier','julia@example.com','+49 170 0000004', (select id from public.immobilien where bezeichnung='Beispielallee 5 – Haus' limit 1), 'Gekündigt'
where not exists (select 1 from public.mieter where email='julia@example.com');

insert into public.mieter (anrede, vorname, nachname, email, telefon, immobilie_id, status)
select 'Herr','Lukas','Fischer','lukas@example.com','+49 170 0000005', null, 'Ausgezogen'
where not exists (select 1 from public.mieter where email='lukas@example.com');

insert into public.vertraege (mietvertrags_id, immobilie_id, mieter_id, mietbeginn, mietende, kaltmiete, nebenkosten, zahlungsintervall, kuendigungsfrist, status)
select 'MV-1001',
       (select id from public.immobilien where bezeichnung='Musterstraße 1 – Whg 3' limit 1),
       (select id from public.mieter where email='max@example.com' limit 1),
       now() - interval '8 months', now() + interval '30 days', 850, 200, 'monatlich', '3 Monate', 'aktiv'
where not exists (select 1 from public.vertraege where mietvertrags_id='MV-1001');

insert into public.vertraege (mietvertrags_id, immobilie_id, mieter_id, mietbeginn, mietende, kaltmiete, nebenkosten, zahlungsintervall, kuendigungsfrist, status)
select 'MV-1002',
       (select id from public.immobilien where bezeichnung='Musterstraße 1 – Whg 3' limit 1),
       (select id from public.mieter where email='peter@example.com' limit 1),
       now() - interval '18 months', now() + interval '90 days', 850, 200, 'monatlich', '3 Monate', 'aktiv'
where not exists (select 1 from public.vertraege where mietvertrags_id='MV-1002');

insert into public.vertraege (mietvertrags_id, immobilie_id, mieter_id, mietbeginn, mietende, kaltmiete, nebenkosten, zahlungsintervall, kuendigungsfrist, status)
select 'MV-1003',
       (select id from public.immobilien where bezeichnung='Musterstraße 1 – Whg 3' limit 1),
       (select id from public.mieter where email='max@example.com' limit 1),
       now() - interval '26 months', now() - interval '20 days', 850, 200, 'monatlich', '3 Monate', 'abgelaufen'
where not exists (select 1 from public.vertraege where mietvertrags_id='MV-1003');

insert into public.finanzbuchungen (immobilie_id, art, kategorie, betrag, datum, beschreibung, status)
select (select id from public.immobilien where bezeichnung='Musterstraße 1 – Whg 3' limit 1), 'Miete', 'Einnahme', 850, now() - interval '2 days', 'Miete Juli', 'Bezahlt'
where not exists (select 1 from public.finanzbuchungen where beschreibung='Miete Juli');

insert into public.finanzbuchungen (immobilie_id, art, kategorie, betrag, datum, beschreibung, status)
select (select id from public.immobilien where bezeichnung='Musterstraße 1 – Whg 3' limit 1), 'Nebenkosten', 'Einnahme', 200, now() - interval '1 days', 'Nebenkosten Juli', 'Bezahlt'
where not exists (select 1 from public.finanzbuchungen where beschreibung='Nebenkosten Juli');

insert into public.finanzbuchungen (immobilie_id, art, kategorie, betrag, datum, beschreibung, status)
select (select id from public.immobilien where bezeichnung='Musterstraße 1 – Whg 3' limit 1), 'Miete', 'Einnahme', 850, now() - interval '33 days', 'Miete Juni', 'Überfällig'
where not exists (select 1 from public.finanzbuchungen where beschreibung='Miete Juni');

insert into public.finanzbuchungen (immobilie_id, art, kategorie, betrag, datum, beschreibung, status)
select (select id from public.immobilien where bezeichnung='Musterstraße 1 – Whg 3' limit 1), 'Reparatur', 'Ausgabe', 120, now() - interval '10 days', 'Klempner', 'Bezahlt'
where not exists (select 1 from public.finanzbuchungen where beschreibung='Klempner');

insert into public.wartung_maengel (immobilie_id, titel, beschreibung, kategorie, prioritaet, status, kosten_geschaetzt)
select (select id from public.immobilien where bezeichnung='Gewerbepark 7 – Büro 2' limit 1), 'Heizung prüfen', 'Anomalie bei Heizkreisen, Termin vereinbaren', 'Wartung', 'Normal', 'In Bearbeitung', 250
where not exists (select 1 from public.wartung_maengel where titel='Heizung prüfen');

insert into public.wartung_maengel (immobilie_id, titel, beschreibung, kategorie, prioritaet, status, kosten_geschaetzt)
select (select id from public.immobilien where bezeichnung='Gewerbepark 7 – Büro 2' limit 1), 'Wasserleck Keller', 'Feuchtigkeit sichtbar, Ursache klären', 'Reparatur', 'Hoch', 'Gemeldet', 400
where not exists (select 1 from public.wartung_maengel where titel='Wasserleck Keller');

insert into public.dokumente (titel, kategorie, dateiname, "dateigröße", content_base64)
select 'Mietvertrag Muster', 'Mietvertrag', 'mietvertrag.pdf', 0, null
where not exists (select 1 from public.dokumente where titel='Mietvertrag Muster');

insert into public.dokumente (titel, kategorie, dateiname, "dateigröße", content_base64)
select 'Kündigungsschreiben', 'Kündigung', 'kuendigung.pdf', 0, null
where not exists (select 1 from public.dokumente where titel='Kündigungsschreiben');