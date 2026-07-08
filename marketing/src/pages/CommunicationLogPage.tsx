import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db';
import type { CommunicationLogRecord } from '../db';
import { detectInitialLanguage, t } from '../lib/i18n';
import { THEME } from '../lib/theme';

export default function CommunicationLogPage() {
  const navigate = useNavigate();
  const lang = detectInitialLanguage();
  const [logs, setLogs] = useState<CommunicationLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ channel: '', direction: '', fromDate: '', toDate: '', clientSearch: '' });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  useEffect(() => {
    const uid = localStorage.getItem('inkflow_current_user');
    if (!uid) { navigate('/register'); return; }
    const load = async () => {
      let query = db.communicationLog.orderBy('createdAt').reverse();
      let results = await query.limit(PAGE_SIZE * (page + 1)).toArray();
      if (filter.channel) results = results.filter(l => l.channel === filter.channel);
      if (filter.direction) results = results.filter(l => l.direction === filter.direction);
      setLogs(results);
      setLoading(false);
    };
    load();
  }, [page, filter.channel, filter.direction]);

  const channelBadge = (ch: string) => {
    const colors: Record<string, string> = { whatsapp: '#22c55e', sms: '#3b82f6', email: '#a855f7', instagram: '#ec4899', phone: '#f97316', reminder_sent: '#64748b', app_note: '#94a3b8' };
    return { bg: colors[ch] || '#64748b', label: ch };
  };

  const directionColor = (d: string) => d === 'outbound' ? '#3b82f6' : d === 'inbound' ? '#22c55e' : '#64748b';

  return (
    <div style={{ padding: 24, color: 'white', paddingBottom: 80 }}>
      <button onClick={() => navigate('/me')} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: 14, cursor: 'pointer', marginBottom: 16 }}>← {t(lang, 'back')}</button>
      <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>{t(lang, 'communication_log')}</h2>

      {/* Filters */}
      <div style={{ background: '#1e293b', padding: 12, borderRadius: 12, marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <select value={filter.channel} onChange={e => setFilter(f => ({ ...f, channel: e.target.value }))} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 12 }}>
          <option value="">All Channels</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="sms">SMS</option>
          <option value="email">Email</option>
          <option value="instagram">Instagram</option>
          <option value="phone">Phone</option>
          <option value="reminder_sent">Reminder</option>
        </select>
        <select value={filter.direction} onChange={e => setFilter(f => ({ ...f, direction: e.target.value }))} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 12 }}>
          <option value="">All Directions</option>
          <option value="outbound">Outbound</option>
          <option value="inbound">Inbound</option>
          <option value="auto">Auto</option>
        </select>
        <input type="date" value={filter.fromDate} onChange={e => setFilter(f => ({ ...f, fromDate: e.target.value }))} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 12 }} />
        <input type="date" value={filter.toDate} onChange={e => setFilter(f => ({ ...f, toDate: e.target.value }))} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 12 }} />
      </div>

      {loading ? <p style={{ color: '#64748b' }}>Loading...</p> : logs.length === 0 ? <p style={{ color: '#64748b' }}>No communication logs found.</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {logs.map(log => {
            const ch = channelBadge(log.channel);
            return (
              <div key={log.id} style={{ background: '#1e293b', borderRadius: 10, padding: 12, cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: ch.bg + '30', color: ch.bg, fontWeight: 600 }}>{ch.label}</span>
                  <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: directionColor(log.direction) + '20', color: directionColor(log.direction) }}>{log.direction}</span>
                  <span style={{ fontSize: 11, color: '#64748b', marginLeft: 'auto' }}>{new Date(log.createdAt).toLocaleString()}</span>
                </div>
                <p style={{ fontSize: 13, color: expandedId === log.id ? 'white' : '#94a3b8', wordBreak: 'break-word' }}>
                  {expandedId === log.id ? log.message || '(no message)' : (log.message || '').slice(0, 100) + ((log.message || '').length > 100 ? '...' : '')}
                </p>
                {(log.clientId || log.appointmentId) && (
                  <p style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>client: {log.clientId?.slice(0, 12)}... / apt: {log.appointmentId?.slice(0, 12)}...</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {logs.length > 49 && (
        <button onClick={() => { setPage(page + 1); }} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #334155', background: '#0f172a', color: '#60a5fa', fontSize: 14, marginTop: 12, cursor: 'pointer' }}>
          Load More
        </button>
      )}
    </div>
  );
}
