import { useState, useEffect } from 'react';
import { db, type UserRecord } from '../db';
import { t, type AppLanguage } from '../lib/i18n';

export function BookingLinkShare({ artistId, user }: { artistId: string; user: UserRecord | null }) {
  const [copied, setCopied] = useState(false);
  const [deposit, setDeposit] = useState(() => {
    try { return localStorage.getItem('inkflow_booking_deposit') || ''; } catch { return ''; }
  });
  const slug = (user as any)?.bioProfile?.slug || user?.instagramHandle?.replace(/^@/, '') || '';
  const shortUrl = slug ? `${window.location.origin}/s/${slug}` : `${window.location.origin}/bio/${artistId}`;
  const displayUrl = slug ? `${window.location.origin.replace(/^https?:\/\//, '')}/${slug}` : `book/${artistId}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const text = `Book a tattoo with me: ${shortUrl}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Book an Appointment', text, url: shortUrl }); return; } catch {}
    }
    handleCopy();
  };

  const handleDepositChange = (val: string) => {
    setDeposit(val);
    localStorage.setItem('inkflow_booking_deposit', val);
  };

  return (
    <div style={{ background: 'linear-gradient(135deg, #312e81 0%, #1e293b 100%)', border: '1px solid #4338ca', borderRadius: 12, padding: 14 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#c084fc', marginBottom: 4 }}>Your Link</p>
      <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>Share your page — clients see your work, links, and can book.</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <input value={displayUrl} readOnly
          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #4338ca', background: '#0f172a', color: '#a5b4fc', fontSize: 12, outline: 'none' }}
          onFocus={e => e.target.select()} />
        <button onClick={handleCopy}
          style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: copied ? '#166534' : '#7e22ce', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button onClick={handleShare}
          style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid #4338ca', background: 'transparent', color: '#c084fc', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Share
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>Deposit ($):</span>
        <input type="number" placeholder="0 = no deposit" value={deposit} onChange={e => handleDepositChange(e.target.value)}
          style={{ width: 100, padding: '6px 10px', borderRadius: 8, border: '1px solid #4338ca', background: '#0f172a', color: 'white', fontSize: 12, outline: 'none' }} step="0.01" min="0" />
        <span style={{ fontSize: 10, color: '#64748b' }}>0 = skip payment step</span>
      </div>
    </div>
  );
}

const STATION_COLORS = [
  '#e11d48', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#78716c',
];

export function StationsSection({ lang, user, onUserUpdate }: { lang: AppLanguage; user: UserRecord | null; onUserUpdate: (u: UserRecord) => void }) {
  const [editing, setEditing] = useState(false);
  const [stations, setStations] = useState<{ name: string; color: string }[]>([]);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    setStations(user?.stations || []);
  }, [user?.stations]);

  const save = async (updated: { name: string; color: string }[]) => {
    if (!user) return;
    await db.users.update(user.id, { stations: updated.length > 0 ? updated : undefined });
    const fresh = await db.users.get(user.id);
    if (fresh) onUserUpdate(fresh);
  };

  const addStation = () => {
    const name = newName.trim();
    if (!name || stations.some(s => s.name.toLowerCase() === name.toLowerCase())) return;
    const color = STATION_COLORS[stations.length % STATION_COLORS.length];
    const updated = [...stations, { name, color }];
    setStations(updated);
    setNewName('');
    save(updated);
  };

  const removeStation = (idx: number) => {
    const updated = stations.filter((_, i) => i !== idx);
    setStations(updated);
    save(updated);
  };

  const changeColor = (idx: number, color: string) => {
    const updated = stations.map((s, i) => i === idx ? { ...s, color } : s);
    setStations(updated);
    save(updated);
  };

  return (
    <div style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <p style={{ fontWeight: 600 }}>{t(lang, 'stations')}</p>
        <button onClick={() => setEditing(!editing)} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: 14, cursor: 'pointer', padding: '10px 14px' }}>
          {editing ? t(lang, 'close') : t(lang, 'edit')}
        </button>
      </div>
      <p style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>{t(lang, 'stations_desc')}</p>

      {stations.length === 0 && !editing && (
        <p style={{ fontSize: 13, color: '#94a3b8' }}>No stations added yet. Tap Edit to set up your rooms.</p>
      )}

      {stations.map((s, idx) => (
        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, padding: '6px 10px', background: '#0f172a', borderRadius: 8 }}>
          <div style={{ width: 14, height: 14, borderRadius: 4, background: s.color, flexShrink: 0 }} />
          <span style={{ fontSize: 13, flex: 1 }}>{s.name}</span>
          {editing && (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {STATION_COLORS.map(c => (
                <div
                  key={c}
                  onClick={() => changeColor(idx, c)}
                  style={{
                    width: 18, height: 18, borderRadius: 4, background: c, cursor: 'pointer',
                    border: s.color === c ? '2px solid white' : '2px solid transparent',
                  }}
                />
              ))}
              <button onClick={() => removeStation(idx)}
                style={{ background: 'none', border: 'none', color: '#f87171', fontSize: 16, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>
                ×
              </button>
            </div>
          )}
        </div>
      ))}

      {editing && (
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <input
            placeholder={t(lang, 'station_name')}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addStation()}
            style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 13, outline: 'none' }}
          />
          <button onClick={addStation} disabled={!newName.trim()}
            style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: newName.trim() ? '#e11d48' : '#334155', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Add
          </button>
        </div>
      )}
    </div>
  );
}

export function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, marginTop: 4 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: '#1e293b' }} />
    </div>
  );
}

const PRESETS_KEY = 'inkflow_consumable_presets';
type Preset = { type: string; items: string[] };

export function ConsumablePresets({ lang }: { lang: AppLanguage }) {
  const [presets, setPresets] = useState<Preset[]>(() => {
    try { return JSON.parse(localStorage.getItem(PRESETS_KEY) || '[]'); } catch { return []; }
  });
  const [newType, setNewType] = useState('');
  const [newItem, setNewItem] = useState('');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  const save = (p: Preset[]) => {
    setPresets(p);
    localStorage.setItem(PRESETS_KEY, JSON.stringify(p));
  };

  const addPreset = () => {
    const type = newType.trim();
    if (!type || presets.some(p => p.type === type)) return;
    save([...presets, { type, items: [] }]);
    setNewType('');
  };

  const addItem = (idx: number) => {
    const item = newItem.trim();
    if (!item) return;
    const next = [...presets];
    if (!next[idx].items.includes(item)) {
      next[idx] = { ...next[idx], items: [...next[idx].items, item] };
      save(next);
    }
    setNewItem('');
  };

  const removeItem = (presetIdx: number, itemIdx: number) => {
    const next = [...presets];
    next[presetIdx] = { ...next[presetIdx], items: next[presetIdx].items.filter((_, i) => i !== itemIdx) };
    save(next);
  };

  const removePreset = (idx: number) => {
    save(presets.filter((_, i) => i !== idx));
    setEditingIdx(null);
  };

  const commonTypes = ['Sleeve', 'Cover-up', 'Black & Grey', 'Color', 'Geometric', 'Lettering', 'Watercolor', 'Realism'];

  return (
    <div style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 16 }}>
      <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{t(lang, 'consumable_presets')}</p>
      <p style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>
        {t(lang, 'consumable_presets_desc')}
      </p>

      {presets.map((p, idx) => (
        <div key={idx} style={{ marginBottom: 8, padding: 8, background: '#0f172a', borderRadius: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#c084fc' }}>{p.type}</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => setEditingIdx(editingIdx === idx ? null : idx)}
                style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: 13, cursor: 'pointer', padding: '6px 10px' }}>
                {editingIdx === idx ? t(lang, 'close') : t(lang, 'edit')}
              </button>
              <button onClick={() => removePreset(idx)}
                style={{ background: 'none', border: 'none', color: '#f87171', fontSize: 13, cursor: 'pointer', padding: '6px 10px' }}>{t(lang, 'del')}</button>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {p.items.map((item, i) => (
              <span key={i} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: '#312e81', color: '#c4b5fd', cursor: editingIdx === idx ? 'pointer' : 'default' }}
                onClick={() => editingIdx === idx && removeItem(idx, i)}>
                {item} {editingIdx === idx ? '✕' : ''}
              </span>
            ))}
            {p.items.length === 0 && <span style={{ fontSize: 10, color: '#475569' }}>{t(lang, 'no_items_yet')}</span>}
          </div>
          {editingIdx === idx && (
            <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
              <input placeholder={t(lang, 'add_item')} value={newItem} onChange={e => setNewItem(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addItem(idx)}
                style={{ flex: 1, padding: '4px 8px', borderRadius: 6, border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: 12 }} />
              <button onClick={() => addItem(idx)}
                style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#7e22ce', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{t(lang, 'add')}</button>
            </div>
          )}
        </div>
      ))}

      <div style={{ display: 'flex', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
        {commonTypes.filter(t => !presets.some(p => p.type === t)).slice(0, 4).map(t => (
          <button key={t} onClick={() => { save([...presets, { type: t, items: [] }]); }}
            style={{ fontSize: 14, padding: '10px 16px', borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}>
            + {t}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        <input placeholder={t(lang, 'custom_type')} value={newType} onChange={e => setNewType(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addPreset()}
          style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 12 }} />
        <button onClick={addPreset} disabled={!newType.trim()}
          style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: newType.trim() ? '#7e22ce' : '#334155', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          {t(lang, 'create')}
        </button>
      </div>
    </div>
  );
}
