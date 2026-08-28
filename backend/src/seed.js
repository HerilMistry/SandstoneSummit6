// Seed script — inserts the full Sandstone Summit 6.0 schedule
// All times are stored as UTC. Schedule is in IST (UTC+5:30).
// IST → UTC: subtract 5 hours 30 minutes

require('dotenv').config();
const pool = require('./db');

// Helper: build UTC ISO string from IST date components
function ist(dateStr, hours, minutes) {
  // dateStr: 'YYYY-MM-DD', hours/minutes in IST
  const totalMinutesIST = hours * 60 + minutes;
  const totalMinutesUTC = totalMinutesIST - 330; // subtract 5h30m
  const utcH = Math.floor(totalMinutesUTC / 60);
  const utcM = totalMinutesUTC % 60;
  return `${dateStr}T${String(utcH).padStart(2, '0')}:${String(utcM).padStart(2, '0')}:00Z`;
}

const sessions = [
  // ─── Day 1: 29th August 2026 ───────────────────────────────
  {
    name: 'Inauguration',
    speaker: 'Director / Deputy Director',
    day: 1,
    start_time: ist('2026-08-29', 9, 30),
    end_time:   ist('2026-08-29', 10, 0),
  },
  {
    name: 'Session 1',
    speaker: 'Mukesh Jain (Capgemini)',
    day: 1,
    start_time: ist('2026-08-29', 10, 0),
    end_time:   ist('2026-08-29', 11, 0),
  },
  {
    name: 'Session 2',
    speaker: 'Preeti Ahuja (Husk Power)',
    day: 1,
    start_time: ist('2026-08-29', 11, 0),
    end_time:   ist('2026-08-29', 12, 0),
  },
  {
    name: 'Session 3',
    speaker: 'Priyakamesh (Tiger Analytics)',
    day: 1,
    start_time: ist('2026-08-29', 12, 0),
    end_time:   ist('2026-08-29', 13, 0),
  },
  {
    name: 'Session 4',
    speaker: 'Sanjay Varier (Wesco)',
    day: 1,
    start_time: ist('2026-08-29', 14, 0),
    end_time:   ist('2026-08-29', 15, 0),
  },
  {
    name: 'Session 5',
    speaker: 'Navin Bishnoi (Marvell Technology)',
    day: 1,
    start_time: ist('2026-08-29', 15, 0),
    end_time:   ist('2026-08-29', 16, 0),
  },
  {
    name: 'Session 6',
    speaker: 'Chetna (Capwise)',
    day: 1,
    start_time: ist('2026-08-29', 16, 0),
    end_time:   ist('2026-08-29', 17, 0),
  },
  {
    name: 'Session 7',
    speaker: 'Vinit Kulkarni (Greenovative)',
    day: 1,
    start_time: ist('2026-08-29', 17, 0),
    end_time:   ist('2026-08-29', 18, 0),
  },

  // ─── Day 2: 30th August 2026 ───────────────────────────────
  {
    name: 'Session 1',
    speaker: 'Sarabjeet Singh (Litmos)',
    day: 2,
    start_time: ist('2026-08-30', 10, 0),
    end_time:   ist('2026-08-30', 11, 0),
  },
  {
    name: 'Session 2',
    speaker: 'Preet Yadav (NXP Semiconductors)',
    day: 2,
    start_time: ist('2026-08-30', 11, 0),
    end_time:   ist('2026-08-30', 12, 0),
  },
  {
    name: 'Session 3',
    speaker: 'Munit Goyal (Gemini Solutions Pvt Ltd)',
    day: 2,
    start_time: ist('2026-08-30', 12, 0),
    end_time:   ist('2026-08-30', 13, 0),
  },
  {
    name: 'Session 4',
    speaker: 'Dipika Deb (AMD)',
    day: 2,
    start_time: ist('2026-08-30', 14, 30),
    end_time:   ist('2026-08-30', 15, 30),
  },
  {
    name: 'Session 5',
    speaker: 'Violet Sera (Optum)',
    day: 2,
    start_time: ist('2026-08-30', 15, 30),
    end_time:   ist('2026-08-30', 16, 30),
  },
  {
    name: 'Case Study',
    speaker: 'Saahiba Bhatia (FinnMaverick)',
    day: 2,
    start_time: ist('2026-08-30', 16, 30),
    end_time:   ist('2026-08-30', 17, 30),
  },
];

async function seed() {
  try {
    for (const s of sessions) {
      await pool.query(
        `INSERT INTO sessions (name, speaker, day, start_time, end_time)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [s.name, s.speaker, s.day, s.start_time, s.end_time]
      );
    }
    console.log(`✅ Seeded ${sessions.length} sessions`);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
