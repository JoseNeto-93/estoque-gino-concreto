
import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { 
  UsinaName, 
  MaterialKey, 
  StockData, 
  AppState, 
  HistoryLog,
  UserRole
} from './types';
import { 
  USINAS, 
  LOW_STOCK_THRESHOLD,
  LOW_STOCK_THRESHOLD_CEMENT
} from './constants';
import { calculateEstimates, formatM3, formatKg } from './utils/calculations';
import StockCard from './components/StockCard';
import { processReportImage } from './services/geminiService';
import { dataService } from './services/dataService';

// Icons
const IconCube = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
const IconTruck = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1m-4 0a1 1 0 001-1m-1 1H9" /></svg>;

const App: React.FC = () => {
  const [state, setState] = useState<AppState | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialKey | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loginData, setLoginData] = useState({ user: '', pass: '', usina: USINAS[0] });
  const [loginError, setLoginError] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregamento Inicial
  useEffect(() => {
    console.log('[App] Iniciando carregamento do estado');
    
    const loadState = async () => {
      try {
        const initialState = await dataService.loadInitialState();
        console.log('[App] Estado carregado:', initialState?.currentUsina);
        setState(initialState);
        setError(null);
      } catch (err) {
        console.error('[App] Erro ao carregar estado:', err);
        setError('Erro ao carregar aplicação. Tente novamente.');
      }
    };

    loadState();
  }, []);

  // Monitorar mudanças em tempo real via Supabase Realtime
  useEffect(() => {
    if (!state) {
      console.log('[App] State ainda é null, subscription aguardando...');
      return;
    }
    
    console.log('[App] Configurando subscription Realtime');
    const unsubscribe = dataService.subscribeToChanges(async (data) => {
      console.log('[App] Atualização em tempo real recebida');
      
      setState(prev => {
        if (!prev) return null;
        
        // Atualizar inventory se fornecido
        const newInventory = Object.keys(data.inventory).length > 0 
          ? data.inventory 
          : prev.inventory;
        
        // Atualizar history se fornecido
        const newHistory = Object.keys(data.history).length > 0 
          ? data.history 
          : prev.history;
        
        return {
          ...prev,
          inventory: newInventory,
          history: newHistory,
          // Manter userRole e isLoggedIn
          userRole: prev.userRole,
          isLoggedIn: prev.isLoggedIn,
          currentUsina: prev.currentUsina
        };
      });
    });
    
    return () => {
      console.log('[App] Limpando subscription Realtime');
      unsubscribe();
    };
  }, [state !== null]); // Depende se state foi inicializado

  // Fallback para erro de carregamento
  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erro</h1>
          <p className="text-slate-700 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Recarregar Página
          </button>
        </div>
      </div>
    );
  }

  // Exibir loading enquanto carrega
  if (state === null) {
    console.log('[App] Renderizando loading state');
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center flex-col gap-4">
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        <p className="text-white text-sm">Inicializando aplicação...</p>
      </div>
    );
  }

  console.log('[App] Renderizando conteúdo principal', { isLoggedIn: state.isLoggedIn });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const { user, pass, usina } = loginData;

    if (user.toLowerCase() === 'balanceiro' && pass === '12345') {
      setState(prev => prev ? ({ ...prev, isLoggedIn: true, userRole: 'admin', currentUsina: usina as UsinaName }) : null);
      setLoginError('');
    } else if (user.toLowerCase() === 'visitante' && pass === 'visitante') {
      setState(prev => prev ? ({ ...prev, isLoggedIn: true, userRole: 'viewer', currentUsina: usina as UsinaName }) : null);
      setLoginError('');
    } else {
      setLoginError('Usuário ou senha incorretos');
    }
  };

  const handleLogout = () => {
    setState(prev => prev ? ({ ...prev, isLoggedIn: false, userRole: undefined }) : null);
  };

  // Garantir que sempre existem valores seguros
  const currentStock = state?.inventory?.[state?.currentUsina] || {
    'BRITA 0': 0,
    'BRITA 1': 0,
    'AREIA MÉDIA': 0,
    'AREIA DE BRITA': 0,
    'SILO 1': 0,
    'SILO 2': 0
  };
  const estimates = calculateEstimates(currentStock);
  const isAdmin = state?.userRole === 'admin';

  const addLog = async (usina: UsinaName, action: HistoryLog['action'], details: string) => {
    // Salvar no banco de dados
    await dataService.criarLog(usina, action, details);
    
    // Também adicionar localmente para feedback imediato (será sobrescrito pela subscription)
    const newLog: HistoryLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleString('pt-BR'),
      action,
      details
    };
    setState(prev => prev ? ({
      ...prev,
      history: {
        ...prev.history,
        [usina]: [newLog, ...(prev.history[usina] || [])].slice(0, 50)
      }
    }) : null);
  };

  const handleManualEntry = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAdmin) return;
    
    const formData = new FormData(e.currentTarget);
    const material = formData.get('material') as MaterialKey;
    const weightToAdd = parseFloat(formData.get('weight') as string);

    if (!material || isNaN(weightToAdd)) {
      alert('Selecione um material e informe o peso corretamente.');
      return;
    }

    try {
      console.log('[handleManualEntry] Processando lançamento:', { material, weightToAdd });
      const currentValue = state.inventory[state.currentUsina][material];
      const newValue = currentValue + weightToAdd;
      
      // Buscar o item no banco e atualizar, ou criar se não existir
      const allItems = await dataService.listarEstoque();
      const existingItem = allItems.find(item => item.nome === material && item.usina === state.currentUsina);

      let success = false;
      if (existingItem && existingItem.id) {
        const result = await dataService.atualizarItemEstoque(existingItem.id, newValue);
        success = result !== null;
      } else {
        const result = await dataService.criarItemEstoque(material, newValue, state.currentUsina);
        success = result !== null;
      }

      if (!success) {
        console.error('[handleManualEntry] Falha ao salvar no Supabase');
        alert('Erro ao lançar nota fiscal. Verifique a conexão com o banco de dados.');
        return;
      }

      // Somente após sucesso: recarregar estado, log, fechar modal, resetar form
      console.log('[handleManualEntry] ✓ Lançamento salvo com sucesso');
      
      // FORÇAR recarga imediata do estado
      const freshState = await dataService.loadInitialState();
      setState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          inventory: freshState.inventory,
          userRole: prev.userRole,
          isLoggedIn: prev.isLoggedIn,
          currentUsina: prev.currentUsina
        };
      });
      console.log('[handleManualEntry] Estado atualizado na tela');
      
      addLog(state.currentUsina, 'ENTRADA', `Lançamento manual: ${material} (+${weightToAdd} kg)`);
      
      // Resetar formulário de forma segura
      try {
        e.currentTarget.reset();
      } catch (resetError) {
        console.warn('[handleManualEntry] Erro ao resetar formulário (não crítico):', resetError);
      }
      
      // Fechar modal
      setIsNoteModalOpen(false);
    } catch (err: any) {
      console.error('[handleManualEntry] Exceção:', err?.message ?? err);
      alert('Erro ao lançar nota fiscal: ' + (err?.message || 'Erro desconhecido'));
    }
  };

  const handleEditStock = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingMaterial || !isAdmin) return;
    
    const formData = new FormData(e.currentTarget);
    const newWeight = parseFloat(formData.get('weight') as string);

    if (isNaN(newWeight) || newWeight < 0) {
      alert('Informe um peso válido (maior ou igual a zero).');
      return;
    }

    try {
      console.log('[handleEditStock] Alterando saldo:', { material: editingMaterial, newWeight });
      // Buscar o item no banco e atualizar
      const allItems = await dataService.listarEstoque();
      const existingItem = allItems.find(item => item.nome === editingMaterial && item.usina === state.currentUsina);

      let success = false;
      if (existingItem && existingItem.id) {
        const result = await dataService.atualizarItemEstoque(existingItem.id, newWeight);
        success = result !== null;
      } else {
        const result = await dataService.criarItemEstoque(editingMaterial, newWeight, state.currentUsina);
        success = result !== null;
      }

      if (!success) {
        console.error('[handleEditStock] Falha ao salvar no Supabase');
        alert('Erro ao alterar saldo. Verifique a conexão com o banco de dados.');
        return;
      }

      // Somente após sucesso: recarregar estado, log e fechar modal
      console.log('[handleEditStock] ✓ Saldo alterado com sucesso');
      
      // FORÇAR recarga imediata do estado
      const freshState = await dataService.loadInitialState();
      setState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          inventory: freshState.inventory,
          userRole: prev.userRole,
          isLoggedIn: prev.isLoggedIn,
          currentUsina: prev.currentUsina
        };
      });
      console.log('[handleEditStock] Estado atualizado na tela');
      
      addLog(state.currentUsina, 'RESET', `Saldo de ${editingMaterial} alterado manualmente para ${formatKg(newWeight)}`);
      setEditingMaterial(null);
    } catch (err: any) {
      console.error('[handleEditStock] Exceção:', err?.message ?? err);
      alert('Erro ao alterar saldo: ' + (err?.message || 'Erro desconhecido'));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const mimeType = file.type;
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      try {
        const extracted = await processReportImage(base64, mimeType);
        
        // Buscar todos os itens para processar
        const allItems = await dataService.listarEstoque();
        const usina = state.currentUsina;
        
        // Processar cada material com deduções
        const areiaFinaCons = extracted['AREIA FINA'] || extracted['AREIA FIN'] || 0;
        const areiaMediaCons = (extracted['AREIA MEDI'] || extracted['AREIA MÉDIA'] || 0) + areiaFinaCons;

        const updates = [
          { material: MaterialKey.BRITA_0, deduction: extracted['BRITA 0'] || 0 },
          { material: MaterialKey.BRITA_1, deduction: extracted['BRITA 1'] || 0 },
          { material: MaterialKey.AREIA_MEDIA, deduction: areiaMediaCons },
          { material: MaterialKey.AREIA_BRITA, deduction: extracted['AREIA BRIT'] || extracted['AREIA DE BRITA'] || 0 },
          { material: MaterialKey.SILO_1, deduction: extracted['SILO 1'] || 0 },
          { material: MaterialKey.SILO_2, deduction: extracted['SILO 2'] || 0 }
        ];

        for (const { material, deduction } of updates) {
          const existingItem = allItems.find(item => item.nome === material && item.usina === usina);
          if (existingItem && existingItem.id && deduction > 0) {
            const newValue = Math.max(0, (existingItem.quantidade || 0) - deduction);
            await dataService.atualizarItemEstoque(existingItem.id, newValue);
          }
        }

        addLog(state.currentUsina, 'SAÍDA_RELATÓRIO', 'Relatório processado e estoque atualizado.');
        alert('Relatório processado com sucesso!');
      } catch (err: any) {
        console.error('[handleFileUpload] Erro ao processar:', err?.message ?? err);
        alert(err instanceof Error ? err.message : 'Erro ao processar o arquivo.');
      } finally {
        setIsProcessing(false);
        // Verificar se ref existe antes de resetar
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const downloadReport = () => {
    try {
      const doc = new jsPDF();
      const margin = 20;
      let y = 20;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(30, 41, 59);
      doc.text("GINO CONCRETO", 105, y, { align: "center" });
      
      y += 10;
      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.text(`Relatório de Controle de Estoque`, 105, y, { align: "center" });
      
      y += 8;
      doc.setFontSize(11);
      doc.setTextColor(100, 116, 139);
      doc.text(`Usina: ${state.currentUsina}`, 105, y, { align: "center" });
      
      y += 6;
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 105, y, { align: "center" });

      y += 15;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text("Saldos de Materiais", margin, y);
      
      y += 10;
      doc.setFontSize(10);
      Object.entries(currentStock).forEach(([material, weightValue]) => {
        const weight = weightValue as number;
        const isCimento = material.includes('SILO');
        const threshold = isCimento ? LOW_STOCK_THRESHOLD_CEMENT : LOW_STOCK_THRESHOLD;
        const isLow = weight < threshold;
        
        if (isLow) {
          doc.setTextColor(220, 38, 38);
        } else {
          doc.setTextColor(30, 41, 59);
        }

        doc.setFont("helvetica", "bold");
        doc.text(`${material}:`, margin + 5, y);
        doc.setFont("helvetica", "normal");
        doc.text(`${formatKg(weight)}`, 100, y);
        
        if (isLow) {
           doc.setFontSize(7);
           doc.text("(ESTOQUE CRÍTICO)", 145, y);
           doc.setFontSize(10);
        }
        y += 7;
      });

      doc.setTextColor(30, 41, 59);
      y += 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Estimativa de Produção", margin, y);
      
      y += 10;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Capacidade Máxima: ${estimates.maxLoads} cargas (8m³)`, margin + 5, y);
      y += 7;
      doc.text(`Volume Total Estimado: ${formatM3(estimates.totalM3)}`, margin + 5, y);

      y += 15;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Últimas 15 Atividades", margin, y);
      
      y += 10;
      doc.setFontSize(8);
      const logs = state.history[state.currentUsina].slice(0, 15);
      
      if (logs.length > 0) {
        logs.forEach((log) => {
          const text = `[${log.timestamp}] ${log.action}: ${log.details}`;
          const lines = doc.splitTextToSize(text, 170);
          if (y + (lines.length * 4) > 280) {
            doc.addPage();
            y = 20;
          }
          doc.setFont("helvetica", "normal");
          doc.text(lines, margin + 5, y);
          y += (lines.length * 4) + 2;
        });
      } else {
        doc.setFont("helvetica", "italic");
        doc.text("Nenhuma atividade registrada.", margin + 5, y);
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text("Desenvolvido por Jose Neto", 190, 285, { align: "right" });

      doc.save(`relatorio_gino_${state.currentUsina.toLowerCase()}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar o arquivo PDF.");
    }
  };

  if (!state.isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
        <div className="w-full max-w-md bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-700">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black tracking-tighter">
              <span className="text-blue-500">GINO</span> <span className="text-white">CONCRETO</span>
            </h1>
            <p className="text-slate-400 mt-2 font-medium">Acesse o sistema de controle</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Usuário</label>
              <input 
                type="text" 
                placeholder="balanceiro ou visitante"
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={loginData.user}
                onChange={(e) => setLoginData({ ...loginData, user: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Senha</label>
              <input 
                type="password" 
                placeholder="•••••"
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={loginData.pass}
                onChange={(e) => setLoginData({ ...loginData, pass: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Usina</label>
              <select 
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
                value={loginData.usina}
                onChange={(e) => setLoginData({ ...loginData, usina: e.target.value as UsinaName })}
              >
                {USINAS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            {loginError && <p className="text-red-400 text-sm font-bold text-center">{loginError}</p>}

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95">
              Entrar no Sistema
            </button>
          </form>
          
          <div className="mt-8 pt-8 border-t border-slate-700 text-center">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
              Desenvolvido por Jose Neto
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tighter">
                <span className="text-blue-500">GINO</span> <span className="text-white">CONCRETO</span>
              </h1>
              <p className="text-slate-400 text-sm font-medium flex items-center gap-2">
                Controle de Estoque - <span className="text-blue-400">{state.currentUsina}</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                  AO VIVO
                </span>
              </p>
            </div>
          </div>
          <button onClick={handleLogout} className="md:hidden p-2 text-slate-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-slate-400">USINA:</label>
            <select 
              className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer hover:bg-slate-750"
              value={state.currentUsina}
              onChange={(e) => setState(prev => prev ? ({ ...prev, currentUsina: e.target.value as UsinaName }) : null)}
            >
              {USINAS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          
          <button onClick={handleLogout} className="hidden md:flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold uppercase">
            Sair
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 space-y-8">
        <div className="flex flex-wrap gap-3">
          {isAdmin && (
            <>
              <button 
                onClick={() => setIsNoteModalOpen(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Lançar Nota Fiscal
              </button>
              
              <button 
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.click();
                  }
                }}
                disabled={isProcessing}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {isProcessing ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                )}
                Enviar PDF / Foto
              </button>
              <input type="file" accept="image/*,.pdf" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            </>
          )}

          <button 
            onClick={downloadReport}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold transition-all border border-slate-200 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Baixar Relatório
          </button>
        </div>

        <section className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform text-white">
             <IconTruck />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="space-y-2">
              <h2 className="text-slate-400 text-sm font-bold uppercase tracking-widest">Capacidade Estimada</h2>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-black">{estimates.maxLoads}</span>
                <span className="text-2xl font-bold text-slate-500 uppercase">Cargas (8m³)</span>
              </div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur p-6 rounded-2xl border border-white/5 flex flex-col items-center min-w-[200px]">
              <div className="text-blue-400 mb-1"><IconCube /></div>
              <span className="text-3xl font-bold">{formatM3(estimates.totalM3)}</span>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-tighter">Volume Total Suportado</span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StockCard label={MaterialKey.BRITA_0} value={currentStock[MaterialKey.BRITA_0]} onEdit={isAdmin ? () => setEditingMaterial(MaterialKey.BRITA_0) : undefined} />
          <StockCard label={MaterialKey.BRITA_1} value={currentStock[MaterialKey.BRITA_1]} onEdit={isAdmin ? () => setEditingMaterial(MaterialKey.BRITA_1) : undefined} />
          <StockCard label={MaterialKey.AREIA_MEDIA} value={currentStock[MaterialKey.AREIA_MEDIA]} onEdit={isAdmin ? () => setEditingMaterial(MaterialKey.AREIA_MEDIA) : undefined} />
          <StockCard label={MaterialKey.AREIA_BRITA} value={currentStock[MaterialKey.AREIA_BRITA]} onEdit={isAdmin ? () => setEditingMaterial(MaterialKey.AREIA_BRITA) : undefined} />
          
          <div className="col-span-1 sm:col-span-2 lg:col-span-2 grid grid-cols-2 gap-4">
             <StockCard 
                label="SILO 1 (Cimento)" 
                value={currentStock[MaterialKey.SILO_1]} 
                onEdit={isAdmin ? () => setEditingMaterial(MaterialKey.SILO_1) : undefined} 
                threshold={LOW_STOCK_THRESHOLD_CEMENT} 
              />
             <StockCard 
                label="SILO 2 (Cimento)" 
                value={currentStock[MaterialKey.SILO_2]} 
                onEdit={isAdmin ? () => setEditingMaterial(MaterialKey.SILO_2) : undefined} 
                threshold={LOW_STOCK_THRESHOLD_CEMENT} 
              />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">Últimas Atividades</h3>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-md font-bold uppercase">Log</span>
          </div>
          <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-50">
            {state.history[state.currentUsina].length > 0 ? (
              state.history[state.currentUsina].map(log => (
                <div key={log.id} className="p-4 flex items-start justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-sm uppercase mr-2 ${
                      log.action === 'ENTRADA' ? 'bg-blue-100 text-blue-600' :
                      log.action === 'RESET' ? 'bg-red-100 text-red-600' :
                      'bg-emerald-100 text-emerald-600'
                    }`}>
                      {log.action}
                    </span>
                    <p className="text-sm font-medium text-slate-700 mt-1">{log.details}</p>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap ml-4">{log.timestamp}</span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 italic text-sm">Nenhuma atividade registrada.</div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-100 py-4 px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex justify-end">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Desenvolvido por <span className="text-slate-600">Jose Neto</span>
          </p>
        </div>
      </footer>

      {isNoteModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-blue-600 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="text-lg font-bold">Lançar Nota Fiscal</h3>
              <button onClick={() => setIsNoteModalOpen(false)} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleManualEntry} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Material</label>
                <select name="material" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                  <option value="" className="text-slate-400">Selecione o material...</option>
                  {Object.values(MaterialKey).map(m => <option key={m} value={m} className="text-slate-800">{m}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Peso (kg)</label>
                <input 
                  name="weight" 
                  type="number" 
                  step="0.01" 
                  required 
                  placeholder="0,00"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base font-bold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-95 mt-2">
                Confirmar Lançamento
              </button>
            </form>
          </div>
        </div>
      )}

      {editingMaterial && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-800 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="text-lg font-bold">Alterar Saldo Manual</h3>
              <button onClick={() => setEditingMaterial(null)} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleEditStock} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Material sendo alterado</label>
                <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-base font-black text-slate-700">
                  {editingMaterial}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Novo Saldo Total (kg)</label>
                <input 
                  name="weight" 
                  type="number" 
                  step="0.01" 
                  required 
                  autoFocus
                  defaultValue={currentStock[editingMaterial]}
                  placeholder="0,00"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base font-bold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-500 outline-none transition-all"
                />
                <p className="text-[10px] text-slate-400 font-medium italic">Atenção: Isso substituirá o valor atual do estoque.</p>
              </div>
              <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-95 mt-2">
                Salvar Alteração
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
