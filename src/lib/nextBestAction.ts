import { db } from '../db';
import { logCommunication } from './aftercareLogic';

// ── Types ──

export interface NextBestAction {
  action: string;
  priority: number; // 1 = highest
  category: 'revenue' | 'conversion' | 'retention';
  reason: string;
}

// ── Priority: revenue > conversion > retention ──

export async function getNextBestAction(
  projectId: string,
): Promise<NextBestAction> {
  const project = await db.projects.get(projectId);
  if (!project) {
    return { action: 'Create project', priority: 1, category: 'conversion', reason: 'Project not found' };
  }

  const artistId = project.artistId;
  const clientId = project.clientId;

  // ── 1. Revenue: check deposit status ──
  if (project.sourceLeadId) {
    const lead = await db.leads.get(project.sourceLeadId);
    if (lead) {
      const deposits = await db.depositFlow
        .where('leadId').equals(lead.id)
        .toArray();

      const paidDeposit = deposits.find(d => d.depositStatus === 'paid');
      const requestedDeposit = deposits.find(d =>
        d.depositStatus === 'requested' || d.depositStatus === 'viewed',
      );
      const expiredDeposit = deposits.find(d => d.depositStatus === 'expired');

      if (expiredDeposit) {
        await logCommunication(artistId, 'app_note', 'auto', {
          clientId, projectId,
          message: 'Next best action: Re-request deposit (previous expired)',
          templateType: 'next_best_action_generated',
        });
        return {
          action: 'Re-request deposit',
          priority: 1,
          category: 'revenue',
          reason: 'Previous deposit expired — re-request to secure booking',
        };
      }

      if (requestedDeposit && !paidDeposit) {
        await logCommunication(artistId, 'app_note', 'auto', {
          clientId, projectId,
          message: 'Next best action: Follow up on pending deposit',
          templateType: 'next_best_action_generated',
        });
        return {
          action: 'Follow up on deposit',
          priority: 1,
          category: 'revenue',
          reason: 'Deposit requested but not yet paid',
        };
      }

      if (!requestedDeposit && !paidDeposit) {
        const isApproved = project.status === 'approved' ||
          revisionsHaveApproval(await db.projectRevisions.where('projectId').equals(projectId).toArray());
        if (isApproved) {
          await logCommunication(artistId, 'app_note', 'auto', {
            clientId, projectId,
            message: 'Next best action: Request deposit now',
            templateType: 'next_best_action_generated',
          });
          return {
            action: 'Request deposit now',
            priority: 1,
            category: 'revenue',
            reason: 'Design approved — request deposit to secure the booking',
          };
        }

        if (project.status === 'scheduled') {
          await logCommunication(artistId, 'app_note', 'auto', {
            clientId, projectId,
            message: 'Next best action: Request deposit for scheduled project',
            templateType: 'next_best_action_generated',
          });
          return {
            action: 'Request deposit',
            priority: 1,
            category: 'revenue',
            reason: 'Project is scheduled but no deposit collected',
          };
        }
      }

      if (paidDeposit) {
        const sessions = await db.sessions.where('projectId').equals(projectId).toArray();
        const hasCompletedSession = sessions.some(s => s.sessionState === 'completed');

        if (!hasCompletedSession) {
          // Deposit paid, no session — suggest booking
          await logCommunication(artistId, 'app_note', 'auto', {
            clientId, projectId,
            message: 'Next best action: Suggest booking a session',
            templateType: 'next_best_action_generated',
          });
          return {
            action: 'Suggest booking a session',
            priority: 2,
            category: 'conversion',
            reason: 'Deposit paid — book the session to move forward',
          };
        }
      }
    }
  }

  // ── 2. Conversion: revision / design follow-up ──
  const revisions = await db.projectRevisions.where('projectId').equals(projectId).toArray();
  const pendingRevision = revisions.find(r => r.status === 'sent');
  if (pendingRevision) {
    await logCommunication(artistId, 'app_note', 'auto', {
      clientId, projectId,
      message: 'Next best action: Follow up on pending revision',
      templateType: 'next_best_action_generated',
    });
    return {
      action: 'Send revision follow-up',
      priority: 2,
      category: 'conversion',
      reason: `Design v${pendingRevision.version} sent — client hasn't responded`,
    };
  }

  const revisionRequested = revisions.find(r => r.status === 'revision_requested');
  if (revisionRequested) {
    await logCommunication(artistId, 'app_note', 'auto', {
      clientId, projectId,
      message: 'Next best action: Address revision changes',
      templateType: 'next_best_action_generated',
    });
    return {
      action: 'Address revision changes',
      priority: 2,
      category: 'conversion',
      reason: `Client requested changes on v${revisionRequested.version}`,
    };
  }

  // ── 3. Retention: aftercare / session follow-up ──
  const sessions = await db.sessions.where('projectId').equals(projectId).toArray();
  const completedSessions = sessions.filter(s => s.sessionState === 'completed');

  if (completedSessions.length > 0) {
    const lastSession = completedSessions.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))[0];

    // Aftercare not sent
    if (lastSession && !lastSession.aftercareSentAt) {
      await logCommunication(artistId, 'app_note', 'auto', {
        clientId, projectId,
        message: 'Next best action: Send aftercare reminder',
        templateType: 'next_best_action_generated',
      });
      return {
        action: 'Send aftercare reminder',
        priority: 3,
        category: 'retention',
        reason: 'Session completed — aftercare not yet sent',
      };
    }

    // Aftercare sent, check for healing photos
    if (lastSession && !lastSession.healingPhotos?.length) {
      await logCommunication(artistId, 'app_note', 'auto', {
        clientId, projectId,
        message: 'Next best action: Ask for healing photos',
        templateType: 'next_best_action_generated',
      });
      return {
        action: 'Ask for healing photos',
        priority: 3,
        category: 'retention',
        reason: 'Aftercare sent — check in on healing progress',
      };
    }

    // Fully healed — ask for referral
    if (lastSession && lastSession.healingStatus === 'fully_healed') {
      await logCommunication(artistId, 'app_note', 'auto', {
        clientId, projectId,
        message: 'Next best action: Ask for referral',
        templateType: 'next_best_action_generated',
      });
      return {
        action: 'Ask for referral',
        priority: 3,
        category: 'retention',
        reason: 'Tattoo fully healed — ideal time for referral',
      };
    }

    // Check for repeat booking
    const lastAppointments = await db.appointments
      .where('clientId').equals(clientId || '')
      .toArray();
    const sortedApts = lastAppointments.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    if (sortedApts.length > 0) {
      const daysSince = (Date.now() - new Date(sortedApts[0].date).getTime()) / 86400000;
      if (daysSince > 90) {
        await logCommunication(artistId, 'app_note', 'auto', {
          clientId, projectId,
          message: 'Next best action: Reach out for repeat booking',
          templateType: 'next_best_action_generated',
        });
        return {
          action: 'Reach out for repeat booking',
          priority: 3,
          category: 'retention',
          reason: `${Math.round(daysSince)} days since last appointment`,
        };
      }
    }
  }

  // ── 4. Default: no action needed ──
  await logCommunication(artistId, 'app_note', 'auto', {
    clientId, projectId,
    message: 'Next best action: No action needed',
    templateType: 'next_best_action_generated',
  });

  return {
    action: 'No action needed',
    priority: 9,
    category: 'retention',
    reason: 'All workflows are up to date',
  };
}

// ── Helper ──

function revisionsHaveApproval(
  revisions: { status: string }[],
): boolean {
  return revisions.some(r => r.status === 'approved');
}
