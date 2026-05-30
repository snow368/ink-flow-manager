import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type LeadRecord, type LeadConfirmationRecord } from '../db';
import { THEME } from '../lib/theme';
import { StatusDot } from '../components/StatusBadge';
import {
  getSuggestedNextAction,
  buildConfirmationLink,
  logConfirmationSent,
  createLeadConfirmation,
  detectMissingTattooInfo,
  isReadyForDepositRequest,
  logFollowUp,
} from '../lib/leadConfirmation';
import { analyzeLead } from '../lib/followUpEngine';
import { getRelevantActions, logQuickActionCopied, type QuickActionType } from '../lib/leadQuickActions';
import { getProjectAssetSummary } from '../lib/projectRevisionLogic';
import { analyzeLeadInquiry } from '../lib/inquiryAnalyzer';
import { calculateLeadHealthScore } from '../lib/leadHealthScore';
import { getLeadTimingSuggestions } from '../lib/leadTimingEngine';
import { parseTattooInquiry, createLeadDraftFromConversation, detectScopeClarity } from '../lib/intakeParser';
import type { LeadDraft } from '../lib/intakeParser';
import { createDepositRequest, markDepositPaid, getDepositState, getDepositMessage, getDepositTimingRecommendation, isLeadReadyForDeposit, incrementReminder } from '../lib/depositFlow';
import type { DepositFlowRecord } from '../db';
import { getProjectRevisionSummary } from '../lib/projectRevision';
import { getClientRiskProfile, type ClientRiskProfile } from '../lib/clientRiskEngine';
import { getNextBestAction, type NextBestAction } from '../lib/nextBestAction';
const PIPELINE_COLORS: Record<string, string> = {
  new_inquiry: '#60a5fa',
  waiting_info: '#f59e0b',
  waiting_references: '#f97316',
  reviewing: '#a855f7',
  revision: '#ec4899',
  deposit_requested: '#f43f5e',
  deposit_paid: '#22c55e',
  scheduled: '#06b6d4',
  completed: '#64748b',
  ghosted: '#78716c',
};

const PIPELINE_LABELS: Record<string, string> = {
  new_inquiry: 'New Inquiry',
  waiting_info: 'Waiting Info',
  waiting_references: 'Waiting References',
  reviewing: 'Reviewing',
  revision: 'Revision',
  deposit_requested: 'Deposit Requested',
  deposit_paid: 'Deposit Paid',
  scheduled: 'Scheduled',
  completed: 'Completed',
  ghosted: 'Ghosted',
};

const PIPELINE_ORDER: string[] = [
  'new_inquiry',
  'waiting_info',
  'waiting_references',
  'reviewing',
  'revision',
  'deposit_requested',
  'deposit_paid',
  'scheduled',
  'completed',
  'ghosted',
];

function formatTime(ts?: number): string {
  if (!ts) return '';
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'just now';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return new Date(ts).toLocaleDateString();
}

function depositLabel(lead: LeadRecord): { text: string; color: string } {
  if (lead.paymentStatus === 'paid') return { text: 'Paid', color: '#22c55e' };
  if (lead.paymentStatus === 'pending_verify') return { text: 'Pending Verify', color: '#f59e0b' };
  if (lead.paymentStatus === 'refunded') return { text: 'Refunded', color: '#94a3b8' };
  if (lead.paymentStatus === 'waived') return { text: 'Waived', color: '#94a3b8' };
  return { text: 'Unpaid', color: '#f87171' };
}

function instagramDeeplink(lead: LeadRecord): string {
  return `https://www.instagram.com/direct/new/`;
}

function whatsAppDeeplink(lead: LeadRecord): string {
  const phone = lead.phone?.replace(/[^0-9]/g, '');
  return phone ? `https://wa.me/${phone}` : '';
}

export default function LeadInbox() {
  const navigate = useNavigate();
  const [artistId, setArtistId] = useState('');
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [confirmations, setConfirmations] = useState<Map<string, LeadConfirmationRecord>>(new Map());
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set(['completed', 'ghosted']));
  const [loading, setLoading] = useState(true);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [projectSummaries, setProjectSummaries] = useState<Map<string, Awaited<ReturnType<typeof getProjectAssetSummary>>>>(new Map());
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [parsedDraft, setParsedDraft] = useState<LeadDraft | null>(null);
  const [creatingLead, setCreatingLead] = useState(false);
  const [depositFlowMap, setDepositFlowMap] = useState<Map<string, DepositFlowRecord>>(new Map());
  const [revisionSummaries, setRevisionSummaries] = useState<Map<string, Awaited<ReturnType<typeof getProjectRevisionSummary>>>>(new Map());
  const [riskMap, setRiskMap] = useState<Map<string, ClientRiskProfile>>(new Map());
  const [actionMap, setActionMap] = useState<Map<string, NextBestAction>>(new Map());

  useEffect(() => {
    const current = localStorage.getItem('inkflow_current_user');
    if (!current) return;
    setArtistId(current);
    (async () => {
      const all = await db.leads.where('artistId').equals(current).reverse().sortBy('createdAt');
      setLeads(all);
      const allConfs = await db.leadConfirmations.where('artistId').equals(current).toArray();
      const map = new Map<string, LeadConfirmationRecord>();
      for (const c of allConfs) {
        if (c.leadId) map.set(c.leadId, c);
      }
      setConfirmations(map);

      // Load project summaries for converted leads
      const projectMap = new Map<string, Awaited<ReturnType<typeof getProjectAssetSummary>>>();
      for (const lead of all) {
        if (lead.convertedProjectId) {
          const summary = await getProjectAssetSummary(lead.convertedProjectId);
          if (summary.total > 0) projectMap.set(lead.id, summary);
        }
      }
      setProjectSummaries(projectMap);

      // Load deposit flow states
      const allDepFlows = await db.depositFlow.where('artistId').equals(current).toArray();
      const depMap = new Map<string, DepositFlowRecord>();
      for (const df of allDepFlows) {
        if (df.leadId) depMap.set(df.leadId, df);
      }
      setDepositFlowMap(depMap);

      // Load revision summaries for converted leads
      const revSumMap = new Map<string, Awaited<ReturnType<typeof getProjectRevisionSummary>>>();
      for (const lead of all) {
        if (lead.convertedProjectId) {
          const summary = await getProjectRevisionSummary(lead.convertedProjectId);
          if (summary.totalVersions > 0) revSumMap.set(lead.id, summary);
        }
      }
      setRevisionSummaries(revSumMap);

      // Load risk profiles and next best actions for converted leads
      const riskM = new Map<string, ClientRiskProfile>();
      const actionM = new Map<string, NextBestAction>();
      for (const lead of all) {
        if (lead.convertedProjectId) {
          const [risk, action] = await Promise.all([
            getClientRiskProfile(lead.convertedProjectId),
            getNextBestAction(lead.convertedProjectId),
          ]);
          riskM.set(lead.id, risk);
          actionM.set(lead.id, action);
        }
      }
      setRiskMap(riskM);
      setActionMap(actionM);

      setLoading(false);
    })();
  }, []);

  const refresh = useCallback(async () => {
    if (!artistId) return;
    const all = await db.leads.where('artistId').equals(artistId).reverse().sortBy('createdAt');
    setLeads(all);
    const allConfs = await db.leadConfirmations.where('artistId').equals(artistId).toArray();
    const map = new Map<string, LeadConfirmationRecord>();
    for (const c of allConfs) {
      if (c.leadId) map.set(c.leadId, c);
    }
    setConfirmations(map);
    const projectMap = new Map<string, Awaited<ReturnType<typeof getProjectAssetSummary>>>();
    for (const lead of all) {
      if (lead.convertedProjectId) {
        const summary = await getProjectAssetSummary(lead.convertedProjectId);
        if (summary.total > 0) projectMap.set(lead.id, summary);
      }
    }
    setProjectSummaries(projectMap);
    const allDepFlows = await db.depositFlow.where('artistId').equals(artistId).toArray();
    const depMap = new Map<string, DepositFlowRecord>();
    for (const df of allDepFlows) {
      if (df.leadId) depMap.set(df.leadId, df);
    }
    setDepositFlowMap(depMap);
    const revSumMap = new Map<string, Awaited<ReturnType<typeof getProjectRevisionSummary>>>();
    for (const lead of all) {
      if (lead.convertedProjectId) {
        const summary = await getProjectRevisionSummary(lead.convertedProjectId);
        if (summary.totalVersions > 0) revSumMap.set(lead.id, summary);
      }
    }
    setRevisionSummaries(revSumMap);
    const riskM = new Map<string, ClientRiskProfile>();
    const actionM = new Map<string, NextBestAction>();
    for (const lead of all) {
      if (lead.convertedProjectId) {
        const [risk, action] = await Promise.all([
          getClientRiskProfile(lead.convertedProjectId),
          getNextBestAction(lead.convertedProjectId),
        ]);
        riskM.set(lead.id, risk);
        actionM.set(lead.id, action);
      }
    }
    setRiskMap(riskM);
    setActionMap(actionM);
  }, [artistId]);

  const grouped = useMemo(() => {
    const groups = new Map<string, LeadRecord[]>();
    for (const status of PIPELINE_ORDER) {
      groups.set(status, []);
    }
    for (const lead of leads) {
      const pipeline = lead.leadPipelineStatus || 'new_inquiry';
      const group = groups.get(pipeline);
      if (group) group.push(lead);
      else groups.get('new_inquiry')?.push(lead);
    }
    return groups;
  }, [leads]);

  const totalLeads = leads.length;

  // Pre-compute follow-up signals and quick actions for all leads
  const followUpMap = useMemo(() => {
    const m = new Map<string, ReturnType<typeof analyzeLead>>();
    for (const lead of leads) {
      const conf = confirmations.get(lead.id);
      m.set(lead.id, analyzeLead(lead, conf));
    }
    return m;
  }, [leads, confirmations]);

  const quickActionsMap = useMemo(() => {
    const m = new Map<string, ReturnType<typeof getRelevantActions>>();
    for (const lead of leads) {
      m.set(lead.id, getRelevantActions(lead));
    }
    return m;
  }, [leads]);

  // Inquiry quality analysis for all leads
  const analysisMap = useMemo(() => {
    const m = new Map<string, ReturnType<typeof analyzeLeadInquiry>>();
    for (const lead of leads) {
      const conf = confirmations.get(lead.id);
      m.set(lead.id, analyzeLeadInquiry(lead, conf));
    }
    return m;
  }, [leads, confirmations]);

  const healthMap = useMemo(() => {
    const m = new Map<string, ReturnType<typeof calculateLeadHealthScore>>();
    for (const lead of leads) {
      const conf = confirmations.get(lead.id);
      m.set(lead.id, calculateLeadHealthScore(lead, { confirmation: conf }));
    }
    return m;
  }, [leads, confirmations]);

  const timingMap = useMemo(() => {
    const m = new Map<string, ReturnType<typeof getLeadTimingSuggestions>>();
    for (const lead of leads) {
      const conf = confirmations.get(lead.id);
      m.set(lead.id, getLeadTimingSuggestions(lead, { confirmation: conf }));
    }
    return m;
  }, [leads, confirmations]);

  const toggleCollapse = (status: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  const updatePipelineStatus = useCallback(async (leadId: string, status: string) => {
    await db.leads.update(leadId, { leadPipelineStatus: status as LeadRecord['leadPipelineStatus'] });
    await refresh();
  }, [refresh]);

  const handleGenerateLink = useCallback(async (lead: LeadRecord) => {
    setGeneratingFor(lead.id);
    try {
      const existing = confirmations.get(lead.id);
      if (existing) {
        const link = buildConfirmationLink(existing.confirmationToken);
        await navigator.clipboard.writeText(link);
        return;
      }
      const extractedData: LeadConfirmationRecord['extractedData'] = {
        placement: lead.bodyPart || undefined,
        style: lead.style || undefined,
        size: lead.size || undefined,
        budget: lead.budget || undefined,
        references: lead.referenceImages || [],
        availability: lead.preferredDate ? `${lead.preferredDate} ${lead.preferredTime || ''}` : undefined,
      };
      const conf = await createLeadConfirmation(lead.artistId, extractedData, lead.id);
      await db.leads.update(lead.id, { leadPipelineStatus: 'waiting_info' });
      const link = buildConfirmationLink(conf.confirmationToken);
      await navigator.clipboard.writeText(link);
      await logConfirmationSent(lead.id);
      await refresh();
    } finally {
      setGeneratingFor(null);
    }
  }, [confirmations, refresh]);

  const handleCopyLink = useCallback((lead: LeadRecord) => {
    const conf = confirmations.get(lead.id);
    if (!conf) return;
    const link = buildConfirmationLink(conf.confirmationToken);
    navigator.clipboard.writeText(link);
  }, [confirmations]);

  const handleMarkGhosted = useCallback(async (leadId: string) => {
    await updatePipelineStatus(leadId, 'ghosted');
  }, [updatePipelineStatus]);

  const handleCopyQuickAction = useCallback(async (lead: LeadRecord, actionType: QuickActionType, message: string) => {
    await navigator.clipboard.writeText(message);
    await logQuickActionCopied(lead.artistId, lead.id, actionType);
    setCopiedId(`${lead.id}_${actionType}`);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleOpenDeeplink = useCallback(async (lead: LeadRecord, platform: 'ig' | 'wa') => {
    const url = platform === 'ig' ? instagramDeeplink(lead) : whatsAppDeeplink(lead);
    if (!url) return;
    window.open(url, '_blank');
    await db.leads.update(lead.id, {
      lastMessage: `[Opened ${platform === 'ig' ? 'Instagram' : 'WhatsApp'} DM]`,
      lastContactedAt: Date.now(),
    });
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', background: THEME.bg.app, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 24, height: 24, border: `2px solid ${THEME.border.default}`, borderTopColor: THEME.brand.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const needsAttentionCount = leads.filter(l => followUpMap.get(l.id)?.needsAttention).length;

  return (
    <div style={{ minHeight: '100dvh', background: THEME.bg.app, maxWidth: 600, margin: '0 auto', padding: '0 0 24px 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 12px' }}>
        <div>
          <h1 style={{ fontSize: THEME.fontSize['2xl'], fontWeight: THEME.fontWeight.bold, color: THEME.text.primary, margin: 0, lineHeight: 1.2 }}>
            Lead Pipeline
          </h1>
          <p style={{ fontSize: THEME.fontSize.sm, color: THEME.text.muted, margin: '4px 0 0' }}>
            {totalLeads} leads
            {needsAttentionCount > 0 && (
              <span style={{ color: THEME.brand.warning, marginLeft: 8 }}>
                · {needsAttentionCount} need attention
              </span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setShowPasteModal(true)} style={{ background: THEME.bg.panel, border: `1px solid ${THEME.border.default}`, borderRadius: THEME.radius.lg, padding: '8px 14px', color: THEME.text.muted, fontSize: THEME.fontSize.base, cursor: 'pointer' }}>
            Paste
          </button>
          <button onClick={() => navigate(-1)} style={{ background: THEME.bg.panel, border: `1px solid ${THEME.border.default}`, borderRadius: THEME.radius.lg, padding: '8px 14px', color: THEME.text.muted, fontSize: THEME.fontSize.base, cursor: 'pointer' }}>
            Back
          </button>
        </div>
      </div>

      {totalLeads === 0 && (
        <div style={{ padding: 48, textAlign: 'center' }}>
          <p style={{ color: THEME.text.subtle, fontSize: THEME.fontSize.md }}>No leads yet.</p>
        </div>
      )}

      {/* Pipeline sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 12px' }}>
        {PIPELINE_ORDER.map(status => {
          const group = grouped.get(status) || [];
          if (group.length === 0 && collapsed.has(status)) return null;
          const isCollapsed = collapsed.has(status);
          const color = PIPELINE_COLORS[status] || '#94a3b8';

          return (
            <div key={status} style={{ background: THEME.bg.panel, border: `1px solid ${THEME.border.subtle}`, borderRadius: THEME.radius['2xl'], overflow: 'hidden' }}>
              {/* Section header */}
              <div
                onClick={() => toggleCollapse(status)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                  cursor: 'pointer', userSelect: 'none',
                  borderBottom: group.length > 0 && !isCollapsed ? `1px solid ${THEME.border.subtle}` : 'none',
                }}
              >
                <StatusDot status={status as any} />
                <span style={{ flex: 1, fontSize: THEME.fontSize.base, fontWeight: THEME.fontWeight.semibold, color: THEME.text.primary }}>
                  {PIPELINE_LABELS[status] || status}
                </span>
                <span style={{ fontSize: THEME.fontSize.sm, color: THEME.text.muted, background: THEME.bg.panelAlt, borderRadius: 999, padding: '2px 10px', fontWeight: THEME.fontWeight.semibold }}>
                  {group.length}
                </span>
                <span style={{ color: THEME.text.subtle, fontSize: 12, transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>▼</span>
              </div>

              {/* Cards */}
              {!isCollapsed && group.length === 0 && (
                <div style={{ padding: '16px 12px', textAlign: 'center' }}>
                  <p style={{ color: THEME.text.subtle, fontSize: THEME.fontSize.sm, margin: 0 }}>No leads in this stage</p>
                </div>
              )}

              {!isCollapsed && group.map(lead => {
                const action = getSuggestedNextAction(lead);
                const deposit = depositLabel(lead);
                const missing = detectMissingTattooInfo({
                  placement: lead.bodyPart,
                  style: lead.style,
                  size: lead.size,
                  budget: lead.budget,
                  references: lead.referenceImages || [],
                  requestedChanges: lead.changeRequest ? [lead.changeRequest] : [],
                  availability: lead.preferredDate,
                });
                const conf = confirmations.get(lead.id);
                const ready = isReadyForDepositRequest({
                  placement: lead.bodyPart,
                  style: lead.style,
                  size: lead.size,
                  budget: lead.budget,
                  references: lead.referenceImages || [],
                  requestedChanges: lead.changeRequest ? [lead.changeRequest] : [],
                  availability: lead.preferredDate,
                });
                const beingGenerated = generatingFor === lead.id;

                // Follow-up signal from smart engine
                const followUp = followUpMap.get(lead.id) || { needsAttention: false, signals: [], topPriority: 'low' as const };

                // Quick action templates relevant to this lead
                const quickActions = quickActionsMap.get(lead.id) || [];

                return (
                  <div key={lead.id} style={{ padding: '8px 12px 12px', borderTop: `1px solid ${THEME.border.subtle}`, background: THEME.bg.app, position: 'relative' }}>
                    {/* Follow-up urgency badge */}
                    {followUp.needsAttention && (
                      <div style={{
                        position: 'absolute', top: 8, right: 12,
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        <span style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: followUp.topPriority === 'high' ? '#ef4444'
                            : followUp.topPriority === 'medium' ? '#f59e0b' : '#94a3b8',
                        }} />
                        <span style={{
                          fontSize: 9, color: followUp.topPriority === 'high' ? '#ef4444'
                            : followUp.topPriority === 'medium' ? '#f59e0b' : '#94a3b8',
                          fontWeight: THEME.fontWeight.semibold,
                        }}>
                          {followUp.topPriority === 'high' ? 'Urgent'
                            : followUp.topPriority === 'medium' ? 'Soon' : 'Check'}
                        </span>
                      </div>
                    )}

                    {/* Row 1: Name + source */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6, paddingRight: followUp.needsAttention ? 70 : 0 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: THEME.fontSize.md, fontWeight: THEME.fontWeight.semibold, color: THEME.text.primary }}>
                          {lead.name}
                        </span>
                        <span style={{ fontSize: THEME.fontSize.xs, color: THEME.text.subtle, marginLeft: 8 }}>
                          {lead.source}
                        </span>
                      </div>
                    </div>

                    {/* Row 2: Next action pill + Placement | Style | Budget */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => {
                          if (action.action === 'send_confirmation' || action.action === 'ask_details') {
                            handleGenerateLink(lead);
                          } else if (action.action === 'follow_up') {
                            logFollowUp(lead.id);
                            updatePipelineStatus(lead.id, 'waiting_info');
                          } else if (action.action === 'ask_refs') {
                            updatePipelineStatus(lead.id, 'waiting_references');
                          } else if (action.action === 'request_deposit') {
                            createDepositRequest(lead.id, artistId).then(() => refresh());
                          } else if (action.action === 'schedule') {
                            updatePipelineStatus(lead.id, 'scheduled');
                          } else if (action.action === 'review_changes') {
                            updatePipelineStatus(lead.id, 'revision');
                          }
                        }}
                        style={{
                          background: `${color}20`, border: `1px solid ${color}40`, borderRadius: THEME.radius.lg,
                          padding: '4px 10px', color, fontSize: THEME.fontSize.xs, fontWeight: THEME.fontWeight.semibold,
                          cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                        }}
                      >
                        {action.label}
                      </button>
                      {lead.bodyPart && <Tag label={lead.bodyPart} />}
                      {lead.style && <Tag label={lead.style} />}
                      {lead.budget && <Tag label={`$${lead.budget.replace(/[^0-9.]/g, '')}`} />}
                    </div>

                    {/* Row 2.5: Risk badge + Next best action from Phase 6 engines */}
                    {(riskMap.has(lead.id) || actionMap.has(lead.id)) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                        {riskMap.has(lead.id) && (() => {
                          const r = riskMap.get(lead.id)!;
                          const riskColors = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };
                          return (
                            <span
                              title={r.reasons.join('\n')}
                              style={{
                                fontSize: 10, fontWeight: 700, borderRadius: 999, padding: '2px 8px',
                                background: riskColors[r.risk] + '20',
                                color: riskColors[r.risk],
                                border: '1px solid ' + riskColors[r.risk] + '40',
                                cursor: 'default',
                              }}
                            >
                              {r.risk === 'high' ? '⚠ High Risk' : r.risk === 'medium' ? '• Medium Risk' : '✓ Low Risk'}
                            </span>
                          );
                        })()}
                        {actionMap.has(lead.id) && actionMap.get(lead.id)!.priority <= 3 && (() => {
                          const a = actionMap.get(lead.id)!;
                          const categoryColors = { revenue: '#22c55e', conversion: '#3b82f6', retention: '#a855f7' };
                          return (
                            <span
                              title={a.reason}
                              style={{
                                fontSize: 10, fontWeight: 600, borderRadius: 6, padding: '2px 8px',
                                background: categoryColors[a.category] + '15',
                                color: categoryColors[a.category],
                                border: '1px solid ' + categoryColors[a.category] + '30',
                                cursor: 'default',
                              }}
                            >
                              {a.action}
                            </span>
                          );
                        })()}
                      </div>
                    )}

                    {/* Row 3: Last message */}
                    {lead.lastMessage && (
                      <p style={{ fontSize: THEME.fontSize.sm, color: THEME.text.muted, margin: '2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {lead.lastMessage}
                      </p>
                    )}

                    {/* Row 4: Last contact + Deposit */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, fontSize: THEME.fontSize.xs, color: THEME.text.subtle }}>
                      <span>{lead.lastContactedAt ? `Contacted ${formatTime(lead.lastContactedAt)}` : 'No contact'}</span>
                      <span style={{ color: deposit.color }}>Deposit: {deposit.text}</span>
                      {lead.paymentAmount && <span>{lead.paymentAmount} {lead.paymentCurrency || ''}</span>}
                    </div>

                    {/* Row 4b: Deposit flow state */}
                    {(() => {
                      const depState = depositFlowMap.get(lead.id);
                      const timing = getDepositTimingRecommendation(lead, depState, {
                        confirmation: conf,
                      });
                      const readiness = isLeadReadyForDeposit(lead, { confirmation: conf });
                      if (lead.paymentStatus === 'paid' || lead.paymentStatus === 'pending_verify') return null;
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                          {/* State badge */}
                          {timing.timing === 'too_early' && (
                            <span style={{ fontSize: THEME.fontSize.xs, color: THEME.text.subtle, fontWeight: THEME.fontWeight.semibold }}>
                              Not ready for deposit
                            </span>
                          )}
                          {timing.timing === 'ideal' && !depState && (
                            <span style={{ fontSize: THEME.fontSize.xs, color: '#22c55e', fontWeight: THEME.fontWeight.semibold }}>
                              Ready for deposit
                            </span>
                          )}
                          {depState?.depositStatus === 'requested' && (
                            <span style={{ fontSize: THEME.fontSize.xs, color: '#f59e0b', fontWeight: THEME.fontWeight.semibold }}>
                              Sent {depState.requestedAt ? formatTime(depState.requestedAt) : ''}
                            </span>
                          )}
                          {depState?.depositStatus === 'viewed' && (
                            <span style={{ fontSize: THEME.fontSize.xs, color: '#a855f7', fontWeight: THEME.fontWeight.semibold }}>
                              Viewed
                            </span>
                          )}
                          {depState?.depositStatus === 'expired' && (
                            <span style={{ fontSize: THEME.fontSize.xs, color: '#ef4444', fontWeight: THEME.fontWeight.semibold }}>
                              Expired
                            </span>
                          )}
                          {depState?.depositStatus === 'declined' && (
                            <span style={{ fontSize: THEME.fontSize.xs, color: '#ef4444', fontWeight: THEME.fontWeight.semibold }}>
                              Declined
                            </span>
                          )}
                          {/* Timing recommendation */}
                          {(timing.timing === 'overdue' || timing.timing === 'losing_momentum') && (
                            <span style={{ fontSize: 10, color: '#f59e0b', fontStyle: 'italic' }}>
                              {timing.label}
                            </span>
                          )}
                          {/* Copy deposit message button */}
                          {(readiness.ready || depState?.depositStatus === 'requested') && (
                            <button
                              onClick={async () => {
                                const msg = getDepositMessage(lead, depState?.depositAmount ? 'standard' : undefined);
                                await navigator.clipboard.writeText(msg);
                                setCopiedId(`${lead.id}_depmsg`);
                                setTimeout(() => setCopiedId(null), 2000);
                              }}
                              style={miniBtnStyle}
                            >
                              {copiedId === `${lead.id}_depmsg` ? 'Copied!' : 'Copy Deposit Message'}
                            </button>
                          )}
                        </div>
                      );
                    })()}

                    {/* Row 5: Project asset summary */}
                    {lead.convertedProjectId && (() => {
                      const ps = projectSummaries.get(lead.id);
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                          {ps && (
                            <>
                              {ps.referenceCount > 0 && <Tag label={`${ps.referenceCount} refs`} />}
                              {ps.revisionCount > 0 && <Tag label={`v${ps.latestRevisionNumber || ps.revisionCount}`} />}
                              {ps.hasApprovedDesign && (
                                <span style={{ fontSize: THEME.fontSize.xs, color: THEME.brand.success, fontWeight: THEME.fontWeight.semibold }}>✓ Final approved</span>
                              )}
                              {ps.pendingApproval && !ps.hasApprovedDesign && (
                                <span style={{ fontSize: THEME.fontSize.xs, color: THEME.brand.info, fontWeight: THEME.fontWeight.semibold }}>⏳ Waiting approval</span>
                              )}
                              {ps.revisionRequested && !ps.hasApprovedDesign && (
                                <span style={{ fontSize: THEME.fontSize.xs, color: '#ec4899', fontWeight: THEME.fontWeight.semibold }}>✎ Revision requested</span>
                              )}
                            </>
                          )}
                          <div style={{ display: 'flex', gap: 4, marginLeft: ps ? 4 : 0 }}>
                            <button onClick={() => navigate(`/project-assets/${lead.convertedProjectId}`)} style={miniBtnStyle}>Board</button>
                            {ps && !ps.hasApprovedDesign && (
                              <button
                                onClick={() => navigate(`/project-assets/${lead.convertedProjectId}`)}
                                style={{ ...miniBtnStyle, color: THEME.brand.info, borderColor: `${THEME.brand.info}40` }}
                              >
                                Send Revision
                              </button>
                            )}
                            {ps && ps.hasApprovedDesign && lead.leadPipelineStatus === 'reviewing' && (
                              <button
                                onClick={async () => {
                                  await createDepositRequest(lead.id, artistId);
                                  await refresh();
                                }}
                                style={{ ...miniBtnStyle, color: THEME.brand.success, borderColor: `${THEME.brand.success}40` }}
                              >
                                Request Deposit
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Design revision state */}
                    {lead.convertedProjectId && (() => {
                      const revSum = revisionSummaries.get(lead.id);
                      if (!revSum) return null;
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                          {revSum.approved && (
                            <span style={{ fontSize: THEME.fontSize.xs, color: THEME.brand.success, fontWeight: THEME.fontWeight.semibold }}>
                              Final approved
                            </span>
                          )}
                          {revSum.pendingApproval && !revSum.approved && (
                            <span style={{ fontSize: THEME.fontSize.xs, color: THEME.brand.info, fontWeight: THEME.fontWeight.semibold }}>
                              Waiting approval
                            </span>
                          )}
                          {revSum.revisionRequested && !revSum.approved && (
                            <span style={{ fontSize: THEME.fontSize.xs, color: '#ec4899', fontWeight: THEME.fontWeight.semibold }}>
                              Revision requested
                            </span>
                          )}
                          <span style={{ fontSize: THEME.fontSize.xs, color: THEME.text.subtle }}>
                            v{revSum.latestVersion}
                          </span>
                          {revSum.approved && lead.paymentStatus !== 'paid' && (
                            <span style={{ fontSize: THEME.fontSize.xs, color: THEME.brand.success, fontWeight: THEME.fontWeight.semibold }}>
                              Ready for deposit
                            </span>
                          )}
                        </div>
                      );
                    })()}

                    {/* Row 6: Follow-up signal reason */}
                    {followUp.needsAttention && (
                      <div style={{
                        marginTop: 4, fontSize: THEME.fontSize.xs,
                        color: followUp.topPriority === 'high' ? '#fca5a5'
                          : followUp.topPriority === 'medium' ? '#fcd34d' : '#94a3b8',
                      }}>
                        {followUp.signals.slice(0, 1).map((s, i) => (
                          <span key={i}>{s.reason}</span>
                        ))}
                      </div>
                    )}

                    {/* Row 6: Missing info badges */}
                    {missing.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                        {missing.map(m => (
                          <span key={m} style={{ fontSize: THEME.fontSize.xs, background: '#f59e0b20', color: '#f59e0b', border: '1px solid #f59e0b40', borderRadius: 999, padding: '1px 8px', fontWeight: THEME.fontWeight.semibold }}>
                            {m}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Inquiry analysis indicators */}
                    {(() => {
                      const analysis = analysisMap.get(lead.id);
                      if (!analysis) return null;
                      const hasUnclearScope = analysis.issues.some(i => i.type === 'unclear_scope');
                      const highIssues = analysis.issues.filter(i => i.severity === 'high');
                      return (
                        <div style={{ marginTop: 4 }}>
                          {/* Issue badges */}
                          {analysis.issues.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
                              {hasUnclearScope && (
                                <span style={{ fontSize: THEME.fontSize.xs, background: '#f59e0b20', color: '#f59e0b', border: '1px solid #f59e0b40', borderRadius: 999, padding: '1px 8px', fontWeight: THEME.fontWeight.semibold }}>
                                  Needs clarification
                                </span>
                              )}
                              {analysis.issues.slice(0, 3).map((issue, i) => (
                                <span
                                  key={i}
                                  style={{
                                    fontSize: THEME.fontSize.xs,
                                    background: issue.severity === 'high' ? '#ef444420' : issue.severity === 'medium' ? '#f59e0b20' : '#94a3b820',
                                    color: issue.severity === 'high' ? '#ef4444' : issue.severity === 'medium' ? '#f59e0b' : '#94a3b8',
                                    border: `1px solid ${issue.severity === 'high' ? '#ef444440' : issue.severity === 'medium' ? '#f59e0b40' : '#94a3b840'}`,
                                    borderRadius: 999, padding: '1px 8px', fontWeight: THEME.fontWeight.semibold,
                                    maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                  }}
                                  title={issue.description}
                                >
                                  {issue.title}
                                </span>
                              ))}
                            </div>
                          )}
                          {/* Confidence score + next best action */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: THEME.fontSize.xs }}>
                            <span style={{ color: analysis.confidenceScore >= 70 ? THEME.brand.success : analysis.confidenceScore >= 40 ? THEME.brand.info : '#ef4444', fontWeight: THEME.fontWeight.semibold }}>
                              {analysis.confidenceScore >= 70 ? 'High' : analysis.confidenceScore >= 40 ? 'Medium' : 'Low'} clarity
                            </span>
                            {analysis.nextBestAction && (
                              <span style={{ color: THEME.text.subtle }}>
                                Next: {analysis.nextBestAction}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Health score + timing suggestions */}
                    {(() => {
                      const h = healthMap.get(lead.id);
                      const t = timingMap.get(lead.id) || [];
                      if (!h) return null;
                      const highPriorityTiming = t.find(s => s.priority === 'high');
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 3,
                            fontSize: THEME.fontSize.xs, fontWeight: THEME.fontWeight.semibold,
                            color: h.level === 'hot' ? '#22c55e' : h.level === 'warm' ? '#f59e0b' : '#a3a3a3',
                          }}>
                            <span style={{
                              width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                              background: h.level === 'hot' ? '#22c55e' : h.level === 'warm' ? '#f59e0b' : '#a3a3a3',
                            }} />
                            {h.level === 'hot' ? 'HOT' : h.level === 'warm' ? 'WARM' : 'COLD'} {h.score}/100
                          </span>
                          {t.slice(0, 2).map(s => (
                            <span key={s.type} style={{
                              fontSize: 9, borderRadius: 999, padding: '1px 8px',
                              fontWeight: THEME.fontWeight.semibold,
                              background: s.priority === 'high' ? '#ef444420' : s.priority === 'medium' ? '#f59e0b20' : '#94a3b820',
                              color: s.priority === 'high' ? '#ef4444' : s.priority === 'medium' ? '#f59e0b' : '#94a3b8',
                              border: `1px solid ${
                                s.priority === 'high' ? '#ef444440' : s.priority === 'medium' ? '#f59e0b40' : '#94a3b840'
                              }`,
                              whiteSpace: 'nowrap',
                            }}>
                              {s.title}
                            </span>
                          ))}
                          {highPriorityTiming && (
                            <span style={{ fontSize: 10, color: THEME.text.subtle, fontStyle: 'italic' }}>
                              {highPriorityTiming.reasoning}
                            </span>
                          )}
                        </div>
                      );
                    })()}

                    {/* Row 7: Quick action templates — Copy Message buttons */}
                    {quickActions.length > 0 && (
                      <div style={{ marginTop: 6 }}>
                        <p style={{ fontSize: 9, color: THEME.text.subtle, margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Quick messages
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {quickActions.map(qa => (
                            <button
                              key={qa.type}
                              onClick={() => handleCopyQuickAction(lead, qa.type, qa.message)}
                              style={{
                                border: `1px solid ${THEME.border.default}`,
                                background: copiedId === `${lead.id}_${qa.type}` ? '#164e3f' : 'transparent',
                                color: copiedId === `${lead.id}_${qa.type}` ? '#22c55e' : THEME.text.muted,
                                borderRadius: THEME.radius.sm,
                                padding: '5px 10px',
                                fontSize: THEME.fontSize.xs,
                                cursor: 'pointer',
                                fontWeight: THEME.fontWeight.semibold,
                                transition: 'all 0.15s',
                              }}
                            >
                              {copiedId === `${lead.id}_${qa.type}` ? '✓ Copied!' : qa.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Row 8: Confirmation link section */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      {conf ? (
                        <>
                          <span style={{ fontSize: THEME.fontSize.xs, color: THEME.text.subtle }}>
                            Link: {conf.status === 'submitted' || conf.status === 'completed' ? '✓ Submitted' : conf.status === 'viewed' ? 'Viewed' : conf.status === 'sent' ? 'Sent' : 'Draft'}
                          </span>
                          <button onClick={() => handleCopyLink(lead)} style={miniBtnStyle}>
                            Copy Link
                          </button>
                          <button onClick={() => handleGenerateLink(lead)} disabled={beingGenerated} style={miniBtnStyle}>
                            {beingGenerated ? '...' : 'Resend'}
                          </button>
                        </>
                      ) : (
                        <button onClick={() => handleGenerateLink(lead)} disabled={beingGenerated} style={{ ...miniBtnStyle, color: THEME.brand.info, borderColor: `${THEME.brand.info}40` }}>
                          {beingGenerated ? 'Generating...' : '+ Generate Link'}
                        </button>
                      )}
                      {ready && conf?.status === 'submitted' && (
                        <span style={{ fontSize: THEME.fontSize.xs, color: THEME.brand.success }}>Ready for deposit</span>
                      )}
                    </div>

                    {/* Row 9: App deeplinks + pipeline transitions */}
                    <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      {/* Deeplink buttons */}
                      <button
                        onClick={() => handleOpenDeeplink(lead, 'ig')}
                        style={deeplinkBtnStyle}
                        title="Open Instagram DM"
                      >
                        Open IG
                      </button>
                      {lead.phone && (
                        <button
                          onClick={() => handleOpenDeeplink(lead, 'wa')}
                          style={deeplinkBtnStyle}
                          title="Open WhatsApp"
                        >
                          Open WhatsApp
                        </button>
                      )}

                      <span style={{ width: 1, height: 16, background: THEME.border.subtle, margin: '0 4px' }} />

                      {/* Pipeline transitions */}
                      {status === 'new_inquiry' && (
                        <QuickBtn onClick={() => updatePipelineStatus(lead.id, 'reviewing')} label="Move to Review" />
                      )}
                      {status === 'waiting_info' && (
                        <QuickBtn onClick={() => updatePipelineStatus(lead.id, 'reviewing')} label="Got info → Review" />
                      )}
                      {status === 'waiting_references' && (
                        <QuickBtn onClick={() => updatePipelineStatus(lead.id, 'reviewing')} label="Got refs → Review" />
                      )}
                      {status === 'reviewing' && (
                        <>
                          <QuickBtn onClick={async () => { await createDepositRequest(lead.id, artistId); await refresh(); }} label="Request Deposit" />
                          <QuickBtn onClick={() => updatePipelineStatus(lead.id, 'revision')} label="Send for Revision" />
                        </>
                      )}
                      {status === 'revision' && (
                        <QuickBtn onClick={() => updatePipelineStatus(lead.id, 'reviewing')} label="Revised → Review" />
                      )}
                      {status === 'deposit_requested' && (
                        <>
                          <QuickBtn onClick={async () => { await markDepositPaid(lead.id); await refresh(); }} label="Mark Paid" />
                          <QuickBtn onClick={async () => { await incrementReminder(lead.id); }} label="Send Reminder" color="#f59e0b" />
                        </>
                      )}
                      {status === 'deposit_paid' && (
                        <QuickBtn onClick={() => updatePipelineStatus(lead.id, 'scheduled')} label="Mark Scheduled" />
                      )}
                      {status === 'scheduled' && (
                        <QuickBtn onClick={() => updatePipelineStatus(lead.id, 'completed')} label="Mark Completed" />
                      )}
                      {status !== 'ghosted' && status !== 'completed' && (
                        <QuickBtn onClick={() => handleMarkGhosted(lead.id)} label="Ghosted" color="#78716c" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Paste conversation modal */}
      {showPasteModal && (
        <div
          onClick={() => { setShowPasteModal(false); setParsedDraft(null); setPasteText(''); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: THEME.bg.app, borderRadius: '16px 16px 0 0',
              width: '100%', maxWidth: 600, maxHeight: '85dvh', overflow: 'auto',
              padding: 20,
            }}
          >
            <h2 style={{ fontSize: THEME.fontSize.lg, fontWeight: THEME.fontWeight.bold, color: THEME.text.primary, margin: '0 0 12px' }}>
              Paste Conversation
            </h2>
            <p style={{ fontSize: THEME.fontSize.xs, color: THEME.text.subtle, margin: '-8px 0 12px' }}>
              Paste IG or WhatsApp chat text — the parser extracts placement, style, budget, and more.
            </p>

            <textarea
              value={pasteText}
              onChange={e => { setPasteText(e.target.value); setParsedDraft(null); }}
              placeholder={`Hey I'm thinking about getting a dragon sleeve in black and grey realism, maybe forearm. Budget around $400.`}
              style={{
                width: '100%', minHeight: 120, resize: 'vertical', boxSizing: 'border-box',
                background: THEME.bg.panel, border: `1px solid ${THEME.border.default}`,
                borderRadius: THEME.radius.lg, padding: 12,
                color: THEME.text.primary, fontSize: THEME.fontSize.sm,
                fontFamily: 'inherit',
              }}
            />

            {pasteText.trim() && !parsedDraft && (
              <button
                onClick={() => setParsedDraft(createLeadDraftFromConversation(pasteText))}
                style={{
                  marginTop: 8, width: '100%',
                  background: THEME.brand.primary, color: '#fff',
                  border: 'none', borderRadius: THEME.radius.lg,
                  padding: '10px 16px', fontSize: THEME.fontSize.base,
                  fontWeight: THEME.fontWeight.semibold, cursor: 'pointer',
                }}
              >
                Analyze
              </button>
            )}

            {parsedDraft && (
              <div style={{ marginTop: 12 }}>
                {(() => {
                  const parsed = parseTattooInquiry(pasteText);
                  const clarity = detectScopeClarity(parsed);
                  return (
                    <div style={{ marginBottom: 8 }}>
                      {parsed.warnings.length > 0 && (
                        <div style={{ marginBottom: 6 }}>
                          {parsed.warnings.map((w, i) => (
                            <p key={i} style={{ fontSize: THEME.fontSize.xs, color: '#f59e0b', margin: '2px 0' }}>
                              {w}
                            </p>
                          ))}
                        </div>
                      )}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {parsedDraft.placement && <Tag label={parsedDraft.placement} />}
                        {parsedDraft.style && <Tag label={parsedDraft.style} />}
                        {parsedDraft.size && <Tag label={parsedDraft.size} />}
                        {parsedDraft.budget && <Tag label={parsedDraft.budget} />}
                        <span style={{
                          fontSize: THEME.fontSize.xs, borderRadius: 999, padding: '1px 8px',
                          fontWeight: THEME.fontWeight.semibold,
                          background: clarity === 'clear' ? '#22c55e20' : clarity === 'somewhat_clear' ? '#f59e0b20' : '#ef444420',
                          color: clarity === 'clear' ? '#22c55e' : clarity === 'somewhat_clear' ? '#f59e0b' : '#ef4444',
                          border: `1px solid ${
                            clarity === 'clear' ? '#22c55e40' : clarity === 'somewhat_clear' ? '#f59e0b40' : '#ef444440'
                          }`,
                        }}>
                          {clarity === 'clear' ? 'Clear scope' : clarity === 'somewhat_clear' ? 'Somewhat clear' : 'Unclear scope'}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                <div style={{ fontSize: THEME.fontSize.xs, color: THEME.text.muted, marginBottom: 8 }}>
                  Confidence: {parsedDraft.confidence}/100
                </div>

                {parsedDraft.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                    {parsedDraft.tags.map(t => (
                      <span key={t} style={{ fontSize: 9, background: THEME.bg.panelAlt, color: THEME.text.subtle, borderRadius: 4, padding: '1px 6px', border: `1px solid ${THEME.border.default}` }}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ fontSize: THEME.fontSize.sm, color: THEME.brand.info, marginBottom: 12, fontWeight: THEME.fontWeight.semibold }}>
                  {parsedDraft.nextBestAction}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={async () => {
                      setCreatingLead(true);
                      const id = self.crypto.randomUUID();
                      await db.leads.add({
                        id,
                        artistId,
                        name: parsedDraft.name,
                        bodyPart: parsedDraft.placement,
                        style: parsedDraft.style,
                        size: parsedDraft.size,
                        budget: parsedDraft.budget,
                        note: parsedDraft.note,
                        source: parsedDraft.source,
                        status: 'new',
                        leadPipelineStatus: 'new_inquiry',
                        createdAt: Date.now(),
                      });
                      setCreatingLead(false);
                      setShowPasteModal(false);
                      setParsedDraft(null);
                      setPasteText('');
                      await refresh();
                    }}
                    style={{
                      flex: 1,
                      background: THEME.brand.primary, color: '#fff',
                      border: 'none', borderRadius: THEME.radius.lg,
                      padding: '10px 16px', fontSize: THEME.fontSize.base,
                      fontWeight: THEME.fontWeight.semibold, cursor: 'pointer',
                    }}
                  >
                    {creatingLead ? 'Creating...' : 'Confirm & Create Lead'}
                  </button>
                  <button
                    onClick={() => { setShowPasteModal(false); setParsedDraft(null); setPasteText(''); }}
                    style={{
                      background: 'transparent', color: THEME.text.muted,
                      border: `1px solid ${THEME.border.default}`, borderRadius: THEME.radius.lg,
                      padding: '10px 16px', fontSize: THEME.fontSize.base,
                      fontWeight: THEME.fontWeight.semibold, cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span style={{ fontSize: 10, color: THEME.text.muted, background: THEME.bg.panelAlt, borderRadius: 4, padding: '2px 6px', border: `1px solid ${THEME.border.default}` }}>
      {label}
    </span>
  );
}

function QuickBtn({ onClick, label, color }: { onClick: () => void; label: string; color?: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: `1px solid ${color ? `${color}40` : THEME.border.default}`,
        background: 'transparent',
        color: color || THEME.text.muted,
        borderRadius: THEME.radius.sm,
        padding: '4px 8px',
        fontSize: 10,
        cursor: 'pointer',
        fontWeight: THEME.fontWeight.semibold,
      }}
    >
      {label}
    </button>
  );
}

const miniBtnStyle: React.CSSProperties = {
  border: `1px solid ${THEME.border.default}`,
  background: 'transparent',
  color: THEME.text.muted,
  borderRadius: THEME.radius.sm,
  padding: '3px 8px',
  fontSize: 10,
  cursor: 'pointer',
};

const deeplinkBtnStyle: React.CSSProperties = {
  border: `1px solid ${THEME.border.default}`,
  background: 'transparent',
  color: '#a3a3a3',
  borderRadius: THEME.radius.sm,
  padding: '4px 8px',
  fontSize: 10,
  cursor: 'pointer',
  fontWeight: 600,
};
