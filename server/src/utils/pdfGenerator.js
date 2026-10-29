const PDFDocument = require('pdfkit');

/**
 * Generate a professional, clean medical case sheet & prescription PDF
 * @param {Object} visit Full visit object including patient, doctor, template, and prescriptions
 * @param {Object} clinicInfo Clinic details
 * @returns {Promise<Buffer>} PDF buffer
 */
function generateVisitPDF(visit, clinicInfo = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 36, bottom: 36, left: 40, right: 40 },
        info: {
          Title: `CaseSheet_${visit.patient?.uhid || 'Patient'}_${visit.id}`,
          Author: visit.doctor?.name || 'Clinic Doctor',
          Subject: 'Medical Case Sheet & Prescription',
        },
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const primaryColor = '#028090'; // Deep teal
      const accentColor = '#02C39A';  // Mint
      const darkColor = '#1e293b';    // Slate 800
      const mutedColor = '#64748b';   // Slate 500
      const alertColor = '#dc2626';   // Red 600

      const clinicName = clinicInfo.name || process.env.CLINIC_NAME || 'CuraPulse Health & Wellness Clinic';
      const clinicPhone = clinicInfo.phone || process.env.CLINIC_PHONE || '+91 98765 43210';
      const clinicEmail = clinicInfo.email || process.env.CLINIC_EMAIL || 'care@curapulseclinic.com';
      const clinicAddress = clinicInfo.address || process.env.CLINIC_ADDRESS || '104 Health Avenue, Indiranagar, Bengaluru, KA 560038';

      // ==========================================
      // 1. HEADER (Clinic & Doctor Info)
      // ==========================================
      doc.rect(40, 36, doc.page.width - 80, 75).fill('#f0fdfa'); // Soft mint/teal banner

      doc.fillColor(primaryColor)
        .fontSize(18)
        .font('Helvetica-Bold')
        .text(clinicName, 50, 44, { width: 330 });

      doc.fillColor(mutedColor)
        .fontSize(8.5)
        .font('Helvetica')
        .text(clinicAddress, 50, 68, { width: 330 })
        .text(`Phone: ${clinicPhone} | Email: ${clinicEmail}`, 50, 80, { width: 330 })
        .text('OPD Consultation & Electronic Case Record', 50, 92, { width: 330 });

      // Doctor Details (Right Side)
      doc.fillColor(darkColor)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(visit.doctor?.name || 'Attending Physician', doc.page.width - 240, 46, { width: 190, align: 'right' });

      doc.fillColor(primaryColor)
        .fontSize(8.5)
        .font('Helvetica')
        .text(visit.doctor?.specialty || 'General Medicine', doc.page.width - 240, 62, { width: 190, align: 'right' });

      doc.fillColor(mutedColor)
        .fontSize(8)
        .text(`Reg. No: KMC-${visit.doctor?.id ? visit.doctor.id.substring(0, 8).toUpperCase() : 'DOC-01'}`, doc.page.width - 240, 76, { width: 190, align: 'right' });

      doc.strokeColor(primaryColor).lineWidth(2).moveTo(40, 116).lineTo(doc.page.width - 40, 116).stroke();

      let currentY = 126;

      // ==========================================
      // 2. PATIENT DEMOGRAPHICS BAR
      // ==========================================
      doc.rect(40, currentY, doc.page.width - 80, 52).fill('#f8fafc').strokeColor('#cbd5e1').lineWidth(0.75).stroke();

      const p = visit.patient || {};
      const visitDateStr = visit.visitDate ? new Date(visit.visitDate).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      }) : 'N/A';

      doc.fillColor(darkColor).fontSize(9).font('Helvetica-Bold')
        .text(`Patient: ${p.name || 'Unknown'}`, 50, currentY + 8)
        .text(`UHID: ${p.uhid || 'N/A'}`, 240, currentY + 8)
        .text(`Date: ${visitDateStr}`, 410, currentY + 8);

      doc.font('Helvetica').fontSize(8.5).fillColor(mutedColor)
        .text(`Age / Gender: ${p.age || 'N/A'} Yrs / ${p.gender || 'N/A'}`, 50, currentY + 24)
        .text(`Phone: ${p.phone || 'N/A'}`, 240, currentY + 24)
        .text(`Blood Group: ${p.bloodGroup || 'Not Tested'}`, 410, currentY + 24);

      if (p.knownAllergies || visit.allergies) {
        const allergies = p.knownAllergies || visit.allergies;
        doc.fillColor(alertColor).fontSize(8).font('Helvetica-Bold')
          .text(`⚠️ ALLERGIES: ${allergies}`, 50, currentY + 38, { width: doc.page.width - 100 });
      }

      currentY += 62;

      // ==========================================
      // 3. VITALS STRIP
      // ==========================================
      const hasVitals = visit.bpSystolic || visit.pulse || visit.temperature || visit.weight || visit.height || visit.spo2;
      if (hasVitals) {
        doc.rect(40, currentY, doc.page.width - 80, 26).fill('#ecfdf5').strokeColor('#a7f3d0').lineWidth(0.5).stroke();
        
        let vitalsText = [];
        if (visit.bpSystolic && visit.bpDiastolic) vitalsText.push(`BP: ${visit.bpSystolic}/${visit.bpDiastolic} mmHg`);
        if (visit.pulse) vitalsText.push(`Pulse: ${visit.pulse} bpm`);
        if (visit.temperature) vitalsText.push(`Temp: ${visit.temperature} °F`);
        if (visit.weight) vitalsText.push(`Wt: ${visit.weight} kg`);
        if (visit.height) vitalsText.push(`Ht: ${visit.height} cm`);
        if (visit.bmi) vitalsText.push(`BMI: ${visit.bmi} (${visit.bmiCategory || ''})`);
        if (visit.spo2) vitalsText.push(`SpO2: ${visit.spo2}%`);

        doc.fillColor(darkColor).fontSize(8).font('Helvetica-Bold')
          .text(`VITALS: `, 48, currentY + 8, { continued: true })
          .font('Helvetica')
          .text(vitalsText.join('   |   '), { width: doc.page.width - 110 });

        currentY += 34;
      }

      // ==========================================
      // 4. CLINICAL CASE SUMMARY (Left Column or Stacked)
      // ==========================================
      function printSectionHeading(title, icon = '') {
        doc.fillColor(primaryColor).fontSize(9.5).font('Helvetica-Bold')
          .text(`${title.toUpperCase()}`, 40, currentY);
        currentY += 13;
        doc.strokeColor(accentColor).lineWidth(1).moveTo(40, currentY).lineTo(180, currentY).stroke();
        currentY += 6;
      }

      // Chief Complaints
      if (visit.chiefComplaints) {
        printSectionHeading('Chief Complaints');
        doc.fillColor(darkColor).fontSize(8.5).font('Helvetica')
          .text(`• ${visit.chiefComplaints}${visit.duration ? ` (${visit.duration})` : ''}`, 45, currentY, { width: doc.page.width - 90 });
        currentY = doc.y + 8;
      }

      // History of Present Illness (HPI)
      if (visit.hpi) {
        printSectionHeading('History of Present Illness (HPI)');
        doc.fillColor(darkColor).fontSize(8.5).font('Helvetica')
          .text(visit.hpi, 45, currentY, { width: doc.page.width - 90 });
        currentY = doc.y + 8;
      }

      // Past & Family History
      if (visit.pastHistory || visit.familyHistory || visit.currentMedications) {
        printSectionHeading('Medical & Surgical Background');
        let histLines = [];
        if (visit.pastHistory) histLines.push(`Past History: ${visit.pastHistory}`);
        if (visit.familyHistory) histLines.push(`Family History: ${visit.familyHistory}`);
        if (visit.currentMedications) histLines.push(`Current Meds: ${visit.currentMedications}`);

        doc.fillColor(darkColor).fontSize(8.5).font('Helvetica')
          .text(histLines.join('\n'), 45, currentY, { width: doc.page.width - 90 });
        currentY = doc.y + 8;
      }

      // Clinical Findings
      if (visit.clinicalFindings) {
        printSectionHeading('Clinical Examination Findings');
        doc.fillColor(darkColor).fontSize(8.5).font('Helvetica')
          .text(visit.clinicalFindings, 45, currentY, { width: doc.page.width - 90 });
        currentY = doc.y + 8;
      }

      // Provisional Diagnosis Box
      doc.rect(40, currentY, doc.page.width - 80, 26).fill('#f0f9ff').strokeColor('#bae6fd').lineWidth(0.75).stroke();
      doc.fillColor('#0369a1').fontSize(9).font('Helvetica-Bold')
        .text('PROVISIONAL DIAGNOSIS: ', 50, currentY + 8, { continued: true })
        .fillColor(darkColor).font('Helvetica')
        .text(visit.provisionalDiagnosis || 'Clinical Evaluation', { width: doc.page.width - 180 });
      currentY += 34;

      // ==========================================
      // 5. PRESCRIPTION (Rx) SECTION
      // ==========================================
      doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold')
        .text('Rx', 40, currentY);
      doc.fillColor(darkColor).fontSize(9.5).font('Helvetica-Bold')
        .text('PRESCRIPTION & TREATMENT PLAN', 64, currentY + 3);
      currentY += 18;

      const prescriptions = visit.prescriptions || [];
      if (prescriptions.length > 0) {
        // Table Header
        const tableTop = currentY;
        doc.rect(40, tableTop, doc.page.width - 80, 18).fill('#028090');
        doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold')
          .text('#', 45, tableTop + 5, { width: 20 })
          .text('Medicine / Generic Name', 65, tableTop + 5, { width: 175 })
          .text('Dosage', 245, tableTop + 5, { width: 65 })
          .text('Frequency', 315, tableTop + 5, { width: 95 })
          .text('Duration', 415, tableTop + 5, { width: 55 })
          .text('Instructions', 475, tableTop + 5, { width: 75 });

        currentY = tableTop + 18;

        prescriptions.forEach((rx, idx) => {
          const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
          doc.rect(40, currentY, doc.page.width - 80, 22).fill(rowBg);
          doc.strokeColor('#e2e8f0').lineWidth(0.5).rect(40, currentY, doc.page.width - 80, 22).stroke();

          doc.fillColor(darkColor).fontSize(8).font('Helvetica-Bold')
            .text(String(idx + 1), 45, currentY + 6, { width: 20 })
            .text(rx.medicineName, 65, currentY + 6, { width: 175, lineBreak: false });

          doc.font('Helvetica')
            .text(rx.dosage || '-', 245, currentY + 6, { width: 65 })
            .text(rx.frequency || '-', 315, currentY + 6, { width: 95 })
            .text(rx.duration || '-', 415, currentY + 6, { width: 55 })
            .text(rx.instructions || '-', 475, currentY + 6, { width: 75, lineBreak: false });

          currentY += 22;
        });

        currentY += 8;
      } else {
        doc.fillColor(mutedColor).fontSize(8.5).font('Helvetica-Oblique')
          .text('No prescription medications recorded for this visit.', 45, currentY);
        currentY += 16;
      }

      // Tests Ordered & Advice
      if (visit.testsOrdered) {
        doc.fillColor(primaryColor).fontSize(8.5).font('Helvetica-Bold')
          .text('Investigations / Lab Tests: ', 40, currentY, { continued: true })
          .fillColor(darkColor).font('Helvetica')
          .text(visit.testsOrdered, { width: doc.page.width - 90 });
        currentY = doc.y + 6;
      }

      if (visit.advice) {
        doc.fillColor(primaryColor).fontSize(8.5).font('Helvetica-Bold')
          .text('General Advice & Instructions: ', 40, currentY, { continued: true })
          .fillColor(darkColor).font('Helvetica')
          .text(visit.advice, { width: doc.page.width - 90 });
        currentY = doc.y + 6;
      }

      if (visit.followUpDate) {
        doc.fillColor('#b45309').fontSize(8.5).font('Helvetica-Bold')
          .text(`Follow-up Date: ${visit.followUpDate}`, 40, currentY, { continued: true })
          .fillColor(darkColor).font('Helvetica')
          .text(visit.followUpNotes ? ` (${visit.followUpNotes})` : '');
        currentY = doc.y + 10;
      }

      // ==========================================
      // 6. FOOTER & DOCTOR SIGNATURE
      // ==========================================
      const footerY = doc.page.height - 85;

      // Signature Area
      doc.strokeColor('#cbd5e1').lineWidth(0.75).moveTo(doc.page.width - 200, footerY + 15).lineTo(doc.page.width - 45, footerY + 15).stroke();
      doc.fillColor(darkColor).fontSize(8.5).font('Helvetica-Bold')
        .text(visit.doctor?.name || 'Dr. Ananya Roy, MBBS, MD', doc.page.width - 200, footerY + 20, { width: 155, align: 'center' })
        .font('Helvetica').fontSize(7.5).fillColor(mutedColor)
        .text('Authorized Signature & Stamp', doc.page.width - 200, footerY + 32, { width: 155, align: 'center' });

      // DPDP / Medical Privacy Disclaimer
      doc.fillColor(mutedColor).fontSize(7).font('Helvetica')
        .text('CONFIDENTIAL MEDICAL RECORD: This document contains privileged health information protected under India\'s Digital Personal Data Protection (DPDP) Act. For patient care and clinical follow-up only. If received in error, notify the sender immediately.', 40, footerY + 45, { width: doc.page.width - 80, align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateVisitPDF,
};
