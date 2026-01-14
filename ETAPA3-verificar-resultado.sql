-- ETAPA 3: VERIFICAR RESULTADO
-- Execute SOMENTE depois da ETAPA 2
-- Deve mostrar 54 itens total (6 materiais por usina × 9 usinas)

SELECT 
    COUNT(*) as total_itens,
    COUNT(DISTINCT usina) as total_usinas,
    COUNT(DISTINCT nome) as total_materiais
FROM estoque;

SELECT usina, COUNT(*) as materiais
FROM estoque
GROUP BY usina
ORDER BY usina;
