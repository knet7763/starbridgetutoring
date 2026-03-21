import React from 'react';
import { MessageSquare } from 'lucide-react';

const ShoutItOutSlideEditor = ({ slide, updateSlideContent }) => {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-yellow-50 p-8">
            <MessageSquare size={64} className="text-primary mb-6" />
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6">Shout It Out Activity</h2>
            <div className="w-full max-w-2xl text-center">
                <label className="block text-gray-700 text-lg font-bold mb-2 text-left">Prompt Question:</label>
                <input
                    type="text"
                    value={slide.content?.question || ''}
                    onChange={(e) => updateSlideContent({ question: e.target.value })}
                    className="w-full p-4 border-2 border-primary rounded-xl focus:ring-4 focus:ring-yellow-200 outline-none text-xl shadow-sm bg-white"
                    placeholder="e.g., What did you learn today?"
                />
                <p className="mt-4 text-gray-500 text-left">Students will see this question and can submit their answers to the interactive collaborative board.</p>
            </div>
        </div>
    );
};

export default ShoutItOutSlideEditor;
