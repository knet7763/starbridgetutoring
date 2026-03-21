import React from 'react';
import Button from '../components/Button';

const BookTrial = () => {
    return (
        <div className="bg-gray-50 py-12">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white p-8 rounded-2xl shadow-xl">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-extrabold text-gray-900">Book Your Free Trial</h1>
                        <p className="mt-2 text-gray-600">Experience personalized learning today. No commitment required.</p>
                    </div>

                    <form className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Parent's Name</label>
                                <input type="text" className="mt-1 block w-full rounded-md border-gray-300 border shadow-sm p-2 focus:border-primary focus:ring-primary" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Student's Name</label>
                                <input type="text" className="mt-1 block w-full rounded-md border-gray-300 border shadow-sm p-2 focus:border-primary focus:ring-primary" required />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email Address</label>
                            <input type="email" className="mt-1 block w-full rounded-md border-gray-300 border shadow-sm p-2 focus:border-primary focus:ring-primary" required />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                            <input type="tel" className="mt-1 block w-full rounded-md border-gray-300 border shadow-sm p-2 focus:border-primary focus:ring-primary" required />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Grade Level</label>
                            <select className="mt-1 block w-full rounded-md border-gray-300 border shadow-sm p-2 focus:border-primary focus:ring-primary">
                                <option>Select Grade...</option>
                                <option>Grades 1-5 (Primary)</option>
                                <option>Grades 6-8 (Middle School)</option>
                                <option>Grades 9-12 (High School)</option>
                                <option>College / Adult</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Subject of Interest</label>
                            <input type="text" className="mt-1 block w-full rounded-md border-gray-300 border shadow-sm p-2 focus:border-primary focus:ring-primary" placeholder="e.g. Math, Science" />
                        </div>

                        <div className="pt-4">
                            <Button variant="primary" className="w-full justify-center text-lg py-3">
                                Schedule Free Trial
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default BookTrial;
