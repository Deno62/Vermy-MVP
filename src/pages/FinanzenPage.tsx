import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import DataTable from '@/components/common/DataTable';
import { Finanzbuchung, Immobilie } from '@/types/entities';
import { Euro, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { finanzenRepo } from '@/repositories/finanzenRepo';
import { immobilienRepo } from '@/repositories/immobilienRepo';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const schema = z.object({
  datum: z.coerce.date({ required_error: 'Datum ist erforderlich' }),
  beschreibung: z.string().min(1, 'Beschreibung ist erforderlich'),
  immobilie_id: z.string().min(1, 'Immobilie ist erforderlich'),
  art: z.enum(['Miete','Nebenkosten','Kaution','Reparatur','Verwaltung','Sonstiges']),
  kategorie: z.enum(['Einnahme','Ausgabe']),
  betrag: z.coerce.number().min(0.01, 'Betrag ist erforderlich'),
  status: z.enum(['Offen','Bezahlt','Überfällig','Storniert']),
});

type FormValues = z.infer<typeof schema>;

const FinanzenPage = () => {
  const [buchungen, setBuchungen] = useState<Finanzbuchung[]>([]);
  const [immobilien, setImmobilien] = useState<Immobilie[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Finanzbuchung | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { datum: new Date(), beschreibung: '', immobilie_id: '', art: 'Miete', kategorie: 'Einnahme', betrag: 0, status: 'Offen' },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
      const [immos, data] = await Promise.all([immobilienRepo.list(), finanzenRepo.list()]);
    setImmobilien(immos);
    setBuchungen(data);
    setLoading(false);
  };

  const handleAdd = () => {
    setEditing(null);
    form.reset({ datum: new Date(), beschreibung: '', immobilie_id: '', art: 'Miete', kategorie: 'Einnahme', betrag: 0, status: 'Offen' });
    setOpen(true);
  };

  const handleEdit = (b: Finanzbuchung) => {
    setEditing(b);
    form.reset({
      datum: new Date((b as any).datum),
      beschreibung: (b as any).beschreibung,
      immobilie_id: (b as any).immobilie_id,
      art: (b as any).art,
      kategorie: (b as any).kategorie,
      betrag: (b as any).betrag,
      status: (b as any).status,
    });
    setOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    if (editing) {
        await finanzenRepo.update(editing.id, { ...values, updated_at: new Date() } as any);
    } else {
        await finanzenRepo.create(values as any);
    }
    setOpen(false);
    setEditing(null);
    await loadData();
  };

  const handleDelete = async (b: Finanzbuchung) => {
    if (confirm(`Möchten Sie die Buchung "${(b as any).beschreibung}" wirklich löschen?`)) {
        await finanzenRepo.remove(b.id);
      loadData();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = { 'Offen': 'outline', 'Bezahlt': 'default', 'Überfällig': 'destructive', 'Storniert': 'secondary' } as const;
    return <Badge variant={variants[status as keyof typeof variants] || 'default'}>{status}</Badge>;
  };

  const getKategorieBadge = (kategorie: string) => (
    <Badge variant={kategorie === 'Einnahme' ? 'default' : 'secondary'}>
      <span className="flex items-center space-x-1">
        {kategorie === 'Einnahme' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        <span>{kategorie}</span>
      </span>
    </Badge>
  );

  const getImmobilienBezeichnung = (immobilie_id: string) => {
    const immobilie = immobilien.find(i => i.id === immobilie_id);
    return immobilie?.bezeichnung || 'Unbekannt';
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
  const formatDate = (date: Date) => new Intl.DateTimeFormat('de-DE').format(new Date(date));

  const einnahmen = useMemo(() => buchungen.filter(b => b.kategorie === 'Einnahme' && b.status === 'Bezahlt').reduce((sum, b) => sum + (b.betrag || 0), 0), [buchungen]);
  const ausgaben = useMemo(() => buchungen.filter(b => b.kategorie === 'Ausgabe' && b.status === 'Bezahlt').reduce((sum, b) => sum + (b.betrag || 0), 0), [buchungen]);

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
          <div className="font-medium">{(row as any).beschreibung}</div>
          <div className="text-sm text-muted-foreground">{(row as any).art}</div>
        </div>
      )
    },
    {
      key: 'immobilie_id' as keyof Finanzbuchung,
      label: 'Immobilie',
      sortable: false,
      render: (value: string) => <span className="text-sm">{getImmobilienBezeichnung(value)}</span>
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
        <span className={`font-medium ${(row as any).kategorie === 'Einnahme' ? 'text-success-foreground' : 'text-destructive-foreground'}`}>
          {(row as any).kategorie === 'Einnahme' ? '+' : '-'}{formatCurrency(value)}
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Finanzen</h1>
          <p className="text-muted-foreground">Verwalten Sie Buchungen und Zahlungen</p>
        </div>
        <div className="flex items-center space-x-6">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Einnahmen</div>
            <div className="text-lg font-bold text-success-foreground">{formatCurrency(einnahmen)}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Ausgaben</div>
            <div className="text-lg font-bold text-destructive-foreground">{formatCurrency(ausgaben)}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Saldo</div>
            <div className={`text-lg font-bold ${einnahmen - ausgaben >= 0 ? 'text-success-foreground' : 'text-destructive-foreground'}`}>{formatCurrency(einnahmen - ausgaben)}</div>
          </div>
        </div>
      </div>

      <DataTable
        title="Alle Buchungen"
        data={buchungen}
        columns={columns as any}
        searchKeys={['beschreibung', 'art', 'referenz'] as any}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        emptyMessage="Keine Buchungen gefunden"
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Buchung bearbeiten' : 'Neue Buchung'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="datum" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Datum</FormLabel>
                    <FormControl>
                      <Input type="date" value={field.value ? new Date(field.value).toISOString().slice(0,10) : ''} onChange={e => field.onChange(new Date(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="beschreibung" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beschreibung</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="art" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Art</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Art" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {['Miete','Nebenkosten','Kaution','Reparatur','Verwaltung','Sonstiges'].map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
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
                        {['Einnahme','Ausgabe'].map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="betrag" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Betrag (EUR)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min={0} {...field} />
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
                      {['Offen','Bezahlt','Überfällig','Storniert'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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

export default FinanzenPage;
