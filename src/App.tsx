import React, { useState, useEffect } from 'react';
import { 
  UserProfile, DryingLog, SackWeightLog, PMSLog, 
  BatchClosing, SeedingBedLog, AuditLog, SyncQueueItem 
} from './types';
import { 
  INITIAL_DRYING_LOGS, INITIAL_SACK_WEIGHTS, INITIAL_PMS_LOGS, 
  INITIAL_BATCH_CLOSINGS, INITIAL_SEEDING_BEDS, INITIAL_AUDIT_LOGS 
} from './utils/mockData';
import { synth } from './utils/audio';

// Subcomponents imports
import Navbar from './components/Navbar';
import Login, { SIMULATED_USERS } from './components/Login';
import Dashboard from './components/Dashboard';
import Secagem from './components/Secagem';
import ControlePeso from './components/ControlePeso';
import PMSCalculator from './components/PMSCalculator';
import Plantulas from './components/Plantulas';
import FechamentoLote from './components/FechamentoLote';
import Rastreamento from './components/Rastreamento';
import AuditLogs from './components/AuditLogs';

import { ShieldCheck, Wifi, WifiOff, AlertTriangle, Info, RefreshCw } from 'lucide-react';

export default function App() {
  
  // App system states
  const [activeSection, setActiveSection] = useState<string>('dashboard');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(SIMULATED_USERS[0]); // default Maurício Silva (Administrador)
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);

  // Database States
  const [dryingLogs, setDryingLogs] = useState<DryingLog[]>([]);
  const [sackWeights, setSackWeights] = useState<SackWeightLog[]>([]);
  const [pmsLogs, setPMSLogs] = useState<PMSLog[]>([]);
  const [closings, setClosings] = useState<BatchClosing[]>([]);
  const [beds, setBeds] = useState<SeedingBedLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Sincronization alert banner
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Initialize from LocalStorage or mock mock default values
  useEffect(() => {
    // 1. Current user session
    const storedUser = localStorage.getItem('ubs_current_user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        setCurrentUser(SIMULATED_USERS[0]);
      }
    } else {
      // Set default Maurício Silva ADMIN
      localStorage.setItem('ubs_current_user', JSON.stringify(SIMULATED_USERS[0]));
    }

    // 2. Storage databases
    const storedDrying = localStorage.getItem('ubs_db_drying');
    if (storedDrying) {
      setDryingLogs(JSON.parse(storedDrying));
    } else {
      setDryingLogs(INITIAL_DRYING_LOGS);
      localStorage.setItem('ubs_db_drying', JSON.stringify(INITIAL_DRYING_LOGS));
    }

    const storedWeights = localStorage.getItem('ubs_db_weights');
    if (storedWeights) {
      setSackWeights(JSON.parse(storedWeights));
    } else {
      setSackWeights(INITIAL_SACK_WEIGHTS);
      localStorage.setItem('ubs_db_weights', JSON.stringify(INITIAL_SACK_WEIGHTS));
    }

    const storedPMS = localStorage.getItem('ubs_db_pms');
    if (storedPMS) {
      setPMSLogs(JSON.parse(storedPMS));
    } else {
      setPMSLogs(INITIAL_PMS_LOGS);
      localStorage.setItem('ubs_db_pms', JSON.stringify(INITIAL_PMS_LOGS));
    }

    const storedClosings = localStorage.getItem('ubs_db_closings');
    if (storedClosings) {
      setClosings(JSON.parse(storedClosings));
    } else {
      setClosings(INITIAL_BATCH_CLOSINGS);
      localStorage.setItem('ubs_db_closings', JSON.stringify(INITIAL_BATCH_CLOSINGS));
    }

    const storedBeds = localStorage.getItem('ubs_db_beds');
    if (storedBeds) {
      setBeds(JSON.parse(storedBeds));
    } else {
      setBeds(INITIAL_SEEDING_BEDS);
      localStorage.setItem('ubs_db_beds', JSON.stringify(INITIAL_SEEDING_BEDS));
    }

    const storedAuditing = localStorage.getItem('ubs_db_auditing');
    if (storedAuditing) {
      setAuditLogs(JSON.parse(storedAuditing));
    } else {
      setAuditLogs(INITIAL_AUDIT_LOGS);
      localStorage.setItem('ubs_db_auditing', JSON.stringify(INITIAL_AUDIT_LOGS));
    }

    // 3. Sync Queue
    const storedQueue = localStorage.getItem('ubs_sync_queue');
    if (storedQueue) {
      setSyncQueue(JSON.parse(storedQueue));
    }
  }, []);

  // Sync state mutation changes helper triggers to LocalStorage
  const writeDrying = (updated: DryingLog[]) => {
    setDryingLogs(updated);
    localStorage.setItem('ubs_db_drying', JSON.stringify(updated));
  };
  const writeSackWeights = (updated: SackWeightLog[]) => {
    setSackWeights(updated);
    localStorage.setItem('ubs_db_weights', JSON.stringify(updated));
  };
  const writePMS = (updated: PMSLog[]) => {
    setPMSLogs(updated);
    localStorage.setItem('ubs_db_pms', JSON.stringify(updated));
  };
  const writeClosings = (updated: BatchClosing[]) => {
    setClosings(updated);
    localStorage.setItem('ubs_db_closings', JSON.stringify(updated));
  };
  const writeBeds = (updated: SeedingBedLog[]) => {
    setBeds(updated);
    localStorage.setItem('ubs_db_beds', JSON.stringify(updated));
  };
  const writeAudit = (updated: AuditLog[]) => {
    setAuditLogs(updated);
    localStorage.setItem('ubs_db_auditing', JSON.stringify(updated));
  };
  const writeSyncQueue = (updated: SyncQueueItem[]) => {
    setSyncQueue(updated);
    localStorage.setItem('ubs_sync_queue', JSON.stringify(updated));
  };

  // Login handler
  const handleLoginSuccess = (user: UserProfile | null) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem('ubs_current_user', JSON.stringify(user));
      addAuditLogDirectly('LOGIN', 'Segurança', `Colaborador autenticado com sucesso: ${user.name} (${user.role})`);
    } else {
      localStorage.removeItem('ubs_current_user');
      addAuditLogDirectly('LOGIN', 'Segurança', `Colaborador desconectou da sessão técnica.`);
    }
  };

  // Auditing logger helper
  const addAuditLogDirectly = (
    acao: 'CADASTRO' | 'ALTERACAO' | 'EXCLUSAO' | 'SINCRONIZACAO' | 'LOGIN' | 'ALERTA',
    modulo: 'Secagem' | 'Pesagem' | 'PMS' | 'Fechamento' | 'Canteiro' | 'Segurança' | 'Sistema',
    descricao: string
  ) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      acao,
      modulo,
      descricao,
      usuario: currentUser ? currentUser.email : 'External Web-Sensor',
      dataHora: new Date().toISOString()
    };
    writeAudit([newLog, ...auditLogs]);
  };

  // Offline-First Outbound write handler
  const handleAddNewWrite = (
    store: 'drying' | 'sackWeight' | 'pms' | 'batchClosing' | 'seedingBed',
    payload: any,
    directSaver: (pay: any) => void
  ) => {
    // Apply write immediately to local memory (Offline-First core paradigm!)
    directSaver(payload);

    if (!isOnline) {
      // Append to outbox sync queue
      const queueItem: SyncQueueItem = {
        id: `sync-${Date.now()}-${Math.floor(Math.random() * 100)}`,
        action: 'create',
        store,
        payload,
        timestamp: new Date().toISOString()
      };
      const updatedQueue = [...syncQueue, queueItem];
      writeSyncQueue(updatedQueue);
      
      addAuditLogDirectly('CADASTRO', 'Sistema', `Operação adicionada em Fila Offline (${store.toUpperCase()}: ${payload.loteId || payload.id})`);
    }
  };

  // Network offline simulator toggle
  const handleToggleOnline = () => {
    const targetState = !isOnline;
    setIsOnline(targetState);
    if (!isMuted) {
      if (targetState) {
        synth.playSuccess();
      } else {
        synth.playWarning();
      }
    }

    if (targetState) {
      // Auto triggers sync when going online!
      setTimeout(() => {
        processPendingSyncQueue();
      }, 500);
    } else {
      addAuditLogDirectly('ALERTA', 'Sistema', 'Conectividade com banco de dados em nuvem suspensa pelo operador. UBS Operando no modo Campanhas de Campo Offline.');
    }
  };

  // Processes the accumulated synchronization queue
  const processPendingSyncQueue = () => {
    const queueLen = syncQueue.length;
    if (queueLen === 0) return;

    // Simulate processing delay which looks outstanding
    const processedDrying = [...dryingLogs];
    const processedSacks = [...sackWeights];
    const processedPMS = [...pmsLogs];
    const processedClosings = [...closings];
    const processedBeds = [...beds];

    syncQueue.forEach((item) => {
      // Because we already updated local states during offline-first write, we simulate cloud receipt
      console.log("Syncing offline item to master database server:", item);
    });

    // Reset outbound queue, play chime
    if (!isMuted) synth.playSuccess();
    writeSyncQueue([]);

    // Document sync audit
    const syncLog: AuditLog = {
      id: `log-${Date.now()}`,
      acao: 'SINCRONIZACAO',
      modulo: 'Sistema',
      descricao: `SINCRONISMO AGILIZADO: ${queueLen} registros gerados em modo offline-field integrados à nuvem matriz de Maurício Silva.`,
      usuario: currentUser ? currentUser.email : 'Central UBS',
      dataHora: new Date().toISOString()
    };
    writeAudit([syncLog, ...auditLogs]);

    setSyncMessage(`Sucesso! ${queueLen} registros acumulados no campo foram sincronizados com segurança.`);
    setTimeout(() => setSyncMessage(null), 5000);
  };

  // Role permissions checking helper
  const isSupervisorOrAdmin = currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'GERENTE' || currentUser.role === 'SUPERVISOR');
  const isAdmin = currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'GERENTE');

  // Render proper screen segment
  const renderContainerSection = () => {
    switch (activeSection) {
      
      case 'login':
        return (
          <Login 
            onLoginSuccess={handleLoginSuccess}
            currentUser={currentUser}
          />
        );

      case 'dashboard':
        return (
          <Dashboard
            dryingLogs={dryingLogs}
            sackWeights={sackWeights}
            pmsLogs={pmsLogs}
            closings={closings}
            beds={beds}
            auditLogs={auditLogs}
            currentUser={currentUser}
            onAddDryingLog={(log) => {
              handleAddNewWrite('drying', log, (item) => {
                const updated = [item, ...dryingLogs];
                writeDrying(updated);
              });
            }}
            onAddSackWeightLog={(log) => {
              handleAddNewWrite('sackWeight', log, (item) => {
                const updated = [item, ...sackWeights];
                writeSackWeights(updated);
              });
            }}
            onAddAuditLog={(act, mod, desc) => {
              const newLog: AuditLog = {
                id: `log-${Date.now()}`,
                acao: act,
                modulo: mod,
                descricao: desc,
                usuario: currentUser ? currentUser.email : 'External Web-Sensor',
                dataHora: new Date().toISOString()
              };
              writeAudit([newLog, ...auditLogs]);
            }}
          />
        );

      case 'secagem':
        return (
          <Secagem
            dryingLogs={dryingLogs}
            onAddDryingLog={(log) => {
              handleAddNewWrite('drying', log, (item) => {
                const updated = [item, ...dryingLogs];
                writeDrying(updated);
              });
            }}
            onUpdateDryingLog={(updatedLog) => {
              const updated = dryingLogs.map(log => log.id === updatedLog.id ? updatedLog : log);
              writeDrying(updated);
              addAuditLogDirectly('ALTERACAO', 'Secagem', `Registro de secagem do lote ${updatedLog.loteId} (Moega: ${updatedLog.moega}) editado.`);
            }}
            onDeleteDryingLog={(id) => {
              const deletedLog = dryingLogs.find(l => l.id === id);
              const updated = dryingLogs.filter(log => log.id !== id);
              writeDrying(updated);
              if (deletedLog) {
                addAuditLogDirectly('EXCLUSAO', 'Secagem', `Registro de secagem do lote ${deletedLog.loteId} excluído.`);
              }
            }}
            currentUser={currentUser}
            onAddAuditLog={addAuditLogDirectly}
          />
        );

      case 'peso':
        return (
          <ControlePeso
            sackWeights={sackWeights}
            onAddSackWeightLog={(log) => {
              handleAddNewWrite('sackWeight', log, (item) => {
                const updated = [item, ...sackWeights];
                writeSackWeights(updated);
              });
            }}
            currentUser={currentUser}
            onAddAuditLog={addAuditLogDirectly}
          />
        );

      case 'pms':
        return (
          <div className="space-y-4">
            {!isSupervisorOrAdmin && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  🛡️ <strong>Acesso Limitado:</strong> Seu perfil de <strong>OPERADOR</strong> permite apenas a visualização de testes PMS. Contagens laboratoriais requerem assinaturas de Clara Santos (Supervisor), Carlos Mendes (Gerente) ou Maurício Silva (Administrador).
                </span>
              </div>
            )}
            <PMSCalculator
              pmsLogs={pmsLogs}
              onAddPMSLog={(log) => {
                if (!isSupervisorOrAdmin) {
                  alert("Permissão negada. Apenas Supervisor, Gerente ou Administrador pode cadastrar Peso de Mil Sementes (PMS).");
                  return;
                }
                handleAddNewWrite('pms', log, (item) => {
                  const updated = [item, ...pmsLogs];
                  writePMS(updated);
                });
              }}
              currentUser={currentUser}
              onAddAuditLog={addAuditLogDirectly}
            />
          </div>
        );

      case 'canteiro':
        return (
          <div className="space-y-4">
            {!isSupervisorOrAdmin && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  🛡️ <strong>Acesso Restrito:</strong> Visualizando fichas de germinação. Conectar contagens novas requer perfil Supervisor, Gerente ou Administrador.
                </span>
              </div>
            )}
            <Plantulas
              beds={beds}
              onAddBedLog={(log) => {
                if (!isSupervisorOrAdmin) {
                  alert("Permissão negada. Apenas Supervisor, Gerente ou Administrador pode registrar contagens de canteiro.");
                  return;
                }
                handleAddNewWrite('seedingBed', log, (item) => {
                  const updated = [item, ...beds];
                  writeBeds(updated);
                });
              }}
              currentUser={currentUser}
              onAddAuditLog={addAuditLogDirectly}
            />
          </div>
        );

      case 'fechamento':
        return (
          <div className="space-y-4">
            {!isSupervisorOrAdmin && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  🛡️ <strong>Bloqueado para operador:</strong> A emissão técnica de laudos e boletins finais homologados exige credenciais de faturamento ou análise agronômica (Supervisor/Gerente/Administrador).
                </span>
              </div>
            )}
            <FechamentoLote
              closings={closings}
              onAddClosing={(closing) => {
                if (!isSupervisorOrAdmin) {
                  alert("Não permitido. Apenas Supervisor, Gerente ou Administrador pode comissionar laudos de fechamento.");
                  return;
                }
                handleAddNewWrite('batchClosing', closing, (item) => {
                  const updated = [item, ...closings];
                  writeClosings(updated);
                });
              }}
              currentUser={currentUser}
              onAddAuditLog={addAuditLogDirectly}
            />
          </div>
        );

      case 'rastreamento':
        return (
          <Rastreamento
            dryingLogs={dryingLogs}
            sackWeights={sackWeights}
            pmsLogs={pmsLogs}
            closings={closings}
            beds={beds}
          />
        );

      case 'auditoria':
        return (
          <div className="space-y-4">
            {!isAdmin && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-450 shrink-0" />
                <span>
                  🛡️ <strong>Alerta de Compliance:</strong> Seu perfil não é Gerente ou Administrador. A limpeza de históricos de logs de auditoria de segurança requer credenciais proprietárias corporativas qualificados.
                </span>
              </div>
            )}
            <AuditLogs
              auditLogs={auditLogs}
              onClearLogs={() => {
                if (!isAdmin) {
                  alert("Permissão negada. Apenas Carlos Mendes (Gerente) ou Maurício Silva (Administrador) pode limpar logs de auditoria.");
                  return;
                }
                writeAudit([]);
                addAuditLogDirectly('EXCLUSAO', 'Segurança', 'Histórico completo de logs apagado pelo Administrador.');
              }}
            />
          </div>
        );

      default:
        return <div className="text-white">Seção não encontrada</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      
      {/* Dynamic Navbar */}
      <Navbar
        currentUser={currentUser}
        isOnline={isOnline}
        onToggleOnline={handleToggleOnline}
        syncQueue={syncQueue}
        onTriggerSync={processPendingSyncQueue}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(!isMuted)}
        onSectionSelect={(sec) => {
          setActiveSection(sec);
          synth.playChime();
        }}
        activeSection={activeSection}
      />

      {/* Online/Offline general notice notices */}
      {!isOnline && (
        <div className="bg-rose-950/90 border-b border-rose-800/60 p-2.5 text-center text-xs font-semibold text-rose-300 flex items-center justify-center gap-2 no-print">
          <WifiOff className="w-4 h-4 text-rose-400 animate-bounce" />
          <span>SINAL INSTÁVEL NO CAMPO: Modo Offline Ativo. Leituras e contagens salvas localmente e sincronização pendente.</span>
        </div>
      )}

      {/* Notification banner synchronization success */}
      {syncMessage && (
        <div className="bg-emerald-950/90 border-b border-emerald-800 p-2.5 text-center text-xs font-bold text-emerald-400 flex items-center justify-center gap-2 animate-pulse no-print">
          <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* Main Page Layout Wrapper */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Role identification top info bar bar of the active section */}
        {currentUser && (
          <div className="bg-[#1e293b]/70 border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs flex justify-between items-center no-print">
            <span className="text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Conectado como <strong className="text-white font-bold">{currentUser.name}</strong></span>
            </span>
            <span className="text-[10px] text-slate-400">
              Acesso nivelado: <strong className="text-emerald-400 font-mono italic">{currentUser.role} PIN</strong>
            </span>
          </div>
        )}

        {/* Dynamic section injection */}
        {renderContainerSection()}

      </main>

      {/* Footer segment */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 mt-12 text-center text-xs text-slate-500 no-print">
        <p>© 2026 UBS Digital — Sistema de Qualidade Homologado.</p>
        <p className="mt-1 text-[10px] text-slate-600">Desenvolvido com foco em alta taxa de germinação do plantio rural e estabilidade Offline-First.</p>
      </footer>

    </div>
  );
}
