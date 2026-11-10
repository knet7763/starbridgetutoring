import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, BookOpen, MessageCircle } from 'lucide-react';
import { api } from '../services/api';

const Footer = () => {
    const [siteSettings, setSiteSettings] = useState({
        support_email: 'support@starbridgetutors.com',
        support_phone: '+254 700 000 000',
        whatsapp_number: '+254 700 000 000',
    });

    useEffect(() => {
        api.settings.getSiteSettings().then((s) => {
            if (s) setSiteSettings(s);
        }).catch(() => {});
    }, []);

    const cleanWhatsApp = (siteSettings.whatsapp_number || '').replace(/[^0-9]/g, '');

    return (
        <footer className="bg-gray-900 text-white relative overflow-hidden">
            {/* Subtle Gradient Overlay */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            
            <div className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-16">
                    {/* Brand Column */}
                    <div className="col-span-1 md:col-span-1 space-y-6">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="p-2 bg-primary rounded-lg">
                                <BookOpen className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-2xl font-black tracking-tight">
                                StarBridge<span className="text-primary">Tutoring</span>
                            </span>
                        </Link>
                        <p className="text-gray-400 text-lg leading-relaxed">
                            Empowering students through personalized, expert-led online education. Helping your child build confidence and achieve academic excellence.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-lg font-bold mb-6 text-white uppercase tracking-widest text-sm">Quick Links</h4>
                        <ul className="space-y-3 text-gray-400">
                            <li><Link to="/subjects" className="hover:text-primary transition-colors duration-300">Our Subjects</Link></li>
                            <li><Link to="/tutors" className="hover:text-primary transition-colors duration-300">Find a Tutor</Link></li>
                            <li><Link to="/lessons" className="hover:text-primary transition-colors duration-300">Interactive Lessons</Link></li>
                            <li><Link to="/pricing" className="hover:text-primary transition-colors duration-300">Pricing Plans</Link></li>
                            <li><Link to="/about" className="hover:text-primary transition-colors duration-300">About Us</Link></li>
                            <li><Link to="/contact" className="hover:text-primary transition-colors duration-300">Contact Support</Link></li>
                        </ul>
                    </div>

                    {/* Portals & Classrooms */}
                    <div>
                        <h4 className="text-lg font-bold mb-6 text-white uppercase tracking-widest text-sm">Classrooms & Portals</h4>
                        <ul className="space-y-3 text-gray-400">
                            <li><Link to="/book-trial" className="hover:text-primary transition-colors duration-300 font-semibold text-yellow-400">Book a Free Trial</Link></li>
                            <li><Link to="/join" className="hover:text-primary transition-colors duration-300">Join Live Classroom</Link></li>
                            <li><Link to="/student/login" className="hover:text-primary transition-colors duration-300">Student Portal Login</Link></li>
                            <li><Link to="/student/signup" className="hover:text-primary transition-colors duration-300">Create Student Account</Link></li>
                            <li><Link to="/login" className="hover:text-primary transition-colors duration-300">Teacher Portal Login</Link></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="text-lg font-bold mb-6 text-white uppercase tracking-widest text-sm">Get in Touch</h4>
                        <ul className="space-y-4 text-gray-400">
                            <li className="flex items-center gap-3">
                                <div className="p-2 bg-gray-800 rounded-lg text-primary">
                                    <Mail size={16} />
                                </div>
                                <a href={`mailto:${siteSettings.support_email}`} className="hover:text-primary transition-colors">
                                    {siteSettings.support_email}
                                </a>
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="p-2 bg-gray-800 rounded-lg text-primary">
                                    <Phone size={16} />
                                </div>
                                <a href={`tel:${(siteSettings.support_phone || '').replace(/\s+/g, '')}`} className="hover:text-primary transition-colors">
                                    {siteSettings.support_phone}
                                </a>
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="p-2 bg-gray-800 rounded-lg text-emerald-400">
                                    <MessageCircle size={16} />
                                </div>
                                <a
                                    href={`https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent('Assalamu Alaikum! I would like to inquire about StarBridge Tutoring.')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-emerald-400 transition-colors"
                                >
                                    WhatsApp Support
                                </a>
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="p-2 bg-gray-800 rounded-lg text-primary">
                                    <MapPin size={16} />
                                </div>
                                <span>Global Online Campus</span>
                            </li>
                        </ul>
                    </div>
                </div>
                
                <div className="mt-20 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
                    <p>&copy; {new Date().getFullYear()} StarBridge Tutoring. All rights reserved.</p>
                    <div className="flex gap-8">
                        <Link to="/about" className="hover:text-white transition-colors">About StarBridge</Link>
                        <Link to="/contact" className="hover:text-white transition-colors">Support & Inquiries</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
