import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { usePredictionStore } from '../../store/predictionStore';
import {
  ScanSearch, History, Calendar, TrendingUp,
  Eye, Clock, AlertCircle, CheckCircle, Activity
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuthStore();
  const { getStats } = usePredictionStore();
  const [stats, setStats] = useState({
    total: 0,
    thisWeek: 0,
    pending: 0,
    completed: 0,
    recentPredictions: []
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const data = await getStats();
    if (data) {
      // Calculate stats from backend data
      const total = data.total || 0;
      const recentPredictions = data.recentPredictions || [];
      
      // Calculate this week's predictions
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const thisWeek = recentPredictions.filter(p => 
        new Date(p.createdAt) >= oneWeekAgo
      ).length;

      setStats({
        total,
        thisWeek,
        pending: recentPredictions.filter(p => p.status === 'pending').length,
        completed: recentPredictions.filter(p => p.status === 'reviewed' || p.status === 'confirmed').length,
        recentPredictions
      });
    }
  };

  const quickActions = [
    { path: '/diagnose', label: 'New Diagnosis', icon: ScanSearch, color: 'bg-primary-500' },
    { path: '/history', label: 'View History', icon: History, color: 'bg-secondary-500' },
    { path: '/appointments', label: 'Appointments', icon: Calendar, color: 'bg-success-500' },
  ];

  const statCards = [
    { label: 'Total Scans', value: stats.total, icon: Eye, color: 'text-primary-600', bg: 'bg-primary-100' },
    { label: 'This Week', value: stats.thisWeek, icon: TrendingUp, color: 'text-secondary-600', bg: 'bg-secondary-100' },
    { label: 'Pending Review', value: stats.pending, icon: Clock, color: 'text-warning-600', bg: 'bg-warning-100' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-success-600', bg: 'bg-success-100' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.name?.split(' ')[0]}!</h1>
        <p className="text-primary-100">
          Here's an overview of your eye health status and recent activity.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bg} p-3 rounded-lg`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <span className="text-3xl font-bold text-gray-900">{stat.value}</span>
            </div>
            <p className="text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.path}
              className={`${action.color} text-white rounded-xl p-6 flex items-center space-x-4 hover:opacity-90 transition-opacity`}
            >
              <action.icon className="h-10 w-10" />
              <span className="text-lg font-semibold">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity & Recommendations */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Predictions */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Predictions</h2>
            <Link to="/history" className="text-primary-600 hover:underline text-sm">
              View All
            </Link>
          </div>
          {stats.recentPredictions?.length > 0 ? (
            <div className="space-y-4">
              {stats.recentPredictions.slice(0, 5).map((pred, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      pred.prediction === 'normal' ? 'bg-green-500' : 
                      pred.prediction === 'unknown' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <span className="font-medium text-gray-900 capitalize">{pred.prediction || 'Pending'}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {Math.round((pred.confidence || 0) * 100)}% confidence
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Eye className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No predictions yet</p>
              <Link to="/diagnose" className="text-primary-600 hover:underline mt-2 inline-block">
                Start your first scan
              </Link>
            </div>
          )}
        </div>

        {/* Health Tips */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Eye Health Tips</h2>
          <div className="space-y-4">
            {[
              { icon: Clock, text: 'Take a 20-second break every 20 minutes when looking at screens' },
              { icon: AlertCircle, text: 'Schedule annual eye exams for early detection of issues' },
              { icon: CheckCircle, text: 'Wear UV-protective sunglasses outdoors' },
              { icon: Activity, text: 'Maintain a diet rich in leafy greens and omega-3 fatty acids' }
            ].map((tip, index) => (
              <div key={index} className="flex items-start space-x-3">
                <tip.icon className="h-5 w-5 text-primary-600 mt-0.5" />
                <p className="text-gray-600">{tip.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Understanding Stats */}
      <div className="bg-white rounded-xl p-6 shadow-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Understanding Your Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start space-x-3">
            <div className="bg-primary-100 p-2 rounded-lg">
              <TrendingUp className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">This Week</h3>
              <p className="text-sm text-gray-600">
                Number of eye scans you performed in the past 7 days
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="bg-warning-100 p-2 rounded-lg">
              <Clock className="h-5 w-5 text-warning-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Pending Review</h3>
              <p className="text-sm text-gray-600">
                Predictions awaiting doctor verification or confirmation
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="bg-success-100 p-2 rounded-lg">
              <CheckCircle className="h-5 w-5 text-success-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Completed</h3>
              <p className="text-sm text-gray-600">
                Predictions that have been reviewed and confirmed by a doctor
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;