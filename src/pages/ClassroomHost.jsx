import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Users, LogOut, Copy, CheckCheck, Video, VideoOff, Mic, MicOff, MonitorUp, Award, Sparkles, X } from 'lucide-react';
import { DataPacket_Kind } from 'livekit-client';
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

    const [showRoster, setShowRoster] = useState(false);
    const [badges, setBadges] = useState([]);
    const [activeAwardingParticipantId, setActiveAwardingParticipantId] = useState(null);

    const [showEndSessionModal, setShowEndSessionModal] = useState(false);
    const [lessonStatus, setLessonStatus] = useState('in_progress');
    const [progressPercent, setProgressPercent] = useState(50);
    const [feedbackNotes, setFeedbackNotes] = useState('');
    const [savingFeedback, setSavingFeedback] = useState(false);

    useEffect(() => {
        const fetchBadges = async () => {
            try {
                const { data } = await api.gamification.getBadges();
                if (data) setBadges(data);
            } catch (err) {
                console.error('Failed to fetch badges list:', err);
            }
        };
        fetchBadges();
    }, []);

    const handleAwardStar = async (participant) => {
        const participantId = participant.identity;
        
        // 1. DB write (if not guest)
        if (participantId && !participantId.startsWith('guest-')) {
            try {
                await api.gamification.awardStar(participantId, 1);
            } catch (err) {
                console.error('Error awarding star in DB:', err);
            }
        }
        
        // 2. Broadcast LiveKit packet
        if (room && room.state === 'connected') {
            try {
                const encoder = new TextEncoder();
                const payload = encoder.encode(JSON.stringify({
                    type: 'reward_star',
                    targetId: participantId,
                }));
                await room.localParticipant.publishData(payload, DataPacket_Kind.RELIABLE);
            } catch (err) {
                console.error('Failed to send star packet:', err);
            }
        }
    };

    const handleAwardBadge = async (participant, badge) => {
        const participantId = participant.identity;
        
        // 1. DB write (if not guest)
        if (participantId && !participantId.startsWith('guest-')) {
            try {
                await api.gamification.awardBadge(participantId, badge.id);
            } catch (err) {
                console.error('Error awarding badge in DB:', err);
            }
        }
        
        // 2. Broadcast LiveKit packet
        if (room && room.state === 'connected') {
            try {
                const encoder = new TextEncoder();
                const payload = encoder.encode(JSON.stringify({
                    type: 'reward_badge',
                    targetId: participantId,
                    badgeName: badge.name,
                    badgeIcon: badge.icon_url,
                }));
                await room.localParticipant.publishData(payload, DataPacket_Kind.RELIABLE);
            } catch (err) {
                console.error('Failed to send badge packet:', err);
            }
        }
    };

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
        isScreenSharing,
        localTracks,
        isFallback,
        switchToFallback,
    } = useVideoRoom();

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
                    const participantId = sessionData.tutor_id || `host-${sessionId || sessionData.id || 'host'}`;
                    const { token, url, roomName: authorizedRoomName } = await generateLiveKitToken(
                        sessionData.id || sessionId,
                        'Teacher',
                        participantId,
                        { resourceType: 'active_session', roomName }
                    );
                    await joinRoom(url, token, authorizedRoomName || roomName, 'Teacher');
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

    const handleEndSessionClick = () => {
        setShowEndSessionModal(true);
    };

    const handleSaveReportAndEnd = async () => {
        setSavingFeedback(true);
        try {
            // Deduplicate registered students
            const registeredIds = new Set();
            const uniqueStudents = [];
            for (const p of sessionParticipants) {
                if (p.student_id && !p.student_id.startsWith('guest-') && !registeredIds.has(p.student_id)) {
                    registeredIds.add(p.student_id);
                    uniqueStudents.push(p);
                }
            }

            if (uniqueStudents.length > 0 && session?.lesson_id) {
                const progressPromises = uniqueStudents.map(p => 
                    api.lessonProgress.upsert({
                        student_id: p.student_id,
                        lesson_id: session.lesson_id,
                        status: lessonStatus,
                        progress_percent: parseInt(progressPercent, 10),
                        feedback_notes: feedbackNotes,
                        completed_at: lessonStatus === 'completed' ? new Date().toISOString() : null,
                        updated_at: new Date().toISOString()
                    })
                );
                await Promise.all(progressPromises);
            }

            await api.sessions.end(sessionId);
            await leaveRoom();
            navigate('/teacher/dashboard');
        } catch (err) {
            console.error('Failed to save session report:', err);
            if (window.confirm('Failed to save progress report. End session anyway?')) {
                await api.sessions.end(sessionId).catch(() => {});
                await leaveRoom();
                navigate('/teacher/dashboard');
            }
        } finally {
            setSavingFeedback(false);
            setShowEndSessionModal(false);
        }
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

                    {/* Participants Toggle Button */}
                    <button
                        onClick={() => setShowRoster(!showRoster)}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg border transition-all ${
                            showRoster 
                                ? 'bg-yellow-400 text-gray-950 border-yellow-400 shadow-lg hover:bg-yellow-500' 
                                : 'bg-gray-800 hover:bg-gray-700 text-white border-gray-700'
                        }`}
                        title="Classroom Roster & Rewards"
                    >
                        <Users size={15} className={showRoster ? 'text-gray-950' : 'text-emerald-400'} />
                        <span className="text-sm font-semibold">{participants.length}</span>
                    </button>

                    {/* End Session */}
                    <button
                        onClick={handleEndSessionClick}
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
                    {(isJoined || isConnecting || isFallback) && (
                        <VideoSidebar 
                            room={room} 
                            participants={participants} 
                            isFallback={isFallback}
                            roomName={session?.room_url || (session?.id ? generateRoomName(session.id) : '')}
                            displayName="Teacher"
                            onSwitchFallback={switchToFallback}
                        />
                    )}

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
                                onClick={toggleAudio}
                                className={`p-2 rounded-full transition-colors ${localTracks.audio ? 'hover:bg-gray-700' : 'bg-red-500 hover:bg-red-600'}`}
                                title={localTracks.audio ? "Mute Microphone" : "Unmute Microphone"}
                            >
                                {localTracks.audio ? <Mic size={20} /> : <MicOff size={20} />}
                            </button>

                            <button
                                onClick={toggleVideo}
                                className={`p-2 rounded-full transition-colors ${localTracks.video ? 'hover:bg-gray-700' : 'bg-red-500 hover:bg-red-600'}`}
                                title={localTracks.video ? "Turn Camera Off" : "Turn Camera On"}
                            >
                                {localTracks.video ? <Video size={20} /> : <VideoOff size={20} />}
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

                {/* Roster Panel */}
                {showRoster && (
                    <div className="w-[360px] border-l border-gray-850 bg-gray-950 shrink-0 flex flex-col h-full z-50">
                        {/* Roster Header */}
                        <div className="px-6 py-4 border-b border-gray-850 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <Users size={18} className="text-yellow-400" />
                                <span className="font-black text-sm uppercase tracking-widest text-white">Class Roster & Rewards</span>
                            </div>
                            <button
                                onClick={() => setShowRoster(false)}
                                className="p-1.5 hover:bg-white/5 text-gray-400 hover:text-white rounded-lg transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Roster List */}
                        <div className="flex-grow overflow-y-auto p-6 space-y-6">
                            {participants.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
                                    <Users size={48} className="text-gray-800 mb-3" />
                                    <h4 className="text-sm font-bold text-gray-400">Classroom is empty</h4>
                                    <p className="text-xs text-gray-650 mt-1 max-w-[200px]">Waiting for students to join using code: {session.code}</p>
                                </div>
                            ) : (
                                participants.map((p) => {
                                    const isGuest = p.identity.startsWith('guest-');
                                    return (
                                        <div key={p.sid} className="bg-gray-900 border border-gray-800 p-4 rounded-2xl space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-bold text-white text-base">{p.name || 'Student'}</h4>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isGuest ? 'text-yellow-600/70' : 'text-emerald-500/70'}`}>
                                                        {isGuest ? 'Guest Student' : 'Enrolled Student'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleAwardStar(p)}
                                                    className="flex-1 py-2.5 bg-yellow-400 hover:bg-yellow-500 active:scale-95 text-gray-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-yellow-500/10"
                                                >
                                                    <Sparkles size={14} className="animate-pulse" />
                                                    Award Star
                                                </button>

                                                <button
                                                    onClick={() => setActiveAwardingParticipantId(activeAwardingParticipantId === p.identity ? null : p.identity)}
                                                    className="flex-1 py-2.5 bg-gray-805 hover:bg-gray-800 active:scale-95 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 border border-gray-700"
                                                >
                                                    <Award size={14} />
                                                    Badges
                                                </button>
                                            </div>

                                            {/* Badges list */}
                                            {activeAwardingParticipantId === p.identity && (
                                                <div className="pt-3 border-t border-gray-800 space-y-2">
                                                    <span className="text-[9px] font-black uppercase tracking-wider text-gray-500 block mb-1">Select badge to award:</span>
                                                    {badges.map((badge) => (
                                                        <button
                                                            key={badge.id}
                                                            onClick={() => {
                                                                handleAwardBadge(p, badge);
                                                                setActiveAwardingParticipantId(null);
                                                            }}
                                                            className="w-full flex items-center gap-3 p-2 bg-gray-950 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 rounded-xl transition-all text-left group"
                                                        >
                                                            <img src={badge.icon_url} alt="" className="w-7 h-7 object-contain" />
                                                            <div>
                                                                <p className="text-xs font-bold text-white group-hover:text-yellow-400 transition-colors">{badge.name}</p>
                                                                <p className="text-[10px] text-gray-500 line-clamp-1">{badge.description}</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
                {/* Post-Session Feedback & Progress Report Modal */}
                {showEndSessionModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/80 backdrop-blur-md p-4 text-left">
                        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl relative space-y-6">
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tight">End Session & Progress Report</h3>
                                <p className="text-gray-400 text-sm mt-1">Submit student performance notes and lesson coverage before closing the classroom.</p>
                            </div>

                            <div className="space-y-4">
                                {/* Lesson Status */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Lesson Status</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => { setLessonStatus('in_progress'); setProgressPercent(50); }}
                                            className={`py-3 px-4 rounded-xl font-bold text-sm border transition-all ${
                                                lessonStatus === 'in_progress'
                                                    ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500'
                                                    : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700'
                                            }`}
                                        >
                                            📖 Still In Progress
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setLessonStatus('completed'); setProgressPercent(100); }}
                                            className={`py-3 px-4 rounded-xl font-bold text-sm border transition-all ${
                                                lessonStatus === 'completed'
                                                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500'
                                                    : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700'
                                            }`}
                                        >
                                            ✅ Fully Completed
                                        </button>
                                    </div>
                                </div>

                                {/* Progress Percent Slider */}
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 font-semibold">
                                        <span>Lesson Progress</span>
                                        <span className="text-yellow-400 font-mono text-sm">{progressPercent}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="10"
                                        value={progressPercent}
                                        onChange={(e) => setProgressPercent(e.target.value)}
                                        className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                                    />
                                </div>

                                {/* Feedback Notes */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tutor Feedback & Notes</label>
                                    <textarea
                                        value={feedbackNotes}
                                        onChange={(e) => setFeedbackNotes(e.target.value)}
                                        placeholder="Write a summary of what was covered, how the student performed, and areas of improvement..."
                                        rows={4}
                                        className="w-full p-4 bg-gray-950 border border-gray-805 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 rounded-xl outline-none font-medium text-white placeholder-gray-600 text-sm resize-none"
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowEndSessionModal(false)}
                                    className="flex-1 py-3 bg-gray-800 hover:bg-gray-750 text-white font-bold rounded-xl transition-all text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveReportAndEnd}
                                    disabled={savingFeedback}
                                    className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-950 font-black rounded-xl transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {savingFeedback ? 'Saving...' : 'End & Save Report'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
    );
};

export default ClassroomHost;
