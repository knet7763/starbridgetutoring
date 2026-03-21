import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Sparkles, MessageSquare, HelpCircle, CheckCircle, BarChart2, Youtube, Image as ImageIcon, Video, VideoOff, Mic, MicOff, MonitorUp } from 'lucide-react';
import { DailyProvider } from '@daily-co/daily-react';
import VideoSidebar from '../components/Classroom/VideoSidebar';
import { useVideoRoom } from '../hooks/useVideoRoom';
import { supabase } from '../lib/supabase';
import { api } from '../services/api';

const ClassroomStudent = () => {
    const { sessionId } = useParams();
    const location = useLocation();
    const guestName = location.state?.guestName || 'Student';
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState(null);
    const [sessionEnded, setSessionEnded] = useState(false);
    const [slides, setSlides] = useState([]);
    const [currentSlideId, setCurrentSlideId] = useState(null);
    const [shoutAnswer, setShoutAnswer] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submittedSlideIds, setSubmittedSlideIds] = useState(new Set());

    const DEV_ROOM_URL = "https://starbridgetutoring.daily.co/demo-classroom";

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
        let channel;

        const initClassroom = async () => {
            try {
                // Fetch the active session and lesson
                const { data: sessionData, error: sessionError } = await api.sessions.getActiveById(sessionId);

                if (sessionError) throw sessionError;

                setSession({
                    id: sessionId,
                    title: sessionData.lessons.title,
                    teacher_name: 'Teacher',
                    lesson_id: sessionData.lesson_id
                });

                setCurrentSlideId(sessionData.current_slide_id);

                // Fetch real slides
                const { data: slidesData, error: slidesError } = await api.slides.getByLessonId(sessionData.lesson_id);

                if (slidesError) throw slidesError;
                setSlides(slidesData || []);

                // Join logic for WebRTC
                joinRoom(DEV_ROOM_URL, guestName);

                // Supabase Realtime Subscription targeting active_sessions table
                channel = supabase
                    .channel(`public:active_sessions:${sessionId}`)
                    .on('postgres_changes', {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'active_sessions',
                        filter: `id=eq.${sessionId}`
                    }, (payload) => {
                        if (payload.new.current_slide_id !== undefined) {
                            setCurrentSlideId(payload.new.current_slide_id);
                        }
                        if (payload.new.is_active === false) {
                            setSessionEnded(true);
                        }
                    })
                    .subscribe();

            } catch (error) {
                console.error('Error joining session:', error);
            } finally {
                setLoading(false);
            }
        };

        initClassroom();

        return () => {
            if (channel) supabase.removeChannel(channel);
            leaveRoom();
        };
    }, [sessionId]);

    const handleShoutSubmit = async () => {
        if (!shoutAnswer.trim() || !currentSlide?.id) return;
        setIsSubmitting(true);
        try {
            const { error } = await api.responses.create({
                session_id: session.id,
                slide_id: currentSlide.id,
                answer: shoutAnswer.trim()
            });
            if (error) throw error;
            setSubmittedSlideIds(prev => new Set(prev).add(currentSlide.id));
            setShoutAnswer('');
        } catch (error) {
            console.error('Error submitting shout:', error);
            alert('Failed to submit. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMCQSubmit = async (optionIndex) => {
        if (!currentSlide?.id || isSubmitting) return;
        setIsSubmitting(true);
        try {
            const { error } = await api.responses.create({
                session_id: session.id,
                slide_id: currentSlide.id,
                answer: optionIndex.toString()
            });
            if (error) throw error;
            setSubmittedSlideIds(prev => new Set(prev).add(currentSlide.id));
        } catch (error) {
            console.error('Error submitting answer:', error);
            alert('Failed to submit. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentSlide = slides.find(s => s.id === currentSlideId) || slides[0];
    const currentIndex = slides.findIndex(s => s.id === currentSlide?.id);

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-yellow-50">
            <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mb-4"></div>
                <h2 className="text-xl font-bold text-gray-700">Joining Classroom...</h2>
            </div>
        </div>
    );

    if (!session) return <div className="flex justify-center items-center h-screen">Session not found</div>;

    if (sessionEnded) return (
        <div className="flex flex-col items-center justify-center h-screen bg-yellow-50 text-center p-8">
            <div className="text-6xl mb-6">🎉</div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Class is over!</h1>
            <p className="text-lg text-gray-500 mb-6">Great work today, {guestName}. Your teacher has ended the session.</p>
            <a href="/join" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-yellow-600 transition-colors">
                Join Another Class
            </a>
        </div>
    );

    const renderSlideContent = () => {
        if (!currentSlide) return <div className="text-center p-10 text-xl font-bold text-gray-400">Waiting for teacher to start...</div>;

        switch (currentSlide.type) {
            case 'image':
                return (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gray-900">
                        {currentSlide.content?.url ? (
                            <>
                                <img
                                    src={currentSlide.content.url}
                                    alt={currentSlide.content?.caption || 'Slide'}
                                    className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl"
                                />
                                {currentSlide.content?.caption && (
                                    <p className="mt-4 text-white/70 text-base font-medium text-center">{currentSlide.content.caption}</p>
                                )}
                            </>
                        ) : (
                            <div className="text-white/40 text-center">
                                <ImageIcon size={64} className="mx-auto mb-4" />
                                <p>No image uploaded for this slide</p>
                            </div>
                        )}
                    </div>
                );
            case 'quiz':
            case 'poll':
                const isMCQSubmitted = submittedSlideIds.has(currentSlide.id);
                return (
                    <div className={`w-full h-full flex flex-col items-center justify-center p-8 ${currentSlide.type === 'quiz' ? 'bg-purple-50' : 'bg-blue-50'}`}>
                        {currentSlide.type === 'quiz' ? <HelpCircle size={64} className="text-purple-500 mb-6" /> : <BarChart2 size={64} className="text-blue-500 mb-6" />}
                        <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">{currentSlide.content?.question || 'Question'}</h2>

                        {isMCQSubmitted ? (
                            <div className={`bg-white p-8 rounded-2xl flex flex-col items-center max-w-lg w-full text-center border-2 ${currentSlide.type === 'quiz' ? 'border-purple-200' : 'border-blue-200'}`}>
                                <CheckCircle className="text-green-500 mb-4" size={48} />
                                <h3 className="text-2xl font-bold text-gray-800 mb-2">Answer submitted!</h3>
                                <p className="text-gray-500">Look at the teacher's board to see the results.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                                {(currentSlide.content?.options || ['Option A', 'Option B']).map((opt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleMCQSubmit(i)}
                                        disabled={isSubmitting}
                                        className={`bg-white border-2 text-gray-800 hover:text-white py-4 px-6 rounded-xl text-xl font-bold transition-all transform hover:scale-105 shadow-sm active:scale-95 disabled:opacity-50 disabled:transform-none ${currentSlide.type === 'quiz'
                                            ? 'border-purple-300 hover:bg-purple-600 hover:border-purple-600 text-purple-800'
                                            : 'border-blue-300 hover:bg-blue-600 hover:border-blue-600 text-blue-800'
                                            }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                );
            case 'shout_it_out':
                const isSubmitted = submittedSlideIds.has(currentSlide.id);
                return (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-yellow-50">
                        <MessageSquare size={64} className="text-primary mb-6" />
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">{currentSlide.content?.question || 'What are your thoughts?'}</h2>

                        {isSubmitted ? (
                            <div className="bg-white p-8 rounded-2xl shadow-sm flex flex-col items-center max-w-lg w-full text-center border-2 border-green-200">
                                <CheckCircle className="text-green-500 mb-4" size={48} />
                                <h3 className="text-2xl font-bold text-gray-800 mb-2">Sent to board!</h3>
                                <p className="text-gray-500">Wait for the teacher to show the board or proceed to the next slide.</p>
                            </div>
                        ) : (
                            <div className="w-full max-w-2xl">
                                <textarea
                                    value={shoutAnswer}
                                    onChange={(e) => setShoutAnswer(e.target.value)}
                                    className="w-full p-4 border-2 border-primary rounded-xl focus:ring-4 focus:ring-yellow-200 outline-none resize-none shadow-inner text-lg"
                                    rows="4"
                                    placeholder="Type your ideas here..."
                                    disabled={isSubmitting}
                                ></textarea>
                                <button
                                    onClick={handleShoutSubmit}
                                    disabled={isSubmitting || !shoutAnswer.trim()}
                                    className="mt-4 w-full bg-primary text-white font-black text-xl py-4 rounded-xl shadow-lg hover:bg-secondary transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    {isSubmitting ? 'Sending...' : 'Send to Board'}
                                </button>
                                <div className="mt-8 justify-center text-gray-500 font-medium flex items-center gap-2">
                                    <Sparkles size={18} /> Your answers will appear on the teacher's screen!
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'youtube':
                return (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-black">
                        {currentSlide.content?.video_id ? (
                            <iframe
                                key={currentSlide.id}
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${currentSlide.content.video_id}?rel=0`}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                allowFullScreen
                            ></iframe>
                        ) : (
                            <div className="flex flex-col items-center gap-4 text-white">
                                <Youtube size={64} className="text-red-500" />
                                <p className="text-xl font-bold">Video not available</p>
                            </div>
                        )}
                    </div>
                );
            case 'blank':
            default:
                return (
                    <div className="w-full h-full flex items-center justify-center relative">
                        <Board
                            key={currentSlide.id}
                            className="w-full h-full"
                            sessionId={sessionId}
                            readOnly={true}
                            initialSnapshot={currentSlide.drawing_data}
                        />
                    </div>
                );
        }
    };

    return (
        <div className="h-screen flex flex-col bg-[#F3F4F6] font-sans">
            {/* Header */}
            <header className="h-16 bg-white border-b-4 border-primary flex items-center justify-between px-6 shadow-sm z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                        <span className="text-xl">🎓</span>
                    </div>
                    <div>
                        <h1 className="font-extrabold text-gray-900 leading-tight">StarBridgeTutoring</h1>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{session.title}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="hidden sm:block text-sm font-semibold text-gray-500">{guestName}</span>
                    <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-1.5 rounded-full font-bold text-sm">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>
                        LIVE
                    </div>
                </div>
            </header>

            <DailyProvider callObject={callObject}>
                <div className="flex-1 flex overflow-hidden">
                    {/* Video Sidebar Component */}
                    {isJoined && <VideoSidebar />}

                    {/* Main Interactive Area */}
                    <main className="flex-1 relative p-4 sm:p-6 flex flex-col min-w-0 bg-[#F3F4F6]">
                        <div className="flex-1 w-full max-w-6xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 relative mb-16">
                            {/* Progress Bar + Slide Type Badge */}
                            <div className="absolute top-0 left-0 right-0 z-20">
                                <div className="h-1.5 bg-gray-100">
                                    <div
                                        className="h-full bg-primary transition-all duration-500 ease-out relative"
                                        style={{ width: `${((currentIndex + 1) / Math.max(slides.length, 1)) * 100}%` }}
                                    >
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow-md" />
                                    </div>
                                </div>
                                {currentSlide && (() => {
                                    const badges = {
                                        quiz: { emoji: '❓', label: 'Quiz', bg: 'bg-purple-100 text-purple-700' },
                                        poll: { emoji: '📊', label: 'Live Poll', bg: 'bg-blue-100 text-blue-700' },
                                        shout_it_out: { emoji: '💬', label: 'Shout It Out', bg: 'bg-yellow-100 text-yellow-700' },
                                        youtube: { emoji: '▶️', label: 'Video', bg: 'bg-red-100 text-red-700' },
                                        image: { emoji: '🖼️', label: 'Image', bg: 'bg-green-100 text-green-700' },
                                    };
                                    const badge = badges[currentSlide.type];
                                    if (!badge) return null;
                                    return (
                                        <div className="flex justify-center pt-1.5">
                                            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${badge.bg}`}>
                                                {badge.emoji} {badge.label}
                                            </span>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Render specific slide content */}
                            {renderSlideContent()}
                        </div>

                        {/* Student AV Controls */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-gray-800/90 backdrop-blur px-6 py-3 rounded-2xl shadow-2xl border border-gray-700 z-50">
                            <button
                                onClick={handleToggleAudio}
                                className={`p-3 rounded-full transition-colors ${isAudioOn ? 'hover:bg-gray-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                                title={isAudioOn ? "Mute Microphone" : "Unmute Microphone"}
                            >
                                {isAudioOn ? <Mic size={20} /> : <MicOff size={20} />}
                            </button>
                            <button
                                onClick={handleToggleVideo}
                                className={`p-3 rounded-full transition-colors ${isVideoOn ? 'hover:bg-gray-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                                title={isVideoOn ? "Turn Camera Off" : "Turn Camera On"}
                            >
                                {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
                            </button>
                            <button
                                onClick={toggleScreenShare}
                                className={`p-3 rounded-full transition-colors ${isScreenSharing ? 'bg-green-500 hover:bg-green-600' : 'hover:bg-gray-700 text-gray-300'}`}
                                title={isScreenSharing ? "Stop Sharing Screen" : "Share Screen"}
                            >
                                <MonitorUp size={20} className={isScreenSharing ? "text-white" : ""} />
                            </button>
                        </div>
                    </main>
                </div>
            </DailyProvider>
        </div>
    );
};

export default ClassroomStudent;

