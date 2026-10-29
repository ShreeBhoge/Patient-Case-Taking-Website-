import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  ClipboardList,
  FileDown,
  AlertTriangle,
  Heart,
  ChevronDown,
  ChevronUp,
  Activity,
  PlusCircle,
  ShieldAlert,
  ArrowLeft,
  CheckCircle,
  FileText,
  Lock,
} from 'lucide-react';

export const PatientDetail = () => {
  const { id } = useParams();
  const { isDoctor, isAdmin, isReceptionist, user } = useAuth();

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedVisits, setExpandedVisits] = useState({});

  // Appointment Modal state
  const [isApptModalOpen, setIsApptModalOpen] = useState(false);
  const [apptForm, setApptForm] = useState({
    appointmentDate: new Date().toISOString().split('T')[0],
    timeSlot: '10:00 AM',
    reason: 'Follow-up Consultation',
    notes: '',
  });
  const [bookingAppt, setBookingAppt] = useState(false);

  const fetchPatient = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/patients/${id}`);
      if (!res.ok) throw new Error('Failed to load patient record');
      const data = await res.json();
      setPatient(data);

      // Auto expand the first visit by default if any
      if (data.visits && data.visits.length > 0) {
        setExpandedVisits({ [data.visits[0].id]: true });
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatient();
  }, [id, user?.role]); // Re-fetch if role switches in demo bar!

  const toggleVisit = (visitId) => {
    setExpandedVisits((prev) => ({
      ...prev,
      [visitId]: !prev[visitId],
    }));
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    try {
      setBookingAppt(true);
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: id,
          doctorId: user?.role === 'DOCTOR' ? user.id : undefined,
          ...apptForm,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to book appointment');
      }

      setIsApptModalOpen(false);
      fetchPatient(); // Refresh appointments list
    } catch (err) {
      alert(err.message);
    } finally {
      setBookingAppt(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Retrieving patient health record...</p>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Patient Record Not Found</h2>
        <p className="text-sm text-slate-500 mt-1">{error || 'The requested patient profile does not exist.'}</p>
        <Link
          to="/patients"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white font-semibold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Patients Directory</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Navigation & Header */}
      <div>
        <Link
          to="/patients"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Patients List</span>
        </Link>

        {/* Patient Demographics Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-card">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-600 to-mint-500 text-white flex items-center justify-center text-xl font-extrabold shadow-md flex-shrink-0">
                {patient.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{patient.name}</h1>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-teal-50 text-teal-700 border border-teal-200">
                    {patient.uhid}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                    {patient.age} yrs • {patient.gender}
                  </span>
                  {patient.bloodGroup && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100 flex items-center gap-1">
                      <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                      <span>{patient.bloodGroup}</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 mt-1 flex items-center gap-4 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <strong>{patient.phone}</strong>
                  </span>
                  {patient.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {patient.email}
                    </span>
                  )}
                  {patient.idNumber && (
                    <span className="text-slate-400">
                      ID: <span className="font-mono text-slate-600">{patient.idNumber}</span>
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setIsApptModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-teal-600 text-teal-700 hover:bg-teal-50 font-bold text-xs transition"
              >
                <Calendar className="w-4 h-4" />
                <span>Book Appointment</span>
              </button>

              {(isDoctor || isAdmin) && (
                <Link
                  to={`/cases/new?patientId=${patient.id}`}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>New Visit / Case Sheet</span>
                </Link>
              )}
            </div>
          </div>

          {/* Demographics details row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-5 text-xs">
            <div>
              <p className="text-slate-400 font-medium">Residential Address</p>
              <p className="text-slate-800 font-semibold mt-0.5">{patient.address || 'Not Provided'}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Emergency Contact</p>
              <p className="text-slate-800 font-semibold mt-0.5">
                {patient.emergencyContactName || 'None'}{' '}
                {patient.emergencyContactPhone && `(${patient.emergencyContactPhone})`}
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">DPDP Consent</p>
              <p className="text-emerald-700 font-bold mt-0.5 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Consent Recorded</span>
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Registered Since</p>
              <p className="text-slate-800 font-semibold mt-0.5">
                {new Date(patient.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Known Allergies Warning */}
          {patient.knownAllergies && (
            <div className="mt-5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>
                <strong>CRITICAL MEDICAL ALLERGY:</strong> {patient.knownAllergies}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Clinical Case Visits Timeline */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-teal-600" />
            <span>Clinical Case Sheet & Visit Timeline</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
              {patient.visits?.length || 0}
            </span>
          </h2>

          {(isDoctor || isAdmin) && (
            <Link
              to={`/cases/new?patientId=${patient.id}`}
              className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              <span>+ Add Consultation</span>
            </Link>
          )}
        </div>

        {/* Receptionist Privacy Restriction Notice */}
        {patient.clinicalAccessRestricted && (
          <div className="bg-sky-50 border border-sky-200 rounded-3xl p-6 text-sky-900 flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Protected Clinical Records (DPDP Guarded)</h3>
              <p className="text-xs text-sky-800/90 mt-1 leading-relaxed">
                As a front desk receptionist, clinical notes, past illness details, physical examination findings, and prescription records are restricted. You can view the visit timestamps and manage patient registration and appointments.
              </p>
            </div>
          </div>
        )}

        {/* Visits Accordion / Timeline */}
        {(!patient.visits || patient.visits.length === 0) ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
            <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No clinical visits recorded yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Start by recording the first consultation case taking form for this patient.
            </p>
            {(isDoctor || isAdmin) && (
              <Link
                to={`/cases/new?patientId=${patient.id}`}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Record Initial Case Note</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {patient.visits.map((visit, index) => {
              const isExpanded = expandedVisits[visit.id];
              const visitDate = new Date(visit.visitDate).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              });

              return (
                <div
                  key={visit.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-soft overflow-hidden transition-all duration-200"
                >
                  {/* Visit Summary Header */}
                  <div
                    onClick={() => toggleVisit(visit.id)}
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/70 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 font-bold flex flex-col items-center justify-center text-xs flex-shrink-0">
                        <span>#{patient.visits.length - index}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-slate-900">
                            Visit on {visitDate}
                          </span>
                          {visit.template && (
                            <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                              {visit.template.name || visit.template}
                            </span>
                          )}
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                            {visit.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Attending: Dr. {visit.doctor?.name || 'Physician'}
                          {visit.provisionalDiagnosis && (
                            <span> • <strong className="text-slate-700">{visit.provisionalDiagnosis}</strong></span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {(isDoctor || isAdmin) && (
                        <a
                          href={`/api/export/visit/${visit.id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold border border-teal-200/60 transition"
                          title="Download professional printable PDF case sheet"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                          <span>PDF Prescription</span>
                        </a>
                      )}

                      <button className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Clinical Content (Only Doctors/Admins) */}
                  {isExpanded && !patient.clinicalAccessRestricted && (
                    <div className="px-6 pb-6 pt-2 border-t border-slate-100 space-y-5 animate-fade-in text-sm">
                      {/* Vitals Ribbon */}
                      {(visit.bpSystolic || visit.pulse || visit.temperature || visit.weight || visit.height || visit.spo2) && (
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-wrap gap-4 text-xs">
                          {visit.bpSystolic && visit.bpDiastolic && (
                            <div>
                              <span className="text-slate-400 block font-medium">Blood Pressure</span>
                              <span className="font-bold text-slate-900">{visit.bpSystolic}/{visit.bpDiastolic} mmHg</span>
                            </div>
                          )}
                          {visit.pulse && (
                            <div>
                              <span className="text-slate-400 block font-medium">Pulse Rate</span>
                              <span className="font-bold text-slate-900">{visit.pulse} bpm</span>
                            </div>
                          )}
                          {visit.temperature && (
                            <div>
                              <span className="text-slate-400 block font-medium">Temperature</span>
                              <span className="font-bold text-slate-900">{visit.temperature} °F</span>
                            </div>
                          )}
                          {visit.weight && (
                            <div>
                              <span className="text-slate-400 block font-medium">Weight</span>
                              <span className="font-bold text-slate-900">{visit.weight} kg</span>
                            </div>
                          )}
                          {visit.height && (
                            <div>
                              <span className="text-slate-400 block font-medium">Height</span>
                              <span className="font-bold text-slate-900">{visit.height} cm</span>
                            </div>
                          )}
                          {visit.bmi && (
                            <div>
                              <span className="text-slate-400 block font-medium">BMI</span>
                              <span className="font-bold text-teal-700">
                                {visit.bmi} ({visit.bmiCategory || 'Normal'})
                              </span>
                            </div>
                          )}
                          {visit.spo2 && (
                            <div>
                              <span className="text-slate-400 block font-medium">SpO2</span>
                              <span className="font-bold text-slate-900">{visit.spo2}%</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Chief Complaints & HPI */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-slate-200">
                          <h4 className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-2">
                            Chief Complaints
                          </h4>
                          <p className="text-xs text-slate-800 leading-relaxed">
                            {visit.chiefComplaints}
                            {visit.duration && <span className="text-slate-500"> ({visit.duration})</span>}
                          </p>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-slate-200">
                          <h4 className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-2">
                            History of Present Illness (HPI)
                          </h4>
                          <p className="text-xs text-slate-800 leading-relaxed">
                            {visit.hpi || 'None recorded'}
                          </p>
                        </div>
                      </div>

                      {/* Past, Family & Lifestyle */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                          <span className="font-bold text-slate-700 block mb-1">Past History:</span>
                          <span className="text-slate-600">{visit.pastHistory || 'Nil'}</span>
                        </div>
                        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                          <span className="font-bold text-slate-700 block mb-1">Family History:</span>
                          <span className="text-slate-600">{visit.familyHistory || 'Nil'}</span>
                        </div>
                        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                          <span className="font-bold text-slate-700 block mb-1">Current Medications:</span>
                          <span className="text-slate-600">{visit.currentMedications || 'Nil'}</span>
                        </div>
                      </div>

                      {/* Clinical Examination Findings */}
                      {visit.clinicalFindings && (
                        <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                            Physical & Systemic Findings
                          </h4>
                          <p className="text-xs text-slate-700 leading-relaxed">{visit.clinicalFindings}</p>
                        </div>
                      )}

                      {/* Diagnosis Box */}
                      <div className="p-4 rounded-2xl bg-teal-50/80 border border-teal-200 flex items-start gap-3">
                        <Activity className="w-5 h-5 text-teal-700 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-bold text-teal-900 uppercase tracking-wider">
                            Provisional Diagnosis
                          </span>
                          <p className="text-sm font-bold text-teal-950 mt-0.5">
                            {visit.provisionalDiagnosis}
                          </p>
                        </div>
                      </div>

                      {/* Prescriptions Table */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-teal-600" />
                          <span>Prescription (Rx)</span>
                        </h4>

                        {(!visit.prescriptions || visit.prescriptions.length === 0) ? (
                          <p className="text-xs text-slate-400 italic">No medicines prescribed for this visit.</p>
                        ) : (
                          <div className="border border-slate-200 rounded-2xl overflow-hidden">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                                <tr>
                                  <th className="py-2.5 px-3">#</th>
                                  <th className="py-2.5 px-3">Medicine Name</th>
                                  <th className="py-2.5 px-3">Dosage</th>
                                  <th className="py-2.5 px-3">Frequency</th>
                                  <th className="py-2.5 px-3">Duration</th>
                                  <th className="py-2.5 px-3">Instructions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {visit.prescriptions.map((rx, rxIndex) => (
                                  <tr key={rx.id || rxIndex} className="hover:bg-slate-50/60">
                                    <td className="py-2 px-3 text-slate-400">{rxIndex + 1}</td>
                                    <td className="py-2 px-3 font-bold text-slate-900">{rx.medicineName}</td>
                                    <td className="py-2 px-3 text-slate-700">{rx.dosage || '-'}</td>
                                    <td className="py-2 px-3 text-slate-700">{rx.frequency || '-'}</td>
                                    <td className="py-2 px-3 text-slate-700">{rx.duration || '-'}</td>
                                    <td className="py-2 px-3 text-slate-600 italic">{rx.instructions || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Tests, Advice & Follow-up */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                        {visit.testsOrdered && (
                          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60">
                            <span className="font-bold text-amber-900 block mb-1">Investigations Ordered:</span>
                            <span className="text-slate-800">{visit.testsOrdered}</span>
                          </div>
                        )}

                        {visit.advice && (
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="font-bold text-slate-800 block mb-1">Lifestyle & Dietary Advice:</span>
                            <span className="text-slate-700">{visit.advice}</span>
                          </div>
                        )}
                      </div>

                      {visit.followUpDate && (
                        <div className="p-3 bg-mint-50/80 rounded-xl border border-mint-200 text-xs text-mint-950 flex items-center justify-between">
                          <span>
                            <strong>Next Scheduled Follow-up:</strong> {visit.followUpDate}
                            {visit.followUpNotes && ` (${visit.followUpNotes})`}
                          </span>
                        </div>
                      )}

                      {/* PDF Export action inside expanded card */}
                      <div className="pt-2 flex justify-end">
                        <a
                          href={`/api/export/visit/${visit.id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                          <span>Download / Print Prescription PDF</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Book Appointment Modal */}
      <Modal
        isOpen={isApptModalOpen}
        onClose={() => setIsApptModalOpen(false)}
        title={`Book Appointment for ${patient.name}`}
      >
        <form onSubmit={handleBookAppointment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Appointment Date</label>
            <input
              type="date"
              required
              value={apptForm.appointmentDate}
              onChange={(e) => setApptForm({ ...apptForm, appointmentDate: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Time Slot</label>
            <select
              value={apptForm.timeSlot}
              onChange={(e) => setApptForm({ ...apptForm, timeSlot: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            >
              <option value="09:00 AM">09:00 AM</option>
              <option value="09:30 AM">09:30 AM</option>
              <option value="10:00 AM">10:00 AM</option>
              <option value="10:30 AM">10:30 AM</option>
              <option value="11:00 AM">11:00 AM</option>
              <option value="11:30 AM">11:30 AM</option>
              <option value="02:00 PM">02:00 PM</option>
              <option value="02:30 PM">02:30 PM</option>
              <option value="03:00 PM">03:00 PM</option>
              <option value="04:00 PM">04:00 PM</option>
              <option value="05:00 PM">05:00 PM</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / Symptoms</label>
            <input
              type="text"
              value={apptForm.reason}
              onChange={(e) => setApptForm({ ...apptForm, reason: e.target.value })}
              placeholder="e.g. Routine consultation or Blood report review"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Internal Notes</label>
            <textarea
              rows="2"
              value={apptForm.notes}
              onChange={(e) => setApptForm({ ...apptForm, notes: e.target.value })}
              placeholder="Any special instructions for doctor or patient"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsApptModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={bookingAppt}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition disabled:opacity-50"
            >
              {bookingAppt ? 'Booking...' : 'Confirm Appointment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
