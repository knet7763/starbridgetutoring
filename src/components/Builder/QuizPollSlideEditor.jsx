import React from 'react';
import { HelpCircle, BarChart2, Trash2, Plus } from 'lucide-react';

const QuizPollSlideEditor = ({ slide, updateSlideContent }) => {
    const isQuiz = slide.type === 'quiz';
    const content = slide.content || {};
    const options = content.options || [];

    const handleQuestionChange = (e) => {
        updateSlideContent({ question: e.target.value });
    };

    const handleOptionChange = (idx, value) => {
        const newOptions = [...options];
        newOptions[idx] = value;
        updateSlideContent({ options: newOptions });
    };

    const handleOptionDelete = (idx) => {
        const newOptions = options.filter((_, i) => i !== idx);
        let newCorrectAnswer = content.correctAnswer;
        if (isQuiz && newCorrectAnswer >= idx) {
            newCorrectAnswer = Math.max(0, newCorrectAnswer - 1);
        }
        updateSlideContent({ options: newOptions, correctAnswer: newCorrectAnswer });
    };

    const handleOptionAdd = () => {
        const newOptions = [...options, `Option ${options.length + 1}`];
        updateSlideContent({ options: newOptions });
    };

    return (
        <div className="w-full h-full flex flex-col items-center overflow-y-auto bg-white p-8">
            <div className="w-full max-w-3xl">
                <div className="flex items-center gap-4 mb-8">
                    {isQuiz ? (
                        <HelpCircle size={48} className="text-purple-600" />
                    ) : (
                        <BarChart2 size={48} className="text-blue-600" />
                    )}
                    <h2 className="text-3xl font-extrabold text-gray-900">
                        {isQuiz ? 'Multiple Choice Quiz' : 'Live Poll'}
                    </h2>
                </div>

                <div className="mb-6">
                    <label className="block text-gray-700 text-lg font-bold mb-2">Question:</label>
                    <input
                        type="text"
                        value={content.question || ''}
                        onChange={handleQuestionChange}
                        className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none text-xl bg-gray-50"
                        placeholder="Enter your question here..."
                    />
                </div>

                <div className="space-y-4">
                    <label className="block text-gray-700 text-lg font-bold mb-2">Options:</label>
                    {options.map((option, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                            {isQuiz ? (
                                <input
                                    type="radio"
                                    name={`correct-answer-${slide.id}`}
                                    checked={content.correctAnswer === idx}
                                    onChange={() => updateSlideContent({ correctAnswer: idx })}
                                    className="w-5 h-5 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                    title="Mark as correct answer"
                                />
                            ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                            )}

                            <input
                                type="text"
                                value={option}
                                onChange={(e) => handleOptionChange(idx, e.target.value)}
                                className={`flex-1 p-3 border rounded-lg outline-none focus:ring-2 ${isQuiz && content.correctAnswer === idx
                                    ? 'border-purple-300 bg-purple-50 ring-purple-200'
                                    : 'bg-white focus:ring-indigo-100'
                                    }`}
                                placeholder={`Option ${idx + 1}`}
                            />
                            <button
                                onClick={() => handleOptionDelete(idx)}
                                className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))}

                    <button
                        onClick={handleOptionAdd}
                        className="w-full p-3 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-indigo-400 hover:text-indigo-600 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                        <Plus size={20} /> Add Option
                    </button>
                </div>

                {isQuiz && (
                    <p className="mt-6 text-sm flex items-center gap-2 text-purple-700 bg-purple-50 p-3 rounded-lg border border-purple-100">
                        <HelpCircle size={16} /> Select the radio button next to an option to mark it as the correct answer.
                    </p>
                )}
            </div>
        </div>
    );
};

export default QuizPollSlideEditor;
