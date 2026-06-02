import React from 'react';
import { MicOff, CameraOff, User } from 'lucide-react';

const ParticipantTile = ({ participant, isLocal }) => {
    const displayName = participant?.name || participant?.identity || 'Participant';
    const hasVideo = participant?.videoTracks?.size > 0;
    const hasAudio = participant?.audioTracks?.size > 0;

    return (
        <div className="rounded-3xl border border-gray-800 bg-gray-950 p-4 shadow-xl text-sm text-gray-200">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-3xl bg-gray-800 flex items-center justify-center text-xl text-gray-400">
                    <User className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <div className="font-semibold text-white truncate">{displayName}</div>
                    <div className="text-xs text-gray-400">{isLocal ? 'You' : 'Remote'}</div>
                </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs uppercase tracking-[0.2em] font-bold text-gray-400">
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

const VideoSidebar = ({ room, participants = [] }) => {
    if (!room) return null;

    const localParticipant = room.localParticipant;
    const participantList = [...participants];
    const totalCount = (localParticipant ? 1 : 0) + participantList.length;

    if (totalCount === 0) return null;

    return (
        <div className="w-72 flex-shrink-0 bg-gray-950 border-l border-gray-800 flex flex-col h-full overflow-y-auto p-4 gap-4 z-50">
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
        </div>
    );
};

export default VideoSidebar;
