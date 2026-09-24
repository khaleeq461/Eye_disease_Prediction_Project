import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, Sparkles, Scan, Eye } from 'lucide-react';

const scanPhases = [
  { text: 'Scanning Retinal Image & Optical Features...', icon: Scan, progress: 25 },
  { text: 'Analyzing Retinal Blood Vessels & Optic Disc...', icon: Eye, progress: 55 },
  { text: 'Evaluating Potential Eye Conditions & Health Indicators...', icon: Activity, progress: 80 },
  { text: 'Generating Visual Heatmap & Health Summary...', icon: Sparkles, progress: 95 }
];

const DiagnosticScanner = ({ imageSrc }) => {
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhaseIndex((prev) => (prev < scanPhases.length - 1 ? prev + 1 : prev));
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  const currentPhase = scanPhases[phaseIndex];
  const Icon = currentPhase.icon;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-cyan-500/30 shadow-2xl shadow-cyan-950/50 p-4 sm:p-6 text-white">
      {/* Background Retinal Image with Scanning HUD */}
      <div className="relative w-full h-80 sm:h-96 rounded-xl overflow-hidden bg-black/80 flex items-center justify-center border border-slate-800">
        {imageSrc && (
          <img
            src={imageSrc}
            alt="Retinal Scan in Progress"
            className="w-full h-full object-contain filter contrast-125 brightness-90 opacity-80"
          />
        )}

        {/* Medical Grid Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle, #06b6d4 1px, transparent 1px), linear-gradient(to right, rgba(6, 182, 212, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(6, 182, 212, 0.08) 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />

        {/* Target Reticle in Center */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-48 h-48 sm:w-64 sm:h-64 rounded-full border border-cyan-400/40 border-dashed animate-spin" style={{ animationDuration: '20s' }} />
          <div className="absolute w-36 h-36 sm:w-48 sm:h-48 rounded-full border-2 border-emerald-400/30 animate-ping" style={{ animationDuration: '3s' }} />
          <div className="absolute w-4 h-4 border-t-2 border-l-2 border-cyan-400 -translate-x-12 -translate-y-12" />
          <div className="absolute w-4 h-4 border-t-2 border-r-2 border-cyan-400 translate-x-12 -translate-y-12" />
          <div className="absolute w-4 h-4 border-b-2 border-l-2 border-cyan-400 -translate-x-12 translate-y-12" />
          <div className="absolute w-4 h-4 border-b-2 border-r-2 border-cyan-400 translate-x-12 translate-y-12" />
        </div>

        {/* Clean Status Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 text-xs font-semibold text-cyan-400 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-cyan-500/30 backdrop-blur">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          AI Scanner Active
        </div>

        <div className="absolute top-3 right-3 text-xs font-semibold text-emerald-400 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-emerald-500/30 backdrop-blur">
          Real-Time Analysis
        </div>

        {/* Animated Laser Scanning Beam */}
        <div 
          className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#22d3ee] pointer-events-none"
          style={{
            animation: 'scanLaser 2.4s ease-in-out infinite alternate'
          }}
        />
      </div>

      {/* Progress Message Bar */}
      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Icon className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Analyzing Eye Fundus</p>
              <p className="text-sm sm:text-base font-medium text-slate-100">{currentPhase.text}</p>
            </div>
          </div>
          <span className="text-lg font-bold font-mono text-cyan-400">{currentPhase.progress}%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-700 ease-out shadow-[0_0_12px_#06b6d4]"
            style={{ width: `${currentPhase.progress}%` }}
          />
        </div>
      </div>

      <style>{`
        @keyframes scanLaser {
          0% { top: 4%; opacity: 0.8; }
          50% { opacity: 1; }
          100% { top: 96%; opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default DiagnosticScanner;
