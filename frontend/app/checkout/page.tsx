'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';

interface TxDetail {
  ref: string;
  amount: string;
  date: string;
  method: string;
  statusText: string;
  statusClass: 'success' | 'warning' | 'danger';
}

const initialHistory: TxDetail[] = [
  { ref: 'TXN-88213', amount: '€50.00', date: 'Today, 2:41 PM', method: 'Card', statusText: 'Successful', statusClass: 'success' },
  { ref: 'TXN-88209', amount: '€120.00', date: 'Today, 1:05 PM', method: 'Card', statusText: 'Processing', statusClass: 'warning' },
  { ref: 'TXN-88147', amount: '€75.50', date: 'Yesterday, 6:18 PM', method: 'Bank transfer', statusText: 'Failed', statusClass: 'danger' },
  { ref: 'TXN-88098', amount: '€30.00', date: 'Yesterday, 11:02 AM', method: 'Card', statusText: 'Successful', statusClass: 'success' },
];

export default function UserCheckoutPage() {
  const [tab, setTab] = useState<'deposit' | 'history'>('deposit');
  const [viewSettings, setViewSettings] = useState(false);
  const [balance, setBalance] = useState(312.40);
  const [amount, setAmount] = useState('50.00');
  const [method, setMethod] = useState<'Card' | 'Bank transfer' | 'Wallet'>('Card');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');

  // Status for deposit flow: 'form' | 'processing' | 'success' | 'fail'
  const [depositState, setDepositState] = useState<'form' | 'processing' | 'success' | 'fail'>('form');

  // Modal overlay detail
  const [selectedTx, setSelectedTx] = useState<TxDetail | null>(null);

  async function handlePay() {
    setDepositState('processing');
    const depositAmt = parseFloat(amount) || 50.00;

    try {
      // Attempt call to Spring Boot backend orchestrator
      const tx = await api.createTransaction({
        playerId: 'player_101',
        amount: depositAmt,
        currency: 'EUR',
        type: 'DEPOSIT',
      });

      if (tx.status === 'SETTLED') {
        setBalance((prev) => prev + depositAmt);
        setDepositState('success');
      } else if (tx.status === 'FAILED') {
        setDepositState('fail');
      } else {
        // RETRYING or PROCESSING
        setBalance((prev) => prev + depositAmt);
        setDepositState('success');
      }
    } catch {
      // Fallback simulation for offline demo
      setTimeout(() => {
        setBalance((prev) => prev + depositAmt);
        setDepositState('success');
      }, 1500);
    }
  }

  function resetDeposit() {
    setDepositState('form');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          background: 'var(--surface-2)',
          border: '0.5px solid var(--border)',
          borderRadius: '16px',
          padding: '1.75rem',
        }}
      >
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', margin: 0 }}>SettleFlow</p>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Link href="/" style={{ fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none' }}>
              Sign out
            </Link>
            <button
              onClick={() => setViewSettings(!viewSettings)}
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
              AK
            </button>
          </div>
        </div>

        {!viewSettings ? (
          <div>
            {/* Balance Card */}
            <div
              style={{
                background: 'var(--surface-1)',
                border: '0.5px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '0.9rem 1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 2px' }}>Available balance</p>
                <p style={{ fontSize: '22px', fontWeight: 500, margin: 0 }}>€{balance.toFixed(2)}</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div
              style={{
                display: 'flex',
                gap: '4px',
                background: 'var(--surface-1)',
                borderRadius: 'var(--radius)',
                padding: '4px',
                marginBottom: '1.5rem',
              }}
            >
              <div
                onClick={() => {
                  setTab('deposit');
                  resetDeposit();
                }}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: '13px',
                  padding: '0.5rem 0',
                  borderRadius: '7px',
                  cursor: 'pointer',
                  background: tab === 'deposit' ? 'var(--surface-2)' : 'transparent',
                  color: tab === 'deposit' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: tab === 'deposit' ? 500 : 400,
                  boxShadow: tab === 'deposit' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                Deposit
              </div>
              <div
                onClick={() => setTab('history')}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: '13px',
                  padding: '0.5rem 0',
                  borderRadius: '7px',
                  cursor: 'pointer',
                  background: tab === 'history' ? 'var(--surface-2)' : 'transparent',
                  color: tab === 'history' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: tab === 'history' ? 500 : 400,
                  boxShadow: tab === 'history' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                My transactions
              </div>
            </div>

            {/* DEPOSIT TAB */}
            {tab === 'deposit' && (
              <div>
                {depositState === 'form' && (
                  <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 500, margin: '0 0 1.25rem' }}>Deposit funds</h1>

                    <div style={{ marginBottom: '1.1rem' }}>
                      <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Amount
                      </label>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          background: 'var(--surface-1)',
                          border: '0.5px solid var(--border)',
                          borderRadius: 'var(--radius)',
                          padding: '0.6rem 0.9rem',
                        }}
                      >
                        <span style={{ fontSize: '20px', color: 'var(--text-secondary)', marginRight: '6px' }}>€</span>
                        <input
                          type="text"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            fontSize: '20px',
                            width: '100%',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            padding: 0,
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '1.1rem' }}>
                      <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Payment method
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {(['Card', 'Bank transfer', 'Wallet'] as const).map((m) => (
                          <div
                            key={m}
                            onClick={() => setMethod(m)}
                            style={{
                              flex: 1,
                              border: method === m ? '0.5px solid var(--accent)' : '0.5px solid var(--border)',
                              borderRadius: 'var(--radius)',
                              padding: '0.6rem',
                              textAlign: 'center',
                              fontSize: '13px',
                              cursor: 'pointer',
                              background: method === m ? 'var(--bg-success)' : 'var(--surface-1)',
                              color: method === m ? 'var(--text-success)' : 'var(--text-primary)',
                              fontWeight: method === m ? 500 : 400,
                            }}
                          >
                            {m}
                          </div>
                        ))}
                      </div>
                    </div>

                    {method === 'Card' && (
                      <div style={{ marginBottom: '1.1rem' }}>
                        <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                          Card number
                        </label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          style={{
                            width: '100%',
                            background: 'var(--surface-1)',
                            border: '0.5px solid var(--border)',
                            borderRadius: 'var(--radius)',
                            padding: '0.65rem 0.9rem',
                            fontSize: '14px',
                            color: 'var(--text-primary)',
                            outline: 'none',
                          }}
                        />
                      </div>
                    )}

                    <button
                      onClick={handlePay}
                      style={{
                        width: '100%',
                        marginTop: '0.5rem',
                        background: 'var(--accent)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 'var(--radius)',
                        padding: '0.85rem',
                        fontSize: '15px',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      Deposit €{amount || '0.00'}
                    </button>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.9rem' }}>
                      Secured &middot; processed instantly
                    </p>
                  </div>
                )}

                {depositState === 'processing' && (
                  <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <div className="spinner" />
                    <h2 style={{ fontSize: '16px', fontWeight: 500, margin: '0 0 4px' }}>Processing your deposit</h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>This usually takes a few seconds</p>
                  </div>
                )}

                {depositState === 'success' && (
                  <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <div style={{ fontSize: '32px', marginBottom: '0.75rem', color: 'var(--text-success)' }}>&#10003;</div>
                    <h2 style={{ fontSize: '16px', fontWeight: 500, margin: '0 0 4px' }}>Deposit successful</h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                      €{amount} has been added to your balance
                    </p>
                    <button
                      onClick={() => setTab('history')}
                      style={{
                        background: 'transparent',
                        color: 'var(--accent)',
                        border: '0.5px solid var(--border)',
                        marginTop: '1.25rem',
                        width: '100%',
                        padding: '0.75rem',
                      }}
                    >
                      View my transactions
                    </button>
                  </div>
                )}

                {depositState === 'fail' && (
                  <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <div style={{ fontSize: '32px', marginBottom: '0.75rem', color: 'var(--text-danger)' }}>&#10007;</div>
                    <h2 style={{ fontSize: '16px', fontWeight: 500, margin: '0 0 4px' }}>Deposit failed</h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                      We couldn&apos;t process this payment. No funds were taken.
                    </p>
                    <button
                      onClick={resetDeposit}
                      style={{
                        width: '100%',
                        marginTop: '1.25rem',
                        background: 'var(--accent)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 'var(--radius)',
                        padding: '0.85rem',
                      }}
                    >
                      Try again
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* HISTORY TAB */}
            {tab === 'history' && (
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: 500, margin: '0 0 1.25rem' }}>My transactions</h1>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {initialHistory.map((item) => (
                    <div
                      key={item.ref}
                      onClick={() => setSelectedTx(item)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'var(--surface-1)',
                        border: '0.5px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        padding: '0.7rem 0.9rem',
                        cursor: 'pointer',
                      }}
                    >
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 500, margin: '0 0 2px' }}>{item.amount}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                          {item.date} &middot; {item.method}
                        </p>
                      </div>
                      <span
                        style={{
                          fontSize: '12px',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          whiteSpace: 'nowrap',
                          background:
                            item.statusClass === 'success'
                              ? 'var(--bg-success)'
                              : item.statusClass === 'danger'
                              ? 'var(--bg-danger)'
                              : 'var(--bg-warning)',
                          color:
                            item.statusClass === 'success'
                              ? 'var(--text-success)'
                              : item.statusClass === 'danger'
                              ? 'var(--text-danger)'
                              : 'var(--text-warning)',
                        }}
                      >
                        {item.statusText}
                      </span>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0 0' }}>
                  Showing your last 4 transactions
                </p>
              </div>
            )}
          </div>
        ) : (
          /* SETTINGS PANEL */
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h1 style={{ fontSize: '16px', fontWeight: 500, margin: 0 }}>Settings</h1>
              <button
                onClick={() => setViewSettings(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--surface-1)',
                  color: 'var(--text-secondary)',
                  border: '0.5px solid var(--border)',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                }}
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
                AK
              </div>
              <div>
                <p style={{ fontSize: '15px', fontWeight: 500, margin: 0 }}>Aditi Kumar</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>Player ID: player_101</p>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.7rem 0.9rem', borderBottom: '0.5px solid var(--border)', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Full name</span>
                  <span style={{ fontWeight: 500 }}>Aditi Kumar</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.7rem 0.9rem', borderBottom: '0.5px solid var(--border)', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Email</span>
                  <span style={{ fontWeight: 500 }}>aditi.k@example.com</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.7rem 0.9rem', borderBottom: '0.5px solid var(--border)', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Phone</span>
                  <span style={{ fontWeight: 500 }}>+91 98xxxxxx12</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.7rem 0.9rem', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Country</span>
                  <span style={{ fontWeight: 500 }}>India</span>
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
                Preferences
              </p>
              <div style={{ background: 'var(--surface-1)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.7rem 0.9rem', borderBottom: '0.5px solid var(--border)', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Default currency</span>
                  <span style={{ fontWeight: 500 }}>EUR</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.7rem 0.9rem', borderBottom: '0.5px solid var(--border)', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Default payment method</span>
                  <span style={{ fontWeight: 500 }}>Card</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.7rem 0.9rem', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Notifications</span>
                  <span style={{ color: 'var(--text-muted)' }}>On</span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.7rem 0.9rem', borderBottom: '0.5px solid var(--border)', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Password</span>
                  <button style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'underline', border: 'none', padding: 0 }}>
                    Change
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.7rem 0.9rem', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Two-factor authentication</span>
                  <span style={{ color: 'var(--text-muted)' }}>Off</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Detail Overlay Modal */}
      {selectedTx && (
        <div
          onClick={() => setSelectedTx(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--surface-2)',
              borderRadius: '14px',
              padding: '1.5rem',
              width: '100%',
              maxWidth: '320px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            }}
          >
            <h2 style={{ fontSize: '16px', fontWeight: 500, margin: '0 0 1rem' }}>Transaction detail</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '6px 0', borderBottom: '0.5px solid var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Reference</span>
              <span style={{ fontWeight: 500 }}>{selectedTx.ref}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '6px 0', borderBottom: '0.5px solid var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Amount</span>
              <span style={{ fontWeight: 500 }}>{selectedTx.amount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '6px 0', borderBottom: '0.5px solid var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Date</span>
              <span>{selectedTx.date}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '6px 0', borderBottom: '0.5px solid var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Method</span>
              <span>{selectedTx.method}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '6px 0' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Status</span>
              <span
                style={{
                  fontSize: '12px',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background:
                    selectedTx.statusClass === 'success'
                      ? 'var(--bg-success)'
                      : selectedTx.statusClass === 'danger'
                      ? 'var(--bg-danger)'
                      : 'var(--bg-warning)',
                  color:
                    selectedTx.statusClass === 'success'
                      ? 'var(--text-success)'
                      : selectedTx.statusClass === 'danger'
                      ? 'var(--text-danger)'
                      : 'var(--text-warning)',
                }}
              >
                {selectedTx.statusText}
              </span>
            </div>
            <button
              onClick={() => setSelectedTx(null)}
              style={{
                width: '100%',
                marginTop: '1rem',
                background: 'transparent',
                border: '0.5px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '0.6rem',
                fontSize: '13px',
                cursor: 'pointer',
                color: 'var(--text-primary)',
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
