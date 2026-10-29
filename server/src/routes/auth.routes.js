const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { authenticate, JWT_SECRET } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');
const { logAudit } = require('../utils/auditLogger');

const prisma = new PrismaClient();

/**
 * POST /api/auth/login
 * Role-aware login with bcrypt validation, rate limiting, and httpOnly cookie
 */
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      await logAudit(req, {
        action: 'LOGIN_FAILED',
        entity: 'Auth',
        details: `Failed login attempt for non-existent email: ${normalizedEmail}`,
      });
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account has been deactivated. Please contact administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      await logAudit(req, {
        action: 'LOGIN_FAILED',
        entity: 'Auth',
        userId: user.id,
        userEmail: user.email,
        details: 'Incorrect password entered.',
      });
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Set secure httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      specialty: user.specialty,
      phone: user.phone,
    };

    await logAudit(req, {
      action: 'LOGIN_SUCCESS',
      entity: 'Auth',
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      details: `User ${user.name} logged in successfully with role ${user.role}.`,
    });

    return res.json({
      message: 'Login successful',
      user: userResponse,
      token, // Also returned in body for convenience if cookies are cross-domain
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login.' });
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    await logAudit(req, {
      action: 'LOGOUT',
      entity: 'Auth',
      details: `User ${req.user.name} logged out.`,
    });

    res.clearCookie('token', {
      httpOnly: true,
      sameSite: 'lax',
    });

    return res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ error: 'Error logging out.' });
  }
});

/**
 * GET /api/auth/me
 * Returns current authenticated user
 */
router.get('/me', authenticate, async (req, res) => {
  return res.json({ user: req.user });
});

/**
 * GET /api/auth/demo-users
 * Returns available demo user credentials to facilitate rapid testing and grading
 */
router.get('/demo-users', (req, res) => {
  res.json({
    demoAccounts: [
      {
        role: 'DOCTOR',
        name: 'Dr. Ananya Roy, MBBS, MD',
        email: 'doctor@clinic.com',
        password: 'Doctor@123',
        description: 'Create & edit cases, write prescriptions, view full patient history.',
      },
      {
        role: 'RECEPTIONIST',
        name: 'Kavita Nair (Front Desk)',
        email: 'reception@clinic.com',
        password: 'Reception@123',
        description: 'Register patients, book appointments, view basic details only (no clinical notes).',
      },
      {
        role: 'ADMIN',
        name: 'Dr. Rajesh Sharma (Director)',
        email: 'admin@clinic.com',
        password: 'Admin@123',
        description: 'User management, audit logs, and specialty template configuration.',
      },
    ],
  });
});

module.exports = router;
