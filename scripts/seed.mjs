/**
 * AppSnap — Full Mock Data Seeder
 * Wipes existing test data and seeds a complete realistic dataset.
 *
 * Run: node scripts/seed.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env manually (no dotenv dependency needed)
const envPath = resolve(__dirname, '../.env');
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => l.split('=').map(s => s.trim()))
    .filter(([k]) => k)
    .map(([k, ...v]) => [k, v.join('=')])
);

const SUPABASE_URL = env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌  Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── helpers ────────────────────────────────────────────────────────────────

const log  = (msg) => console.log(`  ✓ ${msg}`);
const warn = (msg) => console.warn(`  ⚠  ${msg}`);

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

async function must(label, promise) {
  const { data, error } = await promise;
  if (error) { console.error(`❌  ${label}:`, error.message); process.exit(1); }
  return data;
}

// ── seed users ─────────────────────────────────────────────────────────────

async function seedUsers() {
  console.log('\n👤  Seeding users...');

  const TEST_USERS = [
    { email: 'coach@appsnap.test',   password: 'Test1234!', full_name: 'Alex Rivera',  role: 'coach'   },
    { email: 'player1@appsnap.test', password: 'Test1234!', full_name: 'Jordan Smith',  role: 'player'  },
    { email: 'player2@appsnap.test', password: 'Test1234!', full_name: 'Sam Lee',       role: 'player'  },
    { email: 'parent@appsnap.test',  password: 'Test1234!', full_name: 'Casey Johnson', role: 'parent'  },
    { email: 'manager@appsnap.test', password: 'Test1234!', full_name: 'Morgan Davis',  role: 'manager' },
  ];

  const users = [];

  for (const u of TEST_USERS) {
    // Try to get existing user first
    const { data: list } = await admin.auth.admin.listUsers();
    const existing = list?.users?.find(x => x.email === u.email);

    let userId;
    if (existing) {
      userId = existing.id;
      warn(`User ${u.email} already exists, reusing`);
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.full_name },
      });
      if (error) { warn(`Could not create ${u.email}: ${error.message}`); continue; }
      userId = data.user.id;
      log(`Created user ${u.email} (${userId.slice(0, 8)}…)`);
    }

    // Upsert profile
    await admin.from('profiles').upsert({
      id: userId, email: u.email, full_name: u.full_name,
    }, { onConflict: 'id' });

    users.push({ ...u, id: userId });
  }

  return users;
}

// ── seed team ──────────────────────────────────────────────────────────────

async function seedTeam(users) {
  console.log('\n🏆  Seeding team...');

  const coach = users.find(u => u.role === 'coach');

  // Delete old test team if exists
  await admin.from('teams').delete().eq('name', 'Thunder FC');

  const team = await must('create team', admin.from('teams').insert({
    name:        'Thunder FC',
    sport:       'Soccer',
    season:      'Spring 2026',
    age_group:   'U18',
    created_by:  coach.id,
  }).select().single());

  log(`Created team "Thunder FC" (${team.id.slice(0, 8)}…), invite code: ${team.invite_code}`);

  // Add all users as members with correct roles
  for (const u of users) {
    await must(`add member ${u.email}`, admin.from('team_members').upsert({
      team_id: team.id, user_id: u.id, role: u.role,
    }, { onConflict: 'team_id,user_id' }));
    log(`  Added ${u.full_name} as ${u.role}`);
  }

  return team;
}

// ── seed events ────────────────────────────────────────────────────────────

async function seedEvents(team, users) {
  console.log('\n📅  Seeding events...');

  const coach = users.find(u => u.role === 'coach');

  const eventsData = [
    { title: 'Practice — Conditioning',  type: 'practice', start: daysFromNow(0),  end: daysFromNow(0),  location: 'City Sports Park, Field A', notes: 'Bring extra water — hot day!' },
    { title: 'vs. Eagle Hawks',           type: 'game',     start: daysFromNow(2),  end: daysFromNow(2),  location: 'Eagle Stadium, Gate 3',     notes: 'Away game. Arrive 45 min early for warm-up.' },
    { title: 'Midweek Tactics Session',   type: 'practice', start: daysFromNow(4),  end: daysFromNow(4),  location: 'Training Ground B',         notes: 'Focus on set pieces this week.' },
    { title: 'Home Game vs. Blue Sharks', type: 'game',     start: daysFromNow(7),  end: daysFromNow(7),  location: 'Home Stadium — Main Pitch',  notes: 'League fixture. Families welcome!' },
    { title: 'Team Meeting — Season Plan',type: 'meeting',  start: daysFromNow(9),  end: daysFromNow(9),  location: 'Club House Meeting Room 1',  notes: 'Review standings and rotation plan.' },
    { title: 'Cup Quarter Final',         type: 'game',     start: daysFromNow(14), end: daysFromNow(14), location: 'Neutral — Central Arena',     notes: 'KO round. No ties — prepare for extra time.' },
  ];

  const events = [];
  for (const e of eventsData) {
    // Fix start/end to specific hours
    const startDate = new Date(e.start);
    startDate.setHours(e.type === 'meeting' ? 19 : 10, 0, 0, 0);
    const endDate = new Date(e.end);
    endDate.setHours(e.type === 'practice' ? 12 : e.type === 'meeting' ? 20 : 12, 0, 0, 0);

    const ev = await must(`create event: ${e.title}`, admin.from('events').insert({
      team_id: team.id, title: e.title, type: e.type,
      start_time: startDate.toISOString(), end_time: endDate.toISOString(),
      location: e.location, notes: e.notes, is_recurring: false,
      created_by: coach.id,
    }).select().single());

    log(`Created event "${e.title}"`);
    events.push(ev);
  }

  // Seed RSVPs for all users on first 3 events
  const rsvpMatrix = [
    // eventIdx: [coach, player1, player2, parent, manager]
    [0, ['yes', 'yes',   'yes',   'yes',  'yes'  ]],
    [1, ['yes', 'yes',   'maybe', 'no',   'yes'  ]],
    [2, ['yes', 'maybe', 'yes',   'yes',  'yes'  ]],
    [3, ['yes', 'yes',   'yes',   'maybe','yes'  ]],
  ];

  for (const [idx, statuses] of rsvpMatrix) {
    for (let i = 0; i < users.length; i++) {
      await admin.from('event_attendances').upsert({
        event_id: events[idx].id,
        user_id:  users[i].id,
        status:   statuses[i] ?? 'yes',
      }, { onConflict: 'event_id,user_id' });
    }
    log(`  Seeded RSVPs for event[${idx}]`);
  }

  return events;
}

// ── seed chat ──────────────────────────────────────────────────────────────

async function seedChat(team, users, events) {
  console.log('\n💬  Seeding chat...');

  // Ensure team thread
  let { data: thread } = await admin.from('message_threads')
    .select().eq('team_id', team.id).eq('type', 'team').single();

  if (!thread) {
    thread = await must('create team thread', admin.from('message_threads').insert({
      team_id: team.id, type: 'team', name: 'Thunder FC — General',
    }).select().single());
  }
  log(`Team thread: ${thread.id.slice(0, 8)}…`);

  // Delete old seed messages
  await admin.from('messages').delete().eq('thread_id', thread.id);

  const coach   = users.find(u => u.role === 'coach');
  const player1 = users.find(u => u.email === 'player1@appsnap.test');
  const player2 = users.find(u => u.email === 'player2@appsnap.test');
  const manager = users.find(u => u.role === 'manager');

  const msgs = [
    { sender: coach,   content: 'Hey everyone! Welcome to the Thunder FC team chat. Looking forward to a great Spring 2026 season! ⚡', offset: -10 },
    { sender: manager, content: 'Team kits will be ready for pickup at the clubhouse from Thursday. Same design as last season.',         offset: -9  },
    { sender: player1, content: 'Awesome! Can\'t wait. Are we doing extra sessions before the Eagle Hawks game?',                         offset: -8  },
    { sender: coach,   content: `Yes — conditioning session ${events[0]?.location ?? 'City Sports Park'} on ${new Date(events[0]?.start_time).toDateString()}. Make sure you're rested!`, offset: -7 },
    { sender: player2, content: "I'll be there! What time does warm-up start for the away game?",                                         offset: -6  },
    { sender: coach,   content: "Arrive 45 min before KO. Bus leaves the clubhouse at 9am sharp — don't be late 🚌",                    offset: -5  },
    { sender: player1, content: "Got it. I'll carpool with Sam if that's okay?",                                                          offset: -4  },
    { sender: player2, content: 'Works for me! 🙌',                                                                                       offset: -3  },
    { sender: manager, content: "Don't forget invoices are due by end of the week. Check the Payments tab for your balance.",             offset: -2  },
    { sender: coach,   content: 'Let\'s go Thunder! This is our season! 🏆⚡',                                                            offset: -1  },
  ];

  for (const m of msgs) {
    const ts = new Date();
    ts.setMinutes(ts.getMinutes() + m.offset);
    await admin.from('messages').insert({
      thread_id: thread.id, sender_id: m.sender.id, content: m.content,
      created_at: ts.toISOString(),
    });
  }
  log(`Seeded ${msgs.length} chat messages`);

  return thread;
}

// ── seed stats ─────────────────────────────────────────────────────────────

async function seedStats(team, users, events) {
  console.log('\n📊  Seeding game stats...');

  const coach = users.find(u => u.role === 'coach');

  // Use the 2nd game event (index 1 = vs Eagle Hawks) as a "completed" game
  const pastGame = await must('create past game stat', admin.from('game_stats').insert({
    event_id:   events[1].id,
    team_id:    team.id,
    home_score: 3,
    away_score: 1,
    opponent:   'Eagle Hawks',
    is_live:    false,
    notes:      'Great performance. Strong first half. Hat-trick by Jordan!',
    created_by: coach.id,
  }).select().single());
  log(`Game stat: Thunder FC 3 – 1 Eagle Hawks (completed)`);

  // Use 4th event (index 3 = vs Blue Sharks) as a "live" game
  const liveGame = await must('create live game stat', admin.from('game_stats').insert({
    event_id:   events[3].id,
    team_id:    team.id,
    home_score: 1,
    away_score: 0,
    opponent:   'Blue Sharks',
    is_live:    true,
    notes:      'First half underway. Strong pressure from Thunder.',
    created_by: coach.id,
  }).select().single());
  log(`Game stat: Thunder FC 1 – 0 Blue Sharks (🔴 LIVE)`);

  // Seed player stats for the completed game
  const statsByPlayer = [
    { user: users.find(u => u.email === 'player1@appsnap.test'), stats: { goals: 3, assists: 1, shots: 5, saves: 0 } },
    { user: users.find(u => u.email === 'player2@appsnap.test'), stats: { goals: 0, assists: 2, shots: 2, saves: 0 } },
  ];
  for (const { user, stats } of statsByPlayer) {
    if (!user) continue;
    await admin.from('player_stats').upsert({
      game_stat_id: pastGame.id, user_id: user.id, sport: 'Soccer', stats,
    }, { onConflict: 'game_stat_id,user_id' });
    log(`  Player stats for ${user.full_name}`);
  }
}

// ── seed invoices ──────────────────────────────────────────────────────────

async function seedInvoices(team, users) {
  console.log('\n💳  Seeding invoices...');

  const invoices = [
    { user: 'player1@appsnap.test', amount: 15000, desc: 'Spring 2026 Season Fees',  status: 'paid',    due: daysFromNow(-7)  },
    { user: 'player2@appsnap.test', amount: 15000, desc: 'Spring 2026 Season Fees',  status: 'pending', due: daysFromNow(7)   },
    { user: 'parent@appsnap.test',  amount: 15000, desc: 'Spring 2026 Season Fees',  status: 'overdue', due: daysFromNow(-14) },
    { user: 'manager@appsnap.test', amount:  5000, desc: 'Equipment Fund — Q2 2026', status: 'partial', due: daysFromNow(14)  },
  ];

  for (const inv of invoices) {
    const user = users.find(u => u.email === inv.user);
    if (!user) continue;
    await admin.from('invoices').insert({
      team_id: team.id, user_id: user.id,
      amount: inv.amount, description: inv.desc,
      status: inv.status,
      due_date: new Date(inv.due).toISOString().split('T')[0],
    });
    log(`Invoice for ${user.full_name}: $${inv.amount / 100} (${inv.status})`);
  }
}

// ── seed assignments ───────────────────────────────────────────────────────

async function seedAssignments(team, users, events) {
  console.log('\n✅  Seeding assignments...');

  const coach   = users.find(u => u.role === 'coach');
  const player1 = users.find(u => u.email === 'player1@appsnap.test');
  const player2 = users.find(u => u.email === 'player2@appsnap.test');
  const manager = users.find(u => u.role === 'manager');

  const assignments = [
    { title: 'Bring team snacks',         assignee: player1, event: events[0], desc: 'Energy bars + water bottles for 15 players', completed: true,  due: daysFromNow(0)  },
    { title: 'Set up corner flags',       assignee: player2, event: events[3], desc: 'Arrive 30 min before KO to set up flags',    completed: false, due: daysFromNow(7)  },
    { title: 'Book team bus for cup game',assignee: manager, event: events[5], desc: 'Contact Central Arena transport desk',        completed: false, due: daysFromNow(3)  },
    { title: 'Update match program',      assignee: manager, event: events[3], desc: 'Print 50 copies. Template on shared drive.',  completed: false, due: daysFromNow(5)  },
    { title: 'First aid kit check',       assignee: coach,   event: events[1], desc: 'Restock bandages and ice packs',              completed: true,  due: daysFromNow(-1) },
  ];

  for (const a of assignments) {
    await admin.from('assignments').insert({
      team_id:      team.id,
      event_id:     a.event?.id ?? null,
      title:        a.title,
      description:  a.desc,
      assigned_to:  a.assignee?.id ?? null,
      due_date:     new Date(a.due).toISOString().split('T')[0],
      is_completed: a.completed,
      created_by:   coach.id,
    });
    log(`Assignment: "${a.title}" → ${a.assignee?.full_name ?? 'unassigned'} (${a.completed ? '✓ done' : 'pending'})`);
  }
}

// ── main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱  AppSnap Seeder — starting...\n');
  console.log(`📡  Supabase: ${SUPABASE_URL}`);

  const users   = await seedUsers();
  const team    = await seedTeam(users);
  const events  = await seedEvents(team, users);
  await seedChat(team, users, events);
  await seedStats(team, users, events);
  await seedInvoices(team, users);
  await seedAssignments(team, users, events);

  console.log('\n' + '─'.repeat(60));
  console.log('✅  Seed complete! Here are your test accounts:\n');
  console.log('  Role     │ Email                     │ Password');
  console.log('  ─────────┼───────────────────────────┼──────────');
  console.log('  Coach    │ coach@appsnap.test         │ Test1234!');
  console.log('  Manager  │ manager@appsnap.test       │ Test1234!');
  console.log('  Player 1 │ player1@appsnap.test       │ Test1234!');
  console.log('  Player 2 │ player2@appsnap.test       │ Test1234!');
  console.log('  Parent   │ parent@appsnap.test        │ Test1234!');
  console.log('\n  Team: Thunder FC  •  Sport: Soccer  •  Season: Spring 2026');
  console.log('─'.repeat(60));
  console.log('\n📱  Start the app:  npx expo start');
  console.log('    Then open Expo Go on your phone and scan the QR code.\n');
}

main().catch(e => { console.error('Seed failed:', e); process.exit(1); });
