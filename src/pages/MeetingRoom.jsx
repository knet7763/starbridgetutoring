import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, ArrowLeft, Video, VideoOff, Mic, MicOff, MonitorUp, LogOut, Layout, Edit3, Wifi } from 'lucide-react';
import { DailyProvider } from '@daily-co/daily-react';
import { useVideoRoom } from '../hooks/useVideoRoom';
import MeetingVideo from '../components/Classroom/MeetingVideo';
import Board from '../components/Whiteboard/Board';

const MeetingRoom = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const { user, student, loading: authLoading } = useAuth();

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTool, setActiveTool] = useState('video'); // 'video' or 'split'

    const {
        callObject,
        isJoined,
        isConnecting,
        error: videoError,
        joinRoom,
        leaveRoom,
        toggleVideo,
        toggleAudio,
        toggleScreenShare,
        isScreenSharing,
    } = useVideoRoom();

    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isAudioOn, setIsAudioOn] = useState(true);

    // Guard: prevent joinRoom from being called more than once
    const hasJoinedRef = useRef(false);

    const handleToggleVideo = () => {
        setIsVideoOn(prev => !prev);
        toggleVideo();
    };

    const handleToggleAudio = () => {
        setIsAudioOn(prev => !prev);
        toggleAudio();
    };

    useEffect(() => {
        if (!bookingId) return;
        if (authLoading) return;

        const fetchBookingAndJoin = async () => {
            setLoading(true);
            try {
                const { data, error: fetchError } = await supabase
                    .from('bookings')
                    .select('*, tutors(name, subject), students(name)')
                    .eq('id', bookingId)
                    .single();

                if (fetchError || !data) {
                    setError('Meeting not found or you do not have permission.');
                    return;
                }

                if (!data.room_url) {
                    setError('The meeting room has not been created yet. Please wait for the tutor to confirm the session.');
                    return;
                }

                setBooking(data);

                // Resolve display name: tutor uses user_metadata, student uses profile
                const name =
                    user?.user_metadata?.full_name ||
                    student?.full_name ||
                    user?.email ||
                    'Guest';

                // Only join once
                if (!hasJoinedRef.current) {
                    hasJoinedRef.current = true;
                    joinRoom(data.room_url, name);
                }
            } catch (err) {
                console.error(err);
                setError('An unexpected error occurred while loading the room.');
            } finally {
                setLoading(false);
            }
        };

        fetchBookingAndJoin();
    }, [bookingId, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleLeave = async () => {
        if (window.confirm('Leave this session?')) {
            await leaveRoom();
            navigate(-1);
        }
    };

    // ── Loading States ──────────────────────────────────────────────────────────
    if (loading || authLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950">
                <Loader2 className="animate-spin text-primary w-16 h-16 mb-4" />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Initializing Premium Classroom...</p>
            </div>
        );
    }

    if (error || videoError) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 p-4 text-center">
                <div className="bg-white rounded-[2rem] p-10 shadow-2xl max-w-md w-full border-t-8 border-red-500">
                    <div className="text-red-500 mb-6 flex justify-center">
                        <VideoOff className="w-20 h-20" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tighter">Connection Error</h2>
                    <p className="text-gray-600 mb-8 font-medium">{error || videoError}</p>
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

    return (
        <DailyProvider callObject={callObject}>
            <div className="w-screen h-screen bg-gray-950 overflow-hidden flex flex-col">

                {/* Connecting Overlay */}
                {isConnecting && !isJoined && (
                    <div className="absolute inset-0 bg-gray-950/90 backdrop-blur-sm z-[200] flex flex-col items-center justify-center gap-4">
                        <div className="relative">
                            <Wifi className="w-16 h-16 text-primary animate-pulse" />
                            <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-ping" />
                        </div>
                        <p className="text-white font-black text-xl tracking-tight">Connecting to room...</p>
                        <p className="text-gray-400 text-sm">Please allow camera and microphone access if prompted.</p>
                    </div>
                )}

                {/* Unified Header */}
                <header className="bg-gray-900/50 backdrop-blur-xl text-white px-6 py-4 flex justify-between items-center border-b border-white/5 shrink-0 z-50">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-0.5">Live Session</span>
                            <h1 className="font-black text-xl tracking-tighter truncate max-w-sm">
                                {booking?.tutors?.name} • {booking?.tutors?.subject}
                            </h1>
                        </div>
                        <div className="h-8 w-px bg-white/10" />
                        <div className="flex items-center gap-3">
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

                    {/* Live indicator */}
                    <div className="flex items-center gap-4">
                        {isJoined && (
                            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-xl">
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                <span className="text-green-400 text-xs font-black uppercase tracking-widest">Live</span>
                            </div>
                        )}
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
                    {/* Video Section */}
                    <div className={`transition-all duration-500 ease-in-out ${activeTool === 'video' ? 'w-full' : 'w-[400px] border-r border-white/5'}`}>
                        <MeetingVideo />
                    </div>

                    {/* Whiteboard Section */}
                    <div className={`flex-1 bg-white relative transition-all duration-500 ${activeTool === 'video' ? 'opacity-0 translate-x-full pointer-events-none' : 'opacity-100 translate-x-0'}`}>
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

                    {/* Floating Controls */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-gray-900/90 backdrop-blur-2xl px-8 py-4 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 z-[100]">
                        <button
                            onClick={handleToggleAudio}
                            className={`p-4 rounded-2xl transition-all ${isAudioOn ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-red-500 text-white animate-pulse'}`}
                            title={isAudioOn ? 'Mute Microphone' : 'Unmute Microphone'}
                        >
                            {isAudioOn ? <Mic size={24} /> : <MicOff size={24} />}
                        </button>

                        <button
                            onClick={handleToggleVideo}
                            className={`p-4 rounded-2xl transition-all ${isVideoOn ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-red-500 text-white animate-pulse'}`}
                            title={isVideoOn ? 'Turn Camera Off' : 'Turn Camera On'}
                        >
                            {isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
                        </button>

                        <div className="w-px h-10 bg-white/10 mx-2" />

                        <button
                            onClick={toggleScreenShare}
                            className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-sm transition-all ${isScreenSharing ? 'bg-green-500 text-white' : 'bg-white/5 hover:bg-white/10 text-white'}`}
                        >
                            <MonitorUp size={24} />
                            {isScreenSharing ? 'Sharing Screen' : 'Share Screen'}
                        </button>
                    </div>
                </div>
            </div>
        </DailyProvider>
    );
};

export default MeetingRoom;
