import React, { useState, useEffect, useRef } from 'react';
import { User, Complaint, Role } from '../types';
import {
  MessageSquare,
  Search,
  Plus,
  Lock,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  User as UserIcon,
  Tag,
  Building,
  AlertTriangle,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { RoleBadge } from './RoleBadge';

interface GrievanceHubPageProps {
  user: User;
  complaints: Complaint[];
  selectedComplaint: Complaint | null;
  onSelectComplaint: (comp: Complaint | null) => void;
  onShowComplaintModal: () => void;
  onRespondToComplaint: (complaintId: string, message: string, status?: 'IN_REVIEW' | 'RESOLVED') => Promise<void>;
}

export function GrievanceHubPage({
  user,
  complaints,
  selectedComplaint,
  onSelectComplaint,
  onShowComplaintModal,
  onRespondToComplaint,
}: GrievanceHubPageProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [replyMessage, setReplyMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Filter based on roles (matches backend specifications)
  const filteredComplaintsForRole = complaints.filter((c) => {
    if (user.role === 'Student') return c.raised_by === user.username;
    if (user.role === 'Dept Staff' || user.role === 'HOD') return c.department === user.department;
    return true; // Dean & Principal see all
  });

  // Apply search & filters
  const displayedComplaints = filteredComplaintsForRole.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.raised_by.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || c.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Auto scroll to bottom
  const scrollToBottom = () => {
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Automatically select first grievance if none selected
  useEffect(() => {
    if (!selectedComplaint && displayedComplaints.length > 0) {
      onSelectComplaint(displayedComplaints[0]);
    }
  }, [displayedComplaints, selectedComplaint]);

  // Scroll whenever selection or messages count changes
  useEffect(() => {
    if (selectedComplaint) {
      scrollToBottom();
    }
  }, [selectedComplaint, selectedComplaint?.messages.length]);

  // Handle Send Reply
  const handleSendReply = async (statusUpdate?: 'IN_REVIEW' | 'RESOLVED') => {
    if (!selectedComplaint) return;
    if (!replyMessage.trim() && !statusUpdate) {
      setActionError('Please enter a message or select a resolution action.');
      return;
    }
    setActionError('');
    setLoadingAction(true);
    try {
      // If student or just a text reply, call respond to complaint
      await onRespondToComplaint(selectedComplaint.id, replyMessage || `Status updated to ${statusUpdate}`, statusUpdate);
      setReplyMessage('');
      scrollToBottom();
    } catch (err: any) {
      setActionError(err.message || 'Failed to submit response.');
    } finally {
      setLoadingAction(false);
    }
  };

  const isHODorDean = () => {
    if (!selectedComplaint) return false;
    if (user.role === 'HOD' && user.department === selectedComplaint.department) return true;
    if (user.role === 'Dean') return true;
    return false;
  };

  return (
    <div className="space-y-5 animate-fade-in" id="grievance-hub-page">
      {/* Top Banner and Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <MessageSquare size={18} className="text-rose-400" />
            Institutional Grievance Hub &amp; Resolutions
          </h2>
          <p className="text-xs text-slate-400">
            {user.role === 'Student'
              ? 'Direct, dual-routed grievance channel connected with your HOD and Academic Dean.'
              : 'Oversight and response deck for active student grievances and complaints.'}
          </p>
        </div>

        {user.role === 'Student' && (
          <button
            onClick={onShowComplaintModal}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-rose-600/15 cursor-pointer border border-rose-500/20"
          >
            <Plus size={14} />
            <span>Raise New Grievance</span>
          </button>
        )}
      </div>

      {/* Double Column Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch min-h-[620px]">
        
        {/* Left Column: Complaint List Ledger */}
        <div className="lg:col-span-5 flex flex-col bg-[#0d0d10] border border-white/10 rounded-2xl overflow-hidden">
          
          {/* Search, Status and Category Filtering Panel */}
          <div className="p-4 border-b border-white/5 bg-black/15 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search complaints by title, details..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Quick Status and Category selectors */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 [&>option]:bg-[#0d0d10]"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">OPEN</option>
                <option value="IN_REVIEW">IN_REVIEW</option>
                <option value="RESOLVED">RESOLVED</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 [&>option]:bg-[#0d0d10]"
              >
                <option value="ALL">All Categories</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="Academics">Academics</option>
                <option value="Administrative">Administrative</option>
                <option value="Hostel Facilities">Hostel Facilities</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto max-h-[500px] p-3 space-y-2">
            {displayedComplaints.map((comp) => {
              const isSelected = selectedComplaint?.id === comp.id;
              const isResolved = comp.status === 'RESOLVED';

              return (
                <div
                  key={comp.id}
                  onClick={() => {
                    onSelectComplaint(comp);
                    setActionError('');
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 relative overflow-hidden group ${
                    isSelected
                      ? 'bg-rose-600/10 border-rose-500/50 shadow-md shadow-rose-600/5'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-rose-400 font-bold uppercase tracking-widest font-mono">
                        {comp.category}
                      </span>
                      <h4 className="text-xs font-semibold text-white leading-tight group-hover:text-rose-300 transition-colors">
                        {comp.title}
                      </h4>
                    </div>
                    <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${
                      isResolved
                        ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30'
                        : comp.status === 'IN_REVIEW'
                        ? 'bg-amber-950/40 text-amber-400 border border-amber-900/30'
                        : 'bg-red-950/30 text-rose-400 border border-rose-900/30'
                    }`}>
                      {comp.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    {comp.description}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono border-t border-white/5 pt-2 mt-1">
                    <span className="truncate max-w-[150px]" title={`@${comp.raised_by}`}>
                      Student: @{comp.raised_by}
                    </span>
                    <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded text-[10px] text-slate-300 font-semibold shrink-0">
                      <MessageSquare size={9} className="text-rose-400" />
                      {comp.messages.length} replies
                    </span>
                  </div>
                </div>
              );
            })}

            {displayedComplaints.length === 0 && (
              <div className="text-center py-16 border border-dashed border-white/5 rounded-xl bg-black/10 text-slate-500 text-xs italic font-mono flex flex-col items-center justify-center gap-2">
                <MessageSquare size={20} className="opacity-45 text-rose-400" />
                <span>No active grievances match your filters.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation Workspace */}
        <div className="lg:col-span-7 bg-[#0d0d10] border border-white/10 rounded-2xl overflow-hidden flex flex-col">
          {selectedComplaint ? (
            <div className="flex-1 flex flex-col h-full max-h-[620px]">
              
              {/* Thread Header */}
              <div className="p-4 border-b border-white/5 bg-black/15 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-rose-400 font-mono">DUAL ROUTE LEDGER WORKSPACE:</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                      selectedComplaint.status === 'RESOLVED'
                        ? 'bg-emerald-950/40 text-emerald-400'
                        : 'bg-amber-950/40 text-amber-400'
                    }`}>
                      {selectedComplaint.status}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                    {selectedComplaint.title}
                  </h3>
                </div>
                <div className="text-[10px] text-slate-500 font-mono text-right">
                  Dept: <span className="text-slate-300 font-bold">{selectedComplaint.department}</span>
                  <div className="text-slate-400">Raised by: @{selectedComplaint.raised_by} {selectedComplaint.raised_by_roll ? `(Roll: ${selectedComplaint.raised_by_roll})` : ''}</div>
                </div>
              </div>

              {/* Chat view messages list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/10">
                {/* Original statement card */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono pb-2 border-b border-white/5">
                    <span className="font-bold text-slate-400 uppercase flex items-center gap-1">
                      <Tag size={10} className="text-rose-400" /> Original Grievance statement
                    </span>
                    <span>Category: {selectedComplaint.category}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                    {selectedComplaint.description}
                  </p>
                </div>

                <div className="h-px bg-white/5"></div>

                {/* Conversation replies list */}
                {selectedComplaint.messages.map((msg) => {
                  const isMe = msg.senderName === user.username;
                  return (
                    <div key={msg.id} className={`flex flex-col max-w-[85%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-[10px] font-bold text-slate-300">{msg.senderName}</span>
                        <RoleBadge role={msg.senderRole as Role} size="sm" />
                        <span className="text-[9px] font-mono text-slate-500">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className={`p-3 rounded-2xl text-xs leading-normal whitespace-pre-wrap ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/10'
                          : 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-none'
                      }`}>
                        {msg.message}
                      </div>
                    </div>
                  );
                })}

                {selectedComplaint.messages.length === 0 && (
                  <div className="text-center py-8 text-slate-500 italic text-xs font-mono">
                    Awaiting HOD/Dean review and initial reply.
                  </div>
                )}

                <div ref={chatBottomRef} />
              </div>

              {/* Responder/Action panel at bottom */}
              <div className="p-4 border-t border-white/5 bg-[#0d0d10] space-y-3">
                
                {actionError && (
                  <div className="bg-rose-950/20 border border-rose-900/50 text-rose-300 p-2 rounded text-xs font-semibold flex items-center gap-1.5">
                    <AlertTriangle size={13} className="shrink-0" />
                    <span>{actionError}</span>
                  </div>
                )}

                {/* Direct text reply form */}
                {user.role === 'Student' ? (
                  <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl text-center text-slate-400 text-xs italic font-mono flex items-center justify-center gap-2">
                    <Lock size={12} className="opacity-60 text-rose-400 animate-pulse" />
                    <span>This dual-route ledger thread is read-only for students. Awaiting higher authority resolution.</span>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type response dialogue message to student..."
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendReply();
                      }}
                      className="flex-1 px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />

                    <button
                      onClick={() => handleSendReply()}
                      disabled={loadingAction}
                      className="bg-indigo-600 hover:bg-indigo-500 p-2.5 rounded-xl text-white flex items-center justify-center cursor-pointer transition-all disabled:opacity-50"
                      title="Send Response Message"
                    >
                      <Send size={15} />
                    </button>
                  </div>
                )}

                {/* Administrative Resolution action triggers */}
                {isHODorDean() && (
                  <div className="flex flex-wrap gap-2 pt-2.5 border-t border-white/5 items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      <ShieldCheck size={12} className="text-emerald-500" />
                      SECURE RESOLUTION INTERFACE
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleSendReply('IN_REVIEW')}
                        disabled={loadingAction}
                        className="px-3 py-1 text-[10px] font-bold bg-amber-950/30 hover:bg-amber-950/50 text-amber-400 border border-amber-900/40 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                      >
                        Mark "In Review"
                      </button>
                      <button
                        onClick={() => handleSendReply('RESOLVED')}
                        disabled={loadingAction}
                        className="px-3 py-1 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-900/40 rounded-lg transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50 shadow-md shadow-emerald-600/10"
                      >
                        <CheckCircle2 size={11} />
                        <span>Resolve Complaint</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-2">
              <MessageSquare size={32} className="opacity-25 text-rose-400" />
              <h4 className="font-semibold text-white text-xs">No Grievance Selected</h4>
              <p className="text-xs max-w-sm">
                Select an active grievance thread from the left ledger to open the live dual-route dialogue channel.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
