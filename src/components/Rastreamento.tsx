import React, { useState } from 'react';
import { DryingLog, SackWeightLog, PMSLog, BatchClosing, SeedingBedLog } from '../types';
import { Search, Compass, Thermometer, Box, FileText, Sprout, ShieldAlert } from 'lucide-react';
import { synth } from '../utils/audio';

interface RastreamentoProps {
  dryingLogs: DryingLog[];
  sackWeights: SackWeightLog[];
  pmsLogs: PMSLog[];
  closings: BatchClosing[];
  beds: SeedingBedLog[];
}

export default function Rastreamento({
  dryingLogs,
  sackWeights,
  pmsLogs,
  closings,
  beds
}: RastreamentoProps) {
  
  const [searchQuery, setSearchQuery] = useState<string>('LOTE-SOJA-502A');
  const [hasSearched, setHasSearched] = useState(true);

  // Cross-module query aggregator
  const query = searchQuery.trim().toUpperCase();

  const matchingDrying = dryingLogs.filter(d => d.loteId.toUpperCase() === query);
  const matchingWeighing = sackWeights.filter(s => s.loteId.toUpperCase() === query);
  const matchingPMS = pmsLogs.filter(p => p.loteId.toUpperCase() === query);
  const matchingClosing = closings.filter(c => c.id.toUpperCase() === query);
  const matchingBeds = beds.filter(b => b.loteId.toUpperCase() === query);

  const totalHits = matchingDrying.length + matchingWeighing.length + matchingPMS.length + matchingClosing.length + matchingBeds.length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    if (totalHits > 0) {
      synth.playSuccess();
    } else {
      synth.playWarning();
    }
  };

  const selectPredefined = (loteStr: string) => {
    setSearchQuery(loteStr);
    setHasSearched(true);
    synth.playChime();
  };

  return (
    <div className="space-y-6">
      
      {/* Title Segment */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h2 className="text-xl font-bold font-sans text-white tracking-tight flex items-center gap-2">
          <Compass className="text-emerald-450 text-emerald-400 w-5 h-5" />
          Rastreabilidade Avançada e Histórico de Lotes
        </h2>
        <p className="text-slate-400 text-xs mt-1">
          Busque a identificação unificada do lote para auditar todo o ciclo de vida da semente desde a moega até o laudo final.
        </p>

        {/* Input bar search form */}
        <form onSubmit={handleSearchSubmit} className="mt-5 flex gap-2 max-w-lg">
          <input
            type="text"
            required
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-slate-805 border border-slate-700 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-rose-500 focus:border-emerald-500 uppercase"
            placeholder="Digite o Lote (ex: LOTE-SOJA-502A)..."
          />
          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow focus:outline-none"
          >
            Pesquisar Lote
          </button>
        </form>

        {/* Predefined quick select select pills */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className="text-[10px] text-slate-500 uppercase font-bold">Lotes Populares:</span>
          <button onClick={() => selectPredefined('LOTE-SOJA-502A')} className="text-[11px] bg-slate-800 hover:bg-slate-750 text-emerald-400 px-2.5 py-0.5 rounded-full border border-slate-700/65 font-mono">
            LOTE-SOJA-502A
          </button>
          <button onClick={() => selectPredefined('LOTE-MILHO-101X')} className="text-[11px] bg-slate-800 hover:bg-slate-750 text-emerald-400 px-2.5 py-0.5 rounded-full border border-slate-700/65 font-mono">
            LOTE-MILHO-101X
          </button>
          <button onClick={() => selectPredefined('LOTE-SOJA-809C')} className="text-[11px] bg-slate-800 hover:bg-slate-750 text-amber-400 px-2.5 py-0.5 rounded-full border border-slate-700/65 font-mono">
            LOTE-SOJA-809C
          </button>
        </div>
      </div>

      {hasSearched && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {totalHits === 0 ? (
            <div className="col-span-12 bg-slate-900 border border-slate-800 p-12 rounded-2xl text-center space-y-3">
              <span className="text-4xl">🔍</span>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Aviso de Rastreamento</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Não localizamos nenhuma batida operacional ou boletim laboratorial sob a identificação <strong className="text-white font-mono">"{searchQuery}"</strong>. Redija uma identificação válida ou adicione registros nas abas anteriores.
              </p>
            </div>
          ) : (
            <>
              
              {/* Chronological Vertical workflow timeline timeline */}
              <div className="lg:col-span-8 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
                
                <div className="flex items-center justify-between pb-3 border-b border-slate-805">
                  <h3 className="text-xs font-bold uppercase text-slate-300 tracking-wider">
                    Linha do Tempo de Certificação de Lote
                  </h3>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold">
                    {totalHits} Interações Encontradas
                  </span>
                </div>

                <div className="relative border-l border-slate-800 pl-6 ml-3 space-y-8">
                  
                  {/* GATE 1: DRYING SEGMENT */}
                  {matchingDrying.map((d, idx) => (
                    <div key={d.id} className="relative">
                      {/* Marker bullet */}
                      <span className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-orange-500 border-4 border-slate-900 flex items-center justify-center" />
                      
                      <div className="bg-slate-850 p-4 rounded-xl border border-slate-800">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                            <Thermometer className="w-4 h-4 text-orange-400" />
                            Etapa 01: Tratamento e Secagem Térmica
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(d.dataHora).toLocaleString('pt-BR')}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1.5 border-t border-slate-800/60 text-slate-350">
                          <div>
                            <span className="text-slate-500 block text-[10px]">Equipamento / Moega:</span>
                            <span className="font-semibold text-slate-200">{d.moega}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Carga Umidade Final:</span>
                            <span className="font-semibold text-cyan-400">{d.umidade}%</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Temperatura Massa:</span>
                            <span className={`font-semibold ${d.tempMassa > 43 ? 'text-rose-400' : 'text-emerald-400'}`}>{d.tempMassa}°C</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Variedade:</span>
                            <span>{d.cultivar}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Diferencial Entrada/Saída:</span>
                            <span className="font-mono text-[11px]">{d.tempEntrada}°C / {d.tempSaida}°C</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Operador Setor:</span>
                            <span className="italic text-slate-300">{d.operador}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* GATE 2: WEIGHING SCALE COMPONENT */}
                  {matchingWeighing.map((s, idx) => (
                    <div key={s.id} className="relative">
                      <span className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-cyan-400 border-4 border-slate-900" />

                      <div className="bg-slate-850 p-4 rounded-xl border border-slate-800">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                            <Box className="w-4 h-4 text-cyan-400" />
                            Etapa 02: Pesagem Automatizada e Ensache (SC)
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(s.dataHora).toLocaleString('pt-BR')}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1.5 border-t border-slate-800/60 text-slate-350">
                          <div>
                            <span className="text-slate-500 block text-[10px]">Tipo de Embalagem:</span>
                            <span className="font-semibold text-slate-200">Saca de {s.tipoLote}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Peso Médio Amostrado:</span>
                            <span className="font-bold text-emerald-400 text-sm font-mono">{s.media} kg</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Status Balança:</span>
                            <span className={`px-1.5 py-0.5 rounded font-black text-[10px] uppercase ${
                              s.status === 'Aprovado' 
                                ? 'bg-emerald-550/10 text-emerald-400' 
                                : 'bg-rose-500/10 text-rose-400'
                            }`}>
                              {s.status}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-slate-500 block text-[10px]">10 Pesagens Amostrais Individuais:</span>
                            <span className="font-mono text-slate-300 text-[11px]">[{s.amostras.join(' | ')}]</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Operador Maquinário:</span>
                            <span className="italic text-slate-300">{s.operador}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* GATE 3: LAB PMS */}
                  {matchingPMS.map((p, idx) => (
                    <div key={p.id} className="relative">
                      <span className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-teal-400 border-4 border-slate-900" />

                      <div className="bg-slate-850 p-4 rounded-xl border border-slate-800">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-teal-400" />
                            Etapa 03: Peso de Mil Sementes (Laboratório PMS)
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(p.dataHora).toLocaleString('pt-BR')}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1.5 border-t border-slate-800/60 text-slate-355">
                          <div>
                            <span className="text-slate-500 block text-[10px]">PMS Final Gravado:</span>
                            <span className="font-extrabold text-teal-400 text-sm font-mono">{p.pms} g</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Coeficiente Variação (CV%):</span>
                            <span className={`font-mono font-bold ${p.cv > 4 ? 'text-amber-400' : 'text-emerald-400'}`}>{p.cv}%</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Norma Amostragem:</span>
                            <span>{p.sementesPorReplica} sementes / rep.</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-slate-500 block text-[10px]">Pesos das 5 Replicatas:</span>
                            <span className="font-mono text-slate-300">[{p.replicas.join(' | ')} (g)]</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Responsável Analista:</span>
                            <span className="italic text-slate-300">{p.operador}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* GATE 4: GERMINATION BEDDING SHEETS */}
                  {matchingBeds.map((b, idx) => (
                    <div key={b.id} className="relative">
                      <span className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-emerald-400 border-4 border-slate-900" />

                      <div className="bg-slate-850 p-4 rounded-xl border border-slate-800">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                            <Sprout className="w-4 h-4 text-emerald-400" />
                            Etapa 04: Vigor Fisiológico em Canteiros
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(b.dataHora).toLocaleString('pt-BR')}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1.5 border-t border-slate-800/60 text-slate-355">
                          <div>
                            <span className="text-slate-500 block text-[10px]">Germinação de Estufa:</span>
                            <span className="font-extrabold text-emerald-400 text-sm font-mono">{b.germinaMedia}%</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Data de Semeadura/Leitura:</span>
                            <span className="font-mono text-slate-300">{b.dataSemeadura} a {b.dataContagem}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Norma Replicata:</span>
                            <span>{b.totalSementesPorReplica} sementes / canteiro</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-slate-500 block text-[10px]">Diagnóstico Clínico:</span>
                            <span className="text-slate-300 italic">"{b.observacoes}"</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Analista Agrônomo:</span>
                            <span className="italic text-slate-300">{b.operador}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* GATE 5: BATCH QUALITY CLOSING */}
                  {matchingClosing.map((c, idx) => (
                    <div key={c.id} className="relative">
                      {/* Approved checkmark marker marker */}
                      <span className={`absolute -left-[39px] -top-1 w-8 h-8 rounded-full border-4 border-slate-900 flex items-center justify-center ${
                        c.status === 'Aprovado' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                      }`}>
                        {c.status === 'Aprovado' ? '✓' : '✗'}
                      </span>

                      <div className={`p-5 rounded-2xl border ${
                        c.status === 'Aprovado' 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-slate-205' 
                          : 'bg-rose-500/10 border-rose-500/20 text-slate-205'
                      }`}>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
                            {c.status === 'Aprovado' ? (
                              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                            ) : (
                              <ShieldAlert className="w-5 h-5 text-rose-455 shrink-0" />
                            )}
                            Etapa Final: Emissão de Laudo Técnico Homologado
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(c.dataFechamento).toLocaleString('pt-BR')}
                          </span>
                        </div>

                        <p className="text-xs text-slate-200 bg-slate-950/40 p-3 rounded-xl border border-slate-800 my-2">
                          <strong>Veredito:</strong> {c.laudoFinal}
                        </p>

                        <div className="grid grid-cols-3 gap-2.5 text-[11px] pt-1 text-slate-400">
                          <span>Categoria: <strong className="text-white">{c.categoria}</strong></span>
                          <span>Comissionado por: <strong className="text-white">{c.responsavel}</strong></span>
                          <span>Status Geral: <strong className={c.status === 'Aprovado' ? 'text-emerald-400 font-bold' : 'text-rose-400'}>{c.status}</strong></span>
                        </div>
                      </div>
                    </div>
                  ))}

                </div>

              </div>

              {/* Right overview badge metrics */}
              <div className="lg:col-span-4 space-y-6">
                
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl text-xs space-y-4">
                  <h3 className="font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-800">
                    Filtros de Qualidade de Lote
                  </h3>

                  <div className="space-y-3">
                    
                    <div className="p-3 bg-slate-850 rounded-xl space-y-1">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Variedade Dominante</span>
                      <strong className="text-white text-sm">
                        {matchingDrying[0]?.cultivar || matchingClosing[0]?.cultivar || 'Desconhecida'}
                      </strong>
                    </div>

                    <div className="p-3 bg-slate-850 rounded-xl space-y-1">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Sementes em Lote</span>
                      <strong className="text-white text-sm font-mono">
                        {matchingDrying[0]?.loteId || query}
                      </strong>
                    </div>

                    <div className="p-3 bg-slate-850 rounded-xl space-y-1">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Resumo Germinação</span>
                      <strong className="text-emerald-450 font-mono text-sm text-emerald-400">
                        {matchingClosing[0]?.germina || matchingBeds[0]?.germinaMedia || 'Não cadastrada'}%
                      </strong>
                    </div>

                    <div className="p-3 bg-slate-850 rounded-xl space-y-1">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Resumo PMS</span>
                      <strong className="text-cyan-405 font-mono text-cyan-400 text-sm">
                        {matchingClosing[0]?.pms || matchingPMS[0]?.pms || 'Fração Não Definida'} g
                      </strong>
                    </div>

                  </div>

                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-850 leading-relaxed text-slate-400 text-[11px]">
                    🌾 <strong>Integridade de Rastreabilidade:</strong> Padrão oficial exigido para comércio interestadual e sementes do Mercosul. Os códigos de lotes cruzam-se entre setores para prevenir misturas mecânicas no porto de beneficiamento.
                  </div>

                </div>

              </div>

            </>
          )}

        </div>
      )}

    </div>
  );
}

// Simple placeholder for missing typing import
function ShieldCheck({ className }: { className?: string }) {
  return (
    <span className={`${className} bg-emerald-500 rounded-full w-4 h-4 inline-block text-white text-center text-[10px] font-bold`}>✓</span>
  );
}
