import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UPLOAD_URL } from '../../config';
import {
  Eye, CheckCircle, Clock, Users, FileText, Search,
  AlertCircle, RefreshCw, Calendar, Image
} from 'lucide-react';
import axios from 'axios';

const AdminReviews = () => {
  const navigate = useNavigate();
  const [reviewedPredictions, setReviewedPredictions] = useState([]);
  const [pendingPredictions, setPendingPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('reviewed');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch ALL predictions with reviewRequest for admin
      const res = await axios.get('/api/prediction/all-reviews', { headers });
      const allPredictions = res.data.data?.predictions || [];

      // Separate reviewed vs pending
      const reviewed = allPredictions.filter(p => p.doctorReview);
      const pending = allPredictions.filter(p => !p.doctorReview);

      setReviewedPredictions(reviewed);
      setPendingPredictions(pending);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
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
      case 'normal': return 'text-green-600';
      case 'diabetes': return 'text-red-600';
      case 'glaucoma': return 'text-purple-600';
      case 'cataract': return 'text-blue-600';
      case 'myopia': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredReviewed = reviewedPredictions.filter(p => {
    if (!search) return true;
    return p.prediction?.toLowerCase().includes(search.toLowerCase()) ||
           p.userId?.name?.toLowerCase().includes(search.toLowerCase());
  });

  const filteredPending = pendingPredictions.filter(p => {
    if (!search) return true;
    return p.prediction?.toLowerCase().includes(search.toLowerCase()) ||
           p.userId?.name?.toLowerCase().includes(search.toLowerCase());
  });

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
            <h1 className="text-2xl font-bold text-gray-900">Reviews Management</h1>
            <p className="text-gray-600">View all patient-submitted reviews (predictions sent for expert review)</p>
          </div>
          <button
            onClick={loadReviews}
            className="flex items-center space-x-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <span className="text-3xl font-bold text-gray-900">{reviewedPredictions.length}</span>
          </div>
          <p className="text-sm text-green-700 mt-2">Reviewed Predictions</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <div className="flex items-center justify-between">
            <Clock className="h-8 w-8 text-yellow-600" />
            <span className="text-3xl font-bold text-gray-900">{pendingPredictions.length}</span>
          </div>
          <p className="text-sm text-yellow-700 mt-2">Pending Review</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <Users className="h-8 w-8 text-blue-600" />
            <span className="text-3xl font-bold text-gray-900">
              {new Set([...reviewedPredictions, ...pendingPredictions].map(p => p.userId?._id)).size}
            </span>
          </div>
          <p className="text-sm text-blue-700 mt-2">Total Patients</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('reviewed')}
          className={`px-4 py-2 rounded-lg font-medium flex items-center space-x-2 ${
            filter === 'reviewed'
              ? 'bg-green-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50 border'
          }`}
        >
          <CheckCircle className="h-4 w-4" />
          <span>Reviewed ({reviewedPredictions.length})</span>
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg font-medium flex items-center space-x-2 ${
            filter === 'pending'
              ? 'bg-yellow-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50 border'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Pending ({pendingPredictions.length})</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by prediction or patient name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
        />
      </div>

      {/* Reviewed Predictions List */}
      {filter === 'reviewed' && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {filteredReviewed.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredReviewed.map((pred) => (
                <div key={pred._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      {/* Image */}
                      <div className="relative">
                        {pred.imageUrl ? (
                          <img
                            src={UPLOAD_URL(pred.imageUrl)}
                            alt="Eye scan"
                            className="w-20 h-20 rounded-lg object-cover border-2 border-sky-200 cursor-pointer hover:ring-2 hover:ring-sky-400"
                            onClick={() => navigate(`/admin/prediction/${pred._id}`)}
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
                            <Image className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`text-lg font-bold capitalize ${getPredictionColor(pred.prediction)}`}>
                            {pred.prediction}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(pred.status)}`}>
                            {pred.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Patient:</span> {pred.userId?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500">{pred.userId?.email}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>{formatDate(pred.createdAt)}</span>
                          <span className="font-medium">Confidence: {Math.round(pred.confidence * 100)}%</span>
                          {pred.binaryResult && (
                            <span className="text-green-600">
                              Normal: {(pred.binaryResult.normalProbability * 100).toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2">
                      {pred.doctorReview && (
                        <div className="text-right bg-green-50 px-3 py-2 rounded-lg">
                          <p className="text-xs text-gray-500">Reviewed by</p>
                          <p className="text-sm font-medium text-green-700">
                            Dr. {pred.doctorReview.doctorId?.name || 'Unknown'}
                          </p>
                        </div>
                      )}
                      <Link
                        to={`/admin/prediction/${pred._id}`}
                        className="px-4 py-2 bg-sky-100 text-sky-700 rounded-lg hover:bg-sky-200 text-sm font-medium flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviewed predictions</h3>
              <p className="text-gray-500">Reviewed predictions will appear here.</p>
            </div>
          )}
        </div>
      )}

      {/* Pending Predictions List */}
      {filter === 'pending' && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {filteredPending.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredPending.map((pred) => (
                <div key={pred._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      {/* Image */}
                      <div className="relative">
                        {pred.imageUrl ? (
                          <img
                            src={UPLOAD_URL(pred.imageUrl)}
                            alt="Eye scan"
                            className="w-20 h-20 rounded-lg object-cover border-2 border-yellow-200 cursor-pointer hover:ring-2 hover:ring-yellow-400"
                            onClick={() => navigate(`/admin/prediction/${pred._id}`)}
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
                            <Image className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`text-lg font-bold capitalize ${getPredictionColor(pred.prediction)}`}>
                            {pred.prediction}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(pred.status)}`}>
                            {pred.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Patient:</span> {pred.userId?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500">{pred.userId?.email}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>{formatDate(pred.createdAt)}</span>
                          <span className="font-medium">Confidence: {Math.round(pred.confiction * 100)}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <Link
                      to={`/admin/prediction/${pred._id}`}
                      className="px-4 py-2 bg-sky-100 text-sky-700 rounded-lg hover:bg-sky-200 text-sm font-medium flex items-center"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending predictions</h3>
              <p className="text-gray-500">All predictions have been reviewed!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminReviews;