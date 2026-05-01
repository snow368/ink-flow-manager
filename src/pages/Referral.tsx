import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type UserRecord, type ReferralRecord } from '../db';
import {
  getMyReferralCode, getReferralLink, getReferralStats,
  getMonthlyLeaderboard, isDoubleMonth, getRewardMonths,
} from '../lib/referralLogic';

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
  const inviteText = `Join me on InkFlow — the free tattoo studio management app! Use my link and we both get ${getRewardMonths()} month${getRewardMonths() > 1 ? 's' : ''} of Pro free 🎉`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const channels = [
    {
      label: 'WhatsApp',
      icon: '💬',
      url: `https://wa.me/?text=${encodeURIComponent(inviteText + ' ' + inviteLink)}`,
    },
    {
      label: 'Facebook',
      icon: '📘',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteLink)}&quote=${encodeURIComponent(inviteText)}`,
    },
    {
      label: 'Instagram',
      icon: '📷',
      onClick: () => { handleCopy(); alert('Link copied! Paste it in your Instagram DM or Story.'); },
    },
    {
      label: 'TikTok',
      icon: '🎵',
      onClick: () => { handleCopy(); alert('Link copied! Paste it in your TikTok bio or DM.'); },
    },
  ];

  if (!user) return <div style={{ padding: 24, color: 'white' }}>Loading...</div>;

  return (
    <div style={{ padding: 24, color: 'white' }}>
      <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>Invite Friends</h2>

      {/* 奖励说明 */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #312e81 100%)',
        padding: 20, borderRadius: 16, marginBottom: 16,
        border: doubleMonth ? '2px solid #fbbf24' : '2px solid #a78bfa',
      }}>
        <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
          {doubleMonth ? '🎉 Double Rewards Month!' : 'Invite & Earn'}
        </p>
        <p style={{ fontSize: 14, color: '#a5b4fc' }}>
          You and your friend each get <strong>{getRewardMonths()} month{getRewardMonths() > 1 ? 's' : ''} of Pro</strong> — for free.
        </p>
      </div>

      {/* 邀请链接 */}
      <div style={{ background: '#1e293b', padding: 16, borderRadius: 14, marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>Your invite link</p>
        <div style={{
          background: '#0f172a', padding: '10px 16px', borderRadius: 10,
          fontSize: 14, fontFamily: 'monospace', fontWeight: 600,
          letterSpacing: 1, marginBottom: 12, wordBreak: 'break-all',
        }}>
          {inviteLink}
        </div>
        <button onClick={handleCopy}
          style={{ width: '100%', padding: 10, borderRadius: 10, border: 'none', background: copied ? '#14532d' : '#334155', color: copied ? '#86efac' : 'white', fontSize: 14, fontWeight: 600 }}>
          {copied ? '✅ Copied!' : '📋 Copy Link'}
        </button>
      </div>

      {/* 社媒分享 - 4个渠道 */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Share via</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {channels.map(ch => (
            ch.url ? (
              <a key={ch.label} href={ch.url} target="_blank" rel="noopener noreferrer"
                style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  padding: '12px 8px', borderRadius: 12, background: '#1e293b',
                  color: 'white', fontSize: 12, fontWeight: 500, textAlign: 'center',
                }}>
                <span style={{ fontSize: 28 }}>{ch.icon}</span>
                <span>{ch.label}</span>
              </a>
            ) : (
              <button key={ch.label} onClick={ch.onClick}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  padding: '12px 8px', borderRadius: 12, border: 'none', background: '#1e293b',
                  color: 'white', fontSize: 12, fontWeight: 500, textAlign: 'center', cursor: 'pointer',
                }}>
                <span style={{ fontSize: 28 }}>{ch.icon}</span>
                <span>{ch.label}</span>
              </button>
            )
          ))}
        </div>
      </div>

      {/* 统计 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <div style={{ flex: 1, background: '#1e293b', borderRadius: 12, padding: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 24, fontWeight: 700 }}>{totalInvited}</p>
          <p style={{ fontSize: 11, color: '#94a3b8' }}>Invited</p>
        </div>
        <div style={{ flex: 1, background: '#1e293b', borderRadius: 12, padding: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#22c55e' }}>{verifiedCount}</p>
          <p style={{ fontSize: 11, color: '#94a3b8' }}>Verified</p>
        </div>
        <div style={{ flex: 1, background: '#1e293b', borderRadius: 12, padding: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#fbbf24' }}>{proDaysEarned}d</p>
          <p style={{ fontSize: 11, color: '#94a3b8' }}>Pro Earned</p>
        </div>
      </div>

      {/* 排行榜 */}
      <div style={{ background: '#1e293b', borderRadius: 14, padding: 16, marginBottom: 16 }}>
        <p style={{ fontWeight: 600, marginBottom: 12 }}>🏆 Monthly Leaderboard</p>
        {leaderboard.length === 0 ? (
          <p style={{ fontSize: 13, color: '#64748b' }}>No referrals yet this month. Be the first!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {leaderboard.map((entry, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < leaderboard.length - 1 ? '1px solid #334155' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: i === 0 ? '#fbbf24' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#94a3b8' }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{entry.name}</span>
                  {entry.verified && <span style={{ fontSize: 10, color: '#22c55e' }}>✓</span>}
                </div>
                <span style={{ fontSize: 13, color: '#94a3b8' }}>{entry.count} invited</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 已邀请列表 */}
      {referrals.length > 0 && (
        <div style={{ background: '#1e293b', borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <p style={{ fontWeight: 600, marginBottom: 12 }}>Recent Invites</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {referrals.slice(0, 10).map(ref => (
              <div key={ref.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <span style={{ color: '#94a3b8' }}>{ref.inviteeId.slice(0, 8)}...</span>
                <span style={{
                  padding: '2px 8px', borderRadius: 6, fontSize: 11,
                  background: ref.status === 'verified' || ref.status === 'rewarded' ? '#14532d' : '#1e293b',
                  color: ref.status === 'verified' || ref.status === 'rewarded' ? '#86efac' : '#64748b',
                }}>
                  {ref.status === 'pending' ? 'Pending' : ref.status === 'verified' ? 'Verified' : 'Reward Sent'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={() => navigate('/me')}
        style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#94a3b8' }}>
        ← Back to Me
      </button>
    </div>
  );
}
