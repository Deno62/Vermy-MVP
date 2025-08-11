import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { vertraegeRepo } from '@/repositories/vertraegeRepo';
import { immobilienRepo } from '@/repositories/immobilienRepo';
import { mieterRepo } from '@/repositories/mieterRepo';
import { useToast } from '@/hooks/use-toast';

const schema = z.object({
  immobilien_id: z.string({ required_error: 'Immobilie ist erforderlich' }),
  mieter_id: z.string({ required_error: 'Mieter ist erforderlich' }),
  beginn: z.string({ required_error: 'Beginn ist erforderlich' }),
  ende: z.string().optional().nullable(),
  status: z.enum(['aktiv', 'gekündigt', 'abgelaufen'], { required_error: 'Status ist erforderlich' }),
});

type FormValues = z.infer<typeof schema>;

export default function VertragDetailPage() {
  const { id } = useParams();
  const [row, setRow] = useState<any | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [immos, setImmos] = useState<any[]>([]);
  const [mieter, setMieter] = useState<any[]>([]);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { immobilien_id: '', mieter_id: '', beginn: '', ende: '', status: 'aktiv' },
  });

  useEffect(() => {
    (async () => {
      const [itm, im, mi] = await Promise.all([
        id ? vertraegeRepo.get(id) : Promise.resolve(null),
        immobilienRepo.list(),
        mieterRepo.list({}),
      ]);
      setRow(itm);
      setImmos(Array.isArray(im) ? im : []);
      setMieter(Array.isArray(mi) ? mi : []);
    })();
  }, [id]);

  const immoName = useMemo(() => Object.fromEntries((immos || []).map((i) => [i.id, i.bezeichnung])), [immos]);
  const mieterName = useMemo(
    () => Object.fromEntries((mieter || []).map((m) => [m.id, [m.vorname, m.nachname].filter(Boolean).join(' ')])),
    [mieter]
  );

  const openEdit = () => {
    if (!row) return;
    form.reset({
      immobilien_id: row.immobilien_id,
      mieter_id: row.mieter_id,
      beginn: row.mietbeginn?.slice(0, 10) || '',
      ende: row.mietende?.slice(0, 10) || '',
      status: row.status,
    });
    setEditOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    if (!id) return;
    try {
      await vertraegeRepo.update(id, values as any);
      toast({ title: 'Gespeichert', description: 'Vertrag aktualisiert.' });
      const fresh = await vertraegeRepo.get(id);
      setRow(fresh);
      setEditOpen(false);
    } catch (e) {
      console.error(e);
      toast({ title: 'Fehler', description: 'Speichern fehlgeschlagen.', variant: 'destructive' });
    }
  };

  const onDelete = async () => {
    if (!id) return;
    if (!confirm('Vertrag wirklich löschen?')) return;
    try {
      await vertraegeRepo.remove(id);
      toast({ title: 'Gelöscht', description: 'Vertrag wurde gelöscht.' });
      window.history.back();
    } catch (e) {
      console.error(e);
      toast({ title: 'Fehler', description: 'Löschen fehlgeschlagen.', variant: 'destructive' });
    }
  };

  if (!row) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Kein Vertrag gefunden.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vertrag</h1>
          <p className="text-muted-foreground">
            {immoName[row.immobilien_id] || row.immobilien_id} · {mieterName[row.mieter_id] || row.mieter_id}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={row.status === 'aktiv' ? 'secondary' : row.status === 'gekündigt' ? 'destructive' : 'outline'}>
            {row.status}
          </Badge>
          <Button variant="outline" onClick={openEdit}>Bearbeiten</Button>
          <Button variant="ghost" className="text-destructive" onClick={onDelete}>Löschen</Button>
        </div>
      </div>

      <div className="space-y-2">
        <div>Beginn: <span className="font-medium">{row.mietbeginn?.slice(0, 10) || '-'}</span></div>
        <div>Ende: <span className="font-medium">{row.mietende?.slice(0, 10) || '-'}</span></div>
      </div>

      <div>
        <Link to="/vertraege" className="underline">Zurück zur Übersicht</Link>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vertrag bearbeiten</DialogTitle>
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
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                  Abbrechen
                </Button>
                <Button type="submit">Speichern</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
