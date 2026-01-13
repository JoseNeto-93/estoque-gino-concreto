
import { AppState, HistoryLog, StockData, UsinaName } from '../types';
import { USINAS } from '../constants';

const STORAGE_KEY = 'gino_concreto_v1';
const SYNC_CHANNEL_NAME = 'gino_erp_realtime';

class DataService {
  private syncChannel: BroadcastChannel;

  constructor() {
    this.syncChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
  }

  /**
   * Carrega o estado inicial do sistema.
   * Futuramente: Buscará dados da API/Banco.
   */
  async loadInitialState(): Promise<AppState> {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...parsed, isLoggedIn: false };
    }

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
   * Salva o estado atual.
   * Futuramente: Enviará um UPDATE para o banco de dados.
   */
  async persistState(state: AppState): Promise<void> {
    const { isLoggedIn, ...toSave } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }

  /**
   * Notifica outros usuários (abas) sobre mudanças.
   * Futuramente: O banco de dados (ex: Supabase Realtime) fará isso automaticamente.
   */
  broadcastChange(inventory: any, history: any): void {
    this.syncChannel.postMessage({ inventory, history });
  }

  /**
   * Subscreve para ouvir mudanças externas.
   */
  subscribeToChanges(callback: (data: { inventory: any, history: any }) => void): () => void {
    const handler = (event: MessageEvent) => {
      callback(event.data);
    };
    this.syncChannel.addEventListener('message', handler);
    return () => this.syncChannel.removeEventListener('message', handler);
  }
}

export const dataService = new DataService();
