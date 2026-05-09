import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Calendar as CalendarIcon, Clock, CheckCircle } from 'lucide-react';
import Button from '../components/Button';

const BookSession = () => {
    const { tutorId } = useParams();
    const { student } = useAuth();
    const navigate = useNavigate();
    const [tutor, setTutor] = useState(null);
    const [availability, setAvailability] = useState([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bookingsubmitting, setBookingSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!tutorId) return;
            setLoading(true);

            // Fetch Tutor Details
            const { data: tutorData, error: tutorError } = await api.tutors.getById(tutorId);

            if (tutorError) {
                console.error('Error fetching tutor:', tutorError);
                setLoading(false);
                return;
            }
            setTutor(tutorData);

            // Fetch Tutor Availability
            const { data: availData, error: availError } = await api.tutorAvailability.getByTutorId(tutorId);

            if (availError) {
                console.error('Error fetching availability:', availError);
            } else {
                setAvailability(availData || []);
            }

            setLoading(false);
        };

        fetchData();
    }, [tutorId]);

    useEffect(() => {
        if (selectedDate && availability.length > 0) {
            generateSlots(selectedDate);
        } else {
            setAvailableSlots([]);
        }
    }, [selectedDate, availability]);

    const generateSlots = async (date) => {
        const dayOfWeek = new Date(date).getDay(); // 0-6
        const schedule = availability.find(s => s.day_of_week === dayOfWeek);

        if (!schedule) {
            setAvailableSlots([]);
            return;
        }

        // Fetch existing bookings for this date to exclude taken slots
        const { data: bookings } = await api.bookings.getTakenSlots(tutorId, date);

        const takenTimes = bookings ? bookings.map(b => b.start_time.slice(0, 5)) : []; // HH:MM

        // Generate 1-hour slots
        const slots = [];
        let current = new Date(`${date}T${schedule.start_time}`);
        const end = new Date(`${date}T${schedule.end_time}`);

        while (current < end) {
            const timeString = current.toTimeString().slice(0, 5);
            // Check if slot is taken
            if (!takenTimes.includes(timeString)) {
                slots.push(timeString);
            }

            // Add 1 hour
            current.setHours(current.getHours() + 1);
        }

        setAvailableSlots(slots);
    };

    const handleBook = async () => {
        if (!selectedSlot || !selectedDate || !student) return;
        setBookingSubmitting(true);

        const startTime = selectedSlot;
        // Calculate end time (assuming 1 hour duration)
        const [hours, minutes] = startTime.split(':').map(Number);
        const endDate = new Date();
        endDate.setHours(hours + 1);
        endDate.setMinutes(minutes);
        const endTime = endDate.toTimeString().slice(0, 5);

        const bookingData = {
            student_id: student.id,
            tutor_id: tutorId,
            booking_date: selectedDate,
            start_time: startTime,
            end_time: endTime,
            status: 'pending'
        };

        const { error } = await api.bookings.create(bookingData);

        setBookingSubmitting(false);

        if (error) {
            alert('Error creating booking: ' + error.message);
        } else {
            // Check if enrollment exists, if not create one
            const { data: enrollment } = await api.enrollments.getOne(student.id, tutorId);

            if (!enrollment) {
                await api.enrollments.create({
                    student_id: student.id,
                    tutor_id: tutorId,
                    status: 'active'
                });
            }

            navigate('/student/dashboard');
        }
    };

    // Helper to get min (today) and max (e.g., 30 days out) dates
    const today = new Date().toISOString().split('T')[0];
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    const maxDateString = maxDate.toISOString().split('T')[0];

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

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="md:flex">
                        {/* Tutor Info Side */}
                        <div className="md:w-1/3 bg-gray-900 p-8 text-white">
                            <div className="mb-6">
                                <img
                                    src={tutor.image_url || 'https://via.placeholder.com/150'}
                                    alt={tutor.name}
                                    className="w-32 h-32 rounded-full object-cover border-4 border-white/20 mx-auto"
                                />
                            </div>
                            <h2 className="text-2xl font-bold text-center mb-2">{tutor.name}</h2>
                            <p className="text-center text-gray-300 mb-6">{tutor.subject}</p>

                            <div className="space-y-4">
                                <div className="flex items-center text-gray-300">
                                    <CheckCircle className="h-5 w-5 mr-3 text-green-400" />
                                    <span>Certified Tutor</span>
                                </div>
                                <div className="flex items-center text-gray-300">
                                    <Clock className="h-5 w-5 mr-3 text-blue-400" />
                                    <span>1 Hour Sessions</span>
                                </div>
                            </div>
                        </div>

                        {/* Booking Form Side */}
                        <div className="md:w-2/3 p-8">
                            <h1 className="text-2xl font-bold text-gray-900 mb-6">Book a Session</h1>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Date
                                    </label>
                                    <div className="relative">
                                        <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="date"
                                            min={today}
                                            max={maxDateString}
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-3 border"
                                        />
                                    </div>
                                </div>

                                {selectedDate && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Available Time Slots
                                        </label>
                                        {availableSlots.length > 0 ? (
                                            <div className="grid grid-cols-3 gap-3">
                                                {availableSlots.map(slot => (
                                                    <button
                                                        key={slot}
                                                        onClick={() => setSelectedSlot(slot)}
                                                        className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${selectedSlot === slot
                                                                ? 'bg-primary text-white shadow-md'
                                                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        {slot}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 italic">No available slots for this date.</p>
                                        )}
                                    </div>
                                )}

                                <div className="pt-6 border-t border-gray-100">
                                    <Button
                                        variant="primary"
                                        className="w-full justify-center text-lg h-12"
                                        disabled={!selectedSlot || bookingsubmitting}
                                        onClick={handleBook}
                                    >
                                        {bookingsubmitting ? 'Confirming...' : 'Confirm Booking'}
                                    </Button>
                                    <p className="mt-4 text-xs text-center text-gray-500">
                                        By booking, you agree to our cancellation policy.
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
