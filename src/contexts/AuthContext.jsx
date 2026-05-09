import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session on mount
        supabase.auth.getSession().then(({ data: { session } }) => {
            // Only treat this as a teacher session if they logged in via the teacher portal
            const isTeacherSession = localStorage.getItem('sb_role') === 'teacher';
            setUser(isTeacherSession && session?.user ? session.user : null);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const isTeacherSession = localStorage.getItem('sb_role') === 'teacher';
            setUser(isTeacherSession && session?.user ? session.user : null);
            if (!session) {
                // On logout, clear the role marker
                localStorage.removeItem('sb_role');
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error) {
            // Mark that this session was started via the teacher login portal
            localStorage.setItem('sb_role', 'teacher');
        }
        return { data, error };
    };

    const signOut = async () => {
        localStorage.removeItem('sb_role');
        const { error } = await supabase.auth.signOut();
        setUser(null);
        return { error };
    };

    const value = { user, loading, signIn, signOut };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
