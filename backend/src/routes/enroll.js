const express = require('express');
const pool = require('../db');
const router = express.Router();

// POST /api/enroll
// Body: { roll_number, name }
// Returns: { student } with qr_token
// If roll_number already exists, returns existing record (idempotent)
router.post('/', async (req, res) => {
  const { roll_number, name } = req.body;

  if (!roll_number || !name) {
    return res.status(400).json({ error: 'roll_number and name are required' });
  }

  const roll = roll_number.trim().toUpperCase();
  const cleanName = name.trim();

  if (!roll) return res.status(400).json({ error: 'roll_number cannot be empty' });
  if (!cleanName) return res.status(400).json({ error: 'name cannot be empty' });

  try {
    // Upsert: if roll_number exists, return existing record
    const result = await pool.query(
      `INSERT INTO students (roll_number, name)
       VALUES ($1, $2)
       ON CONFLICT (roll_number) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, roll_number, name, qr_token, created_at`,
      [roll, cleanName]
    );

    const student = result.rows[0];

    return res.status(200).json({
      message: 'Enrolled successfully',
      student: {
        id: student.id,
        roll_number: student.roll_number,
        name: student.name,
        qr_token: student.qr_token,
        created_at: student.created_at,
      },
    });
  } catch (err) {
    console.error('Enroll error:', err.message);
    return res.status(500).json({ error: 'Enrollment failed', details: err.message });
  }
});

// GET /api/enroll/lookup/:roll
// Returns student info + session attendance count (for re-login)
router.get('/lookup/:roll', async (req, res) => {
  const roll = req.params.roll.trim().toUpperCase();

  try {
    const studentResult = await pool.query(
      `SELECT id, roll_number, name, qr_token, created_at FROM students WHERE roll_number = $1`,
      [roll]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found. Please enroll first.' });
    }

    const student = studentResult.rows[0];

    const countResult = await pool.query(
      `SELECT COUNT(*) AS total FROM attendance WHERE student_id = $1`,
      [student.id]
    );

    return res.json({
      student: {
        id: student.id,
        roll_number: student.roll_number,
        name: student.name,
        qr_token: student.qr_token,
        created_at: student.created_at,
        sessions_attended: parseInt(countResult.rows[0].total, 10),
      },
    });
  } catch (err) {
    console.error('Lookup error:', err.message);
    return res.status(500).json({ error: 'Lookup failed', details: err.message });
  }
});

module.exports = router;
