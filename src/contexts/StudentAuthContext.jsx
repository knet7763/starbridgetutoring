import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const StudentAuthContext = createContext({});

export const useStudentAuth = () => {
    const context = useContext(StudentAuthContext);
    if (!context) {
        throw new Error('useStudentAuth must be used within StudentAuthProvider');
    }
    return context;
};

export const StudentAuthProvider = ({ children }) => {
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [profileMissing, setProfileMissing] = useState(false);

    const loadStudentProfile = async (userId) => {
        if (!userId) {
            setStudent(null);
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('student_profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (error) throw error;
            
            if (data) {
                // Only update if the content has changed to prevent re-render loops
                setStudent(prev => JSON.stringify(prev) === JSON.stringify(data) ? prev : data);
                setProfileMissing(false);
            } else {
                setStudent(null);
                setProfileMissing(true);
            }
        } catch (error) {
            console.error('Error loading student profile:', error);
            setStudent(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let mounted = true;

        const initializeAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!mounted) return;

                const isStudentSession = localStorage.getItem('sb_role') === 'student';
                if (isStudentSession && session?.user) {
                    await loadStudentProfile(session.user.id);
                } else {
                    setStudent(null);
                    setLoading(false);
                }
            } catch (error) {
                console.error('Student auth initialization error:', error);
                if (mounted) setLoading(false);
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;

            const isStudentSession = localStorage.getItem('sb_role') === 'student';
            
            if (isStudentSession && session?.user) {
                await loadStudentProfile(session.user.id);
            } else {
                setStudent(null);
                setLoading(false);
                
                if (event === 'SIGNED_OUT') {
                    localStorage.removeItem('sb_role');
                }
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signUp = async (email, password, fullName, gradeLevel, parentEmail) => {
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    grade_level: gradeLevel,
                    parent_email: parentEmail,
                }
            }
        });

        if (authError) throw authError;
        return authData;
    };

    const signIn = async (email, password) => {
        localStorage.setItem('sb_role', 'student');
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            localStorage.removeItem('sb_role');
            throw error;
        }
        return data;
    };

    const signOut = async () => {
        localStorage.removeItem('sb_role');
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        setStudent(null);
    };

    const updateProfile = async (updates) => {
        if (!student) return;

        const { error } = await supabase
            .from('student_profiles')
            .update(updates)
            .eq('id', student.id);

        if (error) throw error;

        setStudent({ ...student, ...updates });
    };

    const value = React.useMemo(() => ({
        student,
        loading,
        profileMissing,
        signUp,
        signIn,
        signOut,
        updateProfile,
    }), [student, loading, profileMissing]);

    return (
        <StudentAuthContext.Provider value={value}>
            {children}
        </StudentAuthContext.Provider>
    );
};
