import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db, type InvoiceRecord, type UserRecord, type PosTransactionRecord, type ClientRecord } from '../db';
import { getCountryConfig, formatInvoiceCurrency } from '../lib/invoiceConfig';
import { loadInvoiceSettings, isInvoiceSetupComplete, type InvoiceStudioSettings } from '../lib/invoiceSettings';
import { getCurrentArtistIds } from '../lib/locationLogic';
import { THEME } from '../lib/theme';

type FilterStatus = 'all' | 'pending' | 'paid' | 'cancelled';

export default function Invoices() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [posTransactions, setPosTransactions] = useState<PosTransactionRecord[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [message, setMessage] = useState('');

  const [studioSettings] = useState<InvoiceStudioSettings>(loadInvoiceSettings());
  const setupComplete = isInvoiceSetupComplete(studioSettings);

  // New invoice form state
  const [clientId, setClientId] = useState('');
  const [walkInName, setWalkInName] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(new Date(Date.now() + (loadInvoiceSettings().defaultDueDays || 30) * 86400000).toISOString().slice(0, 10));
  const [items, setItems] = useState<{ name: string; price: number; quantity: number; type: 'product' | 'service' }[]>([]);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemType, setItemType] = useState<'product' | 'service'>('service');
  const [notes, setNotes] = useState(studioSettings.defaultNotes || '');
  const [paymentMethod, setPaymentMethod] = useState<InvoiceRecord['paymentMethod']>(
    (studioSettings.defaultPaymentMethod as InvoiceRecord['paymentMethod']) || 'cash'
  );
  const [splitPayment, setSplitPayment] = useState(false);
  const [payments, setPayments] = useState<{ method: string; amount: string }[]>([
    { method: 'cash', amount: '' },
    { method: 'card', amount: '' },
  ]);
  const [tip, setTip] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('inkflow_current_user');
    if (!stored) { navigate('/register'); return; }
    db.users.get(stored).then(u => {
      if (!u) { navigate('/register'); return; }
      setUser(u);
      loadData(u);
    });
  }, []);

  const loadData = async (u: UserRecord) => {
    const artistIds = await getCurrentArtistIds(u);
    const artistId = u.artistId || u.id;

    let invs: InvoiceRecord[];
    if (artistIds.length > 1) {
      invs = await db.invoices.orderBy('createdAt').reverse().filter(i => artistIds.includes(i.artistId)).toArray();
    } else {
      invs = await db.invoices.where('artistId').equals(artistId).toArray();
      invs.sort((a, b) => b.createdAt - a.createdAt);
    }
    setInvoices(invs);

    let txs: PosTransactionRecord[];
    if (artistIds.length > 1) {
      txs = await db.posTransactions.orderBy('createdAt').reverse().filter(t => artistIds.includes(t.artistId)).toArray();
    } else {
      txs = await db.posTransactions.where('artistId').equals(artistId).toArray();
      txs.sort((a, b) => b.createdAt - a.createdAt);
    }
    setPosTransactions(txs);

    // Load all clients for selection in invoice form
    const cs = await db.clients.orderBy('name').toArray();
    setClients(cs);

    // If navigated from client detail, auto-open new invoice form
    const prefillClientId = searchParams.get('clientId');
    if (prefillClientId && cs.some(c => c.id === prefillClientId)) {
      setClientId(prefillClientId);
      setShowNewForm(true);
    }
  };

  const countryConfig = getCountryConfig(user?.country || 'US');
  const filtered = filter === 'all' ? invoices : invoices.filter(i => i.paymentStatus === filter);

  const generateInvoiceNumber = () => {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const seq = String(invoices.length + 1).padStart(4, '0');
    return `INV-${yy}${mm}-${seq}`;
  };

  const handleCreateInvoice = async () => {
    if (items.length === 0) return;

    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const taxRate = countryConfig.defaultTaxRate;
    const tax = Math.round(subtotal * taxRate) / 100;
    const tipAmount = tip ? Math.round(parseFloat(tip) * 100) : 0;
    const total = subtotal + tax + tipAmount;

    const invoice: InvoiceRecord = {
      id: 'inv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      invoiceNumber: generateInvoiceNumber(),
      artistId: user!.artistId || user!.id,
      clientId: clientId || undefined,
      walkInName: clientId ? undefined : walkInName.trim() || undefined,
      items: items.map(i => ({ ...i, total: i.price * i.quantity })),
      subtotal,
      tax,
      taxRate,
      tip: tipAmount || undefined,
      total,
      currency: countryConfig.currency,
      country: user?.country || 'US',
      paymentMethod,
      payments: splitPayment ? payments.filter(p => p.amount && parseFloat(p.amount) > 0).map(p => ({ method: p.method, amount: Math.round(parseFloat(p.amount) * 100) })) : undefined,
      paymentStatus: 'pending',
      dueDate: new Date(dueDate).getTime() || undefined,
      notes: (() => {
        const parts: string[] = [];
        if (sessionDate) parts.push(`Session: ${sessionDate}`);
        const validPayments = splitPayment ? payments.filter(p => p.amount && parseFloat(p.amount) > 0) : [];
        if (validPayments.length > 0) {
          parts.push('Payments: ' + validPayments.map(p => `$${parseFloat(p.amount).toFixed(2)} ${p.method}`).join(' + '));
        }
        if (notes.trim()) parts.push(notes.trim());
        return parts.join('\n') || undefined;
      })(),
      createdAt: Date.now(),
    };

    await db.invoices.add(invoice);
    setMessage('Invoice created!');
    setShowNewForm(false);
    resetForm();
    loadData(user!);
  };

  const handleCreateFromPos = async (tx: PosTransactionRecord) => {
    const existing = await db.invoices.where('posTransactionId').equals(tx.id).count();
    if (existing > 0) {
      setMessage('An invoice already exists for this POS transaction.');
      setShowNewMenu(false);
      return;
    }
    const cfg = getCountryConfig(user?.country || 'US');
    const taxRate = cfg.defaultTaxRate;
    const tax = Math.round(tx.subtotal * taxRate) / 100;
    const total = tx.subtotal + tax + (tx.tip || 0);

    const invoice: InvoiceRecord = {
      id: 'inv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      invoiceNumber: generateInvoiceNumber(),
      artistId: user!.artistId || user!.id,
      clientId: tx.clientId || undefined,
      walkInName: tx.walkInName || undefined,
      items: tx.items.map(i => ({ type: i.type, name: i.name, price: i.price, quantity: i.quantity, total: i.total })),
      subtotal: tx.subtotal,
      tax,
      taxRate,
      depositApplied: tx.depositApplied,
      tip: tx.tip,
      total,
      currency: cfg.currency,
      country: user?.country || 'US',
      paymentMethod: tx.paymentMethod as InvoiceRecord['paymentMethod'],
      paymentStatus: 'pending',
      dueDate: new Date(Date.now() + (loadInvoiceSettings().defaultDueDays || 30) * 86400000).getTime(),
      posTransactionId: tx.id,
      notes: `Generated from POS receipt #${tx.receiptNumber}`,
      createdAt: Date.now(),
    };

    await db.invoices.add(invoice);
    setMessage('Invoice created from POS transaction!');
    setShowNewMenu(false);
    loadData(user!);
  };

  const resetForm = () => {
    setClientId('');
    setWalkInName('');
    setItems([]);
    setItemName('');
    setItemPrice('');
    setItemQty('1');
    setNotes(studioSettings.defaultNotes || '');
    setTip('');
    setSplitPayment(false);
    setPayments([{ method: 'cash', amount: '' }, { method: 'card', amount: '' }]);
    setDueDate(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
  };

  const addItem = () => {
    const price = parseFloat(itemPrice);
    const qty = parseInt(itemQty) || 1;
    if (!itemName.trim() || isNaN(price) || price <= 0) return;
    setItems([...items, { name: itemName.trim(), price, quantity: qty, type: itemType }]);
    setItemName('');
    setItemPrice('');
    setItemQty('1');
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  // Monthly summary
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const monthInvoices = invoices.filter(i => i.createdAt >= monthStart);
  const monthTotal = monthInvoices.reduce((s, i) => s + i.total, 0);
  const monthPaid = monthInvoices.filter(i => i.paymentStatus === 'paid').length;
  const monthPending = monthInvoices.filter(i => i.paymentStatus === 'pending').length;

  const statusBadge = (status: InvoiceRecord['paymentStatus']) => {
    const colors: Record<string, { bg: string; color: string; label: string }> = {
      pending: { bg: '#fbbf2420', color: '#fbbf24', label: 'Pending' },
      paid: { bg: '#22c55e20', color: '#4ade80', label: 'Paid' },
      cancelled: { bg: '#ef444420', color: '#f87171', label: 'Cancelled' },
      refunded: { bg: '#a855f720', color: '#c084fc', label: 'Refunded' },
    };
    const s = colors[status] || colors.pending;
    return (
      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: s.bg, color: s.color, fontWeight: 600 }}>
        {s.label}
      </span>
    );
  };

  const filterTabs: { key: FilterStatus; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'paid', label: 'Paid' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div style={{ padding: 24, color: THEME.text.primary, paddingBottom: 100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 'bold' }}>{countryConfig.invoiceTitle}</h2>
        <button
          onClick={() => { setShowNewMenu(!showNewMenu); setShowNewForm(false); }}
          style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: '#e11d48', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          + New Invoice
        </button>
      </div>

      {message && (
        <div style={{ background: '#14532d', padding: 8, borderRadius: 8, marginBottom: 12 }}>
          <p style={{ fontSize: 13, color: '#86efac' }}>{message}</p>
        </div>
      )}

      {/* New Invoice Menu */}
      {showNewMenu && (
        <div style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 16 }}>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Create Invoice From...</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button onClick={() => { setShowNewForm(true); setShowNewMenu(false); }}
              style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 14, cursor: 'pointer' }}>
              Blank Invoice
            </button>
          </div>
          {posTransactions.filter(tx => tx.paymentStatus === 'completed').slice(0, 5).map(tx => {
            const client = tx.clientId ? clients.find(c => c.id === tx.clientId) : null;
            return (
              <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #1a2332' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500 }}>Receipt #{tx.receiptNumber}</p>
                  <p style={{ fontSize: 11, color: '#94a3b8' }}>
                    {client?.name || tx.walkInName || 'Walk-in'} - {formatInvoiceCurrency(tx.total, user?.country || 'US')}
                  </p>
                </div>
                <button onClick={() => handleCreateFromPos(tx)}
                  style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#2563eb', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Generate
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Setup prompt */}
      {!setupComplete && (
        <div style={{ background: '#312e81', padding: 12, borderRadius: 10, marginBottom: 12, border: '1px solid #4338ca', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#c084fc' }}>Set up your studio info first</p>
            <p style={{ fontSize: 11, color: '#a5b4fc', marginTop: 2 }}>Your name, address, and terms will auto-fill every invoice.</p>
          </div>
          <button onClick={() => navigate('/invoice-settings')}
            style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: '#7e22ce', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Setup
          </button>
        </div>
      )}

      {/* New Invoice Form */}
      {showNewForm && (
        <div style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 16 }}>
          <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
            {countryConfig.invoiceTitle} - {countryConfig.name}
          </p>

          {/* Session date */}
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{countryConfig.serviceDateLabel || 'Session Date'}</p>
              <input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)}
                style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{countryConfig.dueDateLabel || 'Due Date'}</p>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                style={inputStyle} />
            </div>
          </div>

          {/* Client selection */}
          <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{countryConfig.clientLabel}</p>
          <select value={clientId} onChange={e => { setClientId(e.target.value); if (e.target.value) setWalkInName(''); }}
            style={inputStyle}>
            <option value="">Select client...</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {!clientId && (
            <input placeholder="Walk-in name" value={walkInName} onChange={e => setWalkInName(e.target.value)}
              style={inputStyle} />
          )}

          {/* Items */}
          <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{countryConfig.itemLabel}</p>

          {/* Preset quick-add buttons */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
            {studioSettings.servicePresets.map((p, i) => (
              <button key={'svc-' + i} onClick={() => {
                setItems([...items, { name: p.name, price: p.price, quantity: 1, type: 'service' }]);
              }}
              style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #4338ca', background: '#312e8120', color: '#a5b4fc', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {p.name} ${p.price}
              </button>
            ))}
            {studioSettings.productPresets.map((p, i) => (
              <button key={'prd-' + i} onClick={() => {
                setItems([...items, { name: p.name, price: p.price, quantity: 1, type: 'product' }]);
              }}
              style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #166534', background: '#14532d20', color: '#86efac', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {p.name} ${p.price}
              </button>
            ))}
          </div>

          {items.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6, padding: '6px 10px', background: '#0f172a', borderRadius: 8 }}>
              <span style={{ flex: 1, fontSize: 13 }}>{item.name}</span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>{countryConfig.qtyLabel}: {item.quantity}</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{formatInvoiceCurrency(item.price * item.quantity, user?.country || 'US')}</span>
              <button onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 16 }}>x</button>
            </div>
          ))}

          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <input placeholder={countryConfig.itemLabel} value={itemName} onChange={e => setItemName(e.target.value)}
              style={{ ...inputStyle, flex: 2, marginBottom: 0 }} />
            <input placeholder={countryConfig.priceLabel} value={itemPrice} onChange={e => setItemPrice(e.target.value)}
              type="number" style={{ ...inputStyle, flex: 1, marginBottom: 0 }} />
            <input placeholder={countryConfig.qtyLabel} value={itemQty} onChange={e => setItemQty(e.target.value)}
              type="number" style={{ ...inputStyle, width: 60, marginBottom: 0 }} />
            <select value={itemType} onChange={e => setItemType(e.target.value as typeof itemType)}
              style={{ ...inputStyle, width: 100, marginBottom: 0 }}>
              <option value="service">Service</option>
              <option value="product">Product</option>
            </select>
            <button onClick={addItem}
              style={{ padding: '10px 14px', borderRadius: 10, border: 'none', background: '#2563eb', color: 'white', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Add
            </button>
          </div>

          {/* Summary */}
          {items.length > 0 && (
            <div style={{ marginTop: 14, padding: 12, background: '#0f172a', borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: '#94a3b8' }}>{countryConfig.subtotalLabel}</span>
                <span>{formatInvoiceCurrency(items.reduce((s, i) => s + i.price * i.quantity, 0), user?.country || 'US')}</span>
              </div>
              {countryConfig.defaultTaxRate > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: '#94a3b8' }}>{countryConfig.taxLabelFull}</span>
                  <span>{formatInvoiceCurrency(Math.round(items.reduce((s, i) => s + i.price * i.quantity, 0) * countryConfig.defaultTaxRate) / 100, user?.country || 'US')}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, marginTop: 4, borderTop: '1px solid #1e293b', paddingTop: 8 }}>
                <span>{countryConfig.totalLabel}</span>
                <span>{formatInvoiceCurrency(
                  items.reduce((s, i) => s + i.price * i.quantity, 0) +
                  Math.round(items.reduce((s, i) => s + i.price * i.quantity, 0) * countryConfig.defaultTaxRate) / 100 +
                  (tip ? parseFloat(tip) * 100 : 0),
                  user?.country || 'US'
                )}</span>
              </div>
            </div>
          )}

          {/* Payment method & tip */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as typeof paymentMethod)}
              style={{ ...inputStyle, flex: 1, marginBottom: 0 }}>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="stripe_connect">Stripe</option>
              <option value="manual_link">Manual Link</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="paypal">PayPal</option>
              <option value="other">Other</option>
            </select>
            <input placeholder={countryConfig.tipLabel} value={tip} onChange={e => setTip(e.target.value)}
              type="number" style={{ ...inputStyle, flex: 1, marginBottom: 0 }} />
          </div>

          {/* Split payment toggle */}
          <div style={{ marginTop: 8 }}>
            <button onClick={() => setSplitPayment(!splitPayment)}
              style={{ background: 'none', border: 'none', color: splitPayment ? '#a5b4fc' : '#64748b', fontSize: 12, cursor: 'pointer', padding: 0 }}>
              {splitPayment ? '- Multiple Payments' : '+ Multiple Payments (installments / split methods)'}
            </button>
            {splitPayment && (
              <div style={{ marginTop: 6 }}>
                {payments.map((p, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                    <select value={p.method} onChange={e => {
                      const next = [...payments];
                      next[i] = { ...next[i], method: e.target.value };
                      setPayments(next);
                    }} style={{ ...inputStyle, flex: 1, marginBottom: 0, fontSize: 12 }}>
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="stripe_connect">Stripe</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="paypal">PayPal</option>
                      <option value="other">Other</option>
                    </select>
                    <input type="number" placeholder="Amount" value={p.amount}
                      onChange={e => {
                        const next = [...payments];
                        next[i] = { ...next[i], amount: e.target.value };
                        setPayments(next);
                      }}
                      style={{ ...inputStyle, flex: 1, marginBottom: 0, fontSize: 12 }} />
                    {payments.length > 1 && (
                      <button onClick={() => setPayments(payments.filter((_, j) => j !== i))}
                        style={{ background: 'none', border: 'none', color: '#f87171', fontSize: 16, cursor: 'pointer', padding: '0 6px' }}>✕</button>
                    )}
                  </div>
                ))}
                <button onClick={() => setPayments([...payments, { method: 'cash', amount: '' }])}
                  style={{ background: 'none', border: 'none', color: '#22c55e', fontSize: 12, cursor: 'pointer', padding: '4px 0' }}>
                  + Add Payment
                </button>
              </div>
            )}
          </div>

          <input placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)}
            style={{ ...inputStyle, marginTop: 8 }} />

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={handleCreateInvoice} disabled={items.length === 0}
              style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: items.length === 0 ? '#4b5563' : '#e11d48', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Create {countryConfig.invoiceTitle}
            </button>
            <button onClick={() => { setShowNewForm(false); resetForm(); }}
              style={{ padding: '12px 20px', borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 14, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Monthly Summary */}
      {monthInvoices.length > 0 && (
        <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #312e81 100%)', padding: 16, borderRadius: 12, marginBottom: 16, border: '1px solid #4338ca' }}>
          <p style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
            {now.toLocaleDateString(countryConfig.locale, { month: 'long', year: 'numeric' })} Summary
          </p>
          <div style={{ display: 'flex', gap: 16 }}>
            <div>
              <p style={{ fontSize: 24, fontWeight: 800, color: '#c084fc' }}>{monthInvoices.length}</p>
              <p style={{ fontSize: 11, color: '#94a3b8' }}>invoices</p>
            </div>
            <div>
              <p style={{ fontSize: 24, fontWeight: 800, color: '#4ade80' }}>{formatInvoiceCurrency(monthTotal, user?.country || 'US')}</p>
              <p style={{ fontSize: 11, color: '#94a3b8' }}>total</p>
            </div>
            <div>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#4ade80' }}>{monthPaid}</p>
              <p style={{ fontSize: 11, color: '#94a3b8' }}>paid</p>
            </div>
            <div>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#fbbf24' }}>{monthPending}</p>
              <p style={{ fontSize: 11, color: '#94a3b8' }}>pending</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {filterTabs.map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            style={{
              padding: '8px 18px', borderRadius: 10, border: '1px solid',
              borderColor: filter === t.key ? '#e11d48' : '#334155',
              background: filter === t.key ? '#e11d4820' : 'transparent',
              color: filter === t.key ? '#e11d48' : '#94a3b8',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Invoice list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ color: '#64748b', fontSize: 14 }}>No invoices yet</p>
          <p style={{ color: '#475569', fontSize: 12, marginTop: 4 }}>
            Create your first invoice to get started
          </p>
        </div>
      ) : (
        filtered.map(inv => {
          const client = inv.clientId ? clients.find(c => c.id === inv.clientId) : null;
          const cfg = getCountryConfig(inv.country);
          return (
            <div key={inv.id} onClick={() => navigate(`/invoice/${inv.id}`)}
              style={{ background: '#1e293b', padding: 14, borderRadius: 12, marginBottom: 8, cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600 }}>#{inv.invoiceNumber}</p>
                  <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
                    {client?.name || inv.walkInName || 'Walk-in Client'}
                  </p>
                  <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    {new Date(inv.createdAt).toLocaleDateString(cfg.locale, { dateStyle: 'medium' })}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 16, fontWeight: 700 }}>
                    {formatInvoiceCurrency(inv.total, inv.country)}
                  </p>
                  <div style={{ marginTop: 4, display: 'flex', gap: 4, justifyContent: 'flex-end', alignItems: 'center' }}>
                    {inv.sentAt ? (
                      <span style={{ fontSize: 10, color: '#60a5fa' }}>Sent</span>
                    ) : (
                      <span style={{ fontSize: 10, color: '#fbbf24' }}>Unsent</span>
                    )}
                    {statusBadge(inv.paymentStatus)}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}

      <button onClick={() => navigate('/me')}
        style={{ marginTop: 16, width: '100%', padding: 12, borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 14, cursor: 'pointer' }}>
        Back to Me
      </button>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', marginBottom: 8,
  borderRadius: 10, border: '1px solid #334155', background: '#0f172a',
  color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box',
};
