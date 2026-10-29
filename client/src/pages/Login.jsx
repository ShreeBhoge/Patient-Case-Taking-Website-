import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  Shield,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('doctor@clinic.com');
  const [password, setPassword] = useState('Doctor@123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const user = await login(email, password);
      // Role-aware redirect
      if (user.role === 'ADMIN') {
        navigate('/');
      } else if (user.role === 'DOCTOR') {
        navigate('/');
      } else {
        navigate('/patients');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (roleEmail, rolePass) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-slate-50 to-emerald-50/40 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-600/30 mb-4">
          <Activity className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Cura<span className="text-teal-600">Pulse</span> Clinic
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Electronic Medical Records & Structured Patient Case Taking
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-card rounded-3xl border border-slate-100">
          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Staff Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@clinic.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Secure Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 shadow-md shadow-teal-600/25 transition disabled:opacity-50"
            >
              {loading ? (
                <span>Verifying credentials...</span>
              ) : (
                <>
                  <span>Sign In to Clinic Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>1-Click Demo Accounts (Click to Fill)</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('doctor@clinic.com', 'Doctor@123')}
                className="p-2.5 text-left border rounded-xl hover:border-teal-500 hover:bg-teal-50/50 transition group"
              >
                <div className="flex items-center gap-1 text-xs font-semibold text-teal-800 group-hover:text-teal-900">
                  <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                  <span>Doctor</span>
                </div>
                <p className="text-[10px] text-slate-600 mt-1 leading-tight">Full clinical access</p>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('reception@clinic.com', 'Reception@123')}
                className="p-2.5 text-left border rounded-xl hover:border-sky-500 hover:bg-sky-50/50 transition group"
              >
                <div className="flex items-center gap-1 text-xs font-semibold text-sky-800 group-hover:text-sky-900">
                  <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                  <span>Front Desk</span>
                </div>
                <p className="text-[10px] text-slate-600 mt-1 leading-tight">Non-clinical privacy</p>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('admin@clinic.com', 'Admin@123')}
                className="p-2.5 text-left border rounded-xl hover:border-amber-500 hover:bg-amber-50/50 transition group"
              >
                <div className="flex items-center gap-1 text-xs font-semibold text-amber-800 group-hover:text-amber-900">
                  <Shield className="w-3.5 h-3.5 text-amber-600" />
                  <span>Admin</span>
                </div>
                <p className="text-[10px] text-slate-600 mt-1 leading-tight">Audits & templates</p>
              </button>
            </div>
          </div>
        </div>

        {/* DPDP Privacy Footer */}
        <div className="mt-6 text-center text-xs text-slate-600 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>India DPDP Act 2023 Compliant • Role-Gated Medical Data</span>
        </div>
      </div>
    </div>
  );
};
