import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Users, User } from 'lucide-react';
import TabBar from './components/TabBar';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineBanner from './components/OfflineBanner';
import InstallBanner from './components/InstallBanner';
import { captureInstallEvent } from './lib/pwaInstall';
const Today = lazy(() => import('./pages/Today'));
const Clients = lazy(() => import('./pages/Clients'));
const Me = lazy(() => import('./pages/Me'));
const Register = lazy(() => import('./pages/Register'));
const Verification = lazy(() => import('./pages/Verification'));
const ClientDetail = lazy(() => import('./pages/ClientDetail'));
const AppointmentForm = lazy(() => import('./pages/AppointmentForm'));
const WaiverSign = lazy(() => import('./pages/WaiverSign'));
const PublicWaiverSign = lazy(() => import('./pages/PublicWaiverSign'));
const SessionPage = lazy(() => import('./pages/SessionPage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const Referral = lazy(() => import('./pages/Referral'));
const Outreach = lazy(() => import('./pages/Outreach'));
const IntakePage = lazy(() => import('./pages/IntakePage'));
const LeadsPage = lazy(() => import('./pages/LeadsPage'));
const LeadRevisePage = lazy(() => import('./pages/LeadRevisePage'));
const DepositPolicyPage = lazy(() => import('./pages/DepositPolicyPage'));
const PaymentSettingsPage = lazy(() => import('./pages/PaymentSettingsPage'));
const PaymentHistoryPage = lazy(() => import('./pages/PaymentHistoryPage'));
const ClientPaymentPage = lazy(() => import('./pages/ClientPaymentPage'));
const ClientPaymentStatusPage = lazy(() => import('./pages/ClientPaymentStatusPage'));
const SupplyBrandsPage = lazy(() => import('./pages/SupplyBrandsPage'));
const SupplyBrandsAdmin = lazy(() => import('./pages/SupplyBrandsAdmin'));
const CompetitorsPage = lazy(() => import('./pages/CompetitorsPage'));
const CompetitorsAdmin = lazy(() => import('./pages/CompetitorsAdmin'));
const ContentStrategyPage = lazy(() => import('./pages/ContentStrategyPage'));
const SupplyReviewsPage = lazy(() => import('./pages/SupplyReviewsPage'));
const AvailabilitySettingsPage = lazy(() => import('./pages/AvailabilitySettingsPage'));
const ClientBookingPage = lazy(() => import('./pages/ClientBookingPage'));
const ReferralShortPage = lazy(() => import('./pages/ReferralShortPage'));
const PosPage = lazy(() => import('./pages/PosPage'));
const PosSettingsPage = lazy(() => import('./pages/PosSettingsPage'));
const LocationsPage = lazy(() => import('./pages/LocationsPage'));
const Invoices = lazy(() => import('./pages/Invoices'));
const InvoiceDetail = lazy(() => import('./pages/InvoiceDetail'));
const InvoiceSettingsPage = lazy(() => import('./pages/InvoiceSettingsPage'));
const HealthChecklistPage = lazy(() => import('./pages/HealthChecklistPage'));
const CheckinPage = lazy(() => import('./pages/CheckinPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const ClientPortalPage = lazy(() => import('./pages/ClientPortalPage'));
const AppointmentRespondPage = lazy(() => import('./pages/AppointmentRespondPage'));
const EmbedBookingPage = lazy(() => import('./pages/EmbedBookingPage'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const ReviewInvitesPage = lazy(() => import('./pages/ReviewInvitesPage'));
const WaiverManager = lazy(() => import('./pages/WaiverManager'));
const NotificationSettings = lazy(() => import('./pages/NotificationSettings'));
const ArtistProfilePage = lazy(() => import('./pages/ArtistProfilePage'));
const ConfirmBookingPage = lazy(() => import('./pages/ConfirmBookingPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const ShiftSchedulingPage = lazy(() => import('./pages/ShiftSchedulingPage'));
const DailyCloseOutPage = lazy(() => import('./pages/DailyCloseOutPage'));
const CommunicationLogPage = lazy(() => import('./pages/CommunicationLogPage'));
const TaskManagementPage = lazy(() => import('./pages/TaskManagementPage'));
const OwnerDashboard = lazy(() => import('./pages/OwnerDashboard'));
const StaffManagementPage = lazy(() => import('./pages/StaffManagementPage'));
const AuditLogPage = lazy(() => import('./pages/AuditLogPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const WalkinPage = lazy(() => import('./pages/WalkinPage'));
const LeadConfirmationPage = lazy(() => import('./pages/LeadConfirmationPage'));
const LeadInbox = lazy(() => import('./pages/LeadInbox'));
const StudioSettings = lazy(() => import('./pages/StudioSettings'));
const BusinessSettings = lazy(() => import('./pages/BusinessSettings'));
const AccountSettings = lazy(() => import('./pages/AccountSettings'));
const ProPlusSetup = lazy(() => import('./pages/ProPlusSetup'));
import LocationSelector from './components/LocationSelector';
const NewClientForm = lazy(() => import('./pages/NewClientForm'));
import { db, type UserRecord } from './db';
import { detectInitialLanguage, t, type AppLanguage } from './lib/i18n';
import { rebuildConsumableProfiles } from './lib/consumableRecommend';
import { getDaysSinceLastMarketCheck } from './lib/competitorData';
import { initAuditLogging } from './lib/auditLog';
import { THEME } from './lib/theme';

function PageLoading() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 48 }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        border: `3px solid ${THEME.border.default}`,
        borderTopColor: THEME.brand.primary,
        animation: 'inkflow-spin 0.6s linear infinite',
      }} />
      <style>{`@keyframes inkflow-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const RESPONSIVE_STYLE = `
@media (min-width: 768px) {
  .inkflow-content {
    max-width: 1024px !important;
    margin: 0 auto !important;
    width: 100% !important;
    padding: 0 24px !important;
  }
}
@media (min-width: 1280px) {
  .inkflow-content {
    max-width: 1200px !important;
  }
}
`;

export default function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [lang, setLang] = useState<AppLanguage>(detectInitialLanguage);
  const [dueFollowUpCount, setDueFollowUpCount] = useState(0);
  const [marketCheckDue, setMarketCheckDue] = useState(false);
  const [isDev, setIsDev] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.lang = detectInitialLanguage();
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleLangChange = (e: Event) => setLang((e as CustomEvent).detail as AppLanguage);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('inkflow_lang_change', handleLangChange);
    window.addEventListener('beforeinstallprompt', captureInstallEvent);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('inkflow_lang_change', handleLangChange);
      window.removeEventListener('beforeinstallprompt', captureInstallEvent);
    };
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('inkflow_current_user');
    if (stored) {
      setIsLoggedIn(true);
      initAuditLogging();
      rebuildConsumableProfiles();
      import('./lib/projectAccess').then(({ ensureDomainMigration }) => {
        void ensureDomainMigration();
      });
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
    const check = () => setMarketCheckDue(getDaysSinceLastMarketCheck() >= 30);
    check();
    const timer = window.setInterval(check, 60 * 1000);
    return () => window.clearInterval(timer);
  }, [location.pathname]);

  const tabs = [
    { path: '/today', label: t(lang, 'tab_today'), icon: Calendar },
    { path: '/clients', label: t(lang, 'tab_clients'), icon: Users },
    { path: '/me', label: t(lang, 'tab_me'), icon: User },
  ];
  const activeTab = tabs.find((t) => location.pathname.startsWith(t.path))?.path || '/today';

  const protectedPaths = ['/today', '/clients', '/me', '/client/', '/appointment/', '/waiver/', '/session/', '/inventory', '/referral', '/leads', '/deposit-policy', '/payment-settings', '/payment-history', '/supply-brands', '/supply-reviews', '/competitors', '/content-strategy', '/availability-settings', '/pos', '/invoices', '/invoice/', '/review-invites', '/notification-settings', '/shifts', '/close-out', '/communication-log', '/tasks', '/owner-dashboard', '/staff-management', '/audit-log', '/studio-settings', '/business-settings', '/account-settings', '/pro-plus-setup'];
  if (!isLoggedIn && protectedPaths.some(p => location.pathname.startsWith(p))) {
    navigate('/register', { replace: true });
  }

  return (
    <>
    <style>{RESPONSIVE_STYLE}</style>
    <ErrorBoundary>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: THEME.bg.app, color: THEME.text.primary }}>
        {!isOnline && <OfflineBanner lang={lang} />}
        {isLoggedIn && dueFollowUpCount > 0 && !location.pathname.startsWith('/leads') && (
          <div
            onClick={() => navigate('/leads')}
            style={{
              background: THEME.brand.danger,
              color: '#fee2e2',
              padding: '10px 14px',
              fontSize: 13,
              borderBottom: `1px solid ${THEME.brand.danger}`,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {dueFollowUpCount === 1
              ? t(lang, 'followup_banner_one')
              : t(lang, 'followup_banner_other').replace('{n}', String(dueFollowUpCount))}
          </div>
        )}
        {marketCheckDue && !location.pathname.startsWith('/competitors') && (
          <div
            onClick={() => navigate('/competitors')}
            style={{
              background: `linear-gradient(135deg, ${THEME.brand.success}, ${THEME.brand.info})`,
              color: THEME.text.primary,
              padding: '10px 14px',
              fontSize: 13,
              borderBottom: `1px solid ${THEME.border.default}`,
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontWeight: 600,
            }}
          >
            <span>{t(lang, 'market_check_banner')}</span>
            <span style={{ fontSize: 11, background: THEME.brand.success, padding: '2px 8px', borderRadius: 4, color: THEME.bg.app }}>{t(lang, 'market_check_view')}</span>
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto' }} className="inkflow-content">
          <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route path="/verification" element={<Verification />} />
            <Route path="/today" element={<Today />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/client/:id" element={<ClientDetail />} />
            <Route path="/client/new" element={<NewClientForm />} />
            <Route path="/appointment/new" element={<AppointmentForm />} />
            <Route path="/waiver/:appointmentId" element={<WaiverSign />} />
            <Route path="/public-waiver/:appointmentId" element={<PublicWaiverSign />} />
            <Route path="/waiver-manager" element={<WaiverManager />} />
            <Route path="/session/:appointmentId" element={<SessionPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/referral" element={<Referral />} />
            <Route path="/outreach" element={<Outreach />} />
            <Route path="/leads" element={<LeadsPage />} />
            <Route path="/leads/inbox" element={<LeadInbox />} />
            <Route path="/lead-confirm/:token" element={<LeadConfirmationPage />} />
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
            <Route path="/r/:slug" element={<ReferralShortPage />} />
            <Route path="/pos" element={<PosPage />} />
            <Route path="/pos-settings" element={<PosSettingsPage />} />
            <Route path="/locations" element={<LocationsPage />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/invoice/:id" element={<InvoiceDetail />} />
            <Route path="/invoice-settings" element={<InvoiceSettingsPage />} />
            <Route path="/notification-settings" element={<NotificationSettings />} />
            <Route path="/health-checklist" element={<HealthChecklistPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/checkin/:appointmentId" element={<CheckinPage />} />
            <Route path="/portal/:clientId" element={<ClientPortalPage />} />
            <Route path="/respond/:id" element={<AppointmentRespondPage />} />
            <Route path="/embed/:artistId" element={<EmbedBookingPage />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/artist-profile" element={<ArtistProfilePage />} />
            <Route path="/confirm/:artistId/:bookingId" element={<ConfirmBookingPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/review-invites" element={<ReviewInvitesPage />} />
            <Route path="/me" element={<Me />} />
            <Route path="/shifts" element={<ShiftSchedulingPage />} />
            <Route path="/close-out" element={<DailyCloseOutPage />} />
            <Route path="/communication-log" element={<CommunicationLogPage />} />
            <Route path="/tasks" element={<TaskManagementPage />} />
            <Route path="/owner-dashboard" element={<OwnerDashboard />} />
            <Route path="/staff-management" element={<StaffManagementPage />} />
            <Route path="/audit-log" element={<AuditLogPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/walkin/:artistId" element={<WalkinPage />} />
            <Route path="/studio-settings" element={<StudioSettings />} />
            <Route path="/business-settings" element={<BusinessSettings />} />
            <Route path="/account-settings" element={<AccountSettings />} />
            <Route path="/pro-plus-setup" element={<ProPlusSetup />} />
          </Routes>
          </Suspense>
        </div>
        {isLoggedIn && (
        <div style={{ borderTop: `1px solid ${THEME.border.soft}` }}>
          <LocationSelectorWrapper />
        </div>
      )}
      {isLoggedIn && <TabBar tabs={tabs} activeTab={activeTab} />}
      <InstallBanner />
      </div>
    </ErrorBoundary>
  </>
  );
}

function LocationSelectorWrapper() {
  const [user, setUser] = useState<UserRecord | null>(null);
  useEffect(() => {
    const stored = localStorage.getItem('inkflow_current_user');
    if (stored) { db.users.get(stored).then(u => setUser(u ?? null)); }
  }, []);
  return <LocationSelector user={user} />;
}

