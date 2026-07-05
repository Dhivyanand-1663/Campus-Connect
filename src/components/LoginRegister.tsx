/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Role, Department, DEPARTMENTS } from '../types';
import { register, login } from '../lib/api';
import { LogIn, UserPlus, Info, CheckCircle2 } from 'lucide-react';

interface LoginRegisterProps {
  onLoginSuccess: (user: any, token: string) => void;
}

export function LoginRegister({ onLoginSuccess }: LoginRegisterProps) {
  const [isLogin, setIsLogin] = useState(true);
  
  // Login Form State
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Registration Form State
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<Role>('Student');
  const [regDepartment, setRegDepartment] = useState<Department | ''>('');
  const [regRollNumber, setRegRollNumber] = useState('');
  const [regError, setRegError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Quick Switch role test helper
  const handleQuickDemoLogin = async (roleUsername: string) => {
    setLoading(true);
    setLoginError('');
    try {
      const data = await login(roleUsername, 'password');
      localStorage.setItem('college_portal_token', data.token);
      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setLoginError(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginUsername.trim() || !loginPassword) {
      setLoginError('Please fill in both username and password.');
      return;
    }
    setLoading(true);
    try {
      // Returning users: enter username + password -> system verifies against hashed password (handled on server)
      const data = await login(loginUsername.trim(), loginPassword);
      localStorage.setItem('college_portal_token', data.token);
      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setLoginError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!regUsername.trim()) {
      errors.username = 'Username is required.';
    }
    if (!regPassword || regPassword.length < 4) {
      errors.password = 'Password must be at least 4 characters long.';
    }

    // Algorithm 1, Step 3: "If role is Student, Dept Staff, or HOD -> Department is mandatory; validate it's selected"
    const requiresDept = ['Student', 'Dept Staff', 'HOD'].includes(regRole);
    if (requiresDept && !regDepartment) {
      errors.department = 'Department selection is mandatory for this role.';
    }

    if (regRole === 'Student' && !regRollNumber.trim()) {
      errors.rollNumber = 'Roll number is required for students.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const data = await register(
        regUsername.trim(),
        regPassword,
        regRole,
        requiresDept ? (regDepartment as Department) : undefined,
        regRole === 'Student' ? regRollNumber.trim() : undefined
      );
      localStorage.setItem('college_portal_token', data.token);
      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setRegError(err.message || 'Registration failed. Username may be taken.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-container" className="max-w-6xl w-full mx-auto my-12 px-4 z-10 relative">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Premium Brand Text */}
        <section className="lg:col-span-7 space-y-6 text-left py-8">
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold leading-none text-[#E4E4E4] tracking-tighter uppercase font-sans">
            PIPELINE <br />
            <span className="text-[#5D5FEF]">COORDINATION.</span>
          </h1>
          <p className="max-w-xl text-[#E4E4E4]/70 text-base sm:text-lg font-light leading-relaxed">
            Institutional pipeline for multi-level event coordination approvals, role-scoped authority validations, and direct dual-routing student grievance resolutions.
          </p>
          <div className="flex items-center gap-3 font-mono text-[10px] text-white/40 tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-[#00ff66] animate-pulse shadow-[0_0_10px_#00ff66]"></span>
            <span>Protocol: Stack-v4_Sandbox / System Operational</span>
          </div>
        </section>

        {/* Right Column: Premium Form Card */}
        <div className="lg:col-span-5 w-full space-y-6">
          <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md">
            {/* Tab switcher */}
            <div className="flex border-b border-white/10 bg-white/[0.01]">
              <button
                id="tab-login"
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-4 text-center font-bold text-xs uppercase tracking-wider font-mono transition-all cursor-pointer border-r border-white/10 ${
                  isLogin
                    ? 'bg-white/[0.04] text-white'
                    : 'text-white/40 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <LogIn size={14} className="text-[#5D5FEF]" />
                  Sign In
                </span>
              </button>
              <button
                id="tab-register"
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-4 text-center font-bold text-xs uppercase tracking-wider font-mono transition-all cursor-pointer ${
                  !isLogin
                    ? 'bg-white/[0.04] text-white'
                    : 'text-white/40 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <UserPlus size={14} className="text-[#5D5FEF]" />
                  Register
                </span>
              </button>
            </div>

            <div className="p-8">
              {isLogin ? (
                /* Login Form */
                <form onSubmit={handleLoginSubmit} className="space-y-5">
                  <div className="text-center space-y-1 pb-2">
                    <div className="text-[9px] text-[#5D5FEF] font-bold font-mono uppercase tracking-widest">Authentication</div>
                    <h2 className="text-lg font-bold text-[#E4E4E4] font-mono uppercase">Authorize Access</h2>
                  </div>

                  {loginError && (
                    <div className="bg-[#5D5FEF]/10 border border-[#5D5FEF]/30 text-[#5D5FEF] p-3 rounded font-mono text-xs font-bold">
                      {loginError}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/60 block font-mono uppercase tracking-wider">Username</label>
                    <input
                      id="login-username"
                      type="text"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="ID/HANDLE"
                      className="w-full px-3.5 py-2.5 bg-[#1a1a1c] border border-white/10 rounded text-sm text-white placeholder-white/30 focus:outline-hidden focus:border-[#5D5FEF] transition-all font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/60 block font-mono uppercase tracking-wider">Password</label>
                    <input
                      id="login-password"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 bg-[#1a1a1c] border border-white/10 rounded text-sm text-white placeholder-white/30 focus:outline-hidden focus:border-[#5D5FEF] transition-all font-mono"
                      required
                    />
                  </div>

                  <button
                    id="btn-login-submit"
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#5D5FEF] hover:bg-transparent hover:text-[#5D5FEF] text-[#111113] py-3 border border-[#5D5FEF] text-xs font-bold font-mono uppercase tracking-widest transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 rounded"
                  >
                    {loading ? 'Authorizing...' : 'Authorize Access'}
                  </button>
                </form>
              ) : (
                /* Registration Form */
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="text-center space-y-1 pb-2">
                    <div className="text-[9px] text-[#5D5FEF] font-bold font-mono uppercase tracking-widest">Registration</div>
                    <h2 className="text-lg font-bold text-[#E4E4E4] font-mono uppercase">Create Credentials</h2>
                  </div>

                  {regError && (
                    <div className="bg-[#5D5FEF]/10 border border-[#5D5FEF]/30 text-[#5D5FEF] p-3 rounded font-mono text-xs font-bold">
                      {regError}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/60 block font-mono uppercase tracking-wider">Username</label>
                    <input
                      id="reg-username"
                      type="text"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="Choose ID/HANDLE"
                      className="w-full px-3.5 py-2.5 bg-[#1a1a1c] border border-white/10 rounded text-sm text-white placeholder-white/30 focus:outline-hidden focus:border-[#5D5FEF] transition-all font-mono"
                      required
                    />
                    {fieldErrors.username && (
                      <p className="text-[#5D5FEF] text-[10px] font-bold font-mono">{fieldErrors.username}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/60 block font-mono uppercase tracking-wider">Password</label>
                    <input
                      id="reg-password"
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min 4 characters"
                      className="w-full px-3.5 py-2.5 bg-[#1a1a1c] border border-white/10 rounded text-sm text-white placeholder-white/30 focus:outline-hidden focus:border-[#5D5FEF] transition-all font-mono"
                      required
                    />
                    {fieldErrors.password && (
                      <p className="text-[#5D5FEF] text-[10px] font-bold font-mono">{fieldErrors.password}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/60 block font-mono uppercase tracking-wider">Role</label>
                    <select
                      id="reg-role"
                      value={regRole}
                      onChange={(e) => {
                        setRegRole(e.target.value as Role);
                        if (!['Student', 'Dept Staff', 'HOD'].includes(e.target.value)) {
                          setRegDepartment('');
                        }
                      }}
                      className="w-full px-3.5 py-2.5 bg-[#1a1a1c] border border-white/10 rounded text-sm text-white focus:outline-hidden focus:border-[#5D5FEF] transition-all font-mono [&>option]:bg-[#111113] [&>option]:text-white"
                    >
                      <option value="Student">Student</option>
                      <option value="Dept Staff">Department Staff</option>
                      <option value="HOD">HOD (Dept Head)</option>
                      <option value="Dean">Dean (College-wide)</option>
                      <option value="Principal">Principal (College-wide)</option>
                    </select>
                  </div>

                  {['Student', 'Dept Staff', 'HOD'].includes(regRole) && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-white/60 block font-mono uppercase tracking-wider">
                        Department <span className="text-[#5D5FEF] font-bold">*</span>
                      </label>
                      <select
                        id="reg-department"
                        value={regDepartment}
                        onChange={(e) => setRegDepartment(e.target.value as Department)}
                        className="w-full px-3.5 py-2.5 bg-[#1a1a1c] border border-white/10 rounded text-sm text-white focus:outline-hidden focus:border-[#5D5FEF] transition-all font-mono [&>option]:bg-[#111113] [&>option]:text-white"
                      >
                        <option value="">-- Choose Department --</option>
                        {DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.department && (
                        <p className="text-[#5D5FEF] text-[10px] font-bold font-mono">{fieldErrors.department}</p>
                      )}
                    </div>
                  )}

                  {regRole === 'Student' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-white/60 block font-mono uppercase tracking-wider">
                        Roll Number <span className="text-[#5D5FEF] font-bold">*</span>
                      </label>
                      <input
                        id="reg-rollnumber"
                        type="text"
                        value={regRollNumber}
                        onChange={(e) => setRegRollNumber(e.target.value)}
                        placeholder="e.g. 22CSE045"
                        className="w-full px-3.5 py-2.5 bg-[#1a1a1c] border border-white/10 rounded text-sm text-white placeholder-white/30 focus:outline-hidden focus:border-[#5D5FEF] transition-all font-mono"
                        required
                      />
                      {fieldErrors.rollNumber && (
                        <p className="text-[#5D5FEF] text-[10px] font-bold font-mono">{fieldErrors.rollNumber}</p>
                      )}
                    </div>
                  )}

                  <button
                    id="btn-register-submit"
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#5D5FEF] hover:bg-transparent hover:text-[#5D5FEF] text-[#111113] py-3 border border-[#5D5FEF] text-xs font-bold font-mono uppercase tracking-widest transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 rounded"
                  >
                    {loading ? 'Registering...' : 'Register & Authorize'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Guide Card to Sandbox logins */}
          <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6 mt-4 space-y-3">
            <h3 className="text-xs font-bold text-white/80 flex items-center gap-1.5 font-mono uppercase tracking-wider">
              <Info size={14} className="text-[#5D5FEF] shrink-0" />
              Quick Test Sandbox Users
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-white/70 font-mono">
              <div className="bg-white/[0.01] p-2 rounded border border-white/5 flex justify-between items-center">
                <span>Student (CS)</span>
                <button
                  onClick={() => handleQuickDemoLogin('student')}
                  className="text-xs text-[#5D5FEF] hover:underline font-bold cursor-pointer"
                >
                  Log in
                </button>
              </div>
              <div className="bg-white/[0.01] p-2 rounded border border-white/5 flex justify-between items-center">
                <span>Dept Staff (CS)</span>
                <button
                  onClick={() => handleQuickDemoLogin('staff')}
                  className="text-xs text-[#5D5FEF] hover:underline font-bold cursor-pointer"
                >
                  Log in
                </button>
              </div>
              <div className="bg-white/[0.01] p-2 rounded border border-white/5 flex justify-between items-center">
                <span>HOD (CS)</span>
                <button
                  onClick={() => handleQuickDemoLogin('hod')}
                  className="text-xs text-[#5D5FEF] hover:underline font-bold cursor-pointer"
                >
                  Log in
                </button>
              </div>
              <div className="bg-white/[0.01] p-2 rounded border border-white/5 flex justify-between items-center">
                <span>Dean</span>
                <button
                  onClick={() => handleQuickDemoLogin('dean')}
                  className="text-xs text-[#5D5FEF] hover:underline font-bold cursor-pointer"
                >
                  Log in
                </button>
              </div>
              <div className="col-span-1 sm:col-span-2 bg-white/[0.01] p-2 rounded border border-white/5 flex justify-between items-center">
                <span>Principal (Institution Head)</span>
                <button
                  onClick={() => handleQuickDemoLogin('principal')}
                  className="text-xs text-[#5D5FEF] hover:underline font-bold cursor-pointer"
                >
                  Log in
                </button>
              </div>
            </div>
            <p className="text-[9px] text-[#5D5FEF]/80 font-mono tracking-wider italic text-center">
              * Standard credentials: "password" for all accounts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
