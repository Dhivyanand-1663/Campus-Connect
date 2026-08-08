/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User } from '../types';
import { RoleBadge } from './RoleBadge';
import { LogOut, RefreshCw, Layers } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  onLoginSuccess: (user: User, token: string) => void;
  onRefreshData: () => void;
  onLogoClick?: () => void;
  onOpenUpdateModal?: () => void;
}

export function Header({ user, onLogout, onLogoClick, onOpenUpdateModal }: HeaderProps) {
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
          {user && (
            <div className="flex items-center gap-4">
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
          )}
        </div>
      </div>
    </header>
  );
}
