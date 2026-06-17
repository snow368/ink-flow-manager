// Dev Tools — now backed by D1 API instead of IndexedDB
import { api } from './appApi';
import { getBackendUrl } from './backendApi';

const DEMO_CLIENTS = [
  { name: 'Alice Johnson', phone: '555-0101', email: 'alice@example.com', allergies: ['Latex gloves'] },
  { name: 'Bob Martinez', phone: '555-0102', email: 'bob@example.com', allergies: [] },
  { name: 'Carla Chen', phone: '555-0103', email: 'carla@example.com', allergies: ['Red ink'] },
  { name: 'David Kim', phone: '555-0104', email: 'david@example.com', allergies: ['Anesthetic'] },
  { name: 'Elena Rossi', phone: '555-0105', email: 'elena@example.com', allergies: [] },
];

const APPOINTMENT_TYPES = ['new_tattoo', 'touch_up', 'consultation', 'cover_up', 'continuation'];

function randomDate(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + Math.floor(Math.random() * daysAhead));
  return d.toISOString().slice(0, 10);
}

function randomTime(): string {
  const h = 9 + Math.floor(Math.random() * 9);
  const m = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export async function seedDemoData(): Promise<string> {
  const results: string[] = [];

  for (const c of DEMO_CLIENTS) {
    const { ok, id } = await api.clients.create({
      name: c.name, phone: c.phone, email: c.email,
      allergies: c.allergies.length > 0 ? c.allergies : undefined,
    });
    if (ok) results.push(`client:${id}`);
  }

  for (let i = 0; i < 15; i++) {
    const clientId = results[i % results.length].split(':')[1];
    const type = APPOINTMENT_TYPES[Math.floor(Math.random() * APPOINTMENT_TYPES.length)];
    const date = randomDate(30);
    const status = Math.random() > 0.3 ? (Math.random() > 0.5 ? 'ready' : 'unconfirmed') : 'done';

    await api.appointments.create({
      clientId,
      title: `${type.replace(/_/g, ' ')} project`,
      date,
      time: randomTime(),
      duration: [30, 60, 90, 120, 180][Math.floor(Math.random() * 5)],
      appointmentType: type,
      status: status === 'done' ? 'done' : status,
      projectStatus: status === 'done' ? 'completed' : 'scheduled',
    });
  }

  return `Created ${DEMO_CLIENTS.length} clients and 15 appointments via D1`;
}

export async function resetDatabase(): Promise<string> {
  const backendUrl = getBackendUrl();
  const apiSecret = localStorage.getItem('inkflow_api_secret') || '';
  if (!backendUrl || !apiSecret) return 'API not configured';

  const types = ['client', 'appointment', 'project', 'waiver', 'session', 'inventory',
    'lead', 'portfolio', 'socialDraft', 'posTransaction', 'invoice', 'competitor', 'task'];

  let cleared = 0;
  for (const type of types) {
    try {
      const res = await fetch(`${backendUrl}/api/data/${type}?limit=500`, {
        headers: { 'x-api-secret': apiSecret },
      });
      const { items } = await res.json();
      for (const item of items || []) {
        await fetch(`${backendUrl}/api/data/${type}/${item.id}`, {
          method: 'DELETE',
          headers: { 'x-api-secret': apiSecret },
        });
        cleared++;
      }
    } catch { /* skip tables with no data */ }
  }

  localStorage.removeItem('inkflow_ip_reg_count');
  return `Database cleared: ${cleared} records removed from D1`;
}

export function getDemoUserIds(): string[] {
  return [localStorage.getItem('inkflow_current_user') || ''].filter(Boolean);
}
