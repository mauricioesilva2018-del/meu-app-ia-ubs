import React, { useState, useMemo } from 'react';
import { DryingLog, UserProfile } from '../types';
import { 
  Flame, Waves, Plus, Search, Thermometer, Info, HelpCircle, 
  Check, AlertTriangle, Edit2, Trash2, Calendar, Clock, 
  User, ClipboardList, Package, ArrowRightLeft, ShieldAlert,
  Download, Wifi, LayoutDashboard, Activity
} from 'lucide-react';
import { synth } from '../utils/audio';

// Helper to calculate duration in HHh MMm between two hour strings (e.g. "08:30" and "14:15")
const calculateDryingDuration = (start: string, end: string): string => {
  if (!start || !end) return '';
  const startParts = start.split(':').map(Number);
  const endParts = end.split(':').map(Number);
  if (startParts.length < 2 || endParts.length < 2) return '';
  if (isNaN(startParts[0]) || isNaN(startParts[1]) || isNaN(endParts[0]) || isNaN(endParts[1])) return '';
  
  let startMin = startParts[0] * 60 + startParts[1];
  let endMin = endParts[0] * 60 + endParts[1];
  
  // Handle crossing midnight (e.g., starts 22:00, finished 04:00)
  if (endMin < startMin) {
    endMin += 24 * 60;
  }
  
  const diffMin = endMin - startMin;
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
};

interface SecagemProps {
  dryingLogs: DryingLog[];
  onAddDryingLog: (log: DryingLog) => void;
  onUpdateDryingLog: (log: DryingLog) => void;
  onDeleteDryingLog: (id: string) => void;
  currentUser: UserProfile | null;
  onAddAuditLog: (action: string, modulo: string, desc: string) => void;
}

export default function Secagem({
  dryingLogs,
  onAddDryingLog,
  onUpdateDryingLog,
  onDeleteDryingLog,
  currentUser,
  onAddAuditLog
}: SecagemProps) {
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLog, setEditingLog] = useState<DryingLog | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(true);

  // Form States (Spreadsheet fields - Unvalidated)
  const [loteId, setLoteId] = useState('');
  const [campo, setCampo] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  
  // Cultivo / Cultivar / Hibrido split fields
  const [cultura, setCultura] = useState('Soja'); 
  const [cultivar, setCultivar] = useState('TMG 2375 IPRO');
  const [hibrido, setHibrido] = useState('');
  
  const [horaInicioEnchimento, setHoraInicioEnchimento] = useState('');
  const [horaFinalEnchimento, setHoraFinalEnchimento] = useState('');
  const [moega, setMoega] = useState('Moega 1');
  const [secador, setSecador] = useState('Secador 1');
  const [umidadeEntrada, setUmidadeEntrada] = useState<string>('');
  const [tempEntrada, setTempEntrada] = useState<string>('');
  const [tempSaida, setTempSaida] = useState<string>('');
  const [horaAmostragem, setHoraAmostragem] = useState('');
  const [tempMassa, setTempMassa] = useState<string>('');
  const [umidadeSaida, setUmidadeSaida] = useState<string>('');
  const [descarga, setDescarga] = useState('');
  const [descargaDestino, setDescargaDestino] = useState('');
  const [tratamentoPreventivo, setTratamentoPreventivo] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [observacao, setObservacao] = useState('');

  // Sementes Timing states
  const [horaInicioSecagem, setHoraInicioSecagem] = useState('');
  const [horaDescarga, setHoraDescarga] = useState('');

  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Helper to set current local hour (HH:MM)
  const handleSetCurrentTime = (setter: React.Dispatch<React.SetStateAction<string>>) => {
    const now = new Date();
    const hh = now.getHours().toString().padStart(2, '0');
    const mm = now.getMinutes().toString().padStart(2, '0');
    setter(`${hh}:${mm}`);
    synth.playChime();
  };

  // Live Auto calculate for display in form
  const liveTempoSecando = useMemo(() => {
    return calculateDryingDuration(horaInicioSecagem, horaDescarga);
  }, [horaInicioSecagem, horaDescarga]);

  // Live Auto calculate for filling duration
  const liveTempoEnchendo = useMemo(() => {
    return calculateDryingDuration(horaInicioEnchimento, horaFinalEnchimento);
  }, [horaInicioEnchimento, horaFinalEnchimento]);

  // Auto preset fills for user's convenience
  const fillPreset = (type: 'sorgo' | 'soja') => {
    synth.playChime();
    if (type === 'sorgo') {
      setCultura('Sorgo');
      setCultivar('Sorgo Granífero');
      setHibrido('BRS 330 (Sorghum)');
      setUmidadeSaida('11.2');
      setTempMassa('31.5');
      setMoega('Moega 1');
      setSecador('Secador 1');
      setTratamentoPreventivo('Preventivo Sorgo C1');
      setHoraInicioSecagem('08:00');
      setHoraDescarga('14:30');
    } else {
      setCultura('Soja');
      setCultivar('TMG 2375 IPRO');
      setHibrido('BR 16 (Soybean)');
      setUmidadeSaida('12.2');
      setTempMassa('33.0');
      setMoega('Moega 3');
      setSecador('Secador 1');
      setTratamentoPreventivo('Preventivo Soja IPRO');
      setHoraInicioSecagem('07:30');
      setHoraDescarga('15:15');
    }
  };

  // Live Alert Check (for current form inputs)
  const getLiveAlerts = () => {
    const alerts: { field: string; type: 'success' | 'warn'; text: string }[] = [];
    const lowerCultura = cultura.toLowerCase();
    const isSorgo = lowerCultura.includes('sorgo');
    const isSoja = lowerCultura.includes('soja');
    
    // 1. Humidity Alert for Sorghum (ideal is between 11% and 11.5%)
    if (umidadeSaida !== '') {
      const uSaida = Number(umidadeSaida);
      if (isSorgo) {
        if (uSaida >= 11 && uSaida <= 11.5) {
          alerts.push({
            field: 'umidadeSaida',
            type: 'success',
            text: `Umidade de Saída (${uSaida}%) está IDEAL para Sorgo (Faixa recomendada: 11% a 11,5%).`
          });
        } else {
          alerts.push({
            field: 'umidadeSaida',
            type: 'warn',
            text: `Atenção: Umidade de Saída (${uSaida}%) está fora da recomendação para Sorgo (Ideal: 11% a 11,5%).`
          });
        }
      }
      // 2. Humidity Alert for Soybean (ideal is between 11% and 13%)
      else if (isSoja) {
        if (uSaida >= 11 && uSaida <= 13) {
          alerts.push({
            field: 'umidadeSaida',
            type: 'success',
            text: `Umidade de Saída (${uSaida}%) está IDEAL para Soja (Faixa recomendada: 11% a 13%).`
          });
        } else {
          alerts.push({
            field: 'umidadeSaida',
            type: 'warn',
            text: `Atenção: Umidade de Saída (${uSaida}%) está fora da recomendação para Soja (Ideal: 11% a 13%).`
          });
        }
      }
    }

    // 3. Mass Temperature alert (ideal is 35°C or below)
    if (tempMassa !== '') {
      const tMassa = Number(tempMassa);
      if (tMassa <= 35) {
        alerts.push({
          field: 'tempMassa',
          type: 'success',
          text: `Temperatura de Massa de sementes (${tMassa}°C) está IDEAL (Máximo recomendado: 35°C).`
        });
      } else {
        alerts.push({
          field: 'tempMassa',
          type: 'warn',
          text: `Atenção de Integridade: Temperatura de Massa (${tMassa}°C) está ACIMA do ideal recomendado (Máximo ideal: 35°C).`
        });
      }
    }

    return alerts;
  };

  // Excel/CSV Exporter (compatible with Semicolon Brasil standards and UTF8-BOM)
  const handleExportExcel = () => {
    synth.playSuccess();
    
    const headers = [
      'Código Lote', 'Campo', 'Data', 'Cultura', 'Cultivar', 'Híbrido', 
      'Secador', 'Hora Início Ench.', 'Hora Fim Ench.', 'Tempo Enchimento', 'Nº Moega', 'Umid. Entrada (%)', 
      'Temp. Entrada (°C)', 'Temp. Saída (°C)', 'Hora Amostra', 'Temp. Massa (°C)', 
      'Umid. Saída (%)', 'Hora Inicio Secagem', 'Hora Descarga', 'Tempo Secando',
      'Descarga Status', 'Destino', 'Tratamento Preventivo', 'Responsável/Operador', 'Observações'
    ];
    
    const rows = dryingLogs.map(log => {
      const uSaidaVal = log.umidadeSaida !== undefined ? log.umidadeSaida : log.umidade;
      const cLabel = log.cultura || (log.hibrido?.toLowerCase().includes('sorgo') || log.cultivar?.toLowerCase().includes('sorgo') ? 'Sorgo' : (log.hibrido?.toLowerCase().includes('soja') || log.cultivar?.toLowerCase().includes('soja') ? 'Soja' : 'Geral'));
      
      return [
        log.loteId || '',
        log.campo || '',
        log.data || (log.dataHora ? log.dataHora.split('T')[0] : ''),
        cLabel,
        log.cultivar || '',
        log.hibrido || '',
        log.secador || 'Secador 1',
        log.horaInicioEnchimento || '',
        log.horaFinalEnchimento || '',
        log.tempoEnchimento || '',
        log.moega || '',
        log.umidadeEntrada !== undefined ? log.umidadeEntrada : '',
        log.tempEntrada !== undefined ? log.tempEntrada : '',
        log.tempSaida !== undefined ? log.tempSaida : '',
        log.horaAmostragem || '',
        log.tempMassa !== undefined ? log.tempMassa : '',
        uSaidaVal !== undefined ? uSaidaVal : '',
        log.horaInicioSecagem || '',
        log.horaDescarga || '',
        log.tempoSecagem || '',
        log.descarga || log.tempoDescarga || '',
        log.descargaDestino || '',
        log.tratamentoPreventivo || '',
        log.responsavel || log.operador || '',
        log.observacao || ''
      ];
    });

    const csvContent = [
      headers.join(';'),
       ...rows.map(row => row.map(val => {
         const valStr = String(val).replace(/"/g, '""');
         return valStr.includes(';') || valStr.includes('\n') || valStr.includes('"') ? `"${valStr}"` : valStr;
       }).join(';'))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Sincronia_Secagem_Relatorio_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    onAddAuditLog('SINCRONIZACAO', 'Secagem', 'Acompanhamento de Secagem exportado para Excel (.csv) com sucesso.');
  };

  // Submission handler (Additive + Edit, NO BLOCKING VALIDATION)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Leave completely unvalidated! If loteId is empty, auto generate a simple suffix code
    const finalLoteId = loteId.trim() ? loteId.trim().toUpperCase() : `LOTE-SEC-${Date.now().toString().slice(-6)}`;

    const logItem: DryingLog = {
      id: editingLog ? editingLog.id : `dry-${Date.now()}`,
      loteId: finalLoteId,
      moega: moega || 'Sem Moega',
      cultivar: cultivar || 'Geral', // now map cultivar properly
      tempEntrada: tempEntrada !== '' ? Number(tempEntrada) : 0,
      tempSaida: tempSaida !== '' ? Number(tempSaida) : 0,
      umidade: umidadeSaida !== '' ? Number(umidadeSaida) : 12.5,
      tempMassa: tempMassa !== '' ? Number(tempMassa) : 0,
      tempoDescarga: descarga || liveTempoSecando || '',
      dataHora: data ? new Date(data + 'T12:00:00Z').toISOString() : new Date().toISOString(),
      operador: responsavel || (currentUser ? currentUser.name : 'Operador'),

      campo,
      data,
      cultura, // save CULTURE split
      hibrido: hibrido || '', // save HYBRID split
      horaInicioEnchimento,
      horaFinalEnchimento,
      umidadeEntrada: umidadeEntrada !== '' ? Number(umidadeEntrada) : undefined,
      horaAmostragem,
      umidadeSaida: umidadeSaida !== '' ? Number(umidadeSaida) : undefined,
      descarga,
      descargaDestino,
      tratamentoPreventivo,
      responsavel: responsavel || (currentUser ? currentUser.name : 'Operador'),
      observacao,

      horaInicioSecagem,
      horaDescarga,
      tempoSecagem: liveTempoSecando,
      tempoEnchimento: liveTempoEnchendo,
      secador: secador || 'Secador 1'
    };

    if (editingLog) {
      onUpdateDryingLog(logItem);
      synth.playSuccess();
      onAddAuditLog(
        'ALTERACAO',
        'Secagem',
        `Registro de secagem editado de lote ${logItem.loteId} (Cultura: ${logItem.cultura}, Secador: ${logItem.secador}, Tempo Secagem: ${logItem.tempoSecagem})`
      );
      setFormSuccess(`Leitura do Lote ${logItem.loteId} alterada com sucesso!`);
    } else {
      onAddDryingLog(logItem);
      synth.playSuccess();
      onAddAuditLog(
        'CADASTRO',
        'Secagem',
        `Nova leitura adicionada para lote ${logItem.loteId} (Cultura: ${logItem.cultura}, Secador: ${logItem.secador}, Moega: ${logItem.moega}, Tempo Secagem: ${logItem.tempoSecagem})`
      );
      setFormSuccess(`Leitura registrada com sucesso para o Lote ${logItem.loteId}!`);
    }

    setTimeout(() => {
      setFormSuccess(null);
    }, 4000);

    // Reset Form and close
    resetFormFields();
    setShowAddForm(false);
  };

  const startEdit = (log: DryingLog) => {
    setEditingLog(log);
    setLoteId(log.loteId || '');
    setCampo(log.campo || '');
    setData(log.data || (log.dataHora ? log.dataHora.split('T')[0] : ''));
    
    setCultura(log.cultura || (log.hibrido?.toLowerCase().includes('sorgo') ? 'Sorgo' : 'Soja'));
    setCultivar(log.cultivar || '');
    setHibrido(log.hibrido || '');
    
    setHoraInicioEnchimento(log.horaInicioEnchimento || '');
    setHoraFinalEnchimento(log.horaFinalEnchimento || '');
    setMoega(log.moega || 'Moega 1');
    setSecador(log.secador || 'Secador 1');
    setUmidadeEntrada(log.umidadeEntrada !== undefined ? log.umidadeEntrada.toString() : '');
    setTempEntrada(log.tempEntrada !== undefined ? log.tempEntrada.toString() : '');
    setTempSaida(log.tempSaida !== undefined ? log.tempSaida.toString() : '');
    setHoraAmostragem(log.horaAmostragem || '');
    setTempMassa(log.tempMassa !== undefined ? log.tempMassa.toString() : '');
    setUmidadeSaida(log.umidadeSaida !== undefined ? log.umidadeSaida.toString() : (log.umidade !== undefined ? log.umidade.toString() : ''));
    setDescarga(log.descarga || log.tempoDescarga || '');
    setDescargaDestino(log.descargaDestino || '');
    setTratamentoPreventivo(log.tratamentoPreventivo || '');
    setResponsavel(log.responsavel || log.operador || '');
    setObservacao(log.observacao || '');
    
    setHoraInicioSecagem(log.horaInicioSecagem || '');
    setHoraDescarga(log.horaDescarga || '');
    
    setShowAddForm(true);
    synth.playChime();
  };

  const handleDeleteClick = (id: string, lote: string) => {
    if (window.confirm(`Visualização de segurança: Confirmar a exclusão do registro de secagem do Lote "${lote}"?`)) {
      onDeleteDryingLog(id);
      synth.playWarning();
      onAddAuditLog('EXCLUSAO', 'Secagem', `Registro de secagem do lote ${lote} removido pelo operador.`);
    }
  };

  const resetFormFields = () => {
    setEditingLog(null);
    setLoteId('');
    setCampo('');
    setData(new Date().toISOString().split('T')[0]);
    setCultura('Soja');
    setCultivar('TMG 2375 IPRO');
    setHibrido('');
    setHoraInicioEnchimento('');
    setHoraFinalEnchimento('');
    setMoega('Moega 1');
    setSecador('Secador 1');
    setUmidadeEntrada('');
    setTempEntrada('');
    setTempSaida('');
    setHoraAmostragem('');
    setTempMassa('');
    setUmidadeSaida('');
    setDescarga('');
    setDescargaDestino('');
    setTratamentoPreventivo('');
    setResponsavel(currentUser ? currentUser.name : '');
    setObservacao('');
    setHoraInicioSecagem('');
    setHoraDescarga('');
  };

  const filteredLogs = dryingLogs.filter(log => 
    log.loteId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.hibrido || log.cultivar || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.moega.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.campo || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header section with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold font-sans text-white tracking-tight flex items-center gap-2">
            <Flame className="text-orange-400 w-5 h-5 animate-pulse" />
            Setor de Secagem e Monitoramento
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Controle de dados técnicos do secador de grãos offline-first com alertas dinâmicos para Sorgo, Soja e temperatura de massa.
          </p>
        </div>
        
        <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
          
          {/* EXPORT TO EXCEL BUTTON */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 focus:outline-none shadow-sm"
            title="Exportar dados sincronizados para abrir no Microsoft Excel"
          >
            <Download className="w-4 h-4 text-emerald-450 text-emerald-400" />
            <span className="hidden md:inline">Exportar para Excel</span>
            <span className="md:hidden">Excel</span>
          </button>

          {/* ADMIN REALTIME PANEL TOGGLE BUTTON */}
          <button
            type="button"
            onClick={() => {
              setIsAdminPanelOpen(!isAdminPanelOpen);
              synth.playChime();
            }}
            className={`w-full sm:w-auto font-semibold text-xs px-3.5 py-2.5 rounded-xl border transition-all flex items-center justify-center gap-2 focus:outline-none shadow-sm ${
              isAdminPanelOpen 
                ? 'bg-blue-600/10 border-blue-500/40 text-blue-300 hover:bg-blue-600/20' 
                : 'bg-slate-800 border-slate-700 text-slate-350 hover:text-slate-100'
            }`}
          >
            <LayoutDashboard className={`w-4 h-4 text-blue-400 ${isAdminPanelOpen ? 'animate-pulse' : ''}`} />
            <span>Painel ADM</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </button>

          {/* ADD MEDIÇÃO BUTTON */}
          <button
            onClick={() => {
              if (showAddForm) {
                resetFormFields();
                setShowAddForm(false);
              } else {
                resetFormFields();
                setShowAddForm(true);
              }
              synth.playChime();
            }}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-950/25 flex items-center justify-center gap-2 focus:outline-none"
          >
            <Plus className="w-4 h-4" />
            {showAddForm ? "Cancelar Registro" : "Nova Medição / Lote"}
          </button>
        </div>
      </div>

      {/* PAINEL DO ADMINISTRADOR (Sincronização em Tempo Real) */}
      {isAdminPanelOpen && (
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800/80 p-6 rounded-2xl space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <LayoutDashboard className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  Painel de Monitoramento do Administrador
                  <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-300 text-[9px] font-black tracking-widest uppercase rounded animate-pulse flex items-center gap-1 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    TEMPO REAL
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Os dados preenchidos e salvos pelos operadores no campo e moega são sincronizados e exibidos de forma instantânea para acompanhamento gerencial.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] bg-slate-800 border border-slate-705 border-slate-700/50 px-3 py-1.5 rounded-xl text-slate-300">
              <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse animate-pulse" />
              <span>Sincronia: <strong>Ativa (Servidor Local)</strong></span>
            </div>
          </div>

          {/* KPIs Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* KPI 1: Total Lots */}
            <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg text-xs">
                <Package className="w-5 h-5 z-10" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Lotes de Secagem</span>
                <strong className="text-lg font-bold text-white font-mono">{dryingLogs.length}</strong>
              </div>
            </div>

            {/* KPI 2: Sorgo lots count */}
            <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg text-xs">
                <span className="text-xl font-bold">🌾</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Lotes de Sorgo</span>
                <strong className="text-lg font-bold text-white font-mono">
                  {dryingLogs.filter(l => (l.cultura?.toLowerCase() || l.cultivar?.toLowerCase() || l.hibrido?.toLowerCase() || '').includes('sorgo')).length}
                </strong>
              </div>
            </div>

            {/* KPI 3: Soja lots count */}
            <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl flex items-center gap-3">
              <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-lg text-xs">
                <span className="text-xl font-bold">🌱</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Lotes de Soja</span>
                <strong className="text-lg font-bold text-white font-mono">
                  {dryingLogs.filter(l => {
                    const lab = (l.cultura?.toLowerCase() || l.cultivar?.toLowerCase() || l.hibrido?.toLowerCase() || '');
                    return lab.includes('soja') || lab.includes('tmg') || lab.includes('brl') || lab.includes('soy');
                  }).length}
                </strong>
              </div>
            </div>

            {/* KPI 4: Alert counter */}
            {(() => {
              const alertCount = dryingLogs.filter(l => {
                const uS = l.umidadeSaida !== undefined ? l.umidadeSaida : l.umidade;
                const tM = l.tempMassa !== undefined ? l.tempMassa : 0;
                const hasTempAlert = tM > 35;
                const cLower = (l.cultura || '').toLowerCase();
                const hLower = (l.hibrido || l.cultivar || '').toLowerCase();
                const isSorgo = cLower.includes('sorgo') || hLower.includes('sorgo');
                const isSoja = cLower.includes('soja') || hLower.includes('soja') || hLower.includes('tmg') || hLower.includes('brl');
                
                let hasHumidAlert = false;
                if (isSorgo && (uS < 11 || uS > 11.5)) hasHumidAlert = true;
                else if (isSoja && (uS < 11 || uS > 13)) hasHumidAlert = true;
                
                return hasTempAlert || hasHumidAlert;
              }).length;

              return (
                <div className={`bg-slate-900/40 border p-4 rounded-xl flex items-center gap-3 transition-colors ${
                  alertCount > 0 ? 'border-rose-500/25 bg-rose-500/5' : 'border-slate-800/80'
                }`}>
                  <div className={`p-2 rounded-lg text-xs ${alertCount > 0 ? 'bg-rose-500/10 text-rose-400 animate-pulse' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Alertas Críticos</span>
                    <strong className={`text-lg font-bold font-mono ${alertCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {alertCount}
                    </strong>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Live Logs Sync List */}
            <div className="lg:col-span-2 bg-slate-950 p-4 border border-slate-850/80 rounded-xl space-y-3">
              <h4 className="text-[11px] font-bold uppercase text-slate-350 tracking-wider flex items-center gap-1 text-slate-400">
                <Activity className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                Sincronização Ativa de Operadores (Tempo Real)
              </h4>
              {dryingLogs.length === 0 ? (
                <p className="text-[11px] text-slate-500 text-center py-4 italic">Nenhum lote registrado para sincronização.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {dryingLogs.slice(0, 4).map((log, idx) => {
                    const calcDur = log.tempoSecagem || log.tempoDescarga;
                    return (
                      <div key={log.id || idx} className="bg-slate-900/50 hover:bg-slate-900 border border-slate-800 pl-3 pr-4 py-2.5 rounded-lg flex justify-between items-center text-xs text-slate-300">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white bg-slate-800 border border-slate-700 px-1.5 py-0.2 rounded text-[10px]">
                              {log.loteId}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Moega: <strong className="text-slate-200">{log.moega}</strong>
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Cultura: <strong className="text-emerald-400">{log.cultura || 'Soja'}</strong> | 
                            Cultivar: <strong className="text-slate-300">{log.cultivar}</strong> 
                            {log.hibrido ? ` | Híbrido: ${log.hibrido}` : ''}
                          </div>
                        </div>
                        <div className="text-right space-y-0.5">
                          <div className="text-[11px] font-bold text-emerald-400 font-mono">
                            {calcDur ? `Duração: ${calcDur}` : 'Tempo ativo'}
                          </div>
                          <span className="text-[9px] text-slate-500 block">Registrado por: <strong>{log.responsavel || log.operador}</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Guide */}
            <div className="bg-slate-950 p-4 border border-slate-850/80 rounded-xl space-y-3">
              <h4 className="text-[11px] font-bold uppercase text-slate-350 tracking-wider flex items-center gap-1 text-slate-400">
                <HelpCircle className="w-3.5 h-3.5 text-orange-400" />
                Guia Técnico Sorgo & Soja
              </h4>
              <div className="text-[10px] text-slate-450 space-y-2 leading-relaxed text-slate-400">
                <div className="p-2 border border-slate-800/80 bg-slate-900/20 rounded-lg">
                  <span className="font-semibold text-white block">🌾 Padrão Sorgo:</span>
                  Umidade de saída ideal de <strong className="text-orange-400">11,0% a 11,5%</strong>. Semente altamente sensível a trincas térmicas.
                </div>
                <div className="p-2 border border-slate-800/80 bg-slate-900/20 rounded-lg">
                  <span className="font-semibold text-white block">🌱 Padrão Soja:</span>
                  Umidade de saída calibrada de <strong className="text-cyan-400">11,0% a 13,0%</strong> para segurança fitossanitária e germinação.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {formSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{formSuccess}</span>
        </div>
      )}

      {/* Insert / Edit Entry Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6 text-slate-200">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <ClipboardList className="text-emerald-450 text-emerald-400 w-4 h-4" />
              {editingLog ? `Editar Registro: Lote ${loteId}` : "Formulário de Registro - Acompanhamento de Secagem"}
            </h3>
            
            {/* Presets and Helpers to quickly populate form */}
            {!editingLog && (
              <div className="flex gap-2 items-center">
                <span className="text-[10px] text-slate-400">Preenchimento Rápido:</span>
                <button
                  type="button"
                  onClick={() => fillPreset('sorgo')}
                  className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded text-[10px] hover:bg-amber-500/20 font-medium"
                >
                  🌾 Sorgo
                </button>
                <button
                  type="button"
                  onClick={() => fillPreset('soja')}
                  className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 rounded text-[10px] hover:bg-cyan-500/20 font-medium"
                >
                  🌱 Soja
                </button>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Lote (Unvalidated) */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-350 mb-1 flex items-center gap-1">
                <Package className="w-3 h-3 text-slate-500" /> Identificador do Lote (Opcional)
              </label>
              <input
                type="text"
                value={loteId}
                onChange={(e) => setLoteId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700/60 rounded-lg text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                placeholder="Ex e.g.: LOTE-SOJA-502A"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">Sem validação. Em branco gera código autônomo.</p>
            </div>

            {/* Campo */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-350 mb-1">Campo / Área Origem</label>
              <input
                type="text"
                value={campo}
                onChange={(e) => setCampo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700/60 rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-none"
                placeholder="Ex: Quadrante Sul G4"
              />
            </div>

            {/* Data */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-350 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500" /> Data Operacional
              </label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700/60 rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Cultura (Select Crop) */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-350 mb-1 flex items-center gap-1">
                <Info className="w-3 h-3 text-emerald-450" /> Cultura
              </label>
              <select
                value={cultura}
                onChange={(e) => setCultura(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700/60 rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="Soja">Soja 🌱</option>
                <option value="Sorgo">Sorgo 🌾</option>
                <option value="Milho">Milho 🌽</option>
                <option value="Trigo">Trigo 🌾</option>
                <option value="Outro">Outro 📦</option>
              </select>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-slate-900/60 p-4 border border-slate-800/80 rounded-xl">
            {/* Cultivar */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-350 mb-1">Cultivar</label>
              <input
                type="text"
                value={cultivar}
                onChange={(e) => setCultivar(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700/60 rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-none"
                placeholder="Ex: TMG 2375 IPRO"
                list="cultivar-choices"
              />
              <datalist id="cultivar-choices">
                <option value="TMG 2375 IPRO" />
                <option value="BRL Urano IPRO" />
                <option value="M-SOY 8345 IPRO" />
                <option value="BRS 330 (Sorgo)" />
                <option value="Sorgo Granífero" />
              </datalist>
            </div>

            {/* Híbrido */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-350 mb-1">Híbrido Estágio</label>
              <input
                type="text"
                value={hibrido}
                onChange={(e) => setHibrido(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700/60 rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-none"
                placeholder="Ex: BR 16, Forte 10A"
              />
            </div>

            {/* Secador Ativo */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-350 mb-1">Secador Ativo</label>
              <select
                value={secador}
                onChange={(e) => setSecador(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700/60 rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="Secador 1">Secador 1</option>
                <option value="Secador 2">Secador 2</option>
                <option value="Secador 3">Secador 3</option>
                <option value="Secador 4">Secador 4</option>
                <option value="Secador 5">Secador 5</option>
              </select>
            </div>

            {/* Nº Moega */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-350 mb-1">Setor / Nº Moega</label>
              <select
                value={moega}
                onChange={(e) => setMoega(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700/60 rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="Moega 1">Moega 1</option>
                <option value="Moega 2">Moega 2</option>
                <option value="Moega 3">Moega 3</option>
                <option value="Moega 4">Moega 4</option>
                <option value="Moega 5">Moega 5</option>
              </select>
            </div>

            {/* Umidade de Entrada % */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-350 mb-1">Umidade de Entrada (%)</label>
              <input
                type="text"
                value={umidadeEntrada}
                onChange={(e) => setUmidadeEntrada(e.target.value)}
                className="w-full px-3 py-2 bg-slate-850 border border-slate-700/60 rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-none"
                placeholder="Ex: 18.5"
              />
            </div>

          </div>

          {/* CRITICAL ACTION: Automated timing duration calculation segment */}
          <div className="bg-slate-950 p-4 border border-emerald-500/20 rounded-xl space-y-3">
            <h4 className="text-xs font-bold uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-450 animate-pulse" />
              Controle de Tempo de Secagem (Cálculo em Tempo Real)
            </h4>
            <p className="text-[10px] text-slate-400 leading-normal">
              Preencha a hora em que o lote entrou no secador e a hora em que descarregou para que o sistema execute a sincronização e o cálculo de tempo de secagem automaticamente. Use a opção "Agora" para preencher com o horário local atual.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[11px] font-semibold text-slate-300">Hora Inicio Secagem (HH:MM)</label>
                  <button
                    type="button"
                    onClick={() => handleSetCurrentTime(setHoraInicioSecagem)}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 font-medium cursor-pointer transition-all"
                    title="Definir horário atual"
                  >
                    <Clock className="w-3 h-3 text-emerald-500" /> Agora
                  </button>
                </div>
                <input
                  type="text"
                  value={horaInicioSecagem}
                  onChange={(e) => setHoraInicioSecagem(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-lg text-sm text-white font-mono focus:border-emerald-400 focus:outline-none"
                  placeholder="Ex: 08:30"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[11px] font-semibold text-slate-300">Hora que Descarregou (HH:MM)</label>
                  <button
                    type="button"
                    onClick={() => handleSetCurrentTime(setHoraDescarga)}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 font-medium cursor-pointer transition-all"
                    title="Definir horário atual"
                  >
                    <Clock className="w-3 h-3 text-emerald-500" /> Agora
                  </button>
                </div>
                <input
                  type="text"
                  value={horaDescarga}
                  onChange={(e) => setHoraDescarga(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-lg text-sm text-white font-mono focus:border-emerald-400 focus:outline-none"
                  placeholder="Ex: 14:15"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-emerald-400 mb-1">Tempo Total Secando (Gerado)</label>
                <input
                  type="text"
                  value={liveTempoSecando}
                  disabled
                  className="w-full px-3 py-2 bg-slate-950 border border-emerald-500/30 rounded-lg text-sm font-bold text-emerald-300 font-mono tracking-wide cursor-not-allowed"
                  placeholder="Pendendo horários..."
                />
              </div>
            </div>
          </div>

          {/* CONTROL OF FILLING DURATION (Cálculo do tempo de Enchimento) */}
          <div className="bg-slate-950 p-4 border border-emerald-500/20 rounded-xl space-y-3">
            <h4 className="text-xs font-bold uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-450 animate-pulse" />
              Controle de Tempo de Enchimento (Cálculo em Tempo Real)
            </h4>
            <p className="text-[10px] text-slate-400 leading-normal">
              Preencha a hora de início e final de enchimento para que o sistema calcule automaticamente o tempo total de enchimento do lote. Use a opção "Agora" para preencher com o horário local atual.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[11px] font-semibold text-slate-300">Hora Início Enchimento (HH:MM)</label>
                  <button
                    type="button"
                    onClick={() => handleSetCurrentTime(setHoraInicioEnchimento)}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 font-medium cursor-pointer transition-all"
                    title="Definir horário atual"
                  >
                    <Clock className="w-3 h-3 text-emerald-500" /> Agora
                  </button>
                </div>
                <input
                  type="text"
                  value={horaInicioEnchimento}
                  onChange={(e) => setHoraInicioEnchimento(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-lg text-sm text-white font-mono focus:border-emerald-400 focus:outline-none"
                  placeholder="Ex: 08:30"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[11px] font-semibold text-slate-300">Hora Final Enchimento (HH:MM)</label>
                  <button
                    type="button"
                    onClick={() => handleSetCurrentTime(setHoraFinalEnchimento)}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 font-medium cursor-pointer transition-all"
                    title="Definir horário atual"
                  >
                    <Clock className="w-3 h-3 text-emerald-500" /> Agora
                  </button>
                </div>
                <input
                  type="text"
                  value={horaFinalEnchimento}
                  onChange={(e) => setHoraFinalEnchimento(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-lg text-sm text-white font-mono focus:border-emerald-400 focus:outline-none"
                  placeholder="Ex: 11:15"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-emerald-400 mb-1">Tempo Total Enchendo (Gerado)</label>
                <input
                  type="text"
                  value={liveTempoEnchendo}
                  disabled
                  className="w-full px-3 py-2 bg-slate-950 border border-emerald-500/30 rounded-lg text-sm font-bold text-emerald-300 font-mono tracking-wide cursor-not-allowed"
                  placeholder="Pendendo horários..."
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

            {/* Temp Entrada °C */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-350 mb-1 flex items-center gap-1">
                <Thermometer className="w-3 h-3 text-orange-400" /> Temp. Entrada (°C)
              </label>
              <input
                type="text"
                value={tempEntrada}
                onChange={(e) => setTempEntrada(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700/60 rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-none"
                placeholder="Ex: 42.0"
              />
            </div>

            {/* Temp Saida °C */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-350 mb-1 flex items-center gap-1">
                <Thermometer className="w-3 h-3 text-orange-400" /> Temp. Saída (°C)
              </label>
              <input
                type="text"
                value={tempSaida}
                onChange={(e) => setTempSaida(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700/60 rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-none"
                placeholder="Ex: 34.5"
              />
            </div>

            {/* Hora Amostragem */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-350 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" /> Hora da Amostragem
              </label>
              <input
                type="text"
                value={horaAmostragem}
                onChange={(e) => setHoraAmostragem(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700/60 rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-none"
                placeholder="Ex: 14:00"
              />
            </div>

            {/* Temp da Massa C° (Alert if > 35) */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-350 mb-1 flex items-center gap-1">
                <Thermometer className="w-3 h-3 text-red-400" /> Temp. da Massa (°C)
              </label>
              <input
                type="text"
                value={tempMassa}
                onChange={(e) => setTempMassa(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm font-bold focus:outline-none ${
                  tempMassa !== '' && Number(tempMassa) > 35 
                    ? 'bg-red-500/15 border-red-500 text-red-300' 
                    : tempMassa !== '' 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-slate-800 border-slate-700/60 text-white'
                }`}
                placeholder="Ex: 33.0"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Ideal: 35°C ou menos</p>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

            {/* Umidade de Saida % */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-350 mb-1">Umidade de Saída (%)</label>
              <input
                type="text"
                value={umidadeSaida}
                onChange={(e) => setUmidadeSaida(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm font-bold focus:outline-none ${
                  umidadeSaida !== '' 
                    ? (hibrido.toLowerCase().includes('sorgo') 
                      ? (Number(umidadeSaida) >= 11 && Number(umidadeSaida) <= 11.5 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                        : 'bg-amber-500/15 border-amber-500 text-amber-300')
                      : hibrido.toLowerCase().includes('soja') || hibrido.toLowerCase().includes('tmg') || hibrido.toLowerCase().includes('brl')
                        ? (Number(umidadeSaida) >= 11 && Number(umidadeSaida) <= 13 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                          : 'bg-amber-500/15 border-amber-500 text-amber-300')
                        : 'bg-slate-800 border-slate-700/60 text-white')
                    : 'bg-slate-800 border-slate-700/60 text-white'
                }`}
                placeholder="Ex: 11.2 (Sorgo) | 12.0 (Soja)"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Alertas recomendados: Sorgo (11% a 11.5%), Soja (11% a 13%)</p>
            </div>

            {/* Descarga / Tempo descarga */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-350 mb-1">Descarga (Status/Duração)</label>
              <input
                type="text"
                value={descarga}
                onChange={(e) => setDescarga(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700/60 rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-none"
                placeholder="Ex: 02h 45m ou Ativa"
              />
            </div>

            {/* Descarga Destino */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-350 mb-1">Descarga Destino (Silo/Câmara)</label>
              <input
                type="text"
                value={descargaDestino}
                onChange={(e) => setDescargaDestino(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700/60 rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-none"
                placeholder="Ex: Silo Pulmão 02A"
              />
            </div>

            {/* Tratamento Preventivo */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-350 mb-1 flex items-center gap-1">
                <Plus className="w-3 h-3 text-slate-500" /> Tratamento Preventivo Pós Secagem
              </label>
              <input
                type="text"
                value={tratamentoPreventivo}
                onChange={(e) => setTratamentoPreventivo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700/60 rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-none"
                placeholder="Ex: Fungicida Maxim XL"
              />
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Responsavel (Operator) */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-350 mb-1 flex items-center gap-1">
                <User className="w-3 h-3 text-slate-500" /> Responsável / Operador
              </label>
              <input
                type="text"
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700/60 rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-none"
                placeholder="Nome do operador que colheu as amostras"
              />
            </div>

            {/* Observação */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-350 mb-1">Observação do Lote</label>
              <input
                type="text"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700/60 rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-none"
                placeholder="Qualquer ocorrência térmica ou de umidade anormal no fluxo"
              />
            </div>

          </div>

          {/* Real-time Dynamic Status/Alert Monitor */}
          {getLiveAlerts().length > 0 && (
            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider block flex items-center gap-1 text-slate-400">
                <ShieldAlert className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                Monitor de Amostragem em Tempo Real
              </span>
              <ul className="space-y-1.5 text-xs">
                {getLiveAlerts().map((al, index) => (
                  <li 
                    key={index}
                    className={`flex items-start gap-2 p-2 rounded-lg ${
                      al.type === 'success' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' 
                        : 'bg-amber-500/10 text-amber-300 border border-amber-500/10'
                    }`}
                  >
                    {al.type === 'success' ? (
                      <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                    )}
                    <span>{al.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                resetFormFields();
                setShowAddForm(false);
                synth.playChime();
              }}
              className="px-4 py-2 bg-slate-800 border border-slate-700/60 hover:bg-slate-850 rounded-xl text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl text-xs shadow-md shadow-emerald-950/20 hover:from-emerald-500 hover:to-teal-500 transition-all flex items-center gap-1"
            >
              <Check className="w-4 h-4" />
              {editingLog ? "Atualizar Registro" : "Salvar Registro Secagem"}
            </button>
          </div>
        </form>
      )}

      {/* Log list list and Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-emerald-450" />
              Histórico do Acompanhamento de Secagem
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Tabela dinâmica sincronizada no modo offline-first. Use a barra de rolagem horizontal se necessário.</p>
          </div>
          
          {/* Searching input bar */}
          <div className="relative w-full sm:w-72">
            <span className="absolute left-3 top-2.5 text-slate-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
              placeholder="Buscar por lote, campo, híbrido, moega..."
            />
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-slate-500 flex flex-col items-center justify-center space-y-2">
            <Waves className="w-10 h-10 text-slate-700 animate-pulse" />
            <p className="text-xs font-semibold">Nenhum registro de secagem corresponde aos critérios de pesquisa.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-800/80 rounded-xl">
            <table className="w-full text-left text-xs min-w-[2100px]">
              <thead>
                <tr className="bg-slate-850 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold tracking-wider divide-x divide-slate-800">
                  <th className="py-3 px-3 min-w-[130px]">Código Lote</th>
                  <th className="py-3 px-3 min-w-[100px]">Secador</th>
                  <th className="py-3 px-3 min-w-[90px]">Cultura</th>
                  <th className="py-3 px-3 min-w-[130px]">Cultivar</th>
                  <th className="py-3 px-3 min-w-[120px]">Híbrido Estágio</th>
                  <th className="py-3 px-3 min-w-[130px]">Campo / Origem</th>
                  <th className="py-3 px-3 min-w-[95px]">Data</th>
                  <th className="py-3 px-3 min-w-[125px] text-center bg-cyan-950/25 text-cyan-400">Tempo Enchimento</th>
                  <th className="py-3 px-3 min-w-[100px] text-center">Início Secagem</th>
                  <th className="py-3 px-3 min-w-[100px] text-center">Hora Descarga</th>
                  <th className="py-3 px-3 min-w-[110px] text-center bg-emerald-950/25 text-emerald-400">Tempo Secando</th>
                  <th className="py-3 px-3 min-w-[110px]">Nº Moega</th>
                  <th className="py-3 px-3 min-w-[95px] text-center">Umid. Entr. (%)</th>
                  <th className="py-3 px-3 min-w-[90px] text-center">Temp. Entr. (°C)</th>
                  <th className="py-3 px-3 min-w-[90px] text-center">Temp. Saída (°C)</th>
                  <th className="py-3 px-3 min-w-[105px] text-center">Hora Amostra</th>
                  <th className="py-3 px-3 min-w-[110px] text-center">Temp. Massa (°C)</th>
                  <th className="py-3 px-3 min-w-[105px] text-center">Umid. Saída (%)</th>
                  <th className="py-3 px-3 min-w-[100px]">Status Geral</th>
                  <th className="py-3 px-3 min-w-[110px]">Destino</th>
                  <th className="py-3 px-3 min-w-[140px]">Tratam. Preventivo</th>
                  <th className="py-3 px-3 min-w-[120px]">Responsável</th>
                  <th className="py-3 px-3 min-w-[160px]">Observações</th>
                  <th className="py-3 px-3 min-w-[110px] text-center sticky right-0 bg-slate-900 z-10 border-l border-slate-800 shadow-[-4px_0_12px_rgba(0,0,0,0.5)]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium text-slate-300">
                {filteredLogs.map((log) => {
                  const cLower = (log.cultura || '').toLowerCase();
                  const hLower = (log.hibrido || log.cultivar || '').toLowerCase();
                  const isSorgo = cLower.includes('sorgo') || hLower.includes('sorgo');
                  const isSoja = cLower.includes('soja') || hLower.includes('soja') || hLower.includes('tmg') || hLower.includes('brl') || hLower.includes('m-soy');
                  
                  const uSaidaVal = log.umidadeSaida !== undefined ? log.umidadeSaida : log.umidade;
                  const tMassaVal = log.tempMassa !== undefined ? log.tempMassa : 0;

                  // Evaluate warnings
                  let humidityWarning = false;
                  let uStatusMsg = "OK";
                  if (isSorgo && (uSaidaVal < 11 || uSaidaVal > 11.5)) {
                    humidityWarning = true;
                    uStatusMsg = "Ideal: 11-11.5%";
                  } else if (isSoja && (uSaidaVal < 11 || uSaidaVal > 13)) {
                    humidityWarning = true;
                    uStatusMsg = "Ideal: 11-13%";
                  }

                  const isCriticalTemp = tMassaVal > 35; // Ideal is <= 35 as requested ("temperatura da massa entre 35 abaixo")

                  return (
                    <tr key={log.id} className="hover:bg-slate-850/60 transition-colors divide-x divide-slate-800/50">
                      
                      {/* Código Lote */}
                      <td className="py-3 px-3 font-bold text-white font-mono">{log.loteId}</td>

                      {/* Secador */}
                      <td className="py-3 px-3">
                        <span className="bg-slate-850 text-amber-500 border border-slate-750 font-bold px-1.5 py-0.5 rounded text-[10px] font-mono whitespace-nowrap">
                          {log.secador || 'Secador 1'}
                        </span>
                      </td>
                      
                      {/* Cultura */}
                      <td className="py-3 px-3">
                        {isSorgo && <span className="text-[11px] text-amber-400 font-bold uppercase flex items-center gap-1">🌾 Sorgo</span>}
                        {isSoja && <span className="text-[11px] text-cyan-400 font-bold uppercase flex items-center gap-1">🌱 Soja</span>}
                        {!isSorgo && !isSoja && <span className="text-[11px] text-slate-300">{log.cultura || 'Outro'}</span>}
                      </td>

                      {/* Cultivar */}
                      <td className="py-3 px-3 font-semibold text-slate-200">{log.cultivar || <span className="text-slate-600">-</span>}</td>

                      {/* Híbrido Estágio */}
                      <td className="py-3 px-3 text-slate-350 font-mono text-[11px]">{log.hibrido || <span className="text-slate-600">-</span>}</td>

                      {/* Campo */}
                      <td className="py-3 px-3 text-slate-300">{log.campo || <span className="text-slate-600">-</span>}</td>
                      
                      {/* Data */}
                      <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">
                        {log.data || (log.dataHora ? log.dataHora.split('T')[0] : <span className="text-slate-600">-</span>)}
                      </td>

                      {/* Tempo Enchimento (Calculado) */}
                      <td className="py-3 px-3 text-center font-mono text-[11px] bg-cyan-950/20 text-cyan-400 font-bold border-x border-cyan-900/40">
                        {log.tempoEnchimento || (log.horaInicioEnchimento && log.horaFinalEnchimento ? calculateDryingDuration(log.horaInicioEnchimento, log.horaFinalEnchimento) : <span className="text-slate-500 font-normal italic">-</span>)}
                      </td>
                      
                      {/* Hora Início Secagem */}
                      <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-300">{log.horaInicioSecagem || <span className="text-slate-600">-</span>}</td>

                      {/* Hora que Descarregou */}
                      <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-300">{log.horaDescarga || <span className="text-slate-600">-</span>}</td>

                      {/* Tempo Total de Secagem (Calculado) */}
                      <td className="py-3 px-3 text-center font-mono text-[11px] bg-emerald-950/20 text-emerald-400 font-bold border-x border-emerald-900/40">
                        {log.tempoSecagem || <span className="text-slate-500 font-normal italic">Não calculado</span>}
                      </td>

                      {/* Nº Moega */}
                      <td className="py-3 px-3 text-slate-200">
                        <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-700/40">
                          {log.moega}
                        </span>
                      </td>
                      
                      {/* Umidade de Entrada % */}
                      <td className="py-3 px-3 text-center font-mono">{log.umidadeEntrada !== undefined ? `${log.umidadeEntrada}%` : <span className="text-slate-600">-</span>}</td>
                      
                      {/* Temp Entrada °C */}
                      <td className="py-3 px-3 text-center font-mono text-slate-400">{log.tempEntrada !== undefined ? `${log.tempEntrada}°C` : <span className="text-slate-600">-</span>}</td>
                      
                      {/* Temp Saida °C */}
                      <td className="py-3 px-3 text-center font-mono text-slate-400">{log.tempSaida !== undefined ? `${log.tempSaida}°C` : <span className="text-slate-600">-</span>}</td>
                      
                      {/* Hora Amostra */}
                      <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-400">{log.horaAmostragem || <span className="text-slate-600">-</span>}</td>
                      
                      {/* Temp. da Massa (°C) - Ideal <= 35 */}
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono block ${
                          isCriticalTemp 
                             ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20' 
                             : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                        }`}>
                          {tMassaVal}°C
                          {isCriticalTemp && <span className="block text-[8px] font-black text-rose-300 animate-pulse">ALERTA {`>35°C`}</span>}
                        </span>
                      </td>
                      
                      {/* Umidade de Saída (%) */}
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono block ${
                          humidityWarning 
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                        }`}>
                          {uSaidaVal}%
                          {humidityWarning && (
                            <span className="block text-[8px] font-medium text-amber-300">
                              Fora ({uStatusMsg})
                            </span>
                          )}
                        </span>
                      </td>
                      
                      {/* Descarga (Status Geral) */}
                      <td className="py-3 px-3 font-mono text-slate-405 text-slate-350">{log.descarga || <span className="text-slate-600">-</span>}</td>
                      
                      {/* Destino */}
                      <td className="py-3 px-3 text-slate-300">{log.descargaDestino || <span className="text-slate-600">-</span>}</td>
                      
                      {/* Tratamento Preventivo */}
                      <td className="py-3 px-3 text-slate-400 text-pretty">{log.tratamentoPreventivo || <span className="text-slate-600">-</span>}</td>
                      
                      {/* Responsavel */}
                      <td className="py-3 px-3 text-slate-350 italic">{log.responsavel || <span className="text-slate-600">-</span>}</td>
                      
                      {/* Observações */}
                      <td className="py-3 px-3 text-slate-400 text-pretty text-[11px] max-w-xs">{log.observacao || <span className="text-slate-650">-</span>}</td>
                      
                      {/* Actions: Edit / Cancel (Fixed right column) */}
                      <td className="py-3 px-2 text-center sticky right-0 bg-slate-900 z-10 border-l border-slate-800 shadow-[-4px_0_12px_rgba(0,0,0,0.5)]">
                        <div className="flex gap-2 justify-center items-center">
                          <button
                            type="button"
                            onClick={() => startEdit(log)}
                            className="p-1 px-2 bg-slate-850 hover:bg-emerald-500/15 hover:text-emerald-400 text-slate-300 rounded transition-all border border-slate-800 hover:border-emerald-500/20 flex items-center gap-1 text-[11px]"
                            title="Editar este registro de secagem"
                          >
                            <Edit2 className="w-3 h-3" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(log.id, log.loteId)}
                            className="p-1 px-2 bg-slate-850 hover:bg-rose-500/15 hover:text-rose-400 text-slate-300 rounded transition-all border border-slate-800 hover:border-rose-500/20 flex items-center gap-1 text-[11px]"
                            title="Excluir este registro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}
