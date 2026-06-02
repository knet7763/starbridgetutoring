import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Users, LogOut, Copy, CheckCheck, Video, VideoOff, Mic, MicOff, MonitorUp } from 'lucide-react';
import Board from '../components/Whiteboard/Board';
import { supabase } from '../lib/supabase';
import { api } from '../services/api';
import { generateLiveKitToken, generateRoomName } from '../services/videoService';
import VideoSidebar from '../components/Classroom/VideoSidebar';
import { useVideoRoom } from '../hooks/useVideoRoom';

// Stage Components
import ShoutItOutStage from '../components/Classroom/Stage/ShoutItOutStage';
import QuizStage from '../components/Classroom/Stage/QuizStage';
import PollStage from '../components/Classroom/Stage/PollStage';
import YoutubeStage from '../components/Classroom/Stage/YoutubeStage';
import QuranStage from '../components/Classroom/Stage/QuranStage';
import HadithStage from '../components/Classroom/Stage/HadithStage';
import FiqhStage from '../components/Classroom/Stage/FiqhStage';

const ClassroomHost = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState(null);
    const [slides, setSlides] = useState([]);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [sessionParticipants, setSessionParticipants] = useState([]);
    const [shoutResponses, setShoutResponses] = useState([]);
    const [codeCopied, setCodeCopied] = useState(false);
    const [roomError, setRoomError] = useState(null);
    const joinedRef = React.useRef(false);

    const {
        room,
        participants,
        isJoined,
        isConnecting,
        error: videoError,
        joinRoom,
        leaveRoom,
        toggleVideo,
        toggleAudio,
        toggleScreenShare,
        isScreenSharing
    } = useVideoRoom();

    // State for local media controls (visual only, actual toggle handled by hook)
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isAudioOn, setIsAudioOn] = useState(true);

    const handleToggleVideo = () => {
        setIsVideoOn(!isVideoOn);
        toggleVideo();
    };

    const handleToggleAudio = () => {
        setIsAudioOn(!isAudioOn);
        toggleAudio();
    };

    useEffect(() => {
        if (!sessionId) return;
        
        const fetchSessionData = async () => {
            try {
                // Fetch session
                const { data: sessionData, error: sessionError } = await api.sessions.getActiveById(sessionId);

                if (sessionError) throw sessionError;
                setSession(sessionData);

                // Join the LiveKit room as soon as we have session data — only once
                if (sessionData && !joinedRef.current) {
                    joinedRef.current = true;
                    const roomName = sessionData.room_url || generateRoomName(sessionId || sessionData.id || '');
                    const participantId = `host-${sessionId || sessionData.id || 'host'}`;
                    const { token, url } = await generateLiveKitToken(roomName, 'Teacher', participantId);
                    await joinRoom(url, token, roomName, 'Teacher');
                }

                // Fetch slides
                const { data: slidesData, error: slidesError } = await api.slides.getByLessonId(sessionData.lesson_id);

                if (slidesError) throw slidesError;
                setSlides(slidesData || []);

                // Fetch existing participants
                const { data: participantsData } = await api.participants.getBySessionId(sessionId);

                setSessionParticipants(participantsData || []);

            } catch (error) {
                console.error('Error loading session:', error);
                setRoomError(`Failed to load classroom: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchSessionData();

        // Subscribe to participants
        const channel = supabase
            .channel(`session:${sessionId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'session_participants', filter: `session_id=eq.${sessionId}` }, (payload) => {
                setSessionParticipants(prev => [...prev, payload.new]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [sessionId, joinRoom]);

    useEffect(() => {
        if (!slides || slides.length === 0 || !slides[currentSlideIndex]) return;

        const slideId = slides[currentSlideIndex].id;

        const interactiveTypes = ['shout_it_out', 'quiz', 'poll'];
        const isInteractive = interactiveTypes.includes(slides[currentSlideIndex].type);

        // Fetch existing responses for the slide
        const fetchResponses = async () => {
            if (isInteractive) {
                const { data } = await api.responses.getBySlideId(slideId);
                setShoutResponses(data || []);
            } else {
                setShoutResponses([]);
            }
        };
        fetchResponses();

        let channel;
        if (isInteractive) {
            channel = supabase
                .channel(`responses:${slideId}`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'responses', filter: `slide_id=eq.${slideId}` }, (payload) => {
                    setShoutResponses(prev => [...prev, payload.new]);
                })
                .subscribe();
        }

        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, [currentSlideIndex, slides]);

    useEffect(() => {
        return () => {
            leaveRoom();
        };
    }, [leaveRoom]);

    const updateSessionSlide = async (slideId) => {
        try {
            await api.sessions.updateCurrentSlide(sessionId, slideId);
        } catch (error) {
            console.error('Error updating slide:', error);
        }
    };

    const handleNext = () => {
        if (currentSlideIndex < slides.length - 1) {
            const newIndex = currentSlideIndex + 1;
            setCurrentSlideIndex(newIndex);
            updateSessionSlide(slides[newIndex].id);
        }
    };

    const handlePrev = () => {
        if (currentSlideIndex > 0) {
            const newIndex = currentSlideIndex - 1;
            setCurrentSlideIndex(newIndex);
            updateSessionSlide(slides[newIndex].id);
        }
    };

    const handleEndSession = async () => {
        if (!window.confirm('End this session? Students will no longer be able to interact.')) return;
        try {
            await api.sessions.end(sessionId);
        } catch (err) {
            console.error('Error ending session:', err);
        }
        await leaveRoom();
        navigate('/teacher/dashboard');
    };

    const handleCopyCode = () => {
        if (session?.code) {
            navigator.clipboard.writeText(session.code);
            setCodeCopied(true);
            setTimeout(() => setCodeCopied(false), 2000);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen bg-gray-900 text-white">Loading Classroom...</div>;
    if (!session) return <div className="text-white text-center pt-20">Session not found</div>;
    if (roomError || videoError) return (
        <div className="flex justify-center items-center h-screen bg-gray-900 text-white px-4">
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Classroom Connection Error</h2>
                <p className="text-red-400 mb-6">{roomError || videoError}</p>
                <button 
                    onClick={() => navigate('/teacher/dashboard')}
                    className="bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-yellow-600"
                >
                    Back to Dashboard
                </button>
            </div>
        </div>
    );

    const currentSlide = slides[currentSlideIndex];

    return (
        <div className="h-screen flex flex-col bg-gray-900 text-white">
            {/* Top Bar */}
            <div className="h-14 flex items-center justify-between px-6 border-b border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">{session.lessons?.title}</span>
                        <span className="text-sm font-medium text-gray-300">
                            Slide {currentSlideIndex + 1} / {slides.length}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Join Code */}
                    <button
                        onClick={handleCopyCode}
                        className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-1.5 rounded-lg border border-gray-700 transition-colors"
                        title="Click to copy code"
                    >
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Code:</span>
                        <span className="text-base font-black font-mono tracking-widest text-primary">
                            {session.code}
                        </span>
                        {codeCopied
                            ? <CheckCheck size={14} className="text-green-400" />
                            : <Copy size={14} className="text-gray-500" />}
                    </button>

                    {/* Participants */}
                    <div className="flex items-center gap-2 bg-gray-800 px-4 py-1.5 rounded-lg border border-gray-700">
                        <Users size={15} className="text-emerald-400" />
                        <span className="text-sm font-semibold">{participants.length}</span>
                    </div>

                    {/* End Session */}
                    <button
                        onClick={handleEndSession}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg font-semibold text-sm transition-colors"
                    >
                        <LogOut size={15} />
                        End Session
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                    {/* Connection Status Indicator */}
                    {isConnecting && (
                        <div className="absolute top-20 left-6 bg-yellow-900 text-yellow-100 px-4 py-2 rounded-lg text-sm font-bold z-10">
                            Connecting to video room...
                        </div>
                    )}

                    {/* Video Sidebar */}
                    {(isJoined || isConnecting) && <VideoSidebar room={room} participants={participants} />}

                    {/* Main Stage */}
                    <div className="flex-1 relative bg-white flex flex-col">
                        {currentSlide?.type === 'shout_it_out' ? (
                            <ShoutItOutStage currentSlide={currentSlide} shoutResponses={shoutResponses} />
                        ) : currentSlide?.type === 'quiz' ? (
                            <QuizStage currentSlide={currentSlide} shoutResponses={shoutResponses} />
                        ) : currentSlide?.type === 'poll' ? (
                            <PollStage currentSlide={currentSlide} shoutResponses={shoutResponses} />
                        ) : currentSlide?.type === 'youtube' ? (
                            <YoutubeStage currentSlide={currentSlide} />
                        ) : currentSlide?.type === 'quran' ? (
                            <QuranStage currentSlide={currentSlide} />
                        ) : currentSlide?.type === 'hadith' ? (
                            <HadithStage currentSlide={currentSlide} />
                        ) : currentSlide?.type === 'fiqh' ? (
                            <FiqhStage currentSlide={currentSlide} />
                        ) : currentSlide?.type === 'image' || currentSlide?.type === 'blank' || !currentSlide?.type ? (
                            <Board
                                key={currentSlide?.id}
                                sessionId={sessionId}
                                readOnly={false}
                                backgroundImage={currentSlide?.type === 'image' ? currentSlide.content?.url : null}
                                initialSnapshot={currentSlide?.drawing_data}
                                onChange={(snapshot) => {
                                    api.slides.updateDrawing(currentSlide.id, snapshot).then(({ error }) => {
                                        if (error) console.error("Error saving whiteboard:", error);
                                        setSlides(prev => {
                                            const newSlides = [...prev];
                                            const idx = newSlides.findIndex(s => s.id === currentSlide.id);
                                            if (idx !== -1) newSlides[idx].drawing_data = snapshot;
                                            return newSlides;
                                        });
                                    });
                                }}
                                className="w-full h-full"
                            />
                        ) : null}

                        {/* Navigation Controls (Floating) */}
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-gray-800/90 backdrop-blur px-6 py-3 rounded-2xl shadow-2xl border border-gray-700 z-50">
                            <button
                                onClick={handlePrev}
                                disabled={currentSlideIndex === 0}
                                className="p-2 hover:bg-gray-700 rounded-full disabled:opacity-30 transition-colors"
                            >
                                <ChevronLeft size={24} />
                            </button>

                            <span className="text-sm font-mono w-16 text-center text-gray-300">
                                {currentSlideIndex + 1} / {slides.length}
                            </span>

                            <button
                                onClick={handleNext}
                                disabled={currentSlideIndex === slides.length - 1}
                                className="p-2 hover:bg-gray-700 rounded-full disabled:opacity-30 transition-colors"
                            >
                                <ChevronRight size={24} />
                            </button>

                            <div className="w-px h-6 bg-gray-600 mx-2"></div>

                            <button
                                onClick={handleToggleAudio}
                                className={`p-2 rounded-full transition-colors ${isAudioOn ? 'hover:bg-gray-700' : 'bg-red-500 hover:bg-red-600'}`}
                                title={isAudioOn ? "Mute Microphone" : "Unmute Microphone"}
                            >
                                {isAudioOn ? <Mic size={20} /> : <MicOff size={20} />}
                            </button>

                            <button
                                onClick={handleToggleVideo}
                                className={`p-2 rounded-full transition-colors ${isVideoOn ? 'hover:bg-gray-700' : 'bg-red-500 hover:bg-red-600'}`}
                                title={isVideoOn ? "Turn Camera Off" : "Turn Camera On"}
                            >
                                {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
                            </button>

                            <button
                                onClick={toggleScreenShare}
                                className={`p-2 rounded-full transition-colors ${isScreenSharing ? 'bg-green-500 hover:bg-green-600' : 'hover:bg-gray-700'}`}
                                title={isScreenSharing ? "Stop Sharing Screen" : "Share Screen"}
                            >
                                <MonitorUp size={20} className={isScreenSharing ? "text-white" : "text-gray-300"} />
                            </button>
                        </div>
                    </div>
                </div>
        </div>
    );
};

export default ClassroomHost;
