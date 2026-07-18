/**
 * Aftercare & Client Retention Engine
 *
 * Lifecycle: Session Complete → Schedule D1/D3/D7/D30 → Mode Selection → Send/Track → Feed engines
 *
 * Priority:
 *   1. Safety / healing instructions (highest)
 *   2. Client satisfaction
 *   3. Engagement check-in
 *   4. Referral / repeat booking (lowest, never pushy)
 */

import { db, type SessionRecord } from '../db';
import { logCommunication } from './aftercareLogic';

// ── Unified Engine Output Schema ──

export interface EngineOutput {
  clientId: string;
  score: number;
  level: 'low' | 'medium' | 'high';
  confidence: number;
  timing: 'now' | '7d' | '30d' | '60-180d';
  nextAction: string;
  reason: string;
  warning: string | null;
}

function normalizeAftercareSchedule(
  clientId: string,
  checkpoints: AftercareCheckpoint[],
  sessionCompletedAt: number,
): EngineOutput {
  const pending = checkpoints.filter(c => c.shouldSendNow);
  const overdue = checkpoints.filter(c => c.reason.includes('Overdue'));
  const allSent = pending.length === 0;

  if (allSent) {
    return {
      clientId,
      score: 100,
      level: 'low',
      confidence: 95,
      timing: '30d',
      nextAction: 'No pending aftercare — all checkpoints completed',
      reason: 'All aftercare checkpoints (D1/D3/D7/D30) have been sent',
      warning: null,
    };
  }

  const hasD1 = pending.some(c => c.day === 'D1');
  const hasD3 = pending.some(c => c.day === 'D3');
  const hasOverdue = overdue.length > 0;

  // Score: D1 overdue = worst case
  const score = hasD1 && hasOverdue ? 10
    : hasD1 ? 25
    : hasD3 && hasOverdue ? 30
    : hasD3 ? 50
    : hasOverdue ? 35
    : 65;

  const level: 'low' | 'medium' | 'high' = score <= 30 ? 'high' : score <= 55 ? 'medium' : 'low';
  const confidence = level === 'high' ? 90 : level === 'medium' ? 75 : 60;

  return {
    clientId,
    score,
    level,
    confidence,
    timing: hasD1 || hasD3 ? 'now' : pending.some(c => c.day === 'D7') ? '7d' : '30d',
    nextAction: hasD1
      ? 'Send D1 aftercare immediately — critical for healing'
      : hasD3
        ? 'Send D3 healing check-in'
        : pending.some(c => c.day === 'D7')
          ? 'Send D7 progress check'
          : 'Prepare D30 final result engagement',
    reason: pending.map(c => `${c.day}: ${c.reason}`).join('; '),
    warning: hasD1 && hasOverdue
      ? 'D1 overdue — client may not have received critical safety instructions'
      : hasD1
        ? 'D1 pending — prioritize immediate aftercare'
        : null,
  };
}

export function aggregateAftercareStatus(
  clientId: string,
  checkpoints: AftercareCheckpoint[],
  sessionCompletedAt: number,
): EngineOutput {
  return normalizeAftercareSchedule(clientId, checkpoints, sessionCompletedAt);
}

// ── Types ──

export type AftercareDay = 'D1' | 'D3' | 'D7' | 'D30';
export type AftercareMode = 'autoSend' | 'suggestedSend' | 'copyOnly';
export type AftercareChannel = 'whatsapp' | 'sms' | 'copy';

export interface AftercareCheckpoint {
  clientId: string;
  day: AftercareDay;
  shouldSendNow: boolean;
  mode: AftercareMode;
  channel: AftercareChannel;
  message: string;
  reason: string;
  nextAction: string;
}

export interface AftercareConfig {
  autoAftercare: boolean;
  whatsappPhone?: string;
  language: string;
  artistId: string;
}

// ── 7-language message templates ──
// Tone: tattoo artist — short, friendly, non-salesy, never marketing

const MESSAGES: Record<string, Record<AftercareDay, (name: string) => string>> = {
  en: {
    D1: (name) =>
      `Hey ${name}, hope your session went well! Quick reminder: keep the wrap on for a few hours, then wash gently with antibacterial soap and apply a thin layer of ointment. DM me if anything looks off 👍`,
    D3: (name) =>
      `Hey ${name}, just checking in — how's the healing going? Some peeling is normal. Keep it moisturized (light layer) and don't pick at it!`,
    D7: (name) =>
      `Hi ${name}, a week in — hope it's settling well! The itch phase is almost over 👍 If the skin feels dry, a tiny bit of unscented lotion helps.`,
    D30: (name) =>
      `Hey ${name}, been a month — would love to see how it healed! Send me a pic when you get a chance 🙌 And if you're thinking about your next piece, I'm here to chat!`,
  },
  es: {
    D1: (name) =>
      `¡Hola ${name}! Espero que tu sesión haya ido bien. Recordatorio: deja el vendaje unas horas, lava suavemente con jabón antibacterial y aplica una capa fina de pomada. ¡Escríbeme si ves algo raro!`,
    D3: (name) =>
      `Hola ${name}, ¿cómo va la cicatrización? Es normal que se pele un poco. Mantenlo hidratado (capa ligera) y ¡no lo rasques!`,
    D7: (name) =>
      `Hola ${name}, ya una semana — espero que esté sanando bien. La picazón ya casi termina 👍 Si sientes la piel seca, un poco de loción sin perfume ayuda.`,
    D30: (name) =>
      `¡Hola ${name}! Ya pasó un mes — ¡me encantaría ver cómo sanó! Mándame una foto 🙌 Y si piensas en tu próximo tatuaje, aquí estoy para hablar.`,
  },
  pt: {
    D1: (name) =>
      `Olá ${name}, espero que sua sessão tenha ido bem! Lembrete: mantenha o curativo por algumas horas, lave suavemente com sabonete antibacteriano e aplique uma camada fina de pomada. Me chame se notar algo estranho 👍`,
    D3: (name) =>
      `Olá ${name}, como está a cicatrização? É normal descamar um pouco. Mantenha hidratado (camada leve) e não coce!`,
    D7: (name) =>
      `Oi ${name}, uma semana — espero que esteja tudo bem! A fase de coceira está quase acabando 👍 Se sentir a pele seca, um pouco de loção sem perfume ajuda.`,
    D30: (name) =>
      `Olá ${name}, já faz um mês — adoraria ver como ficou! Me manda uma foto 🙌 E se estiver pensando na próxima tattoo, estou aqui para conversar!`,
  },
  fr: {
    D1: (name) =>
      `Salut ${name}, j'espère que ta séance s'est bien passée ! Garde le pansement quelques heures, lave doucement avec du savon antibactérien et applique une fine couche de pommade. DM moi si tu vois quelque chose d'anormal 👍`,
    D3: (name) =>
      `Salut ${name}, comment va la cicatrisation ? C'est normal que ça pèle un peu. Garde-le hydraté (couche légère) et ne gratte pas !`,
    D7: (name) =>
      `Salut ${name}, une semaine — j'espère que ça se passe bien ! La phase de démangeaison est presque finie 👍 Si la peau est sèche, un peu de lotion non parfumée aide.`,
    D30: (name) =>
      `Salut ${name}, ça fait un mois — j'aimerais voir le résultat ! Envoie-moi une photo 🙌 Et si tu penses à ta prochaine pièce, je suis là pour en parler !`,
  },
  de: {
    D1: (name) =>
      `Hey ${name}, hoffe deine Sitzung war gut! Kurze Erinnerung: Lass den Verband ein paar Stunden drauf, wasche dann vorsichtig mit antibakterieller Seife und trage eine dünne Schicht Salbe auf. Melde dich, wenn etwas komisch aussieht 👍`,
    D3: (name) =>
      `Hey ${name}, wie läuft die Heilung? Leichte Schuppenbildung ist normal. Halt es feucht (dünne Schicht) und nicht kratzen!`,
    D7: (name) =>
      `Hi ${name}, eine Woche — hoffe alles gut! Die Juckreiz-Phase ist fast vorbei 👍 Falls die Haut spannt, hilft etwas unparfümierte Lotion.`,
    D30: (name) =>
      `Hey ${name}, schon ein Monat — würde gerne sehen, wie es verheilt ist! Schick mir ein Bild 🙌 Falls du über dein nächstes Tattoo nachdenkst, ich bin da zum Quatschen!`,
  },
  th: {
    D1: (name) =>
      `สวัสดี ${name} หวังว่าเซสชันผ่านไปด้วยดี! อย่าลืม: เก็บผ้าพันแผลไว้ 2-3 ชม. ล้างเบาๆ ด้วยสบู่ต้านเชื้อแบคทีเรีย และทาครีมบางๆ สงสัยอะไรทักมาได้ 👍`,
    D3: (name) =>
      `สวัสดี ${name} แผลเป็นยังไงบ้าง? การลอกเป็นเรื่องปกติ ทาครีมบางๆ และห้ามเกานะครับ!`,
    D7: (name) =>
      `สวัสดี ${name} อาทิตย์แล้ว หวังว่าแผลกำลังดีขึ้น! อาการคันใกล้จะหายแล้ว 👍 ถ้าผิวแห้ง ทาโลชั่นอ่อนๆ ช่วยได้ครับ`,
    D30: (name) =>
      `สวัสดี ${name} ผ่านไปหนึ่งเดือน อยากเห็นแผลที่สวยแล้ว! ส่งรูปมาให้ดูหน่อย 🙌 ถ้าคิดจะสักเพิ่ม บอกได้นะครับ!`,
  },
  jp: {
    D1: (name) =>
      `${name}さん、セッションお疲れ様でした！アフターケアです：ラップは数時間そのままに、その後は抗菌せっけんで優しく洗い、薄く軟膏を塗ってください。何かあればDMしてくださいね👍`,
    D3: (name) =>
      `${name}さん、回復の調子はどうですか？皮がむけるのが普通です。薄く保湿を続けて、かかないでくださいね！`,
    D7: (name) =>
      `${name}さん、1週間経ちました。痒みのピークはもうすぐ終わります👍 肌が乾燥するようなら、無香料のローションを薄く塗ってください。`,
    D30: (name) =>
      `${name}さん、もう1ヶ月です！仕上がりを見せてください！写真を送ってもらえますか？🙌 次のタトゥーを考えているなら、いつでも相談してください！`,
  },
};

// ── Day metadata ──

const DAY_META: Record<AftercareDay, { label: string; targetHours: number; priority: number }> = {
  D1: { label: 'immediate aftercare', targetHours: 24, priority: 0 },
  D3: { label: 'early healing check-in', targetHours: 72, priority: 1 },
  D7: { label: 'healing progress', targetHours: 168, priority: 2 },
  D30: { label: 'final result + engagement', targetHours: 720, priority: 3 },
};

// ── Core: generate checkpoints for a completed session ──

export async function generateAftercareSchedule(
  session: SessionRecord,
  config: AftercareConfig,
): Promise<AftercareCheckpoint[]> {
  const completedAt = session.completedAt || session.finishedAt || Date.now();
  const client = session.clientId ? await db.clients.get(session.clientId) : null;
  if (!client || !session.clientId) return [];

  const name = client.name || 'there';
  const lang = MESSAGES[config.language] ? config.language : 'en';
  const msgSet = MESSAGES[lang];
  const clientPhone = client.phone;
  const hasWhatsApp = !!(clientPhone && config.whatsappPhone);
  const hasSms = !!clientPhone;

  // Load already-sent checkpoints
  const sentDays = new Set((session.aftercareSchedule || []).map(e => e.day));

  const now = Date.now();
  const elapsedHours = (now - completedAt) / 3600000;

  const checkpoints: AftercareCheckpoint[] = [];
  const days: AftercareDay[] = ['D1', 'D3', 'D7', 'D30'];

  for (const day of days) {
    const dayNum = Number(day.slice(1));
    if (sentDays.has(dayNum)) continue;

    const meta = DAY_META[day];
    const isDue = elapsedHours >= meta.targetHours * 0.8;
    const isOverdue = elapsedHours >= meta.targetHours * 1.5;

    // ── Channel selection ──
    let channel: AftercareChannel = 'copy';
    if (hasWhatsApp) channel = 'whatsapp';
    else if (hasSms) channel = 'sms';

    // ── Mode selection ──
    let mode: AftercareMode = 'suggestedSend';

    // autoSend only for D1/D3 (safety, never marketing) AND config enabled AND has channel
    if (config.autoAftercare && (day === 'D1' || day === 'D3') && channel !== 'copy') {
      mode = 'autoSend';
    }

    // D30 is always suggested (engagement, never auto)
    if (day === 'D30') mode = 'suggestedSend';

    // If only copy available, it's copyOnly
    if (channel === 'copy') mode = 'copyOnly';

    const message = msgSet[day](name);

    checkpoints.push({
      clientId: session.clientId,
      day,
      shouldSendNow: isDue || isOverdue,
      mode,
      channel,
      message,
      reason: isOverdue
        ? `Overdue — send now`
        : isDue
          ? `${meta.label}`
          : `Ready in ~${Math.round((meta.targetHours - elapsedHours) / 24)}d`,
      nextAction: `Send ${day} aftercare`,
    });
  }

  return checkpoints;
}

// ── Mark a checkpoint as sent (idempotent) ──

export async function markCheckpointSent(
  sessionId: string,
  day: number,
  channel: AftercareChannel,
  message: string,
  mode: AftercareMode,
): Promise<void> {
  const session = await db.sessions.get(sessionId);
  if (!session) return;

  const now = Date.now();
  const schedule = session.aftercareSchedule || [];
  if (schedule.some(e => e.day === day)) return;

  await db.sessions.update(sessionId, {
    aftercareSchedule: [...schedule, { day, sentAt: now }],
    healingStatus: day === 30 ? 'fully_healed' : (session.healingStatus || 'healing'),
  });

  await logCommunication(session.artistId, channel === 'whatsapp' ? 'whatsapp' : 'sms', 'outbound', {
    clientId: session.clientId,
    appointmentId: session.appointmentId,
    projectId: session.projectId,
    message,
    templateType: `aftercare_d${day}`,
  });

  // D30: signal to repeat booking + referral engines
  if (day === 30) {
    await signalHealed(session);
  }
}

// ── D30 healed signal ──

async function signalHealed(session: SessionRecord) {
  await db.sessions.update(session.id, { healingStatus: 'fully_healed' });

  // If project completed, flag for touch-up evaluation
  if (session.projectId) {
    const project = await db.projects.get(session.projectId);
    if (project && project.status === 'completed' && project.completedSessions > 0) {
      await db.sessions.update(session.id, { healingStatus: 'needs_touchup' });
    }
  }
}

// ── Get actionable checkpoints for workspace ──

export async function getPendingAftercare(
  config: AftercareConfig,
): Promise<AftercareCheckpoint[]> {
  const maxAge = Date.now() - 45 * 86400000;
  const sessions = await db.sessions
    .where('artistId').equals(config.artistId)
    .and(s => s.status === 'completed')
    .filter(s => (s.completedAt || s.finishedAt || 0) > maxAge)
    .toArray();

  const all: AftercareCheckpoint[] = [];
  for (const session of sessions) {
    const checkpoints = await generateAftercareSchedule(session, config);
    all.push(...checkpoints.filter(c => c.shouldSendNow));
  }

  all.sort((a, b) => {
    const ap = DAY_META[a.day].priority;
    const bp = DAY_META[b.day].priority;
    return ap - bp;
  });

  return all;
}

// ── Status query (used by ClientDetail) ──

export interface AftercareStatus {
  pendingDays: number[];
  sentDays: { day: number; sentAt: number }[];
  allSent: boolean;
  hasSchedule: boolean;
}

export async function getAftercareStatus(sessionId: string): Promise<AftercareStatus> {
  const session = await db.sessions.get(sessionId);
  if (!session) {
    return { pendingDays: [], sentDays: [], allSent: true, hasSchedule: false };
  }
  const schedule = session.aftercareSchedule || [];
  const sentDays = schedule.map(s => ({ day: s.day, sentAt: s.sentAt }));
  const sentDayNumbers = new Set(sentDays.map(s => s.day));
  const pendingDays = [1, 3, 7, 30].filter(d => !sentDayNumbers.has(d));
  return { pendingDays, sentDays, allSent: pendingDays.length === 0, hasSchedule: true };
}

// ── Trigger on session completion (initializes schedule state) ──

export async function triggerAftercare(sessionId: string): Promise<void> {
  const session = await db.sessions.get(sessionId);
  if (!session) return;

  if (!session.aftercareSchedule) {
    await db.sessions.update(sessionId, {
      aftercareSchedule: [],
      healingStatus: 'healing',
    });
  }

  await logCommunication(session.artistId, 'app_note', 'auto', {
    clientId: session.clientId,
    projectId: session.projectId,
    message: 'Aftercare schedule initialized (D1, D3, D7, D30)',
    templateType: 'aftercare_schedule_init',
  });
}

// ── Check if session has pending aftercare (for workspace deduplication) ──

export async function hasPendingAftercare(sessionId: string): Promise<boolean> {
  const session = await db.sessions.get(sessionId);
  if (!session || session.status !== 'completed') return false;
  const sentDays = new Set((session.aftercareSchedule || []).map(e => e.day));
  return !sentDays.has(1) || !sentDays.has(3) || !sentDays.has(7) || !sentDays.has(30);
}
