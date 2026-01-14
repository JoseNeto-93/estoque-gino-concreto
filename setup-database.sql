-- ============================================
-- SCRIPT DE CRIAÇÃO DO BANCO DE DADOS
-- Sistema de Controle de Estoque - Gino Concreto
-- ============================================

-- 1. CRIAR TABELA ESTOQUE
-- ============================================

CREATE TABLE IF NOT EXISTS estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  quantidade FLOAT NOT NULL DEFAULT 0,
  usina TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(nome, usina)  -- Previne duplicatas: cada material só pode aparecer uma vez por usina
);

-- 2. CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_estoque_usina ON estoque(usina);
CREATE INDEX IF NOT EXISTS idx_estoque_updated_at ON estoque(updated_at DESC);

-- 3. CRIAR FUNÇÃO PARA ATUALIZAR updated_at AUTOMATICAMENTE
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. CRIAR TRIGGER PARA ATUALIZAR updated_at
-- ============================================

DROP TRIGGER IF EXISTS update_estoque_updated_at ON estoque;

CREATE TRIGGER update_estoque_updated_at
    BEFORE UPDATE ON estoque
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. LIMPAR DUPLICATAS E INSERIR DADOS INICIAIS
-- ============================================

-- IMPORTANTE: Remove duplicatas mantendo apenas o registro mais recente
DELETE FROM estoque a USING estoque b
WHERE a.id < b.id 
AND a.nome = b.nome 
AND a.usina = b.usina;

INSERT INTO estoque (nome, quantidade, usina) VALUES
-- Angatuba
('BRITA 0', 0, 'Angatuba'),
('BRITA 1', 0, 'Angatuba'),
('AREIA MÉDIA', 0, 'Angatuba'),
('AREIA DE BRITA', 0, 'Angatuba'),
('SILO 1', 0, 'Angatuba'),
('SILO 2', 0, 'Angatuba'),

-- Avaré
('BRITA 0', 0, 'Avaré'),
('BRITA 1', 0, 'Avaré'),
('AREIA MÉDIA', 0, 'Avaré'),
('AREIA DE BRITA', 0, 'Avaré'),
('SILO 1', 0, 'Avaré'),
('SILO 2', 0, 'Avaré'),

-- Carlópolis
('BRITA 0', 0, 'Carlópolis'),
('BRITA 1', 0, 'Carlópolis'),
('AREIA MÉDIA', 0, 'Carlópolis'),
('AREIA DE BRITA', 0, 'Carlópolis'),
('SILO 1', 0, 'Carlópolis'),
('SILO 2', 0, 'Carlópolis'),

-- Itaporanga
('BRITA 0', 0, 'Itaporanga'),
('BRITA 1', 0, 'Itaporanga'),
('AREIA MÉDIA', 0, 'Itaporanga'),
('AREIA DE BRITA', 0, 'Itaporanga'),
('SILO 1', 0, 'Itaporanga'),
('SILO 2', 0, 'Itaporanga'),

-- Paranapanema
('BRITA 0', 0, 'Paranapanema'),
('BRITA 1', 0, 'Paranapanema'),
('AREIA MÉDIA', 0, 'Paranapanema'),
('AREIA DE BRITA', 0, 'Paranapanema'),
('SILO 1', 0, 'Paranapanema'),
('SILO 2', 0, 'Paranapanema'),

-- Piraju
('BRITA 0', 0, 'Piraju'),
('BRITA 1', 0, 'Piraju'),
('AREIA MÉDIA', 0, 'Piraju'),
('AREIA DE BRITA', 0, 'Piraju'),
('SILO 1', 0, 'Piraju'),
('SILO 2', 0, 'Piraju'),

-- Taquarituba
('BRITA 0', 0, 'Taquarituba'),
('BRITA 1', 0, 'Taquarituba'),
('AREIA MÉDIA', 0, 'Taquarituba'),
('AREIA DE BRITA', 0, 'Taquarituba'),
('SILO 1', 0, 'Taquarituba'),
('SILO 2', 0, 'Taquarituba'),

-- Ribeirão Claro
('BRITA 0', 0, 'Ribeirão Claro'),
('BRITA 1', 0, 'Ribeirão Claro'),
('AREIA MÉDIA', 0, 'Ribeirão Claro'),
('AREIA DE BRITA', 0, 'Ribeirão Claro'),
('SILO 1', 0, 'Ribeirão Claro'),
('SILO 2', 0, 'Ribeirão Claro'),

-- Jacarezinho
('BRITA 0', 0, 'Jacarezinho'),
('BRITA 1', 0, 'Jacarezinho'),
('AREIA MÉDIA', 0, 'Jacarezinho'),
('AREIA DE BRITA', 0, 'Jacarezinho'),
('SILO 1', 0, 'Jacarezinho'),
('SILO 2', 0, 'Jacarezinho')

-- Atualiza se já existir (devido à constraint UNIQUE), insere se não existir
ON CONFLICT (nome, usina) DO UPDATE SET
  quantidade = EXCLUDED.quantidade,
  updated_at = CURRENT_TIMESTAMP;

-- 6. VERIFICAR DADOS INSERIDOS
-- ============================================

SELECT 
    usina,
    COUNT(*) as total_materiais,
    SUM(quantidade) as quantidade_total
FROM estoque
GROUP BY usina
ORDER BY usina;

-- ============================================
-- CONFIGURAÇÃO ADICIONAL RECOMENDADA
-- ============================================

-- Habilitar Row Level Security (RLS) - OPCIONAL
-- Descomente as linhas abaixo se quiser segurança adicional

-- ALTER TABLE estoque ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública (desenvolvimento)
-- CREATE POLICY "Enable read access for all users" ON estoque
--   FOR SELECT
--   USING (true);

-- Política para permitir escrita pública (desenvolvimento)
-- CREATE POLICY "Enable write access for all users" ON estoque
--   FOR ALL
--   USING (true);

-- ============================================
-- FIM DO SCRIPT
-- ============================================
