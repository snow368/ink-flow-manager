import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db, type ClientRecord, type AppointmentRecord, type LeadRecord, type LeadRevisionRecord } from '../db';
import { THEME } from '../lib/theme';
import { detectInitialLanguage, t } from '../lib/i18n';
import { getArtistAvailability } from '../lib/availability';

export default function AppointmentForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState(60);
  const [customDuration, setCustomDuration] = useState('');
  const [type, setType] = useState('new_tattoo');
  const [bodyPart, setBodyPart] = useState('');
  const [designNotes, setDesignNotes] = useState('');
  const [clientAllergies, setClientAllergies] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadingClients, setLoadingClients] = useState(true);
  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [creatingClient, setCreatingClient] = useState(false);
  const [initialStatus, setInitialStatus] = useState<'unconfirmed' | 'deposit_paid'>('unconfirmed');
  const [depositAmount, setDepositAmount] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState('');
  const [depositPercent, setDepositPercent] = useState('');
  const [conflictWarning, setConflictWarning] = useState('');
  const [nextAvailableTime, setNextAvailableTime] = useState('');
  const [fromLead, setFromLead] = useState<LeadRecord | null>(null);
  const [finalRevision, setFinalRevision] = useState<LeadRevisionRecord | null>(null);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [station, setStation] = useState('');
  const [userStations, setUserStations] = useState<{ name: string; color: string }[]>([]);
  const [seriesEnabled, setSeriesEnabled] = useState(false);
  const [seriesName, setSeriesName] = useState('');
  const [existingSeries, setExistingSeries] = useState<{ name: string; seriesId: string }[]>([]);
  const [selectedExistingSeriesId, setSelectedExistingSeriesId] = useState('');
  const lang = detectInitialLanguage();

  const durationPresets = [
    { label: '30min', value: 30 },
    { label: '1hr', value: 60 },
    { label: '1.5hrs', value: 90 },
    { label: '2hrs', value: 120 },
    { label: '3hrs', value: 180 },
  ];

  const datePresets = [
    { label: 'Tomorrow', value: 1 },
    { label: 'Day after', value: 2 },
    { label: '1 week', value: 7 },
    { label: '2 weeks', value: 14 },
    { label: '1 month', value: 30 },
  ];

  const loadClients = () => {
    setLoadingClients(true);
    db.clients.orderBy('createdAt').reverse().toArray()
      .then(list => { setClients(list); if (list.length === 0) setError(''); })
      .catch(() => setError('Failed to load clients'))
      .finally(() => setLoadingClients(false));
  };

  useEffect(() => { loadClients(); }, []);
  useEffect(() => {
    const uid = localStorage.getItem('inkflow_current_user');
    if (uid) db.users.get(uid).then(u => setUserStations(u?.stations || []));
  }, []);
  useEffect(() => {
    const price = parseFloat(estimatedPrice);
    const pct = parseFloat(depositPercent);
    if (price > 0 && pct > 0 && pct <= 100) {
      setDepositAmount((price * pct / 100).toFixed(2));
    }
  }, [estimatedPrice, depositPercent]);
  useEffect(() => {
    const clientId = searchParams.get('clientId');
    const leadId = searchParams.get('leadId');
    if (clientId) setSelectedClient(clientId);
    if (!leadId) return;
    db.leads.get(leadId).then((lead) => {
      if (!lead) return;
      setFromLead(lead);
      if (lead.preferredDate) setDate(lead.preferredDate);
      if (lead.preferredTime) setTime(lead.preferredTime);
      if (lead.finalRevisionId) {
        db.leadRevisions.get(lead.finalRevisionId).then((rev) => setFinalRevision(rev || null));
      } else {
        setFinalRevision(null);
      }
    });
  }, [searchParams]);

  useEffect(() => {
    checkConflicts();
  }, [date, time, duration, customDuration, selectedClient]);

  useEffect(() => {
    if (!selectedClient) { setClientAllergies([]); setExistingSeries([]); return; }
    db.clients.get(selectedClient).then(c => setClientAllergies(c?.allergies || []));
    // Load existing series for this client
    db.appointments.where('clientId').equals(selectedClient).toArray().then(apps => {
      const seen = new Map<string, { name: string; seriesId: string }>();
      for (const a of apps) {
        if (!a.seriesId) continue;
        const idx = a.seriesId.indexOf('_', 7); // skip "series_" prefix
        const name = idx > 0 ? decodeURIComponent(a.seriesId.slice(idx + 1)) : a.seriesId;
        if (!seen.has(name)) seen.set(name, { name, seriesId: a.seriesId });
      }
      setExistingSeries([...seen.values()]);
    });
  }, [selectedClient]);

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

  const checkConflicts = async () => {
    const finalDuration = customDuration ? parseInt(customDuration, 10) : duration;
    if (!time || !finalDuration || finalDuration < 5) {
      setConflictWarning('');
      setNextAvailableTime('');
      return;
    }

    const artistId = localStorage.getItem('inkflow_current_user') || 'demo_artist';
    const avail = await getArtistAvailability(artistId);
    const dayEnd = avail.end ? (parseInt(avail.end.split(':')[0]) * 60 + parseInt(avail.end.split(':')[1])) : 22 * 60;
    const sameDay = await db.appointments.where('date').equals(date).toArray();
    const sameArtist = sameDay.filter(a => a.artistId === artistId && a.status !== 'cancelled');
    const sorted = [...sameArtist].sort((a, b) => a.time.localeCompare(b.time));

    const newStart = toMinutes(time);
    const newEnd = newStart + finalDuration;
    const conflict = sorted.find(a => {
      const start = toMinutes(a.time);
      const end = start + a.duration;
      return hasOverlap(newStart, newEnd, start, end);
    });

    if (!conflict) {
      setConflictWarning('');
      setNextAvailableTime('');
      return;
    }

    setConflictWarning(`Time conflict with ${conflict.time} appointment.`);
    let candidate = newStart + 15;
    while (candidate + finalDuration <= dayEnd) {
      const blocked = sorted.some(a => {
        const start = toMinutes(a.time);
        const end = start + a.duration;
        return hasOverlap(candidate, candidate + finalDuration, start, end);
      });
      if (!blocked) {
        setNextAvailableTime(toTimeString(candidate));
        return;
      }
      candidate += 15;
    }
    setNextAvailableTime('');
  };

  const handleQuickCreateClient = async () => {
    if (!quickName.trim() || creatingClient) return;
    setCreatingClient(true);
    try {
      const now = Date.now();
      const id = 'client_' + now + '_' + Math.random().toString(36).slice(2, 6);
      await db.clients.add({ id, name: quickName.trim(), phone: quickPhone.trim() || undefined, createdAt: now });
      setSelectedClient(id);
      setQuickName('');
      setQuickPhone('');
      await loadClients();
    } catch (e: any) { setError('Failed: ' + (e?.message || 'unknown')); }
    finally { setCreatingClient(false); }
  };

  const handleSave = async () => {
    if (!selectedClient) { setError('Please select a client'); return; }
    const finalDuration = customDuration ? parseInt(customDuration, 10) : duration;
    if (!finalDuration || finalDuration < 5) { setError('Duration must be at least 5 minutes'); return; }
    setSaving(true); setError('');
    try {
      const artistId = localStorage.getItem('inkflow_current_user') || 'demo_artist';
      const id = 'appt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      const dAmount = initialStatus === 'deposit_paid' ? Math.round(parseFloat(depositAmount || '0') * 100) : undefined;
      let seriesId: string | undefined;
      if (seriesEnabled) {
        if (selectedExistingSeriesId) {
          seriesId = selectedExistingSeriesId;
        } else if (seriesName.trim()) {
          seriesId = 'series_' + Date.now() + '_' + encodeURIComponent(seriesName.trim());
        }
      }
      await db.appointments.add({ id, clientId: selectedClient, artistId, date, time, duration: finalDuration, type, bodyPart: bodyPart || undefined, designNotes: designNotes || undefined, station: station || undefined, seriesId, status: initialStatus, depositAmount: dAmount, waiverCompleted: false, createdAt: Date.now() });
      navigate('/today');
    } catch (e: any) { setError('Failed: ' + (e?.message || 'unknown')); }
    finally { setSaving(false); }
  };

  const appointmentTypes = [
    { label: 'New Tattoo', value: 'new_tattoo' },
    { label: 'Touch-Up', value: 'touch_up' },
    { label: 'Consultation', value: 'consultation' },
    { label: 'Cover-Up', value: 'cover_up' },
    { label: 'Removal', value: 'removal' },
    { label: 'Continuation', value: 'continuation' },
  ];

  const showQuickCreate = !loadingClients && clients.length === 0;

  return (
    <div style={{ padding: 24, color: THEME.text.primary, paddingBottom: 110 }}>
      <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>{t(lang, 'new_appointment')}</h2>
      {error && <div style={{ background: '#7f1d1d', padding: 12, borderRadius: 10, marginBottom: 16 }}><p style={{ color: '#fca5a5', fontSize: 14 }}>{error}</p></div>}

      {showQuickCreate ? (
        <div style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 16 }}>
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Quick Add Client</p>
          <input placeholder="Client name" value={quickName} onChange={e => setQuickName(e.target.value)} style={inputStyle} />
          <input placeholder="Phone (optional)" value={quickPhone} onChange={e => setQuickPhone(e.target.value)} style={inputStyle} />
          <button onClick={handleQuickCreateClient} disabled={creatingClient || !quickName.trim()} style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: creatingClient || !quickName.trim() ? '#4b5563' : '#e11d48', color: THEME.text.primary, fontSize: 14, fontWeight: 600 }}>{creatingClient ? 'Adding...' : 'Add Client & Continue'}</button>
          <p onClick={() => navigate('/client/new')} style={{ textAlign: 'center', marginTop: 12, color: '#94a3b8', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>or create a full client profile</p>
        </div>
      ) : (
        <>
          {loadingClients ? <p style={{ color: '#94a3b8' }}>Loading clients...</p> : (
            <select value={selectedClient} onChange={e => { setSelectedClient(e.target.value); setError(''); }} style={selectStyle}>
              <option value="">Select client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}

          {/* 蹇嵎鏃ユ湡鎸夐挳 */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
            {datePresets.map(p => (
              <button key={p.value} onClick={() => { const d = new Date(); d.setDate(d.getDate() + p.value); setDate(d.toISOString().slice(0, 10)); }} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #475569', background: '#1e293b', color: '#e2e8f0', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                {p.label}
              </button>
            ))}
          </div>

          {/* 鏃ユ湡閫夋嫨鍣?- 浜壊鍥炬爣 */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inputStyle, marginBottom: 0, colorScheme: 'dark' }} />
          </div>

          {/* 鏃堕棿閫夋嫨鍣?- 浜壊鍥炬爣 */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>Time</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ ...inputStyle, marginBottom: 0, colorScheme: 'dark' }} />
          </div>

          {/* 鏃堕暱閫夋嫨 */}
          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>Duration</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {durationPresets.map(p => (
              <button key={p.value} onClick={() => { setDuration(p.value); setCustomDuration(''); }} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: (duration === p.value && !customDuration) ? '#e11d48' : '#334155', color: THEME.text.primary, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{p.label}</button>
            ))}
          </div>
          <input type="number" placeholder="Custom minutes" value={customDuration} onChange={e => { setCustomDuration(e.target.value); if (e.target.value) setDuration(0); }} style={{ ...inputStyle, marginBottom: 12 }} />

          {/* 棰勭害绫诲瀷 */}
          <select value={type} onChange={e => setType(e.target.value)} style={selectStyle}>{appointmentTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select>

          {/* Station */}
          {userStations.length > 0 && (
            <select value={station} onChange={e => setStation(e.target.value)} style={selectStyle}>
              <option value="">{t(lang, 'station_select')}</option>
              {userStations.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
          )}

          {/* Series */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#94a3b8', cursor: 'pointer', marginBottom: 8 }}>
              <input type="checkbox" checked={seriesEnabled} onChange={e => { setSeriesEnabled(e.target.checked); if (!e.target.checked) { setSeriesName(''); setSelectedExistingSeriesId(''); } }} />
              {t(lang, 'series_part_of')}
            </label>
            {seriesEnabled && (
              <>
                {existingSeries.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <p style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{t(lang, 'series_existing')}</p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {existingSeries.map(s => (
                        <button key={s.seriesId} onClick={() => { setSelectedExistingSeriesId(s.seriesId); setSeriesName(''); }}
                          style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid', borderColor: selectedExistingSeriesId === s.seriesId ? '#a855f7' : '#334155', background: selectedExistingSeriesId === s.seriesId ? '#a855f722' : '#1e293b', color: selectedExistingSeriesId === s.seriesId ? '#c084fc' : '#94a3b8', fontSize: 12, cursor: 'pointer' }}>
                          {s.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {!selectedExistingSeriesId && (
                  <input
                    placeholder={t(lang, 'series_name')}
                    value={seriesName}
                    onChange={e => setSeriesName(e.target.value)}
                    style={{ ...inputStyle, marginBottom: 0 }}
                  />
                )}
              </>
            )}
          </div>

          {/* Body Part */}
          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>Body Part</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {['Arm', 'Leg', 'Back', 'Chest', 'Sleeve', 'Hand', 'Neck', 'Rib', 'Thigh', 'Calf', 'Forearm', 'Shoulder', 'Foot', 'Head'].map(bp => (
              <button key={bp} onClick={() => setBodyPart(bodyPart === bp ? '' : bp)}
                style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid', borderColor: bodyPart === bp ? '#e11d48' : '#334155', background: bodyPart === bp ? '#e11d4820' : '#1e293b', color: bodyPart === bp ? '#f87171' : '#94a3b8', fontSize: 12, cursor: 'pointer' }}>
                {bp}
              </button>
            ))}
          </div>

          {/* Design Notes */}
          <textarea placeholder="Design notes, reference ideas, size, color..." value={designNotes}
            onChange={e => setDesignNotes(e.target.value)}
            style={{ ...inputStyle, marginBottom: 12, minHeight: 60, resize: 'vertical' }} />

          {/* Client Allergy Alert */}
          {clientAllergies.length > 0 && (
            <div style={{ background: '#7f1d1d', padding: 10, borderRadius: 10, marginBottom: 12 }}>
              <p style={{ fontWeight: 600, color: '#fca5a5', marginBottom: 4, fontSize: 13 }}>Allergy Alert</p>
              {clientAllergies.map((a, i) => <p key={i} style={{ fontSize: 13, color: '#fca5a5' }}>- {a}</p>)}
            </div>
          )}

          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>Deposit Status</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button onClick={() => setInitialStatus('unconfirmed')} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: initialStatus === 'unconfirmed' ? '#e11d48' : '#334155', color: THEME.text.primary, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Pending Deposit
            </button>
            <button onClick={() => setInitialStatus('deposit_paid')} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', background: initialStatus === 'deposit_paid' ? '#e11d48' : '#334155', color: THEME.text.primary, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Deposit Paid
            </button>
          </div>
          {initialStatus === 'deposit_paid' && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>Estimated Price ($)</label>
              <input type="number" placeholder="e.g. 500" value={estimatedPrice} onChange={e => { setEstimatedPrice(e.target.value); }}
                style={{ ...inputStyle, marginBottom: 8 }} step="0.01" min="0" />

              <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>Deposit %</label>
              <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                {[25, 30, 50].map(pct => (
                  <button key={pct} onClick={() => setDepositPercent(String(pct))}
                    style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid', borderColor: depositPercent === String(pct) ? '#e11d48' : '#334155', background: depositPercent === String(pct) ? '#e11d4820' : 'transparent', color: depositPercent === String(pct) ? '#f87171' : '#94a3b8', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    {pct}%
                  </button>
                ))}
                <input type="number" placeholder="Custom" value={depositPercent} onChange={e => setDepositPercent(e.target.value)}
                  style={{ width: 80, padding: '8px 8px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 13, textAlign: 'center', outline: 'none' }}
                  step="1" min="1" max="100" />
              </div>

              <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>Deposit Amount ($)</label>
              <input type="number" placeholder="e.g. 125" value={depositAmount} onChange={e => { setDepositAmount(e.target.value); setDepositPercent(''); setEstimatedPrice(''); }}
                style={{ ...inputStyle, marginBottom: 0, fontWeight: 600, color: '#fbbf24' }} step="0.01" min="0" />

              {parseFloat(estimatedPrice) > 0 && parseFloat(depositAmount) > 0 && (
                <div style={{ marginTop: 8, padding: '10px 12px', borderRadius: 8, background: '#1e293b', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>Remaining after deposit</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#4ade80' }}>
                    ${(parseFloat(estimatedPrice) - parseFloat(depositAmount)).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          {fromLead && (
            <div style={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0', borderRadius: 10, padding: 10, marginBottom: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Lead Review</p>
              <p style={{ fontSize: 12, color: '#94a3b8' }}>Source: {fromLead.source}</p>
              {fromLead.changeRequest && <p style={{ fontSize: 12, marginTop: 4 }}>Change request: {fromLead.changeRequest}</p>}
              {fromLead.note && <p style={{ fontSize: 12, marginTop: 4 }}>Notes: {fromLead.note}</p>}
              {finalRevision && (
                <div style={{ marginTop: 6, padding: 8, border: '1px solid #166534', borderRadius: 8, background: '#0f2a1b' }}>
                  <p style={{ fontSize: 12, color: '#86efac', fontWeight: 700, marginBottom: 3 }}>Final Revision v{finalRevision.version}</p>
                  {finalRevision.note && <p style={{ fontSize: 12 }}>Summary: {finalRevision.note}</p>}
                  {finalRevision.changeRequest && <p style={{ fontSize: 12, marginTop: 2 }}>Changes: {finalRevision.changeRequest}</p>}
                  {finalRevision.referenceImages && finalRevision.referenceImages.length > 0 && (
                    <p style={{ fontSize: 12, marginTop: 2, color: '#93c5fd' }}>Images in final revision: {finalRevision.referenceImages.length}</p>
                  )}
                </div>
              )}
              {fromLead.allergies && fromLead.allergies.length > 0 && (
                <p style={{ fontSize: 12, marginTop: 4, color: '#fca5a5' }}>
                  Allergy Alert ({fromLead.allergySeverity || 'low'}): {fromLead.allergies.join(', ')}
                </p>
              )}
              {fromLead.referenceImages && fromLead.referenceImages.length > 0 && (
                <p style={{ fontSize: 12, marginTop: 4, color: '#93c5fd' }}>
                  Reference images: {fromLead.referenceImages.length}
                </p>
              )}
              <label style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#cbd5e1' }}>
                <input type="checkbox" checked={reviewConfirmed} onChange={e => setReviewConfirmed(e.target.checked)} />
                I reviewed this lead info and confirm this appointment setup.
              </label>
            </div>
          )}

          {conflictWarning && (
            <div style={{ background: '#7c2d12', border: '1px solid #ea580c', color: '#fed7aa', borderRadius: 10, padding: 10, marginBottom: 12 }}>
              <p style={{ fontSize: 13 }}>{conflictWarning}</p>
              {nextAvailableTime && (
                <button onClick={() => setTime(nextAvailableTime)} style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, border: 'none', background: '#ea580c', color: THEME.text.primary, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Use next available: {nextAvailableTime}
                </button>
              )}
            </div>
          )}

          <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, padding: '12px 24px calc(env(safe-area-inset-bottom, 0px) + 12px)', background: 'linear-gradient(to top, #0f172a 80%, rgba(15,23,42,0.2))' }}>
            <button onClick={handleSave} disabled={saving || !selectedClient || !!conflictWarning || (!!fromLead && !reviewConfirmed)} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: saving || !selectedClient || !!conflictWarning || (!!fromLead && !reviewConfirmed) ? '#4b5563' : '#e11d48', color: THEME.text.primary, fontSize: 16, fontWeight: 600, cursor: saving || !selectedClient || !!conflictWarning || (!!fromLead && !reviewConfirmed) ? 'not-allowed' : 'pointer' }}>{saving ? t(lang, 'saving') : t(lang, 'create_appointment')}</button>
          </div>
        </>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px',
  borderRadius: 12, border: '1px solid #475569', background: '#1e293b',
  color: THEME.text.primary, fontSize: 16, outline: 'none', boxSizing: 'border-box',
};
const selectStyle: React.CSSProperties = { ...inputStyle, marginBottom: 12, appearance: 'auto' };


