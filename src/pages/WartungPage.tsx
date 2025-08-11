import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import DataTable from '@/components/common/DataTable';
import { WartungMaengel, Immobilie } from '@/types/entities';
import { Wrench, Building2, AlertTriangle, CheckCircle } from 'lucide-react';
import { wartungRepository } from '@/repositories/wartungRepository';
import { immobilienRepository } from '@/repositories/immobilienRepository';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const schema = z.object({
  immobilie_id: z.string().min(1, 'Immobilie ist erforderlich'),
  titel: z.string().min(1, 'Titel ist erforderlich'),
  beschreibung: z.string().optional(),
  kategorie: z.enum(['Wartung','Reparatur','Mangel','Modernisierung']),
  prioritaet: z.enum(['Niedrig','Normal','Hoch','Dringend']),
  status: z.enum(['Gemeldet','In Bearbeitung','Erledigt','Verschoben']),
  beauftragt_am: z.coerce.date().optional(),
});

type FormValues = z.infer<typeof schema>;

const WartungPage = () => {
  const [wartungen, setWartungen] = useState<WartungMaengel[]>([]);
  const [immobilien, setImmobilien] = useState<Immobilie[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<WartungMaengel | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { immobilie_id: '', titel: '', beschreibung: '', kategorie: 'Wartung', prioritaet: 'Normal', status: 'Gemeldet', beauftragt_am: undefined },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [immos, data] = await Promise.all([immobilienRepository.list(), wartungRepository.list()]);
    setImmobilien(immos);
    setWartungen(data);
    setLoading(false);
  };

  const handleAdd = () => {
    setEditing(null);
    form.reset({ immobilie_id: '', titel: '', beschreibung: '', kategorie: 'Wartung', prioritaet: 'Normal', status: 'Gemeldet', beauftragt_am: undefined });
    setOpen(true);
  };

  const handleEdit = (w: WartungMaengel) => {
    setEditing(w);
    form.reset({
      immobilie_id: (w as any).immobilie_id,
      titel: (w as any).titel,
      beschreibung: (w as any).beschreibung,
      kategorie: (w as any).kategorie,
      prioritaet: (w as any).prioritaet,
      status: (w as any).status,
      beauftragt_am: (w as any).beauftragt_am ? new Date((w as any).beauftragt_am) : undefined,
    });
    setOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    if (editing) {
      await wartungRepository.update(editing.id, { ...values, updated_at: new Date() } as any);
    } else {
      await wartungRepository.create(values as any);
    }
    setOpen(false);
    setEditing(null);
    await loadData();
  };

  const handleDelete = async (w: WartungMaengel) => {
    if (confirm(`Möchten Sie den Eintrag "${(w as any).titel}" wirklich löschen?`)) {
      await wartungRepository.remove(w.id);
      loadData();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = { 'Gemeldet': 'outline', 'In Bearbeitung': 'secondary', 'Erledigt': 'default', 'Verschoben': 'destructive' } as const;
    return <Badge variant={variants[status as keyof typeof variants] || 'default'}>{status}</Badge>;
  };

  const getPrioritaetBadge = (prioritaet: string) => {
    const colors = { 'Niedrig': 'bg-blue-100 text-blue-800', 'Normal': 'bg-gray-100 text-gray-800', 'Hoch': 'bg-yellow-100 text-yellow-800', 'Dringend': 'bg-red-100 text-red-800' };
    return <Badge className={(colors as any)[prioritaet] || (colors as any).Normal}>{prioritaet}</Badge>;
  };

  const getKategorieIcon = (kategorie: string) => {
    const icons: any = { 'Wartung': Wrench, 'Reparatur': AlertTriangle, 'Mangel': AlertTriangle, 'Modernisierung': CheckCircle };
    const Icon = icons[kategorie] || Wrench;
    return <Icon className="h-4 w-4 text-muted-foreground" />;
  };

  const getImmobilienBezeichnung = (immobilie_id: string) => {
    const immobilie = immobilien.find(i => i.id === immobilie_id);
    return immobilie?.bezeichnung || 'Unbekannt';
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
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
          {getKategorieIcon((row as any).kategorie)}
          <div>
            <div className="font-medium">{(row as any).titel}</div>
            <div className="text-sm text-muted-foreground">{(row as any).kategorie}</div>
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
      </div>

      <DataTable
        title="Wartung & Mängel"
        data={wartungen}
        columns={columns as any}
        searchKeys={['titel', 'beschreibung', 'kategorie'] as any}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        emptyMessage="Keine Wartungseinträge gefunden"
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="immobilie_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Immobilie</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Immobilie wählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {immobilien.map(i => <SelectItem key={i.id} value={i.id}>{i.bezeichnung}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="titel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titel</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="beschreibung" render={({ field }) => (
                <FormItem>
                  <FormLabel>Beschreibung</FormLabel>
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
                        {['Wartung','Reparatur','Mangel','Modernisierung'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="prioritaet" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priorität</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Priorität" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {['Niedrig','Normal','Hoch','Dringend'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="beauftragt_am" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beauftragt am</FormLabel>
                    <FormControl>
                      <Input type="date" value={field.value ? new Date(field.value).toISOString().slice(0,10) : ''} onChange={e => field.onChange(new Date(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Status wählen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {['Gemeldet','In Bearbeitung','Erledigt','Verschoben'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
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

export default WartungPage;
