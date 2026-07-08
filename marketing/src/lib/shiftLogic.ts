import { db } from '../db';
import type { ShiftRecord } from '../db';

export async function createShift(data: {
  artistId: string;
  staffId?: string;
  locationId?: string;
  date: string;
  startTime: string;
  endTime: string;
  note?: string;
}): Promise<{ ok: boolean; error?: string }> {
  // Check for overlapping shifts
  const existing = await db.shifts
    .where('date').equals(data.date)
    .and(s => s.staffId === data.staffId || (!s.staffId && !data.staffId))
    .toArray();

  const overlap = existing.some(s => {
    const sStart = s.startTime;
    const sEnd = s.endTime;
    const nStart = data.startTime;
    const nEnd = data.endTime;
    return nStart < sEnd && nEnd > sStart;
  });

  if (overlap) {
    return { ok: false, error: 'Shift overlaps with an existing shift' };
  }

  const id = 'shift_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  await db.shifts.add({
    id,
    artistId: data.artistId,
    staffId: data.staffId,
    locationId: data.locationId,
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
    note: data.note,
    createdAt: Date.now(),
  });
  return { ok: true };
}

export async function getShiftsForDateRange(artistIds: string[], startDate: string, endDate: string): Promise<ShiftRecord[]> {
  return db.shifts
    .where('artistId').anyOf(artistIds)
    .filter(s => s.date >= startDate && s.date <= endDate)
    .toArray();
}

export async function deleteShift(id: string) {
  await db.shifts.delete(id);
}
