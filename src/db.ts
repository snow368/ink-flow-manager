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
  auditLog!: Table<AuditLogRecord>;
  shifts!: Table<ShiftRecord>;
  tasks!: Table<TaskRecord>;
  reviews!: Table<ReviewRecord>;
  clientReferrals!: Table<ClientReferralRecord>;
  leadConfirmations!: Table<LeadConfirmationRecord>;
  projectAssets!: Table<ProjectAssetRecord>;
  projectApprovalTokens!: Table<ProjectApprovalTokenRecord>;
  depositFlow!: Table<DepositFlowRecord>;
  projectRevisions!: Table<ProjectRevisionRecord>;
  photos!: Table<PhotoRecord>;

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

    this.version(20).stores({
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
      auditLog: 'id, actorId, action, tableName, recordId, artistId, createdAt',
      shifts: 'id, artistId, staffId, locationId, date, createdAt',
      tasks: 'id, artistId, assigneeId, locationId, status, dueDate, priority, createdAt',
    });
    this.version(21).stores({
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
      auditLog: 'id, actorId, action, tableName, recordId, artistId, createdAt',
      shifts: 'id, artistId, staffId, locationId, date, createdAt',
      tasks: 'id, artistId, assigneeId, locationId, status, dueDate, priority, createdAt',
      reviews: 'id, artistId, appointmentId, clientId, createdAt',
      clientReferrals: 'id, artistId, clientId, code, createdAt',
    });
    this.version(22).stores({
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
      auditLog: 'id, actorId, action, tableName, recordId, artistId, createdAt',
      shifts: 'id, artistId, staffId, locationId, date, createdAt',
      tasks: 'id, artistId, assigneeId, locationId, status, dueDate, priority, createdAt',
      reviews: 'id, artistId, appointmentId, clientId, createdAt',
      clientReferrals: 'id, artistId, clientId, code, slug, createdAt',
    });
    this.version(23).stores({
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
      auditLog: 'id, actorId, action, tableName, recordId, artistId, createdAt',
      shifts: 'id, artistId, staffId, locationId, date, createdAt',
      tasks: 'id, artistId, assigneeId, locationId, status, dueDate, priority, createdAt',
      reviews: 'id, artistId, appointmentId, clientId, createdAt',
      clientReferrals: 'id, artistId, clientId, code, slug, createdAt',
    }).upgrade(async (tx) => {
      // Migrate old plan names to new tiers
      await tx.table('users').toCollection().modify((user: any) => {
        if (user.plan === 'pro') user.plan = 'solo';
        else if (user.plan === 'plus') user.plan = 'pro';
      });
    });
    this.version(24).stores({
      users: 'id, email, role, artistId, deviceId, createdAt',
      clients: 'id, name, artistId, createdAt',
      appointments: 'id, clientId, projectId, artistId, date, status, createdAt',
      projects: 'id, clientId, artistId, status, createdAt',
      waivers: 'id, appointmentId, clientId, status, createdAt',
      sessions: 'id, appointmentId, artistId, status, startedAt',
      inventory: 'id, name, category, locationId',
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
      auditLog: 'id, actorId, action, tableName, recordId, artistId, createdAt',
      shifts: 'id, artistId, staffId, locationId, date, createdAt',
      tasks: 'id, artistId, assigneeId, locationId, status, dueDate, priority, createdAt',
      reviews: 'id, artistId, appointmentId, clientId, createdAt',
      clientReferrals: 'id, artistId, clientId, code, slug, createdAt',
    });
    this.version(25).stores({
      users: 'id, email, role, artistId, deviceId, createdAt',
      clients: 'id, name, artistId, createdAt',
      appointments: 'id, projectId, clientId, artistId, date, status, createdAt',
      projects: 'id, clientId, artistId, status, sourceLeadId, createdAt, updatedAt',
      waivers: 'id, appointmentId, projectId, clientId, status, createdAt',
      sessions: 'id, projectId, appointmentId, artistId, status, startedAt',
      inventory: 'id, name, category, locationId',
      portfolio: 'id, artistId, projectId, createdAt',
      socialDrafts: 'id, platform, status, createdAt',
      referrals: 'id, inviterId, inviteeId, status, createdAt',
      leads: 'id, artistId, status, source, createdAt, nextFollowUpAt, paymentStatus, paymentMethod, paymentUpdatedAt, convertedProjectId',
      leadRevisions: 'id, leadId, version, actor, createdAt',
      supplyBrands: 'id, category, active, sortOrder',
      posTransactions: 'id, artistId, clientId, projectId, paymentStatus, createdAt',
      studioLocations: 'id, ownerId, managerId',
      invoices: 'id, invoiceNumber, artistId, clientId, projectId, paymentStatus, createdAt',
      competitors: 'id, category, status, nextCheckAt',
      supplyReviews: 'id, artistId, category, createdAt',
      waitingList: 'id, artistId, status, preferredDate, createdAt',
      healthChecklists: 'id, artistId, locationId, lastInspectionAt, createdAt',
      communicationLog: 'id, clientId, appointmentId, projectId, artistId, createdAt',
      affiliateClicks: 'id, userId, brandId, clickedAt',
      auditLog: 'id, actorId, action, tableName, recordId, artistId, createdAt',
      shifts: 'id, artistId, staffId, locationId, date, createdAt',
      tasks: 'id, artistId, assigneeId, locationId, status, dueDate, priority, createdAt',
      reviews: 'id, artistId, appointmentId, projectId, clientId, createdAt',
      clientReferrals: 'id, artistId, clientId, code, slug, createdAt',
    }).upgrade(async (tx) => {
      try {
        const { runTattooOsV25Migration } = await import('./lib/migrations/tattooOsV25');
        await runTattooOsV25Migration(tx);
        localStorage.setItem('inkflow_migration_v25_done', '1');
        localStorage.setItem('inkflow_schema_version', '25');
      } catch (err) {
        console.error('[InkFlow] Dexie v25 upgrade failed; dual-read fallbacks active', err);
      }
    });
    this.version(26).stores({
      users: 'id, email, role, artistId, deviceId, createdAt',
      clients: 'id, name, artistId, createdAt',
      appointments: 'id, projectId, clientId, artistId, date, status, createdAt',
      projects: 'id, clientId, artistId, status, sourceLeadId, createdAt, updatedAt',
      waivers: 'id, appointmentId, projectId, clientId, status, createdAt',
      sessions: 'id, projectId, appointmentId, artistId, status, startedAt',
      inventory: 'id, name, category, locationId',
      portfolio: 'id, artistId, projectId, createdAt',
      socialDrafts: 'id, platform, status, createdAt',
      referrals: 'id, inviterId, inviteeId, status, createdAt',
      leads: 'id, artistId, status, source, createdAt, nextFollowUpAt, paymentStatus, paymentMethod, paymentUpdatedAt, convertedProjectId, leadPipelineStatus, lastContactedAt',
      leadRevisions: 'id, leadId, version, actor, createdAt',
      supplyBrands: 'id, category, active, sortOrder',
      posTransactions: 'id, artistId, clientId, projectId, paymentStatus, createdAt',
      studioLocations: 'id, ownerId, managerId',
      invoices: 'id, invoiceNumber, artistId, clientId, projectId, paymentStatus, createdAt',
      competitors: 'id, category, status, nextCheckAt',
      supplyReviews: 'id, artistId, category, createdAt',
      waitingList: 'id, artistId, status, preferredDate, createdAt',
      healthChecklists: 'id, artistId, locationId, lastInspectionAt, createdAt',
      communicationLog: 'id, clientId, appointmentId, projectId, artistId, createdAt',
      affiliateClicks: 'id, userId, brandId, clickedAt',
      auditLog: 'id, actorId, action, tableName, recordId, artistId, createdAt',
      shifts: 'id, artistId, staffId, locationId, date, createdAt',
      tasks: 'id, artistId, assigneeId, locationId, status, dueDate, priority, createdAt',
      reviews: 'id, artistId, appointmentId, projectId, clientId, createdAt',
      clientReferrals: 'id, artistId, clientId, code, slug, createdAt',
      leadConfirmations: 'id, artistId, leadId, status, confirmationToken, createdAt',
    });
    this.version(27).stores({
      users: 'id, email, role, artistId, deviceId, createdAt',
      clients: 'id, name, artistId, createdAt',
      appointments: 'id, projectId, clientId, artistId, date, status, createdAt',
      projects: 'id, clientId, artistId, status, sourceLeadId, createdAt, updatedAt',
      waivers: 'id, appointmentId, projectId, clientId, status, createdAt',
      sessions: 'id, projectId, appointmentId, artistId, status, startedAt',
      inventory: 'id, name, category, locationId',
      portfolio: 'id, artistId, projectId, createdAt',
      socialDrafts: 'id, platform, status, createdAt',
      referrals: 'id, inviterId, inviteeId, status, createdAt',
      leads: 'id, artistId, status, source, createdAt, nextFollowUpAt, paymentStatus, paymentMethod, paymentUpdatedAt, convertedProjectId, leadPipelineStatus, lastContactedAt',
      leadRevisions: 'id, leadId, version, actor, createdAt',
      supplyBrands: 'id, category, active, sortOrder',
      posTransactions: 'id, artistId, clientId, projectId, paymentStatus, createdAt',
      studioLocations: 'id, ownerId, managerId',
      invoices: 'id, invoiceNumber, artistId, clientId, projectId, paymentStatus, createdAt',
      competitors: 'id, category, status, nextCheckAt',
      supplyReviews: 'id, artistId, category, createdAt',
      waitingList: 'id, artistId, status, preferredDate, createdAt',
      healthChecklists: 'id, artistId, locationId, lastInspectionAt, createdAt',
      communicationLog: 'id, clientId, appointmentId, projectId, artistId, createdAt',
      affiliateClicks: 'id, userId, brandId, clickedAt',
      auditLog: 'id, actorId, action, tableName, recordId, artistId, createdAt',
      shifts: 'id, artistId, staffId, locationId, date, createdAt',
      tasks: 'id, artistId, assigneeId, locationId, status, dueDate, priority, createdAt',
      reviews: 'id, artistId, appointmentId, projectId, clientId, createdAt',
      clientReferrals: 'id, artistId, clientId, code, slug, createdAt',
      leadConfirmations: 'id, artistId, leadId, status, confirmationToken, createdAt',
      projectAssets: 'id, projectId, artistId, type, createdAt',
      projectApprovalTokens: 'token, projectId, assetId, artistId, createdAt',
    });
    this.version(28).stores({
      users: 'id, email, role, artistId, deviceId, createdAt',
      clients: 'id, name, artistId, createdAt',
      appointments: 'id, projectId, clientId, artistId, date, status, createdAt',
      projects: 'id, clientId, artistId, status, sourceLeadId, createdAt, updatedAt',
      waivers: 'id, appointmentId, projectId, clientId, status, createdAt',
      sessions: 'id, projectId, appointmentId, artistId, status, startedAt',
      inventory: 'id, name, category, locationId',
      portfolio: 'id, artistId, projectId, createdAt',
      socialDrafts: 'id, platform, status, createdAt',
      referrals: 'id, inviterId, inviteeId, status, createdAt',
      leads: 'id, artistId, status, source, createdAt, nextFollowUpAt, paymentStatus, paymentMethod, paymentUpdatedAt, convertedProjectId, leadPipelineStatus, lastContactedAt',
      leadRevisions: 'id, leadId, version, actor, createdAt',
      supplyBrands: 'id, category, active, sortOrder',
      posTransactions: 'id, artistId, clientId, projectId, paymentStatus, createdAt',
      studioLocations: 'id, ownerId, managerId',
      invoices: 'id, invoiceNumber, artistId, clientId, projectId, paymentStatus, createdAt',
      competitors: 'id, category, status, nextCheckAt',
      supplyReviews: 'id, artistId, category, createdAt',
      waitingList: 'id, artistId, status, preferredDate, createdAt',
      healthChecklists: 'id, artistId, locationId, lastInspectionAt, createdAt',
      communicationLog: 'id, clientId, appointmentId, projectId, artistId, createdAt',
      affiliateClicks: 'id, userId, brandId, clickedAt',
      auditLog: 'id, actorId, action, tableName, recordId, artistId, createdAt',
      shifts: 'id, artistId, staffId, locationId, date, createdAt',
      tasks: 'id, artistId, assigneeId, locationId, status, dueDate, priority, createdAt',
      reviews: 'id, artistId, appointmentId, projectId, clientId, createdAt',
      clientReferrals: 'id, artistId, clientId, code, slug, createdAt',
      leadConfirmations: 'id, artistId, leadId, status, confirmationToken, createdAt',
      projectAssets: 'id, projectId, artistId, type, createdAt',
      projectApprovalTokens: 'token, projectId, assetId, artistId, createdAt',
      depositFlow: 'id, leadId, artistId, depositStatus, createdAt',
    });
    this.version(29).stores({
      users: 'id, email, role, artistId, deviceId, createdAt',
      clients: 'id, name, artistId, createdAt',
      appointments: 'id, projectId, clientId, artistId, date, status, createdAt',
      projects: 'id, clientId, artistId, status, sourceLeadId, createdAt, updatedAt',
      waivers: 'id, appointmentId, projectId, clientId, status, createdAt',
      sessions: 'id, projectId, appointmentId, artistId, status, startedAt',
      inventory: 'id, name, category, locationId',
      portfolio: 'id, artistId, projectId, createdAt',
      socialDrafts: 'id, platform, status, createdAt',
      referrals: 'id, inviterId, inviteeId, status, createdAt',
      leads: 'id, artistId, status, source, createdAt, nextFollowUpAt, paymentStatus, paymentMethod, paymentUpdatedAt, convertedProjectId, leadPipelineStatus, lastContactedAt',
      leadRevisions: 'id, leadId, version, actor, createdAt',
      supplyBrands: 'id, category, active, sortOrder',
      posTransactions: 'id, artistId, clientId, projectId, paymentStatus, createdAt',
      studioLocations: 'id, ownerId, managerId',
      invoices: 'id, invoiceNumber, artistId, clientId, projectId, paymentStatus, createdAt',
      competitors: 'id, category, status, nextCheckAt',
      supplyReviews: 'id, artistId, category, createdAt',
      waitingList: 'id, artistId, status, preferredDate, createdAt',
      healthChecklists: 'id, artistId, locationId, lastInspectionAt, createdAt',
      communicationLog: 'id, clientId, appointmentId, projectId, artistId, createdAt',
      affiliateClicks: 'id, userId, brandId, clickedAt',
      auditLog: 'id, actorId, action, tableName, recordId, artistId, createdAt',
      shifts: 'id, artistId, staffId, locationId, date, createdAt',
      tasks: 'id, artistId, assigneeId, locationId, status, dueDate, priority, createdAt',
      reviews: 'id, artistId, appointmentId, projectId, clientId, createdAt',
      clientReferrals: 'id, artistId, clientId, code, slug, createdAt',
      leadConfirmations: 'id, artistId, leadId, status, confirmationToken, createdAt',
      projectAssets: 'id, projectId, artistId, type, createdAt',
      projectApprovalTokens: 'token, projectId, assetId, artistId, createdAt',
      depositFlow: 'id, leadId, artistId, depositStatus, createdAt',
      projectRevisions: 'id, projectId, artistId, status, approvalToken, createdAt',
    });
    this.version(30).stores({
      users: 'id, email, role, artistId, deviceId, createdAt',
      clients: 'id, name, artistId, createdAt',
      appointments: 'id, projectId, clientId, artistId, date, status, createdAt',
      projects: 'id, clientId, artistId, status, sourceLeadId, createdAt, updatedAt',
      waivers: 'id, appointmentId, projectId, clientId, status, createdAt',
      sessions: 'id, projectId, appointmentId, artistId, status, sessionState, startedAt',
      inventory: 'id, name, category, locationId',
      portfolio: 'id, artistId, projectId, createdAt',
      socialDrafts: 'id, platform, status, createdAt',
      referrals: 'id, inviterId, inviteeId, status, createdAt',
      leads: 'id, artistId, status, source, createdAt, nextFollowUpAt, paymentStatus, paymentMethod, paymentUpdatedAt, convertedProjectId, leadPipelineStatus, lastContactedAt',
      leadRevisions: 'id, leadId, version, actor, createdAt',
      supplyBrands: 'id, category, active, sortOrder',
      posTransactions: 'id, artistId, clientId, projectId, paymentStatus, createdAt',
      studioLocations: 'id, ownerId, managerId',
      invoices: 'id, invoiceNumber, artistId, clientId, projectId, paymentStatus, createdAt',
      competitors: 'id, category, status, nextCheckAt',
      supplyReviews: 'id, artistId, category, createdAt',
      waitingList: 'id, artistId, status, preferredDate, createdAt',
      healthChecklists: 'id, artistId, locationId, lastInspectionAt, createdAt',
      communicationLog: 'id, clientId, appointmentId, projectId, artistId, createdAt',
      affiliateClicks: 'id, userId, brandId, clickedAt',
      auditLog: 'id, actorId, action, tableName, recordId, artistId, createdAt',
      shifts: 'id, artistId, staffId, locationId, date, createdAt',
      tasks: 'id, artistId, assigneeId, locationId, status, dueDate, priority, createdAt',
      reviews: 'id, artistId, appointmentId, projectId, clientId, createdAt',
      clientReferrals: 'id, artistId, clientId, code, slug, createdAt',
      leadConfirmations: 'id, artistId, leadId, status, confirmationToken, createdAt',
      projectAssets: 'id, projectId, artistId, type, createdAt',
      projectApprovalTokens: 'token, projectId, assetId, artistId, createdAt',
      depositFlow: 'id, leadId, artistId, depositStatus, createdAt',
      projectRevisions: 'id, projectId, artistId, status, approvalToken, createdAt',
    });
    this.version(31).stores({
      users: 'id, email, role, artistId, deviceId, createdAt',
      clients: 'id, name, artistId, createdAt',
      appointments: 'id, projectId, clientId, artistId, date, status, createdAt',
      projects: 'id, clientId, artistId, status, sourceLeadId, createdAt, updatedAt',
      waivers: 'id, appointmentId, projectId, clientId, status, createdAt',
      sessions: 'id, projectId, appointmentId, artistId, status, sessionState, startedAt',
      inventory: 'id, name, category, locationId',
      portfolio: 'id, artistId, projectId, clientId, sessionId, createdAt',
      socialDrafts: 'id, platform, status, createdAt',
      referrals: 'id, inviterId, inviteeId, status, createdAt',
      leads: 'id, artistId, status, source, createdAt, nextFollowUpAt, paymentStatus, paymentMethod, paymentUpdatedAt, convertedProjectId, leadPipelineStatus, lastContactedAt',
      leadRevisions: 'id, leadId, version, actor, createdAt',
      supplyBrands: 'id, category, active, sortOrder',
      posTransactions: 'id, artistId, clientId, projectId, paymentStatus, createdAt',
      studioLocations: 'id, ownerId, managerId',
      invoices: 'id, invoiceNumber, artistId, clientId, projectId, paymentStatus, createdAt',
      competitors: 'id, category, status, nextCheckAt',
      supplyReviews: 'id, artistId, category, createdAt',
      waitingList: 'id, artistId, status, preferredDate, createdAt',
      healthChecklists: 'id, artistId, locationId, lastInspectionAt, createdAt',
      communicationLog: 'id, clientId, appointmentId, projectId, artistId, createdAt',
      affiliateClicks: 'id, userId, brandId, clickedAt',
      auditLog: 'id, actorId, action, tableName, recordId, artistId, createdAt',
      shifts: 'id, artistId, staffId, locationId, date, createdAt',
      tasks: 'id, artistId, assigneeId, locationId, status, dueDate, priority, createdAt',
      reviews: 'id, artistId, appointmentId, projectId, clientId, createdAt',
      clientReferrals: 'id, artistId, clientId, code, slug, createdAt',
      leadConfirmations: 'id, artistId, leadId, status, confirmationToken, createdAt',
      projectAssets: 'id, projectId, artistId, type, createdAt',
      projectApprovalTokens: 'token, projectId, assetId, artistId, createdAt',
      depositFlow: 'id, leadId, artistId, depositStatus, createdAt',
      projectRevisions: 'id, projectId, artistId, status, approvalToken, createdAt',
    });
    this.version(32).stores({
      users: 'id, email, role, artistId, deviceId, createdAt',
      clients: 'id, name, artistId, createdAt',
      appointments: 'id, projectId, clientId, artistId, date, status, createdAt',
      projects: 'id, clientId, artistId, status, sourceLeadId, createdAt, updatedAt',
      waivers: 'id, appointmentId, projectId, clientId, status, createdAt',
      sessions: 'id, projectId, appointmentId, artistId, status, sessionState, startedAt',
      inventory: 'id, name, category, locationId',
      portfolio: 'id, artistId, projectId, clientId, sessionId, sortOrder, createdAt',
      socialDrafts: 'id, platform, status, createdAt',
      referrals: 'id, inviterId, inviteeId, status, createdAt',
      leads: 'id, artistId, status, source, createdAt, nextFollowUpAt, paymentStatus, paymentMethod, paymentUpdatedAt, convertedProjectId, leadPipelineStatus, lastContactedAt',
      leadRevisions: 'id, leadId, version, actor, createdAt',
      supplyBrands: 'id, category, active, sortOrder',
      posTransactions: 'id, artistId, clientId, projectId, paymentStatus, createdAt',
      studioLocations: 'id, ownerId, managerId',
      invoices: 'id, invoiceNumber, artistId, clientId, projectId, paymentStatus, createdAt',
      competitors: 'id, category, status, nextCheckAt',
      supplyReviews: 'id, artistId, category, createdAt',
      waitingList: 'id, artistId, status, preferredDate, createdAt',
      healthChecklists: 'id, artistId, locationId, lastInspectionAt, createdAt',
      communicationLog: 'id, clientId, appointmentId, projectId, artistId, createdAt',
      affiliateClicks: 'id, userId, brandId, clickedAt',
      auditLog: 'id, actorId, action, tableName, recordId, artistId, createdAt',
      shifts: 'id, artistId, staffId, locationId, date, createdAt',
      tasks: 'id, artistId, assigneeId, locationId, status, dueDate, priority, createdAt',
      reviews: 'id, artistId, appointmentId, projectId, clientId, createdAt',
      clientReferrals: 'id, artistId, clientId, code, slug, createdAt',
      leadConfirmations: 'id, artistId, leadId, status, confirmationToken, createdAt',
      projectAssets: 'id, projectId, artistId, type, createdAt',
      projectApprovalTokens: 'token, projectId, assetId, artistId, createdAt',
      depositFlow: 'id, leadId, artistId, depositStatus, createdAt',
      projectRevisions: 'id, projectId, artistId, status, approvalToken, createdAt',
    });
    this.version(33).stores({
      users: 'id, email, role, artistId, deviceId, createdAt',
      clients: 'id, name, artistId, createdAt',
      appointments: 'id, projectId, clientId, artistId, date, status, createdAt',
      projects: 'id, clientId, artistId, status, sourceLeadId, createdAt, updatedAt',
      waivers: 'id, appointmentId, projectId, clientId, status, createdAt',
      sessions: 'id, projectId, appointmentId, artistId, status, sessionState, startedAt',
      inventory: 'id, name, category, locationId',
      portfolio: 'id, artistId, projectId, clientId, sessionId, sortOrder, createdAt',
      socialDrafts: 'id, platform, status, createdAt',
      referrals: 'id, inviterId, inviteeId, status, createdAt',
      leads: 'id, artistId, status, source, createdAt, nextFollowUpAt, paymentStatus, paymentMethod, paymentUpdatedAt, convertedProjectId, leadPipelineStatus, lastContactedAt',
      leadRevisions: 'id, leadId, version, actor, createdAt',
      supplyBrands: 'id, category, active, sortOrder',
      posTransactions: 'id, artistId, clientId, projectId, paymentStatus, createdAt',
      studioLocations: 'id, ownerId, managerId',
      invoices: 'id, invoiceNumber, artistId, clientId, projectId, paymentStatus, createdAt',
      competitors: 'id, category, status, nextCheckAt',
      supplyReviews: 'id, artistId, category, createdAt',
      waitingList: 'id, artistId, status, preferredDate, createdAt',
      healthChecklists: 'id, artistId, locationId, lastInspectionAt, createdAt',
      communicationLog: 'id, clientId, appointmentId, projectId, artistId, createdAt',
      affiliateClicks: 'id, userId, brandId, clickedAt',
      auditLog: 'id, actorId, action, tableName, recordId, artistId, createdAt',
      shifts: 'id, artistId, staffId, locationId, date, createdAt',
      tasks: 'id, artistId, assigneeId, locationId, status, dueDate, priority, createdAt',
      reviews: 'id, artistId, appointmentId, projectId, clientId, createdAt',
      clientReferrals: 'id, artistId, clientId, code, slug, createdAt',
      leadConfirmations: 'id, artistId, leadId, status, confirmationToken, createdAt',
      projectAssets: 'id, projectId, artistId, type, createdAt',
      projectApprovalTokens: 'token, projectId, assetId, artistId, createdAt',
      depositFlow: 'id, leadId, artistId, depositStatus, createdAt',
      projectRevisions: 'id, projectId, artistId, status, approvalToken, createdAt',
    });
    this.version(34).stores({
      photos: 'id, clientId, projectId, sessionId, artistId, bodyPart, step, date, status',
    });
  }
}

// ============================================================
// D1-backed db — transparent replacement for Dexie/IndexedDB
// All operations go through the Worker's /api/data/:type CRUD
// ============================================================

import { getBackendUrl } from './lib/backendApi';

function apiReq(): { url: string; headers: Record<string, string> } {
  const url = getBackendUrl();
  const secret = localStorage.getItem('inkflow_api_secret') || '';
  const uid = localStorage.getItem('inkflow_current_user') || '';
  if (!url) throw new Error('Backend URL not configured');
  return {
    url,
    headers: { 'Content-Type': 'application/json', 'x-api-secret': secret, 'x-user-id': uid },
  };
}

function tableName(type: string): string {
  // Map class property names to D1 type names
  const map: Record<string, string> = {
    users: 'user', clients: 'client', appointments: 'appointment', projects: 'project',
    waivers: 'waiver', sessions: 'session', inventory: 'inventory', portfolio: 'portfolio',
    socialDrafts: 'socialDraft', referrals: 'referral', leads: 'lead',
    leadRevisions: 'leadRevision', supplyBrands: 'supplyBrand',
    posTransactions: 'posTransaction', studioLocations: 'studioLocation',
    invoices: 'invoice', competitors: 'competitor', supplyReviews: 'supplyReview',
    waitingList: 'waitingList', healthChecklists: 'healthChecklist',
    communicationLog: 'communicationLog', affiliateClicks: 'affiliateClick',
    auditLog: 'auditLog', shifts: 'shift', tasks: 'task', reviews: 'review',
    clientReferrals: 'clientReferral', leadConfirmations: 'leadConfirmation',
    projectAssets: 'projectAsset', projectApprovalTokens: 'projectApprovalToken',
    depositFlow: 'depositFlow', projectRevisions: 'projectRevision', photos: 'photo',
  };
  return map[type] || type;
}

/** Build a table-like object that delegates to D1 CRUD */
function d1Table(type: string) {
  const t = tableName(type);

  async function request(method: string, path: string, body?: any): Promise<any> {
    const cfg = apiReq();
    const res = await fetch(cfg.url + path, { method, headers: cfg.headers, body: body ? JSON.stringify(body) : undefined });
    if (!res.ok) { const e = await res.json().catch(() => ({ error: res.statusText })); throw new Error(e.error || 'API error'); }
    return res.json();
  }

  function buildQuery(filters?: Record<string, string>): string {
    const params = new URLSearchParams(filters || {});
    const uid = localStorage.getItem('inkflow_current_user') || '';
    // Auto-add artistId for owner-scoped tables
    const ownerTables = ['client', 'appointment', 'project', 'session', 'lead', 'portfolio', 'socialDraft', 'inventory', 'posTransaction', 'invoice', 'task', 'shift'];
    if (ownerTables.includes(t) && !params.has('artistId')) params.set('artistId', uid);
    // For users, filter by id
    if (t === 'user' && !params.has('id')) params.set('id', uid);
    const qs = params.toString();
    return qs ? '?' + qs : '';
  }

  return {
    // Dexie-compatible where() builder (simple version — overridden post-hoc below)
    where(_field: string) {
      return {
        equals: () => this,
        startsWith: () => this,
        above: () => this,
        below: () => this,
        between: () => this,
        async first() { return null; },
        async toArray() { return []; },
        async delete() {},
        async modify() {},
        async each() {},
      };
    },

    // OrderBy (simple - just returns all)
    orderBy(_field: string) {
      return {
        async toArray() { const { items } = await request('GET', '/api/data/' + t + buildQuery()); return items || []; },
        async first() { const r = await request('GET', '/api/data/' + t + buildQuery({ limit: '1' })); return r?.items?.[0] || null; },
        async last() { const r = await request('GET', '/api/data/' + t + buildQuery()); const a = r?.items || []; return a[a.length - 1] || null; },
        reverse() { return this; },
      };
    },

    // Filter (client-side)
    filter(fn: (item: any) => boolean) {
      const tableType = t;
      return {
        async toArray() { const { items } = await request('GET', '/api/data/' + tableType + buildQuery()); return (items || []).filter(fn); },
        async first() { const arr = await this.toArray(); return arr[0] || null; },
        async count() { const arr = await this.toArray(); return arr.length; },
        async each(callback: (item: any) => void) { const arr = await this.toArray(); for (const item of arr) callback(item); },
        async modify(callback: (item: any) => void) { const arr = await this.toArray(); for (const item of arr) { callback(item); await request('POST', '/api/data/' + tableType, item); } },
        async delete() { const arr = await this.toArray(); for (const item of arr) await request('DELETE', '/api/data/' + tableType + '/' + (item.id || '')); },
        limit(n: number) {
          const self = this;
          return { ...this, async toArray() { const items = await self.toArray(); return Array.isArray(items) ? items.slice(0, n) : []; } };
        },
        offset(_n: number) { return { ...this }; },
        reverse() { return this; },
        and(fn2: (item: any) => boolean) {
          const self = this;
          return { ...this, async toArray() { const items = await self.toArray(); return Array.isArray(items) ? items.filter(fn2) : []; } };
        },
      };
    },

    // Limit
    limit(n: number) {
      return { ...this, async toArray() { const { items } = await request('GET', '/api/data/' + t + buildQuery({ limit: String(n) })); return items || []; } };
    },

    // Reverse
    reverse() { return this; },

    // Standard CRUD
    async get(id: string) { return request('GET', '/api/data/' + t + '/' + id); },
    async add(data: any) {
      const { ok, id } = await request('POST', '/api/data/' + t, { ...data, artistId: localStorage.getItem('inkflow_current_user') || '' });
      return { ...data, id };
    },
    async put(data: any) {
      const id = data.id || generateId(t);
      await request('POST', '/api/data/' + t, { ...data, id });
      return id;
    },
    async update(id: string, changes: any) {
      const existing = await this.get(id).catch(() => null);
      if (existing) await request('PUT', '/api/data/' + t + '/' + id, { ...existing, ...changes });
    },
    async delete(id: string) { return request('DELETE', '/api/data/' + t + '/' + id); },
    async clear() {
      const { items } = await request('GET', '/api/data/' + t + buildQuery());
      for (const item of items || []) await this.delete(item.id);
    },
    async bulkAdd(items: any[]) {
      for (const item of items) await this.add(item);
    },
    async toArray() { const { items } = await request('GET', '/api/data/' + t + buildQuery()); return items || []; },
    async count() { const arr = await this.toArray(); return arr.length; },
    async each(callback: (item: any) => void) { const arr = await this.toArray(); for (const item of arr) callback(item); },

    // Hook stubs (no-op for backward compat)
    hook(_event: string) {
      return { subscribe: (_fn: any) => {}, unsubscribe: () => {} };
    },
  };
}

function generateId(prefix: string): string {
  return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

// Build the db object with all 33 tables
const dbTables = ['users', 'clients', 'appointments', 'projects', 'waivers', 'sessions',
  'inventory', 'portfolio', 'socialDrafts', 'referrals', 'leads', 'leadRevisions',
  'supplyBrands', 'posTransactions', 'studioLocations', 'invoices', 'competitors',
  'supplyReviews', 'waitingList', 'healthChecklists', 'communicationLog', 'affiliateClicks',
  'auditLog', 'shifts', 'tasks', 'reviews', 'clientReferrals', 'leadConfirmations',
  'projectAssets', 'projectApprovalTokens', 'depositFlow', 'projectRevisions', 'photos',
];

const db: Record<string, any> = {};
for (const tbl of dbTables) {
  db[tbl] = d1Table(tbl);
}

// Fix the where() filter chain: remove self.put/self.delete which cause recursion
for (const tbl of dbTables) {
  const origWhere = db[tbl].where;
  db[tbl].where = function(field: string) {
    const t = db[tbl];
    const filters: Record<string, string> = {};
    const chain = {
      equals(val: string) { filters[field] = val; return chain; },
      startsWith(val: string) { filters[field] = val; return chain; },
      above() { return chain; },
      below() { return chain; },
      between() { return chain; },
      async first() { const arr = await chain.toArray(); return arr[0] || null; },
      async toArray() {
        if (field === 'id') {
          try { const r = await t.get(filters[field]); return r ? [r] : []; }
          catch { return []; }
        }
        const { items } = await apiReqGet(tbl);
        return (items || []).filter((item: any) => {
          if (field === 'email') return item.email === filters[field];
          return true; // artistId filtered server-side
        });
      },
      async delete() { const items = await chain.toArray(); for (const item of items) t.delete(item.id).catch(() => {}); },
      async modify(callback: (item: any) => void) { const items = await chain.toArray(); for (const item of items) { callback(item); t.put(item).catch(() => {}); } },
      async each(callback: (item: any) => void) { const items = await chain.toArray(); for (const item of items) callback(item); },
    };
    return chain;
  };
}

// Export
export { db };

async function apiReqGet(type: string): Promise<{ items: any[] }> {
  const cfg = apiReq();
  const uid = localStorage.getItem('inkflow_current_user') || '';
  const t = tableName(type);
  try {
    const res = await fetch(cfg.url + '/api/data/' + t + '?artistId=' + uid, { headers: cfg.headers });
    if (res.ok) return res.json();
  } catch {}
  return { items: [] };
}

// User-specific helpers
// Helper: get backend config
function apiCfg() {
  const url = getBackendUrl();
  return {
    url,
    headers: {
      'Content-Type': 'application/json',
      'x-api-secret': localStorage.getItem('inkflow_api_secret') || '',
      'x-user-id': localStorage.getItem('inkflow_current_user') || '',
    },
  };
}

db.users.get = async function(id: string) {
  const data = localStorage.getItem('inkflow_current_user_data');
  if (data) { try { return JSON.parse(data); } catch {} }
  return null;
};
db.users.where = function(field: string) {
  const filters: Record<string, string> = {};
  const chain = {
    equals(val: string) { filters[field] = val; return chain; },
    async first() {
      if (field === 'email') {
        const data = localStorage.getItem('inkflow_current_user_data');
        if (data) { try { const u = JSON.parse(data); if (u.email === filters[field]) return u; } catch {} }
      }
      return null;
    },
    async toArray() { const u = await db.users.get(''); return u ? [u] : []; },
  };
  return chain;
};
db.users.toArray = async function() {
  const data = localStorage.getItem('inkflow_current_user_data');
  return data ? [JSON.parse(data)] : [];
};
db.users.update = async function(id: string, changes: any) {
  // Update localStorage cache
  const existing = localStorage.getItem('inkflow_current_user_data');
  if (existing) {
    const updated = { ...JSON.parse(existing), ...changes };
    localStorage.setItem('inkflow_current_user_data', JSON.stringify(updated));
  }
  // Sync to D1 via API
  const cfg = apiCfg();
  if (cfg.url) {
    fetch(cfg.url + '/api/data/user/' + id, {
      method: 'PUT',
      headers: cfg.headers,
      body: JSON.stringify(changes),
    }).catch(() => {});
  }
};
db.users.add = async function(data: any) {
  localStorage.setItem('inkflow_current_user_data', JSON.stringify(data));
  localStorage.setItem('inkflow_current_user', data.id);
  return data.id;
};

// Expose for console debugging
(window as any).__db = db;

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  roles: Array<'artist' | 'owner' | 'staff' | 'dev'>;
  plan?: 'free' | 'solo' | 'pro' | 'pro_plus' | 'plus' | 'website_basic' | 'website_pro';
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
  autoAftercare?: boolean;
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
  googlePlaceId?: string;
  referralConfig?: { friendDiscount: number; referrerReward: number };
  b2bCreditMonths?: number;
  b2bCreditUsed?: number;
  createdAt: number;
  depositPolicy?: DepositPolicyConfig;
  permissions?: StaffPermission[];
  passwordHash?: string;
  proPlusOnboarded?: boolean;
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
  instagram?: string;
  allergies?: string[]; notes?: string; birthday?: string;
  tags?: string[]; lastVisitAt?: number; totalSpend?: number; leadSource?: string;
  noShowCount?: number;
  assignToArtistId?: string;
  createdAt: number;
}

export type ProjectStatus =
  | 'inquiry'
  | 'consultation'
  | 'design'
  | 'approved'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'on_hold'
  | 'cancelled';

/** Legacy appointment fields (pre–Tattoo OS); may remain on disk until migration compacts rows */
export type LegacyAppointmentFields = {
  seriesId?: string;
  bodyPart?: string;
  designNotes?: string;
  depositAmount?: number;
};

export interface AppointmentRecord {
  id: string;
  /** Required for new writes; optional on disk until v25 migration */
  projectId?: string;
  clientId: string;
  artistId: string;
  date: string;
  time: string;
  duration: number;
  type?: string;
  status:
    | 'draft'
    | 'unconfirmed'
    | 'deposit_paid'
    | 'ready'
    | 'attention'
    | 'blocked'
    | 'done'
    | 'cancelled';
  waiverCompleted: boolean;
  station?: string;
  walkIn?: boolean;
  rescheduleRequest?: { proposedDate: string; proposedTime: string; requestedAt: number };
  reviewInvitedAt?: number;
  reviewFollowedUpAt?: number;
  reviewFollowUpCount?: number;
  createdAt: number;
}

/** Raw IndexedDB row (includes legacy fields). Prefer resolve via projectAccess. */
export type StoredAppointmentRecord = AppointmentRecord & LegacyAppointmentFields;

export interface ProjectRecord {
  id: string;
  artistId: string;
  clientId: string;
  sourceLeadId?: string;
  title: string;
  style?: string;
  bodyPart?: string;
  designNotes?: string;
  referenceImages?: string[];
  status: ProjectStatus;
  plannedSessions?: number;
  /** @deprecated use plannedSessions */
  totalSessions?: number;
  completedSessions: number;
  depositAmount?: number;
  depositStatus?: 'none' | 'pending' | 'paid' | 'refunded';
  budget?: string;
  paymentStatus?: LeadRecord['paymentStatus'];
  paymentMethod?: LeadRecord['paymentMethod'];
  referrerCode?: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

export interface WaiverRecord {
  id: string; appointmentId: string; projectId?: string; clientId: string; type: string;
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

export type StoredSessionRecord = SessionRecord & { projectId?: string };

export interface SessionRecord {
  id: string;
  /** Required for new writes; optional on disk until v25 migration */
  projectId?: string;
  appointmentId?: string;
  clientId?: string;
  artistId: string;
  status: 'active'|'paused'|'completed'|'stopped';
  startedAt: number; pausedAt?: number; finishedAt?: number;
  actualDuration: number; timeline: TimelineEvent[];
  photos: string[]; notes: string[]; consumables: ConsumableUsage[];
  videos?: string[];

  /** v30+ extended session fields */
  sessionState?: 'scheduled' | 'checked_in' | 'stencil_ready' | 'tattooing' | 'break' | 'completed';
  timerStartedAt?: number;
  timerPausedAt?: number;
  accumulatedDurationMs?: number;
  breakCount?: number;
  stencilReadyAt?: number;
  completedAt?: number;
  aftercareSentAt?: number;
  progressPhotos?: {
    id: string;
    url: string;
    label?: string;
    createdAt: number;
  }[];
  sessionNotes?: {
    id: string;
    note: string;
    createdAt: number;
  }[];

  /** v31+ Aftercare & Healing fields */
  aftercareSchedule?: {
    day: number;
    sentAt: number;
  }[];
  healingPhotos?: {
    id: string;
    url: string;
    day?: number;
    note?: string;
    createdAt: number;
  }[];
  healingStatus?: 'healing' | 'stable' | 'fully_healed' | 'needs_touchup';
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
  locationId?: string;
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
  projectId?: string;
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
  id: string; artistId: string; projectId?: string; clientId?: string;
  sessionId?: string; imageUrl: string; thumbnailUrl?: string; tags: string[];
  isPublic: boolean; consentForSocial: boolean; consentForPromotion: boolean;
  source: 'upload' | 'session'; sortOrder: number; createdAt: number;
  serviceType?: string; isFlash?: boolean; isSold?: boolean;
}

export interface SocialDraftRecord {
  id: string; portfolioId: string;
  platform: 'instagram'|'youtube'|'facebook'|'pinterest';
  status: 'draft'|'submitted'|'approved'|'published';
  caption: string; hashtags: string; imageUrls: string[]; createdAt: number;
  gridDataUrl?: string;  /* base64 generated grid preview */
  selectedPhotoIds?: string[];
  watermarkText?: string;
}

export interface ReferralRecord {
  id: string; inviterId: string; inviteeId: string;
  status: 'pending'|'registered'|'verified'|'rewarded';
  rewardGranted: boolean; createdAt: number;
}

export interface ReviewRecord {
  id: string;
  artistId: string;
  clientId: string;
  clientName?: string;
  appointmentId?: string;
  projectId?: string;
  rating: number; // 1-5
  text?: string;
  source: 'inkflow' | 'google';
  googleReviewId?: string;
  createdAt: number;
}

export interface ClientReferralRecord {
  id: string;
  artistId: string;
  clientId: string;
  code: string;
  slug?: string;
  referrerName?: string;
  discountAmount: number; // referrer's reward ($ off)
  friendDiscountAmount: number; // friend's discount ($ off)
  status: 'active' | 'used';
  usedByLeadId?: string;
  usedAt?: number;
  createdAt: number;
}

export interface LeadRecord {
  id: string;
  artistId: string;
  name: string;
  phone?: string;
  email?: string;
  source: 'instagram' | 'facebook' | 'tiktok' | 'referral' | 'walk_in' | 'other';
  creativeId?: string;
  referrerCode?: string;
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
  leadPipelineStatus?: 'new_inquiry' | 'waiting_info' | 'waiting_references' | 'reviewing' | 'revision' | 'deposit_requested' | 'deposit_paid' | 'scheduled' | 'completed' | 'ghosted';
  lastContactedAt?: number;
  lastMessage?: string;
  convertedProjectId?: string;
  convertedAt?: number;
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

export interface LeadConfirmationRecord {
  id: string;
  artistId: string;
  leadId?: string;
  projectId?: string;
  extractedData: {
    placement?: string;
    style?: string;
    size?: string;
    budget?: string;
    references?: string[];
    requestedChanges?: string[];
    availability?: string;
  };
  missingFields: string[];
  status: 'draft' | 'sent' | 'viewed' | 'submitted' | 'deposit_requested' | 'completed';
  confirmationToken: string;
  createdAt: number;
  updatedAt: number;
  submittedAt?: number;
  viewedAt?: number;
}

export type ProjectAssetType =
  | 'client_reference'
  | 'artist_draft'
  | 'revision'
  | 'final_design'
  | 'stencil'
  | 'healed_photo';

export interface ProjectAssetRecord {
  id: string;
  projectId: string;
  artistId: string;
  type: ProjectAssetType;
  imageUrl: string;
  note?: string;
  uploadedBy: 'artist' | 'client';
  revisionNumber?: number;
  approved?: boolean;
  approvedAt?: number;
  createdAt: number;
}

export interface ProjectApprovalTokenRecord {
  token: string;
  projectId: string;
  assetId: string;
  artistId: string;
  expiresAt: number;
  viewedAt?: number;
  approvedAt?: number;
  revisionRequestedAt?: number;
  feedback?: string;
  createdAt: number;
}

export interface ProjectRevisionRecord {
  id: string;
  projectId: string;
  artistId: string;
  clientId?: string;
  version: number;
  imageUrls: string[];
  note?: string;
  status: 'draft' | 'sent' | 'viewed' | 'revision_requested' | 'approved';
  approvalToken?: string;
  requestedChanges?: {
    category: 'placement' | 'size' | 'style' | 'detail' | 'linework' | 'shading' | 'color' | 'wording' | 'other';
    note?: string;
  }[];
  viewedAt?: number;
  approvedAt?: number;
  revisionRequestedAt?: number;
  createdAt: number;
  sentAt?: number;
}

export interface DepositFlowRecord {
  id: string;
  leadId: string;
  artistId: string;
  quoteRange?: string;
  estimatedSessions?: number;
  depositAmount?: number;
  depositStatus: 'not_requested' | 'requested' | 'viewed' | 'paid' | 'expired' | 'declined';
  requestedAt?: number;
  viewedAt?: number;
  paidAt?: number;
  reminderCount: number;
  notes?: string;
  createdAt: number;
  updatedAt: number;
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
  projectId?: string;
  notes?: string;
  locationId?: string;
  sentAt?: number;
  sentVia?: 'whatsapp' | 'email' | 'share' | 'copy';
  dueDate?: number;
  amountPaid?: number;
  stripePaymentIntentId?: string;
  stripeSessionId?: string;
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
  projectId?: string;
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

export interface AuditLogRecord {
  id: string;
  actorId: string;
  actorName?: string;
  action: 'create' | 'update' | 'delete';
  tableName: string;
  recordId: string;
  artistId: string;
  diff?: Record<string, { from: any; to: any }>;
  createdAt: number;
}

export interface ShiftRecord {
  id: string;
  artistId: string;
  staffId?: string;
  locationId?: string;
  date: string;
  startTime: string;
  endTime: string;
  note?: string;
  createdAt: number;
}

export interface TaskRecord {
  id: string;
  artistId: string;
  assigneeId?: string;
  locationId?: string;
  clientId?: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'general' | 'inventory' | 'marketing' | 'client' | 'admin';
  dueDate?: number;
  completedAt?: number;
  createdAt: number;
}

export type StaffPermission = 'checkin' | 'inventory' | 'pos' | 'clients_view' | 'clients_edit' | 'appointments_view' | 'appointments_edit' | 'leads_view' | 'leads_edit' | 'invoices_view' | 'invoices_edit' | 'analytics_view';

export interface DepositPolicyConfig {
  onlineChat: PolicyItem;
  consultBooking: PolicyItem;
  directBooking: PolicyItem;
}

export interface PolicyItem {
  enabled: boolean;
  amountMode: 'fixed' | 'percent';
  amountValue: string;
  refundable: boolean;
  canRescheduleOnce: boolean;
  note?: string;
}

export interface PhotoRecord {
  id: string;
  clientId: string;
  projectId?: string;
  sessionId?: string;
  artistId: string;
  imageUrl: string;
  bodyPart: BodyPart;
  step: PhotoStep;
  date: number;
  note?: string;
  source: 'studio_camera' | 'gallery_import';
}

export type BodyPart = 'arm' | 'leg' | 'chest' | 'back' | 'hand' | 'foot' | 'neck' | 'face' | 'ribs' | 'hip' | 'shoulder' | 'other';
export type PhotoStep = 1 | 2 | 3 | 4 | 5 | 6;

export const PHOTO_STEPS = [
  { step: 1, label: '干净皮肤', key: 'before' },
  { step: 2, label: 'Stencil', key: 'stencil' },
  { step: 3, label: '刻线', key: 'outline' },
  { step: 4, label: '上色/打雾', key: 'shading' },
  { step: 5, label: '完成', key: 'fresh' },
  { step: 6, label: '包扎', key: 'wrapped' },
] as const;

export const BODY_PARTS: BodyPart[] = [
  'arm', 'leg', 'chest', 'back', 'hand', 'foot', 'neck', 'face', 'ribs', 'hip', 'shoulder', 'other'
];

export const BODY_PART_LABELS: Record<BodyPart, string> = {
  arm: '手臂', leg: '腿', chest: '胸', back: '背',
  hand: '手', foot: '脚', neck: '脖子', face: '脸',
  ribs: '肋骨', hip: '髋部', shoulder: '肩膀', other: '其他',
};
