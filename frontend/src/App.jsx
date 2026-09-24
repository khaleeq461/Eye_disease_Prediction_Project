import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import DoctorLayout from './layouts/DoctorLayout';
import AdminLayout from './layouts/AdminLayout';

// Public Pages
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Contact from './pages/Contact';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Dashboard Pages (Patient)
import Dashboard from './pages/dashboard/Dashboard';
import Diagnose from './pages/dashboard/Diagnose';
import History from './pages/dashboard/History';
import PredictionResultDetail from './pages/dashboard/PredictionResultDetail';
import PatientAppointmentDetail from './pages/dashboard/PatientAppointmentDetail';
import Appointments from './pages/dashboard/Appointments';
import Profile from './pages/dashboard/Profile';
import PatientReports from './pages/dashboard/PatientReports';

// Doctor Pages
import DoctorDashboard from './pages/dashboard/DoctorDashboard';
import DoctorReviews from './pages/dashboard/DoctorReviews';
import DoctorAppointments from './pages/dashboard/DoctorAppointments';
import DoctorPatients from './pages/dashboard/DoctorPatients';
import PredictionDetail from './pages/dashboard/PredictionDetail';
import AppointmentDetail from './pages/dashboard/AppointmentDetail';
import AppointmentPredictionDetail from './pages/dashboard/AppointmentPredictionDetail';

// Admin Pages
import AdminDashboard from './pages/dashboard/AdminDashboard';
import AdminReviews from './pages/dashboard/AdminReviews';
import AdminUsers from './pages/dashboard/AdminUsers';

// Reports
import Reports from './pages/dashboard/Reports';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    switch (user?.role) {
      case 'doctor': return <Navigate to="/doctor" replace />;
      case 'admin': return <Navigate to="/admin" replace />;
      default: return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

// Public Route (redirect to dashboard if logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  const getDefaultDashboard = () => {
    if (isLoading) return '/login';
    if (!isAuthenticated) return '/login';
    switch (user?.role) {
      case 'admin': return '/admin';
      case 'doctor': return '/doctor';
      default: return '/dashboard';
    }
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/contact" element={<Contact />} />
      </Route>

      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={
          <PublicRoute><Login /></PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute><Register /></PublicRoute>
        } />
      </Route>

      {/* Patient Dashboard Routes */}
      <Route element={
        <ProtectedRoute allowedRoles={['patient']}>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/diagnose" element={<Diagnose />} />
        <Route path="/history" element={<History />} />
        <Route path="/history/:id" element={<PredictionResultDetail />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/appointments/:id" element={<PatientAppointmentDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/reports" element={<PatientReports />} />
      </Route>

      {/* Doctor Dashboard Routes */}
      <Route element={
        <ProtectedRoute allowedRoles={['doctor']}>
          <DoctorLayout />
        </ProtectedRoute>
      }>
        <Route path="/doctor" element={<DoctorDashboard />} />
        <Route path="/doctor/reviews" element={<DoctorReviews />} />
        <Route path="/doctor/appointments" element={<DoctorAppointments />} />
        <Route path="/doctor/patients" element={<DoctorPatients />} />
        <Route path="/doctor/prediction/:id" element={<PredictionDetail />} />
        <Route path="/doctor/appointment-prediction/:id" element={<AppointmentPredictionDetail />} />
        <Route path="/doctor/appointment/:id" element={<AppointmentDetail />} />
        <Route path="/doctor/profile" element={<Profile />} />
      </Route>

      {/* Admin Dashboard Routes */}
      <Route element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/reviews" element={<AdminReviews />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/prediction/:id" element={<PredictionDetail />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Reports - Doctor/Admin only */}
      <Route path="/reports" element={
        <ProtectedRoute allowedRoles={['doctor', 'admin']}>
          <Reports />
        </ProtectedRoute>
      } />

      {/* Catch all */}
      <Route path="*" element={<Navigate to={getDefaultDashboard()} replace />} />
    </Routes>
  );
}

export default App;