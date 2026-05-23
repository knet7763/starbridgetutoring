import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
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
    const [student, setStudent] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [profileMissing, setProfileMissing] = useState(false);
    const initialized = useRef(false);

    const getRoleFromUser = (user) => {
        return user?.app_metadata?.role || user?.user_metadata?.role || null;
    };

    const loadStudentProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('student_profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (error) throw error;
            
            if (data) {
                setStudent(data);
                setProfileMissing(false);
            } else {
                setStudent(null);
                setProfileMissing(true);
            }
        } catch (error) {
            console.error('Error loading student profile:', error);
            setStudent(null);
        }
    };

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        let mounted = true;

        const initializeAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!mounted) return;

                if (session?.user) {
                    const sessionRole = getRoleFromUser(session.user);
                    setUser(session.user);
                    setRole(sessionRole);

                    if (sessionRole === 'student') {
                        await loadStudentProfile(session.user.id);
                    } else {
                        setStudent(null);
                    }
                } else {
                    setUser(null);
                    setStudent(null);
                    setRole(null);
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;

            if (session?.user) {
                const sessionRole = getRoleFromUser(session.user);
                setUser(prev => prev?.id === session.user.id ? prev : session.user);
                setRole(sessionRole);

                if (sessionRole === 'student') {
                    await loadStudentProfile(session.user.id);
                } else {
                    setStudent(null);
                }
            } else {
                setUser(null);
                setStudent(null);
                setRole(null);
                if (event === 'SIGNED_OUT') {
                    localStorage.removeItem('sb_role');
                }
            }
            setLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signIn = async (email, password, role = 'teacher') => {
        localStorage.setItem('sb_role', role);
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            localStorage.removeItem('sb_role');
            return { data, error };
        }

        // Persist role metadata in Supabase so server-side edge functions can verify teacher/admin access.
        if (data?.user && role) {
            try {
                const { data: updatedData, error: updateError } = await supabase.auth.updateUser({
                    data: { role },
                });
                if (!updateError && updatedData?.user) {
                    setUser(updatedData.user);
                }
            } catch (updateErr) {
                console.warn('Unable to persist auth role metadata:', updateErr);
            }
        }

        return { data, error };
    };

    const signUp = async (email, password, metadata = {}) => {
        localStorage.setItem('sb_role', 'student');
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { role: 'student', ...metadata },
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
