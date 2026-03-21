import React, { useState } from 'react';
import { api } from '../../services/api';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import Button from '../Button';
import FileUpload from '../FileUpload';

const AdminLessonsTab = ({ lessons, loading, fetchLessons }) => {
    const [showLessonForm, setShowLessonForm] = useState(false);
    const [editingLesson, setEditingLesson] = useState(null);
    const [lessonForm, setLessonForm] = useState({
        title: '',
        description: '',
        file_url: '',
        subject: '',
        grade_level: '',
        tags: '',
        difficulty: '',
    });

    const handleLessonSubmit = async (e) => {
        e.preventDefault();

        // Process tags: convert comma-separated string to array
        const lessonData = {
            ...lessonForm,
            tags: lessonForm.tags ? lessonForm.tags.split(',').map(tag => tag.trim()) : [],
        };

        if (editingLesson) {
            const { error } = await api.lessons.update(editingLesson.id, lessonData);
            if (!error) {
                fetchLessons();
                resetLessonForm();
            }
        } else {
            const { error } = await api.lessons.create(lessonData);
            if (!error) {
                fetchLessons();
                resetLessonForm();
            }
        }
    };

    const deleteLesson = async (id) => {
        if (window.confirm('Are you sure you want to delete this lesson?')) {
            const { error } = await api.lessons.delete(id);
            if (!error) fetchLessons();
        }
    };

    const editLesson = (lesson) => {
        setEditingLesson(lesson);
        setLessonForm({
            ...lesson,
            tags: lesson.tags?.join(', ') || '',
        });
        setShowLessonForm(true);
    };

    const resetLessonForm = () => {
        setLessonForm({ title: '', description: '', file_url: '', subject: '', grade_level: '', tags: '', difficulty: '' });
        setEditingLesson(null);
        setShowLessonForm(false);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Manage Lessons</h2>
                <Button
                    onClick={() => setShowLessonForm(!showLessonForm)}
                    variant="primary"
                    className="flex items-center"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Lesson
                </Button>
            </div>

            {/* Lesson Form */}
            {showLessonForm && (
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                    <h3 className="text-lg font-semibold mb-4">
                        {editingLesson ? 'Edit Lesson' : 'Add New Lesson'}
                    </h3>
                    <form onSubmit={handleLessonSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Title</label>
                            <input
                                type="text"
                                required
                                value={lessonForm.title}
                                onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Subject</label>
                            <input
                                type="text"
                                required
                                value={lessonForm.subject}
                                onChange={(e) => setLessonForm({ ...lessonForm, subject: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Grade Level</label>
                            <input
                                type="text"
                                value={lessonForm.grade_level}
                                onChange={(e) => setLessonForm({ ...lessonForm, grade_level: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border"
                                placeholder="e.g., Grades 6-8"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                                value={lessonForm.description}
                                onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                                rows={3}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Tags (comma separated)
                            </label>
                            <input
                                type="text"
                                value={lessonForm.tags}
                                onChange={(e) => setLessonForm({ ...lessonForm, tags: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border"
                                placeholder="interactive, homework, quiz"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Add tags to help students find lessons (e.g., interactive, homework, review)
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Difficulty</label>
                            <select
                                value={lessonForm.difficulty}
                                onChange={(e) => setLessonForm({ ...lessonForm, difficulty: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border"
                            >
                                <option value="">Select difficulty</option>
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                            </select>
                        </div>
                        <FileUpload
                            label="Lesson File (PDF, PPT, etc.)"
                            accept=".pdf,.ppt,.pptx,.doc,.docx"
                            bucket="lesson-files"
                            currentFileUrl={lessonForm.file_url}
                            onUploadComplete={(url) => setLessonForm({ ...lessonForm, file_url: url })}
                        />

                        <div className="flex space-x-3">
                            <Button type="submit" variant="primary">
                                {editingLesson ? 'Update' : 'Create'} Lesson
                            </Button>
                            <Button type="button" variant="outline" onClick={resetLessonForm}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Lessons List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {loading ? (
                        <li className="px-6 py-4 text-center text-gray-500">Loading...</li>
                    ) : lessons.length === 0 ? (
                        <li className="px-6 py-4 text-center text-gray-500">No lessons yet. Add one!</li>
                    ) : (
                        lessons.map((lesson) => (
                            <li key={lesson.id} className="px-6 py-4 hover:bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">{lesson.title}</h3>
                                        <p className="text-sm text-gray-500">{lesson.subject}</p>
                                        {lesson.grade_level && (
                                            <p className="text-xs text-gray-400">{lesson.grade_level}</p>
                                        )}
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => editLesson(lesson)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                        >
                                            <Edit2 className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => deleteLesson(lesson.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
};

export default AdminLessonsTab;
