// Paste this into browser console (F12) after app loads.
// Generates: 50 clients, 20 projects, 100 messages, revisions, deposits, aftercare states
(async () => {
  const db = window.__db;
  if (!db) { console.error('wait for app to load, then retry'); return; }
  const users = await db.users.toArray();
  const artistId = users[0]?.id;
  if (!artistId) { console.error('Register first'); return; }

  const now = Date.now();
  const D = 86400000;
  const H = 3600000;
  const today = new Date().toISOString().slice(0, 10);
  const rand = (min,max) => Math.floor(Math.random()*(max-min+1))+min;
  const pick = (arr) => arr[rand(0, arr.length-1)];
  const daysAgo = (n) => new Date(now - n*D).toISOString().slice(0, 10);

  const names = [
    'Alex Rivera','Jordan Chen','Sam Wilson','Morgan Taylor','Casey Kim',
    'Riley Parker','Quinn Davis','Taylor Brooks','Avery Singh','Drew Martinez',
    'Jamie O\'Brien','Skyler White','Reese Nakamura','Blake Thompson','Cameron Ruiz',
    'Dakota Patel','Emerson Lee','Finley Adams','Harper Scott','Hayden Mitchell',
    'Jaden Cruz','Kai Yamamoto','Logan Foster','Mason Reed','Rowan Hughes',
    'Sage Coleman','Tatum Fisher','Zion Brooks','Abby Collins','Blair Jenkins',
    'Cody Perkins','Dylan Bishop','Ellis Warren','Finnegan Webb','Grayson Ford',
    'Harlow Myers','Indigo Hart','Jasper Mills','Kendall Boyd','Lennox Stone',
    'Marlowe Hunt','Nico Murray','Oakley Dean','Parker Fields','Quincy Walsh',
    'Remy Tucker','Sasha Griffin','Tristan Wells','Uma Norris','Vance Holt',
  ];

  const styles = ['realism','blackwork','dotwork','geometric','tribal','cover_up','illustrative','woodcut','sketch','newschool','oldschool','watercolor','biomechanical','trash_polka','fine_line','color','black_grey','neo_traditional'];
  const bodyParts = ['full_sleeve','half_sleeve','full_back','full_chest','full_leg','ribs','knee','forearm','bicep','shoulder','calf','thigh','hand','neck','ankle'];
  const sources = ['instagram','referral','walk_in','facebook','tiktok','other'];
  const inquiryStatus = ['new','contacted','booked','won','lost'];
  const pipelineStatus = ['new_inquiry','waiting_info','waiting_references','reviewing','revision','deposit_requested','deposit_paid','scheduled','completed','ghosted'];
  const projectStatus = ['inquiry','consultation','design','approved','scheduled','in_progress','completed'];
  const positiveMsgs = ['love it!!','amazing work','so happy with this','you\'re the best','perfect as always','incredible detail','obsessed with the result','exceeded my expectations','beyond happy','stunning piece','absolutely beautiful'];
  const neutralMsgs = ['looks good','healing nicely','thanks for the check-in','will send pics later','see you next time','all good here'];
  const concernMsgs = ['slightly faded','a bit patchy','worried about this area','getting itchy','colors look different','not sure about this spot','some scabbing still','a bit red still','feels raised','not healing as expected'];

  // ── 50 clients ──
  let clientCount = 0;
  for (const name of names) {
    const id = 'seed_client_' + (++clientCount);
    if (await db.clients.get(id)) continue;
    const monthsBack = rand(1, 18);
    await db.clients.add({
      id, name, artistId,
      phone: '+1 555-' + String(1000 + clientCount).slice(1),
      instagram: name.toLowerCase().replace(/\s/g, '_').replace(/'/g,''),
      birthday: `199${rand(0,9)}-0${rand(1,9)}-${String(rand(10,28)).padStart(2,'0')}`,
      createdAt: now - monthsBack * 30 * D,
      lastVisitAt: now - rand(7, 180) * D,
      totalSpend: rand(200, 5000),
      leadSource: pick(sources),
      notes: rand(0,1) ? 'Returning client' : 'Instagram inquiry',
    });
  }
  console.log('✓ 50 clients created');

  // ── Leads (30) ──
  let leadCount = 0;
  for (let i = 1; i <= 30; i++) {
    const id = 'seed_lead_' + (++leadCount);
    if (await db.leads.get(id)) continue;
    const source = pick(sources);
    const name = names[rand(0, names.length-1)];
    const isPaid = Math.random() > 0.6;
    await db.leads.add({
      id, artistId, name,
      phone: '+1 555-' + String(2000 + i).slice(1),
      source,
      status: pick(inquiryStatus),
      paymentStatus: isPaid ? 'paid' : pick(['unpaid','pending_verify','unpaid']),
      paymentAmount: String(rand(50, 500)),
      paymentCurrency: 'USD',
      createdAt: now - rand(1, 60) * D,
      nextFollowUpAt: Math.random() > 0.5 ? now + rand(-5, 14) * D : undefined,
      lastContactedAt: now - rand(1, 21) * D,
      leadPipelineStatus: pick(pipelineStatus),
      bodyPart: pick(bodyParts),
      style: pick(styles),
      note: Math.random() > 0.3 ? pick(['Wants a sleeve','Looking for cover-up','Needs consultation','Has reference photos','Friends got tattoo here','Saw portfolio online']) : undefined,
      preferredDate: Math.random() > 0.5 ? daysAgo(-rand(0,30)) : undefined,
    });
  }
  console.log('✓ 30 leads created');

  // ── 20 projects ──
  let projectCount = 0;
  for (let i = 1; i <= 20; i++) {
    const id = 'seed_proj_' + (++projectCount);
    if (await db.projects.get(id)) continue;
    const clientId = 'seed_client_' + rand(1, 50);
    const style = pick(styles);
    const bodyPart = pick(bodyParts);
    const sessions = rand(1, 4);
    const completed = rand(0, sessions);
    await db.projects.add({
      id, artistId, clientId,
      title: `${style} on ${bodyPart}`,
      style, bodyPart,
      status: pick(projectStatus),
      completedSessions: completed,
      plannedSessions: sessions,
      depositAmount: rand(50, 300),
      depositStatus: pick(['paid','paid','paid','pending']),
      budget: '$' + rand(300, 3000),
      createdAt: now - rand(10, 120) * D,
      updatedAt: now - rand(0, 7) * D,
    });
  }
  console.log('✓ 20 projects created');

  // ── Appointments ──
  let apptCount = 0;
  const statuses = ['unconfirmed','deposit_paid','ready','attention','done','cancelled'];
  for (let i = 1; i <= 30; i++) {
    const id = 'seed_appt_' + (++apptCount);
    if (await db.appointments.get(id)) continue;
    const daysOffset = rand(-3, 14);
    const apptDate = daysOffset < 0 ? daysAgo(Math.abs(daysOffset)) : today;
    const clientId = 'seed_client_' + rand(1, 50);
    await db.appointments.add({
      id,
      projectId: 'seed_proj_' + rand(1, 20),
      clientId, artistId,
      date: apptDate,
      time: `${rand(9,18)}:00`,
      duration: rand(60, 240),
      type: pick(['consultation','tattoo','touch_up','laser','consultation']),
      status: pick(statuses),
      waiverCompleted: Math.random() > 0.3,
      createdAt: now - rand(1, 60) * D,
    });
  }
  console.log('✓ appointments created');

  // ── Sessions with aftercare states ──
  for (let i = 1; i <= 15; i++) {
    // Create completed sessions with various aftercare states
    const daysBack = rand(1, 35);
    const finishedAt = now - daysBack * D;
    const sid = 'seed_session_' + i;
    if (await db.sessions.get(sid)) continue;
    const clientNum = rand(1, 50);
    const projectNum = rand(1, 20);
    const apptNum = rand(1, 30);

    // Vary aftercare sent: some have D1, some D1+D3, some none, some all
    const schedule = [];
    if (daysBack >= 1) schedule.push({ day: 1, sentAt: finishedAt + H });
    if (daysBack >= 3 && Math.random() > 0.3) schedule.push({ day: 3, sentAt: finishedAt + 3*D + H });
    if (daysBack >= 7 && Math.random() > 0.6) schedule.push({ day: 7, sentAt: finishedAt + 7*D + H });
    if (daysBack >= 30 && Math.random() > 0.7) schedule.push({ day: 30, sentAt: finishedAt + 30*D + H });

    await db.sessions.add({
      id: sid,
      projectId: 'seed_proj_' + projectNum,
      appointmentId: 'seed_appt_' + apptNum,
      artistId,
      clientId: 'seed_client_' + clientNum,
      status: 'completed',
      sessionState: 'completed',
      startedAt: finishedAt - rand(1, 4) * H,
      finishedAt,
      completedAt: finishedAt,
      actualDuration: rand(60, 240) * 60000,
      accumulatedDurationMs: rand(60, 240) * 60000,
      timeline: [{ timestamp: finishedAt, type: 'done', payload: 'Session completed' }],
      photos: [],
      notes: [],
      consumables: [],
      progressPhotos: Math.random() > 0.5
        ? [{ id: 'photo_' + i, url: '/placeholder.jpg', label: 'final', createdAt: finishedAt }]
        : [],
      healingPhotos: Math.random() > 0.6
        ? [{ id: 'heal_' + i, url: '/placeholder.jpg', day: rand(7,14), createdAt: finishedAt + 7*D }]
        : [],
      aftercareSchedule: schedule,
      aftercareSentAt: schedule.length > 0 ? schedule[0].sentAt : undefined,
      healingStatus: schedule.length === 4 ? 'fully_healed'
        : daysBack > 14 ? 'stable'
        : 'healing',
    });
  }
  console.log('✓ 15 sessions with aftercare states created');

  // ── Communication log (100 messages) ──
  for (let i = 1; i <= 100; i++) {
    const id = 'seed_comm_' + i;
    if (await db.communicationLog.get(id)) continue;
    const clientNum = rand(1, 50);
    const isPositive = Math.random() > 0.65;
    const isConcern = !isPositive && Math.random() > 0.5;
    const daysBack = rand(0, 45);

    let msg, tmpl;
    if (isPositive) {
      msg = pick(positiveMsgs);
      tmpl = 'client_satisfaction';
    } else if (isConcern) {
      msg = pick(concernMsgs);
      tmpl = 'client_concern';
    } else {
      msg = pick(neutralMsgs);
      tmpl = 'check_in';
    }

    // Mix of outbound and inbound
    const direction = i % 3 === 0 ? 'outbound' : i % 3 === 1 ? 'inbound' : 'auto';
    const channel = pick(['whatsapp','instagram','sms','app_note']);

    await db.communicationLog.add({
      id, artistId,
      clientId: 'seed_client_' + clientNum,
      projectId: 'seed_proj_' + rand(1, 20),
      channel, direction,
      message: msg,
      templateType: tmpl,
      createdAt: now - daysBack * D,
    });
  }
  console.log('✓ 100 communication log entries created');

  // ── Project revisions (optional, for revision_waiting) ──
  if (db.projectRevisions) {
    for (let i = 1; i <= 8; i++) {
      const id = 'seed_rev_' + i;
      if (await db.projectRevisions.get(id)) continue;
      await db.projectRevisions.add({
        id,
        projectId: 'seed_proj_' + rand(1, 20),
        artistId,
        version: i,
        imageUrls: [],
        status: pick(['sent','viewed','approved']),
        sentAt: now - rand(2, 14) * D,
        createdAt: now - rand(3, 21) * D,
      });
    }
    console.log('✓ project revisions created');
  }

  // ── Reviews ──
  for (let i = 1; i <= 15; i++) {
    const id = 'seed_review_' + i;
    if (await db.reviews.get(id)) continue;
    await db.reviews.add({
      id, artistId,
      clientId: 'seed_client_' + rand(1, 50),
      rating: rand(4, 5),
      text: pick(['Amazing work!','Best tattoo artist','So detailed','Love it!','Highly recommend']),
      source: 'inkflow',
      createdAt: now - rand(1, 60) * D,
    });
  }
  console.log('✓ reviews created');

  console.log('========================================');
  console.log('✅ Full demo data ready!');
  console.log('   50 clients, 20 projects, 30 leads, 30 appointments');
  console.log('   15 sessions (with aftercare states)');
  console.log('   100 communications, 15 reviews, 8 revisions');
  console.log('========================================');
  console.log('Refresh the page to see workspace cards with engine data.');
})();
