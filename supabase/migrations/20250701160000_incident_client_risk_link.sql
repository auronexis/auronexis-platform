-- Link incidents to Risk Engine V2 (client_risks) without breaking legacy risk_id FK
ALTER TABLE public.incidents
  ADD COLUMN IF NOT EXISTS client_risk_id UUID REFERENCES public.client_risks (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_incidents_client_risk_id ON public.incidents (client_risk_id);
