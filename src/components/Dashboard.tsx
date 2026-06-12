import React, { useState } from 'react';
import { DryingLog, SackWeightLog, PMSLog, BatchClosing, SeedingBedLog, AuditLog } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend 
} from 'recharts';
import { 
  BadgeAlert, Sparkles, Scale, Thermometer, CheckCircle, 
  XCircle, Waves, Timer, Info, HelpCircle, Flame, Plus, RefreshCw, AudioLines 
} from 'lucide-react';
import { synth } from '../utils/audio';

interface DashboardProps {
  dryingLogs: DryingLog[];
  sackWeights: SackWeightLog[];
  pmsLogs: PMSLog[];
  closings: BatchClosing[];
  beds: SeedingBedLog[];
  auditLogs: AuditLog[];
  onAddDryingLog: (log: DryingLog) => void;
  onAddSackWeightLog: (log: SackWeightLog) => void;
  onAddAuditLog: (action: any, modulo: any, desc: string) => void;
  currentUser: any;
}

export default function Dashboard({
  dryingLogs,
  sackWeights,
  pmsLogs,
  closings,
  beds,
  auditLogs,
  onAddDryingLog,
  onAddSackWeightLog,
  onAddAuditLog,
  currentUser
}: DashboardProps) {
  
  const [activeAlerts, setActiveAlerts] = useState<{
    id: string;
    titulo: string;
    mensagem: string;
    tipo: 'danger' | 'warning' | 'info';
    timestamp: string;
    loteId: string;
  }[]>([
    {
      id: 'alert-init',
      titulo: 'Monitoramento Online',
      mensagem: 'Sensores de umidade das moegas sincronizados.',
      tipo: 'info',
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      loteId: 'GERAL'
    }
  ]);

  // KPIs calculations
  const totalLotes = Array.from(new Set([
    ...dryingLogs.map(d => d.loteId),
    ...sackWeights.map(s => s.loteId),
    ...pmsLogs.map(p => p.loteId),
    ...closings.map(c => c.id)
  ])).length;

  const totalClosed = closings.length;
  const approvedClosed = closings.filter(c => c.status === 'Aprovado').length;
  const reprovedClosed = closings.filter(c => c.status === 'Reprovado').length;
  const taxaAprovacao = totalClosed > 0 ? Math.round((approvedClosed / totalClosed) * 100) : 100;

  const umidadeMedia = dryingLogs.length > 0 
    ? (dryingLogs.reduce((acc, curr) => acc + curr.umidade, 0) / dryingLogs.length).toFixed(1)
    : '12.5';

  const avgGermina = beds.length > 0
    ? (beds.reduce((acc, curr) => acc + curr.germinaMedia, 0) / beds.length).toFixed(1)
    : '93.2';

  // Chart data preparing
  // 1. Approved vs Repreoved
  const approvalChartData = [
    { name: 'Aprovado', value: approvedClosed > 0 ? approvedClosed : 5, color: '#10b981' },
    { name: 'Reprovado', value: reprovedClosed > 0 ? reprovedClosed : 1, color: '#f43f5e' }
  ];

  // 2. Cultivars count
  const cultivarCounts: Record<string, number> = {};
  dryingLogs.forEach(d => {
    cultivarCounts[d.cultivar] = (cultivarCounts[d.cultivar] || 0) + 1;
  });
  const cultivarChartData = Object.entries(cultivarCounts).map(([name, value]) => ({
    name: name.split(' ')[0], // abbreviate
    quantidade: value
  }));
  if (cultivarChartData.length === 0) {
    cultivarChartData.push({ name: 'Soja TMG', quantidade: 3 }, { name: 'Milho DKB', quantidade: 2 }, { name: 'Soja BRL', quantidade: 1 });
  }

  // 3. Humidity log trend
  const humidityTrendData = dryingLogs.map((d, index) => ({
    name: `L-${index + 1}`,
    'Umidade (%)': d.umidade,
    'Temp Massa (°C)': d.tempMassa,
    'loteId': d.loteId
  })).slice(-8); // last 8 records

  // Simulator Triggers
  const handleSimulateTempAnomaly = () => {
    synth.playWarning();
    const newAlert = {
      id: `alert-temp-${Date.now()}`,
      titulo: '⚠️ Alerta: Superaquecimento Térmico',
      mensagem: 'Moega 03 B registrou temperatura de massa crítica: 49.2°C (Mínimo recomendado para proteção embrionária da Soja é <43.0°C).',
      tipo: 'danger' as const,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      loteId: 'LOTE-SOJA-502A'
    };
    setActiveAlerts(prev => [newAlert, ...prev]);
    onAddAuditLog('ALERTA', 'Secagem', 'TEMPERATURA MASSIVA ALTA: Moega 03 registrou 49.2°C em lote ativo.');
    
    // Attempt standard Notification API
    if (Notification.permission === 'granted') {
      new Notification("UBS Digital Alerta", { body: "Superaquecimento na Moega 03 B! 49.2°C" });
    }
  };

  const handleSimulateSackUnderweight = () => {
    synth.playWarning();
    const newAlert = {
      id: `alert-sack-${Date.now()}`,
      titulo: '⚖️ Alerta: Balança de Ensache Baixo',
      mensagem: 'Gargalo detectado na balança de empacotamento automática do lote LOTE-SOJA-809C. Sacas individuais aferidas abaixo de 9.60kg (Mínimo tolerado legal: 9.80kg).',
      tipo: 'danger' as const,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      loteId: 'LOTE-SOJA-809C'
    };
    setActiveAlerts(prev => [newAlert, ...prev]);
    onAddAuditLog('ALERTA', 'Pesagem', 'DIVERGÊNCIA DE BALANÇA: Amostragem de sacas registrou pesos fora do limite tolerado.');
  };

  const handleSimulateNewLot = () => {
    synth.playSuccess();
    const randomBadge = Math.floor(100 + Math.random() * 899);
    const mockLoteId = `LOTE-SOJA-${randomBadge}B`;
    const newDrying: DryingLog = {
      id: `dry-${Date.now()}`,
      loteId: mockLoteId,
      moega: 'Moega 02 A',
      cultivar: 'TMG 2375 IPRO',
      tempEntrada: 41.2,
      tempSaida: 35.0,
      umidade: 12.4,
      tempMassa: 37.5,
      tempoDescarga: '02h 10m',
      dataHora: new Date().toISOString(),
      operador: 'Simulador Automático'
    };
    onAddDryingLog(newDrying);

    // Also auto weigh
    const newSack: SackWeightLog = {
      id: `sack-${Date.now()}`,
      loteId: mockLoteId,
      safra: '2025/2026',
      tipoLote: '50kg',
      amostras: [50.1, 50.0, 50.1, 49.9, 50.2, 50.0, 49.8, 50.1, 50.0, 50.3],
      media: 50.05,
      limiteMin: 49.50,
      limiteMax: 50.50,
      status: 'Aprovado',
      dataHora: new Date().toISOString(),
      operador: 'Simulador Automático'
    };
    onAddSackWeightLog(newSack);

    const newAlert = {
      id: `alert-new-${Date.now()}`,
      titulo: '🌾 Novo Lote Processado',
      mensagem: `Simulado com sucesso: ${mockLoteId} deu entrada no setor de Secagem Térmica e já gerou amostras na balança automática.`,
      tipo: 'info' as const,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      loteId: mockLoteId
    };
    setActiveAlerts(prev => [newAlert, ...prev]);
    onAddAuditLog('CADASTRO', 'Secagem', `Nova simulação iniciada para lote ${mockLoteId}.`);
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          synth.playSuccess();
          alert("Notificações de computador concedidas para simulações!");
        }
      });
    }
  };

  const cleanAllAlerts = () => {
    setActiveAlerts([]);
    synth.playChime();
  };

  return (
    <div className="space-y-6">
      
      {/* Title Segment */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl font-bold font-sans text-white tracking-tight flex items-center gap-2">
            <Sparkles className="text-emerald-400 w-6 h-6 animate-pulse" />
            UBS Digital — Painel Geral de Operações
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Gestão inteligente e offline-first de secadores, controle laboratorial e emissão de laudos para sementes certificadas.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={requestNotificationPermission}
            className="px-3.5 py-1.5 bg-slate-800/80 border border-slate-700/60 hover:bg-slate-850 text-slate-300 rounded-lg text-xs font-semibold focus:outline-none transition-all flex items-center gap-1.5"
            title="Solicitar permissão de notificações do navegador para simular push"
          >
            <BadgeAlert className="w-3.5 h-3.5 text-cyan-400" />
            Ativar Notificações Push
          </button>
          <span className="text-xs bg-slate-850 border border-slate-800 text-slate-400 px-3 py-1.5 rounded-lg font-mono">
            Relógio UBS: {new Date().toLocaleDateString('pt-BR')} (Simulação)
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-grid">
        
        <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-5 -mt-5 transition-transform duration-300 group-hover:scale-110" />
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Total de Lotes</span>
            <div className="text-3xl font-extrabold text-white tracking-tight">{totalLotes}</div>
            <p className="text-[10px] text-slate-400">Batidas integradas ativas</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <Plus className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-teal-500/5 rounded-full -mr-5 -mt-5 transition-transform duration-300 group-hover:scale-110" />
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Aprovação de Laudos</span>
            <div className="text-3xl font-extrabold text-white tracking-tight">{taxaAprovacao}%</div>
            <p className="text-[10px] text-emerald-400 font-semibold">{approvedClosed} de {totalClosed} lotes auditados</p>
          </div>
          <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-cyan-500/5 rounded-full -mr-5 -mt-5 transition-transform duration-300 group-hover:scale-110" />
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Umidade Média</span>
            <div className="text-3xl font-extrabold text-white tracking-tight">{umidadeMedia}%</div>
            <p className="text-[10px] text-slate-400">Meta recomendada: 12.0 - 13.0%</p>
          </div>
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl">
            <Waves className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-5 -mt-5 transition-transform duration-300 group-hover:scale-110" />
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Germinação Canteiro</span>
            <div className="text-3xl font-extrabold text-white tracking-tight">{avgGermina}%</div>
            <p className="text-[10px] text-slate-400 text-emerald-400 font-semibold">Vigor fisiológico excelente</p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <Thermometer className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main operational panel split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Alerts & Real-time operator Simulator */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* SIMULATOR BOARD PANEL */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Simulador de Força de Trabalho</h3>
              </div>
              <BadgeAlert className="w-4 h-4 text-slate-400 animate-bounce" />
            </div>
            
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Use estes gatilhos para testar instantaneamente a integridade de alertas, sons Web Audio sintetizados, logs de auditoria e reatividade de dados da UBS como se operadores externos estivessem coletando dados em campo:
            </p>

            <div className="space-y-3">
              <button
                onClick={handleSimulateTempAnomaly}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/25 transition-all text-xs font-semibold text-left focus:outline-none"
              >
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 shrink-0 animate-pulse" />
                  <span>Spike Temp: Secador Moega 03 B (49°C)</span>
                </div>
                <span className="text-[10px] bg-rose-500/25 text-white px-1.5 py-0.5 rounded font-mono uppercase font-black">Disparar</span>
              </button>

              <button
                onClick={handleSimulateSackUnderweight}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500/25 transition-all text-xs font-semibold text-left focus:outline-none"
              >
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 shrink-0" />
                  <span>Divergência Balança: Peso Saco Baixo (9.6kg)</span>
                </div>
                <span className="text-[10px] bg-amber-500/25 text-amber-900 px-1.5 py-0.5 rounded font-mono uppercase font-black">Disparar</span>
              </button>

              <button
                onClick={handleSimulateNewLot}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/25 transition-all text-xs font-semibold text-left focus:outline-none"
              >
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 shrink-0 animate-spin" />
                  <span>Gerar Entrada de Lote Automatizado</span>
                </div>
                <span className="text-[10px] bg-emerald-500/25 text-white px-1.5 py-0.5 rounded font-mono uppercase font-black">Simular</span>
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-center">
              <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider flex items-center justify-center gap-1">
                <AudioLines className="w-3.5 h-3.5" />
                Sincronismo Web Audio 2.0 ativo
              </span>
            </div>
          </div>

          {/* ACTIVE LIVE ALERTS CONTAINER */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
              <h3 className="text-xs font-extrabold uppercase text-slate-300 tracking-wider flex items-center gap-2">
                <BadgeAlert className="w-4 h-4 text-red-400 animate-pulse" />
                Painel do Supervisor (Avisos de Máquina)
              </h3>
              {activeAlerts.length > 0 && (
                <button
                  onClick={cleanAllAlerts}
                  className="text-[10px] text-slate-500 hover:text-white underline cursor-pointer"
                >
                  Limpar Todos
                </button>
              )}
            </div>

            {activeAlerts.length === 0 ? (
              <div className="py-8 text-center text-slate-500 space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-500/60 mx-auto" />
                <p className="text-xs font-semibold">Tudo calmo por aqui!</p>
                <p className="text-[10px] text-slate-500 text-pretty">Nenhum evento alarmante ativo nos sensores de ensache ou umidade.</p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                {activeAlerts.map(alert => (
                  <div 
                    key={alert.id} 
                    className={`p-3 rounded-xl border text-xs relative ${
                      alert.tipo === 'danger' 
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' 
                        : alert.tipo === 'warning'
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-[12px]">{alert.titulo}</span>
                      <span className="text-[9px] text-slate-400 font-mono">{alert.timestamp}</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed mb-1">{alert.mensagem}</p>
                    <div className="text-[10px] font-mono text-slate-400 flex justify-between items-center mt-2 pt-1 border-t border-slate-800">
                      <span>Lote associado: <strong className="text-white font-semibold">{alert.loteId}</strong></span>
                      <button
                        onClick={() => setActiveAlerts(prev => prev.filter(a => a.id !== alert.id))}
                        className="text-[9px] text-rose-400 hover:text-rose-300 focus:outline-none shrink-0"
                      >
                        Descartar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Charts Section */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Pie Chart Approved vs Reproved */}
            <div className="bg-[#1e293b] border border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-4">Proporção Secagem / Qualidade Geral</h3>
              
              <div className="h-64 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={approvalChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {approvalChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip cursor={{ fill: 'transparent' }} />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Center Value */}
                <div className="absolute text-center">
                  <span className="text-xs text-slate-400 uppercase font-bold block">Taxa Aprovação</span>
                  <span className="text-3xl font-extrabold text-emerald-400">{taxaAprovacao}%</span>
                </div>
              </div>

              {/* Legends */}
              <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-slate-800 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-slate-300 font-medium">Aprovados ({approvedClosed})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-slate-300 font-medium">Reprovados ({reprovedClosed})</span>
                </div>
              </div>
            </div>

            {/* Bar Chart Cultivars split */}
            <div className="bg-[#1e293b] border border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-4">Volume por Variedade / Cultivar</h3>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cultivarChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569' }} 
                      labelStyle={{ color: '#fff', fontSize: '11px' }}
                      itemStyle={{ color: '#34d399', fontSize: '11px' }}
                    />
                    <Bar dataKey="quantidade" fill="#10b981" radius={[4, 4, 0, 0]}>
                      {cultivarChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#10b981' : '#14b8a6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800 text-center">
                <p className="text-[11px] text-slate-400">Dados baseados no registro de moegas do setor de secagem térmica</p>
              </div>

            </div>

          </div>

          {/* Area Chart: History of Humidity & mass temperature in Dryer logs */}
          <div className="bg-[#1e293b] border border-slate-800 p-5 rounded-2xl shadow-sm">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-4 flex items-center justify-between">
              <span>Histórico de Umidade e Temp. da Massa por Amostra</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded">Últimas 8 cargas</span>
            </h3>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={humidityTrendData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorUmidade" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569' }}
                    labelStyle={{ color: '#fff', fontSize: '11px' }}
                    itemStyle={{ fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', marginTop: '10px' }} />
                  <Area type="monotone" dataKey="Umidade (%)" stroke="#14b8a6" fillOpacity={1} fill="url(#colorUmidade)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Temp Massa (°C)" stroke="#f59e0b" fillOpacity={1} fill="url(#colorTemp)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick instructions or rules */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 flex items-start gap-3">
            <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block mb-0.5">Segurança Operacional da Semente</span>
              Para garantir que as sementes não percam potencial germinativo durante a secagem por ar quente, regule o secador de modo que a temperatura interna da massa de grãos (Temp Massa) nunca ultrapasse 43°C para trigo/soja e 50°C para milho. A umidade ótima comercial para ensache deve estar estabilizada entre 12.0% e 13.0%.
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
