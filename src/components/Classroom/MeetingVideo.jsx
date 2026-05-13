import React, { useMemo } from 'react';
import { useParticipantIds, useVideoTrack, useAudioTrack, useLocalParticipant } from '@daily-co/daily-react';
import { MicOff, CameraOff, User, Settings } from 'lucide-react';

const ParticipantVideo = ({ id, isLocal = false }) => {
    const videoState = useVideoTrack(id);
    const audioState = useAudioTrack(id);
    const videoEl = React.useRef(null);

    React.useEffect(() => {
        if (!videoState.persistentTrack || !videoEl.current) return;
        videoEl.current.srcObject = new MediaStream([videoState.persistentTrack]);
    }, [videoState.persistentTrack]);

    return (
        <div className={`relative w-full h-full bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border-2 ${isLocal ? 'border-primary/50' : 'border-gray-800'}`}>
            {videoState.persistentTrack ? (
                <video
                    ref={videoEl}
                    autoPlay
                    muted={isLocal}
                    playsInline
                    className="w-full h-full object-cover"
                />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800">
                    <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center text-4xl font-black text-gray-500 shadow-inner">
                        <User size={48} />
                    </div>
                    <p className="mt-4 text-gray-500 font-bold uppercase tracking-widest text-xs">Camera Off</p>
                </div>
            )}

            {/* Label Overlay */}
            <div className="absolute bottom-4 left-4 flex gap-2 items-center">
                <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-xs font-bold flex items-center gap-2 border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    {isLocal ? 'You' : 'Student'}
                    {audioState.isOff && <MicOff size={14} className="text-red-400" />}
                </div>
            </div>
        </div>
    );
};

const MeetingVideo = () => {
    const allParticipantIds = useParticipantIds();
    const localParticipant = useLocalParticipant();

    // Filter out the local participant to get the remote participants
    const remoteParticipantIds = useMemo(() => {
        if (!localParticipant) return allParticipantIds;
        return allParticipantIds.filter(id => id !== localParticipant.session_id);
    }, [allParticipantIds, localParticipant]);

    // In a 1-on-1, we usually want the remote person big and the local person in a corner
    const remoteId = remoteParticipantIds[0];


    return (
        <div className="relative w-full h-full bg-gray-950 p-4 flex flex-col gap-4">
            {/* Main Remote Video */}
            <div className="flex-1 min-h-0 relative">
                {remoteId ? (
                    <ParticipantVideo id={remoteId} />
                ) : (
                    <div className="w-full h-full rounded-3xl bg-gray-900/50 border-4 border-dashed border-gray-800 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6 animate-bounce">
                            <User size={40} className="text-primary" />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Waiting for Student</h2>
                        <p className="text-gray-500 max-w-xs">The session will begin as soon as the student joins the room.</p>
                    </div>
                )}

                {/* Picture-in-Picture Local Video */}
                <div className="absolute bottom-6 right-6 w-48 aspect-video sm:w-64 z-10 shadow-2xl transition-all hover:scale-105">
                    {localParticipant && <ParticipantVideo id={localParticipant.session_id} isLocal={true} />}
                </div>
            </div>
        </div>
    );
};

export default MeetingVideo;
