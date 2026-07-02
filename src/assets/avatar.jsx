import React from 'react';

/**
 * Premium Tutor Avatar Fallback
 * Renders a warm gradient background with tutor initials
 */
export const TutorAvatar = ({ name, className = "w-full h-full flex items-center justify-center" }) => {
    const initials = name
        ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : 'T';

    const gradients = [
        'from-amber-400 to-orange-500',
        'from-yellow-400 to-amber-600',
        'from-orange-400 to-red-500',
    ];
    
    const hash = name ? name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
    const gradient = gradients[hash % gradients.length];

    return (
        <div className={`bg-gradient-to-br ${gradient} text-white font-extrabold select-none ${className}`}>
            <span className="text-lg tracking-wider">{initials}</span>
        </div>
    );
};

/**
 * Premium Student Avatar Fallback
 * Renders a cool gradient background with student initials
 */
export const StudentAvatar = ({ name, className = "w-full h-full flex items-center justify-center" }) => {
    const initials = name
        ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : 'S';

    const gradients = [
        'from-blue-400 to-indigo-500',
        'from-teal-400 to-emerald-600',
        'from-indigo-400 to-purple-500',
    ];
    
    const hash = name ? name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
    const gradient = gradients[hash % gradients.length];

    return (
        <div className={`bg-gradient-to-br ${gradient} text-white font-extrabold select-none ${className}`}>
            <span className="text-lg tracking-wider">{initials}</span>
        </div>
    );
};

export default {
    TutorAvatar,
    StudentAvatar,
};
