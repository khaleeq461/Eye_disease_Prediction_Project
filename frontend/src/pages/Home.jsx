import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Eye, Shield, Zap, Users, Clock, Award, Activity, Heart, ArrowRight,
  CheckCircle, Sparkles, Sliders, Scan, Cpu, Layers, FileCheck, Stethoscope, ChevronRight
} from 'lucide-react';

const diseasesData = [
  {
    id: 'dr',
    name: 'Diabetic Retinopathy',
    tag: 'Stage 2 Classifier',
    color: 'from-rose-500/20 to-pink-500/10 border-rose-500/40 text-rose-300',
    dotColor: 'bg-rose-400',
    description: 'Microaneurysms, hemorrhages, and lipid exudates. Early AI localization prevents irreversible vision loss.',
    sampleImg: '/samples/Diabetic retinopathey.png',
    focusArea: 'Macula & vascular arcades'
  },
  {
    id: 'glaucoma',
    name: 'Glaucoma (Cupping)',
    tag: 'Stage 2 Classifier',
    color: 'from-purple-500/20 to-indigo-500/10 border-purple-500/40 text-purple-300',
    dotColor: 'bg-purple-400',
    description: 'Optic nerve head neuroretinal rim thinning and vertical cup-to-disc ratio (CDR) enlargement.',
    sampleImg: '/samples/Glucoma.jpg',
    focusArea: 'Optic disc & peripapillary rim'
  },
  {
    id: 'cataract',
    name: 'Cataract / Media Opacity',
    tag: 'Stage 2 Classifier',
    color: 'from-blue-500/20 to-cyan-500/10 border-blue-500/40 text-blue-300',
    dotColor: 'bg-blue-400',
    description: 'Crystalline lens opacity causing diffuse visual attenuation and spatial contrast reduction.',
    sampleImg: '/samples/Cataract.jpg',
    focusArea: 'Anterior media & diffuse field'
  },
  {
    id: 'myopia',
    name: 'Pathological Myopia',
    tag: 'Stage 2 Classifier',
    color: 'from-amber-500/20 to-yellow-500/10 border-amber-500/40 text-amber-300',
    dotColor: 'bg-amber-400',
    description: 'Chorioretinal peripapillary atrophy, posterior staphyloma, and macular lacquer cracks.',
    sampleImg: '/samples/myopia.png',
    focusArea: 'Peripapillary chorioretina'
  }
];

const Home = () => {
  const [activeDisease, setActiveDisease] = useState(diseasesData[0]);
  const [heroSplitPosition, setHeroSplitPosition] = useState(50);

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-8 pb-16">
        {/* Background glow effects */}
        <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 -right-20 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute -bottom-20 left-1/3 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center space-x-2.5 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-cyan-300 text-xs font-semibold shadow-lg shadow-cyan-500/10">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                <span>Explainable AI (XAI) & Dual-Stage Deep Learning</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
                Smart Retinal Disease <br />
                <span className="text-gradient-cyan">
                  Detection & Grad-CAM XAI
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
                AI diagnostic assistant for ophthalmologists and patients. Combines <strong className="text-white">EfficientNet-B3</strong> with gradient-weighted attention maps to provide transparent, evidence-backed retinal disease screening.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/diagnose"
                  className="btn-gradient-cyan px-7 py-3.5 text-base shadow-cyan-500/30"
                >
                  <Eye className="w-5 h-5" />
                  <span>Launch Diagnostic Studio</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/about"
                  className="btn-ghost-dark px-6 py-3.5 text-base"
                >
                  <span>Model Architecture</span>
                </Link>
              </div>

              {/* Live Metric Statistics Strip */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/80 max-w-lg">
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">98.4%</div>
                  <p className="text-xs text-slate-400 mt-0.5">Binary Accuracy</p>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400 font-mono">&lt; 1.5s</div>
                  <p className="text-xs text-slate-400 mt-0.5">XAI Inference</p>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">5 Classes</div>
                  <p className="text-xs text-slate-400 mt-0.5">Dual-Stage Pipeline</p>
                </div>
              </div>
            </div>

            {/* Right Hero Interactive Teaser Widget */}
            <div className="lg:col-span-5 relative">
              <div className="glass-card p-4 sm:p-5 border-cyan-500/30 glow-cyan">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                  <div className="flex items-center space-x-2 text-cyan-400 font-mono">
                    <Scan className="w-4 h-4 animate-pulse" />
                    <span>LIVE XAI PREVIEW DEMO</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                    DIABETIC RETINOPATHY
                  </span>
                </div>

                {/* Split Slider Preview */}
                <div 
                  className="relative my-3 h-64 sm:h-72 rounded-xl overflow-hidden bg-black border border-slate-800 cursor-ew-resize select-none"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    setHeroSplitPosition(Math.max(10, Math.min(90, x)));
                  }}
                >
                  <img
                    src="/samples/Diabetic retinopathey.png"
                    alt="Original Fundus"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {/* Heatmap Layer */}
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ clipPath: `polygon(${heroSplitPosition}% 0, 100% 0, 100% 100%, ${heroSplitPosition}% 100%)` }}
                  >
                    <img
                      src="/samples/Diabetic retinopathey.png"
                      alt="Grad-CAM Overlay"
                      className="w-full h-full object-cover filter contrast-150 saturate-200 hue-rotate-180"
                    />
                  </div>
                  {/* Divider */}
                  <div
                    className="absolute top-0 bottom-0 pointer-events-none"
                    style={{ left: `${heroSplitPosition}%`, transform: 'translateX(-50%)' }}
                  >
                    <div className="w-0.5 h-full bg-cyan-400 shadow-[0_0_12px_#22d3ee]" />
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center text-[10px] font-bold shadow-md">
                      ↔
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-2 text-[10px] font-mono bg-slate-900/90 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                    RAW SCAN
                  </div>
                  <div className="absolute bottom-2 right-2 text-[10px] font-mono bg-cyan-950/90 text-cyan-300 px-2 py-0.5 rounded border border-cyan-700">
                    GRAD-CAM HEATMAP
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Hover to drag visualizer</span>
                  <Link to="/diagnose" className="text-cyan-400 font-semibold hover:underline flex items-center gap-1">
                    Try with full tools <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Retinal Pathology Explorer */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-800/60">
            Multi-Class Clinical Coverage
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3">
            Targeted Ophthalmic Conditions
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-2">
            Our dual-stage EfficientNet-B3 model accurately discriminates healthy retinal biology from pathological states across 4 primary disease categories.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {diseasesData.map((disease) => {
            const isSelected = activeDisease.id === disease.id;
            return (
              <div
                key={disease.id}
                onClick={() => setActiveDisease(disease)}
                className={`cursor-pointer rounded-2xl p-5 border transition-all duration-300 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-500 shadow-xl shadow-cyan-950/40 ring-1 ring-cyan-500 scale-[1.02]'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div>
                  <div className="relative w-full h-36 rounded-xl overflow-hidden bg-black mb-4 border border-slate-800">
                    <img
                      src={disease.sampleImg}
                      alt={disease.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-950/80 text-cyan-300 border border-slate-700 backdrop-blur">
                      {disease.tag}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`w-2 h-2 rounded-full ${disease.dotColor}`} />
                    <h3 className="text-base font-bold text-white">{disease.name}</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    {disease.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Target: <strong className="text-slate-200">{disease.focusArea}</strong></span>
                  <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-600'}`} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Dual-Stage AI Pipeline Architecture Diagram Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card p-8 sm:p-12 border-slate-800 relative overflow-hidden">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
                Explainable Neural Architecture
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                How Our Two-Stage AI Pipeline Works
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Rather than treating deep learning as an uninterpretable black box, our framework segments diagnosis into clinical triage stages with visual explainability.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3 text-xs text-slate-300">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mt-0.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-white block font-semibold">Stage 1: Binary Pathology Filter</strong>
                    Screens image for abnormal morphological patterns vs healthy retinal fundus.
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs text-slate-300">
                  <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 mt-0.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-white block font-semibold">Stage 2: Multi-Class Differential Classifier</strong>
                    Categorizes pathological inputs into DR, Glaucoma, Cataract, or Myopia.
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs text-slate-300">
                  <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 mt-0.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-white block font-semibold">Stage 3: Grad-CAM++ Attention Heatmap</strong>
                    Back-propagates gradients to map the exact retinal pixels driving the prediction.
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Process Cards on Right */}
            <div className="lg:col-span-7 grid sm:grid-cols-3 gap-4">
              <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                  <Scan className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">1. Fundus Ingestion</h4>
                <p className="text-[11px] text-slate-400">Standardized RGB matrix normalization at 300×300 resolution.</p>
              </div>

              <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <Cpu className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">2. EfficientNet-B3</h4>
                <p className="text-[11px] text-slate-400">1,536-channel feature extraction with dropout regularization.</p>
              </div>

              <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">3. Grad-CAM XAI</h4>
                <p className="text-[11px] text-slate-400">Visual decision heatmap synthesized for doctor verification.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 border border-cyan-500/30 p-10 sm:p-16 shadow-2xl">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white max-w-2xl mx-auto">
            Ready to Test the Explainable AI Diagnostic Studio?
          </h2>
          <p className="text-slate-300 text-sm sm:text-base mt-3 max-w-xl mx-auto">
            Experience 1-click retinal disease screening with real-time interactive Grad-CAM split reveal and magnification loupe.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Link
              to="/diagnose"
              className="btn-gradient-cyan px-8 py-4 text-base"
            >
              <Eye className="w-5 h-5" />
              <span>Start Diagnosis Now</span>
            </Link>
            <Link
              to="/register"
              className="btn-ghost-dark px-7 py-4 text-base"
            >
              <span>Create Account</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;