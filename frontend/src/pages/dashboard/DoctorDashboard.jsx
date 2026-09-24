import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UPLOAD_URL } from '../../config';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard, Clock, CheckCircle, Calendar, Users,
  FileText, Eye, ArrowRight, RefreshCw
} from 'lucide-react';
import axios from 'axios';

// Axios configured for proxy

const DoctorDashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    pendingReviews: 0,
    completedReviews: 0,
    totalPatients: 0,
    upcomingAppointments: 0
  });
  const [recentPredictions, setRecentPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [myReviewsRes, patientsRes, aptStatsRes] = await Promise.all([
        axios.get('/api/prediction/my-reviews', { headers }),
        axios.get('/api/prediction/my-patients', { headers }),
        axios.get('/api/appointments/stats', { headers })
      ]);

      const allReviews = myReviewsRes.data.data?.predictions || [];
      const pendingReviews = allReviews.filter(p => !p.doctorReview);
      const completedReviews = allReviews.filter(p => p.doctorReview);

      setRecentPredictions(pendingReviews.slice(0, 5));
      setStats({
        pendingReviews: pendingReviews.length,
        completedReviews: completedReviews.length,
        totalPatients: patientsRes.data.data?.patients?.length || 0,
        upcomingAppointments: aptStatsRes.data.data?.pending || 0
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Doctor Dashboard</h1>
        <p className="text-blue-100">
          Welcome, Dr. {user?.name}. You have {stats.pendingReviews} pending reviews.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <div className="flex items-center justify-between">
            <Clock className="h-8 w-8 text-yellow-600" />
            <span className="text-3xl font-bold text-gray-900">{stats.pendingReviews}</span>
          </div>
          <p className="text-sm text-yellow-700 mt-2">Pending Reviews</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <span className="text-3xl font-bold text-gray-900">{stats.completedReviews}</span>
          </div>
          <p className="text-sm text-green-700 mt-2">Completed Reviews</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <Users className="h-8 w-8 text-blue-600" />
            <span className="text-3xl font-bold text-gray-900">{stats.totalPatients}</span>
          </div>
          <p className="text-sm text-blue-700 mt-2">Total Patients</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <Calendar className="h-8 w-8 text-purple-600" />
            <span className="text-3xl font-bold text-gray-900">{stats.upcomingAppointments}</span>
          </div>
          <p className="text-sm text-purple-700 mt-2">Pending Appointments</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link
          to="/doctor/reviews"
          className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow border-l-4 border-yellow-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">Reviews</p>
              <p className="text-sm text-gray-500">{stats.pendingReviews} pending</p>
            </div>
            <FileText className="h-6 w-6 text-yellow-500" />
          </div>
        </Link>
        <Link
          to="/doctor/appointments"
          className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow border-l-4 border-blue-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">Appointments</p>
              <p className="text-sm text-gray-500">{stats.upcomingAppointments} requests</p>
            </div>
            <Calendar className="h-6 w-6 text-blue-500" />
          </div>
        </Link>
        <Link
          to="/doctor/patients"
          className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow border-l-4 border-green-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">Patients</p>
              <p className="text-sm text-gray-500">{stats.totalPatients} total</p>
            </div>
            <Users className="h-6 w-6 text-green-500" />
          </div>
        </Link>
        <button
          onClick={loadDashboardData}
          className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow border-l-4 border-gray-500 flex items-center justify-between"
        >
          <div>
            <p className="font-semibold text-gray-900">Refresh</p>
            <p className="text-sm text-gray-500">Update data</p>
          </div>
          <RefreshCw className="h-6 w-6 text-gray-500" />
        </button>
      </div>

      {/* Recent Pending Reviews */}
      <div className="bg-white rounded-xl shadow-md">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Pending Reviews</h2>
          <Link to="/doctor/reviews" className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 text-sm">
            <span>View All</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {recentPredictions.length > 0 ? (
          <div className="divide-y">
            {recentPredictions.map((pred) => (
              <div key={pred._id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  {pred.imageUrl ? (
                    <img
                      src={UPLOAD_URL(pred.imageUrl)}
                      alt="Eye"
                      className="w-12 h-12 rounded object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                      <Eye className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium capitalize">{pred.prediction}</p>
                    <p className="text-sm text-gray-500">{pred.userId?.name || 'Unknown'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-500">
                    {Math.round(pred.confidence * 100)}% confidence
                  </span>
                  <Link
                    to={`/doctor/prediction/${pred._id}`}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                  >
                    Review
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-2" />
            <p className="text-gray-500">No pending reviews!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;