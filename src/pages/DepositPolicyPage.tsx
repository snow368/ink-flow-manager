import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { detectInitialLanguage, t } from '../lib/i18n';

type AmountMode = 'fixed' | 'percent';

type PolicyItem = {
  enabled: boolean;
  amountMode: AmountMode;
  amountValue: string;
  refundable: boolean;
  canRescheduleOnce: boolean;
  note: string;
};

type DepositPolicy = {
  onlineChat: PolicyItem;
  consultBooking: PolicyItem;
  directBooking: PolicyItem;
};

const defaultItem = (): PolicyItem => ({
  enabled: true,
  amountMode: 'fixed',
  amountValue: '',
  refundable: false,
  canRescheduleOnce: true,
  note: '',
});

const defaultPolicy = (): DepositPolicy => ({
  onlineChat: { ...defaultItem(), enabled: false, note: 'Collect after consultation is clear and executable.' },
  consultBooking: { ...defaultItem(), amountMode: 'fixed', amountValue: '30', refundable: false, canRescheduleOnce: true, note: 'Consult fee can be credited to final tattoo bill.' },
  directBooking: { ...defaultItem(), amountMode: 'fixed', amountValue: '100', refundable: false, canRescheduleOnce: true, note: 'Deposit is required to lock appointment slot.' },
});

function keyByArtist(artistId: string) {
  return `inkflow_deposit_policy_${artistId}`;
}

export default function DepositPolicyPage() {
  const navigate = useNavigate();
  const [artistId, setArtistId] = useState('');
  const [policy, setPolicy] = useState<DepositPolicy>(defaultPolicy());
  const [message, setMessage] = useState('');
  const lang = detectInitialLanguage();

  useEffect(() => {
    const current = localStorage.getItem('inkflow_current_user') || '';
    if (!current) return;
    setArtistId(current);
    const raw = localStorage.getItem(keyByArtist(current));
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as DepositPolicy;
      if (parsed?.onlineChat && parsed?.consultBooking && parsed?.directBooking) {
        setPolicy(parsed);
      }
    } catch {
      // ignore invalid local data
    }
  }, []);

  const setItem = (field: keyof DepositPolicy, patch: Partial<PolicyItem>) => {
    setPolicy(prev => ({ ...prev, [field]: { ...prev[field], ...patch } }));
  };

  const save = () => {
    if (!artistId) return;
    localStorage.setItem(keyByArtist(artistId), JSON.stringify(policy));
    setMessage('Deposit policy saved.');
    window.setTimeout(() => setMessage(''), 1500);
  };

  return (
    <div style={{ padding: 20, color: 'white', maxWidth: 820, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800 }}>{t(lang, 'deposit_rules_title')}</h2>
        <button onClick={() => navigate('/me')} style={backBtn}>{t(lang, 'back')}</button>
      </div>

      <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>
        Configure default deposit/consultation rules by scenario. These are shop defaults and can still be adjusted per client later.
      </p>

      <RuleCard
        title="Online chat first"
        item={policy.onlineChat}
        onChange={patch => setItem('onlineChat', patch)}
      />
      <RuleCard
        title="Consultation booking"
        item={policy.consultBooking}
        onChange={patch => setItem('consultBooking', patch)}
      />
      <RuleCard
        title="Direct slot booking"
        item={policy.directBooking}
        onChange={patch => setItem('directBooking', patch)}
      />

      <button onClick={save} style={saveBtn}>{t(lang, 'save_rules')}</button>
      {message && <p style={{ fontSize: 12, color: '#86efac', marginTop: 8 }}>{message}</p>}
    </div>
  );
}

function RuleCard({ title, item, onChange }: { title: string; item: PolicyItem; onChange: (patch: Partial<PolicyItem>) => void }) {
  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 12, marginBottom: 10 }}>
      <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{title}</p>
      <label style={row}><input type="checkbox" checked={item.enabled} onChange={e => onChange({ enabled: e.target.checked })} /> Enable collection</label>
      <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 8, marginBottom: 8 }}>
        <select value={item.amountMode} onChange={e => onChange({ amountMode: e.target.value as AmountMode })} style={inputStyle}>
          <option value="fixed">Fixed ($)</option>
          <option value="percent">Percent (%)</option>
        </select>
        <input value={item.amountValue} onChange={e => onChange({ amountValue: e.target.value })} placeholder={item.amountMode === 'fixed' ? 'e.g. 100' : 'e.g. 20'} style={inputStyle} />
      </div>
      <label style={row}><input type="checkbox" checked={item.refundable} onChange={e => onChange({ refundable: e.target.checked })} /> Refundable on cancellation</label>
      <label style={row}><input type="checkbox" checked={item.canRescheduleOnce} onChange={e => onChange({ canRescheduleOnce: e.target.checked })} /> Allow one free reschedule</label>
      <textarea value={item.note} onChange={e => onChange({ note: e.target.value })} placeholder="Policy note shown to clients" rows={2} style={{ ...inputStyle, resize: 'vertical', marginTop: 8 }} />
    </div>
  );
}

const row: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 13,
  color: '#cbd5e1',
  marginBottom: 8,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 10px',
  borderRadius: 8,
  border: '1px solid #334155',
  background: '#0f172a',
  color: 'white',
  boxSizing: 'border-box',
};

const backBtn: React.CSSProperties = {
  border: '1px solid #334155',
  background: 'transparent',
  color: '#94a3b8',
  borderRadius: 8,
  padding: '7px 10px',
  cursor: 'pointer',
};

const saveBtn: React.CSSProperties = {
  border: 'none',
  background: '#e11d48',
  color: 'white',
  borderRadius: 10,
  padding: '10px 14px',
  cursor: 'pointer',
  fontWeight: 700,
};

