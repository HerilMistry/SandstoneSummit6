const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Allowed organizer Google emails (comma-separated in env var ORGANIZER_EMAILS)
// e.g. ORGANIZER_EMAILS=heril@iitj.ac.in,organizer2@iitj.ac.in
// Leave ORGANIZER_EMAILS empty to allow ANY Google-authenticated user (useful during testing)
function getAllowedEmails() {
  const raw = process.env.ORGANIZER_EMAILS || '';
  return raw.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
}

// ─────────────────────────────────────────────────────────────
// POST /api/auth/google-access
// Body: { accessToken: string, email: string, name: string }
// Verifies the Google access token by calling Google's userinfo,
// then issues our own JWT.
// ─────────────────────────────────────────────────────────────
router.post('/google-access', async (req, res) => {
  const { accessToken, email, name } = req.body;
  if (!accessToken || !email) {
    return res.status(400).json({ error: 'accessToken and email are required' });
  }

  try {
    // Verify access token by calling Google's userinfo endpoint
    const gRes = await fetch('https://www.googleapis.com/userinfo/v2/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!gRes.ok) throw new Error('Google token verification failed');
    const gUser = await gRes.json();

    // Make sure the token actually belongs to this email
    if (gUser.email?.toLowerCase() !== email.toLowerCase()) {
      return res.status(401).json({ error: 'Token/email mismatch' });
    }

    const verifiedEmail = gUser.email.toLowerCase();
    const verifiedName  = gUser.name || name;

    // Check allowlist
    const allowed = getAllowedEmails();
    if (allowed.length > 0 && !allowed.includes(verifiedEmail)) {
      return res.status(403).json({
        error: `${verifiedEmail} is not an authorized organizer. Contact the admin.`,
      });
    }

    const token = jwt.sign(
      { role: 'organizer', email: verifiedEmail, name: verifiedName },
      process.env.JWT_SECRET,
      { expiresIn: '48h' }
    );

    res.json({ token, email: verifiedEmail, name: verifiedName, expiresIn: '48h' });
  } catch (err) {
    console.error('Google access token verification error:', err.message);
    res.status(401).json({ error: 'Invalid or expired Google token' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/login  (password fallback — keep for emergencies)
// Body: { password: string }
// ─────────────────────────────────────────────────────────────
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password is required' });
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
