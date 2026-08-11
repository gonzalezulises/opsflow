-- Opcional: columnas de observabilidad en ai_interactions (también vía `npm run db:push`)
ALTER TABLE ai_interactions
  ADD COLUMN IF NOT EXISTS success boolean NOT NULL DEFAULT true;

ALTER TABLE ai_interactions
  ADD COLUMN IF NOT EXISTS error_message text;

COMMENT ON COLUMN ai_interactions.success IS 'false cuando la llamada a OpenAI falló o devolvió error estructurado';
COMMENT ON COLUMN ai_interactions.error_message IS 'Mensaje de error legible para métricas / circuit breaker por org';
