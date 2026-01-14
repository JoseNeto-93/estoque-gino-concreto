
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedReportData } from "../types";

// Moved initialization inside the function to ensure the latest API key is used per guidelines
export async function processReportImage(base64Data: string, mimeType: string): Promise<ExtractedReportData> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("Chave API do Gemini não configurada. Configure a variável VITE_GEMINI_API_KEY no arquivo .env");
  }
  
  const ai = new GoogleGenAI({ apiKey });
  
  // Garante que o base64 não contenha o prefixo de data URL
  const cleanBase64 = base64Data.includes('base64,') ? base64Data.split('base64,')[1] : base64Data;

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
        { inlineData: { mimeType: mimeType, data: cleanBase64 } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          "BRITA 0": { type: Type.NUMBER },
          "BRITA 1": { type: Type.NUMBER },
          "AREIA MEDI": { type: Type.NUMBER },
          "AREIA BRIT": { type: Type.NUMBER },
          "AREIA FINA": { type: Type.NUMBER },
          "SILO 1": { type: Type.NUMBER },
          "SILO 2": { type: Type.NUMBER },
        },
      }
    }
  });

  try {
    const text = response.text;
    if (!text) throw new Error("Resposta vazia do modelo.");
    const data = JSON.parse(text);
    return data;
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    throw new Error("Erro ao processar o relatório. Certifique-se de que o arquivo é um Relatório de Carga Sintético válido.");
  }
}
