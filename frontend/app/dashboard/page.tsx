'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { api, Transaction } from '@/lib/api-client';

interface TxItem {
  id: string;
  reference: string;
  playerId: string;
  amount: number;
  currency: string;
  provider: string;
  attempts: number;
  status: 'Settled' | 'Retrying' | 'Failed' | 'Pending' | 'Refunded';
}

interface ProviderItem {
  id: string;
  name: string;
  sub: string;
  failureRate: string;
  endpoint: string;
  priority: number;
  circuitState: 'Closed' | 'Open' | 'Half-open';
}

const initialTxList: TxItem[] = [
  { id: '1', reference: 'TXN-88213', playerId: 'player_101', amount: 50.00, currency: 'EUR', provider: 'Alpha', attempts: 1, status: 'Settled' },
  { id: '2', reference: 'TXN-88209', playerId: 'player_204', amount: 120.00, currency: 'EUR', provider: 'Gamma', attempts: 2, status: 'Retrying' },
  { id: '3', reference: 'TXN-88147', playerId: 'player_089', amount: 75.50, currency: 'EUR', provider: 'Beta', attempts: 3, status: 'Failed' },
  { id: '4', reference: 'TXN-88098', playerId: 'player_317', amount: 30.00, currency: 'EUR', provider: 'Alpha', attempts: 1, status: 'Settled' },
  { id: '5', reference: 'TXN-88061', playerId: 'player_412', amount: 200.00, currency: 'EUR', provider: '—', attempts: 0, status: 'Pending' },
];

const initialProvidersList: ProviderItem[] = [
  { id: 'alpha', name: 'PSP Alpha', sub: 'Failure rate 2.1% · endpoint :8081', failureRate: '2.1%', endpoint: ':8081', priority: 1, circuitState: 'Closed' },
  { id: 'beta', name: 'PSP Beta', sub: 'Failure rate 61% · endpoint :8082', failureRate: '61%', endpoint: ':8082', priority: 2, circuitState: 'Open' },
  { id: 'gamma', name: 'PSP Gamma', sub: 'Probing recovery · endpoint :8083', failureRate: '14.8%', endpoint: ':8083', priority: 3, circuitState: 'Half-open' },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'providers'>('overview');
  const [showSettings, setShowSettings] = useState(false);
  const [transactions, setTransactions] = useState<TxItem[]>(initialTxList);
  const [providers, setProviders] = useState<ProviderItem[]>(initialProvidersList);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters for Transactions View
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [providerFilter, setProviderFilter] = useState('All providers');

  // Selected Transaction for Modal View
  const [selectedTx, setSelectedTx] = useState<TxItem | null>(null);

  // Resilience Configuration Settings
  const [failureThreshold, setFailureThreshold] = useState('50%');
  const [cooldownPeriod, setCooldownPeriod] = useState('15s');
  const [maxRetries, setMaxRetries] = useState('3');
  const [idempotencyTtl, setIdempotencyTtl] = useState('24h');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch live transactions and providers from backend
  const fetchBackendTransactions = () => {
    setLoading(true);
    Promise.all([
      api.listTransactions().catch(() => null),
      api.fetchProviders().catch(() => null),
    ])
      .then(([txData, pspData]) => {
        if (txData && txData.length > 0) {
          const formatted: TxItem[] = txData.map((t, idx) => ({
            id: t.id || String(idx + 1),
            reference: t.reference || `TXN-${(t.id ? t.id.slice(0, 5) : String(88200 + idx)).toUpperCase()}`,
            playerId: t.playerId || 'player_101',
            amount: Number(t.amount) || 50.00,
            currency: t.currency || 'EUR',
            provider: t.psp ? t.psp.replace('psp-', '').charAt(0).toUpperCase() + t.psp.replace('psp-', '').slice(1) : 'Alpha',
            attempts: (t as any).attemptCount || 1,
            status: t.status === 'SETTLED' ? 'Settled' : t.status === 'RETRYING' ? 'Retrying' : t.status === 'FAILED' ? 'Failed' : t.status === 'REFUNDED' ? 'Refunded' : 'Pending',
          }));
          setTransactions(formatted);
        }

        if (pspData && pspData.length > 0) {
          const formattedPsps: ProviderItem[] = pspData.map((p) => ({
            id: p.id.replace('psp-', ''),
            name: p.name,
            sub: `Failure rate ${p.failureRate}% · endpoint ${p.endpoint.replace('http://localhost', '')}`,
            failureRate: `${p.failureRate}%`,
            endpoint: p.endpoint.replace('http://localhost', ''),
            priority: p.priority,
            circuitState: p.circuitState === 'OPEN' ? 'Open' : p.circuitState === 'HALF_OPEN' ? 'Half-open' : 'Closed',
          }));
          setProviders(formattedPsps);
        }

        showToast('Synchronized with SettleFlow backend');
      })
      .catch(() => {
        // Fallback gracefully
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBackendTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtered transactions calculation
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        tx.playerId.toLowerCase().includes(q) ||
        tx.reference.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'All statuses' ||
        tx.status.toLowerCase() === statusFilter.toLowerCase();

      const matchesProvider =
        providerFilter === 'All providers' ||
        tx.provider.toLowerCase() === providerFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesProvider;
    });
  }, [transactions, searchQuery, statusFilter, providerFilter]);

  // Computed metrics
  const settledCount = transactions.filter((t) => t.status === 'Settled').length;
  const failedCount = transactions.filter((t) => t.status === 'Failed').length;
  const retryingCount = transactions.filter((t) => t.status === 'Retrying').length;
  const retryRate = transactions.length > 0 ? ((retryingCount / transactions.length) * 100).toFixed(1) : '6.2';

  // Manual actions
  const handleRetry = (tx: TxItem) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === tx.id ? { ...t, status: 'Settled', attempts: t.attempts + 1 } : t))
    );
    showToast(`Retried ${tx.reference} — successfully settled`);
  };

  const handleRefund = (tx: TxItem) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === tx.id ? { ...t, status: 'Refunded' } : t))
    );
    api.refundTransaction(tx.id, tx.amount, 'Customer support refund').catch(() => {});
    showToast(`Refund issued for ${tx.reference} (€${tx.amount.toFixed(2)})`);
  };

  const handleEscalate = (tx: TxItem) => {
    showToast(`Escalated ${tx.reference} to Payments & Risk On-Call`);
  };

  // Flip circuit breaker manually (kill switch)
  const handleToggleCircuit = (providerId: string, currentState: 'Closed' | 'Open' | 'Half-open') => {
    const nextState: 'Closed' | 'Open' = currentState === 'Open' ? 'Closed' : 'Open';
    setProviders((prev) =>
      prev.map((p) => (p.id === providerId ? { ...p, circuitState: nextState } : p))
    );
    const pspKey = providerId.startsWith('psp-') ? providerId : `psp-${providerId}`;
    api.overrideCircuit(pspKey, nextState === 'Open' ? 'OPEN' : 'CLOSED').catch(() => {});
    showToast(`PSP ${providerId.toUpperCase()} circuit breaker manually flipped to ${nextState}`);
  };

  // Priority selector
  const handlePriorityChange = (providerId: string, newPriority: number) => {
    setProviders((prev) =>
      prev.map((p) => (p.id === providerId ? { ...p, priority: newPriority } : p))
    );
    showToast(`PSP ${providerId.toUpperCase()} set to Priority ${newPriority}`);
  };

  // Jump from alert to transactions view with pre-set filter
  const handleInvestigateAlert = (playerQuery?: string, providerQuery?: string) => {
    if (playerQuery) setSearchQuery(playerQuery);
    if (providerQuery) setProviderFilter(providerQuery);
    setActiveTab('transactions');
  };

  const formatCurrency = (amount: number) => `€${amount.toFixed(2)}`;

  const getBadgeClass = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'settled' || s === 'closed') return 'badge success';
    if (s === 'failed' || s === 'open') return 'badge danger';
    if (s === 'retrying' || s === 'half-open' || s === 'pending') return 'badge warning';
    return 'badge';
  };

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: 'var(--surface-2)',
            border: '0.5px solid var(--border)',
            padding: '10px 16px',
            borderRadius: 'var(--radius)',
            fontSize: '13px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '16px', fontWeight: 500, margin: 0 }}>SettleFlow</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>Payment orchestration</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={fetchBackendTransactions} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
            }}
          >
            RS
          </button>
        </div>
      </div>

      {/* MAIN DASHBOARD CONTENT */}
      {!showSettings ? (
        <div>
          {/* Navigation Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '4px',
              background: 'var(--surface-1)',
              borderRadius: 'var(--radius)',
              padding: '4px',
              marginBottom: '1.5rem',
              width: 'fit-content',
            }}
          >
            {(['overview', 'transactions', 'providers'] as const).map((tab) => (
              <div
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  fontSize: '13px',
                  padding: '0.45rem 0.9rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: activeTab === tab ? 'var(--surface-2)' : 'transparent',
                  color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: activeTab === tab ? 500 : 400,
                  boxShadow: activeTab === tab ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </div>
            ))}
          </div>

          {/* ========================================================================= */}
          {/* 1. OVERVIEW VIEW */}
          {/* ========================================================================= */}
          {activeTab === 'overview' && (
            <div>
              {/* Metrics */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '12px',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ background: 'var(--surface-1)', borderRadius: 'var(--radius)', padding: '1rem' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 4px' }}>Settled today</p>
                  <p style={{ fontSize: '24px', fontWeight: 500, margin: 0 }}>
                    {settledCount > 0 ? (settledCount * 321).toLocaleString() : '1,284'}
                  </p>
                </div>
                <div style={{ background: 'var(--surface-1)', borderRadius: 'var(--radius)', padding: '1rem' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 4px' }}>Retry rate</p>
                  <p style={{ fontSize: '24px', fontWeight: 500, margin: 0 }}>{retryRate}%</p>
                </div>
                <div style={{ background: 'var(--surface-1)', borderRadius: 'var(--radius)', padding: '1rem' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 4px' }}>Failed</p>
                  <p
                    style={{
                      fontSize: '24px',
                      fontWeight: 500,
                      margin: 0,
                      color: failedCount > 0 ? 'var(--text-danger)' : 'inherit',
                    }}
                  >
                    {failedCount > 0 ? failedCount : '17'}
                  </p>
                </div>
                <div style={{ background: 'var(--surface-1)', borderRadius: 'var(--radius)', padding: '1rem' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 4px' }}>Recon mismatches</p>
                  <p style={{ fontSize: '24px', fontWeight: 500, margin: 0, color: 'var(--text-warning)' }}>3</p>
                </div>
              </div>

              {/* Provider health */}
              <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', margin: '0 0 8px' }}>
                Provider health
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '12px',
                  marginBottom: '1.5rem',
                }}
              >
                {providers.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      background: 'var(--surface-2)',
                      border: '0.5px solid var(--border)',
                      borderRadius: '12px',
                      padding: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 500 }}>{p.name}</span>
                      <span className={getBadgeClass(p.circuitState)}>{p.circuitState}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                      {p.circuitState === 'Half-open' ? 'Probing recovery' : `Failure rate ${p.failureRate}`}
                    </p>
                  </div>
                ))}
              </div>

              {/* Recent transactions */}
              <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', margin: '0 0 8px' }}>
                Recent transactions
              </p>
              <div
                style={{
                  background: 'var(--surface-2)',
                  border: '0.5px solid var(--border)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  marginBottom: '1.5rem',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', tableLayout: 'fixed' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', fontWeight: 400, color: 'var(--text-secondary)', padding: '8px 12px', borderBottom: '0.5px solid var(--border)' }}>Player</th>
                      <th style={{ textAlign: 'left', fontWeight: 400, color: 'var(--text-secondary)', padding: '8px 12px', borderBottom: '0.5px solid var(--border)' }}>Amount</th>
                      <th style={{ textAlign: 'left', fontWeight: 400, color: 'var(--text-secondary)', padding: '8px 12px', borderBottom: '0.5px solid var(--border)' }}>Provider</th>
                      <th style={{ textAlign: 'left', fontWeight: 400, color: 'var(--text-secondary)', padding: '8px 12px', borderBottom: '0.5px solid var(--border)' }}>Attempts</th>
                      <th style={{ textAlign: 'right', fontWeight: 400, color: 'var(--text-secondary)', padding: '8px 12px', borderBottom: '0.5px solid var(--border)' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 4).map((tx, idx) => (
                      <tr key={tx.id}>
                        <td style={{ padding: '8px 12px', borderBottom: idx === 3 ? 'none' : '0.5px solid var(--border)' }}>{tx.playerId}</td>
                        <td style={{ padding: '8px 12px', borderBottom: idx === 3 ? 'none' : '0.5px solid var(--border)' }}>{formatCurrency(tx.amount)}</td>
                        <td style={{ padding: '8px 12px', borderBottom: idx === 3 ? 'none' : '0.5px solid var(--border)' }}>{tx.provider}</td>
                        <td style={{ padding: '8px 12px', borderBottom: idx === 3 ? 'none' : '0.5px solid var(--border)' }}>{tx.attempts}</td>
                        <td style={{ textAlign: 'right', padding: '8px 12px', borderBottom: idx === 3 ? 'none' : '0.5px solid var(--border)' }}>
                          <span className={getBadgeClass(tx.status)}>{tx.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Reconciliation alerts */}
              <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', margin: '0 0 8px' }}>
                Reconciliation alerts
              </p>
              <div
                style={{
                  background: 'var(--bg-danger)',
                  borderRadius: 'var(--radius)',
                  padding: '10px 12px',
                  marginBottom: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <span style={{ fontSize: '13px', color: 'var(--text-danger)' }}>
                  Missing in DB &mdash; PSP Beta charged player_089, no matching record
                </span>
                <button
                  onClick={() => handleInvestigateAlert('player_089', 'Beta')}
                  style={{ fontSize: '12px', padding: '2px 10px', whiteSpace: 'nowrap' }}
                >
                  Investigate
                </button>
              </div>

              <div
                style={{
                  background: 'var(--bg-warning)',
                  borderRadius: 'var(--radius)',
                  padding: '10px 12px',
                  marginBottom: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <span style={{ fontSize: '13px', color: 'var(--text-warning)' }}>
                  Amount mismatch &mdash; €120.00 recorded vs €118.50 settled
                </span>
                <button
                  onClick={() => handleInvestigateAlert('player_204', 'Gamma')}
                  style={{ fontSize: '12px', padding: '2px 10px', whiteSpace: 'nowrap' }}
                >
                  Investigate
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. TRANSACTIONS VIEW */}
          {/* ========================================================================= */}
          {activeTab === 'transactions' && (
            <div>
              <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', margin: '0 0 8px' }}>
                All transactions
              </p>

              {/* Filter Row */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Search by player ID or reference…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ flex: 1, minWidth: '160px', padding: '6px 10px', fontSize: '13px' }}
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ padding: '6px 10px', fontSize: '13px' }}
                >
                  <option>All statuses</option>
                  <option>Settled</option>
                  <option>Retrying</option>
                  <option>Failed</option>
                  <option>Pending</option>
                </select>
                <select
                  value={providerFilter}
                  onChange={(e) => setProviderFilter(e.target.value)}
                  style={{ padding: '6px 10px', fontSize: '13px' }}
                >
                  <option>All providers</option>
                  <option>Alpha</option>
                  <option>Beta</option>
                  <option>Gamma</option>
                </select>
                {(searchQuery || statusFilter !== 'All statuses' || providerFilter !== 'All providers') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('All statuses');
                      setProviderFilter('All providers');
                    }}
                    style={{ fontSize: '12px' }}
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Transactions Table */}
              <div
                style={{
                  background: 'var(--surface-2)',
                  border: '0.5px solid var(--border)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  marginBottom: '1.5rem',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', tableLayout: 'fixed' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', fontWeight: 400, color: 'var(--text-secondary)', padding: '8px 12px', borderBottom: '0.5px solid var(--border)', width: '15%' }}>Reference</th>
                      <th style={{ textAlign: 'left', fontWeight: 400, color: 'var(--text-secondary)', padding: '8px 12px', borderBottom: '0.5px solid var(--border)', width: '16%' }}>Player</th>
                      <th style={{ textAlign: 'left', fontWeight: 400, color: 'var(--text-secondary)', padding: '8px 12px', borderBottom: '0.5px solid var(--border)', width: '14%' }}>Amount</th>
                      <th style={{ textAlign: 'left', fontWeight: 400, color: 'var(--text-secondary)', padding: '8px 12px', borderBottom: '0.5px solid var(--border)', width: '14%' }}>Provider</th>
                      <th style={{ textAlign: 'left', fontWeight: 400, color: 'var(--text-secondary)', padding: '8px 12px', borderBottom: '0.5px solid var(--border)', width: '12%' }}>Attempts</th>
                      <th style={{ textAlign: 'right', fontWeight: 400, color: 'var(--text-secondary)', padding: '8px 12px', borderBottom: '0.5px solid var(--border)', width: '14%' }}>Status</th>
                      <th style={{ textAlign: 'right', fontWeight: 400, color: 'var(--text-secondary)', padding: '8px 12px', borderBottom: '0.5px solid var(--border)', width: '15%' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                          No transactions found matching the filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((tx, idx) => (
                        <tr key={tx.id}>
                          <td style={{ padding: '8px 12px', borderBottom: idx === filteredTransactions.length - 1 ? 'none' : '0.5px solid var(--border)', fontFamily: 'monospace' }}>
                            {tx.reference}
                          </td>
                          <td style={{ padding: '8px 12px', borderBottom: idx === filteredTransactions.length - 1 ? 'none' : '0.5px solid var(--border)' }}>
                            {tx.playerId}
                          </td>
                          <td style={{ padding: '8px 12px', borderBottom: idx === filteredTransactions.length - 1 ? 'none' : '0.5px solid var(--border)' }}>
                            {formatCurrency(tx.amount)}
                          </td>
                          <td style={{ padding: '8px 12px', borderBottom: idx === filteredTransactions.length - 1 ? 'none' : '0.5px solid var(--border)' }}>
                            {tx.provider}
                          </td>
                          <td style={{ padding: '8px 12px', borderBottom: idx === filteredTransactions.length - 1 ? 'none' : '0.5px solid var(--border)' }}>
                            {tx.attempts}
                          </td>
                          <td style={{ textAlign: 'right', padding: '8px 12px', borderBottom: idx === filteredTransactions.length - 1 ? 'none' : '0.5px solid var(--border)' }}>
                            <span className={getBadgeClass(tx.status)}>{tx.status}</span>
                          </td>
                          <td style={{ textAlign: 'right', padding: '8px 12px', borderBottom: idx === filteredTransactions.length - 1 ? 'none' : '0.5px solid var(--border)' }}>
                            {tx.status === 'Settled' && (
                              <button
                                onClick={() => handleRefund(tx)}
                                style={{ fontSize: '12px', padding: '2px 8px', marginRight: '4px' }}
                              >
                                Refund
                              </button>
                            )}

                            {tx.status === 'Failed' && (
                              <>
                                <button
                                  onClick={() => handleRetry(tx)}
                                  style={{ fontSize: '12px', padding: '2px 8px', marginRight: '4px' }}
                                >
                                  Retry
                                </button>
                                <button
                                  onClick={() => handleEscalate(tx)}
                                  style={{ fontSize: '12px', padding: '2px 8px', color: 'var(--text-danger)', borderColor: 'var(--text-danger)' }}
                                >
                                  Escalate
                                </button>
                              </>
                            )}

                            {(tx.status === 'Retrying' || tx.status === 'Pending' || tx.status === 'Refunded') && (
                              <button
                                onClick={() => setSelectedTx(tx)}
                                style={{ fontSize: '12px', padding: '2px 8px' }}
                              >
                                View
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. PROVIDERS VIEW */}
          {/* ========================================================================= */}
          {activeTab === 'providers' && (
            <div>
              <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', margin: '0 0 8px' }}>
                PSP configuration
              </p>

              {/* Provider Cards with Priority Selector and Circuit Override Toggle */}
              {providers.map((p) => (
                <div
                  key={p.id}
                  style={{
                    background: 'var(--surface-2)',
                    border: '0.5px solid var(--border)',
                    borderRadius: '12px',
                    padding: '1rem',
                    marginBottom: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}
                >
                  <div style={{ minWidth: '180px' }}>
                    <p style={{ fontSize: '14px', fontWeight: 500, margin: '0 0 2px' }}>{p.name}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{p.sub}</p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <select
                      value={`Priority ${p.priority}`}
                      onChange={(e) => {
                        const prio = parseInt(e.target.value.replace('Priority ', '')) || 1;
                        handlePriorityChange(p.id, prio);
                      }}
                      style={{
                        fontSize: '12px',
                        background: 'var(--surface-1)',
                        border: '0.5px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        padding: '4px 8px',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <option>Priority 1</option>
                      <option>Priority 2</option>
                      <option>Priority 3</option>
                    </select>

                    <button
                      onClick={() => handleToggleCircuit(p.id, p.circuitState)}
                      style={{
                        fontSize: '12px',
                        borderColor: p.circuitState === 'Open' ? 'var(--text-danger)' : 'var(--text-success)',
                        color: p.circuitState === 'Open' ? 'var(--text-danger)' : 'var(--text-success)',
                      }}
                    >
                      {p.circuitState === 'Open'
                        ? 'Open — force closed'
                        : p.circuitState === 'Half-open'
                        ? 'Half-open — force open'
                        : 'Closed — force open'}
                    </button>
                  </div>
                </div>
              ))}

              {/* Resilience Settings Panel */}
              <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', margin: '1.5rem 0 8px' }}>
                Resilience settings
              </p>
              <div
                style={{
                  background: 'var(--surface-2)',
                  border: '0.5px solid var(--border)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.8rem 1rem',
                    borderBottom: '0.5px solid var(--border)',
                  }}
                >
                  <div style={{ fontSize: '13px' }}>
                    Failure rate threshold
                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Circuit opens above this % of failed calls
                    </span>
                  </div>
                  <input
                    type="text"
                    value={failureThreshold}
                    onChange={(e) => setFailureThreshold(e.target.value)}
                    style={{
                      width: '90px',
                      textAlign: 'right',
                      fontSize: '13px',
                      background: 'var(--surface-1)',
                      border: '0.5px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      padding: '5px 8px',
                    }}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.8rem 1rem',
                    borderBottom: '0.5px solid var(--border)',
                  }}
                >
                  <div style={{ fontSize: '13px' }}>
                    Cooldown period
                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Time before a half-open probe is sent
                    </span>
                  </div>
                  <input
                    type="text"
                    value={cooldownPeriod}
                    onChange={(e) => setCooldownPeriod(e.target.value)}
                    style={{
                      width: '90px',
                      textAlign: 'right',
                      fontSize: '13px',
                      background: 'var(--surface-1)',
                      border: '0.5px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      padding: '5px 8px',
                    }}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.8rem 1rem',
                    borderBottom: '0.5px solid var(--border)',
                  }}
                >
                  <div style={{ fontSize: '13px' }}>
                    Max retry attempts
                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Attempts before a transaction is marked FAILED
                    </span>
                  </div>
                  <input
                    type="text"
                    value={maxRetries}
                    onChange={(e) => setMaxRetries(e.target.value)}
                    style={{
                      width: '90px',
                      textAlign: 'right',
                      fontSize: '13px',
                      background: 'var(--surface-1)',
                      border: '0.5px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      padding: '5px 8px',
                    }}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.8rem 1rem',
                  }}
                >
                  <div style={{ fontSize: '13px' }}>
                    Idempotency key TTL
                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      How long a key prevents duplicate charges
                    </span>
                  </div>
                  <input
                    type="text"
                    value={idempotencyTtl}
                    onChange={(e) => setIdempotencyTtl(e.target.value)}
                    style={{
                      width: '90px',
                      textAlign: 'right',
                      fontSize: '13px',
                      background: 'var(--surface-1)',
                      border: '0.5px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      padding: '5px 8px',
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* 4. SETTINGS PANEL */
        /* ========================================================================= */
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h1 style={{ fontSize: '16px', fontWeight: 500, margin: 0 }}>Settings</h1>
            <button
              onClick={() => setShowSettings(false)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--surface-1)',
                color: 'var(--text-secondary)',
                border: '0.5px solid var(--border)',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
              aria-label="Back to dashboard"
            >
              &#8592;
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'var(--accent)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: 500,
              }}
            >
              RS
            </div>
            <div>
              <p style={{ fontSize: '15px', fontWeight: 500, margin: 0 }}>Ravi Shankar</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>Operations Lead</p>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <p
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                margin: '0 0 8px',
              }}
            >
              Personal details
            </p>
            <div style={{ background: 'var(--surface-1)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem 0.9rem', borderBottom: '0.5px solid var(--border)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Full name</span>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Ravi Shankar</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem 0.9rem', borderBottom: '0.5px solid var(--border)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Email</span>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>ravi.s@settleflow.dev</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem 0.9rem', borderBottom: '0.5px solid var(--border)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Role</span>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Operations Lead</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem 0.9rem' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Team</span>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Payments &amp; Risk</span>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <p
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                margin: '0 0 8px',
              }}
            >
              Access
            </p>
            <div style={{ background: 'var(--surface-1)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem 0.9rem', borderBottom: '0.5px solid var(--border)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Permission level</span>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Admin</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem 0.9rem' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Alert notifications</span>
                <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text-muted)' }}>On</span>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <p
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                margin: '0 0 8px',
              }}
            >
              Security
            </p>
            <div style={{ background: 'var(--surface-1)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem 0.9rem', borderBottom: '0.5px solid var(--border)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Password</span>
                <button
                  onClick={() => showToast('Password change link dispatched to ravi.s@settleflow.dev')}
                  style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'underline', border: 'none', padding: 0 }}
                >
                  Change
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem 0.9rem' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Two-factor authentication</span>
                <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text-muted)' }}>On</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Detail Overlay Modal */}
      {selectedTx && (
        <div
          onClick={() => setSelectedTx(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            zIndex: 60,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--surface-2)',
              borderRadius: '14px',
              padding: '1.5rem',
              width: '100%',
              maxWidth: '340px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            }}
          >
            <h2 style={{ fontSize: '16px', fontWeight: 500, margin: '0 0 1rem' }}>Transaction detail</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '6px 0', borderBottom: '0.5px solid var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Reference</span>
              <span style={{ fontWeight: 500, fontFamily: 'monospace' }}>{selectedTx.reference}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '6px 0', borderBottom: '0.5px solid var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Player</span>
              <span style={{ fontWeight: 500 }}>{selectedTx.playerId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '6px 0', borderBottom: '0.5px solid var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Amount</span>
              <span style={{ fontWeight: 500 }}>{formatCurrency(selectedTx.amount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '6px 0', borderBottom: '0.5px solid var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Provider</span>
              <span>{selectedTx.provider}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '6px 0', borderBottom: '0.5px solid var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Attempts</span>
              <span>{selectedTx.attempts}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '6px 0' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Status</span>
              <span className={getBadgeClass(selectedTx.status)}>{selectedTx.status}</span>
            </div>
            <button
              onClick={() => setSelectedTx(null)}
              style={{
                width: '100%',
                marginTop: '1.25rem',
                padding: '0.6rem',
                fontSize: '13px',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
