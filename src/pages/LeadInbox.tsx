import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type LeadRecord, type LeadConfirmationRecord } from '../db';
import { THEME } from '../lib/theme';
import { StatusDot } from '../components/StatusBadge';
import {
  getSuggestedNextAction,
  getLeadConfirmationByLeadId,
  buildConfirmationLink,
  logConfirmationSent,
  createLeadConfirmation,
  detectMissingTattooInfo,
  isReadyForDepositRequest,
  logFollowUp,
  logDepositRequested,
} from '../lib/leadConfirmation';

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

export default function LeadInbox() {
  const navigate = useNavigate();
  const [artistId, setArtistId] = useState('');
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [confirmations, setConfirmations] = useState<Map<string, LeadConfirmationRecord>>(new Map());
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set(['completed', 'ghosted']));
  const [loading, setLoading] = useState(true);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);

  useEffect(() => {
    const current = localStorage.getItem('inkflow_current_user');
    if (!current) return;
    setArtistId(current);
    (async () => {
      const all = await db.leads.where('artistId').equals(current).reverse().sortBy('createdAt');
      setLeads(all);
      // Load all confirmations for these leads
      const allConfs = await db.leadConfirmations.where('artistId').equals(current).toArray();
      const map = new Map<string, LeadConfirmationRecord>();
      for (const c of allConfs) {
        if (c.leadId) map.set(c.leadId, c);
      }
      setConfirmations(map);
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

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', background: THEME.bg.app, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 24, height: 24, border: `2px solid ${THEME.border.default}`, borderTopColor: THEME.brand.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const totalLeads = leads.length;

  return (
    <div style={{ minHeight: '100dvh', background: THEME.bg.app, maxWidth: 600, margin: '0 auto', padding: '0 0 24px 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 12px' }}>
        <div>
          <h1 style={{ fontSize: THEME.fontSize['2xl'], fontWeight: THEME.fontWeight.bold, color: THEME.text.primary, margin: 0, lineHeight: 1.2 }}>
            Lead Pipeline
          </h1>
          <p style={{ fontSize: THEME.fontSize.sm, color: THEME.text.muted, margin: '4px 0 0' }}>{totalLeads} leads</p>
        </div>
        <button onClick={() => navigate(-1)} style={{ background: THEME.bg.panel, border: `1px solid ${THEME.border.default}`, borderRadius: THEME.radius.lg, padding: '8px 14px', color: THEME.text.muted, fontSize: THEME.fontSize.base, cursor: 'pointer' }}>
          Back
        </button>
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

                return (
                  <div key={lead.id} style={{ padding: '8px 12px 12px', borderTop: `1px solid ${THEME.border.subtle}`, background: THEME.bg.app }}>
                    {/* Row 1: Name + Status badge + Next action */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: THEME.fontSize.md, fontWeight: THEME.fontWeight.semibold, color: THEME.text.primary }}>
                          {lead.name}
                        </span>
                        <span style={{ fontSize: THEME.fontSize.xs, color: THEME.text.subtle, marginLeft: 8 }}>
                          {lead.source}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          const label = action.label;
                          if (action.action === 'send_confirmation' || action.action === 'ask_details') {
                            handleGenerateLink(lead);
                          } else if (action.action === 'follow_up') {
                            logFollowUp(lead.id);
                            updatePipelineStatus(lead.id, 'waiting_info');
                          } else if (action.action === 'ask_refs') {
                            updatePipelineStatus(lead.id, 'waiting_references');
                          } else if (action.action === 'request_deposit') {
                            logDepositRequested(lead.id);
                            updatePipelineStatus(lead.id, 'deposit_requested');
                          } else if (action.action === 'schedule') {
                            updatePipelineStatus(lead.id, 'scheduled');
                          } else if (action.action === 'review_changes') {
                            updatePipelineStatus(lead.id, 'revision');
                          }
                        }}
                        style={{
                          background: `${color}20`, border: `1px solid ${color}40`, borderRadius: THEME.radius.lg,
                          padding: '5px 10px', color, fontSize: THEME.fontSize.xs, fontWeight: THEME.fontWeight.semibold,
                          cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                        }}
                      >
                        {action.label}
                      </button>
                    </div>

                    {/* Row 2: Placement | Style | Budget */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
                      {lead.bodyPart && <Tag label={lead.bodyPart} />}
                      {lead.style && <Tag label={lead.style} />}
                      {lead.budget && <Tag label={`$${lead.budget.replace(/[^0-9.]/g, '')}`} />}
                    </div>

                    {/* Row 3: Last message */}
                    {lead.lastMessage && (
                      <p style={{ fontSize: THEME.fontSize.sm, color: THEME.text.muted, margin: '2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {lead.lastMessage}
                      </p>
                    )}

                    {/* Row 4: Last contact + Source + Deposit */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, fontSize: THEME.fontSize.xs, color: THEME.text.subtle }}>
                      <span>{lead.lastContactedAt ? `Contacted ${formatTime(lead.lastContactedAt)}` : 'No contact'}</span>
                      <span style={{ color: deposit.color }}>Deposit: {deposit.text}</span>
                      {lead.paymentAmount && <span>{lead.paymentAmount} {lead.paymentCurrency || ''}</span>}
                    </div>

                    {/* Row 5: Missing info badges */}
                    {missing.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                        {missing.map(m => (
                          <span key={m} style={{ fontSize: THEME.fontSize.xs, background: '#f59e0b20', color: '#f59e0b', border: '1px solid #f59e0b40', borderRadius: 999, padding: '1px 8px', fontWeight: THEME.fontWeight.semibold }}>
                            {m}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Row 6: Confirmation link section */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      {conf ? (
                        <>
                          <span style={{ fontSize: THEME.fontSize.xs, color: THEME.text.subtle }}>
                            Link: {conf.status === 'submitted' || conf.status === 'completed' ? '✓ Submitted' : conf.status === 'viewed' ? '👁 Viewed' : conf.status === 'sent' ? 'Sent' : 'Draft'}
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

                    {/* Row 7: Quick transitions */}
                    <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
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
                          <QuickBtn onClick={() => updatePipelineStatus(lead.id, 'deposit_requested')} label="Request Deposit" />
                          <QuickBtn onClick={() => updatePipelineStatus(lead.id, 'revision')} label="Send for Revision" />
                        </>
                      )}
                      {status === 'revision' && (
                        <QuickBtn onClick={() => updatePipelineStatus(lead.id, 'reviewing')} label="Revised → Review" />
                      )}
                      {status === 'deposit_requested' && (
                        <QuickBtn onClick={() => updatePipelineStatus(lead.id, 'deposit_paid')} label="Mark Paid" />
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
