import { db } from "../db";

const WAIVER_TEMPLATES: Record<string, (clientName: string, shopName: string, artistName: string) => string> = {
  consent: (clientName, shopName, artistName) => `
CONSENT FOR TATTOO PROCEDURE

I, ${clientName}, hereby consent to the application of a tattoo by ${artistName} at ${shopName}.

I understand that:
- Tattooing involves the insertion of pigment into the skin and is a permanent body modification.
- There are risks including infection, allergic reaction, scarring, and dissatisfaction with the result.
- I have been given the opportunity to ask questions and all my questions have been answered to my satisfaction.
- I have disclosed all known allergies, medical conditions, and medications to the artist.

I release ${artistName} and ${shopName} from all liability arising from the procedure.

Client Signature: _______________
Date: _______________

Artist: ${artistName}
`.trim(),

  health: (clientName, shopName, artistName) => `
HEALTH DECLARATION

I confirm that the following health questions have been answered truthfully and that all information is complete and accurate to the best of my knowledge.
`.trim(),

  aftercare: (clientName, shopName, artistName) => `
AFTERCARE ACKNOWLEDGEMENT

I, ${clientName}, acknowledge that I have received and understood the following aftercare instructions from ${artistName} at ${shopName}:

1. Keep the bandage on for 2-4 hours.
2. Wash gently with antibacterial soap and lukewarm water.
3. Pat dry with a clean paper towel — do not rub.
4. Apply a thin layer of recommended ointment.
5. Avoid swimming, sun exposure, and tight clothing for 2 weeks.
6. Do not pick or scratch the tattoo.
7. Contact the artist if any signs of infection appear.

I understand that failure to follow aftercare instructions may affect the final appearance of my tattoo.

Signature: _______________
Date: _______________
`.trim(),
};

export async function generateWaiverContent(
  appointmentType: string,
  clientName: string,
  artistName: string,
  shopName?: string
): Promise<string> {
  const effectiveShopName = shopName || artistName + "'s Studio";

  const type = appointmentType.toLowerCase();
  if (type.includes('cover') || type.includes('removal')) {
    return WAIVER_TEMPLATES.consent(clientName, effectiveShopName, artistName) + '\n\n---\n\n' + WAIVER_TEMPLATES.health(clientName, effectiveShopName, artistName);
  }
  if (type.includes('touch')) {
    return WAIVER_TEMPLATES.consent(clientName, effectiveShopName, artistName) + '\n\n---\n\n' + WAIVER_TEMPLATES.aftercare(clientName, effectiveShopName, artistName);
  }
  return WAIVER_TEMPLATES.consent(clientName, effectiveShopName, artistName);
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
