import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Loader2, Calendar as CalendarIcon, Clock, User, Check, X, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TeacherBookingsTab = ({ user }) => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [actionError, setActionError] = useState(null);

    useEffect(() => {
        if (user) {
            fetchBookings();
        }
    }, [user]);

    const fetchBookings = async () => {
        setLoading(true);
        const { data, error } = await api.bookings.getByTutorId(user.id);
        if (!error && data) {
            setBookings(data);
        }
        setLoading(false);
    };

    const handleConfirm = async (id) => {
        setActionLoading(id);
        setActionError(null);
        try {
            await api.bookings.confirmWithRoom(id);
            await fetchBookings();
        } catch (error) {
            console.error('Error confirming booking', error);
            setActionError('Failed to confirm booking. Please try again.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancel = async (id) => {
        setActionLoading(id);
        try {
            await api.bookings.update(id, { status: 'cancelled' });
            await fetchBookings();
        } catch (error) {
            console.error('Error cancelling booking', error);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 size={32} className="animate-spin text-primary" />
            </div>
        );
    }

    if (bookings.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <CalendarIcon size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-bold text-gray-700">No bookings yet</h3>
                <p>When students book sessions with you, they will appear here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {actionError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium flex justify-between items-center">
                    <span>{actionError}</span>
                    <button onClick={() => setActionError(null)} className="ml-4 font-bold text-red-500 hover:text-red-700">×</button>
                </div>
            )}
            {bookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                            <User className="text-gray-400" size={20} />
                            <span className="font-bold text-lg">{booking.students?.name || 'Student'}</span>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                                {booking.status.toUpperCase()}
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1.5"><CalendarIcon size={16}/> {new Date(booking.booking_date).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1.5"><Clock size={16}/> {booking.start_time} - {booking.end_time}</span>
                        </div>
                        {booking.notes && (
                            <p className="text-sm text-gray-500 bg-gray-50 p-2 rounded-md border border-gray-100">
                                <span className="font-semibold">Notes:</span> {booking.notes}
                            </p>
                        )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                        {booking.status === 'pending' && (
                            <>
                                <button
                                    onClick={() => handleCancel(booking.id)}
                                    disabled={actionLoading === booking.id}
                                    className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <X size={16} /> Cancel
                                </button>
                                <button
                                    onClick={() => handleConfirm(booking.id)}
                                    disabled={actionLoading === booking.id}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {actionLoading === booking.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                    Confirm
                                </button>
                            </>
                        )}
                        {booking.status === 'confirmed' && booking.room_url && (
                            <button
                                onClick={() => navigate(`/meeting/${booking.id}`)}
                                className="px-6 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-yellow-600 flex items-center justify-center gap-2 shadow-sm"
                            >
                                <Video size={16} /> Join Meeting
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TeacherBookingsTab;
