import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    ArrowLeft,
    Edit3,
    Layout,
    Loader2,
    LogOut,
    Mic,
    MicOff,
    MonitorUp,
    Video,
    VideoOff,
    User,
} from 'lucide-react';
import Board from '../components/Whiteboard/Board';
import VideoSidebar, { TrackRenderer } from '../components/Classroom/VideoSidebar';
import { useVideoRoom } from '../hooks/useVideoRoom';
import { generateLiveKitToken, generateRoomName } from '../services/videoService';

// Grid tile component for full-screen participant rendering
const ParticipantGridTile = ({ item }) => {
    const { participant, isLocal, displayName } = item;

    // Extract tracks
    const videoTracks = [];
    const audioTracks = [];
    if (participant) {
        participant.videoTracks.forEach((pub) => {
            if (pub.track) {
                videoTracks.push(pub.track);
            }
        });
        participant.audioTracks.forEach((pub) => {
            if (pub.track) {
                audioTracks.push(pub.track);
            }
        });
    }

    const hasVideo = videoTracks.length > 0;
    const hasAudio = audioTracks.length > 0;

    return (
        <div className="relative flex-1 h-full min-h-[300px] rounded-3xl bg-gray-900 border border-white/5 overflow-hidden flex items-center justify-center shadow-2xl group transition-all duration-300 hover:border-primary/25">
            {hasVideo ? (
                videoTracks.map((track) => (
                    <TrackRenderer
                        key={track.sid || track.name}
                        track={track}
                        isVideo
                        isLocal={isLocal}
                    />
                ))
            ) : (
                <div className="flex flex-col items-center justify-center text-gray-500">
                    <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center mb-3 text-4xl shadow-lg border border-gray-700">
                        <User className="w-10 h-10 text-gray-400" />
                    </div>
                    <span className="text-sm font-black uppercase tracking-wider text-gray-400">Camera Off</span>
                    <span className="text-xs text-gray-500 mt-1">{displayName}</span>
                </div>
            )}

            {/* Render audio tracks for remote participants to play their voices */}
            {!isLocal && audioTracks.map((track) => (
                <TrackRenderer
                    key={track.sid || track.name}
                    track={track}
                    isVideo={false}
                    isLocal={isLocal}
                />
            ))}

            {/* Overlay Info bar */}
            <div className="absolute bottom-4 left-4 bg-gray-950/80 backdrop-blur-md px-4 py-2 rounded-2xl text-sm font-bold border border-white/5 flex items-center gap-2 max-w-[85%] transition-opacity duration-300 shadow-lg">
                <span className="text-white truncate">{displayName}</span>
                <span className="text-xs text-gray-400 font-medium">
                    ({isLocal ? 'You' : 'Remote'})
                </span>
                <div className="flex items-center gap-1.5 ml-2 border-l border-white/10 pl-2">
                    <span className={`w-2 h-2 rounded-full ${hasAudio ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-black">
                        {hasAudio ? 'Mic On' : 'Muted'}
                    </span>
                </div>
            </div>
        </div>
    );
};

const MeetingRoom = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const { user, student, loading: authLoading } = useAuth();

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTool, setActiveTool] = useState('video');
    const joinedRef = useRef(false);

    const {
        room,
        participants,
        isJoined,
        isConnecting,
        error: liveKitError,
        joinRoom,
        leaveRoom,
        toggleVideo,
        toggleAudio,
        toggleScreenShare,
        isScreenSharing,
        localTracks,
    } = useVideoRoom();

    const displayName = user?.user_metadata?.full_name || student?.full_name || user?.email || 'Guest';
    const participantId = user?.id || student?.id;
    const tutorName = booking?.tutors?.full_name || booking?.tutors?.name || 'Tutor';
    const tutorSubject = booking?.tutors?.subject || booking?.tutors?.subjects?.[0] || 'Tutoring session';

    useEffect(() => {
        if (!bookingId || authLoading) return;

        const fetchBooking = async () => {
            setLoading(true);
            setError(null);

            try {
                const { data, error: fetchError } = await supabase
                    .from('bookings')
                    .select('*, tutors(*)')
                    .eq('id', bookingId)
                    .single();

                if (fetchError || !data) {
                    setError('Meeting not found or you do not have permission to join.');
                    return;
                }

                if (data.status !== 'confirmed') {
                    setError('This meeting has not been confirmed yet.');
                    return;
                }

                if (!data.room_url) {
                    setError('The LiveKit room has not been set up yet. Please wait for the tutor to confirm the session.');
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

    useEffect(() => {
        if (!booking || authLoading || joinedRef.current) return;

        if (!participantId) {
            setError('Please sign in before joining this meeting.');
            return;
        }

        const connectToLiveKit = async () => {
            joinedRef.current = true;

            try {
                const roomName = booking.room_url || generateRoomName(booking.id);
                const { token, url, roomName: authorizedRoomName } = await generateLiveKitToken(
                    booking.id,
                    displayName,
                    participantId,
                    { resourceType: 'booking', roomName }
                );

                await joinRoom(url, token, authorizedRoomName || roomName, displayName);
            } catch (err) {
                joinedRef.current = false;
                console.error('LiveKit meeting join failed:', err);
                setError(err.message || 'Failed to join the LiveKit room.');
            }
        };

        connectToLiveKit();
    }, [booking, authLoading, displayName, participantId, joinRoom]);

    useEffect(() => {
        return () => {
            leaveRoom();
        };
    }, [leaveRoom]);

    const handleLeave = async () => {
        if (window.confirm('Leave this session?')) {
            await leaveRoom();
            navigate(-1);
        }
    };

    if (loading || authLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950">
                <Loader2 className="animate-spin text-primary w-16 h-16 mb-4" />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Initializing LiveKit classroom...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 p-4 text-center">
                <div className="bg-white rounded-3xl p-10 shadow-2xl max-w-md w-full border-t-8 border-red-500">
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

    // Compile list of local and remote participants for full screen grid
    const localParticipant = room?.localParticipant;
    const allParticipants = [];
    if (localParticipant) {
        allParticipants.push({
            participant: localParticipant,
            isLocal: true,
            displayName: localParticipant.name || localParticipant.identity || 'You'
        });
    }
    participants.forEach((p) => {
        allParticipants.push({
            participant: p,
            isLocal: false,
            displayName: p.name || p.identity || 'Participant'
        });
    });

    return (
        <div className="w-screen h-screen bg-gray-950 overflow-hidden flex flex-col">
            <header className="bg-gray-900/50 backdrop-blur-xl text-white px-6 py-4 flex justify-between items-center border-b border-white/5 shrink-0 z-50">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-0.5">LiveKit Session</span>
                        <h1 className="font-black text-xl tracking-tighter truncate max-w-sm">
                            {tutorName} - {tutorSubject}
                        </h1>
                    </div>
                    <div className="h-8 w-px bg-white/10" />
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
                    <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-xl">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-green-400 text-xs font-black uppercase tracking-widest">
                            {isJoined ? 'Live' : 'Connecting'}
                        </span>
                    </div>

                    <button
                        onClick={handleLeave}
                        className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-6 py-2.5 rounded-2xl font-black text-sm transition-all border border-red-500/20 flex items-center gap-2"
                    >
                        <LogOut size={18} /> Leave Session
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden relative">
                {/* Left Panel: Video Workspace */}
                <div className={`transition-all duration-500 ease-in-out bg-gray-950 flex flex-col ${activeTool === 'video' ? 'w-full' : 'w-[420px] shrink-0 border-r border-white/5'}`}>
                    
                    {/* Top part: Video stream content */}
                    <div className="flex-1 min-h-0 relative flex flex-col justify-center">
                        {activeTool === 'video' ? (
                            /* Video Grid View */
                            <div className="w-full h-full flex flex-col md:flex-row gap-6 p-6 items-stretch justify-center">
                                {isConnecting ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                                        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                                        <h2 className="text-2xl font-black text-white mb-2">Connecting to LiveKit</h2>
                                        <p className="text-gray-400 max-w-md">Camera and microphone permissions may be requested by your browser.</p>
                                    </div>
                                ) : liveKitError ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                                        <VideoOff className="w-14 h-14 text-red-400 mb-4" />
                                        <h2 className="text-2xl font-black text-white mb-2">Video Connection Failed</h2>
                                        <p className="text-gray-400 max-w-md">{liveKitError}</p>
                                    </div>
                                ) : allParticipants.length > 0 ? (
                                    allParticipants.map((item) => (
                                        <ParticipantGridTile
                                            key={item.participant.sid || item.participant.identity}
                                            item={item}
                                        />
                                    ))
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                                        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                                        <h3 className="text-xl font-bold text-white">Waiting for participants...</h3>
                                        <p className="text-gray-400 text-sm mt-1">You are connected. As soon as another user joins, their video will appear here.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Video Sidebar View (occupies the entire left panel height) */
                            <VideoSidebar
                                room={room}
                                participants={participants}
                                className="w-full h-full border-none bg-transparent"
                            />
                        )}
                    </div>

                    {/* Bottom part: Media Control Bar */}
                    <div className="p-6 border-t border-white/5 bg-gray-950 shrink-0 flex justify-center">
                        <div className="flex items-center gap-4 bg-gray-900/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-2xl border border-white/5">
                            <button
                                onClick={toggleAudio}
                                className={`p-3 rounded-xl transition-all hover:scale-105 active:scale-95 ${localTracks.audio ? 'hover:bg-white/5 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                                title={localTracks.audio ? 'Mute Microphone' : 'Unmute Microphone'}
                            >
                                {localTracks.audio ? <Mic size={20} /> : <MicOff size={20} />}
                            </button>
                            <button
                                onClick={toggleVideo}
                                className={`p-3 rounded-xl transition-all hover:scale-105 active:scale-95 ${localTracks.video ? 'hover:bg-white/5 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                                title={localTracks.video ? 'Turn Camera Off' : 'Turn Camera On'}
                            >
                                {localTracks.video ? <Video size={20} /> : <VideoOff size={20} />}
                            </button>
                            <button
                                onClick={toggleScreenShare}
                                className={`p-3 rounded-xl transition-all hover:scale-105 active:scale-95 ${isScreenSharing ? 'bg-green-500 hover:bg-green-600 text-white' : 'hover:bg-white/5 text-gray-300'}`}
                                title={isScreenSharing ? 'Stop Sharing Screen' : 'Share Screen'}
                            >
                                <MonitorUp size={20} className={isScreenSharing ? 'text-white' : ''} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Whiteboard Workspace */}
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
