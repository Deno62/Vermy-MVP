import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, seededCredentials } from '@/auth/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import logo from '@/assets/vermy-logo.png';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = login(email.trim(), password);
    setLoading(false);
    if (res.ok) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(res.error || 'Login fehlgeschlagen');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-4">
          <img src={logo} alt="Vermy Logo – Haus Icon" className="h-12 w-12 mx-auto" />
          <CardTitle className="text-xl">Vermy Anmeldung</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm">E-Mail</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm">Passwort</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <div className="text-sm text-destructive">{error}</div>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Bitte warten…' : 'Anmelden'}
            </Button>
            <div className="text-xs text-muted-foreground text-center">
              Demo: {seededCredentials.email} / {seededCredentials.password}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
