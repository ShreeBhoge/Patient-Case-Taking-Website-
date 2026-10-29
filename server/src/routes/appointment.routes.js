const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');

const prisma = new PrismaClient();

/**
 * GET /api/appointments
 * List appointments with filters for date and status
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { date, status, doctorId } = req.query;

    const where = {};
    if (date) where.appointmentDate = date;
    if (status) where.status = status;
    if (doctorId) where.doctorId = doctorId;

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: [
        { appointmentDate: 'asc' },
        { timeSlot: 'asc' },
      ],
      include: {
        patient: {
          select: {
            id: true,
            uhid: true,
            name: true,
            age: true,
            gender: true,
            phone: true,
            knownAllergies: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
          },
        },
      },
    });

    return res.json(appointments);
  } catch (err) {
    console.error('Error fetching appointments:', err);
    return res.status(500).json({ error: 'Failed to fetch appointments.' });
  }
});

/**
 * POST /api/appointments
 * Book a new appointment (Allowed: Doctor, Receptionist, Admin)
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { patientId, doctorId, appointmentDate, timeSlot, reason, notes } = req.body;

    if (!patientId || !appointmentDate || !timeSlot) {
      return res.status(400).json({
        error: 'Patient, appointment date, and time slot are required.',
      });
    }

    // Default to the first active doctor if doctorId not explicitly chosen
    let effectiveDoctorId = doctorId;
    if (!effectiveDoctorId) {
      const defaultDoctor = await prisma.user.findFirst({
        where: { role: 'DOCTOR', isActive: true },
      });
      effectiveDoctorId = defaultDoctor?.id;
    }

    if (!effectiveDoctorId) {
      return res.status(400).json({ error: 'No active doctor found for appointment assignment.' });
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId: effectiveDoctorId,
        appointmentDate,
        timeSlot,
        reason: reason ? reason.trim() : 'General Consultation',
        notes: notes ? notes.trim() : null,
        status: 'SCHEDULED',
      },
      include: {
        patient: {
          select: { id: true, uhid: true, name: true, phone: true },
        },
        doctor: {
          select: { id: true, name: true, specialty: true },
        },
      },
    });

    await logAudit(req, {
      action: 'CREATE_APPOINTMENT',
      entity: 'Appointment',
      entityId: appointment.id,
      details: `Booked appointment for ${appointment.patient.name} with ${appointment.doctor.name} on ${appointmentDate} at ${timeSlot}.`,
    });

    return res.status(201).json({
      message: 'Appointment booked successfully.',
      appointment,
    });
  } catch (err) {
    console.error('Error creating appointment:', err);
    return res.status(500).json({ error: 'Failed to book appointment.' });
  }
});

/**
 * PUT /api/appointments/:id
 * Update status or reschedule
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, appointmentDate, timeSlot, notes } = req.body;

    const existing = await prisma.appointment.findUnique({
      where: { id },
      include: { patient: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: status || existing.status,
        appointmentDate: appointmentDate || existing.appointmentDate,
        timeSlot: timeSlot || existing.timeSlot,
        notes: notes !== undefined ? notes : existing.notes,
      },
      include: {
        patient: { select: { id: true, name: true, uhid: true } },
        doctor: { select: { id: true, name: true } },
      },
    });

    await logAudit(req, {
      action: 'UPDATE_APPOINTMENT',
      entity: 'Appointment',
      entityId: updated.id,
      details: `Updated appointment for ${updated.patient.name} to status: ${updated.status}.`,
    });

    return res.json({
      message: 'Appointment updated successfully.',
      appointment: updated,
    });
  } catch (err) {
    console.error('Error updating appointment:', err);
    return res.status(500).json({ error: 'Failed to update appointment.' });
  }
});

module.exports = router;
