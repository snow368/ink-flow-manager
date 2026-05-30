// Paste this entire block into the browser console (F12) and press Enter.
(async function seedDemo() {
  const { db } = await import('../db');

  const users = await db.users.toArray();
  const artistId = users[0]?.id;
  if (!artistId) { console.error('No user found — register first'); return; }

  const now = Date.now();
  const day = 86400000;
  const today = new Date().toISOString().slice(0, 10);
  const hour = 3600000;

  // ── Clients ──
  const clients = [
    ['c_deposit', 'Alex Rivera', '+1 555-0101'],
    ['c_ready', 'Jordan Chen', '+1 555-0102'],
    ['c_ghost', 'Sam Wilson', '+1 555-0103'],
    ['c_revision', 'Morgan Taylor', '+1 555-0104'],
    ['c_intake', 'Casey Kim', '+1 555-0105'],
    ['c_session', 'Riley Parker', '+1 555-0106'],
    ['c_aftercare', 'Quinn Davis', '+1 555-0107'],
    ['c_repeat', 'Taylor Brooks', '+1 555-0108'],
    ['c_extra_8', 'Client 8', '+1 555-0108'],
    ['c_extra_9', 'Client 9', '+1 555-0109'],
    ['c_extra_10', 'Client 10', '+1 555-0110'],
  ];

  for (const [id, name, phone] of clients) {
    if (!(await db.clients.get(id))) {
      await db.clients.add({ id, name, artistId, phone, createdAt: now });
    }
  }

  // ── Leads ──
  const leads = [
    { id: 'l_deposit', clientId: 'c_deposit', name: 'Alex Rivera', status: 'contacted', paymentStatus: 'unpaid', paymentAmount: '150', createdAt: now - 3 * day, leadPipelineStatus: 'deposit_requested', source: 'instagram', phone: '+1 555-0101' },
    { id: 'l_ready', clientId: 'c_ready', name: 'Jordan Chen', status: 'contacted', createdAt: now - day, preferredDate: today, leadPipelineStatus: 'reviewing', source: 'instagram', phone: '+1 555-0102' },
    { id: 'l_ghost', clientId: 'c_ghost', name: 'Sam Wilson', status: 'new', createdAt: now - 14 * day, lastContactedAt: now - 10 * day, source: 'instagram', leadPipelineStatus: 'new_inquiry', phone: '+1 555-0103' },
    { id: 'l_intake', clientId: 'c_intake', name: 'Casey Kim', status: 'new', createdAt: now - 3 * day, leadPipelineStatus: 'waiting_references', source: 'instagram', phone: '+1 555-0105' },
  ];

  for (const l of leads) {
    if (!(await db.leads.get(l.id))) {
      await db.leads.add({ ...l, artistId });
    }
  }

  // ── Projects ──
  const projRevId = 'p_revision';
  if (!(await db.projects.get(projRevId))) {
    await db.projects.add({
      id: projRevId, artistId, clientId: 'c_revision',
      title: 'Japanese sleeve — dragon',
      status: 'design', completedSessions: 0,
      createdAt: now - 7 * day, updatedAt: now - 7 * day,
    });
  }

  // Project revision
  try {
    if (db.projectRevisions && !(await db.projectRevisions.get('rev_1'))) {
      await db.projectRevisions.add({
        id: 'rev_1', projectId: projRevId, artistId,
        version: 1, imageUrls: [], status: 'sent',
        sentAt: now - 2 * day, createdAt: now - 2 * day,
      });
    }
  } catch {}

  // ── Appointments for today ──
  const apptData = [
    { id: 'a_today_0', clientId: 'c_session', time: '10:00', type: 'consultation', status: 'unconfirmed' },
    { id: 'a_today_1', clientId: 'c_deposit', time: '11:30', type: 'tattoo', status: 'deposit_paid' },
    { id: 'a_today_2', clientId: 'c_revision', time: '14:00', type: 'touch_up', status: 'ready', projectId: projRevId },
    { id: 'a_today_3', clientId: 'c_ghost', time: '16:00', type: 'tattoo', status: 'attention' },
  ];

  for (const a of apptData) {
    if (!(await db.appointments.get(a.id))) {
      await db.appointments.add({
        ...a, artistId, date: today, duration: 120,
        waiverCompleted: false, createdAt: now,
      });
    }
  }

  // Extra appointments to fill the day view
  for (let i = 0; i < 3; i++) {
    const n = i + 8;
    const aid = 'a_extra_' + n;
    if (!(await db.appointments.get(aid))) {
      await db.appointments.add({
        id: aid, clientId: 'c_extra_' + n, artistId,
        date: today, time: (8 + i * 2) + ':00',
        duration: 90 + i * 30, type: 'tattoo',
        status: i === 0 ? 'done' : i === 1 ? 'ready' : 'deposit_paid',
        waiverCompleted: true, createdAt: now,
      });
    }
  }

  // ── Done appointment + session for aftercare ──
  if (!(await db.appointments.get('a_done'))) {
    await db.appointments.add({
      id: 'a_done', clientId: 'c_aftercare', artistId,
      date: new Date(now - 3 * day).toISOString().slice(0, 10),
      time: '14:00', duration: 120, type: 'tattoo',
      status: 'done', waiverCompleted: true, createdAt: now - 3 * day,
    });
  }
  if (!(await db.sessions.get('s_aftercare'))) {
    await db.sessions.add({
      id: 's_aftercare', appointmentId: 'a_done', artistId,
      clientId: 'c_aftercare', status: 'completed',
      startedAt: now - 3 * day, finishedAt: now - 3 * day + 2 * hour,
      actualDuration: 7200, timeline: [], photos: [], notes: [], consumables: [],
    });
  }

  // ── Repeat booking: set lastVisitAt to 7 months ago ──
  await db.clients.update('c_repeat', { lastVisitAt: now - 210 * day, instagram: 'taylor_b_ink' });
  await db.clients.update('c_session', { instagram: 'riley_tatts' });
  await db.clients.update('c_aftercare', { instagram: 'quinn_d_art' });

  console.log('✓ Seed data inserted! Refresh the page to see workspace cards.');
})();
