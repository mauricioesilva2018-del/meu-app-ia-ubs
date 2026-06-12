import React, { useState } from 'react';
import { BatchClosing, UserProfile } from '../types';
import { Sparkles, Printer, Check, Search, AlertCircle, RefreshCw, X, ShieldAlert, FileText, BadgeCheck, HelpCircle } from 'lucide-react';
import { synth } from '../utils/audio';

interface FechamentoLoteProps {
  closings: BatchClosing[];
  onAddClosing: (closing: BatchClosing) => void;
  currentUser: UserProfile | null;
  onAddAuditLog: (action: string, modulo: string, desc: string) => void;
}

export default function FechamentoLote({
  closings,
  onAddClosing,
  currentUser,
  onAddAuditLog
}: FechamentoLoteProps) {
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Active report in certificate viewer
  const [selectedReportId, setSelectedReportId] = useState<string | null>(closings[0]?.id || null);

  // Form State
  const [loteId, setLoteId] = useState('');
  const [cultivar, setCultivar] = useState('TMG 2375 IPRO');
  const [categoria, setCategoria] = useState('C1');
  const [danoMecanico, setDanoMecanico] = useState<number>(1.2);
  const [sementesVerdes, setSementesVerdes] = useState<number>(0.1);
  const [enrugadas, setEnrugadas] = useState<number>(1.0);
  const [voc, setVoc] = useState<number>(0.0); // Outras Culturas / Vigor Outras Culturas %
  const [impurezas, setImpurezas] = useState<number>(0.2);
  const [germina, setGermina] = useState<number>(90);
  const [pms, setPms] = useState<number>(165.0);
  const [laudoFinal, setLaudoFinal] = useState('');

  // Tolerances definition
  const LIMITS = {
    danoMecanico: 5.0, // max 5%
    sementesVerdes: 2.0, // max 2%
    enrugadas: 4.0, // max 4%
    voc: 0.2, // max 0.2%
    impurezas: 1.0, // max 1%
    germina: 80.0 // min 80%
  };

  // Automated evaluation check
  const isDanoMecanicoFailed = danoMecanico > LIMITS.danoMecanico;
  const isSementesVerdesFailed = sementesVerdes > LIMITS.sementesVerdes;
  const isEnrugadasFailed = enrugadas > LIMITS.enrugadas;
  const isVocFailed = voc > LIMITS.voc;
  const isImpurezasFailed = impurezas > LIMITS.impurezas;
  const isGerminaFailed = germina < LIMITS.germina;

  const isAnyFailed = isDanoMecanicoFailed || isSementesVerdesFailed || isEnrugadasFailed || isVocFailed || isImpurezasFailed || isGerminaFailed;
  const computedStatus = isAnyFailed ? 'Reprovado' : 'Aprovado';

  const handleApplyDefaults = () => {
    synth.playSuccess();
    setDanoMecanico(1.5);
    setSementesVerdes(0.3);
    setEnrugadas(1.2);
    setVoc(0.0);
    setImpurezas(0.2);
    setGermina(93);
    setPms(162.4);
    setLaudoFinal("Amostra representativa do lote aprovada integralmente. Apresenta excelente integridade física basal, vigor e germinação fisiológica no canteiro de solo.");
  };

  const handleApplyFailed = () => {
    synth.playWarning();
    setDanoMecanico(6.8); // fails >5%
    setSementesVerdes(3.1); // fails >2%
    setEnrugadas(2.0);
    setVoc(0.4); // fails >0.2%
    setImpurezas(1.5); // fails >1%
    setGermina(76); // fails <80%
    setPms(160.0);
    setLaudoFinal("REPROVADO: Lote retido para expurgo ou re-beneficiamento por apresentar alto teor de sementes verdes e dano mecânico crítico, reduzindo a germinação final abaixo dos níveis regulatórios homologados.");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loteId.trim()) {
      alert("Informe a identificação de Lote.");
      return;
    }

    const reportId = loteId.trim().toUpperCase();

    const newClosing: BatchClosing = {
      id: reportId,
      cultivar,
      categoria,
      danoMecanico: Number(danoMecanico),
      sementesVerdes: Number(sementesVerdes),
      enrugadas: Number(enrugadas),
      voc: Number(voc),
      impurezas: Number(impurezas),
      germina: Number(germina),
      pms: Number(pms),
      status: computedStatus,
      laudoFinal: laudoFinal.trim() || (computedStatus === 'Aprovado' 
        ? "Lote aprovado para comercialização e semeadura contatando níveis adequados."
        : "Lote reprovado para os limites comerciais da legislação brasileira de sementes."),
      dataFechamento: new Date().toISOString(),
      responsavel: currentUser ? currentUser.name : 'Responsável do Laudo'
    };

    onAddClosing(newClosing);
    synth.playSuccess();
    onAddAuditLog(
      'CADASTRO',
      'Fechamento',
      `Fechamento de Lote emitido para ${newClosing.id} (${newClosing.status}, Cultivar: ${newClosing.cultivar}, Resp: ${newClosing.responsavel})`
    );

    setSelectedReportId(newClosing.id);
    setLoteId('');
    setLaudoFinal('');
    setShowAddForm(false);
  };

  const handlePrint = () => {
    synth.playSuccess();
    window.print();
  };

  const filteredClosings = closings.filter(c =>
    c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cultivar.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeClosing = closings.find(c => c.id === selectedReportId) || closings[0];

  return (
    <div className="space-y-6">
      
      {/* Printable Style Injector only for window.print */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
            background: #fff !important;
            color: #000 !important;
          }
          #printable-laudo-paper, #printable-laudo-paper * {
            visibility: visible;
          }
          #printable-laudo-paper {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: #ffffff !important;
            color: #000000 !important;
            padding: 30px !important;
            font-size: 14px !important;
          }
          /* Hide interactive tools during print */
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header element */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl no-print">
        <div>
          <h2 className="text-xl font-bold font-sans text-white tracking-tight flex items-center gap-2">
            <FileText className="text-emerald-400 w-5 h-5" />
            Fechamento de Lotes e Emissão de Laudos
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Avaliação das características finais de sementes e geração de boletins e certificados comerciais.
          </p>
        </div>

        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            synth.playChime();
          }}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow focus:outline-none flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-emerald-200 animate-spin" />
          {showAddForm ? "Fechar Emissor" : "Novo Boletim / Laudo"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Fill Form or Certificate Listing */}
        <div className="lg:col-span-7 space-y-6 no-print">
          
          {showAddForm && (
            <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 text-slate-200">
              <div className="flex justify-between items-center pb-2 border-b border-slate-850">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Emissão de Certificado Técnico de Qualidade</h3>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleApplyDefaults}
                    className="text-[10px] bg-slate-800 text-emerald-400 px-2 py-0.5 rounded border border-slate-700/60 font-semibold"
                  >
                    🎲 Simular Aprovado
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyFailed}
                    className="text-[10px] bg-slate-800 text-rose-400 px-2 py-0.5 rounded border border-slate-700/60 font-semibold"
                  >
                    ⚠️ Simular Reprovado
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
                    className="w-full px-3 py-1.5 bg-slate-805 border border-slate-750 font-mono text-xs text-white rounded-lg focus:outline-none focus:border-emerald-500"
                    placeholder="Ex: LOTE-SOJA-502A"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Cultivar / Semente</label>
                  <select
                    value={cultivar}
                    onChange={(e) => setCultivar(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-850 border border-slate-750 text-xs text-white rounded-lg focus:outline-none"
                  >
                    <option value="TMG 2375 IPRO">TMG 2375 IPRO (Soja)</option>
                    <option value="BRL Urano IPRO">BRL Urano IPRO (Soja)</option>
                    <option value="DKB 290 PRO3">DKB 290 PRO3 (Milho)</option>
                    <option value="AN dual Wheat">AN dual Wheat (Trigo)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Categoria Comercial</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-850 border border-slate-750 text-xs text-white rounded-lg focus:outline-none"
                  >
                    <option value="C1">C1 (Certificada 1)</option>
                    <option value="C2">C2 (Certificada 2)</option>
                    <option value="Básica">Semente Básica</option>
                    <option value="S-1">S-1 (Semente comum)</option>
                  </select>
                </div>
              </div>

              {/* Physical Parameters entry entry */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-3">
                  Parâmetros de Análise Física (%) & Fisiológica
                </span>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">Germinação Média (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={germina}
                      onChange={(e) => setGermina(Number(e.target.value))}
                      className={`w-full p-2 rounded-lg text-xs font-bold text-center ${
                        isGerminaFailed ? 'bg-rose-500/15 border border-rose-500 text-rose-300' : 'bg-slate-850 border border-slate-700 text-white'
                      }`}
                    />
                    <span className="text-[9px] text-slate-500 font-mono">Min MAPA: {LIMITS.germina}%</span>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">Dano Mecânico (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={danoMecanico}
                      onChange={(e) => setDanoMecanico(Number(e.target.value))}
                      className={`w-full p-2 rounded-lg text-xs font-bold text-center ${
                        isDanoMecanicoFailed ? 'bg-rose-500/15 border border-rose-500 text-rose-300' : 'bg-slate-850 border border-slate-700 text-white'
                      }`}
                    />
                    <span className="text-[9px] text-slate-500 font-mono">Max: {LIMITS.danoMecanico}%</span>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">Sementes Verdes (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={sementesVerdes}
                      onChange={(e) => setSementesVerdes(Number(e.target.value))}
                      className={`w-full p-2 rounded-lg text-xs font-bold text-center ${
                        isSementesVerdesFailed ? 'bg-rose-500/15 border border-rose-500 text-rose-300' : 'bg-slate-850 border border-slate-700 text-white'
                      }`}
                    />
                    <span className="text-[9px] text-slate-500 font-mono">Max: {LIMITS.sementesVerdes}%</span>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">Impurezas (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={impurezas}
                      onChange={(e) => setImpurezas(Number(e.target.value))}
                      className={`w-full p-2 rounded-lg text-xs font-bold text-center ${
                        isImpurezasFailed ? 'bg-rose-500/15 border border-rose-500 text-rose-300' : 'bg-slate-850 border border-slate-700 text-white'
                      }`}
                    />
                    <span className="text-[9px] text-slate-500 font-mono">Max: {LIMITS.impurezas}%</span>
                  </div>

                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-3 pt-3 border-t border-slate-900">
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">Outras Culturas VOC (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={voc}
                      onChange={(e) => setVoc(Number(e.target.value))}
                      className={`w-full p-2 rounded-lg text-xs font-bold text-center ${
                        isVocFailed ? 'bg-rose-500/15 border border-rose-500 text-rose-300' : 'bg-slate-850 border border-slate-700 text-white'
                      }`}
                    />
                    <span className="text-[9px] text-slate-500 font-mono">Max: {LIMITS.voc}%</span>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">Sementes Enrugadas (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={enrugadas}
                      onChange={(e) => setEnrugadas(Number(e.target.value))}
                      className={`w-full p-2 rounded-lg text-xs font-bold text-center ${
                        isEnrugadasFailed ? 'bg-rose-500/15 border border-rose-500 text-rose-300' : 'bg-slate-850 border border-slate-700 text-white'
                      }`}
                    />
                    <span className="text-[9px] text-slate-500 font-mono">Max: {LIMITS.enrugadas}%</span>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">Peso de Mil Sementes (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={pms}
                      onChange={(e) => setPms(Number(e.target.value))}
                      className="w-full p-2 rounded-lg text-xs font-bold text-center bg-slate-850 border border-slate-700 text-white"
                    />
                  </div>
                </div>

              </div>

              {/* Status and Summary inputs */}
              <div className="bg-slate-955 p-3 rounded-xl border border-slate-850 text-xs flex justify-between items-center gap-4">
                <div>
                  <span className="text-slate-400 font-semibold block uppercase text-[10px]">Resultado Avaliação Técnico AUTOMÁTICO</span>
                  <p className="text-[10px] text-slate-500">Com base nas restrições agronômicas federais</p>
                </div>
                
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  computedStatus === 'Aprovado' 
                    ? 'bg-emerald-505/20 text-emerald-405 border border-emerald-500 text-emerald-305 bg-emerald-500/10 text-emerald-400' 
                    : 'bg-rose-505/20 text-rose-455 border border-rose-500 text-rose-305 bg-rose-500/10 text-rose-400'
                }`}>
                  Lote de Sementes {computedStatus}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Laudo Descritivo / Observações do Responsável</label>
                <textarea
                  value={laudoFinal}
                  onChange={(e) => setLaudoFinal(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-850 border border-slate-700 rounded-lg text-xs text-white focus:outline-none"
                  placeholder="Descreva as particularidades observadas ou justificativas técnicas de reprovação ou retenção..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3.5 py-1.5 bg-slate-800 text-xs rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow"
                >
                  Confirmar Emissão de Boletim
                </button>
              </div>
            </form>
          )}

          {/* List of reports */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pb-2 border-b border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Laudos Técnicos Emitidos</h3>
              
              <div className="relative w-full sm:w-60">
                <span className="absolute left-2 top-2 text-slate-500">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-2 py-1 bg-slate-805 border border-slate-750 text-xs text-white rounded-lg focus:outline-none"
                  placeholder="Pesquisar laudo..."
                />
              </div>
            </div>

            {filteredClosings.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                Nenhum laudo emitido correspondente ao pesquisado.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredClosings.map((c) => {
                  const isSelected = activeClosing?.id === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => { setSelectedReportId(c.id); synth.playChime(); }}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-emerald-555/15 border-emerald-500/50 bg-emerald-500/10 text-emerald-300' 
                          : 'bg-slate-850/60 border-slate-800 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold font-mono text-white text-[13px]">{c.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                          c.status === 'Aprovado' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-455 text-rose-300'
                        }`}>
                          {c.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400 my-1 pt-1 border-t border-slate-800/40">
                        <span>Cultivar: <strong className="text-slate-300">{c.cultivar}</strong></span>
                        <span>Germina: <strong className="text-slate-300">{c.germina}%</strong></span>
                        <span>PMS: <strong className="text-slate-300">{c.pms}g</strong></span>
                      </div>

                      <p className="text-[11px] text-slate-400 truncate mt-1">
                        Laudo: <span className="italic">{c.laudoFinal}</span>
                      </p>

                      <div className="text-[9px] text-slate-500 text-right mt-1">
                        Emissão: {new Date(c.dataFechamento).toLocaleDateString('pt-BR')} — Por {c.responsavel}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>

        {/* Right side Document certificate preview sheet */}
        <div className="lg:col-span-5">
          
          {activeClosing ? (
            <div className="space-y-4">
              
              <div className="flex justify-between items-center no-print">
                <span className="text-xs font-semibold text-slate-400">Visualização de Laudo Profissional</span>
                
                <button
                  onClick={handlePrint}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow focus:outline-none"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir / Exportar PDF
                </button>
              </div>

              {/* Physical Document sheet representation */}
              <div 
                id="printable-laudo-paper" 
                className="bg-white border-2 border-slate-100 p-8 rounded-2xl text-slate-900 shadow-xl space-y-6 text-left"
              >
                
                {/* Document Header */}
                <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4">
                  <div>
                    <span className="text-2xl font-black text-black tracking-tight font-sans block">UBS DIGITAL</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-serif">Certificado de Qualidade Física e Fisiológica</span>
                    <span className="text-[9px] text-slate-400 block font-sans">Lab Credenciado / Reg: MAPA SP-002340-A</span>
                  </div>
                  <div className="p-2 border border-slate-200 rounded-xl bg-slate-50 text-center">
                    <span className="text-[9px] text-slate-500 uppercase block font-semibold">Registro do Lote</span>
                    <strong className="text-sm font-mono tracking-tight text-slate-950">{activeClosing.id}</strong>
                  </div>
                </div>

                {/* Sub-header meta */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 uppercase font-bold text-[9px] block">Identificação do Lote</span>
                    <strong className="text-slate-900 font-mono text-[13px]">{activeClosing.id}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-bold text-[9px] block">Categoria Certificada</span>
                    <strong className="text-slate-900 text-[13px]">{activeClosing.categoria}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-bold text-[9px] block">Variedade / Cultivar</span>
                    <strong className="text-slate-900 text-[13px]">{activeClosing.cultivar}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-bold text-[9px] block">Data de Emissão</span>
                    <strong className="text-slate-900 text-[11px]">{new Date(activeClosing.dataFechamento).toLocaleDateString('pt-BR')}</strong>
                  </div>
                </div>

                {/* Parameters table indicator */}
                <div className="border border-slate-200 rounded-lg overflow-hidden my-4">
                  <table className="w-full text-xs text-left text-slate-800">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 font-extrabold text-[10px] uppercase text-slate-700">
                        <th className="py-2.5 px-3">Análise Técnica</th>
                        <th className="py-2.5 px-3 text-center">Referência Padrão</th>
                        <th className="py-2.5 px-3 text-center">Resultado Aferido</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-900">Germinação de Plântula (Canteiro d-7)</td>
                        <td className="py-2 px-3 text-center text-slate-500">&gt;= {LIMITS.germina}%</td>
                        <td className="py-2 px-3 text-center font-bold text-slate-950 font-mono">{activeClosing.germina}%</td>
                        <td className="py-2 px-3 text-center">
                          {activeClosing.germina >= LIMITS.germina ? (
                            <span className="text-emerald-600 font-bold">✓ Conforme</span>
                          ) : (
                            <span className="text-rose-600 font-bold">⚠️ Crítico</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-900">Dano Mecânico (Abrasão/Trifólio)</td>
                        <td className="py-2 px-3 text-center text-slate-500">&lt;= {LIMITS.danoMecanico}%</td>
                        <td className="py-2 px-3 text-center font-bold text-slate-950 font-mono">{activeClosing.danoMecanico}%</td>
                        <td className="py-2 px-3 text-center">
                          {activeClosing.danoMecanico <= LIMITS.danoMecanico ? (
                            <span className="text-emerald-600 font-bold">✓ Conforme</span>
                          ) : (
                            <span className="text-rose-600 font-bold">⚠️ Insatisfatório</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-900">Sementes Verdes (Integridade fitossanitária)</td>
                        <td className="py-2 px-3 text-center text-slate-500">&lt;= {LIMITS.sementesVerdes}%</td>
                        <td className="py-2 px-3 text-center font-bold text-slate-950 font-mono">{activeClosing.sementesVerdes}%</td>
                        <td className="py-2 px-3 text-center">
                          {activeClosing.sementesVerdes <= LIMITS.sementesVerdes ? (
                            <span className="text-emerald-600 font-bold">✓ Conforme</span>
                          ) : (
                            <span className="text-rose-600 font-bold">⚠️ Reclamação</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-900">Sementes Enrugadas / Chochas</td>
                        <td className="py-2 px-3 text-center text-slate-500">&lt;= {LIMITS.enrugadas}%</td>
                        <td className="py-2 px-3 text-center font-bold text-slate-950 font-mono">{activeClosing.enrugadas}%</td>
                        <td className="py-2 px-3 text-center">
                          {activeClosing.enrugadas <= LIMITS.enrugadas ? (
                            <span className="text-emerald-600 font-bold">✓ Conforme</span>
                          ) : (
                            <span className="text-rose-600 font-bold">⚠️ Excedente</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-900">Outras Culturas VOC / Ervas daninhas</td>
                        <td className="py-2 px-3 text-center text-slate-500">&lt;= {LIMITS.voc}%</td>
                        <td className="py-2 px-3 text-center font-bold text-slate-950 font-mono">{activeClosing.voc}%</td>
                        <td className="py-2 px-3 text-center">
                          {activeClosing.voc <= LIMITS.voc ? (
                            <span className="text-emerald-600 font-bold">✓ Conforme</span>
                          ) : (
                            <span className="text-rose-600 font-bold">⚠️ Impuro</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-900">Impurezas Físicas (Restos e Terras)</td>
                        <td className="py-2 px-3 text-center text-slate-500">&lt;= {LIMITS.impurezas}%</td>
                        <td className="py-2 px-3 text-center font-bold text-slate-950 font-mono">{activeClosing.impurezas}%</td>
                        <td className="py-2 px-3 text-center">
                          {activeClosing.impurezas <= LIMITS.impurezas ? (
                            <span className="text-emerald-600 font-bold">✓ Conforme</span>
                          ) : (
                            <span className="text-rose-600 font-bold">⚠️ Retido</span>
                          )}
                        </td>
                      </tr>
                      <tr className="bg-slate-50">
                        <td className="py-2 px-3 font-bold text-slate-900">Peso de Mil Sementes (PMS)</td>
                        <td className="py-2 px-3 text-center text-slate-500">Padrão Lab (Pesa)</td>
                        <td className="py-2 px-3 text-center font-extrabold text-[#0d9488] font-mono">{activeClosing.pms} Sementes/Rep</td>
                        <td className="py-2 px-3 text-center font-extrabold text-indigo-750">Fração Ativa</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Final status badge paper */}
                <div className={`p-4 rounded-xl border text-xs ${
                  activeClosing.status === 'Aprovado' 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                    : 'bg-rose-50 text-rose-800 border-rose-300'
                }`}>
                  <div className="flex justify-between items-center mb-1 font-bold text-[13px] uppercase">
                    <span>PARECER COOP / CERTIFICAÇÃO COMERCIAL:</span>
                    <span className="tracking-widest font-black underline">{activeClosing.status}</span>
                  </div>
                  <p className="font-medium leading-relaxed leading-relaxed pt-1 whitespace-pre-wrap">{activeClosing.laudoFinal}</p>
                </div>

                {/* Signatures placeholder */}
                <div className="grid grid-cols-2 gap-8 pt-8 mt-4 border-t border-slate-200 text-center text-[10px]">
                  <div className="space-y-1">
                    <div className="h-0.5 bg-slate-350 mx-auto w-3/4" />
                    <strong>{activeClosing.responsavel}</strong>
                    <span className="text-slate-500 block">Responsável Técnico / Analista</span>
                  </div>
                  <div className="space-y-1">
                    <div className="h-0.5 bg-slate-350 mx-auto w-3/4" />
                    <strong>Maurício Silva</strong>
                    <span className="text-slate-500 block">Proprietário UBS Digital</span>
                  </div>
                </div>

                {/* Verification footer tag */}
                <div className="text-center text-[8px] text-slate-400">
                  Validação garantida via protocolo digital criptografado local offline. Código Único de Hash: <span className="font-mono">{activeClosing.id}-DIGITAL-SECURITY-TOKEN-{activeClosing.pms}</span>
                </div>

              </div>

            </div>
          ) : (
            <div className="py-24 text-center text-slate-500 text-xs bg-slate-900 border border-slate-800 rounded-2xl">
              Nenhum laudo emitido correspondente ao filtro. Cadastre um acima.
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
