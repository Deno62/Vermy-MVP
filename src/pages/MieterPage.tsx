import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import DataTable from '@/components/common/DataTable';
import { Mieter, Immobilie } from '@/types/entities';
import { LocalStorage, STORAGE_KEYS } from '@/utils/storage';
import { generateMockMieter } from '@/utils/mockData';
import { User, Mail, Phone, Building2 } from 'lucide-react';

const MieterPage = () => {
  const [mieter, setMieter] = useState<Mieter[]>([]);
  const [immobilien, setImmobilien] = useState<Immobilie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const immobilienData = await LocalStorage.getAll<Immobilie>(STORAGE_KEYS.IMMOBILIEN);
    setImmobilien(immobilienData);
    
    let mieterData = await LocalStorage.getAll<Mieter>(STORAGE_KEYS.MIETER);
    
    // Generate mock data if empty
    if (mieterData.length === 0 && immobilienData.length > 0) {
      const mockData = generateMockMieter(immobilienData, 12);
      for (const mieter of mockData) {
        await LocalStorage.save(STORAGE_KEYS.MIETER, mieter);
      }
      mieterData = await LocalStorage.getAll<Mieter>(STORAGE_KEYS.MIETER);
    }
    
    setMieter(mieterData);
    setLoading(false);
  };

  const handleAdd = () => {
    console.log('Add new Mieter');
  };

  const handleEdit = (mieter: Mieter) => {
    console.log('Edit Mieter:', mieter);
  };

  const handleDelete = async (mieter: Mieter) => {
    if (confirm(`Möchten Sie den Mieter "${mieter.vorname} ${mieter.nachname}" wirklich löschen?`)) {
      await LocalStorage.delete(STORAGE_KEYS.MIETER, mieter.id);
      loadData();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'Aktiv': 'default',
      'Ausgezogen': 'secondary',
      'Gekündigt': 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status}
      </Badge>
    );
  };

  const getImmobilienBezeichnung = (immobilie_id?: string) => {
    if (!immobilie_id) return '-';
    const immobilie = immobilien.find(i => i.id === immobilie_id);
    return immobilie?.bezeichnung || 'Unbekannt';
  };

  const formatDate = (date?: Date) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('de-DE').format(new Date(date));
  };

  const columns = [
    {
      key: 'vorname' as keyof Mieter,
      label: 'Name',
      sortable: true,
      render: (value: string, row: Mieter) => (
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{row.anrede} {value} {row.nachname}</div>
            <div className="text-sm text-muted-foreground">{row.status}</div>
          </div>
        </div>
      )
    },
    {
      key: 'email' as keyof Mieter,
      label: 'Kontakt',
      sortable: true,
      render: (value: string, row: Mieter) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-sm">
            <Mail className="h-3 w-3 text-muted-foreground" />
            <span>{value}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Phone className="h-3 w-3 text-muted-foreground" />
            <span>{row.telefon}</span>
          </div>
        </div>
      )
    },
    {
      key: 'immobilie_id' as keyof Mieter,
      label: 'Immobilie',
      sortable: false,
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{getImmobilienBezeichnung(value)}</span>
        </div>
      )
    },
    {
      key: 'einzugsdatum' as keyof Mieter,
      label: 'Einzugsdatum',
      sortable: true,
      render: (value: Date) => formatDate(value)
    },
    {
      key: 'status' as keyof Mieter,
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
          <h1 className="text-2xl font-bold text-foreground">Mieter</h1>
          <p className="text-muted-foreground">Verwalten Sie Ihre Mieterverträge</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{mieter.length} Mieter</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span>{mieter.filter(m => m.status === 'Aktiv').length} aktiv</span>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        title="Alle Mieter"
        data={mieter}
        columns={columns}
        searchKeys={['vorname', 'nachname', 'email', 'telefon']}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        emptyMessage="Keine Mieter gefunden"
      />
    </div>
  );
};

export default MieterPage;