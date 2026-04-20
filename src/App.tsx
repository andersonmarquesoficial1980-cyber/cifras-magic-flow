import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "./pages/Dashboard.tsx";
import Index from "./pages/Index.tsx";
import MusicaDetail from "./pages/MusicaDetail.tsx";
import NotFound from "./pages/NotFound.tsx";
import Afinador from "./pages/Afinador.tsx";
import Metronomo from "./pages/Metronomo.tsx";
import Estude from "./pages/Estude.tsx";
import MestreDoRitmo from "./pages/MestreDoRitmo.tsx";
import OuvidoBionico from "./pages/OuvidoBionico.tsx";
import Configuracoes from "./pages/Configuracoes.tsx";
import ArtistaDetail from "./pages/ArtistaDetail.tsx";
import Feedback from "./pages/Feedback.tsx";
import Artistas from "./pages/Artistas.tsx";
import Generos from "./pages/Generos.tsx";
import GeneroDetail from "./pages/GeneroDetail.tsx";
import CifraRapida from "./pages/CifraRapida.tsx";
import Landing from "./pages/Landing.tsx";
import { AuthContext, useAuthState } from "@/hooks/useAuth";
import { BottomNav } from "@/components/BottomNav";

const queryClient = new QueryClient();

function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthState();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ paddingBottom: '70px' }}>
      {children}
      <BottomNav />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/cifras" element={<Index />} />
            <Route path="/afinador" element={<Afinador />} />
            <Route path="/metronomo" element={<Metronomo />} />
            <Route path="/estude" element={<Estude />} />
            <Route path="/estude/ritmo" element={<MestreDoRitmo />} />
            <Route path="/estude/ouvido" element={<OuvidoBionico />} />
            <Route path="/musica/:id" element={<MusicaDetail />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/artista/:nome" element={<ArtistaDetail />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/artistas" element={<Artistas />} />
            <Route path="/generos" element={<Generos />} />
            <Route path="/genero/:nome" element={<GeneroDetail />} />
            <Route path="/estude/cifra-rapida" element={<CifraRapida />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Layout>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
