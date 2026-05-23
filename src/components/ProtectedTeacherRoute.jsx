import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedTeacherRoute = ({ children }) => {
    const { user, isTeacher, isAdmin, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 size={36} className="animate-spin text-primary" />
            </div>
        );
    }

    if (!user || (!isTeacher && !isAdmin)) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedTeacherRoute;
