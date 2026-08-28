const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// POST /api/auth/login
// Body: { password: string }
// Returns: { token }
router.post('/login', (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  if (password !== process.env.ORGANIZER_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  const token = jwt.sign(
    { role: 'organizer' },
    process.env.JWT_SECRET,
    { expiresIn: '48h' }
  );

  res.json({ token, expiresIn: '48h' });
});

module.exports = router;
