import React from 'react';

const About = () => {
    return (
        <div className="bg-white py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto text-center mb-16">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-6">About StarBridgeTutoring</h1>
                    <p className="text-xl text-gray-600">
                        Connecting students with qualified, passionate teachers who make learning simple and enjoyable.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div>
                        <img
                            src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80"
                            alt="Students learning"
                            className="rounded-2xl shadow-xl"
                        />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
                        <p className="text-lg text-gray-600 mb-6">
                            Our mission is to make quality education accessible and affordable for every student. We believe that with the right guidance, every student has the potential to excel.
                        </p>
                        <p className="text-lg text-gray-600 mb-6">
                            We started this tutoring service because we saw a gap in personalized education. Traditional classrooms can't always cater to individual learning speeds and styles. That's where we come in.
                        </p>
                        <div className="bg-blue-50 p-6 rounded-xl border-l-4 border-primary">
                            <p className="text-blue-900 font-medium italic">
                                "Education is not the learning of facts, but the training of the mind to think."
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;
