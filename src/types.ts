export type UserRole = 'ADMIN' | 'SUPERVISOR' | 'OPERADOR';

export interface UserProfile {
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export interface DryingLog {
  id: string;
  loteId: string;
  moega: string;
  cultivar: string;
  tempEntrada: number; // °C
  tempSaida: number; // °C
  umidade: number; // %
  tempMassa: number; // °C
  tempoDescarga: string; // "00:00" format or minutes
  dataHora: string;
  operador: string;
}

export interface SackWeightLog {
  id: string;
  loteId: string;
  safra: string;
  tipoLote: '10kg' | '50kg';
  amostras: number[]; // e.g. 10 individual bag weights in kg
  media: number;
  limiteMin: number;
  limiteMax: number;
  status: 'Aprovado' | 'Fora do Limite';
  dataHora: string;
  operador: string;
}

export interface PMSLog {
  id: string;
  loteId: string;
  cultivar: string;
  sementesPorReplica: number; // default: 100 sementes
  replicas: number[]; // weight in grams for each replica (5 replicates)
  pms: number; // calculated: average_weight * (1000 / sementesPorReplica)
  cv: number; // Coefficient of Variation in %
  status: 'Aprovado' | 'Atenção (>4% CV)'; // standard seed testing recommends CV < 4% for replicatas
  dataHora: string;
  operador: string;
}

export interface BatchClosing {
  id: string; // Equal to Lote ID
  cultivar: string;
  categoria: string; // e.g., "C1", "C2", "Básica", "S-1"
  danoMecanico: number; // %
  sementesVerdes: number; // %
  enrugadas: number; // %
  voc: number; // Outras Culturas / Sementes Novas %
  impurezas: number; // %
  germina: number; // % (from canteiro or manual)
  pms: number; // g
  status: 'Aprovado' | 'Reprovado';
  laudoFinal: string;
  dataFechamento: string;
  responsavel: string;
}

export interface SeedingReplica {
  replicaId: number;
  normais: number;   // Normal seedlings count
  anormais: number;  // Abnormal seedlings count
  mortas: number;    // Dead seeds count
}

export interface SeedingBedLog {
  id: string;
  loteId: string;
  dataSemeadura: string;
  dataContagem: string;
  replicas: SeedingReplica[];
  totalSementesPorReplica: number; // e.g., 100 or 50
  germinaMedia: number; // %
  vigorMedio: number; // % (computed usually as normal/total * 100)
  observacoes: string;
  dataHora: string;
  operador: string;
}

export interface AuditLog {
  id: string;
  acao: 'CADASTRO' | 'ALTERACAO' | 'EXCLUSAO' | 'SINCRONIZACAO' | 'LOGIN' | 'ALERTA';
  modulo: 'Secagem' | 'Pesagem' | 'PMS' | 'Fechamento' | 'Canteiro' | 'Segurança' | 'Sistema';
  descricao: string;
  usuario: string; // Email of the user who performed the action
  dataHora: string;
}

export interface SyncQueueItem {
  id: string;
  action: 'create' | 'edit' | 'delete';
  store: 'drying' | 'sackWeight' | 'pms' | 'batchClosing' | 'seedingBed';
  payload: any;
  timestamp: string;
}
