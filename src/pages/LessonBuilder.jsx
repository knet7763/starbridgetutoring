import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Save, Image as ImageIcon, Type, MessageSquare, HelpCircle, BarChart2, Youtube, CheckCircle, AlertCircle, X, Book, Video, Loader2 } from 'lucide-react';
import Board from '../components/Whiteboard/Board';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Slide Editors
import ImageSlideEditor from '../components/Builder/ImageSlideEditor';
import YoutubeSlideEditor from '../components/Builder/YoutubeSlideEditor';
import ShoutItOutSlideEditor from '../components/Builder/ShoutItOutSlideEditor';
import QuizPollSlideEditor from '../components/Builder/QuizPollSlideEditor';
import QuranSlideEditor from '../components/Builder/QuranSlideEditor';

// ── Minimal toast ─────────────────────────────────────────────────────────────
const Toast = ({ toast, onDismiss }) => {
    if (!toast) return null;
    const isSuccess = toast.type === 'success';
    return (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-white text-sm font-semibold transition-all animate-bounce-in ${isSuccess ? 'bg-green-600' : 'bg-red-600'
            }`}>
            {isSuccess ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{toast.message}</span>
            <button onClick={onDismiss} className="ml-2 opacity-70 hover:opacity-100"><X size={16} /></button>
        </div>
    );
};

const LessonBuilder = () => {
    const { lessonId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lessonTitle, setLessonTitle] = useState('Untitled Lesson');
    const [slides, setSlides] = useState([]);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [toast, setToast] = useState(null);
    const [launchingVideo, setLaunchingVideo] = useState(false);

    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    }, []);

    const handleLaunchVideo = async () => {
        setLaunchingVideo(true);
        try {
            const { data, error } = await api.meetings.createQuickRoom();
            if (error) {
                console.error('Supabase Edge Function error:', error);
                let errorMsg = error.message;
                if (error.context) {
                    try {
                        const bodyText = await error.context.text();
                        const parsed = JSON.parse(bodyText);
                        errorMsg = parsed.error || parsed.message || bodyText;
                    } catch (_) {}
                }
                throw new Error(errorMsg);
            }
            if (data?.room_url) {
                window.open(data.room_url, '_blank');
                showToast('1-on-1 video room launched!');
            } else {
                throw new Error('Failed to fetch a video room URL.');
            }
        } catch (error) {
            console.error('Error launching video room:', error);
            showToast(error.message || 'Failed to launch video room.', 'error');
        } finally {
            setLaunchingVideo(false);
        }
    };

    useEffect(() => {
        if (user && lessonId) {
            fetchLessonData();
        }
    }, [user, lessonId]);

    const fetchLessonData = async () => {
        try {
            // Check if it's a new or existing lesson
            if (lessonId.startsWith('new-')) {
                // It's a placeholder ID
                setSlides([{ id: 'temp-1', type: 'blank', content: {} }]);
                setLoading(false);
                return;
            }

            // Fetch lesson details
            const { data: lesson, error: lessonError } = await api.lessons.getById(lessonId);

            if (lessonError) throw lessonError;
            setLessonTitle(lesson.title);

            // Fetch slides
            const { data: lessonSlides, error: slidesError } = await api.slides.getByLessonId(lessonId);

            if (slidesError) throw slidesError;

            if (lessonSlides && lessonSlides.length > 0) {
                setSlides(lessonSlides);
            } else {
                setSlides([{ id: 'temp-1', type: 'blank', content: {} }]);
            }
        } catch (error) {
            console.error('Error loading lesson:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            let realLessonId = lessonId;

            // 1. Create or Update Lesson
            if (lessonId.startsWith('new-')) {
                const { data, error } = await api.lessons.create({ title: lessonTitle, tutor_id: user.id });
                if (error) throw error;
                realLessonId = data.id;
                // Update URL without reload
                navigate(`/teacher/lesson/${realLessonId}`, { replace: true });
            } else {
                await api.lessons.update(lessonId, { title: lessonTitle, updated_at: new Date() });
            }

            // 2. Save Slides
            for (let i = 0; i < slides.length; i++) {
                const slide = slides[i];
                const slideData = {
                    lesson_id: realLessonId,
                    order_index: i,
                    type: slide.type,
                    content: slide.content,
                    drawing_data: slide.drawing_data || {},
                };

                if (slide.id.startsWith('temp-')) {
                    // It's a new slide
                    const { error: insertError } = await api.slides.create(slideData);

                    if (insertError) {
                        console.error('Insert slide error:', insertError);
                        throw insertError;
                    }
                } else {
                    // It's an existing slide
                    slideData.id = slide.id;
                    const { error: updateError } = await api.slides.upsert([slideData]);

                    if (updateError) {
                        console.error('Update slide error:', updateError);
                        throw updateError;
                    }
                }
            }

            showToast('Lesson saved!');
            fetchLessonData();

        } catch (error) {
            console.error('Detailed error saving lesson:', error);
            showToast(error.message || 'Failed to save lesson', 'error');
        } finally {
            setSaving(false);
        }
    };

    const deleteSlide = async (index) => {
        if (slides.length <= 1) return; // always keep at least 1 slide
        const slide = slides[index];
        // Delete from DB if it's a saved slide
        if (!slide.id.startsWith('temp-')) {
            await api.slides.delete(slide.id);
        }
        const updated = slides.filter((_, i) => i !== index);
        setSlides(updated);
        setCurrentSlideIndex(Math.min(index, updated.length - 1));
        showToast('Slide deleted');
    };

    const addSlide = (type = 'blank') => {
        let content = {};
        if (type === 'shout_it_out') {
            content = { question: 'What did you learn today?' };
        } else if (type === 'quiz') {
            content = { question: 'New Question?', options: ['Option A', 'Option B'], correctAnswer: 0 };
        } else if (type === 'poll') {
            content = { question: 'How are you feeling?', options: ['Great', 'Good', 'Okay'] };
        } else if (type === 'youtube') {
            content = { url: '', video_id: '' };
        } else if (type === 'image') {
            content = { url: '', caption: '' };
        } else if (type === 'quran') {
            content = { surah: 1, startAyah: 1, endAyah: 7 };
        }

        const newSlide = { id: `temp-${Date.now()}`, type: type, content };
        setSlides([...slides, newSlide]);
        setCurrentSlideIndex(slides.length);
    };

    const updateCurrentSlideContent = (newContent) => {
        const updated = [...slides];
        updated[currentSlideIndex].content = { ...updated[currentSlideIndex].content, ...newContent };
        setSlides(updated);
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary" /></div>;

    const currentSlide = slides[currentSlideIndex];

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            <Toast toast={toast} onDismiss={() => setToast(null)} />
            {/* Header */}
            <header className="h-16 bg-white border-b flex items-center justify-between px-6 shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <Link to="/teacher/dashboard" className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
                        <ChevronLeft size={24} />
                    </Link>
                    <input
                        type="text"
                        value={lessonTitle}
                        onChange={(e) => setLessonTitle(e.target.value)}
                        className="text-lg font-semibold border-none focus:ring-0 text-gray-800 bg-transparent"
                    />
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleLaunchVideo}
                        disabled={launchingVideo}
                        className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 transition-all border border-yellow-500/20"
                        title="Launch 1-on-1 Video Room"
                        style={{ borderBottom: '3px solid #CA8A04' }}
                    >
                        {launchingVideo ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <Video size={18} />
                        )}
                        {launchingVideo ? 'Launching...' : 'Launch 1on1 Video'}
                    </button>
                    <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium">
                        Preview
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save size={18} /> {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar - Slide List */}
                <div className="w-64 bg-white border-r flex flex-col overflow-y-auto">
                    <div className="p-4">
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Slides</h2>
                        <div className="space-y-3">
                            {slides.map((slide, index) => (
                                <div
                                    key={slide.id}
                                    onClick={() => setCurrentSlideIndex(index)}
                                    className={`
                                        group relative aspect-video rounded-lg border-2 cursor-pointer transition-all
                                        ${index === currentSlideIndex ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-gray-200 hover:border-gray-300'}
                                    `}
                                >
                                    <div className="absolute top-2 left-2 bg-gray-900/10 text-gray-700 text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full z-10">
                                        {index + 1}
                                    </div>
                                    {slides.length > 1 && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteSlide(index); }}
                                            className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center transition-opacity hover:bg-red-600"
                                            title="Delete slide"
                                        >
                                            <X size={11} />
                                        </button>
                                    )}
                                    <div className="flex items-center justify-center h-full text-gray-300">
                                        {slide.type === 'image' ? (
                                            slide.content?.url
                                                ? <img src={slide.content.url} alt="" className="w-full h-full object-cover rounded-md" />
                                                : <ImageIcon size={24} className="text-green-400" />
                                        ) : slide.type === 'title' ? <Type size={24} /> :
                                            slide.type === 'shout_it_out' ? <MessageSquare size={24} className="text-yellow-400" /> :
                                                slide.type === 'youtube' ? <Youtube size={24} className="text-red-500" /> :
                                                    slide.type === 'quiz' ? <HelpCircle size={24} className="text-purple-400" /> :
                                                        slide.type === 'poll' ? <BarChart2 size={24} className="text-blue-400" /> :
                                                            slide.type === 'quran' ? <Book size={24} className="text-yellow-600" /> :
                                                                <div className="w-full h-full bg-gray-50" />}
                                    </div>
                                </div>
                            ))}

                            {/* Slide type picker — 3 per row */}
                            {[
                                { type: 'blank', label: 'Board', Icon: Plus, color: 'gray' },
                                { type: 'image', label: 'Image', Icon: ImageIcon, color: 'green' },
                                { type: 'shout_it_out', label: 'Shout It', Icon: MessageSquare, color: 'yellow' },
                                { type: 'quiz', label: 'Quiz', Icon: HelpCircle, color: 'purple' },
                                { type: 'poll', label: 'Poll', Icon: BarChart2, color: 'blue' },
                                { type: 'youtube', label: 'YouTube', Icon: Youtube, color: 'red' },
                                { type: 'quran', label: 'Quran', Icon: Book, color: 'yellow' },
                            ].reduce((rows, item, i) => {
                                if (i % 3 === 0) rows.push([]);
                                rows[rows.length - 1].push(item);
                                return rows;
                            }, []).map((row, ri) => (
                                <div key={ri} className="flex gap-2 mb-2">
                                    {row.map(({ type, label, Icon, color }) => (
                                        <button
                                            key={type}
                                            onClick={() => addSlide(type)}
                                            className={`flex-1 aspect-video rounded-lg border-2 border-dashed border-${color}-300 hover:border-${color}-500 hover:bg-${color}-50 flex flex-col items-center justify-center text-${color}-600 transition-all bg-white`}
                                            title={`Add ${label} slide`}
                                        >
                                            <Icon size={18} className="mb-1" />
                                            <span className="text-[10px] font-medium text-center leading-tight">{label}</span>
                                        </button>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content - Editor */}
                <div className="flex-1 flex flex-col relative bg-gray-100">
                    <div className="absolute inset-4 bg-white rounded-xl shadow-lg overflow-hidden">
                        {slides.length > 0 && currentSlide.type === 'image' ? (
                            <ImageSlideEditor
                                slide={currentSlide}
                                updateSlideContent={updateCurrentSlideContent}
                            />
                        ) : slides.length > 0 && currentSlide.type === 'youtube' ? (
                            <YoutubeSlideEditor
                                slide={currentSlide}
                                updateSlideContent={updateCurrentSlideContent}
                            />
                        ) : slides.length > 0 && currentSlide.type === 'shout_it_out' ? (
                            <ShoutItOutSlideEditor
                                slide={currentSlide}
                                updateSlideContent={updateCurrentSlideContent}
                            />
                        ) : slides.length > 0 && (currentSlide.type === 'quiz' || currentSlide.type === 'poll') ? (
                            <QuizPollSlideEditor
                                slide={currentSlide}
                                updateSlideContent={updateCurrentSlideContent}
                            />
                        ) : slides.length > 0 && currentSlide.type === 'quran' ? (
                            <QuranSlideEditor
                                slide={currentSlide}
                                updateSlideContent={updateCurrentSlideContent}
                            />
                        ) : slides.length > 0 ? (
                            <Board
                                key={currentSlide.id} // Reset board on slide change
                                initialSnapshot={currentSlide.drawing_data}
                                onChange={(snapshot) => {
                                    const newSlides = [...slides];
                                    newSlides[currentSlideIndex] = { ...newSlides[currentSlideIndex], drawing_data: snapshot };
                                    setSlides(newSlides);
                                }}
                                className="w-full h-full"
                            />
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LessonBuilder;
