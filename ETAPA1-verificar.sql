-- ETAPA 1: VERIFICAR DUPLICATAS
-- Copie e execute SOMENTE este arquivo primeiro

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
