import React, { useState, useEffect } from 'react';
import { Book, Loader2 } from 'lucide-react';

const QuranStage = ({ currentSlide }) => {
    const { surah, startAyah, endAyah } = currentSlide.content || {};
    const [verses, setVerses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!surah) return;
        
        setLoading(true);
        setError(null);

        // Fetch Arabic text and English translation
        Promise.all([
            fetch(`https://api.alquran.cloud/v1/surah/${surah}/editions/quran-uthmani`),
            fetch(`https://api.alquran.cloud/v1/surah/${surah}/editions/en.sahih`)
        ])
        .then(async ([arabicRes, englishRes]) => {
            const arabicData = await arabicRes.json();
            const englishData = await englishRes.json();
            
            if (arabicData.status === 'OK' && englishData.status === 'OK') {
                const start = (startAyah || 1) - 1;
                const end = endAyah || 7;
                
                const combinedVerses = arabicData.data[0].ayahs.slice(start, end).map((ayah, i) => ({
                    numberInSurah: ayah.numberInSurah,
                    text: ayah.text,
                    translation: englishData.data[0].ayahs[start + i].text
                }));
                
                setVerses(combinedVerses);
            } else {
                throw new Error('Failed to load Quran data');
            }
        })
        .catch(err => {
            console.error('Error fetching Quran verses:', err);
            setError('Could not load Quran verses. Please check your connection.');
        })
        .finally(() => setLoading(false));
    }, [surah, startAyah, endAyah]);

    if (loading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-yellow-50">
                <Loader2 size={48} className="animate-spin text-yellow-600 mb-4" />
                <p className="text-yellow-800 font-bold">Loading Verses...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-600 p-8 text-center">
                <Book size={64} className="mb-4 opacity-20" />
                <p className="text-xl font-bold">{error}</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col bg-yellow-50 overflow-y-auto p-6 sm:p-10">
            <div className="max-w-4xl mx-auto w-full space-y-12">
                {verses.map((v) => (
                    <div key={v.numberInSurah} className="group relative">
                        {/* Ayah Number Badge */}
                        <div className="absolute -left-12 top-0 w-8 h-8 rounded-full border-2 border-yellow-200 flex items-center justify-center text-xs font-bold text-yellow-700 bg-white shadow-sm">
                            {v.numberInSurah}
                        </div>
                        
                        {/* Arabic Text */}
                        <p className="text-right text-4xl sm:text-5xl font-arabic leading-[1.8] text-gray-900 mb-6 dir-rtl" style={{ fontFamily: "'Traditional Arabic', 'Amiri', serif" }}>
                            {v.text}
                        </p>
                        
                        {/* Translation */}
                        <p className="text-lg text-gray-600 font-medium leading-relaxed border-l-4 border-yellow-200 pl-6 py-1 italic">
                            {v.translation}
                        </p>
                    </div>
                ))}
            </div>
            
            {/* Scroll indicator */}
            <div className="mt-20 pt-10 border-t border-yellow-100 text-center">
                <p className="text-yellow-600 text-sm font-bold flex items-center justify-center gap-2">
                    <Book size={16} /> End of Selection
                </p>
            </div>
        </div>
    );
};

export default QuranStage;
