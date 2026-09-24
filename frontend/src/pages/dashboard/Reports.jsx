import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FileText, Eye, CheckCircle, Clock, User, Thermometer, RefreshCw, Download } from 'lucide-react';
import { UPLOAD_URL } from '../../config';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/prediction/reports', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(response.data.data.reports || []);
    } catch (error) {
      console.error('Failed to load reports:', error);
    }
    setIsLoading(false);
  };

  const handleGenerateReport = async (predictionId) => {
    setGeneratingId(predictionId);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`/api/prediction/${predictionId}/generate-report`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'success' && res.data.data.reportUrl) {
        toast.success('Clinical PDF Report generated!');
        window.open(res.data.data.reportUrl, '_blank');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate report');
    } finally {
      setGeneratingId(null);
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
      day: 'numeric'
    });
  };

  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true;
    if (filter === 'disease') return !report.isNormal;
    if (filter === 'normal') return report.isNormal;
    if (filter === 'reviewed') return !!report.doctorReview;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Medical Reports</h1>
            <p className="text-gray-600">Review patient predictions and diagnosis reports</p>
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
          <div className="flex items-center justify-between">
            <User className="h-8 w-8 text-red-600" />
            <span className="text-3xl font-bold text-gray-900">
              {reports.filter(r => !r.isNormal).length}
            </span>
          </div>
          <p className="text-sm text-red-700 mt-2">Disease Detected</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <span className="text-3xl font-bold text-gray-900">
              {reports.filter(r => r.isNormal).length}
            </span>
          </div>
          <p className="text-sm text-green-700 mt-2">Normal Results</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <FileText className="h-8 w-8 text-blue-600" />
            <span className="text-3xl font-bold text-gray-900">
              {reports.filter(r => !!r.doctorReview).length}
            </span>
          </div>
          <p className="text-sm text-blue-700 mt-2">Doctor Reviewed</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All Reports' },
          { key: 'disease', label: 'Disease Detected' },
          { key: 'normal', label: 'Normal' },
          { key: 'reviewed', label: 'Reviewed' }
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === f.key
                ? 'bg-sky-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : filteredReports.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredReports.map((report) => (
              <div key={report._id} className="p-6 hover:bg-gray-50">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="flex items-start space-x-4">
                    {/* Image */}
                    {report.imageUrl && (
                      <img
                        src={UPLOAD_URL(report.imageUrl)}
                        alt="Eye scan"
                        className="w-20 h-20 rounded-lg object-cover border"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold capitalize ${getPredictionColor(report.prediction)}`}>
                          {report.prediction}
                        </span>
                        <span className="text-sm text-gray-500">
                          {Math.round((report.confidence || 0) * 100)}% confidence
                        </span>
                        {report.gradcamImageUrl && (
                          <span className="flex items-center text-purple-600 text-sm">
                            <Thermometer className="h-4 w-4 mr-1" />
                            Heatmap
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Patient: <span className="font-medium">{report.userId?.name || 'Unknown'}</span>
                      </p>
                      <p className="text-xs text-gray-500">{report.userId?.email}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>{formatDate(report.createdAt)}</span>
                        {report.doctorReview && (
                          <span className="flex items-center text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Reviewed by Dr. {report.doctorReview.doctorId?.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleGenerateReport(report._id)}
                      disabled={generatingId === report._id}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                    >
                      {generatingId === report._id ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <FileText className="h-3.5 w-3.5" />
                          <span>Clinical PDF</span>
                        </>
                      )}
                    </button>
                    <Link
                      to={`/admin/prediction/${report._id}`}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-sky-100 text-sky-700 rounded-lg hover:bg-sky-200 text-xs font-semibold"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View Details</span>
                    </Link>
                  </div>
                </div>

                {/* Heatmap Preview */}
                {report.gradcamImageUrl && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Thermometer className="h-4 w-4 mr-1 text-purple-600" />
                      AI Attention Heatmap (Grad-CAM)
                    </p>
                    <img
                      src={UPLOAD_URL(report.gradcamImageUrl)}
                      alt="Heatmap"
                      className="max-w-xs rounded-lg border"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No reports found</h3>
            <p className="text-gray-500">Patient predictions will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
