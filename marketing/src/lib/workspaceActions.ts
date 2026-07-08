const WA_BASE = 'https://wa.me';

export function openInstagramDM(handle: string) {
  if (!handle) return;
  const clean = handle.replace('@', '');
  window.open(`https://instagram.com/${clean}`, '_blank', 'noopener,noreferrer');
}

export function openWhatsApp(phone?: string, message?: string) {
  if (!phone) return;
  const clean = phone.replace(/[^\d+]/g, '');
  const url = message
    ? `${WA_BASE}/${clean}?text=${encodeURIComponent(message)}`
    : `${WA_BASE}/${clean}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function copyMessage(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export async function copyDepositMessage(leadId: string, message: string) {
  await copyMessage(message);
  if (leadId) {
    try {
      const { db } = await import('../db');
      const now = Date.now();
      localStorage.setItem(`inkflow_pay_reminder_${leadId}_sent`, String(now));
      await db.leads.update(leadId, { nextFollowUpAt: now + 24 * 60 * 60 * 1000 });
    } catch { /* best effort */ }
  }
}

export function openClientDetail(clientId: string, navigate: (path: string) => void) {
  navigate(`/clients/${clientId}`);
}

export function openProjectBoard(projectId: string, navigate: (path: string) => void) {
  navigate(`/projects/${projectId}`);
}

export function startSession(appointmentId: string, projectId: string | undefined, navigate: (path: string) => void) {
  const params = new URLSearchParams({ appointmentId });
  if (projectId) params.set('projectId', projectId);
  navigate(`/session?${params.toString()}`);
}

