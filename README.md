# CuraPulse | Patient Case Taking & Clinic Management System

> **A secure, mobile-friendly Electronic Medical Records (EMR) & Clinical Case Taking Web Application for small clinics and private practices.** Replaces paper case sheets with structured digital records, instant patient search, autosaving case notes, server-side printable PDF prescriptions, specialty templates, and strict role-based access control aligned with India's Digital Personal Data Protection (DPDP) Act.

---

## 🚀 Quick Start (One Command Run)

### Prerequisites
- Node.js (v18+ recommended; tested on v24)
- npm (v9+)

### Installation & Launch

```bash
# 1. From the project root, run setup to install dependencies, push database schema, and seed data:
npm run setup

# 2. Start both the Express Backend (port 5000) and Vite Frontend (port 5173) concurrently:
npm run dev
```

Visit the application at: **[http://localhost:5173](http://localhost:5173)**

*(Alternatively, you can run `npm run dev:server` in one terminal and `npm run dev:client` in another).*

---

## 👥 Demo Accounts & Roles

The system is pre-seeded with 3 realistic accounts. On the **Login screen** and at the top of every page, a **1-Click Demo Bar** lets you instantly switch roles during evaluation.

| Role | Email | Password | Permissions & Capabilities |
| :--- | :--- | :--- | :--- |
| **Doctor** | `doctor@clinic.com` | `Doctor@123` | • Record & edit full clinical case sheets<br>• Real-time BMI calculation & vitals tracking<br>• Write digital prescriptions (Rx table)<br>• Download & print server-side PDF case sheets<br>• Full access to patient medical histories |
| **Receptionist** | `reception@clinic.com` | `Reception@123` | • Register new patients with DPDP consent<br>• Schedule and manage OPD appointments<br>• View basic patient demographics only<br>• **Strictly restricted from viewing clinical notes, diagnoses, or prescriptions** |
| **Administrator** | `admin@clinic.com` | `Admin@123` | • Manage clinic staff users (activate/deactivate)<br>• Customize specialty templates (General, Dental, Pediatrics, Homeopathy)<br>• View immutable security audit trail logs |

---

## 🏥 Key Features

### 1. Multi-Step Case Taking Form (Autosaving)
- **Step 1: Chief Complaints & HPI** — Symptoms with duration, onset, aggravating/relieving factors.
- **Step 2: Medical Background & Lifestyle** — Past medical/surgical history, family history, regular medications, known allergies, diet, sleep, and habits.
- **Step 3: Vitals & Examination** — Systolic/diastolic BP, pulse rate, oral temperature, SpO2, weight, height, **instant auto-computed BMI and classification badge** (Underweight, Normal, Overweight, Obese), plus free-text physical findings.
- **Step 4: Specialty Custom Fields** — Dynamic template-specific inputs (e.g. pediatric birth weight/milestones, dental teeth affected, homeopathy thermal/constitutional rubrics).
- **Step 5: Diagnosis & Prescriptions** — Provisional diagnosis, tests ordered, interactive prescription table (medicine name, dose, frequency, duration, instructions), advice, and next follow-up date.
- **Autosave** — Local state is saved automatically to browser storage with timestamp indicators, preventing data loss during network interruptions.

### 2. Server-Side PDF Export (PDFKit)
- Generates clean, clinic-branded printable case sheets and prescription slips.
- Formatted with clinic header, doctor registration details, patient UHID/demographics, vitals summary, provisional diagnosis, Rx medicine table, dietary advice, follow-up date, and digital signature line.
- Protected route: Only authenticated doctors and administrators can download clinical PDFs.

### 3. Strict Role-Based Security & DPDP Act Privacy
- **Server-Enforced RBAC**: Permissions are validated on the Express server middleware (`requireRole`), not just hidden in the UI.
- **Receptionist Clinical Concealment**: When a receptionist accesses patient profiles or visit records, the backend omits all clinical findings, diagnoses, and prescriptions.
- **Informed Consent**: Registration mandates a visible DPDP Act 2023 consent checkbox.
- **Security Audit Trail**: Every sensitive event (`LOGIN`, `VIEW_PATIENT`, `VIEW_CLINICAL_NOTE`, `CREATE_VISIT`, `EXPORT_PDF`) is logged with the staff user's ID, email, role, action, and IP address.

### 4. Patient Registry & Search
- Instant live search by patient name, phone number, UHID (e.g. `CP-2026-0001`), or National ID.
- Advanced filters by date range and provisional diagnosis (for medical personnel).

### 5. Appointments & OPD Scheduling
- Daily appointment queue with time slots, consultation reasons, and status tracking (`SCHEDULED`, `COMPLETED`, `CANCELLED`).
- 1-click "Take Case" button to immediately initiate case taking for arriving patients.

### 6. Specialty Templates
- Pre-configured templates: **General Medicine**, **Pediatrics**, **Dental**, and **Homeopathy**.
- Admins can configure custom fields and JSON schemas for specialized clinical workflows.

---

## 🛠️ Architecture & Tech Stack

```
patiant/
├── package.json               # Root scripts (setup, dev, seed, build)
├── README.md                  # System documentation
├── .env.example               # Environment template
├── server/                    # Node.js + Express REST API
│   ├── prisma/
│   │   ├── schema.prisma      # Prisma schema (SQLite, PostgreSQL compatible)
│   │   └── seed.js            # Seed data (3 users, 4 templates, 5 patients, visits, rx)
│   ├── src/
│   │   ├── index.js           # Express app & security middleware
│   │   ├── middleware/        # Auth, RBAC, Rate limiter
│   │   ├── routes/            # Auth, Patient, Visit, Appointment, Template, Admin, Export
│   │   └── utils/             # Audit logger & PDFKit generator
└── client/                    # React (Vite) + Tailwind CSS SPA
    ├── src/
    │   ├── context/           # AuthContext with session restoration
    │   ├── components/        # Navbar, QuickDemoBar, Modal
    │   └── pages/             # Dashboard, Patients, Register, Detail, CaseForm, Admin
```

---

## 🧪 Testing & Verification Checklist

1. **Doctor Flow**:
   - Log in as `doctor@clinic.com` / `Doctor@123`.
   - View Dashboard with today's appointments and pending follow-ups.
   - Register a new patient or open an existing patient (e.g. Vikram Malhotra `CP-2026-0001`).
   - Click "Take Case" / "New Case", fill multi-step form, observe auto-calculated BMI.
   - Add prescription rows and complete consultation.
   - Click "PDF Prescription" to inspect the printable PDF.
2. **Receptionist Flow**:
   - Log in as `reception@clinic.com` / `Reception@123` (or use top Quick Switcher).
   - Verify that patient demographics and appointments are visible.
   - Verify that clinical case notes, diagnoses, and prescriptions are hidden with a privacy badge.
   - Book an appointment for a patient.
3. **Admin Flow**:
   - Log in as `admin@clinic.com` / `Admin@123`.
   - Visit "Staff Users" to toggle user accounts or create a new user.
   - Visit "Templates" to edit specialty field schemas.
   - Visit "Audit Trail" to inspect real-time audit logs of record views and logins.

---

## ⚠️ Known Limitations & Future Enhancements
- **Storage**: Configured with SQLite (`file:./dev.db`) for zero-configuration local evaluation. For multi-server production deployment, switch `provider = "postgresql"` in `prisma/schema.prisma` with zero application code changes.
- **Offline Sync**: Autosave currently caches drafts to browser `localStorage`; background IndexedDB service worker sync can be added for offline field camps.
- **SMS / WhatsApp Alerts**: Appointment booking logs internal clinic reminders; external SMS gateway (e.g., Twilio / Gupshup) can be plugged into `appointment.routes.js`.
