import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type UserRecord } from '../db';
import { detectInitialLanguage, t, type AppLanguage } from '../lib/i18n';
import { getReferralStats } from '../lib/referralLogic';
import { getClientReferralStats } from '../lib/clientReferral';
import { canAccess } from '../lib/planAccess';

const THEME = {
  text: { primary: '#f1f5f9', secondary: '#94a3b8', muted: '#64748b' },
  border: { default: '#334155' },
  bg: { card: '#1e293b', surface: '#0f172a' },
};

export default function BusinessSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [lang, setLang] = useState<AppLanguage>(detectInitialLanguage());
  const [editingCommission, setEditingCommission] = useState(false);
  const [commissionRate, setCommissionRate] = useState<number | undefined>();
  const [referralCount, setReferralCount] = useState(0);
  const [freeMonths, setFreeMonths] = useState(0);
  const [clientRefStats, setClientRefStats] = useState({ total: 0, used: 0, active: 0, totalDiscount: 0 });
  const [referralConfig, setReferralConfig] = useState({ friendDiscount: 50, referrerReward: 50 });
  const [editingRefConfig, setEditingRefConfig] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('inkflow_current_user');
    if (stored) {
      db.users.get(stored).then(async u => {
        setUser(u || null);
        setCommissionRate(u?.commissionRate);
        if (u) {
          const stats = await getReferralStats(u.id);
          setReferralCount(stats.verifiedCount);
          setFreeMonths(stats.freeMonthsRemaining);
          getClientReferralStats(u.id).then(s => setClientRefStats(s));
          if (u.referralConfig) setReferralConfig(u.referralConfig);
        }
      });
    }
  }, []);

  const handleSaveCommissionRate = async () => {
    if (!user) return;
    await db.users.update(user.id, { commissionRate });
    const updated = await db.users.get(user.id);
    setUser(updated || null);
    setEditingCommission(false);
  };

  const handleSaveReferralConfig = async () => {
    if (!user) return;
    await db.users.update(user.id, { referralConfig });
    const updated = await db.users.get(user.id);
    setUser(updated || null);
    setEditingRefConfig(false);
  };

  if (!user) return <div style={{ padding: 24, color: 'white' }}>Please log in</div>;

  return (
    <div style={{ padding: 24, color: THEME.text.primary }}>
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => navigate('/me')} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: 15, cursor: 'pointer', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 4 }}>
          ← Me
        </button>
        <h2 style={{ fontSize: 20, fontWeight: 'bold', marginTop: 8 }}>💰 Business & Payments</h2>
      </div>

      {/* Payment setup prompt */}
      {(!user.roles?.includes('owner') && !user.roles?.includes('dev') && !user.paymentLinkTemplate) && (
        <div style={{ background: THEME.bg.card, borderRadius: 12, padding: 14, marginBottom: 16, border: '1px solid #3b82f680' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#60a5fa', marginBottom: 6 }}>Set up your payment method</p>
          <p style={{ fontSize: 12, color: THEME.text.secondary, lineHeight: 1.6 }}>
            Go to <strong style={{ color: '#cbd5e1' }}>Payment Settings</strong> to add PayPal, Venmo, Wise, or bank transfer link.
          </p>
        </div>
      )}

      {/* Payment buttons */}
      <SectionHeader label="Payments" />
      <Grid2>
        {navBtn(navigate, '/payment-settings', t(lang, 'payment_settings'), 'Stripe / PayPal / Wise')}
        {navBtn(navigate, '/payment-history', 'Payment History')}
      </Grid2>
      <Grid2>
        {navBtn(navigate, '/deposit-policy', t(lang, 'deposit_rules'))}
      </Grid2>

      {/* Commission (Pro+) */}
      {canAccess(user, 'commission_tracking') && <><SectionHeader label="Commission" />
      <div style={{ background: THEME.bg.card, padding: 14, borderRadius: 12, marginBottom: 16 }}>
        {editingCommission ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="number" value={commissionRate ?? ''} onChange={e => setCommissionRate(e.target.value ? Number(e.target.value) : undefined)} placeholder="e.g. 50" min="0" max="100"
              style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${THEME.border.default}`, background: THEME.bg.surface, color: 'white', fontSize: 14, outline: 'none' }} />
            <span style={{ color: THEME.text.secondary }}>%</span>
            <button onClick={handleSaveCommissionRate} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: '#e11d48', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Save</button>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>Commission Rate</p>
              <p style={{ fontSize: 14, color: commissionRate ? '#22c55e' : THEME.text.secondary }}>
                {commissionRate != null ? `${commissionRate}% — artist gets ${commissionRate}%` : 'Not set'}
              </p>
            </div>
            <button onClick={() => setEditingCommission(true)} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: 14, cursor: 'pointer', padding: '10px 14px' }}>Edit</button>
          </div>
        )}
      </div></>}
      <SectionHeader label="Invoices" />
      <Grid2>
        {navBtn(navigate, '/invoices', 'Invoices', 'New', '#7e22ce')}
        {navBtn(navigate, '/invoice-settings', 'Invoice Settings')}
      </Grid2>

      {/* Waiver Manager */}
      <SectionHeader label="Waivers" />
      <Grid2>
        {navBtn(navigate, '/waiver-manager', 'Waiver Manager', 'Send signing links', '#1e3a5f')}
      </Grid2>

      {/* Referral (Solo+) */}
      {canAccess(user, 'b2b_referral') && <><SectionHeader label="Referral Program" />
      {user.verified && (
        <button onClick={() => navigate('/referral')}
          style={{
            width: '100%', padding: 14, borderRadius: 14, marginBottom: 12,
            border: 'none', background: 'linear-gradient(135deg, #312e81 0%, #7e22ce 100%)',
            color: 'white', fontSize: 16, fontWeight: 700, textAlign: 'left',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
          <div>
            <p style={{ fontSize: 15 }}>Share One, Get One</p>
            <p style={{ fontSize: 12, color: '#c4b5fd', marginTop: 2 }}>
              {referralCount} verified — {freeMonths} free month{freeMonths !== 1 ? 's' : ''} left
            </p>
          </div>
          <span style={{ fontSize: 18 }}>{'>'}</span>
        </button>
      )}

      {/* Client Referral Stats */}
      <div style={{ background: THEME.bg.card, padding: 14, borderRadius: 12, marginBottom: 16 }}>
        <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Client Referrals</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          {[
            { label: 'Given', value: clientRefStats.total, color: '#22c55e' },
            { label: 'Converted', value: clientRefStats.used, color: '#60a5fa' },
            { label: 'Discount', value: `$${clientRefStats.totalDiscount}`, color: '#fbbf24' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: THEME.bg.surface, borderRadius: 8, padding: 10, textAlign: 'center' }}>
              <p style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</p>
              <p style={{ fontSize: 10, color: THEME.text.muted }}>{s.label}</p>
            </div>
          ))}
        </div>
        <button onClick={() => setEditingRefConfig(!editingRefConfig)} style={{ fontSize: 11, color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          {editingRefConfig ? 'Close' : 'Edit referral rewards'}
        </button>
        {editingRefConfig && (
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <div>
              <label style={{ fontSize: 10, color: THEME.text.muted }}>Friend discount</label>
              <input type="number" value={referralConfig.friendDiscount} onChange={e => setReferralConfig(c => ({ ...c, friendDiscount: Number(e.target.value) }))}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: `1px solid ${THEME.border.default}`, background: THEME.bg.surface, color: 'white', fontSize: 12, outline: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: 10, color: THEME.text.muted }}>Referrer reward</label>
              <input type="number" value={referralConfig.referrerReward} onChange={e => setReferralConfig(c => ({ ...c, referrerReward: Number(e.target.value) }))}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: `1px solid ${THEME.border.default}`, background: THEME.bg.surface, color: 'white', fontSize: 12, outline: 'none' }} />
            </div>
            <button onClick={handleSaveReferralConfig} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#e11d48', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-end' }}>Save</button>
          </div>
        )}
      </div></>}

      {/* POS */}
      <SectionHeader label="Point of Sale" />
      <Grid2>
        {navBtn(navigate, '/pos', t(lang, 'pos_register'), 'New', '#14532d')}
        {navBtn(navigate, '/pos-settings', 'POS Settings')}
      </Grid2>

      <div style={{ height: 32 }} />
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, marginTop: 4 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: '#1e293b' }} />
    </div>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>{children}</div>;
}

function navBtn(navigate: ReturnType<typeof useNavigate>, to: string, label: string, sub?: string, accent?: string) {
  const bg = accent ? `linear-gradient(135deg, #1e293b 0%, ${accent} 100%)` : '#1e293b';
  return (
    <button key={to} onClick={() => navigate(to)}
      style={{ padding: 14, borderRadius: 12, border: '1px solid #334155', background: bg, color: 'white', fontSize: 13, fontWeight: 600, textAlign: 'left', cursor: 'pointer' }}>
      <div>{label}</div>
      {sub ? <div style={{ fontSize: 10, color: sub.includes('click') || sub.includes('pending') ? '#4ade80' : '#64748b', marginTop: 2 }}>{sub}</div> : null}
    </button>
  );
}
