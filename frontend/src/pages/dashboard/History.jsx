import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UPLOAD_URL } from '../../config';
import { usePredictionStore } from '../../store/predictionStore';
import { Eye, Calendar, Trash2, ChevronLeft, ChevronRight, AlertCircle, Search, Image as ImageIcon } from 'lucide-react';

const History = () => {
  const { predictions, isLoading, getHistory, deletePrediction } = usePredictionStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('all');
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    loadHistory();
  }, [currentPage, filter]);

  const loadHistory = async () => {
    await getHistory(currentPage, 20);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this prediction?')) {
      const result = await deletePrediction(id);
      if (result.success) {
        loadHistory();
      }
    }
  };

  const handleImageError = (predId) => {
    setImageErrors(prev => ({ ...prev, [predId]: true }));
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
      case 'normal': return 'text-green-600';
      case 'diabetes': return 'text-red-600';
      case 'glaucoma': return 'text-purple-600';
      case 'cataract': return 'text-blue-600';
      case 'myopia': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getPredictionIcon = (prediction) => {
    if (prediction === 'normal') {
      return (
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
          <Eye className="h-6 w-6 text-green-600" />
        </div>
      );
    }
    return (
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
        <AlertCircle className="h-6 w-6 text-red-600" />
      </div>
    );
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

  // Filter predictions
  const filteredPredictions = predictions.filter(pred => {
    if (filter === 'all') return true;
    if (filter === 'disease') return !pred.isNormal;
    if (filter === 'normal') return pred.isNormal;
    if (filter === 'reviewed') return pred.status === 'reviewed' || pred.status === 'confirmed';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-md flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prediction History</h1>
          <p className="text-gray-600">View all your diagnoses and doctor reviews</p>
        </div>
        <Link
          to="/diagnose"
          className="px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
        >
          New Diagnosis
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All' },
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

      {/* History List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : filteredPredictions.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredPredictions.map((pred) => (
              <div key={pred._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  {/* Left side - Image and Info */}
                  <div className="flex items-center space-x-4">
                    {pred.imageUrl && !imageErrors[pred._id] ? (
                      <img
                        src={UPLOAD_URL(pred.imageUrl)}
                        alt="Eye scan"
                        className="w-16 h-16 rounded-lg object-cover border"
                        onError={() => handleImageError(pred._id)}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center border">
                        {pred.prediction === 'normal' ? (
                          <Eye className="h-6 w-6 text-green-600" />
                        ) : (
                          <AlertCircle className="h-6 w-6 text-red-600" />
                        )}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center space-x-3">
                        <span className={`text-xl font-bold capitalize ${getPredictionColor(pred.prediction)}`}>
                          {pred.prediction === 'normal' ? 'Healthy' : pred.prediction}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(pred.status)}`}>
                          {pred.status}
                        </span>
                        {pred.reviewRequest?.sentToDoctorId && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                            Sent for Review
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDate(pred.createdAt)}
                      </p>
                      <div className="flex items-center mt-2 space-x-4 text-sm">
                        <span className="text-gray-600">
                          Confidence: <span className="font-medium">{Math.round((pred.confidence || 0) * 100)}%</span>
                        </span>
                        {pred.isNormal !== undefined && (
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            pred.isNormal ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {pred.isNormal ? 'Normal' : 'Disease'}
                          </span>
                        )}
                        {pred.doctorReview?.reviewedAt && (
                          <span className="flex items-center text-green-600">
                            ✓ Doctor Reviewed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Right side - Actions */}
                  <div className="flex items-center space-x-3">
                    {pred.diseaseResult && (
                      <div className="text-right mr-4">
                        <p className="text-xs text-gray-500">Disease Probabilities</p>
                        <div className="flex space-x-1 mt-1">
                          {Object.entries(pred.diseaseResult.probabilities || {}).map(([disease, prob]) => (
                            <span key={disease} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                              {disease}: {Math.round(prob * 100)}%
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <Link
                      to={`/history/${pred._id}`}
                      className="px-4 py-2 bg-sky-100 text-sky-700 rounded-lg hover:bg-sky-200 text-sm font-medium flex items-center"
                    >
                      View Details
                    </Link>
                    
                    <button
                      onClick={() => handleDelete(pred._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      title="Delete prediction"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Eye className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No predictions found</h3>
            <p className="text-gray-500 mb-4">
              {filter !== 'all' ? `No ${filter} predictions found.` : 'Start your first eye disease screening'}
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

      {/* Pagination */}
      {filteredPredictions.length > 0 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="px-4 py-2 bg-white rounded-lg shadow">
            Page {currentPage}
          </span>
          <button
            onClick={() => setCurrentPage(p => p + 1)}
            className="p-2 border rounded-lg hover:bg-gray-50"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default History;