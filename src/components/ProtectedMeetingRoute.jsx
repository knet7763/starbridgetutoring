import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * ProtectedMeetingRoute
 * Allows access if EITHER a tutor (user) OR a student is authenticated.
 * Redirects unauthenticated visitors to the student login page,
 * preserving the intended destination so they can return after login.
 */
const ProtectedMeetingRoute = ({ children }) => {
    const { user, student, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">
                    Verifying access...
                </p>
            </div>
        );
    }

    // Tutors log in via Supabase Auth (user), students have a student profile
    const isAuthenticated = !!user || !!student;

    if (!isAuthenticated) {
        return (
            <Navigate
                to="/student/login"
                state={{ from: location }}
                replace
            />
        );
    }

    return children;
};

export default ProtectedMeetingRoute;
