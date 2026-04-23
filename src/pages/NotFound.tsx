import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Se vier do Mercado Pago com payment=success, vai direto pra configuracoes
    const params = new URLSearchParams(location.search);
    if (params.get('payment') === 'success' || params.get('collection_status') === 'approved') {
      navigate('/configuracoes?payment=success', { replace: true });
      return;
    }
    // Qualquer outra rota desconhecida → Home
    const timer = setTimeout(() => navigate('/', { replace: true }), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-foreground">404</h1>
        <p className="mb-4 text-sm text-muted-foreground">Redirecionando...</p>
      </div>
    </div>
  );
};

export default NotFound;
