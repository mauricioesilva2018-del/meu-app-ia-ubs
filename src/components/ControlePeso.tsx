import React, { useState } from 'react';
import { SackWeightLog, UserProfile } from '../types';
import { Scale, Check, Plus, Search, Info, Trash2, Sliders, AlertTriangle } from 'lucide-react';
import { synth } from '../utils/audio';

interface ControlePesoProps {
  sackWeights: SackWeightLog[];
  onAddSackWeightLog: (log: SackWeightLog) => void;
  currentUser: UserProfile | null;
  onAddAuditLog: (action: string, modulo: string, desc: string) => void;
}

export default function ControlePeso({
  sackWeights,
  onAddSackWeightLog,
  currentUser,
  onAddAuditLog
}: ControlePesoProps) {
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selection/Input state
  const [loteId, setLoteId] = useState('');
  const [safra, setSafra] = useState('2025/2026');
  const [tipoLote, setTipoLote] = useState<'10kg' | '50kg'>('50kg');
  
  // Weights array of 10 samples
  const [samples, setSamples] = useState<number[]>([50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0]);
  
  // Highlighting selected log for visual charting
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  const cleanFormForType = (type: '10kg' | '50kg') => {
    if (type === '50kg') {
      setSamples([50.1, 49.9, 50.2, 50.0, 49.8, 50.1, 50.3, 50.0, 49.7, 50.1]);
    } else {
      setSamples([10.0, 9.9, 10.1, 9.8, 10.2, 10.0, 9.9, 10.1, 9.8, 10.0]);
    }
  };

  const handleCreateSamplesAutomatically = () => {
    synth.playSuccess();
    const base = tipoLote === '50kg' ? 50.0 : 10.0;
    const offset = tipoLote === '50kg' ? 0.3 : 0.15;
    
    // Generate 10 randomized samples around base close to real tolerances
    const randomSamples = Array.from({ length: 10 }, () => {
      const noise = (Math.random() * 2 - 1) * offset;
      return parseFloat((base + noise).toFixed(2));
    });
    setSamples(randomSamples);
  };

  // Compute stats on active input samples
  const minLimit = tipoLote === '50kg' ? 49.50 : 9.80;
  const maxLimit = tipoLote === '50kg' ? 50.50 : 10.20;
  
  const sum = samples.reduce((acc, curr) => acc + curr, 0);
  const average = parseFloat((sum / samples.length).toFixed(3));
  
  const isAnySampleOutside = samples.some(s => s < minLimit || s > maxLimit);
  const isAverageTooLow = average < (tipoLote === '50kg' ? 50.0 : 10.0); // MAPA recommendations require the batch average doesn't fall below label size

  const handleSampleChange = (index: number, val: number) => {
    const updated = [...samples];
    updated[index] = val;
    setSamples(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loteId.trim()) {
      alert("Por favor, preencha a identificação de Lote.");
      return;
    }

    const computedAverage = parseFloat((samples.reduce((a, b) => a + b, 0) / samples.length).toFixed(3));
    const isOut = samples.some(s => s < minLimit || s > maxLimit) || computedAverage < (tipoLote === '50kg' ? 50.0 : 10.0);

    const newLog: SackWeightLog = {
      id: `sack-${Date.now()}`,
      loteId: loteId.trim().toUpperCase(),
      safra,
      tipoLote,
      amostras: [...samples],
      media: computedAverage,
      limiteMin: minLimit,
      limiteMax: maxLimit,
      status: isOut ? 'Fora do Limite' : 'Aprovado',
      dataHora: new Date().toISOString(),
      operador: currentUser ? currentUser.name : 'Operador Ensache'
    };

    onAddSackWeightLog(newLog);
    synth.playSuccess();
    onAddAuditLog(
      'CADASTRO',
      'Pesagem',
      `Cadastro de pesagem estatística para lote ${newLog.loteId} (Sacas de ${newLog.tipoLote}, Média: ${newLog.media}kg, Status: ${newLog.status})`
    );

    setSelectedLogId(newLog.id);
    setLoteId('');
    setShowAddForm(false);
  };

  const filteredWeights = sackWeights.filter(log => 
    log.loteId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.operador.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Determine active log for SVG plotting
  const activeLogForChart = sackWeights.find(w => w.id === selectedLogId) || sackWeights[0];

  return (
    <div className="space-y-6">
      
      {/* Title Segment */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold font-sans text-white tracking-tight flex items-center gap-2">
            <Scale className="text-teal-400 w-5 h-5" />
            Controle Estatístico de Peso das Sacas (SC)
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Garantia de tolerância legal (Amostras de pesagem individual do ensache mecânico - Normas MAPA).
          </p>
        </div>
        
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            cleanFormForType(tipoLote);
            synth.playChime();
          }}
          className="bg-emerald-605 hover:bg-emerald-600 border border-emerald-500/30 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 focus:outline-none bg-emerald-600"
        >
          <Plus className="w-4 h-4" />
          {showAddForm ? "Esconder Formulário" : "Registrar Nova Aferição"}
        </button>
      </div>

      {/* Main operational flow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Form / List Panel */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* New weighing action form */}
          {showAddForm && (
            <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Nova Aferição Estatística - 10 Repetições</h3>
                
                <button
                  type="button"
                  onClick={handleCreateSamplesAutomatically}
                  className="text-[11px] bg-slate-800 hover:bg-slate-750 text-emerald-400 px-3 py-1 rounded-md border border-slate-700/60 font-semibold focus:outline-none shrink-0"
                >
                  🎲 Simular Amostras Aleatórias
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Identificação Lote *</label>
                  <input
                    type="text"
                    required
                    value={loteId}
                    onChange={(e) => setLoteId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-805 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Ex: LOTE-SOJA-502A"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Volume do Saco (Padrão)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => { setTipoLote('50kg'); cleanFormForType('50kg'); }}
                      className={`text-xs py-1.5 rounded-lg border font-semibold ${
                        tipoLote === '50kg' ? 'bg-teal-500/20 border-teal-500 text-teal-300' : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      50 kg
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTipoLote('10kg'); cleanFormForType('10kg'); }}
                      className={`text-xs py-1.5 rounded-lg border font-semibold ${
                        tipoLote === '10kg' ? 'bg-teal-500/20 border-teal-500 text-teal-300' : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      10 kg
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Safra Agrícola</label>
                  <input
                    type="text"
                    required
                    value={safra}
                    onChange={(e) => setSafra(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-805 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Individual Samples entry entry */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Peso de cada uma das 10 Sacas Individuais (kg)</label>
                <div className="grid grid-cols-5 gap-2.5">
                  {samples.map((val, index) => (
                    <div key={index} className="relative">
                      <span className="absolute top-1 left-1.5 text-[9px] text-slate-500 font-mono font-bold">Nº{index + 1}</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={val}
                        onChange={(e) => handleSampleChange(index, Number(e.target.value))}
                        className={`w-full pt-4 pb-1 px-1.5 text-center bg-slate-805 border rounded-lg text-xs font-bold text-white focus:outline-none focus:border-cyan-500 ${
                          val < minLimit || val > maxLimit ? 'border-rose-500 bg-rose-500/10 text-rose-300' : 'border-slate-750'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic alert feedback in inputs */}
              <div className="bg-slate-950/85 p-3.5 rounded-xl border border-slate-800 text-xs flex flex-wrap justify-between items-center gap-2">
                <div className="space-y-0.5">
                  <div className="text-slate-400 font-medium">Média do Lote: 
                    <strong className={`ml-1 font-bold ${isAverageTooLow ? 'text-rose-400' : 'text-emerald-400'}`}>{average} kg</strong>
                  </div>
                  <div className="text-[10px] text-slate-500">Tolerância aceitável: {minLimit}kg a {maxLimit}kg</div>
                </div>

                {isAnySampleOutside && (
                  <div className="text-[11px] text-rose-400 font-semibold flex items-center gap-1.5 bg-rose-500/5 px-2.5 py-1 rounded-lg border border-rose-500/20">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Sacas fora do intervalo legal comercial</span>
                  </div>
                )}
                {isAverageTooLow && !isAnySampleOutside && (
                  <div className="text-[11px] text-rose-450 font-semibold flex items-center gap-1 bg-amber-500/5 px-2.5 py-1 rounded-lg border border-amber-500/20 text-amber-300">
                    <Info className="w-3.5 h-3.5" />
                    <span>Média inferior à nominal ({tipoLote})</span>
                  </div>
                )}
                {!isAnySampleOutside && !isAverageTooLow && (
                  <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-500/5 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    <Check className="w-3.5 h-3.5" />
                    <span>Perímetro Conforme Legalmente</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold shadow flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  Salvar Pesagem SC
                </button>
              </div>
            </form>
          )}

          {/* Table history list */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pb-2 border-b border-slate-800/80">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Histórico de Pesagens de Cúpula</h3>
              
              <div className="relative w-full sm:w-60">
                <span className="absolute left-2 top-2 text-slate-500">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-2 py-1 bg-slate-800 border border-slate-750 rounded-lg text-xs text-white"
                  placeholder="Buscar lote..."
                />
              </div>
            </div>

            {filteredWeights.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                Nenhum registro de balança cadastrado.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold text-[10px] uppercase">
                      <th className="py-2.5 px-3">Lote</th>
                      <th className="py-2.5 px-3">Embalagem</th>
                      <th className="py-2.5 px-3 text-center">Peso Médio</th>
                      <th className="py-2.5 px-3 text-center">Nº Conformidade</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3">Safra</th>
                      <th className="py-2.5 px-3">Operador</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filteredWeights.map((log) => {
                      const isSelected = activeLogForChart?.id === log.id;
                      const outsideSamples = log.amostras.filter(s => s < log.limiteMin || s > log.limiteMax).length;
                      return (
                        <tr 
                          key={log.id} 
                          onClick={() => { setSelectedLogId(log.id); synth.playChime(); }}
                          className={`cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-teal-500/10 hover:bg-teal-500/15'
                              : 'hover:bg-slate-850'
                          }`}
                        >
                          <td className="py-3 px-3 font-bold text-white font-mono">{log.loteId}</td>
                          <td className="py-3 px-3">Saca de {log.tipoLote}</td>
                          <td className="py-3 px-3 text-center font-bold text-white font-mono">{log.media} kg</td>
                          <td className="py-3 px-3 text-center">
                            {outsideSamples > 0 ? (
                              <span className="text-rose-450 bg-rose-500/10 px-2 py-0.5 rounded text-[10px] font-bold border border-rose-500/20 text-rose-300">
                                {outsideSamples} Fora de Faixa
                              </span>
                            ) : (
                              <span className="text-emerald-450 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] font-bold text-emerald-400">
                                10/10 Conformes
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              log.status === 'Aprovado' 
                                ? 'bg-emerald-500/10 text-emerald-400' 
                                : 'bg-rose-500/10 text-rose-400'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-400 font-mono">{log.safra}</td>
                          <td className="py-3 px-3 text-slate-400 italic text-[11px]">{log.operador}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Right side statistical chart plotting */}
        <div className="lg:col-span-1">
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-slate-200 sticky top-20">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white pb-3 border-b border-slate-800 mb-4 flex items-center justify-between">
              <span>Gráfico de Dispersão Estatística</span>
              <span className="text-[10px] bg-teal-500/10 text-teal-400 font-mono px-1.5 py-0.5 rounded border border-teal-500/20">Lote Atual</span>
            </h3>

            {activeLogForChart ? (
              <div className="space-y-4">
                
                {/* Info block */}
                <div className="bg-slate-850 p-3 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Identificação Lote:</span>
                    <strong className="text-white font-mono">{activeLogForChart.loteId}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Amostragem Nominal:</span>
                    <strong className="text-white">Sacas de {activeLogForChart.tipoLote}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Média das Pesadas:</span>
                    <strong className="text-emerald-400 font-mono">{activeLogForChart.media} kg</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tolerância Aceitável:</span>
                    <strong className="text-slate-300 font-mono">{activeLogForChart.limiteMin} - {activeLogForChart.limiteMax} kg</strong>
                  </div>
                </div>

                {/* Customized SVG graph plotting */}
                <div className="bg-slate-950 p-2 rounded-xl">
                  
                  <div className="text-center text-[10px] text-slate-400 font-semibold mb-2">
                    Desvio das Pesadas vs Limites Legais
                  </div>

                  <div className="relative h-60 w-full flex items-center justify-center">
                    
                    {/* Native SVG plot plotter */}
                    <svg viewBox="0 0 300 180" className="w-full h-full">
                      {/* Grid/Limits guide lines */}
                      {/* Upper limit line */}
                      <line x1="10" y1="30" x2="290" y2="30" stroke="#f43f5e" strokeWidth="2" strokeDasharray="3,3" />
                      <text x="210" y="24" fill="#f43f5e" fontSize="9" fontWeight="bold">LSU {activeLogForChart.limiteMax} kg</text>

                      {/* Nominal center Target line */}
                      <line x1="10" y1="90" x2="290" y2="90" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.4" />
                      <text x="210" y="84" fill="#10b981" fontSize="9" fontWeight="bold">Padrão {activeLogForChart.tipoLote}</text>

                      {/* Lower limit line */}
                      <line x1="10" y1="150" x2="290" y2="150" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3,3" />
                      <text x="210" y="144" fill="#f59e0b" fontSize="9" fontWeight="bold">LSI {activeLogForChart.limiteMin} kg</text>

                      {/* Map weight values to SVG coordinate matrix */}
                      {(() => {
                        const pts = activeLogForChart.amostras.map((w, index) => {
                          const x = 20 + index * 27;
                          
                          // Determine normalization position
                          const nominal = activeLogForChart.tipoLote === '50kg' ? 50.0 : 10.0;
                          const gap = activeLogForChart.tipoLote === '50kg' ? 1.0 : 0.4; // max distance shown in graph
                          
                          const diff = w - nominal;
                          // map diff -gap..+gap to y coordinate 150..30 (90 is nomimal)
                          let relativePercent = diff / gap; // -1 to +1
                          if (relativePercent > 1.2) relativePercent = 1.2;
                          if (relativePercent < -1.2) relativePercent = -1.2;

                          const y = 90 - relativePercent * 60;
                          return { x, y, value: w };
                        });

                        // Draw path connecting dots
                        const pathStr = pts.reduce((acc, p, index) => 
                          index === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`
                       , '');

                        return (
                          <>
                            <path d={pathStr} fill="none" stroke="#22d3ee" strokeWidth="3" />
                            {pts.map((p, i) => {
                              const isOutside = p.value < activeLogForChart.limiteMin || p.value > activeLogForChart.limiteMax;
                              return (
                                <g key={i}>
                                  <circle 
                                    cx={p.x} 
                                    cy={p.y} 
                                    r={isOutside ? "6" : "4.5"} 
                                    fill={isOutside ? "#f43f5e" : "#22d3ee"} 
                                    stroke="#1e293b"
                                    strokeWidth="1.5"
                                  />
                                  <text x={p.x - 6} y={p.y - 10} fill="#a7f3d0" fontSize="8" fontWeight="bold">
                                    {p.value}
                                  </text>
                                </g>
                              );
                            })}
                          </>
                        );
                      })()}
                    </svg>

                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-2 pt-2 border-t border-slate-800">
                    <span>Amostra de 1 a 10</span>
                    <span>LSU: Limite Sup. / LSI: Limite Inf.</span>
                  </div>

                </div>

                <div className="p-3 bg-slate-850 rounded-xl text-center">
                  <p className="text-[10px] text-slate-400">
                    Clique em qualquer linha do histórico para carregar a espectrografia de pesagem correspondente do lote.
                  </p>
                </div>

              </div>
            ) : (
              <div className="py-24 text-center text-slate-500 text-xs">
                Selecione ou adicione um lote para visualizar o gráfico estatístico.
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
