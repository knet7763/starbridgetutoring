import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Button from '../Button';

const AdminAvailabilityTab = ({ tutors }) => {
    const [selectedTutorForAvailability, setSelectedTutorForAvailability] = useState(null);
    const [availabilityForm, setAvailabilityForm] = useState([]);
    const [savingAvailability, setSavingAvailability] = useState(false);

    useEffect(() => {
        if (selectedTutorForAvailability) {
            fetchAvailability(selectedTutorForAvailability.id);
        }
    }, [selectedTutorForAvailability]);

    const fetchAvailability = async (tutorId) => {
        const { data, error } = await supabase
            .from('tutor_availability')
            .select('*')
            .eq('tutor_id', tutorId);

        if (error) {
            console.error('Error fetching availability:', error);
            return;
        }

        // Initialize form with 7 days
        const days = [0, 1, 2, 3, 4, 5, 6]; // 0=Sunday
        const formState = days.map(day => {
            const existing = data.find(d => d.day_of_week === day);
            return {
                day_of_week: day,
                start_time: existing?.start_time || '',
                end_time: existing?.end_time || '',
                is_active: existing ? true : false
            };
        });
        setAvailabilityForm(formState);
    };

    const handleAvailabilityChange = (dayIndex, field, value) => {
        const newForm = [...availabilityForm];
        newForm[dayIndex] = { ...newForm[dayIndex], [field]: value };
        setAvailabilityForm(newForm);
    };

    const saveAvailability = async () => {
        if (!selectedTutorForAvailability) return;
        setSavingAvailability(true);

        // Delete existing
        const { error: deleteError } = await supabase
            .from('tutor_availability')
            .delete()
            .eq('tutor_id', selectedTutorForAvailability.id);

        if (deleteError) {
            console.error('Error deleting old availability:', deleteError);
            setSavingAvailability(false);
            return;
        }

        // Insert new active ones
        const activeSlots = availabilityForm.filter(slot => slot.is_active && slot.start_time && slot.end_time).map(slot => ({
            tutor_id: selectedTutorForAvailability.id,
            day_of_week: slot.day_of_week,
            start_time: slot.start_time,
            end_time: slot.end_time,
            is_active: true
        }));

        if (activeSlots.length > 0) {
            const { error: insertError } = await supabase
                .from('tutor_availability')
                .insert(activeSlots);

            if (insertError) console.error('Error saving availability:', insertError);
        }

        setSavingAvailability(false);
        alert('Availability saved!');
    };

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return (
        <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Manage Tutor Availability</h2>

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Tutor</label>
                <select
                    className="block w-full max-w-md rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
                    onChange={(e) => setSelectedTutorForAvailability(tutors.find(t => t.id === e.target.value))}
                    value={selectedTutorForAvailability?.id || ''}
                >
                    <option value="">-- Select a tutor --</option>
                    {tutors.map(tutor => (
                        <option key={tutor.id} value={tutor.id}>{tutor.name}</option>
                    ))}
                </select>
            </div>

            {selectedTutorForAvailability && (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Weekly Schedule for {selectedTutorForAvailability.name}
                        </h3>
                        <Button
                            variant="primary"
                            onClick={saveAvailability}
                            disabled={savingAvailability}
                        >
                            {savingAvailability ? 'Saving...' : 'Save Schedule'}
                        </Button>
                    </div>
                    <div className="border-t border-gray-200">
                        <div className="divide-y divide-gray-200">
                            {availabilityForm.map((slot, index) => (
                                <div key={slot.day_of_week} className="px-4 py-4 sm:px-6 grid grid-cols-12 gap-4 items-center">
                                    <div className="col-span-3">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                                checked={slot.is_active}
                                                onChange={(e) => handleAvailabilityChange(index, 'is_active', e.target.checked)}
                                            />
                                            <span className="ml-3 text-sm font-medium text-gray-900">
                                                {daysOfWeek[slot.day_of_week]}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="col-span-9 flex items-center space-x-4">
                                        <div className={`flex items-center space-x-2 ${!slot.is_active ? 'opacity-50 pointer-events-none' : ''}`}>
                                            <span className="text-sm text-gray-500">From:</span>
                                            <input
                                                type="time"
                                                className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-1 border"
                                                value={slot.start_time}
                                                onChange={(e) => handleAvailabilityChange(index, 'start_time', e.target.value)}
                                            />
                                        </div>
                                        <div className={`flex items-center space-x-2 ${!slot.is_active ? 'opacity-50 pointer-events-none' : ''}`}>
                                            <span className="text-sm text-gray-500">To:</span>
                                            <input
                                                type="time"
                                                className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-1 border"
                                                value={slot.end_time}
                                                onChange={(e) => handleAvailabilityChange(index, 'end_time', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAvailabilityTab;
