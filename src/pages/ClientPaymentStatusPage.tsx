import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db, type LeadRecord } from '../db';

export default function ClientPaymentStatusPage() {
  const { leadId } = useParams<{ leadId: string }>();
  const [lead, setLead] = useState<LeadRecord | null>(null);

  useEffect(() => {
    if (!leadId) return;
    db.leads.get(leadId).then(l => setLead(l || null));
  }, [leadId]);

  if (!lead) return <div style={{ minHeight: '100dvh', background: '#0f172a', color: 'white', padding: 24 }}>Invalid status link.</div>;

  return (
    <div style={{ minHeight: '100dvh', background: '#0f172a', color: 'white', padding: 24, maxWidth: 700, margin: '0 auto' }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Payment Status</h2>
      <p style={{ color: '#94a3b8', marginBottom: 8 }}>Client: {lead.name}</p>
      <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Status: {lead.paymentStatus || 'unpaid'}</p>
      <p style={{ color: '#cbd5e1', marginBottom: 8 }}>Method: {lead.paymentMethod || 'not selected'}</p>
      <p style={{ color: '#cbd5e1', marginBottom: 8 }}>Amount: {lead.paymentAmount || '-'} {lead.paymentCurrency || ''}</p>
      {!!lead.paymentRefundReason && <p style={{ color: '#fca5a5', marginBottom: 8 }}>Refund reason: {lead.paymentRefundReason}</p>}
      {!!lead.paymentRejectReason && <p style={{ color: '#fca5a5', marginBottom: 8 }}>Rejected: {lead.paymentRejectReason}</p>}
      <p style={{ color: '#94a3b8', marginTop: 10 }}>Updated: {new Date(lead.paymentUpdatedAt || lead.createdAt).toLocaleString()}</p>
      <Link to={`/pay/${lead.id}`} style={{ display: 'inline-block', marginTop: 12, color: '#93c5fd' }}>Back to Payment</Link>
    </div>
  );
}
