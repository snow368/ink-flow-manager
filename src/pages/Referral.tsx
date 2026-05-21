import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type UserRecord, type ReferralRecord } from '../db';
import {
  getMyReferralCode,
  getReferralLink,
  getReferralStats,
  getMonthlyLeaderboard,
  isDoubleMonth,
  getRewardMonths,
} from '../lib/referralLogic';
import { detectInitialLanguage, t, type AppLanguage } from '../lib/i18n';

export default function Referral() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [referralCode, setReferralCode] = useState('');
  const [totalInvited, setTotalInvited] = useState(0);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [proDaysEarned, setProDaysEarned] = useState(0);
  const [leaderboard, setLeaderboard] = useState<{ name: string; count: number; verified: boolean }[]>([]);
  const [copied, setCopied] = useState(false);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const doubleMonth = isDoubleMonth();
  const lang: AppLanguage = detectInitialLanguage();
  const rewardMonths = getRewardMonths();

  useEffect(() => {
    const stored = localStorage.getItem('inkflow_current_user');
    if (!stored) { navigate('/register'); return; }
    db.users.get(stored).then(async u => {
      if (!u) { navigate('/register'); return; }
      setUser(u);
      const code = await getMyReferralCode();
      setReferralCode(code);
      const stats = await getReferralStats(u.id);
      setTotalInvited(stats.totalInvited);
      setVerifiedCount(stats.verifiedCount);
      setProDaysEarned(stats.proDaysEarned);
      setReferrals(stats.referrals);
      const lb = await getMonthlyLeaderboard();
      setLeaderboard(lb);
    });
  }, [navigate]);

  const inviteLink = getReferralLink(referralCode);
  const inviteText = `Join me on InkFlow, the tattoo studio management app. Use my link and we both get ${rewardMonths} month${rewardMonths > 1 ? 's' : ''} of Pro free.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const channels = [
    { label: 'WhatsApp', icon: 'WA', url: `https://wa.me/?text=${encodeURIComponent(inviteText + ' ' + inviteLink)}` },
    { label: 'Facebook', icon: 'FB', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteLink)}&quote=${encodeURIComponent(inviteText)}` },
    { label: 'Instagram', icon: 'IG', onClick: () => { handleCopy(); alert(t(lang, 'referral_link_copied')); } },
    { label: 'TikTok', icon: 'TT', onClick: () => { handleCopy(); alert(t(lang, 'referral_link_copied')); } },
  ];

  const monthsPlural = rewardMonths > 1 ? 's' : '';

  if (!user) return <div style={{ padding: 24, color: 'white' }}>{t(lang, 'referral_loading')}</div>;

  return (
    <div style={{ padding: 24, color: 'white' }}>
      <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>{t(lang, 'referral_title')}</h2>

      <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #312e81 100%)', padding: 20, borderRadius: 16, marginBottom: 16, border: doubleMonth ? '2px solid #fbbf24' : '2px solid #a78bfa' }}>
        <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{doubleMonth ? t(lang, 'referral_double_month') : t(lang, 'referral_invite_earn')}</p>
        <p style={{ fontSize: 14, color: '#a5b4fc' }}>
          {t(lang, 'referral_reward_desc').replace('{months}', String(rewardMonths)).replace('{plural}', monthsPlural)}
        </p>
      </div>

      <div style={{ background: '#1e293b', padding: 16, borderRadius: 14, marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>{t(lang, 'referral_your_link')}</p>
        <div style={{ background: '#0f172a', padding: '10px 16px', borderRadius: 10, fontSize: 14, fontFamily: 'monospace', fontWeight: 600, letterSpacing: 1, marginBottom: 12, wordBreak: 'break-all' }}>
          {inviteLink}
        </div>
        <button onClick={handleCopy} style={{ width: '100%', padding: 10, borderRadius: 10, border: 'none', background: copied ? '#14532d' : '#334155', color: copied ? '#86efac' : 'white', fontSize: 14, fontWeight: 600 }}>
          {copied ? t(lang, 'referral_copied') : t(lang, 'referral_copy_link')}
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>{t(lang, 'referral_share_via')}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {channels.map(ch => (
            ch.url ? (
              <a key={ch.label} href={ch.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '12px 8px', borderRadius: 12, background: '#1e293b', color: 'white', fontSize: 12, fontWeight: 500, textAlign: 'center' }}>
                <span style={{ fontSize: 20, fontWeight: 700 }}>{ch.icon}</span>
                <span>{ch.label}</span>
              </a>
            ) : (
              <button key={ch.label} onClick={ch.onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '12px 8px', borderRadius: 12, border: 'none', background: '#1e293b', color: 'white', fontSize: 12, fontWeight: 500, textAlign: 'center', cursor: 'pointer' }}>
                <span style={{ fontSize: 20, fontWeight: 700 }}>{ch.icon}</span>
                <span>{ch.label}</span>
              </button>
            )
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <div style={{ flex: 1, background: '#1e293b', borderRadius: 12, padding: 12, textAlign: 'center' }}><p style={{ fontSize: 24, fontWeight: 700 }}>{totalInvited}</p><p style={{ fontSize: 11, color: '#94a3b8' }}>{t(lang, 'referral_invited')}</p></div>
        <div style={{ flex: 1, background: '#1e293b', borderRadius: 12, padding: 12, textAlign: 'center' }}><p style={{ fontSize: 24, fontWeight: 700, color: '#22c55e' }}>{verifiedCount}</p><p style={{ fontSize: 11, color: '#94a3b8' }}>{t(lang, 'referral_verified')}</p></div>
        <div style={{ flex: 1, background: '#1e293b', borderRadius: 12, padding: 12, textAlign: 'center' }}><p style={{ fontSize: 24, fontWeight: 700, color: '#fbbf24' }}>{proDaysEarned}d</p><p style={{ fontSize: 11, color: '#94a3b8' }}>{t(lang, 'referral_pro_earned')}</p></div>
      </div>

      <div style={{ background: '#1e293b', borderRadius: 14, padding: 16, marginBottom: 16 }}>
        <p style={{ fontWeight: 600, marginBottom: 12 }}>{t(lang, 'referral_leaderboard')}</p>
        {leaderboard.length === 0 ? (
          <p style={{ fontSize: 13, color: '#64748b' }}>{t(lang, 'referral_no_referrals')}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {leaderboard.map((entry, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < leaderboard.length - 1 ? '1px solid #334155' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: i === 0 ? '#fbbf24' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#94a3b8' }}>{`#${i + 1}`}</span>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{entry.name}</span>
                  {entry.verified && <span style={{ fontSize: 10, color: '#22c55e' }}>OK</span>}
                </div>
                <span style={{ fontSize: 13, color: '#94a3b8' }}>{entry.count} {t(lang, 'referral_invited_label')}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {referrals.length > 0 && (
        <div style={{ background: '#1e293b', borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <p style={{ fontWeight: 600, marginBottom: 12 }}>{t(lang, 'referral_recent_invites')}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {referrals.slice(0, 10).map(ref => (
              <div key={ref.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <span style={{ color: '#94a3b8' }}>{ref.inviteeId.slice(0, 8)}...</span>
                <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, background: ref.status === 'verified' || ref.status === 'rewarded' ? '#14532d' : '#1e293b', color: ref.status === 'verified' || ref.status === 'rewarded' ? '#86efac' : '#64748b' }}>
                  {ref.status === 'pending' ? t(lang, 'referral_pending') : ref.status === 'verified' ? t(lang, 'referral_verified_label') : t(lang, 'referral_reward_sent')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={() => navigate('/me')} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#94a3b8' }}>
        {t(lang, 'referral_back')}
      </button>
    </div>
  );
}
