import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedStudentRoute = ({ children }) => {
    const { student, loading, profileMissing, signOut } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-xl text-gray-600 animate-pulse">Verifying student session...</div>
            </div>
        );
    }

    if (!student) {
        if (profileMissing) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                    <div className="max-w-md w-full text-center space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900">Student Profile Not Found</h2>
                        <p className="text-gray-600">You are logged in, but we couldn't find your student record. Please sign out and try again.</p>
                        <button onClick={() => signOut()} className="w-full bg-primary text-white py-3 rounded-xl font-bold">Sign Out</button>
                    </div>
                </div>
            );
        }
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedStudentRoute;
