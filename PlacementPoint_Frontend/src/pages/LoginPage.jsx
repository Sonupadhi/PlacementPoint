import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Briefcase, GraduationCap, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';

import logoImg from '../assets/logo.png';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [activeRole, setActiveRole] = useState('STUDENT');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(username, password);
      if (user.role === 'SUPER_ADMIN') navigate('/admin');
      else if (user.role === 'COORDINATOR') navigate('/coordinator');
      else navigate('/student');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials. Please check your username and password.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (user, pass, role) => {
    setUsername(user);
    setPassword(pass);
    setActiveRole(role);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        {/* Left Side: Hero Branding */}
        <div className="space-y-6">
          <img src={logoImg} alt="Placement Point Logo" className="h-14 w-auto object-contain mb-2" />

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/70 border border-blue-200 text-blue-800 text-xs font-bold shadow-xs">
            <Briefcase className="w-4 h-4 text-blue-600" /> Next-Gen Placement Portal
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight font-heading">
            Campus Placement <br />
            <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-sky-500 bg-clip-text text-transparent">
              Simplified & Automated
            </span>
          </h1>

          <p className="text-slate-600 text-sm leading-relaxed font-normal">
            Placement Point is the official centralized campus placement portal connecting Super Admins, Placement Coordinators, and Students.
          </p>

          <div className="space-y-3 pt-1">
            {[
              'Automated Drive Eligibility Filtering Engine',
              'Real-Time Recruitment Round Visual Progress Bar',
              'Bulk Excel Candidate Shortlist Advancement',
              'Centralized Notices & Placement Drive Analytics'
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 text-xs font-semibold text-slate-700">
                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span>{feature}</span>
              </div>
            ))}
          </div>

          {/* Quick Demo Login Cards */}
          <div className="pt-4 border-t border-slate-200">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Demo Test Accounts:</p>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setDemoCredentials('student1', 'Student@123', 'STUDENT')}
                className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-md text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-700">Student</span>
                  <GraduationCap className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                </div>
                <span className="text-[11px] text-slate-400 block truncate mt-0.5">student1</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('coord1', 'Coord@123', 'COORDINATOR')}
                className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-sky-500 hover:shadow-md text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-700">Coordinator</span>
                  <Briefcase className="w-4 h-4 text-slate-400 group-hover:text-sky-600" />
                </div>
                <span className="text-[11px] text-slate-400 block truncate mt-0.5">coord1</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('admin', 'Admin@123', 'SUPER_ADMIN')}
                className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-purple-500 hover:shadow-md text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-700">Admin</span>
                  <Shield className="w-4 h-4 text-slate-400 group-hover:text-purple-600" />
                </div>
                <span className="text-[11px] text-slate-400 block truncate mt-0.5">admin</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form Card */}
        <div className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl border border-slate-200/90 shadow-xl shadow-blue-500/5">
          {/* Role Tabs */}
          <div className="flex rounded-2xl bg-slate-100 p-1.5 mb-6 border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveRole('STUDENT')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                activeRole === 'STUDENT' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" /> Student
            </button>

            <button
              type="button"
              onClick={() => setActiveRole('COORDINATOR')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                activeRole === 'COORDINATOR' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-4 h-4" /> Coordinator
            </button>

            <button
              type="button"
              onClick={() => setActiveRole('SUPER_ADMIN')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                activeRole === 'SUPER_ADMIN' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-4 h-4" /> Admin
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 font-heading">Sign In</h2>
            <p className="text-xs text-slate-500 mt-1">Access your {activeRole.toLowerCase().replace('_', ' ')} dashboard.</p>
          </div>

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="form-label">
                {activeRole === 'STUDENT' ? 'Registration ID / Username' : activeRole === 'COORDINATOR' ? 'Employee ID / Username' : 'Admin Username'}
              </label>
              <input
                type="text"
                className="form-input"
                placeholder={activeRole === 'STUDENT' ? 'e.g. 25C216A01 or student1' : activeRole === 'COORDINATOR' ? 'e.g. coord1' : 'admin'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 mt-2 text-sm font-bold shadow-md shadow-blue-500/20"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-xs font-medium text-slate-400 mt-6">
            Placement Point Portal &copy; 2026 ITER, SOA University
          </p>
        </div>
      </div>
    </div>
  );
};
