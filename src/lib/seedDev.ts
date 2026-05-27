import { db } from '../db';

export async function seedMultiLocationTest() {
  const now = Date.now();
  const ownerId = 'seed_owner_001';
  const loc1Id = 'seed_loc_001';
  const loc2Id = 'seed_loc_002';
  const artist1Id = 'seed_artist_001';
  const artist2Id = 'seed_artist_002';
  const artist3Id = 'seed_artist_003';

  await db.users.put({
    id: ownerId, email: 'owner@test.local', name: 'Studio Owner',
    roles: ['owner'], verified: true, createdAt: now,
  });

  await db.studioLocations.bulkPut([
    { id: loc1Id, ownerId, name: 'Downtown Tattoo', address: '123 Main St', phone: '+1-555-0101', createdAt: now },
    { id: loc2Id, ownerId, name: 'Eastside Ink', address: '456 Oak Ave', phone: '+1-555-0202', createdAt: now },
  ]);

  await db.users.bulkPut([
    { id: artist1Id, email: 'anna@test.local', name: 'Anna', roles: ['artist'], deviceId: 'dev-a1', assignedLocationIds: [loc1Id], verified: true, createdAt: now },
    { id: artist2Id, email: 'ben@test.local', name: 'Ben', roles: ['artist'], deviceId: 'dev-b1', assignedLocationIds: [loc1Id, loc2Id], verified: true, createdAt: now },
    { id: artist3Id, email: 'cara@test.local', name: 'Cara', roles: ['artist'], deviceId: 'dev-c1', assignedLocationIds: [loc2Id], verified: true, createdAt: now },
  ]);

  const clientIds = ['seed_client_001', 'seed_client_002', 'seed_client_003', 'seed_client_004', 'seed_client_005'];
  await db.clients.bulkPut([
    { id: clientIds[0], name: 'Alice Johnson', phone: '+1-555-1001', tags: ['vip'], totalSpend: 150000, lastVisitAt: now - 86400000 * 7, createdAt: now - 86400000 * 60 },
    { id: clientIds[1], name: 'Bob Smith', phone: '+1-555-1002', tags: ['new'], birthday: '1990-06-15', createdAt: now - 86400000 * 10 },
    { id: clientIds[2], name: 'Carol Davis', phone: '+1-555-1003', tags: ['at_risk'], lastVisitAt: now - 86400000 * 120, totalSpend: 35000, createdAt: now - 86400000 * 180 },
    { id: clientIds[3], name: 'Dan Brown', phone: '+1-555-1004', createdAt: now - 86400000 * 30 },
    { id: clientIds[4], name: 'Eve Wilson', birthday: new Date().toISOString().slice(5, 10) === `${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}` ? '1992-' + new Date().toISOString().slice(5, 10) : '1992-01-15', phone: '+1-555-1005', totalSpend: 220000, lastVisitAt: now - 86400000 * 3, createdAt: now - 86400000 * 90 },
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const seedRows = [
    { apptId: 'seed_appt_001', projectId: 'seed_proj_001', clientId: clientIds[0], artistId: artist1Id, date: today, time: '10:00', duration: 120, type: 'new_tattoo', status: 'ready' as const, deposit: 5000 },
    { apptId: 'seed_appt_002', projectId: 'seed_proj_002', clientId: clientIds[1], artistId: artist1Id, date: today, time: '13:00', duration: 60, type: 'consultation', status: 'ready' as const },
    { apptId: 'seed_appt_003', projectId: 'seed_proj_003', clientId: clientIds[2], artistId: artist2Id, date: today, time: '11:00', duration: 180, type: 'cover_up', status: 'deposit_paid' as const, deposit: 10000 },
    { apptId: 'seed_appt_004', projectId: 'seed_proj_004', clientId: clientIds[3], artistId: artist2Id, date: today, time: '16:00', duration: 60, type: 'touch_up', status: 'unconfirmed' as const },
    { apptId: 'seed_appt_005', projectId: 'seed_proj_005', clientId: clientIds[4], artistId: artist3Id, date: today, time: '09:00', duration: 240, type: 'new_tattoo', status: 'ready' as const, deposit: 15000 },
    { apptId: 'seed_appt_006', projectId: 'seed_proj_006', clientId: clientIds[4], artistId: artist3Id, date: yesterday, time: '14:00', duration: 120, type: 'continuation', status: 'done' as const },
  ];

  await db.projects.bulkPut(
    seedRows.map(row => ({
      id: row.projectId,
      artistId: row.artistId,
      clientId: row.clientId,
      title: `${row.type.replace(/_/g, ' ')} project`,
      status: row.status === 'done' ? 'completed' as const : 'scheduled' as const,
      completedSessions: row.status === 'done' ? 1 : 0,
      depositAmount: row.deposit,
      depositStatus: row.deposit ? 'paid' as const : 'none' as const,
      createdAt: now - 86400000 * 3,
      updatedAt: now,
    })),
  );

  await db.appointments.bulkPut(
    seedRows.map(row => ({
      id: row.apptId,
      projectId: row.projectId,
      clientId: row.clientId,
      artistId: row.artistId,
      date: row.date,
      time: row.time,
      duration: row.duration,
      type: row.type,
      status: row.status,
      waiverCompleted: row.status === 'ready' || row.status === 'done',
      createdAt: now - 86400000 * 3,
    })),
  );

  localStorage.setItem('inkflow_current_user', ownerId);
  localStorage.setItem('inkflow_current_location', 'all');

  console.log('✅ Seed data created!');
  console.log(`  Owner: ${ownerId} (now logged in)`);
  console.log(`  Locations: Downtown Tattoo (${loc1Id}), Eastside Ink (${loc2Id})`);
  console.log(`  Artists: Anna (loc1), Ben (loc1+loc2), Cara (loc2)`);
  console.log(`  ${5} clients, ${6} projects/appointments (5 today), ${8} inventory items`);
  console.log('');
  console.log(`  ℹ️ Set localStorage 'inkflow_current_user' to '${artist1Id}' to act as Anna`);

  return { ownerId, loc1Id, loc2Id, artist1Id, artist2Id, artist3Id };
}

export async function clearSeedData() {
  const seedPrefixes = ['seed_'];
  const tables = ['users', 'clients', 'projects', 'appointments', 'inventory', 'studioLocations', 'posTransactions'] as const;
  for (const table of tables) {
    const all = await (db as any)[table].toArray();
    for (const row of all) {
      if (seedPrefixes.some(p => row.id.startsWith(p))) {
        await (db as any)[table].delete(row.id);
      }
    }
  }
  console.log('✅ Seed data cleared');
}
