import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-12 h-12 border-4 border-royal-gold/20 border-t-royal-gold rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        // Redirect to roles selection or specific login if not authenticated
        return <Navigate to="/roles" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Unauthorized access for this role
        // Redirect workers to their dashboard if they try to access user pages
        if (user.role === 'worker') {
            return <Navigate to="/worker-dashboard" replace />;
        }
        if (user.role === 'admin') {
            return <Navigate to="/admin-dashboard" replace />;
        }
        if (user.role === 'user') {
            return <Navigate to="/user-dashboard" replace />;
        }
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
