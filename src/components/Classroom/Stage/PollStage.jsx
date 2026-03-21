import React from 'react';

const PollStage = ({ currentSlide, shoutResponses }) => {
    return (
        <div className="absolute inset-0 z-40 bg-gray-50 flex flex-col items-center justify-center p-8">
            <h2 className="text-4xl font-black text-gray-900 mb-8">{currentSlide.content?.question}</h2>
            <div className="w-full max-w-4xl space-y-4">
                {(currentSlide.content?.options || []).map((opt, i) => {
                    const count = shoutResponses.filter(r => parseInt(r.answer) === i).length;
                    const total = Math.max(shoutResponses.length, 1);
                    const percent = Math.round((count / total) * 100);
                    return (
                        <div key={i} className="p-6 rounded-2xl relative overflow-hidden border-2 border-gray-200 bg-white shadow-sm">
                            <div className="absolute top-0 left-0 bottom-0 bg-blue-500 opacity-20 transition-all duration-1000" style={{ width: `${percent}%` }}></div>
                            <div className="relative z-10 flex justify-between items-center text-xl font-bold">
                                <span className="text-gray-800">{opt}</span>
                                <span className="text-blue-600">{count} ({percent}%)</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PollStage;
