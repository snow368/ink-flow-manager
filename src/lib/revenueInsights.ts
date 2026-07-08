import { db } from '../db';
import { logCommunication } from './aftercareLogic';

// ── Types ──

export interface RevenueInsights {
  totalRevenueEstimate: number;
  depositConversionRate: number;
  ghostRate: number;
  averageSessionValue: number;
  topStyle: string | null;
  busiestTimeSlot: string | null;
  totalSessions: number;
  totalLeads: number;
  ghostedLeads: number;
}

// ── Studio-Level Insights ──

export async function getStudioRevenueInsights(
  artistId: string,
): Promise<RevenueInsights> {
  // ── Invoice revenue ──
  const invoices = await db.invoices
    .where('artistId').equals(artistId)
    .toArray();
  const paidInvoices = invoices.filter(i => i.paymentStatus === 'paid');
  const totalRevenueEstimate = paidInvoices.reduce((sum, i) => sum + i.total, 0);

  // ── Lead conversion ──
  const leads = await db.leads
    .where('artistId').equals(artistId)
    .toArray();
  const totalLeads = leads.length;
  const ghostedLeads = leads.filter(l => l.leadPipelineStatus === 'ghosted').length;
  const ghostRate = totalLeads > 0 ? ghostedLeads / totalLeads : 0;

  // ── Deposit conversion ──
  const deposits = await db.depositFlow
    .where('artistId').equals(artistId)
    .toArray();
  const totalDeposits = deposits.length;
  const paidDeposits = deposits.filter(d => d.depositStatus === 'paid').length;
  const depositConversionRate = totalDeposits > 0 ? paidDeposits / totalDeposits : 0;

  // ── Sessions / average value ──
  const projects = await db.projects
    .where('artistId').equals(artistId)
    .toArray();
  const projectIds = projects.map(p => p.id);

  let totalSessions = 0;
  if (projectIds.length > 0) {
    const sessions = await db.sessions
      .where('projectId')
      .anyOf(projectIds)
      .toArray();
    totalSessions = sessions.filter(s => s.sessionState === 'completed').length;
  }
  const averageSessionValue = totalSessions > 0
    ? Math.round(totalRevenueEstimate / totalSessions)
    : 0;

  // ── Top performing style ──
  const styleCounts: Record<string, number> = {};
  for (const p of projects) {
    if (p.style) {
      styleCounts[p.style] = (styleCounts[p.style] || 0) + 1;
    }
  }
  const topStyle = Object.keys(styleCounts).length > 0
    ? Object.entries(styleCounts).sort((a, b) => b[1] - a[1])[0][0]
    : null;

  // ── Busiest time slots ──
  const appointments = await db.appointments
    .where('artistId').equals(artistId)
    .toArray();
  const timeSlots: Record<string, number> = {};
  for (const a of appointments) {
    if (a.time) {
      const hour = a.time.split(':')[0] + ':00';
      timeSlots[hour] = (timeSlots[hour] || 0) + 1;
    }
  }
  const busiestTimeSlot = Object.keys(timeSlots).length > 0
    ? Object.entries(timeSlots).sort((a, b) => b[1] - a[1])[0][0]
    : null;

  // Log
  await logCommunication(artistId, 'app_note', 'auto', {
    message: `Revenue insights: $${totalRevenueEstimate} total, ${(depositConversionRate * 100).toFixed(0)}% deposit conversion, ${(ghostRate * 100).toFixed(0)}% ghost rate`,
    templateType: 'revenue_insight_calculated',
  });

  return {
    totalRevenueEstimate,
    depositConversionRate: Math.round(depositConversionRate * 100),
    ghostRate: Math.round(ghostRate * 100),
    averageSessionValue,
    topStyle,
    busiestTimeSlot,
    totalSessions,
    totalLeads,
    ghostedLeads,
  };
}
