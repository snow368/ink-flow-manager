import { Appointment, Client, InventoryItem, SignedWaiverRecord, WaiverTemplate } from '../types';

export type ForecastRange = 'week' | 'halfMonth' | 'month';

export interface AppointmentFlow {
  readiness: 'blocked' | 'attention' | 'ready' | 'completed';
  blockers: string[];
  warnings: string[];
  recommendations: string[];
}

export interface DailyPulse {
  expectedRevenue: number;
  allergyCount: number;
  lowStockItems: InventoryItem[];
  readyAppointments: number;
}

export interface AppointmentWaiverSummary {
  requiredTemplates: WaiverTemplate[];
  signedTemplates: WaiverTemplate[];
  missingTemplates: WaiverTemplate[];
  isReady: boolean;
}

export interface InventoryDeduction {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface GeneratedWaiverDocument {
  title: string;
  body: string;
}

const RANGE_DAYS: Record<ForecastRange, number> = {
  week: 7,
  halfMonth: 15,
  month: 30,
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function parseISODate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function getAppointmentFlow(appointment: Appointment, client?: Client): AppointmentFlow {
  if (appointment.status === 'completed') {
    return {
      readiness: 'completed',
      blockers: [],
      warnings: [],
      recommendations: ['Review healed results and archive the session notes.'],
    };
  }

  const blockers: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  if (!appointment.depositPaid) {
    blockers.push('Deposit still unpaid');
    recommendations.push('Collect deposit before reserving artist time.');
  }

  if (!appointment.waiverSigned) {
    blockers.push('Waiver not signed');
    recommendations.push('Send or re-open the waiver before starting the session.');
  }

  if (appointment.status === 'unconfirmed') {
    blockers.push('Appointment still unconfirmed');
    recommendations.push('Confirm the slot with the client before prep starts.');
  }

  if (appointment.hasAllergies || (client?.skinProfile?.allergies.length ?? 0) > 0) {
    warnings.push('Allergy precautions required');
    recommendations.push('Use allergy-safe consumables and highlight the medical note for staff.');
  }

  if (appointment.painLevel >= 7) {
    warnings.push('High pain sensitivity');
    recommendations.push('Plan extra check-ins and allow more setup and recovery time.');
  }

  if (blockers.length > 0) {
    return { readiness: 'blocked', blockers, warnings, recommendations };
  }

  if (warnings.length > 0 || appointment.status === 'deposit_paid') {
    return { readiness: 'attention', blockers, warnings, recommendations };
  }

  return {
    readiness: 'ready',
    blockers,
    warnings,
    recommendations: recommendations.length > 0 ? recommendations : ['Session is clear to begin.'],
  };
}

export function getRequiredWaiverTemplates(appointment: Appointment, templates: WaiverTemplate[]): WaiverTemplate[] {
  return templates.filter((template) => template.appliesTo === 'all' || appointment.tattooStage === 'touch-up');
}

export function getAppointmentWaiverSummary(
  appointment: Appointment,
  templates: WaiverTemplate[],
  signedWaivers: SignedWaiverRecord[],
): AppointmentWaiverSummary {
  const requiredTemplates = getRequiredWaiverTemplates(appointment, templates);
  const signedTemplateIds = new Set(
    signedWaivers
      .filter((record) => record.appointmentId === appointment.id && record.status === 'signed')
      .map((record) => record.templateId),
  );

  const signedTemplates = requiredTemplates.filter((template) => signedTemplateIds.has(template.id));
  const missingTemplates = requiredTemplates.filter((template) => !signedTemplateIds.has(template.id));

  return {
    requiredTemplates,
    signedTemplates,
    missingTemplates,
    isReady: missingTemplates.length === 0,
  };
}

export function generateWaiverDocument(
  appointment: Appointment,
  client: Client,
  templates: WaiverTemplate[],
  artistName?: string,
): GeneratedWaiverDocument {
  const templateTitles = templates.map((template) => template.title).join(' + ');
  const healthLine = appointment.hasAllergies || (client.skinProfile?.allergies.length ?? 0) > 0
    ? `The client has disclosed the following allergy-related information: ${(client.skinProfile?.allergies ?? []).join(', ') || 'see intake notes'}.`
    : 'The client confirms no known allergy disclosures beyond the intake form.';

  return {
    title: `${client.name} Waiver Packet`,
    body: [
      `Waiver packet: ${templateTitles}`,
      ``,
      `Client: ${client.name}`,
      `Appointment date: ${appointment.date} ${appointment.startTime}-${appointment.endTime}`,
      `Service: ${appointment.service}`,
      `Body part: ${appointment.bodyPart}`,
      `Style and stage: ${appointment.tattooStyle} / ${appointment.tattooStage}`,
      `Assigned artist: ${artistName ?? 'InkFlow Studio Team'}`,
      ``,
      `The client authorizes InkFlow to perform the scheduled tattoo service and confirms they have had the opportunity to ask questions about risks, healing expectations, pricing, and aftercare.`,
      healthLine,
      `The client agrees to follow aftercare instructions, disclose any medical changes before the session begins, and understands that deposits and rescheduling policies remain in force.`,
      `By signing below, the client acknowledges the appointment-specific consent and the studio health and safety protocol.`,
    ].join('\n'),
  };
}

export function withResolvedWaiverStatus(
  appointments: Appointment[],
  templates: WaiverTemplate[],
  signedWaivers: SignedWaiverRecord[],
): Appointment[] {
  return appointments.map((appointment) => ({
    ...appointment,
    waiverSigned: getAppointmentWaiverSummary(appointment, templates, signedWaivers).isReady,
  }));
}

export function getAppointmentsWithinRange(
  appointments: Appointment[],
  range: ForecastRange,
  referenceDate = new Date(),
): Appointment[] {
  const start = startOfDay(referenceDate);
  const end = new Date(start.getTime() + RANGE_DAYS[range] * DAY_IN_MS);

  return appointments.filter((appointment) => {
    const appointmentDate = parseISODate(appointment.date);
    return appointmentDate >= start && appointmentDate <= end;
  });
}

export function getInventoryForecast(
  item: InventoryItem,
  appointments: Appointment[],
  range: ForecastRange,
  referenceDate = new Date(),
): number {
  const futureAppointments = getAppointmentsWithinRange(appointments, range, referenceDate);

  const totalUsage = futureAppointments.reduce((total, appointment) => {
    const sizeMultiplier =
      appointment.tattooSize === 'extra-large'
        ? 4
        : appointment.tattooSize === 'large'
          ? 2.5
          : appointment.tattooSize === 'medium'
            ? 1.5
            : 0.8;
    const stageMultiplier =
      appointment.tattooStage === 'shading'
        ? 1.5
        : appointment.tattooStage === 'color'
          ? 2
          : appointment.tattooStage === 'touch-up'
            ? 0.6
            : appointment.tattooStage === 'healed_check'
              ? 0.2
              : 1;

    if (item.category === 'ink') {
      const lowerName = item.name.toLowerCase();
      const styleFactor =
        appointment.tattooStyle === 'realism'
          ? 1.8
          : appointment.tattooStyle === 'traditional' || appointment.tattooStyle === 'neo-traditional'
            ? 1.3
            : appointment.tattooStyle === 'japanese'
              ? 1.5
              : 1;
      const colorFactor =
        lowerName.includes('black') && appointment.tattooStyle === 'realism'
          ? 1.25
          : lowerName.includes('color') || lowerName.includes('blue') || lowerName.includes('pink') || lowerName.includes('red')
            ? appointment.tattooStage === 'color'
              ? 1.4
              : 0.55
            : 1;
      return total + 0.5 * sizeMultiplier * stageMultiplier * styleFactor * colorFactor;
    }

    if (item.category === 'needles') {
      const lowerName = item.name.toLowerCase();
      const complexityFactor =
        appointment.tattooStyle === 'realism' || appointment.tattooStyle === 'japanese' ? 2 : 1;
      const groupingFactor =
        lowerName.includes('rl') && appointment.tattooStage === 'outline'
          ? 1.2
          : lowerName.includes('rs') || lowerName.includes('mag')
            ? appointment.tattooStage === 'shading' || appointment.tattooStage === 'color'
              ? 1.25
              : 0.75
            : 1;
      return total + 2 * sizeMultiplier * complexityFactor * groupingFactor;
    }

    if (item.category === 'ppe') {
      return total + 3 * (appointment.tattooSize === 'extra-large' ? 2 : 1);
    }

    if (item.category === 'aftercare') {
      const sensitivityFactor = appointment.painLevel >= 7 ? 1.2 : 1;
      return total + sizeMultiplier * sensitivityFactor;
    }

    return total;
  }, 0);

  return Math.ceil(totalUsage);
}

export function calculateSessionSupplyUsage(
  appointment: Appointment,
  inventory: InventoryItem[],
): InventoryDeduction[] {
  const sizeMultiplier =
    appointment.tattooSize === 'extra-large'
      ? 2.2
      : appointment.tattooSize === 'large'
        ? 1.6
        : appointment.tattooSize === 'medium'
          ? 1.2
          : 1;

  const stageMultiplier =
    appointment.tattooStage === 'color'
      ? 1.3
      : appointment.tattooStage === 'shading'
        ? 1.15
        : appointment.tattooStage === 'touch-up'
          ? 0.7
          : 1;

  return inventory.flatMap((item) => {
    let quantity = 0;

    if (item.category === 'ink') {
      const lowerName = item.name.toLowerCase();
      const realismFactor = appointment.tattooStyle === 'realism' ? 1.2 : 1;
      const colorFactor = lowerName.includes('black') ? 1 : appointment.tattooStage === 'color' ? 1.15 : 0.5;
      quantity = Math.ceil(sizeMultiplier * stageMultiplier * realismFactor * colorFactor);
    } else if (item.category === 'needles') {
      const complexityFactor = appointment.tattooStyle === 'realism' || appointment.tattooStyle === 'japanese' ? 1.4 : 1;
      quantity = Math.ceil(2 * sizeMultiplier * complexityFactor);
    } else if (item.category === 'ppe') {
      quantity = appointment.tattooSize === 'extra-large' ? 2 : 1;
    } else if (item.category === 'aftercare') {
      quantity = appointment.tattooSize === 'extra-large' || appointment.tattooSize === 'large' ? 2 : 1;
    }

    return quantity > 0
      ? [{ id: item.id, name: item.name, quantity: Math.min(item.quantity, quantity), unit: item.unit }]
      : [];
  });
}

export function applyInventoryDeductions(
  inventory: InventoryItem[],
  deductions: InventoryDeduction[],
): InventoryItem[] {
  const deductionMap = new Map(deductions.map((item) => [item.id, item.quantity]));

  return inventory.map((item) => ({
    ...item,
    quantity: Math.max(0, item.quantity - (deductionMap.get(item.id) ?? 0)),
  }));
}

export function getDailyPulse(
  date: Date,
  appointments: Appointment[],
  inventory: InventoryItem[],
  clients: Client[],
): DailyPulse {
  const selectedDate = startOfDay(date).getTime();
  const dayAppointments = appointments.filter((appointment) => parseISODate(appointment.date).getTime() === selectedDate);

  const expectedRevenue = dayAppointments.reduce((total, appointment) => total + (appointment.price - appointment.deposit), 0);
  const allergyCount = dayAppointments.filter((appointment) => {
    const client = clients.find((item) => item.id === appointment.clientId);
    return appointment.hasAllergies || (client?.skinProfile?.allergies.length ?? 0) > 0;
  }).length;
  const readyAppointments = dayAppointments.filter((appointment) => getAppointmentFlow(appointment).readiness === 'ready').length;
  const lowStockItems = inventory.filter((item) => item.quantity <= item.minThreshold);

  return {
    expectedRevenue,
    allergyCount,
    lowStockItems,
    readyAppointments,
  };
}
