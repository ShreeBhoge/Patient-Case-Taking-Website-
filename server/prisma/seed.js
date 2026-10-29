const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clear existing data in correct sequence
  await prisma.auditLog.deleteMany({});
  await prisma.prescription.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.visit.deleteMany({});
  await prisma.patient.deleteMany({});
  await prisma.template.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Hash passwords
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const doctorPassword = await bcrypt.hash('Doctor@123', 10);
  const receptionistPassword = await bcrypt.hash('Reception@123', 10);

  // 3. Create Users
  const admin = await prisma.user.create({
    data: {
      name: 'Dr. Rajesh Sharma (Admin)',
      email: 'admin@clinic.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      specialty: 'Clinical Director & Healthcare Administration',
      phone: '+91 98450 11223',
      isActive: true,
    },
  });

  const doctor = await prisma.user.create({
    data: {
      name: 'Dr. Ananya Roy, MBBS, MD',
      email: 'doctor@clinic.com',
      passwordHash: doctorPassword,
      role: 'DOCTOR',
      specialty: 'General Medicine & Family Physician',
      phone: '+91 98450 44556',
      isActive: true,
    },
  });

  const receptionist = await prisma.user.create({
    data: {
      name: 'Kavita Nair (Front Desk)',
      email: 'reception@clinic.com',
      passwordHash: receptionistPassword,
      role: 'RECEPTIONIST',
      specialty: 'Front Desk & Patient Relations',
      phone: '+91 98450 77889',
      isActive: true,
    },
  });

  console.log('✅ Users created: Admin, Doctor, Receptionist');

  // 4. Create Specialty Templates
  const templateGeneral = await prisma.template.create({
    data: {
      name: 'General Medicine',
      specialty: 'General Medicine',
      description: 'Comprehensive general health history, systemic review, and clinical examination.',
      isDefault: true,
      fieldsConfig: JSON.stringify({
        sections: ['complaints', 'hpi', 'pastHistory', 'familyHistory', 'currentMedications', 'lifestyle', 'vitals', 'examination', 'diagnosis', 'prescription', 'followUp'],
        customFields: [
          { key: 'smokingYears', label: 'Smoking Pack Years', type: 'text', placeholder: 'e.g. 5 pack-years or Non-smoker' },
          { key: 'alcoholIntake', label: 'Alcohol Intake Frequency', type: 'text', placeholder: 'e.g. Social, Occasional, None' }
        ]
      })
    }
  });

  const templatePediatrics = await prisma.template.create({
    data: {
      name: 'Pediatrics',
      specialty: 'Pediatrics',
      description: 'Tailored for infants, children, and adolescents with growth and milestone tracking.',
      isDefault: false,
      fieldsConfig: JSON.stringify({
        sections: ['complaints', 'hpi', 'pastHistory', 'familyHistory', 'lifestyle', 'vitals', 'examination', 'diagnosis', 'prescription', 'followUp'],
        customFields: [
          { key: 'birthWeight', label: 'Birth Weight (kg)', type: 'number', placeholder: 'e.g. 3.1' },
          { key: 'deliveryType', label: 'Delivery Type', type: 'select', options: ['Normal Vaginal Delivery', 'C-Section', 'Assisted'], placeholder: 'Select mode of delivery' },
          { key: 'immunizationStatus', label: 'Immunization Status Up to Date', type: 'select', options: ['Yes - Up to date', 'Partially vaccinated', 'Delayed'], placeholder: 'Immunization status' },
          { key: 'developmentalMilestones', label: 'Developmental Milestones', type: 'text', placeholder: 'e.g. Normal for age, social smile, neck holding' }
        ]
      })
    }
  });

  const templateDental = await prisma.template.create({
    data: {
      name: 'Dental',
      specialty: 'Dental',
      description: 'Oral and maxillofacial examination, periodontal evaluation, and dental charting.',
      isDefault: false,
      fieldsConfig: JSON.stringify({
        sections: ['complaints', 'hpi', 'pastHistory', 'lifestyle', 'vitals', 'examination', 'diagnosis', 'prescription', 'followUp'],
        customFields: [
          { key: 'teethAffected', label: 'Teeth Affected / Quadrant', type: 'text', placeholder: 'e.g. Upper right quadrant (16, 17)' },
          { key: 'cariesRisk', label: 'Caries Risk Assessment', type: 'select', options: ['Low', 'Moderate', 'High'], placeholder: 'Risk score' },
          { key: 'oralHygieneStatus', label: 'Oral Hygiene Status', type: 'select', options: ['Good', 'Fair', 'Poor - Calculus present'], placeholder: 'Status' }
        ]
      })
    }
  });

  const templateHomeopathy = await prisma.template.create({
    data: {
      name: 'Homeopathy',
      specialty: 'Homeopathy',
      description: 'Holistic constitutional case taking, physical generals, thermal state, and mental rubric analysis.',
      isDefault: false,
      fieldsConfig: JSON.stringify({
        sections: ['complaints', 'hpi', 'pastHistory', 'familyHistory', 'lifestyle', 'vitals', 'examination', 'diagnosis', 'prescription', 'followUp'],
        customFields: [
          { key: 'thermalState', label: 'Thermal Reaction', type: 'select', options: ['Chilly (Sensitive to cold)', 'Hot (Sensitive to heat)', 'Ambi-thermal'], placeholder: 'Thermal reaction' },
          { key: 'thirstDesire', label: 'Thirst & Cravings', type: 'text', placeholder: 'e.g. Thirstless, desires spicy foods and cold drinks' },
          { key: 'mentalDisposition', label: 'Mental & Emotional Disposition', type: 'textarea', placeholder: 'e.g. Mild, weeping disposition, hurried, anxious about health' }
        ]
      })
    }
  });

  console.log('✅ Specialty templates created');

  // 5. Create 5 Sample Patients
  const patient1 = await prisma.patient.create({
    data: {
      uhid: 'CP-2026-0001',
      name: 'Vikram Malhotra',
      age: 48,
      dob: '1978-04-12',
      gender: 'Male',
      phone: '+91 98765 43211',
      email: 'vikram.m@example.com',
      address: 'Flat 402, Green Heights, 5th Cross, Indiranagar, Bengaluru',
      idNumber: 'AADHAAR-8921-3412-9011',
      emergencyContactName: 'Priya Malhotra (Wife)',
      emergencyContactPhone: '+91 98765 43299',
      knownAllergies: 'Penicillin (Skin rash and urticaria)',
      bloodGroup: 'O+',
      consentGiven: true,
    }
  });

  const patient2 = await prisma.patient.create({
    data: {
      uhid: 'CP-2026-0002',
      name: 'Sunita Deshmukh',
      age: 34,
      dob: '1992-08-23',
      gender: 'Female',
      phone: '+91 98765 43212',
      email: 'sunita.deshmukh@example.com',
      address: '22/B Palm Meadows, Whitefield, Bengaluru',
      idNumber: 'AADHAAR-5512-9034-7712',
      emergencyContactName: 'Anand Deshmukh (Husband)',
      emergencyContactPhone: '+91 98765 43298',
      knownAllergies: 'Sulfa Drugs (Fixed drug eruption)',
      bloodGroup: 'B+',
      consentGiven: true,
    }
  });

  const patient3 = await prisma.patient.create({
    data: {
      uhid: 'CP-2026-0003',
      name: 'Aarav Patel',
      age: 8,
      dob: '2018-02-15',
      gender: 'Male',
      phone: '+91 98765 43213',
      email: 'dhiren.patel@example.com',
      address: '74 Lotus Colony, Koramangala, Bengaluru',
      idNumber: 'AADHAAR-1190-2345-6677',
      emergencyContactName: 'Dhiren Patel (Father)',
      emergencyContactPhone: '+91 98765 43213',
      knownAllergies: 'Peanuts (Mild oral itching)',
      bloodGroup: 'A+',
      consentGiven: true,
    }
  });

  const patient4 = await prisma.patient.create({
    data: {
      uhid: 'CP-2026-0004',
      name: 'Meera Krishnan',
      age: 62,
      dob: '1964-11-05',
      gender: 'Female',
      phone: '+91 98765 43214',
      email: 'meera.krishnan@example.com',
      address: 'Villa 14, Sobha Gardenia, Jayanagar, Bengaluru',
      idNumber: 'AADHAAR-6789-1234-9002',
      emergencyContactName: 'Karthik Krishnan (Son)',
      emergencyContactPhone: '+91 98765 43297',
      knownAllergies: 'None reported',
      bloodGroup: 'AB+',
      consentGiven: true,
    }
  });

  const patient5 = await prisma.patient.create({
    data: {
      uhid: 'CP-2026-0005',
      name: 'Rohan Gupta',
      age: 29,
      dob: '1997-06-30',
      gender: 'Male',
      phone: '+91 98765 43215',
      email: 'rohan.g@example.com',
      address: 'Room 301, Tech Park PG, Bellandur, Bengaluru',
      idNumber: 'AADHAAR-4432-8891-2310',
      emergencyContactName: 'Suresh Gupta (Father)',
      emergencyContactPhone: '+91 98765 43296',
      knownAllergies: 'Dust, NSAIDs (triggers wheezing)',
      bloodGroup: 'O-',
      consentGiven: true,
    }
  });

  console.log('✅ 5 Sample patients created');

  // 6. Create Visits & Prescriptions for Patients
  // Visit 1 for Patient 1 (Vikram Malhotra - Diabetes & HTN)
  const visit1 = await prisma.visit.create({
    data: {
      patientId: patient1.id,
      doctorId: doctor.id,
      templateId: templateGeneral.id,
      visitDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      chiefComplaints: 'Routine follow-up for diabetes and mild morning headache for 1 week',
      duration: '1 week',
      hpi: 'Patient diagnosed with Type 2 DM 3 years ago on oral hypoglycemic agents. Complains of occasional morning occipital headache and lethargy.',
      pastHistory: 'Known hypertensive for 2 years. Appendectomy done in 2015. No other surgical history.',
      familyHistory: 'Father has Type 2 DM and Coronary Artery Disease. Mother has hypertension.',
      currentMedications: 'Tab Metformin 500mg BD, Tab Telmisartan 40mg OD in morning.',
      allergies: 'Penicillin (Severe urticarial rash)',
      lifestyleDiet: 'Non-vegetarian, reduced salt intake, irregular meal timings due to desk job.',
      lifestyleSleep: '6 hours per night, disturbed sleep pattern.',
      lifestyleHabits: 'Non-smoker, occasional alcohol (1-2 drinks/month).',
      bpSystolic: 138,
      bpDiastolic: 88,
      pulse: 76,
      temperature: 98.4,
      weight: 78.5,
      height: 172.0,
      bmi: 26.54,
      bmiCategory: 'Overweight',
      spo2: 98,
      clinicalFindings: 'Conscious, oriented. No pallor, icterus, cyanosis, clubbing, or pedal edema. S1, S2 heard normal. Chest clear bilaterally. Abdomen soft, non-tender.',
      provisionalDiagnosis: 'Type 2 Diabetes Mellitus with Essential Hypertension (Mildly elevated BP)',
      testsOrdered: 'Fasting Blood Sugar (FBS), HbA1c, Serum Creatinine, Lipid Profile, Urine Microalbumin',
      advice: 'Low carbohydrate and low-sodium diet. Brisk walk for 45 minutes daily. Avoid sedentary posture. Self-monitor BP weekly.',
      followUpDate: '2026-10-25',
      followUpNotes: 'Review with recent HbA1c and lipid profile reports. Re-check BP.',
      status: 'COMPLETED',
      prescriptions: {
        create: [
          {
            medicineName: 'Tab. Metformin HCl (Glycomet) 500mg',
            dosage: '1 tablet',
            frequency: '1-0-1 (Twice daily)',
            duration: '30 days',
            instructions: 'Take immediately after breakfast and dinner',
          },
          {
            medicineName: 'Tab. Telmisartan (Telma) 40mg',
            dosage: '1 tablet',
            frequency: '1-0-0 (Once daily)',
            duration: '30 days',
            instructions: 'Take in the morning on an empty stomach with water',
          },
          {
            medicineName: 'Tab. Paracetamol 650mg',
            dosage: '1 tablet',
            frequency: 'SOS (As needed)',
            duration: '3 days',
            instructions: 'Take if headache persists (Max 2 tablets/day)',
          }
        ]
      }
    }
  });

  // Visit 2 for Patient 2 (Sunita Deshmukh - Acute Bronchitis)
  const visit2 = await prisma.visit.create({
    data: {
      patientId: patient2.id,
      doctorId: doctor.id,
      templateId: templateGeneral.id,
      visitDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      chiefComplaints: 'Dry hacking cough for 4 days, mild fever and sore throat for 2 days',
      duration: '4 days',
      hpi: 'Patient developed dry cough following viral exposure. Progressed to sore throat, low-grade fever with chills. No shortness of breath or chest pain.',
      pastHistory: 'Hypothyroidism diagnosed 4 years back, well controlled on Levothyroxine.',
      familyHistory: 'No family history of asthma or chronic respiratory illnesses.',
      currentMedications: 'Tab. Thyronorm 50mcg daily morning empty stomach.',
      allergies: 'Sulfa Drugs (Fixed drug eruption on arms)',
      lifestyleDiet: 'Vegetarian, adequate hydration.',
      lifestyleSleep: '7 hours, troubled by nocturnal coughing episodes.',
      lifestyleHabits: 'Non-smoker, teetotaler.',
      bpSystolic: 118,
      bpDiastolic: 76,
      pulse: 82,
      temperature: 100.2,
      weight: 58.0,
      height: 161.0,
      bmi: 22.38,
      bmiCategory: 'Normal',
      spo2: 99,
      clinicalFindings: 'Pharyngeal congestion present. Tonsils mildly enlarged without purulent exudates. Bilateral vesicular breath sounds with occasional coarse rhonchi. Heart sounds normal.',
      provisionalDiagnosis: 'Acute Upper Respiratory Tract Infection with Mild Bronchitis',
      testsOrdered: 'Complete Blood Count (CBC) if fever persists beyond 48 hours.',
      advice: 'Steam inhalation twice daily. Warm saline gargles 3 times daily. Hydrate with warm water and herbal teas. Rest for 3 days.',
      followUpDate: '2026-10-21',
      followUpNotes: 'Review if fever spikes >101F or productive sputum develops.',
      status: 'COMPLETED',
      prescriptions: {
        create: [
          {
            medicineName: 'Tab. Azithromycin (Azithral) 500mg',
            dosage: '1 tablet',
            frequency: '1-0-0 (Once daily)',
            duration: '3 days',
            instructions: 'Take 1 hour before or 2 hours after lunch',
          },
          {
            medicineName: 'Tab. Levocetirizine + Montelukast (Monticope)',
            dosage: '1 tablet',
            frequency: '0-0-1 (Once daily at night)',
            duration: '5 days',
            instructions: 'Take before bedtime',
          },
          {
            medicineName: 'Syrup Ascoril-D Cough Formula',
            dosage: '10 ml',
            frequency: '1-1-1 (Thrice daily)',
            duration: '5 days',
            instructions: 'Sip slowly after food',
          },
          {
            medicineName: 'Tab. Paracetamol (Dolo) 650mg',
            dosage: '1 tablet',
            frequency: '1-0-1 (Twice daily SOS)',
            duration: '3 days',
            instructions: 'Take for fever or body ache after meals',
          }
        ]
      }
    }
  });

  // Visit 3 for Patient 3 (Aarav Patel - Pediatric Gastroenteritis)
  const visit3 = await prisma.visit.create({
    data: {
      patientId: patient3.id,
      doctorId: doctor.id,
      templateId: templatePediatrics.id,
      visitDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      chiefComplaints: 'Watery loose stools (4 episodes) and vomiting (2 episodes) since yesterday morning',
      duration: '1 day',
      hpi: '8-year-old male child brought by parents with acute onset of loose stools and nausea after consuming street food. Urine output adequate.',
      pastHistory: 'No prior hospitalizations. Full term normal delivery (Birth weight 3.2 kg).',
      familyHistory: 'No chronic familial disorders.',
      currentMedications: 'None.',
      allergies: 'Peanuts (Mild oral itching)',
      lifestyleDiet: 'Soft diet (congee, banana, curd rice).',
      lifestyleSleep: 'Normal.',
      lifestyleHabits: 'Active school child.',
      bpSystolic: 98,
      bpDiastolic: 62,
      pulse: 92,
      temperature: 99.4,
      weight: 25.5,
      height: 126.0,
      bmi: 16.06,
      bmiCategory: 'Normal',
      spo2: 99,
      clinicalFindings: 'Child alert, interactive. Eyes normal (no sunken eyes), tongue moist, skin pinch goes back promptly. Abdomen soft, mild peri-umbilical tenderness, bowel sounds hyperactive.',
      provisionalDiagnosis: 'Acute Viral Gastroenteritis with Mild Dehydration',
      testsOrdered: 'Stool routine if symptoms persist beyond 3 days.',
      advice: 'ORS after every loose stool (100-200ml). Plenty of fluids (coconut water, buttermilk). Avoid dairy milk and sugary drinks.',
      followUpDate: '2026-10-20',
      followUpNotes: 'Emergency SOS if child becomes lethargic, unable to drink, or passes blood in stool.',
      customFields: JSON.stringify({
        birthWeight: '3.2',
        deliveryType: 'Normal Vaginal Delivery',
        immunizationStatus: 'Yes - Up to date',
        developmentalMilestones: 'Normal for age'
      }),
      status: 'COMPLETED',
      prescriptions: {
        create: [
          {
            medicineName: 'Oral Rehydration Salts (WHO-ORS Sachet)',
            dosage: '1 sachet in 1 Litre boiled cooled water',
            frequency: 'Frequent sips',
            duration: '3 days',
            instructions: 'Sip 100ml after each loose stool',
          },
          {
            medicineName: 'Syrup Zinc Gluconate 20mg/5ml',
            dosage: '5 ml',
            frequency: '1-0-0 (Once daily)',
            duration: '14 days',
            instructions: 'Continue for full 14 days to regenerate gut mucosa',
          },
          {
            medicineName: 'Capsule Sporlac / Enterogermina Respules',
            dosage: '1 respule',
            frequency: '1-0-1 (Twice daily)',
            duration: '5 days',
            instructions: 'Drink directly or mix with cool water',
          },
          {
            medicineName: 'Syrup Ondansetron (Emeset) 2mg/5ml',
            dosage: '4 ml',
            frequency: 'SOS (Before meals if nausea)',
            duration: '2 days',
            instructions: 'Give 30 mins before food only if vomiting',
          }
        ]
      }
    }
  });

  // Visit 4 for Patient 4 (Meera Krishnan - Osteoarthritis)
  const visit4 = await prisma.visit.create({
    data: {
      patientId: patient4.id,
      doctorId: doctor.id,
      templateId: templateGeneral.id,
      visitDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      chiefComplaints: 'Bilateral knee pain, worse on climbing stairs and standing for >20 mins, for 6 months',
      duration: '6 months',
      hpi: 'Pain is dull aching, localized to both knees (Right > Left). Morning stiffness lasting <15 minutes. Mild crepitus felt on movement.',
      pastHistory: 'Post-menopausal since age 51. No history of trauma.',
      familyHistory: 'Mother had severe arthritis and underwent total knee replacement.',
      currentMedications: 'Calcium 500mg + Vitamin D3 supplements occasionally.',
      allergies: 'None reported',
      lifestyleDiet: 'Strict vegetarian.',
      lifestyleSleep: '6 hours, pain wakes patient during position changes.',
      lifestyleHabits: 'Non-smoker.',
      bpSystolic: 126,
      bpDiastolic: 80,
      pulse: 74,
      temperature: 98.2,
      weight: 69.0,
      height: 154.0,
      bmi: 29.09,
      bmiCategory: 'Overweight',
      spo2: 98,
      clinicalFindings: 'Bilateral knee joint line tenderness (medial compartment). Coarse crepitus present. Range of motion: 0-115 degrees flexion. No active joint effusion or redness.',
      provisionalDiagnosis: 'Bilateral Primary Osteoarthritis Knee (Grade II Kellgren-Lawrence)',
      testsOrdered: 'Bilateral Knee X-ray AP & Lateral Weight-Bearing view, Serum Uric Acid, ESR',
      advice: 'Quadriceps strengthening exercises. Avoid squatting, sitting cross-legged on floor, and using Indian toilets. Hot fermentation for 15 mins daily.',
      followUpDate: '2026-10-27',
      followUpNotes: 'Review with knee X-rays.',
      status: 'COMPLETED',
      prescriptions: {
        create: [
          {
            medicineName: 'Tab. Aceclofenac 100mg + Paracetamol 325mg (Zerodol-P)',
            dosage: '1 tablet',
            frequency: '1-0-1 (Twice daily after food)',
            duration: '7 days',
            instructions: 'Take strictly after meals with antacid',
          },
          {
            medicineName: 'Cap. Rabeprazole 20mg (Razo)',
            dosage: '1 capsule',
            frequency: '1-0-0 (Once daily morning)',
            duration: '7 days',
            instructions: 'Take 30 mins before breakfast',
          },
          {
            medicineName: 'Tab. Glucosamine Sulphate 1500mg',
            dosage: '1 tablet',
            frequency: '0-1-0 (Once daily afternoon)',
            duration: '30 days',
            instructions: 'Cartilage supplement with water',
          },
          {
            medicineName: 'Volini Pain Relief Gel',
            dosage: 'Local application',
            frequency: 'Apply BD (Twice daily)',
            duration: '14 days',
            instructions: 'Apply gently on knees without hard massage',
          }
        ]
      }
    }
  });

  // Visit 5 for Patient 5 (Rohan Gupta - Allergic Rhinitis)
  const visit5 = await prisma.visit.create({
    data: {
      patientId: patient5.id,
      doctorId: doctor.id,
      templateId: templateGeneral.id,
      visitDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      chiefComplaints: 'Continuous sneezing, watery nasal discharge, and itchy eyes for 10 days',
      duration: '10 days',
      hpi: 'Symptoms aggravated during morning hours and house cleaning. History of atopy since childhood.',
      pastHistory: 'Childhood eczema.',
      familyHistory: 'Father has bronchial asthma.',
      currentMedications: 'None currently.',
      allergies: 'Dust mites, NSAIDs (triggers wheezing)',
      lifestyleDiet: 'Standard diet, occasional junk food.',
      lifestyleSleep: 'Disturbed due to nasal congestion.',
      lifestyleHabits: 'Non-smoker, drinks coffee 3 cups/day.',
      bpSystolic: 120,
      bpDiastolic: 78,
      pulse: 78,
      temperature: 98.6,
      weight: 71.0,
      height: 175.0,
      bmi: 23.18,
      bmiCategory: 'Normal',
      spo2: 99,
      clinicalFindings: 'Pale, boggy nasal turbinates with clear watery secretions. Dark circles under eyes (allergic shiners). Throat clear, chest clear without wheeze.',
      provisionalDiagnosis: 'Moderate Persistent Allergic Rhinosinusitis',
      testsOrdered: 'Serum Total IgE, Absolute Eosinophil Count (AEC)',
      advice: 'Dust mite avoidance: wash bedsheets in hot water weekly, avoid carpets in bedroom. Wear N95 mask during sweeping.',
      followUpDate: '2026-10-24',
      followUpNotes: 'Check symptom control and nasal spray adherence.',
      status: 'COMPLETED',
      prescriptions: {
        create: [
          {
            medicineName: 'Nasal Spray Fluticasone Furoate (Avamys) 27.5mcg',
            dosage: '2 sprays each nostril',
            frequency: 'Once daily at bedtime',
            duration: '30 days',
            instructions: 'Clear nose before spraying. Shake well before use.',
          },
          {
            medicineName: 'Tab. Bilastine 20mg (Bilaxten)',
            dosage: '1 tablet',
            frequency: '0-0-1 (Once daily evening)',
            duration: '14 days',
            instructions: 'Take on empty stomach 1 hour before dinner',
          },
          {
            medicineName: 'Saline Nasal Mist / Drops',
            dosage: '2-3 drops',
            frequency: 'TDS (Thrice daily)',
            duration: '14 days',
            instructions: 'For nasal lubrication and mucus clearance',
          }
        ]
      }
    }
  });

  console.log('✅ 5 Clinical visits with comprehensive prescriptions created');

  // 7. Create Sample Appointments
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dayAfter = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  await prisma.appointment.createMany({
    data: [
      {
        patientId: patient1.id,
        doctorId: doctor.id,
        appointmentDate: todayStr,
        timeSlot: '10:00 AM',
        reason: 'Diabetes Blood Sugar and BP follow-up',
        status: 'SCHEDULED',
        notes: 'Bring fasting lab reports',
      },
      {
        patientId: patient2.id,
        doctorId: doctor.id,
        appointmentDate: todayStr,
        timeSlot: '11:30 AM',
        reason: 'Bronchitis recovery review',
        status: 'SCHEDULED',
        notes: 'Check chest auscultation',
      },
      {
        patientId: patient3.id,
        doctorId: doctor.id,
        appointmentDate: tomorrow,
        timeSlot: '04:00 PM',
        reason: 'Pediatric post-gastroenteritis weight check',
        status: 'SCHEDULED',
        notes: 'Check hydration and dietary tolerance',
      },
      {
        patientId: patient4.id,
        doctorId: doctor.id,
        appointmentDate: dayAfter,
        timeSlot: '02:30 PM',
        reason: 'Knee X-ray evaluation & physiotherapy plan',
        status: 'SCHEDULED',
        notes: 'Bring radiology films',
      }
    ]
  });

  console.log('✅ Sample appointments created for dashboard');

  // 8. Create Initial Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        userEmail: admin.email,
        userRole: admin.role,
        action: 'SYSTEM_INIT',
        entity: 'System',
        entityId: 'SEED',
        details: 'Initial clinic database setup and specialty templates initialized.',
        ipAddress: '127.0.0.1'
      },
      {
        userId: receptionist.id,
        userEmail: receptionist.email,
        userRole: receptionist.role,
        action: 'CREATE_PATIENT',
        entity: 'Patient',
        entityId: patient1.id,
        details: `Registered patient ${patient1.name} (UHID: ${patient1.uhid}) with DPDP consent.`,
        ipAddress: '127.0.0.1'
      },
      {
        userId: doctor.id,
        userEmail: doctor.email,
        userRole: doctor.role,
        action: 'CREATE_VISIT',
        entity: 'Visit',
        entityId: visit1.id,
        details: `Recorded clinical case taking and generated prescription for patient ${patient1.name}.`,
        ipAddress: '127.0.0.1'
      }
    ]
  });

  console.log('✅ Audit logs seeded');
  console.log('🎉 Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
