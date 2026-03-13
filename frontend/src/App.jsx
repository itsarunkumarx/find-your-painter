// Imports
import { Routes, Route, useLocation } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import IncomingCallModal from './components/IncomingCallModal';
import CallModal from './components/CallModal';
import Navbar from './components/Navbar';
import { WorkerProvider } from './context/WorkerContext';

import EntryPage from './pages/EntryPage';
import RoleSelection from './pages/RoleSelection';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserDashboard from './pages/UserDashboard';
import ExplorePainters from './pages/ExplorePainters';
import WorkerDashboard from './pages/WorkerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import BecomePainterPage from './pages/BecomePainterPage';
import PainterProfile from './pages/PainterProfile';
import MyBookings from './pages/MyBookings';
import WorkerJobs from './pages/WorkerJobs';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import AdminSupportPage from './pages/AdminSupportPage';
import SettingsPage from './pages/SettingsPage';
import RingtonesPage from './pages/RingtonesPage';
import HelpPage from './pages/HelpPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import AuditLogs from './pages/AuditLogs';
import SavedPaintersPage from './pages/SavedPaintersPage';
import ReviewsPage from './pages/ReviewsPage';
import WorkerVerification from './pages/WorkerVerification';
import PortfolioPage from './pages/PortfolioPage';
import EarningsPage from './pages/EarningsPage';
import MessagesPage from './pages/MessagesPage';
import NotificationsPage from './pages/NotificationsPage';
import PaymentGateway from './pages/PaymentGateway';
import AdminUserManagement from './pages/AdminUserManagement';
import AdminWorkerManagement from './pages/AdminWorkerManagement';
import AdminNotifications from './pages/AdminNotifications';
import RaiseComplaint from './pages/RaiseComplaint';
import WorkerProfile from './pages/WorkerProfile';
import AdminProfile from './pages/AdminProfile';

const DASHBOARD_ROUTES = [
  '/user-dashboard', '/explore', '/worker-dashboard', '/admin-dashboard',
  '/my-bookings', '/worker-jobs', '/profile-settings', '/reviews',
  '/worker-verification', '/messages', '/notifications', '/saved-painters',
  '/my-portfolio', '/earnings', '/admin-analytics', '/admin-support', '/payment',
  '/help', '/project', '/audit-logs', '/admin-users', '/admin-workers',
  '/admin-notifications', '/raise-complaint', '/worker-profile', '/admin-profile'
];

const App = () => {
  const location = useLocation();
  const isDashboard = DASHBOARD_ROUTES.some(r => location.pathname.startsWith(r));

  return (
    <>
      <IncomingCallModal />
      <CallModal />
      <div className="flex min-h-screen">
        {!isDashboard && <Navbar />}
        <div className={`flex-1 ${!isDashboard ? 'pt-20' : ''}`}>
          <Routes>
            <Route path="/" element={<EntryPage />} />
            <Route path="/roles" element={<RoleSelection />} />
            <Route path="/login/:role" element={<LoginPage />} />
            <Route path="/register/:role" element={<RegisterPage />} />
            <Route path="/profile/:id" element={<PainterProfile />} />
            <Route path="/become-painter" element={
              <ProtectedRoute allowedRoles={['user']}><BecomePainterPage /></ProtectedRoute>
            } />

            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="/user-dashboard" element={<UserDashboard />} />
              <Route path="/explore" element={<ExplorePainters />} />
              <Route path="/my-bookings" element={<MyBookings />} />
              <Route path="/saved-painters" element={<SavedPaintersPage />} />
              <Route path="/reviews" element={<ReviewsPage />} />
              <Route path="/project/:id" element={<ProjectDetailPage />} />
              <Route path="/raise-complaint" element={<RaiseComplaint />} />
            </Route>

            {/* Shared Worker & Settings Routes */}
            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="/profile-settings" element={<SettingsPage />} />
              <Route path="/audio-protocols" element={<RingtonesPage />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
            </Route>

            {/* Worker Space */}
            <Route element={<ProtectedRoute allowedRoles={['worker']}><WorkerProvider><DashboardLayout /></WorkerProvider></ProtectedRoute>}>
              <Route path="/worker-dashboard" element={<WorkerDashboard />} />
              <Route path="/worker-jobs" element={<WorkerJobs />} />
              <Route path="/worker-verification" element={<WorkerVerification />} />
              <Route path="/my-portfolio" element={<PortfolioPage />} />
              <Route path="/earnings" element={<EarningsPage />} />
              <Route path="/worker-profile" element={<WorkerProfile />} />
            </Route>

            {/* Admin Space */}
            <Route element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout /></ProtectedRoute>}>
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/admin-analytics" element={<AdminAnalyticsPage />} />
              <Route path="/admin-support" element={<AdminSupportPage />} />
              <Route path="/admin-users" element={<AdminUserManagement />} />
              <Route path="/admin-workers" element={<AdminWorkerManagement />} />
              <Route path="/admin-notifications" element={<AdminNotifications />} />
              <Route path="/admin-profile" element={<AdminProfile />} />
              <Route path="/audit-logs" element={<AuditLogs />} />
            </Route>
            <Route path="/raise-complaint" element={<RaiseComplaint />} />
            <Route path="/payment/:bookingId" element={<PaymentGateway />} />
          </Routes>
        </div>
      </div>
    </>
  );
};

export default App;
