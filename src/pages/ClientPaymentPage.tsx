import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db, type LeadRecord, type UserRecord } from '../db';

function methodLabel(method?: LeadRecord['paymentMethod']) {
  if (method === 'stripe_connect') return 'Stripe';
  if (method === 'manual_link') return 'Manual Link';
  if (method === 'bank_transfer') return 'Bank Transfer';
  if (method === 'cash') return 'Cash at Studio';
  return 'Not selected';
}

export default function ClientPaymentPage() {
  const { leadId } = useParams<{ leadId: string }>();
  const [lead, setLead] = useState<LeadRecord | null>(null);
  const [artist, setArtist] = useState<UserRecord | null>(null);
  const [method, setMethod] = useState<LeadRecord['paymentMethod']>('stripe_connect');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [proofImages, setProofImages] = useState<string[]>([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!leadId) return;
    db.leads.get(leadId).then(async (l) => {
      if (!l) return;
      setLead(l);
      setMethod(l.paymentMethod || 'stripe_connect');
      setAmount(l.paymentAmount || '');
      const u = await db.users.get(l.artistId);
      setArtist(u || null);
    });
  }, [leadId]);

  const enabledMethods = useMemo(
    () => artist?.enabledPaymentMethods?.length ? artist.enabledPaymentMethods : ['stripe_connect', 'manual_link', 'bank_transfer', 'cash'],
    [artist]
  );

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const max = Math.min(files.length, Math.max(0, 4 - proofImages.length));
    const list: string[] = [];
    for (let i = 0; i < max; i++) {
      const data = await new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.readAsDataURL(files[i]);
      });
      list.push(data);
    }
    setProofImages(prev => [...prev, ...list]);
  };

  const payWithStripe = async () => {
    if (!lead || !artist?.stripeAccountId) return;
    const base = window.location.origin;
    const r = await fetch('http://localhost:8787/api/stripe/checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        connectedAccountId: artist.stripeAccountId,
        amount: Number(amount || '0'),
        currency: (artist.paymentCurrency || 'USD').toLowerCase(),
        leadId: lead.id,
        clientName: lead.name,
        artistId: lead.artistId,
        successUrl: `${base}/pay/status/${encodeURIComponent(lead.id)}?paid=1`,
        cancelUrl: `${base}/pay/${encodeURIComponent(lead.id)}?cancel=1`,
      }),
    });
    const data = await r.json();
    if (!r.ok || !data?.url) throw new Error(data?.error || 'Stripe session failed');
    window.location.href = data.url;
  };

  const submit = async () => {
    if (!lead) return;
    if (!amount.trim()) {
      setMsg('Please enter amount.');
      return;
    }
    try {
      if (method === 'stripe_connect') {
        await payWithStripe();
        return;
      }
      await db.leads.update(lead.id, {
        paymentMethod: method,
        paymentAmount: amount.trim(),
        paymentCurrency: artist?.paymentCurrency || 'USD',
        paymentProofNote: note.trim() || undefined,
        paymentProofImages: proofImages.length ? proofImages : undefined,
        paymentStatus: method === 'cash' ? 'pending_verify' : 'pending_verify',
        paymentUpdatedAt: Date.now(),
      });
      setMsg('Submitted. Studio will verify your payment.');
    } catch (e: any) {
      setMsg(e?.message || 'Submit failed');
    }
  };

  if (!lead) return <div style={{ minHeight: '100dvh', background: '#0f172a', color: 'white', padding: 24 }}>Invalid payment link.</div>;

  return (
    <div style={{ minHeight: '100dvh', background: '#0f172a', color: 'white', padding: 24, maxWidth: 760, margin: '0 auto' }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Pay Deposit</h2>
      <p style={{ color: '#94a3b8', marginBottom: 10 }}>Client: {lead.name}</p>
      <p style={{ color: '#94a3b8', marginBottom: 14 }}>Current status: {lead.paymentStatus || 'unpaid'} ({methodLabel(lead.paymentMethod)})</p>

      <select value={method} onChange={e => setMethod(e.target.value as LeadRecord['paymentMethod'])} style={input}>
        {enabledMethods.includes('stripe_connect') && <option value="stripe_connect">Stripe</option>}
        {enabledMethods.includes('manual_link') && <option value="manual_link">Manual Link</option>}
        {enabledMethods.includes('bank_transfer') && <option value="bank_transfer">Bank Transfer</option>}
        {enabledMethods.includes('cash') && <option value="cash">Cash at Studio</option>}
      </select>
      <input value={amount} onChange={e => setAmount(e.target.value)} placeholder={`Amount (${artist?.paymentCurrency || 'USD'})`} style={input} />

      {method === 'bank_transfer' && (
        <div style={{ background: '#111827', border: '1px solid #334155', borderRadius: 10, padding: 10, marginBottom: 10, whiteSpace: 'pre-wrap' }}>
          {artist?.bankTransferInstructions || 'Please ask studio for bank transfer details.'}
        </div>
      )}

      {(method === 'bank_transfer' || method === 'manual_link' || method === 'cash') && (
        <>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Transfer ref / note" style={{ ...input, resize: 'vertical' }} />
          <input type="file" accept="image/*" multiple onChange={e => void handleFiles(e.target.files)} style={{ marginBottom: 8 }} />
          {proofImages.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 8 }}>
              {proofImages.map((img, i) => <img key={i} src={img} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 8 }} />)}
            </div>
          )}
        </>
      )}

      <button onClick={() => void submit()} style={btn}>Submit Payment</button>
      <Link to={`/pay/status/${lead.id}`} style={{ display: 'inline-block', marginTop: 10, color: '#93c5fd' }}>Check Payment Status</Link>
      {msg && <p style={{ marginTop: 10, color: '#86efac' }}>{msg}</p>}
    </div>
  );
}

const input: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  marginBottom: 10,
  borderRadius: 10,
  border: '1px solid #334155',
  background: '#1e293b',
  color: 'white',
  boxSizing: 'border-box',
};

const btn: React.CSSProperties = {
  width: '100%',
  padding: 13,
  borderRadius: 12,
  border: 'none',
  background: '#e11d48',
  color: 'white',
  fontWeight: 800,
  cursor: 'pointer',
};
