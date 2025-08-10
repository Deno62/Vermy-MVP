import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import DataTable from '@/components/common/DataTable';
import { WartungMaengel, Immobilie } from '@/types/entities';
import { LocalStorage, STORAGE_KEYS } from '@/utils/storage';
import { Wrench, Building2, AlertTriangle, CheckCircle } from 'lucide-react';

const WartungPage = () => {
  const [wartungen, setWartungen] = useState<WartungMaengel[]>([]);
  const [immobilien, setImmobilien] = useState<Immobilie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const immobilienData = LocalStorage.getAll<Immobilie>(STORAGE_KEYS.IMMOBILIEN);
    setImmobilien(immobilienData);
    
    const wartungenData = LocalStorage.getAll<WartungMaengel>(STORAGE_KEYS.WARTUNG_MAENGEL);
    setWartungen(wartungenData);
    setLoading(false);
  };

  const handleAdd = () => {
    console.log('Add new Wartung');
  };

  const handleEdit = (item: WartungMaengel) => {
    console.log('Edit Wartung:', item);
  };

  const handleDelete = (item: WartungMaengel) => {
    if (confirm(`Möchten Sie den Eintrag "${item.titel}" wirklich löschen?`)) {
      LocalStorage.delete(STORAGE_KEYS.WARTUNG_MAENGEL, item.id);
      loadData();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'Gemeldet': 'outline',
      'In Bearbeitung': 'secondary',
      'Erledigt': 'default',
      'Verschoben': 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status}
      </Badge>
    );
  };

  const getPrioritaetBadge = (prioritaet: string) => {
    const colors = {
      'Niedrig': 'bg-blue-100 text-blue-800',
      'Normal': 'bg-gray-100 text-gray-800',
      'Hoch': 'bg-yellow-100 text-yellow-800',
      'Dringend': 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={colors[prioritaet as keyof typeof colors] || colors.Normal}>
        {prioritaet}
      </Badge>
    );
  };

  const getKategorieIcon = (kategorie: string) => {
    const icons = {
      'Wartung': Wrench,
      'Reparatur': AlertTriangle,
      'Mangel': AlertTriangle,
      'Modernisierung': CheckCircle
    };
    
    const Icon = icons[kategorie as keyof typeof icons] || Wrench;
    return <Icon className="h-4 w-4 text-muted-foreground" />;
  };

  const getImmobilienBezeichnung = (immobilie_id: string) => {
    const immobilie = immobilien.find(i => i.id === immobilie_id);
    return immobilie?.bezeichnung || 'Unbekannt';
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (date?: Date) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('de-DE').format(new Date(date));
  };

  const columns = [
    {
      key: 'titel' as keyof WartungMaengel,
      label: 'Titel',
      sortable: true,
      render: (value: string, row: WartungMaengel) => (
        <div className="flex items-center space-x-2">
          {getKategorieIcon(row.kategorie)}
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-sm text-muted-foreground">{row.kategorie}</div>
          </div>
        </div>
      )
    },
    {
      key: 'immobilie_id' as keyof WartungMaengel,
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
      key: 'prioritaet' as keyof WartungMaengel,
      label: 'Priorität',
      sortable: true,
      render: (value: string) => getPrioritaetBadge(value)
    },
    {
      key: 'status' as keyof WartungMaengel,
      label: 'Status',
      sortable: true,
      render: (value: string) => getStatusBadge(value)
    },
    {
      key: 'kosten_geschaetzt' as keyof WartungMaengel,
      label: 'Geschätzte Kosten',
      sortable: true,
      render: (value: number) => formatCurrency(value),
      className: 'text-right'
    },
    {
      key: 'kosten_tatsaechlich' as keyof WartungMaengel,
      label: 'Tatsächliche Kosten',
      sortable: true,
      render: (value: number) => formatCurrency(value),
      className: 'text-right'
    },
    {
      key: 'beauftragt_am' as keyof WartungMaengel,
      label: 'Beauftragt am',
      sortable: true,
      render: (value: Date) => formatDate(value)
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Wartung & Mängel</h1>
          <p className="text-muted-foreground">Verwalten Sie Wartungsaufgaben und Mängel</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Wrench className="h-4 w-4" />
            <span>{wartungen.length} Einträge</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            <span>{wartungen.filter(w => w.prioritaet === 'Dringend').length} dringend</span>
          </div>
        </div>
      </div>

      <DataTable
        title="Wartung & Mängel"
        data={wartungen}
        columns={columns}
        searchKeys={['titel', 'beschreibung', 'kategorie']}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        emptyMessage="Keine Wartungseinträge gefunden"
      />
    </div>
  );
};

export default WartungPage;