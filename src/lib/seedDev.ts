import { db } from '../db';

export async function seedMultiLocationTest() {
  const now = Date.now();
  const ownerId = 'seed_owner_001';
  const loc1Id = 'seed_loc_001';
  const loc2Id = 'seed_loc_002';
  const artist1Id = 'seed_artist_001';
  const artist2Id = 'seed_artist_002';
  const artist3Id = 'seed_artist_003';

  // 1. Owner
  await db.users.put({
    id: ownerId, email: 'owner@test.local', name: 'Studio Owner',
    role: 'owner', verified: true, createdAt: now,
  });

  // 2. Two locations
  await db.studioLocations.bulkPut([
    { id: loc1Id, ownerId, name: 'Downtown Tattoo', address: '123 Main St', phone: '+1-555-0101', createdAt: now },
    { id: loc2Id, ownerId, name: 'Eastside Ink', address: '456 Oak Ave', phone: '+1-555-0202', createdAt: now },
  ]);

  // 3. Three artists
  await db.users.bulkPut([
    { id: artist1Id, email: 'anna@test.local', name: 'Anna', role: 'artist', deviceId: 'dev-a1', assignedLocationIds: [loc1Id], verified: true, createdAt: now },
    { id: artist2Id, email: 'ben@test.local', name: 'Ben', role: 'artist', deviceId: 'dev-b1', assignedLocationIds: [loc1Id, loc2Id], verified: true, createdAt: now },
    { id: artist3Id, email: 'cara@test.local', name: 'Cara', role: 'artist', deviceId: 'dev-c1', assignedLocationIds: [loc2Id], verified: true, createdAt: now },
  ]);

  // 4. Test clients
  const clientIds = ['seed_client_001', 'seed_client_002', 'seed_client_003', 'seed_client_004', 'seed_client_005'];
  await db.clients.bulkPut([
    { id: clientIds[0], name: 'Alice Johnson', phone: '+1-555-1001', tags: ['vip'], totalSpend: 150000, lastVisitAt: now - 86400000 * 7, createdAt: now - 86400000 * 60 },
    { id: clientIds[1], name: 'Bob Smith', phone: '+1-555-1002', tags: ['new'], birthday: '1990-06-15', createdAt: now - 86400000 * 10 },
    { id: clientIds[2], name: 'Carol Davis', phone: '+1-555-1003', tags: ['at_risk'], lastVisitAt: now - 86400000 * 120, totalSpend: 35000, createdAt: now - 86400000 * 180 },
    { id: clientIds[3], name: 'Dan Brown', phone: '+1-555-1004', createdAt: now - 86400000 * 30 },
    { id: clientIds[4], name: 'Eve Wilson', birthday: new Date().toISOString().slice(5, 10) === `${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}` ? '1992-' + new Date().toISOString().slice(5, 10) : '1992-01-15', phone: '+1-555-1005', totalSpend: 220000, lastVisitAt: now - 86400000 * 3, createdAt: now - 86400000 * 90 },
  ]);

  // 5. Appointments — today, across 3 artists
  const today = new Date().toISOString().slice(0, 10);
  await db.appointments.bulkPut([
    { id: 'seed_appt_001', clientId: clientIds[0], artistId: artist1Id, date: today, time: '10:00', duration: 120, type: 'new_tattoo', status: 'ready', waiverCompleted: true, depositAmount: 5000, createdAt: now - 86400000 * 3 },
    { id: 'seed_appt_002', clientId: clientIds[1], artistId: artist1Id, date: today, time: '13:00', duration: 60, type: 'consultation', status: 'ready', waiverCompleted: false, createdAt: now - 86400000 * 2 },
    { id: 'seed_appt_003', clientId: clientIds[2], artistId: artist2Id, date: today, time: '11:00', duration: 180, type: 'cover_up', status: 'deposit_paid', waiverCompleted: true, depositAmount: 10000, createdAt: now - 86400000 * 5 },
    { id: 'seed_appt_004', clientId: clientIds[3], artistId: artist2Id, date: today, time: '16:00', duration: 60, type: 'touch_up', status: 'unconfirmed', waiverCompleted: false, createdAt: now - 86400000 },
    { id: 'seed_appt_005', clientId: clientIds[4], artistId: artist3Id, date: today, time: '09:00', duration: 240, type: 'new_tattoo', status: 'ready', waiverCompleted: true, depositAmount: 15000, createdAt: now - 86400000 * 7 },
    // One completed appointment from yesterday
    { id: 'seed_appt_006', clientId: clientIds[4], artistId: artist3Id, date: new Date(Date.now() - 86400000).toISOString().slice(0, 10), time: '14:00', duration: 120, type: 'continuation', status: 'done', waiverCompleted: true, createdAt: now - 86400000 * 14 },
  ]);

  // 6. Sellable inventory
  await db.inventory.bulkPut([
    { id: 'seed_inv_001', name: 'Hustle Butter 5oz', category: 'aftercare', quantity: 12, reorderLevel: 3, unit: 'pcs', price: 2000, sellable: true, createdAt: now },
    { id: 'seed_inv_002', name: 'Saniderm Roll', category: 'aftercare', quantity: 5, reorderLevel: 2, unit: 'rolls', price: 3500, sellable: true, createdAt: now },
    { id: 'seed_inv_003', name: 'Tattoo Goo Kit', category: 'aftercare', quantity: 0, reorderLevel: 3, unit: 'pcs', price: 1500, sellable: true, createdAt: now },
    { id: 'seed_inv_004', name: 'Black Gloves L', category: 'disposables', quantity: 100, reorderLevel: 20, unit: 'pcs', price: 50, sellable: true, createdAt: now },
    { id: 'seed_inv_005', name: 'Nitrile Gloves M', category: 'disposables', quantity: 80, reorderLevel: 20, unit: 'pcs', price: 50, sellable: true, createdAt: now },
    { id: 'seed_inv_006', name: 'Dynamic Black 8oz', category: 'ink', quantity: 8, reorderLevel: 2, unit: 'bottles', price: 4200, sellable: true, createdAt: now },
    { id: 'seed_inv_007', name: 'Cartridge Needles 5RL', category: 'needles', quantity: 50, reorderLevel: 10, unit: 'pcs', price: 300, sellable: true, createdAt: now },
    { id: 'seed_inv_008', name: 'Green Soap 1L', category: 'disinfectant', quantity: 4, reorderLevel: 1, unit: 'bottles', price: 800, sellable: false, createdAt: now },
  ]);

  // 7. Save to localStorage so app picks it up
  localStorage.setItem('inkflow_current_user', ownerId);
  localStorage.setItem('inkflow_current_location', 'all');

  console.log('✅ Seed data created!');
  console.log(`  Owner: ${ownerId} (now logged in)`);
  console.log(`  Locations: Downtown Tattoo (${loc1Id}), Eastside Ink (${loc2Id})`);
  console.log(`  Artists: Anna (loc1), Ben (loc1+loc2), Cara (loc2)`);
  console.log(`  ${5} clients, ${6} appointments (5 today), ${8} inventory items`);
  console.log(`  Try: switch locations via the dropdown, open POS, check Today view`);
  console.log('');
  console.log(`  ℹ️ Set localStorage 'inkflow_current_user' to '${artist1Id}' to act as Anna`);
  console.log(`  ℹ️ Set localStorage 'inkflow_current_user' to '${artist2Id}' to act as Ben`);

  return { ownerId, loc1Id, loc2Id, artist1Id, artist2Id, artist3Id };
}

export async function clearSeedData() {
  const seedPrefixes = ['seed_'];
  const tables = ['users', 'clients', 'appointments', 'inventory', 'studioLocations', 'posTransactions'] as const;
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
