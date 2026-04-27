import { SocialDraft, SocialDraftStatus } from '../types';

interface SocialDraftsResponse {
  drafts: SocialDraft[];
}

export async function fetchSocialDrafts(): Promise<SocialDraft[]> {
  const response = await fetch('/api/social-drafts');
  if (!response.ok) {
    throw new Error('Failed to load social drafts.');
  }

  const data = (await response.json()) as SocialDraftsResponse;
  return data.drafts;
}

export async function createSocialDraft(draft: SocialDraft): Promise<SocialDraft[]> {
  const response = await fetch('/api/social-drafts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(draft),
  });

  if (!response.ok) {
    throw new Error('Failed to create social draft.');
  }

  const data = (await response.json()) as SocialDraftsResponse;
  return data.drafts;
}

export async function updateSocialDraftStatus(draftId: string, status: SocialDraftStatus): Promise<SocialDraft[]> {
  const response = await fetch(`/api/social-drafts/${draftId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error('Failed to update social draft.');
  }

  const data = (await response.json()) as SocialDraftsResponse;
  return data.drafts;
}
