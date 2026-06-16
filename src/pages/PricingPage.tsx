import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type UserRecord } from '../db';
import { THEME, btn } from '../lib/theme';
import { ArrowLeft, Star } from 'lucide-react';

const PLANS = [
  { id: 'free' as const, name: 'Free', price: '$0/mo', desc: '1 person · basic features', color: '#64748b', popular: false, locked: false },
  { id: 'solo' as const, name: 'Solo', price: '$9.90/mo', desc: '1 person · curated features', color: '#6366f1', popular: false, locked: true },
  { id: 'pro' as const, name: 'Pro', price: '$29.90/mo', desc: 'Up to 5 people · all features', color: '#8b5cf6', popular: true, locked: true },
  { id: 'pro_plus' as const, name: 'Pro+', price: '$29.90 + $10/studio', desc: 'Unlimited · all features', color: '#a855f7', popular: false, locked: false },
];

type FeatureRow = {
  section?: string;
  label: string;
  values: [string, string, string, string];
};

const FEATURES: FeatureRow[] = [
  { section: 'TEAM & STUDIO', label: '', values: ['', '', '', ''] },
  { label: 'Team size', values: ['1 person', '1 person', 'Up to 5 people', 'Unlimited'] },
  { label: 'Studios', values: ['1', '1', '1', 'Add more ($10/studio)'] },

  { section: 'STORAGE & SMS', label: '', values: ['', '', '', ''] },
  { label: 'Cloud storage', values: ['Google Drive', '10GB R2', '50GB R2', '200GB R2'] },
  { label: 'SMS credits', values: ['5 lifetime', 'Buy packs', 'Buy packs (higher)', 'Buy packs (highest)'] },

  { section: 'CLIENT & STUDIO', label: '', values: ['', '', '', ''] },
  { label: 'Client management', values: ['✅', '✅', '✅', '✅'] },
  { label: 'Leads & CRM', values: ['✅', '✅', '✅', '✅'] },
  { label: 'Appointment calendar', values: ['✅', '✅', '✅', '✅'] },
  { label: 'Conflict detection', values: ['❌', '✅', '✅', '✅'] },
  { label: 'Session timer + photos', values: ['✅', '✅', '✅', '✅'] },
  { label: 'POS + split payment', values: ['✅', '✅', '✅', '✅'] },
  { label: 'Invoice (multi-tax/split)', values: ['✅', '✅', '✅', '✅'] },
  { label: 'Digital Waiver', values: ['✅', '✅', '✅', '✅'] },
  { label: 'Portfolio', values: ['✅', '✅', '✅', '✅'] },
  { label: 'Inventory + low stock alerts', values: ['❌', '✅', '✅', '✅'] },
  { label: 'QR check-in', values: ['❌', '✅', '✅', '✅'] },
  { label: 'Series appointments', values: ['❌', '✅', '✅', '✅'] },
  { label: 'Station management', values: ['❌', '✅', '✅', '✅'] },

  { section: 'COMMUNICATION', label: '', values: ['', '', '', ''] },
  { label: 'Communication timeline', values: ['✅', '✅', '✅', '✅'] },
  { label: 'SMS reminders (Twilio)', values: ['5 lifetime', 'Buy packs', 'Buy packs', 'Buy packs'] },
  { label: 'WhatsApp (Twilio API)', values: ['❌', '✅', '✅', '✅'] },
  { label: 'Email reminders (Brevo)', values: ['❌', '✅', '✅', '✅'] },
  { label: 'Web Push notifications', values: ['✅', '✅', '✅', '✅'] },
  { label: 'Review invites (manual)', values: ['✅', '✅', '✅', '✅'] },
  { label: 'Auto review follow-up', values: ['❌', '❌', '✅', '✅'] },

  { section: 'BUSINESS GROWTH', label: '', values: ['', '', '', ''] },
  { label: 'Public bio page', values: ['✅', '✅', '✅', '✅'] },
  { label: 'Intake link + tracking', values: ['✅', '✅', '✅', '✅'] },
  { label: 'B2B Referral (Share One, Get One)', values: ['❌', '✅', '✅', '✅'] },
  { label: 'Client Referral program', values: ['❌', '✅', '✅', '✅'] },
  { label: 'Content Strategy AI', values: ['❌', '✅', '✅', '✅'] },
  { label: 'Caption AI generation', values: ['❌', '✅', '✅', '✅'] },
  { label: 'Google Review sync', values: ['❌', '❌', '✅', '✅'] },

  { section: 'MULTI-STUDIO (Pro+ only)', label: '', values: ['', '', '', ''] },
  { label: 'Multi-studio calendar', values: ['❌', '❌', '❌', '✅'] },
  { label: 'Owner dashboard', values: ['❌', '❌', '❌', '✅'] },
  { label: 'Staff management + permissions', values: ['❌', '❌', '❌', '✅'] },
  { label: 'Audit log', values: ['❌', '❌', '❌', '✅'] },
  { label: 'Multi-studio unified reports', values: ['❌', '❌', '❌', '✅'] },

  { section: 'OPERATIONS', label: '', values: ['', '', '', ''] },
  { label: 'Data export / backup', values: ['❌', '✅', '✅', '✅'] },
  { label: 'Google Calendar sync', values: ['✅', '✅', '✅', '✅'] },
  { label: 'Cloud sync (Worker)', values: ['❌', '✅', '✅', '✅'] },
  { label: 'Daily close-out report', values: ['❌', '❌', '✅', '✅'] },
  { label: 'Shift scheduling', values: ['❌', '❌', '✅', '✅'] },
  { label: 'Commission tracking', values: ['❌', '❌', '✅', '✅'] },
  { label: 'Health checklists', values: ['❌', '❌', '✅', '✅'] },
  { label: 'Advanced analytics / ROI', values: ['❌', '❌', '✅', '✅'] },
  { label: 'Priority support', values: ['❌', '❌', '✅', '✅'] },
];

const pageStyle: React.CSSProperties = {
  padding: '24px 20px',
  color: THEME.text.primary,
  maxWidth: 700,
  margin: '0 auto',
};

export default function PricingPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('inkflow_current_user');
    if (stored) db.users.get(stored).then(u => setUser(u ?? null));
  }, []);

  const currentPlanId: 'free' | 'solo' | 'pro' | 'pro_plus' | 'plus' = !user?.plan || user.plan === 'free' ? 'free' : user.plan;

  const handleSelectPlan = (planId: string | null) => {
    if (!planId || planId === currentPlanId) return;
    const plan = PLANS.find(p => p.id === planId);
    if (plan?.locked) { setMessage('Online payment coming soon!'); setTimeout(() => setMessage(''), 2500); return; }
    if (planId === 'pro_plus') {
      if (!user) { navigate('/register?upgrade=pro_plus'); return; }
      db.users.update(user.id, { plan: 'pro_plus' }).then(() => {
        navigate('/pro-plus-setup');
      });
      return;
    }
    // free plan — just switch (downgrade)
    if (!user) return;
    db.users.update(user.id, { plan: 'free' }).then(async () => {
      const updated = await db.users.get(user.id);
      setUser(updated || null);
      setMessage('Downgraded to Free');
      setTimeout(() => setMessage(''), 2500);
    });
  };

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: THEME.text.primary, cursor: 'pointer', padding: 4 }}>
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Pricing & Plans</h1>
      </div>

      {/* Current plan badge */}
      <div style={{ fontSize: 13, color: THEME.text.subtle, marginBottom: 20 }}>
        Current plan:{' '}
        <span style={{ color: THEME.brand.success, fontWeight: 700 }}>
          {currentPlanId === 'free' ? 'Free' : currentPlanId === 'solo' ? 'Solo' : currentPlanId === 'pro' ? 'Pro' : 'Pro+'}
        </span>
      </div>

      {/* Success message */}
      {message && (
        <div style={{
          background: THEME.brand.success + '20', border: `1px solid ${THEME.brand.success}`,
          borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 14, color: THEME.brand.success, fontWeight: 600,
        }}>
          {message}
        </div>
      )}

      {/* Plan cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
        {PLANS.map(p => {
          const isCurrent = p.id === currentPlanId;
          const borderStyle = isCurrent ? p.color : p.popular && !isCurrent ? '#8b5cf6' : THEME.border.default;
          const bgStyle = isCurrent ? p.color + '15' : p.popular && !isCurrent ? '#8b5cf610' : THEME.bg.panel;
          return (
            <div key={p.id}
              onClick={() => handleSelectPlan(p.id)}
              style={{
                padding: 14, borderRadius: 12, cursor: (isCurrent || p.locked) ? 'default' : 'pointer',
                border: '2px solid ' + borderStyle,
                background: bgStyle,
                position: 'relative',
                transition: 'all 0.15s',
                opacity: p.locked && !isCurrent ? 0.6 : 1,
              }}>
              {p.locked && (
                <span style={{ position: 'absolute', top: -8, left: 6, background: '#a855f7', color: 'white', fontSize: 8, fontWeight: 700, borderRadius: 4, padding: '2px 6px' }}>
                  Coming soon
                </span>
              )}
              {p.popular && !isCurrent && (
                <span style={{ position: 'absolute', top: -8, right: 6, background: '#8b5cf6', color: 'white', fontSize: 9, fontWeight: 700, borderRadius: 4, padding: '1px 6px', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Star size={9} /> BEST
                </span>
              )}
              {isCurrent && (
                <span style={{ position: 'absolute', top: -8, left: 6, background: '#22c55e', color: 'white', fontSize: 9, fontWeight: 700, borderRadius: 4, padding: '1px 6px' }}>
                  CURRENT
                </span>
              )}
              <p style={{ fontSize: 16, fontWeight: 700, color: p.color, margin: 0 }}>{p.name}</p>
              <p style={{ fontSize: 13, color: THEME.text.muted, margin: '4px 0 0' }}>{p.price}</p>
              <p style={{ fontSize: 11, color: THEME.text.subtle, margin: '6px 0 0' }}>{p.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Feature comparison */}
      <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: THEME.text.muted }}>Full Feature Comparison</h2>
      <div style={{ fontSize: 12, lineHeight: '1.7', borderRadius: 12, border: `1px solid ${THEME.border.default}`, overflow: 'hidden' }}>
        {/* Header row */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1.8fr 0.8fr 0.8fr 0.8fr 0.8fr',
          background: THEME.bg.panelAlt, borderBottom: `1px solid ${THEME.border.default}`,
          fontWeight: 700, color: THEME.text.muted,
        }}>
          <div style={{ padding: '8px 10px' }}>Feature</div>
          <div style={{ padding: '8px 6px', textAlign: 'center', color: '#64748b' }}>Free</div>
          <div style={{ padding: '8px 6px', textAlign: 'center', color: '#6366f1' }}>Solo</div>
          <div style={{ padding: '8px 6px', textAlign: 'center', color: '#8b5cf6' }}>Pro</div>
          <div style={{ padding: '8px 6px', textAlign: 'center', color: '#a855f7' }}>Pro+</div>
        </div>

        {FEATURES.map((row, i) => {
          if (row.section) {
            return (
              <div key={i} style={{
                gridColumn: '1 / -1', padding: '6px 10px',
                background: THEME.bg.panelAlt, borderBottom: `1px solid ${THEME.border.soft}`,
                fontSize: 10, fontWeight: 800, color: THEME.text.subtle, letterSpacing: '0.05em',
              }}>
                {row.section}
              </div>
            );
          }
          return (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1.8fr 0.8fr 0.8fr 0.8fr 0.8fr',
              borderBottom: `1px solid ${THEME.border.soft}`,
              background: i % 2 === 0 ? 'transparent' : THEME.bg.panelAlt + '50',
            }}>
              <div style={{ padding: '6px 10px', color: THEME.text.primary }}>{row.label}</div>
              {row.values.map((v, ci) => (
                <div key={ci} style={{
                  padding: '6px 4px', textAlign: 'center',
                  color: v === '✅' ? THEME.brand.success : v === '❌' ? THEME.text.subtle : THEME.text.muted,
                  fontSize: v === '✅' || v === '❌' ? 13 : 11,
                }}>
                  {v}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Bottom section */}
      <div style={{
        background: THEME.bg.panelAlt,
        borderRadius: THEME.radius.lg,
        padding: 20,
        marginTop: 24,
        textAlign: 'center',
        border: `1px solid ${THEME.border.soft}`,
      }}>
        <div style={{ fontSize: THEME.fontSize.md, color: THEME.text.muted, marginBottom: 12 }}>
          Don't take our word for it — see what tattoo studios are saying about InkFlow.
        </div>
        <button
          onClick={() => navigate('/case-studies')}
          style={{
            ...btn.secondary,
            width: 'auto',
            display: 'inline-block',
            padding: '8px 20px',
            color: THEME.text.primary,
            border: `1px solid ${THEME.border.default}`,
          }}
        >
          View Case Studies →
        </button>
      </div>

      {/* Bottom back button */}
      <button onClick={() => navigate(-1)}
        style={{
          width: '100%', padding: 14, borderRadius: 12, border: `1px solid ${THEME.border.default}`,
          background: 'transparent', color: THEME.text.muted, fontSize: 14, fontWeight: 600,
          cursor: 'pointer', marginTop: 20,
        }}>
        ← Back
      </button>
    </div>
  );
}
