import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { immobilienRepo } from '@/repositories/immobilienRepo';
import DataTable from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';

const wohnungSchema = z.object({
  bezeichnung: z.string().min(1, 'Bezeichnung ist erforderlich'),
  adresse: z.string().min(1, 'Adresse ist erforderlich'),
  zimmer: z.coerce.number().int().min(1, 'Mindestens 1 Zimmer'),
  flaeche: z.coerce.number().min(0, 'Ungültige Fläche'),
  kaltmiete: z.coerce.number().min(0, 'Ungültige Kaltmiete').optional(),
});

type WohnungValues = z.infer<typeof wohnungSchema>;

export default function ImmobilieDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<any | null>(null);
  const [wohnungen, setWohnungen] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<WohnungValues>({
    resolver: zodResolver(wohnungSchema),
    defaultValues: { bezeichnung: '', adresse: '', zimmer: 1, flaeche: 30, kaltmiete: 0 },
  });

  useEffect(() => {
    if (!id) return;
    (async () => {
      const im = await immobilienRepo.get(id);
      setItem(im);
      if (!im) return;
      if (!im.parent_id) {
        const ws = await immobilienRepo.listWohnungenByHaus(id);
        setWohnungen(Array.isArray(ws) ? ws : []);
      }
    })();
  }, [id]);

  const isHaus = useMemo(() => !!item && (!('parent_id' in item) || !item.parent_id), [item]);

  const onAddWohnung = () => {
    form.reset({ bezeichnung: '', adresse: item?.adresse || '', zimmer: 1, flaeche: 30, kaltmiete: 0 });
    setOpen(true);
  };

  const onCreateWohnung = async (values: WohnungValues) => {
    if (!item) return;
    try {
      await immobilienRepo.create({ ...values, typ: 'Wohnung', parent_id: item.id } as any);
      toast({ title: 'Angelegt', description: 'Wohnung wurde erstellt.' });
      const ws = await immobilienRepo.listWohnungenByHaus(item.id);
      setWohnungen(Array.isArray(ws) ? ws : []);
      setOpen(false);
    } catch (e) {
      console.error(e);
      toast({ title: 'Fehler', description: 'Anlegen fehlgeschlagen.', variant: 'destructive' });
    }
  };

  const onEditWohnung = (row: any) => {
    navigate('/immobilien'); // Bearbeiten erfolgt in der bestehenden Liste/Form
  };

  const onDeleteWohnung = async (row: any) => {
    if (!confirm('Wohnung wirklich löschen?')) return;
    try {
      await immobilienRepo.remove(row.id);
      toast({ title: 'Gelöscht', description: 'Wohnung wurde gelöscht.' });
      if (item) {
        const ws = await immobilienRepo.listWohnungenByHaus(item.id);
        setWohnungen(Array.isArray(ws) ? ws : []);
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Fehler', description: 'Löschen fehlgeschlagen.', variant: 'destructive' });
    }
  };

  if (!item) return <div className="p-6"><p className="text-muted-foreground">Keine Immobilie gefunden.</p></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{item.bezeichnung}</h1>
          <p className="text-muted-foreground">{item.adresse}{item.ort ? `, ${item.ort}` : ''}</p>
        </div>
        <div>
          <Button variant="outline" onClick={() => navigate('/immobilien')}>Zur Liste</Button>
        </div>
      </div>

      {isHaus ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Wohnungen</h2>
            <Button onClick={onAddWohnung}>Neu Wohnung</Button>
          </div>
          <DataTable
            title="Wohnungen"
            data={Array.isArray(wohnungen) ? wohnungen : []}
            columns={[
              { key: 'bezeichnung' as any, label: 'Bezeichnung' },
              { key: 'adresse' as any, label: 'Adresse' },
              { key: 'zimmer' as any, label: 'Zimmer', className: 'text-center' },
            ]}
            searchKeys={['bezeichnung', 'adresse'] as any}
            onAdd={onAddWohnung}
            onEdit={onEditWohnung as any}
            onDelete={onDeleteWohnung as any}
          />
        </div>
      ) : (
        <div>
          <p>Teil einer Anlage: {item.parent_id ? (
            <Link to={`/immobilien/${item.parent_id}`} className="underline">Zum Haus</Link>
          ) : '-'}
          </p>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Wohnung</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onCreateWohnung)} className="space-y-4">
              <FormField control={form.control} name="bezeichnung" render={({ field }) => (
                <FormItem>
                  <FormLabel>Bezeichnung</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="adresse" render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="zimmer" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zimmer</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="flaeche" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fläche (m²)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="kaltmiete" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kaltmiete (EUR)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
                <Button type="submit">Anlegen</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
