import { useEffect, useMemo, useState } from "react";
import { immobilienRepo } from "@/repositories/immobilienRepo"; // ✅ named export nutzen

type Immobilie = {
  id: string;
  bezeichnung: string;
  typ: "Haus" | "Wohnung";
  status?: string;
  parent_id?: string | null;
  adresse?: string;
  zimmer?: number;
  flaeche_qm?: number;
  kaltmiete?: number;
};

export default function ImmobilienPage() {
  const [rows, setRows] = useState<Immobilie[]>([]);
  const [loading, setLoading] = useState(false);

  // Dialog + Form
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState<Partial<Immobilie>>({
    typ: "Haus",
    status: "frei",
  });

  // Haus-Auswahl für Wohnungen
  const [hausOptions, setHausOptions] = useState<Immobilie[]>([]);
  const isWohnung = useMemo(() => form.typ === "Wohnung", [form.typ]);

  async function load() {
    setLoading(true);
    try {
      // Alle Immobilien
      const list = await immobilienRepo.list();
      setRows(list);

      // Nur Häuser als Parent-Optionen
      const haeuser = await immobilienRepo.list({ typ: "Haus", parentId: null });
      setHausOptions(haeuser);
    } catch (e) {
      console.error(e);
      alert("Fehler beim Laden der Immobilien.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Falls der Typ im Formular auf "Haus" wechselt → parent_id leeren
  useEffect(() => {
    if (!isWohnung && form.parent_id) {
      setForm((f) => ({ ...f, parent_id: null }));
    }
  }, [isWohnung, form.parent_id]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload: any = {
        bezeichnung: (form.bezeichnung || "").trim() || "Ohne Titel",
        typ: form.typ || "Haus",
        status: form.status || "frei",
        // Nur für Wohnung parent_id setzen
        parent_id: form.typ === "Wohnung" ? (form.parent_id || null) : null,
        adresse: form.adresse || "",
        zimmer: form.zimmer ? Number(form.zimmer) : undefined,
        flaeche_qm: form.flaeche_qm ? Number(form.flaeche_qm) : undefined,
        kaltmiete: form.kaltmiete ? Number(form.kaltmiete) : undefined,
      };

      // Validierung: Wohnung braucht ein Parent-Haus
      if (payload.typ === "Wohnung" && !payload.parent_id) {
        alert("Bitte ein Parent-Haus auswählen.");
        return;
      }

      await immobilienRepo.create(payload);
      setShowDialog(false);
      setForm({ typ: "Haus", status: "frei" });
      await load();
    } catch (e) {
      console.error(e);
      alert("Speichern fehlgeschlagen.");
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Wirklich löschen?")) return;
    try {
      await immobilienRepo.remove(id);
      await load();
    } catch (e) {
      console.error(e);
      alert("Löschen fehlgeschlagen.");
    }
  }

  // Parent-Haus-Name anzeigen
  function renderParentName(r: Immobilie) {
    if (r.typ === "Wohnung") {
      if (!r.parent_id) return "– (kein Haus)";
      const parent = rows.find((h) => h.id === r.parent_id);
      return parent?.bezeichnung || "—";
    }
    return "—"; // Häuser haben keinen Parent
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Immobilien</h1>
        <button
          className="px-3 py-2 rounded bg-black text-white"
          onClick={() => setShowDialog(true)}
        >
          + Neu
        </button>
      </div>

      {loading ? (
        <div>lädt…</div>
      ) : (
        <table className="w-full text-sm border rounded">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Bezeichnung</th>
              <th className="text-left p-2">Typ</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Parent (Haus)</th>
              <th className="text-left p-2 w-32">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.bezeichnung}</td>
                <td className="p-2">{r.typ}</td>
                <td className="p-2">{r.status || "-"}</td>
                <td className="p-2">{renderParentName(r)}</td>
                <td className="p-2">
                  <button className="text-red-600" onClick={() => onDelete(r.id)}>
                    Löschen
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="p-2 text-gray-500" colSpan={5}>
                  Keine Immobilien vorhanden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {showDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form
            onSubmit={onCreate}
            className="bg-white w-full max-w-md rounded p-4 space-y-3 shadow-lg"
          >
            <h2 className="text-lg font-medium">Neue Immobilie</h2>

            <label className="block">
              <span className="text-sm">Bezeichnung</span>
              <input
                className="w-full border rounded px-2 py-1"
                value={form.bezeichnung || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bezeichnung: e.target.value }))
                }
                required
              />
            </label>

            <label className="block">
              <span className="text-sm">Typ</span>
              <select
                className="w-full border rounded px-2 py-1"
                value={form.typ || "Haus"}
                onChange={(e) =>
                  setForm((f) => ({ ...f, typ: e.target.value as any }))
                }
              >
                <option>Haus</option>
                <option>Wohnung</option>
              </select>
            </label>

            {isWohnung && (
              <label className="block">
                <span className="text-sm">Parent-Haus</span>
                <select
                  className="w-full border rounded px-2 py-1"
                  value={form.parent_id || ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      parent_id: e.target.value || null,
                    }))
                  }
                  required
                >
                  <option value="">— bitte wählen —</option>
                  {hausOptions.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.bezeichnung}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="block">
              <span className="text-sm">Adresse</span>
              <input
                className="w-full border rounded px-2 py-1"
                value={form.adresse || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, adresse: e.target.value }))
                }
                placeholder="Straße Nr, PLZ Ort"
              />
            </label>

            <div className="grid grid-cols-3 gap-2">
              <label className="block">
                <span className="text-sm">Zimmer</span>
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1"
                  value={form.zimmer ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, zimmer: Number(e.target.value) }))
                  }
                  min={0}
                />
              </label>
              <label className="block">
                <span className="text-sm">Fläche (qm)</span>
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1"
                  value={form.flaeche_qm ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      flaeche_qm: Number(e.target.value),
                    }))
                  }
                  min={0}
                />
              </label>
              <label className="block">
                <span className="text-sm">Kaltmiete (€)</span>
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1"
                  value={form.kaltmiete ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      kaltmiete: Number(e.target.value),
                    }))
                  }
                  min={0}
                />
              </label>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="px-3 py-2 rounded border"
                onClick={() => setShowDialog(false)}
              >
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
