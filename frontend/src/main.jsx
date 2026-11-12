import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

function App() {
  const [amount, setAmount] = useState('10.00');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (params.has('cancelled')) {
      setMessage('Checkout cancelled. No payment was confirmed.');
    }
    if (!sessionId) return;

    let active = true;
    async function loadStatus() {
      try {
        const response = await fetch('/api/payments/by-session/' + encodeURIComponent(sessionId));
        if (!response.ok) throw new Error('Could not retrieve payment');
        const result = await response.json();
        if (active) setPayment(result);
      } catch (error) {
        if (active) setMessage(error.message);
      }
    }
    loadStatus();
    const timer = setInterval(loadStatus, 3000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  async function pay(event) {
    event.preventDefault();
    const cents = Math.round(Number(amount) * 100);
    if (!Number.isSafeInteger(cents) || cents < 50 || cents > 10000000) {
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
    <main>
      <h1>Stripe Sandbox Payment</h1>
      <p>Test payments only. No real money is charged.</p>
      <form onSubmit={pay}>
        <label htmlFor="amount">Amount (USD)</label>
        <input id="amount" type="number" min="0.50" max="100000" step="0.01"
          value={amount} onChange={(event) => setAmount(event.target.value)} />
        <button disabled={loading}>{loading ? 'Opening Checkout...' : 'Pay with Stripe'}</button>
      </form>
      {message && <p role="alert">{message}</p>}
      {payment && <p>Payment status: <strong>{payment.status}</strong></p>}
      <p>Test card: 4242 4242 4242 4242</p>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
