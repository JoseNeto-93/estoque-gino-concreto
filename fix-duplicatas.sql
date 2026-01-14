-- ============================================
-- SCRIPT PARA CORRIGIR DUPLICATAS NO BANCO
-- Execute este script no Supabase SQL Editor
-- ============================================

-- 1. VERIFICAR QUANTAS DUPLICATAS EXISTEM
SELECT 
    nome,
    usina,
    COUNT(*) as duplicatas,
    STRING_AGG(id::TEXT, ', ') as ids
FROM estoque
GROUP BY nome, usina
HAVING COUNT(*) > 1
ORDER BY duplicatas DESC;

-- 2. ADICIONAR CONSTRAINT UNIQUE (previne novas duplicatas)
ALTER TABLE estoque 
ADD CONSTRAINT estoque_nome_usina_unique 
UNIQUE (nome, usina);

-- 3. REMOVER DUPLICATAS (mantém apenas o mais recente)
DELETE FROM estoque a USING estoque b
WHERE a.id < b.id 
AND a.nome = b.nome 
AND a.usina = b.usina;

-- 4. VERIFICAR RESULTADO - deve ter 54 itens
SELECT 
    COUNT(*) as total_itens,
    COUNT(DISTINCT usina) as total_usinas,
    COUNT(DISTINCT nome) as total_materiais
FROM estoque;

-- 5. VERIFICAR ESTOQUE POR USINA
SELECT 
    usina,
    COUNT(*) as total_materiais
FROM estoque
GROUP BY usina
ORDER BY usina;
