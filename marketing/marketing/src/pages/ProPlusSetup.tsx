import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type UserRecord, type StudioLocationRecord } from '../db';
import { THEME } from '../lib/theme';

const STEPS = ['Studio', 'Team', 'Done'];

export default function ProPlusSetup() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState('');

  // Step 1 — Studio
  const [studioName, setStudioName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  // Step 2 — Team
  const [members, setMembers] = useState<{ name: string; email: string; role: 'artist' | 'staff' }[]>([]);

  // Results
  const [createdLocation, setCreatedLocation] = useState<StudioLocationRecord | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('inkflow_current_user');
    if (!stored) { navigate('/register'); return; }
    db.users.get(stored).then(u => {
      if (!u) { navigate('/register'); return; }
      if (u.proPlusOnboarded) { navigate('/studio-settings'); return; }
      setUser(u);
    });
  }, []);

  const handleCreateStudio = async () => {
    if (!user || !studioName.trim()) return;
    const id = 'loc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    const loc: StudioLocationRecord = {
      id, ownerId: user.id, name: studioName.trim(),
      address: address.trim() || undefined,
      phone: phone.trim() || undefined,
      createdAt: Date.now(),
    };
    await db.studioLocations.add(loc);
    setCreatedLocation(loc);
    setStep(1);
  };

  const addMember = () => {
    setMembers([...members, { name: '', email: '', role: 'artist' }]);
  };

  const updateMember = (idx: number, field: string, value: string) => {
    const next = [...members];
    (next[idx] as any)[field] = value;
    setMembers(next);
  };

  const removeMember = (idx: number) => {
    setMembers(members.filter((_, i) => i !== idx));
  };

  const handleSaveTeam = async () => {
    if (!user || !createdLocation) return;
    const valid = members.filter(m => m.name.trim() && m.email.trim());
    for (const m of valid) {
      const id = 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      await db.users.add({
        id,
        name: m.name.trim(),
        email: m.email.trim(),
        roles: [m.role],
        verified: false,
        assignedLocationIds: [createdLocation.id],
        createdAt: Date.now(),
      });
    }
    // Mark onboarded
    await db.users.update(user.id, { proPlusOnboarded: true });
    setStep(2);
  };

  const handleLater = async () => {
    if (!user) return;
    await db.users.update(user.id, { proPlusOnboarded: true });
    navigate('/studio-settings');
  };

  if (!user) return null;

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', marginBottom: 10,
    borderRadius: 10, border: `1px solid ${THEME.border.default}`,
    background: THEME.bg.panelAlt, color: THEME.text.primary,
    fontSize: 15, outline: 'none', boxSizing: 'border-box',
  };

  const btnStyle = (active: boolean): React.CSSProperties => ({
    width: '100%', padding: 14, borderRadius: 12, border: 'none',
    background: active ? THEME.brand.primary : '#334155',
    color: active ? 'white' : '#94a3b8',
    fontSize: 16, fontWeight: 700, cursor: active ? 'pointer' : 'not-allowed',
  });

  return (
    <div style={{ padding: 24, color: THEME.text.primary, minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, justifyContent: 'center' }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 14,
              background: i <= step ? THEME.brand.primary : '#334155',
              color: 'white', fontSize: 12, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {i < step ? '✓' : i + 1}
            </div>
            <span style={{ fontSize: 11, color: i <= step ? THEME.text.primary : THEME.text.subtle, fontWeight: i === step ? 700 : 400 }}>
              {s}
            </span>
            {i < STEPS.length - 1 && (
              <div style={{ width: 24, height: 1, background: i < step ? THEME.brand.primary : THEME.border.default }} />
            )}
          </div>
        ))}
      </div>

      {message && (
        <div style={{ background: '#14532d', padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 13, color: '#86efac' }}>
          {message}
        </div>
      )}

      {/* Step 1: Create Studio */}
      {step === 0 && (
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Set Up Your New Studio</h2>
          <p style={{ fontSize: 13, color: THEME.text.subtle, marginBottom: 24, lineHeight: 1.5 }}>
            Pro+ lets you manage multiple studios. Let's set up your second location.
            You can always add more later.
          </p>

          <div style={{ background: THEME.bg.panel, borderRadius: 14, padding: 18 }}>
            <p style={{ fontSize: 11, color: THEME.text.subtle, marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Studio Details
            </p>
            <input placeholder="Studio name *" value={studioName} onChange={e => setStudioName(e.target.value)} style={inputStyle} autoFocus />
            <input placeholder="Address" value={address} onChange={e => setAddress(e.target.value)} style={inputStyle} />
            <input placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} />
          </div>

          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={handleCreateStudio} disabled={!studioName.trim()} style={btnStyle(!!studioName.trim())}>
              Continue →
            </button>
            <button onClick={handleLater} style={{ ...btnStyle(true), background: 'transparent', border: `1px solid ${THEME.border.default}`, color: THEME.text.subtle, fontSize: 14, fontWeight: 500 }}>
              Skip — I'll set up later
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Add Team */}
      {step === 1 && (
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Add Your Team</h2>
          <p style={{ fontSize: 13, color: THEME.text.subtle, marginBottom: 24, lineHeight: 1.5 }}>
            Invite artists and staff to <strong style={{ color: THEME.text.primary }}>{createdLocation?.name}</strong>.
            They'll get access to this studio's schedule and clients.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {members.map((m, idx) => (
              <div key={idx} style={{ background: THEME.bg.panel, borderRadius: 12, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: THEME.text.subtle, fontWeight: 600 }}>Member {idx + 1}</span>
                  <button onClick={() => removeMember(idx)} style={{ background: 'none', border: 'none', color: '#f87171', fontSize: 13, cursor: 'pointer', padding: 0 }}>
                    Remove
                  </button>
                </div>
                <input placeholder="Name *" value={m.name} onChange={e => updateMember(idx, 'name', e.target.value)} style={{ ...inputStyle, marginBottom: 6 }} />
                <input placeholder="Email *" value={m.email} onChange={e => updateMember(idx, 'email', e.target.value)} style={{ ...inputStyle, marginBottom: 6 }} type="email" />
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['artist', 'staff'] as const).map(r => (
                    <button key={r} onClick={() => updateMember(idx, 'role', r)}
                      style={{
                        flex: 1, padding: '8px', borderRadius: 8, border: '1px solid',
                        borderColor: m.role === r ? THEME.brand.primary : THEME.border.default,
                        background: m.role === r ? THEME.brand.primary + '20' : 'transparent',
                        color: m.role === r ? THEME.brand.primary : THEME.text.subtle,
                        fontSize: 13, fontWeight: m.role === r ? 700 : 400, cursor: 'pointer',
                      }}>
                      {r === 'artist' ? '🎨 Artist' : '👤 Staff'}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {members.length < 5 && (
            <button onClick={addMember}
              style={{ width: '100%', padding: 12, borderRadius: 12, border: `1px dashed ${THEME.border.default}`, background: 'transparent', color: THEME.text.subtle, fontSize: 14, cursor: 'pointer', marginTop: 10 }}>
              + Add member
            </button>
          )}

          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={handleSaveTeam} style={btnStyle(true)}>
              {members.length > 0 ? 'Save & Continue →' : 'Skip — Continue →'}
            </button>
            <button onClick={handleLater} style={{ ...btnStyle(true), background: 'transparent', border: `1px solid ${THEME.border.default}`, color: THEME.text.subtle, fontSize: 14, fontWeight: 500 }}>
              I'll do this later
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Done */}
      {step === 2 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 32, background: THEME.brand.success + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 16 }}>
            🎉
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>All Set!</h2>
          <p style={{ fontSize: 14, color: THEME.text.subtle, marginBottom: 4, lineHeight: 1.5 }}>
            {createdLocation?.name && <><strong>{createdLocation.name}</strong> is ready.</>}
          </p>
          {members.length > 0 && (
            <p style={{ fontSize: 13, color: THEME.text.subtle, marginBottom: 20 }}>
              {members.filter(m => m.name.trim()).length} team member{members.filter(m => m.name.trim()).length !== 1 ? 's' : ''} added.
            </p>
          )}
          <p style={{ fontSize: 12, color: THEME.text.subtle, marginBottom: 32 }}>
            You can always add more studios and team members from Studio Settings.
          </p>
          <button onClick={() => navigate('/studio-settings')}
            style={{ width: '100%', padding: 16, borderRadius: 14, border: 'none', background: THEME.brand.primary, color: 'white', fontSize: 17, fontWeight: 700, cursor: 'pointer' }}>
            Go to Studio Settings
          </button>
        </div>
      )}
    </div>
  );
}
