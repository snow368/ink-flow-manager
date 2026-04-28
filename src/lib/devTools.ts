import { db } from '../db';

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
  const clientIds: string[] = [];

  // 创建示例客户
  for (const c of DEMO_CLIENTS) {
    const id = 'client_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    await db.clients.add({
      id, name: c.name, phone: c.phone, email: c.email,
      allergies: c.allergies.length > 0 ? c.allergies : undefined,
      createdAt: Date.now(),
    });
    clientIds.push(id);
  }

  // 创建示例预约（分布在未来 30 天）
  for (let i = 0; i < 15; i++) {
    const clientId = clientIds[Math.floor(Math.random() * clientIds.length)];
    const type = APPOINTMENT_TYPES[Math.floor(Math.random() * APPOINTMENT_TYPES.length)];
    const id = 'appt_' + Date.now() + '_' + i;
    const date = randomDate(30);
    const status = Math.random() > 0.3 ? (Math.random() > 0.5 ? 'ready' : 'unconfirmed') : 'done';
    await db.appointments.add({
      id, clientId, artistId: 'demo_artist', date, time: randomTime(),
      duration: [30, 60, 90, 120, 180][Math.floor(Math.random() * 5)],
      type, status, waiverCompleted: status === 'ready' || status === 'done',
      createdAt: Date.now(),
    });
  }

  return `Created ${DEMO_CLIENTS.length} clients and 15 appointments`;
}

export async function resetDatabase(): Promise<string> {
  await db.clients.clear();
  await db.appointments.clear();
  await db.waivers.clear();
  await db.sessions.clear();
  await db.inventory.clear();
  localStorage.removeItem('inkflow_ip_reg_count');
  return 'Database cleared';
}

export function getDemoUserIds(): string[] {
  return ['demo_artist', 'demo_owner', 'demo_staff'];
}
