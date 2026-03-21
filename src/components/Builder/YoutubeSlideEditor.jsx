import React from 'react';
import { Youtube } from 'lucide-react';

const YoutubeSlideEditor = ({ slide, updateSlideContent }) => {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 p-8 overflow-y-auto">
            <Youtube size={64} className="text-red-500 mb-6" />
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6">YouTube Video Activity</h2>
            <div className="w-full max-w-2xl text-center">
                <label className="block text-gray-700 text-lg font-bold mb-2 text-left">YouTube URL:</label>
                <input
                    type="text"
                    value={slide.content?.url || ''}
                    onChange={(e) => {
                        const url = e.target.value;
                        let video_id = '';
                        // Simple regex to extract video ID from common youtube formats
                        const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\n]+)/);
                        if (match && match[1]) {
                            video_id = match[1];
                        }
                        updateSlideContent({ url, video_id });
                    }}
                    className="w-full p-4 border-2 border-red-300 rounded-xl focus:ring-4 focus:ring-red-200 outline-none text-lg shadow-sm bg-white"
                    placeholder="e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                />
                {slide.content?.video_id ? (
                    <div className="mt-8 rounded-xl overflow-hidden shadow-lg border-4 border-gray-900 aspect-video w-full max-w-lg mx-auto bg-black">
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${slide.content.video_id}?rel=0`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                ) : (
                    <p className="mt-4 text-gray-500 text-left">Paste a valid YouTube link to preview the video.</p>
                )}
            </div>
        </div>
    );
};

export default YoutubeSlideEditor;
