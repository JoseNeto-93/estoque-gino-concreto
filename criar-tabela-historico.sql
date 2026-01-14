-- ============================================
-- CRIAR TABELA DE HISTÓRICO
-- Permite sincronizar últimas atividades entre navegadores
-- ============================================

CREATE TABLE IF NOT EXISTS historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usina TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_historico_usina ON historico(usina);
CREATE INDEX IF NOT EXISTS idx_historico_timestamp ON historico(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_historico_usina_timestamp ON historico(usina, timestamp DESC);

-- Verificar criação
SELECT COUNT(*) as total_registros FROM historico;
