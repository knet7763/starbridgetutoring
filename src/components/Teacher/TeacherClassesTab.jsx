import React from 'react';
import { Users, Trash2, Plus } from 'lucide-react';
import { api } from '../../services/api';

const TeacherClassesTab = ({ classes, setClasses, setShowCreateClassModal }) => {
    const handleDeleteClass = async (classId) => {
        if (!window.confirm('Delete this class?')) return;
        await api.classes.delete(classId);
        setClasses(prev => prev.filter(c => c.id !== classId));
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
                <div key={cls.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-gray-900 truncate pr-4">{cls.name}</h3>
                        <button
                            onClick={() => handleDeleteClass(cls.id)}
                            className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center justify-between mt-4">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Join Code</span>
                        <span className="text-2xl font-black text-primary tracking-widest font-mono">{cls.join_code}</span>
                    </div>
                </div>
            ))}

            <button
                onClick={() => setShowCreateClassModal(true)}
                className="bg-white rounded-2xl border-2 border-dashed border-gray-200 hover:border-primary hover:bg-yellow-50/50 flex flex-col items-center justify-center gap-4 p-8 transition-all group min-h-[160px]"
            >
                <div className="w-14 h-14 bg-gray-100 group-hover:bg-yellow-100 rounded-2xl flex items-center justify-center transition-colors">
                    <Plus size={28} className="text-gray-400 group-hover:text-primary transition-colors" />
                </div>
                <span className="text-gray-500 group-hover:text-primary font-semibold transition-colors">New Class</span>
            </button>

            {classes.length === 0 && (
                <div className="col-span-full py-16 text-center">
                    <Users size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-700 mb-1">No Classes Yet</h3>
                    <p className="text-gray-400">Create a class to generate a join code for your students.</p>
                </div>
            )}
        </div>
    );
};

export default TeacherClassesTab;
