import React, { useState } from 'react';
import { SeedingBedLog, SeedingReplica, UserProfile } from '../types';
import { HelpCircle, Check, Info, Plus, Search, Layers, Flame, FileText, Sparkles } from 'lucide-react';
import { synth } from '../utils/audio';

interface PlantulasProps {
  beds: SeedingBedLog[];
  onAddBedLog: (log: SeedingBedLog) => void;
  currentUser: UserProfile | null;
  onAddAuditLog: (action: string, modulo: string, desc: string) => void;
}

export default function Plantulas({
  beds,
  onAddBedLog,
  currentUser,
  onAddAuditLog
}: PlantulasProps) {
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [loteId, setLoteId] = useState('');
  const [dataSemeadura, setDataSemeadura] = useState('2026-06-05');
  const [dataContagem, setDataContagem] = useState('2026-06-12');
  const [totalSementesPorReplica, setTotalSementesPorReplica] = useState<number>(50);
  const [observacoes, setObservacoes] = useState('');

  // 4 replicates
  const [rep1N, setRep1N] = useState<number>(47);
  const [rep1A, setRep1A] = useState<number>(2);
  const [rep1M, setRep1M] = useState<number>(1);

  const [rep2N, setRep2N] = useState<number>(46);
  const [rep2A, setRep2A] = useState<number>(3);
  const [rep2M, setRep2M] = useState<number>(1);

  const [rep3N, setRep3N] = useState<number>(48);
  const [rep3A, setRep3A] = useState<number>(1);
  const [rep3M, setRep3M] = useState<number>(1);

  const [rep4N, setRep4N] = useState<number>(47);
  const [rep4A, setRep4A] = useState<number>(2);
  const [rep4M, setRep4M] = useState<number>(1);

  // Compute stats on active inputs
  const sumNormal = rep1N + rep2N + rep3N + rep4N;
  const sumAbnormal = rep1A + rep2A + rep3A + rep4A;
  const sumDead = rep1M + rep2M + rep3M + rep4M;
  const sumTotalSementes = totalSementesPorReplica * 4;

  const dynamicGermina = sumTotalSementes > 0 
    ? parseFloat(((sumNormal / sumTotalSementes) * 100).toFixed(1)) 
    : 0;

  const handleApplySuperVigor = () => {
    synth.playSuccess();
    setTotalSementesPorReplica(50);
    setRep1N(49); setRep1A(1); setRep1M(0);
    setRep2N(48); setRep2A(2); setRep2M(0);
    setRep3N(49); setRep3A(0); setRep3M(1);
    setRep4N(50); setRep4A(0); setRep4M(0);
    setObservacoes("Germinação extremamente homogênea no canteiro. Plântulas eretas com folha cotiledonar livre de patógenos.");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loteId.trim()) {
      alert("Por favor, preencha a identificação de Lote.");
      return;
    }

    // Double check counts match total sementes
    const r1Sum = Number(rep1N) + Number(rep1A) + Number(rep1M);
    const r2Sum = Number(rep2N) + Number(rep2A) + Number(rep2M);
    const r3Sum = Number(rep3N) + Number(rep3A) + Number(rep3M);
    const r4Sum = Number(rep4N) + Number(rep4A) + Number(rep4M);

    if (r1Sum !== totalSementesPorReplica || r2Sum !== totalSementesPorReplica || r3Sum !== totalSementesPorReplica || r4Sum !== totalSementesPorReplica) {
      if (!confirm(`Importante: A soma das contagens individuais difere da sua definição de sementes por replicata (${totalSementesPorReplica}). Deseja gravar mesmo assim para efeito de simulação?`)) {
        return;
      }
    }

    const calculatedAvgNormal = parseFloat((((Number(rep1N) + Number(rep2N) + Number(rep3N) + Number(rep4N)) / (totalSementesPorReplica * 4)) * 100).toFixed(1));

    const targetReplicas: SeedingReplica[] = [
      { replicaId: 1, normais: Number(rep1N), anormais: Number(rep1A), mortas: Number(rep1M) },
      { replicaId: 2, normais: Number(rep2N), anormais: Number(rep2A), mortas: Number(rep2M) },
      { replicaId: 3, normais: Number(rep3N), anormais: Number(rep3A), mortas: Number(rep3M) },
      { replicaId: 4, normais: Number(rep4N), anormais: Number(rep4A), mortas: Number(rep4M) }
    ];

    const newLog: SeedingBedLog = {
      id: `bed-${Date.now()}`,
      loteId: loteId.trim().toUpperCase(),
      dataSemeadura,
      dataContagem,
      replicas: targetReplicas,
      totalSementesPorReplica,
      germinaMedia: calculatedAvgNormal,
      vigorMedio: calculatedAvgNormal, // aligned simplified vigor tracking
      observacoes: observacoes.trim() || 'Ficha de canteiro arquivada com sucesso.',
      dataHora: new Date().toISOString(),
      operador: currentUser ? currentUser.name : 'Avalidador Canteiro'
    };

    onAddBedLog(newLog);
    synth.playSuccess();
    onAddAuditLog(
      'CADASTRO',
      'Canteiro',
      `Ficha de canteiro gravada para lote ${newLog.loteId} (Germinação Média: ${newLog.germinaMedia}%)`
    );

    setLoteId('');
    setObservacoes('');
    setShowAddForm(false);
  };

  const filteredBeds = beds.filter(log =>
    log.loteId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.operador.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header sections */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold font-sans text-white tracking-tight flex items-center gap-2">
            <Layers className="text-emerald-400 w-5 h-5" />
            Ficha de Plântulas (Controle de Canteiro)
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Espelho laboratorial de simulação em canteiro de areia/terra avaliando percentual de força e germinação real.
          </p>
        </div>
        
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            synth.playChime();
          }}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow"
        >
          {showAddForm ? "Esconder Formulário" : "Registrar Novo Canteiro"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Form/Entries Area */}
        <div className="lg:col-span-2 space-y-6">
          
          {showAddForm && (
            <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Nova Contagem Fisiológica - 4 Sub-amostras</h3>
                <button
                  type="button"
                  onClick={handleApplySuperVigor}
                  className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold"
                >
                  🌱 Simular Vigor Excelente
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Identificação Lote *</label>
                  <input
                    type="text"
                    required
                    value={loteId}
                    onChange={(e) => setLoteId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-805 border border-slate-750 font-mono text-xs text-white rounded-lg focus:outline-none"
                    placeholder="LOTE-SOJA-502A"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Sementes / Replicata</label>
                  <select
                    value={totalSementesPorReplica}
                    onChange={(e) => setTotalSementesPorReplica(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-805 border border-slate-750 text-xs text-white rounded-lg"
                  >
                    <option value={50}>50 sementes por rep.</option>
                    <option value={100}>100 sementes por rep.</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Data de Semeadura</label>
                  <input
                    type="date"
                    required
                    value={dataSemeadura}
                    onChange={(e) => setDataSemeadura(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-805 border border-slate-755 text-xs text-white rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Data de Avaliação (Contagem)</label>
                  <input
                    type="date"
                    required
                    value={dataContagem}
                    onChange={(e) => setDataContagem(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-805 border border-slate-755 text-xs text-white rounded-lg"
                  />
                </div>
              </div>

              {/* Grid 4 replicates entry entry */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-4">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Amostragem Canteiro - Plântulas Normais, Anormais e Mortas
                </span>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  
                  {/* Rep 1 */}
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2">
                    <span className="text-[11px] font-bold text-white block pb-1 border-b border-slate-800">Sub-Amostra 1</span>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-emerald-400 font-medium">Normais:</span>
                        <input type="number" value={rep1N} onChange={(e) => setRep1N(Number(e.target.value))} className="w-12 bg-slate-800 text-center font-bold px-1 rounded text-white" />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-amber-400 font-medium font-medium">Anormais:</span>
                        <input type="number" value={rep1A} onChange={(e) => setRep1A(Number(e.target.value))} className="w-12 bg-slate-800 text-center px-1 rounded text-white" />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-rose-450 text-rose-400">Mortas:</span>
                        <input type="number" value={rep1M} onChange={(e) => setRep1M(Number(e.target.value))} className="w-12 bg-slate-800 text-center px-1 rounded text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Rep 2 */}
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2">
                    <span className="text-[11px] font-bold text-white block pb-1 border-b border-slate-800">Sub-Amostra 2</span>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-emerald-400 font-medium font-medium">Normais:</span>
                        <input type="number" value={rep2N} onChange={(e) => setRep2N(Number(e.target.value))} className="w-12 bg-slate-800 text-center font-bold px-1 rounded text-white" />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-amber-400 font-medium font-medium">Anormais:</span>
                        <input type="number" value={rep2A} onChange={(e) => setRep2A(Number(e.target.value))} className="w-12 bg-slate-800 text-center px-1 rounded text-white" />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-rose-450 text-rose-400">Mortas:</span>
                        <input type="number" value={rep2M} onChange={(e) => setRep2M(Number(e.target.value))} className="w-12 bg-slate-800 text-center px-1 rounded text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Rep 3 */}
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2">
                    <span className="text-[11px] font-bold text-white block pb-1 border-b border-slate-800">Sub-Amostra 3</span>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-emerald-400 font-medium">Normais:</span>
                        <input type="number" value={rep3N} onChange={(e) => setRep3N(Number(e.target.value))} className="w-12 bg-slate-800 text-center font-bold px-1 rounded text-white" />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-amber-400 font-medium">Anormais:</span>
                        <input type="number" value={rep3A} onChange={(e) => setRep3A(Number(e.target.value))} className="w-12 bg-slate-800 text-center px-1 rounded text-white" />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-rose-450 text-rose-400">Mortas:</span>
                        <input type="number" value={rep3M} onChange={(e) => setRep3M(Number(e.target.value))} className="w-12 bg-slate-800 text-center px-1 rounded text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Rep 4 */}
                  <div className="bg-slate-900 p-4 p-3 rounded-lg border border-slate-800 space-y-2">
                    <span className="text-[11px] font-bold text-white block pb-1 border-b border-slate-800">Sub-Amostra 4</span>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-emerald-400 font-medium">Normais:</span>
                        <input type="number" value={rep4N} onChange={(e) => setRep4N(Number(e.target.value))} className="w-12 bg-slate-800 text-center font-bold px-1 rounded text-white" />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-amber-400 font-medium">Anormais:</span>
                        <input type="number" value={rep4A} onChange={(e) => setRep4A(Number(e.target.value))} className="w-12 bg-slate-800 text-center px-1 rounded text-white" />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-rose-450 text-rose-400">Mortas:</span>
                        <input type="number" value={rep4M} onChange={(e) => setRep4M(Number(e.target.value))} className="w-12 bg-slate-800 text-center px-1 rounded text-white" />
                      </div>
                    </div>
                  </div>

                </div>

                {/* Live review outcomes */}
                <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-slate-900 text-xs text-center font-semibold text-slate-400">
                  <div className="bg-slate-900/60 p-2 rounded-lg">
                    <span>Normais Totais: <strong className="text-emerald-400 text-sm block mt-0.5">{sumNormal}</strong></span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-lg">
                    <span>Anomalias Totais: <strong className="text-amber-400 text-sm block mt-0.5">{sumAbnormal}</strong></span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-lg">
                    <span>Mortas Totais: <strong className="text-rose-400 text-sm block mt-0.5">{sumDead}</strong></span>
                  </div>
                </div>

                <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-lg text-center">
                  <span className="text-xs uppercase tracking-wider font-semibold text-slate-350 block">Germinação Média Calculada (Vigor Canteiro):</span>
                  <strong className="text-xl text-emerald-400 font-mono font-extrabold">{dynamicGermina}%</strong>
                </div>

              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 font-medium">Observações Qualitativas do Desenvolvimento</label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-805 border border-slate-750 text-xs text-white rounded-lg focus:outline-none"
                  placeholder="Ex: Velocidade de emergência excelente, ausência de sintomas de queima em cotilédones..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowAddForm(false)} className="px-3 py-1.5 bg-slate-800 text-xs rounded">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded hover:shadow">Gravar Ficha</button>
              </div>
            </form>
          )}

          {/* Table index list */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pb-2 border-b border-slate-800">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">Controles de Canteiro Arquivados</h3>
              
              <div className="relative w-full sm:w-60">
                <span className="absolute left-2.5 top-2 text-slate-500">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-2 py-1 bg-slate-805 border border-slate-750 text-xs text-white rounded-lg"
                  placeholder="Pesquisar lote..."
                />
              </div>
            </div>

            {filteredBeds.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                Nenhuma ficha técnica registrada para esta seleção de busca.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                      <th className="py-2 px-3">Lote</th>
                      <th className="py-2 px-3">Julgamento</th>
                      <th className="py-2 px-3 text-center">Germinação (Média)</th>
                      <th className="py-2 px-3 text-center">Sub-amostras (Normais)</th>
                      <th className="py-2 px-3">Semeadura</th>
                      <th className="py-2 px-3">Leitura</th>
                      <th className="py-2 px-3 text-right">Analista</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-slate-300">
                    {filteredBeds.map((log) => {
                      const totalNormal = log.replicas.reduce((a, b) => a + b.normais, 0);
                      const totalSementes = log.totalSementesPorReplica * log.replicas.length;
                      return (
                        <tr key={log.id} className="hover:bg-slate-850">
                          <td className="py-3 px-3 font-bold text-white font-mono">{log.loteId}</td>
                          <td className="py-2 px-3 max-w-xs truncate text-slate-400 italic">
                            {log.observacoes}
                          </td>
                          <td className="py-2 px-3 text-center font-mono font-bold text-emerald-400 text-sm">
                            {log.germinaMedia}%
                          </td>
                          <td className="py-2 px-3 text-center font-mono text-slate-400">
                            [{log.replicas.map(r => r.normais).join(' | ')}] / {log.totalSementesPorReplica}
                          </td>
                          <td className="py-2 px-3 text-slate-400 font-mono">{log.dataSemeadura}</td>
                          <td className="py-2 px-3 text-slate-400 font-mono">{log.dataContagem}</td>
                          <td className="py-2 px-3 text-slate-400 text-[11px] text-right italic">{log.operador}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

          </div>

        </div>

        {/* Right Info Card */}
        <div className="lg:col-span-1">
          
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl text-slate-250 sticky top-20 text-xs space-y-4">
            
            <div className="pb-3 border-b border-slate-800">
              <span className="font-extrabold text-white uppercase tracking-wider block">Regulamentação Técnica (Canteiro)</span>
              <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">Certificação Oficial (Instrução Normativa)</p>
            </div>

            <div className="bg-slate-850 p-3 rounded-xl space-y-2">
              <div className="flex gap-2 text-slate-300">
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span>O teste de canteiro em solo/areia atua como parâmetro de controle de fidelidade à viabilidade fisiológica comercial.</span>
              </div>
              <div className="flex gap-2 text-slate-300">
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span>Exigem-se idealmente 4 replicatas idênticas de 50 ou 100 sementes limpas para equilibrar os erros de micro-irrigação e temperatura estufa.</span>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl space-y-1 font-mono text-[11px]">
              <span className="text-[10px] text-slate-400 block font-sans font-bold uppercase uppercase">Parâmetros Esperados (Média):</span>
              <div className="flex justify-between">
                <span>Soja Superior:</span>
                <strong className="text-emerald-400 font-semibold">&gt;= 85.0%</strong>
              </div>
              <div className="flex justify-between">
                <span>Milho Híbrido:</span>
                <strong className="text-emerald-400 font-semibold">&gt;= 85.0%</strong>
              </div>
              <div className="flex justify-between col-span-2">
                <span>Trigo Pão:</span>
                <strong className="text-emerald-400 font-semibold">&gt;= 80.0%</strong>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 text-balance">
              Para sementes sensíveis, o vigor é estimado pela % de plântulas normais na primeira contagem (Day 4 para soja). A germinação final é dada pela contagem do Day 7 ou Day 8.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}
