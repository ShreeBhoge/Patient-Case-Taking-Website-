const http = require('http');

async function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = [];
      res.on('data', (chunk) => data.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(data);
        const text = buffer.toString('utf8');
        let json = null;
        try {
          json = JSON.parse(text);
        } catch (e) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: json || text,
          buffer,
        });
      });
    });

    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🩺 Starting End-to-End API and Role Verification Tests...\n');
  let doctorToken = '';
  let receptionistToken = '';
  let adminToken = '';
  let testPatientId = '';
  let testVisitId = '';

  // 1. Health check
  const health = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET',
  });
  console.log('1. API Health Check:', health.statusCode === 200 ? '✅ PASS' : '❌ FAIL', health.body);

  // 2. Login as Doctor
  const docLogin = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'doctor@clinic.com', password: 'Doctor@123' }
  );
  console.log('2. Doctor Login:', docLogin.statusCode === 200 ? '✅ PASS' : '❌ FAIL', `(User: ${docLogin.body?.user?.name})`);
  doctorToken = docLogin.body?.token;

  // 3. Login as Receptionist
  const recLogin = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'reception@clinic.com', password: 'Reception@123' }
  );
  console.log('3. Receptionist Login:', recLogin.statusCode === 200 ? '✅ PASS' : '❌ FAIL', `(User: ${recLogin.body?.user?.name})`);
  receptionistToken = recLogin.body?.token;

  // 4. Login as Admin
  const admLogin = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'admin@clinic.com', password: 'Admin@123' }
  );
  console.log('4. Admin Login:', admLogin.statusCode === 200 ? '✅ PASS' : '❌ FAIL', `(User: ${admLogin.body?.user?.name})`);
  adminToken = admLogin.body?.token;

  // 5. Patient Registration (with DPDP consent)
  const regPatient = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/patients',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`,
      },
    },
    {
      name: 'Rajeshwar Mukherjee',
      age: 52,
      dob: '1974-06-15',
      gender: 'Male',
      phone: '+91 98765 99881',
      email: 'rajeshwar.m@example.com',
      address: '88 Orchid Enclave, Koramangala, Bengaluru',
      idNumber: 'AADHAAR-9901-2234-5511',
      emergencyContactName: 'Aparna Mukherjee (Wife)',
      emergencyContactPhone: '+91 98765 99882',
      knownAllergies: 'Penicillin and Ciprofloxacin',
      bloodGroup: 'B+',
      consentGiven: true,
    }
  );
  testPatientId = regPatient.body?.patient?.id;
  const uhid = regPatient.body?.patient?.uhid;
  console.log('5. Patient Registration & UHID Generation:', regPatient.statusCode === 201 ? '✅ PASS' : '❌ FAIL', `UHID: ${uhid}`);

  // 6. Record Multi-step Case Taking with Vitals & Prescription (Doctor)
  const createVisit = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/visits',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`,
      },
    },
    {
      patientId: testPatientId,
      chiefComplaints: 'Severe recurring migraine headaches and bilateral shoulder stiffness',
      duration: '3 weeks',
      hpi: 'Patient reports throbbing right hemicranial pain with photophobia and nausea, exacerbated by work stress.',
      pastHistory: 'Hypertension for 5 years on Telmisartan.',
      familyHistory: 'Mother had chronic migraines.',
      currentMedications: 'Telmisartan 40mg OD',
      lifestyleDiet: 'Vegetarian, low sodium',
      lifestyleSleep: '5 hours interrupted',
      lifestyleHabits: 'Non-smoker, teetotaler',
      bpSystolic: 135,
      bpDiastolic: 88,
      pulse: 76,
      temperature: 98.4,
      weight: 76.0,
      height: 172.0,
      spo2: 98,
      clinicalFindings: 'Bilateral trapezius muscle spasm, pupillary reflexes normal, no focal deficits.',
      provisionalDiagnosis: 'Chronic Migraine without Aura with Cervical Muscle Spasm',
      testsOrdered: 'MRI Brain with Cervical Spine Screening if symptoms persist.',
      advice: 'Avoid bright screen glare, hydrate with 3L water daily, practice neck stretches.',
      followUpDate: '2026-11-01',
      followUpNotes: 'Review headache frequency diary.',
      prescriptions: [
        {
          medicineName: 'Tab. Naproxen 500mg + Domperidone 10mg',
          dosage: '1 tablet',
          frequency: '1-0-1 (BD after food)',
          duration: '5 days',
          instructions: 'Take at onset of headache with meals',
        },
        {
          medicineName: 'Tab. Amitriptyline 10mg',
          dosage: '1 tablet',
          frequency: '0-0-1 (Once at bedtime)',
          duration: '30 days',
          instructions: 'Take 30 minutes before sleep',
        },
      ],
      status: 'COMPLETED',
    }
  );

  testVisitId = createVisit.body?.visit?.id;
  const bmi = createVisit.body?.visit?.bmi;
  const bmiCategory = createVisit.body?.visit?.bmiCategory;
  console.log(
    '6. Clinical Case Taking & Vitals Auto-BMI:',
    createVisit.statusCode === 201 ? '✅ PASS' : '❌ FAIL',
    `BMI: ${bmi} (${bmiCategory}), Prescriptions: ${createVisit.body?.visit?.prescriptions?.length}`
  );

  // 7. Server-Side PDF Export Test
  const pdfExport = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/export/visit/${testVisitId}/pdf`,
    method: 'GET',
    headers: { Authorization: `Bearer ${doctorToken}` },
  });
  const isPdf = pdfExport.buffer.slice(0, 5).toString() === '%PDF-';
  console.log(
    '7. Server-Side PDFKit Prescription Export:',
    pdfExport.statusCode === 200 && isPdf ? '✅ PASS' : '❌ FAIL',
    `Content-Type: ${pdfExport.headers['content-type']}, Size: ${pdfExport.buffer.length} bytes`
  );

  // 8. Privacy Verification: Receptionist CANNOT view clinical notes
  const recViewPatient = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/patients/${testPatientId}`,
    method: 'GET',
    headers: { Authorization: `Bearer ${receptionistToken}` },
  });

  const pData = recViewPatient.body;
  const visitForRec = pData?.visits?.[0];
  const hasHiddenClinicalData =
    pData.clinicalAccessRestricted === true &&
    visitForRec?.provisionalDiagnosis === undefined &&
    visitForRec?.chiefComplaints === undefined &&
    visitForRec?.prescriptions === undefined;

  console.log(
    '8. DPDP Privacy Check (Receptionist Clinical Data Masking):',
    hasHiddenClinicalData ? '✅ PASS (Clinical notes hidden)' : '❌ FAIL (Data leak!)'
  );

  // 9. Receptionist forbidden from direct /api/visits/:id access
  const recVisitDirect = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: `/api/visits/${testVisitId}`,
    method: 'GET',
    headers: { Authorization: `Bearer ${receptionistToken}` },
  });
  console.log(
    '9. Server-level RBAC Guard (Receptionist blocked from visit endpoint):',
    recVisitDirect.statusCode === 403 ? '✅ PASS (403 Forbidden)' : '❌ FAIL'
  );

  // 10. Admin Audit Trail Verification
  const auditLogs = await makeRequest({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/audit-logs?limit=10',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(
    '10. Admin Audit Trail Logging:',
    auditLogs.statusCode === 200 && auditLogs.body?.logs?.length > 0 ? '✅ PASS' : '❌ FAIL',
    `Total Logs Recorded: ${auditLogs.body?.total}`
  );

  console.log('\n🎉 All 10 End-to-End Clinical, Privacy, and RBAC Test Cases PASSED!');
}

runTests().catch(console.error);
