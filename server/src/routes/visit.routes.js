const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');

const prisma = new PrismaClient();

/**
 * Calculate BMI and category
 */
function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm || heightCm <= 0) return { bmi: null, category: null };
  const heightM = heightCm / 100;
  const bmi = parseFloat((weightKg / (heightM * heightM)).toFixed(2));
  
  let category = 'Normal';
  if (bmi < 18.5) category = 'Underweight';
  else if (bmi >= 18.5 && bmi < 24.9) category = 'Normal';
  else if (bmi >= 25.0 && bmi < 29.9) category = 'Overweight';
  else category = 'Obese';

  return { bmi, category };
}

/**
 * GET /api/visits/:id
 * Retrieve a full visit by ID
 * Restricted to DOCTOR and ADMIN only!
 */
router.get('/:id', authenticate, requireRole('DOCTOR', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    const visit = await prisma.visit.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: { select: { id: true, name: true, specialty: true, phone: true } },
        template: true,
        prescriptions: true,
      },
    });

    if (!visit) {
      return res.status(404).json({ error: 'Clinical visit record not found.' });
    }

    await logAudit(req, {
      action: 'VIEW_CLINICAL_NOTE',
      entity: 'Visit',
      entityId: visit.id,
      details: `Dr. ${req.user.name} viewed clinical case record for patient ${visit.patient.name}.`,
    });

    return res.json(visit);
  } catch (err) {
    console.error('Error fetching visit:', err);
    return res.status(500).json({ error: 'Failed to retrieve visit record.' });
  }
});

/**
 * POST /api/visits
 * Create a new clinical case visit record with prescriptions
 * Restricted to DOCTOR and ADMIN
 */
router.post('/', authenticate, requireRole('DOCTOR', 'ADMIN'), async (req, res) => {
  try {
    const {
      patientId,
      templateId,
      chiefComplaints,
      duration,
      hpi,
      pastHistory,
      familyHistory,
      currentMedications,
      allergies,
      lifestyleDiet,
      lifestyleSleep,
      lifestyleHabits,
      bpSystolic,
      bpDiastolic,
      pulse,
      temperature,
      weight,
      height,
      spo2,
      clinicalFindings,
      provisionalDiagnosis,
      testsOrdered,
      advice,
      followUpDate,
      followUpNotes,
      customFields,
      prescriptions = [],
      status = 'COMPLETED',
    } = req.body;

    if (!patientId || !chiefComplaints) {
      return res.status(400).json({ error: 'Patient ID and Chief Complaints are required.' });
    }

    // Check patient exists
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found.' });
    }

    // Calculate BMI
    const weightVal = weight ? parseFloat(weight) : null;
    const heightVal = height ? parseFloat(height) : null;
    const { bmi, category } = calculateBMI(weightVal, heightVal);

    const visit = await prisma.visit.create({
      data: {
        patientId,
        doctorId: req.user.id,
        templateId: templateId || null,
        chiefComplaints: chiefComplaints.trim(),
        duration: duration ? duration.trim() : null,
        hpi: hpi ? hpi.trim() : null,
        pastHistory: pastHistory ? pastHistory.trim() : null,
        familyHistory: familyHistory ? familyHistory.trim() : null,
        currentMedications: currentMedications ? currentMedications.trim() : null,
        allergies: allergies ? allergies.trim() : patient.knownAllergies,
        lifestyleDiet: lifestyleDiet ? lifestyleDiet.trim() : null,
        lifestyleSleep: lifestyleSleep ? lifestyleSleep.trim() : null,
        lifestyleHabits: lifestyleHabits ? lifestyleHabits.trim() : null,
        bpSystolic: bpSystolic ? parseInt(bpSystolic, 10) : null,
        bpDiastolic: bpDiastolic ? parseInt(bpDiastolic, 10) : null,
        pulse: pulse ? parseInt(pulse, 10) : null,
        temperature: temperature ? parseFloat(temperature) : null,
        weight: weightVal,
        height: heightVal,
        bmi,
        bmiCategory: category,
        spo2: spo2 ? parseInt(spo2, 10) : null,
        clinicalFindings: clinicalFindings ? clinicalFindings.trim() : null,
        provisionalDiagnosis: provisionalDiagnosis ? provisionalDiagnosis.trim() : 'Under Clinical Evaluation',
        testsOrdered: testsOrdered ? testsOrdered.trim() : null,
        advice: advice ? advice.trim() : null,
        followUpDate: followUpDate || null,
        followUpNotes: followUpNotes ? followUpNotes.trim() : null,
        customFields: typeof customFields === 'object' ? JSON.stringify(customFields) : (customFields || '{}'),
        status: status || 'COMPLETED',
        prescriptions: {
          create: prescriptions
            .filter((p) => p.medicineName && p.medicineName.trim() !== '')
            .map((p) => ({
              medicineName: p.medicineName.trim(),
              dosage: (p.dosage || '').trim(),
              frequency: (p.frequency || '').trim(),
              duration: (p.duration || '').trim(),
              instructions: (p.instructions || '').trim(),
            })),
        },
      },
      include: {
        patient: true,
        doctor: { select: { id: true, name: true, specialty: true } },
        prescriptions: true,
      },
    });

    // Also update patient's known allergies if new ones entered
    if (allergies && allergies.trim() !== patient.knownAllergies) {
      await prisma.patient.update({
        where: { id: patientId },
        data: { knownAllergies: allergies.trim() },
      });
    }

    await logAudit(req, {
      action: 'CREATE_VISIT',
      entity: 'Visit',
      entityId: visit.id,
      details: `Created visit record for ${patient.name} (${patient.uhid}) with diagnosis: ${visit.provisionalDiagnosis}. Status: ${visit.status}.`,
    });

    return res.status(201).json({
      message: 'Clinical case record saved successfully.',
      visit,
    });
  } catch (err) {
    console.error('Error creating visit:', err);
    return res.status(500).json({ error: 'Failed to save clinical visit record.' });
  }
});

/**
 * PUT /api/visits/:id
 * Update an existing clinical case record
 * Restricted to DOCTOR and ADMIN
 */
router.put('/:id', authenticate, requireRole('DOCTOR', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      chiefComplaints,
      duration,
      hpi,
      pastHistory,
      familyHistory,
      currentMedications,
      allergies,
      lifestyleDiet,
      lifestyleSleep,
      lifestyleHabits,
      bpSystolic,
      bpDiastolic,
      pulse,
      temperature,
      weight,
      height,
      spo2,
      clinicalFindings,
      provisionalDiagnosis,
      testsOrdered,
      advice,
      followUpDate,
      followUpNotes,
      customFields,
      prescriptions,
      status,
    } = req.body;

    const existing = await prisma.visit.findUnique({
      where: { id },
      include: { patient: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Visit record not found.' });
    }

    const weightVal = weight !== undefined ? (weight ? parseFloat(weight) : null) : existing.weight;
    const heightVal = height !== undefined ? (height ? parseFloat(height) : null) : existing.height;
    const { bmi, category } = calculateBMI(weightVal, heightVal);

    // If prescriptions were provided, replace them atomically
    if (Array.isArray(prescriptions)) {
      await prisma.prescription.deleteMany({ where: { visitId: id } });
      if (prescriptions.length > 0) {
        await prisma.prescription.createMany({
          data: prescriptions
            .filter((p) => p.medicineName && p.medicineName.trim() !== '')
            .map((p) => ({
              visitId: id,
              medicineName: p.medicineName.trim(),
              dosage: (p.dosage || '').trim(),
              frequency: (p.frequency || '').trim(),
              duration: (p.duration || '').trim(),
              instructions: (p.instructions || '').trim(),
            })),
        });
      }
    }

    const updated = await prisma.visit.update({
      where: { id },
      data: {
        chiefComplaints: chiefComplaints !== undefined ? chiefComplaints.trim() : existing.chiefComplaints,
        duration: duration !== undefined ? duration : existing.duration,
        hpi: hpi !== undefined ? hpi : existing.hpi,
        pastHistory: pastHistory !== undefined ? pastHistory : existing.pastHistory,
        familyHistory: familyHistory !== undefined ? familyHistory : existing.familyHistory,
        currentMedications: currentMedications !== undefined ? currentMedications : existing.currentMedications,
        allergies: allergies !== undefined ? allergies : existing.allergies,
        lifestyleDiet: lifestyleDiet !== undefined ? lifestyleDiet : existing.lifestyleDiet,
        lifestyleSleep: lifestyleSleep !== undefined ? lifestyleSleep : existing.lifestyleSleep,
        lifestyleHabits: lifestyleHabits !== undefined ? lifestyleHabits : existing.lifestyleHabits,
        bpSystolic: bpSystolic !== undefined ? (bpSystolic ? parseInt(bpSystolic, 10) : null) : existing.bpSystolic,
        bpDiastolic: bpDiastolic !== undefined ? (bpDiastolic ? parseInt(bpDiastolic, 10) : null) : existing.bpDiastolic,
        pulse: pulse !== undefined ? (pulse ? parseInt(pulse, 10) : null) : existing.pulse,
        temperature: temperature !== undefined ? (temperature ? parseFloat(temperature) : null) : existing.temperature,
        weight: weightVal,
        height: heightVal,
        bmi,
        bmiCategory: category,
        spo2: spo2 !== undefined ? (spo2 ? parseInt(spo2, 10) : null) : existing.spo2,
        clinicalFindings: clinicalFindings !== undefined ? clinicalFindings : existing.clinicalFindings,
        provisionalDiagnosis: provisionalDiagnosis !== undefined ? provisionalDiagnosis.trim() : existing.provisionalDiagnosis,
        testsOrdered: testsOrdered !== undefined ? testsOrdered : existing.testsOrdered,
        advice: advice !== undefined ? advice : existing.advice,
        followUpDate: followUpDate !== undefined ? followUpDate : existing.followUpDate,
        followUpNotes: followUpNotes !== undefined ? followUpNotes : existing.followUpNotes,
        customFields: customFields !== undefined ? (typeof customFields === 'object' ? JSON.stringify(customFields) : customFields) : existing.customFields,
        status: status || existing.status,
      },
      include: {
        patient: true,
        doctor: { select: { id: true, name: true, specialty: true } },
        prescriptions: true,
      },
    });

    await logAudit(req, {
      action: 'UPDATE_VISIT',
      entity: 'Visit',
      entityId: updated.id,
      details: `Updated visit record for ${existing.patient.name}. Status: ${updated.status}.`,
    });

    return res.json({
      message: 'Clinical record updated successfully.',
      visit: updated,
    });
  } catch (err) {
    console.error('Error updating visit:', err);
    return res.status(500).json({ error: 'Failed to update visit record.' });
  }
});

module.exports = router;
