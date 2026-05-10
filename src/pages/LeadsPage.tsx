import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type LeadRecord, type LeadRevisionRecord, type PortfolioRecord, type UserRecord } from '../db';
import { detectInitialLanguage, t } from '../lib/i18n';
import { buildDepositLink, getSuggestedDepositAmount } from '../lib/payments';

type FollowPreset = {
  id: string;
  label: string;
  minutes: number;
};

const STATUS_COLORS: Record<LeadRecord['status'], string> = {
  new: '#60a5fa',
  contacted: '#f59e0b',
  booked: '#34d399',
  won: '#22c55e',
  lost: '#94a3b8',
};

const DEFAULT_PRESETS: FollowPreset[] = [
  { id: 'tomorrow', label: 'Tomorrow', minutes: 24 * 60 },
  { id: 'in_3_days', label: 'In 3 Days', minutes: 3 * 24 * 60 },
  { id: 'next_monday', label: 'Next Monday', minutes: 7 * 24 * 60 },
  { id: 'month_end', label: 'Month End', minutes: 21 * 24 * 60 },
];

function presetsKey(artistId: string) {
  return `inkflow_followup_presets_${artistId}`;
}

function loadPresets(artistId: string): FollowPreset[] {
  if (!artistId) return DEFAULT_PRESETS;
  try {
    const raw = localStorage.getItem(presetsKey(artistId));
    if (!raw) return DEFAULT_PRESETS;
    const parsed = JSON.parse(raw) as FollowPreset[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_PRESETS;
    return parsed.filter(p => p && typeof p.label === 'string' && Number.isFinite(p.minutes) && p.minutes > 0);
  } catch {
    return DEFAULT_PRESETS;
  }
}

function recommendMinutesFromText(text: string): number {
  const t = text.toLowerCase();
  if (/tomorrow|明天|tmr/.test(t)) return 24 * 60;
  if (/next week|下周|monday|周一/.test(t)) return 7 * 24 * 60;
  if (/later|之后|过几天|3天|three days|few days/.test(t)) return 3 * 24 * 60;
  if (/urgent|asap|today|今天|马上/.test(t)) return 4 * 60;
  return 2 * 24 * 60;
}

function parseMoney(input?: string): number {
  if (!input) return 0;
  const num = Number(String(input).replace(/[^0-9.]/g, ''));
  return Number.isFinite(num) ? num : 0;
}

function spendKey(artistId: string, days: 7 | 30) {
  return `inkflow_roi_spend_${artistId}_${days}`;
}

function creativeSpendKey(artistId: string, days: 7 | 30) {
  return `inkflow_roi_creative_spend_${artistId}_${days}`;
}

function paymentSyncCursorKey(artistId: string) {
  return `inkflow_payment_sync_cursor_${artistId}`;
}

function paymentMethodLabel(method?: LeadRecord['paymentMethod']) {
  if (method === 'stripe_connect') return 'Stripe';
  if (method === 'manual_link') return 'Manual Link';
  if (method === 'bank_transfer') return 'Bank Transfer';
  if (method === 'cash') return 'Cash';
  return 'Not set';
}

function nextStepHint(mode?: LeadRecord['consultMode']) {
  if (mode === 'consult_booking') return 'Next: offer 15-30 min consult slots and lock one.';
  if (mode === 'walk_in_direct') return 'Next: send address, arrival time, and 24h/3h reminders.';
  return 'Next: send 3 time options + deposit link in chat.';
}

function toMinutes(time: string) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function toTime(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function toDateTimeValue(ts: number) {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

export default function LeadsPage() {
  const navigate = useNavigate();
  const lang = detectInitialLanguage();
  const [artistId, setArtistId] = useState('');
  const [artistUser, setArtistUser] = useState<UserRecord | null>(null);
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [filter, setFilter] = useState<LeadRecord['status'] | 'all'>('all');
  const [revisionsByLead, setRevisionsByLead] = useState<Map<string, LeadRevisionRecord[]>>(new Map());
  const [draftNoteByLead, setDraftNoteByLead] = useState<Record<string, string>>({});
  const [draftChangeByLead, setDraftChangeByLead] = useState<Record<string, string>>({});
  const [draftImagesByLead, setDraftImagesByLead] = useState<Record<string, string[]>>({});
  const [draftChannelByLead, setDraftChannelByLead] = useState<Record<string, LeadRevisionRecord['channel']>>({});
  const [draftPaymentAmountByLead, setDraftPaymentAmountByLead] = useState<Record<string, string>>({});
  const [draftPaymentMethodByLead, setDraftPaymentMethodByLead] = useState<Record<string, LeadRecord['paymentMethod']>>({});
  const [draftPaymentNoteByLead, setDraftPaymentNoteByLead] = useState<Record<string, string>>({});
  const [draftPaymentProofByLead, setDraftPaymentProofByLead] = useState<Record<string, string[]>>({});
  const [quickActionByLead, setQuickActionByLead] = useState<Record<string, 'contacted' | 'awaiting_confirmation' | 'booked_slot'>>({});
  const [followPresets, setFollowPresets] = useState<FollowPreset[]>(DEFAULT_PRESETS);
  const [newPresetLabel, setNewPresetLabel] = useState('');
  const [newPresetDays, setNewPresetDays] = useState('');
  const [manualFollowByLead, setManualFollowByLead] = useState<Record<string, string>>({});
  const [statsWindowDays, setStatsWindowDays] = useState<7 | 30>(7);
  const [spendBySource, setSpendBySource] = useState<Record<string, string>>({});
  const [spendByCreative, setSpendByCreative] = useState<Record<string, string>>({});
  const [promoAssets, setPromoAssets] = useState<PortfolioRecord[]>([]);
  const [selectedCreativeId, setSelectedCreativeId] = useState('');
  const [suggestedSlotsByLead, setSuggestedSlotsByLead] = useState<Record<string, string[]>>({});
  const [syncingPayments, setSyncingPayments] = useState(false);
  const syncingPaymentsRef = useRef(false);

  useEffect(() => {
    const current = localStorage.getItem('inkflow_current_user');
    if (!current) return;
    setArtistId(current);
    db.users.get(current).then(u => setArtistUser(u || null));
    setFollowPresets(loadPresets(current));
    db.leads.where('artistId').equals(current).reverse().sortBy('createdAt').then(setLeads);
    db.portfolio.where('artistId').equals(current).toArray().then(items => {
      const approved = items
        .filter(p => p.consentForPromotion)
        .sort((a, b) => b.createdAt - a.createdAt);
      setPromoAssets(approved);
      if (approved.length > 0) setSelectedCreativeId(approved[0].id);
    });
    void syncPayments(current);
  }, []);

  useEffect(() => {
    void loadRevisions();
  }, [leads]);

  useEffect(() => {
    if (!artistId) return;
    localStorage.setItem(presetsKey(artistId), JSON.stringify(followPresets));
  }, [artistId, followPresets]);

  useEffect(() => {
    if (!artistId) return;
    const raw = localStorage.getItem(spendKey(artistId, statsWindowDays));
    if (!raw) {
      setSpendBySource({});
      return;
    }
    try {
      setSpendBySource(JSON.parse(raw) as Record<string, string>);
    } catch {
      setSpendBySource({});
    }
  }, [artistId, statsWindowDays]);

  useEffect(() => {
    if (!artistId) return;
    localStorage.setItem(spendKey(artistId, statsWindowDays), JSON.stringify(spendBySource));
  }, [artistId, statsWindowDays, spendBySource]);

  useEffect(() => {
    if (!artistId) return;
    const raw = localStorage.getItem(creativeSpendKey(artistId, statsWindowDays));
    if (!raw) {
      setSpendByCreative({});
      return;
    }
    try {
      setSpendByCreative(JSON.parse(raw) as Record<string, string>);
    } catch {
      setSpendByCreative({});
    }
  }, [artistId, statsWindowDays]);

  useEffect(() => {
    if (!artistId) return;
    localStorage.setItem(creativeSpendKey(artistId, statsWindowDays), JSON.stringify(spendByCreative));
  }, [artistId, statsWindowDays, spendByCreative]);

  useEffect(() => {
    if (!artistId) return;
    const timer = window.setInterval(() => {
      void syncPayments(artistId);
    }, 30 * 1000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void syncPayments(artistId);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [artistId]);

  const loadRevisions = async () => {
    if (leads.length === 0) {
      setRevisionsByLead(new Map());
      return;
    }
    const ids = new Set(leads.map(l => l.id));
    const all = await db.leadRevisions.orderBy('createdAt').reverse().toArray();
    const grouped = new Map<string, LeadRevisionRecord[]>();
    for (const r of all) {
      if (!ids.has(r.leadId)) continue;
      const arr = grouped.get(r.leadId) || [];
      arr.push(r);
      grouped.set(r.leadId, arr);
    }
    setRevisionsByLead(grouped);
  };

  const refresh = async () => {
    if (!artistId) return;
    const list = await db.leads.where('artistId').equals(artistId).reverse().sortBy('createdAt');
    setLeads(list);
  };

  const syncPayments = async (currentArtistId: string) => {
    if (!currentArtistId || syncingPaymentsRef.current) return;
    syncingPaymentsRef.current = true;
    setSyncingPayments(true);
    try {
      const cursorKey = paymentSyncCursorKey(currentArtistId);
      const since = Number(localStorage.getItem(cursorKey) || '0');
      const r = await fetch(`http://localhost:8787/api/stripe/payments/${encodeURIComponent(currentArtistId)}?since=${since}`);
      if (!r.ok) return;
      const data = await r.json();
      const items = Array.isArray(data?.items) ? data.items : [];
      let maxTs = since;
      for (const item of items) {
        if (!item?.leadId) continue;
        if (item.type === 'deposit_paid') {
          await db.leads.update(item.leadId, {
            status: 'booked',
            paymentStatus: 'paid',
            paymentMethod: 'stripe_connect',
            paymentIntentId: item.paymentIntentId || undefined,
            paymentUpdatedAt: Date.now(),
          });
        }
        if (item.type === 'refund') {
          await db.leads.update(item.leadId, { status: 'contacted', paymentStatus: 'refunded', paymentUpdatedAt: Date.now() });
        }
        if (Number(item.createdAt) > maxTs) maxTs = Number(item.createdAt);
      }
      localStorage.setItem(cursorKey, String(maxTs));
      await refresh();
    } catch {
      // ignore network issues
    } finally {
      syncingPaymentsRef.current = false;
      setSyncingPayments(false);
    }
  };

  const toClient = async (lead: LeadRecord) => {
    const now = Date.now();
    const clientId = 'client_' + now + '_' + Math.random().toString(36).slice(2, 6);
    const revisionNotes = (revisionsByLead.get(lead.id) || [])
      .slice()
      .reverse()
      .map(r => [r.note, r.changeRequest].filter(Boolean).join(' | '))
      .filter(Boolean)
      .join('\n');

    await db.clients.add({
      id: clientId,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      allergies: lead.allergies,
      notes: [lead.note, lead.changeRequest, lead.allergyNote, revisionNotes].filter(Boolean).join('\n'),
      artistId: lead.artistId,
      createdAt: now,
    });
    await db.leads.update(lead.id, { status: 'won' });
    await refresh();
    navigate(`/appointment/new?clientId=${encodeURIComponent(clientId)}&leadId=${encodeURIComponent(lead.id)}`);
  };

  const updateStatus = async (id: string, status: LeadRecord['status']) => {
    await db.leads.update(id, { status });
    await refresh();
  };

  const setFinalRevision = async (leadId: string, revision: LeadRevisionRecord) => {
    await db.leads.update(leadId, { finalRevisionId: revision.id, finalRevisionVersion: revision.version });
    await refresh();
  };

  const setFollowUp = async (leadId: string, minutes: number) => {
    const target = Date.now() + minutes * 60 * 1000;
    await db.leads.update(leadId, { nextFollowUpAt: target });
    await refresh();
  };

  const setFollowUpExact = async (leadId: string) => {
    const raw = manualFollowByLead[leadId];
    if (!raw) return;
    const ts = new Date(raw).getTime();
    if (!Number.isFinite(ts)) return;
    await db.leads.update(leadId, { nextFollowUpAt: ts });
    await refresh();
  };

  const recommendFollowUp = async (lead: LeadRecord) => {
    const latestRev = (revisionsByLead.get(lead.id) || [])[0];
    const text = [latestRev?.note, latestRev?.changeRequest, lead.note, lead.changeRequest].filter(Boolean).join(' ');
    await setFollowUp(lead.id, recommendMinutesFromText(text));
  };

  const clearFollowUp = async (leadId: string) => {
    await db.leads.update(leadId, { nextFollowUpAt: undefined });
    await refresh();
  };

  const suggestRealSlots = async (lead: LeadRecord) => {
    const duration = 120;
    const artistAppointments = (await db.appointments.where('artistId').equals(lead.artistId).toArray())
      .filter(a => a.status !== 'cancelled');
    const preferredDate = lead.preferredDate || new Date().toISOString().slice(0, 10);
    const preferredTime = lead.preferredTime || '14:00';
    const startDate = new Date(preferredDate + 'T00:00:00');
    const candidates: { date: string; time: string; score: number }[] = [];

    for (let dayOffset = 0; dayOffset <= 2; dayOffset++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + dayOffset);
      const date = d.toISOString().slice(0, 10);
      const dayApps = artistAppointments.filter(a => a.date === date);
      const preferredMin = toMinutes(preferredTime);

      for (let mins = 10 * 60; mins <= 20 * 60; mins += 30) {
        const end = mins + duration;
        if (end > 22 * 60) continue;
        const conflict = dayApps.some(a => {
          const s = toMinutes(a.time);
          const e = s + a.duration;
          return mins < e && s < end;
        });
        if (conflict) continue;
        const score = Math.abs(mins - preferredMin) + dayOffset * 180;
        candidates.push({ date, time: toTime(mins), score });
      }
    }

    const selected = candidates.sort((a, b) => a.score - b.score).slice(0, 3);
    const out = selected.map(x => `${x.date} ${x.time}`);
    setSuggestedSlotsByLead(prev => ({ ...prev, [lead.id]: out }));
  };

  const copySuggestedMessage = (lead: LeadRecord) => {
    const slots = suggestedSlotsByLead[lead.id] || [];
    if (slots.length === 0) return;
    const text = `Hi ${lead.name}, here are 3 available slots:\\n1) ${slots[0]}\\n2) ${slots[1] || '-'}\\n3) ${slots[2] || '-'}\\nReply with your preferred slot and I will confirm + send deposit link.`;
    navigator.clipboard.writeText(text);
  };

  const copyDepositLink = async (lead: LeadRecord) => {
    if (!artistUser) return;
    const policyAmount = getSuggestedDepositAmount(artistId, lead);
    const draftAmount = Number(draftPaymentAmountByLead[lead.id] || '0');
    const fallbackAmount = Number(artistUser.paymentDefaultDeposit || '0');
    const method = draftPaymentMethodByLead[lead.id] || lead.paymentMethod || 'stripe_connect';
    const amount = policyAmount > 0 ? policyAmount : (Number.isFinite(fallbackAmount) ? fallbackAmount : 0);
    const finalAmount = draftAmount > 0 ? draftAmount : amount;
    if (method === 'stripe_connect' && artistUser.stripeAccountId) {
      try {
        const base = window.location.origin;
        const response = await fetch('http://localhost:8787/api/stripe/checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            connectedAccountId: artistUser.stripeAccountId,
            amount: finalAmount,
            currency: (artistUser.paymentCurrency || 'USD').toLowerCase(),
            leadId: lead.id,
            clientName: lead.name,
            artistId: lead.artistId,
            successUrl: `${base}/leads?pay=success&lead=${encodeURIComponent(lead.id)}`,
            cancelUrl: `${base}/leads?pay=cancel&lead=${encodeURIComponent(lead.id)}`,
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || 'checkout create failed');
        if (data?.url) {
          await navigator.clipboard.writeText(data.url);
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }
    const link = buildDepositLink(artistUser, lead, finalAmount);
    if (!link) {
      alert('Set Payment Settings first (payment link template).');
      return;
    }
    navigator.clipboard.writeText(link);
    await db.leads.update(lead.id, {
      paymentMethod: method,
      paymentStatus: 'pending_verify',
      paymentAmount: String(finalAmount),
      paymentCurrency: artistUser.paymentCurrency || 'USD',
      paymentUpdatedAt: Date.now(),
    });
    await refresh();
  };

  const handlePaymentProofFiles = async (leadId: string, files: FileList | null) => {
    if (!files) return;
    const current = draftPaymentProofByLead[leadId] || [];
    const max = Math.min(files.length, Math.max(0, 4 - current.length));
    const list: string[] = [];
    for (let i = 0; i < max; i++) {
      const data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.readAsDataURL(files[i]);
      });
      list.push(data);
    }
    setDraftPaymentProofByLead(prev => ({ ...prev, [leadId]: [...current, ...list] }));
  };

  const savePaymentDraft = async (lead: LeadRecord) => {
    const method = draftPaymentMethodByLead[lead.id] || lead.paymentMethod || 'cash';
    const amount = (draftPaymentAmountByLead[lead.id] || lead.paymentAmount || artistUser?.paymentDefaultDeposit || '').trim();
    const note = (draftPaymentNoteByLead[lead.id] || '').trim();
    const proof = draftPaymentProofByLead[lead.id] || [];
    await db.leads.update(lead.id, {
      paymentMethod: method,
      paymentAmount: amount || undefined,
      paymentCurrency: artistUser?.paymentCurrency || 'USD',
      paymentProofNote: note || undefined,
      paymentProofImages: proof.length ? proof : undefined,
      paymentStatus: method === 'cash' ? 'paid' : 'pending_verify',
      paymentUpdatedAt: Date.now(),
      status: method === 'cash' ? 'booked' : lead.status,
    });
    await refresh();
  };

  const approvePayment = async (lead: LeadRecord) => {
    await db.leads.update(lead.id, {
      paymentStatus: 'paid',
      paymentUpdatedAt: Date.now(),
      status: 'booked',
    });
    await refresh();
  };

  const refundPayment = async (lead: LeadRecord) => {
    const reason = (draftPaymentNoteByLead[lead.id] || '').trim() || 'Refund requested';
    const amount = Number(draftPaymentAmountByLead[lead.id] || lead.paymentAmount || '0');
    if (lead.paymentMethod === 'stripe_connect' && lead.paymentIntentId) {
      try {
        const r = await fetch('http://localhost:8787/api/stripe/refund', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId: lead.paymentIntentId,
            amount: amount > 0 ? amount : undefined,
            reason,
            actor: artistId,
            leadId: lead.id,
            artistId: lead.artistId,
          }),
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error || 'refund failed');
      } catch (e: any) {
        alert(`Refund failed: ${e?.message || 'unknown error'}`);
        return;
      }
    }
    await db.leads.update(lead.id, {
      paymentStatus: 'refunded',
      paymentRefundReason: reason,
      paymentUpdatedAt: Date.now(),
      status: 'contacted',
    });
    await refresh();
  };

  const addFollowPreset = () => {
    const label = newPresetLabel.trim();
    const days = Number(newPresetDays);
    if (!label || !Number.isFinite(days) || days <= 0) return;
    const minutes = Math.round(days * 24 * 60);
    const preset: FollowPreset = {
      id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label,
      minutes,
    };
    setFollowPresets(prev => [...prev, preset]);
    setNewPresetLabel('');
    setNewPresetDays('');
  };

  const removeFollowPreset = (id: string) => {
    setFollowPresets(prev => {
      if (prev.length <= 1) return prev;
      return prev.filter(p => p.id !== id);
    });
  };

  const handleDraftFiles = async (leadId: string, files: FileList | null) => {
    if (!files) return;
    const current = draftImagesByLead[leadId] || [];
    const max = Math.min(files.length, Math.max(0, 6 - current.length));
    const list: string[] = [];
    for (let i = 0; i < max; i++) {
      const data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.readAsDataURL(files[i]);
      });
      list.push(data);
    }
    setDraftImagesByLead(prev => ({ ...prev, [leadId]: [...current, ...list] }));
  };

  const addRevision = async (leadId: string) => {
    const action = quickActionByLead[leadId] || 'contacted';
    const actionText =
      action === 'contacted' ? 'Contacted client, waiting for details.' :
      action === 'awaiting_confirmation' ? 'Details sent, awaiting client confirmation.' :
      'Client accepted proposed slot.';
    const note = (draftNoteByLead[leadId] || '').trim() || actionText;
    const changeRequest = (draftChangeByLead[leadId] || '').trim();
    const images = draftImagesByLead[leadId] || [];
    const channel = draftChannelByLead[leadId] || 'whatsapp';
    if (!note && !changeRequest && images.length === 0) return;

    const existing = revisionsByLead.get(leadId) || [];
    const version = existing.length > 0 ? Math.max(...existing.map(r => r.version)) + 1 : 1;
    const now = Date.now();
    await db.leadRevisions.add({
      id: `rev_${now}_${Math.random().toString(36).slice(2, 6)}`,
      leadId,
      version,
      actor: 'artist',
      channel,
      note: note || undefined,
      changeRequest: changeRequest || undefined,
      referenceImages: images.length > 0 ? images : undefined,
      createdAt: now,
    });

    setDraftNoteByLead(prev => ({ ...prev, [leadId]: '' }));
    setDraftChangeByLead(prev => ({ ...prev, [leadId]: '' }));
    setDraftImagesByLead(prev => ({ ...prev, [leadId]: [] }));
    setDraftChannelByLead(prev => ({ ...prev, [leadId]: 'whatsapp' }));
    setQuickActionByLead(prev => ({ ...prev, [leadId]: 'contacted' }));
    await loadRevisions();
  };

  const filtered = useMemo(() => filter === 'all' ? leads : leads.filter(l => l.status === filter), [leads, filter]);
  const stats = useMemo(() => {
    const now = Date.now();
    const start = now - statsWindowDays * 24 * 60 * 60 * 1000;
    const scoped = leads.filter(l => l.createdAt >= start);
    const total = scoped.length;
    const contacted = scoped.filter(l => ['contacted', 'booked', 'won'].includes(l.status)).length;
    const booked = scoped.filter(l => ['booked', 'won'].includes(l.status)).length;
    const won = scoped.filter(l => l.status === 'won').length;
    const contactRate = total > 0 ? Math.round((contacted / total) * 100) : 0;
    const bookedRate = total > 0 ? Math.round((booked / total) * 100) : 0;
    const winRate = total > 0 ? Math.round((won / total) * 100) : 0;

    const sourceMap = new Map<LeadRecord['source'], { total: number; won: number }>();
    for (const l of scoped) {
      const item = sourceMap.get(l.source) || { total: 0, won: 0 };
      item.total += 1;
      if (l.status === 'won') item.won += 1;
      sourceMap.set(l.source, item);
    }
    const sourceRows = Array.from(sourceMap.entries())
      .map(([source, v]) => ({
        source,
        total: v.total,
        won: v.won,
        rate: v.total > 0 ? Math.round((v.won / v.total) * 100) : 0,
      }))
      .sort((a, b) => b.rate - a.rate || b.total - a.total)
      .slice(0, 5);

    const weekEnd = now + 7 * 24 * 60 * 60 * 1000;
    const dueThisWeek = leads.filter(
      l => !!l.nextFollowUpAt && l.nextFollowUpAt <= weekEnd && l.status !== 'won' && l.status !== 'lost'
    ).length;
    const likelyConvertible = leads.filter(
      l => (l.status === 'contacted' || l.status === 'booked') && (!!l.note || !!l.changeRequest || !!l.referenceImages?.length)
    ).length;

    const roiRows = sourceRows.map(row => {
      const spend = parseMoney(spendBySource[row.source] || '0');
      const cpl = row.total > 0 ? spend / row.total : 0;
      const wonLeads = scoped.filter(l => l.source === row.source && l.status === 'won');
      const revenue = wonLeads.reduce((sum, l) => sum + parseMoney(l.budget), 0);
      const revenuePerLead = row.total > 0 ? revenue / row.total : 0;
      const roiScore = spend > 0 ? revenue / spend : revenue > 0 ? 999 : 0;
      const suggestion = roiScore >= 2 && row.rate >= 20 ? 'Increase budget' : roiScore < 1 || row.rate < 8 ? 'Reduce/test new creative' : 'Keep & optimize';
      return { ...row, spend, cpl, revenue, revenuePerLead, roiScore, suggestion };
    });

    const creativeMap = new Map<string, { total: number; won: number; revenue: number }>();
    for (const l of scoped) {
      if (!l.creativeId) continue;
      const item = creativeMap.get(l.creativeId) || { total: 0, won: 0, revenue: 0 };
      item.total += 1;
      if (l.status === 'won') item.won += 1;
      item.revenue += parseMoney(l.budget);
      creativeMap.set(l.creativeId, item);
    }
    const creativeRows = Array.from(creativeMap.entries())
      .map(([creativeId, v]) => {
        const spend = parseMoney(spendByCreative[creativeId] || '0');
        const winRateByCreative = v.total > 0 ? Math.round((v.won / v.total) * 100) : 0;
        const cpl = v.total > 0 ? spend / v.total : 0;
        const revenuePerLead = v.total > 0 ? v.revenue / v.total : 0;
        const roiScore = spend > 0 ? v.revenue / spend : v.revenue > 0 ? 999 : 0;
        const status = roiScore < 1 && v.total >= 3 ? 'pause' : roiScore >= 2 && winRateByCreative >= 20 ? 'scale' : 'keep';
        return { creativeId, total: v.total, win: v.won, winRate: winRateByCreative, cpl, revenuePerLead, roiScore, status };
      })
      .sort((a, b) => b.roiScore - a.roiScore || b.winRate - a.winRate)
      .slice(0, 5);

    const bestCreative = creativeRows.length > 0 ? creativeRows[0] : null;
    return { total, contactRate, bookedRate, winRate, sourceRows, dueThisWeek, likelyConvertible, roiRows, creativeRows, bestCreative };
  }, [leads, statsWindowDays, spendBySource, spendByCreative]);

  const dueToday = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const end = start + 24 * 60 * 60 * 1000;
    return leads
      .filter(l => !!l.nextFollowUpAt && l.nextFollowUpAt >= start && l.nextFollowUpAt < end)
      .sort((a, b) => (a.nextFollowUpAt || 0) - (b.nextFollowUpAt || 0));
  }, [leads]);

  const intakeLink = `${window.location.origin}/intake/${artistId}`;
  const getReviseLink = (leadId: string) => `${window.location.origin}/intake/revise/${leadId}`;
  const channelLinks = [
    { label: 'Instagram', source: 'instagram' },
    { label: 'Facebook', source: 'facebook' },
    { label: 'TikTok', source: 'tiktok' },
    { label: 'Referral', source: 'referral' },
    { label: 'Walk-in', source: 'walk_in' },
    { label: 'Other', source: 'other' },
  ].map(item => {
    const cr = selectedCreativeId ? `&cr=${encodeURIComponent(selectedCreativeId)}` : '';
    return { ...item, url: `${intakeLink}?src=${item.source}${cr}` };
  });

  return (
    <div style={{ padding: 20, color: 'white', background: '#0f172a', minHeight: '100dvh', maxWidth: 1180, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.01em' }}>{t(lang, 'leads')}</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          <button disabled={syncingPayments} onClick={() => void syncPayments(artistId)} style={{ border: '1px solid #334155', background: 'transparent', color: syncingPayments ? '#64748b' : '#86efac', borderRadius: 10, padding: '8px 12px', cursor: syncingPayments ? 'not-allowed' : 'pointer' }}>{syncingPayments ? 'Syncing...' : 'Sync Payments'}</button>
          <button onClick={() => navigate('/me')} style={{ border: '1px solid #334155', background: 'transparent', color: '#94a3b8', borderRadius: 10, padding: '8px 12px', cursor: 'pointer' }}>{t(lang, 'back')}</button>
        </div>
      </div>

      <div style={{ background: '#1e293b', borderRadius: 12, padding: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#cbd5e1' }}>Conversion Dashboard</p>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setStatsWindowDays(7)} style={{ ...btnStyle, background: statsWindowDays === 7 ? '#334155' : 'transparent' }}>7d</button>
            <button onClick={() => setStatsWindowDays(30)} style={{ ...btnStyle, background: statsWindowDays === 30 ? '#334155' : 'transparent' }}>30d</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(120px, 1fr))', gap: 8, marginBottom: 8 }}>
          <div style={metricCard}><p style={metricLabel}>New Leads</p><p style={metricValue}>{stats.total}</p></div>
          <div style={metricCard}><p style={metricLabel}>Contact Rate</p><p style={metricValue}>{stats.contactRate}%</p></div>
          <div style={metricCard}><p style={metricLabel}>Booked Rate</p><p style={metricValue}>{stats.bookedRate}%</p></div>
          <div style={metricCard}><p style={metricLabel}>Win Rate</p><p style={metricValue}>{stats.winRate}%</p></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(180px, 1fr))', gap: 8, marginBottom: 8 }}>
          <div style={metricCard}><p style={metricLabel}>Due This Week</p><p style={metricValue}>{stats.dueThisWeek}</p></div>
          <div style={metricCard}><p style={metricLabel}>Likely Convertible</p><p style={metricValue}>{stats.likelyConvertible}</p></div>
        </div>
        <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 10, padding: 8 }}>
          <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Top Sources by Win Rate</p>
          {stats.sourceRows.length === 0 ? (
            <p style={{ fontSize: 12, color: '#64748b' }}>No source data in selected window.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {stats.sourceRows.map(row => (
                <div key={row.source} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#cbd5e1' }}>{row.source}</span>
                  <span style={{ color: '#93c5fd' }}>{row.rate}% ({row.won}/{row.total})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ background: '#1e293b', borderRadius: 12, padding: 12, marginBottom: 12 }}>
        <p style={{ fontSize: 12,
  fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Your intake link</p>
        <select
          value={selectedCreativeId}
          onChange={e => setSelectedCreativeId(e.target.value)}
          style={{ ...textAreaStyle, height: 36, marginBottom: 8 }}
        >
          <option value="">No creative tag</option>
          {promoAssets.map(a => (
            <option key={a.id} value={a.id}>
              {a.tags?.[0] ? `${a.tags[0]} - ${a.id.slice(-6)}` : `Creative ${a.id.slice(-6)}`}
            </option>
          ))}
        </select>
        <div style={{ background: '#0b1220', border: '1px solid #334155', borderRadius: 10, padding: 10, fontSize: 12,
  fontWeight: 600, wordBreak: 'break-all', marginBottom: 8 }}>{intakeLink}</div>
        <button onClick={() => navigator.clipboard.writeText(intakeLink)} style={{ border: 'none', borderRadius: 8, background: '#334155', color: 'white', padding: '8px 12px', cursor: 'pointer' }}>{t(lang, 'copy_intake_link')}</button>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(220px, 1fr))', gap: 8, marginTop: 10 }}>
          {channelLinks.map(c => (
            <div key={c.source} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: 8 }}>
              <p style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 6 }}>{c.label}</p>
              <div style={{ fontSize: 11, color: '#64748b', wordBreak: 'break-all', marginBottom: 6 }}>{c.url}</div>
              <button onClick={() => navigator.clipboard.writeText(c.url)} style={miniBtn}>Copy {c.label} Link</button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: '#1e293b', borderRadius: 12, padding: 12, marginBottom: 12 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#cbd5e1', marginBottom: 8 }}>Channel ROI (manual ad spend)</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(220px, 1fr))', gap: 8, marginBottom: 10 }}>
          {stats.roiRows.map(row => (
            <div key={row.source} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: '#e2e8f0' }}>{row.source}</span>
                <span style={{ fontSize: 11, color: '#93c5fd' }}>Win {row.rate}%</span>
              </div>
              <input
                placeholder="Ad spend in window"
                value={spendBySource[row.source] || ''}
                onChange={e => setSpendBySource(prev => ({ ...prev, [row.source]: e.target.value }))}
                style={{ ...textAreaStyle, height: 34, marginBottom: 6 }}
              />
              <p style={{ fontSize: 11, color: '#94a3b8' }}>CPL: ${row.cpl.toFixed(2)} | Rev/Lead: ${row.revenuePerLead.toFixed(2)}</p>
              <p style={{ fontSize: 11, color: '#94a3b8' }}>ROI: {row.roiScore.toFixed(2)}x</p>
              <p style={{ fontSize: 11, color: row.suggestion === 'Increase budget' ? '#86efac' : row.suggestion.startsWith('Reduce') ? '#fca5a5' : '#fcd34d', marginTop: 4 }}>
                Suggestion: {row.suggestion}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: '#1e293b', borderRadius: 12, padding: 12, marginBottom: 12 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#cbd5e1', marginBottom: 8 }}>Creative ROI (from tattoo photos/videos)</p>
        {stats.bestCreative && (
          <button
            onClick={() => {
              const best = `${intakeLink}?src=instagram&cr=${encodeURIComponent(stats.bestCreative!.creativeId)}`;
              navigator.clipboard.writeText(best);
            }}
            style={{ ...miniBtn, marginBottom: 8, color: '#86efac', borderColor: '#166534' }}
          >
            Copy Best Creative Link
          </button>
        )}
        {stats.creativeRows.length === 0 ? (
          <p style={{ fontSize: 12, color: '#64748b' }}>No creative-tagged leads yet. Share links with a selected creative tag.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(220px, 1fr))', gap: 8 }}>
            {stats.creativeRows.map(row => (
              <div key={row.creativeId} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: '#e2e8f0' }}>Creative {row.creativeId.slice(-6)}</span>
                  <span style={{ fontSize: 11, color: '#93c5fd' }}>Win {row.winRate}%</span>
                </div>
                {promoAssets.find(a => a.id === row.creativeId)?.imageUrl && (
                  <img
                    src={promoAssets.find(a => a.id === row.creativeId)!.imageUrl}
                    style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 6 }}
                  />
                )}
                <input
                  placeholder="Creative spend in window"
                  value={spendByCreative[row.creativeId] || ''}
                  onChange={e => setSpendByCreative(prev => ({ ...prev, [row.creativeId]: e.target.value }))}
                  style={{ ...textAreaStyle, height: 34, marginBottom: 6 }}
                />
                <p style={{ fontSize: 11, color: '#94a3b8' }}>CPL: ${row.cpl.toFixed(2)} | Rev/Lead: ${row.revenuePerLead.toFixed(2)}</p>
                <p style={{ fontSize: 11, color: '#94a3b8' }}>ROI: {row.roiScore.toFixed(2)}x ({row.win}/{row.total})</p>
                <p style={{ fontSize: 11, marginTop: 4, color: row.status === 'pause' ? '#fca5a5' : row.status === 'scale' ? '#86efac' : '#fcd34d' }}>
                  Action: {row.status === 'pause' ? 'Pause creative' : row.status === 'scale' ? 'Scale budget' : 'Keep testing'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ background: '#3f1d1d', border: '1px solid #7f1d1d', borderRadius: 12, padding: 12, marginBottom: 12 }}>
        <p style={{ fontSize: 13, color: '#fecaca', fontWeight: 700, marginBottom: 8 }}>{t(lang, 'due_today')}: {dueToday.length}</p>
        {dueToday.length === 0 ? (
          <p style={{ fontSize: 12,
  fontWeight: 600, color: '#fca5a5' }}>{t(lang, 'no_followups_today')}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {dueToday.slice(0, 5).map(lead => (
              <button
                key={lead.id}
                onClick={() => document.getElementById(`lead-${lead.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                style={{ ...btnStyle, textAlign: 'left', color: '#fecaca', borderColor: '#7f1d1d' }}
              >
                {lead.name} - {lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toLocaleTimeString() : ''}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ background: '#1e293b', borderRadius: 12, padding: 12, marginBottom: 12 }}>
        <p style={{ fontSize: 12,
  fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>Follow-up presets (artist-defined)</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {followPresets.map(p => (
            <span key={p.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#0f172a', border: '1px solid #334155', borderRadius: 999, padding: '5px 8px', fontSize: 12 }}>
              {p.label}
              <button onClick={() => removeFollowPreset(p.id)} style={{ border: 'none', background: 'transparent', color: '#fda4af', cursor: 'pointer', fontSize: 12 }}>x</button>
            </span>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 80px', gap: 6 }}>
          <input placeholder="Preset name (e.g. Next week)" value={newPresetLabel} onChange={e => setNewPresetLabel(e.target.value)} style={{ ...textAreaStyle, height: 36, marginBottom: 0 }} />
          <input type="number" min={1} step={1} placeholder="Days" value={newPresetDays} onChange={e => setNewPresetDays(e.target.value)} style={{ ...textAreaStyle, height: 36, marginBottom: 0 }} />
          <button onClick={addFollowPreset} style={{ ...btnStyle, height: 36 }}>Add</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {(['all', 'new', 'contacted', 'booked', 'won', 'lost'] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ border: 'none', borderRadius: 999, padding: '6px 10px', background: filter === s ? '#e11d48' : '#1e293b', color: 'white', cursor: 'pointer' }}>{s}</button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>No leads yet.</p>
        ) : filtered.map(lead => {
          const revisions = revisionsByLead.get(lead.id) || [];
          const draftImages = draftImagesByLead[lead.id] || [];
          const isDue = !!lead.nextFollowUpAt && lead.nextFollowUpAt <= Date.now();
          return (
            <div id={`lead-${lead.id}`} key={lead.id} style={{ background: '#1e293b', border: `1px solid ${isDue ? '#dc2626' : '#334155'}`, borderRadius: 12, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <p style={{ fontSize: 15, fontWeight: 700 }}>{lead.name}</p>
                <span style={{ background: `${STATUS_COLORS[lead.status]}33`, color: STATUS_COLORS[lead.status], borderRadius: 8, padding: '2px 8px', fontSize: 11 }}>{lead.status}</span>
              </div>
              {lead.finalRevisionVersion && <p style={{ fontSize: 11, color: '#86efac', marginBottom: 4 }}>Final Revision: v{lead.finalRevisionVersion}</p>}
              {lead.nextFollowUpAt && <p style={{ fontSize: 11, color: isDue ? '#fca5a5' : '#93c5fd', marginBottom: 4 }}>Follow-up: {isDue ? 'Due now' : 'Scheduled'} at {new Date(lead.nextFollowUpAt).toLocaleString()}</p>}
              <p style={{ fontSize: 12,
  fontWeight: 600, color: '#94a3b8' }}>{lead.phone || 'No phone'} - {lead.source}</p>
              <p style={{ fontSize: 11, color: '#a5b4fc', marginTop: 4 }}>
                Payment: {lead.paymentStatus || 'unpaid'} | Method: {paymentMethodLabel(lead.paymentMethod)}{lead.paymentAmount ? ` | ${lead.paymentAmount} ${lead.paymentCurrency || ''}` : ''}
              </p>
              {lead.paymentRefundReason && (
                <p style={{ fontSize: 11, color: '#fca5a5', marginTop: 2 }}>Refund reason: {lead.paymentRefundReason}</p>
              )}
              <p style={{ fontSize: 11, color: '#93c5fd', marginTop: 3 }}>
                Mode: {lead.consultMode === 'consult_booking' ? 'Book consultation' : lead.consultMode === 'walk_in_direct' ? 'Direct walk-in' : 'Online chat first'}
              </p>
              <p style={{ fontSize: 12,
  fontWeight: 600, color: '#cbd5e1', marginTop: 4 }}>{lead.note || lead.changeRequest || 'No details'}</p>
              <p style={{ fontSize: 11, color: '#fcd34d', marginTop: 4 }}>{nextStepHint(lead.consultMode)}</p>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                <button onClick={() => updateStatus(lead.id, 'contacted')} style={btnStyle}>Contacted</button>
                <button onClick={() => updateStatus(lead.id, 'booked')} style={btnStyle}>Booked</button>
                <button onClick={() => toClient(lead)} style={{ ...btnStyle, background: '#166534', color: '#86efac', borderColor: '#166534' }}>Convert to Client</button>
                <button onClick={() => updateStatus(lead.id, 'lost')} style={{ ...btnStyle, color: '#fca5a5' }}>Lost</button>
                <button onClick={() => navigator.clipboard.writeText(getReviseLink(lead.id))} style={{ ...btnStyle, color: '#93c5fd' }}>Copy Client Update Link</button>
              </div>

              <div style={{ marginTop: 8, background: '#0f172a', border: '1px solid #334155', borderRadius: 10, padding: 8 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>Payment Capture</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
                  <select
                    value={draftPaymentMethodByLead[lead.id] || lead.paymentMethod || 'stripe_connect'}
                    onChange={e => setDraftPaymentMethodByLead(prev => ({ ...prev, [lead.id]: e.target.value as LeadRecord['paymentMethod'] }))}
                    style={{ ...textAreaStyle, height: 36, marginBottom: 0 }}
                  >
                    <option value="stripe_connect">Stripe Connect</option>
                    <option value="manual_link">Manual Link</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                  </select>
                  <input
                    value={draftPaymentAmountByLead[lead.id] || lead.paymentAmount || ''}
                    onChange={e => setDraftPaymentAmountByLead(prev => ({ ...prev, [lead.id]: e.target.value }))}
                    placeholder={`Amount (${artistUser?.paymentCurrency || 'USD'})`}
                    style={{ ...textAreaStyle, height: 36, marginBottom: 0 }}
                  />
                </div>
                {(draftPaymentMethodByLead[lead.id] || lead.paymentMethod) === 'bank_transfer' && !!artistUser?.bankTransferInstructions && (
                  <div style={{ fontSize: 11, color: '#cbd5e1', background: '#111827', border: '1px solid #1f2937', borderRadius: 8, padding: 8, marginBottom: 6 }}>
                    {artistUser.bankTransferInstructions}
                  </div>
                )}
                <textarea
                  value={draftPaymentNoteByLead[lead.id] || lead.paymentProofNote || ''}
                  onChange={e => setDraftPaymentNoteByLead(prev => ({ ...prev, [lead.id]: e.target.value }))}
                  placeholder="Payment note / transfer ref / cash receipt note"
                  rows={1}
                  style={textAreaStyle}
                />
                <input type="file" accept="image/*" multiple onChange={e => void handlePaymentProofFiles(lead.id, e.target.files)} style={{ marginBottom: 6 }} />
                {(draftPaymentProofByLead[lead.id] || lead.paymentProofImages || []).length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 6 }}>
                    {(draftPaymentProofByLead[lead.id] || lead.paymentProofImages || []).map((img, i) => (
                      <img key={`${lead.id}_proof_${i}`} src={img} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 6 }} />
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button onClick={() => void copyDepositLink(lead)} style={{ ...btnStyle, color: '#fcd34d' }}>Copy Deposit Link</button>
                  <button onClick={() => void savePaymentDraft(lead)} style={{ ...btnStyle, color: '#93c5fd' }}>Save Payment Draft</button>
                  {lead.paymentStatus === 'pending_verify' && (
                    <button onClick={() => void approvePayment(lead)} style={{ ...btnStyle, color: '#86efac' }}>Approve as Paid</button>
                  )}
                  {lead.paymentStatus === 'paid' && (
                    <button onClick={() => void refundPayment(lead)} style={{ ...btnStyle, color: '#fca5a5' }}>Refund</button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                {followPresets.map(p => <button key={p.id} onClick={() => void setFollowUp(lead.id, p.minutes)} style={{ ...btnStyle, padding: '5px 8px' }}>{p.label}</button>)}
                <button onClick={() => void recommendFollowUp(lead)} style={{ ...btnStyle, padding: '5px 8px', color: '#93c5fd' }}>AI Recommend</button>
                {lead.nextFollowUpAt && <button onClick={() => void clearFollowUp(lead.id)} style={{ ...btnStyle, padding: '5px 8px', color: '#fca5a5' }}>Clear Follow-up</button>}
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                <button onClick={() => void suggestRealSlots(lead)} style={{ ...btnStyle, color: '#86efac' }}>Suggest 3 Real Slots</button>
                {suggestedSlotsByLead[lead.id]?.length ? (
                  <button onClick={() => copySuggestedMessage(lead)} style={{ ...btnStyle, color: '#93c5fd' }}>Copy Slot Message</button>
                ) : null}
              </div>
              {suggestedSlotsByLead[lead.id]?.length ? (
                <div style={{ marginTop: 6, background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: 8, fontSize: 11, color: '#cbd5e1' }}>
                  {suggestedSlotsByLead[lead.id].map((s, i) => <div key={s}>{i + 1}. {s}</div>)}
                </div>
              ) : null}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: 6, marginTop: 8 }}>
                <input
                  type="datetime-local"
                  value={manualFollowByLead[lead.id] || ''}
                  onChange={e => setManualFollowByLead(prev => ({ ...prev, [lead.id]: e.target.value }))}
                  style={{ ...textAreaStyle, height: 36, marginBottom: 0 }}
                />
                <button onClick={() => void setFollowUpExact(lead.id)} style={{ ...btnStyle, height: 36 }}>Set Exact</button>
              </div>

              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #334155' }}>
                <p style={{ fontSize: 12,
  fontWeight: 700, marginBottom: 6 }}>Quick Log (15-sec mode)</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6, marginBottom: 8 }}>
                  <button onClick={() => setQuickActionByLead(prev => ({ ...prev, [lead.id]: 'contacted' }))} style={{ ...chipStyle, padding: '11px 12px', fontSize: 13, background: (quickActionByLead[lead.id] || 'contacted') === 'contacted' ? '#334155' : 'transparent' }}>Contacted</button>
                  <button onClick={() => setQuickActionByLead(prev => ({ ...prev, [lead.id]: 'awaiting_confirmation' }))} style={{ ...chipStyle, padding: '11px 12px', fontSize: 13, background: (quickActionByLead[lead.id] || 'contacted') === 'awaiting_confirmation' ? '#334155' : 'transparent' }}>Awaiting Confirm</button>
                  <button onClick={() => setQuickActionByLead(prev => ({ ...prev, [lead.id]: 'booked_slot' }))} style={{ ...chipStyle, padding: '11px 12px', fontSize: 13, background: (quickActionByLead[lead.id] || 'contacted') === 'booked_slot' ? '#334155' : 'transparent' }}>Booked Slot</button>
                </div>
                <input placeholder="One-line takeaway (optional)" value={draftNoteByLead[lead.id] || ''} onChange={e => setDraftNoteByLead(prev => ({ ...prev, [lead.id]: e.target.value }))} style={{ ...textAreaStyle, height: 36 }} />
                <textarea placeholder="What changed this round? (optional)" value={draftChangeByLead[lead.id] || ''} onChange={e => setDraftChangeByLead(prev => ({ ...prev, [lead.id]: e.target.value }))} rows={1} style={textAreaStyle} />
                <select value={draftChannelByLead[lead.id] || 'whatsapp'} onChange={e => setDraftChannelByLead(prev => ({ ...prev, [lead.id]: e.target.value as LeadRevisionRecord['channel'] }))} style={{ ...textAreaStyle, height: 42, marginBottom: 8, fontSize: 13 }}>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="tiktok">TikTok</option>
                  <option value="sms">SMS</option>
                  <option value="other">Other</option>
                </select>
                <input type="file" accept="image/*" multiple onChange={e => void handleDraftFiles(lead.id, e.target.files)} style={{ marginBottom: 6 }} />
                {draftImages.length > 0 && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 6 }}>{draftImages.map((img, i) => <img key={i} src={img} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 6 }} />)}</div>}
                <button onClick={() => void addRevision(lead.id)} style={{ ...btnStyle, width: '100%', padding: '11px 12px', background: '#334155', color: 'white', fontSize: 13, fontWeight: 700 }}>Save Quick Log</button>

                {revisions.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {revisions.map(rev => (
                      <div key={rev.id} style={{ background: '#111827', border: '1px solid #243244', borderRadius: 8, padding: 8 }}>
                        <p style={{ fontSize: 11, color: '#93c5fd', marginBottom: 3 }}>v{rev.version} - {rev.actor}{rev.channel ? ` via ${rev.channel}` : ''}{' - '}{new Date(rev.createdAt).toLocaleString()}</p>
                        {rev.note && <p style={{ fontSize: 12,
  fontWeight: 600, color: '#cbd5e1' }}>{rev.note}</p>}
                        {rev.changeRequest && <p style={{ fontSize: 12,
  fontWeight: 600, color: '#fda4af', marginTop: 2 }}>Change: {rev.changeRequest}</p>}
                        <button
                          onClick={() => void setFinalRevision(lead.id, rev)}
                          style={{ marginTop: 6, border: '1px solid #334155', borderRadius: 6, background: lead.finalRevisionId === rev.id ? '#166534' : 'transparent', color: lead.finalRevisionId === rev.id ? '#86efac' : '#cbd5e1', padding: '5px 8px', fontSize: 11, cursor: 'pointer' }}
                        >
                          {lead.finalRevisionId === rev.id ? 'Final Selected' : 'Set as Final'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  border: '1px solid #334155',
  background: 'transparent',
  color: '#cbd5e1',
  borderRadius: 8,
  padding: '8px 11px',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
};

const textAreaStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 12px',
  marginBottom: 6,
  borderRadius: 8,
  border: '1px solid #334155',
  background: '#0f172a',
  color: 'white',
  boxSizing: 'border-box',
  resize: 'vertical',
};

const chipStyle: React.CSSProperties = {
  border: '1px solid #334155',
  color: '#cbd5e1',
  borderRadius: 999,
  padding: '6px 10px',
  fontSize: 11,
  cursor: 'pointer',
};

const metricCard: React.CSSProperties = {
  background: '#0f172a',
  border: '1px solid #334155',
  borderRadius: 10,
  padding: 8,
};

const metricLabel: React.CSSProperties = {
  fontSize: 11,
  color: '#94a3b8',
  marginBottom: 4,
};

const metricValue: React.CSSProperties = {
  fontSize: 19,
  fontWeight: 800,
  color: '#f8fafc',
  lineHeight: 1.1,
};

const miniBtn: React.CSSProperties = {
  border: '1px solid #334155',
  background: 'transparent',
  color: '#cbd5e1',
  borderRadius: 8,
  padding: '6px 8px',
  fontSize: 11,
  cursor: 'pointer',
};






