import React, { useState, useEffect } from 'react';
import { Book, Search, List } from 'lucide-react';

const QuranSlideEditor = ({ slide, updateSlideContent }) => {
    const { surah = 1, startAyah = 1, endAyah = 7 } = slide.content || {};
    const [surahs, setSurahs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch Surah list from Alquran.cloud API
        fetch('https://api.alquran.cloud/v1/surah')
            .then(res => res.json())
            .then(data => {
                setSurahs(data.data);
                setLoading(false);
            })
            .catch(err => console.error('Error fetching surahs:', err));
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        updateSlideContent({ [name]: parseInt(value) });
    };

    return (
        <div className="p-8 max-w-2xl mx-auto h-full flex flex-col justify-center">
            <div className="bg-yellow-50 rounded-3xl p-10 border-2 border-yellow-200 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-4 bg-yellow-500 text-white rounded-2xl">
                        <Book size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900">Quran Reader Slide</h2>
                        <p className="text-yellow-700 font-medium">Select a Surah and range of verses to study.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Select Surah</label>
                        <div className="relative">
                            <select
                                name="surah"
                                value={surah}
                                onChange={handleChange}
                                className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-yellow-200 focus:border-yellow-500 outline-none appearance-none font-bold text-gray-800"
                            >
                                {surahs.map(s => (
                                    <option key={s.number} value={s.number}>
                                        {s.number}. {s.englishName} ({s.name})
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                <List size={20} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Start Ayah</label>
                            <input
                                type="number"
                                name="startAyah"
                                value={startAyah}
                                onChange={handleChange}
                                min="1"
                                className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-yellow-200 outline-none font-bold text-gray-800"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">End Ayah</label>
                            <input
                                type="number"
                                name="endAyah"
                                value={endAyah}
                                onChange={handleChange}
                                min={startAyah}
                                className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-yellow-200 outline-none font-bold text-gray-800"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-10 p-6 bg-white/50 rounded-2xl border border-yellow-100 flex items-start gap-3">
                    <Search className="text-yellow-600 mt-1" size={20} />
                    <p className="text-sm text-yellow-800 leading-relaxed italic">
                        "The best among you are those who learn the Quran and teach it."
                    </p>
                </div>
            </div>
        </div>
    );
};

export default QuranSlideEditor;
