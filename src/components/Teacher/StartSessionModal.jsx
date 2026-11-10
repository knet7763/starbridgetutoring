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
    const [linkCopied, setLinkCopied] = useState(false);
    const [startError, setStartError] = useState(null);

    const handleStart = async () => {
        setStarting(true);
        setStartError(null);
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
            setStartError(err?.message || 'Could not start live session. Please try again.');
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

    const handleCopyJoinLink = () => {
        const joinUrl = `${window.location.origin}/join?code=${sessionCode.code}`;
        navigator.clipboard.writeText(joinUrl);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
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
                        {startError && (
                            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium text-center">
                                {startError}
                            </div>
                        )}
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
                            <p className="text-gray-500 mt-1 text-sm">Share this code or 1-click link with your students</p>
                        </div>

                        <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-6 mb-4 flex items-center justify-between">
                            <span className="text-4xl font-black tracking-widest font-mono text-gray-900">
                                {sessionCode.code}
                            </span>
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-primary transition-colors"
                            >
                                {copied ? <CheckCheck size={18} className="text-green-500" /> : <Copy size={18} />}
                                {copied ? 'Copied!' : 'Copy Code'}
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 mb-5">
                            <button
                                onClick={handleCopyJoinLink}
                                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 transition-colors"
                            >
                                {linkCopied ? <CheckCheck size={15} className="text-green-500" /> : <Copy size={15} className="text-blue-600" />}
                                {linkCopied ? 'Link Copied!' : 'Copy 1-Click Link'}
                            </button>
                            <a
                                href={`https://wa.me/?text=${encodeURIComponent(`Assalamu Alaikum! Join our live StarBridge class (${lesson.title}) here: ${window.location.origin}/join?code=${sessionCode.code} (Code: ${sessionCode.code})`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition-colors"
                            >
                                WhatsApp Invite
                            </a>
                        </div>

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
