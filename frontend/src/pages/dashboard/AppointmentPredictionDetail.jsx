import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Eye, AlertCircle, FileText, Activity, User, Thermometer
} from 'lucide-react';
import { UPLOAD_URL } from '../../config';
import axios from 'axios';

const AppointmentPredictionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPrediction();
  }, [id]);

  const loadPrediction = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/prediction/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPrediction(res.data.data.prediction);
    } catch (error) {
      console.error('Error loading prediction:', error);
      setError(error.response?.data?.message || 'Failed to load prediction');
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

  const diseaseLabels = {
    normal: 'Normal / Healthy',
    diabetes: 'Diabetic Retinopathy',
    glaucoma: 'Glaucoma',
    cataract: 'Cataract',
    myopia: 'Myopia (Near-sightedness)'
  };

  const diseaseColors = {
    normal: 'text-green-600 bg-green-50',
    diabetes: 'text-red-600 bg-red-50',
    glaucoma: 'text-orange-600 bg-orange-50',
    cataract: 'text-purple-600 bg-purple-50',
    myopia: 'text-blue-600 bg-blue-50'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{error}</h3>
        <button 
          onClick={() => navigate('/doctor/appointments')}
          className="text-blue-600 hover:underline"
        >
          Back to Appointments
        </button>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Prediction not found</h3>
        <button 
          onClick={() => navigate('/doctor/appointments')}
          className="text-blue-600 hover:underline"
        >
          Back to Appointments
        </button>
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
            <h1 className="text-2xl font-bold text-gray-900">Related Prediction</h1>
            <p className="text-sm text-gray-500">
              From appointment | ID: {prediction._id.slice(-8).toUpperCase()}
            </p>
          </div>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(prediction.status)}`}>
          {prediction.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Image & Basic Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Eye Image */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Eye Scan Image
            </h3>
            {prediction.imageUrl ? (
              <img
                src={UPLOAD_URL(prediction.imageUrl)}
                alt="Eye scan"
                className="w-full rounded-lg object-contain max-h-80 bg-gray-50"
              />
            ) : (
              <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <Eye className="h-16 w-16 text-gray-400" />
              </div>
            )}
          </div>

          {/* Grad-CAM Heatmap */}
          {prediction.gradcamImageUrl && (
            <div className="bg-white rounded-xl shadow-md p-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Thermometer className="h-5 w-5 mr-2 text-purple-600" />
                AI Attention Heatmap (Grad-CAM)
              </h3>
              <img
                src={UPLOAD_URL(prediction.gradcamImageUrl)}
                alt="Heatmap"
                className="w-full rounded-lg object-contain max-h-80 bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Highlighted areas show where the AI focused during diagnosis
              </p>
            </div>
          )}

          {/* Patient Info */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Patient Information
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{prediction.userId?.name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{prediction.userId?.email}</p>
              </div>
              {prediction.userId?.phone && (
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{prediction.userId.phone}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Submitted</p>
                <p className="font-medium">
                  {new Date(prediction.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Diagnosis Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Diagnosis Result */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              AI Diagnosis Result
            </h3>
            
            <div className={`p-4 rounded-xl mb-4 ${diseaseColors[prediction.prediction] || 'bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-75">Predicted Condition</p>
                  <p className="text-2xl font-bold capitalize">
                    {diseaseLabels[prediction.prediction] || prediction.prediction}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-75">Confidence</p>
                  <p className="text-2xl font-bold">
                    {Math.round(prediction.confidence * 100)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Binary Classification */}
            {prediction.binaryResult && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Classification Probabilities</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-sm text-green-600">Normal</p>
                    <p className="text-xl font-bold text-green-700">
                      {(prediction.binaryResult.normalProbability * 100).toFixed(1)}%
                    </p>
                    <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${prediction.binaryResult.normalProbability * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="text-sm text-red-600">Disease</p>
                    <p className="text-xl font-bold text-red-700">
                      {(prediction.binaryResult.diseaseProbability * 100).toFixed(1)}%
                    </p>
                    <div className="w-full bg-red-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-red-600 h-2 rounded-full"
                        style={{ width: `${prediction.binaryResult.diseaseProbability * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Disease Classification */}
            {prediction.diseaseResult && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Disease Probabilities</p>
                <div className="space-y-2">
                  {Object.entries(prediction.diseaseResult.probabilities || {}).map(([disease, prob]) => (
                    <div key={disease} className="flex items-center">
                      <span className="w-32 text-sm capitalize text-gray-600">{disease}</span>
                      <div className="flex-1 mx-3">
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div
                            className={`h-4 rounded-full ${
                              disease === prediction.prediction ? 'bg-blue-600' : 'bg-gray-400'
                            }`}
                            style={{ width: `${prob * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="w-16 text-right text-sm font-medium">
                        {(prob * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recommendations */}
          {prediction.recommendations?.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                AI Recommendations
              </h3>
              <div className="space-y-3">
                {prediction.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border-l-4 ${
                      rec.priority === 'high' ? 'border-red-500 bg-red-50' :
                      rec.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                      'border-green-500 bg-green-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">{rec.title}</p>
                      <span className={`text-xs px-2 py-1 rounded ${
                        rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                        rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Doctor Review Section */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Doctor Review
            </h3>
            
            {prediction.doctorReview?.reviewedAt ? (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Reviewed by</p>
                  <p className="font-medium">
                    Dr. {prediction.doctorReview.doctorId?.name || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(prediction.doctorReview.reviewedAt).toLocaleString()}
                  </p>
                </div>
                {prediction.doctorReview.notes && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Doctor Notes</p>
                    <p className="text-gray-700">{prediction.doctorReview.notes}</p>
                  </div>
                )}
                {prediction.doctorReview.confirmedDiagnosis && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Confirmed Diagnosis</p>
                    <p className="font-medium capitalize">
                      {prediction.doctorReview.confirmedDiagnosis}
                    </p>
                  </div>
                )}
                {prediction.doctorReview.treatmentPlan && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Treatment Plan</p>
                    <p className="text-gray-700">{prediction.doctorReview.treatmentPlan}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 rounded-lg text-center">
                <p className="text-yellow-700">
                  This prediction has not been reviewed yet.
                </p>
                <p className="text-sm text-yellow-600 mt-2">
                  You can schedule an appointment or provide your review below.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentPredictionDetail;
