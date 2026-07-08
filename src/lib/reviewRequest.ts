import { logCommunication } from './aftercareLogic';

export function getGoogleReviewUrl(placeId?: string): string {
  if (placeId) return `https://search.google.com/local/writereview?placeid=${placeId}`;
  return 'https://www.google.com/search?q=leave+a+review';
}

export function getFacebookReviewUrl(pageUsername?: string): string {
  if (pageUsername) return `https://facebook.com/${pageUsername}/reviews`;
  return 'https://www.facebook.com/review/';
}

export function getReviewRequestMessage(clientName: string, platform: 'google' | 'facebook', placeIdOrUsername?: string): string {
  const url = platform === 'google' ? getGoogleReviewUrl(placeIdOrUsername) : getFacebookReviewUrl(placeIdOrUsername);
  return `Hi ${clientName}! Thanks for trusting me with your tattoo. If you loved the experience, would you mind leaving a review on ${platform === 'google' ? 'Google' : 'Facebook'}? It helps a lot! ${url}`;
}

export function getReviewRequestWhatsAppUrl(
  clientName: string,
  artistWhatsappPhone?: string,
  platform: 'google' | 'facebook' = 'google',
  placeIdOrUsername?: string,
): string | null {
  const phone = artistWhatsappPhone?.replace(/[^\d+]/g, '') || '';
  if (!phone) return null;
  const msg = encodeURIComponent(getReviewRequestMessage(clientName, platform, placeIdOrUsername));
  return `https://wa.me/${phone.replace(/^\+/, '')}?text=${msg}`;
}

export function getReviewRequestCopyText(clientName: string, platform: 'google' | 'facebook' = 'google', placeIdOrUsername?: string): string {
  return getReviewRequestMessage(clientName, platform, placeIdOrUsername);
}

export async function logReviewRequest(
  artistId: string,
  clientId: string,
  appointmentId?: string,
  platform: 'google' | 'facebook' = 'google',
): Promise<void> {
  await logCommunication(artistId, 'whatsapp', 'outbound', {
    clientId,
    appointmentId,
    message: `Review request sent via ${platform}`,
    templateType: 'review_request',
  });
}
