import type { AppointmentRecord } from '../db';

export function getGoogleCalendarUrl(appointment: AppointmentRecord & { clientName?: string }): string {
  const startDate = new Date(appointment.date + 'T' + appointment.time + ':00');
  const endDate = new Date(startDate.getTime() + (appointment.duration || 60) * 60 * 1000);

  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const title = encodeURIComponent(`Tattoo Appointment${appointment.clientName ? ' - ' + appointment.clientName : ''}`);
  const details = encodeURIComponent(
    `Client: ${appointment.clientName || 'N/A'}\n` +
    `Body Part: ${appointment.bodyPart || 'N/A'}\n` +
    `Design: ${appointment.designNotes || 'N/A'}\n` +
    `Deposit: ${appointment.depositAmount ? '$' + appointment.depositAmount : 'N/A'}`
  );
  const location = encodeURIComponent('Tattoo Studio');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(startDate)}/${fmt(endDate)}&details=${details}&location=${location}`;
}

export function generateIcsFile(appointment: AppointmentRecord & { clientName?: string }): string {
  const startDate = new Date(appointment.date + 'T' + appointment.time + ':00');
  const endDate = new Date(startDate.getTime() + (appointment.duration || 60) * 60 * 1000);

  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const uid = `inkflow-${appointment.id}@inkflow.app`;
  const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//InkFlow//Tattoo Studio Management//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${fmt(startDate)}`,
    `DTEND:${fmt(endDate)}`,
    `SUMMARY:Tattoo Appointment - ${appointment.clientName || 'Client'}`,
    `DESCRIPTION:Client: ${appointment.clientName || 'N/A'}\\nBody Part: ${appointment.bodyPart || 'N/A'}\\nDesign: ${appointment.designNotes || 'N/A'}`,
    `LOCATION:Tattoo Studio`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadIcsFile(appointment: AppointmentRecord & { clientName?: string }): void {
  const ics = generateIcsFile(appointment);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `inkflow-appointment-${appointment.id.slice(-6)}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function getAppleCalendarUrl(appointment: AppointmentRecord & { clientName?: string }): string {
  const ics = generateIcsFile(appointment);
  return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
}
