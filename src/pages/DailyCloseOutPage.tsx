import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db';
import { detectInitialLanguage, t } from '../lib/i18n';
import { THEME } from '../lib/theme';
import { getCurrentArtistIds } from '../lib/locationLogic';

export default function DailyCloseOutPage() {
  const navigate = useNavigate();
  const lang = detectInitialLanguage();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<{
    appointments: { total: number; done: number; cancelled: number; noShow: number };
    revenue: { pos: number; invoices: number; combined: number };
    deposits: { collected: number; pending: number };
    inventory: number;
    communications: number;
  } | null>(null);

  useEffect(() => {
    const uid = localStorage.getItem('inkflow_current_user');
    if (!uid) { navigate('/register'); return; }
    const load = async () => {
      const user = await db.users.get(uid);
      const artistIds = await getCurrentArtistIds(user || null);
      const dayStart = new Date(date + 'T00:00:00').getTime();
      const dayEnd = dayStart + 86400000;

      const [appointments, posTx, invoices, inventory, leads, comms] = await Promise.all([
        db.appointments.where('date').equals(date).filter(a => artistIds.includes(a.artistId)).toArray(),
        db.posTransactions.filter(tx => tx.createdAt >= dayStart && tx.createdAt < dayEnd && artistIds.includes(tx.artistId)).toArray(),
        db.invoices.filter(inv => inv.createdAt >= dayStart && inv.createdAt < dayEnd && artistIds.includes(inv.artistId)).toArray(),
        db.inventory.toArray(),
        db.leads.where('createdAt').between(dayStart, dayEnd).filter(l => artistIds.includes(l.artistId)).toArray(),
        db.communicationLog.filter(l => l.createdAt >= dayStart && l.createdAt < dayEnd && artistIds.includes(l.artistId)).toArray(),
      ]);

      // Count inventory items sold (from sessions)
      const sessions = await db.sessions.filter(s => s.startedAt >= dayStart && s.startedAt < dayEnd && artistIds.includes(s.artistId)).toArray();
      const inventorySold = sessions.reduce((sum, s) => sum + (s.consumables?.length || 0), 0);

      setReport({
        appointments: {
          total: appointments.length,
          done: appointments.filter(a => a.status === 'done').length,
          cancelled: appointments.filter(a => a.status === 'cancelled').length,
          noShow: 0,
        },
        revenue: {
          pos: posTx.reduce((s, t) => s + t.total, 0),
          invoices: invoices.filter(i => i.paymentStatus === 'paid').reduce((s, i) => s + i.total, 0),
          combined: posTx.reduce((s, t) => s + t.total, 0) + invoices.filter(i => i.paymentStatus === 'paid').reduce((s, i) => s + i.total, 0),
        },
        deposits: {
          collected: leads.filter(l => l.paymentStatus === 'paid').length,
          pending: leads.filter(l => l.paymentStatus === 'pending_verify').length,
        },
        inventory: inventorySold,
        communications: comms.length,
      });
      setLoading(false);
    };
    load();
  }, [date]);

  const card = (title: string, rows: [string, string | number, string?][]) => (
    <div style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 12 }}>
      <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: '#94a3b8' }}>{title}</p>
      {rows.map(([label, value, color], i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 14 }}>
          <span style={{ color: '#94a3b8' }}>{label}</span>
          <span style={{ color: color || 'white', fontWeight: 600 }}>{typeof value === 'number' ? value.toLocaleString() : value}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ padding: 24, color: 'white', paddingBottom: 80 }}>
      <button onClick={() => navigate('/me')} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: 14, cursor: 'pointer', marginBottom: 16 }}>← {t(lang, 'back')}</button>
      <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>{t(lang, 'daily_closeout')}</h2>

      <div style={{ marginBottom: 16 }}>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} max={today}
          style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 14, width: '100%', boxSizing: 'border-box' }} />
      </div>

      {loading ? <p style={{ color: '#64748b' }}>Loading...</p> : !report ? null : (
        <>
          {card(t(lang, 'closeout_appointments'), [
            ['Total', report.appointments.total],
            ['Completed', report.appointments.done, '#22c55e'],
            ['Cancelled', report.appointments.cancelled, '#f87171'],
          ])}

          {card(t(lang, 'closeout_revenue'), [
            ['POS', '$' + report.revenue.pos.toFixed(2), '#4ade80'],
            ['Invoices', '$' + report.revenue.invoices.toFixed(2), '#60a5fa'],
            ['Combined', '$' + report.revenue.combined.toFixed(2), '#c084fc'],
          ])}

          {card(t(lang, 'closeout_deposits'), [
            ['Collected', report.deposits.collected, '#22c55e'],
            ['Pending', report.deposits.pending, '#fbbf24'],
          ])}

          {card(t(lang, 'closeout_inventory'), [
            ['Items Used', report.inventory],
          ])}

          {card(t(lang, 'closeout_communications'), [
            ['Messages Sent', report.communications],
          ])}

          <button onClick={() => window.print()}
            style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: '#2563eb', color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8 }}>
            {t(lang, 'closeout_print')}
          </button>
        </>
      )}
    </div>
  );
}
