const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');
const { generateVisitPDF } = require('../utils/pdfGenerator');
const { logAudit } = require('../utils/auditLogger');

const prisma = new PrismaClient();

/**
 * GET /api/export/visit/:id/pdf
 * Export a visit's clinical case sheet and prescription as a clean, printable PDF
 * Restricted to DOCTOR and ADMIN only!
 */
router.get('/visit/:id/pdf', authenticate, requireRole('DOCTOR', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    const visit = await prisma.visit.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
            phone: true,
            email: true,
          },
        },
        template: true,
        prescriptions: true,
      },
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit record not found.' });
    }

    const clinicInfo = {
      name: process.env.CLINIC_NAME || 'CuraPulse Health & Wellness Clinic',
      phone: process.env.CLINIC_PHONE || '+91 98765 43210',
      email: process.env.CLINIC_EMAIL || 'care@curapulseclinic.com',
      address: process.env.CLINIC_ADDRESS || '104 Health Avenue, Indiranagar, Bengaluru, KA 560038',
    };

    const pdfBuffer = await generateVisitPDF(visit, clinicInfo);

    // Audit log
    await logAudit(req, {
      action: 'EXPORT_PDF',
      entity: 'Visit',
      entityId: visit.id,
      details: `Generated and downloaded PDF prescription for patient ${visit.patient.name} (${visit.patient.uhid}).`,
    });

    const filename = `Prescription_${visit.patient.uhid}_${visit.id.substring(0, 8)}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.end(pdfBuffer);
  } catch (err) {
    console.error('Error generating PDF:', err);
    return res.status(500).json({ error: 'Failed to generate prescription PDF.' });
  }
});

module.exports = router;
