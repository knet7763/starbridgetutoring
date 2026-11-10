import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Users, FileText, LogOut, Clock, Calendar, Play, Copy, CheckCheck, XCircle, Settings, Save } from 'lucide-react';
import AdminTutorsTab from '../components/Admin/AdminTutorsTab';
import AdminLessonsTab from '../components/Admin/AdminLessonsTab';
import AdminAvailabilityTab from '../components/Admin/AdminAvailabilityTab';
import TeacherTrialsTab from '../components/Teacher/TeacherTrialsTab';

const VALID_ADMIN_TABS = ['tutors', 'lessons', 'availability', 'trials', 'settings'];

const AdminDashboard = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = VALID_ADMIN_TABS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'tutors';
    const [activeTab, setActiveTab] = useState(initialTab);
    const [tutors, setTutors] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [activeSessions, setActiveSessions] = useState([]);
    const [copiedCodeId, setCopiedCodeId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [siteSettings, setSiteSettings] = useState({
        admin_email: 'knet7763@gmail.com',
        support_email: 'support@starbridgetutors.com',
        support_phone: '+254 700 000 000',
        whatsapp_number: '+254 700 000 000',
    });
    const [savingSettings, setSavingSettings] = useState(false);
    const [settingsSaved, setSettingsSaved] = useState(false);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setSearchParams({ tab }, { replace: true });
    };

    useEffect(() => {
        const loadDashboard = async () => {
            setLoading(true);
            await Promise.all([fetchTutors(), fetchLessons(), fetchActiveSessions(), fetchSiteSettings()]);
            setLoading(false);
        };
        loadDashboard();
    }, []);

    const fetchSiteSettings = async () => {
        const s = await api.settings.getSiteSettings();
        if (s) setSiteSettings(s);
    };

    const handleSaveSiteSettings = async (e) => {
        e.preventDefault();
        setSavingSettings(true);
        setSettingsSaved(false);
        try {
            await api.settings.saveSiteSettings(siteSettings);
            setSettingsSaved(true);
            setTimeout(() => setSettingsSaved(false), 3000);
        } catch (err) {
            console.error('Failed to save site settings:', err);
        } finally {
            setSavingSettings(false);
        }
    };

    const fetchActiveSessions = async () => {
        const { data, error } = await api.sessions.getActiveList();
        if (!error) setActiveSessions(data || []);
    };

    const handleEndActiveSession = async (sessionId) => {
        await api.sessions.end(sessionId);
        setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
    };

    const handleCopyStudentLink = (sess) => {
        navigator.clipboard.writeText(`${window.location.origin}/join?code=${sess.code}`);
        setCopiedCodeId(sess.id);
        setTimeout(() => setCopiedCodeId(null), 2000);
    };

    const fetchTutors = async () => {
        const { data, error } = await api.tutors.getAll();
        if (!error) setTutors(data || []);
    };

    const fetchLessons = async () => {
        const { data, error } = await api.lessons.getAll();
        if (!error) setLessons(data || []);
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/admin/login');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center">
                            <BookOpen className="h-8 w-8 text-primary mr-3" />
                            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/teacher/dashboard')}
                                className="inline-flex items-center px-4 py-2 border border-primary/30 rounded-md text-sm font-bold text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
                            >
                                Teacher Portal
                            </button>
                            <span className="text-sm text-gray-600">{user?.email}</span>
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

            {/* Tabs */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                {activeSessions.length > 0 && (
                    <div className="mb-6 space-y-3">
                        {activeSessions.map((sess) => (
                            <div
                                key={sess.id}
                                className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-xl p-4 shadow border border-emerald-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="flex h-3 w-3 relative shrink-0">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
                                    </span>
                                    <div>
                                        <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-300">
                                            Active Live Classroom
                                        </span>
                                        <p className="text-base font-bold text-white">
                                            {sess.lessons?.title || 'Live Interactive Session'}
                                            <span className="ml-2 text-xs font-mono bg-emerald-950/70 text-yellow-300 px-2 py-0.5 rounded">
                                                Code: {sess.code}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        onClick={() => handleCopyStudentLink(sess)}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white"
                                    >
                                        {copiedCodeId === sess.id ? <CheckCheck size={14} className="text-emerald-300" /> : <Copy size={14} />}
                                        {copiedCodeId === sess.id ? 'Link Copied!' : 'Copy Student Link'}
                                    </button>
                                    <button
                                        onClick={() => navigate(`/classroom/host/${sess.id}`)}
                                        className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-gray-950 text-xs font-black"
                                    >
                                        <Play size={14} fill="currentColor" />
                                        Resume Classroom
                                    </button>
                                    <button
                                        onClick={() => handleEndActiveSession(sess.id)}
                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-200 text-xs font-bold"
                                    >
                                        <XCircle size={14} />
                                        End
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => handleTabChange('tutors')}
                            className={`${activeTab === 'tutors'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                        >
                            <Users className="h-5 w-5 mr-2" />
                            Tutors ({tutors.length})
                        </button>
                        <button
                            onClick={() => handleTabChange('lessons')}
                            className={`${activeTab === 'lessons'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                        >
                            <FileText className="h-5 w-5 mr-2" />
                            Lessons ({lessons.length})
                        </button>
                        <button
                            onClick={() => handleTabChange('availability')}
                            className={`${activeTab === 'availability'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                        >
                            <Clock className="h-5 w-5 mr-2" />
                            Availability
                        </button>
                        <button
                            onClick={() => handleTabChange('trials')}
                            className={`${activeTab === 'trials'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                        >
                            <Calendar className="h-5 w-5 mr-2" />
                            Trial Requests
                        </button>
                        <button
                            onClick={() => handleTabChange('settings')}
                            className={`${activeTab === 'settings'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                        >
                            <Settings className="h-5 w-5 mr-2" />
                            Site Settings
                        </button>
                    </nav>
                </div>

                {/* Content */}
                <div className="mt-8 pb-16">
                    {activeTab === 'tutors' && (
                        <AdminTutorsTab tutors={tutors} loading={loading} fetchTutors={fetchTutors} />
                    )}
                    {activeTab === 'lessons' && (
                        <AdminLessonsTab lessons={lessons} loading={loading} fetchLessons={fetchLessons} />
                    )}
                    {activeTab === 'availability' && (
                        <AdminAvailabilityTab tutors={tutors} />
                    )}
                    {activeTab === 'trials' && (
                        <TeacherTrialsTab />
                    )}
                    {activeTab === 'settings' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-2xl">
                            <h2 className="text-xl font-bold text-gray-900 mb-1">Site & Contact Settings</h2>
                            <p className="text-sm text-gray-500 mb-6">
                                Configure where trial & contact email alerts are delivered and update the WhatsApp and phone numbers shown on your Contact page and Footer.
                            </p>
                            <form onSubmit={handleSaveSiteSettings} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Admin Notification Email (Trial & Contact Alerts)
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={siteSettings.admin_email}
                                        onChange={(e) => setSiteSettings({ ...siteSettings, admin_email: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Public Support Email (Shown on Contact Page & Footer)
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={siteSettings.support_email}
                                        onChange={(e) => setSiteSettings({ ...siteSettings, support_email: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            WhatsApp Number (with country code)
                                        </label>
                                        <input
                                            type="text"
                                            value={siteSettings.whatsapp_number}
                                            onChange={(e) => setSiteSettings({ ...siteSettings, whatsapp_number: e.target.value })}
                                            placeholder="+254 700 000 000"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            Support Phone Number
                                        </label>
                                        <input
                                            type="text"
                                            value={siteSettings.support_phone}
                                            onChange={(e) => setSiteSettings({ ...siteSettings, support_phone: e.target.value })}
                                            placeholder="+254 700 000 000"
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 pt-2">
                                    <button
                                        type="submit"
                                        disabled={savingSettings}
                                        className="inline-flex items-center gap-2 bg-primary hover:bg-yellow-600 text-white font-bold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50"
                                    >
                                        <Save size={16} />
                                        {savingSettings ? 'Saving...' : 'Save Settings'}
                                    </button>
                                    {settingsSaved && (
                                        <span className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                                            <CheckCheck size={16} /> Settings saved!
                                        </span>
                                    )}
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
