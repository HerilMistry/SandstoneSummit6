const express = require('express');
const pool = require('../db');
const { requireOrganizer } = require('../middleware/auth');
const router = express.Router();

// POST /api/attendance/scan  — organizer only
// Body: { qr_token, session_id }
// Validates: token exists, session is active (time window), no duplicate
router.post('/scan', requireOrganizer, async (req, res) => {
  const { qr_token, session_id } = req.body;

  if (!qr_token || !session_id) {
    return res.status(400).json({ error: 'qr_token and session_id are required' });
  }

  try {
    // 1. Find student by token
    const studentResult = await pool.query(
      `SELECT id, roll_number, name FROM students WHERE qr_token = $1`,
      [qr_token]
    );
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid QR code — student not found' });
    }
    const student = studentResult.rows[0];

    // 2. Find session and check time window
    const sessionResult = await pool.query(
      `SELECT id, name, speaker, start_time, end_time,
              (NOW() BETWEEN start_time AND end_time) AS is_active
       FROM sessions WHERE id = $1`,
      [session_id]
    );
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    const session = sessionResult.rows[0];

    if (!session.is_active) {
      return res.status(400).json({
        error: 'Session is not active right now',
        session: {
          name: session.name,
          start_time: session.start_time,
          end_time: session.end_time,
        },
      });
    }

    // 3. Check duplicate
    const dupCheck = await pool.query(
      `SELECT id FROM attendance WHERE student_id = $1 AND session_id = $2`,
      [student.id, session_id]
    );
    if (dupCheck.rows.length > 0) {
      return res.status(409).json({
        error: 'already_marked',
        message: `${student.name} already marked for this session`,
        student: { roll_number: student.roll_number, name: student.name },
      });
    }

    // 4. Insert attendance
    await pool.query(
      `INSERT INTO attendance (student_id, session_id) VALUES ($1, $2)`,
      [student.id, session_id]
    );

    // 5. Get total sessions attended so far
    const totalResult = await pool.query(
      `SELECT COUNT(*) AS total FROM attendance WHERE student_id = $1`,
      [student.id]
    );

    return res.status(201).json({
      success: true,
      message: 'Attendance marked',
      student: {
        roll_number: student.roll_number,
        name: student.name,
      },
      session: {
        name: session.name,
        speaker: session.speaker,
      },
      total_sessions_attended: parseInt(totalResult.rows[0].total, 10),
    });

  } catch (err) {
    console.error('Scan error:', err.message);
    return res.status(500).json({ error: 'Scan failed', details: err.message });
  }
});

// GET /api/attendance/session/:id  — organizer only
// Returns all attendees for a session with count
router.get('/session/:id', requireOrganizer, async (req, res) => {
  try {
    const sessionResult = await pool.query(
      `SELECT id, name, speaker FROM sessions WHERE id = $1`,
      [req.params.id]
    );
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const attendees = await pool.query(
      `SELECT s.roll_number, s.name, a.marked_at
       FROM attendance a
       JOIN students s ON s.id = a.student_id
       WHERE a.session_id = $1
       ORDER BY a.marked_at DESC`,
      [req.params.id]
    );

    return res.json({
      session: sessionResult.rows[0],
      count: attendees.rows.length,
      attendees: attendees.rows,
    });
  } catch (err) {
    console.error('Session attendance fetch error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// GET /api/attendance/session/:id/count  — organizer only (lightweight poll)
router.get('/session/:id/count', requireOrganizer, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) AS total FROM attendance WHERE session_id = $1`,
      [req.params.id]
    );
    return res.json({ count: parseInt(result.rows[0].total, 10) });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to get count' });
  }
});

// GET /api/attendance/student/:roll  — public, by roll number
router.get('/student/:roll', async (req, res) => {
  const roll = req.params.roll.trim().toUpperCase();
  try {
    const studentResult = await pool.query(
      `SELECT id, roll_number, name FROM students WHERE roll_number = $1`,
      [roll]
    );
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    const student = studentResult.rows[0];

    const attendanceResult = await pool.query(
      `SELECT
         sess.id, sess.name, sess.speaker, sess.day,
         sess.start_time, sess.end_time, a.marked_at
       FROM attendance a
       JOIN sessions sess ON sess.id = a.session_id
       WHERE a.student_id = $1
       ORDER BY sess.start_time ASC`,
      [student.id]
    );

    return res.json({
      student: { roll_number: student.roll_number, name: student.name },
      sessions_attended: attendanceResult.rows.length,
      sessions: attendanceResult.rows,
    });
  } catch (err) {
    console.error('Student attendance error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

module.exports = router;
