import React from 'react';
import {
    useParticipantIds,
    useVideoTrack,
    useAudioTrack,
    useLocalParticipant,
    useParticipant,
} from '@daily-co/daily-react';
import { MicOff, User } from 'lucide-react';

// ── Single participant tile ────────────────────────────────────────────────────
const ParticipantVideo = ({ id, isLocal = false }) => {
    const videoState = useVideoTrack(id);
    const audioState = useAudioTrack(id);
    const participant = useParticipant(id);
    const videoEl = React.useRef(null);

    const displayName = isLocal
        ? 'You'
        : participant?.user_name || 'Participant';

    React.useEffect(() => {
        if (!videoState.persistentTrack || !videoEl.current) return;
        videoEl.current.srcObject = new MediaStream([videoState.persistentTrack]);
    }, [videoState.persistentTrack]);

    return (
        <div
            className={`relative w-full h-full bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border-2 ${
                isLocal ? 'border-primary/50' : 'border-gray-700'
            }`}
        >
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
                    <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center shadow-inner">
                        <User size={48} className="text-gray-500" />
                    </div>
                    <p className="mt-4 text-gray-500 font-bold uppercase tracking-widest text-xs">
                        {displayName} — Camera Off
                    </p>
                </div>
            )}

            {/* Name + mic status overlay */}
            <div className="absolute bottom-4 left-4 flex gap-2 items-center">
                <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-xs font-bold flex items-center gap-2 border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    {displayName}
                    {audioState.isOff && <MicOff size={14} className="text-red-400 ml-1" />}
                </div>
            </div>
        </div>
    );
};

// ── Main layout: remote full-screen + local PiP ───────────────────────────────
const MeetingVideo = () => {
    const allParticipantIds = useParticipantIds();
    const localParticipant = useLocalParticipant();

    const remoteParticipantIds = React.useMemo(() => {
        if (!localParticipant) return allParticipantIds;
        return allParticipantIds.filter(id => id !== localParticipant.session_id);
    }, [allParticipantIds, localParticipant]);

    const remoteId = remoteParticipantIds[0];

    return (
        <div className="relative w-full h-full bg-gray-950 p-4 flex flex-col gap-4">
            {/* Main remote video */}
            <div className="flex-1 min-h-0 relative">
                {remoteId ? (
                    <ParticipantVideo id={remoteId} />
                ) : (
                    <div className="w-full h-full rounded-3xl bg-gray-900/50 border-4 border-dashed border-gray-800 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6 animate-bounce">
                            <User size={40} className="text-primary" />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">
                            Waiting for Other Participant
                        </h2>
                        <p className="text-gray-500 max-w-xs">
                            The session will begin as soon as the other participant joins.
                        </p>
                    </div>
                )}

                {/* Picture-in-Picture local video */}
                <div className="absolute bottom-6 right-6 w-48 aspect-video sm:w-64 z-10 shadow-2xl transition-all hover:scale-105">
                    {localParticipant && (
                        <ParticipantVideo id={localParticipant.session_id} isLocal />
                    )}
                </div>
            </div>
        </div>
    );
};

export default MeetingVideo;
