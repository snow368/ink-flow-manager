import { db, type AppointmentRecord, type UserRecord } from '../db';
import { t, type AppLanguage } from './i18n';
import { getClientTierWithAppointments, shouldFollowUp, canSendFollowUp, TIER_CONFIGS, type ClientTier } from './reviewTier';

export interface ReviewMessage {
  subject: string;
  body: string;
  channel: 'sms' | 'email' | 'any';
}

export interface EnhancedAppointment extends AppointmentRecord {
  clientName?: string;
  clientTier?: ClientTier;
  remainingFollowUps?: number;
}

function getInviteTemplates(lang: AppLanguage, artistName: string, reviewLinks: UserRecord['reviewLinks']): { initial: ReviewMessage; followUp: ReviewMessage } {
  const googleLink = reviewLinks?.google || '';
  const p2 = reviewLinks?.platform2Name && reviewLinks?.platform2Url ? `${reviewLinks.platform2Name}: ${reviewLinks.platform2Url}` : '';
  const p3 = reviewLinks?.platform3Name && reviewLinks?.platform3Url ? `${reviewLinks.platform3Name}: ${reviewLinks.platform3Url}` : '';
  const links = [googleLink && `Google: ${googleLink}`, p2, p3].filter(Boolean).join('\n');

  const templates: Record<string, { initial: ReviewMessage; followUp: ReviewMessage }> = {
    en: {
      initial: {
        subject: `How was your tattoo session with ${artistName}?`,
        body: `Hey! Just checking in — how's the new tattoo healing up? If you're happy with how it turned out, it would mean the world if you could leave a quick review:\n\n${links}\n\nIt only takes a minute and really helps the studio. Thank you! 🙏`,
        channel: 'any',
      },
      followUp: {
        subject: `Quick follow-up — review link`,
        body: `Hi again! Just wanted to make sure the review link worked for you — sometimes Google links can be finicky on certain phones. If not, let me know and I can send a different one. No pressure at all, just wanted to check! 🙂`,
        channel: 'any',
      },
    },
    es: {
      initial: {
        subject: `¿Qué tal tu sesión de tatuaje con ${artistName}?`,
        body: `¡Hola! Solo quería saber — ¿cómo está sanando tu nuevo tatuaje? Si estás contento/a con el resultado, nos ayudaría muchísimo si pudieras dejar una reseña rápida:\n\n${links}\n\nToma solo un minuto y realmente ayuda al estudio. ¡Gracias! 🙏`,
        channel: 'any',
      },
      followUp: {
        subject: `Seguimiento rápido — enlace de reseña`,
        body: `¡Hola de nuevo! Solo quería asegurarme de que el enlace de la reseña funcionó — a veces los enlaces de Google fallan en algunos teléfonos. Si no funcionó, avísame y te envío otro. ¡Sin presión, solo quería comprobarlo! 🙂`,
        channel: 'any',
      },
    },
    pt: {
      initial: {
        subject: `Como foi sua sessão de tatuagem com ${artistName}?`,
        body: `Olá! Como está cicatrizando sua nova tatuagem? Se você ficou satisfeito com o resultado, significaria muito se pudesse deixar uma avaliação rápida:\n\n${links}\n\nLeva apenas um minuto e realmente ajuda o estúdio. Obrigado! 🙏`,
        channel: 'any',
      },
      followUp: {
        subject: `Acompanhamento rápido — link de avaliação`,
        body: `Olá novamente! Só queria verificar se o link da avaliação funcionou — às vezes os links do Google falham em certos telefones. Se não funcionou, me avise que envio outro. Sem pressão, só queria checar! 🙂`,
        channel: 'any',
      },
    },
    fr: {
      initial: {
        subject: `Comment s'est passée votre séance avec ${artistName} ?`,
        body: `Bonjour ! Comment cicatrise votre nouveau tatouage ? Si vous êtes satisfait(e) du résultat, cela nous aiderait énormément si vous pouviez laisser un petit avis :\n\n${links}\n\nCela prend une minute et aide vraiment le studio. Merci ! 🙏`,
        channel: 'any',
      },
      followUp: {
        subject: `Petit suivi — lien d'avis`,
        body: `Re-bonjour ! Je voulais juste vérifier que le lien d'avis a bien fonctionné — parfois les liens Google sont capricieux sur certains téléphones. Si ce n'est pas le cas, dites-le moi et je vous en envoie un autre. Aucune pression, je voulais juste vérifier ! 🙂`,
        channel: 'any',
      },
    },
    de: {
      initial: {
        subject: `Wie war deine Tattoo-Session bei ${artistName}?`,
        body: `Hey! Wie heilt dein neues Tattoo? Wenn du zufrieden mit dem Ergebnis bist, würde es uns riesig helfen, wenn du eine kurze Bewertung hinterlassen könntest:\n\n${links}\n\nDauert nur eine Minute und hilft dem Studio wirklich. Danke! 🙏`,
        channel: 'any',
      },
      followUp: {
        subject: `Kurze Nachfrage — Bewertungslink`,
        body: `Nochmal hallo! Wollte nur sichergehen, dass der Bewertungslink funktioniert hat — manchmal sind Google-Links auf bestimmten Handys etwas hakelig. Wenn nicht, sag Bescheid, dann schicke ich einen anderen. Kein Druck, wollte nur nachfragen! 🙂`,
        channel: 'any',
      },
    },
    th: {
      initial: {
        subject: `รอยสักใหม่เป็นยังไงบ้าง? จาก ${artistName}`,
        body: `สวัสดี! รอยสักใหม่สมานเป็นยังไงบ้าง? ถ้าคุณพอใจกับผลงาน รบกวนช่วยรีวิวสั้นๆ ให้หน่อยนะครับ/คะ:\n\n${links}\n\nใช้เวลาแค่นาทีเดียว และช่วยสตูดิโอได้มาก ขอบคุณมาก! 🙏`,
        channel: 'any',
      },
      followUp: {
        subject: `ติดตามผล — ลิงก์รีวิว`,
        body: `สวัสดีอีกครั้ง! แค่อยากเช็คว่าลิงก์รีวิวใช้ได้ไหม — บางครั้งลิงก์ Google อาจมีปัญหาในบางมือถือ ถ้าไม่ได้บอกได้นะ จะส่งให้ใหม่ ไม่ต้องกดดัน แค่อยากเช็ค! 🙂`,
        channel: 'any',
      },
    },
    jp: {
      initial: {
        subject: `${artistName}のタトゥーはいかがでしたか？`,
        body: `こんにちは！新しいタトゥーの治りはいかがですか？仕上がりに満足していただけたら、短いレビューを残していただけると本当に嬉しいです：\n\n${links}\n\n1分もかかりません。スタジオの大きな励みになります。ありがとうございます！🙏`,
        channel: 'any',
      },
      followUp: {
        subject: `フォローアップ — レビューリンク`,
        body: `こんにちは！レビューリンクが正常に動作したか確認したかっただけです。特定のスマホではGoogleリンクがうまく動かないことがあります。もしダメだったらお知らせください。別のリンクをお送りします。プレッシャーではありません、念のためです！🙂`,
        channel: 'any',
      },
    },
  };

  return templates[lang] || templates.en;
}

export function getReviewInviteMessage(lang: AppLanguage, artistName: string, reviewLinks?: UserRecord['reviewLinks']): ReviewMessage {
  return getInviteTemplates(lang, artistName, reviewLinks).initial;
}

export function getReviewFollowUpMessage(lang: AppLanguage, artistName: string, reviewLinks?: UserRecord['reviewLinks']): ReviewMessage {
  return getInviteTemplates(lang, artistName, reviewLinks).followUp;
}

export async function getAppointmentsNeedingReviewInvite(artistId: string): Promise<EnhancedAppointment[]> {
  const apps = await db.appointments
    .where('artistId').equals(artistId)
    .filter(a => a.status === 'done' && !a.reviewInvitedAt)
    .toArray();
  return enrichAppointments(apps.sort((a, b) => b.createdAt - a.createdAt));
}

export async function getAppointmentsNeedingFollowUp(artistId: string): Promise<EnhancedAppointment[]> {
  const apps = await db.appointments
    .where('artistId').equals(artistId)
    .filter(a => a.status === 'done' && !!a.reviewInvitedAt && !a.reviewFollowedUpAt)
    .toArray();

  // Tier-aware filtering: each appointment's follow-up window depends on client tier
  const eligible: EnhancedAppointment[] = [];
  for (const a of apps) {
    const tier = a.clientId ? await getClientTierWithAppointments(a.clientId) : 'new';
    const followUpCount = a.reviewFollowUpCount || 0;
    if (shouldFollowUp(tier, a.reviewInvitedAt!, followUpCount)) {
      const enhanced = await enrichAppointment(a);
      enhanced.clientTier = tier;
      enhanced.remainingFollowUps = TIER_CONFIGS[tier].maxFollowUps - followUpCount;
      eligible.push(enhanced);
    }
  }
  return eligible.sort((a, b) => (b.reviewInvitedAt || 0) - (a.reviewInvitedAt || 0));
}

export async function getInviteHistory(artistId: string): Promise<EnhancedAppointment[]> {
  const apps = await db.appointments
    .where('artistId').equals(artistId)
    .filter(a => a.status === 'done' && !!a.reviewInvitedAt)
    .toArray();
  return enrichAppointments(apps.sort((a, b) => (b.reviewInvitedAt || 0) - (a.reviewInvitedAt || 0)));
}

async function enrichAppointment(a: AppointmentRecord): Promise<EnhancedAppointment> {
  const result: EnhancedAppointment = { ...a };
  if (a.clientId) {
    const c = await db.clients.get(a.clientId);
    result.clientName = c?.name;
    result.clientTier = c ? await getClientTierWithAppointments(a.clientId) : 'new';
    if (a.reviewInvitedAt) {
      const followUpCount = a.reviewFollowUpCount || 0;
      result.remainingFollowUps = TIER_CONFIGS[result.clientTier].maxFollowUps - followUpCount;
    }
  }
  return result;
}

async function enrichAppointments(apps: AppointmentRecord[]): Promise<EnhancedAppointment[]> {
  const results: EnhancedAppointment[] = [];
  for (const a of apps.slice(0, 20)) {
    results.push(await enrichAppointment(a));
  }
  return results;
}

export async function markReviewInvited(appointmentId: string): Promise<void> {
  await db.appointments.update(appointmentId, { reviewInvitedAt: Date.now() });
}

export async function markReviewFollowedUp(appointmentId: string): Promise<void> {
  const appt = await db.appointments.get(appointmentId);
  const currentCount = appt?.reviewFollowUpCount || 0;
  await db.appointments.update(appointmentId, {
    reviewFollowedUpAt: Date.now(),
    reviewFollowUpCount: currentCount + 1,
  });
}
