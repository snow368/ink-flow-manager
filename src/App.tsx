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
import CheckinPage from './pages/CheckinPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ClientPortalPage from './pages/ClientPortalPage';
import AppointmentRespondPage from './pages/AppointmentRespondPage';
import EmbedBookingPage from './pages/EmbedBookingPage';
import Portfolio from './pages/Portfolio';
import LocationSelector from './components/LocationSelector';
import NewClientForm from './pages/NewClientForm';
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
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/checkin/:appointmentId" element={<CheckinPage />} />
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

function LocationSelectorWrapper() {
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    const stored = localStorage.getItem('inkflow_current_user');
    if (stored) { db.users.get(stored).then(u => setUser(u)); }
  }, []);
  return <LocationSelector user={user} />;
}

