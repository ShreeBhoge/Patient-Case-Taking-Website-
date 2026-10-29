import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Calendar,
  Activity,
  Clock,
  UserPlus,
  ClipboardList,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Stethoscope,
  ChevronRight,
  Phone,
  FileText,
} from 'lucide-react';

export const Dashboard = () => {
  const { user, isDoctor, isAdmin, isReceptionist } = useAuth();
  const [stats, setStats] = useState(null);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const todayStr = new Date().toISOString().split('T')[0];

      const [statsRes, apptsRes] = await Promise.all([
        fetch('/api/patients/stats/dashboard'),
        fetch(`/api/appointments?date=${todayStr}`),
      ]);

      if (!statsRes.ok) throw new Error('Failed to load clinic statistics');
      const statsData = await statsRes.json();
      setStats(statsData);

      if (apptsRes.ok) {
        const apptsData = await apptsRes.json();
        setTodayAppointments(apptsData);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setTodayAppointments((prev) =>
          prev.map((a) => (a.id === appointmentId ? { ...a, status: newStatus } : a))
        );
      }
    } catch (err) {
      console.error('Failed to update appointment status:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading clinic dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-mint-300 text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-mint-400 animate-pulse" />
            <span>Clinic Operational Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back, {user?.name}
          </h1>
          <p className="text-sm text-teal-100/90 mt-1 max-w-xl">
            {isDoctor
              ? 'Review today\'s patient queue, capture case histories, and issue digital prescriptions.'
              : isReceptionist
              ? 'Register arriving patients, manage appointments, and organize the daily clinic schedule.'
              : 'Overview of all clinic clinical workflows, specialty templates, staff users, and audit trails.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            to="/patients/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-mint-500 hover:bg-mint-400 text-teal-950 font-bold text-sm shadow-md transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>New Patient</span>
          </Link>

          {(isDoctor || isAdmin) && (
            <Link
              to="/cases/new"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm backdrop-blur-sm transition"
            >
              <ClipboardList className="w-4 h-4 text-mint-300" />
              <span>Record Case Note</span>
            </Link>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Patients</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats?.totalPatients || 0}</p>
            <p className="text-[11px] text-teal-600 font-medium mt-1">Permanent health records</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Visits This Week</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats?.visitsThisWeek || 0}</p>
            <p className="text-[11px] text-mint-600 font-medium mt-1">Recorded consultations</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-mint-50 text-mint-600 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Appointments</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats?.todayAppointments || 0}</p>
            <p className="text-[11px] text-sky-600 font-medium mt-1">Scheduled for today</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Follow-ups Due</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats?.pendingFollowUps || 0}</p>
            <p className="text-[11px] text-amber-600 font-medium mt-1">Upcoming patient reviews</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Two-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2/3): Today's Appointments Queue */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-600" />
                <h2 className="text-lg font-bold text-slate-900">Today's Appointment Queue</h2>
              </div>
              <Link
                to="/appointments"
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
              >
                <span>View Full Schedule</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {todayAppointments.length === 0 ? (
              <div className="text-center py-10 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No appointments scheduled for today</p>
                <p className="text-xs text-slate-400 mt-1">Book an appointment from the schedule tab</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {todayAppointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 rounded-xl px-2.5 transition"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 font-bold flex flex-col items-center justify-center flex-shrink-0 text-[11px] leading-tight">
                        <Clock className="w-3.5 h-3.5 mb-0.5 text-teal-600" />
                        <span>{appt.timeSlot}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            to={`/patients/${appt.patient?.id}`}
                            className="font-bold text-slate-900 hover:text-teal-600 transition text-sm"
                          >
                            {appt.patient?.name}
                          </Link>
                          <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono">
                            {appt.patient?.uhid}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {appt.reason || 'General Follow-up'} • Dr. {appt.doctor?.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          appt.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : appt.status === 'CANCELLED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {appt.status}
                      </span>

                      {/* Status toggle for staff */}
                      {appt.status !== 'COMPLETED' && (
                        <button
                          onClick={() => handleStatusChange(appt.id, 'COMPLETED')}
                          className="text-xs px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-medium transition"
                          title="Mark completed"
                        >
                          Complete
                        </button>
                      )}

                      {(isDoctor || isAdmin) && (
                        <Link
                          to={`/cases/new?patientId=${appt.patient?.id}`}
                          className="text-xs px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold transition"
                        >
                          Take Case
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Follow-ups (Doctors & Admins) */}
          {(isDoctor || isAdmin) && stats?.upcomingFollowUps && stats.upcomingFollowUps.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <h2 className="text-lg font-bold text-slate-900">Upcoming Patient Follow-ups</h2>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {stats.upcomingFollowUps.map((fu) => (
                  <div key={fu.id} className="py-3 flex items-center justify-between hover:bg-slate-50/50 px-2 rounded-xl">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        <Link to={`/patients/${fu.patient?.id}`} className="hover:text-teal-600">
                          {fu.patient?.name}
                        </Link>{' '}
                        <span className="text-xs font-normal text-slate-500 font-mono">({fu.patient?.uhid})</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        <strong className="text-slate-700">{fu.provisionalDiagnosis}</strong>
                        {fu.followUpNotes && ` • ${fu.followUpNotes}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-semibold border border-amber-200">
                        Due {fu.followUpDate}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (1/3): Recent Patients & Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-600" />
                <h2 className="text-base font-bold text-slate-900">Recently Added Patients</h2>
              </div>
              <Link
                to="/patients"
                className="text-xs font-semibold text-teal-600 hover:text-teal-700"
              >
                Search All
              </Link>
            </div>

            <div className="space-y-3">
              {(stats?.recentPatients || []).map((pt) => (
                <Link
                  key={pt.id}
                  to={`/patients/${pt.id}`}
                  className="p-3 rounded-2xl border border-slate-100 hover:border-teal-200 hover:bg-teal-50/30 flex items-center justify-between transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-teal-100 group-hover:text-teal-700 text-slate-700 font-bold flex items-center justify-center text-xs transition">
                      {pt.gender === 'Female' ? 'F' : 'M'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition">
                        {pt.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {pt.age} yrs • {pt.gender} • <span className="font-mono">{pt.uhid}</span>
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition" />
                </Link>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100">
              <Link
                to="/patients/new"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register Another Patient</span>
              </Link>
            </div>
          </div>

          {/* Clinic Guidelines & DPDP Safety Card */}
          <div className="bg-gradient-to-br from-slate-900 to-teal-950 rounded-3xl p-6 text-white shadow-soft">
            <div className="flex items-center gap-2 text-mint-400 font-semibold text-xs mb-2">
              <CheckCircle className="w-4 h-4" />
              <span>DPDP Act 2023 Compliant</span>
            </div>
            <h3 className="font-bold text-sm">Strict Health Privacy Enforced</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Patient clinical history and prescriptions are restricted to medical personnel. Front desk staff can only view demographics and appointment slots. Every record access is logged in the audit log.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
