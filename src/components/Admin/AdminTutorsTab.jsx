import React, { useState } from 'react';
import { api } from '../../services/api';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import Button from '../Button';
import FileUpload from '../FileUpload';

const AdminTutorsTab = ({ tutors, loading, fetchTutors }) => {
    const [showTutorForm, setShowTutorForm] = useState(false);
    const [editingTutor, setEditingTutor] = useState(null);
    const [tutorForm, setTutorForm] = useState({
        name: '',
        subject: '',
        bio: '',
        qualification: '',
        image_url: '',
        languages: '',
    });

    const handleTutorSubmit = async (e) => {
        e.preventDefault();
        const tutorData = {
            ...tutorForm,
            languages: tutorForm.languages.split(',').map(lang => lang.trim()),
        };

        if (editingTutor) {
            const { error } = await api.tutors.update(editingTutor.id, tutorData);
            if (!error) {
                fetchTutors();
                resetTutorForm();
            }
        } else {
            const { error } = await api.tutors.create(tutorData);
            if (!error) {
                fetchTutors();
                resetTutorForm();
            }
        }
    };

    const deleteTutor = async (id) => {
        if (window.confirm('Are you sure you want to delete this tutor?')) {
            const { error } = await api.tutors.delete(id);
            if (!error) fetchTutors();
        }
    };

    const editTutor = (tutor) => {
        setEditingTutor(tutor);
        setTutorForm({
            ...tutor,
            languages: tutor.languages?.join(', ') || '',
        });
        setShowTutorForm(true);
    };

    const resetTutorForm = () => {
        setTutorForm({ name: '', subject: '', bio: '', qualification: '', image_url: '', languages: '' });
        setEditingTutor(null);
        setShowTutorForm(false);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Manage Tutors</h2>
                <Button
                    onClick={() => setShowTutorForm(!showTutorForm)}
                    variant="primary"
                    className="flex items-center"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Tutor
                </Button>
            </div>

            {/* Tutor Form */}
            {showTutorForm && (
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                    <h3 className="text-lg font-semibold mb-4">
                        {editingTutor ? 'Edit Tutor' : 'Add New Tutor'}
                    </h3>
                    <form onSubmit={handleTutorSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <input
                                type="text"
                                required
                                value={tutorForm.name}
                                onChange={(e) => setTutorForm({ ...tutorForm, name: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Subject</label>
                            <input
                                type="text"
                                required
                                value={tutorForm.subject}
                                onChange={(e) => setTutorForm({ ...tutorForm, subject: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Bio</label>
                            <textarea
                                value={tutorForm.bio}
                                onChange={(e) => setTutorForm({ ...tutorForm, bio: e.target.value })}
                                rows={3}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Qualification</label>
                            <input
                                type="text"
                                value={tutorForm.qualification}
                                onChange={(e) => setTutorForm({ ...tutorForm, qualification: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border"
                            />
                        </div>
                        <FileUpload
                            label="Tutor Image"
                            accept="image/*"
                            bucket="tutor-images"
                            currentFileUrl={tutorForm.image_url}
                            onUploadComplete={(url) => setTutorForm({ ...tutorForm, image_url: url })}
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Languages (comma separated)
                            </label>
                            <input
                                type="text"
                                value={tutorForm.languages}
                                onChange={(e) => setTutorForm({ ...tutorForm, languages: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border"
                                placeholder="English, Spanish"
                            />
                        </div>
                        <div className="flex space-x-3">
                            <Button type="submit" variant="primary">
                                {editingTutor ? 'Update' : 'Create'} Tutor
                            </Button>
                            <Button type="button" variant="outline" onClick={resetTutorForm}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Tutors List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {loading ? (
                        <li className="px-6 py-4 text-center text-gray-500">Loading...</li>
                    ) : tutors.length === 0 ? (
                        <li className="px-6 py-4 text-center text-gray-500">No tutors yet. Add one!</li>
                    ) : (
                        tutors.map((tutor) => (
                            <li key={tutor.id} className="px-6 py-4 hover:bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        {tutor.image_url && (
                                            <img
                                                src={tutor.image_url}
                                                alt={tutor.name}
                                                className="h-12 w-12 rounded-full object-cover mr-4"
                                            />
                                        )}
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900">{tutor.name}</h3>
                                            <p className="text-sm text-gray-500">{tutor.subject}</p>
                                            <p className="text-xs text-gray-400">{tutor.qualification}</p>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => editTutor(tutor)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                        >
                                            <Edit2 className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => deleteTutor(tutor.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
};

export default AdminTutorsTab;
