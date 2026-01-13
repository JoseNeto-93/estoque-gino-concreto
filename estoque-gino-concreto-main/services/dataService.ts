
import { AppState, HistoryLog, StockData, UsinaName } from '../types';
import { USINAS } from '../constants';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase expects env vars prefixed with VITE_ for Vite projects
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Table schema assumption:
 * Table name: `states`
 * Columns: id (text, primary key), payload (jsonb)
 * We'll store the entire app state (minus `isLoggedIn`) in `payload` with a single id, e.g. 'app_state'
 */

const STATE_ROW_ID = 'app_state';

class DataService {
  private supabase: SupabaseClient | null = null;

  constructor() {
      // Log para diagnóstico de variáveis de ambiente
      console.log('SUPABASE_URL:', SUPABASE_URL);
      console.log('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY);
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
      console.warn('Supabase não configurado. Usando fallback local (localStorage).');
      this.supabase = null;
    }
  }

  private getInitialStateFallback(): AppState {
    const initialInventory: Record<UsinaName, StockData> = {} as any;
    const initialHistory: Record<UsinaName, HistoryLog[]> = {} as any;
    
    USINAS.forEach(u => {
      initialInventory[u] = {
        'BRITA 0': 0,
        'BRITA 1': 0,
        'AREIA MÉDIA': 0,
        'AREIA DE BRITA': 0,
        'SILO 1': 0,
        'SILO 2': 0,
      } as any;
      initialHistory[u] = [];
    });

    return {
      currentUsina: 'Angatuba',
      inventory: initialInventory,
      history: initialHistory,
      isLoggedIn: false
    };
  }

  /**
   * Carrega o estado inicial da tabela Supabase `states`.
   * Se não configurado ou se ocorrer erro, faz fallback para localStorage/valores iniciais.
   */
  async loadInitialState(): Promise<AppState> {
    // Try Supabase first
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('states')
          .select('payload')
          .eq('id', STATE_ROW_ID)
          .limit(1)
          .single();

        if (error && (error as any).code !== 'PGRST116') {
          console.warn('Erro ao buscar estado no Supabase:', error);
        }

        if (data && (data as any).payload) {
          return { ...(data as any).payload, isLoggedIn: false } as AppState;
        }
      } catch (err) {
        console.warn('Falha ao carregar estado do Supabase, usando fallback:', err);
      }
    }

    // Fallback localStorage
    try {
      const saved = localStorage.getItem('gino_concreto_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...parsed, isLoggedIn: false };
      }
    } catch (e) {
      // ignore
    }

    return this.getInitialStateFallback();
  }

  /**
   * Persiste estado em Supabase (upsert). Se Supabase não estiver configurado, salva em localStorage.
   */
  async persistState(state: AppState): Promise<void> {
    const { isLoggedIn, ...toSave } = state;

    if (this.supabase) {
      try {
        const payload = toSave;
        const { error } = await this.supabase
          .from('states')
          .upsert({ id: STATE_ROW_ID, payload }, { onConflict: 'id' });

        if (error) console.warn('Erro ao persistir estado no Supabase:', error);
        return;
      } catch (err) {
        console.warn('Falha ao persistir no Supabase, escrevendo local:', err);
      }
    }

    // fallback
    try {
      localStorage.setItem('gino_concreto_v1', JSON.stringify(toSave));
    } catch (e) {
      console.warn('Falha ao salvar em localStorage:', e);
    }
  }

  /**
   * Em vez de broadcast manual, persistimos no DB. O Realtime do Supabase notificará assinantes.
   * Mantemos o método para compatibilidade com uso atual.
   */
  async broadcastChange(inventory: any, history: any): Promise<void> {
    const current = await this.loadInitialState();
    const newState = { ...current, inventory, history } as AppState;
    await this.persistState(newState);
  }

  /**
   * Subscreve a alterações na tabela `states` (UPDATE/INSERT) e invoca callback com os dados.
   * Retorna função de unsubscribe.
   */
  subscribeToChanges(callback: (data: { inventory: any, history: any }) => void): () => void {
    if (!this.supabase) {
      // fallback para BroadcastChannel entre abas
      try {
        const channel = new BroadcastChannel('gino_erp_realtime');
        const handler = (ev: MessageEvent) => callback(ev.data);
        channel.addEventListener('message', handler);
        return () => channel.removeEventListener('message', handler);
      } catch (e) {
        console.warn('BroadcastChannel não disponível:', e);
        return () => {};
      }
    }

    // Supabase Realtime: listen to changes on the `states` row
    const subscription = this.supabase
      .from(`states:id=eq.${STATE_ROW_ID}`)
      .on('UPDATE', payload => {
        try {
          const newPayload = (payload.new as any).payload;
          if (newPayload) callback({ inventory: newPayload.inventory, history: newPayload.history });
        } catch (e) {
          console.warn('Erro ao processar payload realtime:', e);
        }
      })
      .on('INSERT', payload => {
        try {
          const newPayload = (payload.new as any).payload;
          if (newPayload) callback({ inventory: newPayload.inventory, history: newPayload.history });
        } catch (e) {
          console.warn('Erro ao processar payload realtime (insert):', e);
        }
      })
      .subscribe();

    return () => {
      try {
        this.supabase?.removeSubscription(subscription);
      } catch (e) {
        // in some versions removeSubscription is different; try unsubscribe method
        try { (subscription as any).unsubscribe(); } catch (_) { }
      }
    };
  }
}

export const dataService = new DataService();
