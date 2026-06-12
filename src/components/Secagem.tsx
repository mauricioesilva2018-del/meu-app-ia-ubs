import React, { useState } from 'react';
import { DryingLog, UserProfile } from '../types';
import { Flame, Waves, Plus, Search, Thermometer, Info, HelpCircle, Check, AlertTriangle } from 'lucide-react';
import { synth } from '../utils/audio';

interface SecagemProps {
  dryingLogs: DryingLog[];
  onAddDryingLog: (log: DryingLog) => void;
  currentUser: UserProfile | null;
  onAddAuditLog: (action: string, modulo: string, desc: string) => void;
}

export default function Secagem({
  dryingLogs,
  onAddDryingLog,
  currentUser,
  onAddAuditLog
}: SecagemProps) {
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [loteId, setLoteId] = useState('');
  const [moega, setMoega] = useState('Moega 01 A');
  const [cultivar, setCultivar] = useState('TMG 2375 IPRO');
  const [tempEntrada, setTempEntrada] = useState<number>(42);
  const [tempSaida, setTempSaida] = useState<number>(35);
  const [umidade, setUmidade] = useState<number>(12.8);
  const [tempMassa, setTempMassa] = useState<number>(38);
  const [tempoDescarga, setTempoDescarga] = useState('02h 30m');

  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loteId.trim()) {
      alert("Por favor, informe a identificação do Lote.");
      return;
    }

    const newLog: DryingLog = {
      id: `dry-${Date.now()}`,
      loteId: loteId.trim().toUpperCase(),
      moega,
      cultivar,
      tempEntrada: Number(tempEntrada),
      tempSaida: Number(tempSaida),
      umidade: Number(umidade),
      tempMassa: Number(tempMassa),
      tempoDescarga,
      dataHora: new Date().toISOString(),
      operador: currentUser ? currentUser.name : 'Operador Externo'
    };

    onAddDryingLog(newLog);
    synth.playSuccess();
    onAddAuditLog(
      'CADASTRO', 
      'Secagem', 
      `Nova leitura de secagem para lote ${newLog.loteId} (Moega: ${newLog.moega}, Umidade: ${newLog.umidade}%, Temp. Massa: ${newLog.tempMassa}°C)`
    );

    setFormSuccess(`Leitura adicionada com sucesso para o lote ${newLog.loteId}!`);
    setTimeout(() => {
      setFormSuccess(null);
    }, 4000);

    // Reset Form (except cultivar/moega for quick successive entries)
    setLoteId('');
    setShowAddForm(false);
  };

  const filteredLogs = dryingLogs.filter(log => 
    log.loteId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.cultivar.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.moega.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header section with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold font-sans text-white tracking-tight flex items-center gap-2">
            <Flame className="text-orange-400 w-5 h-5 animate-pulse" />
            Setor de Secagem Térmica
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Controle e monitoramento periódico das moegas de fluxo contínuo ou estático de calor.
          </p>
        </div>
        
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            synth.playChime();
          }}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-900/20 flex items-center gap-2 focus:outline-none"
        >
          <Plus className="w-4 h-4" />
          {showAddForm ? "Fechar Cadastro" : "Nova Medição / Lote"}
        </button>
      </div>

      {formSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{formSuccess}</span>
        </div>
      )}

      {/* Insert Entry Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 text-slate-200">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-2">Formulário de Registro - Entrada e Leitura</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Identificador do Lote *</label>
              <input
                type="text"
                required
                value={loteId}
                onChange={(e) => setLoteId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700/60 rounded-lg text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                placeholder="Ex: LOTE-SOJA-502A"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Moega / Equipamento</label>
              <select
                value={moega}
                onChange={(e) => setMoega(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700/60 rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="Moega 01 A">Moega 01 A</option>
                <option value="Moega 01 B">Moega 01 B</option>
                <option value="Moega 02">Moega 02</option>
                <option value="Moega 03 B">Moega 03 B</option>
                <option value="Silagem 04 Seco">Silagem 04 Seco</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Variedade / Cultivar</label>
              <select
                value={cultivar}
                onChange={(e) => setCultivar(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700/60 rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="TMG 2375 IPRO">TMG 2375 IPRO (Soja)</option>
                <option value="BRL Urano IPRO">BRL Urano IPRO (Soja)</option>
                <option value="DKB 290 PRO3">DKB 290 PRO3 (Milho)</option>
                <option value="AN dual Wheat">AN dual Wheat (Trigo)</option>
                <option value="M-SOY 8345 IPRO">M-SOY 8345 IPRO (Soja)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tempo Previsto de Descarga</label>
              <input
                type="text"
                value={tempoDescarga}
                onChange={(e) => setTempoDescarga(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700/60 rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-none"
                placeholder="Ex: 02h 30m"
              />
            </div>

          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
            
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Temp. do Ar de Entrada (°C)</label>
              <input
                type="number"
                step="0.1"
                required
                value={tempEntrada}
                onChange={(e) => setTempEntrada(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700/60 rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Temp. do Ar de Saída (°C)</label>
              <input
                type="number"
                step="0.1"
                required
                value={tempSaida}
                onChange={(e) => setTempSaida(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700/60 rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="relative">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Dano Térmico / Temp Massa (°C)</label>
              <input
                type="number"
                step="0.1"
                required
                value={tempMassa}
                onChange={(e) => setTempMassa(Number(e.target.value))}
                className={`w-full px-3 py-2 border rounded-lg text-sm font-bold focus:outline-none ${
                  tempMassa > 43 
                    ? 'bg-rose-500/10 border-rose-500 text-rose-300' 
                    : 'bg-slate-800 border-slate-700/60 text-white'
                }`}
              />
              {tempMassa > 43 && (
                <span className="absolute text-[10px] text-rose-400 font-bold right-2 bottom-12 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                  Risco Embrião
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Umidade Final Aferida (%)</label>
              <input
                type="number"
                step="0.1"
                required
                value={umidade}
                onChange={(e) => setUmidade(Number(e.target.value))}
                className={`w-full px-3 py-2 border rounded-lg text-sm font-bold focus:outline-none ${
                  umidade > 14 
                    ? 'bg-amber-500/10 border-amber-500 text-amber-300' 
                    : 'bg-slate-800 border-slate-700/60 text-white'
                }`}
              />
            </div>

          </div>

          {/* Validation Warnings warnings */}
          <div className="space-y-2">
            {tempMassa > 43 && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>
                  <strong>Atenção de Integridade:</strong> A temperatura interna da massa de sementes ({tempMassa}°C) excede a recomendação agronômica tolerável de 43.0°C. Isto pode causar desnaturação proteica e perda imediata de vigor e germinação!
                </span>
              </div>
            )}
            
            {umidade > 14 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <span>
                  <strong>Umidade Elevada ({umidade}%):</strong> Sementes ensacadas com teor de água acima de 13.0% têm probabilidade severamente elevada de proliferação de fungos de armazenamento (e.g., Aspergillus) e autoinoculação térmica.
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
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
              Salvar Registro Secagem
            </button>
          </div>
        </form>
      )}

      {/* Log list list and Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Histórico de Cargas do Secador</h3>
          
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
              placeholder="Buscar por lote, moega, cultivar..."
            />
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-slate-500 flex flex-col items-center justify-center space-y-2">
            <Waves className="w-10 h-10 text-slate-700 animate-pulse" />
            <p className="text-xs font-semibold">Nenhum registro de secagem corresponde à busca.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3 px-4">Código Lote</th>
                  <th className="py-3 px-4">Cultivar</th>
                  <th className="py-3 px-4">Setor Moega</th>
                  <th className="py-3 px-4 text-center">Temp. Entrada/Saída</th>
                  <th className="py-3 px-4 text-center">Temp. Massa</th>
                  <th className="py-3 px-4 text-center">Umidade Final</th>
                  <th className="py-3 px-4">Descarga</th>
                  <th className="py-3 px-4">Data/Hora</th>
                  <th className="py-3 px-4">Operador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                {filteredLogs.map((log) => {
                  const isCriticalTemp = log.tempMassa > 43;
                  const isHighMoisture = log.umidade > 13.5;
                  return (
                    <tr key={log.id} className="hover:bg-slate-805 transition-colors">
                      <td className="py-3 px-4 font-bold text-white font-mono">{log.loteId}</td>
                      <td className="py-3 px-4">{log.cultivar}</td>
                      <td className="py-3 px-3">
                        <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] font-semibold border border-slate-700/40">
                          {log.moega}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        {log.tempEntrada}°C / {log.tempSaida}°C
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                          isCriticalTemp 
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400/90'
                        }`}>
                          {log.tempMassa}°C
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                          isHighMoisture 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                            : 'bg-cyan-500/10 text-cyan-400'
                        }`}>
                          {log.umidade}%
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">{log.tempoDescarga}</td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {new Date(log.dataHora).toLocaleString('pt-BR', { timeZone: 'UTC' })}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px] italic">{log.operador}</td>
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
