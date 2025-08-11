import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import DataTable from '@/components/common/DataTable';
import { Immobilie } from '@/types/entities';
import { Building2, MapPin, Users } from 'lucide-react';
import { immobilienRepository } from '@/repositories/immobilienRepository';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const schema = z.object({
  bezeichnung: z.string().min(1, 'Bezeichnung ist erforderlich'),
  adresse: z.string().min(1, 'Adresse ist erforderlich'),
  plz: z.string().optional(),
  ort: z.string().optional(),
  art: z.enum(['Wohnung', 'Haus', 'Gewerbe', 'Garage', 'Sonstiges'], { required_error: 'Art ist erforderlich' }),
  zimmer: z.coerce.number().int().min(1, 'Mindestens 1 Zimmer'),
  flaeche: z.coerce.number().min(0, 'Ungültige Fläche'),
  kaltmiete: z.coerce.number().min(0, 'Ungültige Kaltmiete').optional(),
  status: z.enum(['Verfügbar', 'Vermietet', 'Wartung', 'Leerstand']),
});

type FormValues = z.infer<typeof schema>;

const ImmobilienPage = () => {
  const [immobilien, setImmobilien] = useState<Immobilie[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Immobilie | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      bezeichnung: '', adresse: '', plz: '', ort: '', art: 'Wohnung', zimmer: 1, flaeche: 30, kaltmiete: 0, status: 'Verfügbar',
    },
  });

  useEffect(() => {
    loadImmobilien();
  }, []);

  const loadImmobilien = async () => {
    setLoading(true);
    const data = await immobilienRepository.list();
    setImmobilien(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const handleAdd = () => {
    setEditing(null);
    form.reset({ bezeichnung: '', adresse: '', plz: '', ort: '', art: 'Wohnung', zimmer: 1, flaeche: 30, kaltmiete: 0, status: 'Verfügbar' });
    setOpen(true);
  };

  const handleEdit = (immobilie: Immobilie) => {
    setEditing(immobilie);
    form.reset({
      bezeichnung: immobilie.bezeichnung,
      adresse: immobilie.adresse,
      plz: (immobilie as any).plz || '',
      ort: (immobilie as any).ort || '',
      art: immobilie.art as any,
      zimmer: immobilie.zimmer || 1,
      flaeche: (immobilie as any).flaeche || 0,
      kaltmiete: (immobilie as any).kaltmiete || 0,
      status: immobilie.status as any,
    });
    setOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    if (editing) {
      await immobilienRepository.update(editing.id, {
        ...values,
        updated_at: new Date(),
      } as any);
    } else {
      await immobilienRepository.create(values as any);
    }
    setOpen(false);
    setEditing(null);
    await loadImmobilien();
  };

  const handleDelete = async (immobilie: Immobilie) => {
    if (confirm(`Möchten Sie die Immobilie "${immobilie.bezeichnung}" wirklich löschen?`)) {
      await immobilienRepository.remove(immobilie.id);
      loadImmobilien();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'Verfügbar': 'default',
      'Vermietet': 'secondary',
      'Wartung': 'destructive',
      'Leerstand': 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status}
      </Badge>
    );
  };

  const formatCurrency = (amount: number | undefined) => {
    if (!amount && amount !== 0) return '-';
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount!);
  };

  const rentedCount = useMemo(() => (Array.isArray(immobilien) ? immobilien.filter(i => i.status === 'Vermietet') : []).length, [immobilien]);

  const columns = [
    {
      key: 'bezeichnung' as keyof Immobilie,
      label: 'Bezeichnung',
      sortable: true,
      render: (value: string, row: Immobilie) => (
        <div className="flex items-center space-x-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-sm text-muted-foreground">{(row as any).art}</div>
          </div>
        </div>
      )
    },
    {
      key: 'adresse' as keyof Immobilie,
      label: 'Adresse',
      sortable: true,
      render: (value: string, row: Immobilie) => (
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <div>
            <div>{value}</div>
            <div className="text-sm text-muted-foreground">{(row as any).plz} {(row as any).ort}</div>
          </div>
        </div>
      )
    },
    {
      key: 'zimmer' as keyof Immobilie,
      label: 'Zimmer',
      sortable: true,
      className: 'text-center'
    },
    {
      key: 'flaeche' as keyof Immobilie,
      label: 'Fläche (m²)',
      sortable: true,
      render: (value: number) => `${value} m²`,
      className: 'text-right'
    },
    {
      key: 'kaltmiete' as keyof Immobilie,
      label: 'Kaltmiete',
      sortable: true,
      render: (value: number) => formatCurrency(value as any),
      className: 'text-right'
    },
    {
      key: 'status' as keyof Immobilie,
      label: 'Status',
      sortable: true,
      render: (value: string) => getStatusBadge(value as any)
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Immobilien</h1>
          <p className="text-muted-foreground">Verwalten Sie Ihre Immobilienobjekte</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span>{immobilien.length} Objekte</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{rentedCount} vermietet</span>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        title="Alle Immobilien"
        data={Array.isArray(immobilien) ? immobilien : []}
        columns={columns as any}
        searchKeys={['bezeichnung', 'adresse', 'ort', 'status'] as any}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
        emptyMessage="Keine Immobilien gefunden"
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Immobilie bearbeiten' : 'Neue Immobilie'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="bezeichnung" render={({ field }) => (
                <FormItem>
                  <FormLabel>Bezeichnung</FormLabel>
                  <FormControl>
                    <Input placeholder="z. B. Musterstraße 1 – Wohnung 3" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="adresse" render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse</FormLabel>
                  <FormControl>
                    <Input placeholder="Straße und Hausnummer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="plz" render={({ field }) => (
                  <FormItem>
                    <FormLabel>PLZ</FormLabel>
                    <FormControl>
                      <Input placeholder="PLZ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="ort" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ort</FormLabel>
                    <FormControl>
                      <Input placeholder="Ort" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="art" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Art</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Art wählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {['Wohnung','Haus','Gewerbe','Garage','Sonstiges'].map(a => (
                          <SelectItem key={a} value={a}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

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
                      {['Verfügbar','Vermietet','Wartung','Leerstand'].map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
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

export default ImmobilienPage;
