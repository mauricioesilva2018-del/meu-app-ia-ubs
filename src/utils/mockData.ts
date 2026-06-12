import { DryingLog, SackWeightLog, PMSLog, BatchClosing, SeedingBedLog, AuditLog } from '../types';

export const INITIAL_DRYING_LOGS: DryingLog[] = [
  {
    id: 'dry-001',
    loteId: 'LOTE-SOJA-502A',
    moega: 'Moega 03 B',
    cultivar: 'TMG 2375 IPRO',
    tempEntrada: 42.5,
    tempSaida: 35.2,
    umidade: 12.8,
    tempMassa: 38.1,
    tempoDescarga: '02h 45m',
    dataHora: '2026-06-12T05:30:00Z',
    operador: 'João Silveira'
  },
  {
    id: 'dry-002',
    loteId: 'LOTE-MILHO-101X',
    moega: 'Moega 01 A',
    cultivar: 'DKB 290 PRO3',
    tempEntrada: 45.0,
    tempSaida: 37.8,
    umidade: 13.1,
    tempMassa: 39.5,
    tempoDescarga: '01h 50m',
    dataHora: '2026-06-11T20:15:00Z',
    operador: 'João Silveira'
  },
  {
    id: 'dry-003',
    loteId: 'LOTE-SOJA-809C',
    moega: 'Moega 02',
    cultivar: 'BRL Urano IPRO',
    tempEntrada: 40.8,
    tempSaida: 34.0,
    umidade: 12.2,
    tempMassa: 36.8,
    tempoDescarga: '03h 10m',
    dataHora: '2026-06-11T14:40:00Z',
    operador: 'Clara Santos'
  }
];

export const INITIAL_SACK_WEIGHTS: SackWeightLog[] = [
  {
    id: 'sack-001',
    loteId: 'LOTE-SOJA-502A',
    safra: '2025/2026',
    tipoLote: '50kg',
    amostras: [50.1, 49.8, 50.2, 50.0, 49.9, 50.1, 50.3, 49.7, 50.0, 50.1],
    media: 50.02,
    limiteMin: 49.50,
    limiteMax: 50.50,
    status: 'Aprovado',
    dataHora: '2026-06-12T06:10:00Z',
    operador: 'João Silveira'
  },
  {
    id: 'sack-002',
    loteId: 'LOTE-MILHO-101X',
    safra: '2025/2026',
    tipoLote: '50kg',
    amostras: [50.4, 50.2, 50.6, 50.5, 49.7, 50.2, 50.5, 50.3, 50.4, 50.2],
    media: 50.30,
    limiteMin: 49.50,
    limiteMax: 50.50,
    status: 'Aprovado',
    dataHora: '2026-06-12T01:30:00Z',
    operador: 'João Silveira'
  },
  {
    id: 'sack-003',
    loteId: 'LOTE-SOJA-809C',
    safra: '2025/2026',
    tipoLote: '10kg',
    amostras: [10.1, 9.8, 9.6, 9.7, 10.2, 10.0, 9.9, 10.1, 9.8, 9.9],
    media: 9.91,
    limiteMin: 9.80,
    limiteMax: 10.20,
    status: 'Fora do Limite', // under limit due to 9.6 and 9.7
    dataHora: '2026-06-11T16:20:00Z',
    operador: 'Clara Santos'
  }
];

export const INITIAL_PMS_LOGS: PMSLog[] = [
  {
    id: 'pms-001',
    loteId: 'LOTE-SOJA-502A',
    cultivar: 'TMG 2375 IPRO',
    sementesPorReplica: 100,
    replicas: [16.2, 16.4, 16.1, 16.3, 16.2],
    pms: 162.4, // avg is 16.24 * 10 = 162.4g
    cv: 0.73,
    status: 'Aprovado',
    dataHora: '2026-06-12T06:45:00Z',
    operador: 'Clara Santos'
  },
  {
    id: 'pms-002',
    loteId: 'LOTE-MILHO-101X',
    cultivar: 'DKB 290 PRO3',
    sementesPorReplica: 100,
    replicas: [32.1, 31.8, 32.5, 31.9, 32.2],
    pms: 321.0,
    cv: 0.85,
    status: 'Aprovado',
    dataHora: '2026-06-11T18:00:00Z',
    operador: 'Clara Santos'
  },
  {
    id: 'pms-003',
    loteId: 'LOTE-SOJA-809C',
    cultivar: 'BRL Urano IPRO',
    sementesPorReplica: 100,
    replicas: [18.2, 19.5, 17.1, 18.8, 19.1], // Higher fluctuation
    pms: 185.4,
    cv: 4.85, // SD is 0.90, average 18.54. CV = 0.90 / 18.54 * 100 = ~4.85% (Needs attention!)
    status: 'Atenção (>4% CV)',
    dataHora: '2026-06-11T11:10:00Z',
    operador: 'Maurício Silva (Proprietário)'
  }
];

export const INITIAL_BATCH_CLOSINGS: BatchClosing[] = [
  {
    id: 'LOTE-SOJA-502A',
    cultivar: 'TMG 2375 IPRO',
    categoria: 'C1',
    danoMecanico: 1.5,
    sementesVerdes: 0.2,
    enrugadas: 1.1,
    voc: 0.0,
    impurezas: 0.1,
    germina: 94.0,
    pms: 162.4,
    status: 'Aprovado',
    laudoFinal: 'Lote de Sementes com excelente potencial fisiológico e parâmetros físicos rigorosamente dentro dos padrões comerciais estabelecidos pelo MAPA.',
    dataFechamento: '2026-06-12T07:10:00Z',
    responsavel: 'Clara Santos'
  },
  {
    id: 'LOTE-MILHO-101X',
    cultivar: 'DKB 290 PRO3',
    categoria: 'Básica',
    danoMecanico: 2.1,
    sementesVerdes: 0.0,
    enrugadas: 0.8,
    voc: 0.1,
    impurezas: 0.3,
    germina: 91.5,
    pms: 321.0,
    status: 'Aprovado',
    laudoFinal: 'Lote aprovado para comercialização. Apresenta alta germinação média e baixíssimo índice de impurezas físicas observadas nas replicatas analisadas.',
    dataFechamento: '2026-06-12T02:00:00Z',
    responsavel: 'Maurício Silva (Proprietário)'
  }
];

export const INITIAL_SEEDING_BEDS: SeedingBedLog[] = [
  {
    id: 'bed-001',
    loteId: 'LOTE-SOJA-502A',
    dataSemeadura: '2026-06-05',
    dataContagem: '2026-06-12',
    totalSementesPorReplica: 50,
    replicas: [
      { replicaId: 1, normais: 48, anormais: 1, mortas: 1 },
      { replicaId: 2, normais: 47, anormais: 2, mortas: 1 },
      { replicaId: 3, normais: 46, anormais: 3, mortas: 1 },
      { replicaId: 4, normais: 47, anormais: 2, mortas: 1 }
    ],
    germinaMedia: 94.0, // 188 / 200 = 94.0%
    vigorMedio: 94.0,
    observacoes: 'Desenvolvimento inicial vigoroso com excelente emissão de raiz e hipocótilo sadio.',
    dataHora: '2026-06-12T06:55:00Z',
    operador: 'Clara Santos'
  },
  {
    id: 'bed-002',
    loteId: 'LOTE-MILHO-101X',
    dataSemeadura: '2026-06-04',
    dataContagem: '2026-06-11',
    totalSementesPorReplica: 100,
    replicas: [
      { replicaId: 1, normais: 92, anormais: 5, mortas: 3 },
      { replicaId: 2, normais: 91, anormais: 6, mortas: 3 }
    ],
    germinaMedia: 91.5, // 183 / 200 = 91.5%
    vigorMedio: 91.5,
    observacoes: 'Canteiro com irrigação controlada. Plântulas emergindo uniformemente.',
    dataHora: '2026-06-11T15:30:00Z',
    operador: 'Clara Santos'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-001',
    acao: 'LOGIN',
    modulo: 'Segurança',
    descricao: 'Sessão de trabalho iniciada por Administrador',
    usuario: 'mauricioesilva2018@gmail.com',
    dataHora: '2026-06-12T07:15:00Z'
  },
  {
    id: 'log-002',
    acao: 'CADASTRO',
    modulo: 'Fechamento',
    descricao: 'Boletim de fechamento do LOTE-SOJA-502A emitido com status Aprovado',
    usuario: 'clara@ubsdigita.com.br',
    dataHora: '2026-06-12T07:10:00Z'
  },
  {
    id: 'log-003',
    acao: 'CADASTRO',
    modulo: 'Canteiro',
    descricao: 'Ficha de canteiro criada para lote LOTE-SOJA-502A (94% Germinação)',
    usuario: 'clara@ubsdigita.com.br',
    dataHora: '2026-06-12T06:55:00Z'
  },
  {
    id: 'log-004',
    acao: 'CADASTRO',
    modulo: 'PMS',
    descricao: 'Análise laboratorial de PMS cadastrada para LOTE-SOJA-502A (162.4g)',
    usuario: 'clara@ubsdigita.com.br',
    dataHora: '2026-06-12T06:45:00Z'
  },
  {
    id: 'log-005',
    acao: 'CADASTRO',
    modulo: 'Pesagem',
    descricao: 'Coleta estatística de peso de sacas registrada para LOTE-SOJA-502A (Média: 50.02kg)',
    usuario: 'joao@ubsdigita.com.br',
    dataHora: '2026-06-12T06:10:00Z'
  }
];
