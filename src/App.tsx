/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, FormEvent } from 'react';
import { User, Event, Complaint, Role, Department, DEPARTMENTS } from './types';
import {
  getMe,
  getEvents,
  createEvent,
  performEventAction,
  getComplaints,
  raiseComplaint,
  respondToComplaint,
} from './lib/api';
import { Header } from './components/Header';
import { LoginRegister } from './components/LoginRegister';
import { RoleBadge } from './components/RoleBadge';
import { RoleDashboards } from './components/RoleDashboards';
import { EventPipelinePage } from './components/EventPipelinePage';
import { GrievanceHubPage } from './components/GrievanceHubPage';
import { SecurityLogsPage } from './components/SecurityLogsPage';
import { AdminPrivilegeDashboard } from './components/AdminPrivilegeDashboard';
import { SystemUpdateAnimation } from './components/SystemUpdateAnimation';
import {
  LayoutDashboard,
  CalendarDays,
  ShieldAlert,
  Send,
  Plus,
  Clock,
  MapPin,
  Calendar,
  Lock,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  FileCode,
  Terminal,
  X,
} from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'DENIED' | 'ACTION';
  actor: string;
  message: string;
}

const CURRENT_BUILD_VERSION = 'v1.0.1_title_campus_connect';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('college_portal_token'));
  const [activeTab, setActiveTab] = useState<'dashboard' | 'events' | 'complaints' | 'logs'>('dashboard');
  const [loading, setLoading] = useState<boolean>(true);
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(() => {
    const lastSeen = localStorage.getItem('campus_connect_update_seen');
    if (lastSeen !== CURRENT_BUILD_VERSION) {
      localStorage.setItem('campus_connect_update_seen', CURRENT_BUILD_VERSION);
      return true;
    }
    return false;
  });

  // Core Data State
  const [events, setEvents] = useState<Event[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      id: 'log-1',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      type: 'INFO',
      actor: 'SYSTEM',
      message: 'Institutional security protocol RBAC-V4 loaded successfully.',
    },
  ]);

  // Selected details
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // Form states
  const [showEventModal, setShowEventModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);

  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventVenue, setNewEventVenue] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [eventFormError, setEventFormError] = useState('');

  const [newCompTitle, setNewCompTitle] = useState('');
  const [newCompCategory, setNewCompCategory] = useState('Infrastructure');
  const [newCompDesc, setNewCompDesc] = useState('');
  const [compFormError, setCompFormError] = useState('');

  // Responder/Action states
  const [remarks, setRemarks] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [chatError, setChatError] = useState('');
  const [actionError, setActionError] = useState('');

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Logger helper
  const addLog = (type: AuditLog['type'], actor: string, message: string) => {
    const newLog: AuditLog = {
      id: `log-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      type,
      actor,
      message,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Check login on load
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const data = await getMe();
          setUser(data.user);
          addLog('SUCCESS', data.user.username, `Authenticated session resumed as ${data.user.role}.`);
          fetchData();
        } catch (err) {
          console.error('Session validation failed', err);
          handleLogout();
        }
      } else {
        setLoading(false);
      }
    };
    initAuth();
  }, [token]);

  // Refetch core data
  const fetchData = async () => {
    try {
      const [eventsList, complaintsList] = await Promise.all([getEvents(), getComplaints()]);
      setEvents(eventsList);
      setComplaints(complaintsList);
      
      // Update details selection references if they exist
      if (selectedEvent) {
        const updatedEvt = eventsList.find((e) => e.id === selectedEvent.id);
        if (updatedEvt) setSelectedEvent(updatedEvt);
      }
      if (selectedComplaint) {
        const updatedComp = complaintsList.find((c) => c.id === selectedComplaint.id);
        if (updatedComp) setSelectedComplaint(updatedComp);
      }
    } catch (err: any) {
      console.error('Error fetching data', err);
      addLog('WARNING', 'SYSTEM', `Failed to fetch fresh workflow lists: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (loggedInUser: User, sessionToken: string) => {
    setUser(loggedInUser);
    setToken(sessionToken);
    addLog('SUCCESS', loggedInUser.username, `Authenticated successfully as ${loggedInUser.role} [${loggedInUser.department || 'Administration'}].`);
    setLoading(true);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('college_portal_token');
    setUser(null);
    setToken(null);
    setSelectedEvent(null);
    setSelectedComplaint(null);
    setEvents([]);
    setComplaints([]);
    addLog('INFO', 'SESSION', 'User logged out. Stateless session token revoked.');
  };

  const handleEventProposalSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setEventFormError('');

    if (!newEventTitle.trim() || !newEventDesc.trim() || !newEventVenue.trim() || !newEventDate) {
      setEventFormError('All fields are required.');
      return;
    }

    try {
      const created = await createEvent({
        title: newEventTitle.trim(),
        description: newEventDesc.trim(),
        venue: newEventVenue.trim(),
        date: newEventDate,
      });

      addLog('ACTION', user?.username || 'Student', `Submitted Event Proposal: "${created.title}" [status: PENDING_DEPT_STAFF].`);
      
      // Clean up & reload
      setNewEventTitle('');
      setNewEventDesc('');
      setNewEventVenue('');
      setNewEventDate('');
      setShowEventModal(false);
      
      await fetchData();
      setSelectedEvent(created);
    } catch (err: any) {
      setEventFormError(err.message || 'Submission failed.');
      addLog('WARNING', user?.username || 'Student', `Failed event creation: ${err.message}`);
    }
  };

  const handleComplaintSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setCompFormError('');

    if (!newCompTitle.trim() || !newCompDesc.trim()) {
      setCompFormError('Title and description are required.');
      return;
    }

    try {
      const created = await raiseComplaint({
        title: newCompTitle.trim(),
        category: newCompCategory,
        description: newCompDesc.trim(),
      });

      addLog('ACTION', user?.username || 'Student', `Raised Complaint: "${created.title}" [status: OPEN]. Dual-routed to department HOD and Dean.`);
      
      setNewCompTitle('');
      setNewCompDesc('');
      setShowComplaintModal(false);
      
      await fetchData();
      setSelectedComplaint(created);
    } catch (err: any) {
      setCompFormError(err.message || 'Failed to submit complaint.');
      addLog('WARNING', user?.username || 'Student', `Failed grievance submission: ${err.message}`);
    }
  };

  const handleEventApproveReject = async (action: 'APPROVE' | 'REJECT') => {
    if (!selectedEvent) return;
    setActionError('');
    try {
      const updated = await performEventAction(selectedEvent.id, action, remarks);
      addLog('SUCCESS', user?.username || 'Staff', `${action === 'APPROVE' ? 'Approved' : 'Rejected'} event "${selectedEvent.title}" (Status updated to: ${updated.status}).`);
      setRemarks('');
      await fetchData();
    } catch (err: any) {
      setActionError(err.message || 'Action failed.');
      addLog('DENIED', user?.username || 'Staff', `Denied action on event "${selectedEvent.title}" (403 Forbidden). ${err.message}`);
    }
  };

  const handleComplaintReply = async (statusUpdate?: 'IN_REVIEW' | 'RESOLVED') => {
    if (!selectedComplaint) return;
    if (!chatMessage.trim()) {
      setChatError('Please type a message first.');
      return;
    }
    setChatError('');
    try {
      const updated = await respondToComplaint(selectedComplaint.id, chatMessage, statusUpdate);
      addLog('ACTION', user?.username || 'User', `Replied to Complaint "${selectedComplaint.title}" [Status: ${updated.status}].`);
      setChatMessage('');
      await fetchData();
      // Scroll chat window to bottom
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      setChatError(err.message || 'Failed to send reply.');
      addLog('DENIED', user?.username || 'User', `Denied message on complaint "${selectedComplaint.title}" (403). ${err.message}`);
    }
  };

  const performEventActionDirect = async (eventId: string, action: 'APPROVE' | 'REJECT', remarksArg?: string) => {
    try {
      const updated = await performEventAction(eventId, action, remarksArg || '');
      addLog('SUCCESS', user?.username || 'User', `${action === 'APPROVE' ? 'Approved' : 'Rejected'} event "${updated.title}" (Status updated to: ${updated.status}).`);
      await fetchData();
    } catch (err: any) {
      addLog('DENIED', user?.username || 'User', `Denied action on event ID "${eventId}" (403 Forbidden). ${err.message}`);
      throw err;
    }
  };

  const respondToComplaintDirect = async (complaintId: string, message: string, statusArg?: 'IN_REVIEW' | 'RESOLVED') => {
    try {
      const updated = await respondToComplaint(complaintId, message, statusArg);
      addLog('ACTION', user?.username || 'User', `Replied to Complaint "${updated.title}" [Status: ${updated.status}].`);
      await fetchData();
    } catch (err: any) {
      addLog('DENIED', user?.username || 'User', `Denied message on complaint ID "${complaintId}" (403). ${err.message}`);
      throw err;
    }
  };

  // Scroll bottom trigger
  useEffect(() => {
    if (selectedComplaint) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedComplaint]);

  // Determine active pending events count
  const getPendingActionsCount = () => {
    if (!user) return 0;
    return events.filter((e) => {
      if (e.status === 'PENDING_DEPT_STAFF' && user.role === 'Dept Staff' && user.department === e.department) return true;
      if (e.status === 'PENDING_DEAN' && user.role === 'Dean') return true;
      if (e.status === 'PENDING_PRINCIPAL' && user.role === 'Principal') return true;
      return false;
    }).length;
  };

  // Helper to draw status step pipeline
  const renderStepProgress = (evtStatus: Event['status']) => {
    const steps: { label: string; key: typeof evtStatus | 'INIT' }[] = [
      { label: 'Proposed', key: 'INIT' },
      { label: 'Dept Staff', key: 'PENDING_DEPT_STAFF' },
      { label: 'Dean Approval', key: 'PENDING_DEAN' },
      { label: 'Principal Approval', key: 'PENDING_PRINCIPAL' },
    ];

    let currentStepIndex = 0;
    if (evtStatus === 'PENDING_DEPT_STAFF') currentStepIndex = 1;
    else if (evtStatus === 'PENDING_DEAN') currentStepIndex = 2;
    else if (evtStatus === 'PENDING_PRINCIPAL') currentStepIndex = 3;
    else if (evtStatus === 'APPROVED') currentStepIndex = 4;
    else if (evtStatus === 'REJECTED') currentStepIndex = -1;

    return (
      <div className="mt-4 pt-4 border-t border-white/5">
        <div className="text-[10px] text-slate-500 font-mono tracking-wider uppercase mb-3">Workflow Lifecycle Status</div>
        {currentStepIndex === -1 ? (
          <div className="flex items-center gap-2 bg-rose-950/20 border border-rose-900/40 text-rose-400 p-2.5 rounded-lg text-xs font-semibold">
            <XCircle size={14} />
            <span>PROPOSAL REJECTED - WORKFLOW TERMINATED</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium">Approval Pipeline</span>
              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/50 border border-indigo-900/30 px-2 py-0.5 rounded uppercase">
                {evtStatus === 'APPROVED' ? 'APPROVED' : `STAGE: ${currentStepIndex}/3`}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {steps.map((st, idx) => {
                const isPassed = idx < currentStepIndex || evtStatus === 'APPROVED';
                const isCurrent = idx === currentStepIndex && evtStatus !== 'APPROVED';
                
                return (
                  <div key={st.label} className="flex flex-col gap-1.5">
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
                    <span className={`text-[9px] font-mono truncate ${isCurrent ? 'text-indigo-400 font-bold' : isPassed ? 'text-emerald-400' : 'text-slate-600'}`}>
                      {st.label}
                    </span>
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
    <div className="min-h-screen bg-brand-bg text-brand-ink font-sans flex flex-col relative overflow-x-hidden">

      {/* Main Header Component */}
      <Header
        user={user}
        onLogout={handleLogout}
        onLoginSuccess={handleLoginSuccess}
        onRefreshData={fetchData}
        onLogoClick={() => setActiveTab('dashboard')}
        onOpenUpdateModal={() => setShowUpdateModal(true)}
      />

      {/* Auth Screen or Main Cockpit */}
      {!user ? (
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="text-center max-w-lg mb-8 space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tighter text-brand-ink font-mono uppercase">
              CAMPUS FLOW SYSTEM
            </h1>
            <p className="text-sm text-brand-ink/70 leading-relaxed">
              Institutional pipeline for multi-level event coordination approvals, role-scoped authority validations, and direct dual-routing student grievance resolutions.
            </p>
          </div>
          <LoginRegister onLoginSuccess={handleLoginSuccess} />
        </main>
      ) : (
        <div id="main-dashboard-container" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 z-10">
          {/* Main Display Center */}
          <main className="w-full flex flex-col gap-6">

            {/* Global Tab Navigation */}
            <div className="flex border-b-2 border-brand-ink gap-2 sm:gap-6 overflow-x-auto pb-px scrollbar-none shrink-0">
              <button
                id="global-tab-dashboard"
                onClick={() => setActiveTab('dashboard')}
                className={`pb-3 px-1 text-xs font-bold border-b-2 cursor-pointer transition-all shrink-0 uppercase tracking-wider font-mono flex items-center gap-2 ${
                  activeTab === 'dashboard'
                    ? 'border-brand-accent text-brand-ink font-bold'
                    : 'border-transparent text-brand-ink/50 hover:text-brand-ink'
                }`}
              >
                <LayoutDashboard size={13} />
                <span>{user.role === 'Software Admin' ? 'User Privileges' : 'Dashboard Cockpit'}</span>
              </button>

              {user.role !== 'Software Admin' && (
                <>
                  <button
                    id="global-tab-events"
                    onClick={() => {
                      setActiveTab('events');
                    }}
                    className={`pb-3 px-1 text-xs font-bold border-b-2 cursor-pointer transition-all shrink-0 uppercase tracking-wider font-mono flex items-center gap-2 ${
                      activeTab === 'events'
                        ? 'border-brand-accent text-brand-ink font-bold'
                        : 'border-transparent text-brand-ink/50 hover:text-brand-ink'
                    }`}
                  >
                    <CalendarDays size={13} />
                    <span>Pipeline View ({events.length})</span>
                  </button>

                  <button
                    id="global-tab-complaints"
                    onClick={() => {
                      setActiveTab('complaints');
                    }}
                    className={`pb-3 px-1 text-xs font-bold border-b-2 cursor-pointer transition-all shrink-0 uppercase tracking-wider font-mono flex items-center gap-2 ${
                      activeTab === 'complaints'
                        ? 'border-brand-accent text-brand-ink font-bold'
                        : 'border-transparent text-brand-ink/50 hover:text-brand-ink'
                    }`}
                  >
                    <MessageSquare size={13} />
                    <span>Grievance Hub ({complaints.length})</span>
                  </button>
                </>
              )}

              <button
                id="global-tab-logs"
                onClick={() => {
                  setActiveTab('logs');
                }}
                className={`pb-3 px-1 text-xs font-bold border-b-2 cursor-pointer transition-all shrink-0 uppercase tracking-wider font-mono flex items-center gap-2 ${
                  activeTab === 'logs'
                    ? 'border-brand-accent text-brand-ink font-bold'
                    : 'border-transparent text-brand-ink/50 hover:text-brand-ink'
                }`}
              >
                <Terminal size={13} />
                <span>Security Audits</span>
              </button>
            </div>
            
            {/* Loading Indicator */}
            {loading ? (
              <div className="bg-white border-2 border-brand-ink rounded-xl p-12 flex flex-col items-center justify-center gap-3 shadow-[4px_4px_0px_0px_#1D1818]">
                <div className="w-8 h-8 rounded-full border-2 border-brand-accent border-t-transparent animate-spin"></div>
                <p className="text-xs font-mono text-brand-ink">Syncing with Campus Workflow Ledger...</p>
              </div>
            ) : (
              <>
                {activeTab === 'dashboard' && (
                  user.role === 'Software Admin' ? (
                    <AdminPrivilegeDashboard
                      user={user}
                      onRefreshData={fetchData}
                      addLog={addLog}
                    />
                  ) : (
                    <RoleDashboards
                      user={user}
                      events={events}
                      complaints={complaints}
                      auditLogs={auditLogs}
                      onTabChange={setActiveTab}
                      onSelectEvent={setSelectedEvent}
                      onSelectComplaint={setSelectedComplaint}
                      onShowEventModal={() => {
                        setEventFormError('');
                        setShowEventModal(true);
                      }}
                      onShowComplaintModal={() => {
                        setCompFormError('');
                        setShowComplaintModal(true);
                      }}
                      onPerformEventAction={performEventActionDirect}
                      onRespondToComplaint={respondToComplaintDirect}
                    />
                  )
                )}

                {activeTab === 'events' && user.role !== 'Software Admin' && (
                  <EventPipelinePage
                    user={user}
                    events={events}
                    selectedEvent={selectedEvent}
                    onSelectEvent={setSelectedEvent}
                    onShowEventModal={() => {
                      setEventFormError('');
                      setShowEventModal(true);
                    }}
                    onPerformEventAction={performEventActionDirect}
                  />
                )}

                {activeTab === 'complaints' && user.role !== 'Software Admin' && (
                  <GrievanceHubPage
                    user={user}
                    complaints={complaints}
                    selectedComplaint={selectedComplaint}
                    onSelectComplaint={setSelectedComplaint}
                    onShowComplaintModal={() => {
                      setCompFormError('');
                      setShowComplaintModal(true);
                    }}
                    onRespondToComplaint={respondToComplaintDirect}
                  />
                )}

                {activeTab === 'logs' && (
                  <SecurityLogsPage
                    user={user}
                    auditLogs={auditLogs}
                  />
                )}
              </>
            )}

          </main>
        </div>
      )}

      {/* Event Details Overlay Modal */}
      {activeTab === 'dashboard' && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0d0d10] border border-white/10 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Close Button */}
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex-1 overflow-y-auto space-y-5 pr-1 mt-4">
              {/* Event info */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/5 pr-8">
                  <div>
                    <h2 className="text-base font-bold text-white leading-tight">{selectedEvent.title}</h2>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Proposed by <span className="text-slate-300 font-semibold">{selectedEvent.created_by} {selectedEvent.created_by_roll ? `(Roll: ${selectedEvent.created_by_roll})` : ''}</span> belonging to the <span className="text-slate-300 font-semibold">{selectedEvent.department}</span> department.
                    </p>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 bg-white/5 px-2.5 py-1 rounded border border-white/5">
                    ID: {selectedEvent.id}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4 bg-white/[0.02] border border-white/5 p-3 rounded-xl text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-500 block font-mono">VENUE LOCATION</span>
                    <span className="text-slate-200 font-medium flex items-center gap-1.5">
                      <MapPin size={12} className="text-indigo-400 shrink-0" />
                      {selectedEvent.venue}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 block font-mono">PROPOSED DATE</span>
                    <span className="text-slate-200 font-medium flex items-center gap-1.5">
                      <Calendar size={12} className="text-indigo-400 shrink-0" />
                      {selectedEvent.date}
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5">
                  <span className="text-[10px] text-slate-500 font-mono block">PROPOSAL DETAILS</span>
                  <p className="text-xs text-slate-300 bg-white/[0.01] border border-white/5 p-3 rounded-lg leading-relaxed whitespace-pre-wrap">
                    {selectedEvent.description}
                  </p>
                </div>

                {/* Approval Step progress visualizer */}
                {renderStepProgress(selectedEvent.status)}
              </div>

              {/* Approval Activity Log */}
              <div className="space-y-2 pt-2">
                <h4 className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Workflow Action Log</h4>
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {selectedEvent.activities.map((act) => (
                    <div key={act.id} className="p-2.5 rounded-lg bg-white/5 border border-white/5 text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-200 flex items-center gap-1">
                          {act.action === 'APPROVE' ? (
                            <CheckCircle2 size={12} className="text-emerald-400" />
                          ) : (
                            <XCircle size={12} className="text-rose-400" />
                          )}
                          {act.actorRole} ({act.actorName})
                        </span>
                        <span className="text-[9px] font-mono text-slate-500">
                          {new Date(act.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      {act.remarks ? (
                        <p className="text-slate-400 italic">" {act.remarks} "</p>
                      ) : (
                        <p className="text-slate-500 italic">No remarks provided.</p>
                      )}
                    </div>
                  ))}
                  {selectedEvent.activities.length === 0 && (
                    <p className="text-xs text-slate-500 italic p-3 text-center border border-white/5 border-dashed rounded-lg bg-black/20 font-mono">
                      No decision actions recorded yet. Proposal is awaiting review.
                    </p>
                  )}
                </div>
              </div>

              {/* Approval Actions Panel (Check if current role is authorised) */}
              <div className="pt-4 border-t border-white/5 bg-black/20 p-4 rounded-xl border border-white/5">
                {actionError && (
                  <div className="bg-rose-950/20 border border-rose-900/50 text-rose-300 p-2.5 rounded-lg text-xs font-semibold mb-3 flex items-center gap-1.5">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>{actionError}</span>
                  </div>
                )}

                {/* Check authority */}
                {(selectedEvent.status === 'PENDING_DEPT_STAFF' && user.role === 'Dept Staff' && user.department === selectedEvent.department) ||
                (selectedEvent.status === 'PENDING_DEAN' && user.role === 'Dean') ||
                (selectedEvent.status === 'PENDING_PRINCIPAL' && user.role === 'Principal') ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-indigo-300 font-bold flex items-center gap-1">
                        <Lock size={12} /> ACTION DESK AUTHORISED
                      </span>
                      <span className="text-slate-400">Stage: {selectedEvent.status}</span>
                    </div>
                    
                    <input
                      id="action-remarks"
                      type="text"
                      placeholder="Provide optional remarks / review remarks..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        id="btn-event-approve"
                        onClick={async () => {
                          try {
                            await handleEventApproveReject('APPROVE');
                            setSelectedEvent(null);
                          } catch (err) {}
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/10"
                      >
                        <CheckCircle2 size={13} />
                        <span>Approve &amp; Forward</span>
                      </button>
                      <button
                        id="btn-event-reject"
                        onClick={async () => {
                          try {
                            await handleEventApproveReject('REJECT');
                            setSelectedEvent(null);
                          } catch (err) {}
                        }}
                        className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-rose-600/10"
                      >
                        <XCircle size={13} />
                        <span>Reject Proposal</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 font-mono text-center flex items-center justify-center gap-2">
                    <Lock size={12} className="opacity-60" />
                    <span>
                      {selectedEvent.status === 'APPROVED' || selectedEvent.status === 'REJECTED'
                        ? 'Workflow lifecycle completed.'
                        : 'Awaiting action from corresponding authority stage.'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complaint Chat / Details Overlay Modal */}
      {activeTab === 'dashboard' && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0d0d10] border border-white/10 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Close Button */}
            <button
              onClick={() => setSelectedComplaint(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer z-10"
            >
              <X size={16} />
            </button>

            {/* Chat Room Header */}
            <div className="pb-4 border-b border-white/5 bg-white/[0.01] flex items-center justify-between gap-4 pr-8 mt-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-400 font-mono">Grievance Dual Route Thread:</span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                    selectedComplaint.status === 'RESOLVED'
                      ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-400/30'
                      : 'bg-amber-950/40 text-amber-400 border border-amber-400/30'
                  }`}>
                    {selectedComplaint.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white leading-snug truncate max-w-md mt-0.5">
                  {selectedComplaint.title}
                </h3>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  Department Scope: {selectedComplaint.department} • Raised by student: {selectedComplaint.raised_by} {selectedComplaint.raised_by_roll ? `(Roll: ${selectedComplaint.raised_by_roll})` : ''}
                </p>
              </div>
              <div className="text-[10px] font-mono bg-white/5 px-2 py-1 rounded border border-white/5 text-slate-400 hidden sm:block shrink-0">
                ID: {selectedComplaint.id}
              </div>
            </div>

            {/* Chat messages viewport */}
            <div className="flex-1 py-4 overflow-y-auto bg-black/10 space-y-4 px-1">
              {/* Original Complaint Statement Card */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs space-y-2">
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono pb-2 border-b border-white/5">
                  <span className="font-bold text-slate-400 uppercase">ORIGINAL GRIEVANCE DETAIL</span>
                  <span>Category: {selectedComplaint.category}</span>
                </div>
                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{selectedComplaint.description}</p>
              </div>

              <div className="h-px bg-white/5"></div>

              {/* Conversation Messages */}
              {selectedComplaint.messages.map((msg) => {
                const isMe = msg.senderName === user.username;
                return (
                  <div key={msg.id} className={`flex flex-col max-w-[85%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-bold text-slate-300">{msg.senderName}</span>
                      <RoleBadge role={msg.senderRole as Role} size="sm" />
                      <span className="text-[9px] font-mono text-slate-500">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className={`p-3 rounded-2xl text-xs leading-normal whitespace-pre-wrap ${
                      isMe
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-none'
                    }`}>
                      {msg.message}
                    </div>
                  </div>
                );
              })}

              {selectedComplaint.messages.length === 0 && (
                <p className="text-xs text-slate-500 italic text-center py-6 font-mono">
                  No replies on this dual-routed grievance channel yet.
                </p>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Chat Action bar */}
            <div className="pt-4 border-t border-white/5 bg-[#0d0d10]">
              {chatError && (
                <div className="bg-rose-950/20 border border-rose-900/50 text-rose-300 p-2 rounded text-xs font-semibold mb-2">
                  {chatError}
                </div>
              )}

              {user.role === 'Student' ? (
                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-center text-slate-400 text-xs italic font-mono flex items-center justify-center gap-2">
                  <Lock size={12} className="opacity-60 text-indigo-400" />
                  <span>This thread is read-only for students. Awaiting higher authority response.</span>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    id="chat-reply-input"
                    type="text"
                    placeholder="Type response message here..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleComplaintReply();
                    }}
                    className="flex-1 px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />

                  <button
                    id="btn-chat-send"
                    onClick={() => handleComplaintReply()}
                    className="bg-indigo-600 hover:bg-indigo-500 p-2 rounded-xl text-white flex items-center justify-center cursor-pointer transition-all"
                    title="Send response message"
                  >
                    <Send size={15} />
                  </button>
                </div>
              )}

              {/* HOD / DEAN Action controllers for status updates */}
              {user.role === 'HOD' && user.department === selectedComplaint.department ||
              user.role === 'Dean' ? (
                <div className="flex flex-wrap gap-2 mt-2.5 pt-2.5 border-t border-white/5 items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">Resolve control:</span>
                  <div className="flex gap-1.5">
                    {/* Only HOD/Dean can set In Review or Resolve */}
                    <button
                      id="btn-complaint-inreview"
                      onClick={() => handleComplaintReply('IN_REVIEW')}
                      className="px-2.5 py-1 text-[10px] font-bold bg-amber-950/30 hover:bg-amber-950/50 text-amber-400 border border-amber-900/40 rounded transition-all cursor-pointer"
                    >
                      Mark "In Review"
                    </button>
                    <button
                      id="btn-complaint-resolve"
                      onClick={() => handleComplaintReply('RESOLVED')}
                      className="px-2.5 py-1 text-[10px] font-bold bg-emerald-950/30 hover:bg-emerald-500 text-white border border-emerald-900/40 rounded transition-all cursor-pointer flex items-center gap-1"
                    >
                      <CheckCircle2 size={10} />
                      <span>Resolve Complaint</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Propose Event Modal Form */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0d0d10] border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-white mb-1 font-mono uppercase tracking-wider">Propose New Campus Event</h3>
            <p className="text-xs text-slate-400 mb-4">
              Your proposal will be routed initially to the staff members of your department for approval.
            </p>

            {eventFormError && (
              <div className="bg-rose-950/20 border border-rose-900/50 text-rose-300 p-2.5 rounded-lg text-xs font-semibold mb-3">
                {eventFormError}
              </div>
            )}

            <form onSubmit={handleEventProposalSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold font-mono uppercase tracking-widest text-[9px]">Event Title</label>
                <input
                  id="event-title"
                  type="text"
                  placeholder="e.g. Science Fair, Tech Expo"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold font-mono uppercase tracking-widest text-[9px]">Venue / Location</label>
                  <input
                    id="event-venue"
                    type="text"
                    placeholder="e.g. Lab 4, Seminar Hall"
                    value={newEventVenue}
                    onChange={(e) => setNewEventVenue(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold font-mono uppercase tracking-widest text-[9px]">Event Date</label>
                  <input
                    id="event-date"
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold font-mono uppercase tracking-widest text-[9px]">Proposal Abstract</label>
                <textarea
                  id="event-description"
                  placeholder="Provide high-level event highlights, required resources, target students, schedule, etc."
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  rows={4}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  id="btn-event-cancel"
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="w-full border border-white/10 hover:bg-white/5 text-slate-300 py-2 rounded-lg font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-event-submit"
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg font-bold cursor-pointer shadow-md shadow-indigo-600/10"
                >
                  Submit Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Raise Complaint Modal Form */}
      {showComplaintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0d0d10] border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-white mb-1 font-mono uppercase tracking-wider">Raise New Campus Grievance</h3>
            <p className="text-xs text-slate-400 mb-4">
              Your complaint will become immediately and simultaneously visible to your department HOD and the College Dean.
            </p>

            {compFormError && (
              <div className="bg-rose-950/20 border border-rose-900/50 text-rose-300 p-2.5 rounded-lg text-xs font-semibold mb-3">
                {compFormError}
              </div>
            )}

            <form onSubmit={handleComplaintSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-1 space-y-1">
                  <label className="text-slate-300 font-semibold font-mono uppercase tracking-widest text-[9px]">Grievance Category</label>
                  <select
                    id="complaint-category"
                    value={newCompCategory}
                    onChange={(e) => setNewCompCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 [&>option]:bg-[#0d0d10] [&>option]:text-white"
                  >
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Academics">Academics</option>
                    <option value="Administrative">Administrative</option>
                    <option value="Hostel Facilities">Hostel Facilities</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="col-span-1 space-y-1">
                  <label className="text-slate-300 font-semibold font-mono uppercase tracking-widest text-[9px]">Grievance Title</label>
                  <input
                    id="complaint-title"
                    type="text"
                    placeholder="Short summary of issue"
                    value={newCompTitle}
                    onChange={(e) => setNewCompTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold font-mono uppercase tracking-widest text-[9px]">Description &amp; Context</label>
                <textarea
                  id="complaint-description"
                  placeholder="Provide precise details, dates, timelines, and requested action points to help resolve the issue as quickly as possible."
                  value={newCompDesc}
                  onChange={(e) => setNewCompDesc(e.target.value)}
                  rows={4}
                  className="w-full px-3.5 py-2.5 bg-[#0a0a0c] border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  id="btn-complaint-cancel"
                  type="button"
                  onClick={() => setShowComplaintModal(false)}
                  className="w-full border border-white/10 hover:bg-white/5 text-slate-300 py-2 rounded-lg font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-complaint-submit"
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg font-bold cursor-pointer shadow-md shadow-indigo-600/10"
                >
                  Submit Grievance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Git Update Animation Screen Overlay */}
      <SystemUpdateAnimation
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
      />

      {/* Persistent Institutional Status Footer */}
      <footer className="h-10 bg-indigo-950/40 border-t border-white/5 px-4 sm:px-6 lg:px-8 flex items-center justify-between text-[10px] font-mono text-slate-500 mt-auto z-10">
        <div className="flex gap-4">
          <span>SECURE_SESSION: AES_256</span>
          <span className="hidden sm:inline">DB: IN_MEMORY_FILE_SYNCED</span>
        </div>
        <div className="flex gap-4 text-indigo-400">
          <span className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_6px_rgba(16,185,129,0.5)] animate-pulse"></div>
            SYSTEM OPERATIONAL
          </span>
          <span className="hidden md:inline">PROTOCOL: STACK-V4_SANDBOX</span>
        </div>
      </footer>
    </div>
  );
}
