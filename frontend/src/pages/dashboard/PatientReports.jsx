import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UPLOAD_URL } from '../../config';
import {
  FileText, Eye, Download, Calendar, AlertCircle,
  CheckCircle, RefreshCw, Image as ImageIcon, Thermometer
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const PatientReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/prediction/reports', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(res.data.data?.reports || []);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (predictionId) => {
    setGeneratingReport(predictionId);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`/api/prediction/${predictionId}/generate-report`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'success' && res.data.data.reportUrl) {
        toast.success('Report generated successfully!');
        window.open(res.data.data.reportUrl, '_blank');
        loadReports(); // Refresh to get updated report URL
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate report');
    } finally {
      setGeneratingReport(null);
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Reports</h1>
            <p className="text-gray-600">View and download your diagnosis reports</p>
          </div>
          <button
            onClick={loadReports}
            className="flex items-center space-x-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Reports List */}
      {reports.length > 0 ? (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report._id} className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Image */}
                <div className="flex-shrink-0">
                  {report.imageUrl ? (
                    <img
                      src={UPLOAD_URL(report.imageUrl)}
                      alt="Eye scan"
                      className="w-24 h-24 rounded-lg object-cover border"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Eye className="h-10 w-10 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Report Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold capitalize ${getPredictionColor(report.prediction)}`}>
                      {report.prediction === 'normal' ? 'Healthy' : report.prediction}
                    </span>
                    <span className="text-sm text-gray-500">
                      Confidence: {Math.round((report.confidence || 0) * 100)}%
                    </span>
                    {report.doctorReview && (
                      <span className="flex items-center text-green-600 text-sm">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Doctor Reviewed
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(report.createdAt)}
                    </span>
                    {report.gradcamImageUrl && (
                      <span className="flex items-center text-purple-600">
                        <Thermometer className="h-4 w-4 mr-1" />
                        Heatmap Available
                      </span>
                    )}
                  </div>

                  {/* Disease Probabilities */}
                  {report.diseaseResult?.probabilities && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {Object.entries(report.diseaseResult.probabilities).map(([disease, prob]) => (
                        <span key={disease} className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {disease}: {Math.round(prob * 100)}%
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Doctor Review Info */}
                  {report.doctorReview && (
                    <div className="bg-green-50 p-3 rounded-lg text-sm">
                      <p className="font-medium text-green-700">
                        Reviewed by: Dr. {report.doctorReview.doctorId?.name || 'Unknown'}
                      </p>
                      {report.doctorReview.notes && (
                        <p className="text-green-600 mt-1">{report.doctorReview.notes}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleGenerateReport(report._id)}
                    disabled={generatingReport === report._id}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {generatingReport === report._id ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4" />
                        <span>View Report</span>
                      </>
                    )}
                  </button>
                  <Link
                    to={`/history/${report._id}`}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-sky-100 text-sky-700 rounded-lg hover:bg-sky-200"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Details</span>
                  </Link>
                </div>
              </div>

              {/* Heatmap Preview if available */}
              {report.gradcamImageUrl && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Thermometer className="h-4 w-4 mr-1 text-purple-600" />
                    AI Attention Heatmap (Grad-CAM)
                  </p>
                  <img
                    src={UPLOAD_URL(report.gradcamImageUrl)}
                    alt="Heatmap"
                    className="max-w-md rounded-lg border"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-12 shadow-md text-center">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Reports Yet</h3>
          <p className="text-gray-500 mb-4">
            Start your first eye disease diagnosis to generate reports.
          </p>
          <Link
            to="/diagnose"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
          >
            <span>Start Diagnosis</span>
          </Link>
        </div>
      )}
    </div>
  );
};

export default PatientReports;
