
import { AppState, HistoryLog, StockData, UsinaName } from '../types';
import { USINAS } from '../constants';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

// Supabase expects env vars prefixed with VITE_ for Vite projects
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Table schema assumption:
 * Table name: `estoque`
 * Columns: id (uuid), nome (text), quantidade (float), usina (text), updated_at (timestamp)
 * Primary source of truth is the database, not the frontend.
 */

interface EstoqueItem {
  id?: string;
  nome: string;
  quantidade: number;
  usina: UsinaName;
  updated_at?: string;
}

interface HistoricoItem {
  id?: string;
  usina: UsinaName;
  action: string;
  details: string;
  timestamp?: string;
  created_at?: string;
}

class DataService {
  private supabase: SupabaseClient | null = null;
  private realtimeChannel: RealtimeChannel | null = null;

  constructor() {
    console.log('[DataService] Inicializando com SUPABASE_URL:', SUPABASE_URL);
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log('[DataService] Cliente Supabase criado com sucesso');
    } else {
      console.error('[DataService] SUPABASE_URL ou SUPABASE_ANON_KEY não configurados!');
      this.supabase = null;
    }
  }

  /**
   * LISTAR ESTOQUE - Busca todos os itens da tabela estoque
   */
  async listarEstoque(): Promise<EstoqueItem[]> {
    if (!this.supabase) {
      console.error('[listarEstoque] Supabase não configurado!');
      return [];
    }

    try {
      console.log('[listarEstoque] Buscando estoque da tabela "estoque"...');
      const { data, error } = await this.supabase
        .from('estoque')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('[listarEstoque] Erro ao buscar estoque:', error?.message ?? error);
        console.error('[listarEstoque] Detalhes do erro:', { code: error?.code, details: error?.details, hint: error?.hint });
        return [];
      }

      console.log('[listarEstoque] ✓ Itens carregados:', data?.length || 0);
      return (data || []) as EstoqueItem[];
    } catch (err: any) {
      console.error('[listarEstoque] Exceção capturada:', err?.message ?? err);
      return [];
    }
  }

  /**
   * CRIAR ITEM ESTOQUE
   */
  async criarItemEstoque(nome: string, quantidade: number, usina: UsinaName): Promise<EstoqueItem | null> {
    if (!this.supabase) {
      console.error('[criarItemEstoque] Supabase não configurado!');
      return null;
    }

    try {
      console.log('[criarItemEstoque] Criando item:', { nome, quantidade, usina });
      const { data, error } = await this.supabase
        .from('estoque')
        .insert([{ nome, quantidade, usina }])
        .select()
        .single();

      if (error) {
        console.error('[criarItemEstoque] Erro ao criar item:', error?.message ?? error);
        console.error('[criarItemEstoque] Detalhes:', { code: error?.code, details: error?.details });
        return null;
      }

      console.log('[criarItemEstoque] ✓ Item criado com sucesso:', data?.id);
      return data as EstoqueItem;
    } catch (err: any) {
      console.error('[criarItemEstoque] Exceção capturada:', err?.message ?? err);
      return null;
    }
  }

  /**
   * ATUALIZAR ITEM ESTOQUE
   */
  async atualizarItemEstoque(id: string, quantidade: number): Promise<EstoqueItem | null> {
    if (!this.supabase) {
      console.error('[atualizarItemEstoque] Supabase não configurado!');
      return null;
    }

    try {
      console.log('[atualizarItemEstoque] Atualizando item:', { id, quantidade });
      const { data, error } = await this.supabase
        .from('estoque')
        .update({ quantidade, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[atualizarItemEstoque] Erro ao atualizar item:', error?.message ?? error);
        console.error('[atualizarItemEstoque] Detalhes:', { code: error?.code, id });
        return null;
      }

      console.log('[atualizarItemEstoque] ✓ Item atualizado com sucesso');
      return data as EstoqueItem;
    } catch (err: any) {
      console.error('[atualizarItemEstoque] Exceção capturada:', err?.message ?? err);
      return null;
    }
  }

  /**
   * REMOVER ITEM ESTOQUE
   */
  async removerItemEstoque(id: string): Promise<boolean> {
    if (!this.supabase) {
      console.error('[removerItemEstoque] Supabase não configurado!');
      return false;
    }

    try {
      console.log('[removerItemEstoque] Removendo item:', id);
      const { error } = await this.supabase
        .from('estoque')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[removerItemEstoque] Erro ao remover item:', error?.message ?? error);
        console.error('[removerItemEstoque] Detalhes:', { code: error?.code, id });
        return false;
      }

      console.log('[removerItemEstoque] ✓ Item removido com sucesso');
      return true;
    } catch (err: any) {
      console.error('[removerItemEstoque] Exceção capturada:', err?.message ?? err);
      return false;
    }
  }

  /**
   * CRIAR LOG NO HISTÓRICO
   */
  async criarLog(usina: UsinaName, action: string, details: string): Promise<HistoricoItem | null> {
    if (!this.supabase) {
      console.error('[criarLog] Supabase não configurado!');
      return null;
    }

    try {
      console.log('[criarLog] Criando log:', { usina, action, details });
      const { data, error } = await this.supabase
        .from('historico')
        .insert([{ usina, action, details }])
        .select()
        .single();

      if (error) {
        console.error('[criarLog] Erro ao criar log:', error?.message ?? error);
        console.error('[criarLog] Detalhes:', { code: error?.code, details: error?.details });
        return null;
      }

      console.log('[criarLog] ✓ Log criado com sucesso:', data?.id);
      return data as HistoricoItem;
    } catch (err: any) {
      console.error('[criarLog] Exceção capturada:', err?.message ?? err);
      return null;
    }
  }

  /**
   * LISTAR HISTÓRICO - Busca os últimos 50 logs de uma usina
   */
  async listarHistorico(usina?: UsinaName): Promise<HistoricoItem[]> {
    if (!this.supabase) {
      console.error('[listarHistorico] Supabase não configurado!');
      return [];
    }

    try {
      console.log('[listarHistorico] Buscando histórico', usina ? `da usina ${usina}` : 'de todas as usinas');
      
      let query = this.supabase
        .from('historico')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (usina) {
        query = query.eq('usina', usina);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[listarHistorico] Erro ao buscar histórico:', error?.message ?? error);
        console.error('[listarHistorico] Detalhes do erro:', { code: error?.code, details: error?.details });
        return [];
      }

      console.log('[listarHistorico] ✓ Logs carregados:', data?.length || 0);
      return (data || []) as HistoricoItem[];
    } catch (err: any) {
      console.error('[listarHistorico] Exceção capturada:', err?.message ?? err);
      return [];
    }
  }

  /**
   * Carrega o estado inicial de todas as usinas a partir da tabela estoque.
   * Constrói um AppState baseado nos dados do banco.
   * NUNCA retorna null - sempre retorna um AppState válido mesmo com erro de conexão
   */
  async loadInitialState(): Promise<AppState> {
    console.log('[loadInitialState] Iniciando carregamento do estado inicial');
    
    if (!this.supabase) {
      console.warn('[loadInitialState] Supabase não configurado, usando fallback');
      return this.getInitialStateFallback();
    }

    try {
      // Buscar todos os itens do estoque e histórico em paralelo
      const [items, historicoItems] = await Promise.all([
        this.listarEstoque(),
        this.listarHistorico()
      ]);
      
      console.log('[loadInitialState] Itens carregados:', items.length);
      console.log('[loadInitialState] Logs histórico carregados:', historicoItems.length);
      
      // Construir inventory a partir dos itens
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

      // Preencher inventory com dados do banco
      items.forEach((item: any) => {
        if (initialInventory[item.usina] && item.nome in initialInventory[item.usina]) {
          initialInventory[item.usina][item.nome] = item.quantidade;
        }
      });

      // Preencher histórico com dados do banco
      historicoItems.forEach((log: any) => {
        if (initialHistory[log.usina]) {
          initialHistory[log.usina].push({
            id: log.id,
            timestamp: new Date(log.timestamp).toLocaleString('pt-BR'),
            action: log.action,
            details: log.details
          });
        }
      });

      const state: AppState = {
        currentUsina: 'Angatuba',
        inventory: initialInventory,
        history: initialHistory,
        isLoggedIn: false
      };

      console.log('[loadInitialState] Estado inicial carregado com sucesso');
      return state;
    } catch (err) {
      console.warn('[loadInitialState] Erro ao carregar estado, usando fallback:', err);
      // Retornar fallback em caso de erro
      return this.getInitialStateFallback();
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
   * Subscreve a mudanças em tempo real nas tabelas estoque e historico usando Supabase Realtime.
   * Escuta eventos: INSERT, UPDATE, DELETE
   * Invoca callback com os dados atualizados quando há mudanças.
   * Retorna função de unsubscribe.
   * NOTA: Deve ser chamado apenas dentro de useEffect para evitar memory leaks
   */
  subscribeToChanges(callback: (data: { inventory: any, history: any }) => void): () => void {
    if (!this.supabase) {
      console.warn('[subscribeToChanges] Supabase não configurado, subscription desabilitada');
      return () => {};
    }

    try {
      console.log('[subscribeToChanges] Criando channels Realtime para "estoque" e "historico"');
      
      // Channel para monitorar a tabela estoque
      const estoqueChannel = this.supabase
        .channel('estoque_changes_' + Date.now())
        .on(
          'postgres_changes',
          {
            event: '*', // Escuta INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'estoque'
          },
          (payload: any) => {
            console.log('[subscribeToChanges] Evento estoque recebido:', payload.eventType);
            
            // Recarregar inventário
            this.listarEstoque()
              .then(items => {
                const inventory = this.buildInventoryFromItems(items);
                callback({ inventory, history: {} });
              })
              .catch(err => {
                console.warn('[subscribeToChanges] Erro ao recarregar estoque:', err);
              });
          }
        )
        .subscribe();

      // Channel para monitorar a tabela historico
      const historicoChannel = this.supabase
        .channel('historico_changes_' + Date.now())
        .on(
          'postgres_changes',
          {
            event: 'INSERT', // Apenas novos logs
            schema: 'public',
            table: 'historico'
          },
          (payload: any) => {
            console.log('[subscribeToChanges] Novo log no histórico:', payload.new);
            
            // Recarregar histórico completo
            this.listarHistorico()
              .then(logs => {
                const history: Record<UsinaName, HistoryLog[]> = {} as any;
                USINAS.forEach(u => { history[u] = []; });
                
                logs.forEach((log: any) => {
                  if (history[log.usina]) {
                    history[log.usina].push({
                      id: log.id,
                      timestamp: new Date(log.timestamp).toLocaleString('pt-BR'),
                      action: log.action,
                      details: log.details
                    });
                  }
                });
                
                callback({ inventory: {}, history });
              })
              .catch(err => {
                console.warn('[subscribeToChanges] Erro ao recarregar histórico:', err);
              });
          }
        )
        .subscribe();

      // Retornar função de cleanup que remove ambos os channels
      return () => {
        console.log('[subscribeToChanges] Desinscrição de mudanças');
        try {
          if (this.supabase) {
            this.supabase.removeChannel(estoqueChannel);
            this.supabase.removeChannel(historicoChannel);
          }
        } catch (err) {
          console.warn('[subscribeToChanges] Erro ao desinscrever:', err);
        }
      };
    } catch (err) {
      console.warn('[subscribeToChanges] Erro ao criar subscription:', err);
      return () => {};
    }
  }

  /**
   * Constrói o objeto inventory a partir de itens da tabela estoque
   */
  private buildInventoryFromItems(items: EstoqueItem[]): Record<UsinaName, StockData> {
    const inventory: Record<UsinaName, StockData> = {} as any;

    USINAS.forEach(u => {
      inventory[u] = {
        'BRITA 0': 0,
        'BRITA 1': 0,
        'AREIA MÉDIA': 0,
        'AREIA DE BRITA': 0,
        'SILO 1': 0,
        'SILO 2': 0,
      } as any;
    });

    // Usar ÚLTIMO valor encontrado de cada material/usina (em caso de duplicatas)
    items.forEach((item: any) => {
      if (inventory[item.usina] && item.nome in inventory[item.usina]) {
        inventory[item.usina][item.nome] = item.quantidade;
        console.log(`[buildInventory] ${item.usina} - ${item.nome}: ${item.quantidade} kg`);
      } else {
        console.warn(`[buildInventory] Item ignorado:`, item);
      }
    });

    return inventory;
  }
}

export const dataService = new DataService();
