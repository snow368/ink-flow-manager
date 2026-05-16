import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type UserRecord, type AppointmentRecord, type InvoiceRecord, type ClientRecord } from '../db';
import { getCurrentArtistIds } from '../lib/locationLogic';
import { detectInitialLanguage, t } from '../lib/i18n';

interface Stats {
  totalRevenue: number;
  revenueThisMonth: number;
  revenueToday: number;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowRate: number;
  avgRevenuePerAppt: number;
  topClients: { client: ClientRecord; spend: number; visits: number }[];
  newClientsThisMonth: number;
  retentionRate: number;
  appointmentsByMonth: { month: string; count: number; revenue: number }[];
}

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const lang = detectInitialLanguage();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('inkflow_current_user');
    if (!stored) { navigate('/register'); return; }
    db.users.get(stored).then(u => {
      if (!u) { navigate('/register'); return; }
      setUser(u);
      loadStats(u);
    });
  }, [navigate]);

  async function loadStats(u: UserRecord) {
    setLoading(true);
    const artistIds = await getCurrentArtistIds(u);

    let apptQuery = db.appointments.toCollection();
    let invQuery = db.invoices.toCollection();
    let clientQuery = db.clients.toCollection();

    if (u.roles?.includes('artist') && u.artistId) {
      apptQuery = db.appointments.where('artistId').equals(u.artistId);
      invQuery = db.invoices.where('artistId').equals(u.artistId);
      clientQuery = db.clients.where('artistId').equals(u.artistId);
    } else if (u.roles?.includes('owner') && artistIds.length > 1) {
      const ids = artistIds;
      apptQuery = db.appointments.where('artistId').anyOf(ids);
      invQuery = db.invoices.where('artistId').anyOf(ids);
      clientQuery = db.clients.where('artistId').anyOf(ids);
    }

    const [appointments, invoices, clients] = await Promise.all([
      apptQuery.toArray(),
      invQuery.toArray(),
      clientQuery.toArray(),
    ]);

    const now = Date.now();
    const todayStart = new Date().toISOString().slice(0, 10);
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();

    // Revenue calculations (invoices are in cents)
    const totalRevenue = invoices
      .filter(i => i.paymentStatus === 'paid')
      .reduce((sum, i) => sum + i.total, 0);
    const revenueThisMonth = invoices
      .filter(i => i.paymentStatus === 'paid' && i.createdAt >= thisMonthStart)
      .reduce((sum, i) => sum + i.total, 0);
    const revenueToday = invoices
      .filter(i => i.paymentStatus === 'paid' && String(i.createdAt).slice(0, 10) >= todayStart)
      .reduce((sum, i) => sum + i.total, 0);

    const completed = appointments.filter(a => a.status === 'done').length;
    const cancelled = appointments.filter(a => a.status === 'cancelled').length;
    const totalAppts = appointments.length;
    const noShowRate = totalAppts > 0 ? (cancelled / totalAppts * 100) : 0;
    const avgRevenue = completed > 0 ? totalRevenue / completed : 0;

    // Top clients
    const clientSpendMap = new Map<string, { spend: number; visits: number }>();
    for (const inv of invoices) {
      if (inv.paymentStatus !== 'paid' || !inv.clientId) continue;
      const cur = clientSpendMap.get(inv.clientId) || { spend: 0, visits: 0 };
      cur.spend += inv.total;
      cur.visits += 1;
      clientSpendMap.set(inv.clientId, cur);
    }
    const topClients = (await Promise.all(
      [...clientSpendMap.entries()]
        .sort((a, b) => b[1].spend - a[1].spend)
        .slice(0, 5)
        .map(async ([clientId, data]) => {
          const client = await db.clients.get(clientId);
          return { client: client || { id: clientId, name: 'Unknown', createdAt: 0 }, spend: data.spend, visits: data.visits };
        })
    ));

    const newClientsThisMonth = clients.filter(c => c.createdAt >= thisMonthStart).length;
    const returningClients = clients.filter(c => (c.lastVisitAt || 0) >= thirtyDaysAgo && c.createdAt < thirtyDaysAgo).length;
    const activeClients = clients.filter(c => (c.lastVisitAt || 0) >= thirtyDaysAgo || c.createdAt >= thirtyDaysAgo).length;
    const retentionRate = activeClients > 0 && (returningClients + newClientsThisMonth) > 0
      ? (returningClients / (returningClients + newClientsThisMonth) * 100)
      : 0;

    // Monthly breakdown
    const monthMap = new Map<string, { count: number; revenue: number }>();
    for (const appt of appointments) {
      const m = appt.date.slice(0, 7);
      const cur = monthMap.get(m) || { count: 0, revenue: 0 };
      cur.count += 1;
      monthMap.set(m, cur);
    }
    for (const inv of invoices) {
      if (inv.paymentStatus !== 'paid') continue;
      const m = new Date(inv.createdAt).toISOString().slice(0, 7);
      const cur = monthMap.get(m) || { count: 0, revenue: 0 };
      cur.revenue += inv.total;
      monthMap.set(m, cur);
    }
    const appointmentsByMonth = [...monthMap.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 12)
      .map(([month, data]) => ({ month, ...data }));

    setStats({
      totalRevenue,
      revenueThisMonth,
      revenueToday,
      totalAppointments: totalAppts,
      completedAppointments: completed,
      cancelledAppointments: cancelled,
      noShowRate,
      avgRevenuePerAppt: avgRevenue,
      topClients,
      newClientsThisMonth,
      retentionRate,
      appointmentsByMonth,
    });
    setLoading(false);
  }

  const formatCents = (c: number) => '$' + (c / 100).toFixed(2);
  const formatPercent = (p: number) => p.toFixed(1) + '%';

  return (
    <div style={{ padding: 24, color: 'white', paddingBottom: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer' }}>←</button>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>{t(lang, 'analytics')}</h1>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#64748b', padding: 40 }}>{t(lang, 'loading_stats')}</p>
      ) : !stats ? (
        <p style={{ textAlign: 'center', color: '#64748b', padding: 40 }}>{t(lang, 'no_data_yet')}</p>
      ) : (
        <>
          {/* Revenue Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
            <StatCard label={t(lang, 'today')} value={formatCents(stats.revenueToday)} color="#22c55e" />
            <StatCard label={t(lang, 'this_month')} value={formatCents(stats.revenueThisMonth)} color="#3b82f6" />
            <StatCard label={t(lang, 'all_time')} value={formatCents(stats.totalRevenue)} color="#7c3aed" />
          </div>

          {/* KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div style={{ background: '#1e293b', borderRadius: 12, padding: 14 }}>
              <p style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{t(lang, 'appointments')}</p>
              <p style={{ fontSize: 24, fontWeight: 700 }}>
                {stats.completedAppointments}
                <span style={{ fontSize: 13, color: '#64748b', marginLeft: 6 }}>{t(lang, 'x_total').replace('{n}', String(stats.totalAppointments))}</span>
              </p>
              <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                <span style={{ fontSize: 11, color: '#4ade80' }}>{t(lang, 'x_done').replace('{n}', String(stats.completedAppointments))}</span>
                <span style={{ fontSize: 11, color: '#f87171' }}>{t(lang, 'x_cancelled').replace('{n}', String(stats.cancelledAppointments))}</span>
              </div>
            </div>
            <div style={{ background: '#1e293b', borderRadius: 12, padding: 14 }}>
              <p style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{t(lang, 'noshow_rate')}</p>
              <p style={{ fontSize: 24, fontWeight: 700, color: stats.noShowRate > 20 ? '#f87171' : '#4ade80' }}>
                {formatPercent(stats.noShowRate)}
              </p>
              <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                {t(lang, 'avg_revenue_per_appt').replace('{amt}', formatCents(stats.avgRevenuePerAppt))}
              </p>
            </div>
          </div>

          {/* Retention + New Clients */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div style={{ background: '#1e293b', borderRadius: 12, padding: 14 }}>
              <p style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{t(lang, 'returning_client_rate')}</p>
              <p style={{ fontSize: 24, fontWeight: 700, color: stats.retentionRate > 30 ? '#4ade80' : '#fbbf24' }}>
                {formatPercent(stats.retentionRate)}
              </p>
            </div>
            <div style={{ background: '#1e293b', borderRadius: 12, padding: 14 }}>
              <p style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{t(lang, 'new_clients_this_month')}</p>
              <p style={{ fontSize: 24, fontWeight: 700, color: '#a5b4fc' }}>{stats.newClientsThisMonth}</p>
            </div>
          </div>

          {/* Top Clients */}
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>{t(lang, 'top_clients_by_revenue')}</p>
            {stats.topClients.length === 0 ? (
              <p style={{ fontSize: 12, color: '#64748b' }}>{t(lang, 'no_paid_invoices_yet')}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {stats.topClients.map((tc, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #334155' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: '#64748b', width: 18 }}>#{i + 1}</span>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate('/client/' + tc.client.id)}>{tc.client.name}</p>
                        <p style={{ fontSize: 11, color: '#64748b' }}>{t(lang, 'visits').replace('{n}', String(tc.visits))}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#22c55e' }}>{formatCents(tc.spend)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Monthly Breakdown Chart */}
          {stats.appointmentsByMonth.length > 0 && (
            <div style={{ background: '#1e293b', borderRadius: 12, padding: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>{t(lang, 'monthly_breakdown')}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {stats.appointmentsByMonth.map(m => {
                  const maxCount = Math.max(...stats.appointmentsByMonth.map(x => x.count), 1);
                  const barWidth = (m.count / maxCount * 100);
                  return (
                    <div key={m.month} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 10, color: '#64748b', width: 60, textAlign: 'right' }}>
                        {new Date(m.month + '-01').toLocaleDateString('en', { month: 'short', year: '2-digit' })}
                      </span>
                      <div style={{ flex: 1, height: 20, background: '#0f172a', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${barWidth}%`, background: 'linear-gradient(90deg, #e11d48, #7c3aed)', borderRadius: 4, minWidth: barWidth > 0 ? 4 : 0 }} />
                      </div>
                      <span style={{ fontSize: 11, color: '#94a3b8', width: 40 }}>{t(lang, 'appts').replace('{n}', String(m.count))}</span>
                      {m.revenue > 0 && <span style={{ fontSize: 10, color: '#4ade80', width: 60 }}>{formatCents(m.revenue)}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: '#1e293b', borderRadius: 12, padding: 12, borderTop: `3px solid ${color}` }}>
      <p style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 18, fontWeight: 700, color }}>{value}</p>
    </div>
  );
}
