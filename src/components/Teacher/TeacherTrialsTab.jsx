import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Loader2, Mail, Phone, Calendar, User, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const TeacherTrialsTab = () => {
    const [trials, setTrials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        fetchTrials();
    }, []);

    const fetchTrials = async () => {
        setLoading(true);
        const { data, error } = await api.trials.getAll();
        if (!error && data) {
            setTrials(data);
        }
        setLoading(false);
    };

    const handleUpdateStatus = async (id, status) => {
        setActionLoading(id);
        try {
            await api.trials.updateStatus(id, status);
            await fetchTrials();
        } catch (error) {
            console.error('Error updating trial status:', error);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-20">
                <Loader2 size={40} className="animate-spin text-primary" />
            </div>
        );
    }

    if (trials.length === 0) {
        return (
            <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-300">
                <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar size={40} />
                </div>
                <h3 className="text-xl font-bold text-gray-700">No trial requests yet</h3>
                <p className="text-gray-500 max-w-sm mx-auto">When parents fill out the trial form on the home page, they will appear here for you to contact.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trials.map((trial) => (
                <motion.div 
                    layout
                    key={trial.id} 
                    className="bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all p-6 relative overflow-hidden"
                >
                    <div className={`absolute top-0 right-0 w-2 h-full ${
                        trial.status === 'pending' ? 'bg-yellow-400' :
                        trial.status === 'contacted' ? 'bg-blue-400' :
                        'bg-green-400'
                    }`} />

                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-gray-50 rounded-2xl">
                            <User className="text-gray-400" size={24} />
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                            trial.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            trial.status === 'contacted' ? 'bg-blue-100 text-blue-700' :
                            'bg-green-100 text-green-700'
                        }`}>
                            {trial.status}
                        </span>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div>
                            <h3 className="text-lg font-black text-gray-900">{trial.parent_name}</h3>
                            <p className="text-sm text-gray-500">Student: {trial.student_name} ({trial.grade_level})</p>
                        </div>
                        
                        <div className="space-y-2">
                            <a href={`mailto:${trial.email}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors">
                                <Mail size={16} /> {trial.email}
                            </a>
                            <a href={`tel:${trial.phone}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors">
                                <Phone size={16} /> {trial.phone}
                            </a>
                        </div>

                        <div className="bg-primary/5 p-3 rounded-xl border border-primary/10">
                            <p className="text-xs font-bold text-primary uppercase mb-1">Subject Interest</p>
                            <p className="text-sm font-bold text-gray-700">{trial.subject || 'Not specified'}</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {trial.status === 'pending' && (
                            <button 
                                onClick={() => handleUpdateStatus(trial.id, 'contacted')}
                                disabled={actionLoading === trial.id}
                                className="flex-1 bg-blue-600 text-white text-sm font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                            >
                                {actionLoading === trial.id ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
                                Mark Contacted
                            </button>
                        )}
                        {trial.status !== 'completed' && (
                            <button 
                                onClick={() => handleUpdateStatus(trial.id, 'completed')}
                                disabled={actionLoading === trial.id}
                                className="flex-1 bg-green-600 text-white text-sm font-bold py-3 rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={16} /> Mark Completed
                            </button>
                        )}
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

export default TeacherTrialsTab;
