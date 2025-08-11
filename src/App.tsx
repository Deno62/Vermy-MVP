import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import VermyLayout from "./components/layout/VermyLayout";
import DashboardPage from "./pages/DashboardPage";
import ImmobilienPage from "./pages/ImmobilienPage";
import ImmobilieDetailPage from "./pages/ImmobilieDetailPage";
import MieterPage from "./pages/MieterPage";
import FinanzenPage from "./pages/FinanzenPage";
import NebenkostenPage from "./pages/NebenkostenPage";
import WartungPage from "./pages/WartungPage";
import MahnwesenPage from "./pages/MahnwesenPage";
import DokumentePage from "./pages/DokumentePage";
import VertraegePage from "./pages/VertraegePage";
import VertragDetailPage from "./pages/VertragDetailPage";
import NotFound from "./pages/NotFound";
import LoginPage from "./components/auth/LoginPage";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { isAuthenticated } from "./auth/auth";

const queryClient = new QueryClient();

function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ErrorBoundary>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <VermyLayout currentModule="Dashboard" />
                </RequireAuth>
              }
            >
              <Route index element={<DashboardPage />} />
            </Route>
            <Route
              path="/immobilien"
              element={
                <RequireAuth>
                  <VermyLayout currentModule="Immobilien" />
                </RequireAuth>
              }
            >
              <Route index element={<ImmobilienPage />} />
              <Route path=":id" element={<ImmobilieDetailPage />} />
            </Route>
            <Route
              path="/mieter"
              element={
                <RequireAuth>
                  <VermyLayout currentModule="Mieter" />
                </RequireAuth>
              }
            >
              <Route index element={<MieterPage />} />
            </Route>
            <Route
              path="/finanzen"
              element={
                <RequireAuth>
                  <VermyLayout currentModule="Finanzen" />
                </RequireAuth>
              }
            >
              <Route index element={<FinanzenPage />} />
            </Route>
            <Route
              path="/nebenkosten"
              element={
                <RequireAuth>
                  <VermyLayout currentModule="Nebenkosten" />
                </RequireAuth>
              }
            >
              <Route index element={<NebenkostenPage />} />
            </Route>
            <Route
              path="/wartung"
              element={
                <RequireAuth>
                  <VermyLayout currentModule="Wartung & Mängel" />
                </RequireAuth>
              }
            >
              <Route index element={<WartungPage />} />
            </Route>
            <Route
              path="/mahnwesen"
              element={
                <RequireAuth>
                  <VermyLayout currentModule="Mahnwesen" />
                </RequireAuth>
              }
            >
              <Route index element={<MahnwesenPage />} />
            </Route>
            <Route
              path="/dokumente"
              element={
                <RequireAuth>
                  <VermyLayout currentModule="Dokumente" />
                </RequireAuth>
              }
            >
              <Route index element={<DokumentePage />} />
            </Route>
            <Route
              path="/vertraege"
              element={
                <RequireAuth>
                  <VermyLayout currentModule="Verträge" />
                </RequireAuth>
              }
            >
              <Route index element={<VertraegePage />} />
              <Route path=":id" element={<VertragDetailPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

