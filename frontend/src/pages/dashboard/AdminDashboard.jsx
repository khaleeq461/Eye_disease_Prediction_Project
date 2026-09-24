import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import axios from 'axios';
import { Users, Shield, CheckCircle, XCircle, Clock, AlertCircle, Eye } from 'lucide-react';

// Configure axios (using relative path for proxy)

const AdminDashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    totalPatients: 0,
    pendingDoctors: 0
  });
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      // Load all users
      const usersRes = await axios.get('/api/auth/users');
      const allUsers = usersRes.data.data?.users || [];
      setUsers(allUsers);
      
      const doctors = allUsers.filter(u => u.role === 'doctor');
      const patients = allUsers.filter(u => u.role === 'patient');
      const pending = doctors.filter(d => !d.isActive);
      
      setStats({
        totalUsers: allUsers.length,
        totalDoctors: doctors.length,
        totalPatients: patients.length,
        pendingDoctors: pending.length
      });
      
      setPendingDoctors(pending);
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  const handleVerifyDoctor = async (doctorId, approve) => {
    try {
      if (approve) {
        await axios.put(`/api/auth/doctors/${doctorId}/verify`);
      } else {
        await axios.delete(`/api/auth/doctors/${doctorId}`);
      }
      loadAdminData();
    } catch (error) {
      console.error('Error verifying doctor:', error);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700';
      case 'doctor': return 'bg-blue-100 text-blue-700';
      case 'patient': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-red-100">
          Welcome, {user?.name}. Manage users, doctors, and system settings.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gray-100 p-3 rounded-lg">
              <Users className="h-6 w-6 text-gray-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.totalUsers}</span>
          </div>
          <p className="text-gray-600">Total Users</p>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.totalDoctors}</span>
          </div>
          <p className="text-gray-600">Total Doctors</p>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.totalPatients}</span>
          </div>
          <p className="text-gray-600">Total Patients</p>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.pendingDoctors}</span>
          </div>
          <p className="text-gray-600">Pending Verifications</p>
        </div>
      </div>

      {/* Pending Doctor Verifications */}
      <div className="bg-white rounded-xl p-6 shadow-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <AlertCircle className="h-6 w-6 text-yellow-600 mr-2" />
          Pending Doctor Verifications
        </h2>
        {pendingDoctors.length > 0 ? (
          <div className="space-y-4">
            {pendingDoctors.map((doctor) => (
              <div key={doctor._id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Shield className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-lg">{doctor.name}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${getRoleBadge(doctor.role)}`}>
                          {doctor.role}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-700">
                          Pending
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{doctor.email}</p>
                      {doctor.phone && (
                        <p className="text-sm text-gray-500">Phone: {doctor.phone}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Registered: {new Date(doctor.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleVerifyDoctor(doctor._id, true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleVerifyDoctor(doctor._id, false)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-400" />
            <p>All doctors verified!</p>
            <p className="text-sm">No pending verifications.</p>
          </div>
        )}
      </div>

      {/* All Users */}
      <div className="bg-white rounded-xl p-6 shadow-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">All Users</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                        <Users className="h-4 w-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{u.name}</p>
                        <p className="text-sm text-gray-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleBadge(u.role)}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;