import React from 'react';
import Button from '../components/Button';
import { CheckCircle, BookOpen, User, Clock, Monitor } from 'lucide-react';

const Home = () => {
    return (
        <div className="bg-white">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-b from-blue-100 to-blue-50 py-20 lg:py-32 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary rounded-full blur-3xl"></div>
                    <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-accent rounded-full blur-3xl"></div>
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                        <span className="block">Personalized Online Tutoring</span>
                        <span className="block text-primary drop-shadow-sm">That Helps Students Succeed</span>
                    </h1>
                    <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500 leading-relaxed">
                        We provide one-on-one and small group online tutoring for students in Grades 1–12, helping them build confidence, improve grades, and enjoy learning.
                    </p>
                    <div className="mt-10 flex justify-center gap-4">
                        <Button to="/book-trial" variant="primary" className="text-lg px-8 py-3 shadow-xl hover:scale-105 transition-transform">
                            👉 Book a Free Trial
                        </Button>
                        <Button to="/subjects" variant="outline" className="text-lg px-8 py-3 bg-white/50 backdrop-blur-sm">
                            👉 View Subjects
                        </Button>
                    </div>
                </div>
            </section>

            {/* Featured Islamic Courses Banner */}
            <section className="bg-gradient-to-r from-yellow-50 via-white to-yellow-50 py-12 border-y-4 border-primary/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between">
                    <div className="mb-6 md:mb-0 text-center md:text-left">
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
                            New: <span className="text-primary">Islamic & Quranic Studies</span>
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl">
                            Comprehensive, expert-led courses in complete Quran memorization, Fiqh, Hadith, and Islamic History.
                        </p>
                    </div>
                    <div>
                        <Button to="/subjects" variant="primary" className="text-lg px-6 py-3 shadow-md border-b-4 border-secondary hover:translate-y-[2px] hover:border-b-2 active:translate-y-[4px] active:border-b-0 transition-all">
                            Explore Islamic Courses
                        </Button>
                    </div>
                </div>
            </section>

            {/* Why Choose Us Section */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                            Why Choose StarBridgeTutoring?
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            { icon: User, title: 'Qualified and Vetted Tutors', desc: 'Expert educators passionate about student success.' },
                            { icon: BookOpen, title: 'Personalized Learning Plans', desc: 'Tailored curriculum to meet individual needs.' },
                            { icon: Clock, title: 'Flexible Scheduling', desc: 'Learn at times that work best for your family.' },
                            { icon: Monitor, title: 'Interactive Online Classes', desc: 'Engaging lessons with virtual whiteboards.' },
                            { icon: CheckCircle, title: 'Weekly Progress Reports', desc: 'Stay updated on your child\'s improvement.' },
                            { icon: CheckCircle, title: 'Affordable Packages', desc: 'Quality education at competitive rates.' },
                        ].map((feature, index) => (
                            <div key={index} className="flex flex-col items-center text-center p-8 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="p-3 bg-blue-50 rounded-lg mb-4 group-hover:bg-primary/20 transition-colors">
                                    <feature.icon className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-primary py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-extrabold text-white sm:text-4xl mb-6">
                        Ready to Boost Your Grades?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                        Join hundreds of students achieving their academic goals with StarBridgeTutoring.
                    </p>
                    <Button to="/book-trial" variant="accent" className="text-lg font-bold px-8 py-3 bg-white text-primary hover:bg-gray-100">
                        Get Started Today
                    </Button>
                </div>
            </section>
        </div>
    );
};

export default Home;
