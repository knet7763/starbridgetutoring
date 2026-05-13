import React from 'react';
import { Quote, BookOpen } from 'lucide-react';

const HadithStage = ({ currentSlide }) => {
    const { hadith, narrator, source, translation } = currentSlide.content || {};

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-emerald-50 p-8 sm:p-16 overflow-y-auto">
            <div className="max-w-3xl w-full bg-white rounded-[2rem] shadow-2xl p-8 sm:p-12 relative overflow-hidden border border-emerald-100">
                <div className="absolute top-0 right-0 p-8 opacity-5 text-emerald-900">
                    <Quote size={120} />
                </div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-3 text-emerald-600 font-bold mb-8 uppercase tracking-widest text-sm">
                        <BookOpen size={18} /> Daily Hadith Study
                    </div>

                    {hadith && (
                        <p className="text-right text-3xl sm:text-4xl font-arabic leading-[1.8] text-gray-900 mb-10 dir-rtl" style={{ fontFamily: "'Amiri', serif" }}>
                            {hadith}
                        </p>
                    )}

                    <div className="space-y-4">
                        <p className="text-xl sm:text-2xl text-gray-800 font-bold leading-relaxed italic">
                            "{translation || 'No translation provided.'}"
                        </p>
                        
                        <div className="pt-6 border-t border-emerald-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="text-emerald-700 font-bold">
                                Narrated by: <span className="text-gray-900">{narrator || 'Unknown'}</span>
                            </div>
                            <div className="bg-emerald-100 text-emerald-800 px-4 py-1 rounded-full text-xs font-black uppercase">
                                Source: {source || 'Sahih Bukhari'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HadithStage;
