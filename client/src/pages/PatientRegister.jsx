import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  UserPlus,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  FileText,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Heart,
  AlertTriangle,
} from 'lucide-react';

export const PatientRegister = () => {
  const navigate = useNavigate();
  const { isDoctor, isAdmin } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    dob: '',
    gender: 'Male',
    phone: '',
    email: '',
    address: '',
    idNumber: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    knownAllergies: '',
    bloodGroup: 'Unknown',
    consentGiven: true, // DPDP Act consent
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim() || !formData.phone.trim()) {
      setErrorMsg('Patient full name and contact phone number are required.');
      return;
    }

    if (!formData.consentGiven) {
      setErrorMsg('DPDP Act compliance requires explicit patient consent before processing digital health records.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register patient');
      }

      // If doctor, direct to take case or patient profile
      if (isDoctor) {
        navigate(`/patients/${data.patient.id}`);
      } else {
        navigate(`/patients/${data.patient.id}`);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/patients"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Patients Directory</span>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <UserPlus className="w-6 h-6 text-teal-600" />
          <span>Register New Patient</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Create a permanent digital case file with an auto-generated UHID.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Registration Incomplete</p>
            <p className="text-xs text-rose-700 mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Identification */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-teal-700 flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-4 h-4" />
            <span>1. Patient Demographics & Identity</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Ramesh Chandra Verma"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gender <span className="text-rose-500">*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Age (Years) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                name="age"
                required
                min="0"
                max="125"
                value={formData.age}
                onChange={handleChange}
                placeholder="e.g. 42"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Blood Group
              </label>
              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="Unknown">Unknown / Not Tested</option>
                <option value="A+">A +ve</option>
                <option value="A-">A -ve</option>
                <option value="B+">B +ve</option>
                <option value="B-">B -ve</option>
                <option value="O+">O +ve</option>
                <option value="O-">O -ve</option>
                <option value="AB+">AB +ve</option>
                <option value="AB-">AB -ve</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                National ID / Aadhaar Number (Optional)
              </label>
              <input
                type="text"
                name="idNumber"
                value={formData.idNumber}
                onChange={handleChange}
                placeholder="e.g. AADHAAR-xxxx-xxxx-xxxx or AB123456"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Contact & Address */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-teal-700 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Phone className="w-4 h-4" />
            <span>2. Contact & Emergency Details</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Primary Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. +91 98765 43210"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="patient@example.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Residential Address
              </label>
              <textarea
                name="address"
                rows="2"
                value={formData.address}
                onChange={handleChange}
                placeholder="Street address, apartment, locality, city, pincode"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Emergency Contact Person
              </label>
              <input
                type="text"
                name="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={handleChange}
                placeholder="e.g. Spouse / Parent Name"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Emergency Contact Phone
              </label>
              <input
                type="tel"
                name="emergencyContactPhone"
                value={formData.emergencyContactPhone}
                onChange={handleChange}
                placeholder="e.g. +91 98765 11111"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Medical Alert (Known Allergies) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-soft space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-rose-700 flex items-center gap-2 border-b border-slate-100 pb-3">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>3. Critical Alerts & Known Allergies</span>
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Known Drug & Food Allergies (or enter "None")
            </label>
            <input
              type="text"
              name="knownAllergies"
              value={formData.knownAllergies}
              onChange={handleChange}
              placeholder="e.g. Penicillin, Sulfa drugs, NSAIDs, Peanuts (or None reported)"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-rose-400 focus:ring-rose-400"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              This alert will be highlighted in bold red across all future case notes and prescription slips.
            </p>
          </div>
        </div>

        {/* Section 4: Privacy & DPDP Act Consent Banner */}
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-3xl p-6 border border-teal-200 space-y-3">
          <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            <span>Digital Personal Data Protection (DPDP) Act, 2023 Compliance</span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Personal and clinical health records collected herein will be processed strictly for diagnosis, medical treatment, emergency care, and prescription fulfillment. Health data is protected by role-based access control and audited against unauthorized disclosure.
          </p>

          <label className="flex items-start gap-3 pt-2 cursor-pointer">
            <input
              type="checkbox"
              name="consentGiven"
              checked={formData.consentGiven}
              onChange={handleChange}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-xs text-slate-800 font-semibold leading-snug">
              Patient / Legal Guardian has given informed consent for digital electronic health record keeping and processing at CuraPulse Clinic. <span className="text-rose-500">*</span>
            </span>
          </label>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            to="/patients"
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition disabled:opacity-50"
          >
            {submitting ? (
              <span>Registering patient...</span>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Complete Registration & Create UHID</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
