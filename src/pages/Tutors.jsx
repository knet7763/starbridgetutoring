import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';

const Tutors = () => {
    const [tutors, setTutors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTutors();
    }, []);

    const fetchTutors = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('tutors')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching tutors:', error);
        } else {
            setTutors(data || []);
        }
        setLoading(false);
    };

    return (
        <div className="bg-gray-50 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Meet Our Tutors</h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Our tutors are carefully selected, trained, and monitored to ensure the highest quality teaching for your child.
                    </p>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="text-xl text-gray-600">Loading tutors...</div>
                    </div>
                ) : tutors.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-xl text-gray-600">No tutors available yet. Check back soon!</div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {tutors.map((tutor) => (
                            <div key={tutor.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow flex flex-col">
                                <div className="h-48 w-full overflow-hidden">
                                    <img className="w-full h-full object-cover" src={tutor.image_url || 'https://via.placeholder.com/256'} alt={tutor.name} />
                                </div>
                                <div className="p-6 flex flex-col flex-grow">
                                    <h3 className="text-xl font-bold text-gray-900">{tutor.name}</h3>
                                    <p className="text-primary font-medium mb-2">{tutor.subject}</p>
                                    <p className="text-xs text-gray-500 mb-2">{tutor.qualification}</p>
                                    <p className="text-gray-600 text-sm mb-4 flex-grow">{tutor.bio}</p>

                                    {tutor.languages && tutor.languages.length > 0 && (
                                        <div className="mb-4">
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Speaks: </span>
                                            <span className="text-sm text-gray-700">{tutor.languages.join(', ')}</span>
                                        </div>
                                    )}

                                    <Button to={`/book-session/${tutor.id}`} variant="primary" className="w-full justify-center">
                                        Book Session
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Tutors;

