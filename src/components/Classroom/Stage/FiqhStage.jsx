import React from 'react';
import { HelpCircle, CheckCircle2, AlertCircle } from 'lucide-react';

const FiqhStage = ({ currentSlide }) => {
    const { topic, scenario, rulings, principle } = currentSlide.content || {};

    return (
        <div className="w-full h-full flex flex-col bg-slate-50 overflow-y-auto p-6 sm:p-12">
            <div className="max-w-4xl mx-auto w-full space-y-8">
                {/* Header */}
                <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl">
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] mb-2 opacity-80 text-indigo-100">Fiqh & Jurisprudence</h2>
                    <h1 className="text-4xl font-black">{topic || 'Subject Topic'}</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Scenario */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                            <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900 mb-4">
                                <HelpCircle className="text-indigo-500" /> Case Study / Scenario
                            </h3>
                            <p className="text-lg text-slate-600 leading-relaxed font-medium">
                                {scenario || 'Enter a real-life scenario to discuss the Islamic ruling.'}
                            </p>
                        </div>

                        {/* Rulings */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-slate-900 px-2">Key Rulings</h3>
                            {(rulings || ['Step 1', 'Step 2']).map((rule, i) => (
                                <div key={i} className="flex items-start gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold shrink-0">
                                        {i + 1}
                                    </div>
                                    <p className="text-slate-700 font-bold text-lg">{rule}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Principle Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-yellow-50 rounded-[2rem] p-8 border-2 border-yellow-100 sticky top-0">
                            <div className="flex items-center gap-2 text-yellow-700 font-black text-sm uppercase mb-4">
                                <AlertCircle size={18} /> Core Principle
                            </div>
                            <p className="text-yellow-900 font-bold text-xl leading-snug">
                                {principle || 'The general rule is that things are permissible unless proven otherwise.'}
                            </p>
                            <div className="mt-8 pt-8 border-t border-yellow-200">
                                <CheckCircle2 className="text-yellow-600 mb-2" />
                                <p className="text-yellow-800 text-sm font-medium">Apply this principle to similar cases in daily life.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FiqhStage;
