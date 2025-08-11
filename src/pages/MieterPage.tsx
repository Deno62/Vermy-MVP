import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import DataTable from '@/components/common/DataTable';
import { Mieter, Immobilie } from '@/types/entities';
import { User, Mail, Phone, Building2 } from 'lucide-react';
import { mieterRepo } from '@/repositories/mieterRepo';
import { immobilienRepo } from '@/repositories/immobilienRepo';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const schema = z.object({
  anrede: z.enum(['Herr','Frau','Divers'], { required_error: 'Anrede ist erforderlich' }),
  vorname: z.string().min(1, 'Vorname ist erforderlich'),
  nachname: z.string().min(1, 'Nachname ist erforderlich'),
  email: z.string().email('Ungültige E-Mail'),
  telefon: z.string().min(3, 'Telefon ist erforderlich'),
  immobilie_id: z.string().optional(),
  hauptmieter: z.boolean().default(false).optional(),
  status: z.enum(['Aktiv','Ausgezogen','Gekündigt'], { required_error: 'Status ist erforderlich' }),
});

type FormValues = z.infer<typeof schema>;

const MieterPage = () => {
  const [mieter, setMieter] = useState<Mieter[]>([]);
  const [immobilien, setImmobilien] = useState<Immobilie[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Mieter | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { anrede: 'Herr', vorname: '', nachname: '', email: '', telefon: '', immobilie_id: undefined, hauptmieter: false, status: 'Aktiv' },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [immos, ms] = await Promise.all([immobilienRepo.list(), mieterRepo.list()]);
    setImmobilien(immos);
    setMieter(ms);
    setLoading(false);
  };

  const handleAdd = () => {
    setEditing(null);
    form.reset({ anrede: 'Herr', vorname: '', nachname: '', email: '', telefon: '', immobilie_id: undefined, hauptmieter: false, status: 'Aktiv' });
    setOpen(true);
  };

  const handleEdit = (m: Mieter) => {
    setEditing(m);
    form.reset({
      anrede: (m as any).anrede || 'Herr',
      vorname: (m as any).vorname || '',
      nachname: (m as any).nachname || '',
      email: (m as any).email || '',
      telefon: (m as any).telefon || '',
      immobilie_id: (m as any).immobilie_id,
      hauptmieter: !!(m as any).hauptmieter,
      status: (m as any).status || 'Aktiv',
    });
    setOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    if (editing) {
      await mieterRepo.update(editing.id, { ...values, updated_at: new Date() } as any);
    } else {
      await mieterRepo.create(values as any);
    }
    setOpen(false);
    setEditing(null);
    await loadData();
  };

  const handleDelete = async (m: Mieter) => {
    if (confirm(`Möchten Sie den Mieter "${(m as any).vorname} ${(m as any).nachname}" wirklich löschen?`)) {
      await mieterRepo.remove(m.id);
      loadData();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = { 'Aktiv': 'default', 'Ausgezogen': 'secondary', 'Gekündigt': 'destructive' } as const;
    return <Badge variant={variants[status as keyof typeof variants] || 'default'}>{status}</Badge>;
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
            <div className="font-medium">{(row as any).anrede} {(row as any).vorname} {(row as any).nachname}</div>
            <div className="text-sm text-muted-foreground">{(row as any).status}</div>
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
            <span>{(row as any).email}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Phone className="h-3 w-3 text-muted-foreground" />
            <span>{(row as any).telefon}</span>
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
      </div>

      {/* Data Table */}
      <DataTable
        title="Alle Mieter"
        data={mieter}
        columns={columns as any}
        searchKeys={['vorname', 'nachname', 'email', 'telefon'] as any}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        emptyMessage="Keine Mieter gefunden"
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Mieter bearbeiten' : 'Neuer Mieter'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="anrede" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Anrede</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Anrede" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {['Herr','Frau','Divers'].map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="vorname" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vorname</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="nachname" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nachname</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-Mail</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="telefon" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon</FormLabel>
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
                          <SelectValue placeholder="Zuweisen (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {immobilien.map(i => (
                          <SelectItem key={i.id} value={i.id}>{i.bezeichnung}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="hauptmieter" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hauptmieter</FormLabel>
                    <div className="flex items-center space-x-2">
                      <Checkbox checked={!!field.value} onCheckedChange={(v) => field.onChange(!!v)} />
                      <span className="text-sm text-muted-foreground">Genau ein Hauptmieter pro Wohnung</span>
                    </div>
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
                      {['Aktiv','Ausgezogen','Gekündigt'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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

export default MieterPage;
