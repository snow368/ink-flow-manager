import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type UserRecord } from '../db';

export default function PaymentSettingsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [provider, setProvider] = useState<UserRecord['paymentProvider']>('stripe_connect');
  const [enabledMethods, setEnabledMethods] = useState<Array<'stripe_connect' | 'manual_link' | 'bank_transfer' | 'cash'>>(['stripe_connect', 'manual_link', 'bank_transfer', 'cash']);
  const [currency, setCurrency] = useState('USD');
  const [defaultDeposit, setDefaultDeposit] = useState('');
  const [template, setTemplate] = useState('');
  const [stripeAccountId, setStripeAccountId] = useState('');
  const [bankInstructions, setBankInstructions] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const current = localStorage.getItem('inkflow_current_user');
    if (!current) return;
    db.users.get(current).then((u) => {
      if (!u) return;
      setUser(u);
      setProvider(u.paymentProvider || 'stripe_connect');
      setEnabledMethods(u.enabledPaymentMethods?.length ? u.enabledPaymentMethods : ['stripe_connect', 'manual_link', 'bank_transfer', 'cash']);
      setCurrency((u.paymentCurrency || 'USD').toUpperCase());
      setDefaultDeposit(u.paymentDefaultDeposit || '');
      setTemplate(
        u.paymentLinkTemplate ||
          'https://pay.example.com/checkout?amount={amount}&currency={currency}&lead={leadId}&client={client}'
      );
      setStripeAccountId(u.stripeAccountId || '');
      setBankInstructions(u.bankTransferInstructions || '');
    });
  }, []);

  const save = async () => {
    if (!user) return;
    await db.users.update(user.id, {
      paymentProvider: provider,
      enabledPaymentMethods: enabledMethods,
      paymentCurrency: currency.toUpperCase(),
      paymentDefaultDeposit: defaultDeposit.trim(),
      paymentLinkTemplate: template.trim(),
      stripeAccountId: stripeAccountId.trim() || undefined,
      bankTransferInstructions: bankInstructions.trim() || undefined,
    });
    setMsg('Payment settings saved.');
    window.setTimeout(() => setMsg(''), 1500);
  };

  const connectStripe = async () => {
    if (!user) return;
    try {
      const base = window.location.origin;
      const r = await fetch('http://localhost:8787/api/stripe/connect/account-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistId: user.id,
          email: user.email,
          country: 'US',
          refreshUrl: `${base}/payment-settings`,
          returnUrl: `${base}/payment-settings?stripe=connected`,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || 'connect failed');
      if (data.accountId) {
        setStripeAccountId(data.accountId);
        await db.users.update(user.id, { stripeAccountId: data.accountId, paymentProvider: 'stripe_connect' });
      }
      if (data.url) window.open(data.url, '_blank');
      setMsg('Stripe onboarding link created.');
    } catch (e: any) {
      setMsg(`Stripe connect failed: ${e?.message || 'unknown error'}`);
    } finally {
      window.setTimeout(() => setMsg(''), 2200);
    }
  };

  if (!user) return <div style={{ padding: 20, color: 'white' }}>Please log in</div>;

  const toggleMethod = (method: 'stripe_connect' | 'manual_link' | 'bank_transfer' | 'cash') => {
    setEnabledMethods(prev => prev.includes(method) ? prev.filter(m => m !== method) : [...prev, method]);
  };

  return (
    <div style={{ padding: 20, color: 'white', maxWidth: 820, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800 }}>Payment Settings</h2>
        <button onClick={() => navigate('/me')} style={backBtn}>Back</button>
      </div>

      <div style={card}>
        <p style={label}>Provider</p>
        <select value={provider} onChange={e => setProvider(e.target.value as UserRecord['paymentProvider'])} style={input}>
          <option value="stripe_connect">Stripe Connect Express</option>
          <option value="square">Square</option>
          <option value="manual">Manual Link</option>
        </select>
      </div>

      <div style={card}>
        <p style={label}>Accepted Methods</p>
        <label style={row}><input type="checkbox" checked={enabledMethods.includes('stripe_connect')} onChange={() => toggleMethod('stripe_connect')} /> Stripe Connect</label>
        <label style={row}><input type="checkbox" checked={enabledMethods.includes('manual_link')} onChange={() => toggleMethod('manual_link')} /> Manual Link</label>
        <label style={row}><input type="checkbox" checked={enabledMethods.includes('bank_transfer')} onChange={() => toggleMethod('bank_transfer')} /> Bank Transfer</label>
        <label style={row}><input type="checkbox" checked={enabledMethods.includes('cash')} onChange={() => toggleMethod('cash')} /> Cash (In Studio)</label>
      </div>

      {provider === 'stripe_connect' && (
        <div style={card}>
          <p style={label}>Stripe connected account</p>
          <input value={stripeAccountId} onChange={e => setStripeAccountId(e.target.value)} placeholder="acct_xxx" style={input} />
          <button onClick={connectStripe} style={{ ...saveBtn, marginTop: 8 }}>Connect Stripe Express</button>
        </div>
      )}

      <div style={card}>
        <p style={label}>Currency</p>
        <input value={currency} onChange={e => setCurrency(e.target.value)} placeholder="USD" style={input} />
      </div>

      <div style={card}>
        <p style={label}>Default deposit amount (optional)</p>
        <input value={defaultDeposit} onChange={e => setDefaultDeposit(e.target.value)} placeholder="e.g. 100" style={input} />
      </div>

      <div style={card}>
        <p style={label}>Payment link template (manual_link)</p>
        <textarea value={template} onChange={e => setTemplate(e.target.value)} rows={4} style={{ ...input, resize: 'vertical' }}
          placeholder="https://paypal.me/yourstudio/{amount} or https://revolut.me/yourname/{amount}" />
        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
          Placeholders: {'{amount}'}, {'{currency}'}, {'{leadId}'}, {'{client}'}, {'{artistId}'}.
        </p>
        <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>US artists: PayPal.me / Zelle / Venmo. EU artists: Wise / Revolut / SEPA. System generates the payment link with the lead's amount. Client pays → uploads proof → you approve in Payment History.</p>
      </div>

      <div style={card}>
        <p style={label}>Bank transfer instructions</p>
        <textarea
          value={bankInstructions}
          onChange={e => setBankInstructions(e.target.value)}
          rows={3}
          style={{ ...input, resize: 'vertical' }}
          placeholder="Bank name, account holder, account number/IBAN, transfer note format."
        />
      </div>

      <button onClick={save} style={saveBtn}>Save</button>
      {msg && <p style={{ fontSize: 12, color: '#86efac', marginTop: 8 }}>{msg}</p>}
    </div>
  );
}

const card: React.CSSProperties = {
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: 12,
  padding: 12,
  marginBottom: 10,
};

const label: React.CSSProperties = {
  fontSize: 13,
  color: '#cbd5e1',
  marginBottom: 8,
};

const input: React.CSSProperties = {
  width: '100%',
  padding: '9px 10px',
  borderRadius: 8,
  border: '1px solid #334155',
  background: '#0f172a',
  color: 'white',
  boxSizing: 'border-box',
};

const backBtn: React.CSSProperties = {
  border: '1px solid #334155',
  background: 'transparent',
  color: '#94a3b8',
  borderRadius: 8,
  padding: '7px 10px',
  cursor: 'pointer',
};

const saveBtn: React.CSSProperties = {
  border: 'none',
  background: '#e11d48',
  color: 'white',
  borderRadius: 10,
  padding: '10px 14px',
  cursor: 'pointer',
  fontWeight: 700,
};

const row: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  alignItems: 'center',
  marginBottom: 6,
  fontSize: 13,
  color: '#cbd5e1',
};
