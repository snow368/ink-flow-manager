import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type ClientRecord } from '../db';
import { detectInitialLanguage, t, type AppLanguage } from '../lib/i18n';
import { checkAndSuggestMerge } from '../lib/clientMerge';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  marginBottom: 12,
  borderRadius: 12,
  border: '1px solid #334155',
  background: '#1e293b',
  color: 'white',
  fontSize: 16,
  outline: 'none',
  boxSizing: 'border-box',
};

export default function NewClientForm() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [customAllergy, setCustomAllergy] = useState('');
  const [saving, setSaving] = useState(false);
  const [duplicates, setDuplicates] = useState<ClientRecord[]>([]);
  const lang: AppLanguage = detectInitialLanguage();

  const commonAllergies = [
    'Latex gloves', 'Red ink', 'Blue ink', 'Green ink',
    'Yellow ink', 'Alcohol', 'Vaseline', 'Anesthetic', 'Adhesive tape',
  ];

  const toggleAllergy = (item: string) => {
    setAllergies(prev => prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item]);
  };

  const addCustomAllergy = () => {
    const trimmed = customAllergy.trim();
    if (trimmed && !allergies.includes(trimmed)) {
      setAllergies([...allergies, trimmed]);
      setCustomAllergy('');
    }
  };

  useEffect(() => {
    if (!phone.trim() && !email.trim()) { setDuplicates([]); return; }
    const timer = setTimeout(() => {
      checkAndSuggestMerge(name.trim() || '', phone.trim() || undefined, email.trim() || undefined)
        .then(setDuplicates);
    }, 400);
    return () => clearTimeout(timer);
  }, [phone, email, name]);

  const handleSave = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      const now = Date.now();
      const id = 'client_' + now + '_' + Math.random().toString(36).slice(2, 6);
      await db.clients.add({
        id,
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        allergies: allergies.length > 0 ? allergies : undefined,
        createdAt: now,
      });
      navigate('/clients');
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 24, color: 'white' }}>
      <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>{t(lang, 'new_client_title')}</h2>
      <input placeholder={t(lang, 'new_client_name')} value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
      <input placeholder={t(lang, 'new_client_phone')} value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} />
      <input placeholder={t(lang, 'new_client_email')} value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />

      {duplicates.length > 0 && (
        <div style={{ background: '#422006', border: '1px solid #f59e0b44', borderRadius: 10, padding: 12, marginBottom: 12 }}>
          <p style={{ fontSize: 13, color: '#fbbf24', fontWeight: 600, marginBottom: 6 }}>
            Possible duplicate{duplicates.length > 1 ? 's' : ''} found
          </p>
          {duplicates.map(d => (
            <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
              <span style={{ fontSize: 12, color: '#fcd34d' }}>
                {d.name} — {d.phone || d.email || '—'}
              </span>
              <span style={{ fontSize: 10, color: '#64748b' }}>
                Created {new Date(d.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
          <p style={{ fontSize: 11, color: '#d97706', marginTop: 6 }}>
            You can still save — duplicates can be merged later from the client detail page.
          </p>
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 8 }}>{t(lang, 'new_client_allergies')}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {commonAllergies.map(item => (
            <button
              key={item}
              onClick={() => toggleAllergy(item)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: allergies.includes(item) ? '2px solid #e11d48' : '2px solid #334155',
                background: allergies.includes(item) ? '#e11d4833' : 'transparent',
                color: allergies.includes(item) ? '#fca5a5' : '#94a3b8',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {allergies.includes(item) ? '[x] ' : ''}{item}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input placeholder={t(lang, 'new_client_custom_allergy')} value={customAllergy} onChange={e => setCustomAllergy(e.target.value)} style={{ ...inputStyle, flex: 1, marginBottom: 0 }} />
        <button onClick={addCustomAllergy} disabled={!customAllergy.trim()} style={{ padding: '12px 16px', borderRadius: 10, border: 'none', background: customAllergy.trim() ? '#334155' : '#1e293b', color: 'white', fontSize: 14 }}>
          {t(lang, 'new_client_add')}
        </button>
      </div>

      {allergies.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {allergies.map((a, i) => (
            <span key={i} onClick={() => toggleAllergy(a)} style={{ padding: '4px 10px', borderRadius: 8, background: '#7f1d1d', color: '#fca5a5', fontSize: 12, cursor: 'pointer' }}>
              {a} [x]
            </span>
          ))}
        </div>
      )}

      <button onClick={handleSave} disabled={saving || !name.trim()} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: saving || !name.trim() ? '#4b5563' : '#e11d48', color: 'white', fontSize: 16, fontWeight: 600 }}>
        {saving ? t(lang, 'new_client_saving') : t(lang, 'new_client_save')}
      </button>
    </div>
  );
}
