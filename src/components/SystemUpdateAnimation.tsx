/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  X,
} from 'lucide-react';

interface SystemUpdateAnimationProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export function SystemUpdateAnimation({ isOpen, onClose, onComplete }: SystemUpdateAnimationProps) {
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);

  const runAnimation = () => {
    setProgress(0);
    setIsDone(false);

    const steps = [15, 35, 60, 85, 100];
    steps.forEach((prog, index) => {
      setTimeout(() => {
        setProgress(prog);
        if (prog === 100) {
          setIsDone(true);
          if (onComplete) onComplete();
        }
      }, (index + 1) * 300);
    });
  };

  useEffect(() => {
    if (isOpen) {
      runAnimation();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl bg-[#121316] border border-white/15 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden p-6 sm:p-8 text-white select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Glowing Accent Line */}
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 absolute top-0 left-0 right-0 overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-300 shadow-[0_0_12px_#ffffff]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer z-10"
          title="Close Popup"
        >
          <X size={18} />
        </button>

        {/* Main Content Grid */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 pt-2">
          
          {/* Left Circular Gauge */}
          <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl bg-[#17181c] border border-white/10 flex flex-col items-center justify-center relative p-3 shrink-0 shadow-inner">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="7"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="url(#deployedGradient)"
                strokeWidth="7"
                strokeDasharray="264"
                strokeDashoffset={264 - (264 * progress) / 100}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-300"
              />
              <defs>
                <linearGradient id="deployedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00f2fe" />
                  <stop offset="50%" stopColor="#4facfe" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="font-sans text-3xl font-extrabold tracking-tight text-white">
                {progress}%
              </span>
              <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase mt-0.5">
                {isDone ? 'DEPLOYED' : 'UPDATING'}
              </span>
            </div>
          </div>

          {/* Center Info Text */}
          <div className="flex-1 space-y-2.5 text-center sm:text-left pr-0 sm:pr-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-slate-200">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Live Server Verified</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-snug">
              App Title Updated to "Campus-connect"
            </h2>
            
            <p className="text-xs sm:text-sm text-slate-400 font-mono tracking-tight">
              campus-connect-vavy.onrender.com online (200 OK)
            </p>
          </div>

          {/* Right Action Boxes */}
          <div className="flex flex-col gap-3 shrink-0 w-full sm:w-44">
            <button
              onClick={() => {
                window.open('https://campus-connect-vavy.onrender.com', '_blank');
              }}
              className="flex items-center justify-between px-4 py-3 bg-[#18191e] hover:bg-[#22242b] border border-white/10 hover:border-cyan-500/40 rounded-xl transition-all cursor-pointer group text-left"
            >
              <div className="flex items-center gap-2 text-xs font-mono text-slate-300 group-hover:text-white">
                <div className="w-2 h-2 rounded-full bg-cyan-400 group-hover:scale-125 transition-transform" />
                <span className="truncate">Live App</span>
              </div>
              <ExternalLink size={14} className="text-slate-400 group-hover:text-cyan-400 transition-colors" />
            </button>

            <button
              onClick={runAnimation}
              className="flex items-center justify-between px-4 py-3 bg-[#18191e] hover:bg-[#22242b] border border-white/10 hover:border-indigo-500/40 rounded-xl transition-all cursor-pointer group text-left"
            >
              <div className="flex items-center gap-2 text-xs font-mono text-slate-300 group-hover:text-white">
                <div className="w-2 h-2 rounded-full bg-indigo-400 group-hover:scale-125 transition-transform" />
                <span>Re-Play</span>
              </div>
              <RefreshCw size={14} className={`text-slate-400 group-hover:text-indigo-400 transition-colors ${!isDone ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Bottom Repository Pipeline Progress Bar */}
        <div className="mt-7 pt-4 border-t border-white/5 space-y-2">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-slate-400 font-medium tracking-wide">
              Repository Pipeline Progress
            </span>
            <span className="text-slate-300 font-bold">
              {progress} / 100
            </span>
          </div>

          <div className="w-full h-3 bg-[#17181c] rounded-full overflow-hidden p-0.5 border border-white/10 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 transition-all duration-300 shadow-[0_0_12px_rgba(34,211,238,0.6)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
