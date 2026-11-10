import React, { useState, useEffect } from 'react';
import Button from '../components/Button';
import { Mail, Phone, MessageCircle, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [siteSettings, setSiteSettings] = useState({
        admin_email: 'knet7763@gmail.com',
        support_email: 'support@starbridgetutors.com',
        support_phone: '+254 700 000 000',
        whatsapp_number: '+254 700 000 000',
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        api.settings.getSiteSettings().then((s) => {
            if (s) setSiteSettings(s);
        }).catch(() => {});
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
            setError('Please fill in your name, email, and message.');
            return;
        }

        setSubmitting(true);
        try {
            // Also record in trial_requests so inquiries are visible in the Admin/Teacher dashboard
            await api.trials.create({
                parent_name: formData.name,
                student_name: 'General Inquiry',
                email: formData.email,
                phone: 'Not provided',
                grade_level: formData.message,
                subject: formData.subject || 'Website Contact Form',
            }).catch(() => {});

            // Trigger notification email to the configured dynamic admin email
            const adminEmail = await api.settings.getAdminEmail();
            await api.email.send('trial_request_admin', adminEmail, {
                parentName: formData.name,
                studentName: 'General Inquiry',
                email: formData.email,
                phone: 'Not provided',
                subject: formData.subject || 'Website Contact Form',
                message: formData.message,
                dashboardUrl: `${window.location.origin}/admin/dashboard?tab=trials`
            }).catch(err => {
                console.warn('[Contact] Edge function notice:', err?.message || err);
            });

            setSubmitted(true);
        } catch (err) {
            console.error('[Contact] Submit error:', err);
            setError('Failed to send message. Please reach out to support@starbridgetutors.com directly.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReset = () => {
        setFormData({ name: '', email: '', subject: '', message: '' });
        setSubmitted(false);
        setError('');
    };

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
                                    <a
                                        href={`mailto:${siteSettings.support_email || siteSettings.admin_email}`}
                                        className="text-gray-600 hover:text-primary transition-colors"
                                    >
                                        {siteSettings.support_email || siteSettings.admin_email}
                                    </a>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <Phone className="h-6 w-6 text-primary mt-1" />
                                <div className="ml-4">
                                    <h3 className="text-lg font-medium text-gray-900">Phone</h3>
                                    <a
                                        href={`tel:${(siteSettings.support_phone || '').replace(/\s+/g, '')}`}
                                        className="text-gray-600 hover:text-primary transition-colors"
                                    >
                                        {siteSettings.support_phone}
                                    </a>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <MessageCircle className="h-6 w-6 text-green-500 mt-1" />
                                <div className="ml-4">
                                    <h3 className="text-lg font-medium text-gray-900">WhatsApp</h3>
                                    <p className="text-gray-600">{siteSettings.whatsapp_number}</p>
                                    <a
                                        href={`https://wa.me/${(siteSettings.whatsapp_number || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Assalamu Alaikum! I would like to inquire about StarBridge Tutoring classes.')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs py-2 px-4 shadow-sm transition-colors"
                                    >
                                        <MessageCircle size={14} />
                                        Chat on WhatsApp
                                    </a>
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

                        {submitted ? (
                            <div className="py-8 text-center space-y-4">
                                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle2 size={36} />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900">Message Received!</h3>
                                <p className="text-gray-600 max-w-sm mx-auto">
                                    Thank you for reaching out. A StarBridge advisor will get back to you within 24 hours.
                                </p>
                                <div className="pt-4">
                                    <Button variant="outline" onClick={handleReset}>
                                        Send Another Message
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && (
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 text-sm">
                                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <div>
                                    <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700">Name</label>
                                    <input
                                        id="contact-name"
                                        name="name"
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-3 border"
                                        placeholder="Your Name"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700">Email</label>
                                    <input
                                        id="contact-email"
                                        name="email"
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-3 border"
                                        placeholder="you@example.com"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="contact-subject" className="block text-sm font-medium text-gray-700">Subject</label>
                                    <input
                                        id="contact-subject"
                                        name="subject"
                                        type="text"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-3 border"
                                        placeholder="Inquiry about..."
                                    />
                                </div>
                                <div>
                                    <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700">Message</label>
                                    <textarea
                                        id="contact-message"
                                        name="message"
                                        rows={4}
                                        required
                                        value={formData.message}
                                        onChange={handleChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-3 border"
                                        placeholder="How can we help?"
                                    />
                                </div>
                                <Button type="submit" variant="primary" className="w-full justify-center" disabled={submitting}>
                                    {submitting ? 'Sending...' : 'Send Message'}
                                </Button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
