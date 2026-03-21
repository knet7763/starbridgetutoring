import React from 'react';
import { useParticipantIds, useVideoTrack, useAudioTrack } from '@daily-co/daily-react';
import { MicOff, CameraOff } from 'lucide-react';

const ParticipantTile = ({ id }) => {
    const videoState = useVideoTrack(id);
    const audioState = useAudioTrack(id);

    // Provide a ref to the video element to attach the track
    const videoEl = React.useRef(null);

    React.useEffect(() => {
        if (!videoState.persistentTrack || !videoEl.current) return;
        videoEl.current.srcObject = new MediaStream([videoState.persistentTrack]);
    }, [videoState.persistentTrack]);

    React.useEffect(() => {
        // Handle audio tracks separately (Daily handles main audio output, but we can track state)
        // If we wanted custom audio elements per participant, we'd do it here. but DailyProvider handles it usually.
    }, [audioState.persistentTrack]);

    return (
        <div className="relative w-full aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-lg border-2 border-gray-800">
            {videoState.persistentTrack ? (
                <video
                    ref={videoEl}
                    autoPlay
                    muted={audioState.isLocal} // Don't hear ourselves
                    playsInline
                    className="w-full h-full object-cover"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-2xl font-bold text-gray-400">
                        {/* Fallback avatar initiator */}
                    </div>
                </div>
            )}

            {/* Status Overlays */}
            <div className="absolute bottom-2 left-2 flex gap-1 bg-black/50 backdrop-blur px-2 py-1 rounded-md text-white text-xs items-center">
                {audioState.isOff && <MicOff size={12} className="text-red-400" />}
                {!videoState.persistentTrack && <CameraOff size={12} className="text-red-400" />}
            </div>
        </div>
    );
};

const VideoSidebar = () => {
    // Array of all participant session ids in the room
    const participantIds = useParticipantIds();

    if (participantIds.length === 0) return null;

    return (
        <div className="w-64 flex-shrink-0 bg-gray-950 border-l border-gray-800 flex flex-col h-full overflow-y-auto p-4 gap-4 z-50">
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
                Participants ({participantIds.length})
            </h3>
            {participantIds.map((id) => (
                <ParticipantTile key={id} id={id} />
            ))}
        </div>
    );
};

export default VideoSidebar;
