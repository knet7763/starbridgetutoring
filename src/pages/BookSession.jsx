import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Calendar as CalendarIcon, Clock, CheckCircle, Repeat, AlertCircle, ShieldCheck } from 'lucide-react';
import Button from '../components/Button';
import { TutorAvatar } from '../assets/avatar';

const DURATION_OPTIONS = [
    { minutes: 30, label: '30 min', desc: 'Ideal for Quran / Young Learners' },
    { minutes: 45, label: '45 min', desc: 'Focused Practice' },
    { minutes: 60, label: '60 min', desc: 'Full 1-Hour Session' },
];

const REPEAT_OPTIONS = [
    { weeks: 1, label: 'Single Session' },
    { weeks: 2, label: 'Weekly (2 Weeks)' },
    { weeks: 4, label: 'Weekly (4 Weeks)' },
];

const MIN_NOTICE_MS = 2 * 60 * 60 * 1000; // 2 hours minimum advance notice
const BUFFER_MINUTES = 10; // 10-minute tutor break between consecutive sessions

const getLocalDateString = (dateObj = new Date()) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const toMinutes = (timeStr) => {
    const [h, m] = timeStr.slice(0, 5).split(':').map(Number);
    return h * 60 + m;
};

const formatMinutes = (totalMinutes) => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const addDaysToDateString = (dateStr, daysToAdd) => {
    const base = new Date(`${dateStr}T12:00:00`);
    base.setDate(base.getDate() + daysToAdd);
    return getLocalDateString(base);
};

const BookSession = () => {
    const { tutorId } = useParams();
    const { student } = useAuth();
    const navigate = useNavigate();
    const [tutor, setTutor] = useState(null);
    const [availability, setAvailability] = useState([]);
    const [blackoutDates, setBlackoutDates] = useState([]);
    const [blackoutReason, setBlackoutReason] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [durationMinutes, setDurationMinutes] = useState(60);
    const [repeatWeeks, setRepeatWeeks] = useState(1);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(true);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [bookingSubmitting, setBookingSubmitting] = useState(false);
    const [bookingError, setBookingError] = useState('');
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local Time';

    useEffect(() => {
        const fetchData = async () => {
            if (!tutorId) return;
            setLoading(true);

            const { data: tutorData, error: tutorError } = await api.tutors.getById(tutorId);
            if (tutorError) {
                console.error('Error fetching tutor:', tutorError);
                setLoading(false);
                return;
            }
            setTutor(tutorData);

            const [{ data: availData, error: availError }, blocked] = await Promise.all([
                api.tutorAvailability.getByTutorId(tutorId),
                api.blackoutDates.getByTutorId(tutorId),
            ]);
            setBlackoutDates(blocked || []);
            if (availError) {
                console.error('Error fetching availability:', availError);
                setAvailability([]);
            } else if (!availData || availData.length === 0) {
                const defaultAvail = [1, 2, 3, 4, 5].map((day) => ({
                    day_of_week: day,
                    start_time: '09:00:00',
                    end_time: '17:00:00',
                    is_active: true,
                }));
                setAvailability(defaultAvail);
            } else {
                setAvailability(availData);
            }

            setLoading(false);
        };

        fetchData();
    }, [tutorId]);

    const generateSlots = useCallback(async (date, duration) => {
        setSlotsLoading(true);
        setSelectedSlot(null);
        setBookingError('');
        setBlackoutReason('');

        try {
            // Check holiday / blackout date overrides first
            const blockedMatch = blackoutDates.find((b) => b.date === date);
            if (blockedMatch) {
                setBlackoutReason(blockedMatch.reason || 'Holiday / Tutor Unavailable');
                setAvailableSlots([]);
                return;
            }

            // Parse at local noon so negative UTC offsets never shift to the previous weekday
            const dayOfWeek = new Date(`${date}T12:00:00`).getDay();
            const schedule = availability.find((s) => s.day_of_week === dayOfWeek);

            if (!schedule) {
                setAvailableSlots([]);
                return;
            }

            const { data: existingBookings } = await api.bookings.getTakenSlots(tutorId, date);
            const takenRanges = (existingBookings || []).map((b) => {
                const start = toMinutes(b.start_time);
                const end = b.end_time ? toMinutes(b.end_time) : start + 60;
                return { start: start - BUFFER_MINUTES, end: end + BUFFER_MINUTES };
            });

            const startMin = toMinutes(schedule.start_time);
            const endMin = toMinutes(schedule.end_time);
            const step = duration === 60 ? 60 : 30;
            const nowPlusNotice = Date.now() + MIN_NOTICE_MS;
            const isToday = date === getLocalDateString();

            const slots = [];
            for (let m = startMin; m + duration <= endMin; m += step) {
                const slotStart = m;
                const slotEnd = m + duration;
                const timeString = formatMinutes(slotStart);

                // Enforce 2-hour minimum advance notice on same-day bookings
                if (isToday) {
                    const slotDateTime = new Date(`${date}T${timeString}:00`).getTime();
                    if (slotDateTime < nowPlusNotice) continue;
                }

                // Prevent overlaps with existing bookings (including 10-min tutor buffer)
                const overlaps = takenRanges.some(
                    (range) => slotStart < range.end && slotEnd > range.start
                );
                if (!overlaps) {
                    slots.push(timeString);
                }
            }

            setAvailableSlots(slots);
        } finally {
            setSlotsLoading(false);
        }
    }, [availability, blackoutDates, tutorId]);

    useEffect(() => {
        if (selectedDate && availability.length > 0) {
            generateSlots(selectedDate, durationMinutes);
        } else {
            setAvailableSlots([]);
            setSelectedSlot(null);
        }
    }, [selectedDate, durationMinutes, availability, generateSlots]);

    const handleBook = async () => {
        if (!selectedSlot || !selectedDate || !student) return;
        setBookingSubmitting(true);
        setBookingError('');

        try {
            const startMin = toMinutes(selectedSlot);
            const endTime = formatMinutes(startMin + durationMinutes);

            const targetDates = Array.from({ length: repeatWeeks }, (_, idx) =>
                addDaysToDateString(selectedDate, idx * 7)
            );

            // Verify future recurring dates don't collide with existing bookings
            const bookingsToCreate = [];
            const skippedDates = [];

            for (const dateStr of targetDates) {
                const isBlocked = blackoutDates.some((b) => b.date === dateStr);
                if (isBlocked) {
                    skippedDates.push(`${dateStr} (holiday)`);
                    continue;
                }
                const { data: dayBookings } = await api.bookings.getTakenSlots(tutorId, dateStr);
                const conflict = (dayBookings || []).some((b) => {
                    const bStart = toMinutes(b.start_time) - BUFFER_MINUTES;
                    const bEnd = (b.end_time ? toMinutes(b.end_time) : toMinutes(b.start_time) + 60) + BUFFER_MINUTES;
                    return startMin < bEnd && startMin + durationMinutes > bStart;
                });

                if (conflict) {
                    skippedDates.push(dateStr);
                } else {
                    const metaNote = `${durationMinutes} min • ${userTimezone}${repeatWeeks > 1 ? ` • Weekly series` : ''}`;
                    bookingsToCreate.push({
                        student_id: student.id,
                        tutor_id: tutorId,
                        booking_date: dateStr,
                        start_time: selectedSlot,
                        end_time: endTime,
                        notes: notes.trim() ? `${notes.trim()} (${metaNote})` : metaNote,
                        status: 'pending',
                    });
                }
            }

            if (bookingsToCreate.length === 0) {
                setBookingError('The selected time slot was just taken. Please pick another time.');
                setBookingSubmitting(false);
                return;
            }

            const { error } = await api.bookings.create(bookingsToCreate);
            if (error) {
                setBookingError('Error creating booking: ' + error.message);
                setBookingSubmitting(false);
                return;
            }

            // Ensure enrollment exists
            const { data: enrollment } = await api.enrollments.getOne(student.id, tutorId);
            if (!enrollment) {
                await api.enrollments.create({
                    student_id: student.id,
                    tutor_id: tutorId,
                    status: 'active',
                });
            }

            // Non-blocking tutor/admin email notification
            const fallbackAdminEmail = await api.settings.getAdminEmail();
            const tutorRecipient = tutor?.email || fallbackAdminEmail;
            const formattedDate = new Date(`${bookingsToCreate[0].booking_date}T12:00:00`).toLocaleDateString('en-GB', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });

            api.email.send('booking_created_teacher', tutorRecipient, {
                teacherName: tutor?.name || 'Tutor',
                studentName: student?.full_name || 'A Student',
                date: bookingsToCreate.length > 1
                    ? `${formattedDate} (+${bookingsToCreate.length - 1} weekly)`
                    : formattedDate,
                startTime: selectedSlot,
                endTime: endTime,
                subject: tutor?.subject || 'Tutoring Session',
                dashboardUrl: `${window.location.origin}/teacher/dashboard?tab=bookings`,
            }).catch((err) => console.warn('[email] Booking created email notification failed:', err));

            if (skippedDates.length > 0) {
                alert(`Booked ${bookingsToCreate.length} session(s). Note: ${skippedDates.join(', ')} was already booked and skipped.`);
            }

            navigate('/student/dashboard');
        } catch (err) {
            console.error('[BookSession] Booking failed:', err);
            setBookingError(err?.message || 'Unexpected error while booking. Please try again.');
        } finally {
            setBookingSubmitting(false);
        }
    };

    const today = getLocalDateString();
    const maxDateObj = new Date();
    maxDateObj.setDate(maxDateObj.getDate() + 45);
    const maxDateString = getLocalDateString(maxDateObj);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!tutor) {
        return <div className="text-center py-12">Tutor not found</div>;
    }

    const selectedEndTime = selectedSlot ? formatMinutes(toMinutes(selectedSlot) + durationMinutes) : null;

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="md:flex">
                        {/* Tutor Info Side */}
                        <div className="md:w-1/3 bg-gray-900 p-8 text-white">
                            <div className="mb-6 flex justify-center">
                                {tutor.image_url ? (
                                    <img
                                        src={tutor.image_url}
                                        alt={tutor.name}
                                        className="w-32 h-32 rounded-full object-cover border-4 border-white/20"
                                    />
                                ) : (
                                    <TutorAvatar
                                        name={tutor.name}
                                        className="w-32 h-32 rounded-full flex items-center justify-center text-4xl font-black border-4 border-white/20"
                                    />
                                )}
                            </div>
                            <h2 className="text-2xl font-bold text-center mb-1">{tutor.name}</h2>
                            <p className="text-center text-primary font-medium mb-6">{tutor.subject}</p>

                            <div className="space-y-4 text-sm">
                                <div className="flex items-center text-gray-300">
                                    <CheckCircle className="h-5 w-5 mr-3 text-green-400 shrink-0" />
                                    <span>Certified Tutor</span>
                                </div>
                                <div className="flex items-center text-gray-300">
                                    <Clock className="h-5 w-5 mr-3 text-blue-400 shrink-0" />
                                    <span>{durationMinutes} Minute Sessions</span>
                                </div>
                                <div className="flex items-center text-gray-300">
                                    <ShieldCheck className="h-5 w-5 mr-3 text-yellow-400 shrink-0" />
                                    <span>2-Hr Advance Notice & Buffer</span>
                                </div>
                            </div>
                        </div>

                        {/* Booking Form Side */}
                        <div className="md:w-2/3 p-8">
                            <h1 className="text-2xl font-bold text-gray-900 mb-6">Book a Session</h1>

                            {bookingError && (
                                <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
                                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                                    <span>{bookingError}</span>
                                </div>
                            )}

                            <div className="space-y-6">
                                {/* Session Duration */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        1. Session Duration
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {DURATION_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.minutes}
                                                type="button"
                                                onClick={() => setDurationMinutes(opt.minutes)}
                                                className={`p-3 rounded-xl border text-left transition-all ${
                                                    durationMinutes === opt.minutes
                                                        ? 'border-primary bg-yellow-50/70 ring-2 ring-primary/20'
                                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                                }`}
                                            >
                                                <div className="font-bold text-gray-900 text-sm">{opt.label}</div>
                                                <div className="text-[11px] text-gray-500 mt-0.5 leading-tight">{opt.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Date Picker */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        2. Select Start Date
                                    </label>
                                    <div className="relative">
                                        <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="date"
                                            min={today}
                                            max={maxDateString}
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-3 border"
                                        />
                                    </div>
                                </div>

                                {/* Available Time Slots */}
                                {selectedDate && (
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-sm font-semibold text-gray-700">
                                                3. Available Time Slots
                                            </label>
                                            <span className="text-xs font-semibold text-primary bg-yellow-50 border border-yellow-200 px-2.5 py-0.5 rounded-full">
                                                🌍 {userTimezone}
                                            </span>
                                        </div>
                                        {slotsLoading ? (
                                            <p className="text-sm text-gray-500">Checking live availability...</p>
                                        ) : availableSlots.length > 0 ? (
                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                                                {availableSlots.map((slot) => (
                                                    <button
                                                        key={slot}
                                                        type="button"
                                                        onClick={() => setSelectedSlot(slot)}
                                                        className={`py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
                                                            selectedSlot === slot
                                                                ? 'bg-primary text-gray-950 shadow-md'
                                                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {slot}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : blackoutReason ? (
                                            <p className="text-sm text-amber-800 font-medium bg-amber-50 p-3 rounded-lg border border-amber-200">
                                                Tutor is unavailable on this date ({blackoutReason}). Please choose another day.
                                            </p>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                No available slots on this date (note: same-day bookings require at least 2 hours advance notice).
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Recurring Weekly Option */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                                        <Repeat className="h-4 w-4 text-primary" />
                                        4. Frequency
                                    </label>
                                    <div className="grid grid-cols-3 gap-2.5">
                                        {REPEAT_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.weeks}
                                                type="button"
                                                onClick={() => setRepeatWeeks(opt.weeks)}
                                                className={`py-2 px-3 rounded-lg border text-xs font-bold transition-colors ${
                                                    repeatWeeks === opt.weeks
                                                        ? 'border-gray-900 bg-gray-900 text-white'
                                                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                                                }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Lesson Goal / Notes for Tutor (Optional)
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="e.g., Surah Al-Mulk memorization review, Tajweed practice, or Grade 6 Fractions..."
                                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-3 border"
                                    />
                                </div>

                                {/* Booking Summary */}
                                {selectedSlot && selectedDate && (
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-900">
                                        <p className="font-bold">Booking Summary</p>
                                        <p className="mt-1 text-emerald-800">
                                            {new Date(`${selectedDate}T12:00:00`).toLocaleDateString('en-GB', {
                                                weekday: 'long',
                                                month: 'short',
                                                day: 'numeric',
                                            })}{' '}
                                            • <strong>{selectedSlot} – {selectedEndTime}</strong> ({durationMinutes} min)
                                            {repeatWeeks > 1 && ` • Repeats weekly for ${repeatWeeks} weeks`}
                                        </p>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-gray-100">
                                    <Button
                                        variant="primary"
                                        className="w-full justify-center text-lg h-12"
                                        disabled={!selectedSlot || bookingSubmitting}
                                        onClick={handleBook}
                                    >
                                        {bookingSubmitting
                                            ? 'Confirming...'
                                            : repeatWeeks > 1
                                                ? `Confirm ${repeatWeeks} Weekly Sessions`
                                                : 'Confirm Booking'}
                                    </Button>
                                    <p className="mt-3 text-xs text-center text-gray-500">
                                        By booking, you agree to our cancellation policy. Minimum 2 hours advance notice applies.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookSession;
