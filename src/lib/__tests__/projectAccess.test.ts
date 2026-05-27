import { describe, it, expect } from 'vitest';
import { buildSyntheticProjectView, mapLegacyAppointmentStatus } from '../projectAccess';
import type { StoredAppointmentRecord } from '../../db';

describe('projectAccess dual-read', () => {
  it('maps legacy deposit_locked_draft to draft status', () => {
    expect(mapLegacyAppointmentStatus('deposit_locked_draft')).toBe('draft');
  });

  it('builds synthetic project from legacy appointment fields', () => {
    const appt: StoredAppointmentRecord = {
      id: 'appt_3',
      clientId: 'client_1',
      artistId: 'artist_1',
      date: '2026-05-27',
      time: '12:00',
      duration: 120,
      status: 'unconfirmed',
      waiverCompleted: false,
      bodyPart: 'Forearm',
      designNotes: 'Dragon',
      depositAmount: 5000,
      createdAt: Date.now(),
    };
    const view = buildSyntheticProjectView(appt, 'proj_mig_appt_3');
    expect(view.bodyPart).toBe('Forearm');
    expect(view.designNotes).toBe('Dragon');
    expect(view.depositAmount).toBe(5000);
    expect(view.resolvedFrom).toBe('appointment_legacy');
  });
});
