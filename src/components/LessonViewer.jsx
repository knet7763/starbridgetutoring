import React, { useState, useEffect } from 'react';
import { X, Maximize2, Minimize2, Download, CheckCircle, Circle, ChevronLeft, ChevronRight, Sparkles, HelpCircle, BarChart2, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import QuranStage from './Classroom/Stage/QuranStage';
import HadithStage from './Classroom/Stage/HadithStage';
import FiqhStage from './Classroom/Stage/FiqhStage';
import YoutubeStage from './Classroom/Stage/YoutubeStage';
import Board from './Whiteboard/Board';

const LessonViewer = ({ lesson, onClose }) => {
    const { student } = useAuth();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [progress, setProgress] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [slides, setSlides] = useState([]);
    const [loadingSlides, setLoadingSlides] = useState(true);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [starAwarded, setStarAwarded] = useState(false);

    // Track lesson view & fetch interactive slides
    useEffect(() => {
        if (!lesson?.id) return;

        supabase
            .from('lessons')
            .update({ view_count: (lesson.view_count || 0) + 1 })
            .eq('id', lesson.id)
            .then(() => {});

        let cancelled = false;
        setLoadingSlides(true);
        api.slides.getByLessonId(lesson.id).then(({ data }) => {
            if (!cancelled) {
                setSlides(data || []);
                setCurrentSlideIndex(0);
                setSelectedAnswer(null);
                setLoadingSlides(false);
            }
        }).catch(() => {
            if (!cancelled) setLoadingSlides(false);
        });

        return () => {
            cancelled = true;
        };
    }, [lesson?.id, lesson?.view_count]);

    // Track/Fetch User Progress
    useEffect(() => {
        const fetchProgress = async () => {
            if (!student || !lesson) return;

            const { data, error } = await supabase
                .from('lesson_progress')
                .select('*')
                .eq('student_id', student.id)
                .eq('lesson_id', lesson.id)
                .maybeSingle();

            if (data) {
                setProgress(data);
            } else if (!error && !data) {
                const { data: newProgress, error: insertError } = await supabase
                    .from('lesson_progress')
                    .insert([{
                        student_id: student.id,
                        lesson_id: lesson.id,
                        status: 'in_progress',
                        progress_percent: 20
                    }])
                    .select()
                    .maybeSingle();

                if (!insertError) setProgress(newProgress);
            }
        };

        fetchProgress();
    }, [student, lesson]);

    const toggleComplete = async () => {
        if (!student || !lesson || updating) return;
        setUpdating(true);

        const newStatus = progress?.status === 'completed' ? 'in_progress' : 'completed';
        const newPercent = newStatus === 'completed' ? 100 : 50;

        const { data, error } = await supabase
            .from('lesson_progress')
            .upsert({
                student_id: student.id,
                lesson_id: lesson.id,
                status: newStatus,
                progress_percent: newPercent,
                completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
                updated_at: new Date().toISOString()
            })
            .select()
            .maybeSingle();

        if (!error && data) {
            setProgress(data);
            if (newStatus === 'completed' && !starAwarded) {
                setStarAwarded(true);
                api.gamification.awardStar(student.id, 1).catch(() => {});
            }
        }
        setUpdating(false);
    };

    if (!lesson) return null;

    const isPDF = lesson.file_url?.toLowerCase().endsWith('.pdf');
    const currentSlide = slides[currentSlideIndex];

    const handleDownload = () => {
        if (lesson.file_url) {
            window.open(lesson.file_url, '_blank');
        }
    };

    const renderInteractiveSlide = () => {
        if (!currentSlide) return null;

        switch (currentSlide.type) {
            case 'quran':
                return <QuranStage currentSlide={currentSlide} isHost={true} />;
            case 'hadith':
                return <HadithStage currentSlide={currentSlide} isHost={true} />;
            case 'fiqh':
                return <FiqhStage currentSlide={currentSlide} />;
            case 'youtube':
                return <YoutubeStage currentSlide={currentSlide} />;
            case 'quiz':
            case 'poll': {
                const options = currentSlide.content?.options || ['Option A', 'Option B'];
                const correctIndex = currentSlide.content?.correctAnswer ?? 0;
                return (
                    <div className={`w-full h-full flex flex-col items-center justify-center p-8 overflow-y-auto ${currentSlide.type === 'quiz' ? 'bg-purple-50' : 'bg-blue-50'}`}>
                        {currentSlide.type === 'quiz' ? <HelpCircle size={56} className="text-purple-500 mb-4" /> : <BarChart2 size={56} className="text-blue-500 mb-4" />}
                        <span className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                            {currentSlide.type === 'quiz' ? 'Self-Check Quiz' : 'Reflection Poll'}
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-8 text-center max-w-2xl">
                            {currentSlide.content?.question || 'Check your understanding'}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                            {options.map((opt, idx) => {
                                const isChosen = selectedAnswer === idx;
                                const isCorrect = currentSlide.type === 'quiz' && idx === Number(correctIndex);
                                let btnStyle = 'bg-white border-gray-200 text-gray-800 hover:border-primary';
                                if (selectedAnswer !== null) {
                                    if (currentSlide.type === 'quiz') {
                                        if (isCorrect) btnStyle = 'bg-emerald-600 border-emerald-600 text-white shadow-lg';
                                        else if (isChosen) btnStyle = 'bg-red-500 border-red-500 text-white';
                                    } else if (isChosen) {
                                        btnStyle = 'bg-blue-600 border-blue-600 text-white shadow-lg';
                                    }
                                }
                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setSelectedAnswer(idx)}
                                        className={`py-4 px-6 rounded-2xl border-2 text-lg font-bold transition-all text-left flex items-center justify-between ${btnStyle}`}
                                    >
                                        <span>{opt}</span>
                                        {selectedAnswer !== null && currentSlide.type === 'quiz' && isCorrect && (
                                            <CheckCircle size={20} className="shrink-0 ml-2" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        {selectedAnswer !== null && (
                            <p className="mt-6 text-sm font-bold text-gray-700">
                                {currentSlide.type === 'quiz'
                                    ? (selectedAnswer === Number(correctIndex) ? '🎉 Correct! MashAllah, great job!' : '💡 Good try! Review the highlighted correct answer above.')
                                    : '✅ Response recorded!'}
                            </p>
                        )}
                    </div>
                );
            }
            case 'shout_it_out':
                return (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-yellow-50 text-center">
                        <MessageSquare size={56} className="text-primary mb-4" />
                        <span className="text-xs font-black uppercase tracking-widest text-yellow-700 mb-2">Discussion & Reflection Prompt</span>
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 max-w-2xl">
                            {currentSlide.content?.question || 'Think about this topic and share your thoughts in your next session!'}
                        </h3>
                    </div>
                );
            case 'image':
            case 'blank':
            default:
                return (
                    <div className="w-full h-full relative bg-white">
                        <Board
                            key={currentSlide.id}
                            sessionId={`self-study-${lesson.id}-${currentSlide.id}`}
                            readOnly={false}
                            backgroundImage={currentSlide.type === 'image' ? currentSlide.content?.url : null}
                            initialSnapshot={currentSlide.drawing_data}
                            className="w-full h-full"
                        />
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div
                className={`bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${isFullscreen ? 'w-full h-full' : 'w-full max-w-6xl h-[90vh]'
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-gray-900 truncate">{lesson.title}</h2>
                        <p className="text-sm text-gray-600">
                            {lesson.subject} {lesson.grade_level && `• ${lesson.grade_level}`}
                            {slides.length > 0 && ` • Slide ${currentSlideIndex + 1} of ${slides.length}`}
                        </p>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                        {student && (
                            <button
                                onClick={toggleComplete}
                                disabled={updating}
                                className={`flex items-center px-3.5 py-2 rounded-xl font-bold text-sm transition-colors border ${progress?.status === 'completed'
                                        ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                                        : 'bg-primary border-primary text-white hover:bg-yellow-600'
                                    }`}
                                title={progress?.status === 'completed' ? 'Completed' : 'Mark as Complete (+1 Star)'}
                            >
                                {progress?.status === 'completed' ? (
                                    <>
                                        <CheckCircle className="h-4 w-4 mr-1.5" />
                                        Completed {starAwarded && '⭐'}
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-4 w-4 mr-1.5" />
                                        Complete Lesson
                                    </>
                                )}
                            </button>
                        )}

                        {lesson.file_url && (
                            <button
                                onClick={handleDownload}
                                className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                                title="Download Attachment"
                            >
                                <Download className="h-5 w-5" />
                            </button>
                        )}
                        <button
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                        >
                            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Close"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden bg-gray-100 relative flex flex-col">
                    {loadingSlides ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : slides.length > 0 ? (
                        <>
                            <div className="flex-1 relative overflow-hidden">
                                {renderInteractiveSlide()}
                            </div>
                            {/* Interactive Slide Navigation Bar */}
                            <div className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between shrink-0">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCurrentSlideIndex(i => Math.max(0, i - 1));
                                        setSelectedAnswer(null);
                                    }}
                                    disabled={currentSlideIndex === 0}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-sm font-bold transition-colors"
                                >
                                    <ChevronLeft size={18} /> Previous Slide
                                </button>
                                <div className="flex items-center gap-2">
                                    {slides.map((s, idx) => (
                                        <button
                                            key={s.id || idx}
                                            type="button"
                                            onClick={() => {
                                                setCurrentSlideIndex(idx);
                                                setSelectedAnswer(null);
                                            }}
                                            className={`h-2.5 rounded-full transition-all ${idx === currentSlideIndex ? 'w-8 bg-primary' : 'w-2.5 bg-gray-700 hover:bg-gray-500'}`}
                                            title={`Slide ${idx + 1}`}
                                        />
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCurrentSlideIndex(i => Math.min(slides.length - 1, i + 1));
                                        setSelectedAnswer(null);
                                    }}
                                    disabled={currentSlideIndex === slides.length - 1}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-gray-950 hover:bg-yellow-400 disabled:opacity-40 text-sm font-black transition-colors"
                                >
                                    Next Slide <ChevronRight size={18} />
                                </button>
                            </div>
                        </>
                    ) : isPDF ? (
                        <iframe
                            src={`${lesson.file_url}#toolbar=1&navpanes=1&scrollbar=1`}
                            className="w-full h-full border-0"
                            title={lesson.title}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                            <Download className="h-16 w-16 text-gray-400 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                {lesson.title}
                            </h3>
                            <p className="text-gray-600 mb-6 max-w-md">
                                {lesson.description || 'Open or download this lesson resource below.'}
                            </p>
                            {lesson.file_url && (
                                <button
                                    onClick={handleDownload}
                                    className="inline-flex items-center px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-secondary transition-colors"
                                >
                                    <Download className="h-5 w-5 mr-2" />
                                    Download Lesson Material
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Optional: Description Footer */}
                {lesson.description && slides.length === 0 && (
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <p className="text-sm text-gray-700">{lesson.description}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LessonViewer;
