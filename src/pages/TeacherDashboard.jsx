import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Users, BookOpen, LogOut, Loader2, Calendar, TrendingUp, Clock, Shield, Play, Copy, CheckCheck, XCircle } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import CreateClassModal from '../components/Teacher/CreateClassModal';
import StartSessionModal from '../components/Teacher/StartSessionModal';
import TeacherLessonsTab from '../components/Teacher/TeacherLessonsTab';
import TeacherClassesTab from '../components/Teacher/TeacherClassesTab';
import TeacherBookingsTab from '../components/Teacher/TeacherBookingsTab';
import TeacherInsightsTab from '../components/Teacher/TeacherInsightsTab';
import TeacherTrialsTab from '../components/Teacher/TeacherTrialsTab';

const VALID_TEACHER_TABS = ['lessons', 'classes', 'bookings', 'trials', 'insights'];

const TeacherDashboard = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user, isAdmin, signOut } = useAuth();
    const [lessons, setLessons] = useState([]);
    const [classes, setClasses] = useState([]);
    const [activeSessions, setActiveSessions] = useState([]);
    const [copiedCodeId, setCopiedCodeId] = useState(null);
    const [loading, setLoading] = useState(true);
    const initialTab = VALID_TEACHER_TABS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'lessons';
    const [activeTab, setActiveTab] = useState(initialTab);
    const [showCreateClassModal, setShowCreateClassModal] = useState(false);
    const [startSessionLesson, setStartSessionLesson] = useState(null);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setSearchParams({ tab }, { replace: true });
    };

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [lessonsRes, classesRes, activeRes] = await Promise.all([
                api.lessons.getAll(),
                api.classes.getAll(),
                api.sessions.getActiveList(),
            ]);
            setLessons(lessonsRes.data || []);
            setClasses(classesRes.data || []);
            setActiveSessions(activeRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const handleEndActiveSession = async (sessionId) => {
        try {
            await api.sessions.end(sessionId);
            setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
        } catch (err) {
            console.error('Failed to end session:', err);
        }
    };

    const handleCopyStudentLink = (sess) => {
        navigator.clipboard.writeText(`${window.location.origin}/join?code=${sess.code}`);
        setCopiedCodeId(sess.id);
        setTimeout(() => setCopiedCodeId(null), 2000);
    };

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleCreateLesson = () => navigate(`/teacher/lesson/new-${Date.now()}`);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Modals */}
            {showCreateClassModal && (
                <CreateClassModal
                    onClose={() => setShowCreateClassModal(false)}
                    onCreated={(newClass) => setClasses(prev => [newClass, ...prev])}
                />
            )}
            {startSessionLesson && (
                <StartSessionModal
                    lesson={startSessionLesson}
                    onClose={() => setStartSessionLesson(null)}
                />
            )}

            <div className="max-w-7xl mx-auto p-8">
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Teacher Dashboard</h1>
                        <p className="text-lg text-gray-600 mt-1">Manage your interactive lessons and student classes.</p>
                    </div>
                    <div className="flex gap-3 items-center">
                        {isAdmin && (
                            <button
                                onClick={() => navigate('/admin/dashboard')}
                                className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl hover:bg-gray-800 font-bold text-sm transition-all"
                            >
                                <Shield size={16} className="text-primary" />
                                Admin Panel
                            </button>
                        )}
                        {signOut && (
                            <button
                                onClick={signOut}
                                className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                title="Sign Out"
                            >
                                <LogOut size={20} />
                            </button>
                        )}
                        <button
                            onClick={() => setShowCreateClassModal(true)}
                            className="flex items-center gap-2 bg-white text-gray-800 border-2 border-primary px-5 py-2.5 rounded-xl hover:bg-yellow-50 font-bold transition-all"
                            style={{ borderBottom: '4px solid #CA8A04' }}
                        >
                            <Users size={18} className="text-primary" />
                            New Class
                        </button>
                        <button
                            onClick={handleCreateLesson}
                            className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl hover:bg-yellow-600 font-bold transition-all shadow-sm"
                            style={{ borderBottom: '4px solid #CA8A04' }}
                        >
                            <Plus size={18} />
                            Create Lesson
                        </button>
                    </div>
                </header>

                {/* Active Live Sessions Bar */}
                {activeSessions.length > 0 && (
                    <div className="mb-8 space-y-3">
                        {activeSessions.map((sess) => (
                            <div
                                key={sess.id}
                                className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-2xl p-5 shadow-md border border-emerald-700 flex flex-col md:flex-row md:items-center justify-between gap-4"
                            >
                                <div className="flex items-center gap-3.5">
                                    <span className="flex h-3.5 w-3.5 relative shrink-0">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400"></span>
                                    </span>
                                    <div>
                                        <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-300">
                                            Active Live Classroom
                                        </span>
                                        <h3 className="text-lg font-black text-white">
                                            {sess.lessons?.title || 'Live Interactive Session'}
                                            <span className="ml-3 text-xs font-mono bg-emerald-950/70 text-yellow-300 px-2.5 py-1 rounded-lg">
                                                Code: {sess.code}
                                            </span>
                                        </h3>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <button
                                        onClick={() => handleCopyStudentLink(sess)}
                                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
                                    >
                                        {copiedCodeId === sess.id ? <CheckCheck size={15} className="text-emerald-300" /> : <Copy size={15} />}
                                        {copiedCodeId === sess.id ? 'Link Copied!' : 'Copy Student Link'}
                                    </button>
                                    <button
                                        onClick={() => navigate(`/classroom/host/${sess.id}`)}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-gray-950 text-xs font-black shadow transition-colors"
                                    >
                                        <Play size={15} fill="currentColor" />
                                        Resume Classroom
                                    </button>
                                    <button
                                        onClick={() => handleEndActiveSession(sess.id)}
                                        className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-200 text-xs font-bold transition-colors"
                                        title="End this live session"
                                    >
                                        <XCircle size={15} />
                                        End
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-8">
                    {[
                        { key: 'lessons', label: 'My Lessons', icon: BookOpen },
                        { key: 'classes', label: 'My Classes', icon: Users },
                        { key: 'bookings', label: 'My Bookings', icon: Calendar },
                        { key: 'trials', label: 'Trial Requests', icon: Clock },
                        { key: 'insights', label: 'Insights', icon: TrendingUp },
                    ].map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => handleTabChange(key)}
                            className={`py-4 px-8 font-bold text-lg border-b-4 transition-colors flex items-center gap-2 ${activeTab === key
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <Icon size={20} /> {label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 size={40} className="animate-spin text-primary" />
                    </div>
                ) : (
                    <>
                        {activeTab === 'lessons' && (
                            <TeacherLessonsTab
                                lessons={lessons}
                                setLessons={setLessons}
                                setStartSessionLesson={setStartSessionLesson}
                                user={user}
                            />
                        )}
                        {activeTab === 'classes' && (
                            <TeacherClassesTab
                                classes={classes}
                                setClasses={setClasses}
                                setShowCreateClassModal={setShowCreateClassModal}
                            />
                        )}
                        {activeTab === 'bookings' && (
                            <TeacherBookingsTab user={user} />
                        )}
                        {activeTab === 'insights' && (
                            <TeacherInsightsTab user={user} />
                        )}
                        {activeTab === 'trials' && (
                            <TeacherTrialsTab />
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default TeacherDashboard;
