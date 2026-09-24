import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Clock, User, Phone, Mail, MapPin,
  CheckCircle, XCircle, AlertCircle, FileText, Video, Eye
} from 'lucide-react';
import axios from 'axios';

const AppointmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    date: '',
    time: '09:00',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAppointment();
  }, [id]);

  // Helper to get prediction ID from appointment
  const getPredictionId = () => {
    if (!appointment?.predictionId) return null;
    if (typeof appointment.predictionId === 'object') {
      return appointment.predictionId._id;
    }
    return appointment.predictionId;
  };

  const loadAppointment = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/appointments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointment(res.data.data.appointment);
    } catch (error) {
      console.error('Error loading appointment:', error);
      alert('Failed to load appointment details');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!formData.date || !formData.time) {
      alert('Please select date and time');
      return;
    }
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      await axios.put(`/api/appointments/${id}/confirm`,
        {
          date: formData.date,
          time: formData.time,
          notes: formData.notes
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Appointment confirmed and scheduled');
      navigate('/doctor/appointments');
    } catch (error) {
      console.error('Error confirming appointment:', error);
      alert('Failed to confirm appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      await axios.put(`/api/appointments/${id}`,
        { status: 'cancelled' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Appointment cancelled');
      navigate('/doctor/appointments');
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert('Failed to cancel appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-gray-100 text-gray-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Appointment not found</h3>
        <Link to="/doctor/appointments" className="text-blue-600 hover:underline">Back to Appointments</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/doctor/appointments')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Appointment Details</h1>
            <p className="text-sm text-gray-500">
              ID: {appointment._id.slice(-8).toUpperCase()}
            </p>
          </div>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
          {appointment.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Patient Information
            </h3>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-lg">
                  {appointment.patientId?.name?.charAt(0)?.toUpperCase() || 'P'}
                </span>
              </div>
              <div>
                <p className="font-semibold">{appointment.patientId?.name || 'Unknown'}</p>
                <p className="text-sm text-gray-500">{appointment.patientId?.email}</p>
              </div>
            </div>
            <div className="space-y-3">
              {appointment.patientId?.phone && (
                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{appointment.patientId.phone}</span>
                </div>
              )}
              {appointment.patientId?.address && (
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>
                    {typeof appointment.patientId.address === 'object'
                      ? `${appointment.patientId.address.street || ''}, ${appointment.patientId.address.city || ''}, ${appointment.patientId.address.country || ''}`.replace(/, $/, '')
                      : appointment.patientId.address}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Related Prediction */}
          {appointment && appointment.predictionId && (
            <Link
              to={`/doctor/appointment-prediction/${getPredictionId()}`}
              className="block bg-white rounded-xl shadow-md p-6 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Related Prediction
              </h3>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="font-medium capitalize text-lg">
                  {typeof appointment.predictionId === 'object' 
                    ? appointment.predictionId.prediction 
                    : 'Prediction'}
                </p>
                {typeof appointment.predictionId === 'object' && appointment.predictionId.confidence && (
                  <p className="text-sm text-gray-500">
                    Confidence: {Math.round(appointment.predictionId.confidence * 100)}%
                  </p>
                )}
              </div>
              <p className="text-sm text-blue-600 mt-3 flex items-center">
                View full prediction details
                <ArrowLeft className="h-4 w-4 ml-1 rotate-180" />
              </p>
            </Link>
          )}
        </div>

        {/* Appointment Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Appointment Request
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Type</p>
                <p className="font-medium capitalize">{appointment.type}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-medium">{appointment.duration || 30} minutes</p>
              </div>
            </div>

            {appointment.reason && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Patient's Reason</p>
                <p className="p-3 bg-yellow-50 rounded-lg text-gray-700 italic">
                  "{appointment.reason}"
                </p>
              </div>
            )}

            {appointment.notes && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Additional Notes</p>
                <p className="p-3 bg-gray-50 rounded-lg text-gray-700">
                  {appointment.notes}
                </p>
              </div>
            )}

            <p className="text-sm text-gray-500">
              Requested: {new Date(appointment.createdAt).toLocaleString()}
            </p>
          </div>

          {/* Confirm/Reject Actions */}
          {appointment.status === 'pending' && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Schedule Appointment</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Time
                  </label>
                  <select
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="09:00">09:00 AM</option>
                    <option value="09:30">09:30 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="10:30">10:30 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="11:30">11:30 AM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="14:30">02:30 PM</option>
                    <option value="15:00">03:00 PM</option>
                    <option value="15:30">03:30 PM</option>
                    <option value="16:00">04:00 PM</option>
                    <option value="16:30">04:30 PM</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Add any notes for the patient..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  {submitting ? 'Confirming...' : 'Confirm & Schedule'}
                </button>
                <button
                  onClick={handleReject}
                  disabled={submitting}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
                >
                  <XCircle className="h-5 w-5 mr-2" />
                  Reject
                </button>
              </div>
            </div>
          )}

          {appointment.status === 'scheduled' && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Scheduled Appointment</h3>
                  <p className="text-lg mt-1">
                    {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                  </p>
                </div>
                <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full">
                  Scheduled
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetail;