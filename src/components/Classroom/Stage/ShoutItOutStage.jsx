import React from 'react';

const ShoutItOutStage = ({ currentSlide, shoutResponses }) => {
    return (
        <div className="absolute inset-0 z-40 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-gray-50 flex flex-col">
            <div className="p-8 text-center bg-white/80 backdrop-blur border-b border-gray-200 shadow-sm flex-shrink-0">
                <h2 className="text-4xl font-black text-gray-900">{currentSlide.content?.question || 'Shout It Out!'}</h2>
                <p className="text-gray-500 mt-2 font-medium">Students are sending their answers to the board...</p>
            </div>
            <div className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {shoutResponses.map((response) => (
                        <div key={response.id} className="bg-yellow-200 p-6 shadow-md border-b-4 border-yellow-300 transform hover:-translate-y-1 hover:rotate-1 transition-all duration-200 flex flex-col justify-center aspect-square" style={{ borderRadius: '2px 20px 2px 20px' }}>
                            <p className="text-gray-900 font-bold text-xl text-center break-words pb-4 leading-tight">{response.answer}</p>
                        </div>
                    ))}
                    {shoutResponses.length === 0 && (
                        <div className="col-span-full h-full flex flex-col items-center justify-center text-gray-400 mt-20">
                            <div className="w-16 h-16 border-4 border-gray-200 border-t-primary rounded-full animate-spin mb-4"></div>
                            <span className="font-medium text-xl">Waiting for ideas to appear...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShoutItOutStage;
