const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');

const prisma = new PrismaClient();

/**
 * GET /api/templates
 * List all active specialty case templates
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const templates = await prisma.template.findMany({
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' },
      ],
    });

    // Parse fieldsConfig for frontend
    const parsedTemplates = templates.map((t) => {
      let config = { sections: [], customFields: [] };
      try {
        config = JSON.parse(t.fieldsConfig);
      } catch (e) {
        // keep fallback
      }
      return {
        ...t,
        fieldsConfig: config,
      };
    });

    return res.json(parsedTemplates);
  } catch (err) {
    console.error('Error fetching templates:', err);
    return res.status(500).json({ error: 'Failed to fetch specialty templates.' });
  }
});

/**
 * GET /api/templates/:id
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const template = await prisma.template.findUnique({ where: { id } });

    if (!template) {
      return res.status(404).json({ error: 'Template not found.' });
    }

    let config = {};
    try {
      config = JSON.parse(template.fieldsConfig);
    } catch (e) {}

    return res.json({ ...template, fieldsConfig: config });
  } catch (err) {
    console.error('Error fetching template:', err);
    return res.status(500).json({ error: 'Failed to fetch template.' });
  }
});

/**
 * POST /api/templates
 * Admin only: Create a new specialty template
 */
router.post('/', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, specialty, description, fieldsConfig, isDefault } = req.body;

    if (!name || !specialty) {
      return res.status(400).json({ error: 'Template name and specialty are required.' });
    }

    const template = await prisma.template.create({
      data: {
        name: name.trim(),
        specialty: specialty.trim(),
        description: description ? description.trim() : null,
        fieldsConfig: typeof fieldsConfig === 'object' ? JSON.stringify(fieldsConfig) : (fieldsConfig || '{}'),
        isDefault: Boolean(isDefault),
      },
    });

    await logAudit(req, {
      action: 'CREATE_TEMPLATE',
      entity: 'Template',
      entityId: template.id,
      details: `Created specialty template: ${template.name} (${template.specialty}).`,
    });

    return res.status(201).json({
      message: 'Template created successfully.',
      template,
    });
  } catch (err) {
    console.error('Error creating template:', err);
    return res.status(500).json({ error: 'Failed to create template.' });
  }
});

/**
 * PUT /api/templates/:id
 * Admin only: Update a specialty template
 */
router.put('/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, specialty, description, fieldsConfig, isDefault } = req.body;

    const existing = await prisma.template.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Template not found.' });
    }

    const updated = await prisma.template.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        specialty: specialty !== undefined ? specialty.trim() : existing.specialty,
        description: description !== undefined ? description : existing.description,
        fieldsConfig: fieldsConfig !== undefined ? (typeof fieldsConfig === 'object' ? JSON.stringify(fieldsConfig) : fieldsConfig) : existing.fieldsConfig,
        isDefault: isDefault !== undefined ? Boolean(isDefault) : existing.isDefault,
      },
    });

    await logAudit(req, {
      action: 'UPDATE_TEMPLATE',
      entity: 'Template',
      entityId: updated.id,
      details: `Updated template: ${updated.name}.`,
    });

    return res.json({
      message: 'Template updated successfully.',
      template: updated,
    });
  } catch (err) {
    console.error('Error updating template:', err);
    return res.status(500).json({ error: 'Failed to update template.' });
  }
});

module.exports = router;
