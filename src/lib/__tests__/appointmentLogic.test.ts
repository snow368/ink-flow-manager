import { describe, it, expect } from 'vitest';
import { getNextStatus, APPOINTMENT_STATUS, STATUS_COLORS, type AppointmentStatus } from '../appointmentLogic';

describe('appointmentLogic', () => {
  describe('getNextStatus', () => {
    it('advances unconfirmed → deposit_paid', () => {
      expect(getNextStatus('unconfirmed')).toBe('deposit_paid');
    });

    it('advances deposit_paid → ready', () => {
      expect(getNextStatus('deposit_paid')).toBe('ready');
    });

    it('advances ready → done', () => {
      expect(getNextStatus('ready')).toBe('done');
    });

    it('advances attention → ready', () => {
      expect(getNextStatus('attention')).toBe('ready');
    });

    it('advances blocked → ready', () => {
      expect(getNextStatus('blocked')).toBe('ready');
    });

    it('returns null for done and cancelled (terminal states)', () => {
      expect(getNextStatus('done')).toBeNull();
      expect(getNextStatus('cancelled')).toBeNull();
    });
  });

  describe('APPOINTMENT_STATUS', () => {
    it('includes all 7 statuses', () => {
      expect(APPOINTMENT_STATUS).toHaveLength(7);
      expect(APPOINTMENT_STATUS).toContain('unconfirmed');
      expect(APPOINTMENT_STATUS).toContain('deposit_paid');
      expect(APPOINTMENT_STATUS).toContain('ready');
      expect(APPOINTMENT_STATUS).toContain('attention');
      expect(APPOINTMENT_STATUS).toContain('blocked');
      expect(APPOINTMENT_STATUS).toContain('done');
      expect(APPOINTMENT_STATUS).toContain('cancelled');
    });
  });

  describe('STATUS_COLORS', () => {
    it('provides a color for every status', () => {
      for (const status of APPOINTMENT_STATUS) {
        expect(STATUS_COLORS[status]).toBeDefined();
        expect(STATUS_COLORS[status]).toMatch(/^#[0-9a-f]{6}$/);
      }
    });
  });
});
