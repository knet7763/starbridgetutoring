import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { BookOpen, LogOut, User, CheckCircle, Clock, Calendar, Video, Sparkles, Award, Book, Printer, X } from 'lucide-react';
import Button from '../components/Button';

const JUZ_AMMA_SURAHS = [
    { num: 1, name: 'Al-Fatihah', arabic: 'الفاتحة' },
    { num: 67, name: 'Al-Mulk', arabic: 'الملك' },
    { num: 87, name: "Al-A'la", arabic: 'الأعلى' },
    { num: 93, name: 'Ad-Duha', arabic: 'الضحى' },
    { num: 94, name: 'Ash-Sharh', arabic: 'الشرح' },
    { num: 95, name: 'At-Tin', arabic: 'التين' },
    { num: 96, name: "Al-'Alaq", arabic: 'العلق' },
    { num: 97, name: 'Al-Qadr', arabic: 'القدر' },
    { num: 99, name: 'Az-Zalzalah', arabic: 'الزلزلة' },
    { num: 101, name: "Al-Qari'ah", arabic: 'القارعة' },
    { num: 102, name: 'At-Takathur', arabic: 'التكاثر' },
    { num: 103, name: "Al-'Asr", arabic: 'العصر' },
    { num: 105, name: 'Al-Fil', arabic: 'الفيل' },
    { num: 106, name: 'Quraysh', arabic: 'قريش' },
    { num: 107, name: "Al-Ma'un", arabic: 'الماعون' },
    { num: 108, name: 'Al-Kawthar', arabic: 'الكوثر' },
    { num: 109, name: 'Al-Kafirun', arabic: 'الكافرون' },
    { num: 110, name: 'An-Nasr', arabic: 'النصر' },
    { num: 111, name: 'Al-Masad', arabic: 'المسد' },
    { num: 112, name: 'Al-Ikhlas', arabic: 'الإخلاص' },
    { num: 113, name: 'Al-Falaq', arabic: 'الفلق' },
    { num: 114, name: 'An-Nas', arabic: 'الناس' },
];

const STATUS_CYCLE = ['not_started', 'memorizing', 'revision', 'mastered'];

const buildStudentCalendarUrl = (booking) => {
    const dateClean = (booking.booking_date || '').replace(/-/g, '');
    const startClean = (booking.start_time || '09:00').slice(0, 5).replace(':', '') + '00';
    const endClean = (booking.end_time || '10:00').slice(0, 5).replace(':', '') + '00';
    const tutorName = booking.tutors?.name || 'StarBridge Tutor';
    const title = encodeURIComponent(`StarBridge Tutoring with ${tutorName} (${booking.tutors?.subject || 'Session'})`);
    const details = encodeURIComponent(`Join from your Student Dashboard: https://starbridgetutors.com/student/dashboard`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateClean}T${startClean}/${dateClean}T${endClean}&details=${details}`;
};

const StudentDashboard = () => {
    const { student, signOut } = useAuth();
    const navigate = useNavigate();
    const [enrollments, setEnrollments] = useState([]);
    const [lessonProgress, setLessonProgress] = useState([]);
    const [upcomingBookings, setUpcomingBookings] = useState([]);
    const [badges, setBadges] = useState([]);
    const [studentStars, setStudentStars] = useState(0);
    const [loading, setLoading] = useState(true);
    const [hifzMap, setHifzMap] = useState({});
    const [showCertificate, setShowCertificate] = useState(false);

    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local Time';

    useEffect(() => {
        if (student) {
            fetchDashboardData();
            try {
                const savedHifz = localStorage.getItem(`sb_hifz_${student.id}`);
                if (savedHifz) setHifzMap(JSON.parse(savedHifz));
            } catch (e) {
                console.warn('Could not load Hifz progress from storage:', e);
            }
        }
    }, [student]);

    const toggleSurahStatus = (surahNum) => {
        setHifzMap(prev => {
            const current = prev[surahNum] || 'not_started';
            const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length];
            const updated = { ...prev, [surahNum]: next };
            if (student?.id) {
                localStorage.setItem(`sb_hifz_${student.id}`, JSON.stringify(updated));
            }
            return updated;
        });
    };

    const fetchDashboardData = async () => {
        setLoading(true);
        await Promise.all([
            fetchEnrollments(),
            fetchLessonProgress(),
            fetchUpcomingBookings(),
            fetchGamificationData(),
        ]);
        setLoading(false);
    };

    const fetchGamificationData = async () => {
        const [statsRes, badgesRes] = await Promise.all([
            api.gamification.getStudentStats(student.id),
            api.gamification.getStudentBadges(student.id)
        ]);
        if (!statsRes.error) setStudentStars(statsRes.data?.stars || 0);
        if (!badgesRes.error) setBadges(badgesRes.data || []);
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
    const masteredSurahsCount = Object.values(hifzMap).filter(s => s === 'mastered').length;

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
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setShowCertificate(true)}
                                className="inline-flex items-center px-4 py-2 border border-yellow-300 rounded-md text-sm font-bold text-yellow-800 bg-yellow-50 hover:bg-yellow-100 transition-colors"
                            >
                                <Award className="h-4 w-4 mr-1.5 text-yellow-600" />
                                My Certificate
                            </button>
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
                                        <p className="text-sm font-medium text-gray-600">Total Stars</p>
                                        <p className="text-3xl font-bold text-yellow-500">{studentStars}</p>
                                    </div>
                                    <Sparkles className="h-12 w-12 text-yellow-400" />
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
                                        <p className="text-sm font-medium text-gray-600">Surahs Mastered</p>
                                        <p className="text-3xl font-bold text-emerald-600">{masteredSurahsCount}/{JUZ_AMMA_SURAHS.length}</p>
                                    </div>
                                    <Book className="h-12 w-12 text-emerald-500" />
                                </div>
                            </div>
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Upcoming ({inProgressLessons} active)</p>
                                        <p className="text-3xl font-bold text-gray-900">{upcomingBookings.length}</p>
                                    </div>
                                    <Calendar className="h-12 w-12 text-purple-500" />
                                </div>
                            </div>
                        </div>

                        {/* Interactive Hifz & Quran Mastery Tracker */}
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-emerald-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        <Book className="text-emerald-600" /> Quran & Hifz Mastery Map
                                    </h2>
                                    <p className="text-xs text-gray-600 mt-0.5">
                                        Click any Surah to update your memorization status (Mastered 🌟 · Memorizing 📖 · Revision 🔄)
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 text-xs font-bold">
                                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">🌟 Mastered</span>
                                    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">📖 Memorizing</span>
                                    <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">🔄 Revision</span>
                                </div>
                            </div>
                            <div className="p-6">
                                {/* Progress Bar */}
                                <div className="mb-5">
                                    <div className="flex justify-between text-xs font-bold text-gray-600 mb-1.5">
                                        <span>Juz&apos; Amma & Core Surahs Progress</span>
                                        <span className="text-emerald-600">{Math.round((masteredSurahsCount / JUZ_AMMA_SURAHS.length) * 100)}% Mastered</span>
                                    </div>
                                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                                            style={{ width: `${Math.round((masteredSurahsCount / JUZ_AMMA_SURAHS.length) * 100)}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                    {JUZ_AMMA_SURAHS.map((s) => {
                                        const status = hifzMap[s.num] || 'not_started';
                                        const badgeStyle =
                                            status === 'mastered'
                                                ? 'border-emerald-400 bg-emerald-50 text-emerald-900 shadow-sm'
                                                : status === 'memorizing'
                                                    ? 'border-amber-300 bg-amber-50 text-amber-900'
                                                    : status === 'revision'
                                                        ? 'border-blue-300 bg-blue-50 text-blue-900'
                                                        : 'border-gray-200 bg-gray-50/60 text-gray-600 hover:border-gray-300';
                                        const icon =
                                            status === 'mastered' ? '🌟' : status === 'memorizing' ? '📖' : status === 'revision' ? '🔄' : '';
                                        return (
                                            <button
                                                key={s.num}
                                                type="button"
                                                onClick={() => toggleSurahStatus(s.num)}
                                                className={`p-3 rounded-xl border-2 text-left transition-all active:scale-95 ${badgeStyle}`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[10px] font-black opacity-60">#{s.num}</span>
                                                    <span className="text-sm">{icon}</span>
                                                </div>
                                                <p className="text-xs font-extrabold truncate">{s.name}</p>
                                                <p className="text-sm font-arabic text-right opacity-80">{s.arabic}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Badges & Achievements */}
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-yellow-50 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Award className="text-yellow-600" /> Badges & Achievements
                                </h2>
                                <button
                                    onClick={() => setShowCertificate(true)}
                                    className="text-xs font-bold text-yellow-700 hover:underline flex items-center gap-1"
                                >
                                    <Printer size={14} /> Print Official Certificate
                                </button>
                            </div>
                            <div className="p-6">
                                {badges.length === 0 ? (
                                    <div className="text-center py-8">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 opacity-40">
                                            <Award size={32} />
                                        </div>
                                        <p className="text-gray-500">No badges earned yet. Keep participating in classes to earn them!</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-6">
                                        {badges.map((sb) => (
                                            <div key={sb.id} className="flex flex-col items-center text-center group">
                                                <div className="relative mb-2">
                                                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-200"></div>
                                                    <div className="relative w-16 h-16 bg-white rounded-full flex items-center justify-center border-2 border-yellow-100 shadow-sm overflow-hidden">
                                                        <img src={sb.badges.icon_url} alt={sb.badges.name} className="w-10 h-10 object-contain" />
                                                    </div>
                                                </div>
                                                <h3 className="text-sm font-bold text-gray-900">{sb.badges.name}</h3>
                                                <p className="text-[10px] text-gray-500 mt-0.5">{new Date(sb.awarded_at).toLocaleDateString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
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
                                        <p className="text-gray-600 mb-4">You&apos;re not enrolled with any tutors yet</p>
                                        <Button to="/tutors">Browse Tutors</Button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {enrollments.map((enrollment) => (
                                            <div key={enrollment.id} className="border rounded-lg p-4 hover:border-primary transition-colors">
                                                <div className="flex items-center justify-between">
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
                                                    <div className="flex flex-col items-end">
                                                        <Button to={`/book/${enrollment.tutor_id}`} variant="secondary" className="text-xs px-3 py-1">
                                                            Book Session
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Lessons & Tutor Feedback */}
                        <div className="bg-white rounded-lg shadow">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-900">Recent Lessons & Tutor Reports</h2>
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
                                            <div key={progress.id} className="border rounded-lg p-4 space-y-2">
                                                <div className="flex items-center justify-between">
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
                                                            <span className="text-sm text-gray-600 font-semibold">{progress.progress_percent}%</span>
                                                        )}
                                                    </div>
                                                </div>
                                                {progress.feedback_notes && (
                                                    <div className="bg-yellow-50/70 border border-yellow-200 rounded-lg p-3 text-xs text-gray-700">
                                                        <span className="font-bold text-yellow-800 uppercase tracking-wider block mb-0.5">Tutor Feedback Report:</span>
                                                        {progress.feedback_notes}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Upcoming Sessions */}
                        <div className="bg-white rounded-lg shadow">
                            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-gray-900">Upcoming Sessions</h2>
                                <span className="text-xs font-medium text-gray-500">🌍 {userTimezone}</span>
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
                                            <div key={booking.id} className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-lg p-4 gap-3">
                                                <div>
                                                    <h3 className="font-medium text-gray-900">{booking.tutors?.name}</h3>
                                                    <p className="text-sm text-gray-600">{booking.tutors?.subject}</p>
                                                    {booking.notes && (
                                                        <p className="text-xs text-gray-400 mt-0.5">{booking.notes}</p>
                                                    )}
                                                </div>
                                                <div className="sm:text-right flex flex-col sm:items-end gap-2">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{new Date(booking.booking_date).toLocaleDateString()}</p>
                                                        <p className="text-sm text-gray-600">{booking.start_time} - {booking.end_time}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <a
                                                            href={buildStudentCalendarUrl(booking)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-gray-200 inline-flex items-center gap-1"
                                                        >
                                                            <Calendar size={12} /> Add to Calendar
                                                        </a>
                                                        {booking.room_url && (
                                                            <button
                                                                onClick={() => navigate(`/meeting/${booking.id}`)}
                                                                className="text-sm bg-primary text-white px-4 py-1.5 rounded-lg font-medium hover:bg-yellow-600 inline-flex items-center gap-1.5"
                                                            >
                                                                <Video size={14} /> Join Meeting
                                                            </button>
                                                        )}
                                                    </div>
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

            {/* Printable Certificate of Excellence Modal */}
            {showCertificate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl relative border-8 border-double border-yellow-400 text-center space-y-6">
                        <button
                            onClick={() => setShowCertificate(false)}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full print:hidden"
                        >
                            <X size={20} />
                        </button>

                        <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto">
                            <Award size={36} />
                        </div>

                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.25em] text-yellow-600">StarBridge Tutoring Academy</p>
                            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mt-1">Certificate of Excellence</h2>
                            <p className="text-sm text-gray-500 mt-2">This certificate is proudly presented to</p>
                        </div>

                        <div className="py-3 border-b-2 border-yellow-200 max-w-md mx-auto">
                            <p className="text-2xl sm:text-3xl font-extrabold text-primary">{student?.full_name || 'StarBridge Scholar'}</p>
                        </div>

                        <p className="text-sm text-gray-600 max-w-lg mx-auto leading-relaxed">
                            In recognition of outstanding dedication, earning <strong className="text-yellow-600">{studentStars} Stars ⭐</strong>,
                            mastering <strong className="text-emerald-600">{masteredSurahsCount} Surahs</strong>, and completing{' '}
                            <strong>{completedLessons} interactive lessons</strong> at StarBridge Tutoring.
                        </p>

                        <div className="flex items-center justify-between pt-6 border-t border-gray-100 text-xs text-gray-500">
                            <div>
                                <p className="font-bold text-gray-800">StarBridge Academic Board</p>
                                <p>starbridgetutors.com</p>
                            </div>
                            <div>
                                <p className="font-bold text-gray-800">Date Issued</p>
                                <p>{new Date().toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div className="pt-2 flex justify-center gap-3 print:hidden">
                            <button
                                onClick={() => window.print()}
                                className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-yellow-600 inline-flex items-center gap-2 shadow-sm"
                            >
                                <Printer size={16} /> Print / Save as PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;
