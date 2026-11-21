import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Video, CheckCircle, XCircle, Mail, Trash2, RefreshCw, MessageCircle } from 'lucide-react';
import { api } from '../../services/api';

const STATUS_FILTERS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

const STATUS_BADGE = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    completed: 'bg-blue-100 text-blue-800 border-blue-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
};

const AdminBookingsTab = ({ bookings, loading, fetchBookings }) => {
    const navigate = useNavigate();
    const [statusFilter, setStatusFilter] = useState('all');
    const [busyId, setBusyId] = useState(null);

    const filteredBookings = statusFilter === 'all'
        ? bookings
        : bookings.filter((b) => b.status === statusFilter);

    const handleConfirm = async (booking) => {
        setBusyId(booking.id);
        try {
            const { error } = await api.bookings.confirmWithRoom(booking.id);
            if (error) throw error;

            const studentEmail = booking.students?.email || booking.students?.parent_email;
            if (studentEmail) {
                api.email.send('booking_confirmed_student', studentEmail, {
                    studentName: booking.students?.full_name || 'Student',
                    teacherName: booking.tutors?.name || 'Your Tutor',
                    date: booking.booking_date,
                    startTime: booking.start_time?.slice(0, 5),
                    endTime: booking.end_time?.slice(0, 5),
                    meetingUrl: `${window.location.origin}/meeting/${booking.id}`,
                }).catch((err) => console.warn('[AdminBookingsTab] Confirmation email warning:', err));
            }
            await fetchBookings();
        } catch (err) {
            alert('Failed to confirm booking: ' + (err?.message || 'Unknown error'));
        } finally {
            setBusyId(null);
        }
    };

    const handleUpdateStatus = async (booking, status) => {
        if (status === 'cancelled' && !window.confirm('Cancel this booking?')) return;
        setBusyId(booking.id);
        try {
            const { error } = await api.bookings.update(booking.id, { status });
            if (error) throw error;
            // Auto-deduct 1 lesson credit when a session is marked completed
            if (status === 'completed' && booking.student_id) {
                const creditInfo = await api.credits.getForStudent(booking.student_id);
                if (creditInfo.balance > 0) {
                    await api.credits.adjustForStudent(
                        booking.student_id,
                        -1,
                        `Completed session on ${booking.booking_date}`
                    );
                }
            }
            await fetchBookings();
        } catch (err) {
            alert('Failed to update booking: ' + (err?.message || 'Unknown error'));
        } finally {
            setBusyId(null);
        }
    };

    const handleWhatsAppReminder = (booking) => {
        const meetingUrl = `${window.location.origin}/meeting/${booking.id}`;
        const studentName = booking.students?.full_name || 'your child';
        const tutorName = booking.tutors?.name || 'your tutor';
        const timeRange = `${booking.start_time?.slice(0, 5)} - ${booking.end_time?.slice(0, 5)}`;
        const text = encodeURIComponent(
            `Assalamu Alaikum! Friendly reminder from StarBridge Tutoring:\n\n` +
            `Student: ${studentName}\n` +
            `Tutor: ${tutorName}\n` +
            `Date: ${booking.booking_date}\n` +
            `Time: ${timeRange}\n` +
            (booking.status === 'confirmed' ? `\nJoin Classroom: ${meetingUrl}\n` : '') +
            `\nSee you in class!`
        );
        window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
    };

    const handleDelete = async (bookingId) => {
        if (!window.confirm('Permanently delete this booking record?')) return;
        setBusyId(bookingId);
        try {
            const { error } = await api.bookings.delete(bookingId);
            if (error) throw error;
            await fetchBookings();
        } catch (err) {
            alert('Failed to delete booking: ' + (err?.message || 'Unknown error'));
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">All 1-on-1 Bookings</h2>
                    <p className="text-sm text-gray-500">
                        Master schedule across all tutors. Confirm sessions, generate meeting rooms, or manage cancellations.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={fetchBookings}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 self-start"
                >
                    <RefreshCw size={15} />
                    Refresh
                </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
                {STATUS_FILTERS.map((st) => {
                    const count = st === 'all' ? bookings.length : bookings.filter((b) => b.status === st).length;
                    return (
                        <button
                            key={st}
                            type="button"
                            onClick={() => setStatusFilter(st)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold capitalize border transition-colors ${
                                statusFilter === st
                                    ? 'bg-gray-900 text-white border-gray-900'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                            }`}
                        >
                            {st} ({count})
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading bookings...</div>
            ) : filteredBookings.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-300 py-14 px-6 text-center">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-gray-800 mb-1">No Bookings Found</h3>
                    <p className="text-sm text-gray-500">
                        {statusFilter === 'all'
                            ? 'When students book 1-on-1 sessions, they will appear here.'
                            : `No ${statusFilter} bookings at the moment.`}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredBookings.map((booking) => {
                        const studentEmail = booking.students?.email || booking.students?.parent_email;
                        const isBusy = busyId === booking.id;
                        return (
                            <div
                                key={booking.id}
                                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                            >
                                <div className="space-y-1.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${STATUS_BADGE[booking.status] || 'bg-gray-100 text-gray-700'}`}>
                                            {booking.status}
                                        </span>
                                        <span className="text-sm font-bold text-gray-900">
                                            {booking.students?.full_name || 'Student'}
                                        </span>
                                        <span className="text-xs text-gray-400">with</span>
                                        <span className="text-sm font-semibold text-primary">
                                            {booking.tutors?.name || 'Tutor'}
                                        </span>
                                        {booking.tutors?.subject && (
                                            <span className="text-xs text-gray-500">({booking.tutors.subject})</span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
                                        <span className="inline-flex items-center gap-1 font-medium">
                                            <Calendar size={14} className="text-gray-400" />
                                            {booking.booking_date}
                                        </span>
                                        <span className="inline-flex items-center gap-1 font-medium">
                                            <Clock size={14} className="text-gray-400" />
                                            {booking.start_time?.slice(0, 5)} – {booking.end_time?.slice(0, 5)}
                                        </span>
                                        {studentEmail && (
                                            <a
                                                href={`mailto:${studentEmail}`}
                                                className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                                            >
                                                <Mail size={13} />
                                                {studentEmail}
                                            </a>
                                        )}
                                    </div>
                                    {booking.notes && (
                                        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-1.5 inline-block">
                                            {booking.notes}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-2 shrink-0">
                                    {booking.status === 'pending' && (
                                        <button
                                            type="button"
                                            disabled={isBusy}
                                            onClick={() => handleConfirm(booking)}
                                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50"
                                        >
                                            <CheckCircle size={14} />
                                            Confirm & Create Room
                                        </button>
                                    )}
                                    {booking.status === 'confirmed' && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => handleWhatsAppReminder(booking)}
                                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold"
                                                title="Send 1-click WhatsApp class reminder"
                                            >
                                                <MessageCircle size={14} />
                                                WhatsApp Reminder
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/meeting/${booking.id}`)}
                                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary hover:bg-yellow-500 text-gray-950 text-xs font-bold"
                                            >
                                                <Video size={14} />
                                                Join Meeting
                                            </button>
                                            <button
                                                type="button"
                                                disabled={isBusy}
                                                onClick={() => handleUpdateStatus(booking, 'completed')}
                                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold disabled:opacity-50"
                                            >
                                                <CheckCircle size={14} />
                                                Mark Completed
                                            </button>
                                        </>
                                    )}
                                    {(booking.status === 'pending' || booking.status === 'confirmed') && (
                                        <button
                                            type="button"
                                            disabled={isBusy}
                                            onClick={() => handleUpdateStatus(booking, 'cancelled')}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold disabled:opacity-50"
                                        >
                                            <XCircle size={14} />
                                            Cancel
                                        </button>
                                    )}
                                    {booking.status === 'cancelled' && (
                                        <button
                                            type="button"
                                            disabled={isBusy}
                                            onClick={() => handleDelete(booking.id)}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 text-xs font-bold disabled:opacity-50"
                                        >
                                            <Trash2 size={14} />
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AdminBookingsTab;
