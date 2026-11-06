import React, { useState, useEffect, useRef } from 'react';
import { Book, Loader2, Play, Pause, Volume2, Headphones, Sparkles, Repeat, ZoomIn, ZoomOut } from 'lucide-react';

const RECITERS = [
    { id: 'ar.alafasy', name: 'Mishary Rashid Alafasy' },
    { id: 'ar.abdulsamad', name: 'Abdul Basit' },
    { id: 'ar.saadghamidi', name: 'Saad Al-Ghamdi' },
    { id: 'ar.minshawi', name: 'Siddiq El-Minshawi' },
];

const TAJWEED_LEGEND = [
    { label: 'Ghunnah (Nasal)', color: 'bg-emerald-600', text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', desc: 'نّ / مّ (Hold 2 beats)' },
    { label: 'Qalqalah (Echo)', color: 'bg-blue-600', text: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', desc: 'ق ط ب ج د with Sukun' },
    { label: 'Madd (Elongation)', color: 'bg-rose-600', text: 'text-rose-700', bg: 'bg-rose-50 border-rose-200', desc: 'Long vowel stretch (2–6 beats)' },
    { label: 'Ikhfa / Tanween', color: 'bg-amber-600', text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', desc: 'نْ or Tanween (ـً ـٍ ـٌ)' },
];

/**
 * Renders Uthmani Arabic text with interactive Tajweed color-coding per word/character cluster.
 */
const renderTajweedText = (text, enabled) => {
    if (!enabled || !text) return text;

    const words = text.split(' ');
    return words.map((word, wIdx) => {
        let colorClass = 'text-gray-900';
        // Check for Madd sign (\u0653) or dagger alif (\u0670) or Alif Madd (\u0622)
        if (/\u0653|\u0622|\u0670/.test(word)) {
            colorClass = 'text-rose-600';
        }
        // Check for Ghunnah (Noon or Meem with Shaddah: نّ or مّ)
        else if (/[نم]\u0651|\u0651[نم]/.test(word)) {
            colorClass = 'text-emerald-600';
        }
        // Check for Qalqalah letters (قطبجد) with Sukun (ْ / ۡ)
        else if (/[قطبجد][\u0652\u06E1]/.test(word)) {
            colorClass = 'text-blue-600';
        }
        // Check for Tanween (ً ٍ ٌ) or Noon with Sukun (نْ / نۡ)
        else if (/[\u064B\u064C\u064D]|ن[\u0652\u06E1]/.test(word)) {
            colorClass = 'text-amber-600';
        }

        return (
            <span key={wIdx} className={`${colorClass} transition-colors duration-200`}>
                {word}{' '}
            </span>
        );
    });
};

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
    const [tajweedEnabled, setTajweedEnabled] = useState(true);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [repeatAyah, setRepeatAyah] = useState(false);
    const [focusedAyah, setFocusedAyah] = useState(null);
    const [fontScale, setFontScale] = useState(1);

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

    // Sync playback rate
    useEffect(() => {
        audioRef.current.playbackRate = playbackRate;
    }, [playbackRate]);

    // Handle audio events
    useEffect(() => {
        const audio = audioRef.current;

        const handleEnded = () => {
            if (repeatAyah && playingIndex !== null) {
                audio.currentTime = 0;
                audio.playbackRate = playbackRate;
                audio.play().catch(e => console.error(e));
                return;
            }
            setPlayingIndex((prevIndex) => {
                if (prevIndex !== null && prevIndex < verses.length - 1) {
                    const nextIndex = prevIndex + 1;
                    audio.src = verses[nextIndex].audio;
                    audio.playbackRate = playbackRate;
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
    }, [verses, repeatAyah, playingIndex, playbackRate]);

    const handlePlayPauseAyah = (index) => {
        const audio = audioRef.current;
        if (playingIndex === index) {
            if (isPlaying) {
                audio.pause();
                setIsPlaying(false);
            } else {
                audio.playbackRate = playbackRate;
                audio.play().catch(e => console.error(e));
                setIsPlaying(true);
            }
        } else {
            audio.pause();
            audio.src = verses[index].audio;
            audio.playbackRate = playbackRate;
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
            audio.playbackRate = playbackRate;
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
            <div className="max-w-4xl mx-auto w-full space-y-6">

                {/* Audio & Tajweed Master Control Bar */}
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-yellow-100 space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-yellow-100 text-yellow-700 rounded-2xl">
                                <Headphones size={24} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-gray-900">{surahEnglishName} ({surahName})</h2>
                                <p className="text-xs text-yellow-700 font-bold uppercase tracking-wider">Ayah {startAyah} to {endAyah}</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                            {/* Reciter Selector */}
                            <select
                                value={reciter}
                                onChange={(e) => setReciter(e.target.value)}
                                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                            >
                                {RECITERS.map((r) => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>

                            {/* Playback Speed */}
                            <select
                                value={playbackRate}
                                onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                                className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                                title="Recitation Speed"
                            >
                                <option value={0.75}>0.75x Slow</option>
                                <option value={1}>1.0x Normal</option>
                                <option value={1.25}>1.25x Fast</option>
                            </select>

                            {/* Loop Single Ayah Toggle */}
                            <button
                                onClick={() => setRepeatAyah(!repeatAyah)}
                                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                                    repeatAyah
                                        ? 'bg-purple-100 border-purple-300 text-purple-800'
                                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                }`}
                                title="Loop active Ayah for Hifz memorization"
                            >
                                <Repeat size={14} />
                                {repeatAyah ? 'Loop Ayah: ON' : 'Loop Ayah'}
                            </button>

                            {/* Tajweed Toggle */}
                            <button
                                onClick={() => setTajweedEnabled(!tajweedEnabled)}
                                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                                    tajweedEnabled
                                        ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <Sparkles size={14} />
                                Tajweed Colors
                            </button>

                            {/* Font Zoom */}
                            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                                <button
                                    onClick={() => setFontScale(s => Math.max(0.8, +(s - 0.15).toFixed(2)))}
                                    className="p-2 text-gray-600 hover:bg-gray-100"
                                    title="Smaller Arabic Text"
                                >
                                    <ZoomOut size={14} />
                                </button>
                                <button
                                    onClick={() => setFontScale(s => Math.min(1.6, +(s + 0.15).toFixed(2)))}
                                    className="p-2 text-gray-600 hover:bg-gray-100 border-l border-gray-200"
                                    title="Larger Arabic Text"
                                >
                                    <ZoomIn size={14} />
                                </button>
                            </div>

                            {/* Play All Button */}
                            <button
                                onClick={handlePlayAll}
                                className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 active:scale-95 shadow-sm ${
                                    isPlaying
                                        ? 'bg-amber-500 text-white hover:bg-amber-600'
                                        : 'bg-yellow-400 text-gray-950 hover:bg-yellow-500'
                                }`}
                            >
                                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                                {isPlaying ? 'Pause' : 'Play All'}
                            </button>
                        </div>
                    </div>

                    {/* Tajweed Color Legend */}
                    {tajweedEnabled && (
                        <div className="pt-3 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {TAJWEED_LEGEND.map((rule) => (
                                <div key={rule.label} className={`px-3 py-1.5 rounded-xl border ${rule.bg} flex items-center gap-2`}>
                                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${rule.color}`} />
                                    <div className="min-w-0">
                                        <p className={`text-[11px] font-extrabold truncate ${rule.text}`}>{rule.label}</p>
                                        <p className="text-[10px] text-gray-500 truncate">{rule.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Verses Container */}
                <div className="space-y-6">
                    {verses.map((v, index) => {
                        const isCurrentAyah = playingIndex === index;
                        const isFocused = focusedAyah === v.numberInSurah;
                        return (
                            <div
                                key={v.numberInSurah}
                                onClick={() => setFocusedAyah(isFocused ? null : v.numberInSurah)}
                                className={`relative bg-white rounded-3xl p-6 sm:p-8 border transition-all duration-300 cursor-pointer ${
                                    isCurrentAyah
                                        ? 'border-yellow-400 shadow-lg ring-2 ring-yellow-200 bg-yellow-50/10'
                                        : isFocused
                                            ? 'border-emerald-400 shadow-md ring-2 ring-emerald-100'
                                            : 'border-yellow-50 shadow-sm hover:border-yellow-200'
                                }`}
                            >
                                {/* Left Side: Play Ayah & Badge Controls */}
                                <div className="absolute left-6 top-6 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
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
                                <div className="pl-20 pr-2">
                                    <p
                                        className="text-right font-arabic leading-[2.3] text-gray-900 mb-6 dir-rtl"
                                        style={{
                                            fontFamily: "'Traditional Arabic', 'Amiri', serif",
                                            fontSize: `${Math.round(34 * fontScale)}px`
                                        }}
                                    >
                                        {renderTajweedText(v.text, tajweedEnabled)}
                                    </p>

                                    {/* Translation */}
                                    <p className="text-base sm:text-lg text-gray-600 font-medium leading-relaxed border-l-4 border-yellow-200 pl-6 py-0.5 italic">
                                        {v.translation}
                                    </p>
                                </div>

                                {/* Active Audio Indicator */}
                                {isCurrentAyah && isPlaying && (
                                    <div className="absolute right-6 top-6 text-amber-500 animate-pulse flex items-center gap-1.5 text-xs font-bold">
                                        <Volume2 size={18} />
                                        {repeatAyah && <span>Looping</span>}
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
