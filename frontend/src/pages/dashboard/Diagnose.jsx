import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import {
  Upload, X, Eye, AlertCircle, CheckCircle,
  FileImage, ArrowRight, RefreshCw, Calendar, Send, FileText,
  Activity, ShieldAlert, Sparkles, Check, ChevronRight, Stethoscope
} from 'lucide-react';
import DiagnosticScanner from '../../components/DiagnosticScanner';
import XAIStudio from '../../components/XAIStudio';
import SampleScansPicker from '../../components/SampleScansPicker';
import XAIEtiologyPathway from '../../components/XAIEtiologyPathway';
import BACKEND_URL from '../../config';

// Configure axios
const api = axios.create({
  baseURL: BACKEND_URL, // Uses vite proxy locally, or cloud backend URL if deployed
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const diseaseDescriptions = {
  normal: {
    title: 'Healthy Retina (Non-Pathological)',
    summary: 'Uniform vascular architecture with well-defined macula and sharp optic disc margins. No abnormal lesions, hemorrhages, or optic cup enlargement detected.',
    triageLevel: 'Routine Care',
    triageColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    urgencyText: 'Schedule standard annual routine ophthalmic checkup.'
  },
  diabetes: {
    title: 'Diabetic Retinopathy (DR)',
    summary: 'Grad-CAM neural attention is heavily concentrated on microaneurysms, blot hemorrhages, and lipid exudates. Strict glycemic control and fundus fluorescein angiography or anti-VEGF consult recommended.',
    triageLevel: 'High Urgency',
    triageColor: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
    urgencyText: 'Urgent referral to a retinal specialist for stage evaluation and macular edema assessment.'
  },
  glaucoma: {
    title: 'Glaucomatous Optic Neuropathy',
    summary: 'Neural activations are strongly localized to the optic nerve head, reflecting neuroretinal rim thinning and an enlarged vertical cup-to-disc ratio (CDR).',
    triageLevel: 'High Urgency',
    triageColor: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    urgencyText: 'Immediate tonometry (IOP check) and Humphrey visual field testing recommended.'
  },
  cataract: {
    title: 'Cataract / Media Opacity',
    summary: 'Grad-CAM reflects diffuse attenuation and contrast degradation caused by crystalline lens opacification.',
    triageLevel: 'Moderate Care',
    triageColor: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    urgencyText: 'Slit-lamp biomicroscopy recommended to assess visual acuity impact and surgical candidacy.'
  },
  myopia: {
    title: 'Pathological Myopia',
    summary: 'Focal activations focus on peripapillary chorioretinal atrophy, posterior staphyloma, or retinal tessellation.',
    triageLevel: 'Moderate Care',
    triageColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    urgencyText: 'Monitor for peripheral retinal tears and macular chorioretinal thinning.'
  }
};

const Diagnose = () => {
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  
  // Booking state
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingReason, setBookingReason] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  
  // Review state
  const [reviewDoctor, setReviewDoctor] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Result state
  const [result, setResult] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      const res = await api.get('/api/prediction/doctors');
      setDoctors(res.data.data?.doctors || []);
    } catch (error) {
      console.error('Error loading doctors:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };

  const processFile = (file) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }
    setImageFile(file);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleSampleSelect = (file, previewUrl) => {
    setImageFile(file);
    setImagePreview(previewUrl);
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleReset = () => {
    setImagePreview(null);
    setImageFile(null);
    setResult(null);
    setShowBookingModal(false);
    setShowReviewModal(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDiagnose = async () => {
    if (!imageFile) {
      toast.error('Please select or upload an image first');
      return;
    }

    setIsDiagnosing(true);
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const response = await api.post('/api/prediction/diagnose', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      console.log('Diagnosis response:', response.data);
      setResult(response.data.data);
      toast.success('Diagnosis and Grad-CAM synthesized successfully!');
    } catch (error) {
      console.error('Diagnosis error:', error);
      toast.error(error.response?.data?.message || 'Diagnosis failed. Please verify the ML server is active.');
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!selectedDoctor || !bookingDate || !bookingTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsBooking(true);
    try {
      await api.post('/api/appointments', {
        doctorId: selectedDoctor,
        date: bookingDate,
        time: bookingTime,
        reason: bookingReason || `Follow-up for ${result?.prediction} diagnosis`,
        predictionId: result?.id
      });
      
      toast.success('Appointment request sent! The doctor will confirm shortly.');
      setShowBookingModal(false);
      navigate('/appointments');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to book appointment');
    } finally {
      setIsBooking(false);
    }
  };

  const handleSendForReview = async (e) => {
    e.preventDefault();
    if (!reviewDoctor) {
      toast.error('Please select a doctor');
      return;
    }

    setIsSending(true);
    try {
      await api.post(`/api/prediction/${result?.id}/send-for-review`, {
        doctorId: reviewDoctor,
        notes: reviewNotes
      });
      
      toast.success('Prediction sent to doctor for review!');
      setShowReviewModal(false);
      navigate('/history');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send for review');
    } finally {
      setIsSending(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!result?.id) {
      toast.error('No prediction found');
      return;
    }

    setIsGeneratingReport(true);
    try {
      const res = await api.post(`/api/prediction/${result.id}/generate-report`);
      if (res.data.status === 'success' && res.data.data.reportUrl) {
        toast.success('Clinical PDF Report generated successfully!');
        window.open(res.data.data.reportUrl, '_blank');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const currentDiseaseInfo = diseaseDescriptions[result?.prediction?.toLowerCase()] || diseaseDescriptions.normal;
  const isHealthy = result?.isNormal || result?.prediction === 'normal';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-slate-700/80">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Explainable AI (XAI) Diagnostic Suite
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            Retinal Disease Analysis & Grad-CAM Heatmaps
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Upload or select a retinal fundus scan for dual-stage deep learning classification (EfficientNet-B3) and gradient-weighted visual decision evidence.
          </p>
        </div>
      </div>

      {/* Instant 1-Click Sample Scans Picker */}
      <SampleScansPicker onSelectSample={handleSampleSelect} disabled={isDiagnosing} />

      {/* Interactive Laser Radar Scanner during ML Inference */}
      {isDiagnosing && (
        <DiagnosticScanner imageSrc={imagePreview} />
      )}

      {/* Upload & Preview Dropzone (Hidden when scanning to reduce noise) */}
      {!isDiagnosing && (
        <div
          className={`relative bg-slate-900/90 rounded-2xl p-6 sm:p-8 shadow-xl border-2 transition-all ${
            isDragging
              ? 'border-cyan-400 bg-slate-800/90 scale-[1.01]'
              : 'border-slate-800 hover:border-slate-700'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {imagePreview ? (
            <div className="space-y-6">
              <div className="relative rounded-xl overflow-hidden bg-black/60 border border-slate-800 max-h-96 flex items-center justify-center p-2">
                <img 
                  src={imagePreview} 
                  alt="Fundus Preview" 
                  className="max-h-80 w-full object-contain rounded-lg shadow-md" 
                />
                <button 
                  onClick={handleReset} 
                  title="Remove image"
                  className="absolute top-4 right-4 p-2 bg-rose-600/90 hover:bg-rose-600 text-white rounded-full shadow-lg transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* File Info & Action Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-800/80 rounded-xl p-4 border border-slate-700">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    <FileImage className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-100 text-sm truncate max-w-xs">{imageFile?.name || 'sample_fundus.png'}</p>
                    <p className="text-xs text-slate-400 font-mono">{imageFile ? (imageFile.size / 1024 / 1024).toFixed(2) + ' MB' : 'Ready for analysis'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={handleUploadClick}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-600 transition-all"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Change File</span>
                  </button>
                  <button
                    onClick={handleDiagnose}
                    disabled={isDiagnosing}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-cyan-500/30 transition-all"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Run XAI Diagnosis</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center shadow-lg shadow-cyan-500/10">
                <Upload className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Upload Patient Retinal Fundus Scan</h3>
              <p className="text-sm text-slate-400 mb-5 max-w-md mx-auto">
                Drag and drop a fundus photograph here, or browse your local directory. Supported formats: JPG, PNG (Max 10MB).
              </p>
              <div className="flex justify-center">
                <button
                  onClick={handleUploadClick}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold rounded-xl hover:from-cyan-400 hover:to-teal-400 shadow-lg shadow-cyan-500/20 transition-all"
                >
                  <Upload className="h-4 w-4" />
                  <span>Select Fundus Image</span>
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>
          )}
        </div>
      )}

      {/* Comprehensive Results & Interactive XAI Visualizer Studio */}
      {result && !isDiagnosing && (
        <div className="space-y-6 animate-fade-in">
          {/* Diagnostic Header Card */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-700 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="flex items-center space-x-4">
                <div className={`p-3.5 rounded-2xl border shadow-lg ${
                  isHealthy
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-emerald-500/20'
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-rose-500/20'
                }`}>
                  {isHealthy ? <CheckCircle className="h-8 w-8" /> : <AlertCircle className="h-8 w-8" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-extrabold text-white capitalize">
                      {currentDiseaseInfo.title}
                    </h2>
                    <span className={`text-xs px-3 py-1 rounded-full font-bold border ${currentDiseaseInfo.triageColor}`}>
                      {currentDiseaseInfo.triageLevel}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    Neural Confidence: <strong className="text-cyan-300 font-mono">{(result.confidence * 100).toFixed(1)}%</strong>
                  </p>
                </div>
              </div>

              {/* Triage Urgency Callout */}
              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 max-w-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300 mb-1">
                  <Stethoscope className="w-3.5 h-3.5" />
                  Clinical Triage Action
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {currentDiseaseInfo.urgencyText}
                </p>
              </div>
            </div>

            {/* Health Assessment & Condition Probabilities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-5">
              {/* Overall Health Ratio */}
              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  Eye Health Status
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-800/50">
                    <p className="text-xl font-bold font-mono text-emerald-400">
                      {((result.binaryResult?.normalProbability || (isHealthy ? result.confidence : 1 - result.confidence)) * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-emerald-300/80 mt-0.5">Healthy (Normal)</p>
                  </div>
                  <div className="p-3 bg-rose-950/40 rounded-xl border border-rose-800/50">
                    <p className="text-xl font-bold font-mono text-rose-400">
                      {((result.binaryResult?.diseaseProbability || (isHealthy ? 1 - result.confidence : result.confidence)) * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-rose-300/80 mt-0.5">Condition Detected</p>
                  </div>
                </div>
              </div>

              {/* Disease Probabilities Breakdown */}
              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    4-Condition Pathology Spectrum
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">Differential Risk</span>
                </div>
                <div className="space-y-2.5">
                  {result.diseaseResult?.probabilities ? (
                    Object.entries(result.diseaseResult.probabilities).map(([disease, prob]) => {
                      const isTop = disease.toLowerCase() === result.prediction.toLowerCase();
                      const diseaseColorMap = {
                        diabetes: { text: 'text-rose-300', bar: 'bg-rose-500', name: 'Diabetic Retinopathy' },
                        glaucoma: { text: 'text-purple-300', bar: 'bg-purple-500', name: 'Glaucoma' },
                        cataract: { text: 'text-amber-300', bar: 'bg-amber-500', name: 'Cataract' },
                        myopia: { text: 'text-cyan-300', bar: 'bg-cyan-400', name: 'Pathological Myopia' }
                      };
                      const conf = diseaseColorMap[disease.toLowerCase()] || { text: 'text-slate-300', bar: 'bg-slate-500', name: disease };
                      const pct = (prob * 100).toFixed(1);

                      return (
                        <div key={disease} className="space-y-1">
                          <div className="flex justify-between text-xs font-medium">
                            <span className={`${conf.text} ${isTop ? 'font-bold' : ''}`}>
                              {conf.name}
                            </span>
                            <span className="font-mono text-slate-200 font-bold">{pct}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700/50">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${conf.bar} ${
                                isTop ? 'shadow-[0_0_8px_currentColor]' : 'opacity-80'
                              }`}
                              style={{ width: `${(prob * 100) < 0.05 ? 0 : Math.min(100, prob * 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-xs text-slate-400 py-2">
                      Retina evaluated as healthy normal. Differential pathology probabilities below clinical threshold.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive XAI Studio (Split Slider, Opacity Blend, Loupe, Red-Free) */}
          <XAIStudio
            originalImage={imagePreview}
            heatmapImage={result.gradcamImageUrl || imagePreview}
            diseaseName={result.prediction}
            confidence={result.confidence}
            focalSummary={currentDiseaseInfo.summary}
          />

          {/* Neural Model Attribution & Organ Etiology Pathway */}
          <XAIEtiologyPathway
            prediction={result.prediction}
            confidence={result.confidence}
            xaiEtiology={result.xaiEtiology}
          />

          {/* Clinical Action Buttons */}
          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-700 shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Generate Report Button */}
              <button
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
                className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
              >
                {isGeneratingReport ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    <span>Download Clinical PDF Report</span>
                  </>
                )}
              </button>

              {!isHealthy && (
                <>
                  <button
                    onClick={() => setShowBookingModal(true)}
                    className="flex items-center space-x-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-cyan-600/20 transition-all"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Book Specialist Consultation</span>
                  </button>
                  <button
                    onClick={() => setShowReviewModal(true)}
                    className="flex items-center space-x-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-purple-600/20 transition-all"
                  >
                    <Send className="h-4 w-4" />
                    <span>Send for Doctor Review</span>
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/history')}
                className="flex items-center space-x-1.5 px-4 py-2.5 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all"
              >
                <FileImage className="h-3.5 w-3.5" />
                <span>Diagnostic History</span>
              </button>
              <button
                onClick={handleReset}
                className="flex items-center space-x-1.5 px-4 py-2.5 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>New Scan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Book Appointment Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-400" />
                Book Clinical Consultation
              </h2>
              <button onClick={() => setShowBookingModal(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleBookAppointment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Select Ophthalmologist *</label>
                <select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                  required
                >
                  <option value="">Choose an ophthalmologist</option>
                  {doctors.map((doc) => (
                    <option key={doc._id} value={doc._id}>
                      Dr. {doc.name} {doc.specialization ? `(${doc.specialization})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Date *</label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Time *</label>
                  <input
                    type="time"
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Clinical Reason / Symptoms</label>
                <textarea
                  value={bookingReason}
                  onChange={(e) => setBookingReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                  rows="3"
                  placeholder={`Follow-up evaluation for ${result?.prediction} diagnosis`}
                />
              </div>

              <div className="flex justify-end space-x-2.5 pt-3">
                <button type="button" onClick={() => setShowBookingModal(false)} className="px-4 py-2 border border-slate-700 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800">
                  Cancel
                </button>
                <button type="submit" disabled={isBooking} className="px-5 py-2 bg-cyan-500 text-slate-950 font-bold rounded-xl hover:bg-cyan-400 disabled:opacity-50 flex items-center">
                  {isBooking ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    'Confirm Booking'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send for Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Send className="w-5 h-5 text-purple-400" />
                Request Doctor Second Opinion
              </h2>
              <button onClick={() => setShowReviewModal(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-purple-950/40 p-3 rounded-xl border border-purple-800/40 mb-4 text-xs text-purple-200">
              Your retinal scan and Grad-CAM activation map will be routed to the specialist for validation.
            </div>

            <form onSubmit={handleSendForReview} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Select Specialist *</label>
                <select
                  value={reviewDoctor}
                  onChange={(e) => setReviewDoctor(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  required
                >
                  <option value="">Choose an ophthalmologist</option>
                  {doctors.map((doc) => (
                    <option key={doc._id} value={doc._id}>
                      Dr. {doc.name} {doc.specialization ? `(${doc.specialization})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Clinical Notes (Optional)</label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  rows="3"
                  placeholder="Describe any vision symptoms, floaters, blurriness, or history..."
                />
              </div>

              <div className="flex justify-end space-x-2.5 pt-3">
                <button type="button" onClick={() => setShowReviewModal(false)} className="px-4 py-2 border border-slate-700 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800">
                  Cancel
                </button>
                <button type="submit" disabled={isSending} className="px-5 py-2 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-500 disabled:opacity-50 flex items-center">
                  {isSending ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Submit for Review'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Diagnose;