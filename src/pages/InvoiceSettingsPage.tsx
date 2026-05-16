import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type UserRecord } from '../db';
import { getCountryConfig } from '../lib/invoiceConfig';
import { loadInvoiceSettings, saveInvoiceSettings, isInvoiceSetupComplete, type InvoiceStudioSettings } from '../lib/invoiceSettings';
import { detectInitialLanguage, t } from '../lib/i18n';
import { THEME } from '../lib/theme';

export default function InvoiceSettingsPage() {
  const navigate = useNavigate();
  const lang = detectInitialLanguage();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [settings, setSettings] = useState<InvoiceStudioSettings>(loadInvoiceSettings());
  const [message, setMessage] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('inkflow_current_user');
    if (!stored) { navigate('/register'); return; }
    db.users.get(stored).then(u => {
      if (!u) { navigate('/register'); return; }
      setUser(u);
      const s = loadInvoiceSettings();
      if (!s.studioName && u.studioName) {
        s.studioName = u.studioName;
      }
      setSettings(s);
    });
  }, []);

  const update = (k: keyof InvoiceStudioSettings, v: any) => {
    setSettings(prev => ({ ...prev, [k]: v }));
  };

  const handleSave = () => {
    saveInvoiceSettings(settings);
    setMessage('Settings saved!');
    setTimeout(() => setMessage(''), 2000);
  };

  const cfg = getCountryConfig(user?.country || 'US');
  const setupComplete = isInvoiceSetupComplete(settings);

  const inputS: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #334155',
    background: '#0f172a', color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 10,
  };
  const labelS: React.CSSProperties = { fontSize: 12, color: '#94a3b8', marginBottom: 4 };

  return (
    <div style={{ padding: 24, color: THEME.text.primary, paddingBottom: 120, maxWidth: 600, margin: '0 auto' }}>
      <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>Invoice Studio Settings</h2>
      <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
        Set up your studio info once. It will auto-fill on every invoice.
      </p>

      {message && (
        <div style={{ background: '#14532d', padding: 8, borderRadius: 8, marginBottom: 12 }}>
          <p style={{ fontSize: 13, color: '#86efac' }}>{message}</p>
        </div>
      )}

      {/* Live preview */}
      <div style={{ background: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 20, border: '1px solid #334155' }}>
        <p style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Preview</p>
        <div style={{ background: 'white', borderRadius: 8, padding: 20, color: '#0f172a' }}>
          {setupComplete ? (
            <>
              <p style={{ fontSize: 20, fontWeight: 800, marginBottom: 2, color: '#1e293b' }}>{settings.studioName || 'Studio Name'}</p>
              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 1 }}>{settings.studioAddress || 'Address'}</p>
              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 1 }}>{settings.studioPhone || 'Phone'}</p>
              {settings.licenseNumber && <p style={{ fontSize: 11, color: '#94a3b8' }}>License: {settings.licenseNumber}</p>}
              <div style={{ borderTop: '2px solid #e2e8f0', margin: '12px 0' }} />
              <p style={{ fontSize: 24, fontWeight: 800, color: '#e11d48', letterSpacing: '0.05em' }}>{cfg.invoiceTitle}</p>
            </>
          ) : (
            <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>
              Fill in your studio name and address to preview
            </p>
          )}
        </div>
      </div>

      {/* Form */}
      <div style={{ background: '#1e293b', borderRadius: 12, padding: 16, border: '1px solid #334155' }}>
        <p style={labelS}>Studio Name *</p>
        <input value={settings.studioName} onChange={e => update('studioName', e.target.value)} placeholder="e.g. Ink Flow Tattoo Studio" style={inputS} />

        <p style={labelS}>Address *</p>
        <input value={settings.studioAddress} onChange={e => update('studioAddress', e.target.value)} placeholder="e.g. 123 Main St, Tokyo, Japan" style={inputS} />

        <p style={labelS}>Phone</p>
        <input value={settings.studioPhone} onChange={e => update('studioPhone', e.target.value)} placeholder="e.g. +81-3-1234-5678" style={inputS} />

        <p style={labelS}>Business License / Tax ID</p>
        <input value={settings.licenseNumber} onChange={e => update('licenseNumber', e.target.value)} placeholder="License or tax registration number" style={inputS} />

        <p style={labelS}>Default Tax Rate (%) — leave -1 to use country default ({cfg.defaultTaxRate}%)</p>
        <input type="number" value={settings.defaultTaxRate} onChange={e => update('defaultTaxRate', parseFloat(e.target.value) || -1)}
          style={{ ...inputS, width: 120 }} />

        <p style={labelS}>Default Due Date (days from invoice date)</p>
        <input type="number" value={settings.defaultDueDays} onChange={e => update('defaultDueDays', parseInt(e.target.value) || 0)}
          style={{ ...inputS, width: 100 }} />

        <p style={labelS}>Default Payment Method</p>
        <select value={settings.defaultPaymentMethod} onChange={e => update('defaultPaymentMethod', e.target.value)} style={inputS}>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="stripe_connect">Stripe</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="paypal">PayPal</option>
          <option value="other">Other</option>
        </select>

        <p style={labelS}>Custom Terms & Conditions</p>
        <textarea value={settings.customTerms} onChange={e => update('customTerms', e.target.value)}
          placeholder="Leave blank to use default tattoo studio terms..."
          rows={4} style={{ ...inputS, resize: 'vertical', fontFamily: 'inherit' }} />

        <p style={labelS}>Default Notes (appears on every invoice)</p>
        <input value={settings.defaultNotes} onChange={e => update('defaultNotes', e.target.value)}
          placeholder="e.g. Aftercare instructions, next appointment reminder..." style={inputS} />

        {/* Service Presets */}
        <p style={{ ...labelS, marginTop: 16 }}>Service Presets (quick-add buttons on invoice)</p>
        {settings.servicePresets.map((p, i) => (
          <div key={'svc-' + i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <input value={p.name} onChange={e => {
              const next = [...settings.servicePresets];
              next[i] = { ...next[i], name: e.target.value };
              update('servicePresets', next as any);
            }} placeholder="Service name" style={{ ...inputS, flex: 2, marginBottom: 0 }} />
            <input type="number" value={p.price} onChange={e => {
              const next = [...settings.servicePresets];
              next[i] = { ...next[i], price: parseFloat(e.target.value) || 0 };
              update('servicePresets', next as any);
            }} placeholder="Price" style={{ ...inputS, width: 100, marginBottom: 0 }} />
            <button onClick={() => update('servicePresets', settings.servicePresets.filter((_, j) => j !== i))}
              style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 16, padding: '0 8px' }}>x</button>
          </div>
        ))}
        <button onClick={() => update('servicePresets', [...settings.servicePresets, { name: '', price: 0 }])}
          style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #4338ca', background: 'transparent', color: '#a5b4fc', fontSize: 12, cursor: 'pointer', marginBottom: 12 }}>
          + Add Service Preset
        </button>

        {/* Product Presets */}
        <p style={labelS}>Product Presets (quick-add buttons on invoice)</p>
        {settings.productPresets.map((p, i) => (
          <div key={'prd-' + i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <input value={p.name} onChange={e => {
              const next = [...settings.productPresets];
              next[i] = { ...next[i], name: e.target.value };
              update('productPresets', next as any);
            }} placeholder="Product name" style={{ ...inputS, flex: 2, marginBottom: 0 }} />
            <input type="number" value={p.price} onChange={e => {
              const next = [...settings.productPresets];
              next[i] = { ...next[i], price: parseFloat(e.target.value) || 0 };
              update('productPresets', next as any);
            }} placeholder="Price" style={{ ...inputS, width: 100, marginBottom: 0 }} />
            <button onClick={() => update('productPresets', settings.productPresets.filter((_, j) => j !== i))}
              style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 16, padding: '0 8px' }}>x</button>
          </div>
        ))}
        <button onClick={() => update('productPresets', [...settings.productPresets, { name: '', price: 0 }])}
          style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #166534', background: 'transparent', color: '#86efac', fontSize: 12, cursor: 'pointer' }}>
          + Add Product Preset
        </button>
      </div>

      <button onClick={handleSave}
        style={{ width: '100%', marginTop: 16, padding: 14, borderRadius: 12, border: 'none', background: '#e11d48', color: 'white', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
        Save Settings
      </button>

      <button onClick={() => navigate('/invoices')}
        style={{ width: '100%', marginTop: 8, padding: 14, borderRadius: 12, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 14, cursor: 'pointer' }}>
        Back to Invoices
      </button>
    </div>
  );
}
