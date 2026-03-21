import React from 'react';

const YoutubeStage = ({ currentSlide }) => {
    return (
        <div className="absolute inset-0 z-40 bg-black flex items-center justify-center">
            <div className="w-full h-full">
                <iframe
                    key={currentSlide?.id}
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${currentSlide.content?.video_id}?rel=0&autoplay=1`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                ></iframe>
            </div>
        </div>
    );
};

export default YoutubeStage;
