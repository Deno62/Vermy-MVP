import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Euro, AlertTriangle, TrendingUp, Calendar } from 'lucide-react';
import { Immobilie, Mieter, Finanzbuchung, WartungMaengel } from '@/types/entities';
import { LocalStorage, STORAGE_KEYS } from '@/utils/storage';
import { generateMockData } from '@/utils/mockData';

const DashboardPage = () => {
  const [data, setData] = useState({
    immobilien: [] as Immobilie[],
    mieter: [] as Mieter[],
    finanzbuchungen: [] as Finanzbuchung[],
    wartungen: [] as WartungMaengel[]
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    // Check if we have any data, if not generate mock data
    const immobilien = await LocalStorage.getAll<Immobilie>(STORAGE_KEYS.IMMOBILIEN);
    
    if (immobilien.length === 0) {
      // Generate and save mock data
      const mockData = generateMockData();
      for (const item of mockData.immobilien) await LocalStorage.save(STORAGE_KEYS.IMMOBILIEN, item);
      for (const item of mockData.mieter) await LocalStorage.save(STORAGE_KEYS.MIETER, item);
      for (const item of mockData.finanzbuchungen) await LocalStorage.save(STORAGE_KEYS.FINANZBUCHUNGEN, item);
      for (const item of mockData.wartungMaengel) await LocalStorage.save(STORAGE_KEYS.WARTUNG_MAENGEL, item);
    }

    // Load all data
    setData({
      immobilien: await LocalStorage.getAll<Immobilie>(STORAGE_KEYS.IMMOBILIEN),
      mieter: await LocalStorage.getAll<Mieter>(STORAGE_KEYS.MIETER),
      finanzbuchungen: await LocalStorage.getAll<Finanzbuchung>(STORAGE_KEYS.FINANZBUCHUNGEN),
      wartungen: await LocalStorage.getAll<WartungMaengel>(STORAGE_KEYS.WARTUNG_MAENGEL)
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Calculate statistics
  const stats = {
    totalImmobilien: data.immobilien.length,
    vermieteteImmobilien: data.immobilien.filter(i => i.status === 'Vermietet').length,
    aktiveMieter: data.mieter.filter(m => m.status === 'Aktiv').length,
    monatlicheEinnahmen: data.finanzbuchungen
      .filter(f => f.kategorie === 'Einnahme' && f.status === 'Bezahlt')
      .reduce((sum, f) => sum + f.betrag, 0),
    offeneWartungen: data.wartungen.filter(w => w.status !== 'Erledigt').length,
    dringendeWartungen: data.wartungen.filter(w => w.prioritaet === 'Dringend' && w.status !== 'Erledigt').length
  };

  const recentTransactions = data.finanzbuchungen
    .sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime())
    .slice(0, 5);

  const urgentMaintenance = data.wartungen
    .filter(w => w.prioritaet === 'Dringend' && w.status !== 'Erledigt')
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Übersicht Ihrer Immobilienverwaltung</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Immobilien</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalImmobilien}</div>
            <p className="text-xs text-muted-foreground">
              {stats.vermieteteImmobilien} vermietet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive Mieter</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.aktiveMieter}</div>
            <p className="text-xs text-muted-foreground">
              von {data.mieter.length} gesamt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monatliche Einnahmen</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.monatlicheEinnahmen)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              Letzte 30 Tage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offene Wartungen</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.offeneWartungen}</div>
            <p className="text-xs text-muted-foreground">
              {stats.dringendeWartungen} dringend
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Euro className="h-5 w-5" />
              <span>Aktuelle Buchungen</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      transaction.kategorie === 'Einnahme' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <div className="font-medium text-sm">{transaction.beschreibung}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(transaction.datum).toLocaleDateString('de-DE')}
                      </div>
                    </div>
                  </div>
                  <div className={`font-medium ${
                    transaction.kategorie === 'Einnahme' ? 'text-success-foreground' : 'text-destructive-foreground'
                  }`}>
                    {transaction.kategorie === 'Einnahme' ? '+' : '-'}{formatCurrency(transaction.betrag)}
                  </div>
                </div>
              ))}
              {recentTransactions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Keine aktuellen Buchungen
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Urgent Maintenance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Dringende Wartungen</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {urgentMaintenance.map((maintenance) => (
                <div key={maintenance.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <div>
                      <div className="font-medium text-sm">{maintenance.titel}</div>
                      <div className="text-xs text-muted-foreground">
                        {maintenance.kategorie}
                      </div>
                    </div>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    {maintenance.prioritaet}
                  </Badge>
                </div>
              ))}
              {urgentMaintenance.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Keine dringenden Wartungen
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;