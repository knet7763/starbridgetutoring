import React from 'react';
import { Navigate } from 'react-router-dom';
import { useStudentAuth } from '../contexts/StudentAuthContext';

const ProtectedStudentRoute = ({ children }) => {
    const { student, loading } = useStudentAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!student) {
        return <Navigate to="/student/login" replace />;
    }

    return children;
};

export default ProtectedStudentRoute;
