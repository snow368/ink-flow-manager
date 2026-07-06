import { useEffect, useRef, useState } from 'react';
import { getBackendUrl } from '../lib/backendApi';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

/**
 * Google Sign-In button using Google Identity Services (GIS).
 * Gracefully hides on iOS/China where Google is blocked.
 */
export default function GoogleSignIn({ mode }: { mode: 'register' | 'login' }) {
  const btnRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (!CLIENT_ID) return; /* No Google Client ID configured */

    /* Check if GIS is already loaded */
    if (window.google?.accounts) {
      initGIS();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setLoaded(true);
      initGIS();
    };
    script.onerror = () => setLoaded(false);
    document.head.appendChild(script);

    return () => {
      /* Script stays in DOM */
    };
  }, []);

  function initGIS() {
    if (initialized.current || !window.google?.accounts || !btnRef.current) return;
    initialized.current = true;

    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: handleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    window.google.accounts.id.renderButton(btnRef.current, {
      type: 'standard',
      shape: 'pill',
      theme: 'outline',
      text: mode === 'register' ? 'signup_with' : 'signin_with',
      size: 'large',
      width: 280,
      logo_alignment: 'left',
    });
  }

  const handleCredentialResponse = async (response: google.accounts.id.CredentialResponse) => {
    if (!response?.credential) return;
    setPending(true);
    setError('');

    try {
      const backendUrl = getBackendUrl();
      if (!backendUrl) {
        setError('Server not configured. Please set up backend URL first.');
        setPending(false);
        return;
      }

      const res = await fetch(`${backendUrl}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential, mode }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || 'Google sign-in failed. Try email instead.');
        setPending(false);
        return;
      }

      /* Store user session (same pattern as email login) */
      localStorage.setItem('inkflow_current_user', data.userId);
      localStorage.setItem('inkflow_current_user_data', JSON.stringify(data));

      window.location.href = '/today';
    } catch {
      setError('Network error. Please try again.');
      setPending(false);
    }
  };

  /* No client ID configured — don't show anything */
  if (!CLIENT_ID) return null;

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
      }}>
        <div style={{ flex: 1, height: 1, background: '#334155' }} />
        <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
          {mode === 'register' ? 'or register with' : 'or continue with'}
        </span>
        <div style={{ flex: 1, height: 1, background: '#334155' }} />
      </div>

      {error && (
        <div style={{
          background: '#7f1d1d', padding: '8px 12', borderRadius: 8, marginBottom: 12,
          fontSize: 12, color: '#fca5a5',
        }}>
          {error}
        </div>
      )}

      <div style={{
        display: 'flex', justifyContent: 'center', marginBottom: 16, minHeight: 44,
        opacity: pending ? 0.5 : 1, pointerEvents: pending ? 'none' : 'auto',
      }}>
        <div ref={btnRef} />
      </div>

      {!loaded && (
        <div style={{
          textAlign: 'center', fontSize: 12, color: '#64748b', marginBottom: 16,
        }}>
          Loading Google Sign-In...
        </div>
      )}
    </div>
  );
}
