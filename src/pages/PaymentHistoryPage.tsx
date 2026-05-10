import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type LeadRecord } from '../db';

type StatusFilter = 'all' | 'paid' | 'pending_verify' | 'refunded' | 'unpaid' | 'waived';
type MethodFilter = 'all' | 'stripe_connect' | 'manual_link' | 'bank_transfer' | 'cash';

function paymentMethodLabel(method?: LeadRecord['paymentMethod']) {
  if (method === 'stripe_connect') return 'Stripe';
  if (method === 'manual_link') return 'Manual Link';
  if (method === 'bank_transfer') return 'Bank Transfer';
  if (method === 'cash') return 'Cash';
  return 'Unknown';
}

function parseAmount(v?: string) {
  if (!v) return 0;
  const n = Number(String(v).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export default function PaymentHistoryPage() {
  const navigate = useNavigate();
  const [artistId, setArtistId] = useState('');
  const [rows, setRows] = useState<LeadRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [methodFilter, setMethodFilter] = useState<MethodFilter>('all');
  const [rejectReasonByLead, setRejectReasonByLead] = useState<Record<string, string>>({});

  const refresh = async (currentArtistId: string) => {
    const all = await db.leads.where('artistId').equals(currentArtistId).reverse().sortBy('createdAt');
    setRows(all.filter(x => !!x.paymentStatus || !!x.paymentAmount || !!x.paymentMethod));
  };

  useEffect(() => {
    const current = localStorage.getItem('inkflow_current_user') || '';
    if (!current) return;
    setArtistId(current);
    void refresh(current);
  }, []);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (statusFilter !== 'all' && (r.paymentStatus || 'unpaid') !== statusFilter) return false;
      if (methodFilter !== 'all' && r.paymentMethod !== methodFilter) return false;
      return true;
    });
  }, [rows, statusFilter, methodFilter]);

  const summary = useMemo(() => {
    const now = Date.now();
    const dayStart = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime();
    const weekStart = dayStart - 6 * 24 * 60 * 60 * 1000;
    const amountBy = (list: LeadRecord[], status: LeadRecord['paymentStatus']) =>
      list.filter(x => x.paymentStatus === status).reduce((s, x) => s + parseAmount(x.paymentAmount), 0);
    const todayRows = rows.filter(x => (x.paymentUpdatedAt || x.createdAt) >= dayStart && (x.paymentUpdatedAt || x.createdAt) <= now);
    const weekRows = rows.filter(x => (x.paymentUpdatedAt || x.createdAt) >= weekStart && (x.paymentUpdatedAt || x.createdAt) <= now);
    const todayPaid = amountBy(todayRows, 'paid');
    const todayRefund = amountBy(todayRows, 'refunded');
    const weekPaid = amountBy(weekRows, 'paid');
    const weekRefund = amountBy(weekRows, 'refunded');
    const pending = rows.filter(x => x.paymentStatus === 'pending_verify').reduce((s, x) => s + parseAmount(x.paymentAmount), 0);
    return {
      todayPaid,
      todayRefund,
      todayNet: todayPaid - todayRefund,
      weekPaid,
      weekRefund,
      weekNet: weekPaid - weekRefund,
      pending,
    };
  }, [rows]);

  const approve = async (lead: LeadRecord) => {
    await db.leads.update(lead.id, {
      paymentStatus: 'paid',
      paymentRejectReason: undefined,
      paymentUpdatedAt: Date.now(),
      status: 'booked',
    });
    await refresh(artistId);
  };

  const reject = async (lead: LeadRecord) => {
    const reason = (rejectReasonByLead[lead.id] || '').trim() || 'Payment proof rejected';
    await db.leads.update(lead.id, {
      paymentStatus: 'unpaid',
      paymentRejectReason: reason,
      paymentUpdatedAt: Date.now(),
      status: 'contacted',
    });
    await refresh(artistId);
  };

  const exportCsv = () => {
    const header = ['leadId', 'clientName', 'status', 'method', 'amount', 'currency', 'updatedAt', 'refundReason', 'rejectReason'];
    const lines = filtered.map(r => [
      r.id,
      (r.name || '').replace(/,/g, ' '),
      r.paymentStatus || '',
      r.paymentMethod || '',
      r.paymentAmount || '',
      r.paymentCurrency || '',
      new Date(r.paymentUpdatedAt || r.createdAt).toISOString(),
      (r.paymentRefundReason || '').replace(/,/g, ' '),
      (r.paymentRejectReason || '').replace(/,/g, ' '),
    ]);
    const csv = [header.join(','), ...lines.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inkflow_payments_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: 20, color: 'white', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800 }}>Payment History</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={exportCsv} style={btn}>Export CSV</button>
          <button onClick={() => navigate('/me')} style={btn}>Back</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(180px, 1fr))', gap: 8, marginBottom: 12 }}>
        <Card title="Today Paid" value={`$${summary.todayPaid.toFixed(2)}`} />
        <Card title="Today Refund" value={`$${summary.todayRefund.toFixed(2)}`} />
        <Card title="Today Net" value={`$${summary.todayNet.toFixed(2)}`} />
        <Card title="Pending Verify" value={`$${summary.pending.toFixed(2)}`} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(180px, 1fr))', gap: 8, marginBottom: 12 }}>
        <Card title="Week Paid" value={`$${summary.weekPaid.toFixed(2)}`} />
        <Card title="Week Refund" value={`$${summary.weekRefund.toFixed(2)}`} />
        <Card title="Week Net" value={`$${summary.weekNet.toFixed(2)}`} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)} style={input}>
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending_verify">Pending Verify</option>
          <option value="refunded">Refunded</option>
          <option value="unpaid">Unpaid</option>
          <option value="waived">Waived</option>
        </select>
        <select value={methodFilter} onChange={e => setMethodFilter(e.target.value as MethodFilter)} style={input}>
          <option value="all">All Methods</option>
          <option value="stripe_connect">Stripe</option>
          <option value="manual_link">Manual Link</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="cash">Cash</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>No payment records.</p>
        ) : filtered.map(row => (
          <div key={row.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <p style={{ fontWeight: 700 }}>{row.name}</p>
              <p style={{ fontSize: 12, color: '#cbd5e1' }}>{new Date(row.paymentUpdatedAt || row.createdAt).toLocaleString()}</p>
            </div>
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
              {row.paymentStatus || 'unpaid'} | {paymentMethodLabel(row.paymentMethod)} | {row.paymentAmount || '-'} {row.paymentCurrency || ''}
            </p>
            {!!row.paymentRefundReason && <p style={{ fontSize: 12, color: '#fca5a5', marginTop: 4 }}>Refund: {row.paymentRefundReason}</p>}
            {!!row.paymentRejectReason && <p style={{ fontSize: 12, color: '#fca5a5', marginTop: 4 }}>Rejected: {row.paymentRejectReason}</p>}

            {row.paymentStatus === 'pending_verify' && (
              <div style={{ marginTop: 8 }}>
                <textarea
                  rows={1}
                  value={rejectReasonByLead[row.id] || ''}
                  onChange={e => setRejectReasonByLead(prev => ({ ...prev, [row.id]: e.target.value }))}
                  placeholder="Reject reason (optional)"
                  style={{ ...input, marginBottom: 6, resize: 'vertical' }}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => void approve(row)} style={{ ...btn, color: '#86efac' }}>Approve</button>
                  <button onClick={() => void reject(row)} style={{ ...btn, color: '#fca5a5' }}>Reject</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 10, padding: 10 }}>
      <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{title}</p>
      <p style={{ fontSize: 20, fontWeight: 800 }}>{value}</p>
    </div>
  );
}

const input: React.CSSProperties = {
  width: '100%',
  padding: '9px 10px',
  borderRadius: 8,
  border: '1px solid #334155',
  background: '#0f172a',
  color: 'white',
  boxSizing: 'border-box',
};

const btn: React.CSSProperties = {
  border: '1px solid #334155',
  background: 'transparent',
  color: '#cbd5e1',
  borderRadius: 8,
  padding: '8px 10px',
  cursor: 'pointer',
};
