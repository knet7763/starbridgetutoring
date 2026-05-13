import React from 'react';
import { motion } from 'framer-motion';
import Button from '../components/Button';
import { CheckCircle, BookOpen, User, Clock, Monitor, Sparkles, Star, ShieldCheck, ArrowRight } from 'lucide-react';

const Home = () => {
    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: (i) => ({
            opacity: 1,
            y: 0,
            transition: { delay: i * 0.1, duration: 0.8, ease: "easeOut" }
        })
    };

    return (
        <div className="bg-white overflow-hidden">
            {/* Hero Section */}
            <section className="relative min-h-[90vh] flex items-center pt-20 pb-32 overflow-hidden">
                {/* Dynamic Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                    <motion.div 
                        animate={{ 
                            scale: [1, 1.2, 1],
                            rotate: [0, 90, 0],
                        }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px]"
                    />
                    <motion.div 
                        animate={{ 
                            scale: [1, 1.3, 1],
                            x: [0, 50, 0],
                        }}
                        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[100px]"
                    />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <motion.div 
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="text-left"
                        >
                            <motion.div 
                                custom={0}
                                variants={fadeIn}
                                className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full font-bold text-sm mb-6"
                            >
                                <Sparkles size={16} /> Empowering Future Leaders
                            </motion.div>
                            <motion.h1 
                                custom={1}
                                variants={fadeIn}
                                className="text-5xl lg:text-7xl font-black tracking-tight text-gray-900 leading-[1.1]"
                            >
                                Personalized <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Learning</span> for a Brighter Future
                            </motion.h1>
                            <motion.p 
                                custom={2}
                                variants={fadeIn}
                                className="mt-8 text-xl text-gray-600 leading-relaxed max-w-xl"
                            >
                                We provide expert-led, one-on-one online tutoring for Grades 1–12. Build confidence, master subjects, and achieve academic excellence from home.
                            </motion.p>
                            <motion.div 
                                custom={3}
                                variants={fadeIn}
                                className="mt-10 flex flex-wrap gap-4"
                            >
                                <Button to="/book-trial" variant="primary" className="text-lg px-8 py-4 shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                                    Book a Free Trial <ArrowRight size={20} />
                                </Button>
                                <Button to="/subjects" variant="outline" className="text-lg px-8 py-4 bg-white/50 backdrop-blur-sm hover:bg-gray-50 transition-all">
                                    Explore Subjects
                                </Button>
                            </motion.div>

                            <motion.div 
                                custom={4}
                                variants={fadeIn}
                                className="mt-12 flex items-center gap-8 pt-8 border-t border-gray-100"
                            >
                                <div>
                                    <p className="text-3xl font-black text-gray-900">500+</p>
                                    <p className="text-sm font-medium text-gray-500">Happy Students</p>
                                </div>
                                <div className="w-px h-10 bg-gray-200" />
                                <div>
                                    <p className="text-3xl font-black text-gray-900">50+</p>
                                    <p className="text-sm font-medium text-gray-500">Expert Tutors</p>
                                </div>
                                <div className="w-px h-10 bg-gray-200" />
                                <div className="flex items-center gap-1 text-yellow-500">
                                    <Star size={20} fill="currentColor" />
                                    <Star size={20} fill="currentColor" />
                                    <Star size={20} fill="currentColor" />
                                    <Star size={20} fill="currentColor" />
                                    <Star size={20} fill="currentColor" />
                                </div>
                            </motion.div>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            viewport={{ once: true }}
                            className="relative"
                        >
                            <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white">
                                <img 
                                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800" 
                                    alt="Students learning" 
                                    className="w-full h-auto object-cover transform hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 to-transparent" />
                            </div>
                            
                            {/* Floating Feature Cards */}
                            <motion.div 
                                animate={{ y: [0, -15, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -top-10 -left-10 z-20 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 hidden sm:flex items-center gap-4"
                            >
                                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                                    <ShieldCheck size={24} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">Vetted Tutors</p>
                                    <p className="text-xs text-gray-500">Safe & Professional</p>
                                </div>
                            </motion.div>

                            <motion.div 
                                animate={{ y: [0, 15, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -bottom-10 -right-10 z-20 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 hidden sm:flex items-center gap-4"
                            >
                                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                    <Monitor size={24} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">Interactive Class</p>
                                    <p className="text-xs text-gray-500">Live Whiteboard</p>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Featured Islamic Courses Banner */}
            <section className="relative py-24 bg-gray-900 overflow-hidden">
                <div className="absolute top-0 right-0 w-[50%] h-full opacity-20">
                    <img 
                        src="https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&q=80&w=800" 
                        alt="Islamic Art" 
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="max-w-2xl">
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-4xl font-black text-white mb-6">
                                Specialized <span className="text-primary">Islamic & Quranic</span> Studies
                            </h2>
                            <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                                From Quran memorization to Fiqh and Hadith. Our expert instructors provide a deep, personalized learning experience for all ages.
                            </p>
                            <Button to="/subjects" variant="primary" className="text-lg px-8 py-4 shadow-xl shadow-primary/20">
                                Explore Islamic Curriculum
                            </Button>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Why Choose Us Section */}
            <section className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <motion.h2 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl font-black text-gray-900 sm:text-5xl"
                        >
                            The StarBridge <span className="text-primary">Advantage</span>
                        </motion.h2>
                        <p className="mt-4 text-xl text-gray-500">Everything you need for academic success in one place.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            { icon: User, title: 'Qualified & Vetted Tutors', desc: 'Every tutor undergoes rigorous background checks and teaching assessments.', color: 'blue' },
                            { icon: BookOpen, title: 'Tailored Learning Plans', desc: 'Curriculum designed specifically for each student\'s unique goals.', color: 'green' },
                            { icon: Clock, title: 'Flexible Scheduling', desc: 'Easily book and manage sessions around your busy life.', color: 'purple' },
                            { icon: Monitor, title: 'Next-Gen Classroom', desc: 'Real-time synchronization, drawing, and interactive quizzes.', color: 'orange' },
                            { icon: CheckCircle, title: 'Progress Tracking', desc: 'Detailed insights and weekly reports for parents and students.', color: 'red' },
                            { icon: Sparkles, title: 'Gamified Experience', desc: 'Students earn stars and badges to stay motivated and engaged.', color: 'yellow' },
                        ].map((feature, index) => (
                            <motion.div 
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="group p-8 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
                            >
                                <div className={`w-14 h-14 bg-${feature.color}-50 text-${feature.color}-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    <feature.icon size={28} />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                                <p className="text-gray-600 leading-relaxed text-lg">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-24 bg-gray-50 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
                    
                    <div className="text-center mb-16 relative z-10">
                        <span className="inline-block py-1.5 px-4 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest mb-4">
                            Parent Success Stories
                        </span>
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter mb-4">
                            Trusted by Families Worldwide
                        </h2>
                        <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                            Join hundreds of students who have transformed their learning journey with StarBridge Tutoring.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                        {[
                            {
                                name: "Sarah Al-Farsi",
                                role: "Parent of 2 students",
                                text: "The interactive classroom is a game-changer! My kids actually look forward to their Quran and Math sessions. The tutors are incredibly patient and professional.",
                                stars: 5,
                                color: "primary"
                            },
                            {
                                name: "James Wilson",
                                role: "High School Parent",
                                text: "We struggled to find a tutor who could explain complex Calculus simply. StarBridge matched us with an expert who boosted my son's grade from a C to an A in one term.",
                                stars: 5,
                                color: "accent"
                            },
                            {
                                name: "Aisha Ibrahim",
                                role: "Primary School Parent",
                                text: "Finding high-quality Islamic studies online was difficult until we found StarBridge. The gamification keeps my daughter motivated to earn stars and badges every day.",
                                stars: 5,
                                color: "primary"
                            }
                        ].map((t, i) => (
                            <div key={i} className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100 hover:shadow-2xl transition-all hover:-translate-y-2 group">
                                <div className="flex gap-1 mb-6">
                                    {[...Array(t.stars)].map((_, i) => (
                                        <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </div>
                                <p className="text-gray-600 italic mb-8 text-lg leading-relaxed">"{t.text}"</p>
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center font-black text-gray-500`}>
                                        {t.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-gray-900">{t.name}</h4>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{t.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA Section */}
            <section className="py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="bg-primary rounded-[3rem] p-12 lg:p-20 text-center relative overflow-hidden shadow-2xl shadow-primary/40"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
                        
                        <div className="relative z-10">
                            <h2 className="text-4xl lg:text-6xl font-black text-white mb-8 tracking-tighter">
                                The Bridge to Academic Excellence
                            </h2>
                            <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto font-medium">
                                Join hundreds of students achieving their goals with personalized, expert-led online tutoring.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center gap-6">
                                <Button to="/book-trial" className="text-xl font-black px-10 py-5 bg-white text-primary hover:bg-gray-100 shadow-xl rounded-2xl">
                                    Book Free Trial
                                </Button>
                                <Button to="/contact" className="text-xl font-black px-10 py-5 bg-primary/20 text-white border-2 border-white/30 hover:bg-white/10 backdrop-blur-sm rounded-2xl">
                                    Contact Support
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default Home;
