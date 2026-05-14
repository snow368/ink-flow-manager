import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, type InvoiceRecord, type UserRecord, type ClientRecord } from '../db';
import { getCountryConfig, formatInvoiceCurrency, formatInvoiceDate } from '../lib/invoiceConfig';
import { THEME } from '../lib/theme';

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<InvoiceRecord | null>(null);
  const [user, setUser] = useState<UserRecord | null>(null);
  const [client, setClient] = useState<ClientRecord | null>(null);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    const stored = localStorage.getItem('inkflow_current_user');
    if (!stored) { navigate('/register'); return; }
    Promise.all([
      db.users.get(stored),
      db.invoices.get(id),
    ]).then(([u, inv]) => {
      if (!u || !inv) { navigate('/invoices'); return; }
      setUser(u);
      setInvoice(inv);
      if (inv.clientId) {
        db.clients.get(inv.clientId).then(c => setClient(c ?? null));
      }
    });
  }, [id]);

  if (!invoice || !user) {
    return <div style={{ padding: 24, color: 'white' }}>Loading...</div>;
  }

  const cfg = getCountryConfig(invoice.country);

  const handleMarkPaid = async () => {
    await db.invoices.update(invoice.id, { paymentStatus: 'paid', paidAt: Date.now() });
    setInvoice({ ...invoice, paymentStatus: 'paid', paidAt: Date.now() });
    setMessage('Invoice marked as paid.');
  };

  const handleCancel = async () => {
    if (!confirm('Cancel this invoice?')) return;
    await db.invoices.update(invoice.id, { paymentStatus: 'cancelled' });
    setInvoice({ ...invoice, paymentStatus: 'cancelled' });
    setMessage('Invoice cancelled.');
  };

  const handlePrint = () => {
    window.print();
  };

  const generateShareText = () => {
    if (!invoice) return '';
    const cfg = getCountryConfig(invoice.country);
    const clientName = client?.name || invoice.walkInName || 'Client';
    const itemsList = invoice.items
      .map(i => `  ${i.name} x${i.quantity} — ${formatInvoiceCurrency(i.total, invoice.country)}`)
      .join('\n');

    let text = `${cfg.invoiceTitle} #${invoice.invoiceNumber}\n`;
    text += `${cfg.dateLabel}: ${formatInvoiceDate(invoice.createdAt, invoice.country)}\n`;
    text += `${cfg.clientLabel}: ${clientName}\n`;
    text += `────────────────\n`;
    text += itemsList + '\n';
    text += `────────────────\n`;
    if (invoice.tax) text += `${cfg.taxLabelFull}: ${formatInvoiceCurrency(invoice.tax, invoice.country)}\n`;
    text += `${cfg.totalLabel}: ${formatInvoiceCurrency(invoice.total, invoice.country)}\n`;
    if (invoice.notes) text += `\n${invoice.notes}`;
    return text;
  };

  const markSent = async (via: InvoiceRecord['sentVia']) => {
    if (!invoice) return;
    const sentAt = Date.now();
    await db.invoices.update(invoice.id, { sentAt, sentVia: via });
    setInvoice({ ...invoice, sentAt, sentVia: via });
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(generateShareText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
    markSent('whatsapp');
  };

  const handleEmail = () => {
    const cfg = getCountryConfig(invoice?.country || 'US');
    const subject = encodeURIComponent(`${cfg.invoiceTitle} #${invoice?.invoiceNumber} — ${user?.studioName || 'InkFlow Studio'}`);
    const body = encodeURIComponent(generateShareText());
    const to = client?.email || '';
    window.open(`mailto:${to}?subject=${subject}&body=${body}`, '_blank');
    markSent('email');
  };

  const handleShare = async () => {
    const text = generateShareText();
    if (navigator.share) {
      try {
        await navigator.share({ title: `Invoice #${invoice?.invoiceNumber}`, text });
        markSent('share');
        return;
      } catch {}
    }
    // Fallback: copy to clipboard
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setMessage('Copied to clipboard (share not available on this device)');
    markSent('copy');
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generateShareText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setMessage('Copied to clipboard');
    markSent('copy');
  };

  const statusBadge = (status: InvoiceRecord['paymentStatus']) => {
    const colors: Record<string, { bg: string; color: string; label: string }> = {
      pending: { bg: '#fbbf2420', color: '#fbbf24', label: 'Pending' },
      paid: { bg: '#22c55e20', color: '#4ade80', label: 'Paid' },
      cancelled: { bg: '#ef444420', color: '#f87171', label: 'Cancelled' },
      refunded: { bg: '#a855f720', color: '#c084fc', label: 'Refunded' },
    };
    const s = colors[status] || colors.pending;
    return (
      <span style={{ fontSize: 12, padding: '3px 12px', borderRadius: 6, background: s.bg, color: s.color, fontWeight: 700 }}>
        {s.label}
      </span>
    );
  };

  return (
    <div style={{ padding: 24, color: THEME.text.primary, paddingBottom: 120, maxWidth: 800, margin: '0 auto' }}>
      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .print-area { background: white !important; color: black !important; padding: 20px !important; }
          .print-area * { color: black !important; border-color: #ddd !important; }
        }
      `}</style>

      {message && (
        <div className="no-print" style={{ background: '#14532d', padding: 8, borderRadius: 8, marginBottom: 12 }}>
          <p style={{ fontSize: 13, color: '#86efac' }}>{message}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="no-print" style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {invoice.paymentStatus === 'pending' && (
          <>
            <button onClick={handleMarkPaid}
              style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: '#22c55e', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Mark as Paid
            </button>
            <button onClick={handleCancel}
              style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid #ef4444', background: 'transparent', color: '#f87171', fontSize: 14, cursor: 'pointer' }}>
              Cancel
            </button>
          </>
        )}
        <button onClick={handlePrint}
          style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid #334155', background: '#334155', color: 'white', fontSize: 14, cursor: 'pointer' }}>
          Print
        </button>
      </div>

      {/* Send / Share */}
      <div className="no-print" style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 20, border: '1px solid #334155' }}>
        <p style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
          Send Invoice to Client
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button onClick={handleWhatsApp}
            style={{ ...shareBtnStyle, background: '#075e54' }}>
            <span style={{ fontSize: 18 }}>💬</span> WhatsApp
          </button>
          <button onClick={handleEmail}
            style={{ ...shareBtnStyle, background: '#1d4ed8' }}>
            <span style={{ fontSize: 18 }}>📧</span> Email
          </button>
          <button onClick={handleShare}
            style={{ ...shareBtnStyle, background: '#475569' }}>
            <span style={{ fontSize: 18 }}>📤</span> Share
          </button>
          <button onClick={handleCopy}
            style={{ ...shareBtnStyle, background: copied ? '#166534' : '#334155', border: copied ? '1px solid #22c55e' : '1px solid #475569' }}>
            <span style={{ fontSize: 18 }}>{copied ? '✅' : '📋'}</span> {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="print-area" style={{ background: '#1e293b', padding: 32, borderRadius: 16, border: '1px solid #334155' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, borderBottom: '2px solid #334155', paddingBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '0.05em', marginBottom: 4 }}>
              {cfg.invoiceTitle}
            </h1>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#e11d48' }}>
              #{invoice.invoiceNumber}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
              {invoice.sentAt ? (
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: '#2563eb20', color: '#60a5fa', fontWeight: 600 }}>
                  Sent via {invoice.sentVia}
                </span>
              ) : (
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: '#fbbf2420', color: '#fbbf24', fontWeight: 600 }}>
                  Not sent
                </span>
              )}
              {statusBadge(invoice.paymentStatus)}
            </div>
            {invoice.paidAt && (
              <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                Paid {formatInvoiceDate(invoice.paidAt, invoice.country)}
              </p>
            )}
          </div>
        </div>

        {/* Studio & Client info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28, gap: 24 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>From</p>
            <p style={{ fontSize: 15, fontWeight: 700 }}>{user.studioName || 'InkFlow Studio'}</p>
            <p style={{ fontSize: 13, color: '#94a3b8' }}>{user.name}</p>
            <p style={{ fontSize: 13, color: '#94a3b8' }}>{user.email}</p>
          </div>
          <div style={{ flex: 1, textAlign: 'right' }}>
            <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{cfg.clientLabel}</p>
            {client ? (
              <>
                <p style={{ fontSize: 15, fontWeight: 700 }}>{client.name}</p>
                {client.phone && <p style={{ fontSize: 13, color: '#94a3b8' }}>{client.phone}</p>}
                {client.email && <p style={{ fontSize: 13, color: '#94a3b8' }}>{client.email}</p>}
              </>
            ) : (
              <p style={{ fontSize: 15, fontWeight: 700 }}>{invoice.walkInName || 'Walk-in Client'}</p>
            )}
          </div>
        </div>

        {/* Meta */}
        <div style={{ display: 'flex', gap: 32, marginBottom: 24, fontSize: 13 }}>
          <div>
            <span style={{ color: '#64748b' }}>{cfg.dateLabel}: </span>
            <span style={{ fontWeight: 500 }}>{formatInvoiceDate(invoice.createdAt, invoice.country)}</span>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>{cfg.paymentLabel}: </span>
            <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{invoice.paymentMethod.replace('_', ' ')}</span>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>{cfg.taxLabel}: </span>
            <span style={{ fontWeight: 500 }}>{cfg.taxLabelFull}</span>
          </div>
        </div>

        {/* Line items table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #334155' }}>
              <th style={{ ...thStyle, textAlign: 'left', width: '40%' }}>{cfg.itemLabel}</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>{cfg.qtyLabel}</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>{cfg.priceLabel}</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>{cfg.amountLabel}</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #1a2332' }}>
                <td style={{ ...tdStyle, textAlign: 'left' }}>
                  <span style={{ fontWeight: 500 }}>{item.name}</span>
                  <span style={{ fontSize: 10, color: '#64748b', marginLeft: 6, textTransform: 'capitalize' }}>({item.type})</span>
                </td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{formatInvoiceCurrency(item.price, invoice.country)}</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{formatInvoiceCurrency(item.total, invoice.country)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
          <div style={{ width: 280 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
              <span style={{ color: '#94a3b8' }}>{cfg.subtotalLabel}</span>
              <span>{formatInvoiceCurrency(invoice.subtotal, invoice.country)}</span>
            </div>
            {invoice.depositApplied ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
                <span style={{ color: '#4ade80' }}>{cfg.depositLabel}</span>
                <span style={{ color: '#4ade80' }}>-{formatInvoiceCurrency(invoice.depositApplied, invoice.country)}</span>
              </div>
            ) : null}
            {invoice.tax ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
                <span style={{ color: '#94a3b8' }}>{cfg.taxLabelFull}</span>
                <span>{formatInvoiceCurrency(invoice.tax, invoice.country)}</span>
              </div>
            ) : null}
            {invoice.tip ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
                <span style={{ color: '#94a3b8' }}>{cfg.tipLabel}</span>
                <span>{formatInvoiceCurrency(invoice.tip, invoice.country)}</span>
              </div>
            ) : null}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 6px', borderTop: '2px solid #334155', marginTop: 8, fontSize: 18, fontWeight: 800 }}>
              <span>{cfg.totalLabel}</span>
              <span>{formatInvoiceCurrency(invoice.total, invoice.country)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div style={{ borderTop: '1px solid #1a2332', paddingTop: 16, marginBottom: 16 }}>
            <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Notes</p>
            <p style={{ fontSize: 13, color: '#94a3b8' }}>{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: '1px solid #1a2332', paddingTop: 16, textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#475569' }}>
            {cfg.invoiceTitle} #{invoice.invoiceNumber} | {cfg.dateLabel}: {formatInvoiceDate(invoice.createdAt, invoice.country)}
          </p>
          <p style={{ fontSize: 11, color: '#334155', marginTop: 4 }}>
            {user.studioName || 'InkFlow Studio'} | {user.email}
          </p>
        </div>
      </div>

      {/* POS transaction link */}
      {invoice.posTransactionId && (
        <div className="no-print" style={{ marginTop: 16 }}>
          <button onClick={() => navigate('/pos')}
            style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 14, cursor: 'pointer' }}>
            View POS Transaction
          </button>
        </div>
      )}

      <div className="no-print" style={{ marginTop: 12 }}>
        <button onClick={() => navigate('/invoices')}
          style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 14, cursor: 'pointer' }}>
          Back to {cfg.invoiceTitle}s
        </button>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '10px 8px',
  fontSize: 11,
  fontWeight: 700,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const shareBtnStyle: React.CSSProperties = {
  padding: '12px 10px',
  borderRadius: 10,
  border: '1px solid transparent',
  color: 'white',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
};

const tdStyle: React.CSSProperties = {
  padding: '12px 8px',
  fontSize: 14,
  verticalAlign: 'top',
};
