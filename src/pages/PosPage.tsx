import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db, type InventoryRecord, type ClientRecord, type AppointmentRecord, type PosLineItem, type UserRecord, type InvoiceRecord, type ProjectRecord } from '../db';
import { THEME } from '../lib/theme';
import { detectInitialLanguage, t } from '../lib/i18n';
import { generateReceiptNumber, printReceipt, deductInventory, restoreInventory, loadPosSettings } from '../lib/posLogic';
import { getCurrentArtistIds } from '../lib/locationLogic';
import { getCountryConfig } from '../lib/invoiceConfig';
import { loadInvoiceSettings } from '../lib/invoiceSettings';
import { isTippingCountry } from '../lib/tipConfig';
import { getArtistCommissionRate, calculateCommission } from '../lib/commissionLogic';
import { getFriendDiscountByAppointment, markReferralRewarded } from '../lib/clientReferral';
import { logCommunication } from '../lib/communicationLog';

export default function PosPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lang = detectInitialLanguage();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [artistIds, setArtistIds] = useState<string[]>([]);

  // Mode
  const [mode, setMode] = useState<'session' | 'quick'>('quick');

  // Session checkout state
  const [appointmentId, setAppointmentId] = useState(searchParams.get('appointmentId') || '');
  const [appointment, setAppointment] = useState<AppointmentRecord | null>(null);
  const [linkedProject, setLinkedProject] = useState<ProjectRecord | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<(AppointmentRecord & { clientName?: string })[]>([]);

  // Shared state
  const [inventory, setInventory] = useState<InventoryRecord[]>([]);
  const [cart, setCart] = useState<PosLineItem[]>([]);
  const [linkedClientId, setLinkedClientId] = useState('');
  const [linkedClient, setLinkedClient] = useState<ClientRecord | null>(null);
  const [walkInName, setWalkInName] = useState('');

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'other'>('cash');
  const [cashTendered, setCashTendered] = useState('');
  const [tipPercent, setTipPercent] = useState(0);
  const [tipCustom, setTipCustom] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Settings
  const [taxRate, setTaxRate] = useState(0);
  const [defaultServices, setDefaultServices] = useState<{ name: string; price: number }[]>([]);
  const [showTip, setShowTip] = useState(true);
  const [artistCommissionRate, setArtistCommissionRate] = useState<number | undefined>();

  // Referral friend discount
  const [friendDiscountCents, setFriendDiscountCents] = useState(0);
  const [friendDiscountCode, setFriendDiscountCode] = useState('');

  // UI state
  const [message, setMessage] = useState('');
  const [lastCompletedTx, setLastCompletedTx] = useState<{
    id: string; receiptNumber: string; items: PosLineItem[]; subtotal: number;
    tip?: number; depositApplied?: number; clientId?: string; walkInName?: string;
    paymentMethod: 'cash' | 'card' | 'other';
  } | null>(null);
  const [showRefundMode, setShowRefundMode] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [selectedTxForRefund, setSelectedTxForRefund] = useState('');
  const [recentTxs, setRecentTxs] = useState<{ id: string; receiptNumber: string; total: number; walkInName?: string }[]>([]);

  // Invoice preview state
  const [invoiceCountry, setInvoiceCountry] = useState('US');
  const [invoicePaymentMethod, setInvoicePaymentMethod] = useState<InvoiceRecord['paymentMethod']>('cash');
  const [invoiceNotes, setInvoiceNotes] = useState('');

  const depositAmount = linkedProject?.depositAmount || 0;
  const depositPaid =
    depositAmount > 0 &&
    (appointment?.status === 'deposit_paid' || linkedProject?.depositStatus === 'paid');

  useEffect(() => {

    const init = async () => {
      const stored = localStorage.getItem('inkflow_current_user');
      if (!stored) return;
      const u = await db.users.get(stored);
      if (!u) return;
      setUser(u);
      const ids = await getCurrentArtistIds(u);
      setArtistIds(ids);
      db.inventory.orderBy('name').toArray().then(setInventory);
      const settings = loadPosSettings();
      setTaxRate(settings.taxRate || 0);
      setDefaultServices(settings.defaultServices || []);
      setShowTip(isTippingCountry(u.country || 'US'));
      loadRecentTransactions(ids);
      loadTodayAppointments(ids);
    };
    init();
  }, []);

  useEffect(() => {
    const aid = searchParams.get('appointmentId');
    if (aid) {
      setAppointmentId(aid);
      setMode('session');
      loadAppointment(aid);
    }
  }, [searchParams]);

  const loadTodayAppointments = async (ids: string[]) => {
    const today = new Date().toISOString().slice(0, 10);
    const apps = await db.appointments.where('date').equals(today).and(a => ids.includes(a.artistId)).toArray();
    const enriched = await Promise.all(apps
      .filter(a => a.status !== 'cancelled' && a.status !== 'done')
      .map(async a => {
        const c = await db.clients.get(a.clientId);
        return { ...a, clientName: c?.name || 'Unknown' };
      }));
    setTodayAppointments(enriched.sort((a, b) => a.time.localeCompare(b.time)));
  };

  const loadAppointment = async (aid: string) => {
    const a = await db.appointments.get(aid);
    setAppointment(a || null);
    if (a) {
      setLinkedClientId(a.clientId);
      const c = await db.clients.get(a.clientId);
      setLinkedClient(c || null);
      const p = a.projectId ? await db.projects.get(a.projectId) : undefined;
      setLinkedProject(p || null);
      const rate = await getArtistCommissionRate(a.artistId);
      setArtistCommissionRate(rate);
      // Check for referral friend discount
      const refInfo = await getFriendDiscountByAppointment(aid);
      if (refInfo) {
        setFriendDiscountCents(refInfo.friendDiscount * 100);
        setFriendDiscountCode(refInfo.code);
      } else {
        setFriendDiscountCents(0);
        setFriendDiscountCode('');
      }
    }
  };

  const loadRecentTransactions = async (ids: string[]) => {
    const txs = await db.posTransactions.where('artistId').anyOf(ids).reverse().limit(10).toArray();
    setRecentTxs(txs.map(t => ({
      id: t.id, receiptNumber: t.receiptNumber, total: t.total, walkInName: t.walkInName,
    })));
  };

  const loadInventory = () => db.inventory.orderBy('name').toArray().then(setInventory);

  // Computed values
  const sellableItems = useMemo(() => {
    return inventory.filter(item => {
      const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = !categoryFilter || item.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [inventory, search, categoryFilter]);

  const categories = useMemo(() => {
    const cats = new Set(inventory.filter(i => i.price).map(i => i.category));
    return Array.from(cats).filter(Boolean).sort();
  }, [inventory]);

  const cartTotal = cart.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = Math.round(cartTotal * taxRate / 100);
  const tipAmount = tipCustom ? parseInt(tipCustom, 10) : Math.round(cartTotal * tipPercent / 100);
  const grossTotal = cartTotal + taxAmount + tipAmount;
  const balanceDue = Math.max(0, grossTotal - depositAmount - friendDiscountCents);
  const cashTenderedCents = Math.round(parseFloat(cashTendered || '0') * 100);
  const cashChange = paymentMethod === 'cash' && cashTendered ? Math.max(0, cashTenderedCents - balanceDue) : 0;

  // Cart operations
  const addToCart = (inv: InventoryRecord) => {
    const price = inv.price || 0;
    setCart(prev => {
      const existing = prev.find(i => i.inventoryId === inv.id);
      if (existing) {
        return prev.map(i => i.inventoryId === inv.id
          ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.price } : i);
      }
      return [...prev, { type: 'product', inventoryId: inv.id, name: inv.name, price, quantity: 1, total: price }];
    });
  };

  const addServiceToCart = (svc: { name: string; price: number }) => {
    setCart(prev => {
      const existing = prev.find(i => i.type === 'service' && i.name === svc.name);
      if (existing) {
        return prev.map(i => i.name === svc.name && i.type === 'service'
          ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.price } : i);
      }
      return [...prev, { type: 'service', name: svc.name, price: svc.price, quantity: 1, total: svc.price }];
    });
  };

  const updateCartQty = (index: number, delta: number) => {
    setCart(prev => {
      const next = [...prev];
      const item = next[index];
      const newQty = item.quantity + delta;
      if (newQty <= 0) return next.filter((_, i) => i !== index);
      next[index] = { ...item, quantity: newQty, total: newQty * item.price };
      return next;
    });
  };

  const removeFromCart = (index: number) => setCart(prev => prev.filter((_, i) => i !== index));
  const clearCart = () => {
    setCart([]); setWalkInName(''); setCashTendered('');
    setTipPercent(0); setTipCustom(''); setMessage('');
  };

  const [flashGreen, setFlashGreen] = useState(false);

  const feedbackSuccess = () => {
    // 1. Beep
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2);
    } catch { /* silent */ }

    // 2. Haptic
    try { navigator.vibrate(150); } catch { /* no haptics */ }

    // 3. Green flash
    setFlashGreen(true);
    setTimeout(() => setFlashGreen(false), 800);
  };

  const handleCompleteSale = async () => {
    if (cart.length === 0) { setMessage(t(lang, 'pos_cart_empty')); return; }
    if (paymentMethod === 'cash' && cashTendered && cashTenderedCents < balanceDue) {
      setMessage(t(lang, 'pos_insufficient_cash')); return;
    }
    try {
      const uid = user?.id || localStorage.getItem('inkflow_current_user') || 'demo_artist';
      const receiptNumber = generateReceiptNumber(uid);
      const locationId = localStorage.getItem('inkflow_current_location') || undefined;
      const tx = {
        id: 'postx_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        artistId: uid,
        clientId: linkedClientId || undefined,
        walkInName: walkInName.trim() || undefined,
        appointmentId: appointmentId || undefined,
        items: [...cart],
        subtotal: cartTotal,
        depositApplied: depositPaid ? depositAmount : undefined,
        tip: tipAmount || undefined,
        tax: taxAmount || undefined,
        total: balanceDue,
        locationId,
        paymentMethod,
        paymentStatus: 'completed' as const,
        receiptNumber,
        createdAt: Date.now(),
      };
      await db.posTransactions.add(tx);
      await deductInventory(tx);

      // Update client stats (use grossTotal to include deposit in lifetime spend)
      if (linkedClientId) {
        const client = await db.clients.get(linkedClientId);
        if (client) {
          await db.clients.update(linkedClientId, {
            lastVisitAt: Date.now(),
            totalSpend: (client.totalSpend || 0) + grossTotal,
          });
        }
      }

      // Update appointment
      if (appointmentId) {
        await db.appointments.update(appointmentId, { status: 'done' });
      }

      // Mark referral as rewarded after payment
      if (friendDiscountCode) {
        await markReferralRewarded(friendDiscountCode);
      }

      const clientName = linkedClient?.name || walkInName;
      setMessage(t(lang, 'pos_sale_completed') + ' ' + receiptNumber);
      setLastCompletedTx({
        id: tx.id, receiptNumber, items: [...cart], subtotal: cartTotal,
        tip: tipAmount || undefined, depositApplied: depositPaid ? depositAmount : undefined,
        clientId: linkedClientId || undefined, walkInName: walkInName.trim() || undefined,
        paymentMethod,
      });
      setInvoiceCountry(user?.country || 'US');
      setInvoicePaymentMethod((paymentMethod === 'other' ? 'cash' : paymentMethod) as InvoiceRecord['paymentMethod']);
      setInvoiceNotes('');
      feedbackSuccess();
      logCommunication(uid, 'app_note', 'auto', {
        clientId: linkedClientId || undefined,
        appointmentId: appointmentId || undefined,
        message: `Payment received: $${(balanceDue + (depositPaid ? depositAmount : 0)).toFixed(2)} (${paymentMethod})${linkedClient?.name ? ' from ' + linkedClient.name : ''}`,
        templateType: 'payment_received',
      });
      printReceipt(tx, clientName);
      clearCart();
      setAppointment(null);
      setAppointmentId('');
      setLinkedClient(null);
      setLinkedClientId('');
      setFriendDiscountCents(0);
      setFriendDiscountCode('');
      setMode('quick');
      loadRecentTransactions(artistIds);
      loadInventory();
      loadTodayAppointments(artistIds);
    } catch (e: any) { setMessage(t(lang, 'pos_sale_failed') + ' ' + (e?.message || 'unknown')); }
  };

  // Refund
  const handleRefund = async () => {
    if (!selectedTxForRefund) return;
    try {
      const tx = await db.posTransactions.get(selectedTxForRefund);
      if (!tx || tx.paymentStatus === 'refunded') { setMessage('Transaction not found or already refunded'); return; }
      await db.posTransactions.update(selectedTxForRefund, { paymentStatus: 'refunded', refundReason: refundReason || undefined });
      await restoreInventory(tx);
      setMessage(t(lang, 'pos_refund_completed'));
      setShowRefundMode(false); setSelectedTxForRefund(''); setRefundReason('');
      loadRecentTransactions(artistIds); loadInventory(); loadTodayAppointments(artistIds);
    } catch (e: any) { setMessage('Refund failed: ' + (e?.message || 'unknown')); }
  };

  const handleGenerateInvoice = async (navigateAfter: boolean) => {
    if (!lastCompletedTx || !user) return;
    try {
      const existing = await db.invoices.where('posTransactionId').equals(lastCompletedTx.id).count();
      if (existing > 0) {
        setMessage('Invoice already exists for this transaction');
        return;
      }
      const cfg = getCountryConfig(invoiceCountry);
      const taxRate = cfg.defaultTaxRate;
      const tax = Math.round(lastCompletedTx.subtotal * taxRate) / 100;
      const depositApplied = lastCompletedTx.depositApplied || 0;
      const total = lastCompletedTx.subtotal + tax + (lastCompletedTx.tip || 0) - depositApplied;

      const settings = loadInvoiceSettings();
      const invs = await db.invoices.where('artistId').equals(user.id).toArray();
      const yy = String(new Date().getFullYear()).slice(2);
      const mm = String(new Date().getMonth() + 1).padStart(2, '0');
      const seq = String(invs.length + 1).padStart(4, '0');

      const prefix = cfg.invoiceTitle.replace(/\s/g, '-').toUpperCase().slice(0, 3);
      const dueDate = settings.defaultDueDays
        ? Date.now() + settings.defaultDueDays * 24 * 60 * 60 * 1000
        : Date.now() + 30 * 24 * 60 * 60 * 1000;
      const invoice: InvoiceRecord = {
        id: 'inv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        invoiceNumber: `${prefix}-${yy}${mm}-${seq}`,
        artistId: user.id,
        clientId: lastCompletedTx.clientId,
        walkInName: lastCompletedTx.walkInName,
        items: lastCompletedTx.items.map(i => ({ type: i.type, name: i.name, price: i.price, quantity: i.quantity, total: i.total })),
        subtotal: lastCompletedTx.subtotal,
        tax,
        taxRate,
        depositApplied: lastCompletedTx.depositApplied || undefined,
        tip: lastCompletedTx.tip || undefined,
        total,
        currency: cfg.currency,
        country: invoiceCountry,
        paymentMethod: invoicePaymentMethod,
        paymentStatus: 'paid',
        posTransactionId: lastCompletedTx.id,
        notes: invoiceNotes.trim() || undefined,
        createdAt: Date.now(),
        paidAt: Date.now(),
        dueDate,
        amountPaid: total,
      };

      await db.invoices.add(invoice);
      setMessage(`Invoice #${invoice.invoiceNumber} created!`);
      setLastCompletedTx(null);
      if (navigateAfter) {
        navigate(`/invoice/${invoice.id}`);
      } else {
        loadRecentTransactions(artistIds);
      }
    } catch (e: any) {
      setMessage('Invoice failed: ' + (e?.message || 'unknown'));
    }
  };

  const formatCents = (c: number) => (c / 100).toFixed(2);
  const tipPresets = [0, 10, 15, 20];

  return (
    <div style={{ padding: 12, color: THEME.text.primary, paddingBottom: 120, position: 'relative' }}>
      {flashGreen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(34,197,94,0.25)', zIndex: 9999, pointerEvents: 'none', transition: 'opacity 0.4s', borderRadius: 0 }} />
      )}
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h2 style={{ fontSize: 18, fontWeight: 'bold', margin: 0 }}>{t(lang, 'pos_register')}</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setShowRefundMode(!showRefundMode)}
            style={headerBtn(showRefundMode)}>{t(lang, 'pos_refund')}</button>
          <button onClick={() => navigate('/pos-settings')}
            style={headerBtn(false)}>{t(lang, 'pos_settings')}</button>
        </div>
      </div>

      {/* Mode Toggle */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <button onClick={() => setMode('session')}
          style={modeBtn(mode === 'session')}>{t(lang, 'pos_session_checkout')}</button>
        <button onClick={() => setMode('quick')}
          style={modeBtn(mode === 'quick')}>{t(lang, 'pos_quick_sale')}</button>
      </div>

      {message && (
        <div style={{ background: message.includes(t(lang, 'pos_sale_failed')) || message.includes('Refund failed') || message.includes(t(lang, 'pos_refund_not_found')) ? '#7f1d1d' : '#14532d', padding: 8, borderRadius: 8, marginBottom: 10 }}>
          <p style={{ fontSize: 12, color: message.includes(t(lang, 'pos_sale_failed')) || message.includes('Refund failed') || message.includes(t(lang, 'pos_refund_not_found')) ? '#fca5a5' : '#86efac' }}>{message}</p>
        </div>
      )}

      {/* Invoice Preview — after successful sale */}
      {lastCompletedTx && (() => {
        const invCfg = getCountryConfig(invoiceCountry);
        const invTax = Math.round(lastCompletedTx.subtotal * invCfg.defaultTaxRate) / 100;
        const invDeposit = lastCompletedTx.depositApplied || 0;
        const invTip = lastCompletedTx.tip || 0;
        const invTotal = lastCompletedTx.subtotal + invTax + invTip - invDeposit;
        const clientName = lastCompletedTx.walkInName || linkedClient?.name || '';
        const supported = [
          { code: 'US', flag: '🇺🇸' }, { code: 'CA', flag: '🇨🇦' }, { code: 'MX', flag: '🇲🇽' },
          { code: 'BR', flag: '🇧🇷' }, { code: 'AR', flag: '🇦🇷' }, { code: 'CL', flag: '🇨🇱' },
          { code: 'CO', flag: '🇨🇴' }, { code: 'PE', flag: '🇵🇪' },
          { code: 'AU', flag: '🇦🇺' }, { code: 'NZ', flag: '🇳🇿' },
          { code: 'GB', flag: '🇬🇧' }, { code: 'DE', flag: '🇩🇪' }, { code: 'FR', flag: '🇫🇷' },
          { code: 'ES', flag: '🇪🇸' }, { code: 'PT', flag: '🇵🇹' }, { code: 'IT', flag: '🇮🇹' },
          { code: 'NL', flag: '🇳🇱' }, { code: 'BE', flag: '🇧🇪' }, { code: 'AT', flag: '🇦🇹' },
          { code: 'CH', flag: '🇨🇭' }, { code: 'SE', flag: '🇸🇪' }, { code: 'NO', flag: '🇳🇴' },
          { code: 'DK', flag: '🇩🇰' }, { code: 'FI', flag: '🇫🇮' }, { code: 'IE', flag: '🇮🇪' },
          { code: 'PL', flag: '🇵🇱' },
          { code: 'JP', flag: '🇯🇵' }, { code: 'TH', flag: '🇹🇭' }, { code: 'KR', flag: '🇰🇷' },
        ];
        return (
        <div style={{ background: '#1e293b', padding: 14, borderRadius: 12, marginBottom: 10, border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#c084fc' }}>{invCfg.invoiceTitle}</p>
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                From receipt #{lastCompletedTx.receiptNumber}
              </p>
            </div>
            <select
              value={invoiceCountry}
              onChange={e => setInvoiceCountry(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #475569', background: '#0f172a', color: 'white', fontSize: 12, maxWidth: 200 }}>
              {supported.map(c => (
                <option key={c.code} value={c.code}>{c.flag} {getCountryConfig(c.code).name}</option>
              ))}
            </select>
          </div>

          {/* Preview card */}
          <div style={{ background: '#0f172a', borderRadius: 10, padding: 14, marginBottom: 10, border: '1px solid #1a2332' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: '#64748b' }}>{invCfg.dateLabel}</span>
              <span style={{ fontSize: 11 }}>{new Date().toLocaleDateString(invCfg.locale, { dateStyle: 'medium' })}</span>
            </div>
            {clientName && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: '#64748b' }}>{invCfg.clientLabel}</span>
              <span style={{ fontSize: 11 }}>{clientName}</span>
            </div>
            )}
            <div style={{ borderTop: '1px solid #1a2332', margin: '6px 0' }} />
            {lastCompletedTx.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                <span style={{ color: '#94a3b8' }}>
                  {item.name}  x{item.quantity}  @{formatCents(item.price)}  = {formatCents(item.total)}
                </span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid #1a2332', margin: '6px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
              <span style={{ color: '#94a3b8' }}>{invCfg.subtotalLabel}</span>
              <span>{formatCents(lastCompletedTx.subtotal)}</span>
            </div>
            {invDeposit > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
              <span style={{ color: '#4ade80' }}>{invCfg.depositLabel}</span>
              <span style={{ color: '#4ade80' }}>-{formatCents(invDeposit)}</span>
            </div>
            )}
            {invTax > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
              <span style={{ color: '#94a3b8' }}>{invCfg.taxLabelFull}</span>
              <span>{formatCents(invTax)}</span>
            </div>
            )}
            {invTip > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
              <span style={{ color: '#94a3b8' }}>{invCfg.tipLabel}</span>
              <span>{formatCents(invTip)}</span>
            </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, borderTop: '1px solid #334155', paddingTop: 6, marginTop: 4 }}>
              <span>{invCfg.totalLabel}</span>
              <span style={{ color: '#22c55e' }}>{invCfg.currency === 'JPY' || invCfg.currency === 'KRW' || invCfg.currency === 'CLP' || invCfg.currency === 'COP'
                ? new Intl.NumberFormat(invCfg.locale, { style: 'currency', currency: invCfg.currency, maximumFractionDigits: 0 }).format(invTotal / 100)
                : formatCents(invTotal)}</span>
            </div>
          </div>

          {/* Payment method + Notes */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <select value={invoicePaymentMethod}
              onChange={e => setInvoicePaymentMethod(e.target.value as InvoiceRecord['paymentMethod'])}
              style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #475569', background: '#0f172a', color: 'white', fontSize: 12 }}>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="stripe_connect">Stripe</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="paypal">PayPal</option>
              <option value="other">Other</option>
            </select>
            <input
              placeholder="Notes"
              value={invoiceNotes}
              onChange={e => setInvoiceNotes(e.target.value)}
              style={{ flex: 2, padding: '8px 10px', borderRadius: 8, border: '1px solid #475569', background: '#0f172a', color: 'white', fontSize: 12, outline: 'none' }} />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setLastCompletedTx(null); setMessage(''); }}
              style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #475569', background: 'transparent', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}>
              Skip
            </button>
            <button onClick={() => handleGenerateInvoice(false)}
              style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: 'none', background: '#7e22ce', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Create & Stay
            </button>
            <button onClick={() => handleGenerateInvoice(true)}
              style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #a855f7', background: '#7e22ce20', color: '#c084fc', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Create & View
            </button>
          </div>
        </div>
        );
      })()}

      {/* Refund Mode */}
      {showRefundMode && (
        <div style={{ background: '#1e293b', padding: 12, borderRadius: 10, marginBottom: 10 }}>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{t(lang, 'pos_refund_transaction')}</p>
          <select value={selectedTxForRefund} onChange={e => setSelectedTxForRefund(e.target.value)}
            style={selectStyle}>
            <option value="">{t(lang, 'pos_select_transaction')}</option>
            {recentTxs.map(t => (
              <option key={t.id} value={t.id}>{t.receiptNumber} - ${formatCents(t.total)} {t.walkInName || ''}</option>
            ))}
          </select>
          <input placeholder={t(lang, 'refund_reason')} value={refundReason} onChange={e => setRefundReason(e.target.value)} style={inputStyle} />
          <button onClick={handleRefund} disabled={!selectedTxForRefund}
            style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', background: selectedTxForRefund ? '#dc2626' : '#4b5563', color: 'white', fontSize: 13, fontWeight: 600 }}>
            {t(lang, 'pos_confirm_refund')}
          </button>
        </div>
      )}

      {/* Session Checkout Mode */}
      {mode === 'session' && (
        <div style={{ marginBottom: 12 }}>
          {!appointment ? (
            <>
              <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>{t(lang, 'pos_select_appointment')}</p>
              {todayAppointments.length === 0 ? (
                <p style={{ fontSize: 13, color: '#64748b' }}>{t(lang, 'pos_no_active_appointments')}</p>
              ) : (
                todayAppointments.map(a => (
                  <div key={a.id} onClick={() => { setAppointmentId(a.id); loadAppointment(a.id); }}
                    style={{ background: '#1e293b', borderRadius: 8, padding: 10, marginBottom: 6, cursor: 'pointer', border: appointmentId === a.id ? '1px solid #22c55e' : '1px solid transparent' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600 }}>{a.clientName}</p>
                        <p style={{ fontSize: 12, color: '#94a3b8' }}>{a.time} · {a.duration}min · {a.type || 'appointment'}</p>
                      </div>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: a.status === 'deposit_paid' ? '#14532d' : '#334155', color: a.status === 'deposit_paid' ? '#4ade80' : '#94a3b8' }}>
                        {a.status === 'deposit_paid' ? t(lang, 'pos_deposit_paid_label') : t(lang, 'pos_unconfirmed')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </>
          ) : (
            /* Active session checkout */
            <div style={{ background: '#14532d', borderRadius: 10, padding: 12, border: '1px solid #22c55e' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#4ade80' }}>{t(lang, 'pos_checking_out')} {linkedClient?.name || 'Client'}</p>
                <button onClick={() => { setAppointment(null); setAppointmentId(''); setLinkedClientId(''); setLinkedClient(null); clearCart(); }}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}>{t(lang, 'pos_change_btn')}</button>
              </div>
              {appointment && (
                <p style={{ fontSize: 12, color: '#86efac' }}>
                  {appointment.time} · {appointment.duration}min · {appointment.type || 'appointment'}
                  {depositPaid ? ` · ${t(lang, 'pos_deposit_paid_label')}: $${formatCents(depositAmount)} ${t(lang, 'pos_applied')}` : ` · ${t(lang, 'pos_no_deposit')}`}
                </p>
              )}
              {/* Quick-add session work price */}
              <SessionWorkQuickAdd onAdd={addServiceToCart} />
            </div>
          )}
        </div>
      )}

      {/* Quick Sale: walk-in name */}
      {mode === 'quick' && (
        <input placeholder={t(lang, 'pos_walk_in_name')} value={walkInName} onChange={e => setWalkInName(e.target.value)}
          style={{ ...inputStyle, marginBottom: 8 }} />
      )}

      {/* Search & Categories */}
      <input placeholder={t(lang, 'pos_search_products')} value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, marginBottom: 6 }} />
      <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
        <button onClick={() => setCategoryFilter('')} style={chip(!categoryFilter)}>All</button>
        {categories.map(cat => (
          <button key={cat} onClick={() => setCategoryFilter(cat === categoryFilter ? '' : cat)}
            style={chip(categoryFilter === cat)}>{cat}</button>
        ))}
      </div>

      {/* Quick Services */}
      {defaultServices.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {defaultServices.map((svc, i) => (
              <button key={i} onClick={() => addServiceToCart(svc)}
                style={svcBtn}>{svc.name} ${formatCents(svc.price)}</button>
            ))}
          </div>
        </div>
      )}

      {/* Product Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 6, maxHeight: 160, overflowY: 'auto', marginBottom: 10 }}>
        {sellableItems.filter(i => i.price).map(item => (
          <button key={item.id} onClick={() => addToCart(item)} disabled={item.quantity <= 0}
            style={productBtn(item.quantity <= 0)}>
            <div style={{ fontWeight: 600, marginBottom: 1, fontSize: 11 }}>{item.name}</div>
            <div style={{ color: '#22c55e', fontWeight: 700, fontSize: 12 }}>${formatCents(item.price!)}</div>
            <div style={{ fontSize: 9, color: item.quantity <= item.reorderLevel ? '#fca5a5' : '#64748b' }}>
              {item.quantity <= 0 ? t(lang, 'pos_out_of_stock') : `${item.quantity} ${item.unit}`}
            </div>
          </button>
        ))}
      </div>

      {/* Cart */}
      <div style={{ background: '#1e293b', borderRadius: 10, padding: 10, marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <p style={{ fontSize: 13, fontWeight: 600 }}>{t(lang, 'pos_cart')} ({cart.length})</p>
          {cart.length > 0 && (
            <button onClick={clearCart} style={{ background: 'none', border: 'none', color: '#f87171', fontSize: 11, cursor: 'pointer' }}>
              {t(lang, 'pos_clear_cart')}
            </button>
          )}
        </div>
        {cart.length === 0 ? (
          <p style={{ fontSize: 11, color: '#64748b' }}>{t(lang, 'pos_tap_to_add')}</p>
        ) : (
          cart.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1a2332' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => updateCartQty(i, -1)} style={qtyBtn}>−</button>
                <span style={{ fontSize: 15, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                <button onClick={() => updateCartQty(i, 1)} style={qtyBtn}>+</button>
                <span style={{ fontSize: 14, fontWeight: 600, minWidth: 52, textAlign: 'right' }}>${formatCents(item.total)}</span>
                <button onClick={() => removeFromCart(i)} style={{ ...actionBtn, color: '#f87171' }}>✕</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Payment Summary */}
      <div style={{ background: '#1e293b', borderRadius: 10, padding: 10, marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ color: '#94a3b8', fontSize: 12 }}>{t(lang, 'pos_subtotal')}</span>
          <span style={{ fontSize: 12 }}>${formatCents(cartTotal)}</span>
        </div>
        {taxRate > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ color: '#94a3b8', fontSize: 12 }}>{t(lang, 'pos_tax')} ({taxRate}%)</span>
            <span style={{ fontSize: 12 }}>${formatCents(taxAmount)}</span>
          </div>
        )}
        {depositPaid && depositAmount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ color: '#4ade80', fontSize: 12 }}>{t(lang, 'pos_deposit_paid_label')} {t(lang, 'pos_applied')}</span>
            <span style={{ fontSize: 12, color: '#4ade80' }}>-${formatCents(depositAmount)}</span>
          </div>
        )}
        {friendDiscountCents > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ color: '#fbbf24', fontSize: 12 }}>🎁 {t(lang, 'referral_client_title')}</span>
            <span style={{ fontSize: 12, color: '#fbbf24' }}>-${formatCents(friendDiscountCents)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, paddingTop: 4, borderTop: '1px solid #334155' }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{t(lang, 'pos_total')}</span>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#22c55e' }}>${formatCents(balanceDue)}</span>
        </div>

        {/* Tip — only show in tipping countries */}
        {showTip && (
        <div style={{ borderTop: '1px solid #334155', paddingTop: 6, marginTop: 4 }}>
          <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{t(lang, 'pos_tip_label')}</p>
          <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
            {tipPresets.map(pct => (
              <button key={pct} onClick={() => { setTipPercent(pct); setTipCustom(''); }}
                style={tipBtn(tipPercent === pct && !tipCustom)}>{pct}%</button>
            ))}
            <input type="number" placeholder={t(lang, 'pos_tip_custom')} value={tipCustom}
              onChange={e => { setTipCustom(e.target.value); if (e.target.value) setTipPercent(0); }}
              style={{ width: 64, padding: '4px 6px', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 11, textAlign: 'center' }} />
          </div>
          {tipAmount > 0 && (
            <p style={{ fontSize: 11, color: '#fbbf24' }}>{t(lang, 'pos_tip_label')}: ${formatCents(tipAmount)}</p>
          )}
        </div>
        )}

        {/* Commission preview — session mode with rate set */}
        {mode === 'session' && artistCommissionRate != null && cartTotal > 0 && (
        <div style={{ borderTop: '1px solid #334155', paddingTop: 6, marginTop: 4 }}>
          <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>Commission ({artistCommissionRate}%)</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ fontSize: 11, color: '#86efac' }}>Artist ({artistCommissionRate}%)</span>
            <span style={{ fontSize: 11, color: '#86efac' }}>${formatCents(calculateCommission(cartTotal, artistCommissionRate).artistShare)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Shop ({100 - artistCommissionRate}%)</span>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>${formatCents(calculateCommission(cartTotal, artistCommissionRate).shopShare)}</span>
          </div>
          <p style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>Tip goes 100% to artist. Based on subtotal (before tax/tip).</p>
        </div>
        )}

        {/* Payment Method */}
        <div style={{ borderTop: '1px solid #334155', paddingTop: 6, marginTop: 4 }}>
          <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{t(lang, 'pos_payment_method')}</p>
          <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
            {(['cash', 'card', 'other'] as const).map(m => (
              <button key={m} onClick={() => setPaymentMethod(m)}
                style={payBtn(paymentMethod === m)}>
                {t(lang, `pos_${m}`)}
              </button>
            ))}
          </div>
          {paymentMethod === 'cash' && (
            <div>
              <input type="number" placeholder={t(lang, 'pos_cash_tendered')} value={cashTendered}
                onChange={e => setCashTendered(e.target.value)} step="0.01" min="0"
                style={{ ...inputStyle, marginBottom: 4, fontSize: 16 }} />
              {cashTendered && cashTenderedCents >= balanceDue && (
                <p style={{ fontSize: 13, color: '#86efac', fontWeight: 600 }}>{t(lang, 'pos_change_due')}: ${formatCents(cashChange)}</p>
              )}
            </div>
          )}
        </div>

        <button onClick={handleCompleteSale} disabled={cart.length === 0}
          style={{ width: '100%', padding: 16, borderRadius: 12, border: 'none', background: cart.length === 0 ? '#4b5563' : '#22c55e', color: 'white', fontSize: 17, fontWeight: 800, marginTop: 8 }}>
          {t(lang, 'pos_complete_sale')} — ${formatCents(balanceDue)}
        </button>
      </div>

      {/* Recent Transactions */}
      {recentTxs.length > 0 && (
        <div style={{ background: '#1e293b', borderRadius: 10, padding: 10 }}>
          <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{t(lang, 'pos_recent_sales')}</p>
          {recentTxs.slice(0, 5).map(t => (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #1a2332' }}>
              <span style={{ fontSize: 11 }}>{t.receiptNumber} {t.walkInName ? `- ${t.walkInName}` : ''}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#22c55e' }}>${formatCents(t.total)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SessionWorkQuickAdd({ onAdd }: { onAdd: (svc: { name: string; price: number }) => void }) {
  const [workPrice, setWorkPrice] = useState('');
  const [workLabel, setWorkLabel] = useState('Session Work');

  const handleAdd = () => {
    const price = Math.round(parseFloat(workPrice || '0') * 100);
    if (price <= 0) return;
    onAdd({ name: workLabel || 'Session Work', price });
    setWorkPrice('');
  };

  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center' }}>
      <input
        placeholder="Label"
        value={workLabel}
        onChange={e => setWorkLabel(e.target.value)}
        style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: '1px solid #22c55e', background: '#0f172a', color: 'white', fontSize: 12, outline: 'none' }}
      />
      <span style={{ color: '#4ade80', fontSize: 12 }}>$</span>
      <input
        type="number"
        placeholder="0"
        value={workPrice}
        onChange={e => setWorkPrice(e.target.value)}
        step="0.01"
        min="0"
        style={{ width: 80, padding: '6px 8px', borderRadius: 6, border: '1px solid #22c55e', background: '#0f172a', color: 'white', fontSize: 12, outline: 'none' }}
      />
      <button onClick={handleAdd} disabled={!workPrice || parseFloat(workPrice) <= 0}
        style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: (workPrice && parseFloat(workPrice) > 0) ? '#22c55e' : '#1e293b', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
        + Add
      </button>
    </div>
  );
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 15, outline: 'none', boxSizing: 'border-box', marginBottom: 4 };
const selectStyle: React.CSSProperties = { ...inputStyle, appearance: 'auto', marginBottom: 6 };
const qtyBtn: React.CSSProperties = { width: 36, height: 36, borderRadius: 18, border: '1px solid #475569', background: '#1e293b', color: 'white', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };
const actionBtn: React.CSSProperties = { width: 32, height: 32, borderRadius: 8, border: 'none', background: '#334155', color: '#94a3b8', fontSize: 14, cursor: 'pointer' };
const headerBtn = (active: boolean): React.CSSProperties => ({ padding: '8px 14px', borderRadius: 8, border: '1px solid #475569', background: active ? '#7f1d1d' : '#1e293b', color: active ? '#fca5a5' : '#94a3b8', fontSize: 13, cursor: 'pointer' });
const modeBtn = (active: boolean): React.CSSProperties => ({ flex: 1, padding: '12px 0', borderRadius: 10, border: 'none', background: active ? '#e11d48' : '#334155', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' });
const chip = (active: boolean): React.CSSProperties => ({ padding: '8px 14px', borderRadius: 8, border: 'none', background: active ? '#e11d48' : '#334155', color: 'white', fontSize: 13, fontWeight: 500, cursor: 'pointer' });
const svcBtn: React.CSSProperties = { padding: '10px 16px', borderRadius: 8, border: '1px solid #22c55e', background: '#14532d', color: '#86efac', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
const productBtn = (disabled: boolean): React.CSSProperties => ({ padding: '12px 10px', borderRadius: 10, border: '1px solid #334155', background: disabled ? '#1a1a1a' : '#1e293b', color: disabled ? '#64748b' : '#e2e8f0', fontSize: 13, cursor: disabled ? 'not-allowed' : 'pointer', textAlign: 'left', opacity: disabled ? 0.5 : 1 });
const tipBtn = (active: boolean): React.CSSProperties => ({ padding: '10px 16px', borderRadius: 8, border: 'none', background: active ? '#fbbf24' : '#334155', color: active ? '#0f172a' : 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' });
const payBtn = (active: boolean): React.CSSProperties => ({ flex: 1, padding: '12px 0', borderRadius: 10, border: 'none', background: active ? '#e11d48' : '#334155', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' });
