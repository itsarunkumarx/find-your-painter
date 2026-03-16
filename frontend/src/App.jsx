import { Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import IncomingCallModal from './components/IncomingCallModal';
import Navbar from './components/Navbar';
import { WorkerProvider } from './context/WorkerContext';
import { Toaster } from 'react-hot-toast';

// Lazy load pages
const EntryPage = lazy(() => import('./pages/EntryPage'));
const RoleSelection = lazy(() => import('./pages/RoleSelection'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const ExplorePainters = lazy(() => import('./pages/ExplorePainters'));
const WorkerDashboard = lazy(() => import('./pages/WorkerDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const BecomePainterPage = lazy(() => import('./pages/BecomePainterPage'));
const PainterProfile = lazy(() => import('./pages/PainterProfile'));
const MyBookings = lazy(() => import('./pages/MyBookings'));
const WorkerJobs = lazy(() => import('./pages/WorkerJobs'));
const AdminAnalyticsPage = lazy(() => import('./pages/AdminAnalyticsPage'));
const AdminSupportPage = lazy(() => import('./pages/AdminSupportPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const RingtonesPage = lazy(() => import('./pages/RingtonesPage'));
const HelpPage = lazy(() => import('./pages/HelpPage'));
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));
const SavedPaintersPage = lazy(() => import('./pages/SavedPaintersPage'));
const ReviewsPage = lazy(() => import('./pages/ReviewsPage'));
const WorkerVerification = lazy(() => import('./pages/WorkerVerification'));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'));
const EarningsPage = lazy(() => import('./pages/EarningsPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const PaymentGateway = lazy(() => import('./pages/PaymentGateway'));
const AdminUserManagement = lazy(() => import('./pages/AdminUserManagement'));
const AdminWorkerManagement = lazy(() => import('./pages/AdminWorkerManagement'));
const AdminNotifications = lazy(() => import('./pages/AdminNotifications'));
const RaiseComplaint = lazy(() => import('./pages/RaiseComplaint'));
const WorkerProfile = lazy(() => import('./pages/WorkerProfile'));
const AdminProfile = lazy(() => import('./pages/AdminProfile'));
const CallHistoryPage = lazy(() => import('./pages/CallHistoryPage'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Loading component for Suspense
const LoadingFallback = () => (
  <div className="h-screen w-screen flex items-center justify-center bg-[var(--bg-base)]">
    <div className="w-12 h-12 border-4 border-royal-gold border-t-transparent rounded-full animate-spin" />
  </div>
);

const DASHBOARD_ROUTES = [
  '/user-dashboard', '/explore', '/worker-dashboard', '/admin-dashboard',
  '/my-bookings', '/worker-jobs', '/profile-settings', '/reviews',
  '/worker-verification', '/messages', '/notifications', '/saved-painters',
  '/my-portfolio', '/earnings', '/admin-analytics', '/admin-support', '/payment',
  '/help', '/project', '/audit-logs', '/admin-users', '/admin-workers',
  '/admin-notifications', '/raise-complaint', '/worker-profile', '/admin-profile', 
  '/audio-protocols', '/admin-settings', '/call-history'
];

const App = () => {
  const location = useLocation();
  const isDashboard = DASHBOARD_ROUTES.some(r => location.pathname.startsWith(r));

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <IncomingCallModal />
      <div className="flex min-h-screen">
        {!isDashboard && <Navbar />}
        <div className={`flex-1 ${!isDashboard ? 'pt-20' : ''}`}>
          <Suspense fallback={<LoadingFallback />}>
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
                <Route path="/call-history" element={<CallHistoryPage />} />
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
                <Route path="/admin-settings" element={<AdminSettings />} />
              </Route>
              <Route path="/payment/:bookingId" element={<PaymentGateway />} />
              {/* Catch-all: show 404 for any unknown route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </>
  );
};

export default App;
