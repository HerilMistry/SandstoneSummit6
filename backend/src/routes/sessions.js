const express = require('express');
const pool = require('../db');
const { requireOrganizer } = require('../middleware/auth');
const router = express.Router();

// GET /api/sessions
// Returns all sessions ordered by start_time
// Includes: is_active flag (true if current time is within window)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         id, name, speaker, day, start_time, end_time,
         (NOW() BETWEEN start_time AND end_time) AS is_active
       FROM sessions
       ORDER BY start_time ASC`
    );
    return res.json({ sessions: result.rows });
  } catch (err) {
    console.error('Sessions fetch error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// GET /api/sessions/active
// Returns only currently active sessions
router.get('/active', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, speaker, day, start_time, end_time
       FROM sessions
       WHERE NOW() BETWEEN start_time AND end_time
       ORDER BY start_time ASC`
    );
    return res.json({ sessions: result.rows });
  } catch (err) {
    console.error('Active sessions fetch error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch active sessions' });
  }
});

// GET /api/sessions/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         id, name, speaker, day, start_time, end_time,
         (NOW() BETWEEN start_time AND end_time) AS is_active
       FROM sessions WHERE id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    return res.json({ session: result.rows[0] });
  } catch (err) {
    console.error('Session fetch error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// POST /api/sessions — organizer only (optional manual creation)
router.post('/', requireOrganizer, async (req, res) => {
  const { name, speaker, day, start_time, end_time } = req.body;
  if (!name || !day || !start_time || !end_time) {
    return res.status(400).json({ error: 'name, day, start_time, end_time are required' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO sessions (name, speaker, day, start_time, end_time)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, speaker || null, day, start_time, end_time]
    );
    return res.status(201).json({ session: result.rows[0] });
  } catch (err) {
    console.error('Session create error:', err.message);
    return res.status(500).json({ error: 'Failed to create session' });
  }
});

module.exports = router;
