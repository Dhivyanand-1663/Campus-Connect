import React, { useState, useEffect } from 'react';
import { User, Event } from '../types';
import {
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Plus,
  Lock,
  Building,
  AlertTriangle,
  FileText,
  Workflow,
  Check,
  ChevronRight,
  User as UserIcon
} from 'lucide-react';

interface EventPipelinePageProps {
  user: User;
  events: Event[];
  selectedEvent: Event | null;
  onSelectEvent: (evt: Event | null) => void;
  onShowEventModal: () => void;
  onPerformEventAction: (eventId: string, action: 'APPROVE' | 'REJECT', remarks?: string) => Promise<void>;
}

export function EventPipelinePage({
  user,
  events,
  selectedEvent,
  onSelectEvent,
  onShowEventModal,
  onPerformEventAction,
}: EventPipelinePageProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [remarks, setRemarks] = useState('');
  const [actionError, setActionError] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);

  // Filter based on roles
  const filteredEventsForRole = events.filter((e) => {
    if (user.role === 'Student') return e.created_by === user.username;
    if (user.role === 'Dept Staff' || user.role === 'HOD') return e.department === user.department;
    return true; // Dean & Principal see all
  });

  // Apply filters & search
  const displayedEvents = filteredEventsForRole.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.venue.toLowerCase().includes(search.toLowerCase()) ||
      e.created_by.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PENDING' && e.status.startsWith('PENDING_')) ||
      e.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Automatically select first event if none selected and list isn't empty
  useEffect(() => {
    if (!selectedEvent && displayedEvents.length > 0) {
      onSelectEvent(displayedEvents[0]);
    }
  }, [displayedEvents, selectedEvent]);

  // Handle Action
  const handleAction = async (action: 'APPROVE' | 'REJECT') => {
    if (!selectedEvent) return;
    setActionError('');
    setLoadingAction(true);
    try {
      await onPerformEventAction(selectedEvent.id, action, remarks);
      setRemarks('');
    } catch (err: any) {
      setActionError(err.message || 'Action failed.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Check if current user is authorized to act on selected event
  const isAuthorizedToAct = () => {
    if (!selectedEvent) return false;
    if (selectedEvent.status === 'PENDING_DEPT_STAFF' && user.role === 'Dept Staff' && user.department === selectedEvent.department) return true;
    if (selectedEvent.status === 'PENDING_DEAN' && user.role === 'Dean') return true;
    if (selectedEvent.status === 'PENDING_PRINCIPAL' && user.role === 'Principal') return true;
    return false;
  };

  // Helper to draw status step pipeline
  const renderStepProgress = (evtStatus: Event['status']) => {
    const steps: { label: string; stage: string; key: typeof evtStatus | 'INIT' }[] = [
      { label: 'Proposed', stage: 'Initiation', key: 'INIT' },
      { label: 'Dept Staff', stage: 'L1 Review', key: 'PENDING_DEPT_STAFF' },
      { label: 'Dean Approval', stage: 'L2 Review', key: 'PENDING_DEAN' },
      { label: 'Principal Approval', stage: 'L3 Review', key: 'PENDING_PRINCIPAL' },
    ];

    let currentStepIndex = 0;
    if (evtStatus === 'PENDING_DEPT_STAFF') currentStepIndex = 1;
    else if (evtStatus === 'PENDING_DEAN') currentStepIndex = 2;
    else if (evtStatus === 'PENDING_PRINCIPAL') currentStepIndex = 3;
    else if (evtStatus === 'APPROVED') currentStepIndex = 4;
    else if (evtStatus === 'REJECTED') currentStepIndex = -1;

    return (
      <div className="bg-[#121217] border border-white/5 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono tracking-wider uppercase">Approval Pipeline Tracker</span>
          <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold border ${
            evtStatus === 'APPROVED'
              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20'
              : evtStatus === 'REJECTED'
              ? 'bg-rose-950/40 text-rose-400 border-rose-500/20'
              : 'bg-indigo-950/40 text-indigo-400 border-indigo-500/20'
          }`}>
            {evtStatus === 'APPROVED' ? 'COMPLETED (APPROVED)' : evtStatus === 'REJECTED' ? 'TERMINATED (REJECTED)' : 'IN PROGRESS'}
          </span>
        </div>

        {currentStepIndex === -1 ? (
          <div className="flex items-center gap-2 bg-rose-950/20 border border-rose-900/40 text-rose-400 p-2.5 rounded-lg text-xs font-semibold">
            <XCircle size={14} />
            <span>PROPOSAL REJECTED - WORKFLOW ARCHIVED</span>
          </div>
        ) : (
          <div className="relative pt-2">
            <div className="grid grid-cols-4 gap-2">
              {steps.map((st, idx) => {
                const isPassed = idx < currentStepIndex || evtStatus === 'APPROVED';
                const isCurrent = idx === currentStepIndex && evtStatus !== 'APPROVED';

                return (
                  <div key={st.label} className="space-y-2">
                    <div className="h-1.5 rounded-full relative overflow-hidden bg-white/5">
                      <div
                        className={`absolute inset-y-0 left-0 rounded-full transition-all duration-300 ${
                          isPassed
                            ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] w-full'
                            : isCurrent
                            ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)] w-1/2 animate-pulse'
                            : 'w-0'
                        }`}
                      ></div>
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-[10px] truncate ${isCurrent ? 'text-indigo-400 font-bold' : isPassed ? 'text-emerald-400 font-medium' : 'text-slate-500'}`}>
                        {st.label}
                      </span>
                      <span className="text-[8px] text-slate-600 truncate font-mono">{st.stage}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5 animate-fade-in" id="event-pipeline-page">
      {/* Top action bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Workflow size={18} className="text-indigo-400 animate-pulse" />
            Campus Event Coordination Pipeline
          </h2>
          <p className="text-xs text-slate-400">
            {user.role === 'Student'
              ? 'Track your event proposals as they progress through departmental staff, Dean, and Principal reviews.'
              : `Review and validation desk for event proposals. Department focus: ${user.department || 'All Campus'}.`}
          </p>
        </div>

        {user.role === 'Student' && (
          <button
            onClick={onShowEventModal}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/15 cursor-pointer border border-indigo-500/20"
          >
            <Plus size={14} />
            <span>Propose New Event</span>
          </button>
        )}
      </div>

      {/* Main double column split pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch min-h-[600px]">
        
        {/* Left: Master List ledger */}
        <div className="lg:col-span-5 flex flex-col bg-[#0d0d10] border border-white/10 rounded-2xl overflow-hidden">
          {/* Search and filters box */}
          <div className="p-4 border-b border-white/5 bg-black/15 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search proposals by title, creator, venue..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Quick Status Pill filters */}
            <div className="flex flex-wrap gap-1">
              {[
                { label: 'All', value: 'ALL' },
                { label: 'In Review', value: 'PENDING' },
                { label: 'Approved', value: 'APPROVED' },
                { label: 'Rejected', value: 'REJECTED' },
              ].map((pill) => (
                <button
                  key={pill.value}
                  onClick={() => setStatusFilter(pill.value)}
                  className={`px-2.5 py-1 text-[10px] font-mono rounded font-bold uppercase transition-all border cursor-pointer ${
                    statusFilter === pill.value
                      ? 'bg-indigo-950/40 text-indigo-400 border-indigo-500/45'
                      : 'bg-transparent text-slate-500 border-transparent hover:text-slate-300'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable list ledger */}
          <div className="flex-1 overflow-y-auto max-h-[500px] p-3 space-y-2">
            {displayedEvents.map((evt) => {
              const isSelected = selectedEvent?.id === evt.id;
              const isEventPending = evt.status.startsWith('PENDING_');

              return (
                <div
                  key={evt.id}
                  onClick={() => {
                    onSelectEvent(evt);
                    setActionError('');
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 relative overflow-hidden group ${
                    isSelected
                      ? 'bg-indigo-600/10 border-indigo-500/50 shadow-md shadow-indigo-600/5'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest font-mono">
                        DEPT: {evt.department}
                      </span>
                      <h4 className="text-xs font-semibold text-white leading-tight group-hover:text-indigo-300 transition-colors">
                        {evt.title}
                      </h4>
                    </div>
                    <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 ${
                      evt.status === 'APPROVED'
                        ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30'
                        : evt.status === 'REJECTED'
                        ? 'bg-rose-950/40 text-rose-400 border border-rose-900/30'
                        : 'bg-amber-950/40 text-amber-400 border border-amber-900/30'
                    }`}>
                      {evt.status.replace('PENDING_', '')}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    {evt.description}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono border-t border-white/5 pt-2 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar size={10} className="text-indigo-400" />
                      {evt.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={10} className="text-indigo-400" />
                      {evt.venue}
                    </span>
                  </div>
                </div>
              );
            })}

            {displayedEvents.length === 0 && (
              <div className="text-center py-16 border border-dashed border-white/5 rounded-xl bg-black/10 text-slate-500 text-xs italic font-mono flex flex-col items-center justify-center gap-2">
                <FileText size={20} className="opacity-45 text-indigo-400" />
                <span>No event proposals match your selection.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Detail Workspace */}
        <div className="lg:col-span-7 bg-[#0d0d10] border border-white/10 rounded-2xl overflow-hidden flex flex-col">
          {selectedEvent ? (
            <div className="flex-1 flex flex-col h-full">
              {/* Detail Header */}
              <div className="p-4 border-b border-white/5 bg-black/15 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-400 font-mono">FLOW LEDGER ENTRY:</span>
                    <span className="text-[10px] font-mono bg-white/5 border border-white/5 px-2 py-0.2 rounded text-slate-400">
                      ID: {selectedEvent.id}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                    {selectedEvent.title}
                  </h3>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Origin: <span className="text-slate-300 font-bold">{selectedEvent.department}</span>
                </div>
              </div>

              {/* Detail Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Meta details cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl text-xs space-y-1">
                    <span className="text-slate-500 block font-mono text-[9px] uppercase">VENUE LOCATION</span>
                    <span className="text-slate-200 font-semibold flex items-center gap-1">
                      <MapPin size={11} className="text-indigo-400 shrink-0" />
                      {selectedEvent.venue}
                    </span>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl text-xs space-y-1">
                    <span className="text-slate-500 block font-mono text-[9px] uppercase">PROPOSED DATE</span>
                    <span className="text-slate-200 font-semibold flex items-center gap-1">
                      <Calendar size={11} className="text-indigo-400 shrink-0" />
                      {selectedEvent.date}
                    </span>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 p-3 rounded-xl text-xs space-y-1">
                    <span className="text-slate-500 block font-mono text-[9px] uppercase">PROPOSER STUDENT</span>
                    <span className="text-slate-200 font-semibold flex items-center gap-1 truncate" title={`@${selectedEvent.created_by}`}>
                      <UserIcon size={11} className="text-indigo-400 shrink-0" />
                      @{selectedEvent.created_by}
                    </span>
                  </div>
                </div>

                {/* Proposal Abstract */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Proposal Abstract Details</span>
                  <p className="text-xs text-slate-300 bg-white/[0.01] border border-white/5 p-4 rounded-xl leading-relaxed whitespace-pre-wrap font-sans">
                    {selectedEvent.description}
                  </p>
                </div>

                {/* Workflow step pipeline tracker */}
                {renderStepProgress(selectedEvent.status)}

                {/* Decision Actions Logs */}
                <div className="space-y-2.5">
                  <h4 className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Institutional Decision Trail</h4>
                  <div className="space-y-2">
                    {selectedEvent.activities.map((act) => (
                      <div key={act.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-slate-200 flex items-center gap-1.5">
                            {act.action === 'APPROVE' ? (
                              <CheckCircle2 size={12} className="text-emerald-400" />
                            ) : (
                              <XCircle size={12} className="text-rose-400" />
                            )}
                            {act.actorRole} ({act.actorName})
                          </span>
                          <span className="text-[9px] font-mono text-slate-500">
                            {new Date(act.timestamp).toLocaleDateString()} {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {act.remarks ? (
                          <p className="text-slate-400 italic font-mono mt-1 text-[11px] border-l border-white/10 pl-2">
                            " {act.remarks} "
                          </p>
                        ) : (
                          <p className="text-slate-500 italic mt-1 text-[11px] pl-2">No verification comments recorded.</p>
                        )}
                      </div>
                    ))}
                    {selectedEvent.activities.length === 0 && (
                      <div className="text-xs text-slate-500 italic p-4 text-center border border-white/5 border-dashed rounded-xl bg-black/15 font-mono">
                        Awaiting initial departmental validation desk (L1 Staff) check.
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Desk Form */}
                {isAuthorizedToAct() ? (
                  <div className="bg-[#121217] border border-indigo-500/20 p-4 rounded-xl space-y-3 mt-4">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-indigo-400">
                      <Lock size={12} />
                      <span>SECURE DECISION DESK AUTHORISED ({user.role})</span>
                    </div>

                    {actionError && (
                      <div className="bg-rose-950/20 border border-rose-900/50 text-rose-300 p-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                        <AlertTriangle size={13} className="shrink-0" />
                        <span>{actionError}</span>
                      </div>
                    )}

                    <input
                      type="text"
                      placeholder="Add institutional authorization directive or review notes (optional)..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleAction('APPROVE')}
                        disabled={loadingAction}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                      >
                        <CheckCircle2 size={13} />
                        <span>Authorize &amp; Forward</span>
                      </button>
                      <button
                        onClick={() => handleAction('REJECT')}
                        disabled={loadingAction}
                        className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                      >
                        <XCircle size={13} />
                        <span>Reject Proposal</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-black/10 border border-white/5 p-4 rounded-xl text-center text-xs font-mono text-slate-500 flex items-center justify-center gap-2">
                    <Lock size={11} className="opacity-50" />
                    <span>
                      {selectedEvent.status === 'APPROVED' || selectedEvent.status === 'REJECTED'
                        ? 'Institutional decision lifecycle completed.'
                        : 'Awaiting corresponding review desk authorization.'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-2">
              <Workflow size={32} className="opacity-25 text-indigo-400 animate-pulse" />
              <h4 className="font-semibold text-white text-xs">No Proposal Selected</h4>
              <p className="text-xs max-w-sm">
                Select an active proposal workflow entry from the left ledger list to inspect its logs and decision trail.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
