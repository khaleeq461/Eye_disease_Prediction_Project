import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, User, Mail, Phone, Calendar,
  FileText, RefreshCw, Search, ChevronRight
} from 'lucide-react';
import axios from 'axios';

const DoctorPatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/prediction/my-patients', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPatients(res.data.data?.patients || []);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      patient.name?.toLowerCase().includes(searchLower) ||
      patient.email?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-md">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Patients</h1>
            <p className="text-gray-500">Patients who have had appointments or sent predictions to you</p>
          </div>
          <button
            onClick={loadPatients}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search patients by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      {/* Stats */}
      <div className="bg-white rounded-xl p-4 shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Total Patients</span>
          <span className="text-2xl font-bold text-gray-900">{patients.length}</span>
        </div>
      </div>

      {/* Patients Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredPatients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => (
            <div key={patient._id} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-semibold text-xl">
                    {patient.name?.charAt(0)?.toUpperCase() || 'P'}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{patient.name}</h3>
                  <p className="text-sm text-gray-500 truncate">{patient.email}</p>
                  
                  {patient.phone && (
                    <p className="text-sm text-gray-400 mt-1 flex items-center space-x-1">
                      <Phone className="h-3 w-3" />
                      <span>{patient.phone}</span>
                    </p>
                  )}
                  
                  {patient.lastInteraction && (
                    <p className="text-xs text-gray-400 mt-2">
                      Last interaction: {new Date(patient.lastInteraction).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-12 shadow-md text-center">
          <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No patients found</h3>
          <p className="text-gray-500">
            {search ? 'Try a different search term' : 'Patients who book appointments with you will appear here'}
          </p>
        </div>
      )}
    </div>
  );
};

export default DoctorPatients;