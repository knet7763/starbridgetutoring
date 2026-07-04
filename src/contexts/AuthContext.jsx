import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import * as Sentry from '@sentry/react';

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
    const [student, setStudent] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [profileMissing, setProfileMissing] = useState(false);
    const initialized = useRef(false);

    const getRoleFromUser = (user) => {
        const role = user?.app_metadata?.role;
        return role === 'teacher' || role === 'admin' ? role : null;
    };

    const loadStudentProfile = async (userId, { markMissing = false } = {}) => {
        console.log('[AuthContext] loadStudentProfile starting for userId:', userId);
        try {
            const { data, error } = await supabase
                .from('student_profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (error) throw error;
            
            if (data) {
                console.log('[AuthContext] loadStudentProfile found student profile:', data);
                setStudent(data);
                setProfileMissing(false);
            } else {
                console.log('[AuthContext] loadStudentProfile: no profile found');
                setStudent(null);
                setProfileMissing(markMissing);
            }

            return data;
        } catch (error) {
            console.error('[AuthContext] Error loading student profile:', error);
            setStudent(null);
            setProfileMissing(markMissing);
            return null;
        }
    };

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        let mounted = true;

        const applySession = async (session) => {
            console.log('[AuthContext] applySession starting, user:', session?.user?.email);
            if (!session?.user) {
                console.log('[AuthContext] applySession: no session user');
                setUser(null);
                setStudent(null);
                setRole(null);
                setProfileMissing(false);
                Sentry.setUser(null);
                return;
            }

            const trustedRole = getRoleFromUser(session.user);
            const expectedRole = localStorage.getItem('sb_role');
            console.log('[AuthContext] trustedRole:', trustedRole, 'expectedRole:', expectedRole);

            setUser(session.user);

            if (trustedRole) {
                console.log('[AuthContext] applySession: trustedRole matched:', trustedRole);
                setRole(trustedRole);
                setStudent(null);
                setProfileMissing(false);
                Sentry.setUser({
                    id: session.user.id,
                    email: session.user.email,
                    role: trustedRole,
                });
                return;
            }

            const studentProfile = await loadStudentProfile(session.user.id, {
                markMissing: expectedRole === 'student',
            });

            const finalRole = studentProfile ? 'student' : null;
            console.log('[AuthContext] applySession: setting role based on studentProfile:', finalRole);
            setRole(finalRole);
            Sentry.setUser({
                id: session.user.id,
                email: session.user.email,
                role: finalRole || 'unknown',
            });
        };

        const initializeAuth = async () => {
            console.log('[AuthContext] initializeAuth starting...');
            try {
                const { data: { session } } = await supabase.auth.getSession();
                console.log('[AuthContext] getSession returned session user:', session?.user?.email);
                if (!mounted) return;

                await applySession(session);
            } catch (error) {
                console.error('[AuthContext] Auth initialization error:', error);
            } finally {
                console.log('[AuthContext] initializeAuth finally block, setting loading=false');
                if (mounted) setLoading(false);
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('[AuthContext] onAuthStateChange event:', event, 'user:', session?.user?.email);
            if (!mounted) return;

            await applySession(session);

            if (!session?.user && event === 'SIGNED_OUT') {
                localStorage.removeItem('sb_role');
            }
            console.log('[AuthContext] onAuthStateChange setting loading=false');
            if (mounted) setLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signIn = async (email, password, expectedRole = 'teacher') => {
        if (expectedRole) {
            localStorage.setItem('sb_role', expectedRole);
        }
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            localStorage.removeItem('sb_role');
            return { data, error };
        }

        return { data, error };
    };

    const signUp = async (email, password, metadata = {}) => {
        localStorage.setItem('sb_role', 'student');
        const { role: _ignoredRole, ...safeMetadata } = metadata;
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: safeMetadata,
            },
        });
        if (error) {
            localStorage.removeItem('sb_role');
        }
        return { data, error };
    };

    const signOut = async () => {
        localStorage.removeItem('sb_role');
        const { error } = await supabase.auth.signOut();
        setUser(null);
        setStudent(null);
        setRole(null);
        setProfileMissing(false);
        return { error };
    };

    const resetPasswordForEmail = async (email) => {
        return supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
    };

    const updatePassword = async (newPassword) => {
        return supabase.auth.updateUser({ password: newPassword });
    };

    const isStudent = role === 'student';
    const isTeacher = role === 'teacher';
    const isAdmin = role === 'admin';

    const value = useMemo(() => ({ 
        user, 
        student,
        role,
        isStudent,
        isTeacher,
        isAdmin,
        loading, 
        profileMissing,
        signIn, 
        signUp,
        signOut,
        resetPasswordForEmail,
        updatePassword
    }), [user, student, role, loading, profileMissing]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
