import React, { useState } from 'react';
import { Sparkles, Check, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';

const sampleScans = [
  {
    id: 'normal',
    title: 'Healthy Retina',
    subtitle: 'Clear macula & intact vasculature',
    category: 'Normal',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    fileName: 'normal.png',
    path: '/samples/normal.png',
    expectedClass: 'Normal (Non-pathological)'
  },
  {
    id: 'diabetes',
    title: 'Diabetic Retinopathy',
    subtitle: 'Microaneurysms & exudates',
    category: 'Pathology',
    badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
    fileName: 'Diabetic retinopathey.png',
    path: '/samples/Diabetic retinopathey.png',
    expectedClass: 'Diabetic Retinopathy'
  },
  {
    id: 'glaucoma',
    title: 'Glaucoma',
    subtitle: 'Enlarged cup-to-disc ratio',
    category: 'Pathology',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    fileName: 'Glucoma.jpg',
    path: '/samples/Glucoma.jpg',
    expectedClass: 'Glaucoma'
  },
  {
    id: 'cataract',
    title: 'Cataract',
    subtitle: 'Media opacity & reduced contrast',
    category: 'Pathology',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    fileName: 'Cataract.jpg',
    path: '/samples/Cataract.jpg',
    expectedClass: 'Cataract'
  },
  {
    id: 'myopia',
    title: 'High Myopia',
    subtitle: 'Peripapillary retinal atrophy',
    category: 'Pathology',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    fileName: 'myopia.png',
    path: '/samples/myopia.png',
    expectedClass: 'Pathological Myopia'
  }
];

const SampleScansPicker = ({ onSelectSample, disabled = false }) => {
  const [selectedId, setSelectedId] = useState(null);
  const [loadingId, setLoadingId] = useState(null);

  const handleSelect = async (sample) => {
    if (disabled) return;
    try {
      setLoadingId(sample.id);
      setSelectedId(sample.id);
      
      const response = await fetch(sample.path);
      if (!response.ok) throw new Error('Failed to fetch sample image');
      const blob = await response.blob();
      const file = new File([blob], sample.fileName, { type: blob.type || 'image/png' });
      
      onSelectSample(file, sample.path, sample);
      toast.success(`Loaded sample: ${sample.title}`);
    } catch (err) {
      console.error('Error loading sample scan:', err);
      toast.error('Could not load sample image');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl backdrop-blur">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Instant Evaluation Gallery (1-Click Test)</h4>
            <p className="text-xs text-slate-400">Click any validated clinical test fundus scan to run immediate diagnosis & XAI Grad-CAM</p>
          </div>
        </div>
        <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-800 hidden sm:inline-block">
          5 CLINICAL SAMPLES
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
        {sampleScans.map((sample) => {
          const isSelected = selectedId === sample.id;
          const isLoading = loadingId === sample.id;

          return (
            <button
              key={sample.id}
              onClick={() => handleSelect(sample)}
              disabled={disabled || isLoading}
              className={`group relative text-left rounded-xl p-2.5 border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'bg-cyan-950/50 border-cyan-400 shadow-lg shadow-cyan-950/50 ring-1 ring-cyan-400'
                  : 'bg-slate-800/80 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
              } disabled:opacity-50`}
            >
              {/* Thumbnail */}
              <div className="relative w-full h-24 rounded-lg overflow-hidden bg-black/80 mb-2 border border-slate-800 flex items-center justify-center">
                <img
                  src={sample.path}
                  alt={sample.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className={`absolute top-1 right-1 text-[9px] font-semibold px-1.5 py-0.5 rounded border backdrop-blur ${sample.badgeColor}`}>
                  {sample.category}
                </span>
                {isLoading && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {isSelected && !isLoading && (
                  <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </div>

              {/* Title & Subtitle */}
              <div>
                <p className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition-colors truncate">
                  {sample.title}
                </p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {sample.subtitle}
                </p>
              </div>

              {/* Click to test hint */}
              <div className="mt-2 pt-1.5 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-cyan-400 font-medium">
                <span>Select & Test</span>
                <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SampleScansPicker;
