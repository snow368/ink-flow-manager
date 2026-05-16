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
import SupplyBrandsPage from './pages/SupplyBrandsPage';
import SupplyBrandsAdmin from './pages/SupplyBrandsAdmin';
import CompetitorsPage from './pages/CompetitorsPage';
import CompetitorsAdmin from './pages/CompetitorsAdmin';
import ContentStrategyPage from './pages/ContentStrategyPage';
import SupplyReviewsPage from './pages/SupplyReviewsPage';
import AvailabilitySettingsPage from './pages/AvailabilitySettingsPage';
import ClientBookingPage from './pages/ClientBookingPage';
import PosPage from './pages/PosPage';
import PosSettingsPage from './pages/PosSettingsPage';
import LocationsPage from './pages/LocationsPage';
import Invoices from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
import InvoiceSettingsPage from './pages/InvoiceSettingsPage';
import HealthChecklistPage from './pages/HealthChecklistPage';
import ClientPortalPage from './pages/ClientPortalPage';
import AppointmentRespondPage from './pages/AppointmentRespondPage';
import EmbedBookingPage from './pages/EmbedBookingPage';
import Portfolio from './pages/Portfolio';
import LocationSelector from './components/LocationSelector';
import { db } from './db';
import { detectInitialLanguage } from './lib/i18n';
import { rebuildConsumableProfiles } from './lib/consumableRecommend';
import { getDaysSinceLastMarketCheck } from './lib/competitorData';

export default function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [dueFollowUpCount, setDueFollowUpCount] = useState(0);
  const [marketCheckDue, setMarketCheckDue] = useState(false);
  const [isDev, setIsDev] = useState(false);
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
    if (stored) {
      setIsLoggedIn(true);
      rebuildConsumableProfiles();
      db.users.get(stored).then(u => { if (u?.roles?.includes('dev')) setIsDev(true); });
    }
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

  useEffect(() => {
    if (!isDev) { setMarketCheckDue(false); return; }
    const check = () => setMarketCheckDue(getDaysSinceLastMarketCheck() >= 30);
    check();
    const timer = window.setInterval(check, 60 * 1000);
    return () => window.clearInterval(timer);
  }, [isDev, location.pathname]);

  const tabs = [
    { path: '/today', label: 'Today', icon: Calendar },
    { path: '/clients', label: 'Clients', icon: Users },
    { path: '/me', label: 'Me', icon: User },
  ];
  const activeTab = tabs.find((t) => location.pathname.startsWith(t.path))?.path || '/today';

  const protectedPaths = ['/today', '/clients', '/me', '/client/', '/appointment/', '/waiver/', '/session/', '/inventory', '/referral', '/leads', '/deposit-policy', '/payment-settings', '/payment-history', '/supply-brands', '/supply-reviews', '/competitors', '/content-strategy', '/availability-settings', '/pos', '/invoices', '/invoice/'];
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
        {isDev && marketCheckDue && !location.pathname.startsWith('/competitors') && (
          <div
            onClick={() => navigate('/competitors')}
            style={{
              background: 'linear-gradient(135deg, #0f766e, #115e59)',
              color: '#ccfbf1',
              padding: '10px 14px',
              fontSize: 13,
              borderBottom: '1px solid #0d9488',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>距离上次市场检查已超过30天 - 点击查看竞品动态</span>
            <span style={{ fontSize: 11, background: '#14b8a620', padding: '2px 8px', borderRadius: 4 }}>查看</span>
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
            <Route path="/supply-brands" element={<SupplyBrandsPage />} />
            <Route path="/supply-brands/admin" element={<SupplyBrandsAdmin />} />
            <Route path="/competitors" element={<CompetitorsPage />} />
            <Route path="/competitors/admin" element={<CompetitorsAdmin />} />
            <Route path="/content-strategy" element={<ContentStrategyPage />} />
            <Route path="/supply-reviews" element={<SupplyReviewsPage />} />
            <Route path="/availability-settings" element={<AvailabilitySettingsPage />} />
            <Route path="/book/:artistId" element={<ClientBookingPage />} />
            <Route path="/pos" element={<PosPage />} />
            <Route path="/pos-settings" element={<PosSettingsPage />} />
            <Route path="/locations" element={<LocationsPage />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/invoice/:id" element={<InvoiceDetail />} />
            <Route path="/invoice-settings" element={<InvoiceSettingsPage />} />
            <Route path="/health-checklist" element={<HealthChecklistPage />} />
            <Route path="/portal/:clientId" element={<ClientPortalPage />} />
            <Route path="/respond/:id" element={<AppointmentRespondPage />} />
            <Route path="/embed/:artistId" element={<EmbedBookingPage />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/me" element={<Me />} />
          </Routes>
        </div>
        {isLoggedIn && (
        <div style={{ borderTop: '1px solid #1e293b' }}>
          <LocationSelectorWrapper />
        </div>
      )}
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

function LocationSelectorWrapper() {
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    const stored = localStorage.getItem('inkflow_current_user');
    if (stored) { db.users.get(stored).then(u => setUser(u)); }
  }, []);
  return <LocationSelector user={user} />;
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
