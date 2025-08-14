import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DashboardPage = () => (
  <div className="p-6 space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      <p className="text-muted-foreground">Übersicht Ihrer Immobilienverwaltung</p>
    </div>
    <Card>
      <CardHeader>
        <CardTitle>Willkommen im Offline-Modus</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Diese Demo-Version arbeitet vollständig lokal mit Dexie/IndexedDB.
        </p>
      </CardContent>
    </Card>
  </div>
);

export default DashboardPage;
