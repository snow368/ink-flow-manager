// ============================================================
// D1-backed API wrapper — replaces IndexedDB/Dexie
// All data stored in Worker's app_data table
// ============================================================

import { getBackendUrl } from './backendApi';

function apiSecret(): string {
  return localStorage.getItem('inkflow_api_secret') || '';
}

function userId(): string {
  return localStorage.getItem('inkflow_current_user') || '';
}

async function request(method: string, path: string, body?: any): Promise<any> {
  const backendUrl = getBackendUrl();
  if (!backendUrl) throw new Error('Backend URL not configured');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-secret': apiSecret(),
    'x-user-id': userId(),
  };

  const res = await fetch(backendUrl + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

// ---- Generic CRUD for any entity type ----

export interface ApiTable<T> {
  list(filters?: Record<string, string>): Promise<T[]>;
  get(id: string): Promise<T>;
  create(data: Partial<T>): Promise<{ ok: boolean; id: string }>;
  update(id: string, data: Partial<T>): Promise<{ ok: boolean; id: string }>;
  remove(id: string): Promise<{ ok: boolean }>;
}

function table<T>(type: string): ApiTable<T> {
  return {
    async list(filters = {}): Promise<T[]> {
      const params = new URLSearchParams(filters);
      // Add default artistId filter
      if (!filters.artistId && userId()) params.set('artistId', userId());
      const qs = params.toString();
      const { items } = await request('GET', `/api/data/${type}${qs ? '?' + qs : ''}`);
      return items as T[];
    },
    async get(id: string): Promise<T> {
      return request('GET', `/api/data/${type}/${id}`);
    },
    async create(data: Partial<T>): Promise<{ ok: boolean; id: string }> {
      return request('POST', `/api/data/${type}`, { ...data, artistId: userId() });
    },
    async update(id: string, data: Partial<T>): Promise<{ ok: boolean; id: string }> {
      return request('PUT', `/api/data/${type}/${id}`, { ...data, artistId: userId() });
    },
    async remove(id: string): Promise<{ ok: boolean }> {
      return request('DELETE', `/api/data/${type}/${id}`);
    },
  };
}

// ---- Typed API tables ----

export const api = {
  clients: table<ClientData>('client'),
  appointments: table<AppointmentData>('appointment'),
  projects: table<ProjectData>('project'),
  waivers: table<WaiverData>('waiver'),
  sessions: table<SessionData>('session'),
  inventory: table<InventoryData>('inventory'),
  portfolio: table<PortfolioData>('portfolio'),
  socialDrafts: table<SocialDraftData>('socialDraft'),
  referrals: table<ReferralData>('referral'),
  leads: table<LeadData>('lead'),
  leadRevisions: table<LeadRevisionData>('leadRevision'),
  supplyBrands: table<SupplyBrandData>('supplyBrand'),
  posTransactions: table<PosTransactionData>('posTransaction'),
  studioLocations: table<StudioLocationData>('studioLocation'),
  invoices: table<InvoiceData>('invoice'),
  competitors: table<CompetitorData>('competitor'),
  supplyReviews: table<SupplyReviewData>('supplyReview'),
  waitingList: table<WaitingListData>('waitingList'),
  healthChecklists: table<HealthChecklistData>('healthChecklist'),
  communicationLog: table<CommunicationLogData>('communicationLog'),
  affiliateClicks: table<AffiliateClickData>('affiliateClick'),
  auditLog: table<AuditLogData>('auditLog'),
  shifts: table<ShiftData>('shift'),
  tasks: table<TaskData>('task'),
  reviews: table<ReviewData>('review'),
  clientReferrals: table<ClientReferralData>('clientReferral'),
  leadConfirmations: table<LeadConfirmationData>('leadConfirmation'),
  projectAssets: table<ProjectAssetData>('projectAsset'),
  projectApprovalTokens: table<ProjectApprovalTokenData>('projectApprovalToken'),
  depositFlow: table<DepositFlowData>('depositFlow'),
  projectRevisions: table<ProjectRevisionData>('projectRevision'),
  photos: table<PhotoData>('photo'),
};

// ---- Types (mirror Dexie interfaces) ----

export interface ClientData {
  id?: string; artistId?: string; name: string; phone: string; email?: string;
  allergies?: string[]; notes?: string; photo?: string; tags?: string[];
  lastVisitAt?: number; createdAt?: number;
}
export interface AppointmentData {
  id?: string; artistId?: string; clientId: string; projectId?: string;
  date: string; time: string; duration: number; status: string;
  appointmentType: string; notes?: string; createdAt?: number;
}
export interface ProjectData {
  id?: string; artistId?: string; clientId: string; title: string;
  designNotes?: string; projectStatus: string; date?: string;
  appointmentId?: string; createdAt?: number;
}
export interface WaiverData {
  id?: string; artistId?: string; appointmentId: string; clientId?: string;
  clientName?: string; waiverText?: string; signature?: string;
  status: string; signedAt?: number; createdAt?: number;
}
export interface SessionData {
  id?: string; artistId?: string; appointmentId: string;
  startedAt: number; endedAt?: number; status: string;
  notes?: string; photos?: string[]; createdAt?: number;
}
export interface InventoryData {
  id?: string; artistId?: string; name: string; category: string;
  quantity: number; unit?: string; minStock?: number;
  costPrice?: number; sellingPrice?: number; createdAt?: number;
}
export interface PortfolioData {
  id?: string; artistId?: string; imageUrl: string; caption?: string;
  bodyPart?: string; tags?: string[]; createdAt?: number;
}
export interface SocialDraftData {
  id?: string; artistId?: string; platform: string; caption?: string;
  mediaUrls?: string[]; hashtags?: string[]; status: string;
  scheduledAt?: number; publishedAt?: number; createdAt?: number;
}
export interface ReferralData {
  id?: string; artistId?: string; inviterId: string; inviteeId?: string;
  inviteeEmail?: string; status: string; createdAt?: number;
}
export interface LeadData {
  id?: string; artistId?: string; name: string; phone: string;
  email?: string; status: string; source?: string; notes?: string;
  budget?: number; nextFollowUpAt?: number; createdAt?: number;
}
export interface LeadRevisionData {
  id?: string; artistId?: string; leadId: string; version: number;
  changes?: any; actor?: string; createdAt?: number;
}
export interface SupplyBrandData {
  id?: string; artistId?: string; name: string; category: string;
  website?: string; notes?: string; active: number; sortOrder?: number;
  createdAt?: number;
}
export interface PosTransactionData {
  id?: string; artistId?: string; clientId?: string;
  items: any[]; total: number; tax?: number; paymentMethod: string;
  paymentStatus: string; createdAt?: number;
}
export interface StudioLocationData {
  id?: string; artistId?: string; ownerId?: string; name: string;
  address?: string; phone?: string; managerId?: string; createdAt?: number;
}
export interface InvoiceData {
  id?: string; artistId?: string; clientId: string;
  invoiceNumber: string; items: any[]; subtotal: number;
  tax?: number; total: number; paymentStatus: string;
  dueDate?: string; createdAt?: number;
}
export interface CompetitorData {
  id?: string; artistId?: string; name: string; category: string;
  website?: string; notes?: string; status: string;
  nextCheckAt?: number; createdAt?: number;
}
export interface SupplyReviewData {
  id?: string; artistId?: string; brandId: string; rating: number;
  review?: string; pros?: string; cons?: string; createdAt?: number;
}
export interface WaitingListData {
  id?: string; artistId?: string; clientId?: string;
  name: string; phone: string; notes?: string; status: string;
  position?: number; createdAt?: number;
}
export interface HealthChecklistData {
  id?: string; artistId?: string; clientId: string;
  questions: any[]; passed: boolean; reviewedBy?: string;
  createdAt?: number;
}
export interface CommunicationLogData {
  id?: string; artistId?: string; clientId: string;
  channel: string; direction: 'in' | 'out'; message: string;
  status?: string; createdAt?: number;
}
export interface AffiliateClickData {
  id?: string; artistId?: string; referralCode: string;
  ip?: string; userAgent?: string; converted: boolean;
  createdAt?: number;
}
export interface AuditLogData {
  id?: string; artistId?: string; action: string;
  resource?: string; details?: any; createdAt?: number;
}
export interface ShiftData {
  id?: string; artistId?: string; staffId: string;
  date: string; startTime: string; endTime: string;
  role?: string; notes?: string; createdAt?: number;
}
export interface TaskData {
  id?: string; artistId?: string; title: string; description?: string;
  assigneeId?: string; dueDate?: string; priority?: string;
  status: string; createdAt?: number;
}
export interface ReviewData {
  id?: string; artistId?: string; clientId: string;
  rating: number; review?: string; source?: string;
  approved: boolean; createdAt?: number;
}
export interface ClientReferralData {
  id?: string; artistId?: string; clientId: string;
  name: string; phone: string; email?: string;
  status: string; reward?: string; createdAt?: number;
}
export interface LeadConfirmationData {
  id?: string; artistId?: string; leadId: string;
  token: string; confirmedAt?: number; expiresAt?: number;
  status: string; createdAt?: number;
}
export interface ProjectAssetData {
  id?: string; artistId?: string; projectId: string;
  type: string; url: string; name?: string;
  notes?: string; createdAt?: number;
}
export interface ProjectApprovalTokenData {
  id?: string; artistId?: string; projectId: string;
  token: string; email: string; approved: boolean;
  respondedAt?: number; createdAt?: number;
}
export interface DepositFlowData {
  id?: string; artistId?: string; leadId: string;
  amount: number; status: string; stripePaymentIntentId?: string;
  refunded?: boolean; createdAt?: number;
}
export interface ProjectRevisionData {
  id?: string; artistId?: string; projectId: string;
  version: number; changes: any; notes?: string;
  actor?: string; createdAt?: number;
}
export interface PhotoData {
  id?: string; artistId?: string; clientId?: string;
  url: string; thumbnailUrl?: string; bodyPart?: string;
  tags?: string[]; createdAt?: number;
}
