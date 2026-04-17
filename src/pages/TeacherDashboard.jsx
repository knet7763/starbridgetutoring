import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, BookOpen, LogOut, Loader2, Calendar } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import CreateClassModal from '../components/Teacher/CreateClassModal';
import StartSessionModal from '../components/Teacher/StartSessionModal';
import TeacherLessonsTab from '../components/Teacher/TeacherLessonsTab';
import TeacherClassesTab from '../components/Teacher/TeacherClassesTab';
import TeacherBookingsTab from '../components/Teacher/TeacherBookingsTab';

const TeacherDashboard = () => {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const [lessons, setLessons] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('lessons');
    const [showCreateClassModal, setShowCreateClassModal] = useState(false);
    const [startSessionLesson, setStartSessionLesson] = useState(null);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [lessonsRes, classesRes] = await Promise.all([
                api.lessons.getAll(),
                api.classes.getAll(),
            ]);
            setLessons(lessonsRes.data || []);
            setClasses(classesRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

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

                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-8">
                    {[
                        { key: 'lessons', label: 'My Lessons', icon: BookOpen },
                        { key: 'classes', label: 'My Classes', icon: Users },
                        { key: 'bookings', label: 'My Bookings', icon: Calendar },
                    ].map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
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
                    </>
                )}
            </div>
        </div>
    );
};

export default TeacherDashboard;
