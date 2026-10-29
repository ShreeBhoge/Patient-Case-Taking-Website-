import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ClipboardList,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Activity,
  Heart,
  Save,
  Clock,
  Sparkles,
  FileText,
  User,
  ShieldAlert,
} from 'lucide-react';

export const CaseTakingForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPatientId = searchParams.get('patientId') || '';
  const { user, isDoctor, isAdmin } = useAuth();

  // Redirect receptionist immediately if they somehow access this route directly
  useEffect(() => {
    if (!isDoctor && !isAdmin) {
      navigate('/patients');
    }
  }, [isDoctor, isAdmin, navigate]);

  const [patientsList, setPatientsList] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [activeTemplate, setActiveTemplate] = useState(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [lastAutosave, setLastAutosave] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Complaints & HPI
    chiefComplaints: '',
    duration: '',
    hpi: '',

    // Step 2: Past, Family, Lifestyle
    pastHistory: '',
    familyHistory: '',
    currentMedications: '',
    allergies: '',
    lifestyleDiet: '',
    lifestyleSleep: '',
    lifestyleHabits: '',

    // Step 3: Vitals & Exam
    bpSystolic: '',
    bpDiastolic: '',
    pulse: '',
    temperature: '',
    weight: '',
    height: '',
    bmi: null,
    bmiCategory: null,
    spo2: '',
    clinicalFindings: '',

    // Step 4: Specialty Custom Fields
    customFields: {},

    // Step 5: Diagnosis, Rx, Follow-up
    provisionalDiagnosis: '',
    testsOrdered: '',
    advice: '',
    followUpDate: '',
    followUpNotes: '',
    prescriptions: [
      {
        medicineName: '',
        dosage: '1 tablet',
        frequency: '1-0-1 (Twice daily after food)',
        duration: '5 days',
        instructions: 'Take after meals with water',
      },
    ],
  });

  // Calculate BMI on the fly
  useEffect(() => {
    const w = parseFloat(formData.weight);
    const h = parseFloat(formData.height);
    if (w > 0 && h > 0) {
      const hM = h / 100;
      const calculatedBmi = parseFloat((w / (hM * hM)).toFixed(2));
      let cat = 'Normal';
      if (calculatedBmi < 18.5) cat = 'Underweight';
      else if (calculatedBmi >= 18.5 && calculatedBmi < 24.9) cat = 'Normal';
      else if (calculatedBmi >= 25.0 && calculatedBmi < 29.9) cat = 'Overweight';
      else cat = 'Obese';

      setFormData((prev) => ({
        ...prev,
        bmi: calculatedBmi,
        bmiCategory: cat,
      }));
    } else {
      setFormData((prev) => ({ ...prev, bmi: null, bmiCategory: null }));
    }
  }, [formData.weight, formData.height]);

  // Load patients and specialty templates on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [patRes, tempRes] = await Promise.all([
          fetch('/api/patients?limit=100'),
          fetch('/api/templates'),
        ]);

        if (patRes.ok) {
          const patData = await patRes.json();
          setPatientsList(patData.patients || []);
          if (initialPatientId) {
            const found = (patData.patients || []).find((p) => p.id === initialPatientId);
            if (found) {
              setSelectedPatient(found);
              setFormData((prev) => ({
                ...prev,
                allergies: found.knownAllergies || '',
              }));
            }
          }
        }

        if (tempRes.ok) {
          const temps = await tempRes.json();
          setTemplates(temps);
          const defaultTemp = temps.find((t) => t.isDefault) || temps[0];
          if (defaultTemp) {
            setSelectedTemplateId(defaultTemp.id);
            setActiveTemplate(defaultTemp);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadInitialData();
  }, [initialPatientId]);

  // When patient selection changes
  const handlePatientSelect = (patId) => {
    setSelectedPatientId(patId);
    const pat = patientsList.find((p) => p.id === patId);
    setSelectedPatient(pat);
    if (pat?.knownAllergies) {
      setFormData((prev) => ({ ...prev, allergies: pat.knownAllergies }));
    }

    // Check localStorage for autosaved draft
    const draftKey = `draft_case_${patId}`;
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setFormData(parsed);
        setLastAutosave('Restored draft from browser storage');
      } catch (e) {}
    }
  };

  // When specialty template changes
  const handleTemplateChange = (tmplId) => {
    setSelectedTemplateId(tmplId);
    const tmpl = templates.find((t) => t.id === tmplId);
    setActiveTemplate(tmpl);
  };

  // Autosave to localStorage on step changes
  useEffect(() => {
    if (selectedPatientId && formData.chiefComplaints) {
      const draftKey = `draft_case_${selectedPatientId}`;
      localStorage.setItem(draftKey, JSON.stringify(formData));
      setLastAutosave(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
  }, [currentStep, formData.chiefComplaints, selectedPatientId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCustomFieldChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      customFields: {
        ...prev.customFields,
        [key]: value,
      },
    }));
  };

  // Prescription Rows Helpers
  const addPrescriptionRow = () => {
    setFormData((prev) => ({
      ...prev,
      prescriptions: [
        ...prev.prescriptions,
        {
          medicineName: '',
          dosage: '1 tablet',
          frequency: '1-0-1 (Twice daily after food)',
          duration: '5 days',
          instructions: 'Take after meals with water',
        },
      ],
    }));
  };

  const removePrescriptionRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      prescriptions: prev.prescriptions.filter((_, i) => i !== index),
    }));
  };

  const handlePrescriptionChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.prescriptions];
      updated[index][field] = value;
      return { ...prev, prescriptions: updated };
    });
  };

  // Submit visit
  const handleSaveVisit = async (status = 'COMPLETED') => {
    setErrorMsg('');

    if (!selectedPatientId) {
      setErrorMsg('Please select a patient before saving the case sheet.');
      setCurrentStep(1);
      return;
    }

    if (!formData.chiefComplaints.trim()) {
      setErrorMsg('Chief complaints are mandatory.');
      setCurrentStep(1);
      return;
    }

    if (status === 'COMPLETED' && !formData.provisionalDiagnosis.trim()) {
      setErrorMsg('Provisional diagnosis is required before completing consultation.');
      setCurrentStep(5);
      return;
    }

    try {
      setSaving(true);
      const payload = {
        patientId: selectedPatientId,
        templateId: selectedTemplateId || null,
        ...formData,
        status,
      };

      const res = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save clinical visit');
      }

      // Clear local draft
      localStorage.removeItem(`draft_case_${selectedPatientId}`);

      // Direct to patient profile
      navigate(`/patients/${selectedPatientId}`);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { num: 1, label: 'Complaints & HPI' },
    { num: 2, label: 'Past & Lifestyle' },
    { num: 3, label: 'Vitals & Exam' },
    { num: 4, label: 'Specialty Details' },
    { num: 5, label: 'Diagnosis & Rx' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <Link
            to={selectedPatientId ? `/patients/${selectedPatientId}` : '/patients'}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel & Back</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-teal-600" />
            <span>Structured Case Taking Form</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Attending Physician: <strong>{user?.name}</strong> • Electronic OPD Consultation
          </p>
        </div>

        {/* Autosave Status */}
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
          {lastAutosave && (
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3 text-teal-600" />
              <span>Autosaved: {lastAutosave}</span>
            </span>
          )}
          <button
            onClick={() => handleSaveVisit('DRAFT')}
            disabled={saving || !selectedPatientId}
            className="px-3.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 font-semibold text-slate-700 transition disabled:opacity-50"
          >
            Save Draft
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Patient & Specialty Template Selection Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-soft grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Patient Picker */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Select Patient <span className="text-rose-500">*</span>
          </label>
          <select
            value={selectedPatientId}
            onChange={(e) => handlePatientSelect(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
          >
            <option value="">-- Choose Patient from Registry --</option>
            {patientsList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.uhid}) - {p.age}y/{p.gender} - {p.phone}
              </option>
            ))}
          </select>

          {selectedPatient && (
            <div className="mt-2 text-xs text-slate-600 flex items-center gap-3">
              <span>Age/Gender: <strong>{selectedPatient.age}y / {selectedPatient.gender}</strong></span>
              {selectedPatient.knownAllergies && (
                <span className="text-rose-600 font-bold">
                  ⚠️ Allergy: {selectedPatient.knownAllergies}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Specialty Template Picker */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Specialty Case Template</span>
            <span className="text-[10px] text-teal-600 font-normal">Customizes clinical fields</span>
          </label>
          <select
            value={selectedTemplateId}
            onChange={(e) => handleTemplateChange(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.specialty}) {t.isDefault ? '• Default' : ''}
              </option>
            ))}
          </select>
          {activeTemplate?.description && (
            <p className="mt-2 text-[11px] text-slate-500 italic">
              {activeTemplate.description}
            </p>
          )}
        </div>
      </div>

      {/* Step Indicator Tabs */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-soft flex items-center justify-between overflow-x-auto gap-1">
        {steps.map((st) => (
          <button
            key={st.num}
            onClick={() => setCurrentStep(st.num)}
            className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              currentStep === st.num
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              currentStep === st.num ? 'bg-white text-teal-700' : 'bg-slate-200 text-slate-700'
            }`}>
              {st.num}
            </span>
            <span className="truncate">{st.label}</span>
          </button>
        ))}
      </div>

      {/* Multi-Step Content */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card">
        {/* STEP 1: Chief Complaints & HPI */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Step 1: Chief Complaints & Present Illness</h2>
              <p className="text-xs text-slate-500 mt-0.5">Primary reason for seeking medical consultation and chronological progression.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chief Complaints <span className="text-rose-500">*</span>
                </label>
                <textarea
                  name="chiefComplaints"
                  rows="3"
                  required
                  value={formData.chiefComplaints}
                  onChange={handleChange}
                  placeholder="e.g. Dry cough, sore throat, and low grade fever"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Duration of Symptoms
                </label>
                <input
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  placeholder="e.g. 4 days or 2 weeks"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                History of Present Illness (HPI)
              </label>
              <textarea
                name="hpi"
                rows="4"
                value={formData.hpi}
                onChange={handleChange}
                placeholder="Onset, character, severity, progression, aggravating and relieving factors, associated symptoms..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>
        )}

        {/* STEP 2: Past History, Family, Lifestyle */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Step 2: Medical History, Medications & Lifestyle</h2>
              <p className="text-xs text-slate-500 mt-0.5">Comprehensive background on comorbidities, family risk factors, and habits.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Past Medical & Surgical History
                </label>
                <textarea
                  name="pastHistory"
                  rows="3"
                  value={formData.pastHistory}
                  onChange={handleChange}
                  placeholder="Hypertension, DM, asthma, prior surgeries, hospital admissions..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Family Medical History
                </label>
                <textarea
                  name="familyHistory"
                  rows="3"
                  value={formData.familyHistory}
                  onChange={handleChange}
                  placeholder="Familial cardiac disease, diabetes, malignancies, allergies..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Regular Medications
                </label>
                <textarea
                  name="currentMedications"
                  rows="3"
                  value={formData.currentMedications}
                  onChange={handleChange}
                  placeholder="Drugs currently taken with dosage (e.g. Metformin 500mg, Telmisartan 40mg)..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 text-rose-700">
                  Known Allergies (Drugs, Food, Environmental)
                </label>
                <textarea
                  name="allergies"
                  rows="3"
                  value={formData.allergies}
                  onChange={handleChange}
                  placeholder="e.g. Penicillin, Sulfa drugs, Peanuts (or None)"
                  className="w-full px-3.5 py-2.5 bg-rose-50/50 border border-rose-200 rounded-xl text-sm"
                />
              </div>
            </div>

            {/* Lifestyle */}
            <div className="pt-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Lifestyle & Habits</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dietary Pattern</label>
                  <input
                    type="text"
                    name="lifestyleDiet"
                    value={formData.lifestyleDiet}
                    onChange={handleChange}
                    placeholder="e.g. Vegetarian, low salt"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sleep Pattern</label>
                  <input
                    type="text"
                    name="lifestyleSleep"
                    value={formData.lifestyleSleep}
                    onChange={handleChange}
                    placeholder="e.g. 7 hrs/night, sound sleep"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Habits & Addictions</label>
                  <input
                    type="text"
                    name="lifestyleHabits"
                    value={formData.lifestyleHabits}
                    onChange={handleChange}
                    placeholder="e.g. Non-smoker, occasional alcohol"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Examination and Vitals with Auto-BMI */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Step 3: Vitals & Clinical Examination</h2>
              <p className="text-xs text-slate-500 mt-0.5">Physical observations, hemodynamic vitals, and auto-computed Body Mass Index.</p>
            </div>

            {/* Vitals Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">BP Systolic</label>
                <div className="relative">
                  <input
                    type="number"
                    name="bpSystolic"
                    value={formData.bpSystolic}
                    onChange={handleChange}
                    placeholder="120"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                  />
                  <span className="absolute right-2.5 top-2.5 text-[10px] text-slate-400">mmHg</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">BP Diastolic</label>
                <div className="relative">
                  <input
                    type="number"
                    name="bpDiastolic"
                    value={formData.bpDiastolic}
                    onChange={handleChange}
                    placeholder="80"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                  />
                  <span className="absolute right-2.5 top-2.5 text-[10px] text-slate-400">mmHg</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Pulse Rate</label>
                <div className="relative">
                  <input
                    type="number"
                    name="pulse"
                    value={formData.pulse}
                    onChange={handleChange}
                    placeholder="72"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                  />
                  <span className="absolute right-2.5 top-2.5 text-[10px] text-slate-400">bpm</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Temperature</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    name="temperature"
                    value={formData.temperature}
                    onChange={handleChange}
                    placeholder="98.6"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                  />
                  <span className="absolute right-2.5 top-2.5 text-[10px] text-slate-400">°F</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Oxygen SpO2</label>
                <div className="relative">
                  <input
                    type="number"
                    name="spo2"
                    value={formData.spo2}
                    onChange={handleChange}
                    placeholder="99"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                  />
                  <span className="absolute right-2.5 top-2.5 text-[10px] text-slate-400">%</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="70.5"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                />
              </div>
            </div>

            {/* Height & Auto-BMI Strip */}
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-4 rounded-2xl border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="w-full sm:w-48">
                <label className="block text-[11px] font-bold text-teal-900 mb-1">Height (cm)</label>
                <input
                  type="number"
                  step="0.5"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  placeholder="172"
                  className="w-full px-3 py-2 bg-white border border-teal-300 rounded-xl text-sm font-bold"
                />
              </div>

              <div className="flex items-center gap-4">
                <div>
                  <span className="text-[11px] text-slate-500 font-bold block">Computed BMI</span>
                  <span className="text-xl font-extrabold text-teal-950">
                    {formData.bmi ? formData.bmi : '--'}
                  </span>
                </div>

                {formData.bmiCategory && (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    formData.bmiCategory === 'Normal' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                    formData.bmiCategory === 'Overweight' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                    formData.bmiCategory === 'Obese' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                    'bg-sky-100 text-sky-800 border border-sky-300'
                  }`}>
                    {formData.bmiCategory}
                  </span>
                )}
              </div>
            </div>

            {/* Free-text Clinical Findings */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinical Examination & Physical Findings
              </label>
              <textarea
                name="clinicalFindings"
                rows="4"
                value={formData.clinicalFindings}
                onChange={handleChange}
                placeholder="General appearance, pallor/icterus, chest auscultation, cardiovascular sounds, abdominal palpation, local inspection..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>
        )}

        {/* STEP 4: Specialty Custom Fields */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                Step 4: Specialty Assessment ({activeTemplate?.name || 'General Medicine'})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Specialized parameters defined for {activeTemplate?.specialty || 'General'} practice.
              </p>
            </div>

            {activeTemplate?.fieldsConfig?.customFields && activeTemplate.fieldsConfig.customFields.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeTemplate.fieldsConfig.customFields.map((field) => (
                  <div key={field.key} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {field.label}
                    </label>

                    {field.type === 'select' ? (
                      <select
                        value={formData.customFields[field.key] || ''}
                        onChange={(e) => handleCustomFieldChange(field.key, e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                      >
                        <option value="">-- Select {field.label} --</option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        rows="3"
                        value={formData.customFields[field.key] || ''}
                        onChange={(e) => handleCustomFieldChange(field.key, e.target.value)}
                        placeholder={field.placeholder || ''}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                      />
                    ) : (
                      <input
                        type={field.type || 'text'}
                        value={formData.customFields[field.key] || ''}
                        onChange={(e) => handleCustomFieldChange(field.key, e.target.value)}
                        placeholder={field.placeholder || ''}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                No specialty-specific custom fields configured for this template. You can proceed to the Diagnosis & Treatment step.
              </div>
            )}
          </div>
        )}

        {/* STEP 5: Diagnosis, Prescriptions, Follow-up */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Step 5: Diagnosis, Prescription (Rx) & Advice</h2>
              <p className="text-xs text-slate-500 mt-0.5">Final clinical diagnosis, prescription dosage rows, lab orders, and follow-up plan.</p>
            </div>

            {/* Provisional Diagnosis */}
            <div>
              <label className="block text-xs font-bold text-teal-800 uppercase tracking-wider mb-1">
                Provisional Diagnosis <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="provisionalDiagnosis"
                required
                value={formData.provisionalDiagnosis}
                onChange={handleChange}
                placeholder="e.g. Type 2 Diabetes Mellitus with Essential Hypertension"
                className="w-full px-4 py-3 bg-teal-50/60 border border-teal-300 rounded-2xl text-sm font-bold text-teal-950 focus:bg-white"
              />
            </div>

            {/* Prescription Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-teal-600" />
                  <span>Prescription (Rx) Medications</span>
                </label>
                <button
                  type="button"
                  onClick={addPrescriptionRow}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Medicine Row</span>
                </button>
              </div>

              <div className="space-y-3">
                {formData.prescriptions.map((rx, index) => (
                  <div
                    key={index}
                    className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
                  >
                    <div className="sm:col-span-4">
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Medicine & Strength</label>
                      <input
                        type="text"
                        value={rx.medicineName}
                        onChange={(e) => handlePrescriptionChange(index, 'medicineName', e.target.value)}
                        placeholder="e.g. Tab. Paracetamol 650mg"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Dosage</label>
                      <input
                        type="text"
                        value={rx.dosage}
                        onChange={(e) => handlePrescriptionChange(index, 'dosage', e.target.value)}
                        placeholder="1 tablet"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Frequency</label>
                      <input
                        type="text"
                        value={rx.frequency}
                        onChange={(e) => handlePrescriptionChange(index, 'frequency', e.target.value)}
                        placeholder="1-0-1 (BD)"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Duration</label>
                      <input
                        type="text"
                        value={rx.duration}
                        onChange={(e) => handlePrescriptionChange(index, 'duration', e.target.value)}
                        placeholder="5 days"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                      />
                    </div>

                    <div className="sm:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removePrescriptionRow(index)}
                        disabled={formData.prescriptions.length === 1}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition disabled:opacity-30"
                        title="Remove row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="sm:col-span-12">
                      <input
                        type="text"
                        value={rx.instructions}
                        onChange={(e) => handlePrescriptionChange(index, 'instructions', e.target.value)}
                        placeholder="Instructions (e.g. Take immediately after meals with warm water)"
                        className="w-full px-3 py-1 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-600 italic"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tests & Advice */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tests & Lab Investigations Ordered
                </label>
                <textarea
                  name="testsOrdered"
                  rows="2"
                  value={formData.testsOrdered}
                  onChange={handleChange}
                  placeholder="e.g. CBC, Fasting Blood Sugar, HbA1c, Knee X-Ray..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  General Dietary & Lifestyle Advice
                </label>
                <textarea
                  name="advice"
                  rows="2"
                  value={formData.advice}
                  onChange={handleChange}
                  placeholder="e.g. Avoid cold fluids, walk 30 mins daily, steam inhalation BD..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>

            {/* Follow-up Section */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-amber-900 mb-1">Next Follow-up Date</label>
                <input
                  type="date"
                  name="followUpDate"
                  value={formData.followUpDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-amber-900 mb-1">Follow-up Notes / Targets</label>
                <input
                  type="text"
                  name="followUpNotes"
                  value={formData.followUpNotes}
                  onChange={handleChange}
                  placeholder="e.g. Review with fasting sugar and lipid profile reports"
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step Navigation Controls */}
        <div className="flex items-center justify-between pt-8 border-t border-slate-100 mt-6">
          <button
            type="button"
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-40"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous Step</span>
          </button>

          <div className="flex items-center gap-3">
            {currentStep < 5 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.min(5, prev + 1))}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-sm"
              >
                <span>Next Step</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSaveVisit('COMPLETED')}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-mint-500 hover:bg-mint-400 text-teal-950 text-sm font-extrabold shadow-md transition disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{saving ? 'Generating...' : 'Complete & Generate Prescription'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
