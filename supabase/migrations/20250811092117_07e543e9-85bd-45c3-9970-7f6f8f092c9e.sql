-- Seed demo data (idempotent)
-- Immobilien
insert into public.immobilien (bezeichnung, adresse, plz, ort, art, zimmer, flaeche, kaltmiete, nebenkosten, status)
select 'Musterstraße 1 – Whg 3', 'Musterstraße 1', '10115', 'Berlin', 'Wohnung', 2, 55, 850, 200, 'Vermietet'
where not exists (select 1 from public.immobilien where bezeichnung = 'Musterstraße 1 – Whg 3');

insert into public.immobilien (bezeichnung, adresse, plz, ort, art, zimmer, flaeche, kaltmiete, nebenkosten, status)
select 'Beispielallee 5 – Haus', 'Beispielallee 5', '20095', 'Hamburg', 'Haus', 5, 140, 1850, 350, 'Verfügbar'
where not exists (select 1 from public.immobilien where bezeichnung = 'Beispielallee 5 – Haus');

insert into public.immobilien (bezeichnung, adresse, plz, ort, art, zimmer, flaeche, kaltmiete, nebenkosten, status)
select 'Gewerbepark 7 – Büro 2', 'Gewerbepark 7', '80331', 'München', 'Gewerbe', 3, 90, 2200, 450, 'Wartung'
where not exists (select 1 from public.immobilien where bezeichnung = 'Gewerbepark 7 – Büro 2');

-- Mieter (referencing immobilien by bezeichnung)
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

-- Verträge
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

-- Finanzbuchungen
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

-- Wartung
insert into public.wartung_maengel (immobilie_id, titel, beschreibung, kategorie, prioritaet, status, kosten_geschaetzt)
select (select id from public.immobilien where bezeichnung='Gewerbepark 7 – Büro 2' limit 1), 'Heizung prüfen', 'Anomalie bei Heizkreisen, Termin vereinbaren', 'Wartung', 'Normal', 'In Bearbeitung', 250
where not exists (select 1 from public.wartung_maengel where titel='Heizung prüfen');

insert into public.wartung_maengel (immobilie_id, titel, beschreibung, kategorie, prioritaet, status, kosten_geschaetzt)
select (select id from public.immobilien where bezeichnung='Gewerbepark 7 – Büro 2' limit 1), 'Wasserleck Keller', 'Feuchtigkeit sichtbar, Ursache klären', 'Reparatur', 'Hoch', 'Gemeldet', 400
where not exists (select 1 from public.wartung_maengel where titel='Wasserleck Keller');

-- Dokumente
insert into public.dokumente (titel, kategorie, dateiname, "dateigröße", content_base64)
select 'Mietvertrag Muster', 'Mietvertrag', 'mietvertrag.pdf', 0, null
where not exists (select 1 from public.dokumente where titel='Mietvertrag Muster');

insert into public.dokumente (titel, kategorie, dateiname, "dateigröße", content_base64)
select 'Kündigungsschreiben', 'Kündigung', 'kuendigung.pdf', 0, null
where not exists (select 1 from public.dokumente where titel='Kündigungsschreiben');