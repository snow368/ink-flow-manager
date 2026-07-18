import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type UserRecord } from '../db';

export default function PaymentSettingsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [provider, setProvider] = useState<UserRecord['paymentProvider']>('manual');
  const [enabledMethods, setEnabledMethods] = useState<Array<'manual_link' | 'bank_transfer' | 'cash' | 'paypal'>>(['manual_link', 'bank_transfer', 'cash']);
  const [currency, setCurrency] = useState('USD');
  const [defaultDeposit, setDefaultDeposit] = useState('');
  const [template, setTemplate] = useState('');
  const [stripeAccountId, setStripeAccountId] = useState('');
  const [bankInstructions, setBankInstructions] = useState('');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const current = localStorage.getItem('inkflow_current_user');
    if (!current) return;
    db.users.get(current).then((u) => {
      if (!u) return;
      setUser(u);
      setProvider(u.paymentProvider || 'manual');
      setEnabledMethods(((u.enabledPaymentMethods || []).filter((m: string) => m !== 'stripe_connect') as Array<'manual_link' | 'bank_transfer' | 'cash' | 'paypal'>));
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
    setSaving(true);
    await db.users.update(user.id, {
      paymentProvider: provider,
      enabledPaymentMethods: enabledMethods,
      paymentCurrency: currency.toUpperCase(),
      paymentDefaultDeposit: defaultDeposit.trim(),
      paymentLinkTemplate: template.trim(),
      stripeAccountId: stripeAccountId.trim() || undefined,
      bankTransferInstructions: bankInstructions.trim() || undefined,
    });

    // Sync to Worker so booking page can read depositAmount + currency
    const backendUrl = localStorage.getItem('inkflow_backend_url') || 'http://localhost:8787';
    const apiSecret = localStorage.getItem('inkflow_api_secret') || '';
    try {
      await fetch(`${backendUrl}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-secret': apiSecret },
        body: JSON.stringify({
          artistId: user.id,
          settings: {
            paymentLinkTemplate: template.trim(),
            depositAmount: defaultDeposit.trim(),
            paymentCurrency: currency.toUpperCase(),
          },
        }),
      });
      setMsg('Payment settings saved & synced.');
    } catch {
      setMsg('Saved locally (sync failed)');
    }
    setSaving(false);
    window.setTimeout(() => setMsg(''), 2000);
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

  const toggleMethod = (method: 'manual_link' | 'bank_transfer' | 'cash' | 'paypal') => {
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
          <option value="manual">Payment Link (PayPal / Stripe / Square / etc.)</option>
          <option value="square">Square</option>
        </select>
      </div>

      <div style={card}>
        <p style={label}>Accepted Methods</p>
        <label style={row}><input type="checkbox" checked={enabledMethods.includes('manual_link')} onChange={() => toggleMethod('manual_link')} /> Stripe Link / Payment Link</label>
        <label style={row}><input type="checkbox" checked={enabledMethods.includes('bank_transfer')} onChange={() => toggleMethod('bank_transfer')} /> Bank Transfer</label>
        <label style={row}><input type="checkbox" checked={enabledMethods.includes('cash')} onChange={() => toggleMethod('cash')} /> Cash (In Studio)</label>
        <label style={row}><input type="checkbox" checked={enabledMethods.includes('paypal')} onChange={() => toggleMethod('paypal')} /> PayPal</label>
      </div>

      {/* Stripe Connect disabled — requires platform Stripe account (Stripe Atlas ~$500).
           Uncomment when ready:
           <div style={card}>
             <p style={label}>Stripe connected account</p>
             <input value={stripeAccountId} onChange={e => setStripeAccountId(e.target.value)} placeholder="acct_xxx" style={input} />
             <button onClick={connectStripe} style={{ ...saveBtn, marginTop: 8 }}>Connect Stripe Express</button>
           </div>
      */}

      {enabledMethods.includes('paypal') && (
        <div style={{ ...card, border: '1px solid #3b82f680' }}>
          <p style={{ ...label, fontSize: 15, fontWeight: 700, color: '#60a5fa' }}>How to get your PayPal.me link</p>
          <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.7 }}>
            <p style={{ marginBottom: 8 }}>Follow these steps (takes 2 min, free):</p>
            <ol style={{ paddingLeft: 18, margin: '0 0 8px' }}>
              <li style={{ marginBottom: 4 }}>Open <strong>paypal.com</strong> and log in (or sign up free)</li>
              <li style={{ marginBottom: 4 }}>Go to <strong>Settings {'>'} PayPal.me</strong> (or visit <strong>paypal.me</strong>)</li>
              <li style={{ marginBottom: 4 }}>Click <strong>"Create your PayPal.Me link"</strong></li>
              <li style={{ marginBottom: 4 }}>Pick a username — e.g. <strong>paypal.me/YourStudioName</strong></li>
              <li style={{ marginBottom: 4 }}>Copy that link and paste it in the <strong>Payment link template</strong> field above with {'{'}amount{'}'} at the end</li>
            </ol>
            <p style={{ fontSize: 12, color: '#94a3b8' }}>Example: <code style={{ background: '#0f172a', padding: '2px 6px', borderRadius: 4 }}>https://paypal.me/YourStudio/&#123;amount&#125;</code></p>
            <p style={{ fontSize: 12, color: '#fbbf24', marginTop: 6 }}>Client clicks the link → PayPal opens with the amount pre-filled → pays → uploads screenshot → you confirm.</p>
          </div>
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
        <p style={label}>Payment link template (manual_link / PayPal)</p>
        <textarea value={template} onChange={e => setTemplate(e.target.value)} rows={4} style={{ ...input, resize: 'vertical' }}
          placeholder="https://paypal.me/yourstudio/{amount} or https://revolut.me/yourname/{amount}" />
        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
          Placeholders: {'{amount}'}, {'{currency}'}, {'{leadId}'}, {'{client}'}, {'{artistId}'}.
        </p>
      </div>

      {enabledMethods.includes('manual_link') && (
        <div style={{ ...card, border: '1px solid #6366f180' }}>
          <p style={{ ...label, fontSize: 15, fontWeight: 700, color: '#818cf8' }}>Manual Link — Setup Guide</p>
          <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.7 }}>
            <p style={{ marginBottom: 8 }}>Pick your platform, get your personal link, paste it above:</p>
            <p style={{ fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>US / Canada:</p>
            <ul style={{ paddingLeft: 18, margin: '0 0 10px', fontSize: 12 }}>
              <li><strong>PayPal.me</strong> — paypal.com → Settings → PayPal.me → create username</li>
              <li><strong>Zelle</strong> — your bank app → Zelle → use your phone/email as ID</li>
              <li><strong>Venmo</strong> — venmo.com → profile → get @username</li>
              <li><strong>Cash App</strong> — cash.app → profile → get $cashtag</li>
            </ul>
            <p style={{ fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>Europe / Global:</p>
            <ul style={{ paddingLeft: 18, margin: '0 0 10px', fontSize: 12 }}>
              <li><strong>Wise</strong> — wise.com → create payment link → paste above</li>
              <li><strong>Revolut</strong> — app → Payments → create @revtag</li>
              <li><strong>SEPA</strong> — use Bank Transfer method instead (below)</li>
            </ul>
            <p style={{ fontSize: 11, color: '#64748b' }}>Template example: <code style={{ background: '#0f172a', padding: '2px 6px', borderRadius: 4 }}>https://paypal.me/YourStudio/&#123;amount&#125;</code> — system replaces {'{'}amount{'}'} with the deposit amount.</p>
          </div>
        </div>
      )}

      {enabledMethods.includes('paypal') && (
        <div style={{ ...card, border: '1px solid #3b82f680' }}>
          <p style={{ ...label, fontSize: 15, fontWeight: 700, color: '#60a5fa' }}>PayPal — Setup Guide</p>
          <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.7 }}>
            <p style={{ marginBottom: 8 }}>Follow these steps (takes 2 min, free):</p>
            <ol style={{ paddingLeft: 18, margin: '0 0 8px' }}>
              <li style={{ marginBottom: 4 }}>Open <strong>paypal.com</strong> and log in (or sign up free)</li>
              <li style={{ marginBottom: 4 }}>Go to <strong>Settings → PayPal.me</strong> (or visit <strong>paypal.me</strong>)</li>
              <li style={{ marginBottom: 4 }}>Click <strong>"Create your PayPal.Me link"</strong></li>
              <li style={{ marginBottom: 4 }}>Pick a username — e.g. <strong>paypal.me/YourStudioName</strong></li>
              <li style={{ marginBottom: 4 }}>Paste that link in the <strong>Payment link template</strong> field above with {'{'}amount{'}'} at the end</li>
            </ol>
            <p style={{ fontSize: 12, color: '#94a3b8' }}>Example: <code style={{ background: '#0f172a', padding: '2px 6px', borderRadius: 4 }}>https://paypal.me/YourStudio/&#123;amount&#125;</code></p>
            <p style={{ fontSize: 12, color: '#fbbf24', marginTop: 6 }}>Client clicks → PayPal opens with amount pre-filled → pays → uploads screenshot → you confirm.</p>
          </div>
        </div>
      )}

      <div style={card}>
        <p style={label}>Bank transfer instructions</p>
        <textarea
          value={bankInstructions}
          onChange={e => setBankInstructions(e.target.value)}
          rows={4}
          style={{ ...input, resize: 'vertical' }}
          placeholder="Bank name, account holder, account number/IBAN, transfer note format."
        />
      </div>

      {enabledMethods.includes('bank_transfer') && (
        <div style={{ ...card, border: '1px solid #22c55e80' }}>
          <p style={{ ...label, fontSize: 15, fontWeight: 700, color: '#4ade80' }}>Bank Transfer — Setup Guide</p>
          <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.7 }}>
            <p style={{ marginBottom: 8 }}>Fill in the bank details above. Copy this format:</p>
            <p style={{ fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>US (ACH):</p>
            <ul style={{ paddingLeft: 18, margin: '0 0 10px', fontSize: 12 }}>
              <li>Bank Name: [your bank]</li>
              <li>Account Holder: [your name / studio name]</li>
              <li>Routing Number: [9 digits]</li>
              <li>Account Number: [your account]</li>
            </ul>
            <p style={{ fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>Europe (SEPA):</p>
            <ul style={{ paddingLeft: 18, margin: '0 0 10px', fontSize: 12 }}>
              <li>Bank Name: [your bank]</li>
              <li>Account Holder: [your name / studio name]</li>
              <li>IBAN: [your IBAN]</li>
              <li>BIC/SWIFT: [your bank code]</li>
            </ul>
            <p style={{ fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>Other countries:</p>
            <ul style={{ paddingLeft: 18, margin: '0 0 10px', fontSize: 12 }}>
              <li>Include all local bank identifiers (sort code, BSB, IFSC, etc.)</li>
              <li>Add a note: "Please include your name in the transfer reference so we can match it."</li>
            </ul>
            <p style={{ fontSize: 11, color: '#fbbf24' }}>Client transfers → uploads screenshot/receipt → you verify → mark as paid.</p>
          </div>
        </div>
      )}

      {enabledMethods.includes('cash') && (
        <div style={{ ...card, border: '1px solid #f9731680' }}>
          <p style={{ ...label, fontSize: 15, fontWeight: 700, color: '#fb923c' }}>Cash (In Studio) — Setup Guide</p>
          <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.7 }}>
            <p style={{ marginBottom: 8 }}>No setup needed. Process:</p>
            <ol style={{ paddingLeft: 18, margin: '0 0 8px' }}>
              <li style={{ marginBottom: 4 }}>Client comes to the studio for consultation or appointment</li>
              <li style={{ marginBottom: 4 }}>Collect cash payment in person</li>
              <li style={{ marginBottom: 4 }}>In Leads page, select <strong>Cash</strong> as payment method</li>
              <li style={{ marginBottom: 4 }}>Enter the amount and mark as <strong>Paid</strong></li>
            </ol>
            <p style={{ fontSize: 11, color: '#fbbf24' }}>Tip: Give a handwritten or printed receipt. Keep a copy for your records.</p>
          </div>
        </div>
      )}

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
