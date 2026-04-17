import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useStudentAuth } from '../contexts/StudentAuthContext';
import { Loader2, ArrowLeft } from 'lucide-react';

const MeetingRoom = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const { user: tutorUser, loading: tutorLoading } = useAuth();
    const { student, loading: studentLoading } = useStudentAuth();
    
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!bookingId) return;
        if (tutorLoading || studentLoading) return;

        const fetchBookingAndVerifyAccess = async () => {
            setLoading(true);
            try {
                // Fetch the booking - RLS will naturally prevent access if user shouldn't see it (assuming RLS is active)
                // If the tutor is an admin or the active tutor for this booking, they should see it.
                const { data, error } = await supabase
                    .from('bookings')
                    .select('*')
                    .eq('id', bookingId)
                    .single();
                
                if (error || !data) {
                    setError('Meeting not found or you do not have permission.');
                    return;
                }

                if (!data.room_url) {
                    setError('The meeting room has not been created yet.');
                    return;
                }

                setBooking(data);
            } catch (err) {
                console.error(err);
                setError('An error occurred loading the room.');
            } finally {
                setLoading(false);
            }
        };

        fetchBookingAndVerifyAccess();
    }, [bookingId, tutorLoading, studentLoading]);

    if (loading || tutorLoading || studentLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <Loader2 className="animate-spin text-white w-12 h-12" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
                <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full">
                    <div className="text-red-500 mb-4 flex justify-center">
                        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button 
                        onClick={() => navigate(-1)} 
                        className="inline-flex items-center justify-center bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-yellow-600 w-full"
                    >
                       <ArrowLeft className="mr-2 w-5 h-5" /> Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-screen h-screen bg-black overflow-hidden flex flex-col">
            <div className="bg-gray-900 text-white px-4 py-3 flex justify-between items-center shadow-md shrink-0">
                <div className="flex items-center">
                    <button 
                        onClick={() => navigate(-1)}
                        className="mr-4 p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                        title="Leave Meeting"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-300" />
                    </button>
                    <h1 className="font-semibold text-lg truncate max-w-sm">1-on-1 Session</h1>
                </div>
            </div>
            <div className="flex-1 w-full h-full relative">
                <iframe
                    src={booking.room_url}
                    allow="camera; microphone; fullscreen; speaker; display-capture; autoplay"
                    className="w-full h-full border-none absolute inset-0"
                    title="Video Meeting Room"
                />
            </div>
        </div>
    );
};

export default MeetingRoom;
