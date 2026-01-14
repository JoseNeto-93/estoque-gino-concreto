-- ============================================
-- SCRIPT PARA CORRIGIR DUPLICATAS NO BANCO
-- EXECUTE CADA ETAPA SEPARADAMENTE (uma de cada vez)
-- ============================================

-- ============================================
-- ETAPA 1: VERIFICAR DUPLICATAS
-- ============================================
SELECT 
    nome,
    usina,
    COUNT(*) as duplicatas
FROM estoque
GROUP BY nome, usina
HAVING COUNT(*) > 1
ORDER BY duplicatas DESC;

-- Total de registros atual
SELECT COUNT(*) as total_registros FROM estoque;


-- ============================================
-- ETAPA 2: REMOVER DUPLICATAS
-- Execute esta query SOZINHA depois de ver os resultados acima
-- ============================================
/*
DELETE FROM estoque 
WHERE id IN (
  SELECT id 
  FROM (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY nome, usina ORDER BY updated_at DESC, created_at DESC) as rn
    FROM estoque
  ) t
  WHERE rn > 1
);
*/


-- ============================================
-- ETAPA 3: VERIFICAR SE FICARAM 54 ITENS
-- Execute esta query SOZINHA depois da ETAPA 2
-- ============================================
/*
SELECT 
    COUNT(*) as total_itens,
    COUNT(DISTINCT usina) as total_usinas,
    COUNT(DISTINCT nome) as total_materiais
FROM estoque;

SELECT usina, COUNT(*) as materiais
FROM estoque
GROUP BY usina
ORDER BY usina;
*/


-- ============================================
-- ETAPA 4: ADICIONAR CONSTRAINT (só se ETAPA 3 mostrar 54 itens)
-- Execute esta query SOZINHA por último
-- ============================================
/*
ALTER TABLE estoque 
ADD CONSTRAINT estoque_nome_usina_unique 
UNIQUE (nome, usina);
*/
