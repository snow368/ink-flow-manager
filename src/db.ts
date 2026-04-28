import Dexie, { type Table } from 'dexie';

export class InkFlowDB extends Dexie {
  users!: Table<UserRecord>;
  clients!: Table<ClientRecord>;
  appointments!: Table<AppointmentRecord>;
  projects!: Table<ProjectRecord>;
  waivers!: Table<WaiverRecord>;
  sessions!: Table<SessionRecord>;
  inventory!: Table<InventoryRecord>;
  portfolio!: Table<PortfolioRecord>;
  socialDrafts!: Table<SocialDraftRecord>;
  referrals!: Table<ReferralRecord>;

  constructor() {
    super('InkFlowDB');
    this.version(1).stores({
      users: 'id, email, role, artistId, deviceId, createdAt',
      clients: 'id, name, artistId, createdAt',
      appointments: 'id, clientId, projectId, artistId, date, status, createdAt',
      projects: 'id, clientId, artistId, status, createdAt',
      waivers: 'id, appointmentId, clientId, status, createdAt',
      sessions: 'id, appointmentId, artistId, status, startedAt',
      inventory: 'id, name, category',
      portfolio: 'id, artistId, createdAt',
      socialDrafts: 'id, platform, status, createdAt',
      referrals: 'id, inviterId, inviteeId, status, createdAt',
    });
  }
}

export const db = new InkFlowDB();

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'artist' | 'staff';
  artistId?: string;
  deviceId?: string;
  verified: boolean;
  verificationType?: 'shop' | 'competition' | 'social';
  studioName?: string;
  licenseShopName?: string;
  createdAt: number;
}

export interface ClientRecord {
  id: string;
  name: string;
  artistId?: string;
  phone?: string;
  email?: string;
  allergies?: string[];
  notes?: string;
  createdAt: number;
}

export interface AppointmentRecord {
  id: string;
  clientId: string;
  projectId?: string;
  artistId: string;
  date: string;
  time: string;
  duration: number;
  type?: string;
  status: 'unconfirmed' | 'deposit_paid' | 'ready' | 'attention' | 'blocked' | 'done' | 'cancelled';
  waiverCompleted: boolean;
  createdAt: number;
}

export interface ProjectRecord {
  id: string;
  clientId: string;
  artistId: string;
  title: string;
  style?: string;
  bodyPart?: string;
  status: 'consultation' | 'in_progress' | 'completed' | 'on_hold';
  totalSessions: number;
  completedSessions: number;
  createdAt: number;
}

export interface WaiverRecord {
  id: string;
  appointmentId: string;
  clientId: string;
  type: string;
  content: string;
  signature?: string;
  status: 'missing' | 'signed';
  signedAt?: number;
  createdAt: number;
}

export interface SessionRecord {
  id: string;
  appointmentId: string;
  artistId: string;
  status: 'active' | 'paused' | 'completed' | 'stopped';
  startedAt: number;
  pausedAt?: number;
  finishedAt?: number;
  actualDuration: number;
  timeline: TimelineEvent[];
  photos: string[];
  notes: string[];
  consumables: ConsumableUsage[];
}

export interface TimelineEvent {
  timestamp: number;
  type: 'start' | 'pause' | 'resume' | 'photo' | 'consumable' | 'note' | 'allergy' | 'stop' | 'done';
  payload?: string;
}

export interface ConsumableUsage {
  itemId: string;
  quantity: number;
}

export interface InventoryRecord {
  id: string;
  name: string;
  category: string;
  quantity: number;
  reorderLevel: number;
  unit: string;
}

export interface PortfolioRecord {
  id: string;
  artistId: string;
  projectId?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  tags: string[];
  isPublic: boolean;
  consentForSocial: boolean;
  consentForPromotion: boolean;
  createdAt: number;
}

export interface SocialDraftRecord {
  id: string;
  portfolioId: string;
  platform: 'instagram' | 'youtube';
  status: 'draft' | 'submitted' | 'approved' | 'published';
  caption: string;
  hashtags: string;
  imageUrls: string[];
  createdAt: number;
}

export interface ReferralRecord {
  id: string;
  inviterId: string;
  inviteeId: string;
  status: 'pending' | 'registered' | 'verified' | 'rewarded';
  rewardGranted: boolean;
  createdAt: number;
}
