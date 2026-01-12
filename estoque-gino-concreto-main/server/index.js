import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { runMigrations } from './migrate.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 3001;

if (!process.env.GEN_AI_API_KEY) {
  console.warn('Warning: GEN_AI_API_KEY not set — /process-report will fail without it. Set GEN_AI_API_KEY in server .env');
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

let supabase = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
} else {
  console.warn('Supabase (service role) not configured. Server will not persist state to Supabase.');
}

app.post('/process-report', async (req, res) => {
  try {
    const { base64, mimeType } = req.body;
    if (!base64 || !mimeType) return res.status(400).send('Missing base64 or mimeType');

    const ai = new GoogleGenAI({ apiKey: process.env.GEN_AI_API_KEY });

    const prompt = `
      Analise este "Relatório de Carga Sintético" (documento PDF ou imagem). 
      Extraia os valores da coluna "Real (Kg)" para cada material listado.
      Foque especificamente em:
      - BRITA 0
      - BRITA 1
      - AREIA MEDI (ou AREIA MEDIA)
      - AREIA BRIT (ou AREIA BRITA)
      - AREIA FINA
      - SILO 1
      - SILO 2

      Retorne apenas um objeto JSON com os nomes dos materiais e seus respectivos valores numéricos.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            'BRITA 0': { type: Type.NUMBER },
            'BRITA 1': { type: Type.NUMBER },
            'AREIA MEDI': { type: Type.NUMBER },
            'AREIA BRIT': { type: Type.NUMBER },
            'AREIA FINA': { type: Type.NUMBER },
            'SILO 1': { type: Type.NUMBER },
            'SILO 2': { type: Type.NUMBER }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return res.status(502).send('Empty response from AI');

    try {
      const data = JSON.parse(text);
      // If Supabase service client is available, apply the extracted values to the central state
      try {
        const { usina, actor } = req.body;
        if (supabase && usina) {
          // fetch current state
          const STATE_ROW_ID = 'app_state';
          const { data: stateRow, error: fetchErr } = await supabase
            .from('states')
            .select('payload')
            .eq('id', STATE_ROW_ID)
            .limit(1)
            .single();

          if (fetchErr && (fetchErr.code !== 'PGRST116')) {
            console.warn('Erro ao buscar estado no Supabase (server):', fetchErr);
          }

          let payload = stateRow?.payload ?? null;
          if (!payload) {
            // initialize shape
            payload = { currentUsina: usina, inventory: {}, history: {} };
          }

          // Ensure structures
          payload.inventory = payload.inventory || {};
          payload.history = payload.history || {};
          payload.inventory[usina] = payload.inventory[usina] || {};
          payload.history[usina] = payload.history[usina] || [];

          // Apply reductions
          Object.entries(data).forEach(([material, value]) => {
            const current = payload.inventory[usina][material] ?? 0;
            const sub = Number(value) || 0;
            payload.inventory[usina][material] = Math.max(0, current - sub);
          });

          // Add history log
          const newLog = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toLocaleString('pt-BR'),
            action: 'SAÍDA_RELATÓRIO',
            details: `Relatório processado por ${actor || 'sistema'}`
          };
          payload.history[usina] = [newLog, ...(payload.history[usina] || [])].slice(0, 50);

          // Upsert state
          const { error: upsertErr } = await supabase
            .from('states')
            .upsert({ id: STATE_ROW_ID, payload }, { onConflict: 'id' });

          if (upsertErr) console.error('Erro ao upsert no Supabase (server):', upsertErr);
        }
      } catch (err) {
        console.warn('Erro ao aplicar estado no Supabase (server):', err);
      }

      return res.json(data);
    } catch (err) {
      console.error('Failed to parse Gemini response:', err);
      return res.status(502).send('Failed to parse AI response');
    }
  } catch (err) {
    console.error('/process-report error:', err);
    return res.status(500).send('Server error');
  }
});

app.listen(PORT, async () => {
  console.log(`Server listening on port ${PORT}`);

  // Executar migração automática se SUPABASE_DB_URL estiver definida
  const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL || process.env.SUPABASE_URL?.replace('/rest/v1', '');
  if (SUPABASE_DB_URL) {
    try {
      await runMigrations(SUPABASE_DB_URL);
    } catch (err) {
      console.error('✗ Falha na migração automática:', err);
      // Opcional: descomente para sair se a migração falhar
      // process.exit(1);
    }
  } else {
    console.log('⚠ SUPABASE_DB_URL não definido — migração automática ignorada.');
  }
});
