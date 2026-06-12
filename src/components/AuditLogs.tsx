import React, { useState } from 'react';
import { AuditLog } from '../types';
import { ShieldAlert, Search, RefreshCw, Trash2, CheckCircle, Database } from 'lucide-react';
import { synth } from '../utils/audio';

interface AuditLogsProps {
  auditLogs: AuditLog[];
  onClearLogs: () => void;
}

export default function AuditLogs({ auditLogs, onClearLogs }: AuditLogsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModulo, setFilterModulo] = useState<string>('TODOS');

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.acao.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesModulo = filterModulo === 'TODOS' || log.modulo === filterModulo;
    
    return matchesSearch && matchesModulo;
  });

  const handleClearTrigger = () => {
    if (confirm("Você tem certeza de que deseja limpar permanentemente o histórico de Logs de Auditoria? Esta ação é irreversível.")) {
      synth.playWarning();
      onClearLogs();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title Segment */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold font-sans text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="text-rose-450 text-rose-400 w-5 h-5" />
            Auditoria de Segurança & compliance
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Logs automatizados registrando cada cadastro, alteração ou gatilho com assinaturas de colaboradores logados.
          </p>
        </div>

        <button
          onClick={handleClearTrigger}
          className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-4 py-2 rounded-xl text-xs font-semibold select-none border border-rose-500/25 focus:outline-none transition-all flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Limpar Auditoria
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        
        {/* Filter and search Bar bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6">
          
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] text-slate-500 uppercase font-black">Filtrar Setor:</span>
            {['TODOS', 'Secagem', 'Pesagem', 'PMS', 'Canteiro', 'Fechamento', 'Segurança', 'Sistema'].map((mod) => (
              <button
                key={mod}
                onClick={() => { setFilterModulo(mod); synth.playChime(); }}
                className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide border transition-all ${
                  filterModulo === mod
                    ? 'bg-rose-500/20 text-rose-404 border-rose-500 text-rose-303 bg-rose-500/10 text-rose-400'
                    : 'bg-slate-800 border-slate-750 text-slate-400 hover:text-slate-250'
                }`}
              >
                {mod}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <span className="absolute left-2.5 top-2.5 text-slate-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-805 border border-slate-700 text-xs text-white rounded-lg focus:outline-none focus:border-rose-450"
              placeholder="Pesquisar por descrição, operador, ação..."
            />
          </div>

        </div>

        {/* Logs visualizer */}
        {filteredLogs.length === 0 ? (
          <div className="text-center py-16 text-slate-500 flex flex-col items-center justify-center space-y-2">
            <CheckCircle className="w-10 h-10 text-emerald-500/30" />
            <p className="text-xs font-medium">Nenhum log corresponde ao critério de busca.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-slate-550 text-[10px] uppercase font-bold tracking-wider">
                  <th className="py-3 px-4">Estampa de Tempo</th>
                  <th className="py-3 px-4">Setor/Módulo</th>
                  <th className="py-3 px-4">Ação</th>
                  <th className="py-3 px-4">Responsável (E-mail Simulado)</th>
                  <th className="py-3 px-4">Descrição de Segurança</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 font-mono">
                {filteredLogs.map((log) => {
                  const isSecAl = log.modulo === 'Segurança' || log.acao === 'ALERTA';
                  return (
                    <tr key={log.id} className="hover:bg-slate-850/60 transition-colors">
                      <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(log.dataHora).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.modulo === 'Segurança' 
                            ? 'bg-rose-500/10 text-rose-400' 
                            : log.modulo === 'Fechamento'
                            ? 'bg-emerald-500/10 text-emerald-450 text-emerald-400'
                            : 'bg-slate-800 text-slate-350'
                        }`}>
                          {log.modulo}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          log.acao === 'ALERTA' 
                            ? 'bg-rose-600 text-white animate-pulse' 
                            : log.acao === 'CADASTRO'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-indigo-600 text-white'
                        }`}>
                          {log.acao}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px] font-semibold">{log.usuario}</td>
                      <td className={`py-3 px-4 font-sans text-xs ${isSecAl ? 'text-rose-350 bg-rose-500/5 font-semibold' : 'text-slate-200'}`}>
                        {log.descricao}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-rose-450" />
            Ativo e isolado em Sandboxed Sandbox
          </span>
          <span>Exibindo {filteredLogs.length} logs de auditoria</span>
        </div>

      </div>

    </div>
  );
}
