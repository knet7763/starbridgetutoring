import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, User } from 'lucide-react';
import { api } from '../services/api';

const JoinClass = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState('code'); // 'code' | 'name'
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [sessionId, setSessionId] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Step 1: validate code
    const handleCodeSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (code.trim().length < 6) {
            setError('Please enter a valid 6-character code.');
            return;
        }
        setLoading(true);
        try {
            const { data, error: dbErr } = await api.sessions.getByCode(code.trim().toUpperCase());

            if (dbErr || !data) throw new Error('Session not found.');
            if (!data.is_active) throw new Error('This session has ended.');

            setSessionId(data.id);
            setStep('name');
        } catch (err) {
            setError(err.message || 'Invalid code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: register name and enter
    const handleNameSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!name.trim()) {
            setError('Please enter your name.');
            return;
        }
        setLoading(true);
        try {
            const { error: participantError } = await api.participants.join({ session_id: sessionId, guest_name: name.trim() });

            // Non-fatal: participant insert may fail if RLS is strict; still allow entry
            if (participantError) {
                console.warn('Could not register participant:', participantError.message);
            }

            navigate(`/classroom/join/${sessionId}`, { state: { guestName: name.trim() } });
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-yellow-50 via-white to-amber-50 p-4">
            {/* Brand */}
            <div className="mb-10 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl shadow-lg mb-4">
                    <BookOpen size={32} className="text-white" />
                </div>
                <h1 className="text-4xl font-extrabold text-gray-900">StarBridgeTutoring</h1>
                <p className="text-gray-500 mt-2">Enter your teacher's code to join the live classroom.</p>
            </div>

            <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 border border-gray-100">

                {/* Step indicator */}
                <div className="flex items-center gap-2 mb-6">
                    {['code', 'name'].map((s, i) => (
                        <React.Fragment key={s}>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step === s || (i === 0 && step === 'name') ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                                {i + 1}
                            </div>
                            {i < 1 && <div className={`flex-1 h-1 rounded-full transition-colors ${step === 'name' ? 'bg-primary' : 'bg-gray-100'}`} />}
                        </React.Fragment>
                    ))}
                </div>

                {step === 'code' ? (
                    <form onSubmit={handleCodeSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="code" className="block text-sm font-semibold text-gray-700 mb-2">
                                Class Code
                            </label>
                            <input
                                type="text"
                                id="code"
                                value={code}
                                onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }}
                                placeholder="A1B2C3"
                                maxLength={6}
                                disabled={loading}
                                autoFocus
                                className="block w-full px-4 py-4 text-center text-3xl font-mono tracking-widest border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-yellow-100 focus:border-primary outline-none uppercase placeholder-gray-200 disabled:bg-gray-50 transition-all"
                            />
                            {error && <p className="mt-2 text-sm text-red-500 text-center font-medium">{error}</p>}
                        </div>
                        <button
                            type="submit"
                            disabled={loading || code.length < 6}
                            className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3.5 rounded-xl text-base font-bold hover:bg-yellow-600 transition-all shadow-md shadow-yellow-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Checking...' : 'Next'}
                            {!loading && <ArrowRight size={18} />}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleNameSubmit} className="space-y-5">
                        <div>
                            <button
                                type="button"
                                onClick={() => { setStep('code'); setError(''); }}
                                className="text-sm text-gray-400 hover:text-gray-600 mb-3 flex items-center gap-1"
                            >
                                ← Change code
                            </button>
                            <div className="bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-2 mb-4 flex items-center justify-center gap-2">
                                <span className="text-xs font-semibold text-yellow-700 uppercase tracking-wider">Code:</span>
                                <span className="text-xl font-black font-mono text-yellow-800 tracking-widest">{code}</span>
                            </div>
                            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                                Your Name
                            </label>
                            <div className="relative">
                                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                                <input
                                    type="text"
                                    id="name"
                                    value={name}
                                    onChange={(e) => { setName(e.target.value); setError(''); }}
                                    placeholder="e.g., Fatima Al-Sayed"
                                    maxLength={50}
                                    disabled={loading}
                                    autoFocus
                                    className="block w-full pl-11 pr-4 py-3.5 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-yellow-100 focus:border-primary outline-none disabled:bg-gray-50 transition-all"
                                />
                            </div>
                            {error && <p className="mt-2 text-sm text-red-500 font-medium">{error}</p>}
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !name.trim()}
                            className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3.5 rounded-xl text-base font-bold hover:bg-yellow-600 transition-all shadow-md shadow-yellow-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Joining...' : 'Enter Classroom'}
                            {!loading && <ArrowRight size={18} />}
                        </button>
                    </form>
                )}
            </div>

            <p className="mt-8 text-sm text-gray-400">
                Are you a teacher?{' '}
                <a href="/login" className="text-primary hover:text-yellow-700 font-semibold">Log in here</a>
            </p>
        </div>
    );
};

export default JoinClass;
