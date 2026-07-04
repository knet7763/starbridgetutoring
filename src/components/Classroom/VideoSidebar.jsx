import React, { useEffect, useRef } from 'react';
import { MicOff, CameraOff, User } from 'lucide-react';

export const TrackRenderer = ({ track, isVideo, isLocal }) => {
    const ref = useRef(null);

    useEffect(() => {
        const element = ref.current;
        if (!element || !track) return;

        track.attach(element);

        return () => {
            track.detach(element);
        };
    }, [track]);

    if (isVideo) {
        return (
            <video
                ref={ref}
                autoPlay
                playsInline
                muted={isLocal}
                className="w-full h-full object-cover rounded-2xl bg-gray-900"
            />
        );
    } else {
        return (
            <audio
                ref={ref}
                autoPlay
                className="hidden"
            />
        );
    }
};

const ParticipantTile = ({ participant, isLocal }) => {
    const displayName = participant?.name || participant?.identity || 'Participant';

    // Extract active tracks from participant maps
    const videoTracks = [];
    const audioTracks = [];

    if (participant) {
        participant.videoTracks.forEach((pub) => {
            if (pub.track) {
                videoTracks.push(pub.track);
            }
        });
        participant.audioTracks.forEach((pub) => {
            if (pub.track) {
                audioTracks.push(pub.track);
            }
        });
    }

    const hasVideo = videoTracks.length > 0;
    const hasAudio = audioTracks.length > 0;

    return (
        <div className="rounded-3xl border border-gray-800 bg-gray-950 p-4 shadow-xl text-sm text-gray-200 flex flex-col gap-3">
            {/* Live Video Canvas or Placeholder Avatar */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-gray-900 flex items-center justify-center border border-gray-800">
                {hasVideo ? (
                    videoTracks.map((track) => (
                        <TrackRenderer
                            key={track.sid || track.name}
                            track={track}
                            isVideo
                            isLocal={isLocal}
                        />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center text-gray-500">
                        <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-1">
                            <User className="w-5 h-5 text-gray-400" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider">Camera Off</span>
                    </div>
                )}

                {/* Overlay Name Tag */}
                <div className="absolute bottom-2 left-2 bg-gray-950/80 backdrop-blur-md px-2 py-1 rounded-xl text-xs font-bold border border-white/5 flex items-center gap-1.5 max-w-[85%]">
                    <span className="truncate text-white">{displayName}</span>
                    {isLocal && (
                        <span className="text-[9px] text-gray-400 shrink-0 font-medium">
                            (You)
                        </span>
                    )}
                </div>
            </div>

            {/* Render audio tracks for remote participants to play their voices */}
            {!isLocal && audioTracks.map((track) => (
                <TrackRenderer
                    key={track.sid || track.name}
                    track={track}
                    isVideo={false}
                    isLocal={isLocal}
                />
            ))}

            {/* AV Status badges */}
            <div className="grid grid-cols-2 gap-2 text-xs uppercase tracking-[0.2em] font-bold text-gray-400">
                <div className="flex items-center gap-2">
                    <span className={hasAudio ? 'text-emerald-400' : 'text-red-400'}>
                        {hasAudio ? 'Mic' : 'Muted'}
                    </span>
                    {!hasAudio && <MicOff size={12} />}
                </div>
                <div className="flex items-center gap-2">
                    <span className={hasVideo ? 'text-emerald-400' : 'text-red-400'}>
                        {hasVideo ? 'Camera' : 'Off'}
                    </span>
                    {!hasVideo && <CameraOff size={12} />}
                </div>
            </div>
        </div>
    );
};

const VideoSidebar = ({ 
    room, 
    participants = [], 
    isFallback, 
    isConnecting,
    roomName, 
    displayName, 
    onSwitchFallback, 
    className = "w-72 border-l border-gray-800" 
}) => {
    if (!room && !isFallback && !isConnecting) return null;

    if (isConnecting) {
        return (
            <div className={`${className} flex-shrink-0 bg-gray-950 flex flex-col h-full p-6 gap-4 z-50 justify-center items-center`}>
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-400 mb-2"></div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-black text-center">Connecting to video room...</p>
                <p className="text-[11px] text-gray-500 text-center max-w-[200px]">Waiting for peer channels to establish</p>
                <button
                    onClick={onSwitchFallback}
                    className="mt-6 py-2 px-4 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/30 rounded-xl text-[10px] font-black tracking-wider uppercase transition-all"
                >
                    Use Backup Video (Jitsi)
                </button>
            </div>
        );
    }

    if (isFallback) {
        return (
            <div className={`${className} flex-shrink-0 bg-gray-950 flex flex-col h-full p-4 gap-4 z-50`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-red-500 font-black">Video Fallback</p>
                        <p className="text-sm font-semibold text-gray-300">Jitsi Backup Server</p>
                    </div>
                </div>
                <div className="flex-1 w-full rounded-2xl overflow-hidden border border-gray-850 shadow-2xl relative bg-gray-900">
                    <iframe
                        src={`https://meet.jit.si/starbridge-${roomName}#userInfo.displayName="${displayName}"&config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&interfaceConfig.TOOLBAR_BUTTONS=["microphone","camera","chat","tileview"]`}
                        allow="camera; microphone; fullscreen; display-capture; autoplay"
                        className="absolute inset-0 w-full h-full border-none rounded-2xl bg-gray-900"
                    ></iframe>
                </div>
            </div>
        );
    }

    const localParticipant = room?.localParticipant;
    const participantList = [...participants];
    const totalCount = (localParticipant ? 1 : 0) + participantList.length;

    if (totalCount === 0) return null;

    return (
        <div className={`${className} flex-shrink-0 bg-gray-950 flex flex-col h-full overflow-y-auto p-4 gap-4 z-50`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-gray-500 font-semibold">Participants</p>
                    <p className="text-2xl font-black text-white">{totalCount}</p>
                </div>
            </div>

            {localParticipant && (
                <ParticipantTile participant={localParticipant} isLocal />
            )}

            {participantList.map((participant) => (
                <ParticipantTile
                    key={participant.sid || participant.identity}
                    participant={participant}
                />
            ))}

            <button
                onClick={onSwitchFallback}
                className="w-full mt-4 py-2 bg-red-950/30 hover:bg-red-950/60 text-red-400 border border-red-900/40 rounded-xl text-xs font-bold transition-all text-center"
                title="Switch to backup video server if you experience latency or connection issues"
            >
                ⚠️ Connection Issues? Switch to Backup Video
            </button>
        </div>
    );
};

export default VideoSidebar;
