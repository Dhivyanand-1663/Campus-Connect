/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import {
  GitCommit,
  GitBranch,
  CheckCircle2,
  Terminal,
  RefreshCw,
  X,
  Server,
  Zap,
  ShieldCheck,
  Globe,
  ArrowRight,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface SystemUpdateAnimationProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

interface LogEntry {
  id: number;
  text: string;
  type: 'cmd' | 'info' | 'success' | 'warn';
  timestamp: string;
}

const UPDATE_STEPS = [
  { id: 1, label: 'Git Sync & Repository Fetch', detail: 'Detecting origin/main HEAD commit 6a80cca' },
  { id: 2, label: 'Compiling React Frontend Bundle', detail: 'Vite build transpiling TypeScript & CSS tokens' },
  { id: 3, label: 'Deploying Node/Express Server', detail: 'Syncing production environment on Render' },
  { id: 4, label: 'Health Check & Domain Verification', detail: 'campus-connect-vavy.onrender.com online (200 OK)' },
];

export function SystemUpdateAnimation({ isOpen, onClose, onComplete }: SystemUpdateAnimationProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isDone, setIsDone] = useState(false);
  const [activeTab, setActiveTab] = useState<'visual' | 'terminal' | 'diff'>('visual');

  const runAnimation = () => {
    setProgress(0);
    setCurrentStep(1);
    setIsDone(false);
    setLogs([]);

    const timestamp = () => new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const logSequence: { delay: number; log: LogEntry; step?: number; prog: number }[] = [
      {
        delay: 200,
        log: { id: 1, text: '$ git fetch origin main', type: 'cmd', timestamp: timestamp() },
        step: 1,
        prog: 12,
      },
      {
        delay: 600,
        log: { id: 2, text: 'remote: Counting objects: 100% (5/5), done.', type: 'info', timestamp: timestamp() },
        prog: 22,
      },
      {
        delay: 1100,
        log: { id: 3, text: 'commit 6a80cca7: "Title was updated to Campus-connect"', type: 'info', timestamp: timestamp() },
        prog: 32,
      },
      {
        delay: 1600,
        log: { id: 4, text: '$ npm run build', type: 'cmd', timestamp: timestamp() },
        step: 2,
        prog: 45,
      },
      {
        delay: 2200,
        log: { id: 5, text: 'vite v5.4.1 building for production...', type: 'info', timestamp: timestamp() },
        prog: 58,
      },
      {
        delay: 2800,
        log: { id: 6, text: 'dist/index.html                     0.32 kB │ gzip: 0.21 kB', type: 'info', timestamp: timestamp() },
        prog: 68,
      },
      {
        delay: 3400,
        log: { id: 7, text: 'dist/assets/index-B_9v2.js         488.12 kB │ gzip: 124.8 kB', type: 'info', timestamp: timestamp() },
        prog: 78,
      },
      {
        delay: 3900,
        log: { id: 8, text: '$ render-cli deploy --service campus-connect', type: 'cmd', timestamp: timestamp() },
        step: 3,
        prog: 88,
      },
      {
        delay: 4500,
        log: { id: 9, text: 'HTTP/2 200 OK - https://campus-connect-vavy.onrender.com', type: 'success', timestamp: timestamp() },
        step: 4,
        prog: 96,
      },
      {
        delay: 5000,
        log: { id: 10, text: '✔ UPDATE COMPLETE: <title> set to "Campus-connect"', type: 'success', timestamp: timestamp() },
        step: 4,
        prog: 100,
      },
    ];

    logSequence.forEach(({ delay, log, step, prog }) => {
      setTimeout(() => {
        setLogs((prev) => [...prev, log]);
        setProgress(prog);
        if (step) setCurrentStep(step);
        if (prog === 100) {
          setIsDone(true);
          if (onComplete) onComplete();
        }
      }, delay);
    });
  };

  useEffect(() => {
    if (isOpen) {
      runAnimation();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#111113] border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#E4E4E4] font-sans">
        
        {/* Glowing Top Status Line */}
        <div className="h-1 w-full bg-gradient-to-r from-[#5D5FEF] via-cyan-400 to-emerald-400 relative overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-300 shadow-[0_0_12px_#ffffff]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-[#5D5FEF]/20 border border-[#5D5FEF]/40 text-[#5D5FEF]">
              <RefreshCw size={18} className={`transition-all ${!isDone ? 'animate-spin' : ''}`} />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono text-sm font-bold tracking-wide uppercase text-white">
                  Git Sync & Build Deployer
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  v1.0.1 LIVE
                </span>
              </div>
              <p className="text-xs text-white/50 font-mono">
                Target: campus-connect-vavy.onrender.com
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runAnimation}
              title="Re-run Deployment Animation"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all cursor-pointer"
            >
              <RefreshCw size={13} className={!isDone ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Re-Play</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between px-6 py-2 bg-black/40 border-b border-white/10 font-mono text-xs">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('visual')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === 'visual'
                  ? 'bg-[#5D5FEF]/20 text-[#5D5FEF] border border-[#5D5FEF]/40 font-semibold'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Zap size={14} />
              <span>Live Stage Visualizer</span>
            </button>

            <button
              onClick={() => setActiveTab('terminal')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === 'terminal'
                  ? 'bg-[#5D5FEF]/20 text-[#5D5FEF] border border-[#5D5FEF]/40 font-semibold'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Terminal size={14} />
              <span>Build Console ({logs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('diff')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === 'diff'
                  ? 'bg-[#5D5FEF]/20 text-[#5D5FEF] border border-[#5D5FEF]/40 font-semibold'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <GitCommit size={14} />
              <span>Commit Diff</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-white/50 text-[11px]">
            <span className="flex items-center gap-1">
              <GitBranch size={12} className="text-[#5D5FEF]" /> main
            </span>
            <span>•</span>
            <span className="font-mono text-cyan-400">6a80cca</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: VISUAL STAGE PROCESSOR */}
          {activeTab === 'visual' && (
            <div className="space-y-6">
              
              {/* Main Animated Status Display */}
              <div className="relative p-6 rounded-xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 overflow-hidden">
                <div className="absolute top-0 right-0 p-8 pointer-events-none opacity-10">
                  <Server size={180} className="text-[#5D5FEF]" />
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
                  {/* Central Radar Spinner */}
                  <div className="relative flex items-center justify-center w-28 h-28 rounded-full bg-black/60 border-2 border-[#5D5FEF]/40 shadow-[0_0_30px_rgba(93,95,239,0.2)]">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        stroke="rgba(255, 255, 255, 0.1)"
                        strokeWidth="6"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        stroke="url(#gradient)"
                        strokeWidth="6"
                        strokeDasharray="264"
                        strokeDashoffset={264 - (264 * progress) / 100}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-300"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#5D5FEF" />
                          <stop offset="50%" stopColor="#22d3ee" />
                          <stop offset="100%" stopColor="#34d399" />
                        </linearGradient>
                      </defs>
                    </svg>

                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="font-mono text-2xl font-bold tracking-tighter text-white">
                        {progress}%
                      </span>
                      <span className="text-[9px] font-mono uppercase text-white/50 tracking-wider">
                        {isDone ? 'Deployed' : 'Syncing'}
                      </span>
                    </div>
                  </div>

                  {/* Right Status Banner */}
                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                      <ShieldCheck size={14} />
                      <span>{isDone ? 'Live Server Verified' : 'Push Operation In Progress'}</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {isDone ? 'App Title Updated to "Campus-connect"' : UPDATE_STEPS[currentStep - 1]?.label}
                    </h2>
                    <p className="text-xs sm:text-sm text-white/60">
                      {UPDATE_STEPS[currentStep - 1]?.detail}
                    </p>
                  </div>
                </div>

                {/* Progress bar line */}
                <div className="mt-6 space-y-1.5">
                  <div className="flex justify-between text-xs font-mono text-white/50">
                    <span>Repository Pipeline Progress</span>
                    <span>{progress} / 100</span>
                  </div>
                  <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#5D5FEF] via-cyan-400 to-emerald-400 transition-all duration-300 shadow-[0_0_10px_#5D5FEF]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Step Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {UPDATE_STEPS.map((step) => {
                  const stepDone = step.id < currentStep || isDone;
                  const stepCurrent = step.id === currentStep && !isDone;

                  return (
                    <div
                      key={step.id}
                      className={`p-4 rounded-xl border transition-all ${
                        stepDone
                          ? 'bg-emerald-500/5 border-emerald-500/30 text-white'
                          : stepCurrent
                          ? 'bg-[#5D5FEF]/10 border-[#5D5FEF] text-white shadow-[0_0_15px_rgba(93,95,239,0.15)]'
                          : 'bg-white/2 border-white/5 text-white/40'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold mt-0.5 shrink-0 transition-colors ${
                            stepDone
                              ? 'bg-emerald-500 text-black'
                              : stepCurrent
                              ? 'bg-[#5D5FEF] text-white animate-pulse'
                              : 'bg-white/10 text-white/50'
                          }`}
                        >
                          {stepDone ? <CheckCircle2 size={14} /> : step.id}
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-semibold font-mono tracking-wide">
                            {step.label}
                          </h4>
                          <p className="text-[11px] text-white/50 leading-relaxed">
                            {step.detail}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* TAB 2: TERMINAL CONSOLE */}
          {activeTab === 'terminal' && (
            <div className="rounded-xl border border-white/15 bg-black/90 p-4 font-mono text-xs space-y-2 h-80 overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-white/10 text-[#5D5FEF]">
                <div className="flex items-center gap-2">
                  <Terminal size={14} />
                  <span>bash - campus-connect deployment terminal</span>
                </div>
                <span className="text-[10px] text-white/40">UTF-8</span>
              </div>

              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 leading-relaxed animate-in fade-in duration-100">
                  <span className="text-white/30 shrink-0 text-[10px] select-none">{log.timestamp}</span>
                  <span
                    className={
                      log.type === 'cmd'
                        ? 'text-cyan-400 font-bold'
                        : log.type === 'success'
                        ? 'text-emerald-400 font-semibold'
                        : log.type === 'warn'
                        ? 'text-amber-400'
                        : 'text-white/70'
                    }
                  >
                    {log.text}
                  </span>
                </div>
              ))}

              {!isDone && (
                <div className="flex items-center gap-2 text-[#5D5FEF] animate-pulse">
                  <span>&gt;</span>
                  <span className="w-2 h-4 bg-[#5D5FEF] inline-block" />
                </div>
              )}
            </div>
          )}

          {/* TAB 3: COMMIT DIFF VIEW */}
          {activeTab === 'diff' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-[#E4E4E4]">
                  <span className="font-bold text-sm">Commit: 6a80cc87acab3c7128b54e9665b84ef4780a0faf</span>
                  <span className="text-[11px] text-white/40">Branch: main</span>
                </div>
                <p className="text-xs text-white/70">
                  Author: <span className="text-[#5D5FEF]">Dhivyanand-1663</span> | Message: <span className="text-emerald-400 font-semibold">Title was updated.</span>
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/80 overflow-hidden">
                <div className="px-4 py-2 bg-white/5 border-b border-white/10 text-[#E4E4E4] font-bold text-[11px]">
                  c/Users/jithe/OneDrive/Desktop/Dhivi-new-git-project/Campus-Connect/index.html
                </div>
                <div className="p-4 space-y-1 leading-relaxed text-[11px]">
                  <div className="text-white/40"> @@ -3,7 +3,7 @@ &lt;head&gt;</div>
                  <div className="text-white/50">    &lt;meta charset="UTF-8" /&gt;</div>
                  <div className="text-white/50">    &lt;meta name="viewport" content="width=device-width, initial-scale=1.0" /&gt;</div>
                  <div className="bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded border border-rose-500/20 line-through">
                    -   &lt;title&gt;My Google AI Studio App&lt;/title&gt;
                  </div>
                  <div className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                    +   &lt;title&gt;Campus-connect&lt;/title&gt;
                  </div>
                  <div className="text-white/50">  &lt;/head&gt;</div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-black/60">
          <div className="flex items-center gap-2 text-xs font-mono text-white/50">
            <Globe size={14} className="text-emerald-400" />
            <a
              href="https://campus-connect-vavy.onrender.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              campus-connect-vavy.onrender.com
              <ExternalLink size={11} />
            </a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all cursor-pointer"
            >
              Close Window
            </button>

            <button
              onClick={() => {
                onClose();
                window.open('https://campus-connect-vavy.onrender.com', '_blank');
              }}
              className="flex items-center gap-2 px-5 py-2 text-xs font-mono font-bold text-black bg-[#5D5FEF] hover:bg-[#6c6eee] rounded-lg transition-all shadow-[0_0_15px_rgba(93,95,239,0.4)] cursor-pointer"
            >
              <span>View Deployed App</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
