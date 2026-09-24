import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import axios from 'axios';
import { Users, Shield, CheckCircle, XCircle, Clock, Search, RefreshCw } from 'lucide-react';

// Axios configured for proxy

const AdminUsers = () => {
  const { user } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/auth/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data.data?.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDoctor = async (doctorId, approve) => {
    try {
      const token = localStorage.getItem('token');
      if (approve) {
        await axios.put(`/api/auth/doctors/${doctorId}/verify`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.delete(`/api/auth/doctors/${doctorId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      loadUsers();
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

  const filteredUsers = users.filter(u => {
    if (filterRole !== 'all' && u.role !== filterRole) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      return u.name?.toLowerCase().includes(searchLower) ||
             u.email?.toLowerCase().includes(searchLower);
    }
    return true;
  });

  const stats = {
    total: users.length,
    patients: users.filter(u => u.role === 'patient').length,
    doctors: users.filter(u => u.role === 'doctor').length,
    admins: users.filter(u => u.role === 'admin').length,
    pending: users.filter(u => u.role === 'doctor' && !u.isActive).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage all users, doctors, and patients</p>
          </div>
          <button
            onClick={loadUsers}
            className="flex items-center space-x-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-md">
          <div className="flex items-center justify-between">
            <Users className="h-6 w-6 text-gray-600" />
            <span className="text-2xl font-bold">{stats.total}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Total Users</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 shadow-md border border-green-200">
          <div className="flex items-center justify-between">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <span className="text-2xl font-bold">{stats.patients}</span>
          </div>
          <p className="text-xs text-green-700 mt-1">Patients</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 shadow-md border border-blue-200">
          <div className="flex items-center justify-between">
            <Shield className="h-6 w-6 text-blue-600" />
            <span className="text-2xl font-bold">{stats.doctors}</span>
          </div>
          <p className="text-xs text-blue-700 mt-1">Doctors</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 shadow-md border border-red-200">
          <div className="flex items-center justify-between">
            <Shield className="h-6 w-6 text-red-600" />
            <span className="text-2xl font-bold">{stats.admins}</span>
          </div>
          <p className="text-xs text-red-700 mt-1">Admins</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 shadow-md border border-yellow-200">
          <div className="flex items-center justify-between">
            <Clock className="h-6 w-6 text-yellow-600" />
            <span className="text-2xl font-bold">{stats.pending}</span>
          </div>
          <p className="text-xs text-yellow-700 mt-1">Pending</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'patient', 'doctor', 'admin'].map(role => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={`px-4 py-2 rounded-lg font-medium capitalize ${
                filterRole === role
                  ? 'bg-sky-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                          <span className="font-semibold text-gray-600">{u.name?.charAt(0)?.toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{u.name}</p>
                          <p className="text-sm text-gray-500">{u.email}</p>
                          {u.phone && <p className="text-xs text-gray-400">{u.phone}</p>}
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
                        u.isActive 
                          ? 'bg-green-100 text-green-700' 
                          : u.role === 'doctor' && !u.isActive
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                      }`}>
                        {u.isActive ? 'Active' : u.role === 'doctor' && !u.isActive ? 'Pending' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {u.role === 'doctor' && !u.isActive && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleVerifyDoctor(u._id, true)}
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleVerifyDoctor(u._id, false)}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </button>
                        </div>
                      )}
                      {u.role === 'doctor' && u.isActive && (
                        <span className="text-sm text-green-600">Verified ✓</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500">
              {search || filterRole !== 'all' ? 'Try different filters.' : 'Users will appear here when they register.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;