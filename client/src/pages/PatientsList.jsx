import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Calendar,
  ChevronRight,
  ClipboardList,
  Phone,
  ShieldAlert,
  Clock,
  Lock,
} from 'lucide-react';

export const PatientsList = () => {
  const { isDoctor, isAdmin, isReceptionist } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [diagnosisFilter, setDiagnosisFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (query.trim()) params.append('query', query.trim());
      if (diagnosisFilter.trim() && (isDoctor || isAdmin)) params.append('diagnosis', diagnosisFilter.trim());
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await fetch(`/api/patients?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to search patients');
      const data = await res.json();
      setPatients(data.patients || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients();
    }, 250);
    return () => clearTimeout(timer);
  }, [query, diagnosisFilter, startDate, endDate]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-teal-600" />
            <span>Patient Registry & Health Records</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Instant search across medical records, demographic directory, and past visits.
          </p>
        </div>

        <Link
          to="/patients/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-md shadow-teal-600/20 transition self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Patient</span>
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-soft space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Main search input */}
          <div className="md:col-span-6 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by Patient Name, Phone, UHID, or National ID..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white"
            />
          </div>

          {/* Diagnosis Filter (Doctors/Admins only) */}
          {(isDoctor || isAdmin) && (
            <div className="md:col-span-3">
              <input
                type="text"
                value={diagnosisFilter}
                onChange={(e) => setDiagnosisFilter(e.target.value)}
                placeholder="Filter by diagnosis (e.g. Diabetes, Bronchitis)..."
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white"
              />
            </div>
          )}

          {/* Quick Clear */}
          <div className={`${isDoctor || isAdmin ? 'md:col-span-3' : 'md:col-span-6'} flex items-center justify-end gap-2`}>
            {(query || diagnosisFilter || startDate || endDate) && (
              <button
                onClick={() => {
                  setQuery('');
                  setDiagnosisFilter('');
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-xs text-slate-500 hover:text-red-600 px-3 py-2 rounded-lg font-medium"
              >
                Clear Filters
              </button>
            )}
            <span className="text-xs text-slate-500 font-medium bg-slate-100 px-3 py-2 rounded-lg">
              Showing <strong>{patients.length}</strong> of {total}
            </span>
          </div>
        </div>

        {isReceptionist && (
          <div className="flex items-center gap-2 text-xs text-sky-800 bg-sky-50 px-3 py-2 rounded-xl border border-sky-100">
            <Lock className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
            <span>
              <strong>Receptionist View:</strong> Clinical diagnoses and prescription notes are confidential and restricted to medical staff.
            </span>
          </div>
        )}
      </div>

      {/* Patients Table / List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-soft overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500">Searching patient database...</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="py-16 text-center px-4">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No patients found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
              No matching records found. Try modifying your search query or register a new patient.
            </p>
            <Link
              to="/patients/new"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Patient</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">UHID</th>
                  <th className="py-3.5 px-4">Patient Name</th>
                  <th className="py-3.5 px-4">Age / Gender</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Total Visits</th>
                  <th className="py-3.5 px-4">
                    {isDoctor || isAdmin ? 'Last Diagnosis & Doctor' : 'Last Visit'}
                  </th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {patients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition group">
                    {/* UHID */}
                    <td className="py-3 px-4 font-mono font-bold text-teal-700 text-xs">
                      {p.uhid}
                    </td>

                    {/* Name */}
                    <td className="py-3 px-4">
                      <Link
                        to={`/patients/${p.id}`}
                        className="font-bold text-slate-900 group-hover:text-teal-600 transition"
                      >
                        {p.name}
                      </Link>
                      {p.knownAllergies && (
                        <span className="block text-[10px] text-rose-600 font-medium">
                          ⚠️ Allergy: {p.knownAllergies.split(',')[0]}
                        </span>
                      )}
                    </td>

                    {/* Age / Gender */}
                    <td className="py-3 px-4 text-slate-600 text-xs">
                      {p.age} yrs • {p.gender}
                    </td>

                    {/* Phone */}
                    <td className="py-3 px-4 text-slate-600 font-mono text-xs">
                      {p.phone}
                    </td>

                    {/* Visits count */}
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        {p.totalVisits} {p.totalVisits === 1 ? 'visit' : 'visits'}
                      </span>
                    </td>

                    {/* Last Diagnosis / Visit */}
                    <td className="py-3 px-4 text-xs">
                      {isDoctor || isAdmin ? (
                        p.lastDiagnosis ? (
                          <div>
                            <p className="font-semibold text-slate-800 truncate max-w-[200px]" title={p.lastDiagnosis}>
                              {p.lastDiagnosis}
                            </p>
                            <p className="text-[11px] text-slate-400">Dr. {p.lastDoctor || 'Staff'}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No visits recorded</span>
                        )
                      ) : (
                        <span className="text-slate-600">
                          {p.lastVisitDate ? new Date(p.lastVisitDate).toLocaleDateString() : 'None'}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right space-x-1">
                      <Link
                        to={`/patients/${p.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-50 text-teal-700 hover:bg-teal-100 transition"
                      >
                        <span>Profile</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>

                      {(isDoctor || isAdmin) && (
                        <Link
                          to={`/cases/new?patientId=${p.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 transition"
                          title="Record new clinical case"
                        >
                          <ClipboardList className="w-3 h-3" />
                          <span>Take Case</span>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
