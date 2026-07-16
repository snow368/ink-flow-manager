import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type UserRecord } from '../db';
import { seedDemoData, resetDatabase } from '../lib/devTools';
import { seedMultiLocationTest } from '../lib/seedDev';
import { detectInitialLanguage, t, type AppLanguage } from '../lib/i18n';

const CARD_STYLE = {
  background: '#1e293b',
  borderRadius: 12,
  border: '1px solid #27272a',
};

export default function Me() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [lang] = useState<AppLanguage>(detectInitialLanguage());
  const [showDevTools, setShowDevTools] = useState(false);
  const [devMessage, setDevMessage] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('inkflow_current_user');
    if (stored) db.users.get(stored).then(u => setUser(u || null));
  }, []);

  const handleLogout = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) e.preventDefault();
    localStorage.removeItem('inkflow_current_user');
    localStorage.removeItem('inkflow_current_user_data');
    /* Use window.location for iOS reliability — navigate() can fail on WebKit */
    window.location.href = '/register';
  };

  if (!user) return <div style={{ padding: 24, color: 'white' }}>Please log in</div>;

  return (
    <div style={{ padding: '24px 24px 96px', color: '#f1f5f9' }}>
      {/* ── Profile Card ── */}
      <div style={{ ...CARD_STYLE, padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #e11d48)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 700, color: 'white', flexShrink: 0,
          }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 16, fontWeight: 700 }}>{user.name}</p>
            <p style={{ fontSize: 12, color: '#94a3b8' }}>{user.email}</p>
            <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
              {user.roles?.map(r => (
                <span key={r} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#6366f120', color: '#a5b4fc' }}>
                  {r === 'artist' ? 'Artist' : r === 'owner' ? 'Owner' : 'Staff'}
                </span>
              ))}
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: '#27272a', color: '#71717a' }}>
                {user.plan === 'solo' ? 'Solo' : user.plan === 'pro' ? 'Pro' : user.plan === 'pro_plus' ? 'Pro+' : 'Free'}
              </span>
            </div>
          </div>
        </div>
        {user.studioName && (
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>📍 {user.studioName}</p>
        )}
        <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
          {(!user.plan || user.plan === 'free') && (
            <button onClick={() => navigate('/pricing')}
              style={{ flex: 1, padding: '10px 18px', borderRadius: 10, border: '1px solid #4338ca', background: '#312e8120', color: '#a5b4fc', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              View Plans →
            </button>
          )}
          <span onClick={handleLogout} onTouchEnd={(e) => handleLogout(e)}
            style={{ fontSize: 12, color: '#ef444488', cursor: 'pointer', whiteSpace: 'nowrap', padding: '6px 12px', borderRadius: 8, touchAction: 'manipulation' }}>
            Sign Out
          </span>
        </div>
      </div>

      {/* ── Studio info missing banner ── */}
      {(!user.studioName || !user.bioProfile?.address) && (
        <div style={{
          background: '#1e3a5f', border: '1px solid #3b82f680', borderRadius: 12,
          padding: '12px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>📍</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#93c5fd' }}>
              {!user.studioName ? 'Add your studio name' : 'Add your studio address'}
            </p>
            <p style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
              Required to appear on your public bio page and invoice
            </p>
          </div>
          <button onClick={() => navigate('/artist-profile')}
            style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#3b82f6', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Fill in
          </button>
        </div>
      )}

      {/* ── Navigation Cards ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        <NavCard
          emoji="🏪"
          title="Studio"
          desc="Portfolio, booking link, stations, supplies, ops, team"
          onClick={() => navigate('/studio-settings')}
          color="#6366f1"
        />
        <NavCard
          emoji="💰"
          title="Business & Payments"
          desc="Payment settings, invoices, deposits, commission, waivers"
          onClick={() => navigate('/business-settings')}
          color="#22c55e"
        />
        <NavCard
          emoji="⚙️"
          title="Account & Settings"
          desc="Language, notifications, review links, data & sync"
          onClick={() => navigate('/account-settings')}
          color="#3b82f6"
        />
        <NavCard
          emoji="🪪"
          title="Ink Passport"
          desc="Digital ink records for EU REACH compliance"
          onClick={() => navigate('/ink-passport')}
          color="#a855f7"
        />
        <NavCard
          emoji="🎨"
          title="Social Content Studio"
          desc="Grid layouts, captions, copy all — share to IG/FB/Pin"
          onClick={() => navigate('/social-gallery')}
          color="#ec4899"
        />
        <NavCard
          emoji="🌐"
          title="My Website"
          desc="Set up your public booking page — ink-flows.com/you"
          onClick={() => navigate('/website-wizard')}
          color="#22c55e"
        />
        {!user.verified && (
          <NavCard
            emoji="✅"
            title="Verification"
            desc="Verify your tattoo artist profile to unlock referral rewards"
            onClick={() => navigate('/verification')}
            color="#f59e0b"
          />
        )}
      </div>

      {/* ── Short Link Panel ── */}
      {(user as any)?.bioProfile?.slug && <ShortLinkPanel slug={(user as any).bioProfile.slug} />}

      {/* ── Dev Tools ── */}
      <div style={{ marginBottom: 16 }}>
        <button onClick={() => setShowDevTools(!showDevTools)}
          style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px dashed #475569', background: 'transparent', color: '#64748b', fontSize: 14, cursor: 'pointer' }}>
          {showDevTools ? 'Hide Dev Tools' : 'Dev Tools'}
        </button>
        {showDevTools && (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={async () => { await seedDemoData(); setDevMessage('Demo data filled'); }}
              style={{ padding: 14, borderRadius: 10, border: 'none', background: '#2563eb', color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Fill Demo Data</button>
            <button onClick={async () => { await seedMultiLocationTest(); setDevMessage('Multi-location seeded'); }}
              style={{ padding: 14, borderRadius: 10, border: 'none', background: '#4338ca', color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Seed Multi-Location Test</button>
            <button onClick={async () => { await resetDatabase(); setDevMessage('Database reset'); }}
              style={{ padding: 14, borderRadius: 10, border: 'none', background: '#7f1d1d', color: '#fca5a5', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Reset All Data</button>
          </div>
        )}
      </div>

    </div>
  );
}

function ShortLinkPanel({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const shortLink = `https://app.ink-flows.com/s/${slug}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shortLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const text = `Book a tattoo with me: ${shortLink}`;
    if (navigator.share) {
      navigator.share({ title: 'My Tattoo Shop', text, url: shortLink });
    } else {
      handleCopy();
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #064e3b 0%, #1e293b 100%)',
      border: '1px solid #22c55e40',
      borderRadius: 14, padding: 18, marginBottom: 16,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#22c55e', marginBottom: 2 }}>🔗 Your Short Link</p>
          <p style={{ fontSize: 11, color: '#94a3b8' }}>Share this link with your clients</p>
        </div>
      </div>
      <div style={{
        background: '#0f172a', borderRadius: 10, padding: '12px 14px',
        border: '1px solid #22c55e20', marginBottom: 10,
        fontSize: 15, fontWeight: 600, color: '#86efac', wordBreak: 'break-all',
      }}>
        {shortLink}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleCopy}
          style={{
            flex: 1, padding: 12, borderRadius: 10, border: 'none',
            background: copied ? '#166534' : '#22c55e',
            color: copied ? '#86efac' : '#052e16',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
          {copied ? '✅ Copied!' : '📋 Copy'}
        </button>
        <button onClick={handleShare}
          style={{
            flex: 1, padding: 12, borderRadius: 10, border: '1px solid #22c55e40',
            background: 'transparent', color: '#4ade80',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
          📱 Share
        </button>
        <button onClick={() => window.open(shortLink, '_blank')}
          style={{
            flex: 1, padding: 12, borderRadius: 10, border: '1px solid #334155',
            background: '#1e293b', color: '#94a3b8',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
          👁️ Preview
        </button>
      </div>
    </div>
  );
}

function NavCard({ emoji, title, desc, onClick, color }: { emoji: string; title: string; desc: string; onClick: () => void; color: string }) {
  return (
    <button onClick={onClick}
      style={{
        padding: 18, borderRadius: 14, cursor: 'pointer', textAlign: 'left',
        border: `1px solid ${color}40`, background: `${color}08`,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
      }}>
        {emoji}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>{title}</p>
        <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{desc}</p>
      </div>
      <span style={{ color: '#475569', fontSize: 18 }}>›</span>
    </button>
  );
}
