import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { UPLOAD_URL } from '../../config';
import {
  ClipboardList, Eye, Clock, CheckCircle, AlertCircle,
  FileText, Calendar, User, ChevronRight, RefreshCw, X, Thermometer
} from 'lucide-react';
import axios from 'axios';

const DoctorReviews = () => {
  const { user } = useAuthStore();
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch predictions sent to this doctor for review
      const res = await axios.get('/api/prediction/my-reviews', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Store all predictions
      setPredictions(res.data.data?.predictions || []);
    } catch (error) {
      console.error('Error loading predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/prediction/${id}/review`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadPredictions();
    } catch (error) {
      console.error('Error reviewing:', error);
      alert('Failed to update review');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'in-review': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Separate pending and completed reviews
  // API already filters to predictions for this doctor
  const pendingReviews = predictions.filter(pred => !pred.doctorReview);
  
  const completedReviews = predictions.filter(pred => pred.doctorReview);

  const filteredPredictions = filter === 'pending' 
    ? pendingReviews 
    : completedReviews;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Patient Reviews</h1>
            <p className="text-gray-500">Review predictions from your patients</p>
          </div>
          <button
            onClick={loadPredictions}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <div className="flex items-center justify-between">
            <Clock className="h-8 w-8 text-yellow-600" />
            <span className="text-3xl font-bold text-gray-900">{pendingReviews.length}</span>
          </div>
          <p className="text-sm text-yellow-700 mt-2">Pending Reviews</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <span className="text-3xl font-bold text-gray-900">{completedReviews.length}</span>
          </div>
          <p className="text-sm text-green-700 mt-2">Completed Reviews</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-2">
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg font-medium flex items-center space-x-2 ${
            filter === 'pending'
              ? 'bg-yellow-500 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Pending ({pendingReviews.length})</span>
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg font-medium flex items-center space-x-2 ${
            filter === 'completed'
              ? 'bg-green-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <CheckCircle className="h-4 w-4" />
          <span>Completed ({completedReviews.length})</span>
        </button>
      </div>

      {/* Predictions List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredPredictions.length > 0 ? (
        <div className="space-y-4">
          {filteredPredictions.map((pred) => (
            <div key={pred._id} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex items-start space-x-4">
                  {pred.imageUrl ? (
                    <Link
                    to={`/doctor/prediction/${pred._id}`}
                    className="cursor-pointer"
                  >
                    <img
                      src={UPLOAD_URL(pred.imageUrl)}
                      alt="Eye scan"
                      className="w-24 h-24 rounded-lg object-cover border hover:ring-2 hover:ring-blue-500"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </Link>
                  ) : (
                    <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Eye className="h-10 w-10 text-gray-400" />
                    </div>
                  )}
                  
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-lg font-semibold capitalize">{pred.prediction}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(pred.doctorReview ? 'completed' : 'pending')}`}>
                        {pred.doctorReview ? 'Reviewed' : 'Pending'}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <User className="h-4 w-4" />
                      <span>{pred.userId?.name || 'Unknown Patient'}</span>
                    </div>
                    <p className="text-sm text-gray-400">{pred.userId?.email}</p>
                    
                    <div className="mt-2 flex items-center space-x-4">
                      <span className="text-sm">
                        <span className="text-gray-500">Confidence:</span>
                        <span className="font-medium ml-1">{Math.round(pred.confidence * 100)}%</span>
                      </span>
                      <span className="text-sm text-gray-400">
                        {new Date(pred.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {pred.binaryResult && (
                      <div className="mt-2 flex gap-4 text-xs">
                        <span className="text-green-600">
                          Normal: {(pred.binaryResult.normalProbability * 100).toFixed(1)}%
                        </span>
                        <span className="text-red-600">
                          Disease: {(pred.binaryResult.diseaseProbability * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                    
                    {pred.gradcamImageUrl && (
                      <div className="mt-2 flex items-center space-x-2 text-xs text-purple-600">
                        <Thermometer className="h-3 w-3" />
                        <span>Heatmap Available</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Link
                    to={`/doctor/prediction/${pred._id}`}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Details</span>
                  </Link>
                  
                  {!pred.doctorReview && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReview(pred._id, 'reviewed')}
                        className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Confirm</span>
                      </button>
                      <button
                        onClick={() => handleReview(pred._id, 'rejected')}
                        className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                      >
                        <AlertCircle className="h-4 w-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                  
                  {pred.doctorReview && (
                    <div className="text-center text-sm text-green-600 flex items-center justify-center space-x-1">
                      <CheckCircle className="h-4 w-4" />
                      <span>Reviewed on {new Date(pred.doctorReview.reviewedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-12 shadow-md text-center">
          <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {filter === 'pending' ? 'No pending reviews!' : 'No completed reviews yet'}
          </h3>
          <p className="text-gray-500">
            {filter === 'pending' 
              ? 'All caught up! No pending reviews at the moment.' 
              : 'Completed reviews will appear here.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default DoctorReviews;