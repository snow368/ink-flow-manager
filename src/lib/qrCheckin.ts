import type { AppointmentRecord } from '../db';

let qrLibLoaded = false;

async function ensureQRLib(): Promise<void> {
  if (qrLibLoaded) return;
  // Dynamic import of qrcode — lightweight, no dependency needed, we use canvas
  qrLibLoaded = true;
}

export async function generateQRDataUrl(appointmentId: string): Promise<string> {
  await ensureQRLib();
  const checkinUrl = `${window.location.origin}/checkin/${appointmentId}`;
  return generateQRFromText(checkinUrl);
}

async function generateQRFromText(text: string): Promise<string> {
  // Simple QR generation using Google Charts API (no extra dependency)
  const encoded = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}&bgcolor=0f172a&color=ffffff`;
}

export function getWalkinUrl(artistId: string): string {
  return `${window.location.origin}/walkin/${artistId}`;
}

export async function generateWalkinQR(artistId: string): Promise<string> {
  return generateQRFromText(getWalkinUrl(artistId));
}

export function getCheckinUrl(appointmentId: string): string {
  return `${window.location.origin}/checkin/${appointmentId}`;
}

export async function generateAppointmentQR(appointment: AppointmentRecord): Promise<string> {
  const data = JSON.stringify({
    id: appointment.id,
    clientId: appointment.clientId,
    date: appointment.date,
    time: appointment.time,
    type: appointment.type,
  });
  return generateQRFromText(data);
}

export function canCheckIn(appointment: AppointmentRecord): boolean {
  if (appointment.status === 'cancelled' || appointment.status === 'done') return false;
  const apptTime = new Date(appointment.date + 'T' + appointment.time + ':00').getTime();
  const now = Date.now();
  const diffMs = Math.abs(now - apptTime);
  return diffMs < 2 * 60 * 60 * 1000; // within 2 hours of appointment time
}
