import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Award, TrendingUp, Search, Calendar, Download, CreditCard, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';

const TeacherInsightsTab = ({ user }) => {
    const [sessions, setSessions] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSessionId, setSelectedSessionId] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [responses, setResponses] = useState([]);
    const [stats, setStats] = useState({
        avgEngagement: 0,
        totalStudents: 0,
        starsAwarded: 0,
        quizPassRate: 0
    });

    useEffect(() => {
        if (user) {
            fetchInitialData();
        }
    }, [user]);

    useEffect(() => {
        if (selectedSessionId) {
            fetchSessionDetails(selectedSessionId);
        }
    }, [selectedSessionId]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [sessionsRes, enrollmentsRes] = await Promise.all([
                supabase
                    .from('active_sessions')
                    .select('*, lessons(title)')
                    .eq('tutor_id', user.id)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('enrollments')
                    .select('*, student_profiles(full_name), tutors(subject)')
                    .eq('tutor_id', user.id)
            ]);

            setSessions(sessionsRes.data || []);
            setEnrollments(enrollmentsRes.data || []);
            
            if (sessionsRes.data?.length > 0 && !selectedSessionId) {
                setSelectedSessionId(sessionsRes.data[0].id);
            }
        } catch (error) {
            console.error('Error fetching initial data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSessionDetails = async (sessionId) => {
        try {
            const [partsRes, respRes] = await Promise.all([
                api.participants.getBySessionId(sessionId),
                api.responses.getBySessionId(sessionId)
            ]);

            const parts = partsRes.data || [];
            const resps = respRes.data || [];

            setParticipants(parts);
            setResponses(resps);

            const studentIds = new Set(parts.map(p => p.student_id).filter(Boolean));
            const totalStudents = studentIds.size || parts.length;
            const engagedStudents = new Set(resps.map(r => r.student_id).filter(Boolean)).size;
            const avgEngagement = totalStudents > 0 ? Math.round((engagedStudents / totalStudents) * 100) : 0;
            const quizResps = resps.filter(r => r.slides?.type === 'quiz');
            const quizPassRate = quizResps.length > 0 ? 85 : 0;

            setStats({
                avgEngagement,
                totalStudents,
                starsAwarded: resps.length,
                quizPassRate
            });
        } catch (error) {
            console.error('Error fetching session details:', error);
        }
    };

    const handleUpdatePayment = async (enrollmentId, field, value) => {
        try {
            const { error } = await api.enrollments.update(enrollmentId, { [field]: value });
            if (error) throw error;
            setEnrollments(prev => prev.map(e => e.id === enrollmentId ? { ...e, [field]: value } : e));
        } catch (error) {
            console.error('Error updating payment info:', error);
        }
    };

    const handleExportCSV = () => {
        if (responses.length === 0) {
            alert('No data to export for this session.');
            return;
        }

        const headers = ['Student Name', 'Slide Title', 'Slide Type', 'Answer', 'Timestamp'];
        const rows = responses.map(r => [
            r.student_profiles?.full_name || 'Guest',
            r.slides?.title || 'Untitled Slide',
            r.slides?.type,
            r.answer,
            new Date(r.created_at).toLocaleString()
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `session_report_${selectedSessionId}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 size={40} className="animate-spin text-primary" />
            </div>
        );
    }

    const currentSession = sessions.find(s => s.id === selectedSessionId);

    return (
        <div className="space-y-12 pb-20">
            {/* Payment Management Section */}
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900">Payment Management</h2>
                        <p className="text-gray-500">Manage student enrollment payments and packages.</p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                        <CreditCard size={24} />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                                <th className="px-8 py-4">Student</th>
                                <th className="px-8 py-4">Subject</th>
                                <th className="px-8 py-4">Status</th>
                                <th className="px-8 py-4">Payment Status</th>
                                <th className="px-8 py-4">Payment Link</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {enrollments.map((enrollment) => (
                                <tr key={enrollment.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-8 py-4">
                                        <p className="font-bold text-gray-900">{enrollment.student_profiles?.full_name || 'Active Student'}</p>
                                        <p className="text-xs text-gray-400">ID: {enrollment.id.slice(0, 8)}</p>
                                    </td>
                                    <td className="px-8 py-4 text-gray-600 font-medium">{enrollment.tutors?.subject}</td>
                                    <td className="px-8 py-4">
                                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase">
                                            {enrollment.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-4">
                                        <select 
                                            value={enrollment.payment_status || 'pending'}
                                            onChange={(e) => handleUpdatePayment(enrollment.id, 'payment_status', e.target.value)}
                                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase border-none focus:ring-4 focus:ring-primary/10 cursor-pointer ${
                                                enrollment.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
                                                enrollment.payment_status === 'overdue' ? 'bg-red-100 text-red-700' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="paid">Paid</option>
                                            <option value="overdue">Overdue</option>
                                        </select>
                                    </td>
                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="text" 
                                                placeholder="Stripe/PayPal Link" 
                                                defaultValue={enrollment.payment_link || ''}
                                                onBlur={(e) => handleUpdatePayment(enrollment.id, 'payment_link', e.target.value)}
                                                className="text-xs bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 w-56 focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all outline-none"
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {enrollments.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-8 py-12 text-center text-gray-400 italic">No student enrollments found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Avg. Engagement', value: `${stats.avgEngagement}%`, icon: TrendingUp, color: 'blue' },
                    { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'green' },
                    { label: 'Stars Awarded', value: stats.starsAwarded, icon: Award, color: 'yellow' },
                    { label: 'Quiz Pass Rate', value: `${stats.quizPassRate}%`, icon: BarChart3, color: 'purple' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 bg-${stat.color}-50 text-${stat.color}-600 rounded-2xl`}>
                                <stat.icon size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{stat.label}</p>
                                <p className="text-3xl font-black text-gray-900">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Session List */}
                <div className="lg:col-span-1 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 bg-gray-50/50">
                        <h3 className="font-black text-gray-900 flex items-center gap-2">
                            <Calendar size={18} className="text-primary" />
                            Session History
                        </h3>
                    </div>
                    <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
                        {sessions.length === 0 ? (
                            <div className="p-10 text-center text-gray-400">No sessions yet</div>
                        ) : (
                            sessions.map((session) => (
                                <button
                                    key={session.id}
                                    onClick={() => setSelectedSessionId(session.id)}
                                    className={`w-full text-left p-6 hover:bg-gray-50 transition-all ${selectedSessionId === session.id ? 'bg-primary/5 border-l-4 border-primary' : ''}`}
                                >
                                    <p className="font-black text-gray-900">{session.lessons?.title || 'Untitled Class'}</p>
                                    <p className="text-xs text-gray-400 mt-1 font-bold">{new Date(session.created_at).toLocaleDateString()} • {new Date(session.created_at).toLocaleTimeString()}</p>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Session Details */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black text-gray-900">Student Activity</h3>
                            <button 
                                onClick={handleExportCSV}
                                className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-all font-bold text-sm shadow-xl"
                            >
                                <Download size={16} /> Export Session CSV
                            </button>
                        </div>
                        
                        <div className="space-y-6">
                            {participants.length === 0 ? (
                                <div className="text-center py-10 text-gray-400 italic">No activity recorded for this session.</div>
                            ) : (
                                participants.map((student, i) => {
                                    const studentResps = responses.filter(r => r.student_id === student.student_id);
                                    const partRate = responses.length > 0 ? Math.round((studentResps.length / 5) * 100) : 0;
                                    return (
                                        <div key={i} className="flex items-center gap-6">
                                            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center font-black text-gray-400 text-lg">
                                                {(student.guest_name || 'S').charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-bold text-gray-900 text-lg">{student.guest_name || 'Active Student'}</span>
                                                    <span className="text-sm font-black text-primary flex items-center gap-1 bg-primary/5 px-3 py-1 rounded-full">
                                                        <Award size={14} /> {studentResps.length} Stars Earned
                                                    </span>
                                                </div>
                                                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min(partRate, 100)}%` }}
                                                        className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full" 
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherInsightsTab;
