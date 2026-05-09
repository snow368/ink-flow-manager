import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../db';

export default function Verification() {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId') || '';
  const navigate = useNavigate();
  const [method, setMethod] = useState<'instagram' | 'upload' | null>(null);
  const [instagramUser, setInstagramUser] = useState('');
  const [shopPhoto, setShopPhoto] = useState<File | null>(null);
  const [licensePhoto, setLicensePhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState('');

  const handleInstagramVerify = async () => {
    if (!instagramUser) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 2000));
    try {
      await db.users.update(userId, { verified: true, verificationType: 'social' });
      setResult('passed');
    } catch {
      setResult('failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadVerify = async () => {
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 2000));
    try {
      await db.users.update(userId, { verified: true, verificationType: 'shop' });
      setResult('passed');
    } catch {
      setResult('failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (result === 'passed') {
    return (
      <div style={{ padding: 24, color: 'white', textAlign: 'center' }}>
        <div style={{ fontSize: 48 }}>OK</div>
        <h2 style={{ fontSize: 20, fontWeight: 'bold', margin: '16px 0' }}>Verification Passed</h2>
        <p style={{ color: '#94a3b8', marginBottom: 24 }}>Your account is now verified.</p>
        <button onClick={() => navigate('/me')} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: '#e11d48', color: 'white', fontSize: 16, fontWeight: 600 }}>
          Go to My Profile
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, color: 'white' }}>
      <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 24 }}>Complete Verification</h2>

      {!method ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={() => setMethod('instagram')} style={{ padding: 16, borderRadius: 12, border: 'none', background: '#1e293b', color: 'white', textAlign: 'left' }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Instagram Quick Verify</div>
            <div style={{ fontSize: 14, color: '#94a3b8' }}>Connect your portfolio account for fast verification.</div>
          </button>
          <button onClick={() => setMethod('upload')} style={{ padding: 16, borderRadius: 12, border: 'none', background: '#1e293b', color: 'white', textAlign: 'left' }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Upload Documents</div>
            <div style={{ fontSize: 14, color: '#94a3b8' }}>Upload shop or competition proof for manual review.</div>
          </button>
        </div>
      ) : method === 'instagram' ? (
        <div>
          <p style={{ marginBottom: 12, color: '#94a3b8' }}>Enter your Instagram handle</p>
          <input
            placeholder="@yourhandle"
            value={instagramUser}
            onChange={e => setInstagramUser(e.target.value)}
            style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: 16, marginBottom: 16, outline: 'none' }}
          />
          <button onClick={handleInstagramVerify} disabled={submitting || !instagramUser} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: '#e11d48', color: 'white', fontSize: 16, fontWeight: 600 }}>
            {submitting ? 'Verifying...' : 'Start Verification'}
          </button>
          <button onClick={() => setMethod(null)} style={{ width: '100%', marginTop: 12, padding: 14, borderRadius: 12, border: '1px solid #334155', background: 'transparent', color: '#94a3b8' }}>
            Back
          </button>
        </div>
      ) : (
        <div>
          <UploadBox label="Shop photo or portfolio proof" file={shopPhoto} onChange={setShopPhoto} />
          <UploadBox label="Business license or competition proof" file={licensePhoto} onChange={setLicensePhoto} />
          <button onClick={handleUploadVerify} disabled={submitting} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: '#e11d48', color: 'white', fontSize: 16, fontWeight: 600, marginTop: 8 }}>
            {submitting ? 'Submitting...' : 'Submit for Review'}
          </button>
          <button onClick={() => setMethod(null)} style={{ width: '100%', marginTop: 12, padding: 14, borderRadius: 12, border: '1px solid #334155', background: 'transparent', color: '#94a3b8' }}>
            Back
          </button>
        </div>
      )}
    </div>
  );
}

function UploadBox({ label, file, onChange }: { label: string; file: File | null; onChange: (f: File | null) => void }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 14, color: '#94a3b8', display: 'block', marginBottom: 4 }}>{label}</label>
      <input type="file" accept="image/*" onChange={e => onChange(e.target.files?.[0] || null)} style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid #334155', background: '#1e293b', color: 'white' }} />
      {file && <p style={{ fontSize: 12, color: '#22c55e', marginTop: 4 }}>Selected: {file.name}</p>}
    </div>
  );
}
