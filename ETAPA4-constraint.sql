-- ETAPA 4: ADICIONAR CONSTRAINT
-- Execute SOMENTE se a ETAPA 3 mostrou 54 itens
-- Isso previne futuras duplicatas

ALTER TABLE estoque 
ADD CONSTRAINT estoque_nome_usina_unique 
UNIQUE (nome, usina);
