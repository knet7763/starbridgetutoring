import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Users, FileText, LogOut, Clock } from 'lucide-react';
import AdminTutorsTab from '../components/Admin/AdminTutorsTab';
import AdminLessonsTab from '../components/Admin/AdminLessonsTab';
import AdminAvailabilityTab from '../components/Admin/AdminAvailabilityTab';

const AdminDashboard = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('tutors');
    const [tutors, setTutors] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTutors();
        fetchLessons();
    }, []);

    const fetchTutors = async () => {
        setLoading(true);
        const { data, error } = await api.tutors.getAll();
        if (!error) setTutors(data || []);
        setLoading(false);
    };

    const fetchLessons = async () => {
        setLoading(true);
        const { data, error } = await api.lessons.getAll();
        if (!error) setLessons(data || []);
        setLoading(false);
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
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('tutors')}
                            className={`${activeTab === 'tutors'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                        >
                            <Users className="h-5 w-5 mr-2" />
                            Tutors ({tutors.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('lessons')}
                            className={`${activeTab === 'lessons'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                        >
                            <FileText className="h-5 w-5 mr-2" />
                            Lessons ({lessons.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('availability')}
                            className={`${activeTab === 'availability'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                        >
                            <Clock className="h-5 w-5 mr-2" />
                            Availability
                        </button>
                    </nav>
                </div>

                {/* Content */}
                <div className="mt-8">
                    {activeTab === 'tutors' && (
                        <AdminTutorsTab tutors={tutors} loading={loading} fetchTutors={fetchTutors} />
                    )}
                    {activeTab === 'lessons' && (
                        <AdminLessonsTab lessons={lessons} loading={loading} fetchLessons={fetchLessons} />
                    )}
                    {activeTab === 'availability' && (
                        <AdminAvailabilityTab tutors={tutors} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
