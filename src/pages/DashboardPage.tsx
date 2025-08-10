import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { vermyDb } from '@/db/vermyDb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Euro, AlertTriangle, Calendar, Wrench } from 'lucide-react';
import type { Finanzbuchung, Vertrag, WartungMaengel } from '@/types/entities';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const DashboardPage = () => {
  // Live data from Dexie (auto-updates when tables change)
  const finanzbuchungen = useLiveQuery(() => vermyDb.finanzbuchungen.toArray(), [], []) as Finanzbuchung[];
  const vertraege = useLiveQuery(() => vermyDb.vertraege.toArray(), [], []) as Vertrag[];
  const wartungen = useLiveQuery(() => vermyDb.wartungMaengel.toArray(), [], []) as WartungMaengel[];

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n || 0);
  const fmtDate = (d: Date | string | number) => new Date(d).toLocaleDateString('de-DE');

  // KPI computations
  const {
    sollEinnahmen,
    istEinnahmen,
    ueberfaelligeAnzahl,
    ueberfaelligerBetrag,
    auslaufendeVertraege,
    offeneWartungen,
  } = useMemo(() => {
    // Soll: Summe monatliche Miete (inkl. NK) aus aktiven Verträgen
    const soll = (vertraege || [])
      .filter((v) => v.status === 'aktiv')
      .reduce((sum, v) => {
        const monat = (v.kaltmiete || 0) + (v.nebenkosten || 0);
        // bei quartalsweise auf Monatswert umlegen
        const faktor = v.zahlungsintervall === 'quartalsweise' ? 1 / 3 : 1;
        return sum + monat * faktor;
      }, 0);

    // Ist: Summe bezahlter Mietzahlungen im aktuellen Monat
    const ist = (finanzbuchungen || [])
      .filter(
        (f) =>
          f.kategorie === 'Einnahme' &&
          (f.art === 'Miete' || f.art === 'Nebenkosten') &&
          f.status === 'Bezahlt' &&
          new Date(f.datum) >= startOfMonth
      )
      .reduce((s, f) => s + (f.betrag || 0), 0);

    const overdues = (finanzbuchungen || []).filter((f) => f.status === 'Überfällig');
    const overduesAmount = overdues.reduce((s, f) => s + (f.betrag || 0), 0);

    const in60days = (vertraege || []).filter((v) => {
      if (!v.mietende || v.status !== 'aktiv') return false;
      const end = new Date(v.mietende);
      const diff = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 60;
    }).length;

    const openMaint = (wartungen || []).filter((w) => w.status !== 'Erledigt').length;

    return {
      sollEinnahmen: soll,
      istEinnahmen: ist,
      ueberfaelligeAnzahl: overdues.length,
      ueberfaelligerBetrag: overduesAmount,
      auslaufendeVertraege: in60days,
      offeneWartungen: openMaint,
    };
  }, [finanzbuchungen, vertraege, wartungen]);

  // Chart data: last 12 months payments
  const chartData = useMemo(() => {
    const months: { label: string; value: number; key: string }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = new Intl.DateTimeFormat('de-DE', { month: 'short' }).format(d);
      months.push({ label, value: 0, key });
    }

    (finanzbuchungen || [])
      .filter(
        (f) => f.kategorie === 'Einnahme' && (f.art === 'Miete' || f.art === 'Nebenkosten') && f.status === 'Bezahlt'
      )
      .forEach((f) => {
        const fd = new Date(f.datum);
        const k = `${fd.getFullYear()}-${String(fd.getMonth() + 1).padStart(2, '0')}`;
        const idx = months.findIndex((m) => m.key === k);
        if (idx >= 0) months[idx].value += f.betrag || 0;
      });

    return months;
  }, [finanzbuchungen]);

  // Recent activity lists
  const recentPayments = useMemo(() => {
    return (finanzbuchungen || [])
      .filter((f) => f.kategorie === 'Einnahme')
      .sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime())
      .slice(0, 5);
  }, [finanzbuchungen]);

  const recentMaintenance = useMemo(() => {
    return (wartungen || [])
      .slice()
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5);
  }, [wartungen]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Übersicht Ihrer Immobilienverwaltung</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamte Mieteinnahmen (Soll / Ist)</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{fmtCurrency(sollEinnahmen)}</div>
            <p className="text-xs text-muted-foreground">Ist: {fmtCurrency(istEinnahmen)} im aktuellen Monat</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Überfällige Zahlungen</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ueberfaelligeAnzahl}</div>
            <p className="text-xs text-muted-foreground">Summe: {fmtCurrency(ueberfaelligerBetrag)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auslaufende Verträge (60 Tage)</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auslaufendeVertraege}</div>
            <p className="text-xs text-muted-foreground">Endet in ≤ 60 Tagen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offene Wartungsaufträge</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{offeneWartungen}</div>
            <p className="text-xs text-muted-foreground">Gesamt offen</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monatliche Mietzahlungen (letzte 12 Monate)</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="label" />
              <YAxis tickFormatter={(v) => new Intl.NumberFormat('de-DE').format(v)} />
              <Tooltip
                formatter={(value: any) => [fmtCurrency(value as number), 'Einnahmen']}
                labelFormatter={(l) => l as string}
              />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Letzte Zahlungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{p.beschreibung}</div>
                    <div className="text-xs text-muted-foreground">{fmtDate(p.datum)} · {p.art}</div>
                  </div>
                  <div className="font-medium text-right">{fmtCurrency(p.betrag)}</div>
                </div>
              ))}
              {recentPayments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Keine Zahlungen vorhanden</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Letzte Wartungs-Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMaintenance.map((w) => (
                <div key={w.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{w.titel}</div>
                    <div className="text-xs text-muted-foreground">{w.kategorie} · aktualisiert {fmtDate(w.updated_at)}</div>
                  </div>
                  <Badge variant={w.status === 'Erledigt' ? 'secondary' : 'default'} className="text-xs">{w.status}</Badge>
                </div>
              ))}
              {recentMaintenance.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Keine Wartungsaktivitäten</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
