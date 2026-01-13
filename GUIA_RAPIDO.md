# Guia Rápido de Início

## ✅ Transformação Concluída!

Seu sistema de controle de estoque agora é **multiusuário em tempo real** com Supabase Realtime.

---

## 1. Pré-requisitos

- [ ] Conta Supabase criada (https://supabase.com)
- [ ] Projeto Supabase criado
- [ ] Node.js 18+ instalado
- [ ] npm ou yarn disponível

---

## 2. Configuração Rápida (5 minutos)

### Passo 1: Criar Tabela no Supabase

1. Acesse sua conta Supabase
2. Vá para SQL Editor
3. Cole e execute:

```sql
CREATE TABLE estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  quantidade FLOAT NOT NULL DEFAULT 0,
  usina TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_estoque_usina ON estoque(usina);
CREATE INDEX idx_estoque_nome_usina ON estoque(nome, usina);
CREATE INDEX idx_estoque_updated_at ON estoque(updated_at DESC);
```

### Passo 2: Ativar Realtime

1. Na tabela `estoque`, vá para aba "Realtime"
2. Clique em "Turn on" se não estiver ativo
3. Confirme que INSERT, UPDATE, DELETE estão marcados

### Passo 3: Obter Credenciais

1. Vá para Settings > API
2. Copie:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` → `VITE_SUPABASE_ANON_KEY`

### Passo 4: Configurar `.env`

Crie/edite `.env` na raiz do projeto:

```dotenv
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=https://estoque-gino-concreto-production.up.railway.app
```

### Passo 5: Instalar e Testar

```bash
npm install
npm run dev
```

Abra http://localhost:3000 em dois navegadores/computadores para testar sincronização!

---

## 3. Teste de Funcionamento

### Teste Local (Mesmo Computador)

```bash
npm run dev
# Abra http://localhost:3000 em 2 abas do navegador
```

1. **Aba 1**: Faça login (balanceiro / 12345)
2. **Aba 2**: Faça login (visitante / 12345)
3. **Aba 1**: Altere um material (ex: BRITA 0 de 100 → 150)
4. **Aba 2**: Verifique se atualiza **instantaneamente**

### Teste Remoto (Computadores Diferentes)

1. Deploy em produção (Vercel, Railway, etc)
2. Acesse a URL em dois computadores diferentes
3. Faça mesmos testes acima

**Resultado esperado**: ✅ Sincronização instantânea sem refresh

---

## 4. Estrutura do Projeto

```
estoque-gino-concreto/
├── App.tsx                    # Componente principal (refatorado)
├── services/
│   ├── dataService.ts         # NOVO: Supabase Realtime
│   └── geminiService.ts       # Processamento de PDFs
├── components/
│   └── StockCard.tsx          # Card de materiais
├── .env                       # Variáveis de ambiente
├── SUPABASE_SETUP.md          # Guia detalhado de configuração
└── TRANSFORMACAO_COMPLETA.md  # Documentação completa
```

---

## 5. Principais Funções Supabase

### Listar estoque
```typescript
const items = await dataService.listarEstoque();
// Retorna todos os itens de todas as usinas
```

### Criar item
```typescript
await dataService.criarItemEstoque(
  'BRITA 0',      // nome
  100,            // quantidade (kg)
  'Angatuba'      // usina
);
```

### Atualizar item
```typescript
await dataService.atualizarItemEstoque(
  'item-uuid',    // id do item
  150             // nova quantidade
);
```

### Deletar item
```typescript
await dataService.removerItemEstoque('item-uuid');
```

### Subscrever a mudanças
```typescript
const unsubscribe = dataService.subscribeToChanges((data) => {
  console.log('Mudança recebida:', data.inventory);
});

// Depois para desinscrever:
unsubscribe();
```

---

## 6. Fluxo de Sincronização

```
Computador A                Supabase               Computador B
────────────                ────────              ────────────
    │                          │                       │
    ├─ Altera estoque          │                       │
    │  atualizarItemEstoque()  │                       │
    ├─────────────────────────>│                       │
    │                          ├─ Dispara evento       │
    │                          │  postgres_changes     │
    │                          │<──────────────────────┤
    │                          │   WebSocket           │
    │                          │   payload             │
    │                          │                       │
    │                          │  subscribeToChanges() │
    │                          │  callback acionado    │
    │                          │                       │
    │                          │  listarEstoque()      │
    │                          ├──────────────────────>│
    │                          │<──────────────────────┤
    │                          │   (novos dados)       │
    │                          │                       │
    │                          │  setState() atualiza  │
    │                          │  UI reflete mudança   │
```

---

## 7. Verificação Pós-Instalação

Execute no console do navegador (F12):

```javascript
// 1. Verificar logs do DataService
console.log('Procure por: [DataService] Cliente Supabase criado');

// 2. Verificar lista de materiais
dataService.listarEstoque().then(items => {
  console.log('Itens carregados:', items.length);
});

// 3. Verificar subscrição
const unsubscribe = dataService.subscribeToChanges((data) => {
  console.log('Mudança recebida!', data);
});
```

---

## 8. Troubleshooting

### ❌ "SUPABASE_URL ou SUPABASE_ANON_KEY não configurados"

**Solução**:
- [ ] Verifique arquivo `.env` na raiz
- [ ] Use prefixo `VITE_` nas variáveis
- [ ] Faça restart do servidor (`npm run dev`)

### ❌ Realtime não conecta

**Solução**:
- [ ] Verifique se Realtime está ativado na tabela `estoque`
- [ ] Confirme que ANON_KEY tem permissões
- [ ] Veja logs no F12 > Console

### ❌ Dados não sincronizam entre abas

**Solução**:
- [ ] Confirme que ambos os navegadores estão na mesma URL
- [ ] Faça login em ambos
- [ ] Veja logs no console (F12)
- [ ] Tente fazer refresh em uma aba

### ❌ "Cannot read property 'from' of null"

**Solução**:
- [ ] Variáveis de ambiente não carregadas
- [ ] Reinicie o servidor com `npm run dev`
- [ ] Verifique `.env`

---

## 9. Deploy em Produção

### Vercel (Recomendado)

```bash
npm install -g vercel
vercel
# Adicione variáveis de ambiente no painel do Vercel
```

### Railway

```bash
railway link
railway up
# Configure variáveis de ambiente
```

### Outras Plataformas

Sempre configure variáveis de ambiente:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 10. Documentação Completa

- **SUPABASE_SETUP.md** - Guia detalhado de configuração do Supabase
- **TRANSFORMACAO_COMPLETA.md** - Histórico completo de mudanças
- Comentários no código (`dataService.ts`, `App.tsx`)

---

## Status ✅

- [x] BroadcastChannel removido
- [x] localStorage removido como persistência
- [x] Supabase Realtime implementado
- [x] CRUD completo (Create, Read, Update, Delete)
- [x] Sincronização multiusuário em tempo real
- [x] Código compilado e testado
- [x] Documentação completa

**Tudo pronto para produção!** 🚀

---

## Perguntas Frequentes

**P: Posso usar offline?**
R: Não. O sistema depende de conexão com Supabase. Para offline, seria necessário implementar sincronização local.

**P: Qual é o custo?**
R: Supabase tem tier gratuito generoso. Verifique pricing em supabase.com.

**P: Como adicionar mais usinas?**
R: Insira linhas na tabela `estoque` ou crie em tempo real com `criarItemEstoque()`.

**P: Posso usar isto em produção?**
R: Sim! Implemente RLS (Row Level Security) como sugerido em SUPABASE_SETUP.md.

**P: Quem pode modificar os dados?**
R: Atualmente qualquer usuário autenticado. Use RLS para restringir por role.

---

## Suporte

Consulte:
- `SUPABASE_SETUP.md` - Configuração detalhada
- `TRANSFORMACAO_COMPLETA.md` - Histórico de mudanças
- Console do navegador (F12) - Logs de diagnóstico

---

**Sucesso! Seu sistema está pronto para tempo real.** ✨
