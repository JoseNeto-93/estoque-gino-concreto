
import { ExtractedReportData } from "../types";

// Cliente agora delega o processamento ao endpoint serverless.
export async function processReportImage(base64Data: string, mimeType: string, usina?: string, actor?: string): Promise<ExtractedReportData> {
  // Remove prefix if present
  const cleanBase64 = base64Data.includes('base64,') ? base64Data.split('base64,')[1] : base64Data;
  const apiBase = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
  const url = `${apiBase}/process-report`;

  const body: any = { base64: cleanBase64, mimeType };
  if (usina) body.usina = usina;
  if (actor) body.actor = actor;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Erro ao processar relatório no servidor.');
  }

  const data = await res.json();
  return data as ExtractedReportData;
}
