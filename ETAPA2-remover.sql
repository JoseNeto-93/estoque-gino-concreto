-- ETAPA 2: REMOVER DUPLICATAS
-- Execute SOMENTE depois de ver os resultados da ETAPA 1

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

-- Verificar quantos registros foram deletados
SELECT COUNT(*) as registros_restantes FROM estoque;
