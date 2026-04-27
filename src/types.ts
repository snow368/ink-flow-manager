export type UserRole = 'owner' | 'artist' | 'staff';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  artistId?: string;
  title?: string;
}

export interface Artist {
  id: string;
  name: string;
  specialty: string[];
  avatar: string;
  status: 'available' | 'busy' | 'off';
  role: UserRole;
  careerStats?: {
    awards: number;
    highRatingPhotos: number;
    clientGrowthRate: number;
    retentionRate: number;
    sponsorshipProbability: number; // 0-100
  };
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  lastVisit?: string;
  notes?: string;
  assignedArtistId?: string;
  source: 'walk-in' | 'instagram' | 'google' | 'referral' | 'event' | 'other';
  referredBy?: string;
  skinProfile?: {
    painLevel: number; // 1-10
    absorption: 'low' | 'medium' | 'high';
    allergies: string[];
    sensitivity: string;
  };
  inkHistory?: {
    brand: string;
    color: string;
    date: string;
    projectTitle: string;
  }[];
}

export interface TattooImage {
  id: string;
  url: string;
  stage: string;
  timestamp: string;
}

export interface ProjectStage {
  name: string;
  status: 'completed' | 'current' | 'upcoming';
  description: string;
  plannedTools?: string[];
}

export interface TattooProject {
  id: string;
  clientId: string;
  artistId: string;
  title: string;
  description: string;
  style: TattooStyle;
  status: 'active' | 'completed' | 'on-hold';
  stages: ProjectStage[];
  images: TattooImage[];
}

export type AppointmentStatus = 'unconfirmed' | 'deposit_paid' | 'ready' | 'vip' | 'completed';
export type BodyPart = 'arm' | 'leg' | 'back' | 'chest' | 'neck' | 'hand' | 'foot';
export type TattooStyle = 'minimalist' | 'traditional' | 'realism' | 'geometric' | 'neo-traditional' | 'japanese' | 'tribal';
export type SessionStage = 'consultation' | 'outline' | 'shading' | 'color' | 'touch-up' | 'healed_check';

export interface Appointment {
  id: string;
  projectId: string;
  clientId: string;
  artistId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  service: string;
  price: number;
  deposit: number;
  depositPaid: boolean;
  waiverSigned: boolean;
  bodyPart: BodyPart;
  tattooSize: 'small' | 'medium' | 'large' | 'extra-large';
  tattooStyle: TattooStyle;
  tattooStage: SessionStage;
  hasAllergies: boolean;
  painLevel: number; // 1-10
  notes?: string;
}

export interface SessionState {
  id: string;
  appointmentId: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'paused' | 'completed';
  usedSupplies: { id: string; quantity: number }[];
  media: { url: string; type: 'day0' | 'day30'; timestamp: Date; tags: string[] }[];
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'ink' | 'needles' | 'ppe' | 'aftercare' | 'other';
  quantity: number;
  unit: string;
  minThreshold: number;
}

export interface WaiverTemplate {
  id: string;
  title: string;
  description: string;
  lastUpdated: string;
  appliesTo: 'all' | 'touch-up';
}

export interface SignedWaiverRecord {
  id: string;
  templateId: string;
  appointmentId: string;
  clientId: string;
  status: 'signed' | 'pending';
  signedAt?: string;
  signerName?: string;
  signature?: string;
  signedText?: string;
}

export type SocialDraftStatus = 'draft' | 'submitted' | 'approved' | 'published';

export interface SocialDraft {
  id: string;
  assetId: string;
  projectId: string;
  artistId: string;
  ownerAccount: 'studio' | 'artist';
  formats: string[];
  caption: string;
  hook: string;
  hashtags: string[];
  status: SocialDraftStatus;
  createdByUserId: string;
}

export interface DailyActivity {
  id: string;
  type: 'appointment' | 'consultation' | 'inventory' | 'financial';
  description: string;
  timestamp: string;
  user: string;
}
