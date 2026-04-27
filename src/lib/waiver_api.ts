import { SignedWaiverRecord } from '../types';

export interface SignWaiverPayload {
  appointmentId: string;
  clientId: string;
  templateIds: string[];
  signerName: string;
  signature: string;
  signedText: string;
}

export interface WaiverApiResponse {
  records: SignedWaiverRecord[];
}

export async function fetchWaiverRecords(): Promise<SignedWaiverRecord[]> {
  const response = await fetch('/api/waivers');
  if (!response.ok) {
    throw new Error('Failed to load waiver records.');
  }

  const data = (await response.json()) as WaiverApiResponse;
  return data.records;
}

export async function signWaiverDocuments(payload: SignWaiverPayload): Promise<SignedWaiverRecord[]> {
  const response = await fetch('/api/waivers/sign', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to save signed waiver.');
  }

  const data = (await response.json()) as WaiverApiResponse;
  return data.records;
}
