const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');

const prisma = new PrismaClient();

/**
 * Generate unique UHID (e.g. CP-2026-0006)
 */
async function generateUHID() {
  const currentYear = new Date().getFullYear();
  const count = await prisma.patient.count();
  const sequence = String(count + 1).padStart(4, '0');
  const candidate = `CP-${currentYear}-${sequence}`;
  
  // Ensure uniqueness
  const existing = await prisma.patient.findUnique({ where: { uhid: candidate } });
  if (existing) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `CP-${currentYear}-${randomSuffix}`;
  }
  return candidate;
}

/**
 * GET /api/patients/stats/dashboard
 * Aggregated stats for clinic dashboard
 */
router.get('/stats/dashboard', authenticate, async (req, res) => {
  try {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const todayStr = now.toISOString().split('T')[0];

    const [totalPatients, visitsThisWeek, todayAppointments, pendingFollowUps, recentPatients] = await Promise.all([
      prisma.patient.count(),
      prisma.visit.count({
        where: { visitDate: { gte: startOfWeek } },
      }),
      prisma.appointment.count({
        where: {
          appointmentDate: todayStr,
          status: { in: ['SCHEDULED', 'COMPLETED'] },
        },
      }),
      prisma.visit.count({
        where: {
          followUpDate: { gte: todayStr },
        },
      }),
      prisma.patient.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          uhid: true,
          name: true,
          age: true,
          gender: true,
          phone: true,
          createdAt: true,
        },
      }),
    ]);

    // Upcoming follow-ups for doctors
    let upcomingFollowUps = [];
    if (req.user.role === 'DOCTOR' || req.user.role === 'ADMIN') {
      upcomingFollowUps = await prisma.visit.findMany({
        where: {
          followUpDate: { gte: todayStr },
        },
        take: 5,
        orderBy: { followUpDate: 'asc' },
        select: {
          id: true,
          followUpDate: true,
          followUpNotes: true,
          provisionalDiagnosis: true,
          patient: {
            select: { id: true, name: true, uhid: true, phone: true },
          },
        },
      });
    }

    return res.json({
      totalPatients,
      visitsThisWeek,
      todayAppointments,
      pendingFollowUps,
      recentPatients,
      upcomingFollowUps,
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    return res.status(500).json({ error: 'Failed to fetch dashboard statistics.' });
  }
});

/**
 * GET /api/patients
 * Search and filter patients by query, phone, uhid, or diagnosis
 * Role aware: receptionists cannot view diagnoses
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { query, diagnosis, startDate, endDate, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const where = {};

    if (query && query.trim() !== '') {
      const q = query.trim();
      where.OR = [
        { name: { contains: q } },
        { phone: { contains: q } },
        { uhid: { contains: q } },
        { idNumber: { contains: q } },
      ];
    }

    // Diagnosis filter (Doctors and Admins only)
    if (diagnosis && (req.user.role === 'DOCTOR' || req.user.role === 'ADMIN')) {
      where.visits = {
        some: {
          provisionalDiagnosis: { contains: diagnosis },
        },
      };
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [total, patients] = await Promise.all([
      prisma.patient.count({ where }),
      prisma.patient.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: 'desc' },
        include: {
          visits: {
            take: 1,
            orderBy: { visitDate: 'desc' },
            select: {
              id: true,
              visitDate: true,
              // Strictly hide clinical notes if receptionist
              provisionalDiagnosis: req.user.role !== 'RECEPTIONIST',
              doctor: {
                select: { name: true },
              },
            },
          },
          _count: {
            select: { visits: true },
          },
        },
      }),
    ]);

    // Sanitize output for receptionist: ensure diagnosis is never leaked
    const sanitizedPatients = patients.map((p) => {
      const lastVisit = p.visits[0];
      return {
        id: p.id,
        uhid: p.uhid,
        name: p.name,
        age: p.age,
        gender: p.gender,
        phone: p.phone,
        email: p.email,
        address: p.address,
        idNumber: p.idNumber,
        emergencyContactName: p.emergencyContactName,
        emergencyContactPhone: p.emergencyContactPhone,
        knownAllergies: p.knownAllergies,
        bloodGroup: p.bloodGroup,
        consentGiven: p.consentGiven,
        totalVisits: p._count.visits,
        lastVisitDate: lastVisit ? lastVisit.visitDate : null,
        lastDoctor: lastVisit?.doctor?.name || null,
        lastDiagnosis: req.user.role !== 'RECEPTIONIST' ? lastVisit?.provisionalDiagnosis || null : undefined,
        createdAt: p.createdAt,
      };
    });

    return res.json({
      patients: sanitizedPatients,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / take),
    });
  } catch (err) {
    console.error('Error fetching patients:', err);
    return res.status(500).json({ error: 'Failed to search patients.' });
  }
});

/**
 * GET /api/patients/:id
 * Retrieve patient profile with visit timeline
 * STRICT SECURITY: Receptionist receives NO clinical notes or prescriptions!
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const isDoctorOrAdmin = req.user.role === 'DOCTOR' || req.user.role === 'ADMIN';

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        appointments: {
          orderBy: { appointmentDate: 'desc' },
          include: {
            doctor: { select: { id: true, name: true, specialty: true } },
          },
        },
        visits: {
          orderBy: { visitDate: 'desc' },
          include: {
            doctor: { select: { id: true, name: true, specialty: true } },
            template: { select: { id: true, name: true, specialty: true } },
            prescriptions: isDoctorOrAdmin, // Only include prescriptions if doctor or admin
          },
        },
      },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found.' });
    }

    // Audit log
    await logAudit(req, {
      action: isDoctorOrAdmin ? 'VIEW_CLINICAL_NOTE' : 'VIEW_PATIENT',
      entity: 'Patient',
      entityId: patient.id,
      details: `Viewed patient profile for ${patient.name} (${patient.uhid}) by role ${req.user.role}.`,
    });

    // If receptionist: strip all clinical fields from visits
    if (!isDoctorOrAdmin) {
      const sanitizedVisits = patient.visits.map((v) => ({
        id: v.id,
        visitDate: v.visitDate,
        doctor: v.doctor,
        template: v.template?.name || null,
        status: v.status,
        // Notice: ALL clinical fields (chiefComplaints, hpi, pastHistory, familyHistory,
        // vitals, findings, provisionalDiagnosis, testsOrdered, advice, prescriptions)
        // are omitted!
      }));

      return res.json({
        ...patient,
        visits: sanitizedVisits,
        clinicalAccessRestricted: true,
      });
    }

    return res.json(patient);
  } catch (err) {
    console.error('Error getting patient details:', err);
    return res.status(500).json({ error: 'Failed to retrieve patient details.' });
  }
});

/**
 * POST /api/patients
 * Register a new patient with DPDP consent and UHID generation
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      name,
      age,
      dob,
      gender,
      phone,
      email,
      address,
      idNumber,
      emergencyContactName,
      emergencyContactPhone,
      knownAllergies,
      bloodGroup,
      consentGiven,
    } = req.body;

    if (!name || !phone || !gender) {
      return res.status(400).json({ error: 'Patient name, phone number, and gender are required.' });
    }

    if (!consentGiven) {
      return res.status(400).json({
        error: 'Patient consent under the DPDP Act is mandatory for health data processing.',
      });
    }

    const uhid = await generateUHID();

    const patient = await prisma.patient.create({
      data: {
        uhid,
        name: name.trim(),
        age: parseInt(age, 10) || 0,
        dob: dob || null,
        gender,
        phone: phone.trim(),
        email: email ? email.trim() : null,
        address: address ? address.trim() : null,
        idNumber: idNumber ? idNumber.trim() : null,
        emergencyContactName: emergencyContactName ? emergencyContactName.trim() : null,
        emergencyContactPhone: emergencyContactPhone ? emergencyContactPhone.trim() : null,
        knownAllergies: knownAllergies ? knownAllergies.trim() : null,
        bloodGroup: bloodGroup || null,
        consentGiven: Boolean(consentGiven),
        consentDate: new Date(),
      },
    });

    await logAudit(req, {
      action: 'CREATE_PATIENT',
      entity: 'Patient',
      entityId: patient.id,
      details: `Registered new patient: ${patient.name} (${patient.uhid}) by ${req.user.name}.`,
    });

    return res.status(201).json({
      message: 'Patient registered successfully.',
      patient,
    });
  } catch (err) {
    console.error('Error registering patient:', err);
    return res.status(500).json({ error: 'Failed to register patient.' });
  }
});

/**
 * PUT /api/patients/:id
 * Update patient demographic details
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      age,
      dob,
      gender,
      phone,
      email,
      address,
      idNumber,
      emergencyContactName,
      emergencyContactPhone,
      knownAllergies,
      bloodGroup,
    } = req.body;

    const existing = await prisma.patient.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Patient not found.' });
    }

    const updated = await prisma.patient.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        age: age !== undefined ? parseInt(age, 10) : existing.age,
        dob: dob !== undefined ? dob : existing.dob,
        gender: gender || existing.gender,
        phone: phone !== undefined ? phone.trim() : existing.phone,
        email: email !== undefined ? email.trim() : existing.email,
        address: address !== undefined ? address.trim() : existing.address,
        idNumber: idNumber !== undefined ? idNumber.trim() : existing.idNumber,
        emergencyContactName: emergencyContactName !== undefined ? emergencyContactName.trim() : existing.emergencyContactName,
        emergencyContactPhone: emergencyContactPhone !== undefined ? emergencyContactPhone.trim() : existing.emergencyContactPhone,
        knownAllergies: knownAllergies !== undefined ? knownAllergies.trim() : existing.knownAllergies,
        bloodGroup: bloodGroup || existing.bloodGroup,
      },
    });

    await logAudit(req, {
      action: 'UPDATE_PATIENT',
      entity: 'Patient',
      entityId: updated.id,
      details: `Updated demographic details for ${updated.name} (${updated.uhid}).`,
    });

    return res.json({
      message: 'Patient details updated.',
      patient: updated,
    });
  } catch (err) {
    console.error('Error updating patient:', err);
    return res.status(500).json({ error: 'Failed to update patient.' });
  }
});

module.exports = router;
