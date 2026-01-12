import { Client } from 'pg';

export async function runMigrations(connectionString) {
  if (!connectionString) {
    console.log('SUPABASE_DB_URL não fornecida — pulando migração.');
    return;
  }

  const client = new Client({ connectionString });

  try {
    await client.connect();

    // Cria tabela states se não existir
    await client.query(`
      CREATE TABLE IF NOT EXISTS states (
        id text PRIMARY KEY,
        payload jsonb NOT NULL
      );
    `);

    // Insere registro inicial se não existir
    const res = await client.query(
      `SELECT 1 FROM states WHERE id = $1 LIMIT 1`,
      ['app_state']
    );

    if (res.rowCount === 0) {
      const initial = {
        currentUsina: 'Angatuba',
        inventory: {},
        history: {}
      };
      await client.query(
        `INSERT INTO states (id, payload) VALUES ($1, $2)`,
        ['app_state', JSON.stringify(initial)]
      );
      console.log('✓ Linha inicial app_state criada no Supabase.');
    } else {
      console.log('✓ Linha app_state já existe no Supabase.');
    }

    console.log('✓ Migração concluída com sucesso.');
  } catch (err) {
    console.error('✗ Erro durante migração:', err);
    throw err;
  } finally {
    await client.end();
  }
}
