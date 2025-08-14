import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import DataTable from '@/components/common/DataTable';
import { Nebenkosten, Immobilie } from '@/types/entities';
import { immobilienRepo } from '@/repositories/immobilienRepo';
import { nebenkostenRepo } from '@/repositories/nebenkostenRepo';
import { Receipt, Building2, Calendar } from 'lucide-react';

const NebenkostenPage = () => {
  const [nebenkosten, setNebenkosten] = useState<Nebenkosten[]>([]);
  const [immobilien, setImmobilien] = useState<Immobilie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
      const [immobilienData, nebenkostenData] = await Promise.all([
        immobilienRepo.list(),
        nebenkostenRepo.list(),
      ]);
      setImmobilien(immobilienData);
      setNebenkosten(nebenkostenData);
    setLoading(false);
  };

  const handleAdd = () => {
    console.log('Add new Nebenkosten');
  };

  const handleEdit = (item: Nebenkosten) => {
    console.log('Edit Nebenkosten:', item);
  };

  const handleDelete = async (item: Nebenkosten) => {
    if (confirm(`Möchten Sie die Nebenkostenabrechnung für ${item.jahr} wirklich löschen?`)) {
        await nebenkostenRepo.remove(item.id);
      loadData();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'Geplant': 'outline',
      'Abgerechnet': 'secondary',
      'Bezahlt': 'default'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status}
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

  const calculateGesamtkosten = (item: Nebenkosten) => {
    return item.heizkosten + item.wasser + item.strom_allgemein + 
           item.müll + item.hausmeister + item.versicherung + 
           item.verwaltung + item.sonstiges;
  };

  const columns = [
    {
      key: 'jahr' as keyof Nebenkosten,
      label: 'Jahr',
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'immobilie_id' as keyof Nebenkosten,
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
      key: 'heizkosten' as keyof Nebenkosten,
      label: 'Heizkosten',
      sortable: true,
      render: (value: number) => formatCurrency(value),
      className: 'text-right'
    },
    {
      key: 'wasser' as keyof Nebenkosten,
      label: 'Wasser',
      sortable: true,
      render: (value: number) => formatCurrency(value),
      className: 'text-right'
    },
    {
      key: 'verwaltung' as keyof Nebenkosten,
      label: 'Verwaltung',
      sortable: true,
      render: (value: number) => formatCurrency(value),
      className: 'text-right'
    },
    {
      key: 'gesamtkosten' as keyof Nebenkosten,
      label: 'Gesamtkosten',
      sortable: false,
      render: (value: any, row: Nebenkosten) => (
        <span className="font-bold">{formatCurrency(calculateGesamtkosten(row))}</span>
      ),
      className: 'text-right'
    },
    {
      key: 'status' as keyof Nebenkosten,
      label: 'Status',
      sortable: true,
      render: (value: string) => getStatusBadge(value)
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nebenkosten</h1>
          <p className="text-muted-foreground">Verwalten Sie Nebenkostenabrechnungen</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Receipt className="h-4 w-4" />
            <span>{nebenkosten.length} Abrechnungen</span>
          </div>
        </div>
      </div>

      <DataTable
        title="Nebenkostenabrechnungen"
        data={nebenkosten}
        columns={columns}
        searchKeys={['jahr']}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        emptyMessage="Keine Nebenkostenabrechnungen gefunden"
      />
    </div>
  );
};

export default NebenkostenPage;