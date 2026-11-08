import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedTeacherRoute = ({ children }) => {
    const { user, isTeacher, isAdmin, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 size={36} className="animate-spin text-primary" />
            </div>
        );
    }

    if (!user || (!isTeacher && !isAdmin)) {
        return <Navigate to="/login" state={{ from: `${location.pathname}${location.search || ''}` }} replace />;
    }

    return children;
};

export default ProtectedTeacherRoute;
