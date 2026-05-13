import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const { resetPasswordForEmail } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const { error: resetError } = await resetPasswordForEmail(email);
            if (resetError) throw resetError;
            setMessage('Check your inbox for further instructions.');
        } catch (err) {
            setError(err.message || 'Failed to reset password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full space-y-8 bg-white p-10 rounded-[2rem] shadow-xl border border-gray-100"
            >
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                        <Mail className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Forgot Password?</h2>
                    <p className="mt-4 text-gray-600">Enter the email associated with your account and we'll send a reset link.</p>
                </div>

                {message ? (
                    <motion.div 
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className="bg-green-50 border border-green-100 text-green-700 px-6 py-4 rounded-2xl flex items-center gap-3"
                    >
                        <CheckCircle className="flex-shrink-0" />
                        <p className="font-medium">{message}</p>
                    </motion.div>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
                                {error}
                            </div>
                        )}
                        <div>
                            <label htmlFor="email-address" className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                            <input
                                id="email-address"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all sm:text-sm"
                                placeholder="name@company.com"
                            />
                        </div>

                        <Button type="submit" variant="primary" className="w-full justify-center py-4" disabled={loading}>
                            {loading ? 'Sending link...' : 'Send Reset Link'}
                        </Button>
                    </form>
                )}

                <div className="text-center">
                    <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-yellow-600 transition-colors">
                        <ArrowLeft size={16} /> Back to Login
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
