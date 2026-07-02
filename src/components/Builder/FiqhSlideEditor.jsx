import React from 'react';
import { HelpCircle, AlertCircle, Plus, Trash2, Scale } from 'lucide-react';

const FiqhSlideEditor = ({ slide, updateSlideContent }) => {
    const { 
        topic = '', 
        scenario = '', 
        rulings = ['', ''], 
        principle = '' 
    } = slide?.content || {};

    const handleFieldChange = (name, value) => {
        updateSlideContent({ [name]: value });
    };

    const handleRulingChange = (index, value) => {
        const newRulings = [...rulings];
        newRulings[index] = value;
        updateSlideContent({ rulings: newRulings });
    };

    const addRuling = () => {
        updateSlideContent({ rulings: [...rulings, ''] });
    };

    const removeRuling = (index) => {
        if (rulings.length <= 1) return;
        const newRulings = rulings.filter((_, i) => i !== index);
        updateSlideContent({ rulings: newRulings });
    };

    return (
        <div className="p-8 max-w-2xl mx-auto h-full flex flex-col justify-center overflow-y-auto">
            <div className="bg-slate-50 rounded-3xl p-10 border-2 border-slate-200 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-4 bg-slate-700 text-white rounded-2xl">
                        <Scale size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900">Fiqh Jurisprudence Slide</h2>
                        <p className="text-slate-500 font-medium">Create a Fiqh case study, key rulings, and core Islamic principles.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Topic</label>
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => handleFieldChange('topic', e.target.value)}
                            placeholder="e.g. Permissibility of seafood, Rules of travel prayers"
                            className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-slate-100 focus:border-slate-500 outline-none font-bold text-gray-800"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Case Study / Scenario</label>
                        <textarea
                            value={scenario}
                            onChange={(e) => handleFieldChange('scenario', e.target.value)}
                            placeholder="Describe a real-life scenario or question..."
                            rows={3}
                            className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-slate-100 focus:border-slate-500 outline-none font-medium text-gray-800"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Key Rulings</label>
                            <button
                                type="button"
                                onClick={addRuling}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                            >
                                <Plus size={14} /> Add Ruling Point
                            </button>
                        </div>
                        <div className="space-y-3">
                            {rulings.map((ruling, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold shrink-0 mt-3 text-sm">
                                        {idx + 1}
                                    </div>
                                    <input
                                        type="text"
                                        value={ruling}
                                        onChange={(e) => handleRulingChange(idx, e.target.value)}
                                        placeholder={`Ruling point ${idx + 1}...`}
                                        className="flex-grow p-4 bg-white border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-slate-100 focus:border-slate-500 outline-none font-bold text-gray-800 text-base"
                                    />
                                    {rulings.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeRuling(idx)}
                                            className="p-3 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl mt-1"
                                            title="Delete ruling point"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider font-semibold">Core Principle</label>
                        <textarea
                            value={principle}
                            onChange={(e) => handleFieldChange('principle', e.target.value)}
                            placeholder="State the underlying general Fiqh principle..."
                            rows={2}
                            className="w-full p-4 bg-yellow-50/50 border-2 border-yellow-200 rounded-xl focus:ring-4 focus:ring-yellow-100 focus:border-yellow-500 outline-none font-bold text-yellow-900 placeholder-yellow-600/40"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FiqhSlideEditor;
