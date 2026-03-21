import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Play, CheckCheck, Copy, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const generateJoinCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

const StartSessionModal = ({ lesson, onClose }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [starting, setStarting] = useState(false);
    const [sessionCode, setSessionCode] = useState(null);
    const [copied, setCopied] = useState(false);

    const handleStart = async () => {
        setStarting(true);
        try {
            const code = generateJoinCode();
            const { data, error } = await api.sessions.start({
                lesson_id: lesson.id,
                tutor_id: user.id,
                code,
                is_active: true,
            });
            if (error) throw error;
            setSessionCode({ code, sessionId: data.id });
        } catch (err) {
            console.error('Error starting session:', err);
        } finally {
            setStarting(false);
        }
    };

    const handleEnterClassroom = () => {
        navigate(`/classroom/host/${sessionCode.sessionId}`);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(sessionCode.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full text-gray-400">
                    <X size={20} />
                </button>

                {!sessionCode ? (
                    <>
                        <div className="text-center mb-6">
                            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Play size={28} className="text-blue-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Start Live Session</h2>
                            <p className="text-gray-500 mt-1 text-sm">
                                Launching: <span className="font-semibold text-gray-700">{lesson.title}</span>
                            </p>
                        </div>
                        <button
                            onClick={handleStart}
                            disabled={starting}
                            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all disabled:opacity-60"
                        >
                            {starting ? <Loader2 size={20} className="animate-spin" /> : <Play size={20} fill="currentColor" />}
                            {starting ? 'Starting...' : 'Launch Session'}
                        </button>
                    </>
                ) : (
                    <>
                        <div className="text-center mb-6">
                            <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <CheckCheck size={28} className="text-green-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Session Ready!</h2>
                            <p className="text-gray-500 mt-1 text-sm">Share this code with your students</p>
                        </div>

                        <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-6 mb-6 flex items-center justify-between">
                            <span className="text-4xl font-black tracking-widest font-mono text-gray-900">
                                {sessionCode.code}
                            </span>
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-primary transition-colors"
                            >
                                {copied ? <CheckCheck size={18} className="text-green-500" /> : <Copy size={18} />}
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                        <p className="text-center text-sm text-gray-500 mb-4">
                            Students go to <span className="font-bold text-primary">starbridgetutor.com/join</span>
                        </p>
                        <button
                            onClick={handleEnterClassroom}
                            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-green-700 transition-all"
                        >
                            <Play size={20} fill="currentColor" />
                            Enter Classroom
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default StartSessionModal;
