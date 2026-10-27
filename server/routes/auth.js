const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { verifyCredentials, generateToken, changePassword } = require('../auth');
const { requireAuth } = require('../middleware/authMiddleware');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 attempts
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' }
});

// Login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await verifyCredentials(username, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = generateToken(user);

    // Set secure HTTP-only cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal authentication server error' });
  }
});

// Check current session
router.get('/me', requireAuth, (req, res) => {
  res.json({
    authenticated: true,
    user: req.user
  });
});

// Change Password
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    const result = await changePassword(req.user.id, currentPassword, newPassword);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    res.json({ success: true, message: result.message });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Internal server error while changing password' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
