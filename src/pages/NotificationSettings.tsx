import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type UserRecord } from '../db';
import { detectInitialLanguage, t } from '../lib/i18n';
import { getTwilioConfig, setTwilioConfig, testSmsConnection, SMS_PACKS, addSmsCredits } from '../lib/smsService';
import { getSendGridConfig, setSendGridConfig, testEmailConnection } from '../lib/emailService';
import { getBackendUrl, setBackendConfig, getCalendarSubscriptionUrl } from '../lib/backendApi';

export default function NotificationSettings() {
  const navigate = useNavigate();
  const lang = detectInitialLanguage();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');

  // Global Twilio state (owner only, from localStorage)
  const [twilioSid, setTwilioSid] = useState('');
  const [twilioToken, setTwilioToken] = useState('');
  const [twilioFrom, setTwilioFrom] = useState('');

  // Global SendGrid state (owner only, from localStorage)
  const [sendgridKey, setSendgridKey] = useState('');
  const [sendgridFrom, setSendgridFrom] = useState('');

  const [showSms, setShowSms] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [showOwnerSms, setShowOwnerSms] = useState(false);
  const [showOwnerEmail, setShowOwnerEmail] = useState(false);
  const [testing, setTesting] = useState<'sms' | 'email' | null>(null);
  const [message, setMessage] = useState('');

  // Backend config
  const [backendUrl, setBackendUrlState] = useState('');
  const [backendSecret, setBackendSecretState] = useState('');

  const isOwner = user?.roles?.includes('owner') || user?.roles?.includes('dev');
  const isFree = (user?.plan || 'free') === 'free';
  const plan = user?.plan || 'free';
  const credits = user?.smsCredits || 0;
  const freeUsed = user?.smsFreeUsed || 0;
  const freeTrialActive = !!(user?.smsFreeUntil && Date.now() < user.smsFreeUntil);

  useEffect(() => {
    const uid = localStorage.getItem('inkflow_current_user');
    if (!uid) { navigate('/register'); return; }
    db.users.get(uid).then(u => {
      if (!u) { navigate('/register'); return; }
      setUser(u);
      setSmsEnabled(u.smsEnabled || false);
      setEmailEnabled(u.emailEnabled || false);
      setEmailAddress(u.emailAddress || '');
    });
    // Load global keys from localStorage
    const tw = getTwilioConfig();
    if (tw) { setTwilioSid(tw.accountSid); setTwilioToken(tw.authToken); setTwilioFrom(tw.fromNumber); }
    const sg = getSendGridConfig();
    if (sg) { setSendgridKey(sg.apiKey); setSendgridFrom(sg.fromEmail); }
    const bu = getBackendUrl();
    if (bu) setBackendUrlState(bu);
    const bs = localStorage.getItem('inkflow_backend_secret');
    if (bs) setBackendSecretState(bs);
  }, [navigate]);

  const saveUser = async (patch: Partial<UserRecord>) => {
    if (!user) return;
    await db.users.update(user.id, patch);
    const fresh = await db.users.get(user.id);
    if (fresh) setUser(fresh);
  };

  const saveTwilioGlobal = () => {
    setTwilioConfig(twilioSid, twilioToken, twilioFrom);
    setMessage('Twilio config saved.');
    setTimeout(() => setMessage(''), 2000);
  };

  const saveSendGridGlobal = () => {
    setSendGridConfig(sendgridKey, sendgridFrom);
    setMessage('SendGrid config saved.');
    setTimeout(() => setMessage(''), 2000);
  };

  const handleTestSms = async () => {
    if (!twilioSid || !twilioToken || !twilioFrom) {
      setMessage('Configure Twilio first');
      return;
    }
    setTesting('sms');
    const r = await testSmsConnection(twilioFrom);
    setMessage(r.ok ? t(lang, 'sent') : `SMS failed: ${r.error}`);
    setTesting(null);
  };

  const handleTestEmail = async () => {
    if (!sendgridKey || !sendgridFrom) {
      setMessage('Configure SendGrid first');
      return;
    }
    setTesting('email');
    const r = await testEmailConnection(emailAddress || sendgridFrom);
    setMessage(r.ok ? t(lang, 'sent') : `Email failed: ${r.error}`);
    setTesting(null);
  };

  const handleBuyPack = async (pack: typeof SMS_PACKS[number]) => {
    if (!user) return;
    await addSmsCredits(user.id, pack.amount);
    // TODO: real payment integration
    const fresh = await db.users.get(user.id);
    if (fresh) setUser(fresh);
    setMessage(`Added ${pack.amount} SMS credits ($${pack.price.toFixed(2)})`);
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div style={{ padding: 24, color: 'white', paddingBottom: 80 }}>
      <button onClick={() => navigate('/me')} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: 14, cursor: 'pointer', marginBottom: 16 }}>← {t(lang, 'back')}</button>
      <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>{t(lang, 'notification_settings')}</h2>

      {message && (
        <div style={{ padding: 10, borderRadius: 8, background: message.includes('failed') ? '#7f1d1d' : '#166534', marginBottom: 12, fontSize: 13, color: message.includes('failed') ? '#fca5a5' : '#4ade80' }}>
          {message}
        </div>
      )}

      {/* ---- OWNER: Global API Keys ---- */}
      {isOwner && (
        <div style={{ background: '#0f172a', border: '1px solid #f59e0b', borderRadius: 12, padding: 14, marginBottom: 16 }}>
          <p style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600, marginBottom: 4 }}>OWNER SETUP — Shared for all artists</p>

          {/* Global Twilio */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <p style={{ fontWeight: 600, fontSize: 14 }}>Twilio (SMS)</p>
              <button onClick={() => setShowOwnerSms(!showOwnerSms)} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: 12, cursor: 'pointer' }}>
                {showOwnerSms ? t(lang, 'hide') : t(lang, 'show')}
              </button>
            </div>
            {showOwnerSms && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <input placeholder={t(lang, 'twilio_sid')} value={twilioSid} onChange={e => setTwilioSid(e.target.value)} style={inputStyle} type="password" />
                <input placeholder={t(lang, 'twilio_token')} value={twilioToken} onChange={e => setTwilioToken(e.target.value)} style={inputStyle} type="password" />
                <input placeholder={t(lang, 'twilio_from') + ' (+1234567890)'} value={twilioFrom} onChange={e => setTwilioFrom(e.target.value)} style={inputStyle} />
                <button onClick={saveTwilioGlobal} style={saveBtnStyle}>Save Twilio Config</button>
              </div>
            )}
          </div>

          {/* Global SendGrid */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <p style={{ fontWeight: 600, fontSize: 14 }}>SendGrid (Email)</p>
              <button onClick={() => setShowOwnerEmail(!showOwnerEmail)} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: 12, cursor: 'pointer' }}>
                {showOwnerEmail ? t(lang, 'hide') : t(lang, 'show')}
              </button>
            </div>
            {showOwnerEmail && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <input placeholder={t(lang, 'sendgrid_key')} value={sendgridKey} onChange={e => setSendgridKey(e.target.value)} style={inputStyle} type="password" />
                <input placeholder={t(lang, 'sendgrid_from')} value={sendgridFrom} onChange={e => setSendgridFrom(e.target.value)} style={inputStyle} />
                <button onClick={saveSendGridGlobal} style={saveBtnStyle}>Save SendGrid Config</button>
              </div>
            )}
          </div>

          {/* Backend Config */}
          <div style={{ marginTop: 12, borderTop: '1px solid #334155', paddingTop: 12 }}>
            <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Backend (Cloudflare Worker)</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <input placeholder={t(lang, 'backend_url') + ' (https://ink-flow.worker.dev)'} value={backendUrl} onChange={e => setBackendUrlState(e.target.value)} style={inputStyle} />
              <input placeholder={t(lang, 'backend_secret')} value={backendSecret} onChange={e => setBackendSecretState(e.target.value)} style={inputStyle} type="password" />
              <button onClick={() => { setBackendConfig(backendUrl, backendSecret); setMessage('Backend config saved.'); setTimeout(() => setMessage(''), 2000); }} style={saveBtnStyle}>Save Backend Config</button>
            </div>
          </div>
        </div>
      )}

      {/* ---- SMS Balance Card ---- */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <p style={{ fontWeight: 700, fontSize: 16 }}>SMS Balance</p>
          <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 10, background: plan === 'free' ? '#334155' : plan === 'pro' ? '#2563eb' : '#a855f7', color: 'white', fontWeight: 600 }}>
            {plan.toUpperCase()}
          </span>
        </div>

        {/* Free plan */}
        {plan === 'free' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1, height: 8, background: '#334155', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${(freeUsed / 5) * 100}%`, height: '100%', background: '#f59e0b', borderRadius: 4 }} />
              </div>
              <span style={{ fontSize: 13, color: '#94a3b8', whiteSpace: 'nowrap' }}>{freeUsed}/5 free</span>
            </div>
            <div style={{ background: '#0a1a2a', border: '1px solid #3b82f644', borderRadius: 8, padding: 8 }}>
              <p style={{ fontSize: 11, color: '#60a5fa', fontWeight: 600, marginBottom: 2 }}>Each reminder you auto-send saves 1 minute of copy-paste</p>
              <p style={{ fontSize: 10, color: '#93c5fd' }}>90 reminders/month = 90 minutes. Upgrade to auto-send all of them — $3.50/month.</p>
            </div>
          </div>
        )}

        {/* Pro/Plus with credits */}
        {plan !== 'free' && (
          <div>
            {freeTrialActive ? (
              <div style={{ marginBottom: 8 }}>
                <p style={{ fontSize: 13, color: '#4ade80' }}>3-day free trial active — {Math.max(0, 3 - Math.ceil((Date.now() - (user?.smsFreeUntil || 0) + 3*86400000) / 86400000))} days left</p>
                <p style={{ fontSize: 11, color: '#64748b' }}>Max 3 SMS/day during trial</p>
              </div>
            ) : (
              <div style={{ marginBottom: 8 }}>
                <p style={{ fontSize: 24, fontWeight: 700 }}>{credits} <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 400 }}>SMS left</span></p>
                {credits === 0 && <p style={{ fontSize: 13, color: '#f59e0b' }}>Out of credits — buy a pack below</p>}
              </div>
            )}
            {/* Value proposition */}
            <div style={{ background: '#0a2a1a', border: '1px solid #22c55e44', borderRadius: 8, padding: 8, marginBottom: 8 }}>
              <p style={{ fontSize: 11, color: '#4ade80', fontWeight: 600, marginBottom: 2 }}>Auto-send saves you ~10 min/day</p>
              <p style={{ fontSize: 10, color: '#86efac' }}>No more copying messages, searching contacts, pasting reminders. 90 reminders/month done automatically.</p>
            </div>
          </div>
        )}

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#94a3b8', cursor: 'pointer', marginTop: 8 }}>
          <input type="checkbox" checked={smsEnabled} onChange={e => { setSmsEnabled(e.target.checked); saveUser({ smsEnabled: e.target.checked }); }} />
          Enable SMS reminders
        </label>

        {/* Test button */}
        <div style={{ marginTop: 10 }}>
          <button onClick={handleTestSms} disabled={testing === 'sms' || !twilioSid}
            style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: testing === 'sms' || !twilioSid ? '#4b5563' : '#2563eb', color: 'white', fontSize: 12, fontWeight: 600, cursor: twilioSid ? 'pointer' : 'not-allowed' }}>
            {testing === 'sms' ? '...' : t(lang, 'test_send')}
          </button>
        </div>
      </div>

      {/* ---- SMS Packs (Pro/Plus only) ---- */}
      {plan !== 'free' && !freeTrialActive && (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Buy SMS Pack</p>
          <p style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>$0.01/SMS. ~3 reminders/day → M pack/month ($1.00).</p>
          <p style={{ fontSize: 10, color: '#475569', marginBottom: 10 }}>SMS + WhatsApp share the same balance.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {SMS_PACKS.map(p => (
              <button key={p.id} onClick={() => handleBuyPack(p)}
                style={{ padding: '10px 8px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 12, cursor: 'pointer', textAlign: 'center' }}>
                <p style={{ fontWeight: 600 }}>{p.amount} SMS</p>
                <p style={{ color: '#4ade80', fontSize: 11 }}>${p.price.toFixed(2)}</p>
              </button>
            ))}
          </div>
          <p style={{ fontSize: 10, color: '#475569', marginTop: 8 }}>Payment integration coming soon. Credits added instantly for now.</p>
        </div>
      )}

      {/* ---- Email Section (collapsed by default) ---- */}
      <details style={{ background: '#1e293b', padding: 12, borderRadius: 12, marginBottom: 16, fontSize: 12, color: '#64748b' }}>
        <summary style={{ cursor: 'pointer', color: '#94a3b8', fontWeight: 600, fontSize: 13 }}>{t(lang, 'email_settings')}</summary>
        <p style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>SendGrid free tier — 100 emails/day. Most clients won&apos;t check email before appointments.</p>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#94a3b8', cursor: 'pointer', marginTop: 8 }}>
          <input type="checkbox" checked={emailEnabled} onChange={e => { setEmailEnabled(e.target.checked); saveUser({ emailEnabled: e.target.checked }); }} />
          {t(lang, 'email_enabled')}
        </label>
        {showEmail && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            <input placeholder={t(lang, 'email_address')} value={emailAddress} onChange={e => setEmailAddress(e.target.value)} onBlur={() => saveUser({ emailAddress })} style={inputStyle} />
            <button onClick={handleTestEmail} disabled={testing === 'email' || !sendgridKey}
              style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: testing === 'email' || !sendgridKey ? '#4b5563' : '#2563eb', color: 'white', fontSize: 12, fontWeight: 600, cursor: sendgridKey ? 'pointer' : 'not-allowed', alignSelf: 'flex-start' }}>
              {testing === 'email' ? '...' : t(lang, 'test_send')}
            </button>
          </div>
        )}
      </details>

      {/* ---- Pricing Info ---- */}
      <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, padding: 14, marginBottom: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>How it works</p>
        <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.8 }}>
          <p><span style={{ color: 'white', fontWeight: 600 }}>$3.50/mo</span> — automation fee (unlocks auto-send)</p>
          <p><span style={{ color: 'white', fontWeight: 600 }}>$0.01/message</span> — SMS or WhatsApp, deducted from your pack balance</p>
          <p style={{ marginTop: 6, color: '#60a5fa' }}>5 free messages to try, no card needed.</p>
        </div>
      </div>

      {/* ---- Calendar Subscription ---- */}
      {user && backendUrl && (
        <div style={{ background: '#1e293b', border: '1px solid #f59e0b', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>📅 {t(lang, 'calendar_subscription')}</p>
          <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 12 }}>{t(lang, 'calendar_subscription_desc')}</p>

          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: 10, marginBottom: 12 }}>
            <p style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>{t(lang, 'calendar_subscription_url')}</p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <code style={{ flex: 1, fontSize: 11, color: '#fbbf24', wordBreak: 'break-all', background: '#0a0f1a', padding: '6px 8px', borderRadius: 6, border: '1px solid #334155' }}>
                {getCalendarSubscriptionUrl(user.id)}
              </code>
              <button onClick={() => {
                navigator.clipboard.writeText(getCalendarSubscriptionUrl(user.id));
                setMessage('Copied!');
                setTimeout(() => setMessage(''), 2000);
              }} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Copy
              </button>
            </div>
          </div>

          <details style={{ fontSize: 11, color: '#94a3b8' }}>
            <summary style={{ cursor: 'pointer', color: '#60a5fa', marginBottom: 6 }}>{t(lang, 'calendar_howto')}</summary>
            <p style={{ marginBottom: 4 }}>📱 {t(lang, 'calendar_howto_iphone')}</p>
            <p style={{ marginBottom: 4 }}>🤖 {t(lang, 'calendar_howto_android')}</p>
            <p>💻 {t(lang, 'calendar_howto_google')}</p>
          </details>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  borderRadius: 8, border: '1px solid #334155', background: '#0f172a',
  color: 'white', fontSize: 13, outline: 'none', boxSizing: 'border-box',
};

const saveBtnStyle: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 8, border: 'none', background: '#f59e0b',
  color: '#0f172a', fontSize: 12, fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-start',
};
