import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Eye, CheckCircle, XCircle, Calendar, User,
  AlertCircle, FileText, Activity, Thermometer, Sparkles, Download, RefreshCw
} from 'lucide-react';
import { UPLOAD_URL } from '../../config';
import axios from 'axios';
import XAIStudio from '../../components/XAIStudio';
import XAIEtiologyPathway from '../../components/XAIEtiologyPathway';

const PredictionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [error, setError] = useState(null);

  // Determine back path based on current URL
  const getBackPath = () => {
    if (location.pathname.includes('/admin/')) {
      return '/admin/reviews';
    }
    return '/doctor/reviews';
  };

  useEffect(() => {
    loadPrediction();
  }, [id]);

  const loadPrediction = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/prediction/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPrediction(res.data.data.prediction);
      if (res.data.data.prediction.doctorReview?.notes) {
        setReviewNotes(res.data.data.prediction.doctorReview.notes);
      }
      if (res.data.data.prediction.doctorReview?.treatmentPlan) {
        setTreatmentPlan(res.data.data.prediction.doctorReview.treatmentPlan);
      }
    } catch (error) {
      console.error('Error loading prediction:', error);
      setError(error.response?.data?.message || 'Failed to load prediction');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!id) return;
    setIsGeneratingReport(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`/api/prediction/${id}/generate-report`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
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

  const handleReview = async (status) => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      await axios.put(`/api/prediction/${id}/review`,
        {
          status,
          doctorNotes: reviewNotes,
          treatmentPlan: treatmentPlan
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Case ${status} successfully`);
      navigate('/doctor/reviews');
    } catch (error) {
      console.error('Error reviewing prediction:', error);
      toast.error('Failed to submit clinical review');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'in-review': return 'bg-blue-100 text-blue-700';
      case 'reviewed': return 'bg-green-100 text-green-700';
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const diseaseLabels = {
    normal: 'Normal / Healthy',
    diabetes: 'Diabetic Retinopathy',
    glaucoma: 'Glaucoma',
    cataract: 'Cataract',
    myopia: 'Myopia (Near-sightedness)'
  };

  const diseaseColors = {
    normal: 'text-green-600 bg-green-50',
    diabetes: 'text-red-600 bg-red-50',
    glaucoma: 'text-orange-600 bg-orange-50',
    cataract: 'text-purple-600 bg-purple-50',
    myopia: 'text-blue-600 bg-blue-50'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{error}</h3>
        <button 
          onClick={() => navigate('/doctor/reviews')}
          className="text-cyan-600 hover:underline"
        >
          Back to Reviews
        </button>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Prediction not found</h3>
        <button 
          onClick={() => navigate('/doctor/reviews')}
          className="text-cyan-600 hover:underline"
        >
          Back to Reviews
        </button>
      </div>
    );
  }

  const rawImageSrc = prediction.imageUrl ? UPLOAD_URL(prediction.imageUrl) : '';
  const heatmapSrc = prediction.gradcamImageUrl ? UPLOAD_URL(prediction.gradcamImageUrl) : rawImageSrc;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(getBackPath())}
            className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Clinical Case Examination
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-mono font-semibold">
                ID: {prediction._id.slice(-8).toUpperCase()}
              </span>
            </h1>
            <p className="text-sm text-gray-500">
              Submitted by {prediction.userId?.name || 'Patient'} on {new Date(prediction.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleGenerateReport}
            disabled={isGeneratingReport}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isGeneratingReport ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Generating Report...</span>
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                <span>Download Clinical PDF</span>
              </>
            )}
          </button>
          <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(prediction.reviewRequest?.status)}`}>
            {prediction.reviewRequest?.status || prediction.status}
          </span>
        </div>
      </div>

      {/* Main Examination Studio */}
      <div className="space-y-6">
        {/* Interactive XAI Studio */}
        <XAIStudio
          originalImage={rawImageSrc}
          heatmapImage={heatmapSrc}
          diseaseName={prediction.prediction}
          confidence={prediction.confidence}
          focalSummary={`Ophthalmology examination tool for case #${prediction._id.slice(-8).toUpperCase()}. Inspect convolutional feature maps for focal microvascular and neuroretinal anomalies.`}
        />

        {/* Neural Model Attribution & Organ Etiology Pathway */}
        <XAIEtiologyPathway
          prediction={prediction.prediction}
          confidence={prediction.confidence}
          xaiEtiology={prediction.xaiEtiology}
        />

        {/* Clinical Diagnostics & Review Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Patient & Basic Metadata */}
          <div className="lg:col-span-1 space-y-6">
            {/* Patient Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-cyan-600" />
                Patient Details
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <p className="text-gray-400">Patient Name</p>
                  <p className="font-semibold text-gray-900">{prediction.userId?.name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-gray-400">Email Address</p>
                  <p className="font-semibold text-gray-900">{prediction.userId?.email}</p>
                </div>
                {prediction.userId?.phone && (
                  <div>
                    <p className="text-gray-400">Contact Number</p>
                    <p className="font-semibold text-gray-900">{prediction.userId.phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-400">Submission Timestamp</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(prediction.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Validation Actions for Doctor */}
            {prediction.status === 'pending' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-bold text-gray-900 mb-3 text-sm">Fast Decision Actions</h3>
                <div className="space-y-2.5">
                  <button
                    onClick={() => handleReview('reviewed')}
                    disabled={submitting}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm AI Diagnosis
                  </button>
                  <button
                    onClick={() => handleReview('rejected')}
                    disabled={submitting}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl flex items-center justify-center text-xs shadow-md shadow-rose-600/20 disabled:opacity-50 transition-all"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Diagnosis
                  </button>
                  <Link
                    to={`/doctor/appointment/new?patient=${prediction.userId?._id}&prediction=${prediction._id}`}
                    className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl flex items-center justify-center text-xs shadow-md shadow-cyan-600/20 transition-all"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Clinical Follow-Up
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: AI Analytics & Doctor Assessment */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Diagnosis Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4 text-cyan-600" />
                AI Diagnostic Findings
              </h3>
              
              <div className={`p-4 rounded-xl mb-4 ${diseaseColors[prediction.prediction] || 'bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs opacity-75 font-semibold">Predicted Pathology</p>
                    <p className="text-2xl font-extrabold capitalize">
                      {diseaseLabels[prediction.prediction] || prediction.prediction}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs opacity-75 font-semibold">Model Confidence</p>
                    <p className="text-2xl font-extrabold font-mono">
                      {Math.round(prediction.confidence * 100)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Multi-Class Probabilities Grid */}
              {prediction.diseaseResult?.probabilities && (
                <div className="space-y-2 mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Class Probability Distribution</p>
                  {Object.entries(prediction.diseaseResult.probabilities).map(([disease, prob]) => (
                    <div key={disease} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="capitalize text-gray-700">{disease}</span>
                        <span className="font-mono text-gray-700">{(prob * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            disease === prediction.prediction ? 'bg-cyan-500' : 'bg-gray-300'
                          }`}
                          style={{ width: `${(prob * 100) < 0.05 ? 0 : Math.min(100, prob * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Doctor Review Assessment Box */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-cyan-600" />
                Ophthalmologist Clinical Evaluation
              </h3>
              
              {prediction.doctorReview?.reviewedAt ? (
                <div className="space-y-4 text-xs">
                  <div className="p-3.5 bg-gray-50 rounded-xl">
                    <p className="text-gray-400">Validated by</p>
                    <p className="font-bold text-gray-900">
                      Dr. {prediction.doctorReview.doctorId?.name || 'Specialist'}
                    </p>
                    <p className="text-gray-400 mt-0.5">
                      {new Date(prediction.doctorReview.reviewedAt).toLocaleString()}
                    </p>
                  </div>
                  {prediction.doctorReview.notes && (
                    <div>
                      <p className="text-gray-400 mb-1 font-semibold">Doctor Clinical Remarks</p>
                      <p className="text-gray-800 bg-gray-50 p-3 rounded-xl leading-relaxed">{prediction.doctorReview.notes}</p>
                    </div>
                  )}
                  {prediction.doctorReview.treatmentPlan && (
                    <div>
                      <p className="text-gray-400 mb-1 font-semibold">Prescribed Management Plan</p>
                      <p className="text-gray-800 bg-cyan-50/50 border border-cyan-100 p-3 rounded-xl leading-relaxed">{prediction.doctorReview.treatmentPlan}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1.5">
                      Clinical Notes & Morphological Observations
                    </label>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none text-xs"
                      placeholder="Enter clinical observations, retinal examination notes..."
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1.5">
                      Recommended Treatment & Follow-Up Protocol
                    </label>
                    <textarea
                      value={treatmentPlan}
                      onChange={(e) => setTreatmentPlan(e.target.value)}
                      rows={3}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none text-xs"
                      placeholder="e.g. Anti-VEGF consult, OCT macula scan, annual re-evaluation..."
                    />
                  </div>
                  <div className="flex space-x-3 pt-2">
                    <button
                      onClick={() => handleReview('reviewed')}
                      disabled={submitting}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
                    >
                      {submitting ? 'Submitting...' : 'Confirm & Save Review'}
                    </button>
                    <button
                      onClick={() => handleReview('rejected')}
                      disabled={submitting}
                      className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/20 disabled:opacity-50 transition-all"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionDetail;