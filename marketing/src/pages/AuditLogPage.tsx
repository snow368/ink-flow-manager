import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db';
import type { AuditLogRecord } from '../db';
import { getAuditLogs } from '../lib/auditLog';
import { detectInitialLanguage, t } from '../lib/i18n';
import { THEME } from '../lib/theme';

const ACTION_COLORS: Record<string, string> = { create: '#22c55e', update: '#3b82f6', delete: '#ef4444' };

export default function AuditLogPage() {
  const navigate = useNavigate();
  const lang = detectInitialLanguage();
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = localStorage.getItem('inkflow_current_user');
    if (!uid) { navigate('/register'); return; }
    getAuditLogs({ limit: 100 }).then(results => {
      setLogs(results);
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ padding: 24, color: 'white', paddingBottom: 80 }}>
      <button onClick={() => navigate('/me')} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: 14, cursor: 'pointer', marginBottom: 16 }}>← {t(lang, 'back')}</button>
      <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>{t(lang, 'audit_log')}</h2>

      {loading ? <p style={{ color: '#64748b' }}>Loading...</p> : logs.length === 0 ? <p style={{ color: '#64748b' }}>No audit log entries yet.</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {logs.map(log => (
            <div key={log.id} style={{ background: '#1e293b', borderRadius: 10, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: (ACTION_COLORS[log.action] || '#64748b') + '30', color: ACTION_COLORS[log.action] || '#64748b', fontWeight: 600 }}>{log.action}</span>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>{log.tableName}</span>
                <span style={{ fontSize: 10, color: '#64748b', marginLeft: 'auto' }}>{new Date(log.createdAt).toLocaleString()}</span>
              </div>
              <p style={{ fontSize: 12, color: '#64748b' }}>
                <span style={{ color: '#60a5fa' }}>{log.actorName || log.actorId.slice(0, 8)}</span>
                {' '}{log.action === 'create' ? 'created' : log.action === 'delete' ? 'deleted' : 'updated'}{' '}
                <span style={{ color: '#fbbf24' }}>{log.recordId.slice(0, 12)}...</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
