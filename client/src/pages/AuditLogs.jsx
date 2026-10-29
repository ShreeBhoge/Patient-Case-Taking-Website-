import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Search,
  Filter,
  Clock,
  User,
  Activity,
  Calendar,
  Lock,
  Eye,
  FileDown,
  Edit3,
} from 'lucide-react';

export const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (actionFilter) params.append('action', actionFilter);
      if (entityFilter) params.append('entity', entityFilter);

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, actionFilter, entityFilter]);

  const getActionBadge = (action) => {
    if (action.includes('VIEW')) {
      return 'bg-sky-50 text-sky-700 border-sky-200';
    }
    if (action.includes('CREATE')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (action.includes('UPDATE') || action.includes('EDIT')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (action.includes('EXPORT')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    if (action.includes('LOGIN')) {
      return 'bg-teal-50 text-teal-700 border-teal-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-teal-600" />
            <span>Security & Compliance Audit Trail</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable log of every patient record view, clinical case entry, prescription export, and authentication attempt.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 font-bold border border-teal-200">
            DPDP Section 8 Compliant
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-soft grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-6 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by details, user email, or patient ID..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
          />
        </div>

        <div className="md:col-span-3">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
          >
            <option value="">All Actions</option>
            <option value="VIEW_PATIENT">VIEW_PATIENT</option>
            <option value="VIEW_CLINICAL_NOTE">VIEW_CLINICAL_NOTE</option>
            <option value="CREATE_PATIENT">CREATE_PATIENT</option>
            <option value="CREATE_VISIT">CREATE_VISIT</option>
            <option value="UPDATE_VISIT">UPDATE_VISIT</option>
            <option value="EXPORT_PDF">EXPORT_PDF</option>
            <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
          </select>
        </div>

        <div className="md:col-span-3 flex items-center justify-end">
          <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-3 py-2 rounded-xl">
            {total} audit entries recorded
          </span>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-soft overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Querying security audit logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center">
            <Shield className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800">No audit logs matching query</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Staff User</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Audit Details</th>
                  <th className="py-3 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const dateStr = new Date(log.createdAt).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {dateStr}
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{log.userEmail || 'System / Guest'}</p>
                        {log.userRole && (
                          <span className="text-[10px] text-slate-500 font-mono">[{log.userRole}]</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border ${getActionBadge(log.action)}`}>
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {log.entity}
                      </td>

                      <td className="py-3 px-4 text-slate-800 max-w-md">
                        {log.details}
                      </td>

                      <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                        {log.ipAddress}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
