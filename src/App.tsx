import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Users, User } from 'lucide-react';
import TabBar from './components/TabBar';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineBanner from './components/OfflineBanner';
import Today from './pages/Today';
import Clients from './pages/Clients';
import Me from './pages/Me';
import Register from './pages/Register';
import Verification from './pages/Verification';
import ClientDetail from './pages/ClientDetail';
import AppointmentForm from './pages/AppointmentForm';
import WaiverSign from './pages/WaiverSign';
import SessionPage from './pages/SessionPage';
import InventoryPage from './pages/InventoryPage';
import Referral from './pages/Referral';
import Outreach from './pages/Outreach';
import IntakePage from './pages/IntakePage';
import LeadsPage from './pages/LeadsPage';
import LeadRevisePage from './pages/LeadRevisePage';
import DepositPolicyPage from './pages/DepositPolicyPage';
import PaymentSettingsPage from './pages/PaymentSettingsPage';
import PaymentHistoryPage from './pages/PaymentHistoryPage';
import ClientPaymentPage from './pages/ClientPaymentPage';
import ClientPaymentStatusPage from './pages/ClientPaymentStatusPage';
import { db } from './db';
import { detectInitialLanguage } from './lib/i18n';

export default function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [dueFollowUpCount, setDueFollowUpCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.lang = detectInitialLanguage();
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('inkflow_current_user');
    if (stored) setIsLoggedIn(true);
    if (location.pathname === '/') {
      navigate(stored ? '/today' : '/register', { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (!isLoggedIn) {
      setDueFollowUpCount(0);
      return;
    }

    let stopped = false;
    const currentUser = localStorage.getItem('inkflow_current_user') || '';

    const loadDueFollowUps = async () => {
      if (!currentUser) return;
      const now = Date.now();
      const leads = await db.leads.where('artistId').equals(currentUser).toArray();
      if (stopped) return;
      const due = leads.filter(
        (l) =>
          !!l.nextFollowUpAt &&
          l.nextFollowUpAt <= now &&
          l.status !== 'won' &&
          l.status !== 'lost'
      );
      setDueFollowUpCount(due.length);
    };

    void loadDueFollowUps();
    const timer = window.setInterval(() => {
      void loadDueFollowUps();
    }, 60 * 1000);

    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [isLoggedIn, location.pathname]);

  const tabs = [
    { path: '/today', label: 'Today', icon: Calendar },
    { path: '/clients', label: 'Clients', icon: Users },
    { path: '/me', label: 'Me', icon: User },
  ];
  const activeTab = tabs.find((t) => location.pathname.startsWith(t.path))?.path || '/today';

  const protectedPaths = ['/today', '/clients', '/me', '/client/', '/appointment/', '/waiver/', '/session/', '/inventory', '/referral', '/leads', '/deposit-policy', '/payment-settings', '/payment-history'];
  if (!isLoggedIn && protectedPaths.some(p => location.pathname.startsWith(p))) {
    navigate('/register', { replace: true });
  }

  return (
    <ErrorBoundary>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#0f172a', color: 'white' }}>
        {!isOnline && <OfflineBanner />}
        {isLoggedIn && dueFollowUpCount > 0 && !location.pathname.startsWith('/leads') && (
          <div
            onClick={() => navigate('/leads')}
            style={{
              background: '#7f1d1d',
              color: '#fee2e2',
              padding: '10px 14px',
              fontSize: 13,
              borderBottom: '1px solid #991b1b',
              cursor: 'pointer',
            }}
          >
            {dueFollowUpCount} follow-up{dueFollowUpCount > 1 ? 's' : ''} due now. Tap to open Leads.
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route path="/verification" element={<Verification />} />
            <Route path="/today" element={<Today />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/client/:id" element={<ClientDetail />} />
            <Route path="/client/new" element={<NewClientForm />} />
            <Route path="/appointment/new" element={<AppointmentForm />} />
            <Route path="/waiver/:appointmentId" element={<WaiverSign />} />
            <Route path="/session/:appointmentId" element={<SessionPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/referral" element={<Referral />} />
            <Route path="/outreach" element={<Outreach />} />
            <Route path="/leads" element={<LeadsPage />} />
            <Route path="/intake/:artistId" element={<IntakePage />} />
            <Route path="/intake/revise/:leadId" element={<LeadRevisePage />} />
            <Route path="/deposit-policy" element={<DepositPolicyPage />} />
            <Route path="/payment-settings" element={<PaymentSettingsPage />} />
            <Route path="/payment-history" element={<PaymentHistoryPage />} />
            <Route path="/pay/:leadId" element={<ClientPaymentPage />} />
            <Route path="/pay/status/:leadId" element={<ClientPaymentStatusPage />} />
            <Route path="/me" element={<Me />} />
          </Routes>
        </div>
        {isLoggedIn && <TabBar tabs={tabs} activeTab={activeTab} />}
      </div>
    </ErrorBoundary>
  );
}

function NewClientForm() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [customAllergy, setCustomAllergy] = useState('');
  const [saving, setSaving] = useState(false);

  const commonAllergies = [
    'Latex gloves', 'Red ink', 'Blue ink', 'Green ink',
    'Yellow ink', 'Alcohol', 'Vaseline', 'Anesthetic', 'Adhesive tape',
  ];

  const toggleAllergy = (item: string) => {
    setAllergies(prev => prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item]);
  };

  const addCustomAllergy = () => {
    const trimmed = customAllergy.trim();
    if (trimmed && !allergies.includes(trimmed)) {
      setAllergies([...allergies, trimmed]);
      setCustomAllergy('');
    }
  };

  const handleSave = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      const now = Date.now();
      const id = 'client_' + now + '_' + Math.random().toString(36).slice(2, 6);
      await db.clients.add({
        id,
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        allergies: allergies.length > 0 ? allergies : undefined,
        createdAt: now,
      });
      navigate('/clients');
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 24, color: 'white' }}>
      <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>New Client</h2>
      <input placeholder="Name (required)" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
      <input placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} />
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />

      <div style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 8 }}>Allergies</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {commonAllergies.map(item => (
            <button
              key={item}
              onClick={() => toggleAllergy(item)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: allergies.includes(item) ? '2px solid #e11d48' : '2px solid #334155',
                background: allergies.includes(item) ? '#e11d4833' : 'transparent',
                color: allergies.includes(item) ? '#fca5a5' : '#94a3b8',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {allergies.includes(item) ? '[x] ' : ''}{item}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input placeholder="Custom allergy..." value={customAllergy} onChange={e => setCustomAllergy(e.target.value)} style={{ ...inputStyle, flex: 1, marginBottom: 0 }} />
        <button onClick={addCustomAllergy} disabled={!customAllergy.trim()} style={{ padding: '12px 16px', borderRadius: 10, border: 'none', background: customAllergy.trim() ? '#334155' : '#1e293b', color: 'white', fontSize: 14 }}>
          Add
        </button>
      </div>

      {allergies.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {allergies.map((a, i) => (
            <span key={i} onClick={() => toggleAllergy(a)} style={{ padding: '4px 10px', borderRadius: 8, background: '#7f1d1d', color: '#fca5a5', fontSize: 12, cursor: 'pointer' }}>
              {a} [x]
            </span>
          ))}
        </div>
      )}

      <button onClick={handleSave} disabled={saving || !name.trim()} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: saving || !name.trim() ? '#4b5563' : '#e11d48', color: 'white', fontSize: 16, fontWeight: 600 }}>
        {saving ? 'Saving...' : 'Save Client'}
      </button>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  marginBottom: 12,
  borderRadius: 12,
  border: '1px solid #334155',
  background: '#1e293b',
  color: 'white',
  fontSize: 16,
  outline: 'none',
  boxSizing: 'border-box',
};
