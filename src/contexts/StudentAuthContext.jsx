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

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                loadStudentProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                loadStudentProfile(session.user.id);
            } else {
                setStudent(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const loadStudentProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('student_profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle(); // Use maybeSingle() — returns null instead of error when row doesn't exist

            if (error) throw error;
            setStudent(data ?? null);
        } catch (error) {
            console.error('Error loading student profile:', error);
            setStudent(null);
        } finally {
            setLoading(false);
        }
    };

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

        // Note: The student profile is now created automatically via a Database Trigger
        // bypassing RLS violations regardless of email confirmation settings.

        return authData;
    };

    const signIn = async (email, password) => {
        // Mark this session as a student session to prevent conflict with AuthContext
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

    const value = {
        student,
        loading,
        signUp,
        signIn,
        signOut,
        updateProfile,
    };

    return (
        <StudentAuthContext.Provider value={value}>
            {children}
        </StudentAuthContext.Provider>
    );
};
