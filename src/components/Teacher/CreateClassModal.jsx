import React, { useState } from 'react';
import { X, Users, Plus, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const generateJoinCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

const CreateClassModal = ({ onClose, onCreated }) => {
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!name.trim()) { setError('Class name is required.'); return; }
        setSaving(true);
        setError('');
        try {
            const { data, error: err } = await api.classes.create({ 
                name: name.trim(), 
                teacher_id: user.id, 
                join_code: generateJoinCode() 
            });
            if (err) throw err;
            onCreated(data);
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to create class.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full text-gray-400">
                    <X size={20} />
                </button>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                        <Users size={24} className="text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Create New Class</h2>
                        <p className="text-sm text-gray-500">Students join with a unique code.</p>
                    </div>
                </div>
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Class Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-200 focus:border-primary outline-none text-lg"
                            placeholder="e.g., Math Grade 7 — Period 2"
                            autoFocus
                        />
                        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                    </div>
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-bold text-lg hover:bg-yellow-600 transition-all disabled:opacity-60"
                        style={{ borderBottom: '3px solid #CA8A04' }}
                    >
                        {saving ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                        {saving ? 'Creating...' : 'Create Class'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateClassModal;
