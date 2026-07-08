import { db } from "../db";
import { buildConsentContent } from "./consentTemplates";
import { getAftercareMessage } from "./aftercareLogic";

const HEALTH_DECLARATION = `
HEALTH DECLARATION

I confirm that the following health questions have been answered truthfully and that all information is complete and accurate to the best of my knowledge.
`.trim();

export async function generateWaiverContent(
  appointmentType: string,
  clientName: string,
  artistName: string,
  shopName?: string,
  country?: string,
): Promise<string> {
  const effectiveShopName = shopName || artistName + "'s Studio";

  const aftercareText = getAftercareMessage(appointmentType);

  const consentBody = buildConsentContent(clientName, artistName, effectiveShopName, country, aftercareText);

  const type = appointmentType.toLowerCase();
  if (type.includes('cover') || type.includes('removal')) {
    return consentBody + '\n\n---\n\n' + HEALTH_DECLARATION;
  }
  return consentBody;
}

export function getWaiverType(appointmentType: string): string {
  const type = appointmentType.toLowerCase();
  if (type.includes('cover')) return 'consent_health';
  if (type.includes('touch')) return 'consent_aftercare';
  return 'consent';
}

export async function getArtistShopInfo(): Promise<{ shopName: string; artistName: string }> {
  try {
    const userId = localStorage.getItem('inkflow_current_user');
    if (!userId) return { shopName: 'the Studio', artistName: 'the Artist' };

    const user = await db.users.get(userId);
    const artistName = user?.name || 'the Artist';

    const customShopName = user?.studioName;
    const licenseShopName = user?.verified ? (user?.licenseShopName || customShopName || artistName + "'s Studio") : undefined;
    const shopName = customShopName || licenseShopName || artistName + "'s Studio";

    return { shopName, artistName };
  } catch {
    return { shopName: 'the Studio', artistName: 'the Artist' };
  }
}
