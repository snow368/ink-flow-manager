import { useEffect, useState, useCallback } from 'react';
import { getBackendUrl } from '../lib/backendApi';
import { THEME } from '../lib/theme';

function authHeaders(): Record<string, string> {
  const secret = localStorage.getItem('inkflow_backend_secret') || localStorage.getItem('inkflow_api_secret') || '';
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (secret) h['x-api-secret'] = secret;
  return h;
}

/* ─── Types ─── */
interface Passport {
  id: number;
  client_name: string;
  client_email: string;
  artist_name: string;
  session_date: string;
  studio_name: string;
  ink_brand: string;
  ink_name: string;
  ink_color: string;
  batch_number: string;
  expiration_date: string;
  supplier: string;
  notes: string;
  pdf_generated: number;
  created_at: number;
}

interface BrandPreset {
  id: number;
  brand_name: string;
  colors: string;
  region: string;
  supplier: string;
}

const API = () => {
  const base = getBackendUrl();
  if (!base) return '';
  // If base ends with a path, strip it; the ink-passport routes are at the root
  return `${base.replace(/\/+$/, '')}/api/ink-passport`;
};

function apiUrl(path: string): string {
  const base = getBackendUrl();
  if (!base) return '';
  return `${base.replace(/\/+$/, '')}/api/ink-passport${path}`;
}

const SECTIONS = ['list', 'new'] as const;
type Section = typeof SECTIONS[number];

const emptyForm = {
  client_name: '', client_email: '', artist_name: '', session_date: new Date().toISOString().split('T')[0],
  studio_name: '', ink_brand: '', ink_name: '', ink_color: '',
  batch_number: '', expiration_date: '', supplier: '', notes: '',
};

export default function InkPassportPage() {
  const [section, setSection] = useState<Section>('list');
  const [items, setItems] = useState<Passport[]>([]);
  const [brands, setBrands] = useState<BrandPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<{ total: number; withPdf: number; recent30d: number } | null>(null);

  /* ─── Fetch ─── */
  const fetchList = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: '1', limit: '50' });
      if (q) params.set('search', q);
      const r = await fetch(apiUrl(`/list?${params}`), { headers: authHeaders() });
      const d = await r.json();
      if (d.ok) setItems(d.items || []);
    } catch { setItems([]); }
    setLoading(false);
  }, []);

  const fetchBrands = useCallback(async () => {
    try {
      const r = await fetch(apiUrl('/brands'), { headers: authHeaders() });
      const d = await r.json();
      if (d.ok) setBrands(d.brands || []);
    } catch {}
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const r = await fetch(apiUrl('/stats'), { headers: authHeaders() });
      const d = await r.json();
      if (d.ok) setStats(d.stats);
    } catch {}
  }, []);

  useEffect(() => { fetchList(search); fetchBrands(); fetchStats(); }, [search, fetchList, fetchBrands, fetchStats]);

  /* ─── Helpers ─── */
  const getColors = (brandName: string): string[] => {
    const b = brands.find(x => x.brand_name === brandName);
    if (!b) return [];
    try { return JSON.parse(b.colors); } catch { return []; }
  };

  const handleBrandChange = (brand: string) => {
    const preset = brands.find(b => b.brand_name === brand);
    setForm(f => ({ ...f, ink_brand: brand, ink_color: '', supplier: preset?.supplier || '' }));
  };

  /* ─── Save ─── */
  const handleSave = async () => {
    if (!form.client_name || !form.artist_name || !form.session_date || !form.ink_brand) {
      alert('Client name, artist, session date, and ink brand are required');
      return;
    }
    setSaving(true);
    try {
      const method = editId ? 'PUT' : 'POST';
      const url = editId ? apiUrl(`/${editId}`) : apiUrl('');
      const r = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(form) });
      const d = await r.json();
      if (d.ok) {
        setForm(emptyForm); setEditId(null); setSection('list');
        fetchList(search); fetchStats();
      } else alert(d.error || 'Save failed');
    } catch { alert('Save failed'); }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this ink passport?')) return;
    try {
      await fetch(apiUrl(`/${id}`), { method: 'DELETE', headers: authHeaders() });
      fetchList(search); fetchStats();
    } catch {}
  };

  /* ─── Styles ─── */
  const s = {
    page: { padding: 16, maxWidth: 800, margin: '0 auto' },
    header: { fontSize: 22, fontWeight: 700, color: THEME.text.primary, marginBottom: 4 } as const,
    sub: { fontSize: 13, color: THEME.text.subtle, marginBottom: 16 },
    tabs: { display: 'flex', gap: 8, marginBottom: 16 } as const,
    tab: (active: boolean) => ({
      padding: '10px 20px', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 600,
      background: active ? THEME.brand.primary : THEME.bg.panel,
      color: active ? '#fff' : THEME.text.primary, cursor: 'pointer',
    }),
    card: { background: THEME.bg.panel, borderRadius: 12, padding: 16, border: `1px solid ${THEME.border.default}` } as const,
    row: { display: 'flex', flexWrap: 'wrap' as const, gap: 12, marginBottom: 12 },
    field: { flex: '1 1 180px' } as const,
    label: { fontSize: 12, color: THEME.text.subtle, marginBottom: 4, fontWeight: 500 },
    input: {
      width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${THEME.border.default}`,
      background: THEME.bg.canvas, color: THEME.text.primary, fontSize: 14, boxSizing: 'border-box' as const,
    },
    select: {
      width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${THEME.border.default}`,
      background: THEME.bg.canvas, color: THEME.text.primary, fontSize: 14, boxSizing: 'border-box' as const,
    },
    table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 },
    th: { textAlign: 'left' as const, padding: '10px 8px', borderBottom: `1px solid ${THEME.border.default}`, color: THEME.text.subtle, fontWeight: 600, fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
    td: { padding: '10px 8px', borderBottom: `1px solid ${THEME.border.default}`, color: THEME.text.primary },
    btn: (color: string) => ({ padding: '6px 14px', borderRadius: 8, border: 'none', background: color, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }),
    statBox: { flex: 1, padding: 14, borderRadius: 10, background: THEME.bg.panel, border: `1px solid ${THEME.border.default}`, textAlign: 'center' as const },
    statNum: { fontSize: 24, fontWeight: 700, color: THEME.text.primary },
    statLabel: { fontSize: 11, color: THEME.text.subtle, marginTop: 2, textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
  };

  const renderList = () => (
    <>
      {/* Stats */}
      {stats && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={s.statBox}><div style={s.statNum}>{stats.total}</div><div style={s.statLabel}>Total</div></div>
          <div style={s.statBox}><div style={s.statNum}>{stats.withPdf}</div><div style={s.statLabel}>With PDF</div></div>
          <div style={s.statBox}><div style={s.statNum}>{stats.recent30d}</div><div style={s.statLabel}>Last 30 Days</div></div>
        </div>
      )}

      {/* Search */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          placeholder="Search client, artist, brand..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, ...s.input }}
        />
        <button onClick={() => { setForm(emptyForm); setEditId(null); setSection('new'); }}
          style={s.tab(true)}>
          + New
        </button>
      </div>

      {/* Table */}
      <div style={s.card}>
        {loading ? (
          <p style={{ textAlign: 'center', color: THEME.text.subtle, padding: 20 }}>Loading...</p>
        ) : items.length === 0 ? (
          <p style={{ textAlign: 'center', color: THEME.text.subtle, padding: 20 }}>No ink passports yet. Create one to get started.</p>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Client</th><th style={s.th}>Artist</th><th style={s.th}>Date</th>
                <th style={s.th}>Brand</th><th style={s.th}>Batch</th><th style={s.th}>Expires</th><th style={s.th}></th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td style={s.td}>{item.client_name}</td>
                  <td style={s.td}>{item.artist_name}</td>
                  <td style={s.td}>{item.session_date}</td>
                  <td style={s.td}>{item.ink_brand}{item.ink_color ? ` / ${item.ink_color}` : ''}</td>
                  <td style={{...s.td, fontFamily: 'monospace', fontSize: 12}}>{item.batch_number || '—'}</td>
                  <td style={{...s.td, color: item.expiration_date && item.expiration_date < new Date().toISOString().split('T')[0] ? '#ef4444' : THEME.text.secondary}}>
                    {item.expiration_date || '—'}
                  </td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => {
                        setForm({
                          client_name: item.client_name, client_email: item.client_email,
                          artist_name: item.artist_name, session_date: item.session_date,
                          studio_name: item.studio_name, ink_brand: item.ink_brand,
                          ink_name: item.ink_name, ink_color: item.ink_color,
                          batch_number: item.batch_number, expiration_date: item.expiration_date,
                          supplier: item.supplier, notes: item.notes,
                        });
                        setEditId(item.id);
                        setSection('new');
                      }} style={s.btn('#3b82f6')}>Edit</button>
                      <button onClick={() => handleDelete(item.id)} style={s.btn('#ef4444')}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );

  const renderForm = () => (
    <div style={s.card}>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: THEME.text.primary, marginBottom: 4 }}>
        {editId ? 'Edit Ink Passport' : 'New Ink Passport'}
      </h3>
      <p style={s.sub}>EU REACH compliance — record every ink used per session</p>

      <div style={s.row}>
        <div style={s.field}>
          <div style={s.label}>Client Name *</div>
          <input value={form.client_name} onChange={e => setForm(f => ({...f, client_name: e.target.value}))} placeholder="e.g. Jane Smith" style={s.input} />
        </div>
        <div style={s.field}>
          <div style={s.label}>Client Email</div>
          <input value={form.client_email} onChange={e => setForm(f => ({...f, client_email: e.target.value}))} placeholder="jane@example.com" style={s.input} />
        </div>
      </div>

      <div style={s.row}>
        <div style={s.field}>
          <div style={s.label}>Artist Name *</div>
          <input value={form.artist_name} onChange={e => setForm(f => ({...f, artist_name: e.target.value}))} placeholder="e.g. Mike Chen" style={s.input} />
        </div>
        <div style={s.field}>
          <div style={s.label}>Session Date *</div>
          <input type="date" value={form.session_date} onChange={e => setForm(f => ({...f, session_date: e.target.value}))} style={s.input} />
        </div>
        <div style={s.field}>
          <div style={s.label}>Studio</div>
          <input value={form.studio_name} onChange={e => setForm(f => ({...f, studio_name: e.target.value}))} placeholder="e.g. Iron Door" style={s.input} />
        </div>
      </div>

      <div style={{ ...s.row, marginTop: 12 }}>
        <div style={s.field}>
          <div style={s.label}>Ink Brand *</div>
          <select value={form.ink_brand} onChange={e => handleBrandChange(e.target.value)} style={s.select}>
            <option value="">Select brand...</option>
            {brands.map(b => <option key={b.id} value={b.brand_name}>{b.brand_name} {b.region ? `(${b.region})` : ''}</option>)}
          </select>
        </div>
        <div style={s.field}>
          <div style={s.label}>Ink Name</div>
          <input value={form.ink_name} onChange={e => setForm(f => ({...f, ink_name: e.target.value}))} placeholder="e.g. Tribal Black" style={s.input} />
        </div>
        <div style={s.field}>
          <div style={s.label}>Ink Color</div>
          {getColors(form.ink_brand).length > 0 ? (
            <select value={form.ink_color} onChange={e => setForm(f => ({...f, ink_color: e.target.value}))} style={s.select}>
              <option value="">Select color...</option>
              {getColors(form.ink_brand).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          ) : (
            <input value={form.ink_color} onChange={e => setForm(f => ({...f, ink_color: e.target.value}))} placeholder="e.g. Black" style={s.input} />
          )}
        </div>
      </div>

      <div style={s.row}>
        <div style={s.field}>
          <div style={s.label}>Batch / Lot #</div>
          <input value={form.batch_number} onChange={e => setForm(f => ({...f, batch_number: e.target.value}))} placeholder="e.g. B2024-05-123" style={s.input} />
        </div>
        <div style={s.field}>
          <div style={s.label}>Expiration Date</div>
          <input type="date" value={form.expiration_date} onChange={e => setForm(f => ({...f, expiration_date: e.target.value}))} style={s.input} />
        </div>
        <div style={s.field}>
          <div style={s.label}>Supplier</div>
          <input value={form.supplier} onChange={e => setForm(f => ({...f, supplier: e.target.value}))} style={s.input} />
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={s.label}>Notes</div>
        <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={2}
          style={{...s.input, resize: 'vertical'}} placeholder="Any additional notes..." />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => { setSection('list'); setEditId(null); }} style={s.btn('#64748b')}>Cancel</button>
        <button onClick={handleSave} disabled={saving}
          style={{...s.btn(THEME.brand.primary), opacity: saving ? 0.6 : 1}}>
          {saving ? 'Saving...' : editId ? 'Update' : 'Create Passport'}
        </button>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.header}>Ink Passport</div>
      <div style={s.sub}>Digital ink records for EU REACH compliance — track brands, batches, and expiration dates</div>

      <div style={s.tabs}>
        {SECTIONS.map(sect => (
          <button key={sect} onClick={() => setSection(sect)}
            style={s.tab(section === sect)}>
            {sect === 'list' ? '📋 Records' : '✏️ New Passport'}
          </button>
        ))}
      </div>

      {section === 'list' ? renderList() : renderForm()}
    </div>
  );
}
