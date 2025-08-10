import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import DataTable from '@/components/common/DataTable';
import { Mahnwesen, Immobilie, Mieter } from '@/types/entities';
import { LocalStorage, STORAGE_KEYS } from '@/utils/storage';
import { AlertTriangle, Building2, User, Calendar } from 'lucide-react';

const MahnwesenPage = () => {
  const [mahnungen, setMahnungen] = useState<Mahnwesen[]>([]);
  const [immobilien, setImmobilien] = useState<Immobilie[]>([]);
  const [mieter, setMieter] = useState<Mieter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const immobilienData = LocalStorage.getAll<Immobilie>(STORAGE_KEYS.IMMOBILIEN);
    const mieterData = LocalStorage.getAll<Mieter>(STORAGE_KEYS.MIETER);
    const mahnungenData = LocalStorage.getAll<Mahnwesen>(STORAGE_KEYS.MAHNWESEN);
    
    setImmobilien(immobilienData);
    setMieter(mieterData);
    setMahnungen(mahnungenData);
    setLoading(false);
  };

  const handleAdd = () => {
    console.log('Add new Mahnung');
  };

  const handleEdit = (item: Mahnwesen) => {
    console.log('Edit Mahnung:', item);
  };

  const handleDelete = (item: Mahnwesen) => {
    if (confirm('Möchten Sie diese Mahnung wirklich löschen?')) {
      LocalStorage.delete(STORAGE_KEYS.MAHNWESEN, item.id);
      loadData();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'Verschickt': 'outline',
      'Bezahlt': 'default',
      'Ignoriert': 'secondary',
      'Rechtlich': 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status}
      </Badge>
    );
  };

  const getMahnstufeColor = (stufe: number) => {
    const colors = {
      1: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      2: 'bg-orange-100 text-orange-800 border-orange-200',
      3: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[stufe as keyof typeof colors] || colors[1];
  };

  const getImmobilienBezeichnung = (immobilie_id: string) => {
    const immobilie = immobilien.find(i => i.id === immobilie_id);
    return immobilie?.bezeichnung || 'Unbekannt';
  };

  const getMieterName = (mieter_id: string) => {
    const mieterObj = mieter.find(m => m.id === mieter_id);
    return mieterObj ? `${mieterObj.vorname} ${mieterObj.nachname}` : 'Unbekannt';
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

  const columns = [
    {
      key: 'mahnstufe' as keyof Mahnwesen,
      label: 'Mahnstufe',
      sortable: true,
      render: (value: number) => (
        <Badge className={getMahnstufeColor(value)}>
          {value}. Mahnung
        </Badge>
      )
    },
    {
      key: 'mieter_id' as keyof Mahnwesen,
      label: 'Mieter',
      sortable: false,
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>{getMieterName(value)}</span>
        </div>
      )
    },
    {
      key: 'immobilie_id' as keyof Mahnwesen,
      label: 'Immobilie',
      sortable: false,
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span>{getImmobilienBezeichnung(value)}</span>
        </div>
      )
    },
    {
      key: 'betrag' as keyof Mahnwesen,
      label: 'Betrag',
      sortable: true,
      render: (value: number) => formatCurrency(value),
      className: 'text-right'
    },
    {
      key: 'mahngebuehr' as keyof Mahnwesen,
      label: 'Mahngebühr',
      sortable: true,
      render: (value: number) => formatCurrency(value),
      className: 'text-right'
    },
    {
      key: 'mahndatum' as keyof Mahnwesen,
      label: 'Mahndatum',
      sortable: true,
      render: (value: Date) => (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{formatDate(value)}</span>
        </div>
      )
    },
    {
      key: 'faelligkeitsdatum' as keyof Mahnwesen,
      label: 'Fälligkeitsdatum',
      sortable: true,
      render: (value: Date) => formatDate(value)
    },
    {
      key: 'status' as keyof Mahnwesen,
      label: 'Status',
      sortable: true,
      render: (value: string) => getStatusBadge(value)
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mahnwesen</h1>
          <p className="text-muted-foreground">Verwalten Sie Mahnungen und Inkasso</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            <span>{mahnungen.length} Mahnungen</span>
          </div>
        </div>
      </div>

      <DataTable
        title="Mahnungen"
        data={mahnungen}
        columns={columns}
        searchKeys={[]}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        emptyMessage="Keine Mahnungen gefunden"
      />
    </div>
  );
};

export default MahnwesenPage;