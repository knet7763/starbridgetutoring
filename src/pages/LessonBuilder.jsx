import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Save, Image as ImageIcon, Type, MessageSquare, HelpCircle, BarChart2, Youtube, CheckCircle, AlertCircle, X, Book, BookOpen, Scale, Video, Sparkles, Loader2 } from 'lucide-react';

import Board from '../components/Whiteboard/Board';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Slide Editors
import ImageSlideEditor from '../components/Builder/ImageSlideEditor';
import YoutubeSlideEditor from '../components/Builder/YoutubeSlideEditor';
import ShoutItOutSlideEditor from '../components/Builder/ShoutItOutSlideEditor';
import QuizPollSlideEditor from '../components/Builder/QuizPollSlideEditor';
import QuranSlideEditor from '../components/Builder/QuranSlideEditor';
import HadithSlideEditor from '../components/Builder/HadithSlideEditor';
import FiqhSlideEditor from '../components/Builder/FiqhSlideEditor';

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
    const [showAIModal, setShowAIModal] = useState(false);
    const [aiTopic, setAiTopic] = useState('');
    const [aiGradeLevel, setAiGradeLevel] = useState('Grade 4-6');
    const [aiSlideCount, setAiSlideCount] = useState(5);
    const [generatingAI, setGeneratingAI] = useState(false);

    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    }, []);

    const handleLaunchVideo = async () => {
        // Start an in-app Live session (uses LiveKit via ClassroomHost)
        try {
            if (!user) return showToast('Please sign in to start a session', 'error');

            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            const payload = {
                lesson_id: lessonId,
                tutor_id: user.id,
                code,
                is_active: true,
            };

            const { data, error } = await api.sessions.start(payload);
            if (error) throw error;

            const sessionId = data?.id;
            if (!sessionId) throw new Error('Failed to create session');

            showToast('Live session started — opening classroom...');
            navigate(`/classroom/host/${sessionId}`);
        } catch (err) {
            console.error('Failed to launch live session:', err);
            showToast(err.message || 'Failed to start live session', 'error');
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

    const handleAIGenerate = async (mode = 'overwrite') => {
        if (!aiTopic.trim()) return showToast('Please enter a topic', 'error');
        setGeneratingAI(true);
        try {
            const { data, error } = await api.ai.generateLessonPlan(aiTopic, aiGradeLevel, aiSlideCount);
            if (error) throw error;

            if (data?.slides && data.slides.length > 0) {
                if (mode === 'overwrite') {
                    setSlides(data.slides);
                    setCurrentSlideIndex(0);
                    if (lessonTitle === 'Untitled Lesson') {
                        setLessonTitle(data.title);
                    }
                    showToast(`AI created ${data.slides.length} slides! Click 'Save' to commit.`);
                } else {
                    setSlides(prev => [...prev, ...data.slides]);
                    setCurrentSlideIndex(slides.length);
                    showToast(`Appended ${data.slides.length} AI slides to your lesson.`);
                }
                setShowAIModal(false);
                setAiTopic('');
            } else {
                showToast('No slides were generated.', 'error');
            }
        } catch (err) {
            console.error('AI generation failed:', err);
            showToast(err.message || 'AI generation failed', 'error');
        } finally {
            setGeneratingAI(false);
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
        } else if (type === 'hadith') {
            content = { hadith: '', narrator: '', source: '', translation: '' };
        } else if (type === 'fiqh') {
            content = { topic: '', scenario: '', rulings: ['', ''], principle: '' };
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
                        className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg font-bold flex items-center gap-2 transition-all border border-yellow-500/20"
                        title="Launch 1-on-1 Video Room (Jitsi Meet — free & open source)"
                        style={{ borderBottom: '3px solid #CA8A04' }}
                    >
                        <Video size={18} />
                        Launch 1on1 Video
                    </button>
                    <button
                        onClick={() => setShowAIModal(true)}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-md animate-pulse-subtle"
                        style={{ borderBottom: '3px solid #4338CA' }}
                    >
                        <Sparkles size={18} className="animate-pulse" />
                        AI Copilot
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
                                                                slide.type === 'hadith' ? <BookOpen size={24} className="text-emerald-500" /> :
                                                                    slide.type === 'fiqh' ? <Scale size={24} className="text-slate-500" /> :
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
                                { type: 'hadith', label: 'Hadith', Icon: BookOpen, color: 'emerald' },
                                { type: 'fiqh', label: 'Fiqh', Icon: Scale, color: 'slate' },
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
                        ) : slides.length > 0 && currentSlide.type === 'hadith' ? (
                            <HadithSlideEditor
                                slide={currentSlide}
                                updateSlideContent={updateCurrentSlideContent}
                            />
                        ) : slides.length > 0 && currentSlide.type === 'fiqh' ? (
                            <FiqhSlideEditor
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

            {/* AI Slide Generator Modal */}
            {showAIModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 backdrop-blur-md">
                    <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full border border-gray-100 flex flex-col relative mx-4">
                        <button
                            onClick={() => setShowAIModal(false)}
                            className="absolute top-6 right-6 p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                        >
                            <X size={18} />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-purple-100 rounded-2xl text-purple-600">
                                <Sparkles size={24} className="animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">AI Lesson Planner</h3>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">Generate customized interactive slide decks instantly</p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-2">Topic or Concept</label>
                                <input
                                    type="text"
                                    value={aiTopic}
                                    onChange={(e) => setAiTopic(e.target.value)}
                                    placeholder="e.g. Intro to fractions, Water Cycle, Photosynthesis"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-purple-500 text-sm placeholder-gray-400"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-2">Grade Level</label>
                                    <select
                                        value={aiGradeLevel}
                                        onChange={(e) => setAiGradeLevel(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-purple-500 text-sm text-gray-700"
                                    >
                                        <option value="Grade 1-3">Grade 1-3</option>
                                        <option value="Grade 4-6">Grade 4-6</option>
                                        <option value="Grade 7-9">Grade 7-9</option>
                                        <option value="Grade 10-12">Grade 10-12</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-2">Slides Count</label>
                                    <input
                                        type="number"
                                        min="2"
                                        max="5"
                                        value={aiSlideCount}
                                        onChange={(e) => setAiSlideCount(Math.max(2, Math.min(5, parseInt(e.target.value, 10) || 5)))}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-purple-500 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex gap-3">
                                <button
                                    onClick={() => handleAIGenerate('overwrite')}
                                    disabled={generatingAI}
                                    className="flex-1 px-4 py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {generatingAI ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" /> Generating...
                                        </>
                                    ) : (
                                        'Create & Overwrite'
                                    )}
                                </button>
                                <button
                                    onClick={() => handleAIGenerate('append')}
                                    disabled={generatingAI}
                                    className="flex-1 px-4 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center"
                                >
                                    Append Slides
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LessonBuilder;
