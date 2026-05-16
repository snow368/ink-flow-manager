import { db, type CommunicationLogRecord } from '../db';

const AFTERCARE_TEMPLATES: Record<string, string[]> = {
  default: [
    'Keep the bandage on for the recommended time.',
    'Wash gently with antibacterial soap and lukewarm water.',
    'Pat dry with a clean paper towel — do not rub.',
    'Apply a thin layer of recommended ointment.',
    'Avoid swimming, sun exposure, and tight clothing for 2 weeks.',
    'Do not pick or scratch the tattoo while it heals.',
    'Contact your artist if you notice signs of infection.',
  ],
  'large-piece': [
    'Leave the initial wrap on overnight (or per artist instructions).',
    'Wash 2-3 times daily with mild antibacterial soap.',
    'Apply ointment sparingly — too much suffocates the skin.',
    'Wear loose, breathable clothing over the area.',
    'Avoid gym, sauna, pools, and direct sun for 3 weeks.',
    'Sleep on clean sheets, avoid pet contact with fresh tattoo.',
    'Schedule a touch-up check in 4-6 weeks if needed.',
  ],
  'fine-line': [
    'Remove bandage after 2-4 hours.',
    'Wash gently with lukewarm water and mild soap.',
    'Apply a very thin layer of unscented lotion.',
    'Fine line tattoos heal faster but are delicate — avoid friction.',
    'Sun protection is critical — UV fades fine lines quickly.',
    'Touch-ups may be needed after full healing (4-6 weeks).',
  ],
  'color': [
    'Color tattoos may ooze plasma for 24-48 hours — this is normal.',
    'Wash and re-wrap for the first 2 nights if oozing.',
    'Avoid colored clothing dyes touching the fresh tattoo.',
    'Colors may look dull during peeling — final color appears after 3-4 weeks.',
    'Use SPF 50+ on healed color tattoos to prevent fading.',
  ],
  'cover-up': [
    'Cover-up tattoos are often worked deeper — healing takes longer.',
    'Keep the area extra moisturized during healing.',
    'Expect more scabbing than a fresh tattoo on bare skin.',
    'The old tattoo underneath may show through during healing — wait 4+ weeks for final result.',
  ],
};

export function getAftercareSteps(type?: string): string[] {
  if (!type) return AFTERCARE_TEMPLATES.default;
  const key = type.toLowerCase().replace(/\s+/g, '-');
  return AFTERCARE_TEMPLATES[key] || AFTERCARE_TEMPLATES.default;
}

export function getAftercareMessage(type?: string): string {
  const steps = getAftercareSteps(type);
  return 'Aftercare Instructions:\n\n' + steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
}

export function getAftercareWhatsAppUrl(
  clientName: string,
  type?: string,
  artistWhatsappPhone?: string,
): string | null {
  const phone = artistWhatsappPhone?.replace(/[^\d+]/g, '') || '';
  if (!phone) return null;
  const msg = encodeURIComponent(
    `Hi ${clientName}, here are your aftercare instructions:\n\n${getAftercareMessage(type)}\n\nTake care! Feel free to message if you have any questions.`
  );
  return `https://wa.me/${phone.replace(/^\+/, '')}?text=${msg}`;
}

export async function logCommunication(
  artistId: string,
  channel: CommunicationLogRecord['channel'],
  direction: CommunicationLogRecord['direction'],
  data: { clientId?: string; appointmentId?: string; message?: string; templateType?: string },
): Promise<void> {
  const id = 'comm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  await db.communicationLog.add({
    id,
    artistId,
    clientId: data.clientId,
    appointmentId: data.appointmentId,
    channel,
    direction,
    message: data.message,
    templateType: data.templateType,
    createdAt: Date.now(),
  });
}

export async function getClientTimeline(clientId: string): Promise<CommunicationLogRecord[]> {
  return db.communicationLog
    .where('clientId').equals(clientId)
    .reverse()
    .sortBy('createdAt');
}
