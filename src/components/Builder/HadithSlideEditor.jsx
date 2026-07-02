import React from 'react';
import { BookOpen, Quote, HelpCircle } from 'lucide-react';

const HadithSlideEditor = ({ slide, updateSlideContent }) => {
    const { 
        hadith = '', 
        narrator = '', 
        source = '', 
        translation = '' 
    } = slide?.content || {};

    const handleChange = (e) => {
        const { name, value } = e.target;
        updateSlideContent({ [name]: value });
    };

    return (
        <div className="p-8 max-w-2xl mx-auto h-full flex flex-col justify-center overflow-y-auto">
            <div className="bg-emerald-50 rounded-3xl p-10 border-2 border-emerald-200 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-4 bg-emerald-600 text-white rounded-2xl">
                        <BookOpen size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900">Hadith Study Slide</h2>
                        <p className="text-emerald-700 font-medium">Input the Hadith text, translation, narrator, and source.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Arabic Hadith Text</label>
                        <textarea
                            name="hadith"
                            value={hadith}
                            onChange={handleChange}
                            placeholder="Hadith text in Arabic..."
                            rows={3}
                            dir="rtl"
                            style={{ fontFamily: "'Amiri', serif" }}
                            className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 outline-none font-bold text-gray-800 text-right text-lg"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">English Translation</label>
                        <textarea
                            name="translation"
                            value={translation}
                            onChange={handleChange}
                            placeholder="Hadith translation in English..."
                            rows={3}
                            className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 outline-none font-medium text-gray-800"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Narrated By</label>
                            <input
                                type="text"
                                name="narrator"
                                value={narrator}
                                onChange={handleChange}
                                placeholder="e.g. Abu Hurayrah"
                                className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-200 outline-none font-bold text-gray-800"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Source Reference</label>
                            <input
                                type="text"
                                name="source"
                                value={source}
                                onChange={handleChange}
                                placeholder="e.g. Sahih al-Bukhari"
                                className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-200 outline-none font-bold text-gray-800"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-10 p-6 bg-white/50 rounded-2xl border border-emerald-100 flex items-start gap-3">
                    <Quote className="text-emerald-600 mt-1" size={20} />
                    <p className="text-sm text-emerald-800 leading-relaxed italic">
                        "Make things easy for people and not difficult. Give good tidings and do not make people turn away." (Prophet Muhammad SAW)
                    </p>
                </div>
            </div>
        </div>
    );
};

export default HadithSlideEditor;
