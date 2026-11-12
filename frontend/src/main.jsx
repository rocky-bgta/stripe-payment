import React, { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const money = (cents) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
}).format(cents / 100);

function App() {
  const [amount, setAmount] = useState('10.00');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [payments, setPayments] = useState([]);
  const [current, setCurrent] = useState(null);
  const [historyError, setHistoryError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/payments?page=0&size=20');
      if (!response.ok) throw new Error('Unable to load payment history');
      const result = await response.json();
      setPayments(result.content || []);
      setHistoryError('');
    } catch (error) {
      setHistoryError(error.message);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (params.has('cancelled')) {
      setMessage('Checkout cancelled. No payment was confirmed.');
    }
    let active = true;
    let timer;
    async function update() {
      await refresh();
      if (!sessionId) return;
      try {
        const response = await fetch('/api/payments/by-session/' + encodeURIComponent(sessionId));
        if (!response.ok) throw new Error('Could not retrieve payment status');
        const payment = await response.json();
        if (!active) return;
        setCurrent(payment);
        if (payment.status !== 'PENDING') {
          clearInterval(timer);
        }
      } catch (error) {
        if (active) setMessage(error.message);
      }
    }
    update();
    timer = setInterval(update, 3000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [refresh]);

  async function pay(event) {
    event.preventDefault();
    const cents = Math.round(Number(amount) * 100);
    if (!amount.trim() || !Number.isSafeInteger(cents) || cents < 50 || cents > 10000000) {
      setMessage('Enter an amount between $0.50 and $100,000.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: cents, currency: 'usd' })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Checkout failed');
      window.location.assign(result.url);
    } catch (error) {
      setMessage(error.message);
      setLoading(false);
    }
  }

  return (
    <main className="dashboard">
      <header>
        <div>
          <p className="eyebrow">PAYMENTS / SANDBOX</p>
          <h1>Payment Dashboard</h1>
          <p>Test payments only. No real money is charged.</p>
        </div>
        <span className="environment">Test mode</span>
      </header>

      <section className="summary">
        <article>
          <span>Total transactions (latest 20)</span>
          <strong>{payments.length}</strong>
        </article>
        <article>
          <span>Successful (latest 20)</span>
          <strong>{payments.filter((p) => p.status === 'SUCCESS').length}</strong>
        </article>
        <article>
          <span>Pending (latest 20)</span>
          <strong>{payments.filter((p) => p.status === 'PENDING').length}</strong>
        </article>
      </section>

      <section className="panel">
        <h2>Create test payment</h2>
        <form onSubmit={pay}>
          <label htmlFor="amount">Amount (USD)</label>
          <div className="form-row">
            <input
              id="amount"
              type="number"
              min="0.50"
              max="100000"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
            <button disabled={loading} type="submit">
              {loading ? 'Opening Checkout...' : 'Pay with Stripe'}
            </button>
          </div>
        </form>
        <p className="hint">Test card: 4242 4242 4242 4242</p>
        {message && <p role="alert" className="notice">{message}</p>}
        {current && (
          <p className="notice">
            Latest checkout: <strong>{current.status}</strong>
            {' — '}{money(current.amount)}
          </p>
        )}
      </section>

      <section className="panel">
        <div className="section-heading">
          <h2>Recent transactions</h2>
          <button className="secondary" type="button" onClick={refresh}>
            Refresh
          </button>
        </div>
        {historyError && <p role="alert">{historyError}</p>}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 && (
                <tr><td colSpan="4">No payments yet.</td></tr>
              )}
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td title={payment.id}>{payment.id.slice(0, 12)}…</td>
                  <td>{money(payment.amount)}</td>
                  <td><span className={'status ' + payment.status.toLowerCase()}>{payment.status}</span></td>
                  <td>{new Date(payment.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
