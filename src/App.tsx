import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import VermyLayout from "./components/layout/VermyLayout";
import DashboardPage from "./pages/DashboardPage";
import ImmobilienPage from "./pages/ImmobilienPage";
import MieterPage from "./pages/MieterPage";
import FinanzenPage from "./pages/FinanzenPage";
import NebenkostenPage from "./pages/NebenkostenPage";
import WartungPage from "./pages/WartungPage";
import MahnwesenPage from "./pages/MahnwesenPage";
import DokumentePage from "./pages/DokumentePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<VermyLayout currentModule="Dashboard" />}>
            <Route index element={<DashboardPage />} />
          </Route>
          <Route path="/immobilien" element={<VermyLayout currentModule="Immobilien" />}>
            <Route index element={<ImmobilienPage />} />
          </Route>
          <Route path="/mieter" element={<VermyLayout currentModule="Mieter" />}>
            <Route index element={<MieterPage />} />
          </Route>
          <Route path="/finanzen" element={<VermyLayout currentModule="Finanzen" />}>
            <Route index element={<FinanzenPage />} />
          </Route>
          <Route path="/nebenkosten" element={<VermyLayout currentModule="Nebenkosten" />}>
            <Route index element={<NebenkostenPage />} />
          </Route>
          <Route path="/wartung" element={<VermyLayout currentModule="Wartung & Mängel" />}>
            <Route index element={<WartungPage />} />
          </Route>
          <Route path="/mahnwesen" element={<VermyLayout currentModule="Mahnwesen" />}>
            <Route index element={<MahnwesenPage />} />
          </Route>
          <Route path="/dokumente" element={<VermyLayout currentModule="Dokumente" />}>
            <Route index element={<DokumentePage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
