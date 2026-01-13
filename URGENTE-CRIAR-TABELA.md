# 🚀 GUIA URGENTE - Criar Tabela no Supabase

## ⚠️ PROBLEMA IDENTIFICADO

O erro no console mostra:
```
Could not find the table 'public.estoque' in the schema cache
```

**Isso significa que a tabela `estoque` NÃO EXISTE no seu banco de dados Supabase!**

---

## 📋 SOLUÇÃO - Siga estes passos EXATAMENTE:

### **PASSO 1:** Acesse o Supabase Dashboard

1. Abra seu navegador
2. Vá para: **https://app.supabase.com**
3. Faça login
4. Selecione o projeto: **vyjsfnyztujrzquiwvio**

---

### **PASSO 2:** Abra o SQL Editor

1. No menu lateral esquerdo, clique em **"SQL Editor"** (ícone de código)
2. Clique em **"+ New query"** (Nova consulta)

---

### **PASSO 3:** Cole e Execute o SQL

1. **COPIE** todo o conteúdo do arquivo: **`setup-database.sql`** (está na raiz do projeto)

2. **COLE** no editor SQL do Supabase

3. Clique em **"RUN"** (botão verde no canto inferior direito)

4. **Aguarde** a mensagem: ✅ "Success. No rows returned"

---

### **PASSO 4:** Habilite o Realtime

1. No menu lateral, clique em **"Database"**
2. Clique em **"Replication"** ou **"Realtime"**
3. Procure a tabela **`estoque`** na lista
4. **ATIVE** o toggle (interruptor) ao lado de `estoque`
5. Certifique-se de que está **verde/ativo**

Ou:

1. No menu lateral, clique em **"Table Editor"**
2. Selecione a tabela **`estoque`**
3. Clique no botão **"..."** (três pontos) no topo
4. Selecione **"Enable Realtime"**

---

### **PASSO 5:** Verifique se Funcionou

1. No **SQL Editor**, execute esta query:

```sql
SELECT * FROM estoque LIMIT 10;
```

2. Você deve ver **54 linhas** (9 usinas × 6 materiais cada)

3. A resposta deve mostrar algo como:

```
| id  | nome      | quantidade | usina      | updated_at | created_at |
|-----|-----------|------------|------------|------------|------------|
| ... | BRITA 0   | 0          | Angatuba   | ...        | ...        |
| ... | BRITA 1   | 0          | Angatuba   | ...        | ...        |
```

---

### **PASSO 6:** Teste o Sistema

1. **Volte para seu aplicativo**: https://estoque-gino-concreto.vercel.app
2. **Pressione F5** para recarregar a página
3. **Abra o Console** (F12)
4. Faça login com:
   - Usuário: `balanceiro`
   - Senha: `12345`
   - Usina: `Angatuba`

5. **Verifique os logs** - Você deve ver:
   ```
   ✓ [listarEstoque] Itens carregados: 54
   ```

6. **Tente lançar uma nota fiscal** e veja se funciona!

---

## 🔍 Verificação de Problemas Comuns

### ❌ Erro: "relation 'estoque' does not exist"
**Solução:** Você não executou o SQL corretamente. Volte ao PASSO 3.

### ❌ Erro: "permission denied for table estoque"
**Solução:** Execute estas linhas no SQL Editor:
```sql
ALTER TABLE estoque ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated users" ON estoque
  FOR ALL
  USING (true);
```

### ❌ Erro: "Could not find the table 'public.estoque'"
**Solução:** Verifique se você está no **schema correto**. Execute:
```sql
SET search_path TO public;
```
Depois execute o `setup-database.sql` novamente.

---

## 📊 Estrutura da Tabela Criada

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | ID único (gerado automaticamente) |
| `nome` | TEXT | Nome do material ("BRITA 0", "SILO 1", etc.) |
| `quantidade` | FLOAT | Quantidade em kg |
| `usina` | TEXT | Nome da usina ("Angatuba", "Avaré", etc.) |
| `updated_at` | TIMESTAMP | Data/hora da última atualização |
| `created_at` | TIMESTAMP | Data/hora de criação |

---

## ✅ Dados Criados

O script cria automaticamente **54 registros**:

- **9 usinas:** Angatuba, Avaré, Carlópolis, Itaporanga, Paranapanema, Piraju, Taquarituba, Ribeirão Claro, Jacarezinho
- **6 materiais por usina:** BRITA 0, BRITA 1, AREIA MÉDIA, AREIA DE BRITA, SILO 1, SILO 2
- **Quantidade inicial:** 0 kg (você vai adicionar conforme usar o sistema)

---

## 🆘 Ainda Com Problemas?

Se após seguir todos os passos o erro persistir:

1. **Tire um print do SQL Editor** mostrando o resultado
2. **Tire um print do Console do navegador** (F12)
3. **Verifique se o Realtime está ativo** na tabela `estoque`

---

## 📞 Comandos Úteis para Debug

Execute no SQL Editor do Supabase:

```sql
-- Ver todas as tabelas do banco
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Ver estrutura da tabela estoque
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'estoque';

-- Contar registros
SELECT COUNT(*) FROM estoque;

-- Ver dados agrupados por usina
SELECT usina, COUNT(*) as total
FROM estoque
GROUP BY usina
ORDER BY usina;
```

---

**🎯 Depois de executar o SQL, seu sistema vai funcionar perfeitamente!**
