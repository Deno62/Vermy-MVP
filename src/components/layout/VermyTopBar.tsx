import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Bell, User, Settings, LogOut, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';
import { logout, getUser } from '@/auth/auth';
import { globalSearch } from '@/repositories/searchRepository';
import { exportBackup, downloadJSON, importBackup } from '@/utils/backup';

interface VermyTopBarProps {
  currentModule: string;
  onSearch?: (query: string) => void;
}

export default function VermyTopBar({ currentModule, onSearch }: VermyTopBarProps) {
  const navigate = useNavigate();
  const user = getUser();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ label: string; to: string; meta?: string }[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, []);

  useEffect(() => {
    onSearch?.(query);
    const run = async () => {
      const q = query.trim().toLowerCase();
      if (q.length < 2) {
        setResults([]);
        setOpen(false);
        return;
      }
      const { immobilien: immos, mieter, vertraege } = await globalSearch(q);
      const mapped: { label: string; to: string; meta?: string }[] = [];
      mapped.push(
        ...immos.slice(0, 5).map((i: any) => ({ label: `🏢 ${i.bezeichnung}`, to: `/immobilien`, meta: i.adresse })),
        ...mieter.slice(0, 5).map((m: any) => ({ label: `👤 ${m.anrede} ${m.vorname} ${m.nachname}`, to: `/mieter`, meta: m.email })),
        ...vertraege.slice(0, 5).map((v: any) => ({ label: `📄 Vertrag ${v.mietvertrags_id || v.id.slice(0,6)}`, to: `/finanzen`, meta: v.status }))
      );
      setResults(mapped);
      setOpen(mapped.length > 0);
    };
    run();
  }, [query]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="bg-crm-topbar border-b border-border h-16 flex items-center justify-between px-6 shadow-sm">
      {/* Left section - Current module */}
      <div className="flex items-center space-x-4">
        <h2 className="text-lg font-semibold text-foreground">{currentModule}</h2>
      </div>

      {/* Center section - Search */}
      <div className="flex-1 max-w-md mx-8" ref={containerRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Global suchen…"
            className="pl-10 bg-background border-border"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length && setOpen(true)}
          />
          {open && results.length > 0 && (
            <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
              <ul className="max-h-64 overflow-auto">
                {results.map((r, idx) => (
                  <li key={idx} className="border-b last:border-b-0">
                    <Link to={r.to} onClick={() => setOpen(false)} className="block px-3 py-2 hover:bg-muted">
                      <div className="text-sm">{r.label}</div>
                      {r.meta && <div className="text-xs text-muted-foreground">{r.meta}</div>}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Right section - Actions */}
      <div className="flex items-center space-x-3">
        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center">
            3
          </Badge>
        </Button>

        {/* Settings */}
        <Button variant="ghost" size="sm" onClick={() => navigate('/einstellungen')}>
          <Settings className="h-4 w-4" />
        </Button>

        {/* Backup Export */}
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            try {
              const bundle = await exportBackup();
              const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
              downloadJSON(bundle, `vermy-backup-${stamp}.json`);
            } catch (e) {
              console.error(e);
              alert('Backup-Export fehlgeschlagen.');
            }
          }}
          title="Backup exportieren"
        >
          <Download className="h-4 w-4" />
        </Button>

        {/* Backup Import */}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const text = await file.text();
              const json = JSON.parse(text);
              if (confirm('Achtung: Alle lokalen Daten werden durch das Backup ersetzt. Fortfahren?')) {
                await importBackup(json);
                window.location.reload();
              }
            } catch (err) {
              console.error(err);
              alert('Ungültige Backup-Datei.');
            } finally {
              e.currentTarget.value = '';
            }
          }}
        />
        <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} title="Backup importieren">
          <Upload className="h-4 w-4" />
        </Button>

        {/* User Profile */}
        <Button variant="ghost" size="sm" className="flex items-center space-x-2">
          <User className="h-4 w-4" />
          <span className="hidden md:inline text-sm">{user?.name || 'Benutzer'}</span>
        </Button>

        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" /> Abmelden
        </Button>
      </div>
    </header>
  );
}
