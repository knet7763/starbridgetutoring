import React from 'react';
import { UserPlus, Search, Calendar, CreditCard, Video, TrendingUp } from 'lucide-react';

const HowItWorks = () => {
    const steps = [
        { icon: UserPlus, title: '1. Sign Up', desc: 'Create your free account to get started.' },
        { icon: Search, title: '2. Choose Subject & Tutor', desc: 'Browse our list of qualified tutors and subjects.' },
        { icon: Calendar, title: '3. Book Your Time', desc: 'Select a time slot that fits your schedule.' },
        { icon: CreditCard, title: '4. Secure Payment', desc: 'Pay securely via M-Pesa or PayPal.' },
        { icon: Video, title: '5. Attend Online Class', desc: 'Join the live interactive video session.' },
        { icon: TrendingUp, title: '6. Track Progress', desc: 'Monitor improvement with regular reports.' },
    ];

    return (
        <div className="bg-gray-50 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-4">How It Works</h1>
                    <p className="text-xl text-gray-600">Getting started with StarBridgeTutoring is easy.</p>
                </div>

                <div className="relative">
                    {/* Connecting line for desktop */}
                    <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 z-0" />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                        {steps.map((step, index) => (
                            <div key={index} className="flex flex-col items-center text-center bg-white p-6 rounded-xl shadow-md">
                                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-white mb-4 shadow-lg">
                                    <step.icon className="h-8 w-8" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                                <p className="text-gray-600">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HowItWorks;
