import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudentAuth } from '../contexts/StudentAuthContext';
import { api } from '../services/api';
import { BookOpen, LogOut, User, CheckCircle, Clock, Calendar } from 'lucide-react';
import Button from '../components/Button';

const StudentDashboard = () => {
    const { student, signOut } = useStudentAuth();
    const navigate = useNavigate();
    const [enrollments, setEnrollments] = useState([]);
    const [lessonProgress, setLessonProgress] = useState([]);
    const [upcomingBookings, setUpcomingBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (student) {
            fetchDashboardData();
        }
    }, [student]);

    const fetchDashboardData = async () => {
        setLoading(true);
        await Promise.all([
            fetchEnrollments(),
            fetchLessonProgress(),
            fetchUpcomingBookings(),
        ]);
        setLoading(false);
    };

    const fetchEnrollments = async () => {
        const { data, error } = await api.enrollments.getByStudentId(student.id);
        if (!error) setEnrollments(data || []);
    };

    const fetchLessonProgress = async () => {
        const { data, error } = await api.lessonProgress.getByStudentId(student.id);
        if (!error) setLessonProgress(data || []);
    };

    const fetchUpcomingBookings = async () => {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await api.bookings.getUpcoming(student.id, today);
        if (!error) setUpcomingBookings(data || []);
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/student/login');
    };

    const completedLessons = lessonProgress.filter(p => p.status === 'completed').length;
    const inProgressLessons = lessonProgress.filter(p => p.status === 'in_progress').length;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center">
                            <BookOpen className="h-8 w-8 text-primary mr-3" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
                                <p className="text-sm text-gray-600">Welcome back, {student?.full_name}!</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Button to="/lessons" variant="secondary">
                                Browse Lessons
                            </Button>
                            <button
                                onClick={handleSignOut}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading your dashboard...</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Stats Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Tutors</p>
                                        <p className="text-3xl font-bold text-gray-900">{enrollments.length}</p>
                                    </div>
                                    <User className="h-12 w-12 text-blue-500" />
                                </div>
                            </div>
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Completed</p>
                                        <p className="text-3xl font-bold text-gray-900">{completedLessons}</p>
                                    </div>
                                    <CheckCircle className="h-12 w-12 text-green-500" />
                                </div>
                            </div>
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">In Progress</p>
                                        <p className="text-3xl font-bold text-gray-900">{inProgressLessons}</p>
                                    </div>
                                    <Clock className="h-12 w-12 text-yellow-500" />
                                </div>
                            </div>
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Upcoming</p>
                                        <p className="text-3xl font-bold text-gray-900">{upcomingBookings.length}</p>
                                    </div>
                                    <Calendar className="h-12 w-12 text-purple-500" />
                                </div>
                            </div>
                        </div>

                        {/* My Tutors */}
                        <div className="bg-white rounded-lg shadow">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-900">My Tutors</h2>
                            </div>
                            <div className="p-6">
                                {enrollments.length === 0 ? (
                                    <div className="text-center py-8">
                                        <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-gray-600 mb-4">You're not enrolled with any tutors yet</p>
                                        <Button to="/tutors">Browse Tutors</Button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {enrollments.map((enrollment) => (
                                            <div key={enrollment.id} className="border rounded-lg p-4 hover:border-primary transition-colors">
                                                <div className="flex items-center space-x-3">
                                                    {enrollment.tutors?.image_url && (
                                                        <img
                                                            src={enrollment.tutors.image_url}
                                                            alt={enrollment.tutors.name}
                                                            className="h-12 w-12 rounded-full object-cover"
                                                        />
                                                    )}
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900">{enrollment.tutors?.name}</h3>
                                                        <p className="text-sm text-gray-600">{enrollment.tutors?.subject}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Lessons */}
                        <div className="bg-white rounded-lg shadow">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-900">Recent Lessons</h2>
                            </div>
                            <div className="p-6">
                                {lessonProgress.length === 0 ? (
                                    <div className="text-center py-8">
                                        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-gray-600 mb-4">No lessons started yet</p>
                                        <Button to="/lessons">Browse Lessons</Button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {lessonProgress.map((progress) => (
                                            <div key={progress.id} className="flex items-center justify-between border rounded-lg p-4">
                                                <div className="flex-1">
                                                    <h3 className="font-medium text-gray-900">{progress.lessons?.title}</h3>
                                                    <p className="text-sm text-gray-600">{progress.lessons?.subject}</p>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${progress.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                        progress.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {progress.status.replace('_', ' ')}
                                                    </span>
                                                    {progress.progress_percent > 0 && (
                                                        <span className="text-sm text-gray-600">{progress.progress_percent}%</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Upcoming Sessions */}
                        <div className="bg-white rounded-lg shadow">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-900">Upcoming Sessions</h2>
                            </div>
                            <div className="p-6">
                                {upcomingBookings.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-gray-600">No upcoming sessions scheduled</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {upcomingBookings.map((booking) => (
                                            <div key={booking.id} className="flex items-center justify-between border rounded-lg p-4">
                                                <div>
                                                    <h3 className="font-medium text-gray-900">{booking.tutors?.name}</h3>
                                                    <p className="text-sm text-gray-600">{booking.tutors?.subject}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium text-gray-900">{new Date(booking.booking_date).toLocaleDateString()}</p>
                                                    <p className="text-sm text-gray-600">{booking.start_time} - {booking.end_time}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentDashboard;
