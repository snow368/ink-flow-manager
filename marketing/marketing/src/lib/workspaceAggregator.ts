import { db, type LeadRecord, type AppointmentRecord, type ProjectRecord, type SessionRecord } from '../db';

export type WorkspaceCategory =
  | 'deposit_overdue'
  | 'ready_for_deposit'
  | 'ghost_risk'
  | 'revision_waiting'
  | 'missing_intake_info'
  | 'session_today'
  | 'aftercare'
  | 'repeat_booking';

export type PrimaryAction =
  | 'open_instagram_dm'
  | 'open_whatsapp'
  | 'copy_deposit_message'
  | 'copy_followup_message'
  | 'open_client_detail'
  | 'open_project_board'
  | 'start_session';

export interface WorkspaceItem {
  id: string;
  clientId: string;
  clientName: string;
  category: WorkspaceCategory;
  priority: number;
  urgency: number;
  title: string;
  businessImpact: string;
  primaryAction: PrimaryAction;
  primaryLabel: string;
  secondaryAction?: 'copy_message' | 'dismiss';
  timeIndicator: string;
  phone?: string;
  leadId?: string;
  appointmentId?: string;
  projectId?: string;
  message?: string;
  instagramHandle?: string;
}

const PRIORITY: Record<WorkspaceCategory, number> = {
  deposit_overdue: 1,
  ready_for_deposit: 2,
  ghost_risk: 3,
  revision_waiting: 4,
  missing_intake_info: 5,
  session_today: 6,
  aftercare: 7,
  repeat_booking: 8,
};

const CATEGORY_URGENCY_BASE: Record<WorkspaceCategory, number> = {
  deposit_overdue: 95,
  ready_for_deposit: 75,
  ghost_risk: 80,
  revision_waiting: 60,
  missing_intake_info: 50,
  session_today: 70,
  aftercare: 30,
  repeat_booking: 20,
};

function urgencyScore(category: WorkspaceCategory, ageHours: number): number {
  let base = CATEGORY_URGENCY_BASE[category];
  if (category === 'deposit_overdue') base += Math.min(ageHours / 24, 5);
  if (category === 'ghost_risk') base += Math.min(ageHours / 24, 10);
  if (category === 'session_today') {
    if (ageHours < 2) base += 20;
    else if (ageHours < 4) base += 10;
  }
  return Math.min(base, 100);
}

function ageHours(date: number): number {
  return (Date.now() - date) / 3600000;
}

function staleDays(createdAt: number): number {
  return Math.floor((Date.now() - createdAt) / 86400000);
}

export async function aggregateWorkspace(artistIds: string[]): Promise<WorkspaceItem[]> {
  const today = new Date().toISOString().slice(0, 10);
  const items: WorkspaceItem[] = [];
  const seenClients = new Set<string>();

  // Load all data in parallel
  const [allLeads, todayAppts, allProjects, allSessions] = await Promise.all([
    artistIds.length > 1
      ? db.leads.where('artistId').anyOf(artistIds).toArray()
      : db.leads.where('artistId').equals(artistIds[0] || '').toArray(),
    db.appointments.where('date').equals(today).toArray(),
    db.projects.toArray(),
    db.sessions.toArray(),
  ]);

  const todayApptsForArtist = todayAppts.filter(a => artistIds.includes(a.artistId));

  // Enrich with client names
  const clientIds = new Set<string>();
  allLeads.forEach(l => { if (l.convertedProjectId) clientIds.add(l.convertedProjectId); });
  todayApptsForArtist.forEach(a => clientIds.add(a.clientId));
  allProjects.forEach(p => clientIds.add(p.clientId));

  const clients = await db.clients.bulkGet([...clientIds]);
  const clientNameMap = new Map(clients.filter(Boolean).map(c => [c!.id, c!.name]));
  const clientIgMap = new Map(clients.filter(c => !!c?.instagram).map(c => [c!.id, c!.instagram]));

  // 1. deposit_overdue — unpaid/pending_verify > 48h
  for (const lead of allLeads) {
    if (lead.status === 'won' || lead.status === 'lost') continue;
    if (lead.paymentStatus !== 'unpaid' && lead.paymentStatus !== 'pending_verify') continue;
    const ageH = ageHours(lead.createdAt);
    if (ageH < 48) continue;
    if (seenClients.has(lead.id)) continue;
    seenClients.add(lead.id);
    items.push({
      id: `dep_${lead.id}`,
      clientId: lead.id,
      clientName: lead.name,
      category: 'deposit_overdue',
      priority: PRIORITY.deposit_overdue,
      urgency: urgencyScore('deposit_overdue', ageH),
      title: 'Deposit overdue',
      businessImpact: `$${lead.paymentAmount || '?'} pending — risk of losing this client`,
      primaryAction: 'copy_deposit_message',
      primaryLabel: 'Send Reminder',
      secondaryAction: 'dismiss',
      timeIndicator: staleDays(lead.createdAt) > 3 ? `${staleDays(lead.createdAt)}d overdue` : 'Overdue',
      phone: lead.phone,
      leadId: lead.id,
      message: buildDepositMessage(lead),
    });
  }

  // 2. ready_for_deposit — contacted, no payment pending, ready to move forward
  for (const lead of allLeads) {
    if (seenClients.has(lead.id)) continue;
    if (lead.status !== 'contacted' && lead.status !== 'new') continue;
    if (lead.paymentStatus === 'unpaid' || lead.paymentStatus === 'pending_verify') continue;
    seenClients.add(lead.id);
    items.push({
      id: `dep_ready_${lead.id}`,
      clientId: lead.id,
      clientName: lead.name,
      category: 'ready_for_deposit',
      priority: PRIORITY.ready_for_deposit,
      urgency: urgencyScore('ready_for_deposit', 0),
      title: 'Ready for deposit',
      businessImpact: 'Send payment link to lock this booking',
      primaryAction: 'copy_deposit_message',
      primaryLabel: 'Request Deposit',
      timeIndicator: lead.preferredDate ? `Target: ${lead.preferredDate}` : 'Waiting',
      phone: lead.phone,
      leadId: lead.id,
      message: buildDepositRequestMessage(lead),
    });
  }

  // 3. ghost_risk — new/contacted with no recent follow-up (>7 days)
  for (const lead of allLeads) {
    if (seenClients.has(lead.id)) continue;
    if (lead.status !== 'new' && lead.status !== 'contacted') continue;
    const lastContact = lead.lastContactedAt || lead.createdAt;
    const daysSince = staleDays(lastContact);
    if (daysSince < 7) continue;
    seenClients.add(lead.id);
    const fromIg = lead.source === 'instagram';
    items.push({
      id: `ghost_${lead.id}`,
      clientId: lead.id,
      clientName: fromIg ? `@${lead.name.replace('@', '')}` : lead.name,
      category: 'ghost_risk',
      priority: PRIORITY.ghost_risk,
      urgency: urgencyScore('ghost_risk', ageHours(lastContact)),
      title: `${daysSince}d no contact`,
      businessImpact: fromIg ? 'DM them now to re-engage' : `Lead is going cold — re-engage now`,
      primaryAction: fromIg ? 'open_instagram_dm' : 'copy_followup_message',
      primaryLabel: fromIg ? 'Instagram DM' : 'Follow Up',
      secondaryAction: 'dismiss',
      timeIndicator: `${daysSince}d ago`,
      phone: lead.phone,
      leadId: lead.id,
      instagramHandle: fromIg ? lead.name.replace('@', '') : undefined,
    });
  }

  // 4. revision_waiting — projects with pending revisions
  for (const project of allProjects) {
    if (!project.clientId || seenClients.has(project.clientId)) continue;
    if (project.status !== 'design' && project.status !== 'approved') continue;
    const revisions = await db.projectRevisions
      .where('projectId').equals(project.id)
      .filter(r => r.status === 'sent' || r.status === 'viewed')
      .toArray();
    if (revisions.length === 0) continue;
    seenClients.add(project.clientId);
    const clientName = clientNameMap.get(project.clientId) || 'Unknown';
    items.push({
      id: `rev_${project.id}`,
      clientId: project.clientId,
      clientName,
      category: 'revision_waiting',
      priority: PRIORITY.revision_waiting,
      urgency: urgencyScore('revision_waiting', 0),
      title: 'Revision pending feedback',
      businessImpact: 'Design is waiting — delay risks rescheduling',
      primaryAction: 'open_project_board',
      primaryLabel: 'View Design',
      timeIndicator: revisions.length > 0 && revisions[0].sentAt
        ? `${staleDays(revisions[0].sentAt)}d waiting` : 'Pending',
      projectId: project.id,
      instagramHandle: clientIgMap.get(project.clientId),
    });
  }

  // 5. missing_intake_info — leads waiting for info/references
  for (const lead of allLeads) {
    if (seenClients.has(lead.id)) continue;
    if (lead.leadPipelineStatus !== 'waiting_info' && lead.leadPipelineStatus !== 'waiting_references') continue;
    seenClients.add(lead.id);
    items.push({
      id: `info_${lead.id}`,
      clientId: lead.id,
      clientName: lead.name,
      category: 'missing_intake_info',
      priority: PRIORITY.missing_intake_info,
      urgency: urgencyScore('missing_intake_info', 0),
      title: lead.leadPipelineStatus === 'waiting_references' ? 'Missing references' : 'Missing info',
      businessImpact: 'Can\'t proceed with design until received',
      primaryAction: 'open_whatsapp',
      primaryLabel: 'Message Client',
      timeIndicator: lead.lastContactedAt ? `${staleDays(lead.lastContactedAt)}d` : 'New',
      phone: lead.phone,
      leadId: lead.id,
    });
  }

  // 6. session_today — appointments scheduled for today
  for (const appt of todayApptsForArtist) {
    if (appt.status === 'done' || appt.status === 'cancelled') continue;
    if (seenClients.has(appt.clientId)) continue;
    seenClients.add(appt.clientId);
    const client = clients.find(c => c?.id === appt.clientId);
    const clientName = client?.name || 'Unknown';
    const timeUntilAppt = timeUntil(appt.time);
    items.push({
      id: `session_${appt.id}`,
      clientId: appt.clientId,
      clientName,
      category: 'session_today',
      priority: PRIORITY.session_today,
      urgency: urgencyScore('session_today', timeUntilAppt),
      title: timeUntilAppt < 0 ? 'Session started' : `Session at ${appt.time}`,
      businessImpact: appt.type
        ? `${appt.type.replace(/_/g, ' ')} — ${appt.duration}min`
        : `${appt.duration}min appointment`,
      primaryAction: appt.status === 'ready' || appt.status === 'attention' ? 'start_session' : 'open_client_detail',
      primaryLabel: appt.status === 'ready' || appt.status === 'attention' ? 'Start Session' : 'View Details',
      timeIndicator: timeUntilAppt < 0 ? 'Now' : appt.time,
      phone: client?.phone,
      appointmentId: appt.id,
      projectId: appt.projectId,
      instagramHandle: clientIgMap.get(appt.clientId),
    });
  }

  // 7. aftercare — D1/D3/D7/D30 lifecycle via aftercare engine
  const user = await db.users.get(artistIds[0] || '');
  const userLang = typeof navigator !== 'undefined'
    ? (navigator.language?.startsWith('es') ? 'es' : navigator.language?.startsWith('pt') ? 'pt' : navigator.language?.startsWith('fr') ? 'fr' : navigator.language?.startsWith('de') ? 'de' : navigator.language?.startsWith('th') ? 'th' : navigator.language?.startsWith('ja') ? 'jp' : 'en')
    : 'en';
  const aftercareConfig = user ? {
    autoAftercare: user.autoAftercare ?? false,
    whatsappPhone: user.whatsappPhone,
    language: userLang,
    artistId: artistIds[0] || '',
  } : null;

  if (aftercareConfig) {
    const { getPendingAftercare } = await import('./aftercareEngine');
    const pending = await getPendingAftercare(aftercareConfig);
    for (const cp of pending) {
      if (seenClients.has(cp.clientId)) continue;
      seenClients.add(cp.clientId);
      const client = await db.clients.get(cp.clientId);
      if (!client) continue;
      const daysSince = Math.floor((Date.now() - (client.createdAt || Date.now())) / 86400000);
      items.push({
        id: `aftercare_${cp.day}_${cp.clientId}`,
        clientId: cp.clientId,
        clientName: client.name,
        category: 'aftercare',
        priority: PRIORITY.aftercare,
        urgency: cp.day === 'D1' ? 90 : cp.day === 'D3' ? 70 : cp.day === 'D7' ? 50 : 30,
        title: cp.day === 'D1' ? 'Aftercare D1 — immediate care needed'
          : cp.day === 'D3' ? 'Aftercare D3 — healing check-in'
          : cp.day === 'D7' ? 'Aftercare D7 — progress check'
          : 'Aftercare D30 — healed?',
        businessImpact: cp.day === 'D1'
          ? 'First 24h are critical for proper healing'
          : cp.day === 'D3'
            ? 'Check for itching/peeling — ensure proper care'
            : cp.day === 'D7'
              ? 'One week mark — most healing issues appear now'
              : 'Ready for repeat booking or touch-up evaluation',
        primaryAction: cp.channel === 'whatsapp' ? 'open_whatsapp' : 'copy_followup_message',
        primaryLabel: cp.mode === 'autoSend' ? 'Auto-sending...' : cp.channel === 'whatsapp' ? 'Send WhatsApp' : 'Copy Message',
        timeIndicator: cp.reason,
        phone: client.phone,
        message: cp.message,
      });
    }
  }

  // 8. repeat_booking — clients >6 months since last visit
  const sixMonthsAgo = Date.now() - 180 * 86400000;
  const allArtistClients = await db.clients
    .where('artistId')
    .anyOf(artistIds)
    .filter(c => !!c.lastVisitAt && c.lastVisitAt < sixMonthsAgo)
    .toArray();
  for (const client of allArtistClients) {
    if (seenClients.has(client.id)) continue;
    if (!client.lastVisitAt) continue;
    const monthsAway = Math.floor((Date.now() - client.lastVisitAt) / (30 * 86400000));
    if (monthsAway < 6) continue;
    seenClients.add(client.id);
    items.push({
      id: `repeat_${client.id}`,
      clientId: client.id,
      clientName: client.name,
      category: 'repeat_booking',
      priority: PRIORITY.repeat_booking,
      urgency: urgencyScore('repeat_booking', 0),
      title: `${monthsAway} months since last visit`,
      businessImpact: `Loyal client — a check-in could bring them back`,
      primaryAction: 'copy_followup_message',
      primaryLabel: 'Send Message',
      secondaryAction: 'dismiss',
      timeIndicator: `${monthsAway}mo ago`,
      phone: client.phone,
      instagramHandle: clientIgMap.get(client.id),
    });
  }

  // Sort by priority then urgency descending
  items.sort((a, b) => a.priority - b.priority || b.urgency - a.urgency);
  return items;
}

function timeUntil(time: string): number {
  const now = new Date();
  const [h, m] = time.split(':').map(Number);
  const apptTime = new Date();
  apptTime.setHours(h, m, 0, 0);
  return (apptTime.getTime() - now.getTime()) / 3600000;
}

function buildDepositMessage(lead: LeadRecord): string {
  const payLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/pay/${encodeURIComponent(lead.id)}`;
  return `Hi ${lead.name}, just a reminder — your deposit of $${lead.paymentAmount || '?'} is still pending.\nPlease complete here: ${payLink}`;
}

function buildDepositRequestMessage(lead: LeadRecord): string {
  const payLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/pay/${encodeURIComponent(lead.id)}`;
  return `Hi ${lead.name}! Ready to lock in your appointment. Please drop a deposit here: ${payLink}`;
}
