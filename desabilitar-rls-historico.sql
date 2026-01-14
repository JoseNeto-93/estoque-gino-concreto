-- ============================================
-- DESABILITAR RLS NA TABELA HISTORICO
-- Execute este script no Supabase SQL Editor
-- ============================================

-- Desabilitar Row Level Security na tabela historico
ALTER TABLE historico DISABLE ROW LEVEL SECURITY;

-- Verificar se RLS está desabilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('estoque', 'historico');
