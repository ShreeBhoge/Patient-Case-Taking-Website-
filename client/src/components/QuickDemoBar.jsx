import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, UserCheck, Shield, Sparkles, RefreshCw } from 'lucide-react';

export const QuickDemoBar = () => {
  const { user, switchDemoRole } = useAuth();
  const [switching, setSwitching] = useState(false);

  const handleSwitch = async (role) => {
    try {
      setSwitching(true);
      await switchDemoRole(role);
    } catch (err) {
      console.error('Role switch failed:', err);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <aside aria-label="Demo Role Switcher" className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white text-xs px-4 py-2 border-b border-teal-700/50 flex flex-wrap items-center justify-between gap-2 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 font-semibold text-mint-300">
          <Sparkles className="w-3.5 h-3.5 text-mint-400" />
          <span>Demo Role Switcher:</span>
        </span>
        <span className="text-slate-300 hidden sm:inline">
          Logged in as: <strong className="text-white font-medium">{user?.name}</strong>
        </span>
        <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] ${
          user?.role === 'ADMIN' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
          user?.role === 'DOCTOR' ? 'bg-mint-500/20 text-mint-300 border border-mint-500/30' :
          'bg-sky-500/20 text-sky-300 border border-sky-500/30'
        }`}>
          {user?.role}
        </span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-slate-400 text-[11px] hidden md:inline">Instant Switch:</span>

        <button
          onClick={() => handleSwitch('DOCTOR')}
          disabled={switching || user?.role === 'DOCTOR'}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition font-medium text-xs ${
            user?.role === 'DOCTOR'
              ? 'bg-mint-500 text-teal-950 shadow-sm cursor-default'
              : 'bg-teal-950/70 hover:bg-teal-700 text-slate-200 border border-teal-600/50'
          }`}
          title="Switch to Doctor account (Full clinical notes & prescriptions)"
        >
          <Stethoscope className="w-3 h-3" />
          <span>Doctor</span>
        </button>

        <button
          onClick={() => handleSwitch('RECEPTIONIST')}
          disabled={switching || user?.role === 'RECEPTIONIST'}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition font-medium text-xs ${
            user?.role === 'RECEPTIONIST'
              ? 'bg-sky-400 text-slate-900 shadow-sm cursor-default'
              : 'bg-teal-950/70 hover:bg-teal-700 text-slate-200 border border-teal-600/50'
          }`}
          title="Switch to Receptionist account (No clinical notes/prescriptions)"
        >
          <UserCheck className="w-3 h-3" />
          <span>Receptionist</span>
        </button>

        <button
          onClick={() => handleSwitch('ADMIN')}
          disabled={switching || user?.role === 'ADMIN'}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition font-medium text-xs ${
            user?.role === 'ADMIN'
              ? 'bg-amber-400 text-slate-950 shadow-sm cursor-default'
              : 'bg-teal-950/70 hover:bg-teal-700 text-slate-200 border border-teal-600/50'
          }`}
          title="Switch to Admin account (User management & Audit trail)"
        >
          <Shield className="w-3 h-3" />
          <span>Admin</span>
        </button>
      </div>
    </aside>
  );
};
