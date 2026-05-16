import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type HealthChecklistRecord, type HealthCheckItem } from '../db';
import { createChecklist, getChecklists, updateChecklistItem, completeChecklist, getChecklistItems, COUNTRY_REGULATORY_LABELS, daysUntilNextInspection } from '../lib/healthChecklist';
import { THEME } from '../lib/theme';

export default function HealthChecklistPage() {
  const navigate = useNavigate();
  const [checklists, setChecklists] = useState<HealthChecklistRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userCountry, setUserCountry] = useState<string | undefined>();
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('inkflow_current_user');
    if (!stored) return;
    db.users.get(stored).then(u => {
      if (!u) return;
      setUserCountry(u.country);
      getChecklists(u.artistId || u.id).then(setChecklists);
    });
  }, []);

  const selected = checklists.find(c => c.id === selectedId);

  const handleCreate = async () => {
    setCreating(true);
    const stored = localStorage.getItem('inkflow_current_user');
    if (!stored) { setCreating(false); return; }
    const u = await db.users.get(stored);
    if (!u) { setCreating(false); return; }
    const id = await createChecklist(u.artistId || u.id, u.country);
    const updated = await getChecklists(u.artistId || u.id);
    setChecklists(updated);
    setSelectedId(id);
    setCreating(false);
  };

  const handleToggleItem = async (itemKey: string, passed: boolean) => {
    if (!selectedId) return;
    await updateChecklistItem(selectedId, itemKey, passed);
    const updated = await getChecklists(
      (await db.users.get(localStorage.getItem('inkflow_current_user') || ''))?.artistId || localStorage.getItem('inkflow_current_user') || ''
    );
    setChecklists(updated);
  };

  const handleComplete = async () => {
    if (!selectedId) return;
    await completeChecklist(selectedId, 'Inspector');
    const stored = localStorage.getItem('inkflow_current_user');
    if (!stored) return;
    const u = await db.users.get(stored);
    const updated = await getChecklists(u?.artistId || stored);
    setChecklists(updated);
  };

  const supportedCountries = Object.keys(COUNTRY_REGULATORY_LABELS);

  return (
    <div style={{ minHeight: '100dvh', background: '#0f172a', color: 'white', paddingBottom: 80 }}>
      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer' }}>←</button>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>Health & Safety Checklist</h1>
            <p style={{ fontSize: 12, color: '#64748b' }}>
              {userCountry && supportedCountries.includes(userCountry.toUpperCase())
                ? `${userCountry.toUpperCase()} regulatory labels applied`
                : 'Universal checklist'}
            </p>
          </div>
        </div>

        {userCountry && !supportedCountries.includes(userCountry.toUpperCase()) && (
          <div style={{ background: '#1e293b', border: '1px solid #f59e0b44', borderRadius: 10, padding: 10, marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: '#fbbf24' }}>
              Country-specific regulatory labels are available for: {supportedCountries.join(', ')}. Using universal checklist items.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <button
            onClick={handleCreate}
            disabled={creating}
            style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#22c55e', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            {creating ? 'Creating...' : '+ New Inspection'}
          </button>
          {checklists.length > 0 && (
            <select
              value={selectedId || ''}
              onChange={e => setSelectedId(e.target.value || null)}
              style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: 14 }}
            >
              <option value="">Select a checklist...</option>
              {checklists.map(c => {
                const daysLeft = daysUntilNextInspection(c);
                return (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.passedAll ? '✅' : '⏳'} {daysLeft !== null ? `(${daysLeft}d left)` : ''}
                  </option>
                );
              })}
            </select>
          )}
        </div>

        {selected && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 600 }}>{selected.name}</h2>
                <p style={{ fontSize: 12, color: '#64748b' }}>
                  {selected.passedAll ? 'All items passed' : 'Some items need attention'} | {selected.items.filter(i => i.passed === true).length}/{selected.items.length} passed
                </p>
              </div>
              {!selected.lastInspectionAt && (
                <button onClick={handleComplete} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#3b82f6', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Complete
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {selected.items.map(item => (
                <div
                  key={item.key}
                  style={{
                    background: '#1e293b',
                    border: item.passed === false ? '1px solid #ef444444' : '1px solid #334155',
                    borderRadius: 10,
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, color: item.passed === false ? '#fca5a5' : '#e2e8f0' }}>{item.label}</span>
                      {item.required && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: '#ef444433', color: '#ef4444' }}>REQUIRED</span>}
                    </div>
                    {item.notes && <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{item.notes}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      onClick={() => handleToggleItem(item.key, true)}
                      style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: item.passed === true ? '#22c55e' : '#334155', color: item.passed === true ? 'white' : '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Pass
                    </button>
                    <button
                      onClick={() => handleToggleItem(item.key, false)}
                      style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: item.passed === false ? '#ef4444' : '#334155', color: item.passed === false ? 'white' : '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Fail
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {selected.lastInspectionAt && (
              <div style={{ marginTop: 20, background: '#1e293b', borderRadius: 10, padding: 14 }}>
                <p style={{ fontSize: 13, color: '#22c55e', fontWeight: 600 }}>Last Inspection: {new Date(selected.lastInspectionAt).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                {selected.nextInspectionDue && (
                  <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                    Next due: {new Date(selected.nextInspectionDue).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}
                    {daysUntilNextInspection(selected)! > 0 ? ` (${daysUntilNextInspection(selected)} days)` : ' — Overdue!'}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {!selected && checklists.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>🏥</p>
            <p style={{ fontSize: 16, color: '#e2e8f0', fontWeight: 600, marginBottom: 4 }}>No inspections yet</p>
            <p style={{ fontSize: 13 }}>Create your first health & safety inspection checklist. Items adapt based on your country setting.</p>
          </div>
        )}
      </div>
    </div>
  );
}
