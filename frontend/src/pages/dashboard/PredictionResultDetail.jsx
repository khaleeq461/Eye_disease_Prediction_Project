import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, Eye, Calendar, User, CheckCircle, XCircle,
  Clock, Activity, FileText, Phone, Mail, Thermometer, FileText as ReportIcon, Sparkles
} from 'lucide-react';
import { UPLOAD_URL } from '../../config';
import axios from 'axios';
import toast from 'react-hot-toast';
import XAIStudio from '../../components/XAIStudio';
import XAIEtiologyPathway from '../../components/XAIEtiologyPathway';

const PredictionResultDetail = () => {
  const { id } = useParams();
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  useEffect(() => {
    loadPrediction();
  }, [id]);

  const loadPrediction = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/prediction/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPrediction(res.data.data.prediction);
    } catch (error) {
      console.error('Error loading prediction:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`/api/prediction/${id}/generate-report`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'success' && res.data.data.reportUrl) {
        toast.success('Clinical report generated successfully!');
        window.open(res.data.data.reportUrl, '_blank');
        loadPrediction();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate report');
    } finally {
      setIsGeneratingReport(false);
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

  const getPredictionColor = (prediction) => {
    switch (prediction) {
      case 'normal': return 'text-green-600 bg-green-50';
      case 'diabetes': return 'text-red-600 bg-red-50';
      case 'glaucoma': return 'text-purple-600 bg-purple-50';
      case 'cataract': return 'text-blue-600 bg-blue-50';
      case 'myopia': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="text-center py-12">
        <Eye className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Prediction record not found</h3>
        <Link to="/history" className="text-cyan-600 hover:underline">Return to Diagnostic History</Link>
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
          <Link
            to="/history"
            className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Retinal Diagnostic Report
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-mono font-semibold">
                ID: {prediction._id.slice(-8).toUpperCase()}
              </span>
            </h1>
            <p className="text-sm text-gray-500">
              Examined on {new Date(prediction.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleGenerateReport}
            disabled={isGeneratingReport}
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
          >
            {isGeneratingReport ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <ReportIcon className="h-4 w-4" />
                <span>Download Clinical PDF</span>
              </>
            )}
          </button>
          <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(prediction.status)}`}>
            {prediction.status}
          </span>
        </div>
      </div>

      {/* Main Examination Studio */}
      <div className="space-y-6">
        <XAIStudio
          originalImage={rawImageSrc}
          heatmapImage={heatmapSrc}
          diseaseName={prediction.prediction}
          confidence={prediction.confidence}
          focalSummary={`Interactive diagnostic record for case #${prediction._id.slice(-8).toUpperCase()}. Regions with high heat indicate neural features detected by the convolutional feature maps.`}
        />

        {/* Neural Model Attribution & Organ Etiology Pathway */}
        <XAIEtiologyPathway
          prediction={prediction.prediction}
          confidence={prediction.confidence}
          xaiEtiology={prediction.xaiEtiology}
        />

        {/* Clinical Diagnostics and Doctor Review Output */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI Diagnosis Result Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-cyan-600" />
              AI Diagnosis Findings
            </h3>
            
            <div className={`p-4 rounded-xl mb-4 ${getPredictionColor(prediction.prediction)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs opacity-75 font-semibold">Predicted Pathology</p>
                  <p className="text-2xl font-extrabold capitalize">
                    {prediction.prediction === 'normal' ? 'Healthy Eyes' : prediction.prediction}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs opacity-75 font-semibold">Confidence</p>
                  <p className="text-2xl font-extrabold font-mono">
                    {Math.round(prediction.confidence * 100)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Disease Probabilities Distribution */}
            {prediction.diseaseResult?.probabilities && (
              <div className="space-y-2 mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pathology Distribution</p>
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

          {/* Doctor Assessment Box */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-cyan-600" />
              Ophthalmologist Clinical Opinion
            </h3>
            
            {prediction.doctorReview && prediction.doctorReview.reviewedAt ? (
              <div className="space-y-4 text-xs">
                <div className="flex items-center space-x-3 p-3.5 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-cyan-100 text-cyan-800 font-bold rounded-full flex items-center justify-center text-sm">
                    {prediction.doctorReview.doctorId?.name?.charAt(0)?.toUpperCase() || 'D'}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Dr. {prediction.doctorReview.doctorId?.name || 'Specialist'}</p>
                    <p className="text-gray-400 text-[11px]">{prediction.doctorReview.doctorId?.email}</p>
                    <p className="text-gray-400 text-[10px]">
                      Validated on {new Date(prediction.doctorReview.reviewedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {prediction.doctorReview.confirmedDiagnosis && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <p className="text-emerald-700 font-semibold mb-0.5">Doctor Confirmed Diagnosis</p>
                    <p className="font-bold text-emerald-900 capitalize text-sm">{prediction.doctorReview.confirmedDiagnosis}</p>
                  </div>
                )}

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
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-5 text-xs text-amber-900">
                <div className="flex items-center gap-2 mb-2 font-bold text-amber-800">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Second Opinion Status
                </div>
                <p className="leading-relaxed">
                  {prediction.reviewRequest && prediction.reviewRequest.sentToDoctorId
                    ? 'This retinal scan is currently queued for ophthalmologist validation. You will receive an updated assessment once reviewed.'
                    : 'You can request a verified ophthalmologist second-opinion on this scan from the Diagnostic page or Appointments menu.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionResultDetail;