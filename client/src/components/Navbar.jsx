import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  Users,
  Calendar,
  ClipboardList,
  FileText,
  Shield,
  UserCheck,
  LogOut,
  Menu,
  X,
  Stethoscope,
  Lock,
  PlusCircle,
} from 'lucide-react';

export const Navbar = () => {
  const { user, logout, isDoctor, isAdmin, isReceptionist } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { label: 'Dashboard', path: '/', icon: Activity },
    { label: 'Patients', path: '/patients', icon: Users },
    { label: 'Appointments', path: '/appointments', icon: Calendar },
    ...(isDoctor || isAdmin
      ? [
          { label: 'New Case', path: '/cases/new', icon: ClipboardList, highlight: true },
        ]
      : []),
    ...(isAdmin
      ? [
          { label: 'Templates', path: '/templates', icon: FileText },
          { label: 'Staff Users', path: '/users', icon: UserCheck },
          { label: 'Audit Trail', path: '/audit-logs', icon: Shield },
        ]
      : []),
  ];

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Clinic Branding */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-mint-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-teal-600 transition-colors">
                  Cura<span className="text-teal-600">Pulse</span>
                </span>
                <span className="block text-[10px] text-slate-600 font-medium tracking-wide uppercase">
                  Health & Case System
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                      link.highlight
                        ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm ml-2'
                        : active
                        ? 'bg-teal-50 text-teal-700 font-semibold border-b-2 border-teal-600'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Side Info & Profile */}
          <div className="hidden md:flex items-center gap-4">
            {/* DPDP Compliance Badge */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs border border-slate-200" title="Digital Personal Data Protection Act (India) compliant">
              <Lock className="w-3 h-3 text-teal-600" />
              <span className="text-[11px] font-medium">DPDP Guarded</span>
            </div>

            {/* User Pill */}
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-900 leading-tight">{user?.name}</p>
                <p className="text-[11px] text-slate-600 flex items-center justify-end gap-1">
                  <span>{user?.specialty || user?.role}</span>
                </p>
              </div>

              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs uppercase ${
                user?.role === 'ADMIN' ? 'bg-amber-100 text-amber-800' :
                user?.role === 'DOCTOR' ? 'bg-teal-100 text-teal-800' :
                'bg-sky-100 text-sky-800'
              }`}>
                {user?.name ? user.name.charAt(0) : 'U'}
              </div>

              <button
                onClick={handleLogout}
                className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-4 space-y-2 animate-fade-in">
          <div className="pb-3 mb-2 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.role} • {user?.specialty || 'Staff'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2.5 py-1.5 rounded-md font-medium"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>

          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  active ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4 text-teal-600" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
};
