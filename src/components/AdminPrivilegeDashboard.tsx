import { useState, useEffect, FormEvent } from 'react';
import { User, Role, Department, DEPARTMENTS } from '../types';
import { RoleBadge } from './RoleBadge';
import { getAdminUsers, updateAdminUserPrivileges } from '../lib/api';
import {
  Settings,
  Search,
  Users,
  ShieldAlert,
  Save,
  RefreshCw,
  UserCheck,
  Building2,
  AlertCircle,
  Hash
} from 'lucide-react';

interface AdminPrivilegeDashboardProps {
  user: User;
  onRefreshData?: () => void;
  addLog?: (type: 'INFO' | 'SUCCESS' | 'WARNING' | 'DENIED' | 'ACTION', actor: string, message: string) => void;
}

const ROLES: Role[] = ['Student', 'Dept Staff', 'HOD', 'Dean', 'Principal', 'Software Admin'];

export function AdminPrivilegeDashboard({ user, onRefreshData, addLog }: AdminPrivilegeDashboardProps) {
  const [usersList, setUsersList] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editing form states for the selected user
  const [editRole, setEditRole] = useState<Role>('Student');
  const [editDepartment, setEditDepartment] = useState<Department | ''>('');
  const [editRollNumber, setEditRollNumber] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const list = await getAdminUsers();
      setUsersList(list);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch registered users.');
      if (addLog) addLog('WARNING', user.username, 'Failed to fetch users list in admin privilege dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Update form inputs when selected user changes
  useEffect(() => {
    if (selectedUser) {
      setEditRole(selectedUser.role);
      setEditDepartment(selectedUser.department || '');
      setEditRollNumber(selectedUser.rollNumber || '');
      setError('');
      setSuccessMsg('');
    }
  }, [selectedUser]);

  const handleUpdatePrivilege = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setUpdating(true);
    setError('');
    setSuccessMsg('');

    // Pre-validations
    if (['Student', 'Dept Staff', 'HOD'].includes(editRole) && !editDepartment) {
      setError(`Department is mandatory for the ${editRole} role.`);
      setUpdating(false);
      return;
    }

    if (editRole === 'Student' && !editRollNumber.trim()) {
      setError('Roll number is mandatory for students.');
      setUpdating(false);
      return;
    }

    try {
      const updated = await updateAdminUserPrivileges(selectedUser.username, {
        role: editRole,
        department: ['Student', 'Dept Staff', 'HOD'].includes(editRole) ? (editDepartment as Department) : undefined,
        rollNumber: editRole === 'Student' ? editRollNumber.trim() : undefined,
      });

      setSuccessMsg(`Successfully updated privileges for @${selectedUser.username}`);
      
      // Update in-place in local list
      setUsersList((prev) =>
        prev.map((u) => (u.username === updated.username ? updated : u))
      );
      
      setSelectedUser(updated);

      if (addLog) {
        addLog(
          'ACTION',
          user.username,
          `Modified privileges of user @${updated.username} to [Role: ${updated.role}, Dept: ${updated.department || 'N/A'}]`
        );
      }

      if (onRefreshData) {
        onRefreshData();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to update privileges.');
    } finally {
      setUpdating(false);
    }
  };

  // Filtered users list
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.rollNumber && u.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesDept = deptFilter === 'ALL' || u.department === deptFilter;

    return matchesSearch && matchesRole && matchesDept;
  });

  // Role Statistics
  const totalUsersCount = usersList.length;
  const studentsCount = usersList.filter((u) => u.role === 'Student').length;
  const staffCount = usersList.filter((u) => u.role === 'Dept Staff' || u.role === 'HOD').length;
  const higherAuthorityCount = usersList.filter((u) => u.role === 'Dean' || u.role === 'Principal' || u.role === 'Software Admin').length;

  return (
    <div className="space-y-6 animate-fade-in" id="admin-privilege-dashboard">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings size={20} className="text-purple-400 animate-spin-slow" />
            Software Admin Privilege Desk
          </h2>
          <p className="text-xs text-slate-400">
            Authorized portal to manage, reassign, and audit academic and administrative roles across departments.
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer border border-white/10 transition-all self-start md:self-auto"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Reload Users Registry
        </button>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white/5 border border-white/5 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
            <Users size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-400">Total Registered</div>
            <div className="text-xl font-bold text-white font-mono mt-0.5">{totalUsersCount}</div>
          </div>
        </div>
        <div className="p-4 bg-white/5 border border-white/5 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
            <UserCheck size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-400">Active Students</div>
            <div className="text-xl font-bold text-white font-mono mt-0.5">{studentsCount}</div>
          </div>
        </div>
        <div className="p-4 bg-white/5 border border-white/5 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
            <Building2 size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-400">Departmental Staff</div>
            <div className="text-xl font-bold text-white font-mono mt-0.5">{staffCount}</div>
          </div>
        </div>
        <div className="p-4 bg-white/5 border border-white/5 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
            <ShieldAlert size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-400">Higher Authorities</div>
            <div className="text-xl font-bold text-white font-mono mt-0.5">{higherAuthorityCount}</div>
          </div>
        </div>
      </div>

      {/* Two-Column Cockpit Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Users Directory */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#0d0d10] border border-white/10 rounded-2xl p-4 space-y-4">
            
            {/* Filtering Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search user by username or roll number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500 [&>option]:bg-[#0d0d10]"
                >
                  <option value="ALL">All Roles</option>
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>

                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500 [&>option]:bg-[#0d0d10] max-w-[180px]"
                >
                  <option value="ALL">All Departments</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* List Body */}
            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div>
                <span className="text-xs font-mono text-slate-400">Loading users registry...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center text-xs font-mono text-slate-500 border border-dashed border-white/5 rounded-xl">
                No registered users match your filters.
              </div>
            ) : (
              <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto pr-1">
                {filteredUsers.map((u) => {
                  const isSelected = selectedUser?.username === u.username;
                  return (
                    <div
                      key={u.username}
                      onClick={() => setSelectedUser(u)}
                      className={`p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer transition-all rounded-xl mt-1 first:mt-0 ${
                        isSelected
                          ? 'bg-purple-950/15 border border-purple-500/20'
                          : 'bg-transparent border border-transparent hover:bg-white/5'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white font-mono">@{u.username}</span>
                          {u.rollNumber && (
                            <span className="text-[10px] text-slate-500 bg-slate-900 border border-slate-800 px-1.5 py-0.2 rounded font-mono">
                              Roll: {u.rollNumber}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {u.department ? u.department : 'All College Administration'}
                        </div>
                      </div>
                      <div className="shrink-0">
                        <RoleBadge role={u.role} size="sm" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Manage / Edit Panel */}
        <div className="space-y-4">
          <div className="bg-[#0d0d10] border border-white/10 rounded-2xl p-4 space-y-4 h-full flex flex-col">
            <h3 className="text-xs font-bold text-purple-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Settings size={14} /> Privilege Editor
            </h3>

            {!selectedUser ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-xs font-mono text-slate-500 border border-dashed border-white/5 rounded-xl min-h-[250px]">
                <AlertCircle size={20} className="mb-2 text-slate-600" />
                Select a user from the registry to inspect or modify their privileges.
              </div>
            ) : (
              <form onSubmit={handleUpdatePrivilege} className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  
                  {/* Selected Account Headline */}
                  <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-1">
                    <span className="text-[10px] text-slate-500 font-mono uppercase">Target Account</span>
                    <h4 className="text-sm font-bold text-white font-mono">@{selectedUser.username}</h4>
                    <p className="text-[11px] text-slate-400">
                      Currently: <span className="text-purple-300 font-semibold">{selectedUser.role}</span>
                    </p>
                  </div>

                  {/* Error / Success Feedback */}
                  {error && (
                    <div className="p-2.5 bg-rose-950/20 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-1.5 font-mono">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="p-2.5 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-1.5 font-mono">
                      <ShieldAlert size={14} className="shrink-0" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  {/* Role Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-slate-400 font-mono uppercase flex items-center gap-1">
                      <UserCheck size={12} /> Assign System Role
                    </label>
                    <select
                      value={editRole}
                      onChange={(e) => {
                        const nextRole = e.target.value as Role;
                        setEditRole(nextRole);
                        // Clean defaults if higher authority
                        if (!['Student', 'Dept Staff', 'HOD'].includes(nextRole)) {
                          setEditDepartment('');
                        } else if (!editDepartment) {
                          setEditDepartment(DEPARTMENTS[0]);
                        }
                        if (nextRole !== 'Student') {
                          setEditRollNumber('');
                        }
                      }}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-purple-500 [&>option]:bg-[#0d0d10]"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Department (if Student/Staff/HOD) */}
                  {['Student', 'Dept Staff', 'HOD'].includes(editRole) && (
                    <div className="space-y-1.5 animate-slide-up">
                      <label className="text-[11px] text-slate-400 font-mono uppercase flex items-center gap-1">
                        <Building2 size={12} /> Bind Department
                      </label>
                      <select
                        value={editDepartment}
                        onChange={(e) => setEditDepartment(e.target.value as Department)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-purple-500 [&>option]:bg-[#0d0d10]"
                      >
                        <option value="">-- Choose Department --</option>
                        {DEPARTMENTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Roll Number (if Student) */}
                  {editRole === 'Student' && (
                    <div className="space-y-1.5 animate-slide-up">
                      <label className="text-[11px] text-slate-400 font-mono uppercase flex items-center gap-1">
                        <Hash size={12} /> Roll Number / UID
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 22CSE045"
                        value={editRollNumber}
                        onChange={(e) => setEditRollNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                  )}

                </div>

                {/* Submit Action Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={updating}
                    className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/10 hover:shadow-purple-500/20 transition-all duration-200 cursor-pointer disabled:opacity-50"
                  >
                    <Save size={14} />
                    {updating ? 'Updating privileges...' : 'Commit Privilege Updates'}
                  </button>
                  <p className="text-[10px] text-slate-500 text-center mt-2 leading-relaxed font-mono">
                    All modifications to system RBAC privileges are recorded instantly in the security logs.
                  </p>
                </div>
              </form>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
