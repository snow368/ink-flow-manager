import { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Palette, 
  Package, 
  Settings, 
  Search, 
  Bell, 
  Plus,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Menu,
  X,
  BarChart3,
  ArrowRight,
  Instagram,
  Youtube,
  Facebook,
  Share2,
  Globe,
  ExternalLink,
  Mic,
  MicOff,
  CheckCircle,
  Trophy,
  Target,
  Zap,
  Heart,
  Droplets,
  QrCode,
  Scan,
  Languages,
  PieChart as PieChartIcon,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Bot,
  ShieldCheck,
  FileText,
  Camera,
  Hand,
  Footprints,
  Minus,
  Flame,
  Eye,
  Box,
  AlertTriangle,
  ShieldAlert,
  User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { sessionManager } from './lib/session_manager';
import { ARTISTS, CLIENTS, APPOINTMENTS, DEMO_USERS, INVENTORY, RECENT_ACTIVITIES, SIGNED_WAIVERS, USER, TATTOO_PROJECTS, TRANSLATIONS, WAIVER_TEMPLATES } from './constants';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area } from 'recharts';
import { User, UserRole, TattooProject, Client, Appointment, SignedWaiverRecord, SocialDraft, SocialDraftStatus } from './types';
import { formatCurrency, generateWaiverDocument, getAppointmentFlow, getAppointmentWaiverSummary, getDailyPulse, getInventoryForecast, withResolvedWaiverStatus } from './lib/studio_logic';
import { fetchWaiverRecords, signWaiverDocuments } from './lib/waiver_api';
import { createSocialDraft, fetchSocialDrafts, updateSocialDraftStatus } from './lib/social_drafts_api';

const REVENUE_DATA = [
  { name: 'Mon', total: 1200 },
  { name: 'Tue', total: 2100 },
  { name: 'Wed', total: 1800 },
  { name: 'Thu', total: 2400 },
  { name: 'Fri', total: 3200 },
  { name: 'Sat', total: 4500 },
  { name: 'Sun', total: 1500 },
];

type View = 'dashboard' | 'calendar' | 'clients' | 'projects' | 'portfolio' | 'artists' | 'inventory' | 'waivers' | 'settings' | 'financial' | 'scan';

interface ConnectedAccount {
  id: string;
  platform: 'instagram' | 'youtube';
  ownerType: 'studio' | 'artist';
  ownerLabel: string;
  connected: boolean;
}

const INITIAL_CONNECTED_ACCOUNTS: ConnectedAccount[] = [
  { id: 'studio-instagram', platform: 'instagram', ownerType: 'studio', ownerLabel: 'InkFlow Studio', connected: true },
  { id: 'studio-youtube', platform: 'youtube', ownerType: 'studio', ownerLabel: 'InkFlow Studio', connected: true },
  { id: 'artist-1-instagram', platform: 'instagram', ownerType: 'artist', ownerLabel: 'Alex Thorne', connected: true },
  { id: 'artist-1-youtube', platform: 'youtube', ownerType: 'artist', ownerLabel: 'Alex Thorne', connected: false },
  { id: 'artist-2-instagram', platform: 'instagram', ownerType: 'artist', ownerLabel: 'Sarah Ink', connected: true },
  { id: 'artist-2-youtube', platform: 'youtube', ownerType: 'artist', ownerLabel: 'Sarah Ink', connected: true },
];

export default function App() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<User>(USER);
  const [studioName, setStudioName] = useState('InkFlow');
  const [studioTheme, setStudioTheme] = useState<'minimalist' | 'traditional' | 'cyberpunk'>('minimalist');
  const [isVoiceLogging, setIsVoiceLogging] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [activeSession, setActiveSession] = useState<{ appointmentId: string, projectId: string, startTime: string } | null>(null);
  const [language, setLanguage] = useState('en');
  const [waiverRecords, setWaiverRecords] = useState<SignedWaiverRecord[]>(SIGNED_WAIVERS);
  const [isWaiverLoading, setIsWaiverLoading] = useState(true);
  const [socialDrafts, setSocialDrafts] = useState<SocialDraft[]>([]);
  const [connectedAccounts] = useState<ConnectedAccount[]>(INITIAL_CONNECTED_ACCOUNTS);

  useEffect(() => {
    let isMounted = true;

    const loadWaiverRecords = async () => {
      try {
        const records = await fetchWaiverRecords();
        if (isMounted) {
          setWaiverRecords(records);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) {
          setIsWaiverLoading(false);
        }
      }
    };

    void loadWaiverRecords();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadSocialDrafts = async () => {
      try {
        const drafts = await fetchSocialDrafts();
        if (isMounted) {
          setSocialDrafts(drafts);
        }
      } catch (error) {
        console.error(error);
      }
    };

    void loadSocialDrafts();

    return () => {
      isMounted = false;
    };
  }, []);

  const appointments = withResolvedWaiverStatus(APPOINTMENTS, WAIVER_TEMPLATES, waiverRecords);

  const t = (key: string) => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['en']?.[key] || key;
  };

  const navItems = currentUser.role === 'artist'
    ? [
        { id: 'dashboard', label: 'Today', icon: LayoutDashboard },
        { id: 'calendar', label: t('calendar'), icon: Calendar },
        { id: 'clients', label: t('clients'), icon: Users },
        { id: 'projects', label: 'Projects', icon: Target },
        { id: 'portfolio', label: 'Portfolio', icon: Camera },
        { id: 'waivers', label: t('waivers'), icon: CheckCircle2 },
        { id: 'inventory', label: t('inventory'), icon: Package },
        { id: 'settings', label: t('settings'), icon: Settings },
      ]
    : [
        { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
        { id: 'calendar', label: t('calendar'), icon: Calendar },
        { id: 'clients', label: t('clients'), icon: Users },
        { id: 'artists', label: t('artists'), icon: Palette },
        { id: 'inventory', label: t('inventory'), icon: Package },
        { id: 'financial', label: t('financial'), icon: BarChart3 },
        { id: 'waivers', label: t('waivers'), icon: CheckCircle2 },
        { id: 'settings', label: t('settings'), icon: Settings },
      ];

  const handleUserChange = (userId: string) => {
    const nextUser = DEMO_USERS.find((item) => item.id === userId);
    if (nextUser) {
      setCurrentUser(nextUser);
    }
  };

  useEffect(() => {
    if (currentUser.role === 'artist' && (activeView === 'artists' || activeView === 'financial')) {
      setActiveView('dashboard');
    }
  }, [activeView, currentUser.role]);

  return (
    <div className={cn(
      "flex h-screen transition-colors duration-500 font-sans overflow-hidden",
      studioTheme === 'minimalist' ? "bg-neutral-50 text-neutral-900" :
      studioTheme === 'traditional' ? "bg-[#fdfbf7] text-[#2c1810]" :
      "bg-black text-white"
    )}>
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        className="bg-white border-r border-neutral-200 flex flex-col z-20"
      >
        <div className="p-6 flex items-center justify-between">
          <AnimatePresence mode="wait">
            {isSidebarOpen && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-2 font-bold text-xl tracking-tight"
              >
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">
                  <Palette size={20} />
                </div>
                <span>{studioName}</span>
              </motion.div>
            )}
          </AnimatePresence>
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>

        <div className="flex-1 px-4 space-y-2">
          <Button 
            onClick={() => setActiveView('scan')}
            className="w-full mb-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2 shadow-lg shadow-blue-500/20"
          >
            <Scan size={18} />
            {isSidebarOpen && <span className="font-bold">Scan Protocol</span>}
          </Button>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as View)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group",
                activeView === item.id 
                  ? "bg-black text-white shadow-lg shadow-black/10" 
                  : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
              )}
            >
              <item.icon size={20} />
              {isSidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-neutral-100">
          <div className={cn("flex items-center gap-3 p-2 rounded-xl", isSidebarOpen && "bg-neutral-50")}>
            <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
              <AvatarImage src={currentUser.avatar} />
              <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
            </Avatar>
            {isSidebarOpen && (
              <div className="flex flex-col">
                <span className="text-sm font-semibold">{currentUser.name}</span>
                <span className="text-xs text-neutral-500 capitalize">{currentUser.role}</span>
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-neutral-200 px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
              <Input 
                placeholder="Search appointments, clients, or artists..." 
                className="pl-10 bg-neutral-50 border-none focus-visible:ring-1 focus-visible:ring-black rounded-full h-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative text-neutral-500">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </Button>
            <Button className="bg-black hover:bg-neutral-800 text-white rounded-full gap-2 shadow-lg shadow-black/10">
              <Plus size={18} />
              <span>New Appointment</span>
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <ScrollArea className="flex-1 p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeView === 'dashboard' && (
                <DashboardView 
                  user={currentUser} 
                  appointments={appointments}
                  isVoiceLogging={isVoiceLogging}
                  setIsVoiceLogging={setIsVoiceLogging}
                  voiceTranscript={voiceTranscript}
                  setVoiceTranscript={setVoiceTranscript}
                  activeSession={activeSession}
                  setActiveSession={setActiveSession}
                  t={t}
                />
              )}
              {activeView === 'calendar' && <CalendarView theme={studioTheme} appointments={appointments} />}
              {activeView === 'clients' && <ClientsView user={currentUser} />}
              {activeView === 'artists' && <ArtistsView />}
              {activeView === 'projects' && <ProjectsView user={currentUser} />}
              {activeView === 'portfolio' && (
                <PortfolioView
                  user={currentUser}
                  socialDrafts={socialDrafts}
                  connectedAccounts={connectedAccounts}
                  onSocialDraftsChange={setSocialDrafts}
                />
              )}
              {activeView === 'inventory' && <InventoryView />}
              {activeView === 'financial' && <FinancialView user={currentUser} />}
              {activeView === 'scan' && <ScanView />}
              {activeView === 'waivers' && (
                <WaiversView
                  appointments={appointments}
                  waiverRecords={waiverRecords}
                  isLoading={isWaiverLoading}
                  onRecordsChange={setWaiverRecords}
                />
              )}
              {activeView === 'settings' && (
                <SettingsView 
                  user={currentUser} 
                  onUserChange={handleUserChange} 
                  studioName={studioName}
                  onStudioNameChange={setStudioName}
                  studioTheme={studioTheme}
                  onThemeChange={setStudioTheme}
                  language={language}
                  onLanguageChange={setLanguage}
                  connectedAccounts={connectedAccounts}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </ScrollArea>
      </main>
    </div>
  );
}

function DashboardView({ 
  user, 
  appointments,
  isVoiceLogging, 
  setIsVoiceLogging, 
  voiceTranscript, 
  setVoiceTranscript,
  activeSession,
  setActiveSession,
  t
}: { 
  user: User, 
  appointments: Appointment[],
  isVoiceLogging: boolean, 
  setIsVoiceLogging: (v: boolean) => void,
  voiceTranscript: string,
  setVoiceTranscript: (t: string) => void,
  activeSession: { appointmentId: string, projectId: string, startTime: string } | null,
  setActiveSession: (s: { appointmentId: string, projectId: string, startTime: string } | null) => void,
  t: (key: string) => string
}) {
  const isOwner = user.role === 'owner';
  const [aptFilter, setAptFilter] = useState<'day' | 'week' | 'month'>('day');
  const [showClientsDetail, setShowClientsDetail] = useState(false);
  const [showRevenueDetail, setShowRevenueDetail] = useState(false);
  const [showProjectsDetail, setShowProjectsDetail] = useState(false);
  const [sharingProject, setSharingProject] = useState<TattooProject | null>(null);
  const [postContent, setPostContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram']);
  const [isPosting, setIsPosting] = useState(false);
  const [isLinked, setIsLinked] = useState({ instagram: true, facebook: false, youtube: false });
  
  // Calculate stats based on filter
  const getAptStats = () => {
    const now = new Date();
    const filtered = appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      if (aptFilter === 'day') return apt.date === '2026-04-03';
      if (aptFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return aptDate >= weekAgo && aptDate <= now;
      }
      return aptDate.getMonth() === now.getMonth();
    });
    return filtered.length;
  };

  const clientSources = CLIENTS.reduce((acc, client) => {
    acc[client.source] = (acc[client.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sourceData = Object.entries(clientSources).map(([name, value]) => ({ name, value }));
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const stats = [
    { 
      label: t('netProfit'), 
      value: '$8,420', 
      change: '+15.2%', 
      icon: DollarSign, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50', 
      private: true,
      onClick: () => setShowRevenueDetail(true),
      insight: '80% of monthly goal reached. 2 more sessions to vacation!'
    },
    { 
      label: t('appointments'), 
      value: getAptStats().toString(), 
      change: '+8.2%', 
      icon: Calendar, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50', 
      private: false,
      filter: true
    },
    { 
      label: t('newClients'), 
      value: CLIENTS.length.toString(), 
      change: '+4.1%', 
      icon: Users, 
      color: 'text-purple-600', 
      bg: 'bg-purple-50', 
      private: false,
      onClick: () => setShowClientsDetail(true)
    },
    { 
      label: t('activeProjects'), 
      value: TATTOO_PROJECTS.length.toString(), 
      change: '+2.4%', 
      icon: TrendingUp, 
      color: 'text-orange-600', 
      bg: 'bg-orange-50', 
      private: false,
      onClick: () => setShowProjectsDetail(true)
    },
  ];

  const visibleStats = stats.filter(s => !s.private || isOwner);
  const activeAppointment = activeSession
    ? appointments.find((appointment) => appointment.id === activeSession.appointmentId) ?? null
    : null;
  const activeProject = activeAppointment
    ? TATTOO_PROJECTS.find((project) => project.id === activeAppointment.projectId) ?? null
    : null;
  const sessionOptions = appointments
    .filter((appointment) => appointment.status !== 'completed')
    .sort((left, right) => `${left.date} ${left.startTime}`.localeCompare(`${right.date} ${right.startTime}`));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">{t('overview')}</h1>
        <p className="text-neutral-500">{t('welcome')}, {user.name}! Here's what's happening today.</p>
      </div>

      {/* Active Session Card */}
      <Card className="border-none bg-black text-white shadow-2xl rounded-[2rem] overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Zap size={120} />
        </div>
        <CardContent className="p-8 relative z-10">
          {!activeSession ? (
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Ready to start?</h2>
                <p className="text-neutral-400 text-sm">Select a project to begin your session.</p>
              </div>
              <div className="flex gap-3">
                <select 
                  className="bg-neutral-800 border-none rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => {
                    const selectedAppointment = appointments.find((appointment) => appointment.id === e.target.value);
                    if (!selectedAppointment) return;
                    setActiveSession({
                      appointmentId: selectedAppointment.id,
                      projectId: selectedAppointment.projectId,
                      startTime: new Date().toISOString(),
                    });
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>Select Appointment</option>
                  {sessionOptions.map((appointment) => {
                    const project = TATTOO_PROJECTS.find((item) => item.id === appointment.projectId);
                    const client = CLIENTS.find((item) => item.id === appointment.clientId);
                    return (
                      <option key={appointment.id} value={appointment.id}>
                        {appointment.date} {appointment.startTime} - {project?.title ?? appointment.service} / {client?.name}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center animate-pulse">
                    <Zap size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Active Session</h2>
                    <p className="text-neutral-400 text-xs">
                      Project: {activeProject?.title} {activeAppointment ? `- ${activeAppointment.tattooStage}` : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-mono font-bold">02:45:12</p>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-widest">Elapsed Time</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Voice Logging */}
                <div className={cn(
                  "p-4 rounded-2xl transition-all duration-300 flex items-center gap-4",
                  isVoiceLogging ? "bg-blue-600 shadow-lg shadow-blue-500/20" : "bg-neutral-800"
                )}>
                  <button 
                    onClick={() => {
                      setIsVoiceLogging(!isVoiceLogging);
                      if (!isVoiceLogging) {
                        setVoiceTranscript('Listening for inventory commands...');
                        setTimeout(() => setVoiceTranscript('3RL Needle, Dynamic Black Ink logged.'), 2000);
                      }
                    }}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                      isVoiceLogging ? "bg-white text-blue-600" : "bg-neutral-700 text-white"
                    )}
                  >
                    {isVoiceLogging ? <Mic size={20} /> : <MicOff size={20} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase">Voice Logging</p>
                    <p className="text-sm truncate italic">{isVoiceLogging ? voiceTranscript : 'Tap to log supplies'}</p>
                  </div>
                </div>

                {/* One-Click Finish */}
                <Button 
                  onClick={() => {
                    // Play sound effect (simulated)
                    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                    audio.play().catch(() => {});
                    
                    // Trigger multi-action finish
                    setActiveSession(null);
                    setIsVoiceLogging(false);
                    // Show success toast
                    alert(`Precision Achieved! \n- ${activeProject?.title ?? 'Project'} session closed\n- Supplies deducted\n- Aftercare sent\n- Follow-up scheduled\n- Profit updated`);
                  }}
                  className="h-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl flex items-center justify-center gap-3 font-bold text-lg shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle size={24} />
                  <span>FINISH</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className={cn(
        "grid gap-6",
        visibleStats.length === 4 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 md:grid-cols-3"
      )}>
        {visibleStats.map((stat) => (
          <Card 
            key={stat.label} 
            className={cn(
              "border-none shadow-sm transition-all relative overflow-hidden",
              stat.onClick ? "cursor-pointer hover:shadow-lg hover:-translate-y-1" : ""
            )}
            onClick={stat.onClick}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-2 rounded-lg", stat.bg)}>
                  <stat.icon className={stat.color} size={24} />
                </div>
                <div className="flex items-center gap-2">
                  {stat.filter && (
                    <select 
                      className="text-[10px] font-bold uppercase bg-neutral-100 rounded px-2 py-1 outline-none border-none"
                      value={aptFilter}
                      onChange={(e) => {
                        e.stopPropagation();
                        setAptFilter(e.target.value as any);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="day">Day</option>
                      <option value="week">Week</option>
                      <option value="month">Month</option>
                    </select>
                  )}
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-none text-[10px]">
                    {stat.change}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-neutral-500">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
                {stat.insight && (
                  <p className="text-[10px] text-emerald-600 font-medium mt-2">{stat.insight}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* New Clients Detail Modal */}
      <AnimatePresence>
        {showClientsDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Client Acquisition</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowClientsDetail(false)}>
                  <X size={24} />
                </Button>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sourceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {sourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  <h3 className="font-bold text-neutral-500 uppercase text-xs tracking-widest">Source Breakdown</h3>
                  <div className="space-y-3">
                    {sourceData.map((item, idx) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                          <span className="text-sm font-medium capitalize">{item.name}</span>
                        </div>
                        <span className="text-sm font-bold">{item.value} clients</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-6 bg-neutral-50 border-t border-neutral-100">
                <p className="text-xs text-neutral-500 text-center">
                  Instagram remains your strongest channel, contributing to 40% of new bookings this month.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Active Projects Detail Modal */}
      <AnimatePresence>
        {showProjectsDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between shrink-0">
                <h2 className="text-2xl font-bold">Active Projects & Stages</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowProjectsDetail(false)}>
                  <X size={24} />
                </Button>
              </div>
              <ScrollArea className="flex-1 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {TATTOO_PROJECTS.filter(p => p.status === 'active').map((project) => (
                    <Card key={project.id} className="border-none bg-neutral-50 shadow-none overflow-hidden">
                      <div className="aspect-video relative">
                        <img 
                          src={project.images[project.images.length - 1]?.url || 'https://picsum.photos/seed/tattoo/800/450'} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-3 right-3">
                          <Button 
                            size="sm" 
                            className="bg-white/90 hover:bg-white text-black gap-2 rounded-full shadow-sm backdrop-blur-sm"
                            onClick={() => {
                              setSharingProject(project);
                              setPostContent(`Progress update on the "${project.title}"! Currently at the ${project.stages.find(s => s.status === 'current')?.name} stage. #tattoo #inkflow`);
                            }}
                          >
                            <Share2 size={14} />
                            <span>Share</span>
                          </Button>
                        </div>
                      </div>
                      <CardContent className="p-4 space-y-4">
                        <div>
                          <h3 className="font-bold text-lg">{project.title}</h3>
                          <p className="text-sm text-neutral-500 line-clamp-1">{project.description}</p>
                        </div>
                        <div className="space-y-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Project Timeline</p>
                          <div className="space-y-2">
                            {project.stages.map((stage, idx) => (
                              <div key={idx} className="flex items-center gap-3">
                                <div className={cn(
                                  "w-2 h-2 rounded-full",
                                  stage.status === 'completed' ? 'bg-emerald-500' :
                                  stage.status === 'current' ? 'bg-blue-500 animate-pulse' : 'bg-neutral-300'
                                )} />
                                <span className={cn(
                                  "text-xs font-medium",
                                  stage.status === 'current' ? 'text-blue-600 font-bold' : 'text-neutral-600'
                                )}>
                                  {stage.name}
                                </span>
                                {stage.status === 'current' && (
                                  <Badge className="bg-blue-50 text-blue-700 border-none text-[8px] h-4">Active</Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Social Media Post Modal */}
      <AnimatePresence>
        {sharingProject && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <Share2 size={20} />
                  </div>
                  <h2 className="text-xl font-bold">Post to Social Media</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSharingProject(null)}>
                  <X size={24} />
                </Button>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex gap-4 p-4 bg-neutral-50 rounded-2xl">
                  <img 
                    src={sharingProject.images[sharingProject.images.length - 1]?.url} 
                    className="w-20 h-20 rounded-xl object-cover shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-neutral-400 uppercase">Sharing Project</p>
                    <h4 className="font-bold truncate">{sharingProject.title}</h4>
                    <p className="text-xs text-neutral-500">Current Stage: {sharingProject.stages.find(s => s.status === 'current')?.name}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Post Content</label>
                  <textarea 
                    className="w-full h-32 p-4 bg-neutral-50 rounded-2xl border-none focus:ring-2 focus:ring-black outline-none text-sm resize-none"
                    placeholder="What's on your mind?"
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Select Platforms</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'instagram', icon: Instagram, color: 'text-pink-600', bg: 'bg-pink-50' },
                      { id: 'facebook', icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-50' },
                      { id: 'youtube', icon: Youtube, color: 'text-red-600', bg: 'bg-red-50' },
                    ].map((platform) => (
                      <button
                        key={platform.id}
                        onClick={() => {
                          if (isLinked[platform.id as keyof typeof isLinked]) {
                            setSelectedPlatforms(prev => 
                              prev.includes(platform.id) ? prev.filter(p => p !== platform.id) : [...prev, platform.id]
                            );
                          }
                        }}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all",
                          selectedPlatforms.includes(platform.id) ? "border-black bg-neutral-50" : "border-transparent bg-neutral-50 opacity-60",
                          !isLinked[platform.id as keyof typeof isLinked] && "grayscale cursor-not-allowed"
                        )}
                      >
                        <platform.icon className={platform.color} size={24} />
                        <span className="text-[10px] font-bold capitalize">{platform.id}</span>
                        {!isLinked[platform.id as keyof typeof isLinked] ? (
                          <span className="text-[8px] text-neutral-400">Link Account</span>
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1 rounded-xl gap-2"
                    onClick={() => {
                      // Simulate linking
                      setIsLinked(prev => ({ ...prev, facebook: true }));
                    }}
                  >
                    <Globe size={16} />
                    Link More
                  </Button>
                  <Button 
                    className="flex-[2] bg-black text-white rounded-xl gap-2 h-12"
                    disabled={selectedPlatforms.length === 0 || isPosting}
                    onClick={() => {
                      setIsPosting(true);
                      setTimeout(() => {
                        setIsPosting(false);
                        setSharingProject(null);
                        // Show success toast simulation
                      }, 2000);
                    }}
                  >
                    {isPosting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <ExternalLink size={18} />
                        <span>Post to {selectedPlatforms.length} Platforms</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showRevenueDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Revenue Breakdown</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowRevenueDetail(false)}>
                  <X size={24} />
                </Button>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-emerald-50 rounded-2xl">
                    <p className="text-xs font-bold text-emerald-600 uppercase">Services</p>
                    <p className="text-xl font-bold text-emerald-900">$9,200</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-2xl">
                    <p className="text-xs font-bold text-blue-600 uppercase">Deposits</p>
                    <p className="text-xl font-bold text-blue-900">$2,150</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-2xl">
                    <p className="text-xs font-bold text-purple-600 uppercase">Aftercare</p>
                    <p className="text-xl font-bold text-purple-900">$1,100</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-bold text-neutral-500 uppercase text-xs tracking-widest">Top Performing Artists</h3>
                  <div className="space-y-3">
                    {ARTISTS.map((artist, idx) => (
                      <div key={artist.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={artist.avatar} />
                            <AvatarFallback>{artist.name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="font-bold text-sm">{artist.name}</span>
                        </div>
                        <span className="font-bold text-emerald-600">${(4500 - idx * 1000).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart - Only for Owners */}
        {isOwner && (
          <Card className="lg:col-span-2 border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Weekly studio performance</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-none">
                  +12.5% vs last week
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={REVENUE_DATA}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#888', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#888', fontSize: 12 }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8f8f8' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                      {REVENUE_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 5 ? '#000' : '#e5e5e5'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Today's Schedule */}
        <Card className={cn("border-none shadow-sm", !isOwner && "lg:col-span-3")}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Today's Schedule</CardTitle>
              <CardDescription>5 appointments</CardDescription>
            </div>
            <Button variant="ghost" size="icon">
              <Calendar size={18} />
            </Button>
          </CardHeader>
          <CardContent>
            <div className={cn("space-y-4", !isOwner && "grid grid-cols-1 md:grid-cols-2 gap-4 space-y-0")}>
              {appointments.filter(a => a.date === '2026-04-03').slice(0, isOwner ? 4 : 8).map((apt) => {
                const artist = ARTISTS.find(a => a.id === apt.artistId);
                const client = CLIENTS.find(c => c.id === apt.clientId);
                return (
                  <div key={apt.id} className="flex items-center gap-3 p-3 rounded-xl border border-neutral-100 hover:bg-neutral-50 transition-colors">
                    <div className="flex flex-col items-center justify-center w-12 h-12 bg-neutral-100 rounded-lg text-neutral-600 shrink-0">
                      <span className="text-[10px] font-bold">{apt.startTime}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">{client?.name}</h4>
                      <p className="text-xs text-neutral-500 truncate">{artist?.name}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider shrink-0">
                      {apt.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
            <Button variant="ghost" className="w-full mt-4 text-xs text-neutral-500 hover:text-black">
              View Full Schedule
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <Card className={cn("border-none shadow-sm", isOwner ? "lg:col-span-2" : "lg:col-span-3")}>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from the studio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={cn("space-y-6", !isOwner && "grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 space-y-0")}>
              {RECENT_ACTIVITIES.filter(a => isOwner || a.type !== 'financial').map((activity) => (
                <div key={activity.id} className="flex gap-4">
                  <div className={cn(
                    "mt-1 w-2 h-2 rounded-full shrink-0",
                    activity.type === 'appointment' ? 'bg-blue-500' :
                    activity.type === 'financial' ? 'bg-emerald-500' :
                    activity.type === 'inventory' ? 'bg-orange-500' : 'bg-neutral-500'
                  )} />
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{activity.description}</p>
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <Clock size={12} />
                      <span>{format(new Date(activity.timestamp), 'HH:mm')}</span>
                      <span>•</span>
                      <span>{activity.user}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-6 text-neutral-500 hover:text-black">
              View All Activity
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FinancialView({ user }: { user: User }) {
  const isOwner = user.role === 'owner';
  
  const financialStats = [
    { label: 'Gross Revenue', value: '$12,450', change: '+12.5%', icon: ArrowUpRight, color: 'text-emerald-600' },
    { label: 'Expenses', value: '$4,030', change: '+2.1%', icon: ArrowDownRight, color: 'text-red-600' },
    { label: 'Net Profit', value: '$8,420', change: '+15.2%', icon: BarChart3, color: 'text-blue-600' },
    { label: 'Tax Reserve', value: '$2,490', change: '20%', icon: ShieldCheck, color: 'text-purple-600' },
  ];

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <ShieldCheck size={64} className="text-neutral-300" />
        <h2 className="text-xl font-bold">Access Restricted</h2>
        <p className="text-neutral-500">Only studio owners can view financial reports.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
        <p className="text-neutral-500">Track revenue, expenses, and tax obligations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {financialStats.map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-2 rounded-lg bg-neutral-50")}>
                  <stat.icon className={stat.color} size={24} />
                </div>
                <Badge variant="secondary" className="bg-neutral-100 border-none text-[10px]">
                  {stat.change}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-neutral-500">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader>
            <CardTitle>Revenue vs Expenses</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_DATA}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} />
                <Tooltip />
                <Area type="monotone" dataKey="total" stroke="#000" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Rent', value: 2000 },
                    { name: 'Supplies', value: 1200 },
                    { name: 'Marketing', value: 500 },
                    { name: 'Insurance', value: 330 },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {['#000', '#333', '#666', '#999'].map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {[
                { name: 'Rent', value: '$2,000', color: 'bg-black' },
                { name: 'Supplies', value: '$1,200', color: 'bg-neutral-700' },
                { name: 'Marketing', value: '$500', color: 'bg-neutral-500' },
                { name: 'Insurance', value: '$330', color: 'bg-neutral-300' },
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", item.color)} />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ScanView() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  const startScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScanResult('Protocol #8821 Verified: John Doe - Full Sleeve Waiver Signed.');
    }, 3000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Scan Protocol</h1>
        <p className="text-neutral-500">Scan QR codes to verify waivers and protocols instantly.</p>
      </div>

      <div className="relative w-64 h-64 bg-neutral-100 rounded-3xl border-4 border-neutral-200 flex items-center justify-center overflow-hidden">
        {isScanning ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/5">
            <div className="w-full h-1 bg-blue-500 absolute top-0 animate-scan-line" />
            <Camera size={48} className="text-neutral-400 animate-pulse" />
          </div>
        ) : scanResult ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle size={32} />
            </div>
            <p className="text-sm font-medium">{scanResult}</p>
            <Button variant="outline" size="sm" onClick={() => setScanResult(null)}>Scan Another</Button>
          </div>
        ) : (
          <QrCode size={80} className="text-neutral-300" />
        )}
      </div>

      {!isScanning && !scanResult && (
        <Button onClick={startScan} className="bg-black text-white gap-2 px-8 py-6 rounded-2xl text-lg font-bold">
          <Scan size={24} />
          <span>Start Scanning</span>
        </Button>
      )}
    </div>
  );
}

function WaiversView({
  appointments,
  waiverRecords,
  isLoading,
  onRecordsChange,
}: {
  appointments: Appointment[],
  waiverRecords: SignedWaiverRecord[],
  isLoading: boolean,
  onRecordsChange: (records: SignedWaiverRecord[]) => void,
}) {
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [signerName, setSignerName] = useState('');
  const [signature, setSignature] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const selectedAppointment = appointments.find((appointment) => appointment.id === selectedAppointmentId) ?? null;
  const selectedClient = selectedAppointment ? CLIENTS.find((client) => client.id === selectedAppointment.clientId) ?? null : null;
  const selectedArtist = selectedAppointment ? ARTISTS.find((artist) => artist.id === selectedAppointment.artistId) ?? null : null;
  const selectedSummary = selectedAppointment ? getAppointmentWaiverSummary(selectedAppointment, WAIVER_TEMPLATES, waiverRecords) : null;
  const generatedDocument = selectedAppointment && selectedClient && selectedSummary
    ? generateWaiverDocument(selectedAppointment, selectedClient, selectedSummary.requiredTemplates, selectedArtist?.name)
    : null;

  const openSigningFlow = (appointment: Appointment) => {
    const client = CLIENTS.find((item) => item.id === appointment.clientId);
    setSelectedAppointmentId(appointment.id);
    setSignerName(client?.name ?? '');
    setSignature(client?.name ?? '');
  };

  const handleSign = async () => {
    if (!selectedAppointment || !selectedClient || !selectedSummary || !generatedDocument) {
      return;
    }

    setIsSaving(true);
    try {
      const records = await signWaiverDocuments({
        appointmentId: selectedAppointment.id,
        clientId: selectedClient.id,
        templateIds: selectedSummary.missingTemplates.map((template) => template.id),
        signerName,
        signature,
        signedText: generatedDocument.body,
      });

      onRecordsChange(records);
      setSelectedAppointmentId(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save waiver.');
    } finally {
      setIsSaving(false);
    }
  };

  const templateStats = WAIVER_TEMPLATES.map((template) => ({
    ...template,
    signed: waiverRecords.filter((record) => record.templateId === template.id && record.status === 'signed').length,
    pending: waiverRecords.filter((record) => record.templateId === template.id && record.status === 'pending').length,
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Digital Waivers</h1>
          <p className="text-neutral-500">Choose an appointment, generate the legal packet, and save the signed waiver to the local server.</p>
        </div>
        <Badge className="bg-black text-white border-none px-3 py-1">Server sync</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {templateStats.map((waiver) => (
          <Card key={waiver.id} className="border-none shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-neutral-100 rounded-lg">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-bold">{waiver.title}</h3>
                  <p className="text-xs text-neutral-500">{waiver.description}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-neutral-50 rounded-xl">
                  <p className="text-[10px] text-neutral-500 uppercase font-bold">Signed</p>
                  <p className="text-lg font-bold">{waiver.signed}</p>
                </div>
                <div className="p-3 bg-neutral-50 rounded-xl">
                  <p className="text-[10px] text-neutral-500 uppercase font-bold">Pending</p>
                  <p className="text-lg font-bold text-orange-600">{waiver.pending}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] text-neutral-400">Updated: {waiver.lastUpdated}</span>
                <Badge variant="outline" className="text-[10px] uppercase">{waiver.appliesTo}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle>Appointment Waiver Queue</CardTitle>
          <CardDescription>
            {isLoading ? 'Loading server records...' : 'Select an appointment to generate the packet for the client.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Appointment</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Required Documents</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((appointment) => {
                const client = CLIENTS.find((item) => item.id === appointment.clientId);
                const project = TATTOO_PROJECTS.find((item) => item.id === appointment.projectId);
                const summary = getAppointmentWaiverSummary(appointment, WAIVER_TEMPLATES, waiverRecords);
                return (
                  <TableRow key={appointment.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold">{appointment.date}</span>
                        <span className="text-xs text-neutral-500">{appointment.startTime} - {project?.title ?? appointment.service}</span>
                      </div>
                    </TableCell>
                    <TableCell>{client?.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {summary.requiredTemplates.map((template) => (
                          <Badge key={template.id} variant="outline">{template.title}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {summary.isReady ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-none">Signed</Badge>
                      ) : (
                        <Badge className="bg-orange-100 text-orange-700 border-none">
                          {summary.missingTemplates.length} missing
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => openSigningFlow(appointment)}>
                        {summary.isReady ? 'Review Packet' : 'Open Waiver'}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedAppointment} onOpenChange={(open) => !open && setSelectedAppointmentId(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          {selectedAppointment && selectedClient && selectedSummary && generatedDocument && (
            <>
              <DialogHeader className="p-6 pb-0">
                <DialogTitle>{generatedDocument.title}</DialogTitle>
                <DialogDescription>
                  Appointment #{selectedAppointment.id} for {selectedClient.name}. Missing documents: {selectedSummary.missingTemplates.length || 0}.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-0">
                <div className="p-6 border-r border-neutral-100 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {selectedSummary.requiredTemplates.map((template) => (
                      <Badge key={template.id} variant="outline">{template.title}</Badge>
                    ))}
                  </div>
                  <textarea
                    readOnly
                    value={generatedDocument.body}
                    className="w-full min-h-[320px] rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm leading-6 outline-none"
                  />
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Client name</label>
                    <Input value={signerName} onChange={(e) => setSignerName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Signature</label>
                    <Input value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Type full legal name" />
                  </div>
                  <div className="p-4 rounded-2xl bg-neutral-50 space-y-2 text-xs text-neutral-600">
                    <p className="font-semibold text-neutral-900">Server save target</p>
                    <p>`data/waiver-records.json`</p>
                    <p>Once signed, this appointment becomes waiver-ready immediately across the app.</p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedAppointmentId(null)}>Cancel</Button>
                <Button
                  onClick={handleSign}
                  disabled={isSaving || !signerName.trim() || !signature.trim() || selectedSummary.missingTemplates.length === 0}
                >
                  {selectedSummary.missingTemplates.length === 0 ? 'Already Signed' : isSaving ? 'Saving...' : 'Sign And Save'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
function CalendarView({ theme, appointments }: { theme: 'minimalist' | 'traditional' | 'cyberpunk', appointments: Appointment[] }) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [calendarMode, setCalendarMode] = useState<'day' | 'month'>('month');

  const selectedDateStr = date ? format(date, 'yyyy-MM-dd') : '';
  const dayAppointments = appointments.filter(apt => apt.date === selectedDateStr);
  const pulse = getDailyPulse(date ?? new Date(), appointments, INVENTORY, CLIENTS);
  
  const morningApts = dayAppointments.filter(apt => {
    const hour = parseInt(apt.startTime.split(':')[0]);
    return hour < 14;
  });
  
  const afternoonApts = dayAppointments.filter(apt => {
    const hour = parseInt(apt.startTime.split(':')[0]);
    return hour >= 14;
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-neutral-500">Manage your shop's schedule and artist availability.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={calendarMode === 'day' ? 'default' : 'outline'} 
            onClick={() => setCalendarMode('day')}
            className={cn(calendarMode === 'day' && "bg-black text-white")}
          >
            Day
          </Button>
          <Button 
            variant={calendarMode === 'month' ? 'default' : 'outline'} 
            onClick={() => setCalendarMode('month')}
            className={cn(calendarMode === 'month' && "bg-black text-white")}
          >
            Month
          </Button>
        </div>
      </div>

      {/* Daily Pulse */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-4">
          <div className="p-2 bg-emerald-500 text-white rounded-xl">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Today's Pulse</p>
            <p className="text-lg font-bold text-emerald-900">{formatCurrency(pulse.expectedRevenue)} Expected</p>
          </div>
        </div>
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-4">
          <div className="p-2 bg-blue-500 text-white rounded-xl">
            <Package size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Inventory Alert</p>
            <p className="text-sm font-medium text-blue-900">
              {pulse.lowStockItems[0] ? `${pulse.lowStockItems[0].name} low. Restock suggested.` : 'No critical stockouts today.'}
            </p>
          </div>
        </div>
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-4">
          <div className="p-2 bg-amber-500 text-white rounded-xl">
            <ShieldAlert size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Safety Check</p>
            <p className="text-sm font-medium text-amber-900">{pulse.allergyCount} Clients with allergies today.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <Card className="border-none shadow-sm h-fit">
          <CardContent className="p-4">
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={(d) => {
                setDate(d);
                setCalendarMode('day');
              }}
              className="rounded-md border-none"
            />
            <div className="mt-6 space-y-4">
              <h4 className="text-sm font-semibold px-2">Artists Today</h4>
              {ARTISTS.map(artist => (
                <div key={artist.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-50">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={artist.avatar} />
                      <AvatarFallback>{artist.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{artist.name}</span>
                  </div>
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    artist.status === 'available' ? 'bg-emerald-500' :
                    artist.status === 'busy' ? 'bg-red-500' : 'bg-neutral-300'
                  )} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none shadow-sm min-h-[600px]">
          <CardHeader className="border-b border-neutral-100">
            <div className="flex items-center justify-between">
              <CardTitle>
                {calendarMode === 'month' 
                  ? (date ? format(date, 'MMMM yyyy') : 'Select a date')
                  : (date ? format(date, 'EEEE, MMMM do') : 'Select a date')
                }
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Plus size={20} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {calendarMode === 'month' ? (
              <>
                <div className="grid grid-cols-7 border-b border-neutral-100 bg-neutral-50/50">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="p-3 text-center text-xs font-bold text-neutral-400 uppercase tracking-wider">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 grid-rows-5 h-[500px]">
                  {Array.from({ length: 35 }).map((_, i) => {
                    const dayNum = i - 2; // Mock calendar start
                    const isToday = dayNum === 3;
                    const dateStr = `2026-04-${dayNum.toString().padStart(2, '0')}`;
                    const apts = appointments.filter(a => a.date === dateStr);
                    
                    return (
                      <div key={i} className={cn(
                        "border-r border-b border-neutral-100 p-2 hover:bg-neutral-50 transition-colors group relative",
                        dayNum <= 0 && "bg-neutral-50/30 text-neutral-300"
                      )}>
                        <span className={cn(
                          "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                          isToday && "bg-black text-white"
                         )}>
                          {dayNum > 0 && dayNum <= 31 ? dayNum : ''}
                        </span>
                        <div className="mt-2 space-y-1">
                          {apts.map(apt => (
                            <div key={apt.id} className="space-y-0.5">
                              <div className="bg-blue-100 text-blue-700 text-[10px] p-1 rounded font-medium truncate">
                                {apt.startTime} - {CLIENTS.find(c => c.id === apt.clientId)?.name}
                              </div>
                              <div className="bg-neutral-100 text-neutral-400 text-[8px] px-1 rounded italic">
                                +30m Buffer
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 h-[600px]">
                {/* Morning Session */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
                    <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg">
                      <Clock size={16} />
                    </div>
                    <h3 className="font-bold text-lg">Morning Session</h3>
                    <Badge variant="secondary" className="ml-auto">{morningApts.length} Appts</Badge>
                  </div>
                  <div className="space-y-4">
                    {morningApts.length > 0 ? morningApts.map(apt => (
                      <div key={apt.id} className="space-y-2">
                        <AppointmentCard apt={apt} theme={theme} />
                        <div className={cn(
                          "mx-4 p-2 border border-dashed rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest",
                          theme === 'minimalist' ? "bg-neutral-50 border-neutral-200 text-neutral-400" :
                          theme === 'traditional' ? "bg-[#fdfbf7] border-[#2c1810]/20 text-[#2c1810]/40" :
                          "bg-blue-500/10 border-blue-500/30 text-blue-400"
                        )}>
                          <Droplets size={12} />
                          Sanitization & Prep Buffer (30m)
                        </div>
                      </div>
                    )) : (
                      <div className="h-32 border-2 border-dashed border-neutral-100 rounded-2xl flex items-center justify-center text-neutral-400 text-sm">
                        No morning appointments
                      </div>
                    )}
                  </div>
                </div>

                {/* Afternoon Session */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                      <Clock size={16} />
                    </div>
                    <h3 className="font-bold text-lg">Afternoon Session</h3>
                    <Badge variant="secondary" className="ml-auto">{afternoonApts.length} Appts</Badge>
                  </div>
                  <div className="space-y-4">
                    {afternoonApts.length > 0 ? afternoonApts.map(apt => (
                      <div key={apt.id} className="space-y-2">
                        <AppointmentCard apt={apt} theme={theme} />
                        <div className={cn(
                          "mx-4 p-2 border border-dashed rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest",
                          theme === 'minimalist' ? "bg-neutral-50 border-neutral-200 text-neutral-400" :
                          theme === 'traditional' ? "bg-[#fdfbf7] border-[#2c1810]/20 text-[#2c1810]/40" :
                          "bg-blue-500/10 border-blue-500/30 text-blue-400"
                        )}>
                          <Droplets size={12} />
                          Sanitization & Prep Buffer (30m)
                        </div>
                      </div>
                    )) : (
                      <div className="h-32 border-2 border-dashed border-neutral-100 rounded-2xl flex items-center justify-center text-neutral-400 text-sm">
                        No afternoon appointments
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface AppointmentCardProps {
  apt: Appointment;
  theme?: 'minimalist' | 'traditional' | 'cyberpunk';
  key?: string | number;
}

function AppointmentCard({ apt, theme = 'minimalist' }: AppointmentCardProps) {
  const artist = ARTISTS.find(a => a.id === apt.artistId);
  const client = CLIENTS.find(c => c.id === apt.clientId);
  const project = TATTOO_PROJECTS.find((item) => item.id === apt.projectId);
  const flow = getAppointmentFlow(apt, client);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unconfirmed': return 'bg-neutral-100 text-neutral-500 border-neutral-200';
      case 'deposit_paid': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'ready': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'vip': return 'bg-amber-50 text-amber-600 border-amber-100 border-2 shadow-sm';
      case 'completed': return 'bg-neutral-900 text-white border-none';
      default: return 'bg-neutral-100 text-neutral-500';
    }
  };

  const getBodyPartIcon = (part: string) => {
    switch (part) {
      case 'arm': return <Hand size={14} />;
      case 'leg': return <Footprints size={14} />;
      case 'back': return <UserIcon size={14} />;
      case 'chest': return <Heart size={14} />;
      default: return <UserIcon size={14} />;
    }
  };

  const getStyleIcon = (style: string) => {
    switch (style) {
      case 'minimalist': return <Minus size={14} />;
      case 'traditional': return <Flame size={14} />;
      case 'realism': return <Eye size={14} />;
      case 'geometric': return <Box size={14} />;
      default: return <Sparkles size={14} />;
    }
  };

  const getFlowTone = () => {
    switch (flow.readiness) {
      case 'blocked':
        return 'bg-red-50 text-red-700 border-red-100';
      case 'attention':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'ready':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      default:
        return 'bg-neutral-900 text-white border-neutral-900';
    }
  };

  return (
    <div className={cn(
      "p-4 rounded-2xl border transition-all relative overflow-hidden",
      theme === 'minimalist' ? "bg-white border-neutral-100 hover:shadow-md" :
      theme === 'traditional' ? "bg-[#fdfbf7] border-[#2c1810]/20 border-2 shadow-[4px_4px_0px_0px_rgba(44,24,16,0.1)]" :
      "bg-neutral-900 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]",
      apt.status === 'vip' && theme !== 'cyberpunk' ? 'border-amber-200 shadow-amber-100/50 shadow-lg' : ''
    )}>
      {/* Theme Specific Accents */}
      {theme === 'cyberpunk' && (
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
      )}
      {theme === 'traditional' && (
        <div className="absolute -top-4 -left-4 w-12 h-12 border-4 border-[#2c1810]/5 rounded-full" />
      )}

      {/* Safety Alerts */}
      <div className="absolute top-0 right-0 flex gap-1 p-2">
        {apt.hasAllergies && (
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className={cn(
              "p-1 rounded-full",
              theme === 'cyberpunk' ? "bg-red-500/20 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-red-100 text-red-600"
            )}
          >
            <ShieldAlert size={12} />
          </motion.div>
        )}
        {apt.painLevel >= 7 && (
          <div className={cn(
            "p-1 rounded-full",
            theme === 'cyberpunk' ? "bg-amber-500/20 text-amber-500" : "bg-amber-100 text-amber-600"
          )}>
            <AlertTriangle size={12} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge className={cn(
            "border-none font-mono",
            theme === 'cyberpunk' ? "bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]" : "bg-black text-white"
          )}>{apt.startTime}</Badge>
          <span className={cn(
            "text-[10px] font-bold uppercase",
            theme === 'cyberpunk' ? "text-blue-400/50" : "text-neutral-400"
          )}>to</span>
          <Badge variant="outline" className={cn(
            "font-mono",
            theme === 'cyberpunk' ? "border-blue-500/30 text-blue-400" : ""
          )}>{apt.endTime}</Badge>
        </div>
        <Badge className={cn("capitalize border", getStatusColor(apt.status))}>
          {apt.status.replace('_', ' ')}
        </Badge>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <Badge variant="outline" className={cn("border", getFlowTone())}>
          {flow.readiness}
        </Badge>
        {flow.blockers.slice(0, 1).map((item) => (
          <Badge key={item} variant="outline" className="border-red-100 bg-red-50 text-red-700">
            {item}
          </Badge>
        ))}
        {!flow.blockers.length && flow.warnings.slice(0, 1).map((item) => (
          <Badge key={item} variant="outline" className="border-amber-100 bg-amber-50 text-amber-700">
            {item}
          </Badge>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className={cn(
            "h-10 w-10 border-2 shadow-sm",
            theme === 'cyberpunk' ? "border-blue-500/50" : "border-white"
          )}>
            <AvatarImage src={client?.avatar || `https://i.pravatar.cc/150?u=${client?.id}`} />
            <AvatarFallback>{client?.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h4 className={cn(
              "font-bold flex items-center gap-2",
              theme === 'cyberpunk' ? "text-blue-100" : ""
            )}>
              {client?.name}
              {apt.status === 'vip' && <Sparkles size={14} className="text-amber-500" />}
            </h4>
            <p className={cn("text-[10px] mt-0.5", theme === 'cyberpunk' ? "text-blue-300/70" : "text-neutral-400")}>
              {project?.title ?? apt.service}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn(
                "text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded",
                theme === 'cyberpunk' ? "bg-blue-500/10 text-blue-400" : "bg-neutral-50 text-neutral-500"
              )}>
                {getBodyPartIcon(apt.bodyPart)}
                {apt.bodyPart}
              </span>
              <span className={cn(
                "text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded",
                theme === 'cyberpunk' ? "bg-purple-500/10 text-purple-400" : "bg-neutral-50 text-neutral-500"
              )}>
                {getStyleIcon(apt.tattooStyle)}
                {apt.tattooStyle}
              </span>
              <Badge variant="secondary" className={cn(
                "text-[8px] h-4 px-1 uppercase tracking-tighter",
                theme === 'cyberpunk' ? "bg-blue-900/50 text-blue-300 border border-blue-500/30" : ""
              )}>
                {apt.tattooStage}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <p className={cn(
              "text-[8px] font-bold uppercase tracking-wider",
              theme === 'cyberpunk' ? "text-blue-400/50" : "text-neutral-400"
            )}>Artist</p>
            <p className={cn(
              "text-[10px] font-semibold",
              theme === 'cyberpunk' ? "text-blue-200" : ""
            )}>{artist?.name}</p>
          </div>
          <Avatar className={cn(
            "h-7 w-7 border",
            theme === 'cyberpunk' ? "border-blue-500/30" : "border-neutral-100"
          )}>
            <AvatarImage src={artist?.avatar} />
            <AvatarFallback>{artist?.name[0]}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Elite/Cyberpunk Data Curves (Simulated) */}
      {theme === 'cyberpunk' && (
        <div className="mt-3 h-8 w-full bg-blue-500/5 rounded-lg border border-blue-500/10 flex items-end gap-0.5 p-1 overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div 
              key={i} 
              className="flex-1 bg-blue-500/30 rounded-t-sm" 
              style={{ height: `${Math.random() * 100}%` }} 
            />
          ))}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[8px] font-mono text-blue-400/50 uppercase tracking-widest">Skin Sensitivity Index: 0.42</span>
          </div>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          disabled={flow.readiness === 'blocked'}
          className={cn(
            "flex-1 text-[10px] h-8 rounded-xl transition-colors",
            theme === 'cyberpunk' ? "bg-blue-600 text-white border-none hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)]" : "hover:bg-black hover:text-white",
            flow.readiness === 'blocked' && "cursor-not-allowed opacity-50 hover:bg-transparent hover:text-current"
          )}
          onClick={() => {
            try {
              sessionManager.initializeSession(apt);
              const notes = flow.recommendations.slice(0, 2).join('\n- ');
              alert(`Session started! Presets loaded and media tagging active.${notes ? `\n- ${notes}` : ''}`);
            } catch (e: any) {
              alert(e.message);
            }
          }}
        >
          {apt.status === 'completed' ? 'View Details' : flow.readiness === 'blocked' ? 'Resolve Blockers' : 'Start Session'}
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className={cn(
            "flex-1 text-[10px] h-8 rounded-xl",
            theme === 'cyberpunk' ? "bg-neutral-800 text-blue-400 border-blue-500/30 hover:bg-neutral-700" : "text-orange-600 border-orange-100 hover:bg-orange-50"
          )}
          onClick={() => {
            const fee = 50;
            alert(`Rescheduling Fee: $${fee}\nAI has calculated the best available slots for the next 30 days. Link sent to client.`);
          }}
        >
          Reschedule
        </Button>
      </div>
    </div>
  );
}

function ClientsView({ user }: { user: User }) {
  const isRestrictedArtist = user.role === 'artist';
  const [selectedArtistId, setSelectedArtistId] = useState<string>(isRestrictedArtist ? user.artistId ?? 'all' : 'all');
  const [selectedProject, setSelectedProject] = useState<TattooProject | null>(null);
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    setSelectedArtistId(isRestrictedArtist ? user.artistId ?? 'all' : 'all');
  }, [isRestrictedArtist, user.artistId]);

  const visibleArtistId = isRestrictedArtist
    ? user.artistId ?? selectedArtistId
    : selectedArtistId;

  const filteredClients = CLIENTS.filter(client => {
    if (isRestrictedArtist) {
      return client.assignedArtistId === visibleArtistId;
    }

    return selectedArtistId === 'all' || client.assignedArtistId === selectedArtistId;
  });
  const getProjectAppointments = (projectId: string) =>
    APPOINTMENTS
      .filter((appointment) => appointment.projectId === projectId)
      .sort((left, right) => `${left.date} ${left.startTime}`.localeCompare(`${right.date} ${right.startTime}`));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-neutral-500">
            {isRestrictedArtist
              ? 'View your assigned clients and ongoing tattoo projects.'
              : 'View all studio clients, their assigned artists, and project progress.'}
          </p>
        </div>
        <div className="flex gap-3">
          {!isRestrictedArtist ? (
            <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-full px-4 py-1">
              <Palette size={16} className="text-neutral-400" />
              <select 
                className="bg-transparent border-none text-sm font-medium focus:ring-0 outline-none"
                value={selectedArtistId}
                onChange={(e) => setSelectedArtistId(e.target.value)}
              >
                <option value="all">All Artists</option>
                {ARTISTS.map(artist => (
                  <option key={artist.id} value={artist.id}>{artist.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <Badge className="bg-neutral-100 text-neutral-700 border-none px-4 py-2 rounded-full">
              My Clients Only
            </Badge>
          )}
          <Button className="bg-black text-white gap-2 rounded-full">
            <Plus size={18} />
            <span>Add Client</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => {
          const project = TATTOO_PROJECTS.find(p => p.clientId === client.id);
          const artist = ARTISTS.find(a => a.id === client.assignedArtistId);
          
          return (
            <Card key={client.id} className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-all">
              <div className="aspect-video bg-neutral-100 relative overflow-hidden">
                {project?.images[0] ? (
                  <img 
                    src={project.images[project.images.length - 1].url} 
                    alt="Latest Tattoo" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400">
                    <Palette size={32} />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <Badge className="bg-white/90 backdrop-blur-sm text-black border-none">
                    {project?.status || 'No Active Project'}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold">{client.name}</h3>
                    <p className="text-xs text-neutral-500">{client.email}</p>
                    {!isRestrictedArtist && (
                      <p className="text-[10px] text-neutral-400 mt-1">Assigned Artist: {artist?.name ?? 'Unassigned'}</p>
                    )}
                  </div>
                  <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                    <AvatarImage src={artist?.avatar} />
                    <AvatarFallback>{artist?.name[0]}</AvatarFallback>
                  </Avatar>
                </div>

                {project && (
                  <div className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-neutral-500">Current Stage</span>
                        <span className="text-black">{project.stages.find(s => s.status === 'current')?.name}</span>
                      </div>
                      <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-black rounded-full" 
                          style={{ width: `${(project.stages.filter(s => s.status === 'completed').length / project.stages.length) * 100}%` }}
                        />
                      </div>
                    </div>

                    {client.skinProfile && (
                      <div className="p-3 bg-neutral-50 rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                          <Heart size={12} className="text-red-500" />
                          <span>Skin Profile</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-neutral-500">Pain Level: {client.skinProfile.painLevel}/10</span>
                          <span className="text-neutral-500">Absorption: {client.skinProfile.absorption}</span>
                        </div>
                        {client.skinProfile.allergies.length > 0 && (
                          <div className="flex gap-1">
                            {client.skinProfile.allergies.map(a => (
                              <Badge key={a} className="bg-red-50 text-red-700 border-none text-[8px] h-4">{a} Allergy</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <Button 
                      variant="outline" 
                      className="w-full rounded-xl text-xs font-semibold"
                      onClick={() => setSelectedProject(project)}
                    >
                      View Project Details
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Project Detail Modal */}
      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{selectedProject.title}</h2>
                  <p className="text-sm text-neutral-500">{CLIENTS.find(c => c.id === selectedProject.clientId)?.name}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedProject(null)}>
                  <X size={24} />
                </Button>
              </div>
              
              <ScrollArea className="flex-1">
                <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {/* Left: Gallery & Stages */}
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-neutral-400">Project Gallery</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedProject.images.map(img => (
                          <div 
                            key={img.id} 
                            className="group relative aspect-square rounded-2xl overflow-hidden bg-neutral-100 cursor-pointer"
                            onClick={() => setActiveLightboxImage(img.url)}
                          >
                            <img src={img.url} alt={img.stage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                              <span className="text-[10px] text-white font-medium">{img.stage}</span>
                            </div>
                          </div>
                        ))}
                        <button className="aspect-square rounded-2xl border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center gap-2 text-neutral-400 hover:border-black hover:text-black transition-all">
                          <Plus size={24} />
                          <span className="text-xs font-medium">Add Photo</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-neutral-400">Process Timeline</h4>
                      <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-neutral-100">
                        {selectedProject.stages.map((stage, idx) => (
                          <div key={idx} className="flex gap-4 relative">
                            <div className={cn(
                              "w-6 h-6 rounded-full border-4 border-white shadow-sm z-10 flex items-center justify-center",
                              stage.status === 'completed' ? "bg-black" : 
                              stage.status === 'current' ? "bg-blue-500" : "bg-neutral-200"
                            )}>
                              {stage.status === 'completed' && <CheckCircle2 size={10} className="text-white" />}
                            </div>
                            <div className="flex-1">
                              <p className={cn("text-sm font-bold", stage.status === 'upcoming' && "text-neutral-400")}>{stage.name}</p>
                              <p className="text-xs text-neutral-500">{stage.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {CLIENTS.find(c => c.id === selectedProject.clientId)?.inkHistory && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-neutral-400">Ink History</h4>
                        <div className="space-y-3">
                          {CLIENTS.find(c => c.id === selectedProject.clientId)?.inkHistory?.map((ink, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
                              <div className="p-2 bg-white rounded-lg">
                                <Droplets size={16} className="text-blue-500" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-bold">{ink.brand} {ink.color}</p>
                                <p className="text-[10px] text-neutral-500">{ink.date} • {ink.projectTitle}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-neutral-400">Session Plan</h4>
                      <div className="space-y-3">
                        {getProjectAppointments(selectedProject.id).map((appointment, index) => (
                          <div key={appointment.id} className="flex items-center justify-between rounded-2xl border border-neutral-100 p-4">
                            <div>
                              <p className="text-sm font-bold">Session {index + 1}</p>
                              <p className="text-xs text-neutral-500">{appointment.date} {appointment.startTime}-{appointment.endTime}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-semibold uppercase text-neutral-500">{appointment.tattooStage}</p>
                              <Badge variant="outline" className="mt-1">{appointment.status.replace('_', ' ')}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Next Stage & Tools */}
                  <div className="space-y-8">
                    {selectedProject.stages.find(s => s.status === 'current') && (
                      <Card className="border-none bg-blue-50/50 shadow-none">
                        <CardHeader>
                          <CardTitle className="text-blue-900 text-lg">Current Stage: {selectedProject.stages.find(s => s.status === 'current')?.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">Active Tools</p>
                            <div className="flex flex-wrap gap-2">
                              {selectedProject.stages.find(s => s.status === 'current')?.plannedTools?.map(tool => (
                                <Badge key={tool} className="bg-blue-100 text-blue-700 border-none">{tool}</Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {selectedProject.stages.find(s => s.status === 'upcoming') && (
                      <Card className="border-none bg-neutral-50 shadow-none">
                        <CardHeader>
                          <CardTitle className="text-lg">Next Stage: {selectedProject.stages.find(s => s.status === 'upcoming')?.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-sm text-neutral-600">{selectedProject.stages.find(s => s.status === 'upcoming')?.description}</p>
                          <div className="space-y-2">
                            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Required Tools</p>
                            <div className="flex flex-wrap gap-2">
                              {selectedProject.stages.find(s => s.status === 'upcoming')?.plannedTools?.map(tool => (
                                <Badge key={tool} variant="outline" className="bg-white">{tool}</Badge>
                              ))}
                            </div>
                          </div>
                          <Button className="w-full bg-black text-white rounded-xl mt-4">Start Next Stage</Button>
                        </CardContent>
                      </Card>
                    )}

                    {/* AI Aftercare Section */}
                    <Card className="border-none bg-emerald-50/50 shadow-none">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-emerald-900 text-lg flex items-center gap-2">
                          <Sparkles size={20} className="text-emerald-600" />
                          AI Aftercare Generator
                        </CardTitle>
                        <Badge className="bg-emerald-100 text-emerald-700 border-none">Personalized</Badge>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-xs text-emerald-800">
                          Based on the <b>{selectedProject.style}</b> style and <b>{CLIENTS.find(c => c.id === selectedProject.clientId)?.skinProfile?.sensitivity}</b> skin sensitivity, we recommend:
                        </p>
                        <div className="space-y-2">
                          {[
                            'Wash with fragrance-free soap 3x daily.',
                            'Apply thin layer of specialized balm.',
                            'Avoid direct sunlight for 14 days.',
                            'Do not submerge in water (pools/baths).'
                          ].map((tip, i) => (
                            <div key={i} className="flex items-start gap-2 text-[10px] text-emerald-700">
                              <div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5" />
                              <span>{tip}</span>
                            </div>
                          ))}
                        </div>
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 text-xs">
                          <Bot size={16} />
                          Send AI Instructions to Client
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </ScrollArea>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {activeLightboxImage && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 cursor-zoom-out"
            onClick={() => setActiveLightboxImage(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-5xl w-full h-full flex items-center justify-center"
            >
              <img 
                src={activeLightboxImage} 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
                referrerPolicy="no-referrer" 
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-4 right-4 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveLightboxImage(null);
                }}
              >
                <X size={32} />
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProjectsView({ user }: { user: User }) {
  const visibleProjects = TATTOO_PROJECTS
    .filter((project) => user.role !== 'artist' || project.artistId === user.artistId)
    .map((project) => ({
      ...project,
      client: CLIENTS.find((client) => client.id === project.clientId),
      artist: ARTISTS.find((artist) => artist.id === project.artistId),
      appointments: APPOINTMENTS
        .filter((appointment) => appointment.projectId === project.id)
        .sort((left, right) => `${left.date} ${left.startTime}`.localeCompare(`${right.date} ${right.startTime}`)),
    }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-neutral-500">
            {user.role === 'artist'
              ? 'Track your multi-session tattoo work, upcoming stages, and client progress.'
              : 'Track studio tattoo projects across artists, clients, and scheduled sessions.'}
          </p>
        </div>
        <Badge className="bg-black text-white border-none px-3 py-1">{visibleProjects.length} Active Projects</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {visibleProjects.map((project) => {
          const currentStage = project.stages.find((stage) => stage.status === 'current');
          const nextAppointment = project.appointments.find((appointment) => appointment.status !== 'completed');
          return (
            <Card key={project.id} className="border-none shadow-sm overflow-hidden">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold">{project.title}</h3>
                    <p className="text-sm text-neutral-500">{project.client?.name}</p>
                    {user.role !== 'artist' && (
                      <p className="text-[10px] mt-1 text-neutral-400">Assigned Artist: {project.artist?.name}</p>
                    )}
                  </div>
                  <Badge className="bg-neutral-100 text-neutral-700 border-none">{project.status}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-neutral-50 p-4">
                    <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Current Stage</p>
                    <p className="mt-1 text-sm font-semibold">{currentStage?.name ?? 'Planning'}</p>
                  </div>
                  <div className="rounded-2xl bg-neutral-50 p-4">
                    <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Next Session</p>
                    <p className="mt-1 text-sm font-semibold">
                      {nextAppointment ? `${nextAppointment.date} ${nextAppointment.startTime}` : 'No session booked'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-neutral-500">Project Progress</span>
                    <span>{project.stages.filter((stage) => stage.status === 'completed').length}/{project.stages.length} done</span>
                  </div>
                  <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-black"
                      style={{ width: `${(project.stages.filter((stage) => stage.status === 'completed').length / project.stages.length) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Session Plan</p>
                  <div className="space-y-2">
                    {project.appointments.map((appointment, index) => (
                      <div key={appointment.id} className="flex items-center justify-between rounded-xl border border-neutral-100 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold">Session {index + 1}</p>
                          <p className="text-[10px] text-neutral-500">{appointment.date} {appointment.startTime}-{appointment.endTime}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-wider text-neutral-500">{appointment.tattooStage}</p>
                          <Badge variant="outline" className="mt-1">{appointment.status.replace('_', ' ')}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function PortfolioView({
  user,
  socialDrafts,
  connectedAccounts,
  onSocialDraftsChange,
}: {
  user: User,
  socialDrafts: SocialDraft[],
  connectedAccounts: ConnectedAccount[],
  onSocialDraftsChange: (drafts: SocialDraft[]) => void,
}) {
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [selectedFormats, setSelectedFormats] = useState<string[]>(['instagram']);
  const [targetAccount, setTargetAccount] = useState<'studio' | 'artist'>('artist');

  const portfolioAssets = TATTOO_PROJECTS
    .filter((project) => user.role !== 'artist' || project.artistId === user.artistId)
    .flatMap((project) =>
      project.images.map((image, index) => ({
        id: image.id,
        url: image.url,
        stage: image.stage,
        project,
        client: CLIENTS.find((client) => client.id === project.clientId),
        artist: ARTISTS.find((artist) => artist.id === project.artistId),
        timestamp: image.timestamp,
        isPublic: index !== 0,
        marketingApproved: index !== 0,
        healedCandidate: image.stage.toLowerCase().includes('healed'),
      })),
    );

  const selectedAsset = portfolioAssets.find((asset) => asset.id === selectedAssetId) ?? null;
  const visibleDrafts = socialDrafts.filter((draft) => user.role !== 'artist' || draft.artistId === user.artistId);
  const availableAccounts = connectedAccounts.filter((account) =>
    account.connected && (account.ownerType === 'studio' || (account.ownerType === 'artist' && account.ownerLabel === user.name)),
  );

  const createDraft = async (status: SocialDraftStatus) => {
    if (!selectedAsset) {
      return;
    }

    const nextDraft: SocialDraft = {
      id: `draft-${Date.now()}`,
      assetId: selectedAsset.id,
      projectId: selectedAsset.project.id,
      artistId: selectedAsset.project.artistId,
      ownerAccount: targetAccount,
      formats: selectedFormats,
      caption: `A closer look at this ${selectedAsset.project.style} piece for ${selectedAsset.client?.name}. Built through staged sessions for cleaner healing and stronger detail retention.`,
      hook: `${selectedAsset.project.title} - ${selectedAsset.stage} in motion.`,
      hashtags: ['tattoo', 'inkflow', selectedAsset.project.style.replace(/\s+/g, ''), 'tattooartist', 'workinprogress'],
      status,
      createdByUserId: user.id,
    };

    try {
      const drafts = await createSocialDraft(nextDraft);
      onSocialDraftsChange(drafts);
      setSelectedAssetId(null);
      setSelectedFormats(['instagram']);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save social draft.');
    }
  };

  const updateDraftStatus = async (draftId: string, status: SocialDraftStatus) => {
    try {
      const drafts = await updateSocialDraftStatus(draftId, status);
      onSocialDraftsChange(drafts);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update social draft.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
          <p className="text-neutral-500">
            {user.role === 'artist'
              ? 'Manage your public-ready tattoo media and prepare content for social channels.'
              : 'Review artist portfolios, public-ready assets, and marketing-approved content.'}
          </p>
        </div>
        <Badge className="bg-black text-white border-none px-3 py-1">{portfolioAssets.length} Media Assets</Badge>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Publishing Queue</CardTitle>
            <CardDescription>
              {user.role === 'artist'
                ? 'Create drafts and submit them for approval or post to your connected account.'
                : 'Review artist drafts, approve content, and publish to studio channels.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Formats</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleDrafts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-neutral-500 py-8">
                      No social drafts yet. Create one from the portfolio cards below.
                    </TableCell>
                  </TableRow>
                ) : visibleDrafts.map((draft) => {
                  const project = TATTOO_PROJECTS.find((item) => item.id === draft.projectId);
                  const artist = ARTISTS.find((item) => item.id === draft.artistId);
                  return (
                    <TableRow key={draft.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold">{project?.title}</span>
                          <span className="text-xs text-neutral-500">{artist?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{draft.formats.join(', ')}</TableCell>
                      <TableCell>
                        <Badge className={cn(
                          'border-none',
                          draft.status === 'draft' && 'bg-neutral-100 text-neutral-700',
                          draft.status === 'submitted' && 'bg-blue-100 text-blue-700',
                          draft.status === 'approved' && 'bg-amber-100 text-amber-700',
                          draft.status === 'published' && 'bg-emerald-100 text-emerald-700',
                        )}>
                          {draft.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{draft.ownerAccount === 'studio' ? 'Studio Account' : 'Artist Account'}</TableCell>
                      <TableCell className="text-right">
                        {user.role === 'artist' ? (
                          draft.status === 'draft' ? (
                            <Button size="sm" variant="outline" onClick={() => updateDraftStatus(draft.id, 'submitted')}>Submit</Button>
                          ) : (
                            <span className="text-xs text-neutral-500">Awaiting review</span>
                          )
                        ) : draft.status === 'submitted' ? (
                          <Button size="sm" variant="outline" onClick={() => updateDraftStatus(draft.id, 'approved')}>Approve</Button>
                        ) : draft.status === 'approved' ? (
                          <Button size="sm" onClick={() => updateDraftStatus(draft.id, 'published')}>Publish</Button>
                        ) : (
                          <span className="text-xs text-neutral-500 capitalize">{draft.status}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Connected Accounts</CardTitle>
            <CardDescription>Publishing targets available to the current user.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {availableAccounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between rounded-2xl border border-neutral-100 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold capitalize">{account.platform}</p>
                  <p className="text-xs text-neutral-500">{account.ownerLabel}</p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 border-none">Connected</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {portfolioAssets.map((asset) => (
          <Card key={asset.id} className="border-none shadow-sm overflow-hidden">
            <div className="aspect-[4/3] relative">
              <img src={asset.url} alt={asset.project.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute top-3 left-3 flex gap-2">
                <Badge className="bg-white/90 text-black border-none">{asset.project.style}</Badge>
                {asset.marketingApproved && (
                  <Badge className="bg-emerald-500 text-white border-none">Marketing OK</Badge>
                )}
              </div>
            </div>
            <CardContent className="p-5 space-y-4">
              <div>
                <h3 className="font-bold text-lg">{asset.project.title}</h3>
                <p className="text-sm text-neutral-500">{asset.client?.name} · {asset.stage}</p>
                {user.role !== 'artist' && (
                  <p className="text-[10px] mt-1 text-neutral-400">Artist: {asset.artist?.name}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{asset.isPublic ? 'Public Ready' : 'Private'}</Badge>
                <Badge variant="outline">{asset.healedCandidate ? 'Healed' : 'Fresh/Progress'}</Badge>
                <Badge variant="outline">{asset.timestamp.slice(0, 10)}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-neutral-50 p-3">
                  <p className="text-neutral-400 uppercase tracking-wider">Reel Hook</p>
                  <p className="mt-1 font-semibold">From {asset.stage} to finished impact</p>
                </div>
                <div className="rounded-xl bg-neutral-50 p-3">
                  <p className="text-neutral-400 uppercase tracking-wider">Caption Angle</p>
                  <p className="mt-1 font-semibold">{asset.project.style} detail breakdown</p>
                </div>
              </div>

              <Button className="w-full bg-black text-white rounded-xl gap-2" onClick={() => setSelectedAssetId(asset.id)}>
                <Share2 size={16} />
                Generate Social Draft
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedAsset} onOpenChange={(open) => !open && setSelectedAssetId(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          {selectedAsset && (
            <>
              <DialogHeader className="p-6 pb-0">
                <DialogTitle>Social Draft Generator</DialogTitle>
                <DialogDescription>
                  Turn this portfolio asset into an Instagram Reel or YouTube Short draft without leaving the studio workflow.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-0">
                <div className="p-6 border-r border-neutral-100">
                  <img src={selectedAsset.url} alt={selectedAsset.project.title} className="w-full aspect-[4/5] object-cover rounded-2xl" referrerPolicy="no-referrer" />
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <h3 className="text-lg font-bold">{selectedAsset.project.title}</h3>
                    <p className="text-sm text-neutral-500">{selectedAsset.stage} · {selectedAsset.project.style}</p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Output Formats</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'instagram', label: 'Instagram Reel', icon: Instagram },
                        { id: 'youtube', label: 'YouTube Short', icon: Youtube },
                      ].map((formatItem) => (
                        <button
                          key={formatItem.id}
                          onClick={() => {
                            setSelectedFormats((previous) =>
                              previous.includes(formatItem.id)
                                ? previous.filter((item) => item !== formatItem.id)
                                : [...previous, formatItem.id],
                            );
                          }}
                          className={cn(
                            'rounded-2xl border-2 p-4 text-left transition-all',
                            selectedFormats.includes(formatItem.id) ? 'border-black bg-neutral-50' : 'border-neutral-200',
                          )}
                        >
                          <formatItem.icon size={20} />
                          <p className="mt-3 text-sm font-semibold">{formatItem.label}</p>
                          <p className="text-[10px] text-neutral-500 mt-1">9:16 vertical, branded outro, caption starter</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Publishing Target</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'artist', label: 'Artist Account' },
                        { id: 'studio', label: 'Studio Account' },
                      ].filter((item) => user.role !== 'artist' || item.id !== 'studio' || availableAccounts.some((account) => account.ownerType === 'studio')).map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setTargetAccount(item.id as 'studio' | 'artist')}
                          className={cn(
                            'rounded-2xl border-2 p-4 text-left transition-all',
                            targetAccount === item.id ? 'border-black bg-neutral-50' : 'border-neutral-200',
                          )}
                        >
                          <p className="text-sm font-semibold">{item.label}</p>
                          <p className="text-[10px] mt-1 text-neutral-500">
                            {item.id === 'studio' ? 'For studio-owned channels and manager publishing.' : 'For personal artist social channels.'}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-neutral-50 p-4 space-y-3 text-sm">
                    <p className="font-semibold">Generated draft</p>
                    <p>Hook: “{selectedAsset.project.title} - {selectedAsset.stage} in motion.”</p>
                    <p>Caption: “A closer look at this {selectedAsset.project.style} piece for {selectedAsset.client?.name}. Built through staged sessions for cleaner healing and stronger detail retention.”</p>
                    <p>Hashtags: #tattoo #inkflow #{selectedAsset.project.style.replace(/\s+/g, '')} #tattooartist #workinprogress</p>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setSelectedAssetId(null)}>
                      Close
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl"
                      disabled={selectedFormats.length === 0}
                      onClick={() => createDraft('draft')}
                    >
                      Save Draft
                    </Button>
                    <Button
                      className="flex-1 bg-black text-white rounded-xl"
                      disabled={selectedFormats.length === 0}
                      onClick={() => createDraft(user.role === 'artist' ? 'submitted' : 'approved')}
                    >
                      {user.role === 'artist' ? 'Submit For Approval' : 'Create Approved Draft'}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ArtistsView() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Artists</h1>
          <p className="text-neutral-500">Manage your team, portfolios, and commissions.</p>
        </div>
        <Button className="bg-black text-white gap-2">
          <Plus size={18} />
          <span>Add Artist</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ARTISTS.map((artist) => (
          <Card key={artist.id} className="border-none shadow-sm overflow-hidden group">
            <div className="h-32 bg-neutral-900 relative">
              <div className="absolute -bottom-10 left-6">
                <Avatar className="h-20 w-20 border-4 border-white shadow-md">
                  <AvatarImage src={artist.avatar} />
                  <AvatarFallback>{artist.name[0]}</AvatarFallback>
                </Avatar>
              </div>
            </div>
            <CardContent className="pt-12 pb-6 px-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold">{artist.name}</h3>
                  <p className="text-sm text-neutral-500">Resident Artist</p>
                </div>
                <Badge className={cn(
                  "border-none",
                  artist.status === 'available' ? 'bg-emerald-50 text-emerald-700' :
                  artist.status === 'busy' ? 'bg-red-50 text-red-700' : 'bg-neutral-100 text-neutral-700'
                )}>
                  {artist.status}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {artist.specialty.map(s => (
                  <Badge key={s} variant="outline" className="text-[10px] font-normal">
                    {s}
                  </Badge>
                ))}
              </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-3 bg-neutral-50 rounded-xl text-center">
                    <p className="text-xs text-neutral-500 mb-1">Appointments</p>
                    <p className="text-lg font-bold">14</p>
                  </div>
                  <div className="p-3 bg-neutral-50 rounded-xl text-center">
                    <p className="text-xs text-neutral-500 mb-1">Revenue</p>
                    <p className="text-lg font-bold">$3.2k</p>
                  </div>
                </div>

                {artist.careerStats && (
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-wider">
                        <Trophy size={14} className="text-yellow-500" />
                        <span>Career Stats</span>
                      </div>
                      <Badge className="bg-yellow-50 text-yellow-700 border-none text-[10px]">
                        {artist.careerStats.sponsorshipProbability}% Sponsor Match
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col items-center p-2 bg-neutral-50 rounded-xl">
                        <span className="text-xs font-bold">{artist.careerStats.awards}</span>
                        <span className="text-[8px] text-neutral-400 uppercase">Awards</span>
                      </div>
                      <div className="flex flex-col items-center p-2 bg-neutral-50 rounded-xl">
                        <span className="text-xs font-bold">{artist.careerStats.highRatingPhotos}</span>
                        <span className="text-[8px] text-neutral-400 uppercase">High Rating</span>
                      </div>
                      <div className="flex flex-col items-center p-2 bg-neutral-50 rounded-xl">
                        <span className="text-xs font-bold">+{artist.careerStats.clientGrowthRate}%</span>
                        <span className="text-[8px] text-neutral-400 uppercase">Growth</span>
                      </div>
                    </div>
                  </div>
                )}
              <div className="flex gap-2">
                <Button className="flex-1 bg-black text-white">Portfolio</Button>
                <Button variant="outline" className="flex-1">Schedule</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function InventoryView() {
  const [predictionRange, setPredictionRange] = useState<'week' | 'halfMonth' | 'month'>('week');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-neutral-500">Track your supplies and predict future needs.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-full px-4 py-1">
            <TrendingUp size={16} className="text-neutral-400" />
            <select 
              className="bg-transparent border-none text-sm font-medium focus:ring-0 outline-none"
              value={predictionRange}
              onChange={(e) => setPredictionRange(e.target.value as any)}
            >
              <option value="week">Next Week</option>
              <option value="halfMonth">Next 15 Days</option>
              <option value="month">Next Month</option>
            </select>
          </div>
          <Button className="bg-black text-white gap-2 rounded-full">
            <Plus size={18} />
            <span>Add Item</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="border-none shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Item Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Predicted Usage</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {INVENTORY.map((item) => {
                    const predicted = getInventoryForecast(item, APPOINTMENTS, predictionRange);
                    const isLow = item.quantity <= item.minThreshold;
                    const willBeLow = (item.quantity - predicted) <= item.minThreshold;

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-semibold">{item.name}</TableCell>
                        <TableCell className="capitalize">{item.category}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={cn("font-medium", isLow && "text-red-500")}>
                              {item.quantity} {item.unit}
                            </span>
                            {isLow && <AlertCircle size={14} className="text-red-500" />}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-neutral-500">
                            <span>{predicted} {item.unit}</span>
                            <ArrowRight size={12} />
                            <span className={cn(willBeLow && "text-orange-500 font-bold")}>
                              {Math.max(0, item.quantity - predicted)} left
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {willBeLow ? (
                            <Badge className="bg-orange-100 text-orange-700 border-none">Order Soon</Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-700 border-none">Healthy</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none bg-black text-white shadow-xl rounded-3xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package size={20} />
                Smart Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-white/10 rounded-2xl space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-white/50">High Demand Alert</p>
                <p className="text-sm">Based on upcoming <span className="text-blue-400 font-bold">Realism</span> projects, your black ink usage will spike by 40% next week.</p>
              </div>
              <div className="p-4 bg-white/10 rounded-2xl space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-white/50">Efficiency Tip</p>
                <p className="text-sm">Grouping <span className="text-emerald-400 font-bold">Linework</span> stages on the same day could reduce PPE waste by 15%.</p>
              </div>
              <Button className="w-full bg-white text-black hover:bg-neutral-200 rounded-xl">Generate Full Report</Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl">
            <CardHeader>
              <CardTitle className="text-lg">Usage by Style</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { style: 'Realism', usage: 85, color: 'bg-blue-500' },
                  { style: 'Traditional', usage: 60, color: 'bg-red-500' },
                  { style: 'Minimalist', usage: 30, color: 'bg-emerald-500' },
                ].map(item => (
                  <div key={item.style} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span>{item.style}</span>
                      <span>{item.usage}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", item.color)} style={{ width: `${item.usage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function WaiverView() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Digital Waivers</h1>
          <p className="text-neutral-500">Manage legal consent forms and medical history intakes.</p>
        </div>
        <Button className="bg-black text-white gap-2">
          <Plus size={18} />
          <span>New Template</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader>
            <CardTitle>Active Templates</CardTitle>
            <CardDescription>Forms currently being used for client intake.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template Name</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Standard Tattoo Consent</TableCell>
                  <TableCell className="text-sm text-neutral-500">Apr 1, 2026</TableCell>
                  <TableCell>
                    <Badge variant="secondary">Primary</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Edit</Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Minor Consent (Parental)</TableCell>
                  <TableCell className="text-sm text-neutral-500">Mar 15, 2026</TableCell>
                  <TableCell>
                    <Badge variant="outline">Special</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Edit</Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Medical History Intake</TableCell>
                  <TableCell className="text-sm text-neutral-500">Feb 20, 2026</TableCell>
                  <TableCell>
                    <Badge variant="secondary">Required</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Edit</Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-black text-white">
          <CardHeader>
            <CardTitle className="text-white">Quick Share</CardTitle>
            <CardDescription className="text-neutral-400">Send waiver to client via QR or Link</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="aspect-square bg-white rounded-2xl flex items-center justify-center p-8">
              {/* Mock QR Code */}
              <div className="w-full h-full border-8 border-black grid grid-cols-4 grid-rows-4 gap-1">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className={cn("bg-black", Math.random() > 0.5 ? "opacity-100" : "opacity-0")} />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Direct Link</p>
              <div className="flex gap-2">
                <Input className="bg-neutral-800 border-neutral-700 text-white text-xs" readOnly value="inkflow.app/w/std-consent" />
                <Button size="sm" variant="secondary">Copy</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SettingsView({ 
  user, 
  onUserChange, 
  studioName, 
  onStudioNameChange,
  studioTheme,
  onThemeChange,
  language,
  onLanguageChange,
  connectedAccounts
}: { 
  user: User, 
  onUserChange: (userId: string) => void,
  studioName: string,
  onStudioNameChange: (name: string) => void,
  studioTheme: 'minimalist' | 'traditional' | 'cyberpunk',
  onThemeChange: (theme: 'minimalist' | 'traditional' | 'cyberpunk') => void,
  language: string,
  onLanguageChange: (lang: string) => void,
  connectedAccounts: ConnectedAccount[]
}) {
  const [tempName, setTempName] = useState(studioName);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    onStudioNameChange(tempName);
    setTimeout(() => setIsSaving(false), 1500);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-neutral-500">Configure studio details, pricing, and notifications.</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Role Switcher for Demo */}
        <Card className="border-none shadow-sm bg-neutral-900 text-white">
          <CardHeader>
            <CardTitle className="text-white">Account Switcher (Demo Mode)</CardTitle>
            <CardDescription className="text-neutral-400">Switch between actual demo accounts so permissions follow the signed-in user, not just the role label.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {DEMO_USERS.map((demoUser) => (
                <Button 
                  key={demoUser.id}
                  variant={user.id === demoUser.id ? 'secondary' : 'outline'}
                  className={cn(
                    "w-full justify-between",
                    user.id === demoUser.id ? "bg-white text-black" : "text-white border-neutral-700 hover:bg-neutral-800"
                  )}
                  onClick={() => onUserChange(demoUser.id)}
                >
                  <span className="text-left">
                    <span className="block font-semibold">{demoUser.name}</span>
                    <span className={cn("block text-[10px] uppercase tracking-wider", user.id === demoUser.id ? "text-neutral-600" : "text-neutral-400")}>
                      {demoUser.role} {demoUser.title ? `- ${demoUser.title}` : ''}
                    </span>
                  </span>
                  {demoUser.artistId && (
                    <Badge variant="outline" className={cn(user.id === demoUser.id ? "border-neutral-300 text-neutral-700" : "border-neutral-700 text-neutral-300")}>
                      Artist #{demoUser.artistId}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Connected Channels</CardTitle>
            <CardDescription>Studio and artist publishing accounts available in the portfolio workflow.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {connectedAccounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between rounded-xl border border-neutral-100 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold capitalize">{account.platform}</p>
                  <p className="text-xs text-neutral-500">{account.ownerLabel} · {account.ownerType}</p>
                </div>
                <Badge className={cn(
                  'border-none',
                  account.connected ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-700'
                )}>
                  {account.connected ? 'Connected' : 'Not linked'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Language</CardTitle>
            <CardDescription>Select your preferred language for the interface.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { id: 'en', name: 'English' },
                { id: 'es', name: 'Español' },
                { id: 'fr', name: 'Français' },
                { id: 'de', name: 'Deutsch' },
                { id: 'ja', name: '日本語' },
                { id: 'ko', name: '한국어' },
                { id: 'zh', name: '中文' },
                { id: 'pt', name: 'Português' },
              ].map((lang) => (
                <Button
                  key={lang.id}
                  variant={language === lang.id ? 'default' : 'outline'}
                  className={cn(
                    "justify-start gap-2 rounded-xl",
                    language === lang.id ? "bg-black text-white" : ""
                  )}
                  onClick={() => onLanguageChange(lang.id)}
                >
                  <Languages size={16} />
                  <span>{lang.name}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Studio Theme</CardTitle>
            <CardDescription>Customize the look and feel of your workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: 'minimalist', name: 'Minimalist', desc: 'Clean & Modern', color: 'bg-white border-neutral-200' },
                { id: 'traditional', name: 'Traditional', desc: 'Classic & Bold', color: 'bg-red-50 border-red-200' },
                { id: 'cyberpunk', name: 'Cyberpunk', desc: 'Neon & Dark', color: 'bg-neutral-900 border-blue-500' },
              ].map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => onThemeChange(theme.id as any)}
                  className={cn(
                    "flex flex-col gap-2 p-4 rounded-2xl border-2 transition-all text-left",
                    studioTheme === theme.id ? "border-black ring-2 ring-black/5" : "border-transparent bg-neutral-50"
                  )}
                >
                  <div className={cn("w-full h-12 rounded-lg border", theme.color)} />
                  <div>
                    <p className="text-sm font-bold">{theme.name}</p>
                    <p className="text-[10px] text-neutral-500">{theme.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Studio Information</CardTitle>
            <CardDescription>Basic details about your tattoo shop.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Shop Name</label>
                <Input 
                  value={tempName} 
                  onChange={(e) => setTempName(e.target.value)}
                  disabled={user.role !== 'owner'} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <Input defaultValue="+1 (555) 000-0000" disabled={user.role !== 'owner'} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Address</label>
              <Input defaultValue="123 Tattoo Lane, Arts District, NY 10001" disabled={user.role !== 'owner'} />
            </div>
            {user.role === 'owner' && (
              <Button 
                className="bg-black text-white gap-2"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Business Hours</CardTitle>
            <CardDescription>Set your shop's weekly availability.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
              <div key={day} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                <span className="font-medium">{day}</span>
                <div className="flex items-center gap-4">
                  <Input className="w-24 h-8 text-center" defaultValue="10:00" />
                  <span className="text-neutral-400">to</span>
                  <Input className="w-24 h-8 text-center" defaultValue="20:00" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
