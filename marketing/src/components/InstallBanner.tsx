import { useState, useEffect } from 'react';
import { isInstallAvailable, shouldShowInstallBanner, triggerInstall, dismissInstallBanner } from '../lib/pwaInstall';

export default function InstallBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const check = () => {
      if (shouldShowInstallBanner() && isInstallAvailable()) {
        setVisible(true);
      }
    };
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 72, left: 12, right: 12, zIndex: 999,
      background: '#1e293b', borderRadius: 12, padding: 16,
      border: '1px solid #334155', boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
    }}>
      <p style={{ fontSize: 14, fontWeight: 600, color: 'white', marginBottom: 4 }}>
        Install InkFlow
      </p>
      <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>
        Add to your home screen for a faster experience.
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={async () => {
            await triggerInstall();
            setVisible(false);
          }}
          style={{
            flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
            background: '#e11d48', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Install
        </button>
        <button
          onClick={() => {
            dismissInstallBanner();
            setVisible(false);
          }}
          style={{
            flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid #475569',
            background: 'transparent', color: '#94a3b8', fontSize: 14, cursor: 'pointer',
          }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
