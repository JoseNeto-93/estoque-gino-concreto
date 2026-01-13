
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
    } catch (err) {
      console.error('[removerItemEstoque] Exceção:', err);
      return false;
    }
  }

  /**
   * Carrega o estado inicial de todas as usinas a partir da tabela estoque.
   * Constrói um AppState baseado nos dados do banco.
   * GARANTE que retorna sempre um AppState válido (nunca null ou undefined).
   */
  async loadInitialState(): Promise<AppState> {
    if (!this.supabase) {
      console.warn('[loadInitialState] Supabase não configurado! Retornando fallback.');
      return this.getInitialStateFallback();
    }

    try {
      // Buscar todos os itens do estoque
      const items = await this.listarEstoque();
      
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

      // Preencher com dados do banco
      items.forEach((item: any) => {
        if (initialInventory[item.usina] && item.nome in initialInventory[item.usina]) {
          initialInventory[item.usina][item.nome] = item.quantidade;
        }
      });

      console.log('[loadInitialState] Estado inicial carregado do banco com sucesso');
      return {
        currentUsina: 'Angatuba',
        inventory: initialInventory,
        history: initialHistory,
        isLoggedIn: false
      };
    } catch (err) {
      console.warn('[loadInitialState] Erro ao carregar estado:', err);
      console.log('[loadInitialState] Usando estado padrão como fallback');
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
   * Subscreve a mudanças em tempo real na tabela estoque usando Supabase Realtime.
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
      console.log('[subscribeToChanges] Criando channel Realtime para "estoque"');
      
      // Criar channel para monitorar a tabela estoque
      const channel = this.supabase
        .channel('estoque_changes_' + Date.now())
        .on(
          'postgres_changes',
          {
            event: '*', // Escuta INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'estoque'
          },
          (payload: any) => {
            // NÃO usar async aqui - disparar recarregamento sem bloquear
            console.log('[subscribeToChanges] Evento recebido:', payload.eventType);
            
            // Recarregar estado de forma não-bloqueante
            this.listarEstoque()
              .then(items => {
                const inventory = this.buildInventoryFromItems(items);
                callback({ inventory, history: {} });
              })
              .catch(err => {
                console.warn('[subscribeToChanges] Erro ao recarregar após evento:', err);
              });
          }
        )
        .subscribe((status) => {
          console.log('[subscribeToChanges] Status de subscrição:', status);
        });

      // Retornar função de cleanup que remove o channel
      return () => {
        console.log('[subscribeToChanges] Desinscrição de mudanças');
        try {
          if (this.supabase && channel) {
            this.supabase.removeChannel(channel);
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

    items.forEach((item: any) => {
      if (inventory[item.usina] && item.nome in inventory[item.usina]) {
        inventory[item.usina][item.nome] = item.quantidade;
      }
    });

    return inventory;
  }
}

export const dataService = new DataService();
