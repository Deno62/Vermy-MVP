import { useEffect, useState } from "react";
import { mieterRepo } from "@/repositories/mieterRepo";
import { immobilienRepo } from "@/repositories/immobilienRepo";

type Mieter = {
  id: string;
  vorname?: string;
  nachname?: string;
  email?: string;
  telefon?: string;
  immobilien_id?: string | null;
  hauptmieter?: boolean;
  status?: string;
};

type Immobilie = { id: string; bezeichnung: string; typ: "Haus" | "Wohnung" };

export default function MieterPage() {
  const [rows, setRows] = useState<Mieter[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState<Partial<Mieter>>({ hauptmieter: false, status: "aktiv" });
  const [wohnungen, setWohnungen] = useState<Immobilie[]>([]);

  async function load() {
    setLoading(true);
    try {
      setRows(await mieterRepo.list());
      setWohnungen(await immobilienRepo.list({ typ: "Wohnung" }));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    const payload: any = {
      vorname: form.vorname?.trim() || "",
      nachname: form.nachname?.trim() || "",
      email: form.email?.trim() || "",
      telefon: form.telefon?.trim() || "",
      immobilien_id: form.immobilien_id || null,
      hauptmieter: !!form.hauptmieter,
      status: form.status || "aktiv",
    };
    await mieterRepo.create(payload);
    setShowDialog(false);
    setForm({ hauptmieter: false, status: "aktiv" });
    await load();
  }

  async function onDelete(id: string) {
    if (!confirm("Wirklich löschen?")) return;
    await mieterRepo.remove(id);
    await load();
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Mieter</h1>
        <button className="px-3 py-2 rounded bg-black text-white" onClick={() => setShowDialog(true)}>
          + Neu
        </button>
      </div>

      {loading ? <div>lädt…</div> : (
        <table className="w-full text-sm border rounded">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">E-Mail</th>
              <th className="text-left p-2">Telefon</th>
              <th className="text-left p-2">Wohnung</th>
              <th className="text-left p-2">Hauptmieter</th>
              <th className="text-left p-2">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{[r.vorname, r.nachname].filter(Boolean).join(" ") || "—"}</td>
                <td className="p-2">{r.email || "—"}</td>
                <td className="p-2">{r.telefon || "—"}</td>
                <td className="p-2">
                  {r.immobilien_id
                    ? (wohnungen.find(w => w.id === r.immobilien_id)?.bezeichnung || "—")
                    : "—"}
                </td>
                <td className="p-2">{r.hauptmieter ? "Ja" : "Nein"}</td>
                <td className="p-2">
                  <button className="text-red-600" onClick={() => onDelete(r.id)}>Löschen</button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td className="p-2 text-gray-500" colSpan={6}>Keine Mieter vorhanden.</td></tr>
            )}
          </tbody>
        </table>
      )}

      {showDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <form onSubmit={onCreate} className="bg-white w-full max-w-md rounded p-4 space-y-3">
            <h2 className="text-lg font-medium">Neuer Mieter</h2>

            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-sm">Vorname</span>
                <input className="w-full border rounded px-2 py-1"
                  value={form.vorname || ""}
                  onChange={e => setForm(f => ({ ...f, vorname: e.target.value }))} />
              </label>
              <label className="block">
                <span className="text-sm">Nachname</span>
                <input className="w-full border rounded px-2 py-1"
                  value={form.nachname || ""}
                  onChange={e => setForm(f => ({ ...f, nachname: e.target.value }))} />
              </label>
            </div>

            <label className="block">
              <span className="text-sm">E-Mail</span>
              <input className="w-full border rounded px-2 py-1"
                value={form.email || ""}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </label>

            <label className="block">
              <span className="text-sm">Telefon</span>
              <input className="w-full border rounded px-2 py-1"
                value={form.telefon || ""}
                onChange={e => setForm(f => ({ ...f, telefon: e.target.value }))} />
            </label>

            <label className="block">
              <span className="text-sm">Wohnung (optional)</span>
              <select
                className="w-full border rounded px-2 py-1"
                value={form.immobilien_id || ""}
                onChange={e => setForm(f => ({ ...f, immobilien_id: e.target.value || null }))}
              >
                <option value="">— keine —</option>
                {wohnungen.map(w => (
                  <option key={w.id} value={w.id}>{w.bezeichnung}</option>
                ))}
              </select>
            </label>

            <label className="inline-flex items-center gap-2">
              <input type="checkbox"
                checked={!!form.hauptmieter}
                onChange={e => setForm(f => ({ ...f, hauptmieter: e.target.checked }))} />
              <span>Hauptmieter</span>
            </label>

            <div className="flex gap-2 justify-end">
              <button type="button" className="px-3 py-2 rounded border" onClick={() => setShowDialog(false)}>
                Abbrechen
              </button>
              <button type="submit" className="px-3 py-2 rounded bg-black text-white">
                Speichern
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
