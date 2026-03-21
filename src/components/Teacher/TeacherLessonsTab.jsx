import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Play, Edit, MoreVertical, Copy, Trash2 } from 'lucide-react';
import { api } from '../../services/api';

const TeacherLessonsTab = ({ lessons, setLessons, setStartSessionLesson, user }) => {
    const navigate = useNavigate();
    const [openMenuId, setOpenMenuId] = useState(null);

    const handleCreateLesson = () => navigate(`/teacher/lesson/new-${Date.now()}`);

    const handleDeleteLesson = async (lessonId) => {
        if (!window.confirm('Delete this lesson? This cannot be undone.')) return;
        await api.lessons.delete(lessonId);
        setLessons(prev => prev.filter(l => l.id !== lessonId));
    };

    const handleDuplicateLesson = async (lesson) => {
        setOpenMenuId(null);
        try {
            // Clone the lesson
            const { data: newLesson, error: lessonErr } = await api.lessons.create({
                title: `${lesson.title} (Copy)`,
                tutor_id: user.id,
                description: lesson.description
            });
            if (lessonErr) throw lessonErr;

            // Clone slides
            const { data: srcSlides } = await api.slides.getByLessonId(lesson.id);
            if (srcSlides && srcSlides.length > 0) {
                const cloned = srcSlides.map(({ id, created_at, ...rest }) => ({ ...rest, lesson_id: newLesson.id }));
                await api.slides.cloneBatch(cloned);
            }

            setLessons(prev => [newLesson, ...prev]);
        } catch (err) {
            console.error('Duplicate failed:', err);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.map((lesson) => (
                <div key={lesson.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                    <div className="h-36 bg-gradient-to-br from-yellow-50 to-amber-100 flex items-center justify-center border-b border-amber-100">
                        <span className="text-5xl transform group-hover:scale-110 transition-transform">🌟</span>
                    </div>
                    <div className="p-5">
                        <h3 className="text-lg font-bold text-gray-900 mb-0.5 truncate">{lesson.title}</h3>
                        <p className="text-sm text-gray-400 mb-4 truncate">{lesson.description || 'Interactive Lesson'}</p>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => setStartSessionLesson(lesson)}
                                className="col-span-2 flex items-center justify-center gap-1.5 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-semibold text-sm transition-colors"
                            >
                                <Play size={15} fill="currentColor" />
                                Start Live
                            </button>
                            <button
                                onClick={() => navigate(`/teacher/lesson/${lesson.id}`)}
                                className="flex items-center justify-center gap-1.5 bg-gray-50 text-gray-700 py-2 rounded-lg hover:bg-gray-100 border border-gray-200 font-semibold text-sm transition-colors"
                            >
                                <Edit size={15} />
                                Edit
                            </button>
                        </div>
                        {/* 3-dot menu */}
                        <div className="relative mt-2">
                            <button
                                onClick={() => setOpenMenuId(openMenuId === lesson.id ? null : lesson.id)}
                                className="w-full flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-gray-600 py-1 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <MoreVertical size={14} /> More
                            </button>
                            {openMenuId === lesson.id && (
                                <div className="absolute bottom-8 left-0 right-0 bg-white rounded-xl border border-gray-100 shadow-xl z-20 overflow-hidden">
                                    <button
                                        onClick={() => handleDuplicateLesson(lesson)}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        <Copy size={14} /> Duplicate Lesson
                                    </button>
                                    <button
                                        onClick={() => { setOpenMenuId(null); handleDeleteLesson(lesson.id); }}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <Trash2 size={14} /> Delete Lesson
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}

            {/* Add new lesson card */}
            <button
                onClick={handleCreateLesson}
                className="bg-white rounded-2xl border-2 border-dashed border-gray-200 hover:border-primary hover:bg-yellow-50/50 flex flex-col items-center justify-center gap-4 p-8 transition-all group min-h-[220px]"
            >
                <div className="w-14 h-14 bg-gray-100 group-hover:bg-yellow-100 rounded-2xl flex items-center justify-center transition-colors">
                    <Plus size={28} className="text-gray-400 group-hover:text-primary transition-colors" />
                </div>
                <span className="text-gray-500 group-hover:text-primary font-semibold transition-colors">New Lesson</span>
            </button>

            {lessons.length === 0 && (
                <div className="col-span-full py-16 text-center">
                    <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-700 mb-1">No Lessons Yet</h3>
                    <p className="text-gray-400">Create your first interactive lesson above.</p>
                </div>
            )}
        </div>
    );
};

export default TeacherLessonsTab;
