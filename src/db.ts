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
  leads!: Table<LeadRecord>;
  leadRevisions!: Table<LeadRevisionRecord>;
  supplyBrands!: Table<SupplyBrandRecord>;
  posTransactions!: Table<PosTransactionRecord>;
  studioLocations!: Table<StudioLocationRecord>;
  invoices!: Table<InvoiceRecord>;
  competitors!: Table<CompetitorRecord>;
  supplyReviews!: Table<SupplyReviewRecord>;
  waitingList!: Table<WaitingListRecord>;
  healthChecklists!: Table<HealthChecklistRecord>;
  communicationLog!: Table<CommunicationLogRecord>;
  affiliateClicks!: Table<AffiliateClickRecord>;

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
    this.version(2).stores({
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
      leads: 'id, artistId, status, source, createdAt, nextFollowUpAt',
    });
    this.version(3).stores({
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
      leads: 'id, artistId, status, source, createdAt, nextFollowUpAt',
      leadRevisions: 'id, leadId, version, actor, createdAt',
    });
    this.version(4).stores({
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
      leads: 'id, artistId, status, source, createdAt, nextFollowUpAt',
      leadRevisions: 'id, leadId, version, actor, createdAt',
    });
    this.version(5).stores({
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
      leads: 'id, artistId, status, source, createdAt, nextFollowUpAt, paymentStatus',
      leadRevisions: 'id, leadId, version, actor, createdAt',
    });
    this.version(6).stores({
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
      leads: 'id, artistId, status, source, createdAt, nextFollowUpAt, paymentStatus, paymentMethod, paymentUpdatedAt',
      leadRevisions: 'id, leadId, version, actor, createdAt',
    });
    this.version(7).stores({
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
      leads: 'id, artistId, status, source, createdAt, nextFollowUpAt, paymentStatus, paymentMethod, paymentUpdatedAt',
      leadRevisions: 'id, leadId, version, actor, createdAt',
      supplyBrands: 'id, category, active, sortOrder',
    });
    this.version(8).stores({
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
      leads: 'id, artistId, status, source, createdAt, nextFollowUpAt, paymentStatus, paymentMethod, paymentUpdatedAt',
      leadRevisions: 'id, leadId, version, actor, createdAt',
      supplyBrands: 'id, category, active, sortOrder',
    });
    this.version(9).stores({
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
      leads: 'id, artistId, status, source, createdAt, nextFollowUpAt, paymentStatus, paymentMethod, paymentUpdatedAt',
      leadRevisions: 'id, leadId, version, actor, createdAt',
      supplyBrands: 'id, category, active, sortOrder',
      posTransactions: 'id, artistId, clientId, paymentStatus, createdAt',
    });
    this.version(10).stores({
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
      leads: 'id, artistId, status, source, createdAt, nextFollowUpAt, paymentStatus, paymentMethod, paymentUpdatedAt',
      leadRevisions: 'id, leadId, version, actor, createdAt',
      supplyBrands: 'id, category, active, sortOrder',
      posTransactions: 'id, artistId, clientId, paymentStatus, createdAt',
      studioLocations: 'id, ownerId, managerId',
    });
    this.version(11).stores({
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
      leads: 'id, artistId, status, source, createdAt, nextFollowUpAt, paymentStatus, paymentMethod, paymentUpdatedAt',
      leadRevisions: 'id, leadId, version, actor, createdAt',
      supplyBrands: 'id, category, active, sortOrder',
      posTransactions: 'id, artistId, clientId, paymentStatus, createdAt',
      studioLocations: 'id, ownerId, managerId',
      invoices: 'id, invoiceNumber, artistId, clientId, paymentStatus, createdAt',
    });
    this.version(12).stores({
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
      leads: 'id, artistId, status, source, createdAt, nextFollowUpAt, paymentStatus, paymentMethod, paymentUpdatedAt',
      leadRevisions: 'id, leadId, version, actor, createdAt',
      supplyBrands: 'id, category, active, sortOrder',
      posTransactions: 'id, artistId, clientId, paymentStatus, createdAt',
      studioLocations: 'id, ownerId, managerId',
      invoices: 'id, invoiceNumber, artistId, clientId, paymentStatus, createdAt',
      competitors: 'id, category, status, nextCheckAt',
    });
    this.version(13).stores({
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
      leads: 'id, artistId, status, source, createdAt, nextFollowUpAt, paymentStatus, paymentMethod, paymentUpdatedAt',
      leadRevisions: 'id, leadId, version, actor, createdAt',
      supplyBrands: 'id, category, active, sortOrder',
      posTransactions: 'id, artistId, clientId, paymentStatus, createdAt',
      studioLocations: 'id, ownerId, managerId',
      invoices: 'id, invoiceNumber, artistId, clientId, paymentStatus, createdAt',
      competitors: 'id, category, status, nextCheckAt',
    });
    this.version(14).stores({
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
      leads: 'id, artistId, status, source, createdAt, nextFollowUpAt, paymentStatus, paymentMethod, paymentUpdatedAt',
      leadRevisions: 'id, leadId, version, actor, createdAt',
      supplyBrands: 'id, category, active, sortOrder',
      posTransactions: 'id, artistId, clientId, paymentStatus, createdAt',
      studioLocations: 'id, ownerId, managerId',
      invoices: 'id, invoiceNumber, artistId, clientId, paymentStatus, createdAt',
      competitors: 'id, category, status, nextCheckAt',
      supplyReviews: 'id, artistId, category, createdAt',
    });
    this.version(15).stores({
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
      leads: 'id, artistId, status, source, createdAt, nextFollowUpAt, paymentStatus, paymentMethod, paymentUpdatedAt',
      leadRevisions: 'id, leadId, version, actor, createdAt',
      supplyBrands: 'id, category, active, sortOrder',
      posTransactions: 'id, artistId, clientId, paymentStatus, createdAt',
      studioLocations: 'id, ownerId, managerId',
      invoices: 'id, invoiceNumber, artistId, clientId, paymentStatus, createdAt',
      competitors: 'id, category, status, nextCheckAt',
      supplyReviews: 'id, artistId, category, createdAt',
      waitingList: 'id, artistId, status, preferredDate, createdAt',
      healthChecklists: 'id, artistId, locationId, lastInspectionAt, createdAt',
      communicationLog: 'id, clientId, appointmentId, artistId, createdAt',
    });
    this.version(16).stores({
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
      leads: 'id, artistId, status, source, createdAt, nextFollowUpAt, paymentStatus, paymentMethod, paymentUpdatedAt',
      leadRevisions: 'id, leadId, version, actor, createdAt',
      supplyBrands: 'id, category, active, sortOrder',
      posTransactions: 'id, artistId, clientId, paymentStatus, createdAt',
      studioLocations: 'id, ownerId, managerId',
      invoices: 'id, invoiceNumber, artistId, clientId, paymentStatus, createdAt',
      competitors: 'id, category, status, nextCheckAt',
      supplyReviews: 'id, artistId, category, createdAt',
      waitingList: 'id, artistId, status, preferredDate, createdAt',
      healthChecklists: 'id, artistId, locationId, lastInspectionAt, createdAt',
      communicationLog: 'id, clientId, appointmentId, artistId, createdAt',
      affiliateClicks: 'id, userId, brandId, clickedAt',
    });
    this.version(18).stores({
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
      leads: 'id, artistId, status, source, createdAt, nextFollowUpAt, paymentStatus, paymentMethod, paymentUpdatedAt',
      leadRevisions: 'id, leadId, version, actor, createdAt',
      supplyBrands: 'id, category, active, sortOrder',
      posTransactions: 'id, artistId, clientId, paymentStatus, createdAt',
      studioLocations: 'id, ownerId, managerId',
      invoices: 'id, invoiceNumber, artistId, clientId, paymentStatus, createdAt',
      competitors: 'id, category, status, nextCheckAt',
      supplyReviews: 'id, artistId, category, createdAt',
      waitingList: 'id, artistId, status, preferredDate, createdAt',
      healthChecklists: 'id, artistId, locationId, lastInspectionAt, createdAt',
      communicationLog: 'id, clientId, appointmentId, artistId, createdAt',
      affiliateClicks: 'id, userId, brandId, clickedAt',
    });

    this.version(19).stores({
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
      leads: 'id, artistId, status, source, createdAt, nextFollowUpAt, paymentStatus, paymentMethod, paymentUpdatedAt',
      leadRevisions: 'id, leadId, version, actor, createdAt',
      supplyBrands: 'id, category, active, sortOrder',
      posTransactions: 'id, artistId, clientId, paymentStatus, createdAt',
      studioLocations: 'id, ownerId, managerId',
      invoices: 'id, invoiceNumber, artistId, clientId, paymentStatus, createdAt',
      competitors: 'id, category, status, nextCheckAt',
      supplyReviews: 'id, artistId, category, createdAt',
      waitingList: 'id, artistId, status, preferredDate, createdAt',
      healthChecklists: 'id, artistId, locationId, lastInspectionAt, createdAt',
      communicationLog: 'id, clientId, appointmentId, artistId, createdAt',
      affiliateClicks: 'id, userId, brandId, clickedAt',
    });

    this.version(17).stores({
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
      leads: 'id, artistId, status, source, createdAt, nextFollowUpAt, paymentStatus, paymentMethod, paymentUpdatedAt',
      leadRevisions: 'id, leadId, version, actor, createdAt',
      supplyBrands: 'id, category, active, sortOrder',
      posTransactions: 'id, artistId, clientId, paymentStatus, createdAt',
      studioLocations: 'id, ownerId, managerId',
      invoices: 'id, invoiceNumber, artistId, clientId, paymentStatus, createdAt',
      competitors: 'id, category, status, nextCheckAt',
      supplyReviews: 'id, artistId, category, createdAt',
      waitingList: 'id, artistId, status, preferredDate, createdAt',
      healthChecklists: 'id, artistId, locationId, lastInspectionAt, createdAt',
      communicationLog: 'id, clientId, appointmentId, artistId, createdAt',
      affiliateClicks: 'id, userId, brandId, clickedAt',
    });
  }
}

export const db = new InkFlowDB();

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  roles: Array<'artist' | 'owner' | 'staff' | 'dev'>;
  plan?: 'free' | 'pro' | 'plus';
  artistId?: string;
  deviceId?: string;
  verified: boolean;
  verificationType?: 'shop' | 'competition' | 'social';
  verificationStatus?: 'pending' | 'approved' | 'rejected';
  verificationScore?: number;
  socialLinks?: string[];
  studioName?: string;
  licenseShopName?: string;
  googleDriveConnected?: boolean;
  googleDriveFolderId?: string;
  lastBackupAt?: number;
  proDaysLeft?: number;
  paymentProvider?: 'stripe_connect' | 'square' | 'manual';
  enabledPaymentMethods?: Array<'stripe_connect' | 'manual_link' | 'bank_transfer' | 'cash' | 'paypal'>;
  stripeAccountId?: string;
  paymentLinkTemplate?: string;
  country?: string;
  paymentCurrency?: string;
  paymentDefaultDeposit?: string;
  commissionRate?: number;
  bankTransferInstructions?: string;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  daysOff?: string[];
  instagramHandle?: string;
  whatsappPhone?: string;
  appointmentRemindersEnabled?: boolean;
  smsEnabled?: boolean;
  smsCredits?: number;
  smsFreeUntil?: number;
  smsUsedToday?: number;
  smsLastDate?: string;
  smsFreeUsed?: number;
  emailEnabled?: boolean;
  emailAddress?: string;
  assignedLocationIds?: string[];
  stations?: { name: string; color: string }[];
  reviewLinks?: { google?: string; platform2Name?: string; platform2Url?: string; platform3Name?: string; platform3Url?: string };
  bioProfile?: { slug?: string; avatarUrl?: string; displayName: string; shopName?: string; address?: string; bookingEnabled: boolean; links: Array<{ id: string; label: string; url: string; icon?: string }>; portfolioImages?: string[] };
  bioEvents?: Array<{ id: string; type: 'convention' | 'guest_spot'; city: string; country?: string; venue: string; startDate: string; endDate: string; active: boolean }>;
  createdAt: number;
}

export interface StudioLocationRecord {
  id: string;
  ownerId: string;
  managerId?: string;
  name: string;
  address?: string;
  phone?: string;
  createdAt: number;
}

export interface ClientRecord {
  id: string; name: string; artistId?: string; phone?: string; email?: string;
  allergies?: string[]; notes?: string; birthday?: string;
  tags?: string[]; lastVisitAt?: number; totalSpend?: number; leadSource?: string;
  noShowCount?: number;
  createdAt: number;
}

export interface AppointmentRecord {
  id: string; clientId: string; projectId?: string; artistId: string; date: string;
  time: string; duration: number; type?: string;
  status: 'unconfirmed'|'deposit_paid'|'ready'|'attention'|'blocked'|'done'|'cancelled';
  waiverCompleted: boolean; depositAmount?: number; bodyPart?: string; designNotes?: string;
  station?: string; seriesId?: string;
  rescheduleRequest?: { proposedDate: string; proposedTime: string; requestedAt: number };
  reviewInvitedAt?: number;
  reviewFollowedUpAt?: number;
  reviewFollowUpCount?: number;
  createdAt: number;
}

export interface ProjectRecord {
  id: string; clientId: string; artistId: string; title: string; style?: string;
  bodyPart?: string; status: 'consultation'|'in_progress'|'completed'|'on_hold';
  totalSessions: number; completedSessions: number; createdAt: number;
}

export interface WaiverRecord {
  id: string; appointmentId: string; clientId: string; type: string;
  content: string; signature?: string; status: 'missing'|'signed';
  signedAt?: number; createdAt: number;
  auditDevice?: string;
  auditPlatform?: string;
  auditScreen?: string;
  auditStrokeCount?: number;
  auditDurationMs?: number;
  idPhoto?: string;
  clientDob?: string;
}

export interface SessionRecord {
  id: string; appointmentId: string; artistId: string;
  status: 'active'|'paused'|'completed'|'stopped';
  startedAt: number; pausedAt?: number; finishedAt?: number;
  actualDuration: number; timeline: TimelineEvent[];
  photos: string[]; notes: string[]; consumables: ConsumableUsage[];
}

export interface TimelineEvent {
  timestamp: number; type: 'start'|'pause'|'resume'|'photo'|'consumable'|'note'|'allergy'|'stop'|'done';
  payload?: string;
}

export interface ConsumableUsage { itemId: string; quantity: number; batchNumber?: string; }

export interface InventoryRecord {
  id: string; name: string; category: string; quantity: number;
  reorderLevel: number; unit: string; price?: number; sku?: string; sellable?: boolean;
  batchNumber?: string; batchPhotoUrl?: string; reorderUrl?: string;
  createdAt: number;
}

export interface PosLineItem {
  type: 'product' | 'service';
  inventoryId?: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface PosTransactionRecord {
  id: string;
  artistId: string;
  clientId?: string;
  walkInName?: string;
  appointmentId?: string;
  items: PosLineItem[];
  subtotal: number;
  depositApplied?: number;
  tip?: number;
  tax?: number;
  total: number;
  locationId?: string;
  paymentMethod: 'cash' | 'card' | 'other';
  paymentStatus: 'completed' | 'refunded';
  refundReason?: string;
  receiptNumber: string;
  createdAt: number;
}

export interface PortfolioRecord {
  id: string; artistId: string; projectId?: string; imageUrl: string;
  thumbnailUrl?: string; tags: string[]; isPublic: boolean;
  consentForSocial: boolean; consentForPromotion: boolean; createdAt: number;
}

export interface SocialDraftRecord {
  id: string; portfolioId: string; platform: 'instagram'|'youtube';
  status: 'draft'|'submitted'|'approved'|'published';
  caption: string; hashtags: string; imageUrls: string[]; createdAt: number;
}

export interface ReferralRecord {
  id: string; inviterId: string; inviteeId: string;
  status: 'pending'|'registered'|'verified'|'rewarded';
  rewardGranted: boolean; createdAt: number;
}

export interface LeadRecord {
  id: string;
  artistId: string;
  name: string;
  phone?: string;
  email?: string;
  source: 'instagram' | 'facebook' | 'tiktok' | 'referral' | 'walk_in' | 'other';
  creativeId?: string;
  consultMode?: 'online_chat' | 'consult_booking' | 'walk_in_direct';
  status: 'new' | 'contacted' | 'booked' | 'won' | 'lost';
  paymentMethod?: 'stripe_connect' | 'manual_link' | 'bank_transfer' | 'cash' | 'paypal';
  paymentStatus?: 'unpaid' | 'pending_verify' | 'paid' | 'refunded' | 'waived';
  paymentAmount?: string;
  paymentCurrency?: string;
  paymentIntentId?: string;
  paymentProofImages?: string[];
  paymentProofNote?: string;
  paymentRefundReason?: string;
  paymentRejectReason?: string;
  paymentUpdatedAt?: number;
  bodyPart?: string;
  style?: string;
  size?: string;
  budget?: string;
  preferredDate?: string;
  preferredTime?: string;
  note?: string;
  changeRequest?: string;
  referenceImages?: string[];
  allergies?: string[];
  allergySeverity?: 'low' | 'medium' | 'high';
  allergyNote?: string;
  finalRevisionId?: string;
  finalRevisionVersion?: number;
  nextFollowUpAt?: number;
  createdAt: number;
}

export interface LeadRevisionRecord {
  id: string;
  leadId: string;
  version: number;
  actor: 'client' | 'artist' | 'staff';
  channel?: 'instagram' | 'facebook' | 'whatsapp' | 'sms' | 'tiktok' | 'other';
  note?: string;
  changeRequest?: string;
  referenceImages?: string[];
  createdAt: number;
}

export interface SupplyProduct {
  id: string;
  name: string;
  imageUrl: string;
  price: string;
  affiliateLink: string;
  note: string;
  isNew?: boolean;
  createdAt?: number;
  clickCount?: number;
  shipsTo?: string[];
}

export interface SupplyBrandRecord {
  id: string;
  name: string;
  category: 'ink' | 'needles' | 'machines' | 'aftercare' | 'furniture' | 'other';
  description: string;
  logoUrl: string;
  affiliateLink: string;
  commissionNote?: string;
  products: SupplyProduct[];
  sortOrder: number;
  active: boolean;
  featured?: boolean;
  featuredTier?: 'basic' | 'premium';
  featuredUntil?: number;
  clickCount?: number;
  shipsTo?: string[];
  createdAt: number;
}

export interface CompetitorFeature {
  name: string;
  notes: string;
  rating: 'best' | 'good' | 'basic' | 'missing';
}

export interface CompetitorRecord {
  id: string;
  name: string;
  website: string;
  category: 'studio_mgmt' | 'booking' | 'pos' | 'marketing' | 'crm' | 'other';
  description: string;
  logoUrl?: string;
  features: CompetitorFeature[];
  pricing?: string;
  strengths?: string;
  weaknesses?: string;
  status: 'active' | 'tracking' | 'archived';
  lastCheckedAt: number;
  nextCheckAt: number;
  createdAt: number;
}

export interface SupplyReviewRecord {
  id: string;
  productName: string;
  productId?: string;
  category: 'ink' | 'needles' | 'machines' | 'aftercare' | 'furniture' | 'other';
  body: string;
  pros?: string;
  cons?: string;
  tags: string[];
  buyAgain?: boolean;
  photos: string[];
  artistId: string;
  isAnonymous: boolean;
  helpfulCount: number;
  createdAt: number;
}

export interface InvoiceLineItem {
  type: 'product' | 'service';
  inventoryId?: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface InvoicePayment {
  method: string;
  amount: number;
  paidAt?: number;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  artistId: string;
  clientId?: string;
  walkInName?: string;
  items: InvoiceLineItem[];
  subtotal: number;
  tax?: number;
  taxRate?: number;
  depositApplied?: number;
  tip?: number;
  total: number;
  currency: string;
  country: string;
  paymentMethod: 'cash' | 'card' | 'stripe_connect' | 'manual_link' | 'bank_transfer' | 'paypal' | 'other';
  payments?: InvoicePayment[];
  paymentStatus: 'pending' | 'paid' | 'cancelled' | 'refunded';
  posTransactionId?: string;
  appointmentId?: string;
  notes?: string;
  locationId?: string;
  sentAt?: number;
  sentVia?: 'whatsapp' | 'email' | 'share' | 'copy';
  dueDate?: number;
  amountPaid?: number;
  createdAt: number;
  paidAt?: number;
}

export interface WaitingListRecord {
  id: string;
  artistId: string;
  clientId?: string;
  name: string;
  phone?: string;
  email?: string;
  bodyPart?: string;
  style?: string;
  preferredDate?: string;
  preferredTime?: string;
  preferredContact?: 'whatsapp' | 'instagram' | 'phone' | 'email';
  status: 'waiting' | 'offered' | 'accepted' | 'declined' | 'expired';
  offeredDate?: string;
  offeredTime?: string;
  note?: string;
  createdAt: number;
}

export interface HealthChecklistRecord {
  id: string;
  artistId: string;
  locationId?: string;
  country?: string;
  name: string;
  items: HealthCheckItem[];
  lastInspectionAt?: number;
  nextInspectionDue?: number;
  inspectorName?: string;
  notes?: string;
  passedAll?: boolean;
  createdAt: number;
}

export interface HealthCheckItem {
  key: string;
  label: string;
  passed?: boolean;
  notes?: string;
  required: boolean;
}

export interface CommunicationLogRecord {
  id: string;
  artistId: string;
  clientId?: string;
  appointmentId?: string;
  channel: 'whatsapp' | 'instagram' | 'phone' | 'email' | 'sms' | 'app_note' | 'reminder_sent';
  direction: 'outbound' | 'inbound' | 'auto';
  message?: string;
  templateType?: string;
  cost?: number;
  createdAt: number;
}

export interface AffiliateClickRecord {
  id: string;
  userId: string;
  brandId: string;
  brandName: string;
  productId?: string;
  productName?: string;
  affiliateLink: string;
  sourcePage: 'supply_brands' | 'supply_new' | 'competitors' | 'other';
  clickedAt: number;
}
