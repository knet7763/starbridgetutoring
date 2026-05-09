import React from 'react';
import { Navigate } from 'react-router-dom';
import { useStudentAuth } from '../contexts/StudentAuthContext';

const ProtectedStudentRoute = ({ children }) => {
    const { student, loading, profileMissing, signOut } = useStudentAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (profileMissing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h2>
                    <p className="text-gray-600 mb-6">
                        We couldn't find a student profile for your account. This might happen if your account was created as a teacher.
                    </p>
                    <button
                        onClick={() => signOut()}
                        className="w-full bg-primary text-white py-2 rounded-lg font-medium hover:bg-secondary transition-colors"
                    >
                        Sign Out & Try Again
                    </button>
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
