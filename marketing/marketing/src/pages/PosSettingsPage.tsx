import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { THEME } from '../lib/theme';
import { detectInitialLanguage, t } from '../lib/i18n';
import { loadPosSettings, savePosSettings, type PosSettings } from '../lib/posLogic';

export default function PosSettingsPage() {
  const navigate = useNavigate();
  const lang = detectInitialLanguage();
  const [taxRate, setTaxRate] = useState('0');
  const [receiptHeader, setReceiptHeader] = useState('');
  const [services, setServices] = useState<{ name: string; price: number }[]>([]);
  const [newSvcName, setNewSvcName] = useState('');
  const [newSvcPrice, setNewSvcPrice] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const s = loadPosSettings();
    setTaxRate(String(s.taxRate || 0));
    setReceiptHeader(s.receiptHeader || '');
    setServices(s.defaultServices || []);
  }, []);

  const handleSave = () => {
    const settings: PosSettings = {
      taxRate: parseFloat(taxRate) || 0,
      receiptHeader: receiptHeader.trim(),
      defaultServices: services,
    };
    savePosSettings(settings);
    setMessage(t(lang, 'pos_save_pos_settings') + ' ✓');
    setTimeout(() => setMessage(''), 2000);
  };

  const addService = () => {
    const name = newSvcName.trim();
    const price = Math.round(parseFloat(newSvcPrice) * 100);
    if (!name || price <= 0) return;
    setServices(prev => [...prev, { name, price }]);
    setNewSvcName('');
    setNewSvcPrice('');
  };

  const removeService = (index: number) => {
    setServices(prev => prev.filter((_, i) => i !== index));
  };

  const formatCents = (c: number) => (c / 100).toFixed(2);

  return (
    <div style={{ padding: 24, color: THEME.text.primary }}>
      <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>{t(lang, 'pos_settings')}</h2>

      {message && (
        <div style={{ background: '#14532d', padding: 8, borderRadius: 8, marginBottom: 12 }}>
          <p style={{ fontSize: 13, color: '#86efac' }}>{message}</p>
        </div>
      )}

      <div style={{ background: '#1e293b', padding: 14, borderRadius: 12, marginBottom: 12 }}>
        <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 4 }}>{t(lang, 'pos_tax_rate')}</label>
        <input type="number" value={taxRate} onChange={e => setTaxRate(e.target.value)}
          style={inputStyle} step="0.1" min="0" max="100" />
      </div>

      <div style={{ background: '#1e293b', padding: 14, borderRadius: 12, marginBottom: 12 }}>
        <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 4 }}>{t(lang, 'pos_receipt_header')}</label>
        <input value={receiptHeader} onChange={e => setReceiptHeader(e.target.value)}
          placeholder="Your studio name" style={inputStyle} />
      </div>

      <div style={{ background: '#1e293b', padding: 14, borderRadius: 12, marginBottom: 12 }}>
        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{t(lang, 'pos_default_services')}</p>
        {services.map((svc, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #334155' }}>
            <span style={{ fontSize: 14 }}>{svc.name} - ${formatCents(svc.price)}</span>
            <button onClick={() => removeService(i)} style={{ background: 'none', border: 'none', color: '#f87171', fontSize: 16, cursor: 'pointer' }}>✕</button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input placeholder="Service name" value={newSvcName} onChange={e => setNewSvcName(e.target.value)}
            style={{ ...inputStyle, flex: 1, marginBottom: 0 }} />
          <input type="number" placeholder="Price" value={newSvcPrice} onChange={e => setNewSvcPrice(e.target.value)}
            style={{ ...inputStyle, width: 80, marginBottom: 0 }} step="0.01" min="0" />
          <button onClick={addService} disabled={!newSvcName.trim() || !newSvcPrice}
            style={{ padding: '10px 14px', borderRadius: 8, border: 'none', background: (!newSvcName.trim() || !newSvcPrice) ? '#4b5563' : '#22c55e', color: 'white', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
            {t(lang, 'pos_add_service')}
          </button>
        </div>
      </div>

      <button onClick={handleSave}
        style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: '#e11d48', color: 'white', fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
        {t(lang, 'pos_save_pos_settings')}
      </button>

      <button onClick={() => navigate('/pos')}
        style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 14 }}>
        ← {t(lang, 'pos_register')}
      </button>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', marginBottom: 4,
  borderRadius: 10, border: '1px solid #334155', background: '#0f172a',
  color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box',
};
