import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, BookOpen, ChevronDown, User, LogOut, Settings, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import Button from './Button';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const { user, student, signOut, loading } = useAuth();
    const isTeacher = !!user && !student;
    const isAuthLoading = loading;

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navigation = [
        { name: 'Home', href: '/' },
        { name: 'Subjects', href: '/subjects' },
        { name: 'Tutors', href: '/tutors' },
        { name: 'Pricing', href: '/pricing' },
        { name: 'About', href: '/about' },
        { name: 'Join Class', href: '/join' },
    ];

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
        setIsOpen(false);
    };

    return (
        <nav 
            className={`fixed top-0 left-0 w-full z-[100] transition-all duration-500 ${
                scrolled 
                ? 'bg-white/80 backdrop-blur-xl border-b border-gray-200 py-2 shadow-sm' 
                : 'bg-transparent py-4'
            }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link to="/" className="group flex items-center gap-2">
                            <div className="p-2 bg-primary rounded-xl group-hover:rotate-6 transition-transform duration-300 shadow-lg shadow-primary/20">
                                <BookOpen className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-2xl font-black tracking-tight text-gray-900">
                                StarBridge<span className="text-primary">Tutoring</span>
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex lg:items-center lg:gap-8">
                        <div className="flex items-center gap-1">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`relative px-4 py-2 text-sm font-bold transition-all duration-300 rounded-full ${
                                        location.pathname === item.href 
                                        ? 'text-primary bg-primary/5' 
                                        : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                                    }`}
                                >
                                    {item.name}
                                    {location.pathname === item.href && (
                                        <motion.div 
                                            layoutId="nav-pill"
                                            className="absolute inset-0 border-2 border-primary/20 rounded-full"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                </Link>
                            ))}
                        </div>

                        <div className="h-6 w-px bg-gray-200 mx-2" />

                        <div className="flex items-center gap-4">
                            {isAuthLoading ? (
                                <div className="h-10 w-32 bg-gray-100 animate-pulse rounded-full"></div>
                            ) : student || isTeacher ? (
                                <div className="flex items-center gap-3">
                                    <Link 
                                        to={student ? "/student/dashboard" : "/teacher/dashboard"}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full text-sm font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/10"
                                    >
                                        <LayoutDashboard size={16} />
                                        Dashboard
                                    </Link>
                                    <button 
                                        onClick={handleSignOut}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                        title="Sign Out"
                                    >
                                        <LogOut size={20} />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <Link 
                                        to="/login" 
                                        className="text-sm font-bold text-gray-600 hover:text-primary transition-colors"
                                    >
                                        Log in
                                    </Link>
                                    <Button 
                                        to="/book-trial" 
                                        variant="primary" 
                                        className="!px-6 !py-2.5 !rounded-full text-sm shadow-xl shadow-primary/20"
                                    >
                                        Book a Free Trial
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="lg:hidden flex items-center gap-4">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className={`p-2 rounded-xl transition-all ${
                                isOpen ? 'bg-primary text-white' : 'bg-gray-50 text-gray-600'
                            }`}
                        >
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="lg:hidden bg-white border-t border-gray-100 overflow-hidden shadow-2xl"
                    >
                        <div className="px-4 pt-4 pb-8 space-y-2">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`block px-4 py-3 rounded-2xl text-base font-bold transition-all ${
                                        location.pathname === item.href
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    {item.name}
                                </Link>
                            ))}
                            
                            <div className="pt-4 border-t border-gray-100 mt-4 space-y-3">
                                {student || isTeacher ? (
                                    <>
                                        <Link
                                            to={student ? "/student/dashboard" : "/teacher/dashboard"}
                                            className="flex items-center gap-3 px-4 py-4 rounded-2xl bg-gray-900 text-white font-bold"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            <LayoutDashboard size={20} />
                                            Go to Dashboard
                                        </Link>
                                        <button
                                            onClick={handleSignOut}
                                            className="flex items-center gap-3 w-full px-4 py-4 rounded-2xl text-red-500 font-bold hover:bg-red-50 transition-all"
                                        >
                                            <LogOut size={20} />
                                            Sign Out
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            to="/login"
                                            className="block px-4 py-3 text-center text-gray-600 font-bold hover:bg-gray-50 rounded-2xl"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            Log in
                                        </Link>
                                        <Button
                                            to="/book-trial"
                                            variant="primary"
                                            className="w-full justify-center !py-4 !rounded-2xl shadow-xl shadow-primary/20"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            Book a Free Trial
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
