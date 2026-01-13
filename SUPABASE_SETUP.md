# Configuração Supabase para Sistema Multiusuário em Tempo Real

## Descrição
Este documento detalha a configuração necessária do Supabase para o sistema de controle de estoque funcionar corretamente em tempo real.

## Tabela Requerida: `estoque`

### Schema SQL

```sql
CREATE TABLE estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  quantidade FLOAT NOT NULL DEFAULT 0,
  usina TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX idx_estoque_usina ON estoque(usina);
CREATE INDEX idx_estoque_nome_usina ON estoque(nome, usina);
CREATE INDEX idx_estoque_updated_at ON estoque(updated_at DESC);
```

### Campos da Tabela

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único do item |
| `nome` | TEXT | Nome do material (ex: "BRITA 0", "AREIA MÉDIA", "SILO 1") |
| `quantidade` | FLOAT | Quantidade atual em kg |
| `usina` | TEXT | Identificador da usina (ex: "Angatuba", "Avaré") |
| `updated_at` | TIMESTAMP | Data/hora da última atualização |
| `created_at` | TIMESTAMP | Data/hora de criação |

### Valores Iniciais Sugeridos

```sql
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
-- Continue para todas as usinas...
('BRITA 0', 0, 'Carlópolis'),
('BRITA 1', 0, 'Carlópolis'),
('AREIA MÉDIA', 0, 'Carlópolis'),
('AREIA DE BRITA', 0, 'Carlópolis'),
('SILO 1', 0, 'Carlópolis'),
('SILO 2', 0, 'Carlópolis');
```

## Configuração do Realtime

O Supabase Realtime deve estar ativado para a tabela `estoque`:

1. No painel do Supabase, acesse a tabela `estoque`
2. Clique em "Realtime" no menu superior
3. Certifique-se de que "Turnon" está ativado para todos os eventos (INSERT, UPDATE, DELETE)

## Variáveis de Ambiente

Configure no arquivo `.env`:

```dotenv
VITE_SUPABASE_URL=https://[seu-projeto].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Você pode encontrar estas valores:
- No painel do Supabase > Settings > API
- `VITE_SUPABASE_URL` = URL do projeto
- `VITE_SUPABASE_ANON_KEY` = "anon public" key

## Políticas de Segurança RLS (Row Level Security)

Para melhor segurança em produção, implemente RLS:

```sql
-- Habilitar RLS
ALTER TABLE estoque ENABLE ROW LEVEL SECURITY;

-- Permitir leitura para todos os usuários autenticados
CREATE POLICY "Enable read access for all authenticated users" ON estoque
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Permitir inserção para usuários admin
CREATE POLICY "Enable insert for admin users" ON estoque
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Permitir atualização para usuários admin
CREATE POLICY "Enable update for admin users" ON estoque
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin');

-- Permitir deleção para usuários admin
CREATE POLICY "Enable delete for admin users" ON estoque
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin');
```

## Funções Principais do dataService.ts

### `listarEstoque()`
- Busca todos os itens da tabela estoque
- Retorna: `EstoqueItem[]`

### `criarItemEstoque(nome, quantidade, usina)`
- Cria um novo item no estoque
- Parâmetros:
  - `nome`: string (ex: "BRITA 0")
  - `quantidade`: number (em kg)
  - `usina`: UsinaName
- Retorna: `EstoqueItem | null`

### `atualizarItemEstoque(id, quantidade)`
- Atualiza a quantidade de um item existente
- Parâmetros:
  - `id`: string (UUID do item)
  - `quantidade`: number (novo valor em kg)
- Retorna: `EstoqueItem | null`

### `removerItemEstoque(id)`
- Remove um item do estoque
- Parâmetros:
  - `id`: string (UUID do item)
- Retorna: boolean

### `loadInitialState()`
- Carrega o estado inicial da aplicação
- Busca todos os itens do banco e constrói o AppState
- Retorna: `AppState`

### `subscribeToChanges(callback)`
- Subscreve a mudanças em tempo real via Supabase Realtime
- Escuta eventos: INSERT, UPDATE, DELETE
- Retorna: função de unsubscribe

## Fluxo de Sincronização em Tempo Real

1. **Mudança no Computador A**: 
   - Usuário altera estoque → chama `atualizarItemEstoque()` → insere no Supabase

2. **Disparo de Evento Realtime**:
   - Supabase detecta mudança na tabela `estoque`
   - Envia evento WebSocket para todos os clientes conectados

3. **Recebimento no Computador B**:
   - `subscribeToChanges()` recebe o evento
   - Callback recarrega os dados via `listarEstoque()`
   - Estado do React é atualizado automaticamente
   - UI reflete a mudança instantaneamente

## Teste de Funcionamento

Para testar se tudo está funcionando:

1. Abra a aplicação em dois navegadores (computadores diferentes se possível)
2. Faça login em ambos
3. Em um deles, altere o estoque de um material
4. Verifique se o outro navegador atualiza instantaneamente **sem refresh de página**

Você deve ver:
- ✅ Atualização instantânea entre abas/navegadores
- ✅ Sem refresh de página
- ✅ Sem polling (requisições periódicas)
- ✅ Comunicação via WebSocket (Realtime)

## Logs de Diagnóstico

O `dataService.ts` inclui logs detalhados do console:

```
[DataService] Inicializando com SUPABASE_URL: ...
[DataService] Cliente Supabase criado com sucesso
[listarEstoque] Itens carregados: 54
[subscribeToChanges] Criando channel Realtime...
[subscribeToChanges] Status de subscrição: SUBSCRIBED
[subscribeToChanges] Evento recebido: UPDATE...
```

Verifique o console do navegador (F12) para diagnóstico em caso de problemas.

## Troubleshooting

### Problema: "SUPABASE_URL ou SUPABASE_ANON_KEY não configurados"
- **Solução**: Verifique arquivo `.env` e certifique-se que usa prefixo `VITE_`

### Problema: Realtime não conecta
- **Solução**: 
  - Verifique se Realtime está ativado no Supabase para a tabela `estoque`
  - Confirme que a chave ANON KEY tem permissões de leitura

### Problema: Mudanças não sincronizam entre abas
- **Solução**: 
  - Verifique conexão de internet
  - Veja logs no console do navegador
  - Confirme que a tabela `estoque` existe no Supabase

## Referências

- Documentação Supabase: https://supabase.com/docs
- Supabase Realtime: https://supabase.com/docs/guides/realtime
- Supabase JavaScript Client: https://supabase.com/docs/reference/javascript/v2/getting-started
