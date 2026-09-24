import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Eye, Activity, ShieldCheck, Sparkles, Cpu, CheckCircle } from 'lucide-react';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
      {/* Left Column - Medical Telemetry & Vision AI Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/60 p-12 flex-col justify-between relative overflow-hidden border-r border-slate-800">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 -left-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Logo */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center space-x-3 group">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-400 text-slate-950 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Eye className="h-7 w-7 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-2xl font-extrabold text-white tracking-tight">
                Retina<span className="text-cyan-400">XAI</span>
              </span>
              <p className="text-xs text-slate-400 font-mono tracking-wider uppercase">
                Ophthalmic Intelligence Platform
              </p>
            </div>
          </Link>
        </div>

        {/* Middle Feature Highlights */}
        <div className="relative z-10 space-y-6 max-w-lg my-auto py-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Explainable Clinical Decision Support</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
            Dual-Stage Deep Learning & Visual Decision Evidence
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed">
            Secure, HIPAA-aligned portal providing transparent Grad-CAM activation maps for Diabetic Retinopathy, Glaucoma, Cataracts, and Myopia.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm mb-0.5">
                <Cpu className="w-4 h-4" />
                <span>EfficientNet-B3</span>
              </div>
              <p className="text-xs text-slate-400">1536-channel feature extraction</p>
            </div>
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-0.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Doctor Validated</span>
              </div>
              <p className="text-xs text-slate-400">Ophthalmologist review workflow</p>
            </div>
          </div>
        </div>

        {/* Bottom Metrics Footer */}
        <div className="relative z-10 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>Final Year Project (FYP) 2026</span>
          <span className="font-mono text-cyan-400">XAI V2.4 DEPLOYED</span>
        </div>
      </div>

      {/* Right Column - Form Container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-slate-950">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6">
            <Link to="/" className="inline-flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 text-slate-950">
                <Eye className="h-6 w-6 stroke-[2.5]" />
              </div>
              <span className="text-xl font-bold text-white">
                Retina<span className="text-cyan-400">XAI</span>
              </span>
            </Link>
          </div>

          <Outlet />

          <p className="text-center mt-8 text-xs text-slate-500">
            © 2026 RetinaXAI Healthcare Intelligence. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
