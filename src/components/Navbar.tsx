import { UserProfile, SyncQueueItem } from '../types';
import { Wifi, WifiOff, RefreshCw, AudioLines, Volume2, VolumeX, ShieldCheck, Database } from 'lucide-react';
import { synth } from '../utils/audio';

interface NavbarProps {
  currentUser: UserProfile | null;
  isOnline: boolean;
  onToggleOnline: () => void;
  syncQueue: SyncQueueItem[];
  onTriggerSync: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onSectionSelect: (section: string) => void;
  activeSection: string;
}

export default function Navbar({
  currentUser,
  isOnline,
  onToggleOnline,
  syncQueue,
  onTriggerSync,
  isMuted,
  onToggleMute,
  onSectionSelect,
  activeSection
}: NavbarProps) {
  
  const handleToggleMuted = () => {
    onToggleMute();
    if (isMuted) {
      synth.playSuccess();
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Painel Geral' },
    { id: 'secagem', label: 'Secagem Térmica' },
    { id: 'peso', label: 'Controle de Peso' },
    { id: 'pms', label: 'Peso Mil Sem. (PMS)' },
    { id: 'canteiro', label: 'Canteiro' },
    { id: 'fechamento', label: 'Fechamento e Laudo' },
    { id: 'rastreamento', label: 'Rastreamento' },
    { id: 'auditoria', label: 'Auditoria de Logs' },
    { id: 'login', label: '🔐 Voltar ao Login' },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Brand Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-900/40">
              <span className="font-mono text-xl font-black text-white">🌱</span>
            </div>
            <div>
              <span className="font-sans font-extrabold text-lg text-white tracking-tight flex items-center gap-1">
                UBS <span className="text-emerald-400 font-medium text-sm px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">DIGITAL</span>
              </span>
              <p className="text-[10px] text-slate-400 -mt-0.5">Sementes Tecnológicas de Qualidade</p>
            </div>
          </div>

          {/* Sincronismo & Configs Bar */}
          <div className="hidden md:flex items-center gap-4">
            
            {/* Audio Toggle */}
            <button
              onClick={handleToggleMuted}
              className={`p-2 rounded-lg border transition-all text-sm flex items-center justify-center gap-1.5 focus:outline-none ${
                isMuted
                  ? 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-300'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
              }`}
              title={isMuted ? "Ativar som de alertas" : "Mutar aplicativo"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Simulated Connection Segment */}
            <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-1.5">
              <span className="text-[10px] text-slate-400 font-mono">Conexão UBS:</span>
              <button
                onClick={onToggleOnline}
                className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full transition-all focus:outline-none ${
                  isOnline
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/35'
                }`}
              >
                {isOnline ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span>ONLINE</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
                    <span>CAMPANHA / OFFLINE</span>
                  </>
                )}
              </button>

              {/* Sync queue state */}
              {syncQueue.length > 0 && (
                <button
                  onClick={onTriggerSync}
                  className="flex items-center gap-1 text-[11px] font-bold bg-amber-500 text-slate-900 rounded-lg px-2 py-0.5 hover:bg-amber-400 transition-all focus:outline-none animate-pulse"
                  title="Sincronizar fila pendente com o servidor"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Sincronizar ({syncQueue.length})</span>
                </button>
              )}
            </div>

            {/* Offline-First Storage pill */}
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-800/40 border border-slate-700/40 rounded-lg px-2 py-1">
              <Database className="w-3 h-3 text-cyan-400" />
              <span>Offline-First (Ativo)</span>
            </div>

          </div>

          {/* User badge login section */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/40 rounded-xl px-3 py-1.5">
                <span className="text-xl">{currentUser.avatar || '👤'}</span>
                <div className="text-left">
                  <div className="text-xs font-bold text-white leading-3">{currentUser.name}</div>
                  <div className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                    <span className="uppercase tracking-wide font-mono">{currentUser.role}</span>
                  </div>
                </div>
                <button
                  onClick={() => onSectionSelect('login')}
                  className="ml-2 text-[10px] text-slate-400 hover:text-white underline font-semibold focus:outline-none bg-slate-700/40 px-1.5 py-0.5 rounded"
                >
                  Trocar
                </button>
              </div>
            ) : (
              <button
                onClick={() => onSectionSelect('login')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-all"
              >
                Simular Operador
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Navigation Sub-Tabs bar */}
      <nav className="bg-slate-950 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 overflow-x-auto scrollbar-none flex gap-1 h-12 items-center">
          {menuItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSectionSelect(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 focus:outline-none shrink-0 ${
                  isActive
                    ? 'bg-emerald-600 font-bold text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
