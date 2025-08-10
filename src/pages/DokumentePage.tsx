import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import DataTable from '@/components/common/DataTable';
import { Dokument, Immobilie, Mieter } from '@/types/entities';
import { LocalStorage, STORAGE_KEYS } from '@/utils/storage';
import { FileText, Building2, User, Download } from 'lucide-react';

const DokumentePage = () => {
  const [dokumente, setDokumente] = useState<Dokument[]>([]);
  const [immobilien, setImmobilien] = useState<Immobilie[]>([]);
  const [mieter, setMieter] = useState<Mieter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const immobilienData = await LocalStorage.getAll<Immobilie>(STORAGE_KEYS.IMMOBILIEN);
    const mieterData = await LocalStorage.getAll<Mieter>(STORAGE_KEYS.MIETER);
    const dokumenteData = await LocalStorage.getAll<Dokument>(STORAGE_KEYS.DOKUMENTE);
    
    setImmobilien(immobilienData);
    setMieter(mieterData);
    setDokumente(dokumenteData);
    setLoading(false);
  };

  const handleAdd = () => {
    console.log('Add new Dokument');
  };

  const handleEdit = (item: Dokument) => {
    console.log('Edit Dokument:', item);
  };

  const handleDelete = async (item: Dokument) => {
    if (confirm(`Möchten Sie das Dokument "${item.titel}" wirklich löschen?`)) {
      await LocalStorage.delete(STORAGE_KEYS.DOKUMENTE, item.id);
      loadData();
    }
  };

  const getKategorieBadge = (kategorie: string) => {
    const variants = {
      'Mietvertrag': 'default',
      'Kündigung': 'destructive',
      'Nebenkostenabrechnung': 'secondary',
      'Rechnung': 'outline',
      'Foto': 'outline',
      'Sonstiges': 'outline'
    } as const;

    return (
      <Badge variant={variants[kategorie as keyof typeof variants] || 'outline'}>
        {kategorie}
      </Badge>
    );
  };

  const getImmobilienBezeichnung = (immobilie_id?: string) => {
    if (!immobilie_id) return '-';
    const immobilie = immobilien.find(i => i.id === immobilie_id);
    return immobilie?.bezeichnung || 'Unbekannt';
  };

  const getMieterName = (mieter_id?: string) => {
    if (!mieter_id) return '-';
    const mieterObj = mieter.find(m => m.id === mieter_id);
    return mieterObj ? `${mieterObj.vorname} ${mieterObj.nachname}` : 'Unbekannt';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    const iconClass = "h-4 w-4 text-muted-foreground";
    
    switch (extension) {
      case 'pdf':
        return <FileText className={iconClass} />;
      case 'doc':
      case 'docx':
        return <FileText className={iconClass} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileText className={iconClass} />;
      default:
        return <FileText className={iconClass} />;
    }
  };

  const columns = [
    {
      key: 'titel' as keyof Dokument,
      label: 'Titel',
      sortable: true,
      render: (value: string, row: Dokument) => (
        <div className="flex items-center space-x-2">
          {getFileIcon(row.dateiname)}
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-sm text-muted-foreground">{row.dateiname}</div>
          </div>
        </div>
      )
    },
    {
      key: 'kategorie' as keyof Dokument,
      label: 'Kategorie',
      sortable: true,
      render: (value: string) => getKategorieBadge(value)
    },
    {
      key: 'immobilie_id' as keyof Dokument,
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
      key: 'mieter_id' as keyof Dokument,
      label: 'Mieter',
      sortable: false,
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{getMieterName(value)}</span>
        </div>
      )
    },
    {
      key: 'dateigröße' as keyof Dokument,
      label: 'Größe',
      sortable: true,
      render: (value: number) => formatFileSize(value),
      className: 'text-right'
    },
    {
      key: 'created_at' as keyof Dokument,
      label: 'Erstellt am',
      sortable: true,
      render: (value: Date) => new Intl.DateTimeFormat('de-DE').format(new Date(value))
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dokumente</h1>
          <p className="text-muted-foreground">Verwalten Sie Ihre Dokumente</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>{dokumente.length} Dokumente</span>
          </div>
        </div>
      </div>

      <DataTable
        title="Alle Dokumente"
        data={dokumente}
        columns={columns}
        searchKeys={['titel', 'dateiname', 'kategorie']}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        emptyMessage="Keine Dokumente gefunden"
      />
    </div>
  );
};

export default DokumentePage;