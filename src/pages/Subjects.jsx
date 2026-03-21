import React from 'react';
import { Calculator, Book, FlaskConical, PenTool, GraduationCap } from 'lucide-react';

const Subjects = () => {
    const subjects = [
        { name: 'Mathematics', icon: Calculator, desc: 'From basic arithmetic to advanced calculus.' },
        { name: 'English & Reading', icon: Book, desc: 'Grammar, literature, and reading comprehension.' },
        { name: 'Science', icon: FlaskConical, desc: 'Biology, Chemistry, and Physics.' },
        { name: 'College Prep', icon: GraduationCap, desc: 'Guidance for college applications and readiness.' },
        { name: 'Test Preparation', icon: PenTool, desc: 'SAT, ACT, and other standardized tests.' },
    ];

    const levels = ['Primary School (Grades 1-5)', 'Middle School (Grades 6-8)', 'High School (Grades 9-12)'];

    return (
        <div className="bg-white py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Subjects We Offer</h1>
                    <p className="text-xl text-gray-500">Comprehensive tutoring across all major subjects.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
                    {subjects.map((subject) => (
                        <div key={subject.name} className="flex flex-col items-center p-8 bg-blue-50 rounded-2xl border border-blue-100 hover:shadow-lg transition-all">
                            <subject.icon className="h-16 w-16 text-accent mb-6" />
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">{subject.name}</h3>
                            <p className="text-center text-gray-600">{subject.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Islamic & Quranic Studies Section */}
                <div className="mb-20">
                    <div className="text-center mb-12">
                        <span className="inline-block py-1 px-3 rounded-full bg-yellow-100 text-yellow-800 text-sm font-semibold mb-4 border border-yellow-200">
                            SPECIALIZED CURRICULUM
                        </span>
                        <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Islamic & Quranic Studies</h2>
                        <p className="text-xl text-gray-500 max-w-3xl mx-auto">Expertly guided sessions designed to nurture faith, understanding, and memorization.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { name: 'Quran Studies', desc: 'Tajweed, memorization (Hifz), and Tafseer.', icon: '📖' },
                            { name: 'Fiqh (Jurisprudence)', desc: 'Understanding Islamic law and daily practices.', icon: '⚖️' },
                            { name: 'Hadith', desc: 'Studying the sayings and traditions of the Prophet (SAW).', icon: '📜' },
                            { name: 'Islamic History', desc: 'The rich heritage and history of the Islamic world.', icon: '🕌' }
                        ].map((course) => (
                            <div key={course.name} className="flex flex-col items-center p-8 bg-yellow-50 rounded-2xl border border-yellow-200 hover:shadow-xl hover:-translate-y-1 transition-all">
                                <span className="text-5xl mb-6">{course.icon}</span>
                                <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">{course.name}</h3>
                                <p className="text-center text-gray-600 text-sm">{course.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-gray-900 rounded-3xl p-8 md:p-12 text-center">
                    <h2 className="text-3xl font-bold text-white mb-8">We Cover All Levels</h2>
                    <div className="flex flex-col md:flex-row justify-center gap-6">
                        {levels.map((level) => (
                            <div key={level} className="bg-gray-800 text-white px-6 py-4 rounded-xl font-semibold border border-gray-700">
                                {level}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-20 text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">How Classes Work</h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Lessons are delivered online through live video sessions with interactive whiteboards and worksheets, ensuring a classroom-like experience from the comfort of your home.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Subjects;
