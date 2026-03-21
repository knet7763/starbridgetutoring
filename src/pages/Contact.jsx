import React from 'react';
import Button from '../components/Button';
import { Mail, Phone, MessageCircle, Clock } from 'lucide-react';

const Contact = () => {
    return (
        <div className="bg-white py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Contact Us</h1>
                    <p className="text-xl text-gray-600">We're here to help! Reach out to us with any questions.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Contact Info */}
                    <div className="bg-blue-50 p-8 rounded-2xl">
                        <h2 className="text-2xl font-bold text-gray-900 mb-8">Get in Touch</h2>
                        <div className="space-y-6">
                            <div className="flex items-start">
                                <Mail className="h-6 w-6 text-primary mt-1" />
                                <div className="ml-4">
                                    <h3 className="text-lg font-medium text-gray-900">Email</h3>
                                    <p className="text-gray-600">support@starbridgetutoring.com</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <Phone className="h-6 w-6 text-primary mt-1" />
                                <div className="ml-4">
                                    <h3 className="text-lg font-medium text-gray-900">Phone</h3>
                                    <p className="text-gray-600">+1 (555) 123-4567</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <MessageCircle className="h-6 w-6 text-green-500 mt-1" />
                                <div className="ml-4">
                                    <h3 className="text-lg font-medium text-gray-900">WhatsApp</h3>
                                    <p className="text-gray-600">+1 (555) 987-6543</p>
                                    <Button variant="accent" className="mt-2 text-xs py-1 px-3">Chat on WhatsApp</Button>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <Clock className="h-6 w-6 text-primary mt-1" />
                                <div className="ml-4">
                                    <h3 className="text-lg font-medium text-gray-900">Business Hours</h3>
                                    <p className="text-gray-600">Mon - Fri: 8:00 AM - 8:00 PM</p>
                                    <p className="text-gray-600">Sat - Sun: 9:00 AM - 5:00 PM</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
                        <form className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-3 border" placeholder="Your Name" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input type="email" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-3 border" placeholder="you@example.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Subject</label>
                                <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-3 border" placeholder="Inquiry about..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Message</label>
                                <textarea rows={4} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-3 border" placeholder="How can we help?"></textarea>
                            </div>
                            <Button variant="primary" className="w-full justify-center">
                                Send Message
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
