import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-1">
                        <h3 className="text-xl font-bold mb-4">StarBridge<span className="text-primary">Tutoring</span></h3>
                        <p className="text-gray-400 text-sm">
                            We provide one-on-one and small group online tutoring for students in Grades 1–12, helping them build confidence and succeed.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><Link to="/about" className="hover:text-white">About Us</Link></li>
                            <li><Link to="/subjects" className="hover:text-white">Subjects</Link></li>
                            <li><Link to="/tutors" className="hover:text-white">Find a Tutor</Link></li>
                            <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
                            <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li className="flex items-center"><Mail className="h-4 w-4 mr-2" /> info@starbridgetutoring.com</li>
                            <li className="flex items-center"><Phone className="h-4 w-4 mr-2" /> +1 (555) 123-4567</li>
                            <li className="flex items-center"><MapPin className="h-4 w-4 mr-2" /> Online / Remote</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold mb-4">Follow Us</h4>
                        <div className="flex space-x-4">
                            <a href="#" className="text-gray-400 hover:text-white"><Facebook className="h-6 w-6" /></a>
                            <a href="#" className="text-gray-400 hover:text-white"><Twitter className="h-6 w-6" /></a>
                            <a href="#" className="text-gray-400 hover:text-white"><Instagram className="h-6 w-6" /></a>
                        </div>
                    </div>
                </div>
                <div className="mt-8 border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
                    &copy; {new Date().getFullYear()} StarBridgeTutoring. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
