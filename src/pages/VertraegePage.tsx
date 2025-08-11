import { useEffect, useMemo, useState } from 'react';
import DataTable from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { immobilienRepo } from '@/repositories/immobilienRepo';
import { mieterRepo } from '@/repositories/mieterRepo';
import { vertraegeRepo } from '@/repositories/vertraegeRepo';
import { useToast } from '@/hooks/use-toast';

const statusColors: Record<string, any> = {
  aktiv: 'secondary',
  'gekündigt': 'destructive',
  abgelaufen: 'outline',
};

const schema = z.object({
  immobilien_id: z.string({ required_error: 'Immobilie ist erforderlich' }),
  mieter_id: z.string({ required_error: 'Mieter ist erforderlich' }),
  beginn: z.string({ required_error: 'Beginn ist erforderlich' }),
  ende: z.string().optional().nullable(),
  status: z.enum(['aktiv', 'gekündigt', 'abgelaufen'], { required_error: 'Status ist erforderlich' }),
});

type FormValues = z.infer<typeof schema>;

type VertragRow = {
  id: string;
  immobilien_id: string;
  mieter_id: string;
  mietbeginn?: string;
  mietende?: string | null;
  status: 'aktiv' | 'gekündigt' | 'abgelaufen';
};

export default function VertraegePage() {
  const [rows, setRows] = useState<VertragRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<VertragRow | null>(null);
  const [immos, setImmos] = useState<any[]>([]);
  const [mieter, setMieter] = useState<any[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { immobilien_id: '', mieter_id: '', beginn: '', ende: '', status: 'aktiv' },
  });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [vs, is, ms] = await Promise.all([
        vertraegeRepo.list(),
        immobilienRepo.list(),
        mieterRepo.list({}),
      ]);
      setRows(Array.isArray(vs) ? (vs as any) : []);
      setImmos(Array.isArray(is) ? is : []);
      setMieter(Array.isArray(ms) ? ms : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const immoName = useMemo(() => Object.fromEntries((immos || []).map((i) => [i.id, i.bezeichnung])), [immos]);
  const mieterName = useMemo(
    () => Object.fromEntries((mieter || []).map((m) => [m.id, [m.vorname, m.nachname].filter(Boolean).join(' ')])),
    [mieter]
  );

  const onAdd = () => {
    setEditing(null);
    form.reset({ immobilien_id: '', mieter_id: '', beginn: '', ende: '', status: 'aktiv' });
    setOpen(true);
  };

  const onEdit = (row: VertragRow) => {
    setEditing(row);
    form.reset({
      immobilien_id: row.immobilien_id,
      mieter_id: row.mieter_id,
      beginn: (row as any).mietbeginn?.slice(0, 10) || '',
      ende: (row as any).mietende?.slice(0, 10) || '',
      status: row.status,
    });
    setOpen(true);
  };

  const onDelete = async (row: VertragRow) => {
    if (!confirm('Vertrag wirklich löschen?')) return;
    try {
      await vertraegeRepo.remove(row.id);
      toast({ title: 'Gelöscht', description: 'Vertrag wurde gelöscht.' });
      await loadAll();
    } catch (e) {
      console.error(e);
      toast({ title: 'Fehler', description: 'Löschen fehlgeschlagen.', variant: 'destructive' });
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = { ...values } as any; // vertraegeRepo mappt beginn/ende
      if (editing) {
        await vertraegeRepo.update(editing.id, payload);
        toast({ title: 'Gespeichert', description: 'Vertrag wurde aktualisiert.' });
      } else {
        await vertraegeRepo.create(payload);
        toast({ title: 'Angelegt', description: 'Vertrag wurde erstellt.' });
      }
      setOpen(false);
      setEditing(null);
      await loadAll();
    } catch (e) {
      console.error(e);
      toast({ title: 'Fehler', description: 'Speichern fehlgeschlagen.', variant: 'destructive' });
    }
  };

  const columns = [
    {
      key: 'id' as keyof VertragRow,
      label: 'Vertrag',
      render: (_: any, row: VertragRow) => (
        <Link to={`/vertraege/${row.id}`} className="underline">
          {(row as any).mietbeginn?.slice(0, 10) || 'Vertrag'}
        </Link>
      ),
    },
    {
      key: 'immobilien_id' as keyof VertragRow,
      label: 'Immobilie',
      render: (value: string) => immoName[value] || value,
    },
    {
      key: 'mieter_id' as keyof VertragRow,
      label: 'Mieter',
      render: (value: string) => mieterName[value] || value,
    },
    {
      key: 'status' as keyof VertragRow,
      label: 'Status',
      render: (value: string) => <Badge variant={statusColors[value] || 'secondary'}>{value}</Badge>,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Verträge</h1>
        <p className="text-muted-foreground">Verwalten Sie Mietverträge</p>
      </div>

      <DataTable
        title="Alle Verträge"
        data={Array.isArray(rows) ? rows : []}
        columns={columns as any}
        searchKeys={['status'] as any}
        onAdd={onAdd}
        onEdit={onEdit}
        onDelete={onDelete}
        loading={loading}
        emptyMessage="Keine Verträge gefunden"
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Vertrag bearbeiten' : 'Neuer Vertrag'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="immobilien_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Immobilie</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Immobilie wählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(immos || []).map((i) => (
                          <SelectItem key={i.id} value={i.id}>
                            {i.bezeichnung}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mieter_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mieter</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Mieter wählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(mieter || []).map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {[m.vorname, m.nachname].filter(Boolean).join(' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="beginn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beginn</FormLabel>
                      <FormControl>
                        <Input type="date" value={field.value || ''} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ende"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ende</FormLabel>
                      <FormControl>
                        <Input type="date" value={field.value || ''} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Status wählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {['aktiv', 'gekündigt', 'abgelaufen'].map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Abbrechen
                </Button>
                <Button type="submit">{editing ? 'Speichern' : 'Anlegen'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
