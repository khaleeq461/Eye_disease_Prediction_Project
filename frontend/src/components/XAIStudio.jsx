import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Layers,
  Sliders,
  Columns,
  ZoomIn,
  Maximize2,
  Minimize2,
  Download,
  Info,
  Sparkles,
  Eye,
  SunMedium,
  Palette,
  RotateCcw
} from 'lucide-react';

const XAIStudio = ({
  originalImage,
  heatmapImage,
  diseaseName = 'Retinal Pathology',
  confidence = 0.95,
  focalSummary = 'Regions with high heat (red/orange) represent dominant pathological activations identified by the convolutional attention layers.'
}) => {
  // Modes: 'slider' (before/after split), 'blend' (opacity blend), 'side-by-side'
  const [viewMode, setViewMode] = useState('slider');
  const [sliderPosition, setSliderPosition] = useState(50); // percentage (0-100)
  const [opacity, setOpacity] = useState(70); // percentage (0-100)
  const [activeFilter, setActiveFilter] = useState('normal'); // 'normal', 'red-free', 'contrast', 'invert'
  const [isMagnifierActive, setIsMagnifierActive] = useState(false);
  const [magnifierPos, setMagnifierPos] = useState({ x: 0, y: 0, displayX: 0, displayY: 0, isInside: false });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef(null);
  const isDraggingRef = useRef(false);

  // Mouse / Touch handlers for Split Slider
  const handleSliderMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPosition(percent);
  }, []);

  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    handleSliderMove(e.clientX);
  };

  const handleMouseMove = (e) => {
    if (isDraggingRef.current) {
      handleSliderMove(e.clientX);
    }
    // Track magnifier coordinates
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const isInside = (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      );
      if (isInside) {
        const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
        const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
        setMagnifierPos({
          x: xPercent,
          y: yPercent,
          displayX: e.clientX - rect.left,
          displayY: e.clientY - rect.top,
          isInside: true
        });
      } else {
        setMagnifierPos((prev) => ({ ...prev, isInside: false }));
      }
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleMouseLeave = () => {
    isDraggingRef.current = false;
    setMagnifierPos((prev) => ({ ...prev, isInside: false }));
  };

  const handleTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      handleSliderMove(e.touches[0].clientX);
    }
  };

  // Keyboard shortcut listener for escape / fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // CSS Filters mapping
  const getFilterStyle = () => {
    switch (activeFilter) {
      case 'red-free':
        // Simulates ophthalmology green/red-free filter for vessel contrast
        return 'filter: sepia(100%) hue-rotate(70deg) saturate(250%) contrast(140%);';
      case 'contrast':
        return 'filter: contrast(165%) brightness(95%) saturate(120%);';
      case 'invert':
        return 'filter: invert(90%) hue-rotate(180deg);';
      default:
        return '';
    }
  };

  const activeHeatmapSrc = heatmapImage || originalImage;

  return (
    <div className={`relative bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden transition-all ${
      isFullscreen ? 'fixed inset-0 z-50 rounded-none bg-slate-950 flex flex-col p-4 sm:p-6' : 'p-4 sm:p-6'
    }`}>
      {/* Top Studio Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-500 text-slate-950 shadow-md shadow-cyan-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              Explainable AI (XAI) Visualizer
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                Grad-CAM++
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Interactive neural activation mapping for <strong className="text-cyan-300 capitalize">{diseaseName}</strong> ({(confidence * 100).toFixed(1)}% confidence)
            </p>
          </div>
        </div>

        {/* View Mode Switcher Pills */}
        <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700 text-xs">
          <button
            onClick={() => setViewMode('slider')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'slider'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Split Reveal</span>
          </button>
          <button
            onClick={() => setViewMode('blend')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'blend'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Opacity Blend</span>
          </button>
          <button
            onClick={() => setViewMode('side-by-side')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'side-by-side'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Dual View</span>
          </button>
        </div>

        {/* Secondary Tool Controls */}
        <div className="flex items-center gap-2">
          {/* Magnifier Tool Toggle */}
          <button
            onClick={() => setIsMagnifierActive(!isMagnifierActive)}
            title="Toggle Retinal Magnifier Loupe"
            className={`p-2 rounded-xl border text-xs flex items-center gap-1 transition-all ${
              isMagnifierActive
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <ZoomIn className="w-4 h-4" />
            <span className="hidden sm:inline">Loupe 2.5x</span>
          </button>

          {/* Fullscreen Modal Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Examination'}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 border border-slate-700 hover:text-white transition-all"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className={`relative my-4 flex-1 flex items-center justify-center select-none ${
        isFullscreen ? 'h-full min-h-0' : 'min-h-[380px] sm:min-h-[460px]'
      }`}>
        {viewMode === 'side-by-side' ? (
          /* Side-by-Side Dual View */
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
            <div className="relative rounded-xl overflow-hidden bg-black/60 border border-slate-800 flex flex-col items-center justify-center p-2">
              <span className="absolute top-3 left-3 z-10 px-2.5 py-1 text-xs font-semibold bg-slate-900/90 text-slate-300 rounded border border-slate-700 backdrop-blur">
                Original Fundus Scan
              </span>
              <img
                src={originalImage}
                alt="Original Fundus"
                className="max-h-[380px] w-full object-contain rounded-lg transition-all"
                style={{
                  filter: activeFilter === 'red-free'
                    ? 'sepia(100%) hue-rotate(70deg) saturate(220%) contrast(140%)'
                    : activeFilter === 'contrast'
                    ? 'contrast(160%) brightness(95%)'
                    : activeFilter === 'invert'
                    ? 'invert(90%) hue-rotate(180deg)'
                    : 'none'
                }}
              />
            </div>
            <div className="relative rounded-xl overflow-hidden bg-black/60 border border-cyan-900/40 flex flex-col items-center justify-center p-2">
              <span className="absolute top-3 left-3 z-10 px-2.5 py-1 text-xs font-semibold bg-cyan-950/90 text-cyan-300 rounded border border-cyan-700/50 backdrop-blur flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                Grad-CAM Activation Map
              </span>
              <img
                src={activeHeatmapSrc}
                alt="Grad-CAM Heatmap"
                className="max-h-[380px] w-full object-contain rounded-lg transition-all"
              />
            </div>
          </div>
        ) : (
          /* Overlay Stage (Supports both Split Reveal and Opacity Blend) */
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchMove={handleTouchMove}
            className="relative w-full max-w-2xl h-[380px] sm:h-[460px] rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-slate-800 cursor-ew-resize shadow-inner"
          >
            {/* Base Layer: Raw Fundus Scan */}
            <img
              src={originalImage}
              alt="Raw Retinal Scan"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
              style={{
                filter: activeFilter === 'red-free'
                  ? 'sepia(100%) hue-rotate(70deg) saturate(220%) contrast(140%)'
                  : activeFilter === 'contrast'
                  ? 'contrast(160%) brightness(95%)'
                  : activeFilter === 'invert'
                  ? 'invert(90%) hue-rotate(180deg)'
                  : 'none'
              }}
            />

            {/* Overlaid Layer: Grad-CAM Heatmap */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{
                clipPath: viewMode === 'slider' ? `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)` : 'none',
                opacity: viewMode === 'blend' ? opacity / 100 : 1,
                transition: viewMode === 'blend' ? 'opacity 0.15s ease' : 'none'
              }}
            >
              <img
                src={activeHeatmapSrc}
                alt="Grad-CAM Overlay"
                className="w-full h-full object-contain select-none"
              />
            </div>

            {/* Split Slider Divider Line & Thumb */}
            {viewMode === 'slider' && (
              <div
                className="absolute top-0 bottom-0 z-20 pointer-events-none"
                style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
              >
                <div className="w-0.5 h-full bg-cyan-400 shadow-[0_0_12px_#22d3ee]" />
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-cyan-500 text-slate-950 font-bold flex items-center justify-center shadow-lg shadow-cyan-500/50 border-2 border-white cursor-ew-resize">
                  <Columns className="w-4 h-4" />
                </div>
              </div>
            )}

            {/* Stage HUD Badges */}
            <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 pointer-events-none">
              <span className="px-2.5 py-1 text-[11px] font-mono bg-slate-900/90 text-slate-300 rounded border border-slate-700 backdrop-blur">
                ORIGINAL (LEFT)
              </span>
              <span className="px-2.5 py-1 text-[11px] font-mono bg-cyan-950/90 text-cyan-300 rounded border border-cyan-600/50 backdrop-blur">
                GRAD-CAM HEATMAP (RIGHT)
              </span>
            </div>

            {/* Interactive Magnifier Loupe Floating Circle */}
            {isMagnifierActive && magnifierPos.isInside && (
              <div
                className="absolute pointer-events-none rounded-full border-2 border-cyan-400 shadow-[0_0_24px_rgba(6,182,212,0.6)] overflow-hidden z-30"
                style={{
                  width: '160px',
                  height: '160px',
                  left: `${magnifierPos.displayX}px`,
                  top: `${magnifierPos.displayY}px`,
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: '#000'
                }}
              >
                {/* Scaled Zoom Inner Image */}
                <div
                  className="w-full h-full"
                  style={{
                    backgroundImage: `url(${viewMode === 'slider' && magnifierPos.x > sliderPosition ? activeHeatmapSrc : originalImage})`,
                    backgroundPosition: `${magnifierPos.x}% ${magnifierPos.y}%`,
                    backgroundSize: '300%',
                    backgroundRepeat: 'no-repeat'
                  }}
                />
                {/* Loupe Crosshair Target */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 border border-cyan-400/60 rounded-full" />
                  <div className="absolute w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
                </div>
                <div className="absolute bottom-2 inset-x-0 text-center text-[10px] font-mono text-cyan-300 font-bold">
                  2.5× ZOOM
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Control Panel: Filters, Sliders, and Colormap Legend */}
      <div className="pt-4 border-t border-slate-800 space-y-3">
        {/* Opacity Slider Control (Active in Blend Mode) */}
        {viewMode === 'blend' && (
          <div className="flex items-center gap-4 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 min-w-[120px]">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Heatmap Opacity:
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="text-xs font-mono font-bold text-cyan-400 min-w-[45px] text-right">
              {opacity}%
            </span>
            <div className="hidden sm:flex items-center gap-1.5">
              {[0, 35, 70, 100].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setOpacity(preset)}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded border transition-all ${
                    opacity === preset
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500'
                      : 'bg-slate-700 text-slate-400 border-slate-600 hover:text-white'
                  }`}
                >
                  {preset}%
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Multi-Tool Bar: Medical Optical Filters + XAI Color Legend */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          {/* Medical Optical Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              Optical Contrast:
            </span>
            {[
              { id: 'normal', label: 'Standard RGB' },
              { id: 'red-free', label: 'Red-Free (Green)' },
              { id: 'contrast', label: 'High Contrast' },
              { id: 'invert', label: 'Vessel Invert' }
            ].map((filt) => (
              <button
                key={filt.id}
                onClick={() => setActiveFilter(filt.id)}
                className={`px-2.5 py-1 rounded-lg border font-medium transition-all ${
                  activeFilter === filt.id
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {filt.label}
              </button>
            ))}
          </div>

          {/* Grad-CAM Heatmap Gradient Key / Color Scale */}
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
            <span className="text-slate-400 text-[11px] font-medium">Attention Heat:</span>
            <div className="w-28 sm:w-36 h-2.5 rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 via-yellow-400 to-red-600 shadow-sm" />
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="text-blue-400">Baseline</span>
              <span className="text-red-400 font-bold">Max Focus</span>
            </div>
          </div>
        </div>

        {/* Clinical Interpretation Guide Box */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/40 text-cyan-200 text-xs leading-relaxed">
          <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
          <p>
            <strong className="text-white font-semibold">Clinical XAI Interpretation: </strong>
            {focalSummary}
          </p>
        </div>
      </div>
    </div>
  );
};

export default XAIStudio;
