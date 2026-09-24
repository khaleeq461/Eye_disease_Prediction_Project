import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Clock, User, Phone, Mail,
  CheckCircle, AlertCircle, Eye, Image, FileText
} from 'lucide-react';
import { UPLOAD_URL } from '../../config';
import axios from 'axios';

const PatientAppointmentDetail = () => {
  const { id } = useParams();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointment();
  }, [id]);

  const loadAppointment = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/appointments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointment(res.data.data.appointment);
    } catch (error) {
      console.error('Error loading appointment:', error);
    } finally {
      setLoading(false);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Appointment not found</h3>
        <Link to="/appointments" className="text-sky-600 hover:underline">Back to Appointments</Link>
      </div>
    );
  }

  // Get prediction image URL
  const getPredictionImageUrl = () => {
    if (!appointment.predictionId) return null;
    if (typeof appointment.predictionId === 'string') return null;
    if (appointment.predictionId.imageUrl) {
      return UPLOAD_URL(appointment.predictionId.imageUrl);
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/appointments"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Appointment Details</h1>
            <p className="text-sm text-gray-500">ID: {appointment._id.slice(-8).toUpperCase()}</p>
          </div>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
          {appointment.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Doctor Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Doctor
            </h3>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-14 h-14 bg-sky-100 rounded-full flex items-center justify-center">
                <span className="text-sky-600 font-semibold text-xl">
                  {appointment.doctorId?.name?.charAt(0)?.toUpperCase() || 'D'}
                </span>
              </div>
              <div>
                <p className="font-semibold text-lg">{appointment.doctorId?.name || 'Doctor'}</p>
                <p className="text-sm text-gray-500">{appointment.doctorId?.specialization || 'Eye Specialist'}</p>
              </div>
            </div>
            <div className="space-y-2">
              {appointment.doctorId?.email && (
                <div className="flex items-center space-x-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{appointment.doctorId.email}</span>
                </div>
              )}
              {appointment.doctorId?.phone && (
                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{appointment.doctorId.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Related Prediction with Image */}
          {appointment.predictionId && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <Eye className="h-5 w-5 mr-2" />
                  Related Diagnosis
                </h3>
              </div>
              
              {/* Prediction Image */}
              {getPredictionImageUrl() ? (
                <div className="relative">
                  <img
                    src={getPredictionImageUrl()}
                    alt="Eye scan"
                    className="w-full h-48 object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                  <Image className="h-12 w-12 text-gray-400" />
                </div>
              )}
              
              <div className="p-4">
                {typeof appointment.predictionId === 'object' ? (
                  <>
                    <p className="font-semibold capitalize text-lg">
                      {appointment.predictionId.prediction === 'normal' ? 'Healthy Eyes' : appointment.predictionId.prediction}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Confidence: {Math.round(appointment.predictionId.confidence * 100)}%
                    </p>
                    <Link
                      to={`/history/${appointment.predictionId._id}`}
                      className="inline-flex items-center mt-2 text-sky-600 hover:text-sky-800 text-sm font-medium"
                    >
                      View Full Details →
                    </Link>
                  </>
                ) : (
                  <p className="text-gray-500">Prediction details</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Appointment Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Appointment Information
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">{new Date(appointment.date).toLocaleDateString()}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Time</p>
                <p className="font-medium">{appointment.time}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Type</p>
                <p className="font-medium capitalize">{appointment.type || 'Consultation'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-medium">{appointment.duration || 30} minutes</p>
              </div>
            </div>

            {appointment.reason && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Reason</p>
                <p className="p-3 bg-yellow-50 rounded-lg text-gray-700 italic">
                  "{appointment.reason}"
                </p>
              </div>
            )}

            {appointment.notes && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Notes</p>
                <p className="p-3 bg-gray-50 rounded-lg text-gray-700">
                  {appointment.notes}
                </p>
              </div>
            )}

            <p className="text-sm text-gray-500">
              Booked: {new Date(appointment.createdAt).toLocaleString()}
            </p>
          </div>

          {/* Doctor's Notes (after appointment) */}
          {appointment.doctorNotes && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Doctor's Notes
              </h3>
              <div className="space-y-3">
                {appointment.doctorNotes.diagnosis && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">Diagnosis</p>
                    <p className="text-gray-900">{appointment.doctorNotes.diagnosis}</p>
                  </div>
                )}
                {appointment.doctorNotes.treatment && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">Treatment</p>
                    <p className="text-gray-900">{appointment.doctorNotes.treatment}</p>
                  </div>
                )}
                {appointment.doctorNotes.prescription && (
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-600 font-medium">Prescription</p>
                    <p className="text-gray-900">{appointment.doctorNotes.prescription}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status Messages */}
          {appointment.status === 'pending' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                <p className="text-yellow-800">
                  <strong>Waiting for confirmation</strong> - The doctor will confirm your appointment shortly.
                </p>
              </div>
            </div>
          )}

          {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <p className="text-green-800">
                  <strong>Appointment Confirmed!</strong> - Your appointment is scheduled for {new Date(appointment.date).toLocaleDateString()} at {appointment.time}.
                </p>
              </div>
            </div>
          )}

          {appointment.status === 'completed' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                <p className="text-blue-800">
                  <strong>Appointment Completed</strong> - Your appointment has been completed.
                </p>
              </div>
            </div>
          )}

          {appointment.status === 'cancelled' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-red-800">
                  <strong>Appointment Cancelled</strong> - This appointment has been cancelled.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientAppointmentDetail;