/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User } from '../types';
import { RoleBadge } from './RoleBadge';
import { LogOut, RefreshCw, Layers, Users, ShieldAlert } from 'lucide-react';
import { login, resetDatabase } from '../lib/api';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  onLoginSuccess: (user: User, token: string) => void;
  onRefreshData: () => void;
  onLogoClick?: () => void;
  onOpenUpdateModal?: () => void;
}

export function Header({ user, onLogout, onLoginSuccess, onRefreshData, onLogoClick, onOpenUpdateModal }: HeaderProps) {
  // Direct Quick Switch for demo ease
  const handleQuickSwitch = async (roleUsername: string) => {
    try {
      const data = await login(roleUsername, 'password');
      localStorage.setItem('college_portal_token', data.token);
      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      alert(`Quick switch failed: ${err.message}`);
    }
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset the database? This will clear all newly registered accounts and restore default seeded data.')) {
      try {
        await resetDatabase();
        onRefreshData();
        // If logged in as someone else, log out to prevent stale sessions
        onLogout();
        alert('Database has been reset to seeds. Try logging in with the test accounts!');
      } catch (err: any) {
        alert(`Reset failed: ${err.message}`);
      }
    }
  };

  return (
    <header id="app-header" className="bg-[#111113] border-b border-white/10 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and App Title */}
          <button
            onClick={onLogoClick}
            disabled={!onLogoClick}
            className={`flex items-center gap-3 focus:outline-hidden text-left ${onLogoClick ? 'cursor-pointer group' : ''}`}
            id="logo-btn"
          >
            <div className="bg-white/5 p-2 rounded-lg text-[#E4E4E4] border border-white/10 group-hover:border-[#5D5FEF] transition-all">
              <Layers size={18} className="text-[#5D5FEF]" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-[#E4E4E4] uppercase font-mono group-hover:text-[#5D5FEF] transition-colors flex items-center gap-2">
                <span>CAMPUS_FLOW</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-5 border border-emerald-500/30 text-emerald-400 font-normal">
                  Campus-connect
                </span>
              </h1>
              <p className="text-[10px] text-white/50 font-mono tracking-wider hidden sm:block uppercase">
                Institutional Workflow Portal
              </p>
            </div>
          </button>

          {/* Right Session Details */}
          {user ? (
            <div className="flex items-center gap-4">
              {onOpenUpdateModal && (
                <button
                  onClick={onOpenUpdateModal}
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-md text-xs font-mono transition-all cursor-pointer"
                  title="Watch Git Push Deployment Animation"
                >
                  <RefreshCw size={12} className="animate-spin-slow" />
                  <span>Git Update Screen</span>
                </button>
              )}
              <div className="hidden md:flex flex-col items-end text-right">
                <span className="text-sm font-bold text-[#E4E4E4]">{user.username}</span>
                {user.department ? (
                  <span className="text-[11px] text-white/60 font-medium truncate max-w-[180px]">
                    {user.department}
                  </span>
                ) : (
                  <span className="text-[11px] text-[#5D5FEF] font-semibold font-mono">Administration</span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <RoleBadge role={user.role} size="sm" />
                
                <button
                  id="btn-logout"
                  onClick={onLogout}
                  title="Logout"
                  className="p-2 text-white/60 hover:text-white hover:bg-white/5 border border-white/10 rounded-lg transition-colors duration-150 cursor-pointer"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {onOpenUpdateModal && (
                <button
                  onClick={onOpenUpdateModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5D5FEF]/15 hover:bg-[#5D5FEF]/30 text-white border border-[#5D5FEF]/50 rounded-md text-xs font-mono font-bold transition-all cursor-pointer shadow-[0_0_10px_rgba(93,95,239,0.3)]"
                  title="Watch Git Push Deployment Animation"
                >
                  <RefreshCw size={12} className="text-cyan-400 animate-spin-slow" />
                  <span>Git Update Screen</span>
                </button>
              )}
              <button
                id="btn-quick-reset"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-[#5D5FEF] hover:bg-[#5D5FEF] hover:text-[#111113] text-xs font-mono font-bold text-[#5D5FEF] rounded-md transition-all duration-150 cursor-pointer"
              >
                <RefreshCw size={12} className="animate-spin-slow" />
                <span>Reset Demo Database</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sandbox Testing Bar */}
      {!user && (
        <div className="bg-[#1a1a1c] border-b border-white/5 py-2">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-[10px] font-bold text-white/60 font-mono tracking-wider">
              <Users size={14} className="text-[#5D5FEF] shrink-0" />
              <span>SANDBOX CONTROL PANEL / QUICK LOGINS:</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1.5">
              <button
                onClick={() => handleQuickSwitch('student')}
                className={`px-2.5 py-1 text-xs font-bold font-mono rounded-md transition-all cursor-pointer border ${
                  user?.username === 'student'
                    ? 'bg-[#5D5FEF] text-[#111113] border-[#5D5FEF]'
                    : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
                }`}
              >
                Student
              </button>
              <button
                onClick={() => handleQuickSwitch('staff')}
                className={`px-2.5 py-1 text-xs font-bold font-mono rounded-md transition-all cursor-pointer border ${
                  user?.username === 'staff'
                    ? 'bg-[#5D5FEF] text-[#111113] border-[#5D5FEF]'
                    : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
                }`}
              >
                Dept Staff
              </button>
              <button
                onClick={() => handleQuickSwitch('hod')}
                className={`px-2.5 py-1 text-xs font-bold font-mono rounded-md transition-all cursor-pointer border ${
                  user?.username === 'hod'
                    ? 'bg-[#5D5FEF] text-[#111113] border-[#5D5FEF]'
                    : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
                }`}
              >
                HOD
              </button>
              <button
                onClick={() => handleQuickSwitch('dean')}
                className={`px-2.5 py-1 text-xs font-bold font-mono rounded-md transition-all cursor-pointer border ${
                  user?.username === 'dean'
                    ? 'bg-[#5D5FEF] text-[#111113] border-[#5D5FEF]'
                    : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
                }`}
              >
                Dean
              </button>
              <button
                onClick={() => handleQuickSwitch('principal')}
                className={`px-2.5 py-1 text-xs font-bold font-mono rounded-md transition-all cursor-pointer border ${
                  user?.username === 'principal'
                    ? 'bg-[#5D5FEF] text-[#111113] border-[#5D5FEF]'
                    : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
                }`}
              >
                Principal
              </button>

              <span className="h-4 w-px bg-white/10 mx-1 hidden md:inline"></span>

              <button
                onClick={handleReset}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-white/5 hover:bg-[#5D5FEF] hover:text-[#111113] text-white/80 border border-white/10 rounded-md transition-all cursor-pointer font-mono"
                title="Reset Database to Default Pre-seeded State"
              >
                <ShieldAlert size={12} className="text-[#5D5FEF]" />
                <span>Reset State</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
