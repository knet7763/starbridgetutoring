import React from 'react';
import { motion } from 'framer-motion';
import { Target, Users, Heart, Shield, Sparkles, Star } from 'lucide-react';

const About = () => {
    return (
        <div className="bg-white">
            {/* Hero Section */}
            <section className="relative py-24 bg-gray-50 overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-3xl mx-auto">
                        <motion.span 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-block py-1 px-4 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-[0.2em] mb-6"
                        >
                            Our Vision & Values
                        </motion.span>
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-5xl md:text-7xl font-black text-gray-900 tracking-tighter mb-8 leading-tight"
                        >
                            Bridging the Gap in <span className="text-primary">Personalized</span> Education
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl text-gray-600 leading-relaxed font-medium"
                        >
                            StarBridge Tutoring was born from a simple belief: every student deserves a mentor who understands their unique pace, culture, and potential.
                        </motion.p>
                    </div>
                </div>
            </section>

            {/* Core Values Section */}
            <section className="py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                        <div className="relative">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                className="rounded-[3rem] overflow-hidden shadow-2xl relative z-10"
                            >
                                <img
                                    src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=1000"
                                    alt="Students learning"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent" />
                                <div className="absolute bottom-8 left-8 right-8">
                                    <p className="text-white text-2xl font-black tracking-tight">"Education is the most powerful weapon which you can use to change the world."</p>
                                </div>
                            </motion.div>
                            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-accent/20 rounded-full blur-3xl -z-0" />
                        </div>

                        <div className="space-y-12">
                            <div>
                                <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-6">Our Mission</h2>
                                <p className="text-lg text-gray-600 leading-relaxed">
                                    Our mission is to make premium, personalized education accessible to families worldwide. We combine cutting-edge interactive technology with the world's most passionate educators to create a learning environment where students don't just study—they thrive.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                {[
                                    { icon: Target, title: "Precision", desc: "Curriculum tailored to individual goals." },
                                    { icon: Heart, title: "Empathy", desc: "Patient, supportive, and culturally aware mentors." },
                                    { icon: Shield, title: "Safety", desc: "Fully vetted tutors in a secure digital space." },
                                    { icon: Sparkles, title: "Engagement", desc: "Gamified learning that makes study fun." }
                                ].map((value, i) => (
                                    <div key={i} className="flex flex-col gap-4">
                                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-primary border border-gray-100">
                                            <value.icon size={24} />
                                        </div>
                                        <h3 className="font-black text-gray-900 text-xl tracking-tight">{value.title}</h3>
                                        <p className="text-gray-500 text-sm font-medium">{value.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Specialized Islamic Focus Section */}
            <section className="py-24 bg-gray-900 text-white overflow-hidden relative">
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                        <div className="order-2 lg:order-1">
                            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-8 leading-tight">
                                A Bridge for <span className="text-primary">Spiritual</span> Growth
                            </h2>
                            <p className="text-xl text-gray-400 mb-10 leading-relaxed font-medium">
                                Beyond academic subjects, we take immense pride in our specialized Islamic curriculum. We connect students with scholars and teachers who nurture faith through Quranic studies, Hadith, and Islamic history, ensuring a holistic education that balances the mind and soul.
                            </p>
                            <div className="flex items-center gap-6">
                                <div className="flex -space-x-4">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="w-12 h-12 rounded-full border-4 border-gray-900 bg-gray-800 flex items-center justify-center">
                                            <Users size={20} className="text-gray-500" />
                                        </div>
                                    ))}
                                </div>
                                <p className="text-sm font-bold text-gray-300">Joined by 1,000+ Students</p>
                            </div>
                        </div>
                        <div className="order-1 lg:order-2">
                            <div className="bg-gradient-to-br from-primary/20 to-accent/20 p-1 rounded-[3rem] shadow-2xl">
                                <div className="bg-gray-800 rounded-[2.8rem] p-12 text-center">
                                    <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner shadow-primary/20">
                                        <Star size={40} className="text-primary" />
                                    </div>
                                    <p className="text-2xl font-black italic text-gray-100 leading-relaxed">"The goal of StarBridge is to build a generation that is both academically brilliant and spiritually grounded."</p>
                                    <div className="mt-8">
                                        <p className="text-primary font-black uppercase tracking-widest text-xs">Rich Kev</p>
                                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Founder & CEO</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default About;
