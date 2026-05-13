import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin, BookOpen, Youtube, Linkedin } from 'lucide-react';

const Footer = () => {
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
                        <ul className="space-y-4 text-gray-400">
                            <li><Link to="/about" className="hover:text-primary transition-colors duration-300">About Us</Link></li>
                            <li><Link to="/subjects" className="hover:text-primary transition-colors duration-300">Our Subjects</Link></li>
                            <li><Link to="/tutors" className="hover:text-primary transition-colors duration-300">Find a Tutor</Link></li>
                            <li><Link to="/pricing" className="hover:text-primary transition-colors duration-300">Pricing Plans</Link></li>
                            <li><Link to="/contact" className="hover:text-primary transition-colors duration-300">Contact Support</Link></li>
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
                                <span>info@starbridgetutoring.com</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="p-2 bg-gray-800 rounded-lg text-primary">
                                    <Phone size={16} />
                                </div>
                                <span>+1 (555) 123-4567</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="p-2 bg-gray-800 rounded-lg text-primary">
                                    <MapPin size={16} />
                                </div>
                                <span>Global Online Campus</span>
                            </li>
                        </ul>
                    </div>

                    {/* Socials & Newsletter Placeholder */}
                    <div>
                        <h4 className="text-lg font-bold mb-6 text-white uppercase tracking-widest text-sm">Follow Our Journey</h4>
                        <div className="flex space-x-4 mb-8">
                            {[Facebook, Twitter, Instagram, Youtube, Linkedin].map((Icon, i) => (
                                <a 
                                    key={i} 
                                    href="#" 
                                    className="p-3 bg-gray-800 text-gray-400 rounded-xl hover:bg-primary hover:text-white hover:-translate-y-1 transition-all duration-300 shadow-lg"
                                >
                                    <Icon size={20} />
                                </a>
                            ))}
                        </div>
                        <p className="text-sm text-gray-500 italic">
                            Stay updated with our latest course additions and educational tips.
                        </p>
                    </div>
                </div>
                
                <div className="mt-20 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
                    <p>&copy; {new Date().getFullYear()} StarBridge Tutoring. All rights reserved.</p>
                    <div className="flex gap-8">
                        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
