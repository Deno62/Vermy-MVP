import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import DataTable from '@/components/common/DataTable';
import { Finanzbuchung, Immobilie, Mieter } from '@/types/entities';
import { LocalStorage, STORAGE_KEYS } from '@/utils/storage';
import { generateMockFinanzbuchungen } from '@/utils/mockData';
import { Euro, TrendingUp, TrendingDown, Calendar } from 'lucide-react';

const FinanzenPage = () => {
  const [buchungen, setBuchungen] = useState<Finanzbuchung[]>([]);
  const [immobilien, setImmobilien] = useState<Immobilie[]>([]);
  const [mieter, setMieter] = useState<Mieter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const immobilienData = LocalStorage.getAll<Immobilie>(STORAGE_KEYS.IMMOBILIEN);
    const mieterData = LocalStorage.getAll<Mieter>(STORAGE_KEYS.MIETER);
    setImmobilien(immobilienData);
    setMieter(mieterData);
    
    let buchungenData = LocalStorage.getAll<Finanzbuchung>(STORAGE_KEYS.FINANZBUCHUNGEN);
    
    // Generate mock data if empty
    if (buchungenData.length === 0 && immobilienData.length > 0) {
      const mockData = generateMockFinanzbuchungen(immobilienData, mieterData, 30);
      mockData.forEach(buchung => {
        LocalStorage.save(STORAGE_KEYS.FINANZBUCHUNGEN, buchung);
      });
      buchungenData = LocalStorage.getAll<Finanzbuchung>(STORAGE_KEYS.FINANZBUCHUNGEN);
    }
    
    setBuchungen(buchungenData);
    setLoading(false);
  };

  const handleAdd = () => {
    console.log('Add new Finanzbuchung');
  };

  const handleEdit = (buchung: Finanzbuchung) => {
    console.log('Edit Finanzbuchung:', buchung);
  };

  const handleDelete = (buchung: Finanzbuchung) => {
    if (confirm(`Möchten Sie die Buchung "${buchung.beschreibung}" wirklich löschen?`)) {
      LocalStorage.delete(STORAGE_KEYS.FINANZBUCHUNGEN, buchung.id);
      loadData();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'Offen': 'outline',
      'Bezahlt': 'default',
      'Überfällig': 'destructive',
      'Storniert': 'secondary'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status}
      </Badge>
    );
  };

  const getKategorieBadge = (kategorie: string) => {
    return (
      <Badge variant={kategorie === 'Einnahme' ? 'default' : 'secondary'}>
        <span className="flex items-center space-x-1">
          {kategorie === 'Einnahme' ? 
            <TrendingUp className="h-3 w-3" /> : 
            <TrendingDown className="h-3 w-3" />
          }
          <span>{kategorie}</span>
        </span>
      </Badge>
    );
  };

  const getImmobilienBezeichnung = (immobilie_id: string) => {
    const immobilie = immobilien.find(i => i.id === immobilie_id);
    return immobilie?.bezeichnung || 'Unbekannt';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('de-DE').format(new Date(date));
  };

  // Calculate summary statistics
  const einnahmen = buchungen
    .filter(b => b.kategorie === 'Einnahme' && b.status === 'Bezahlt')
    .reduce((sum, b) => sum + b.betrag, 0);
    
  const ausgaben = buchungen
    .filter(b => b.kategorie === 'Ausgabe' && b.status === 'Bezahlt')
    .reduce((sum, b) => sum + b.betrag, 0);

  const columns = [
    {
      key: 'datum' as keyof Finanzbuchung,
      label: 'Datum',
      sortable: true,
      render: (value: Date) => (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{formatDate(value)}</span>
        </div>
      )
    },
    {
      key: 'beschreibung' as keyof Finanzbuchung,
      label: 'Beschreibung',
      sortable: true,
      render: (value: string, row: Finanzbuchung) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-muted-foreground">{row.art}</div>
        </div>
      )
    },
    {
      key: 'immobilie_id' as keyof Finanzbuchung,
      label: 'Immobilie',
      sortable: false,
      render: (value: string) => (
        <span className="text-sm">{getImmobilienBezeichnung(value)}</span>
      )
    },
    {
      key: 'kategorie' as keyof Finanzbuchung,
      label: 'Kategorie',
      sortable: true,
      render: (value: string) => getKategorieBadge(value)
    },
    {
      key: 'betrag' as keyof Finanzbuchung,
      label: 'Betrag',
      sortable: true,
      render: (value: number, row: Finanzbuchung) => (
        <span className={`font-medium ${
          row.kategorie === 'Einnahme' ? 'text-green-600' : 'text-red-600'
        }`}>
          {row.kategorie === 'Einnahme' ? '+' : '-'}{formatCurrency(value)}
        </span>
      ),
      className: 'text-right'
    },
    {
      key: 'status' as keyof Finanzbuchung,
      label: 'Status',
      sortable: true,
      render: (value: string) => getStatusBadge(value)
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Finanzen</h1>
          <p className="text-muted-foreground">Verwalten Sie Buchungen und Zahlungen</p>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Einnahmen</div>
            <div className="text-lg font-bold text-green-600">{formatCurrency(einnahmen)}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Ausgaben</div>
            <div className="text-lg font-bold text-red-600">{formatCurrency(ausgaben)}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Saldo</div>
            <div className={`text-lg font-bold ${einnahmen - ausgaben >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(einnahmen - ausgaben)}
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        title="Alle Buchungen"
        data={buchungen}
        columns={columns}
        searchKeys={['beschreibung', 'art', 'referenz']}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        emptyMessage="Keine Buchungen gefunden"
      />
    </div>
  );
};

export default FinanzenPage;