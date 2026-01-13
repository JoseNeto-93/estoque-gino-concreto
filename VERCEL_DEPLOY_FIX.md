# 🔧 Guia de Deploy no Vercel - Fixar Tela Branca

## ⚠️ Se Ainda Ver Tela Branca no Deploy

Já foi feito um commit para forçar rebuild no Vercel. O deploy deve estar em progresso.

**Tempo estimado:** 2-5 minutos

## ✅ Checklist de Verificação

### 1. Aguarde o Deploy Concluir
- Acesse: https://vercel.com/dashboard
- Vá ao seu projeto: `estoque-gino-concreto`
- Verifique se há um novo deployment em progresso
- Status deve mudar de "Building" → "Ready"

### 2. Verifique as Variáveis de Ambiente
Se ainda ver tela branca APÓS o deploy concluir, faça:

1. **Abra Vercel Dashboard**
   - https://vercel.com/dashboard

2. **Projeto → Settings → Environment Variables**
   - Verifique se existem:
     - `VITE_SUPABASE_URL` ✅
     - `VITE_SUPABASE_ANON_KEY` ✅

3. **Se Faltarem, Adicione:**
   ```
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anonima
   ```

4. **Após Adicionar:**
   - Vá em **Deployments**
   - Clique nos **...** do último deploy
   - Selecione **Redeploy**

### 3. Se Ainda Não Funcionar
Veja a seção "Troubleshooting" abaixo.

---

## 🔍 Como Saber se Está Funcionando

Após alguns minutos do deploy, acesse:
```
https://estoque-gino-concreto.vercelapp
```

Você deve ver:
- ✅ **Loading Spinner** com "Inicializando aplicação..."
- OU ✅ **Tela de Login** (se carregar rápido)
- ❌ **NÃO** deve ser tela branca

---

## 🆘 Troubleshooting

### Ainda Vendo Tela Branca?

**1. Abra DevTools (F12)**
```
Aba: Console
```

Procure por erros. Exemplos:
- "Cannot find module..." → Build problemático
- "VITE_SUPABASE_URL is undefined" → Variável de ambiente faltando
- "Supabase connection failed" → Supabase não acessível

### Erro: "VITE_SUPABASE_URL is undefined"

**Solução:**
1. Vercel Dashboard → Settings → Environment Variables
2. Adicione:
   ```
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anonima
   ```
3. Redeploy

### Erro: "Cannot read property 'from' of null"

**Solução:**
Mesmo que acima - falta variável de ambiente.

### Erro: "Supabase connection failed"

**Possíveis causas:**
1. Supabase URL incorreta
2. Chave incorreta
3. Supabase fora do ar
4. Firewall bloqueando

**Como Verificar:**
1. Acesse https://supabase.com/dashboard
2. Seu projeto → Settings → API
3. Copie a URL e chave **EXATAMENTE** como está
4. Cole no Vercel → Redeploy

---

## 📊 Deploy Status

**Últimas Ações:**
- ✅ Commit: `3724d06` - Force rebuild com todas as correções
- ✅ Push ao GitHub: Concluído
- ⏳ Vercel Build: Em progresso (2-5 min)
- ⏳ Deploy Live: Aguardando

---

## 💡 Se Tudo Falhar

### Opção 1: Redeploy Manual
1. Vercel Dashboard
2. Projeto → Deployments
3. Último deploy → ... → Redeploy

### Opção 2: Rebuild Completo
1. Vercel Dashboard → Settings
2. Git → Disconnect GitHub
3. Reconectar GitHub
4. Selecionar branch `main`
5. Deploy novamente

### Opção 3: Deploy Local
```bash
npm run build
# Enviar pasta dist/ para seu servidor
# (Netlify, AWS S3, etc.)
```

---

## 📞 Monitoramento

Após o Vercel fazer o rebuild (espere 5 minutos), abra:

```
https://estoque-gino-concreto.vercelapp
```

E abra DevTools (F12) → Console

Você deve ver logs como:
```
[App] Iniciando carregamento do estado...
[DataService] Cliente Supabase criado com sucesso
[loadInitialState] Estado carregado com sucesso
[App] Estado carregado: Angatuba
```

Se vir esses logs = **SUCESSO! ✅**

Se vir erro = Consulte a seção Troubleshooting acima.

---

**Tempo estimado até estar funcionando:** 5-10 minutos

Aguarde e recarregue a página periodicamente! 🚀
