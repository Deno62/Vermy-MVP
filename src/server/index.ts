import express from 'express';
import cors from 'cors';
import { db, nowIso } from './db';
import { randomUUID } from 'crypto';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Root
app.get('/', (_req, res) => res.type('text').send('Vermy API läuft ✔ (Port 3001)'));

// Immobilien CRUD (MVP)
app.get('/api/immobilien', (_req, res) => {
  const rows = db.prepare("SELECT * FROM immobilien ORDER BY created_at DESC").all();
  res.json(rows);
});

app.post('/api/immobilien', (req, res) => {
  const id = randomUUID();
  const { bezeichnung, adresse, typ, zimmer=0, flaeche_qm=0, kaltmiete=0, status='frei', parent_id=null, notizen } = req.body || {};
  if (!bezeichnung || !typ) return res.status(400).json({ error: "bezeichnung und typ sind Pflicht" });
  db.prepare(`INSERT INTO immobilien (id,bezeichnung,adresse,typ,zimmer,flaeche_qm,kaltmiete,status,parent_id,notizen,created_at,updated_at)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, bezeichnung, adresse, typ, zimmer, flaeche_qm, kaltmiete, status, typ==='Haus'?null:parent_id, notizen, nowIso(), nowIso());
  res.json(db.prepare("SELECT * FROM immobilien WHERE id=?").get(id));
});

// Seed zum Test
app.post('/api/dev/seed', (_req,res)=>{
  const id = randomUUID();
  db.prepare(`INSERT INTO immobilien (id,bezeichnung,typ,created_at,updated_at) VALUES (?,?,?,?,?)`)
    .run(id,'Haus Beispiel','Haus',nowIso(),nowIso());
  res.json({ ok:true, id });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server läuft auf http://127.0.0.1:${PORT}`);
});
