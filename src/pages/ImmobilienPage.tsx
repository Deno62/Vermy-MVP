import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import DataTable from '@/components/common/DataTable';
import { Immobilie } from '@/types/entities';
import { LocalStorage, STORAGE_KEYS } from '@/utils/storage';
import { generateMockImmobilien } from '@/utils/mockData';
import { Building2, MapPin, Users } from 'lucide-react';

const ImmobilienPage = () => {
  const [immobilien, setImmobilien] = useState<Immobilie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadImmobilien();
  }, []);

  const loadImmobilien = async () => {
    let data = await LocalStorage.getAll<Immobilie>(STORAGE_KEYS.IMMOBILIEN);
    
    // Generate mock data if empty
    if (data.length === 0) {
      const mockData = generateMockImmobilien(8);
      for (const immobilie of mockData) {
        await LocalStorage.save(STORAGE_KEYS.IMMOBILIEN, immobilie);
      }
      data = await LocalStorage.getAll<Immobilie>(STORAGE_KEYS.IMMOBILIEN);
    }
    
    setImmobilien(data);
    setLoading(false);
  };

  const handleAdd = () => {
    // TODO: Open add modal
    console.log('Add new Immobilie');
  };

  const handleEdit = (immobilie: Immobilie) => {
    // TODO: Open edit modal
    console.log('Edit Immobilie:', immobilie);
  };

  const handleDelete = (immobilie: Immobilie) => {
    if (confirm(`Möchten Sie die Immobilie "${immobilie.bezeichnung}" wirklich löschen?`)) {
      LocalStorage.delete(STORAGE_KEYS.IMMOBILIEN, immobilie.id);
      loadImmobilien();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'Verfügbar': 'default',
      'Vermietet': 'secondary',
      'Wartung': 'destructive',
      'Leerstand': 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status}
      </Badge>
    );
  };

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const columns = [
    {
      key: 'bezeichnung' as keyof Immobilie,
      label: 'Bezeichnung',
      sortable: true,
      render: (value: string, row: Immobilie) => (
        <div className="flex items-center space-x-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-sm text-muted-foreground">{row.art}</div>
          </div>
        </div>
      )
    },
    {
      key: 'adresse' as keyof Immobilie,
      label: 'Adresse',
      sortable: true,
      render: (value: string, row: Immobilie) => (
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <div>
            <div>{value}</div>
            <div className="text-sm text-muted-foreground">{row.plz} {row.ort}</div>
          </div>
        </div>
      )
    },
    {
      key: 'zimmer' as keyof Immobilie,
      label: 'Zimmer',
      sortable: true,
      className: 'text-center'
    },
    {
      key: 'flaeche' as keyof Immobilie,
      label: 'Fläche (m²)',
      sortable: true,
      render: (value: number) => `${value} m²`,
      className: 'text-right'
    },
    {
      key: 'kaltmiete' as keyof Immobilie,
      label: 'Kaltmiete',
      sortable: true,
      render: (value: number) => formatCurrency(value),
      className: 'text-right'
    },
    {
      key: 'status' as keyof Immobilie,
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
          <h1 className="text-2xl font-bold text-foreground">Immobilien</h1>
          <p className="text-muted-foreground">Verwalten Sie Ihre Immobilienobjekte</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span>{immobilien.length} Objekte</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{immobilien.filter(i => i.status === 'Vermietet').length} vermietet</span>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        title="Alle Immobilien"
        data={immobilien}
        columns={columns}
        searchKeys={['bezeichnung', 'adresse', 'ort', 'status']}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        emptyMessage="Keine Immobilien gefunden"
      />
    </div>
  );
};

export default ImmobilienPage;