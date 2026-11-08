import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { api } from '../services/api';
import { CheckCircle, Calendar, ArrowRight, GraduationCap, Play } from 'lucide-react';
import { motion } from 'framer-motion';

const BookTrial = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        parent_name: '',
        student_name: '',
        email: '',
        phone: '',
        grade_level: '',
        subject: ''
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Store trial request in database (the DB trigger on_trial_request automatically emails the admin)
            const { error: submitError } = await api.trials.create(formData);
            if (submitError) {
                console.warn('[trials.create] Note:', submitError.message || submitError);
                // Fallback: dispatch notification email from client only if DB insert did not trigger it
                const adminEmail = await api.settings.getAdminEmail();
                await api.email.send('trial_request_admin', adminEmail, {
                    parentName: formData.parent_name,
                    studentName: formData.student_name,
                    email: formData.email,
                    phone: formData.phone || 'Not provided',
                    subject: formData.subject || 'Not specified',
                    message: `Grade level: ${formData.grade_level || 'Not specified'}`,
                    dashboardUrl: `${window.location.origin}/admin/dashboard?tab=trials`
                }).catch(err => console.warn('[email] Trial notification email error:', err));
            }

            setSubmitted(true);
        } catch (err) {
            console.error('[BookTrial] Submission error:', err);
            setError('Failed to schedule trial. Please try again or contact support.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-[75vh] flex items-center justify-center bg-gray-50 py-12 px-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-lg w-full bg-white p-10 sm:p-12 rounded-[3rem] shadow-2xl text-center border border-gray-100"
                >
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={40} />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-3">Request Received!</h2>
                    <p className="text-gray-600 text-base mb-8">
                        Thank you for choosing StarBridge Tutoring, <strong>{formData.parent_name}</strong>! Your trial request for <strong>{formData.student_name}</strong> has been sent to our tutoring team. You can now set up your Student Dashboard to book sessions and join live classes:
                    </p>
                    <div className="space-y-3">
                        <button
                            type="button"
                            onClick={() => navigate('/student/signup', {
                                state: {
                                    fullName: formData.student_name || formData.parent_name,
                                    email: formData.email,
                                    parentEmail: formData.email,
                                    gradeLevel: formData.grade_level || ''
                                }
                            })}
                            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-secondary text-white font-black py-4 px-6 rounded-2xl shadow-lg shadow-primary/20 transition-all"
                        >
                            <GraduationCap size={20} />
                            Create Student Account & Open Dashboard
                            <ArrowRight size={18} />
                        </button>
                        <Link
                            to="/join"
                            className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 px-6 rounded-2xl transition-all text-sm"
                        >
                            <Play size={16} className="text-primary" />
                            Have a 6-Digit Class Code? Join Live Class
                        </Link>
                        <div className="pt-3 flex items-center justify-center gap-4 text-sm font-semibold text-gray-500">
                            <Link to="/student/login" className="text-primary hover:underline">
                                Already have an account? Sign In
                            </Link>
                            <span>·</span>
                            <Link to="/" className="hover:text-gray-800">
                                Return Home
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 py-20 min-h-screen">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <h1 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                                Book Your <span className="text-primary underline decoration-primary/20">Free</span> Trial Session
                            </h1>
                            <p className="mt-6 text-xl text-gray-600 leading-relaxed">
                                Experience the future of personalized education. No credit card required, just 45 minutes of pure learning.
                            </p>
                            
                            <ul className="mt-10 space-y-6">
                                {[
                                    'Meet your expert tutor',
                                    'Get a personalized learning assessment',
                                    'Tour our interactive classroom',
                                    'Receive a post-session study plan'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-gray-700 font-bold">
                                        <div className="p-1 bg-primary/10 rounded-full text-primary">
                                            <CheckCircle size={20} />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    </div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-8 lg:p-10 rounded-[2.5rem] shadow-2xl border border-gray-100"
                    >
                        <form className="space-y-5" onSubmit={handleSubmit}>
                            {error && (
                                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm">
                                    {error}
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Parent's Name</label>
                                    <input name="parent_name" type="text" onChange={handleChange} className="w-full rounded-2xl border-gray-200 border px-4 py-3 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Student's Name</label>
                                    <input name="student_name" type="text" onChange={handleChange} className="w-full rounded-2xl border-gray-200 border px-4 py-3 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" required />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                                <input name="email" type="email" onChange={handleChange} className="w-full rounded-2xl border-gray-200 border px-4 py-3 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" required />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                                <input name="phone" type="tel" onChange={handleChange} className="w-full rounded-2xl border-gray-200 border px-4 py-3 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" required />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Grade Level</label>
                                    <select name="grade_level" onChange={handleChange} className="w-full rounded-2xl border-gray-200 border px-4 py-3 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all">
                                        <option value="">Select Grade...</option>
                                        <option>Grades 1-5</option>
                                        <option>Grades 6-8</option>
                                        <option>Grades 9-12</option>
                                        <option>College / Adult</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Subject</label>
                                    <input name="subject" type="text" onChange={handleChange} className="w-full rounded-2xl border-gray-200 border px-4 py-3 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" placeholder="e.g. Math, Quran" />
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button variant="primary" type="submit" className="w-full justify-center text-lg py-4 shadow-xl shadow-primary/20" disabled={loading}>
                                    {loading ? 'Processing...' : 'Schedule My Free Session'}
                                </Button>
                                <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
                                    <Calendar size={14} /> Join 500+ successful students
                                </p>
                            </div>
                        </form>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default BookTrial;
