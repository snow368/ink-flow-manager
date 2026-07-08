import { db, type AppointmentRecord } from '../db';

export interface ArtistAvailability {
  start: string;   // "10:00"
  end: string;     // "22:00"
  daysOff: string[]; // ["Sunday"]
}

export async function getArtistAvailability(artistId: string): Promise<ArtistAvailability> {
  const u = await db.users.get(artistId);
  return {
    start: u?.workingHoursStart || '10:00',
    end: u?.workingHoursEnd || '22:00',
    daysOff: u?.daysOff || [],
  };
}

export function isDayOff(dateStr: string, daysOff: string[]): boolean {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const d = new Date(dateStr + 'T00:00:00');
  const dayName = dayNames[d.getDay()];
  return daysOff.includes(dayName);
}

export function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function toTimeString(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function hasOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

export function findMultipleAvailableTimes(
  existingAppointments: AppointmentRecord[],
  dayStart: number,
  dayEnd: number,
  duration: number,
  preferredStart: number,
  limit = 6,
): string[] {
  const out: string[] = [];
  let candidate = Math.max(preferredStart, dayStart);
  while (candidate + duration <= dayEnd && out.length < limit) {
    const blocked = existingAppointments.some(a => {
      if (a.status === 'cancelled') return false;
      const s = toMinutes(a.time);
      const e = s + a.duration;
      return hasOverlap(candidate, candidate + duration, s, e);
    });
    if (!blocked) out.push(toTimeString(candidate));
    candidate += 30;
  }
  return out;
}

export function findNextAvailableTime(
  existingAppointments: AppointmentRecord[],
  dayStart: number,
  dayEnd: number,
  duration: number,
  preferredStart: number,
): string {
  const slots = findMultipleAvailableTimes(existingAppointments, dayStart, dayEnd, duration, preferredStart, 1);
  return slots[0] || '';
}
