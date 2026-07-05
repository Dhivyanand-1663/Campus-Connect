import React, { useState } from 'react';
import { User } from '../types';
import { Terminal, Search, Filter, ShieldAlert, AlertTriangle, ShieldCheck } from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'DENIED' | 'ACTION';
  actor: string;
  message: string;
}

interface SecurityLogsPageProps {
  user: User;
  auditLogs: AuditLog[];
}

export function SecurityLogsPage({ user, auditLogs }: SecurityLogsPageProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Apply filters
  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.actor.toLowerCase().includes(search.toLowerCase()) ||
      log.message.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === 'ALL' || log.type === typeFilter;

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-5 animate-fade-in" id="security-logs-page">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Terminal size={18} className="text-indigo-400" />
            Institutional Audit Ledger
          </h2>
          <p className="text-xs text-slate-400">
            Real-time tracking of administrative event approvals, student grievance actions, and system authentication events.
          </p>
        </div>
      </div>

      {/* Control Panel / Search Box */}
      <div className="bg-[#0d0d10] border border-white/10 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search audit trail by actor, action message..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-2 items-center">
            <span className="text-slate-500 text-xs font-mono shrink-0 flex items-center gap-1">
              <Filter size={12} /> Severity:
            </span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 [&>option]:bg-[#0d0d10]"
            >
              <option value="ALL">All Events</option>
              <option value="INFO">INFO</option>
              <option value="ACTION">ACTION</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="WARNING">WARNING</option>
              <option value="DENIED">DENIED (Forbidden)</option>
            </select>
          </div>
        </div>

        {/* Level Badges Selector */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {[
            { label: 'All Log Streams', value: 'ALL', color: 'text-slate-400 border-white/5 bg-white/5' },
            { label: 'Information', value: 'INFO', color: 'text-sky-400 border-sky-500/10 bg-sky-950/20' },
            { label: 'System Action', value: 'ACTION', color: 'text-indigo-400 border-indigo-500/10 bg-indigo-950/20' },
            { label: 'Success Ledger', value: 'SUCCESS', color: 'text-emerald-400 border-emerald-500/10 bg-emerald-950/20' },
            { label: 'Warnings', value: 'WARNING', color: 'text-amber-400 border-amber-500/10 bg-amber-950/20' },
            { label: 'Denied Actions', value: 'DENIED', color: 'text-rose-400 border-rose-500/10 bg-rose-950/20' },
          ].map((lvl) => (
            <button
              key={lvl.value}
              onClick={() => setTypeFilter(lvl.value)}
              className={`px-3 py-1 text-[10px] font-mono rounded font-bold uppercase transition-all border cursor-pointer ${
                typeFilter === lvl.value
                  ? 'bg-indigo-600/15 border-indigo-500/50 text-white'
                  : 'bg-transparent text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              {lvl.label}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal View Container */}
      <div className="bg-[#070709] border border-white/10 rounded-2xl p-5 shadow-inner overflow-hidden flex flex-col min-h-[450px]">
        {/* Terminal Header Bar */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4 text-[10px] font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
            <span className="ml-2">AUDIT_LEDGER_SHELL: active</span>
          </div>
          <div>Filtered {filteredLogs.length} logs of {auditLogs.length}</div>
        </div>

        {/* Scrollable Logs Stream */}
        <div className="flex-1 overflow-y-auto space-y-2 max-h-[420px] font-mono text-xs pr-1">
          {filteredLogs.map((log) => {
            const levelColors = {
              INFO: 'text-sky-400 bg-sky-950/40 border-sky-900/40',
              ACTION: 'text-indigo-400 bg-indigo-950/40 border-indigo-900/40',
              SUCCESS: 'text-emerald-400 bg-emerald-950/40 border-emerald-900/40',
              WARNING: 'text-amber-400 bg-amber-950/40 border-amber-900/40',
              DENIED: 'text-rose-400 bg-rose-950/40 border-rose-900/40',
            }[log.type] || 'text-slate-400';

            return (
              <div
                key={log.id}
                className="py-2.5 px-3 rounded-lg border border-white/5 hover:border-white/10 hover:bg-white/[0.01] transition-all flex flex-col sm:flex-row items-stretch sm:items-start gap-2.5"
              >
                {/* Timestamp */}
                <span className="text-slate-500 select-none text-[11px] shrink-0 pt-0.5">
                  [{new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}]
                </span>

                {/* Level badge */}
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase shrink-0 text-center ${levelColors}`}>
                  {log.type}
                </span>

                {/* Actor */}
                <span className="text-indigo-300 font-bold shrink-0 min-w-[70px]">
                  &lt;@{log.actor}&gt;
                </span>

                {/* Message */}
                <span className="text-slate-300 leading-normal flex-1 font-sans text-[12px] sm:font-mono sm:text-[11px]">
                  {log.message}
                </span>
              </div>
            );
          })}

          {filteredLogs.length === 0 && (
            <div className="text-center py-20 text-slate-600 italic">
              -- NO LEDGER ENTRIES RECORDED FOR FILTER CRITERIA --
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
