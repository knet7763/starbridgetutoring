import React, { useState, useEffect, useRef } from 'react';
import { Book, Loader2, Play, Pause, Volume2, Headphones } from 'lucide-react';

const RECITERS = [
    { id: 'ar.alafasy', name: 'Mishary Rashid Alafasy' },
    { id: 'ar.abdulsamad', name: 'Abdul Basit' },
    { id: 'ar.saadghamidi', name: 'Saad Al-Ghamdi' },
    { id: 'ar.minshawi', name: 'Siddiq El-Minshawi' },
];

const QuranStage = ({ currentSlide }) => {
    const { surah, startAyah, endAyah } = currentSlide.content || {};
    const [verses, setVerses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [surahName, setSurahName] = useState('');
    const [surahEnglishName, setSurahEnglishName] = useState('');
    
    const [reciter, setReciter] = useState('ar.alafasy');
    const [playingIndex, setPlayingIndex] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(new Audio());

    // Fetch Arabic, English and Audio editions
    useEffect(() => {
        if (!surah) return;
        
        setLoading(true);
        setError(null);
        setPlayingIndex(null);
        setIsPlaying(false);
        audioRef.current.pause();

        Promise.all([
            fetch(`https://api.alquran.cloud/v1/surah/${surah}/editions/quran-uthmani`),
            fetch(`https://api.alquran.cloud/v1/surah/${surah}/editions/en.sahih`),
            fetch(`https://api.alquran.cloud/v1/surah/${surah}/${reciter}`)
        ])
        .then(async ([arabicRes, englishRes, audioRes]) => {
            const arabicData = await arabicRes.json();
            const englishData = await englishRes.json();
            const audioData = await audioRes.json();
            
            if (arabicData.status === 'OK' && englishData.status === 'OK' && audioData.status === 'OK') {
                setSurahName(arabicData.data[0].name);
                setSurahEnglishName(arabicData.data[0].englishName);
                
                const start = (startAyah || 1) - 1;
                const end = endAyah || 7;
                
                const combinedVerses = arabicData.data[0].ayahs.slice(start, end).map((ayah, i) => ({
                    numberInSurah: ayah.numberInSurah,
                    text: ayah.text,
                    translation: englishData.data[0].ayahs[start + i].text,
                    audio: audioData.data.ayahs[start + i].audio
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
    }, [surah, startAyah, endAyah, reciter]);

    // Handle audio events
    useEffect(() => {
        const audio = audioRef.current;

        const handleEnded = () => {
            setPlayingIndex((prevIndex) => {
                if (prevIndex !== null && prevIndex < verses.length - 1) {
                    const nextIndex = prevIndex + 1;
                    audio.src = verses[nextIndex].audio;
                    audio.play().catch(e => console.error(e));
                    return nextIndex;
                } else {
                    setIsPlaying(false);
                    return null;
                }
            });
        };

        audio.addEventListener('ended', handleEnded);
        return () => {
            audio.removeEventListener('ended', handleEnded);
        };
    }, [verses]);

    const handlePlayPauseAyah = (index) => {
        const audio = audioRef.current;
        if (playingIndex === index) {
            if (isPlaying) {
                audio.pause();
                setIsPlaying(false);
            } else {
                audio.play().catch(e => console.error(e));
                setIsPlaying(true);
            }
        } else {
            audio.pause();
            audio.src = verses[index].audio;
            audio.play().catch(e => console.error(e));
            setPlayingIndex(index);
            setIsPlaying(true);
        }
    };

    const handlePlayAll = () => {
        const audio = audioRef.current;
        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            const startIndex = playingIndex !== null ? playingIndex : 0;
            audio.src = verses[startIndex].audio;
            audio.play().catch(e => console.error(e));
            setPlayingIndex(startIndex);
            setIsPlaying(true);
        }
    };

    // Clean up audio on unmount
    useEffect(() => {
        return () => {
            audioRef.current.pause();
        };
    }, []);

    if (loading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-yellow-50/50">
                <Loader2 size={48} className="animate-spin text-yellow-600 mb-4" />
                <p className="text-yellow-800 font-bold">Loading Quran Stage...</p>
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
        <div className="w-full h-full flex flex-col bg-yellow-50/30 overflow-y-auto p-6 sm:p-10">
            <div className="max-w-4xl mx-auto w-full space-y-8">
                
                {/* Audio Master Control Bar */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-yellow-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-yellow-100 text-yellow-700 rounded-2xl">
                            <Headphones size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-gray-900">{surahEnglishName} ({surahName})</h2>
                            <p className="text-xs text-yellow-700 font-bold uppercase tracking-wider">Ayah {startAyah} to {endAyah}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Reciter Selector */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Reciter:</span>
                            <select 
                                value={reciter}
                                onChange={(e) => setReciter(e.target.value)}
                                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                            >
                                {RECITERS.map((r) => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Play All Button */}
                        <button
                            onClick={handlePlayAll}
                            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 active:scale-95 shadow-sm ${
                                isPlaying
                                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                                    : 'bg-yellow-400 text-gray-950 hover:bg-yellow-500'
                            }`}
                        >
                            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                            {isPlaying ? 'Pause' : 'Play All'}
                        </button>
                    </div>
                </div>

                {/* Verses Container */}
                <div className="space-y-6">
                    {verses.map((v, index) => {
                        const isCurrentAyah = playingIndex === index;
                        return (
                            <div 
                                key={v.numberInSurah} 
                                className={`relative bg-white rounded-3xl p-6 sm:p-8 border transition-all duration-300 ${
                                    isCurrentAyah 
                                        ? 'border-yellow-400 shadow-md ring-2 ring-yellow-100 bg-yellow-50/10' 
                                        : 'border-yellow-50 shadow-sm hover:border-yellow-100'
                                }`}
                            >
                                {/* Left Side: Play Ayah & Badge Controls */}
                                <div className="absolute left-6 top-6 flex items-center gap-3">
                                    <button
                                        onClick={() => handlePlayPauseAyah(index)}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                                            isCurrentAyah && isPlaying
                                                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                                                : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
                                        }`}
                                        title={`Play Ayah ${v.numberInSurah}`}
                                    >
                                        {isCurrentAyah && isPlaying ? <Pause size={16} /> : <Play size={16} />}
                                    </button>
                                    
                                    <div className="w-8 h-8 rounded-full border border-yellow-100 flex items-center justify-center text-xs font-black text-yellow-700 bg-yellow-50/50">
                                        {v.numberInSurah}
                                    </div>
                                </div>

                                {/* Right Side: Uthmani Script */}
                                <div className="pl-16 pr-2">
                                    <p className="text-right text-3xl sm:text-4xl font-arabic leading-[2.2] text-gray-900 mb-6 dir-rtl" style={{ fontFamily: "'Traditional Arabic', 'Amiri', serif" }}>
                                        {v.text}
                                    </p>
                                    
                                    {/* Translation */}
                                    <p className="text-base sm:text-lg text-gray-600 font-medium leading-relaxed border-l-4 border-yellow-200 pl-6 py-0.5 italic">
                                        {v.translation}
                                    </p>
                                </div>

                                {/* Active Audio Indicator */}
                                {isCurrentAyah && isPlaying && (
                                    <div className="absolute right-6 top-6 text-amber-500 animate-pulse">
                                        <Volume2 size={18} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
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
