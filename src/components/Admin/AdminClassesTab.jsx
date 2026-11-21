import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Copy, CheckCheck, RefreshCw, Share2, Users, X, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../Button';

const generateJoinCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

const AdminClassesTab = ({ classes, tutors, loading, fetchClasses }) => {
    const { user } = useAuth();
    const [showForm, setShowForm] = useState(false);
    const [editingClass, setEditingClass] = useState(null);
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [copiedId, setCopiedId] = useState(null);
    const [form, setForm] = useState({
        name: '',
        teacher_id: '',
        join_code: generateJoinCode(),
    });

    const resetForm = () => {
        setForm({
            name: '',
            teacher_id: user?.id || tutors[0]?.id || '',
            join_code: generateJoinCode(),
        });
        setEditingClass(null);
        setErrorMsg('');
        setShowForm(false);
    };

    const openCreateForm = () => {
        setEditingClass(null);
        setErrorMsg('');
        setForm({
            name: '',
            teacher_id: user?.id || tutors[0]?.id || '',
            join_code: generateJoinCode(),
        });
        setShowForm(true);
    };

    const openEditForm = (cls) => {
        setEditingClass(cls);
        setErrorMsg('');
        setForm({
            name: cls.name || '',
            teacher_id: cls.teacher_id || user?.id || '',
            join_code: cls.join_code || generateJoinCode(),
        });
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        const trimmedName = form.name.trim();
        const trimmedCode = form.join_code.trim().toUpperCase();

        if (!trimmedName) {
            setErrorMsg('Please enter a class name.');
            return;
        }
        if (!trimmedCode || trimmedCode.length < 4) {
            setErrorMsg('Join code must be at least 4 characters.');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                name: trimmedName,
                teacher_id: form.teacher_id || user?.id,
                join_code: trimmedCode,
            };

            if (editingClass) {
                const { error } = await api.classes.update(editingClass.id, payload);
                if (error) throw error;
            } else {
                const { error } = await api.classes.create(payload);
                if (error) throw error;
            }

            await fetchClasses();
            resetForm();
        } catch (err) {
            console.error('[AdminClassesTab] Save class error:', err);
            setErrorMsg(err?.message || 'Failed to save class. Check that the join code is unique.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (cls) => {
        if (!window.confirm(`Remove class "${cls.name}" (Code: ${cls.join_code})? This cannot be undone.`)) {
            return;
        }
        setErrorMsg('');
        const { error } = await api.classes.delete(cls.id);
        if (error) {
            console.error('[AdminClassesTab] Delete class error:', error);
            setErrorMsg(`Failed to remove class: ${error.message}`);
            return;
        }
        await fetchClasses();
    };

    const handleCopyCode = (cls) => {
        navigator.clipboard.writeText(cls.join_code);
        setCopiedId(cls.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleShareWhatsApp = (cls) => {
        const joinUrl = `${window.location.origin}/join?code=${cls.join_code}`;
        const msg = encodeURIComponent(
            `Assalamu Alaikum! Join our StarBridge Tutoring class "${cls.name}" using code ${cls.join_code} or click here: ${joinUrl}`
        );
        window.open(`https://wa.me/?text=${msg}`, '_blank', 'noopener,noreferrer');
    };

    const getTutorName = (teacherId) => {
        const match = tutors.find((t) => t.id === teacherId);
        if (match) return `${match.name}${match.subject ? ` (${match.subject})` : ''}`;
        if (teacherId && teacherId === user?.id) return `${user.email} (Admin)`;
        return 'Unassigned / Staff';
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Manage Classes</h2>
                    <p className="text-sm text-gray-500">
                        Create classes, assign tutors, regenerate join codes, or remove classes directly from the Admin Dashboard.
                    </p>
                </div>
                <Button variant="primary" onClick={openCreateForm} className="inline-flex items-center gap-2 self-start">
                    <Plus size={18} />
                    Add New Class
                </Button>
            </div>

            {errorMsg && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                </div>
            )}

            {showForm && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900">
                            {editingClass ? `Edit Class: ${editingClass.name}` : 'Create New Class'}
                        </h3>
                        <button
                            type="button"
                            onClick={resetForm}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        >
                            <X size={18} />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Class Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g., Quran Tajweed Level 1"
                                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-primary focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Assigned Tutor
                            </label>
                            <select
                                value={form.teacher_id}
                                onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-primary focus:ring-primary bg-white"
                            >
                                {tutors.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name} {t.subject ? `— ${t.subject}` : ''}
                                    </option>
                                ))}
                                {!tutors.some((t) => t.id === user?.id) && user?.id && (
                                    <option value={user.id}>{user.email} (Admin)</option>
                                )}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Join Code *
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    required
                                    maxLength={10}
                                    value={form.join_code}
                                    onChange={(e) => setForm({ ...form, join_code: e.target.value.toUpperCase() })}
                                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm font-mono font-bold tracking-widest uppercase focus:border-primary focus:ring-primary"
                                />
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, join_code: generateJoinCode() })}
                                    title="Generate new code"
                                    className="px-3 rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-600"
                                >
                                    <RefreshCw size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="md:col-span-3 flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <Button type="submit" variant="primary" disabled={saving}>
                                {saving ? 'Saving...' : editingClass ? 'Save Changes' : 'Create Class'}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading classes...</div>
            ) : classes.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-300 py-16 px-6 text-center">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-gray-800 mb-1">No Classes Created Yet</h3>
                    <p className="text-sm text-gray-500 mb-6">
                        Click &ldquo;Add New Class&rdquo; above to create your first class group and generate a student join code.
                    </p>
                    <Button variant="primary" onClick={openCreateForm}>
                        Add First Class
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes.map((cls) => (
                        <div
                            key={cls.id}
                            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <h3 className="text-lg font-bold text-gray-900 leading-snug">{cls.name}</h3>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => openEditForm(cls)}
                                            title="Edit or reassign tutor"
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-yellow-50 transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(cls)}
                                            title="Remove class"
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs font-medium text-gray-500 mb-4">
                                    Tutor: <span className="text-gray-800 font-semibold">{getTutorName(cls.teacher_id)}</span>
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 flex items-center justify-between">
                                    <div>
                                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                            Join Code
                                        </span>
                                        <span className="text-xl font-black text-primary tracking-widest font-mono">
                                            {cls.join_code}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleCopyCode(cls)}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-primary text-xs font-bold text-gray-700 hover:text-primary transition-colors"
                                    >
                                        {copiedId === cls.id ? <CheckCheck size={14} className="text-green-600" /> : <Copy size={14} />}
                                        {copiedId === cls.id ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleShareWhatsApp(cls)}
                                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors"
                                >
                                    <Share2 size={14} />
                                    Share Class Code via WhatsApp
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminClassesTab;
