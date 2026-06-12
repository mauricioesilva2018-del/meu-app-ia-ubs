import React, { useState } from 'react';
import { PMSLog, UserProfile } from '../types';
import { HelpCircle, Check, Info, AlertOctagon, Sliders, Calculator, Search, Share2, Plus } from 'lucide-react';
import { synth } from '../utils/audio';

interface PMSCalculatorProps {
  pmsLogs: PMSLog[];
  onAddPMSLog: (log: PMSLog) => void;
  currentUser: UserProfile | null;
  onAddAuditLog: (action: string, modulo: string, desc: string) => void;
}

export default function PMSCalculator({
  pmsLogs,
  onAddPMSLog,
  currentUser,
  onAddAuditLog
}: PMSCalculatorProps) {
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [loteId, setLoteId] = useState('');
  const [cultivar, setCultivar] = useState('TMG 2375 IPRO');
  const [sementesPorReplica, setSementesPorReplica] = useState<number>(100);
  const [replica1, setReplica1] = useState<number>(16.2);
  const [replica2, setReplica2] = useState<number>(16.5);
  const [replica3, setReplica3] = useState<number>(16.1);
  const [replica4, setReplica4] = useState<number>(16.3);
  const [replica5, setReplica5] = useState<number>(16.4);

  const [lastCalculated, setLastCalculated] = useState<any>(null);

  // Math processors
  const rawReplicas = [replica1, replica2, replica3, replica4, replica5];
  const rAvg = rawReplicas.reduce((a, b) => a + b, 0) / rawReplicas.length;
  
  // Standard Deviation
  const variance = rawReplicas.reduce((a, b) => a + Math.pow(b - rAvg, 2), 0) / (rawReplicas.length - 1);
  const stdDev = Math.sqrt(variance);
  
  // CV = (stdDev / rAvg) * 100
  const cv = rAvg > 0 ? parseFloat(((stdDev / rAvg) * 100).toFixed(2)) : 0;
  
  // PMS = (average of reps) * (1000 / seeds_per_rep)
  const calculatedPMS = parseFloat((rAvg * (1000 / sementesPorReplica)).toFixed(2));
  const isCVAuxWarning = cv > 4.0;

  const handleSimulateNormalReplicas = () => {
    synth.playSuccess();
    const base = cultivar.includes('MILHO') ? 31.5 : 17.2;
    const offset = 0.3;
    setReplica1(parseFloat((base + (Math.random() - 0.5) * offset).toFixed(2)));
    setReplica2(parseFloat((base + (Math.random() - 0.5) * offset).toFixed(2)));
    setReplica3(parseFloat((base + (Math.random() - 0.5) * offset).toFixed(2)));
    setReplica4(parseFloat((base + (Math.random() - 0.5) * offset).toFixed(2)));
    setReplica5(parseFloat((base + (Math.random() - 0.5) * offset).toFixed(2)));
  };

  const handleSimulateDeconforme = () => {
    // Generate high variation CV > 5%
    synth.playWarning();
    setReplica1(15.2);
    setReplica2(19.8);
    setReplica3(14.5);
    setReplica4(18.2);
    setReplica5(16.0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loteId.trim()) {
      alert("Por favor, preencha a identificação de Lote.");
      return;
    }

    const targetReplicas = [Number(replica1), Number(replica2), Number(replica3), Number(replica4), Number(replica5)];
    const finalAvg = targetReplicas.reduce((a, b) => a + b, 0) / targetReplicas.length;
    const finalVariance = targetReplicas.reduce((a, b) => a + Math.pow(b - finalAvg, 2), 0) / (targetReplicas.length - 1);
    const finalStdDev = Math.sqrt(finalVariance);
    const finalCV = finalAvg > 0 ? parseFloat(((finalStdDev / finalAvg) * 100).toFixed(2)) : 0;
    const finalPMS = parseFloat((finalAvg * (1000 / sementesPorReplica)).toFixed(2));

    const newLog: PMSLog = {
      id: `pms-${Date.now()}`,
      loteId: loteId.trim().toUpperCase(),
      cultivar,
      sementesPorReplica,
      replicas: targetReplicas,
      pms: finalPMS,
      cv: finalCV,
      status: finalCV > 4.0 ? 'Atenção (>4% CV)' : 'Aprovado',
      dataHora: new Date().toISOString(),
      operador: currentUser ? currentUser.name : 'Analista Lab'
    };

    onAddPMSLog(newLog);
    synth.playSuccess();
    onAddAuditLog(
      'CADASTRO',
      'PMS',
      `Cadastro de teste de PMS para lote ${newLog.loteId} (${newLog.pms}g, CV: ${newLog.cv}%, Status: ${newLog.status})`
    );

    setLastCalculated(newLog);
    setLoteId('');
    setShowAddForm(false);
  };

  const filteredLogs = pmsLogs.filter(log =>
    log.loteId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.cultivar.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold font-sans text-white tracking-tight flex items-center gap-2">
            <Calculator className="text-cyan-400 w-5 h-5" />
            Peso de Mil Sementes (PMS) - Calculadora Laboratorial
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Cálculo oficial de pureza e tamanho com base na variabilidade padrão de 5 replicatas individuais.
          </p>
        </div>
        
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            synth.playChime();
          }}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-950/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {showAddForm ? "Esconder Formulário" : "Calcular Novo Lote"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Input form */}
        <div className="lg:col-span-2 space-y-6">
          
          {showAddForm && (
            <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Análise Física das Amostras</h3>
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSimulateNormalReplicas}
                    className="text-[10px] bg-slate-800 hover:bg-slate-750 text-emerald-400 px-2.5 py-1 rounded border border-slate-700/60 font-semibold"
                  >
                    🎲 Homogêneo
                  </button>
                  <button
                    type="button"
                    onClick={handleSimulateDeconforme}
                    className="text-[10px] bg-slate-800 hover:bg-slate-750 text-rose-400 px-2.5 py-1 rounded border border-slate-700/60 font-semibold"
                  >
                    ⚠️ Heterogêneo
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Identificação Lote *</label>
                  <input
                    type="text"
                    required
                    value={loteId}
                    onChange={(e) => setLoteId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-805 border border-slate-750 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Ex: LOTE-SOJA-502A"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Cultivar / Semente</label>
                  <select
                    value={cultivar}
                    onChange={(e) => setCultivar(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-805 border border-slate-750 rounded-lg text-xs text-white focus:outline-none"
                  >
                    <option value="TMG 2375 IPRO">TMG 2375 IPRO (Soja)</option>
                    <option value="BRL Urano IPRO">BRL Urano IPRO (Soja)</option>
                    <option value="DKB 290 PRO3">DKB 290 PRO3 (Milho)</option>
                    <option value="AN dual Wheat">AN dual Wheat (Trigo)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Sementes por Replicata (Regra Oficial)</label>
                  <select
                    value={sementesPorReplica}
                    onChange={(e) => setSementesPorReplica(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-805 border border-slate-750 rounded-lg text-xs text-white focus:outline-none"
                  >
                    <option value={100}>100 sementes (Recomendado)</option>
                    <option value={50}>50 sementes (Espécimes grandes)</option>
                    <option value={1000}>1000 sementes (Direto)</option>
                  </select>
                </div>
              </div>

              {/* Replicates weight inputs */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Peso Individual de Cada Replicata (gramas - g)</label>
                <div className="grid grid-cols-5 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-450 mb-1">Replicata 1</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={replica1}
                      onChange={(e) => setReplica1(Number(e.target.value))}
                      className="w-full p-2 bg-slate-805 border border-slate-750 rounded-lg text-xs text-center font-bold text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-450 mb-1">Replicata 2</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={replica2}
                      onChange={(e) => setReplica2(Number(e.target.value))}
                      className="w-full p-2 bg-slate-805 border border-slate-750 rounded-lg text-xs text-center font-bold text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-450 mb-1">Replicata 3</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={replica3}
                      onChange={(e) => setReplica3(Number(e.target.value))}
                      className="w-full p-2 bg-slate-805 border border-slate-750 rounded-lg text-xs text-center font-bold text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-450 mb-1">Replicata 4</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={replica4}
                      onChange={(e) => setReplica4(Number(e.target.value))}
                      className="w-full p-2 bg-slate-805 border border-slate-750 rounded-lg text-xs text-center font-bold text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-450 mb-1">Replicata 5</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={replica5}
                      onChange={(e) => setReplica5(Number(e.target.value))}
                      className="w-full p-2 bg-slate-805 border border-slate-750 rounded-lg text-xs text-center font-bold text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Math outcome outcomes */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-850 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Peso Médio Aferido ({sementesPorReplica} sementes):</span>
                  <span className="text-white font-mono font-bold">{rAvg.toFixed(3)} g</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Desv. Padrão Absoluto:</span>
                  <span className="text-cyan-400 font-mono">{stdDev.toFixed(4)}</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-1 border-b border-slate-800">
                  <span className="text-slate-400">Coeficiente de Variação (CV):</span>
                  <span className={`font-mono font-black ${isCVAuxWarning ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}>
                    {cv} %
                  </span>
                </div>
                
                <div className="flex justify-between items-center pt-1.5">
                  <span className="text-xs uppercase text-slate-300 font-bold">Peso Final Estimado de Mil Sementes (PMS):</span>
                  <span className="text-emerald-400 font-extrabold text-lg tracking-wider font-mono">
                    {calculatedPMS} g
                  </span>
                </div>

                {isCVAuxWarning && (
                  <div className="mt-2.5 p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-lg text-xs flex items-start gap-2">
                    <AlertOctagon className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                    <span>
                      ⚠️ <strong>Variação Excessiva (CV &gt; 4.0%):</strong> MAPA e regras internacionais de análise de sementes (AOSA/ISTA) recomendam re-amostragem caso o Coeficiente de Variação seja superior a 4%. A amostra atual apresenta heterogeneidade de lote.
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 bg-slate-800 rounded-lg text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow"
                >
                  <Check className="w-4 h-4" />
                  Salvar Laudo Lab PMS
                </button>
              </div>
            </form>
          )}

          {/* Historical lists */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pb-2 border-b border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Boletins Lab PMS Gravados</h3>
              
              <div className="relative w-full sm:w-60">
                <span className="absolute left-2.5 top-2 text-slate-500">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-2 py-1 bg-slate-805 border border-slate-750 text-xs text-white rounded-lg"
                  placeholder="Pesquisar boletim..."
                />
              </div>
            </div>

            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                Nenhum boletim laboratorial PMS cadastrado de acordo com a busca.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                      <th className="py-2.5 px-3">Lote</th>
                      <th className="py-2.5 px-3">Cultivar</th>
                      <th className="py-2.5 px-3 text-center">Nº Sementes/Rep</th>
                      <th className="py-2.5 px-3 text-center">Replicatas (g)</th>
                      <th className="py-2.5 px-3 text-center">Desvio / CV</th>
                      <th className="py-2.5 px-3 text-center">PMS Calculado</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                      <th className="py-2.5 px-3">Analista</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-slate-300">
                    {filteredLogs.map((log) => {
                      const isHighCV = log.cv > 4.0;
                      return (
                        <tr 
                          key={log.id} 
                          onClick={() => { setLastCalculated(log); synth.playChime(); }}
                          className={`cursor-pointer transition-colors ${
                            lastCalculated?.id === log.id ? 'bg-cyan-500/10 hover:bg-cyan-500/15' : 'hover:bg-slate-850'
                          }`}
                        >
                          <td className="py-3 px-3 font-bold text-white font-mono">{log.loteId}</td>
                          <td className="py-3 px-3">{log.cultivar}</td>
                          <td className="py-3 px-3 text-center font-mono">{log.sementesPorReplica}</td>
                          <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-400">
                            [{log.replicas.join(' | ')}]
                          </td>
                          <td className="py-3 px-3 text-center font-mono">
                            <span className={isHighCV ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                              {log.cv}% CV
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-extrabold text-emerald-400 font-mono text-sm">
                            {log.pms} g
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.status === 'Aprovado'
                                ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 text-emerald-400'
                                : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                            }`}>
                              {log.status}
                            </span>
                          </td>
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

        {/* Right detailed math review panel */}
        <div className="lg:col-span-1">
          
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl text-slate-200 sticky top-20">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white pb-3 border-b border-slate-800 mb-4 flex items-center justify-between">
              <span>Fórmula e Parâmetros PMS</span>
              <Info className="w-4 h-4 text-slate-400" />
            </h3>

            {lastCalculated ? (
              <div className="space-y-4">
                
                <div className="bg-slate-850 p-4 rounded-xl text-center space-y-2">
                  <span className="text-[10px] text-slate-350 uppercase font-black tracking-wider">Metodologia Homologada</span>
                  <div className="font-mono text-xs bg-slate-900 p-2.5 rounded border border-slate-750 text-emerald-400">
                    PMS = (Média de <span className="text-white">{lastCalculated.replicas.length} Repetições</span>) * (1000 / {lastCalculated.sementesPorReplica})
                  </div>
                  <p className="text-[11px] text-slate-400 text-left leading-relaxed">
                    Pesam-se replicatas individuais sem impurezas. A fórmula interpola estatisticamente a amostra para peso indexado de 1.000 grãos comerciais.
                  </p>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="font-bold text-white text-[12px] mb-1">Estatísticas Estendidas:</div>
                  
                  <div className="flex justify-between py-1 border-b border-slate-800/60 text-slate-400">
                    <span>Lote:</span>
                    <strong className="text-white font-mono">{lastCalculated.loteId}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60 text-slate-400">
                    <span>Espécime/Cultivar:</span>
                    <span className="text-white">{lastCalculated.cultivar}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60 text-slate-400">
                    <span>Variabilidade do Lote:</span>
                    <span className={`font-mono font-bold ${lastCalculated.cv > 4 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {lastCalculated.cv}% (Coef. Variação)
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60 text-slate-400">
                    <span>Diferença Max/Mín:</span>
                    <span className="text-slate-300 font-mono">
                      {(Math.max(...lastCalculated.replicas) - Math.min(...lastCalculated.replicas)).toFixed(2)} g
                    </span>
                  </div>

                  {lastCalculated.cv > 4.0 ? (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-lg text-xs leading-relaxed">
                      ⚠️ <strong>Atenção de Lote:</strong> O coeficiente de variação calculado é de {lastCalculated.cv}%. Isto viola o padrão de homogeneidade para publicação de laudo comercial regulado pelo Ministério da Agricultura. Recomenda-se realizar nova homogeneização física das sacas antes do ensache final.
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs leading-relaxed">
                      ✅ <strong>Lote Homogêneo Comercial:</strong> Parâmetros estatísticos de distribuição excelentes para certificação física de sementes!
                    </div>
                  )}

                </div>

              </div>
            ) : (
              <div className="py-24 text-center text-slate-500 text-xs">
                Selecione um lote gravado para ver as fórmulas e estatísticas laboratoriais expandidas.
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-center gap-1">
              <span>Metodologia Padrão de Sementes (Regras MAPA)</span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
