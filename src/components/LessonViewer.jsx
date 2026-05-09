import React, { useState, useEffect } from 'react';
import { X, Maximize2, Minimize2, Download, CheckCircle, Circle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const LessonViewer = ({ lesson, onClose }) => {
    const { student } = useAuth();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [progress, setProgress] = useState(null);
    const [updating, setUpdating] = useState(false);

    // Track lesson view
    useEffect(() => {
        if (lesson?.id) {
            // Increment view count
            supabase
                .from('lessons')
                .update({ view_count: (lesson.view_count || 0) + 1 })
                .eq('id', lesson.id)
                .then(() => {
                    console.log('View tracked for lesson:', lesson.title);
                });
        }
    }, [lesson?.id]);

    // Track/Fetch User Progress
    useEffect(() => {
        const fetchProgress = async () => {
            if (!student || !lesson) return;

            const { data, error } = await supabase
                .from('lesson_progress')
                .select('*')
                .eq('student_id', student.id)
                .eq('lesson_id', lesson.id)
                .single();

            if (data) {
                setProgress(data);
            } else if (!error && !data) {
                // If no progress exists, start it
                const { data: newProgress, error: insertError } = await supabase
                    .from('lesson_progress')
                    .insert([{
                        student_id: student.id,
                        lesson_id: lesson.id,
                        status: 'in_progress',
                        progress_percent: 0
                    }])
                    .select()
                    .single();

                if (!insertError) setProgress(newProgress);
            }
        };

        fetchProgress();
    }, [student, lesson]);

    const toggleComplete = async () => {
        if (!student || !lesson || updating) return;
        setUpdating(true);

        const newStatus = progress?.status === 'completed' ? 'in_progress' : 'completed';
        const newPercent = newStatus === 'completed' ? 100 : 50; // 50% if going back to in_progress

        const { data, error } = await supabase
            .from('lesson_progress')
            .update({
                status: newStatus,
                progress_percent: newPercent,
                completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
                updated_at: new Date().toISOString()
            })
            .eq('student_id', student.id)
            .eq('lesson_id', lesson.id)
            .select()
            .single();

        if (!error) {
            setProgress(data);
        }
        setUpdating(false);
    };

    if (!lesson) return null;

    const isPDF = lesson.file_url?.toLowerCase().endsWith('.pdf');

    const handleDownload = () => {
        window.open(lesson.file_url, '_blank');
    };

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
            <div
                className={`bg-white rounded-lg shadow-2xl flex flex-col transition-all duration-300 ${isFullscreen ? 'w-full h-full' : 'w-full max-w-6xl h-[90vh]'
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-gray-900 truncate">{lesson.title}</h2>
                        <p className="text-sm text-gray-600">{lesson.subject} {lesson.grade_level && `• ${lesson.grade_level}`}</p>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                        {student && (
                            <button
                                onClick={toggleComplete}
                                disabled={updating}
                                className={`flex items-center px-3 py-2 rounded-lg transition-colors border ${progress?.status === 'completed'
                                        ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                                title={progress?.status === 'completed' ? 'Mark as In Progress' : 'Mark as Complete'}
                            >
                                {progress?.status === 'completed' ? (
                                    <>
                                        <CheckCircle className="h-5 w-5 mr-2" />
                                        Completed
                                    </>
                                ) : (
                                    <>
                                        <Circle className="h-5 w-5 mr-2" />
                                        Mark Complete
                                    </>
                                )}
                            </button>
                        )}

                        <button
                            onClick={handleDownload}
                            className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                            title="Download"
                        >
                            <Download className="h-5 w-5" />
                        </button>
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
                <div className="flex-1 overflow-hidden bg-gray-100">
                    {isPDF ? (
                        <iframe
                            src={`${lesson.file_url}#toolbar=1&navpanes=1&scrollbar=1`}
                            className="w-full h-full border-0"
                            title={lesson.title}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                            <Download className="h-16 w-16 text-gray-400 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Preview not available
                            </h3>
                            <p className="text-gray-600 mb-6 max-w-md">
                                This file type cannot be previewed in the browser. Click the download button to view it on your device.
                            </p>
                            <button
                                onClick={handleDownload}
                                className="inline-flex items-center px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-secondary transition-colors"
                            >
                                <Download className="h-5 w-5 mr-2" />
                                Download Lesson
                            </button>
                        </div>
                    )}
                </div>

                {/* Optional: Description Footer */}
                {lesson.description && (
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <p className="text-sm text-gray-700">{lesson.description}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LessonViewer;
