import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, BookOpen } from 'lucide-react';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-center">
            {/* Animated star graphic */}
            <div className="relative mb-8 select-none">
                <div className="text-[120px] leading-none font-black text-gray-800 tracking-tighter">
                    404
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-6xl animate-bounce">⭐</span>
                </div>
            </div>

            <h1 className="text-3xl font-black text-white mb-3 tracking-tight">
                Page Not Found
            </h1>
            <p className="text-gray-400 text-base max-w-sm mb-10 leading-relaxed">
                Looks like this page has gone off-track. Let's get you back to learning!
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-black py-3 px-6 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-yellow-400/20 w-full"
                >
                    <Home size={18} />
                    Go Home
                </button>
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-2xl transition-all hover:scale-105 active:scale-95 border border-gray-700 w-full"
                >
                    <ArrowLeft size={18} />
                    Go Back
                </button>
            </div>

            <button
                onClick={() => navigate('/join')}
                className="mt-4 flex items-center justify-center gap-2 text-gray-500 hover:text-yellow-400 text-sm font-semibold transition-colors"
            >
                <BookOpen size={15} />
                Join a Class
            </button>
        </div>
    );
};

export default NotFound;
