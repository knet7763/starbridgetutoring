import React from 'react';

const QuizStage = ({ currentSlide, shoutResponses }) => {
    return (
        <div className="absolute inset-0 z-40 bg-gray-50 flex flex-col items-center justify-center p-8">
            <h2 className="text-4xl font-black text-gray-900 mb-8">{currentSlide.content?.question}</h2>
            <div className="w-full max-w-4xl grid grid-cols-2 gap-6">
                {(currentSlide.content?.options || []).map((opt, i) => {
                    const count = shoutResponses.filter(r => parseInt(r.answer) === i).length;
                    const total = Math.max(shoutResponses.length, 1);
                    const percent = Math.round((count / total) * 100);
                    const isCorrect = currentSlide.content?.correctAnswer === i;
                    return (
                        <div key={i} className={`p-6 rounded-2xl relative overflow-hidden border-2 shadow-sm ${isCorrect ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white'}`}>
                            <div className={`absolute top-0 left-0 bottom-0 opacity-20 transition-all duration-1000 ${isCorrect ? 'bg-green-500' : 'bg-indigo-500'}`} style={{ width: `${percent}%` }}></div>
                            <div className="relative z-10 flex justify-between items-center text-xl font-bold">
                                <span className={`flex items-center gap-3 ${isCorrect ? 'text-green-800' : 'text-gray-800'}`}>
                                    {opt}
                                    {isCorrect && <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full uppercase tracking-wider">Correct</span>}
                                </span>
                                <span className={isCorrect ? 'text-green-700' : 'text-indigo-600'}>{count} ({percent}%)</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default QuizStage;
