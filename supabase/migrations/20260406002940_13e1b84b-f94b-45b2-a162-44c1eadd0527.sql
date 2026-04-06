-- Enable RLS on assinaturas
ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;

-- Users can only read their own subscription
CREATE POLICY "Users can read own subscription"
ON public.assinaturas
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- No client-side INSERT/UPDATE/DELETE — manage via edge functions with service_role key

-- Enable RLS on historico_flow
ALTER TABLE public.historico_flow ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read flow history
CREATE POLICY "Authenticated users can read flow history"
ON public.historico_flow
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert flow history
CREATE POLICY "Authenticated users can insert flow history"
ON public.historico_flow
FOR INSERT
TO authenticated
WITH CHECK (true);