import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChangePasswordModal } from './ChangePasswordModal';
import { LogOut, User as UserIcon, Shield, Briefcase, GraduationCap, KeyRound } from 'lucide-react';

import logoImg from '../assets/logo.png';

export const Navbar = () => {
  const { user, profile, logout, role } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const getRoleBadge = () => {
    switch (role) {
      case 'SUPER_ADMIN':
        return (
          <span className="badge bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
            <Shield className="w-3.5 h-3.5" /> Super Admin
          </span>
        );
      case 'COORDINATOR':
        return (
          <span className="badge bg-sky-50 text-sky-700 border border-sky-200 font-semibold">
            <Briefcase className="w-3.5 h-3.5" /> Coordinator
          </span>
        );
      case 'STUDENT':
        return (
          <span className="badge bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
            <GraduationCap className="w-3.5 h-3.5" /> Student
          </span>
        );
      default:
        return null;
    }
  };

  const getUserName = () => {
    if (profile?.name) return profile.name;
    if (user?.username) return user.username;
    return 'User';
  };

  return (
    <>
      <nav className="bg-white/95 backdrop-blur-md sticky top-0 z-40 px-6 py-3 border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="Placement Point Logo" className="h-9 w-auto object-contain" />
            <div className="hidden sm:block border-l border-slate-200 pl-3">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Campus Placement Portal</p>
            </div>
          </div>

          {/* User Info & Actions */}
          {user && (
            <div className="flex items-center gap-3">
              {getRoleBadge()}
              
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200">
                <div className="w-7 h-7 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-600 font-bold text-xs">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-slate-800 block">{getUserName()}</span>
                  {profile?.branch && (
                    <span className="text-[11px] text-slate-500 block">{profile.branch} ({profile.passout_year})</span>
                  )}
                </div>
              </div>

              {/* Voluntary Change Password Button */}
              <button
                onClick={() => setShowPasswordModal(true)}
                className="btn-secondary py-2 px-3 text-xs text-slate-700 bg-slate-100 border-slate-200 hover:bg-slate-200 hover:border-slate-300"
                title="Change Password"
              >
                <KeyRound className="w-4 h-4 text-slate-600" />
                <span className="hidden sm:inline">Change Password</span>
              </button>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="btn-secondary py-2 px-3 text-xs text-rose-600 bg-rose-50 border-rose-200 hover:bg-rose-100 hover:border-rose-300"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </>
  );
};
