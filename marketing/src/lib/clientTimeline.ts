import { db } from '../db';
import type { DepositFlowRecord, ProjectRevisionRecord, SessionRecord } from '../db';

// ── Types ──

export type TimelineEventType =
  | 'lead_created'
  | 'lead_converted'
  | 'appointment_created'
  | 'appointment_cancelled'
  | 'appointment_done'
  | 'session_started'
  | 'session_break'
  | 'session_resumed'
  | 'session_completed'
  | 'revision_sent'
  | 'revision_viewed'
  | 'revision_approved'
  | 'revision_requested'
  | 'deposit_requested'
  | 'deposit_viewed'
  | 'deposit_paid'
  | 'deposit_expired'
  | 'deposit_declined'
  | 'aftercare_sent'
  | 'review_given'
  | 'photo_added'
  | 'message_sent'
  | 'message_received'
  | 'note'
  | 'aftercare_sent_day_1'
  | 'aftercare_sent_day_3'
  | 'aftercare_sent_day_7'
  | 'aftercare_sent_day_30'
  | 'healing_photo_uploaded'
  | 'healing_status_updated'
  | 'touchup_detected'
  | 'repeat_booking_suggested'
  | 'referral_suggested';

export interface ClientTimelineItem {
  id: string;
  type: TimelineEventType;
  timestamp: number;
  title: string;
  description?: string;
  projectTitle?: string;
  metadata?: Record<string, unknown>;
}

// ── Event display config ──

export const TIMELINE_EVENT_CONFIG: Record<TimelineEventType, { color: string; label: string }> = {
  lead_created: { color: '#60a5fa', label: 'Lead Created' },
  lead_converted: { color: '#22c55e', label: 'Converted to Client' },
  appointment_created: { color: '#a855f7', label: 'Appointment Booked' },
  appointment_cancelled: { color: '#ef4444', label: 'Appointment Cancelled' },
  appointment_done: { color: '#22c55e', label: 'Appointment Done' },
  session_started: { color: '#22c55e', label: 'Session Started' },
  session_break: { color: '#f97316', label: 'Break' },
  session_resumed: { color: '#22c55e', label: 'Session Resumed' },
  session_completed: { color: '#64748b', label: 'Session Completed' },
  revision_sent: { color: '#f59e0b', label: 'Revision Sent' },
  revision_viewed: { color: '#60a5fa', label: 'Revision Viewed' },
  revision_approved: { color: '#22c55e', label: 'Design Approved' },
  revision_requested: { color: '#f59e0b', label: 'Changes Requested' },
  deposit_requested: { color: '#f59e0b', label: 'Deposit Requested' },
  deposit_viewed: { color: '#60a5fa', label: 'Deposit Viewed' },
  deposit_paid: { color: '#22c55e', label: 'Deposit Paid' },
  deposit_expired: { color: '#ef4444', label: 'Deposit Expired' },
  deposit_declined: { color: '#ef4444', label: 'Deposit Declined' },
  aftercare_sent: { color: '#22c55e', label: 'Aftercare Sent' },
  review_given: { color: '#fbbf24', label: 'Review Given' },
  photo_added: { color: '#a855f7', label: 'Photo Added' },
  message_sent: { color: '#3b82f6', label: 'Message Sent' },
  message_received: { color: '#22c55e', label: 'Message Received' },
  note: { color: '#94a3b8', label: 'Note' },
  aftercare_sent_day_1: { color: '#22c55e', label: 'Aftercare Day 1' },
  aftercare_sent_day_3: { color: '#22c55e', label: 'Aftercare Day 3' },
  aftercare_sent_day_7: { color: '#22c55e', label: 'Aftercare Day 7' },
  aftercare_sent_day_30: { color: '#22c55e', label: 'Aftercare Day 30' },
  healing_photo_uploaded: { color: '#a855f7', label: 'Healing Photo' },
  healing_status_updated: { color: '#60a5fa', label: 'Healing Updated' },
  touchup_detected: { color: '#f97316', label: 'Touch-up Risk' },
  repeat_booking_suggested: { color: '#3b82f6', label: 'Repeat Booking' },
  referral_suggested: { color: '#f59e0b', label: 'Referral Opportunity' },
};

// ── Timeline Builder ──

export async function buildClientTimeline(
  clientId: string,
  projectId?: string,
): Promise<ClientTimelineItem[]> {
  const items: ClientTimelineItem[] = [];
  const projectFilter = projectId ? [projectId] : null;

  // 1. Projects
  const projects = await db.projects.where('clientId').equals(clientId).toArray();
  const filteredProjects = projectFilter
    ? projects.filter(p => projectFilter.includes(p.id))
    : projects;
  const projectIds = filteredProjects.map(p => p.id);
  const projectTitles = new Map(filteredProjects.map(p => [p.id, p.title]));

  // 2. Leads (via convertedProjectId — if no project filter, get all for this client)
  const leads = projectIds.length > 0
    ? await db.leads.where('convertedProjectId').anyOf(projectIds).toArray()
    : [];
  const leadIds = leads.map(l => l.id);

  if (!projectFilter || projectIds.length > 0) {
    for (const lead of leads) {
      items.push({
        id: `lead_created_${lead.id}`,
        type: 'lead_created',
        timestamp: lead.createdAt,
        title: 'Inquiry received',
        description: lead.source ? `Source: ${lead.source}` : undefined,
        projectTitle: lead.note?.slice(0, 60),
        metadata: { leadId: lead.id, status: lead.leadPipelineStatus },
      });
      if (lead.convertedAt) {
        items.push({
          id: `lead_converted_${lead.id}`,
          type: 'lead_converted',
          timestamp: lead.convertedAt,
          title: 'Converted to project',
          projectTitle: lead.convertedProjectId ? projectTitles.get(lead.convertedProjectId) : undefined,
          metadata: { leadId: lead.id, projectId: lead.convertedProjectId },
        });
      }
    }
  }

  // 3. Appointments
  let appointments = await db.appointments.where('clientId').equals(clientId).toArray();
  if (projectFilter) {
    appointments = appointments.filter(a => a.projectId && projectFilter.includes(a.projectId));
  }
  for (const apt of appointments) {
    const pTitle = apt.projectId ? projectTitles.get(apt.projectId) : undefined;
    const eventType: TimelineEventType = apt.status === 'cancelled'
      ? 'appointment_cancelled'
      : apt.status === 'done'
        ? 'appointment_done'
        : 'appointment_created';

    items.push({
      id: `apt_${apt.id}`,
      type: eventType,
      timestamp: new Date(apt.date + 'T' + (apt.time || '00:00')).getTime() || apt.createdAt,
      title: eventType === 'appointment_created' ? 'Appointment booked' : eventType === 'appointment_cancelled' ? 'Appointment cancelled' : 'Appointment completed',
      description: `${apt.date} ${apt.time} · ${apt.duration}min${apt.type ? ` · ${apt.type}` : ''}`,
      projectTitle: pTitle,
      metadata: { appointmentId: apt.id, status: apt.status },
    });
  }

  // 4. Sessions
  const appointmentIds = appointments.map(a => a.id);
  let sessions: SessionRecord[] = [];
  if (appointmentIds.length > 0) {
    sessions = await db.sessions.where('appointmentId').anyOf(appointmentIds).toArray();
  }
  // Also fetch sessions by projectId in case they aren't linked to appointments
  if (projectIds.length > 0) {
    const projectSessions = await db.sessions.where('projectId').anyOf(projectIds).toArray();
    // Merge, deduplicate by id
    const seen = new Set(sessions.map(s => s.id));
    for (const s of projectSessions) {
      if (!seen.has(s.id)) sessions.push(s);
    }
  }

  for (const session of sessions) {
    const pTitle = session.projectId ? projectTitles.get(session.projectId) : undefined;

    // Session start
    if (session.startedAt) {
      items.push({
        id: `session_start_${session.id}`,
        type: 'session_started',
        timestamp: session.startedAt,
        title: 'Tattooing session started',
        projectTitle: pTitle,
        metadata: { sessionId: session.id, duration: session.actualDuration },
      });
    }

    // Session completed
    if (session.completedAt || session.finishedAt) {
      const ts = session.completedAt || session.finishedAt!;
      items.push({
        id: `session_done_${session.id}`,
        type: 'session_completed',
        timestamp: ts,
        title: 'Session completed',
        description: session.actualDuration ? `Duration: ${formatDurationShort(session.actualDuration)}` : undefined,
        projectTitle: pTitle,
        metadata: { sessionId: session.id, duration: session.actualDuration },
      });
    }

    // Progress photos
    if (session.progressPhotos) {
      for (const photo of session.progressPhotos) {
        items.push({
          id: `photo_${photo.id}`,
          type: 'photo_added',
          timestamp: photo.createdAt,
          title: 'Progress photo',
          description: photo.label || undefined,
          projectTitle: pTitle,
          metadata: { sessionId: session.id, photoId: photo.id, label: photo.label },
        });
      }
    }

    // Session notes
    if (session.sessionNotes) {
      for (const sn of session.sessionNotes) {
        items.push({
          id: `snote_${sn.id}`,
          type: 'note',
          timestamp: sn.createdAt,
          title: 'Session note',
          description: sn.note.length > 120 ? sn.note.slice(0, 120) + '…' : sn.note,
          projectTitle: pTitle,
          metadata: { sessionId: session.id },
        });
      }
    }

    // Timeline events for break/resume
    if (session.timeline) {
      for (const ev of session.timeline) {
        if (ev.type === 'pause') {
          items.push({
            id: `sbreak_${session.id}_${ev.timestamp}`,
            type: 'session_break',
            timestamp: ev.timestamp,
            title: 'Break started',
            description: ev.payload || undefined,
            projectTitle: pTitle,
            metadata: { sessionId: session.id },
          });
        } else if (ev.type === 'resume') {
          items.push({
            id: `sresume_${session.id}_${ev.timestamp}`,
            type: 'session_resumed',
            timestamp: ev.timestamp,
            title: 'Break ended',
            description: ev.payload || undefined,
            projectTitle: pTitle,
            metadata: { sessionId: session.id },
          });
        }
      }
    }
  }

  // 5. Project Revisions
  if (projectIds.length > 0) {
    const revisions = await db.projectRevisions
      .where('projectId')
      .anyOf(projectIds)
      .toArray();

    for (const rev of revisions) {
      const pTitle = projectTitles.get(rev.projectId);
      if (rev.createdAt) {
        items.push({
          id: `rev_draft_${rev.id}`,
          type: 'revision_sent',
          timestamp: rev.createdAt,
          title: `Design revision v${rev.version} created`,
          projectTitle: pTitle,
          metadata: { revisionId: rev.id, version: rev.version },
        });
      }
      if (rev.sentAt) {
        items.push({
          id: `rev_sent_${rev.id}`,
          type: 'revision_sent',
          timestamp: rev.sentAt,
          title: `Design v${rev.version} sent for review`,
          projectTitle: pTitle,
          metadata: { revisionId: rev.id, version: rev.version },
        });
      }
      if (rev.viewedAt) {
        items.push({
          id: `rev_viewed_${rev.id}`,
          type: 'revision_viewed',
          timestamp: rev.viewedAt,
          title: `Design v${rev.version} viewed`,
          projectTitle: pTitle,
          metadata: { revisionId: rev.id, version: rev.version },
        });
      }
      if (rev.approvedAt) {
        items.push({
          id: `rev_approved_${rev.id}`,
          type: 'revision_approved',
          timestamp: rev.approvedAt,
          title: `Design v${rev.version} approved`,
          projectTitle: pTitle,
          metadata: { revisionId: rev.id, version: rev.version },
        });
      }
      if (rev.revisionRequestedAt) {
        items.push({
          id: `rev_requested_${rev.id}`,
          type: 'revision_requested',
          timestamp: rev.revisionRequestedAt,
          title: `Changes requested on v${rev.version}`,
          description: rev.requestedChanges?.map(c => c.category).join(', '),
          projectTitle: pTitle,
          metadata: { revisionId: rev.id, version: rev.version, changes: rev.requestedChanges },
        });
      }
    }
  }

  // 6. Deposit Flow
  if (leadIds.length > 0) {
    const deposits = await db.depositFlow
      .where('leadId')
      .anyOf(leadIds)
      .toArray();

    for (const dep of deposits) {
      const lead = leads.find(l => l.id === dep.leadId);
      const pTitle = lead?.convertedProjectId ? projectTitles.get(lead.convertedProjectId) : undefined;

      if (dep.requestedAt) {
        items.push({
          id: `dep_req_${dep.id}`,
          type: 'deposit_requested',
          timestamp: dep.requestedAt,
          title: 'Deposit requested',
          description: dep.depositAmount ? `Amount: $${dep.depositAmount}` : undefined,
          projectTitle: pTitle,
          metadata: { depositId: dep.id, amount: dep.depositAmount },
        });
      }
      if (dep.viewedAt) {
        items.push({
          id: `dep_viewed_${dep.id}`,
          type: 'deposit_viewed',
          timestamp: dep.viewedAt,
          title: 'Deposit link viewed',
          projectTitle: pTitle,
          metadata: { depositId: dep.id },
        });
      }
      if (dep.paidAt) {
        items.push({
          id: `dep_paid_${dep.id}`,
          type: 'deposit_paid',
          timestamp: dep.paidAt,
          title: 'Deposit paid',
          description: dep.depositAmount ? `$${dep.depositAmount}` : undefined,
          projectTitle: pTitle,
          metadata: { depositId: dep.id, amount: dep.depositAmount },
        });
      }
      if (dep.depositStatus === 'expired' && dep.updatedAt) {
        items.push({
          id: `dep_expired_${dep.id}`,
          type: 'deposit_expired',
          timestamp: dep.updatedAt,
          title: 'Deposit expired',
          projectTitle: pTitle,
          metadata: { depositId: dep.id },
        });
      }
      if (dep.depositStatus === 'declined' && dep.updatedAt) {
        items.push({
          id: `dep_declined_${dep.id}`,
          type: 'deposit_declined',
          timestamp: dep.updatedAt,
          title: 'Deposit declined',
          projectTitle: pTitle,
          metadata: { depositId: dep.id },
        });
      }
    }
  }

  // 7. Communication Log
  const commLogs = await db.communicationLog
    .where('clientId')
    .equals(clientId)
    .toArray();

  for (const log of commLogs) {
    const pTitle = log.projectId ? projectTitles.get(log.projectId) : undefined;

    if (log.direction === 'inbound') {
      items.push({
        id: `comm_in_${log.id}`,
        type: 'message_received',
        timestamp: log.createdAt,
        title: `${log.channel === 'instagram' ? 'IG' : log.channel === 'whatsapp' ? 'WA' : log.channel} message received`,
        description: log.message ? (log.message.length > 120 ? log.message.slice(0, 120) + '…' : log.message) : undefined,
        projectTitle: pTitle,
        metadata: { channel: log.channel, templateType: log.templateType },
      });
    } else if (log.direction === 'outbound') {
      items.push({
        id: `comm_out_${log.id}`,
        type: 'message_sent',
        timestamp: log.createdAt,
        title: `${log.channel === 'instagram' ? 'IG' : log.channel === 'whatsapp' ? 'WA' : log.channel} message sent`,
        description: log.message ? (log.message.length > 120 ? log.message.slice(0, 120) + '…' : log.message) : undefined,
        projectTitle: pTitle,
        metadata: { channel: log.channel, templateType: log.templateType },
      });
    } else if (log.channel === 'app_note') {
      items.push({
        id: `comm_note_${log.id}`,
        type: 'note',
        timestamp: log.createdAt,
        title: 'System note',
        description: log.message ? (log.message.length > 120 ? log.message.slice(0, 120) + '…' : log.message) : undefined,
        projectTitle: pTitle,
        metadata: { templateType: log.templateType },
      });
    }
  }

  // 8. Portfolio / photos
  if (projectIds.length > 0) {
    const portfolio = await db.portfolio.where('projectId').anyOf(projectIds).toArray();
    for (const p of portfolio) {
      items.push({
        id: `portfolio_${p.id}`,
        type: 'photo_added',
        timestamp: p.createdAt,
        title: 'Finished tattoo photo',
        projectTitle: projectTitles.get(p.projectId || ''),
        metadata: { portfolioId: p.id, projectId: p.projectId },
      });
    }
  }

  // 9. Aftercare
  // Aftercare events are logged via communicationLog [aftercare_sent]
  // but we also check sessions for aftercareSentAt
  if (sessions.length > 0) {
    for (const s of sessions) {
      if (s.completedAt && s.aftercareSentAt) {
        items.push({
          id: `aftercare_${s.id}`,
          type: 'aftercare_sent',
          timestamp: s.aftercareSentAt,
          title: 'Aftercare instructions sent',
          projectTitle: s.projectId ? projectTitles.get(s.projectId) : undefined,
          metadata: { sessionId: s.id },
        });
      }
    }
  }

  // 10. Reviews
  const reviews = await db.reviews.where('clientId').equals(clientId).toArray();
  for (const r of reviews) {
    items.push({
      id: `review_${r.id}`,
      type: 'review_given',
      timestamp: r.createdAt,
      title: 'Review submitted',
      description: r.rating ? `${r.rating}★${r.text ? ` — ${r.text.length > 80 ? r.text.slice(0, 80) + '…' : r.text}` : ''}` : undefined,
      projectTitle: r.projectId ? projectTitles.get(r.projectId) : undefined,
      metadata: { reviewId: r.id, rating: r.rating, source: r.source },
    });
  }

  // Sort by timestamp descending (newest first)
  items.sort((a, b) => b.timestamp - a.timestamp);
  return items;
}

function formatDurationShort(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ── Timeline Summary ──

export interface ClientTimelineSummary {
  totalEvents: number;
  firstContact: number | null;
  lastActivity: number | null;
  byType: Partial<Record<TimelineEventType, number>>;
}

export function getClientTimelineSummary(items: ClientTimelineItem[]): ClientTimelineSummary {
  const byType: Partial<Record<TimelineEventType, number>> = {};
  let firstContact: number | null = null;
  let lastActivity: number | null = null;

  for (const item of items) {
    byType[item.type] = (byType[item.type] || 0) + 1;
    if (firstContact === null || item.timestamp < firstContact) firstContact = item.timestamp;
    if (lastActivity === null || item.timestamp > lastActivity) lastActivity = item.timestamp;
  }

  return {
    totalEvents: items.length,
    firstContact,
    lastActivity,
    byType,
  };
}

// ── Engagement Score ──

export interface EngagementScoreResult {
  score: number;
  label: string;
  riskFlags: string[];
}

export function calculateEngagementScore(items: ClientTimelineItem[]): EngagementScoreResult {
  const now = Date.now();
  const riskFlags: string[] = [];

  // Recency (0-30)
  const lastActivity = items.length > 0 ? items[0].timestamp : 0;
  const daysSinceLastActivity = lastActivity ? (now - lastActivity) / 86400000 : 999;
  let recencyScore = 0;
  if (daysSinceLastActivity < 7) recencyScore = 30;
  else if (daysSinceLastActivity < 30) recencyScore = 20;
  else if (daysSinceLastActivity < 90) recencyScore = 10;
  else recencyScore = 0;

  if (daysSinceLastActivity > 90) riskFlags.push('No activity in 90+ days');
  else if (daysSinceLastActivity > 30) riskFlags.push('No activity in 30+ days');

  // Volume (0-25)
  const uniqueItemIds = new Set(items.map(i => i.id.split('_').slice(0, 2).join('_'))).size;
  let volumeScore = 0;
  if (uniqueItemIds >= 50) volumeScore = 25;
  else if (uniqueItemIds >= 20) volumeScore = 20;
  else if (uniqueItemIds >= 10) volumeScore = 15;
  else if (uniqueItemIds >= 5) volumeScore = 10;
  else if (uniqueItemIds >= 1) volumeScore = 5;

  // Quality signals (0-35)
  let qualityScore = 0;
  const approvedCount = items.filter(i => i.type === 'revision_approved').length;
  const depositPaidCount = items.filter(i => i.type === 'deposit_paid').length;
  const completedSessions = items.filter(i => i.type === 'session_completed').length;
  const reviewCount = items.filter(i => i.type === 'review_given').length;
  const cancelledCount = items.filter(i => i.type === 'appointment_cancelled').length;
  const depositExpired = items.filter(i => i.type === 'deposit_expired' || i.type === 'deposit_declined').length;

  if (approvedCount > 0) qualityScore += 10;
  if (depositPaidCount > 0) qualityScore += 10;
  if (completedSessions >= 1) qualityScore += 8;
  if (completedSessions >= 3) qualityScore += 2;
  if (reviewCount > 0) qualityScore += 5;
  if (cancelledCount > 1) qualityScore -= 5;
  if (depositExpired > 0) qualityScore -= 5;

  if (depositExpired > 0) riskFlags.push('Deposit expired or declined');
  if (cancelledCount > 1) riskFlags.push('Multiple appointment cancellations');

  // Consistency (0-10)
  let consistencyScore = 0;
  const timestamps = items.map(i => i.timestamp).filter(t => t > 0).sort((a, b) => a - b);
  if (timestamps.length >= 2) {
    const spanDays = (timestamps[timestamps.length - 1] - timestamps[0]) / 86400000;
    if (spanDays > 180) consistencyScore = 10;
    else if (spanDays > 90) consistencyScore = 7;
    else if (spanDays > 30) consistencyScore = 4;
    else consistencyScore = 2;
  }

  const total = Math.min(100, recencyScore + volumeScore + qualityScore + consistencyScore);

  let label: string;
  if (total >= 80) label = 'Hot';
  else if (total >= 60) label = 'Warm';
  else if (total >= 40) label = 'Lukewarm';
  else label = 'Cold';

  return { score: total, label, riskFlags };
}

// ── Smart Insights ──

export interface SmartInsight {
  type: 'milestone' | 'risk' | 'timing';
  label: string;
  detail: string;
  severity: 'positive' | 'warning' | 'negative';
}

export function getSmartInsights(items: ClientTimelineItem[]): SmartInsight[] {
  const insights: SmartInsight[] = [];
  const now = Date.now();

  const hasApprovedDesign = items.some(i => i.type === 'revision_approved');
  const hasPaidDeposit = items.some(i => i.type === 'deposit_paid');
  const hasCompletedSession = items.some(i => i.type === 'session_completed');
  const hasReview = items.some(i => i.type === 'review_given');
  const lastMessage = items.find(i => i.type === 'message_received' || i.type === 'message_sent');
  const hasAftercare = items.some(i => i.type === 'aftercare_sent');

  if (hasAftercare && hasReview) {
    insights.push({
      type: 'milestone',
      label: 'Full lifecycle complete',
      detail: 'Client has completed the full journey: design → session → aftercare → review.',
      severity: 'positive',
    });
  } else if (hasApprovedDesign && !hasPaidDeposit) {
    insights.push({
      type: 'risk',
      label: 'Design approved, no deposit',
      detail: 'Client approved the design but hasn\'t paid a deposit yet. Follow up to secure the booking.',
      severity: 'warning',
    });
  } else if (hasPaidDeposit && !hasCompletedSession) {
    insights.push({
      type: 'timing',
      label: 'Deposit paid — session pending',
      detail: 'Deposit is in. Schedule the session to keep momentum.',
      severity: 'positive',
    });
  }

  if (hasCompletedSession && !hasReview && !hasAftercare) {
    insights.push({
      type: 'timing',
      label: 'Session done — send aftercare',
      detail: 'Completed session detected without aftercare follow-up.',
      severity: 'warning',
    });
  }

  if (hasCompletedSession && hasAftercare && !hasReview) {
    insights.push({
      type: 'timing',
      label: 'Ready for review request',
      detail: 'Aftercare was sent. Ask for a review when the tattoo heals.',
      severity: 'positive',
    });
  }

  if (lastMessage) {
    const daysSince = (now - lastMessage.timestamp) / 86400000;
    if (daysSince > 30) {
      insights.push({
        type: 'risk',
        label: 'No recent communication',
        detail: `Last contact was ${Math.round(daysSince)} days ago. Reach out to re-engage.`,
        severity: 'negative',
      });
    }
  }

  // Check for multiple cancelled appointments
  const cancellations = items.filter(i => i.type === 'appointment_cancelled').length;
  if (cancellations >= 2) {
    insights.push({
      type: 'risk',
      label: 'Frequent cancellations',
      detail: `Client has cancelled ${cancellations} appointments. May need deposit policy review.`,
      severity: 'negative',
    });
  }

  return insights;
}
