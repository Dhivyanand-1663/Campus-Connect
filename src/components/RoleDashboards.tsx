import React, { useState } from 'react';
import { User, Event, Complaint, Role, Department } from '../types';
import {
  Sparkles,
  Plus,
  CheckCircle2,
  XCircle,
  MessageSquare,
  CalendarDays,
  ShieldAlert,
  Lock,
  Clock,
  MapPin,
  Calendar,
  AlertTriangle,
  Building,
  Send,
  ArrowUpRight,
  Terminal,
} from 'lucide-react';

interface RoleDashboardsProps {
  user: User;
  events: Event[];
  complaints: Complaint[];
  auditLogs: any[];
  onTabChange: (tab: 'dashboard' | 'events' | 'complaints' | 'logs') => void;
  onSelectEvent: (evt: Event) => void;
  onSelectComplaint: (comp: Complaint) => void;
  onShowEventModal: () => void;
  onShowComplaintModal: () => void;
  onPerformEventAction: (eventId: string, action: 'APPROVE' | 'REJECT', remarks?: string) => Promise<void>;
  onRespondToComplaint: (complaintId: string, message: string, status?: 'IN_REVIEW' | 'RESOLVED') => Promise<void>;
}

export function RoleDashboards({
  user,
  events,
  complaints,
  auditLogs,
  onTabChange,
  onSelectEvent,
  onSelectComplaint,
  onShowEventModal,
  onShowComplaintModal,
  onPerformEventAction,
  onRespondToComplaint,
}: RoleDashboardsProps) {
  // Local states for quick comments
  const [studentSubTab, setStudentSubTab] = useState<'events' | 'grievances'>('events');
  const [eventRemarks, setEventRemarks] = useState<{ [key: string]: string }>({});
  const [complaintReplies, setComplaintReplies] = useState<{ [key: string]: string }>({});
  const [loadingAction, setLoadingAction] = useState<{ [key: string]: boolean }>({});
  const [errorAction, setErrorAction] = useState<{ [key: string]: string }>({});

  const handleQuickEventAction = async (eventId: string, action: 'APPROVE' | 'REJECT') => {
    const remarks = eventRemarks[eventId] || '';
    setLoadingAction((prev) => ({ ...prev, [eventId]: true }));
    setErrorAction((prev) => ({ ...prev, [eventId]: '' }));
    try {
      await onPerformEventAction(eventId, action, remarks);
      setEventRemarks((prev) => ({ ...prev, [eventId]: '' }));
    } catch (err: any) {
      setErrorAction((prev) => ({ ...prev, [eventId]: err.message || 'Action failed.' }));
    } finally {
      setLoadingAction((prev) => ({ ...prev, [eventId]: false }));
    }
  };

  const handleQuickComplaintReply = async (complaintId: string, status?: 'IN_REVIEW' | 'RESOLVED') => {
    const reply = complaintReplies[complaintId] || '';
    if (!reply.trim() && !status) return;
    setLoadingAction((prev) => ({ ...prev, [complaintId]: true }));
    setErrorAction((prev) => ({ ...prev, [complaintId]: '' }));
    try {
      await onRespondToComplaint(complaintId, reply, status);
      setComplaintReplies((prev) => ({ ...prev, [complaintId]: '' }));
    } catch (err: any) {
      setErrorAction((prev) => ({ ...prev, [complaintId]: err.message || 'Reply failed.' }));
    } finally {
      setLoadingAction((prev) => ({ ...prev, [complaintId]: false }));
    }
  };

  // Filter helpers based on roles (re-aligned with backend filters to guarantee view safety)
  const studentEvents = events.filter((e) => e.created_by === user.username);
  const studentComplaints = complaints.filter((c) => c.raised_by === user.username);

  const deptPendingEvents = events.filter(
    (e) => e.status === 'PENDING_DEPT_STAFF' && e.department === user.department
  );
  const deptHistoricalEvents = events.filter(
    (e) => e.status !== 'PENDING_DEPT_STAFF' && e.department === user.department
  );

  const activeDeptComplaints = complaints.filter(
    (c) => c.status !== 'RESOLVED' && c.department === user.department
  );
  const resolvedDeptComplaints = complaints.filter(
    (c) => c.status === 'RESOLVED' && c.department === user.department
  );

  const deanPendingEvents = events.filter((e) => e.status === 'PENDING_DEAN');
  const deanOversightComplaints = complaints.filter((c) => c.status !== 'RESOLVED');

  const principalPendingEvents = events.filter((e) => e.status === 'PENDING_PRINCIPAL');

  // RENDER: STUDENT DASHBOARD
  if (user.role === 'Student') {
    return (
      <div className="space-y-6">
        {/* Horizontal Navigation Tab Bar at the very top as a Main Page Menu */}
        <div className="flex border-b border-white/10 gap-2 sm:gap-6 overflow-x-auto pb-0.5 scrollbar-thin">
          <button
            id="tab-btn-my-proposals"
            onClick={() => setStudentSubTab('events')}
            className={`pb-3 text-xs sm:text-sm font-bold tracking-wider font-mono uppercase border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              studentSubTab === 'events'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <CalendarDays size={14} className={studentSubTab === 'events' ? 'text-indigo-400' : 'text-slate-500'} />
            My Event Proposals
            <span className="px-1.5 py-0.5 text-[9px] bg-indigo-500/10 text-indigo-300 rounded-full font-sans font-normal border border-indigo-500/20">
              {studentEvents.length}
            </span>
          </button>
          <button
            id="tab-btn-my-grievances"
            onClick={() => setStudentSubTab('grievances')}
            className={`pb-3 text-xs sm:text-sm font-bold tracking-wider font-mono uppercase border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              studentSubTab === 'grievances'
                ? 'border-rose-500 text-white'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare size={14} className={studentSubTab === 'grievances' ? 'text-rose-400' : 'text-slate-500'} />
            My Active Grievances
            <span className="px-1.5 py-0.5 text-[9px] bg-rose-500/10 text-rose-300 rounded-full font-sans font-normal border border-rose-500/20">
              {studentComplaints.length}
            </span>
          </button>
        </div>

        {/* Selected Dashboard Section/Page */}
        <div className="animate-fade-in">
          {studentSubTab === 'events' ? (
            <div id="student-events-page" className="space-y-6">
              {/* Event Proposals Banner & Header */}
              <div className="bg-gradient-to-tr from-indigo-950/40 to-indigo-900/15 border border-indigo-500/25 rounded-2xl p-5 sm:p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <div className="text-[10px] text-indigo-400/70 font-mono tracking-widest uppercase">DEPARTMENT: {user.department}</div>
                  <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles size={18} className="text-indigo-400 animate-pulse" />
                    Event Proposals &amp; Submissions
                  </h2>
                  <p className="text-xs text-slate-300 max-w-xl">
                    Submit campus/academic event proposals and monitor their real-time validation stages through the multi-level validation pipeline.
                  </p>
                </div>
                
                <button
                  onClick={onShowEventModal}
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/10 shrink-0 cursor-pointer self-start md:self-auto border border-indigo-500/20"
                >
                  <Plus size={15} />
                  <span>Propose New Campus Event</span>
                </button>
              </div>

              {/* Event proposals stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                  <div className="text-2xl font-bold text-white font-mono">{studentEvents.length}</div>
                  <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mt-1">Total Proposed Events</div>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                  <div className="text-2xl font-bold text-indigo-400 font-mono">
                    {studentEvents.filter((e) => e.status !== 'APPROVED' && e.status !== 'REJECTED').length}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mt-1">Pending Evaluation</div>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                  <div className="text-2xl font-bold text-emerald-400 font-mono">
                    {studentEvents.filter((e) => e.status === 'APPROVED').length}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mt-1">Fully Approved Proposals</div>
                </div>
              </div>

              {/* Proposals History List */}
              <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <CalendarDays size={16} className="text-indigo-400" />
                      My Submissions History
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Click any card to inspect workflow action logs or verify validation details.</p>
                  </div>
                  <button
                    id="btn-goto-pipeline-view"
                    onClick={() => {
                      if (studentEvents.length > 0) {
                        onSelectEvent(studentEvents[0]);
                      }
                      onTabChange('events');
                    }}
                    className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold flex items-center gap-1 cursor-pointer bg-indigo-500/5 hover:bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/10 hover:border-indigo-500/25 transition-all self-start sm:self-auto"
                  >
                    Pipeline View &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {studentEvents.map((evt) => (
                    <div
                      key={evt.id}
                      id={`student-event-card-${evt.id}`}
                      onClick={() => {
                        onSelectEvent(evt);
                        onTabChange('events');
                      }}
                      className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-indigo-500/30 rounded-xl transition-all cursor-pointer flex flex-col gap-3 group"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <h4 className="text-xs sm:text-sm font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">{evt.title}</h4>
                        <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded uppercase font-bold shrink-0 ${
                          evt.status === 'APPROVED'
                            ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30'
                            : evt.status === 'REJECTED'
                            ? 'bg-rose-950/40 text-rose-400 border border-rose-900/30'
                            : 'bg-indigo-950/40 text-indigo-400 border border-indigo-900/30'
                        }`}>
                          {evt.status.replace('PENDING_', '')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">{evt.description}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono border-t border-white/5 pt-2 mt-auto">
                        <span className="flex items-center gap-1"><Calendar size={11} /> {evt.date}</span>
                        <span className="flex items-center gap-1"><MapPin size={11} /> {evt.venue}</span>
                      </div>
                    </div>
                  ))}
                  {studentEvents.length === 0 && (
                    <div className="col-span-1 md:col-span-2 text-xs text-slate-500 italic p-12 text-center border border-dashed border-white/5 rounded-xl bg-black/10">
                      You haven't proposed any events yet. Click the "Propose New Campus Event" button above to initiate.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div id="student-grievances-page" className="space-y-6">
              {/* Grievances Banner & Header */}
              <div className="bg-gradient-to-tr from-rose-950/35 to-rose-900/10 border border-rose-500/25 rounded-2xl p-5 sm:p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <div className="text-[10px] text-rose-400/70 font-mono tracking-widest uppercase">DEPARTMENT: {user.department}</div>
                  <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <MessageSquare size={18} className="text-rose-400" />
                    Grievances &amp; Complaints Hub
                  </h2>
                  <p className="text-xs text-slate-300 max-w-xl">
                    Communicate and resolve academic or facility concerns with your Department HOD and College Dean in a dual-routing workspace.
                  </p>
                </div>
                
                <button
                  onClick={onShowComplaintModal}
                  className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-rose-600/10 shrink-0 cursor-pointer self-start md:self-auto border border-rose-500/20"
                >
                  <Plus size={15} />
                  <span>Raise Institutional Grievance</span>
                </button>
              </div>

              {/* Grievance stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                  <div className="text-2xl font-bold text-white font-mono">{studentComplaints.length}</div>
                  <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mt-1">Total Grievances Filed</div>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                  <div className="text-2xl font-bold text-amber-400 font-mono">
                    {studentComplaints.filter((c) => c.status !== 'RESOLVED').length}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mt-1">Active / In Review</div>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                  <div className="text-2xl font-bold text-emerald-400 font-mono">
                    {studentComplaints.filter((c) => c.status === 'RESOLVED').length}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mt-1">Resolved Concerns</div>
                </div>
              </div>

              {/* Active Grievances list */}
              <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <MessageSquare size={16} className="text-rose-400" />
                      Grievance Threads &amp; Status
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Click any grievance to view conversation messages or read administrative resolutions.</p>
                  </div>
                  <button
                    id="btn-goto-grievance-hub"
                    onClick={() => {
                      if (studentComplaints.length > 0) {
                        onSelectComplaint(studentComplaints[0]);
                      }
                      onTabChange('complaints');
                    }}
                    className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold flex items-center gap-1 cursor-pointer bg-indigo-500/5 hover:bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/10 hover:border-indigo-500/25 transition-all self-start sm:sm:self-auto"
                  >
                    Grievance Hub &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {studentComplaints.map((comp) => (
                    <div
                      key={comp.id}
                      id={`student-grievance-card-${comp.id}`}
                      onClick={() => {
                        onSelectComplaint(comp);
                        onTabChange('complaints');
                      }}
                      className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-indigo-500/30 rounded-xl transition-all cursor-pointer flex flex-col gap-3 group"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <h4 className="text-xs sm:text-sm font-semibold text-white truncate group-hover:text-rose-300 transition-colors">{comp.title}</h4>
                        <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded uppercase font-bold shrink-0 ${
                          comp.status === 'RESOLVED'
                            ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30'
                            : 'bg-amber-950/40 text-amber-400 border border-amber-900/30'
                        }`}>
                          {comp.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">{comp.description}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono border-t border-white/5 pt-2 mt-auto">
                        <span>Category: {comp.category}</span>
                        <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded text-[10px] text-slate-300 font-semibold"><MessageSquare size={10} /> {comp.messages.length} Replies</span>
                      </div>
                    </div>
                  ))}
                  {studentComplaints.length === 0 && (
                    <div className="col-span-1 md:col-span-2 text-xs text-slate-500 italic p-12 text-center border border-dashed border-white/5 rounded-xl bg-black/10">
                      No grievances raised. Your academic experience is fully verified!
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // RENDER: DEPARTMENT STAFF DASHBOARD
  if (user.role === 'Dept Staff') {
    return (
      <div className="space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-tr from-emerald-950/30 to-indigo-900/10 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 text-[10px] text-emerald-400/50 font-mono tracking-widest uppercase">ROLE: DEPT STAFF L1</div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Building size={16} className="text-emerald-400" />
            Dept Staff Validation Portal
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            First-level authority desk for verification and authorization of student event proposals in the{' '}
            <span className="text-emerald-400 font-semibold">{user.department}</span> department.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
            <div className="bg-black/40 border border-white/5 rounded-xl p-3">
              <div className="text-2xl font-bold text-emerald-400 font-mono">{deptPendingEvents.length}</div>
              <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Required Actions (Pending Staff)</div>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-xl p-3">
              <div className="text-2xl font-bold text-white font-mono">{deptHistoricalEvents.length}</div>
              <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Departmental History</div>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-xl p-3 col-span-2 sm:col-span-1">
              <div className="text-2xl font-bold text-indigo-400 font-mono">
                {deptHistoricalEvents.filter((e) => e.status === 'APPROVED').length}
              </div>
              <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Fully Approved Events</div>
            </div>
          </div>
        </div>

        {/* Action center: Active Queue */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <Clock size={14} className="text-amber-400 animate-pulse" />
              L1 Action Desk Queue: Validation Actions Required
            </h3>
            <span className="text-[10px] bg-emerald-950/40 text-emerald-400 border border-emerald-900/50 px-2 py-0.5 rounded font-mono font-bold">
              {deptPendingEvents.length} Pending
            </span>
          </div>

          <div className="space-y-4">
            {deptPendingEvents.map((evt) => (
              <div key={evt.id} className="p-4 bg-white/5 border border-white/5 hover:border-emerald-500/30 rounded-xl space-y-3 relative overflow-hidden transition-all">
                <div
                  className="flex items-start justify-between gap-4 cursor-pointer group/card"
                  onClick={() => {
                    onSelectEvent(evt);
                    onTabChange('events');
                  }}
                >
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-2 group-hover/card:text-indigo-400 transition-colors">
                      {evt.title}
                      <span className="text-[10px] font-mono text-slate-500 font-normal">ID: {evt.id}</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{evt.description}</p>
                    <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono mt-2">
                      <span className="flex items-center gap-1"><MapPin size={11} /> {evt.venue}</span>
                      <span className="flex items-center gap-1"><Calendar size={11} /> {evt.date}</span>
                      <span className="text-indigo-400 font-semibold">Proposed by Student: @{evt.created_by} {evt.created_by_roll ? `(Roll: ${evt.created_by_roll})` : ''}</span>
                    </div>
                  </div>
                </div>

                {/* Direct Action Box */}
                <div className="bg-black/30 border border-white/5 p-3 rounded-lg space-y-2.5">
                  {errorAction[evt.id] && (
                    <div className="text-[11px] text-rose-400 font-mono bg-rose-950/10 p-2 rounded border border-rose-900/30 flex items-center gap-1.5">
                      <AlertTriangle size={12} /> {errorAction[evt.id]}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Provide verification feedback remarks / notes (optional)..."
                      value={eventRemarks[evt.id] || ''}
                      onChange={(e) => setEventRemarks({ ...eventRemarks, [evt.id]: e.target.value })}
                      className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    />
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleQuickEventAction(evt.id, 'APPROVE')}
                        disabled={loadingAction[evt.id]}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] px-3.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 size={13} />
                        <span>Approve &amp; Forward</span>
                      </button>
                      <button
                        onClick={() => handleQuickEventAction(evt.id, 'REJECT')}
                        disabled={loadingAction[evt.id]}
                        className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] px-3.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <XCircle size={13} />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {deptPendingEvents.length === 0 && (
              <div className="text-center py-10 border border-dashed border-white/5 rounded-xl bg-black/15 text-slate-500 text-xs italic font-mono flex flex-col items-center justify-center gap-1.5">
                <CheckCircle2 size={24} className="text-emerald-500 opacity-60 animate-bounce" />
                <span>Excellent! Zero pending validation actions for @{user.username}.</span>
              </div>
            )}
          </div>
        </div>

        {/* Historical and General pipeline Overview */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">Departmental Events History</h3>
            <button
              onClick={() => {
                if (deptHistoricalEvents.length > 0) {
                  onSelectEvent(deptHistoricalEvents[0]);
                }
                onTabChange('events');
              }}
              className="text-indigo-400 hover:text-indigo-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
            >
              Full Pipeline &rarr;
            </button>
          </div>

          <div className="space-y-2.5">
            {deptHistoricalEvents.map((evt) => (
              <div
                key={evt.id}
                onClick={() => {
                  onSelectEvent(evt);
                  onTabChange('events');
                }}
                className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-4"
              >
                <div>
                  <h4 className="text-xs font-semibold text-white">{evt.title}</h4>
                  <p className="text-[10px] text-slate-500 font-mono">Date: {evt.date} • Venue: {evt.venue} • Creator: @{evt.created_by} {evt.created_by_roll ? `(Roll: ${evt.created_by_roll})` : ''}</p>
                </div>
                <div>
                  <span className={`text-[8px] font-mono px-2 py-0.5 rounded uppercase font-bold border ${
                    evt.status === 'APPROVED'
                      ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30'
                      : evt.status === 'REJECTED'
                      ? 'bg-rose-950/40 text-rose-400 border-rose-900/30'
                      : 'bg-indigo-950/40 text-indigo-400 border-indigo-900/30'
                  }`}>
                    {evt.status}
                  </span>
                </div>
              </div>
            ))}
            {deptHistoricalEvents.length === 0 && (
              <div className="text-center py-6 text-xs text-slate-600 italic">No departmental history available yet.</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // RENDER: HOD DASHBOARD
  if (user.role === 'HOD') {
    return (
      <div className="space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-tr from-indigo-950/45 to-purple-900/15 border border-indigo-500/25 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 text-[10px] text-indigo-400/50 font-mono tracking-widest uppercase">ROLE: DEPT HOD L2</div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Building size={16} className="text-indigo-300" />
            Head of Department (HOD) Oversight Dashboard
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Complete administrative command of student workflows, departmental event tracking, and student direct grievance resolution pipelines for{' '}
            <span className="text-indigo-400 font-semibold">{user.department}</span>.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
            <div className="bg-black/40 border border-white/5 rounded-xl p-3">
              <div className="text-2xl font-bold text-rose-400 font-mono">{activeDeptComplaints.length}</div>
              <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Active Department Grievances</div>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-xl p-3">
              <div className="text-2xl font-bold text-white font-mono">{events.filter((e) => e.department === user.department).length}</div>
              <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Total Department Events</div>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-xl p-3 col-span-2 sm:col-span-1">
              <div className="text-2xl font-bold text-emerald-400 font-mono">{resolvedDeptComplaints.length}</div>
              <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Grievances Resolved</div>
            </div>
          </div>
        </div>

        {/* Main Section: Split into Active Grievances resolution (HOD dual routing role) & Events tracker */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Department Grievance Quick Response Center */}
          <div className="lg:col-span-7 bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <MessageSquare size={14} className="text-rose-400" />
                Dual-Route Departmental Grievances Hub
              </h3>
              <button
                onClick={() => {
                  if (activeDeptComplaints.length > 0) {
                    onSelectComplaint(activeDeptComplaints[0]);
                  }
                  onTabChange('complaints');
                }}
                className="text-indigo-400 hover:text-indigo-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
              >
                Grievance Hub &rarr;
              </button>
            </div>

            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
              {activeDeptComplaints.map((comp) => (
                <div key={comp.id} className="p-4 bg-white/5 border border-white/5 hover:border-indigo-500/30 rounded-xl space-y-3">
                  <div
                    className="flex justify-between items-start gap-3 cursor-pointer group/card"
                    onClick={() => {
                      onSelectComplaint(comp);
                      onTabChange('complaints');
                    }}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover/card:text-rose-400 transition-colors">{comp.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-normal">{comp.description}</p>
                      <div className="text-[10px] text-slate-500 font-mono mt-1.5 flex items-center gap-2">
                        <span>Category: {comp.category}</span>
                        <span>•</span>
                        <span>Raised by student: @{comp.raised_by} {comp.raised_by_roll ? `(Roll: ${comp.raised_by_roll})` : ''}</span>
                      </div>
                    </div>
                    <span className="text-[8px] font-mono px-1.5 py-0.5 bg-red-950/40 text-rose-400 border border-rose-900/30 rounded font-bold uppercase shrink-0">
                      {comp.status}
                    </span>
                  </div>

                  {/* Reply direct container */}
                  <div className="bg-black/20 p-3 rounded-lg border border-white/5 space-y-2">
                    {errorAction[comp.id] && (
                      <div className="text-[11px] text-rose-400 font-mono bg-rose-950/10 p-2 rounded border border-rose-900/30">
                        {errorAction[comp.id]}
                      </div>
                    )}
                    <input
                      type="text"
                      placeholder="Type response to student..."
                      value={complaintReplies[comp.id] || ''}
                      onChange={(e) => setComplaintReplies({ ...complaintReplies, [comp.id]: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                    <div className="flex justify-end gap-1.5 pt-1">
                      <button
                        onClick={() => handleQuickComplaintReply(comp.id, 'IN_REVIEW')}
                        disabled={loadingAction[comp.id]}
                        className="bg-amber-950/40 hover:bg-amber-950/60 text-amber-400 border border-amber-900/30 font-bold text-[10px] px-2.5 py-1 rounded transition-all cursor-pointer disabled:opacity-50"
                      >
                        Keep in Review
                      </button>
                      <button
                        onClick={() => handleQuickComplaintReply(comp.id, 'RESOLVED')}
                        disabled={loadingAction[comp.id]}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-3 py-1 rounded transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
                      >
                        <CheckCircle2 size={11} />
                        <span>Resolve complaint</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {activeDeptComplaints.length === 0 && (
                <div className="text-center py-12 text-xs text-slate-500 italic font-mono border border-dashed border-white/5 rounded-xl bg-black/10 flex flex-col items-center justify-center gap-2">
                  <CheckCircle2 size={24} className="text-emerald-500 opacity-60" />
                  <span>Excellent! All student grievances in {user.department} resolved.</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Department Events Approval tracking */}
          <div className="lg:col-span-5 bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider flex items-center gap-2">
                <CalendarDays size={14} className="text-indigo-400" />
                Department Pipeline Tracking
              </h3>
              <button
                onClick={() => {
                  const deptEvents = events.filter((e) => e.department === user.department);
                  if (deptEvents.length > 0) {
                    onSelectEvent(deptEvents[0]);
                  }
                  onTabChange('events');
                }}
                className="text-indigo-400 hover:text-indigo-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
              >
                Full view &rarr;
              </button>
            </div>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {events
                .filter((e) => e.department === user.department)
                .map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => {
                      onSelectEvent(evt);
                      onTabChange('events');
                    }}
                    className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl cursor-pointer transition-all flex flex-col gap-1.5"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <span className="text-xs font-bold text-white truncate">{evt.title}</span>
                      <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded uppercase font-bold shrink-0 ${
                        evt.status === 'APPROVED'
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30'
                          : evt.status === 'REJECTED'
                          ? 'bg-rose-950/40 text-rose-400 border border-rose-900/30'
                          : 'bg-indigo-950/40 text-indigo-400 border border-indigo-900/30'
                      }`}>
                        {evt.status.replace('PENDING_', '')}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Venue: {evt.venue} • Date: {evt.date} • Proposed by: @{evt.created_by} {evt.created_by_roll ? `(Roll: ${evt.created_by_roll})` : ''}
                    </p>
                    <div className="flex items-center gap-1 text-[9px] font-mono text-slate-500 uppercase">
                      <span>FLOW STAGE:</span>
                      <span className="text-indigo-400 font-bold">
                        {evt.status === 'PENDING_DEPT_STAFF' ? 'L1: DEPT STAFF' : evt.status === 'PENDING_DEAN' ? 'L2: DEAN' : evt.status === 'PENDING_PRINCIPAL' ? 'L3: PRINCIPAL' : 'COMPLETED'}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

        </div>
      </div>
    );
  }

  // RENDER: DEAN DASHBOARD
  if (user.role === 'Dean') {
    return (
      <div className="space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-tr from-violet-950/40 to-indigo-900/10 border border-violet-500/20 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 text-[10px] text-violet-400/50 font-mono tracking-widest uppercase">ROLE: ACADEMIC DEAN L3</div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles size={16} className="text-violet-400" />
            Academic Dean Decision Desk
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Mid-level institutional event approval desk and high-priority college-wide grievance oversight committee chair.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="bg-black/40 border border-white/5 rounded-xl p-3">
              <div className="text-2xl font-bold text-violet-400 font-mono">{deanPendingEvents.length}</div>
              <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Dean Approvals Pending</div>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-xl p-3">
              <div className="text-2xl font-bold text-white font-mono">{events.length}</div>
              <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Total Campus Events</div>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-xl p-3">
              <div className="text-2xl font-bold text-rose-400 font-mono">{deanOversightComplaints.length}</div>
              <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Unresolved Grievances</div>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-xl p-3">
              <div className="text-2xl font-bold text-emerald-400 font-mono">
                {events.filter((e) => e.status === 'APPROVED').length}
              </div>
              <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Completed Workflows</div>
            </div>
          </div>
        </div>

        {/* Action queue: Dean Approval Pipeline */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <Lock size={14} className="text-violet-400" />
              L2 Dean Approval Pipeline Queue (Institutional Verification)
            </h3>
            <span className="text-[10px] bg-violet-950/40 text-violet-400 border border-violet-900/50 px-2.5 py-0.5 rounded font-mono font-bold">
              {deanPendingEvents.length} Actions Needed
            </span>
          </div>

          <div className="space-y-4">
            {deanPendingEvents.map((evt) => (
              <div key={evt.id} className="p-4 bg-white/5 border border-white/5 hover:border-violet-500/30 rounded-xl space-y-3 transition-all">
                <div
                  className="flex items-start justify-between gap-4 cursor-pointer group/card"
                  onClick={() => {
                    onSelectEvent(evt);
                    onTabChange('events');
                  }}
                >
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5 group-hover/card:text-indigo-400 transition-colors">
                      {evt.title}
                      <span className="text-[10px] bg-indigo-950/40 text-indigo-300 border border-indigo-900/30 px-2 py-0.2 rounded font-mono font-normal">
                        DEPT: {evt.department}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{evt.description}</p>
                    <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono mt-2.5">
                      <span className="flex items-center gap-1"><MapPin size={11} /> {evt.venue}</span>
                      <span className="flex items-center gap-1"><Calendar size={11} /> {evt.date}</span>
                      <span className="text-indigo-400">Created by: @{evt.created_by} {evt.created_by_roll ? `(Roll: ${evt.created_by_roll})` : ''}</span>
                    </div>
                  </div>
                </div>

                {/* Dean Decision box */}
                <div className="bg-black/30 border border-white/5 p-3 rounded-lg space-y-2.5">
                  {errorAction[evt.id] && (
                    <div className="text-[11px] text-rose-400 font-mono bg-rose-950/10 p-2 rounded border border-rose-900/30">
                      {errorAction[evt.id]}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add Dean feedback / directives remarks (optional)..."
                      value={eventRemarks[evt.id] || ''}
                      onChange={(e) => setEventRemarks({ ...eventRemarks, [evt.id]: e.target.value })}
                      className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                    />
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleQuickEventAction(evt.id, 'APPROVE')}
                        disabled={loadingAction[evt.id]}
                        className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-[11px] px-3.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 size={13} />
                        <span>Authorize &amp; Forward</span>
                      </button>
                      <button
                        onClick={() => handleQuickEventAction(evt.id, 'REJECT')}
                        disabled={loadingAction[evt.id]}
                        className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] px-3.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <XCircle size={13} />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {deanPendingEvents.length === 0 && (
              <div className="text-center py-12 border border-dashed border-white/5 rounded-xl bg-black/15 text-slate-500 text-xs italic font-mono flex flex-col items-center justify-center gap-2">
                <CheckCircle2 size={24} className="text-emerald-500 opacity-60" />
                <span>Zero pending event authorizations required from the Dean at this time.</span>
              </div>
            )}
          </div>
        </div>

        {/* Campus Grievance Oversight Panel */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider flex items-center gap-2">
              <MessageSquare size={14} className="text-rose-400" />
              Campus Grievances Oversight Desk
            </h3>
            <button
              onClick={() => {
                if (deanOversightComplaints.length > 0) {
                  onSelectComplaint(deanOversightComplaints[0]);
                }
                onTabChange('complaints');
              }}
              className="text-indigo-400 hover:text-indigo-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
            >
              All Threads &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {deanOversightComplaints.slice(0, 3).map((comp) => (
              <div
                key={comp.id}
                onClick={() => {
                  onSelectComplaint(comp);
                  onTabChange('complaints');
                }}
                className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-semibold text-white">{comp.title}</h4>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Dept: {comp.department} • Raised by: student @{comp.raised_by} {comp.raised_by_roll ? `(Roll: ${comp.raised_by_roll})` : ''} • Replies: {comp.messages.length}
                  </p>
                </div>
                <span className="text-[8px] font-mono font-bold px-2 py-0.5 bg-rose-950/30 text-rose-300 border border-rose-900/30 rounded uppercase">
                  {comp.status}
                </span>
              </div>
            ))}
            {deanOversightComplaints.length === 0 && (
              <div className="text-center py-6 text-xs text-slate-600 italic">No open grievances on campus.</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // RENDER: PRINCIPAL DASHBOARD
  if (user.role === 'Principal') {
    return (
      <div className="space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-tr from-rose-950/30 to-indigo-900/10 border border-rose-500/20 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 text-[10px] text-rose-400/50 font-mono tracking-widest uppercase">ROLE: PRINCIPAL L3</div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldAlert size={16} className="text-rose-400 animate-pulse" />
            Principal Executive Desk
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Ultimate validation and final executive signature authority on all institutional pipelines, academic events, and college-wide workflows.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="bg-black/40 border border-white/5 rounded-xl p-3">
              <div className="text-2xl font-bold text-rose-400 font-mono">{principalPendingEvents.length}</div>
              <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Final Signature Queue</div>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-xl p-3">
              <div className="text-2xl font-bold text-white font-mono">{events.length}</div>
              <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Campus Events Total</div>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-xl p-3">
              <div className="text-2xl font-bold text-emerald-400 font-mono">
                {events.filter((e) => e.status === 'APPROVED').length}
              </div>
              <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Approved Events</div>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-xl p-3">
              <div className="text-2xl font-bold text-indigo-400 font-mono">{auditLogs.length}</div>
              <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Security Audits</div>
            </div>
          </div>
        </div>

        {/* Principal Active Queue */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={14} className="text-emerald-400" />
              L3 Final Executive Signature Queue: Action Required
            </h3>
            <span className="text-[10px] bg-rose-950/40 text-rose-400 border border-rose-900/50 px-2.5 py-0.5 rounded font-mono font-bold">
              {principalPendingEvents.length} Pending
            </span>
          </div>

          <div className="space-y-4">
            {principalPendingEvents.map((evt) => (
              <div key={evt.id} className="p-4 bg-white/5 border border-white/5 hover:border-emerald-500/30 rounded-xl space-y-3 transition-all">
                <div
                  className="flex items-start justify-between gap-4 cursor-pointer group/card"
                  onClick={() => {
                    onSelectEvent(evt);
                    onTabChange('events');
                  }}
                >
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover/card:text-indigo-400 transition-colors">
                      {evt.title}
                      <span className="ml-2 text-[10px] text-slate-500 font-mono font-normal">ID: {evt.id}</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{evt.description}</p>
                    <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono mt-2.5">
                      <span className="flex items-center gap-1"><MapPin size={11} /> {evt.venue}</span>
                      <span className="flex items-center gap-1"><Calendar size={11} /> {evt.date}</span>
                      <span className="text-emerald-400">Dept Origin: {evt.department}</span>
                      <span className="text-indigo-400">Proposed by: @{evt.created_by} {evt.created_by_roll ? `(Roll: ${evt.created_by_roll})` : ''}</span>
                    </div>
                  </div>
                </div>

                {/* Final Decision Form */}
                <div className="bg-black/30 border border-white/5 p-3 rounded-lg space-y-2.5">
                  {errorAction[evt.id] && (
                    <div className="text-[11px] text-rose-400 font-mono bg-rose-950/10 p-2 rounded border border-rose-900/30">
                      {errorAction[evt.id]}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add institutional executive directives / signature remarks (optional)..."
                      value={eventRemarks[evt.id] || ''}
                      onChange={(e) => setEventRemarks({ ...eventRemarks, [evt.id]: e.target.value })}
                      className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                    />
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleQuickEventAction(evt.id, 'APPROVE')}
                        disabled={loadingAction[evt.id]}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] px-3.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-600/10"
                      >
                        <CheckCircle2 size={13} />
                        <span>Sign &amp; Approve Event</span>
                      </button>
                      <button
                        onClick={() => handleQuickEventAction(evt.id, 'REJECT')}
                        disabled={loadingAction[evt.id]}
                        className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] px-3.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-md shadow-rose-600/10"
                      >
                        <XCircle size={13} />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {principalPendingEvents.length === 0 && (
              <div className="text-center py-12 border border-dashed border-white/5 rounded-xl bg-black/15 text-slate-500 text-xs italic font-mono flex flex-col items-center justify-center gap-2">
                <CheckCircle2 size={24} className="text-emerald-500 opacity-60" />
                <span>Zero pending executive sign-offs required. Your command desk is pristine.</span>
              </div>
            )}
          </div>
        </div>

        {/* Security Log Ticker at bottom for Principal audit trail */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Terminal size={14} className="text-indigo-400" />
              Live Security Auditing Stream
            </h4>
            <button
              onClick={() => onTabChange('logs')}
              className="text-indigo-400 hover:text-indigo-300 text-[11px] font-semibold cursor-pointer"
            >
              Verify logs &rarr;
            </button>
          </div>
          <div className="space-y-2">
            {auditLogs.slice(0, 3).map((log) => (
              <div key={log.id} className="flex gap-3 text-xs font-mono">
                <span className="text-slate-600">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                <span className={`font-bold uppercase ${
                  log.type === 'DENIED'
                    ? 'text-rose-400'
                    : log.type === 'SUCCESS'
                    ? 'text-emerald-400'
                    : 'text-indigo-400'
                }`}>{log.type}</span>
                <span className="text-slate-500">&lt;{log.actor}&gt;</span>
                <span className="text-slate-300 truncate">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return null;
}
