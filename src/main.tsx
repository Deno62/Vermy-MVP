import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { seedIfEmpty } from './db/vermyDb'

const container = document.getElementById("root")!;

seedIfEmpty().finally(() => {
  createRoot(container).render(<App />);
});
