import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Plus, X, User, FileText, AlertCircle, Eye, Image } from 'lucide-react';
import { useAppointmentStore } from '../../store/appointmentStore';
import { UPLOAD_URL } from '../../config';
import toast from 'react-hot-toast';
import axios from 'axios';

const Appointments = () => {
  const { appointments, isLoading, getAppointments } = useAppointmentStore();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    getAppointments();
  }, []);

  const handleImageError = (aptId) => {
    setImageErrors(prev => ({ ...prev, [aptId]: true }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-gray-100 text-gray-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'no-show': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'consultation': return <FileText className="h-5 w-5" />;
      case 'follow-up': return <Calendar className="h-5 w-5" />;
      case 'review': return <FileText className="h-5 w-5" />;
      case 'emergency': return <AlertCircle className="h-5 w-5" />;
      default: return <Calendar className="h-5 w-5" />;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get prediction image from appointment
  const getPredictionImageUrl = (apt) => {
    if (imageErrors[apt._id]) return null;
    
    // Try to get from populated predictionId
    if (apt.predictionId) {
      if (typeof apt.predictionId === 'object' && apt.predictionId.imageUrl) {
        return UPLOAD_URL(apt.predictionId.imageUrl);
      }
      // If it's just a string ID, we'll try to fetch
      if (typeof apt.predictionId === 'string') {
        return `/api/prediction/${apt.predictionId}/image`;
      }
    }
    return null;
  };

  // Filter appointments
  const filteredAppointments = appointments.filter(apt => {
    if (filter === 'all') return true;
    if (filter === 'pending') return apt.status === 'pending';
    if (filter === 'scheduled') return apt.status === 'scheduled' || apt.status === 'confirmed';
    if (filter === 'completed') return apt.status === 'completed' || apt.status === 'cancelled';
    return true;
  });

  // Stats
  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    scheduled: appointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed' || a.status === 'cancelled').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
            <p className="text-gray-600">View and manage your appointments with doctors</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-md">
          <div className="flex items-center justify-between">
            <FileText className="h-6 w-6 text-gray-600" />
            <span className="text-2xl font-bold">{stats.total}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Total</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 shadow-md border border-yellow-200">
          <div className="flex items-center justify-between">
            <Clock className="h-6 w-6 text-yellow-600" />
            <span className="text-2xl font-bold">{stats.pending}</span>
          </div>
          <p className="text-xs text-yellow-700 mt-1">Pending</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 shadow-md border border-blue-200">
          <div className="flex items-center justify-between">
            <Calendar className="h-6 w-6 text-blue-600" />
            <span className="text-2xl font-bold">{stats.scheduled}</span>
          </div>
          <p className="text-xs text-blue-700 mt-1">Scheduled</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 shadow-md border border-green-200">
          <div className="flex items-center justify-between">
            <Eye className="h-6 w-6 text-green-600" />
            <span className="text-2xl font-bold">{stats.completed}</span>
          </div>
          <p className="text-xs text-green-700 mt-1">Completed</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'pending', label: 'Pending' },
          { key: 'scheduled', label: 'Scheduled' },
          { key: 'completed', label: 'Completed' }
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

      {/* Appointments List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
          </div>
        ) : filteredAppointments.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredAppointments.map((apt) => {
              const predictionImage = getPredictionImageUrl(apt);
              
              return (
                <div key={apt._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-4">
                      {/* Prediction Image */}
                      {predictionImage && !imageErrors[apt._id] ? (
                        <img
                          src={predictionImage}
                          alt="Eye scan"
                          className="w-16 h-16 rounded-lg object-cover border-2 border-sky-200"
                          onError={() => handleImageError(apt._id)}
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
                          <Image className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-gray-900">
                            {apt.type === 'follow-up' ? 'Follow-up Visit' : 
                             apt.type === 'review' ? 'Results Review' :
                             apt.type === 'emergency' ? 'Emergency Consultation' :
                             'General Consultation'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(apt.status)}`}>
                            {apt.status}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                            {formatDate(apt.date)}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1 text-gray-400" />
                            {apt.time}
                          </span>
                          <span className="flex items-center">
                            <User className="h-4 w-4 mr-1 text-gray-400" />
                            Dr. {apt.doctorId?.name || 'Doctor'}
                          </span>
                        </div>
                        
                        {apt.reason && (
                          <p className="text-sm text-gray-500 mt-2 italic">
                            "{apt.reason}"
                          </p>
                        )}
                        
                        {/* Show prediction info if available */}
                        {apt.predictionId && typeof apt.predictionId === 'object' && (
                          <div className="flex items-center mt-2 space-x-2">
                            <span className="text-xs text-gray-500">Diagnosis:</span>
                            <span className={`text-xs px-2 py-0.5 rounded capitalize ${
                              apt.predictionId.prediction === 'normal' 
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {apt.predictionId.prediction}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({Math.round(apt.predictionId.confidence * 100)}% confidence)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Link
                        to={`/appointments/${apt._id}`}
                        className="px-4 py-2 bg-sky-100 text-sky-700 rounded-lg hover:bg-sky-200 text-sm font-medium flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No appointments found</h3>
            <p className="text-gray-500 mb-4">
              {filter !== 'all' ? `No ${filter} appointments.` : 'Book your first appointment after a diagnosis.'}
            </p>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">About Appointments</h4>
            <p className="text-sm text-blue-700 mt-1">
              After your AI diagnosis, you can book an appointment with a doctor. 
              The doctor will review your prediction and confirm the appointment. 
              You can also send your prediction for expert review.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Appointments;