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
        let mounted = true;

        const initializeAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!mounted) return;

                const isTeacherSession = localStorage.getItem('sb_role') === 'teacher';
                setUser(isTeacherSession && session?.user ? session.user : null);
            } catch (error) {
                console.error('Auth initialization error:', error);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (!mounted) return;

            const isTeacherSession = localStorage.getItem('sb_role') === 'teacher';
            const newUser = isTeacherSession && session?.user ? session.user : null;
            
            // Only update if the user ID has changed to prevent re-render loops
            setUser(prev => (prev?.id === newUser?.id ? prev : newUser));
            
            if (event === 'SIGNED_OUT') {
                localStorage.removeItem('sb_role');
            }
            setLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
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

    const value = React.useMemo(() => ({ 
        user, 
        loading, 
        signIn, 
        signOut 
    }), [user, loading]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
