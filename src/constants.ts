import { Artist, Client, Appointment, InventoryItem, DailyActivity, User, TattooProject, WaiverTemplate, SignedWaiverRecord } from './types';

export const USER: User = {
  id: 'admin-1',
  name: 'Alex Owner',
  email: 'alex@inkflow.com',
  role: 'owner',
  avatar: 'https://i.pravatar.cc/150?u=alex-owner',
  title: 'Studio Owner'
};

export const DEMO_USERS: User[] = [
  USER,
  {
    id: 'artist-1',
    name: 'Alex Thorne',
    email: 'alex.thorne@inkflow.com',
    role: 'artist',
    artistId: '1',
    avatar: 'https://i.pravatar.cc/150?u=alex',
    title: 'Senior Artist'
  },
  {
    id: 'artist-2',
    name: 'Sarah Ink',
    email: 'sarah@inkflow.com',
    role: 'artist',
    artistId: '2',
    avatar: 'https://i.pravatar.cc/150?u=sarah',
    title: 'Resident Artist'
  },
  {
    id: 'staff-1',
    name: 'Mia Front Desk',
    email: 'mia@inkflow.com',
    role: 'staff',
    avatar: 'https://i.pravatar.cc/150?u=mia-front-desk',
    title: 'Front Desk Manager'
  }
];

export const TRANSLATIONS: Record<string, any> = {
  en: {
    dashboard: 'Dashboard',
    calendar: 'Calendar',
    clients: 'Clients',
    artists: 'Artists',
    inventory: 'Inventory',
    financial: 'Financial',
    waivers: 'Waivers',
    settings: 'Settings',
    welcome: 'Welcome back',
    overview: 'Studio Overview',
    netProfit: 'Net Profit',
    activeProjects: 'Active Projects',
    newClients: 'New Clients',
    appointments: 'Appointments',
  },
  es: {
    dashboard: 'Tablero',
    calendar: 'Calendario',
    clients: 'Clientes',
    artists: 'Artistas',
    inventory: 'Inventario',
    financial: 'Financiero',
    waivers: 'Renuncias',
    settings: 'Ajustes',
    welcome: 'Bienvenido de nuevo',
    overview: 'Resumen del Estudio',
    netProfit: 'Beneficio Neto',
    activeProjects: 'Proyectos Activos',
    newClients: 'Nuevos Clientes',
    appointments: 'Citas',
  },
  fr: {
    dashboard: 'Tableau de bord',
    calendar: 'Calendrier',
    clients: 'Clients',
    artists: 'Artistes',
    inventory: 'Inventaire',
    financial: 'Financier',
    waivers: 'Décharges',
    settings: 'Paramètres',
    welcome: 'Bon retour',
    overview: 'Aperçu du Studio',
    netProfit: 'Bénéfice Net',
    activeProjects: 'Projets Actifs',
    newClients: 'Nouveaux Clients',
    appointments: 'Rendez-vous',
  },
  de: {
    dashboard: 'Dashboard',
    calendar: 'Kalender',
    clients: 'Kunden',
    artists: 'Künstler',
    inventory: 'Inventar',
    financial: 'Finanzen',
    waivers: 'Verzichtserklärungen',
    settings: 'Einstellungen',
    welcome: 'Willkommen zurück',
    overview: 'Studio-Übersicht',
    netProfit: 'Nettogewinn',
    activeProjects: 'Aktive Projekte',
    newClients: 'Neue Kunden',
    appointments: 'Termine',
  },
  ja: {
    dashboard: 'ダッシュボード',
    calendar: 'カレンダー',
    clients: 'クライアント',
    artists: 'アーティスト',
    inventory: '在庫',
    financial: '財務',
    waivers: '免責事項',
    settings: '設定',
    welcome: 'おかえりなさい',
    overview: 'スタジオ概要',
    netProfit: '純利益',
    activeProjects: '進行中のプロジェクト',
    newClients: '新規クライアント',
    appointments: '予約',
  },
  ko: {
    dashboard: '대시보드',
    calendar: '캘린더',
    clients: '고객',
    artists: '아티스트',
    inventory: '인벤토리',
    financial: '재무',
    waivers: '동의서',
    settings: '설정',
    welcome: '다시 오신 것을 환영합니다',
    overview: '스튜디오 개요',
    netProfit: '순이익',
    activeProjects: '활성 프로젝트',
    newClients: '신규 고객',
    appointments: '예약',
  },
  zh: {
    dashboard: '仪表板',
    calendar: '日历',
    clients: '客户',
    artists: '艺术家',
    inventory: '库存',
    financial: '财务',
    waivers: '免责声明',
    settings: '设置',
    welcome: '欢迎回来',
    overview: '工作室概览',
    netProfit: '净利润',
    activeProjects: '进行中项目',
    newClients: '新客户',
    appointments: '预约',
  },
  pt: {
    dashboard: 'Painel',
    calendar: 'Calendário',
    clients: 'Clientes',
    artists: 'Artistas',
    inventory: 'Inventário',
    financial: 'Financeiro',
    waivers: 'Termos',
    settings: 'Configurações',
    welcome: 'Bem-vindo de volta',
    overview: 'Visão Geral do Estúdio',
    netProfit: 'Lucro Líquido',
    activeProjects: 'Projetos Ativos',
    newClients: 'Novos Clientes',
    appointments: 'Compromissos',
  },
};

export const ARTISTS: Artist[] = [
  { 
    id: '1', 
    name: 'Alex Thorne', 
    specialty: ['Realism', 'Black & Gray'], 
    avatar: 'https://i.pravatar.cc/150?u=alex', 
    status: 'available', 
    role: 'owner',
    careerStats: {
      awards: 12,
      highRatingPhotos: 45,
      clientGrowthRate: 25,
      retentionRate: 85,
      sponsorshipProbability: 92
    }
  },
  { 
    id: '2', 
    name: 'Sarah Ink', 
    specialty: ['Traditional', 'Neo-Traditional'], 
    avatar: 'https://i.pravatar.cc/150?u=sarah', 
    status: 'busy', 
    role: 'artist',
    careerStats: {
      awards: 5,
      highRatingPhotos: 22,
      clientGrowthRate: 15,
      retentionRate: 70,
      sponsorshipProbability: 65
    }
  },
  { 
    id: '3', 
    name: "Mike 'Needle' Jones", 
    specialty: ['Minimalist', 'Geometric'], 
    avatar: 'https://i.pravatar.cc/150?u=mike', 
    status: 'off', 
    role: 'artist',
    careerStats: {
      awards: 3,
      highRatingPhotos: 18,
      clientGrowthRate: 10,
      retentionRate: 60,
      sponsorshipProbability: 45
    }
  },
];

export const CLIENTS: Client[] = [
  { 
    id: '1', 
    name: 'John Doe', 
    email: 'john@example.com', 
    phone: '555-0101', 
    lastVisit: '2026-03-15', 
    notes: 'Prefers black ink only.', 
    assignedArtistId: '1', 
    source: 'instagram',
    skinProfile: {
      painLevel: 4,
      absorption: 'medium',
      allergies: [],
      sensitivity: 'Normal'
    },
    inkHistory: [
      { brand: 'Dynamic', color: 'Black', date: '2026-03-15', projectTitle: 'Cyberpunk Sleeve' }
    ]
  },
  { 
    id: '2', 
    name: 'Jane Smith', 
    email: 'jane@example.com', 
    phone: '555-0102', 
    lastVisit: '2026-03-20', 
    notes: 'Allergic to latex.', 
    assignedArtistId: '2', 
    source: 'walk-in',
    skinProfile: {
      painLevel: 8,
      absorption: 'low',
      allergies: ['Latex'],
      sensitivity: 'High'
    },
    inkHistory: [
      { brand: 'Eternal', color: 'Red', date: '2026-03-20', projectTitle: 'Small Floral' }
    ]
  },
  { 
    id: '3', 
    name: 'Bob Wilson', 
    email: 'bob@example.com', 
    phone: '555-0103', 
    lastVisit: '2026-03-25', 
    notes: 'Sleeve project in progress.', 
    assignedArtistId: '1', 
    source: 'referral', 
    referredBy: 'John Doe',
    skinProfile: {
      painLevel: 6,
      absorption: 'high',
      allergies: [],
      sensitivity: 'Normal'
    }
  },
  { id: '4', name: 'Alice Brown', email: 'alice@example.com', phone: '555-0104', lastVisit: '2026-04-01', notes: 'First tattoo.', assignedArtistId: '3', source: 'google' },
  { id: '5', name: 'Charlie Davis', email: 'charlie@example.com', phone: '555-0105', lastVisit: '2026-04-02', notes: 'Cover up.', assignedArtistId: '2', source: 'event' },
];

export const TATTOO_PROJECTS: TattooProject[] = [
  {
    id: 'p1',
    clientId: '1',
    artistId: '1',
    title: 'Cyberpunk Sleeve',
    description: 'Full arm realism project with neon accents.',
    style: 'realism',
    status: 'active',
    stages: [
      { name: 'Consultation', status: 'completed', description: 'Design finalized and deposit paid.' },
      { name: 'Linework', status: 'completed', description: 'Main outlines completed.' },
      { name: 'Shading', status: 'current', description: 'Adding depth and texture.', plannedTools: ['3RL', '7RS', 'Black Ink'] },
      { name: 'Color', status: 'upcoming', description: 'Adding neon highlights.', plannedTools: ['Electric Blue Ink', 'Neon Pink Ink'] },
    ],
    images: [
      { id: 'img1', url: 'https://picsum.photos/seed/tattoo1/400/400', stage: 'Linework', timestamp: '2026-03-15T10:00:00Z' },
      { id: 'img2', url: 'https://picsum.photos/seed/tattoo2/400/400', stage: 'Shading (Part 1)', timestamp: '2026-03-25T14:00:00Z' },
    ]
  },
  {
    id: 'p2',
    clientId: '3',
    artistId: '1',
    title: 'Geometric Back Piece',
    description: 'Large scale geometric pattern across the back.',
    style: 'geometric',
    status: 'active',
    stages: [
      { name: 'Consultation', status: 'completed', description: 'Design finalized.' },
      { name: 'Stencil', status: 'current', description: 'Applying large scale stencil.', plannedTools: ['Stencil Paper', 'Transfer Gel'] },
      { name: 'Linework', status: 'upcoming', description: 'Starting the main lines.', plannedTools: ['9RL', 'Black Ink'] },
    ],
    images: [
      { id: 'img3', url: 'https://picsum.photos/seed/tattoo3/400/400', stage: 'Consultation', timestamp: '2026-03-25T11:00:00Z' },
    ]
  },
  {
    id: 'p3',
    clientId: '2',
    artistId: '2',
    title: 'Small Floral',
    description: 'Delicate minimalist floral piece with a quick one-session plan and optional touch-up.',
    style: 'minimalist',
    status: 'active',
    stages: [
      { name: 'Consultation', status: 'completed', description: 'Placement approved and dimensions confirmed.' },
      { name: 'Outline', status: 'current', description: 'Primary fine-line pass scheduled.', plannedTools: ['3RL', 'Black Ink'] },
      { name: 'Healed Check', status: 'upcoming', description: 'Review healing and offer touch-up if needed.', plannedTools: ['Aftercare Balm'] },
    ],
    images: []
  },
  {
    id: 'p4',
    clientId: '4',
    artistId: '3',
    title: 'Traditional Rose',
    description: 'Single-session chest rose with bold lines and color packing.',
    style: 'traditional',
    status: 'active',
    stages: [
      { name: 'Consultation', status: 'completed', description: 'Color palette approved.' },
      { name: 'Color', status: 'current', description: 'Primary application session.', plannedTools: ['9RL', 'Red Ink', 'Aftercare Balm'] },
      { name: 'Healed Check', status: 'upcoming', description: 'Follow-up check after healing.', plannedTools: ['Touch-up Kit'] },
    ],
    images: []
  }
];

export const APPOINTMENTS: Appointment[] = [
  { 
    id: '1', 
    projectId: 'p1',
    clientId: '1', 
    artistId: '1', 
    date: '2026-04-03', 
    startTime: '10:00', 
    endTime: '14:00', 
    status: 'ready', 
    service: 'Full Sleeve', 
    price: 800, 
    deposit: 200,
    depositPaid: true,
    waiverSigned: true,
    bodyPart: 'arm',
    tattooSize: 'extra-large',
    tattooStyle: 'realism',
    tattooStage: 'shading',
    hasAllergies: false,
    painLevel: 4
  },
  { 
    id: '2', 
    projectId: 'p3',
    clientId: '2', 
    artistId: '2', 
    date: '2026-04-03', 
    startTime: '11:00', 
    endTime: '13:00', 
    status: 'unconfirmed', 
    service: 'Small Floral', 
    price: 250, 
    deposit: 50,
    depositPaid: false,
    waiverSigned: false,
    bodyPart: 'leg',
    tattooSize: 'small',
    tattooStyle: 'minimalist',
    tattooStage: 'outline',
    hasAllergies: true,
    painLevel: 8
  },
  { 
    id: '3', 
    projectId: 'p2',
    clientId: '3', 
    artistId: '1', 
    date: '2026-04-04', 
    startTime: '15:00', 
    endTime: '18:00', 
    status: 'deposit_paid', 
    service: 'Geometric Back', 
    price: 600, 
    deposit: 150,
    depositPaid: true,
    waiverSigned: false,
    bodyPart: 'back',
    tattooSize: 'large',
    tattooStyle: 'geometric',
    tattooStage: 'outline',
    hasAllergies: false,
    painLevel: 6
  },
  { 
    id: '4', 
    projectId: 'p4',
    clientId: '4', 
    artistId: '3', 
    date: '2026-04-05', 
    startTime: '09:00', 
    endTime: '12:00', 
    status: 'vip', 
    service: 'Traditional Rose', 
    price: 350, 
    deposit: 100,
    depositPaid: true,
    waiverSigned: true,
    bodyPart: 'chest',
    tattooSize: 'medium',
    tattooStyle: 'traditional',
    tattooStage: 'color',
    hasAllergies: false,
    painLevel: 3
  },
  { 
    id: '5', 
    projectId: 'p1',
    clientId: '1', 
    artistId: '1', 
    date: '2026-04-10', 
    startTime: '10:00', 
    endTime: '14:00', 
    status: 'ready', 
    service: 'Full Sleeve', 
    price: 800, 
    deposit: 200,
    depositPaid: true,
    waiverSigned: true,
    bodyPart: 'arm',
    tattooSize: 'extra-large',
    tattooStyle: 'realism',
    tattooStage: 'color',
    hasAllergies: false,
    painLevel: 4
  }
];

export const INVENTORY: InventoryItem[] = [
  { id: '1', name: 'Black Ink (Dynamic)', category: 'ink', quantity: 12, unit: 'oz', minThreshold: 5 },
  { id: '2', name: 'Needles (3RL)', category: 'needles', quantity: 45, unit: 'pcs', minThreshold: 20 },
  { id: '3', name: 'Gloves (M)', category: 'ppe', quantity: 2, unit: 'boxes', minThreshold: 5 },
  { id: '4', name: 'Aftercare Balm', category: 'aftercare', quantity: 30, unit: 'tins', minThreshold: 10 },
];

export const WAIVER_TEMPLATES: WaiverTemplate[] = [
  {
    id: 'standard',
    title: 'Standard Tattoo Waiver',
    description: 'Core consent for tattoo procedure, healing expectations, and client acknowledgement.',
    lastUpdated: '2026-03-20',
    appliesTo: 'all',
  },
  {
    id: 'health',
    title: 'Health & Safety Protocol',
    description: 'Medical disclosure, allergy flags, and sanitation confirmation.',
    lastUpdated: '2026-03-15',
    appliesTo: 'all',
  },
  {
    id: 'touchup',
    title: 'Touch-up Agreement',
    description: 'Additional terms for healing review and complimentary touch-up windows.',
    lastUpdated: '2026-03-28',
    appliesTo: 'touch-up',
  },
];

export const SIGNED_WAIVERS: SignedWaiverRecord[] = [
  { id: 'w1', templateId: 'standard', appointmentId: '1', clientId: '1', status: 'signed', signedAt: '2026-04-02T16:30:00Z' },
  { id: 'w2', templateId: 'health', appointmentId: '1', clientId: '1', status: 'signed', signedAt: '2026-04-02T16:35:00Z' },
  { id: 'w3', templateId: 'standard', appointmentId: '2', clientId: '2', status: 'pending' },
  { id: 'w4', templateId: 'health', appointmentId: '2', clientId: '2', status: 'pending' },
  { id: 'w5', templateId: 'standard', appointmentId: '3', clientId: '3', status: 'signed', signedAt: '2026-04-01T13:00:00Z' },
  { id: 'w6', templateId: 'health', appointmentId: '3', clientId: '3', status: 'pending' },
  { id: 'w7', templateId: 'standard', appointmentId: '4', clientId: '4', status: 'signed', signedAt: '2026-04-04T12:00:00Z' },
  { id: 'w8', templateId: 'health', appointmentId: '4', clientId: '4', status: 'signed', signedAt: '2026-04-04T12:05:00Z' },
  { id: 'w9', templateId: 'standard', appointmentId: '5', clientId: '1', status: 'signed', signedAt: '2026-04-09T18:00:00Z' },
  { id: 'w10', templateId: 'health', appointmentId: '5', clientId: '1', status: 'signed', signedAt: '2026-04-09T18:05:00Z' },
];

export const RECENT_ACTIVITIES: DailyActivity[] = [
  { id: '1', type: 'appointment', description: 'New appointment booked for John Doe', timestamp: '2026-04-03T08:00:00Z', user: 'Admin' },
  { id: '2', type: 'financial', description: 'Deposit of $200 received from John Doe', timestamp: '2026-04-03T08:05:00Z', user: 'Admin' },
  { id: '3', type: 'inventory', description: 'Needles (3RL) stock updated', timestamp: '2026-04-03T08:10:00Z', user: 'Sarah Ink' },
];
