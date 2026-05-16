import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type UserRecord, type AppointmentRecord, type LeadRecord, type ClientRecord, type ConsumableUsage } from '../db';
import { STATUS_COLORS, STATUS_LABELS } from '../lib/appointmentLogic';
import { THEME } from '../lib/theme';
import { detectInitialLanguage, t } from '../lib/i18n';
import { getArtistAvailability } from '../lib/availability';
import { checkAppointmentReminders, checkDepositReminders, markReminderSent, getReminderMessage, getWhatsAppReminderUrl, type AppointmentReminder } from '../lib/reminders';
import { getCurrentArtistIds } from '../lib/locationLogic';
import { getClientsWithBirthdayToday, getYearAwayClients, getUpcomingBirthdays, getWhatsAppBirthdayLink, getWhatsAppYearAwayLink, buildBirthdayMessage, buildYearAwayMessage } from '../lib/marketingLogic';
import { getLowStockCount } from '../lib/inventoryAlerts';
import { getAftercareWhatsAppUrl } from '../lib/aftercareLogic';
import { getReviewRequestWhatsAppUrl } from '../lib/reviewRequest';

type PaymentReminderItem = { lead: LeadRecord; stage: '24h' | '48h' };

function payReminderKey(leadId: string, stage: '24h' | '48h') {
  return `inkflow_pay_reminder_${leadId}_${stage}`;
}

export default function Today() {
  const navigate = useNavigate();
  const lang = detectInitialLanguage();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [appointments, setAppointments] = useState<(AppointmentRecord & { clientName?: string; clientPhone?: string; clientAllergies?: string[] })[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [dateAppointmentCounts, setDateAppointmentCounts] = useState<Map<string, number>>(new Map());
  const [dragOverDate, setDragOverDate] = useState('');
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [weekAppointments, setWeekAppointments] = useState<Map<string, (AppointmentRecord & { clientName?: string; clientPhone?: string; clientAllergies?: string[] })[]>>(new Map());
  const [dueLeads, setDueLeads] = useState<LeadRecord[]>([]);
  const [paymentReminders, setPaymentReminders] = useState<PaymentReminderItem[]>([]);
  const [workStart, setWorkStart] = useState(10 * 60);
  const [workEnd, setWorkEnd] = useState(22 * 60);
  const [daysOff, setDaysOff] = useState<string[]>([]);
  const [birthdayClients, setBirthdayClients] = useState<ClientRecord[]>([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<ClientRecord[]>([]);
  const [yearAwayClients, setYearAwayClients] = useState<{ client: ClientRecord; monthsAway: number }[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [lastConsumables, setLastConsumables] = useState<Map<string, string[]>>(new Map());
  const [presetItems, setPresetItems] = useState<Map<string, string[]>>(new Map());
  const [conflictModal, setConflictModal] = useState<{
    open: boolean;
    appointmentId: string;
    targetDate: string;
    conflictWith: string;
    options: string[];
  }>({ open: false, appointmentId: '', targetDate: '', conflictWith: '', options: [] });

  useEffect(() => {
    const stored = localStorage.getItem('inkflow_current_user');
    if (!stored) { navigate('/register'); return; }
    db.users.get(stored).then(u => {
      if (!u) { navigate('/register'); return; }
      setUser(u);
      loadAppointmentsForDate(u, selectedDate);
      loadAppointmentsForWeek(u, selectedDate);
      loadFutureDateCounts(u);
      loadDueLeads(u);
      loadPaymentReminders(u);
      loadAvailability(u);
      loadMarketingCards(u);
      loadPresets();
    });
  }, [navigate, selectedDate]);

  useEffect(() => {
    if (!user) return;
    getLowStockCount().then(setLowStockCount);
    const timer = window.setInterval(() => { getLowStockCount().then(setLowStockCount); }, 5 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [user, appointments]);

  const [reminders, setReminders] = useState<AppointmentReminder[]>([]);
  const [recentlyCompleted, setRecentlyCompleted] = useState<(AppointmentRecord & { clientName?: string; clientPhone?: string }) | null>(null);

  useEffect(() => {
    if (!user) return;
    const artistId = user.artistId || user.id;
    const check = async () => {
      const apptReminders = await checkAppointmentReminders(artistId);
      const depositReminders = await checkDepositReminders(artistId);
      setReminders([...depositReminders, ...apptReminders]);
    };
    check();
    const timer = window.setInterval(check, 60 * 1000);
    return () => window.clearInterval(timer);
  }, [user]);

  async function loadDueLeads(u: UserRecord) {
    const artistIds = await getCurrentArtistIds(u);
    const now = Date.now();
    const leads = artistIds.length > 1
      ? await db.leads.where('artistId').anyOf(artistIds).toArray()
      : await db.leads.where('artistId').equals(artistIds[0] || u.id).toArray();
    const due = leads
      .filter(l => !!l.nextFollowUpAt && l.nextFollowUpAt <= now && l.status !== 'won' && l.status !== 'lost')
      .sort((a, b) => (a.nextFollowUpAt || 0) - (b.nextFollowUpAt || 0));
    setDueLeads(due);
  }

  function loadPresets() {
    try {
      const raw = localStorage.getItem('inkflow_consumable_presets');
      if (!raw) return;
      const presets: { type: string; items: string[] }[] = JSON.parse(raw);
      const map = new Map<string, string[]>();
      for (const p of presets) {
        if (p.items.length > 0) map.set(p.type.toLowerCase(), p.items);
      }
      setPresetItems(map);
    } catch { /* ignore */ }
  }

  async function loadLastConsumables(appointments: (AppointmentRecord & { clientName?: string })[]) {
    const clientIds = [...new Set(appointments.map(a => a.clientId))];
    if (clientIds.length === 0) return;

    // Get all past appointments for these clients
    const allPastApps = await db.appointments
      .where('clientId').anyOf(clientIds)
      .and(a => a.status === 'done')
      .toArray();

    if (allPastApps.length === 0) return;

    const pastAppIds = allPastApps.map(a => a.id);
    const pastSessions = await db.sessions
      .where('appointmentId').anyOf(pastAppIds)
      .and(s => (s.consumables || []).length > 0)
      .reverse()
      .sortBy('startedAt');

    // Group latest session per client
    const clientLatestSession = new Map<string, ConsumableUsage[]>();
    for (const s of pastSessions) {
      const app = allPastApps.find(a => a.id === s.appointmentId);
      if (!app) continue;
      if (clientLatestSession.has(app.clientId)) continue; // already got latest
      if (s.consumables && s.consumables.length > 0) {
        clientLatestSession.set(app.clientId, s.consumables);
      }
    }

    // Resolve inventory names
    const invItems = await db.inventory.toArray();
    const invMap = new Map(invItems.map(i => [i.id, i.name]));

    const result = new Map<string, string[]>();
    for (const [clientId, consumables] of clientLatestSession) {
      const names = consumables
        .map(c => invMap.get(c.itemId) || c.itemId)
        .slice(0, 4); // max 4 items shown
      result.set(clientId, names);
    }
    setLastConsumables(result);
  }

  async function loadPaymentReminders(u: UserRecord) {
    const artistIds = await getCurrentArtistIds(u);
    const now = Date.now();
    const leads = artistIds.length > 1
      ? await db.leads.where('artistId').anyOf(artistIds).toArray()
      : await db.leads.where('artistId').equals(artistIds[0] || u.id).toArray();
    const list: PaymentReminderItem[] = [];
    for (const l of leads) {
      if (l.status === 'won' || l.status === 'lost') continue;
      if (l.paymentStatus !== 'unpaid' && l.paymentStatus !== 'pending_verify') continue;
      const age = now - l.createdAt;
      if (age >= 48 * 60 * 60 * 1000 && !localStorage.getItem(payReminderKey(l.id, '48h'))) {
        list.push({ lead: l, stage: '48h' });
        continue;
      }
      if (age >= 24 * 60 * 60 * 1000 && !localStorage.getItem(payReminderKey(l.id, '24h'))) {
        list.push({ lead: l, stage: '24h' });
      }
    }
    setPaymentReminders(list.slice(0, 5));
  }

  async function loadAvailability(u: UserRecord) {
    const artistId = u.artistId || u.id;
    const avail = await getArtistAvailability(artistId);
    setWorkStart(toMinutes(avail.start));
    setWorkEnd(toMinutes(avail.end));
    setDaysOff(avail.daysOff);
  }

  async function loadMarketingCards(u: UserRecord) {
    const artistId = u.artistId || u.id;
    const [bd, upcoming, yearAway] = await Promise.all([
      getClientsWithBirthdayToday(artistId),
      getUpcomingBirthdays(artistId, 7),
      getYearAwayClients(artistId),
    ]);
    setBirthdayClients(bd);
    setUpcomingBirthdays(upcoming.filter(c => !bd.find(b => b.id === c.id)));
    setYearAwayClients(yearAway);
  }

  const copyBirthdayMsg = (client: ClientRecord) => {
    navigator.clipboard.writeText(buildBirthdayMessage(client));
  };

  const copyYearAwayMsg = (client: ClientRecord, months: number) => {
    navigator.clipboard.writeText(buildYearAwayMessage(client, months));
  };

  const copyPaymentReminderMessage = (lead: LeadRecord, stage: '24h' | '48h') => {
    const payLink = `${window.location.origin}/pay/${encodeURIComponent(lead.id)}`;
    const statusLink = `${window.location.origin}/pay/status/${encodeURIComponent(lead.id)}`;
    const msg = stage === '24h'
      ? [
          `Hi ${lead.name}, quick reminder: your deposit is still pending.`,
          `Please complete it here: ${payLink}`,
          `Status link: ${statusLink}`,
        ].join('\n')
      : [
          `Hi ${lead.name}, final reminder: your deposit is still pending.`,
          `Please complete payment to keep your slot priority: ${payLink}`,
          `Status link: ${statusLink}`,
        ].join('\n');
    navigator.clipboard.writeText(msg);
  };

  const markReminderDone = async (leadId: string, stage: '24h' | '48h') => {
    const now = Date.now();
    localStorage.setItem(payReminderKey(leadId, stage), String(now));
    await db.leads.update(leadId, { nextFollowUpAt: now + 24 * 60 * 60 * 1000 });
    if (user) {
      await loadDueLeads(user);
      await loadPaymentReminders(user);
    }
  };

  async function loadAppointmentsForDate(u: UserRecord, date: string) {
    let query = db.appointments.where('date').equals(date);
    if (u.roles?.includes('artist') && u.artistId) query = query.and(a => a.artistId === u.artistId);
    else if (u.roles?.includes('owner')) {
      const locArtistIds = await getCurrentArtistIds(u);
      if (locArtistIds.length > 1) query = query.and(a => locArtistIds.includes(a.artistId));
    }
    const apps = await query.toArray();
    const enriched = await Promise.all(apps.map(async a => {
      const client = await db.clients.get(a.clientId);
      return { ...a, clientName: client?.name || 'Unknown', clientPhone: client?.phone, clientAllergies: client?.allergies };
    }));
    const sorted = enriched.sort((a, b) => a.time.localeCompare(b.time));
    setAppointments(sorted);
    loadLastConsumables(sorted);
  }

  async function loadFutureDateCounts(u: UserRecord) {
    const today = new Date().toISOString().slice(0, 10);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3);
    let query = db.appointments.where('date').between(today, endDate.toISOString().slice(0, 10));
    if (u.roles?.includes('artist') && u.artistId) query = query.and(a => a.artistId === u.artistId);
    else if (u.roles?.includes('owner')) {
      const locArtistIds = await getCurrentArtistIds(u);
      if (locArtistIds.length > 1) query = query.and(a => locArtistIds.includes(a.artistId));
    }
    const futureApps = await query.toArray();
    const counts = new Map<string, number>();
    futureApps.forEach(a => counts.set(a.date, (counts.get(a.date) || 0) + 1));
    setDateAppointmentCounts(counts);
  }

  async function loadAppointmentsForWeek(u: UserRecord, anchorDate: string) {
    const start = new Date(anchorDate);
    const day = start.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diffToMonday);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    let query = db.appointments.where('date').between(start.toISOString().slice(0, 10), end.toISOString().slice(0, 10));
    if (u.roles?.includes('artist') && u.artistId) query = query.and(a => a.artistId === u.artistId);
    else if (u.roles?.includes('owner')) {
      const locArtistIds = await getCurrentArtistIds(u);
      if (locArtistIds.length > 1) query = query.and(a => locArtistIds.includes(a.artistId));
    }
    const apps = await query.toArray();
    const enriched = await Promise.all(apps.map(async a => {
      const client = await db.clients.get(a.clientId);
      return { ...a, clientName: client?.name || 'Unknown', clientPhone: client?.phone, clientAllergies: client?.allergies };
    }));

    const grouped = new Map<string, (AppointmentRecord & { clientName?: string; clientPhone?: string; clientAllergies?: string[] })[]>();
    for (const a of enriched.sort((x, y) => (x.date + x.time).localeCompare(y.date + y.time))) {
      const list = grouped.get(a.date) || [];
      list.push(a);
      grouped.set(a.date, list);
    }
    setWeekAppointments(grouped);
  }

  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const toTimeString = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const hasOverlap = (aStart: number, aEnd: number, bStart: number, bEnd: number) => aStart < bEnd && bStart < aEnd;

  const findConflict = (
    list: AppointmentRecord[],
    targetDate: string,
    time: string,
    duration: number,
    artistId: string,
    excludeId: string
  ) => {
    const start = toMinutes(time);
    const end = start + duration;
    return list.find(a => {
      if (a.id === excludeId) return false;
      if (a.date !== targetDate || a.artistId !== artistId || a.status === 'cancelled') return false;
      const s = toMinutes(a.time);
      const e = s + a.duration;
      return hasOverlap(start, end, s, e);
    });
  };

  const findNextAvailableTime = (
    list: AppointmentRecord[],
    targetDate: string,
    artistId: string,
    duration: number,
    preferredTime: string,
    excludeId: string
  ) => {
    let candidate = toMinutes(preferredTime);
    const dayEnd = workEnd;
    while (candidate + duration <= dayEnd) {
      const blocked = list.some(a => {
        if (a.id === excludeId) return false;
        if (a.date !== targetDate || a.artistId !== artistId || a.status === 'cancelled') return false;
        const s = toMinutes(a.time);
        const e = s + a.duration;
        return hasOverlap(candidate, candidate + duration, s, e);
      });
      if (!blocked) return toTimeString(candidate);
      candidate += 15;
    }
    return '';
  };

  const findMultipleAvailableTimes = (
    list: AppointmentRecord[],
    targetDate: string,
    artistId: string,
    duration: number,
    preferredTime: string,
    excludeId: string,
    limit = 3
  ) => {
    const out: string[] = [];
    let candidate = toMinutes(preferredTime);
    const dayEnd = workEnd;
    while (candidate + duration <= dayEnd && out.length < limit) {
      const blocked = list.some(a => {
        if (a.id === excludeId) return false;
        if (a.date !== targetDate || a.artistId !== artistId || a.status === 'cancelled') return false;
        const s = toMinutes(a.time);
        const e = s + a.duration;
        return hasOverlap(candidate, candidate + duration, s, e);
      });
      if (!blocked) out.push(toTimeString(candidate));
      candidate += 15;
    }
    return out;
  };

  const updateAppointmentInState = (id: string, patch: Partial<AppointmentRecord>) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));
  };

  const handleStatusUpdate = async (id: string, status: AppointmentRecord['status']) => {
    await db.appointments.update(id, { status });
    updateAppointmentInState(id, { status });
    if (status === 'done') {
      const done = appointments.find(a => a.id === id);
      if (done) setRecentlyCompleted(done);
    }
    if (user) {
      loadFutureDateCounts(user);
      loadAppointmentsForWeek(user, selectedDate);
    }
  };

  const postponeLeadFollowUp = async (leadId: string, minutes: number) => {
    const target = Date.now() + minutes * 60 * 1000;
    await db.leads.update(leadId, { nextFollowUpAt: target });
    if (user) await loadDueLeads(user);
  };

  const applyMove = async (appointmentId: string, targetDate: string, finalTime: string) => {
    await db.appointments.update(appointmentId, { date: targetDate, time: finalTime });
    updateAppointmentInState(appointmentId, { date: targetDate, time: finalTime });
    if (user) {
      loadAppointmentsForDate(user, selectedDate);
      loadAppointmentsForWeek(user, selectedDate);
      loadFutureDateCounts(user);
    }
  };

  const handleDropToDate = async (targetDate: string, appointmentId: string) => {
    const movingFromState =
      appointments.find(a => a.id === appointmentId) ||
      Array.from(weekAppointments.values()).flat().find(a => a.id === appointmentId);
    const moving = movingFromState || await db.appointments.get(appointmentId);
    if (!moving || moving.date === targetDate) return;

    const all = await db.appointments.toArray();
    const conflict = findConflict(all, targetDate, moving.time, moving.duration, moving.artistId, moving.id);
    if (conflict) {
      const options = findMultipleAvailableTimes(all, targetDate, moving.artistId, moving.duration, moving.time, moving.id);
      if (options.length === 0) {
        alert(`Cannot move to ${targetDate}. No available slot for ${moving.duration} minutes.`);
        return;
      }
      const conflictName = (await db.clients.get(conflict.clientId))?.name || 'Unknown';
      setConflictModal({
        open: true,
        appointmentId: moving.id,
        targetDate,
        conflictWith: `${conflict.time} - ${conflictName}`,
        options,
      });
      return;
    }
    await applyMove(moving.id, targetDate, moving.time);
  };

  const weekDays = (() => {
    const days: { date: Date; label: string; dateStr: string; count: number }[] = [];
    const today = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({ date: d, label: dayNames[d.getDay()], dateStr, count: dateAppointmentCounts.get(dateStr) || 0 });
    }

    return days;
  })();

  const activeWeekDays = (() => {
    const start = new Date(selectedDate);
    const day = start.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diffToMonday);
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const days: { date: Date; label: string; dateStr: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push({ date: d, label: dayNames[i], dateStr: d.toISOString().slice(0, 10) });
    }
    return days;
  })();

  const isToday = selectedDate === new Date().toISOString().slice(0, 10);
  if (!user) return <div style={{ padding: 24, color: 'white' }}>Loading...</div>;

  return (
    <div style={{ padding: 20, color: THEME.text.primary, paddingBottom: 12, maxWidth: 1180, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.01em' }}>{isToday ? t(lang, 'today') : selectedDate} - {new Date(selectedDate).toLocaleDateString('en', { month: 'long', day: 'numeric' })}</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', background: THEME.bg.panel, borderRadius: 10, padding: 2 }}>
            <button onClick={() => setViewMode('day')} style={{ border: 'none', background: viewMode === 'day' ? '#e11d48' : 'transparent', color: 'white', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}>{t(lang, 'day')}</button>
            <button onClick={() => setViewMode('week')} style={{ border: 'none', background: viewMode === 'week' ? '#e11d48' : 'transparent', color: 'white', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}>{t(lang, 'week')}</button>
          </div>
          <button onClick={() => navigate('/pos')} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #22c55e', background: '#14532d', color: '#4ade80', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Register</button>
          <button onClick={() => navigate('/appointment/new')} style={{ width: 44, height: 44, borderRadius: 22, border: 'none', background: THEME.brand.primary, color: 'white', fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
        </div>
      </div>

      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 12, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <p style={{ fontSize: 13, color: '#fca5a5', fontWeight: 700 }}>Must Follow Up Now: {dueLeads.length}</p>
          <button onClick={() => navigate('/leads')} style={{ border: '1px solid #334155', background: 'transparent', color: '#93c5fd', borderRadius: 8, padding: '4px 8px', fontSize: 12, cursor: 'pointer' }}>Open Leads</button>
        </div>
        {dueLeads.length === 0 ? (
          <p style={{ fontSize: 12, color: '#94a3b8' }}>No overdue follow-ups right now.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {dueLeads.slice(0, 5).map(lead => (
              <div key={lead.id} style={{ background: '#0b1220', border: '1px solid #243244', borderRadius: 10, padding: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <p style={{ fontSize: 13, fontWeight: 700 }}>{lead.name}</p>
                  <span style={{ fontSize: 11, color: '#fca5a5' }}>{lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toLocaleString() : ''}</span>
                </div>
                <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>{lead.note || lead.changeRequest || 'No detail'}</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button onClick={() => void postponeLeadFollowUp(lead.id, 24 * 60)} style={smallBtn}>Done +1d</button>
                  <button onClick={() => void postponeLeadFollowUp(lead.id, 3 * 24 * 60)} style={smallBtn}>Done +3d</button>
                  <button onClick={() => void postponeLeadFollowUp(lead.id, 7 * 24 * 60)} style={smallBtn}>Done +7d</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {reminders.length > 0 && (
        <div style={{ background: '#1e293b', border: '1px solid #4338ca', borderRadius: 12, padding: 12, marginBottom: 14 }}>
          <p style={{ fontSize: 13, color: '#c084fc', fontWeight: 700, marginBottom: 8 }}>Reminders ({reminders.length})</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {reminders.map(r => {
              const stageLabel = {
                '3h': 'In 3 hours',
                '24h': 'Tomorrow',
                'deposit_24h': 'Deposit unpaid 24h',
                'deposit_48h': 'Deposit unpaid 48h',
              }[r.stage] || r.stage;
              const isDeposit = r.stage === 'deposit_24h' || r.stage === 'deposit_48h';
              const waUrl = getWhatsAppReminderUrl(r.appointment, r.stage, user?.whatsappPhone);
              const msg = getReminderMessage(r.appointment, r.stage);
              return (
                <div key={r.appointment.id + r.stage} style={{ background: '#0b1220', border: '1px solid #243244', borderRadius: 10, padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{r.appointment.clientName}</span>
                      <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: isDeposit ? '#7f1d1d' : '#312e81', color: isDeposit ? '#fca5a5' : '#a5b4fc' }}>{stageLabel}</span>
                    </div>
                    <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>
                      {r.appointment.date} at {r.appointment.time}
                    </p>
                    <p style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button onClick={() => {
                      const phone = user?.whatsappPhone?.replace(/[^\d+]/g, '') || '';
                      if (phone) window.open(waUrl!, '_blank', 'noopener,noreferrer');
                      else navigator.clipboard.writeText(msg);
                      markReminderSent(r.appointment.id, r.stage);
                      setReminders(prev => prev.filter(x => !(x.appointment.id === r.appointment.id && x.stage === r.stage)));
                    }} style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: user?.whatsappPhone ? '#075e54' : '#334155', color: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {user?.whatsappPhone ? 'WhatsApp' : 'Copy'}
                    </button>
                    <button onClick={() => {
                      markReminderSent(r.appointment.id, r.stage);
                      setReminders(prev => prev.filter(x => !(x.appointment.id === r.appointment.id && x.stage === r.stage)));
                    }} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      Dismiss
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {lowStockCount > 0 && (
        <div onClick={() => navigate('/inventory')} style={{ background: '#1e293b', border: '1px solid #f59e0b44', borderRadius: 12, padding: 12, marginBottom: 14, cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 13, color: '#fbbf24', fontWeight: 700 }}>Low Stock Alert: {lowStockCount} item{lowStockCount > 1 ? 's' : ''}</p>
            <span style={{ fontSize: 12, color: '#93c5fd' }}>Inventory →</span>
          </div>
          <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Tap to review low stock items and reorder. Set purchase links in inventory for quick reorder.</p>
        </div>
      )}

      {recentlyCompleted && (
        <div style={{ background: '#1e293b', border: '1px solid #22c55e44', borderRadius: 12, padding: 12, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <p style={{ fontSize: 13, color: '#4ade80', fontWeight: 700 }}>{recentlyCompleted.clientName}'s appointment completed</p>
            <button onClick={() => setRecentlyCompleted(null)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 14, cursor: 'pointer' }}>x</button>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {recentlyCompleted.clientPhone && user?.whatsappPhone && (() => {
              const aftercareUrl = getAftercareWhatsAppUrl(recentlyCompleted.clientName || '', recentlyCompleted.type, user.whatsappPhone);
              return aftercareUrl ? (
                <button onClick={() => window.open(aftercareUrl, '_blank', 'noopener,noreferrer')}
                  style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: 'none', background: '#0f766e', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', minWidth: 140 }}>
                  Send Aftercare
                </button>
              ) : null;
            })()}
            {recentlyCompleted.clientPhone && user?.whatsappPhone && (() => {
              const reviewUrl = getReviewRequestWhatsAppUrl(recentlyCompleted.clientName || '', user.whatsappPhone, 'google');
              return reviewUrl ? (
                <button onClick={() => window.open(reviewUrl, '_blank', 'noopener,noreferrer')}
                  style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: 'none', background: '#2563eb', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', minWidth: 140 }}>
                  Request Google Review
                </button>
              ) : null;
            })()}
            <button onClick={() => setRecentlyCompleted(null)}
              style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 12, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <p style={{ fontSize: 13, color: '#fcd34d', fontWeight: 700 }}>Deposit Reminders: {paymentReminders.length}</p>
          <button onClick={() => navigate('/leads')} style={{ border: '1px solid #334155', background: 'transparent', color: '#93c5fd', borderRadius: 8, padding: '4px 8px', fontSize: 12, cursor: 'pointer' }}>Open Leads</button>
        </div>
        {paymentReminders.length === 0 ? (
          <p style={{ fontSize: 12, color: '#94a3b8' }}>No pending 24h/48h payment reminders.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {paymentReminders.map(item => (
              <div key={`${item.lead.id}_${item.stage}`} style={{ background: '#0b1220', border: '1px solid #243244', borderRadius: 10, padding: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <p style={{ fontSize: 13, fontWeight: 700 }}>{item.lead.name}</p>
                  <span style={{ fontSize: 11, color: item.stage === '48h' ? '#fca5a5' : '#fcd34d' }}>{item.stage} reminder</span>
                </div>
                <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>{item.lead.paymentAmount || '-'} {item.lead.paymentCurrency || ''} | {item.lead.paymentStatus || 'unpaid'}</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button onClick={() => copyPaymentReminderMessage(item.lead, item.stage)} style={smallBtn}>Copy Reminder</button>
                  <button onClick={() => void markReminderDone(item.lead.id, item.stage)} style={smallBtn}>Done +1d</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Client Outreach */}
      {(birthdayClients.length > 0 || upcomingBirthdays.length > 0 || yearAwayClients.length > 0) && (
        <div style={{ background: '#1e293b', borderRadius: 12, padding: 12, marginBottom: 14, border: '1px solid #334155' }}>
          <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Client Outreach</p>

          {/* Birthday Today */}
          {birthdayClients.map(c => (
            <div key={'bd_' + c.id} style={{ background: '#0b1220', borderLeft: '3px solid #fbbf24', borderRadius: 8, padding: '8px 12px', marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</p>
                  <p style={{ fontSize: 11, color: '#fbbf24' }}>Birthday Today</p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => copyBirthdayMsg(c)} style={outreachBtn}>Copy</button>
                  <button onClick={() => { const link = getWhatsAppBirthdayLink(c); if (link) window.open(link, '_blank'); }} style={{ ...outreachBtn, background: '#25d366', color: 'white' }}>WA</button>
                </div>
              </div>
            </div>
          ))}

          {/* Upcoming Birthdays (next 7 days, excluding today) */}
          {upcomingBirthdays.slice(0, 3).map(c => (
            <div key={'upbd_' + c.id} style={{ background: '#0b1220', borderLeft: '3px solid #fcd34d', borderRadius: 8, padding: '8px 12px', marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</p>
                  <p style={{ fontSize: 11, color: '#fcd34d' }}>Birthday soon — {c.birthday?.slice(5)}</p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => navigator.clipboard.writeText(buildBirthdayMessage(c))} style={outreachBtn}>Copy</button>
                  <button onClick={() => { const link = getWhatsAppBirthdayLink(c); if (link) window.open(link, '_blank'); }} style={{ ...outreachBtn, background: '#25d366', color: 'white' }}>WA</button>
                </div>
              </div>
            </div>
          ))}

          {/* Year-away — gentle re-engage */}
          {yearAwayClients.slice(0, 3).map(({ client: c, monthsAway: m }) => (
            <div key={'ya_' + c.id} style={{ background: '#0b1220', borderLeft: '3px solid #a78bfa', borderRadius: 8, padding: '8px 12px', marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</p>
                  <p style={{ fontSize: 11, color: '#a78bfa' }}>~{m} months since last visit</p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => copyYearAwayMsg(c, m)} style={outreachBtn}>Copy</button>
                  <button onClick={() => { const link = getWhatsAppYearAwayLink(c, m); if (link) window.open(link, '_blank'); }} style={{ ...outreachBtn, background: '#25d366', color: 'white' }}>WA</button>
                </div>
              </div>
            </div>
          ))}

          {birthdayClients.length === 0 && upcomingBirthdays.length === 0 && yearAwayClients.length === 0 && (
            <p style={{ fontSize: 12, color: '#64748b' }}>No outreach needed today.</p>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, paddingBottom: 14, marginBottom: 14, borderBottom: '1px solid #1e293b', overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {weekDays.map(day => {
          const selected = day.dateStr === selectedDate;
          const count = day.count;
          return (
            <button
              key={day.dateStr}
              onClick={() => setSelectedDate(day.dateStr)}
              onDragOver={(e) => { e.preventDefault(); setDragOverDate(day.dateStr); }}
              onDragLeave={() => setDragOverDate('')}
              onDrop={async (e) => {
                e.preventDefault();
                const appointmentId = e.dataTransfer.getData('text/plain');
                setDragOverDate('');
                if (appointmentId) await handleDropToDate(day.dateStr, appointmentId);
              }}
              style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              padding: '8px 10px', borderRadius: 14, border: 'none',
              background: selected ? '#e11d48' : dragOverDate === day.dateStr ? '#334155' : 'transparent',
              color: selected ? 'white' : count > 0 ? '#e2e8f0' : '#64748b',
              fontSize: 12, fontWeight: 500, cursor: 'pointer', minWidth: 50, transition: 'background 0.15s', position: 'relative',
            }}>
              <span style={{ fontSize: 10, opacity: 0.6 }}>{day.label}</span>
              <span style={{ fontSize: 16, fontWeight: selected ? 700 : 500 }}>{day.date.getDate()}</span>
              {count > 0 && !selected ? (
                count === 1 ? (
                  <div style={{ width: 5, height: 5, borderRadius: 3, background: THEME.brand.primary, boxShadow: '0 0 4px rgba(225,29,72,0.6)' }} />
                ) : (
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#fbbf24', marginTop: 2, textShadow: '0 0 6px rgba(0,0,0,0.8)' }}>{count >= 4 ? '4+' : count}</span>
                )
              ) : selected && (
                <div style={{ width: 5, height: 5, borderRadius: 3, background: 'white', boxShadow: '0 0 4px rgba(255,255,255,0.5)' }} />
              )}
            </button>
          );
        })}
      </div>

      {viewMode === 'day' && appointments.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: 60 }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>{t(lang, 'no_appointments')}</p>
          <p style={{ fontSize: 16, color: '#94a3b8' }}>{t(lang, 'no_appointments_day')}</p>
        </div>
      ) : viewMode === 'day' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {appointments.map(app => (
            <AppointmentCard
              key={app.id}
              appointment={app}
              onStatusUpdate={handleStatusUpdate}
            />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(180px, 1fr))', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
          {activeWeekDays.map(day => {
            const list = weekAppointments.get(day.dateStr) || [];
            const selected = day.dateStr === selectedDate;
            return (
              <div
                key={day.dateStr}
                onDragOver={(e) => { e.preventDefault(); setDragOverDate(day.dateStr); }}
                onDragLeave={() => setDragOverDate('')}
                onDrop={async (e) => {
                  e.preventDefault();
                  const appointmentId = e.dataTransfer.getData('text/plain');
                  setDragOverDate('');
                  if (appointmentId) await handleDropToDate(day.dateStr, appointmentId);
                }}
                style={{
                  background: selected ? '#182234' : '#0b1220',
                  border: dragOverDate === day.dateStr ? '1px solid #f43f5e' : selected ? '1px solid #475569' : '1px solid #243244',
                  boxShadow: dragOverDate === day.dateStr ? '0 0 0 1px rgba(244,63,94,0.35) inset' : 'none',
                  borderRadius: 12,
                  padding: 10,
                  minHeight: 240,
                }}
              >
                <button onClick={() => { setSelectedDate(day.dateStr); setViewMode('day'); }} style={{ width: '100%', border: 'none', background: 'transparent', color: 'white', textAlign: 'left', cursor: 'pointer', marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{day.label}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{day.date.getDate()}</div>
                    <span style={{ fontSize: 11, color: '#93c5fd', background: '#1e3a5f', borderRadius: 999, padding: '2px 7px' }}>{list.length}</span>
                  </div>
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {list.length === 0 ? (
                    <p style={{ fontSize: 12, color: '#64748b' }}>No appointments</p>
                  ) : list.map(item => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', item.id)}
                      style={{
                        borderLeft: `3px solid ${STATUS_COLORS[item.status] || '#9ca3af'}`,
                        background: THEME.bg.panel,
                        border: '1px solid #334155',
                        borderRadius: 8,
                        padding: 8,
                        cursor: 'grab',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>{item.time}</div>
                        <span style={{ width: 7, height: 7, borderRadius: 99, background: STATUS_COLORS[item.status] || '#9ca3af' }} />
                      </div>
                      <div style={{ fontSize: 12, color: '#cbd5e1' }}>{item.clientName}</div>
                      {(item.clientAllergies && item.clientAllergies.length > 0) && (
                        <div style={{ fontSize: 9, color: '#fca5a5', marginTop: 1 }}>Allergies: {item.clientAllergies.join(', ')}</div>
                      )}
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{STATUS_LABELS[item.status] || item.status}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {conflictModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 380, background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 14 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Time Conflict</h3>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>
              Conflicts with: <span style={{ color: '#e2e8f0' }}>{conflictModal.conflictWith}</span>
            </p>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 10 }}>
              Choose a suggested slot for {conflictModal.targetDate}:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
              {conflictModal.options.map(option => (
                <button
                  key={option}
                  onClick={async () => {
                    await applyMove(conflictModal.appointmentId, conflictModal.targetDate, option);
                    setConflictModal({ open: false, appointmentId: '', targetDate: '', conflictWith: '', options: [] });
                  }}
                  style={{ border: 'none', borderRadius: 8, padding: '10px 12px', background: '#334155', color: 'white', textAlign: 'left', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
                >
                  {option}
                </button>
              ))}
            </div>
            <button
              onClick={() => setConflictModal({ open: false, appointmentId: '', targetDate: '', conflictWith: '', options: [] })}
              style={{ width: '100%', border: '1px solid #475569', borderRadius: 8, padding: '9px 10px', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AppointmentCard({
  appointment,
  onStatusUpdate,
}: {
  appointment: AppointmentRecord & { clientName?: string; clientPhone?: string; clientAllergies?: string[] };
  onStatusUpdate: (id: string, status: AppointmentRecord['status']) => Promise<void>;
}) {
  const navigate = useNavigate();
  const color = STATUS_COLORS[appointment.status] || '#9ca3af';
  const needsWaiver = !appointment.waiverCompleted && appointment.status !== 'done' && appointment.status !== 'cancelled';
  const [updating, setUpdating] = useState(false);

  const updateStatus = async (status: AppointmentRecord['status']) => {
    if (updating) return;
    setUpdating(true);
    try {
      await onStatusUpdate(appointment.id, status);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/plain', appointment.id)}
      style={{ background: THEME.bg.panel, borderRadius: 14, padding: 14, borderLeft: '4px solid ' + color, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      title="Drag to another date to reschedule"
    >
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}><span style={{ color: '#64748b', marginRight: 6 }}>{appointment.time}</span>{appointment.clientName}</p>
        <p style={{ fontSize: 13, color: '#94a3b8' }}>{appointment.duration}min{appointment.type && ' - ' + appointment.type.replace('_', ' ')}</p>
        {appointment.clientPhone && <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{appointment.clientPhone}</p>}
        {appointment.bodyPart && <p style={{ fontSize: 11, color: '#93c5fd', marginTop: 2 }}>Body: {appointment.bodyPart}</p>}
        {appointment.designNotes && <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, fontStyle: 'italic' }}>"{appointment.designNotes.slice(0, 60)}{appointment.designNotes.length > 60 ? '...' : ''}"</p>}
        {appointment.depositAmount != null && appointment.depositAmount > 0 && (
          <p style={{ fontSize: 11, color: '#fbbf24', marginTop: 2 }}>Deposit: ${(appointment.depositAmount / 100).toFixed(0)}</p>
        )}
        {(appointment.clientAllergies && appointment.clientAllergies.length > 0) && (
          <div style={{ marginTop: 4, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {appointment.clientAllergies.map((a, i) => (
              <span key={i} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#7f1d1d', color: '#fca5a5' }}>{a}</span>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: color + '33', color: color, fontWeight: 600 }}>{STATUS_LABELS[appointment.status] || appointment.status}</span>
        {needsWaiver && (
          <button onClick={() => navigate('/waiver/' + appointment.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: 'none', background: '#f59e0b', color: '#0f172a', fontWeight: 600, cursor: 'pointer' }}>Waiver</button>
        )}
        {appointment.status === 'unconfirmed' && (
          <button disabled={updating} onClick={() => updateStatus('deposit_paid')} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: 'none', background: '#60a5fa', color: '#0f172a', fontWeight: 600, cursor: 'pointer' }}>Deposit</button>
        )}
        {appointment.status === 'deposit_paid' && (
          <button disabled={updating} onClick={() => updateStatus('ready')} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: 'none', background: '#34d399', color: '#0f172a', fontWeight: 600, cursor: 'pointer' }}>Confirm</button>
        )}
        {appointment.status === 'ready' && (
          <button onClick={() => navigate('/session/' + appointment.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: 'none', background: '#34d399', color: '#0f172a', fontWeight: 600, cursor: 'pointer' }}>Start</button>
        )}
        {appointment.status !== 'done' && appointment.status !== 'cancelled' && (
          <button onClick={() => navigate(`/pos?appointmentId=${encodeURIComponent(appointment.id)}`)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: 'none', background: '#22c55e', color: '#0f172a', fontWeight: 600, cursor: 'pointer' }}>Checkout</button>
        )}
        {appointment.status !== 'done' && appointment.status !== 'cancelled' && (
          <button disabled={updating} onClick={() => updateStatus('done')} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: 'none', background: '#7c3aed', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Done</button>
        )}
        {appointment.status !== 'done' && appointment.status !== 'cancelled' && (
          <button disabled={updating} onClick={() => updateStatus('cancelled')} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: 'none', background: '#475569', color: '#e2e8f0', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
        )}
      </div>
    </div>
  );
}

const outreachBtn: React.CSSProperties = {
  border: 'none', background: '#334155', color: '#e2e8f0',
  fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 600,
};
const smallBtn: React.CSSProperties = {
  border: '1px solid #334155',
  background: 'transparent',
  color: '#cbd5e1',
  borderRadius: 8,
  padding: '4px 8px',
  fontSize: 11,
  cursor: 'pointer',
};

