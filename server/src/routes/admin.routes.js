const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');

const prisma = new PrismaClient();

// Enforce ADMIN role across all admin routes
router.use(authenticate, requireRole('ADMIN'));

/**
 * GET /api/admin/users
 * List all users with visit and appointment counts
 */
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        specialty: true,
        phone: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            visits: true,
            appointments: true,
          },
        },
      },
    });

    return res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    return res.status(500).json({ error: 'Failed to retrieve clinic users.' });
  }
});

/**
 * POST /api/admin/users
 * Create a new user (Doctor, Receptionist, Admin)
 */
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, role, specialty, phone } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(400).json({ error: 'A user with this email address already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role,
        specialty: specialty ? specialty.trim() : null,
        phone: phone ? phone.trim() : null,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        specialty: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    await logAudit(req, {
      action: 'USER_CREATE',
      entity: 'User',
      entityId: user.id,
      details: `Created new user ${user.name} (${user.email}) with role ${user.role}.`,
    });

    return res.status(201).json({
      message: 'User created successfully.',
      user,
    });
  } catch (err) {
    console.error('Error creating user:', err);
    return res.status(500).json({ error: 'Failed to create user.' });
  }
});

/**
 * PUT /api/admin/users/:id
 * Update user details or toggle active status
 */
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, specialty, phone, isActive, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const updateData = {
      name: name !== undefined ? name.trim() : existing.name,
      role: role || existing.role,
      specialty: specialty !== undefined ? specialty.trim() : existing.specialty,
      phone: phone !== undefined ? phone.trim() : existing.phone,
      isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
    };

    if (password && password.trim() !== '') {
      updateData.passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        specialty: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    await logAudit(req, {
      action: 'USER_UPDATE',
      entity: 'User',
      entityId: updated.id,
      details: `Updated user ${updated.name} (Active: ${updated.isActive}, Role: ${updated.role}).`,
    });

    return res.json({
      message: 'User updated successfully.',
      user: updated,
    });
  } catch (err) {
    console.error('Error updating user:', err);
    return res.status(500).json({ error: 'Failed to update user.' });
  }
});

/**
 * GET /api/admin/audit-logs
 * List and filter security & access audit logs
 */
router.get('/audit-logs', async (req, res) => {
  try {
    const { action, entity, search, startDate, endDate, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const where = {};
    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { details: { contains: q } },
        { userEmail: { contains: q } },
        { userRole: { contains: q } },
        { entityId: { contains: q } },
      ];
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return res.json({
      logs,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / take),
    });
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    return res.status(500).json({ error: 'Failed to retrieve audit trail.' });
  }
});

module.exports = router;
