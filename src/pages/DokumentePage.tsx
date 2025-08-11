import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import DataTable from '@/components/common/DataTable';
import { Dokument, Immobilie, Mieter } from '@/types/entities';
import { FileText, Building2, User, Download } from 'lucide-react';
import { dokumentRepository } from '@/repositories/dokumentRepository';
import { immobilienRepo } from '@/repositories/immobilienRepo';
import { mieterRepo } from '@/repositories/mieterRepo';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const schema = z.object({
  titel: z.string().min(1, 'Titel ist erforderlich'),
  kategorie: z.enum(['Mietvertrag','Kündigung','Nebenkostenabrechnung','Rechnung','Foto','Sonstiges']),
  immobilie_id: z.string().optional(),
  mieter_id: z.string().optional(),
  file: z.any().optional(),
});

type FormValues = z.infer<typeof schema>;

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function downloadFromBase64(filename: string, base64: string, mime = 'application/octet-stream') {
  const linkSource = `data:${mime};base64,${base64}`;
  const downloadLink = document.createElement('a');
  downloadLink.href = linkSource;
  downloadLink.download = filename;
  downloadLink.click();
}

const DokumentePage = () => {
  const [dokumente, setDokumente] = useState<Dokument[]>([]);
  const [immobilien, setImmobilien] = useState<Immobilie[]>([]);
  const [mieter, setMieter] = useState<Mieter[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Dokument | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { titel: '', kategorie: 'Sonstiges', immobilie_id: undefined, mieter_id: undefined, file: undefined },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [immos, mit, docs] = await Promise.all([
      immobilienRepo.list(),
      mieterRepo.list(),
      dokumentRepository.list(),
    ]);
    setImmobilien(immos);
    setMieter(mit);
    setDokumente(docs);
    setLoading(false);
  };

  const handleAdd = () => {
    setEditing(null);
    form.reset({ titel: '', kategorie: 'Sonstiges', immobilie_id: undefined, mieter_id: undefined, file: undefined });
    setOpen(true);
  };

  const handleEdit = (d: Dokument) => {
    setEditing(d);
    form.reset({ titel: (d as any).titel, kategorie: (d as any).kategorie, immobilie_id: (d as any).immobilie_id, mieter_id: (d as any).mieter_id, file: undefined });
    setOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      let payload: any = {
        titel: values.titel,
        kategorie: values.kategorie,
        immobilie_id: values.immobilie_id,
        mieter_id: values.mieter_id,
      };

      const fileInput = (form.getValues() as any).file as File | undefined;
      if (fileInput) {
        if (fileInput.size > 5 * 1024 * 1024) {
          alert('Datei ist größer als 5 MB.');
          return;
        }
        const base64 = await toBase64(fileInput);
        payload = {
          ...payload,
          dateiname: fileInput.name,
          dateigröße: fileInput.size,
          content_base64: base64,
        };
      }

      if (editing) {
        await dokumentRepository.update(editing.id, payload);
      } else {
        await dokumentRepository.create(payload);
      }
      setOpen(false);
      setEditing(null);
      await loadData();
    } catch (e) {
      console.error(e);
      alert('Fehler beim Speichern des Dokuments.');
    }
  };

  const handleDelete = async (d: Dokument) => {
    if (confirm(`Möchten Sie das Dokument "${(d as any).titel}" wirklich löschen?`)) {
      await dokumentRepository.remove(d.id);
      loadData();
    }
  };

  const getKategorieBadge = (kategorie: string) => {
    const variants = { 'Mietvertrag': 'default', 'Kündigung': 'destructive', 'Nebenkostenabrechnung': 'secondary', 'Rechnung': 'outline', 'Foto': 'outline', 'Sonstiges': 'outline' } as const;
    return <Badge variant={variants[kategorie as keyof typeof variants] || 'outline'}>{kategorie}</Badge>;
  };

  const getImmobilienBezeichnung = (immobilie_id?: string) => {
    if (!immobilie_id) return '-';
    const immobilie = immobilien.find(i => i.id === immobilie_id);
    return immobilie?.bezeichnung || 'Unbekannt';
  };

  const getMieterName = (mieter_id?: string) => {
    if (!mieter_id) return '-';
    const mieterObj = mieter.find(m => m.id === mieter_id);
    return mieterObj ? `${(mieterObj as any).vorname} ${(mieterObj as any).nachname}` : 'Unbekannt';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024; const sizes = ['Bytes', 'KB', 'MB', 'GB']; const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const columns = [
    {
      key: 'titel' as keyof Dokument,
      label: 'Titel',
      sortable: true,
      render: (value: string, row: Dokument) => (
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{(row as any).titel}</div>
            <div className="text-sm text-muted-foreground">{(row as any).dateiname}</div>
          </div>
          {(row as any).content_base64 && (
            <Button variant="ghost" size="sm" onClick={() => downloadFromBase64((row as any).dateiname || 'dokument', (row as any).content_base64!, 'application/octet-stream')}>
              <Download className="h-4 w-4" />
            </Button>
          )}
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
      render: (value: number) => formatFileSize(value as any),
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
      </div>

      <DataTable
        title="Alle Dokumente"
        data={dokumente}
        columns={columns as any}
        searchKeys={['titel', 'dateiname', 'kategorie'] as any}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        emptyMessage="Keine Dokumente gefunden"
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Dokument bearbeiten' : 'Neues Dokument'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="titel" render={({ field }) => (
                <FormItem>
                  <FormLabel>Titel</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="kategorie" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategorie</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Kategorie" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {['Mietvertrag','Kündigung','Nebenkostenabrechnung','Rechnung','Foto','Sonstiges'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="immobilie_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Immobilie (optional)</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Zuweisen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {immobilien.map(i => <SelectItem key={i.id} value={i.id}>{i.bezeichnung}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="mieter_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mieter (optional)</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Zuweisen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mieter.map(m => <SelectItem key={m.id} value={m.id}>{(m as any).vorname} {(m as any).nachname}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="file" render={({ field }) => (
                <FormItem>
                  <FormLabel>Datei (max. 5 MB)</FormLabel>
                  <FormControl>
                    <Input type="file" accept=".pdf,.png,.jpg,.jpeg,.gif,.doc,.docx,.txt" onChange={(e) => field.onChange(e.target.files?.[0])} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
                <Button type="submit">{editing ? 'Speichern' : 'Anlegen'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DokumentePage;
