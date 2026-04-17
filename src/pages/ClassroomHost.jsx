import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Users, LogOut, Copy, CheckCheck, Video, VideoOff, Mic, MicOff, MonitorUp } from 'lucide-react';
import Board from '../components/Whiteboard/Board';
import { supabase } from '../lib/supabase';
import { api } from '../services/api';
import { DailyProvider } from '@daily-co/daily-react';
import VideoSidebar from '../components/Classroom/VideoSidebar';
import { useVideoRoom } from '../hooks/useVideoRoom';

// Stage Components
import ShoutItOutStage from '../components/Classroom/Stage/ShoutItOutStage';
import QuizStage from '../components/Classroom/Stage/QuizStage';
import PollStage from '../components/Classroom/Stage/PollStage';
import YoutubeStage from '../components/Classroom/Stage/YoutubeStage';

const ClassroomHost = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState(null);
    const [slides, setSlides] = useState([]);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [participants, setParticipants] = useState([]);
    const [shoutResponses, setShoutResponses] = useState([]);
    const [codeCopied, setCodeCopied] = useState(false);

    // Hardcode a Daily.co room URL for the MVP, or fetch it from session/db
    // In production, you'd generate a unique room for each session via an API function

    const {
        callObject,
        isJoined,
        error: videoError,
        joinRoom,
        leaveRoom,
        toggleVideo,
        toggleAudio,
        toggleScreenShare,
        isScreenSharing
    } = useVideoRoom(sessionId);

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
        fetchSessionData();

        // Subscribe to participants
        const channel = supabase
            .channel(`session:${sessionId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'session_participants', filter: `session_id=eq.${sessionId}` }, (payload) => {
                setParticipants(prev => [...prev, payload.new]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [sessionId]);

    const fetchSessionData = async () => {
        try {
            // Fetch session
            const { data: sessionData, error: sessionError } = await api.sessions.getActiveById(sessionId);

            if (sessionError) throw sessionError;
            setSession(sessionData);

            // Join the Daily WebRTC room as soon as we have session data
            if (sessionData) {
                if (sessionData.room_url) {
                    joinRoom(sessionData.room_url, "Teacher");
                } else {
                    console.warn("No dynamic room URL found, falling back to demo room");
                    joinRoom("https://starbridgetutoring.daily.co/demo-classroom", "Teacher");
                }
            }

            // Fetch slides
            const { data: slidesData, error: slidesError } = await api.slides.getByLessonId(sessionData.lesson_id);

            if (slidesError) throw slidesError;
            setSlides(slidesData || []);

            // Fetch existing participants
            const { data: participantsData } = await api.participants.getBySessionId(sessionId);

            setParticipants(participantsData || []);

        } catch (error) {
            console.error('Error loading session:', error);
        } finally {
            setLoading(false);
        }
    };

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
    if (!session) return <div className="text-white">Session not found</div>;

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

            <DailyProvider callObject={callObject}>
                <div className="flex-1 flex overflow-hidden">
                    {/* Video Sidebar */}
                    {isJoined && <VideoSidebar />}

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
                        ) : slides.length > 0 ? (
                            <Board
                                key={currentSlide?.id}
                                sessionId={sessionId}
                                readOnly={false}
                                initialSnapshot={currentSlide?.drawing_data}
                                onChange={(snapshot) => {
                                    api.slides.updateDrawing(currentSlide.id, snapshot).then(({ error }) => {
                                        if (error) console.error("Error saving whiteboard:", error);
                                        setSlides(prev => {
                                            const newSlides = [...prev];
                                            newSlides[currentSlideIndex].drawing_data = snapshot;
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
            </DailyProvider>
        </div>
    );
};

export default ClassroomHost;
