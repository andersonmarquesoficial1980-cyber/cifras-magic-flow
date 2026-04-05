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
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/cifras" element={<Index />} />
          <Route path="/afinador" element={<Afinador />} />
          <Route path="/metronomo" element={<Metronomo />} />
          <Route path="/estude" element={<Estude />} />
          <Route path="/musica/:id" element={<MusicaDetail />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
