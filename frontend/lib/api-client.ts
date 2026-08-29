// SettleFlow API Client & Orchestration Data Layer
// Connects to the Spring Boot backend API with graceful offline fallback
// to ensure seamless local operation in all states.

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

export type TransactionStatus =
  | 'PENDING'
  | 'ROUTING'
  | 'PROCESSING'
  | 'SETTLED'
  | 'RETRYING'
  | 'FAILED'
  | 'REFUNDED';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface AuditTransition {
  fromState: string;
  toState: string;
  timestamp: string;
  actor: string;
  psp?: string;
  latencyMs?: number;
  responseCode?: string;
  notes?: string;
}

export interface Transaction {
  id: string;
  reference: string;
  playerId: string;
  playerName?: string;
  amount: number;
  currency: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'REFUND';
  method: 'Card' | 'Bank transfer' | 'Wallet' | 'Crypto';
  psp: string | null;
  status: TransactionStatus;
  attemptCount: number;
  maxAttempts: number;
  idempotencyKey: string;
  riskScore: number;
  riskFlags: string[];
  createdAt: string;
  updatedAt: string;
  auditTrail: AuditTransition[];
  refundReason?: string;
  refundedAmount?: number;
}

export interface ProviderConfig {
  id: string;
  name: string;
  code: string;
  endpoint: string;
  apiKeyMasked: string;
  webhookSecretMasked: string;
  circuitState: CircuitState;
  failureRate: number;
  avgLatencyMs: number;
  priority: number;
  supportedCurrencies: string[];
  supportedMethods: string[];
  enabled: boolean;
  minAmount: number;
  maxAmount: number;
  lastCircuitChange?: string;
}

export interface RoutingRule {
  id: string;
  name: string;
  currency: string;
  preferredPsp: string;
  fallbackPsp: string;
  minAmount: number;
  maxAmount: number;
  trafficWeight: number; // percentage (0-100)
  enabled: boolean;
}

export interface ReconRun {
  id: string;
  runDate: string;
  status: 'COMPLETED' | 'DISCREPANCIES_FOUND' | 'IN_PROGRESS';
  totalTransactions: number;
  totalVolumeEur: number;
  matchedCount: number;
  discrepancyCount: number;
  durationSeconds: number;
  triggeredBy: string;
}

export interface ReconDiscrepancy {
  id: string;
  runId: string;
  type: 'MISSING_IN_DB' | 'MISSING_IN_PSP' | 'AMOUNT_MISMATCH' | 'STATUS_MISMATCH';
  reference: string;
  playerId: string;
  psp: string;
  internalAmount: number;
  pspAmount: number;
  currency: string;
  internalStatus: string;
  pspStatus: string;
  status: 'OPEN' | 'RESOLVED' | 'OVERRIDDEN';
  justificationNotes?: string;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface PlayerKYC {
  playerId: string;
  fullName: string;
  email: string;
  country: string;
  tier: 'TIER_1_BASIC' | 'TIER_2_VERIFIED' | 'TIER_3_EDD' | 'SUSPENDED';
  riskScore: number;
  documentStatus: 'VERIFIED' | 'PENDING_REVIEW' | 'NOT_SUBMITTED' | 'REJECTED';
  totalDepositedEur: number;
  dailyLimitEur: number;
  dailySpentEur: number;
  lastActivity: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'OPS_LEAD' | 'FINANCE_MANAGER' | 'COMPLIANCE_OFFICER' | 'READ_ONLY_VIEWER';
  roleTitle: string;
  department: string;
  twoFactorEnabled: boolean;
  lastLogin: string;
}

export interface AdminAuditLog {
  id: string;
  timestamp: string;
  adminName: string;
  adminRole: string;
  action: string;
  targetCategory: 'PSP' | 'TRANSACTION' | 'RECONCILIATION' | 'RISK_KYC' | 'SYSTEM_CONFIG' | 'AUTH';
  details: string;
  ipAddress: string;
}

export interface AlertRule {
  id: string;
  name: string;
  triggerEvent: string;
  channel: 'SLACK' | 'EMAIL' | 'PAGERDUTY' | 'WEBHOOK';
  targetDestination: string;
  enabled: boolean;
  lastTriggered?: string;
}

export interface SystemConfig {
  idempotencyTtlHours: number;
  maxRetryAttempts: number;
  retryBackoffStrategy: 'EXPONENTIAL' | 'LINEAR' | 'FIXED';
  retryInitialDelayMs: number;
  retryMultiplier: number;
  circuitFailureThresholdPercent: number;
  circuitCooldownSeconds: number;
  circuitSlidingWindowSize: number;
  circuitHalfOpenProbeCalls: number;
  autoReconCron: string;
  highRiskScoreThreshold: number;
  mgaComplianceMode: boolean;
}

export interface CreateTransactionRequest {
  playerId: string;
  playerName?: string;
  amount: number;
  currency: string;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  idempotencyKey?: string;
  method?: 'Card' | 'Bank transfer' | 'Wallet' | 'Crypto';
}

// Initial Fallback Seed Data
export const initialProviders: ProviderConfig[] = [
  {
    id: 'psp-alpha',
    name: 'PSP Alpha',
    code: 'ALPHA',
    endpoint: 'http://localhost:8081/v1/payments',
    apiKeyMasked: 'ak_live_••••••••90a1',
    webhookSecretMasked: 'whsec_••••••••41ef',
    circuitState: 'CLOSED',
    failureRate: 2.1,
    avgLatencyMs: 140,
    priority: 1,
    supportedCurrencies: ['EUR', 'USD', 'GBP'],
    supportedMethods: ['Card', 'Wallet'],
    enabled: true,
    minAmount: 5.0,
    maxAmount: 10000.0,
    lastCircuitChange: 'Active',
  },
  {
    id: 'psp-beta',
    name: 'PSP Beta',
    code: 'BETA',
    endpoint: 'http://localhost:8082/v1/charges',
    apiKeyMasked: 'ak_live_••••••••33b9',
    webhookSecretMasked: 'whsec_••••••••88ac',
    circuitState: 'OPEN',
    failureRate: 61.4,
    avgLatencyMs: 820,
    priority: 2,
    supportedCurrencies: ['EUR', 'USD', 'SEK'],
    supportedMethods: ['Card', 'Bank transfer'],
    enabled: true,
    minAmount: 10.0,
    maxAmount: 50000.0,
    lastCircuitChange: 'Active',
  },
  {
    id: 'psp-gamma',
    name: 'PSP Gamma',
    code: 'GAMMA',
    endpoint: 'http://localhost:8083/v2/settle',
    apiKeyMasked: 'ak_live_••••••••74c2',
    webhookSecretMasked: 'whsec_••••••••12ff',
    circuitState: 'HALF_OPEN',
    failureRate: 14.8,
    avgLatencyMs: 310,
    priority: 3,
    supportedCurrencies: ['GBP', 'EUR', 'NOK'],
    supportedMethods: ['Card', 'Bank transfer', 'Wallet'],
    enabled: true,
    minAmount: 10.0,
    maxAmount: 25000.0,
    lastCircuitChange: 'Active',
  },
];

export const initialRoutingRules: RoutingRule[] = [
  {
    id: 'rule-eur-primary',
    name: 'EUR High-Priority Card Routing',
    currency: 'EUR',
    preferredPsp: 'psp-alpha',
    fallbackPsp: 'psp-gamma',
    minAmount: 1.0,
    maxAmount: 5000.0,
    trafficWeight: 80,
    enabled: true,
  },
  {
    id: 'rule-gbp-direct',
    name: 'GBP Priority Direct Route',
    currency: 'GBP',
    preferredPsp: 'psp-gamma',
    fallbackPsp: 'psp-alpha',
    minAmount: 10.0,
    maxAmount: 15000.0,
    trafficWeight: 100,
    enabled: true,
  },
  {
    id: 'rule-usd-fallback',
    name: 'USD Global Settlement Flow',
    currency: 'USD',
    preferredPsp: 'psp-alpha',
    fallbackPsp: 'psp-beta',
    minAmount: 5.0,
    maxAmount: 20000.0,
    trafficWeight: 90,
    enabled: true,
  },
  {
    id: 'rule-high-roller',
    name: 'VIP & High-Value EUR (>€5,000)',
    currency: 'EUR',
    preferredPsp: 'psp-alpha',
    fallbackPsp: 'psp-gamma',
    minAmount: 5000.0,
    maxAmount: 50000.0,
    trafficWeight: 100,
    enabled: true,
  },
];

export const initialTransactions: Transaction[] = [
  {
    id: '88213',
    reference: 'TXN-88213',
    playerId: 'player_101',
    playerName: 'Aditi Kumar',
    amount: 50.0,
    currency: 'EUR',
    type: 'DEPOSIT',
    method: 'Card',
    psp: 'psp-alpha',
    status: 'SETTLED',
    attemptCount: 1,
    maxAttempts: 3,
    idempotencyKey: 'idem-88213',
    riskScore: 12,
    riskFlags: [],
    createdAt: '2 mins ago',
    updatedAt: '2 mins ago',
    auditTrail: [
      { fromState: 'INITIAL', toState: 'PENDING', timestamp: '14:22:01.102', actor: 'Player Checkout', notes: 'Deposit created' },
      { fromState: 'PENDING', toState: 'ROUTING', timestamp: '14:22:01.110', actor: 'PspRouter', notes: 'Matched rule: EUR High-Priority Card Routing' },
      { fromState: 'ROUTING', toState: 'PROCESSING', timestamp: '14:22:01.115', actor: 'PspRouter', psp: 'psp-alpha' },
      { fromState: 'PROCESSING', toState: 'SETTLED', timestamp: '14:22:01.245', actor: 'PSP Alpha', psp: 'psp-alpha', latencyMs: 130, responseCode: '200_OK' },
    ],
  },
  {
    id: '88212',
    reference: 'TXN-88212',
    playerId: 'player_412',
    playerName: 'Kasper Schmeichel',
    amount: 200.0,
    currency: 'EUR',
    type: 'DEPOSIT',
    method: 'Card',
    psp: 'psp-gamma',
    status: 'SETTLED',
    attemptCount: 2,
    maxAttempts: 3,
    idempotencyKey: 'idem-88212',
    riskScore: 28,
    riskFlags: ['RETRY_RECOVERY'],
    createdAt: '5 mins ago',
    updatedAt: '4 mins ago',
    auditTrail: [
      { fromState: 'INITIAL', toState: 'PENDING', timestamp: '14:19:00.050', actor: 'Player Checkout' },
      { fromState: 'PENDING', toState: 'ROUTING', timestamp: '14:19:00.055', actor: 'PspRouter', notes: 'Routed to psp-beta' },
      { fromState: 'ROUTING', toState: 'PROCESSING', timestamp: '14:19:00.060', actor: 'PspRouter', psp: 'psp-beta' },
      { fromState: 'PROCESSING', toState: 'RETRYING', timestamp: '14:19:00.860', actor: 'CircuitBreaker', psp: 'psp-beta', latencyMs: 800, responseCode: '504_TIMEOUT' },
      { fromState: 'RETRYING', toState: 'ROUTING', timestamp: '14:19:01.000', actor: 'PspRouter', notes: 'Fell back to psp-gamma' },
      { fromState: 'ROUTING', toState: 'PROCESSING', timestamp: '14:19:01.005', actor: 'PspRouter', psp: 'psp-gamma' },
      { fromState: 'PROCESSING', toState: 'SETTLED', timestamp: '14:19:01.315', actor: 'PSP Gamma', psp: 'psp-gamma', latencyMs: 310, responseCode: '200_OK' },
    ],
  },
  {
    id: '88211',
    reference: 'TXN-88211',
    playerId: 'player_089',
    playerName: 'Marcus Lindholm',
    amount: 500.0,
    currency: 'EUR',
    type: 'DEPOSIT',
    method: 'Bank transfer',
    psp: 'psp-beta',
    status: 'SETTLED',
    attemptCount: 1,
    maxAttempts: 3,
    idempotencyKey: 'idem-88211',
    riskScore: 45,
    riskFlags: ['HIGH_VALUE'],
    createdAt: '12 mins ago',
    updatedAt: '12 mins ago',
    auditTrail: [
      { fromState: 'INITIAL', toState: 'PENDING', timestamp: '14:12:00.110', actor: 'Player Checkout' },
      { fromState: 'PENDING', toState: 'ROUTING', timestamp: '14:12:00.115', actor: 'PspRouter' },
      { fromState: 'ROUTING', toState: 'PROCESSING', timestamp: '14:12:00.120', actor: 'PspRouter', psp: 'psp-beta' },
      { fromState: 'PROCESSING', toState: 'SETTLED', timestamp: '14:12:00.910', actor: 'PSP Beta', psp: 'psp-beta', latencyMs: 790, responseCode: '200_OK' },
    ],
  },
  {
    id: '88210',
    reference: 'TXN-88210',
    playerId: 'player_204',
    playerName: 'Liam O’Connor',
    amount: 25.0,
    currency: 'GBP',
    type: 'DEPOSIT',
    method: 'Card',
    psp: 'psp-alpha',
    status: 'SETTLED',
    attemptCount: 1,
    maxAttempts: 3,
    idempotencyKey: 'idem-88210',
    riskScore: 18,
    riskFlags: [],
    createdAt: '18 mins ago',
    updatedAt: '18 mins ago',
    auditTrail: [
      { fromState: 'INITIAL', toState: 'PENDING', timestamp: '14:06:00.110', actor: 'Player Checkout' },
      { fromState: 'PENDING', toState: 'ROUTING', timestamp: '14:06:00.115', actor: 'PspRouter' },
      { fromState: 'ROUTING', toState: 'PROCESSING', timestamp: '14:06:00.120', actor: 'PspRouter', psp: 'psp-alpha' },
      { fromState: 'PROCESSING', toState: 'SETTLED', timestamp: '14:06:00.230', actor: 'PSP Alpha', psp: 'psp-alpha', latencyMs: 110, responseCode: '200_OK' },
    ],
  },
];

export const initialReconRuns: ReconRun[] = [
  {
    id: 'run-20260824-0600',
    runDate: '2026-08-24 06:00 UTC',
    status: 'DISCREPANCIES_FOUND',
    totalTransactions: 1420,
    totalVolumeEur: 89450.0,
    matchedCount: 1417,
    discrepancyCount: 3,
    durationSeconds: 14,
    triggeredBy: 'Scheduled Daily Cron',
  },
  {
    id: 'run-20260823-0600',
    runDate: '2026-08-23 06:00 UTC',
    status: 'COMPLETED',
    totalTransactions: 1388,
    totalVolumeEur: 76200.0,
    matchedCount: 1388,
    discrepancyCount: 0,
    durationSeconds: 11,
    triggeredBy: 'Scheduled Daily Cron',
  },
];

export const initialReconDiscrepancies: ReconDiscrepancy[] = [
  {
    id: 'disc-1',
    runId: 'run-20260824-0600',
    type: 'MISSING_IN_PSP',
    reference: 'TXN-88192',
    playerId: 'player_412',
    psp: 'psp-beta',
    internalAmount: 200.0,
    pspAmount: 0,
    currency: 'EUR',
    internalStatus: 'SETTLED',
    pspStatus: 'NOT_FOUND',
    status: 'OPEN',
  },
  {
    id: 'disc-2',
    runId: 'run-20260824-0600',
    type: 'AMOUNT_MISMATCH',
    reference: 'TXN-88188',
    playerId: 'player_204',
    psp: 'psp-alpha',
    internalAmount: 120.0,
    pspAmount: 100.0,
    currency: 'GBP',
    internalStatus: 'SETTLED',
    pspStatus: 'SETTLED',
    status: 'OPEN',
  },
  {
    id: 'disc-3',
    runId: 'run-20260824-0600',
    type: 'STATUS_MISMATCH',
    reference: 'TXN-88147',
    playerId: 'player_089',
    psp: 'psp-beta',
    internalAmount: 75.5,
    pspAmount: 75.5,
    currency: 'EUR',
    internalStatus: 'FAILED',
    pspStatus: 'PROCESSING',
    status: 'OPEN',
  },
];

export const initialPlayersKYC: PlayerKYC[] = [
  {
    playerId: 'player_101',
    fullName: 'Aditi Kumar',
    email: 'aditi.k@example.com',
    country: 'Malta (MT)',
    tier: 'TIER_2_VERIFIED',
    riskScore: 12,
    documentStatus: 'VERIFIED',
    totalDepositedEur: 3450.0,
    dailyLimitEur: 5000.0,
    dailySpentEur: 50.0,
    lastActivity: '12 mins ago',
  },
  {
    playerId: 'player_204',
    fullName: 'Liam O’Connor',
    email: 'liam.oc@example.ie',
    country: 'Ireland (IE)',
    tier: 'TIER_2_VERIFIED',
    riskScore: 35,
    documentStatus: 'VERIFIED',
    totalDepositedEur: 8900.0,
    dailyLimitEur: 10000.0,
    dailySpentEur: 120.0,
    lastActivity: '4 mins ago',
  },
  {
    playerId: 'player_089',
    fullName: 'Marcus Lindholm',
    email: 'marcus.l@example.se',
    country: 'Sweden (SE)',
    tier: 'TIER_3_EDD',
    riskScore: 82,
    documentStatus: 'PENDING_REVIEW',
    totalDepositedEur: 42300.0,
    dailyLimitEur: 25000.0,
    dailySpentEur: 1575.5,
    lastActivity: '1 hour ago',
  },
  {
    playerId: 'player_317',
    fullName: 'Elena Rostova',
    email: 'elena.r@example.com',
    country: 'Cyprus (CY)',
    tier: 'TIER_2_VERIFIED',
    riskScore: 8,
    documentStatus: 'VERIFIED',
    totalDepositedEur: 1200.0,
    dailyLimitEur: 5000.0,
    dailySpentEur: 30.0,
    lastActivity: '2 hours ago',
  },
  {
    playerId: 'player_412',
    fullName: 'Kasper Schmeichel',
    email: 'kasper.s@example.dk',
    country: 'Denmark (DK)',
    tier: 'TIER_1_BASIC',
    riskScore: 28,
    documentStatus: 'NOT_SUBMITTED',
    totalDepositedEur: 450.0,
    dailyLimitEur: 2000.0,
    dailySpentEur: 200.0,
    lastActivity: '3 hours ago',
  },
];

export const initialAdminUsers: AdminUser[] = [
  {
    id: 'usr-1',
    name: 'Ravi Shankar',
    email: 'ravi.s@settleflow.dev',
    role: 'OPS_LEAD',
    roleTitle: 'Operations Lead',
    department: 'Payments & Platform Operations',
    twoFactorEnabled: true,
    lastLogin: 'Active now',
  },
  {
    id: 'usr-2',
    name: 'Elena Vance',
    email: 'elena.v@settleflow.dev',
    role: 'SUPER_ADMIN',
    roleTitle: 'Chief Technology Officer',
    department: 'Executive Engineering',
    twoFactorEnabled: true,
    lastLogin: '25 mins ago',
  },
  {
    id: 'usr-3',
    name: 'Matteo Rossi',
    email: 'matteo.r@settleflow.dev',
    role: 'FINANCE_MANAGER',
    roleTitle: 'Finance & Treasury Manager',
    department: 'Finance & Settlement',
    twoFactorEnabled: true,
    lastLogin: '1 hour ago',
  },
  {
    id: 'usr-4',
    name: 'Astrid Lind',
    email: 'astrid.l@settleflow.dev',
    role: 'COMPLIANCE_OFFICER',
    roleTitle: 'MLRO & Risk Compliance Officer',
    department: 'Risk, AML & Regulatory (MGA)',
    twoFactorEnabled: true,
    lastLogin: '3 hours ago',
  },
  {
    id: 'usr-5',
    name: 'Auditor Guest',
    email: 'auditor@mga-regulator.gov.mt',
    role: 'READ_ONLY_VIEWER',
    roleTitle: 'External Regulatory Inspector',
    department: 'Malta Gaming Authority (MGA)',
    twoFactorEnabled: true,
    lastLogin: 'Yesterday',
  },
];

export const initialAuditLogs: AdminAuditLog[] = [
  {
    id: 'log-904',
    timestamp: '2026-08-24 07:44:12 UTC',
    adminName: 'Ravi Shankar',
    adminRole: 'Operations Lead',
    action: 'CIRCUIT_BREAKER_OVERRIDE',
    targetCategory: 'PSP',
    details: 'Manually flipped PSP Beta circuit breaker to OPEN after consecutive timeout spike',
    ipAddress: '192.168.1.42',
  },
  {
    id: 'log-903',
    timestamp: '2026-08-24 07:18:05 UTC',
    adminName: 'Matteo Rossi',
    adminRole: 'Finance Manager',
    action: 'RECON_DISCREPANCY_OVERRIDE',
    targetCategory: 'RECONCILIATION',
    details: 'Approved manual reconciliation adjustment for batch DISC-098',
    ipAddress: '192.168.1.18',
  },
  {
    id: 'log-902',
    timestamp: '2026-08-24 06:12:40 UTC',
    adminName: 'Astrid Lind',
    adminRole: 'Compliance Officer',
    action: 'KYC_TIER_UPDATE',
    targetCategory: 'RISK_KYC',
    details: 'Elevated player_089 to Tier 3 (Enhanced Due Diligence)',
    ipAddress: '192.168.1.66',
  },
  {
    id: 'log-901',
    timestamp: '2026-08-24 05:00:22 UTC',
    adminName: 'Ravi Shankar',
    adminRole: 'Operations Lead',
    action: 'ROUTING_RULE_MUTATED',
    targetCategory: 'PSP',
    details: 'Updated EUR High-Priority Card Routing preferred provider to PSP Alpha with 80% weight',
    ipAddress: '192.168.1.42',
  },
];

export const initialAlertRules: AlertRule[] = [
  {
    id: 'alt-1',
    name: 'Provider Circuit Breaker Flipped OPEN',
    triggerEvent: 'Circuit state transitions to OPEN on any registered PSP',
    channel: 'SLACK',
    targetDestination: '#ops-payment-incidents',
    enabled: true,
    lastTriggered: '14 mins ago (PSP Beta)',
  },
  {
    id: 'alt-2',
    name: 'Reconciliation Discrepancy Threshold > €500',
    triggerEvent: 'Single or aggregate recon discrepancy exceeds €500.00 EUR',
    channel: 'EMAIL',
    targetDestination: 'treasury-alerts@settleflow.dev',
    enabled: true,
    lastTriggered: 'Yesterday',
  },
  {
    id: 'alt-3',
    name: 'Player High-Risk AML Velocity Alert',
    triggerEvent: 'Player exceeds 3 rapid declines or deposits >€10,000 within 1h',
    channel: 'PAGERDUTY',
    targetDestination: 'risk-oncall-tier2',
    enabled: true,
    lastTriggered: 'Never',
  },
];

export const initialSystemConfig: SystemConfig = {
  idempotencyTtlHours: 24,
  maxRetryAttempts: 3,
  retryBackoffStrategy: 'EXPONENTIAL',
  retryInitialDelayMs: 500,
  retryMultiplier: 2.0,
  circuitFailureThresholdPercent: 50,
  circuitCooldownSeconds: 15,
  circuitSlidingWindowSize: 20,
  circuitHalfOpenProbeCalls: 3,
  autoReconCron: '0 6 * * * (Daily at 06:00 UTC)',
  highRiskScoreThreshold: 75,
  mgaComplianceMode: true,
};

// Client API Helper with Timeout
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...options,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Backend request failed: ${res.status} ${res.statusText}`);
    }

    return res.json() as Promise<T>;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export const api = {
  // Transactions
  createTransaction: (body: CreateTransactionRequest) =>
    request<Transaction>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getTransaction: (id: string) =>
    request<Transaction>(`/api/transactions/${id}`),

  listTransactions: () =>
    request<Transaction[]>('/api/transactions'),

  refundTransaction: (id: string, amount?: number, reason?: string) =>
    request<Transaction>(`/api/transactions/${id}/refund`, {
      method: 'POST',
      body: JSON.stringify({ amount, reason }),
    }),

  // Providers & Circuit Breakers
  fetchProviders: () =>
    request<ProviderConfig[]>('/api/psps'),

  overrideCircuit: (id: string, targetState: CircuitState) =>
    request<{ id: string; circuitState: CircuitState; message: string }>(`/api/psps/${id}/circuit-override`, {
      method: 'POST',
      body: JSON.stringify({ targetState }),
    }),

  configureMockPsp: (id: string, body: { failureRate?: number; avgLatencyMs?: number; enabled?: boolean }) =>
    request<any>(`/api/psps/${id}/configure`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // Routing Rules
  fetchRoutingRules: () =>
    request<RoutingRule[]>('/api/routing-rules'),

  createRoutingRule: (rule: Partial<RoutingRule>) =>
    request<RoutingRule>('/api/routing-rules', {
      method: 'POST',
      body: JSON.stringify(rule),
    }),

  updateRoutingRule: (id: string, rule: Partial<RoutingRule>) =>
    request<RoutingRule>(`/api/routing-rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(rule),
    }),

  deleteRoutingRule: (id: string) =>
    request<void>(`/api/routing-rules/${id}`, {
      method: 'DELETE',
    }),

  // Reconciliation
  fetchReconRuns: () =>
    request<ReconRun[]>('/api/reconciliation/runs'),

  fetchReconDiscrepancies: () =>
    request<ReconDiscrepancy[]>('/api/reconciliation/discrepancies'),

  triggerReconciliation: (triggeredBy?: string) =>
    request<ReconRun>('/api/reconciliation/run', {
      method: 'POST',
      body: JSON.stringify({ triggeredBy }),
    }),

  resolveDiscrepancy: (id: string, justification?: string, adminName?: string) =>
    request<ReconDiscrepancy>(`/api/reconciliation/discrepancies/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ justification, adminName }),
    }),

  // Players & KYC
  fetchPlayersKYC: () =>
    request<PlayerKYC[]>('/api/players'),

  updatePlayerKYC: (id: string, updates: Partial<PlayerKYC>) =>
    request<PlayerKYC>(`/api/players/${id}/kyc`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  // Audit Logs
  fetchAuditLogs: () =>
    request<AdminAuditLog[]>('/api/audit-logs'),
};
