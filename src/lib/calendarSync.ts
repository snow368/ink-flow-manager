import type { AppointmentRecord } from '../db';
import type { EnrichedAppointment } from './projectLogic';

export function getGoogleCalendarUrl(appointment: EnrichedAppointment): string {
  const startDate = new Date(appointment.date + 'T' + appointment.time + ':00');
  const endDate = new Date(startDate.getTime() + (appointment.duration || 60) * 60 * 1000);

  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const title = encodeURIComponent(`Tattoo Appointment${appointment.clientName ? ' - ' + appointment.clientName : ''}`);
  const details = encodeURIComponent(
    `Client: ${appointment.clientName || 'N/A'}\n` +
    `Project: ${appointment.projectTitle || 'N/A'}\n` +
    `Body Part: ${appointment.projectBodyPart || 'N/A'}\n` +
    `Design: ${appointment.projectDesignNotes || 'N/A'}\n` +
    `Deposit: ${appointment.projectDepositAmount ? '$' + (appointment.projectDepositAmount / 100).toFixed(2) : 'N/A'}`
  );
  const location = encodeURIComponent('Tattoo Studio');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(startDate)}/${fmt(endDate)}&details=${details}&location=${location}`;
}

export function generateIcsFile(appointment: EnrichedAppointment): string {
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
    `DESCRIPTION:Client: ${appointment.clientName || 'N/A'}\\nProject: ${appointment.projectTitle || 'N/A'}\\nBody Part: ${appointment.projectBodyPart || 'N/A'}\\nDesign: ${appointment.projectDesignNotes || 'N/A'}`,
    `LOCATION:Tattoo Studio`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function generateFullDayIcs(appointments: EnrichedAppointment[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//InkFlow//Tattoo Studio Management//EN',
    "X-WR-CALNAME:Ink Flow - Today's Appointments",
  ];
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  for (const appt of appointments) {
    const startDate = new Date(appt.date + 'T' + appt.time + ':00');
    const endDate = new Date(startDate.getTime() + (appt.duration || 60) * 60 * 1000);
    lines.push(
      'BEGIN:VEVENT',
      `UID:inkflow-${appt.id}@inkflow.app`,
      `DTSTAMP:${now}`,
      `DTSTART:${fmt(startDate)}`,
      `DTEND:${fmt(endDate)}`,
      `SUMMARY:Tattoo - ${appt.clientName || 'Client'}`,
      `DESCRIPTION:Client: ${appt.clientName || 'N/A'}\\nProject: ${appt.projectTitle || 'N/A'}\\nBody Part: ${appt.projectBodyPart || 'N/A'}\\nDesign: ${appt.projectDesignNotes || 'N/A'}`,
      `LOCATION:Tattoo Studio`,
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadTodayIcs(appointments: EnrichedAppointment[]): void {
  const ics = generateFullDayIcs(appointments);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `inkflow-today-${new Date().toISOString().slice(0, 10)}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadIcsFile(appointment: EnrichedAppointment): void {
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

export function getAppleCalendarUrl(appointment: EnrichedAppointment): string {
  const ics = generateIcsFile(appointment);
  return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
}
