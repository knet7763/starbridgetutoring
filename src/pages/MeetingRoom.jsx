import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, ArrowLeft, Video, VideoOff, ExternalLink, Layout, Edit3, LogOut } from 'lucide-react';
import Board from '../components/Whiteboard/Board';

const MeetingRoom = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const { user, student, loading: authLoading } = useAuth();

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTool, setActiveTool] = useState('video');

    const displayName = user?.user_metadata?.full_name || student?.full_name || user?.email || 'Guest';

    useEffect(() => {
        if (!bookingId || authLoading) return;

        const fetchBooking = async () => {
            setLoading(true);
            try {
                const { data, error: fetchError } = await supabase
                    .from('bookings')
                    .select('*, tutors(name, subject), students(name)')
                    .eq('id', bookingId)
                    .single();

                if (fetchError || !data) {
                    setError('Meeting not found or you do not have permission to join.');
                    return;
                }

                if (!data.room_url) {
                    setError('The meeting room has not been set up yet. Please wait for the tutor to confirm the session.');
                    return;
                }

                setBooking(data);
            } catch (err) {
                console.error(err);
                setError('An unexpected error occurred while loading the room.');
            } finally {
                setLoading(false);
            }
        };

        fetchBooking();
    }, [bookingId, authLoading]);

    // Build the Jitsi embed URL with the user's display name pre-filled
    const jitsiUrl = booking?.room_url
        ? `${booking.room_url}#userInfo.displayName="${encodeURIComponent(displayName)}"&config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false`
        : null;

    const handleLeave = () => {
        if (window.confirm('Leave this session?')) {
            navigate(-1);
        }
    };

    // ── Loading ──────────────────────────────────────────────────────────────────
    if (loading || authLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950">
                <Loader2 className="animate-spin text-primary w-16 h-16 mb-4" />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Initializing Premium Classroom...</p>
            </div>
        );
    }

    // ── Error ────────────────────────────────────────────────────────────────────
    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 p-4 text-center">
                <div className="bg-white rounded-[2rem] p-10 shadow-2xl max-w-md w-full border-t-8 border-red-500">
                    <div className="text-red-500 mb-6 flex justify-center">
                        <VideoOff className="w-20 h-20" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tighter">Session Unavailable</h2>
                    <p className="text-gray-600 mb-8 font-medium">{error}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center justify-center bg-gray-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-gray-800 w-full transition-all shadow-lg"
                    >
                        <ArrowLeft className="mr-2 w-5 h-5" /> Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // ── Live Room ────────────────────────────────────────────────────────────────
    return (
        <div className="w-screen h-screen bg-gray-950 overflow-hidden flex flex-col">

            {/* Header */}
            <header className="bg-gray-900/50 backdrop-blur-xl text-white px-6 py-4 flex justify-between items-center border-b border-white/5 shrink-0 z-50">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-0.5">Live Session</span>
                        <h1 className="font-black text-xl tracking-tighter truncate max-w-sm">
                            {booking?.tutors?.name} • {booking?.tutors?.subject}
                        </h1>
                    </div>
                    <div className="h-8 w-px bg-white/10" />
                    {/* Layout Toggle */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setActiveTool('video')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTool === 'video' ? 'bg-primary text-white shadow-lg' : 'hover:bg-white/5 text-gray-400'}`}
                        >
                            <Video size={18} /> Video Only
                        </button>
                        <button
                            onClick={() => setActiveTool('split')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTool === 'split' ? 'bg-primary text-white shadow-lg' : 'hover:bg-white/5 text-gray-400'}`}
                        >
                            <Layout size={18} /> Interactive View
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Live indicator */}
                    <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-xl">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-green-400 text-xs font-black uppercase tracking-widest">Live</span>
                    </div>

                    {/* Open in new tab */}
                    <a
                        href={booking?.room_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-sm transition-all"
                        title="Open Jitsi in a new browser tab"
                    >
                        <ExternalLink size={16} /> Open Full Screen
                    </a>

                    <button
                        onClick={handleLeave}
                        className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-6 py-2.5 rounded-2xl font-black text-sm transition-all border border-red-500/20 flex items-center gap-2"
                    >
                        <LogOut size={18} /> Leave Session
                    </button>
                </div>
            </header>

            {/* Classroom Content */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* Video Section — Jitsi Meet Embedded */}
                <div className={`transition-all duration-500 ease-in-out ${activeTool === 'video' ? 'w-full' : 'w-[420px] shrink-0 border-r border-white/5'}`}>
                    {jitsiUrl ? (
                        <iframe
                            src={jitsiUrl}
                            title="Jitsi Meet Video Room"
                            className="w-full h-full"
                            allow="camera *; microphone *; display-capture *; fullscreen *; autoplay *"
                            allowFullScreen
                            style={{ border: 'none', background: '#111827' }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-500">
                            <p>Room not available.</p>
                        </div>
                    )}
                </div>

                {/* Whiteboard Section */}
                <div className={`flex-1 bg-white relative transition-all duration-500 ${activeTool === 'video' ? 'opacity-0 pointer-events-none w-0' : 'opacity-100'}`}>
                    <div className="absolute top-6 left-6 z-10 bg-gray-900/90 backdrop-blur px-4 py-2 rounded-xl border border-white/10 text-white flex items-center gap-2 shadow-2xl">
                        <Edit3 size={16} className="text-primary" />
                        <span className="text-xs font-black uppercase tracking-widest">Shared Interactive Board</span>
                    </div>
                    <Board
                        sessionId={bookingId}
                        readOnly={false}
                        className="w-full h-full"
                    />
                </div>
            </div>
        </div>
    );
};

export default MeetingRoom;
