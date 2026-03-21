import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useStudentAuth } from '../contexts/StudentAuthContext';
import Button from './Button';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const { user: teacher, signOut: teacherSignOut } = useAuth();
    const { student, signOut: studentSignOut } = useStudentAuth();

    const navigation = [
        { name: 'Home', href: '/' },
        { name: 'Subjects', href: '/subjects' },
        { name: 'Tutors', href: '/tutors' },
        { name: 'Lessons', href: '/lessons' },
        { name: 'Pricing', href: '/pricing' },
        { name: 'How It Works', href: '/how-it-works' },
        { name: 'Join Class', href: '/join' },
        { name: 'About Us', href: '/about' },
        { name: 'Contact', href: '/contact' },
    ];

    const getNavItemClasses = (path, isMobile = false) => {
        const activeClass = isMobile ? 'bg-blue-50 border-primary text-primary' : 'text-primary font-semibold';
        const inactiveClass = isMobile ? 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800' : 'text-gray-600 hover:text-primary';
        const baseClass = isMobile ? 'block pl-3 pr-4 py-2 border-l-4 text-base font-medium' : 'text-sm font-medium transition-colors';

        return `${baseClass} ${location.pathname === path ? activeClass : inactiveClass}`;
    };

    const handleSignOut = async () => {
        if (teacher) await teacherSignOut();
        if (student) await studentSignOut();
        navigate('/');
        setIsOpen(false);
    };

    return (
        <nav className="bg-white shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0 flex items-center">
                            <BookOpen className="h-8 w-8 text-primary" />
                            <span className="ml-2 text-xl font-bold text-gray-900">StarBridge<span className="text-primary">Tutoring</span></span>
                        </Link>
                    </div>

                    {/* Desktop menu */}
                    <div className="hidden lg:flex lg:items-center lg:space-x-8">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={getNavItemClasses(item.href)}
                            >
                                {item.name}
                            </Link>
                        ))}
                        <div className="flex items-center space-x-4 ml-4">
                            {student ? (
                                <>
                                    <Link to="/student/dashboard" className="text-sm font-medium text-primary hover:text-secondary">
                                        Student Dashboard
                                    </Link>
                                    <button onClick={handleSignOut} className="text-sm font-medium text-gray-600 hover:text-red-500 transition-colors">
                                        Sign Out
                                    </button>
                                </>
                            ) : teacher ? (
                                <>
                                    <Link to="/teacher/dashboard" className="text-sm font-medium text-primary hover:text-secondary">
                                        Teacher Dashboard
                                    </Link>
                                    <button onClick={handleSignOut} className="text-sm font-medium text-gray-600 hover:text-red-500 transition-colors">
                                        Sign Out
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-primary">
                                        Log in
                                    </Link>
                                    <Button to="/book-trial" variant="primary" className="!px-4 !py-2 text-sm">
                                        Book Free Trial
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <div className="flex items-center lg:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                        >
                            <span className="sr-only">Open main menu</span>
                            {isOpen ? (
                                <X className="block h-6 w-6" aria-hidden="true" />
                            ) : (
                                <Menu className="block h-6 w-6" aria-hidden="true" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {isOpen && (
                <div className="lg:hidden">
                    <div className="pt-2 pb-3 space-y-1">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={getNavItemClasses(item.href, true)}
                                onClick={() => setIsOpen(false)}
                            >
                                {item.name}
                            </Link>
                        ))}
                        <div className="pt-4 pb-4 border-t border-gray-200">
                            {student ? (
                                <div className="flex flex-col px-4 space-y-3">
                                    <Link
                                        to="/student/dashboard"
                                        className="block text-base font-medium text-primary"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Student Dashboard
                                    </Link>
                                    <button
                                        onClick={handleSignOut}
                                        className="block text-base font-medium text-left text-gray-600 hover:text-red-500"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            ) : teacher ? (
                                <div className="flex flex-col px-4 space-y-3">
                                    <Link
                                        to="/teacher/dashboard"
                                        className="block text-base font-medium text-primary"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Teacher Dashboard
                                    </Link>
                                    <button
                                        onClick={handleSignOut}
                                        className="block text-base font-medium text-left text-gray-600 hover:text-red-500"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center px-4 space-x-4">
                                    <Link
                                        to="/login"
                                        className="block text-base font-medium text-gray-500 hover:text-gray-800"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Log in
                                    </Link>
                                    <Button
                                        to="/book-trial"
                                        variant="primary"
                                        className="w-full justify-center"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Book Free Trial
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
