import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Clock, User, MapPin, Phone, Mail,
  CheckCircle, XCircle, AlertCircle, RefreshCw, Filter
} from 'lucide-react';
import axios from 'axios';

// Axios configured for proxy

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({ pending: 0, scheduled: 0, completed: 0 });

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const [aptRes, statsRes] = await Promise.all([
        axios.get('/api/appointments', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/appointments/stats', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      setAppointments(aptRes.data.data?.appointments || []);
      setStats(statsRes.data.data || { pending: 0, scheduled: 0, completed: 0 });
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id) => {
    const date = prompt('Enter appointment date (YYYY-MM-DD):');
    const time = prompt('Enter appointment time (HH:MM):');
    
    if (!date || !time) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/appointments/${id}/confirm`,
        { date, time },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadAppointments();
      alert('Appointment confirmed!');
    } catch (error) {
      alert('Failed to confirm appointment');
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/appointments/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadAppointments();
    } catch (error) {
      alert('Failed to cancel appointment');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'scheduled': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'confirmed': return 'bg-green-100 text-green-700 border-green-200';
      case 'completed': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    if (filter === 'all') return true;
    return apt.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
            <p className="text-gray-500">Manage your patient appointments</p>
          </div>
          <button
            onClick={loadAppointments}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <div className="flex items-center justify-between">
            <Clock className="h-8 w-8 text-yellow-600" />
            <span className="text-3xl font-bold text-gray-900">{stats.pending}</span>
          </div>
          <p className="text-sm text-yellow-700 mt-2">Pending Requests</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <Calendar className="h-8 w-8 text-blue-600" />
            <span className="text-3xl font-bold text-gray-900">{stats.scheduled}</span>
          </div>
          <p className="text-sm text-blue-700 mt-2">Scheduled</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <span className="text-3xl font-bold text-gray-900">{stats.completed}</span>
          </div>
          <p className="text-sm text-green-700 mt-2">Completed</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', 'pending', 'scheduled', 'completed', 'cancelled'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium capitalize ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredAppointments.length > 0 ? (
        <div className="space-y-4">
          {filteredAppointments.map((apt) => (
            <div key={apt._id} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-7 w-7 text-blue-600" />
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-lg font-semibold">{apt.patientId?.name || 'Patient'}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(apt.status)}`}>
                        {apt.status}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center space-x-1">
                        <Mail className="h-4 w-4" />
                        <span>{apt.patientId?.email}</span>
                      </span>
                      {apt.patientId?.phone && (
                        <span className="flex items-center space-x-1">
                          <Phone className="h-4 w-4" />
                          <span>{apt.patientId.phone}</span>
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-2 flex items-center space-x-4">
                      <span className="flex items-center space-x-1 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{new Date(apt.date).toLocaleDateString()}</span>
                      </span>
                      <span className="flex items-center space-x-1 text-sm">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{apt.time}</span>
                      </span>
                      <span className="text-sm capitalize">
                        Type: {apt.type}
                      </span>
                    </div>

                    {apt.reason && (
                      <p className="mt-2 text-sm text-gray-600 italic">
                        "{apt.reason}"
                      </p>
                    )}

                    {apt.predictionId && (
                      <div className="mt-2 flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Related Prediction:</span>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs capitalize">
                          {apt.predictionId.prediction}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Link
                    to={`/doctor/appointment/${apt._id}`}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>View Details</span>
                  </Link>
                  
                  {apt.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleConfirm(apt._id)}
                        className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Confirm</span>
                      </button>
                      <button
                        onClick={() => handleCancel(apt._id)}
                        className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-12 shadow-md text-center">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No appointments</h3>
          <p className="text-gray-500">No appointments found for the selected filter.</p>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;