import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { FileText, Download, Search, Filter, Eye } from 'lucide-react';
import LessonViewer from '../components/LessonViewer';


const Lessons = () => {
    const [lessons, setLessons] = useState([]);
    const [filteredLessons, setFilteredLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('All');
    const [selectedGrade, setSelectedGrade] = useState('All');
    const [selectedLesson, setSelectedLesson] = useState(null);


    useEffect(() => {
        fetchLessons();
    }, []);

    useEffect(() => {
        filterLessons();
    }, [lessons, searchTerm, selectedSubject, selectedGrade]);

    const fetchLessons = async () => {
        setLoading(true);
        const { data, error } = await api.lessons.getAll();

        if (error) {
            console.error('Error fetching lessons:', error);
        } else {
            setLessons(data || []);
        }
        setLoading(false);
    };

    const filterLessons = () => {
        let filtered = lessons;

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(lesson =>
                lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                lesson.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                lesson.subject.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by subject
        if (selectedSubject !== 'All') {
            filtered = filtered.filter(lesson => lesson.subject === selectedSubject);
        }

        // Filter by grade level
        if (selectedGrade !== 'All') {
            filtered = filtered.filter(lesson => lesson.grade_level?.includes(selectedGrade));
        }

        setFilteredLessons(filtered);
    };

    // Get unique subjects and grades for filters
    const subjects = ['All', ...new Set(lessons.map(l => l.subject).filter(Boolean))];
    const grades = ['All', ...new Set(lessons.flatMap(l => l.grade_level ? [l.grade_level] : []))];

    return (
        <div className="bg-white py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Lesson Library</h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Browse our collection of educational materials, worksheets, and lesson plans.
                    </p>
                </div>

                {/* Search and Filters */}
                <div className="mb-8 space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search lessons..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>

                    {/* Filter Pills */}
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex items-center space-x-2">
                            <Filter className="h-5 w-5 text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">Filters:</span>
                        </div>

                        {/* Subject Filter */}
                        <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            {subjects.map(subject => (
                                <option key={subject} value={subject}>{subject}</option>
                            ))}
                        </select>

                        {/* Grade Filter */}
                        {grades.length > 1 && (
                            <select
                                value={selectedGrade}
                                onChange={(e) => setSelectedGrade(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                {grades.map(grade => (
                                    <option key={grade} value={grade}>{grade}</option>
                                ))}
                            </select>
                        )}

                        {/* Results Count */}
                        <span className="text-sm text-gray-500">
                            {filteredLessons.length} {filteredLessons.length === 1 ? 'lesson' : 'lessons'} found
                        </span>
                    </div>
                </div>

                {/* Lessons Grid */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="text-xl text-gray-600">Loading lessons...</div>
                    </div>
                ) : filteredLessons.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No lessons found</h3>
                        <p className="text-gray-600">
                            {lessons.length === 0
                                ? 'Check back soon for new learning materials!'
                                : 'Try adjusting your filters or search term.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredLessons.map((lesson) => (
                            <div
                                key={lesson.id}
                                className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                            >
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-3">
                                        <FileText className="h-8 w-8 text-primary flex-shrink-0" />
                                        <div className="flex space-x-1">
                                            <button
                                                onClick={() => setSelectedLesson(lesson)}
                                                className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-full transition-colors"
                                                title="View lesson"
                                            >
                                                <Eye className="h-5 w-5" />
                                            </button>
                                            {lesson.file_url && (
                                                <a
                                                    href={lesson.file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-full transition-colors"
                                                    title="Download lesson"
                                                >
                                                    <Download className="h-5 w-5" />
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-bold text-gray-900 mb-2">{lesson.title}</h3>

                                    <div className="flex flex-wrap gap-2 mb-3">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {lesson.subject}
                                        </span>
                                        {lesson.grade_level && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                {lesson.grade_level}
                                            </span>
                                        )}
                                        {lesson.difficulty && (
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${lesson.difficulty === 'Beginner' ? 'bg-emerald-100 text-emerald-800' :
                                                    lesson.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                }`}>
                                                {lesson.difficulty}
                                            </span>
                                        )}
                                    </div>

                                    {lesson.description && (
                                        <p className="text-sm text-gray-600 line-clamp-3 mb-3">{lesson.description}</p>
                                    )}

                                    {lesson.tags && lesson.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {lesson.tags.map((tag, idx) => (
                                                <span
                                                    key={idx}
                                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                                                >
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {lesson.file_url && (
                                    <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                                        <a
                                            href={lesson.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm font-medium text-primary hover:text-secondary flex items-center"
                                        >
                                            <Download className="h-4 w-4 mr-1" />
                                            Download Lesson
                                        </a>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Lesson Viewer Modal */}
            {selectedLesson && (
                <LessonViewer
                    lesson={selectedLesson}
                    onClose={() => setSelectedLesson(null)}
                />
            )}
        </div>
    );
};

export default Lessons;

