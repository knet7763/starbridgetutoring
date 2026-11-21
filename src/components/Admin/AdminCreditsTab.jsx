import React, { useState, useEffect } from 'react';
import { Coins, Plus, Minus, Search, RefreshCw, UserCheck, MessageCircle, FileText, Mail, X } from 'lucide-react';
import { api } from '../../services/api';

const AdminCreditsTab = () => {
    const [students, setStudents] = useState([]);
    const [creditsMap, setCreditsMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [busyId, setBusyId] = useState(null);
    const [noteInputs, setNoteInputs] = useState({});
    const [reportStudent, setReportStudent] = useState(null);
    const [reportTopics, setReportTopics] = useState('');
    const [reportHomework, setReportHomework] = useState('');

    const loadData = async () => {
        setLoading(true);
        const [studentsRes, creditsData] = await Promise.all([
            api.students.getAll(),
            api.credits.getAll(),
        ]);
        if (!studentsRes.error) setStudents(studentsRes.data || []);
        setCreditsMap(creditsData || {});
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleAdjust = async (studentId, delta, presetLabel) => {
        setBusyId(studentId);
        try {
            const customNote = noteInputs[studentId]?.trim();
            const noteToSave = customNote || (presetLabel ? `${presetLabel} (${new Date().toLocaleDateString()})` : undefined);
            const { data, error } = await api.credits.adjustForStudent(studentId, delta, noteToSave);
            if (error) throw error;
            setCreditsMap((prev) => ({ ...prev, [studentId]: data }));
            if (customNote) {
                setNoteInputs((prev) => ({ ...prev, [studentId]: '' }));
            }
        } catch (err) {
            alert('Failed to update credits: ' + (err?.message || 'Unknown error'));
        } finally {
            setBusyId(null);
        }
    };

    const handleSendRenewalWhatsApp = (studentObj, balance) => {
        const text = encodeURIComponent(
            `Assalamu Alaikum! Quick update from StarBridge Tutoring:\n\n` +
            `${studentObj.full_name || 'Your child'} currently has ${balance} lesson ${balance === 1 ? 'credit' : 'credits'} remaining.\n\n` +
            `To keep their weekly schedule uninterrupted, please reply whenever you're ready to renew their package (Starter 4 classes, Standard 8 classes, or Premium 12 classes).\n\n` +
            `JazakAllahu Khayran,\nStarBridge Tutoring Team`
        );
        window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
    };

    const openReportModal = (studentObj) => {
        setReportStudent(studentObj);
        setReportTopics('');
        setReportHomework('');
    };

    const buildProgressReportText = () => {
        if (!reportStudent) return '';
        const balance = creditsMap[reportStudent.id]?.balance || 0;
        const stars = reportStudent.stars || 0;
        return (
            `Assalamu Alaikum! Weekly Progress Report from StarBridge Tutoring\n\n` +
            `Student: ${reportStudent.full_name || 'Student'} (${reportStudent.grade_level || 'Enrolled'})\n` +
            `Stars Earned: ${stars} ⭐\n` +
            `Remaining Lesson Credits: ${balance}\n` +
            (reportTopics.trim() ? `\nTopics / Surahs Covered:\n${reportTopics.trim()}\n` : '') +
            (reportHomework.trim() ? `\nNext Practice / Homework:\n${reportHomework.trim()}\n` : '') +
            `\nThank you for trusting StarBridge Tutoring! View full progress anytime at https://starbridgetutors.com/student/dashboard`
        );
    };

    const handleSendReportWhatsApp = () => {
        const text = encodeURIComponent(buildProgressReportText());
        window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
        setReportStudent(null);
    };

    const handleSendReportEmail = () => {
        const recipient = reportStudent?.parent_email || reportStudent?.email || '';
        const subject = encodeURIComponent(`Weekly Progress Report — ${reportStudent?.full_name || 'Student'} (StarBridge Tutoring)`);
        const body = encodeURIComponent(buildProgressReportText());
        window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
        setReportStudent(null);
    };

    const filteredStudents = students.filter((s) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return (
            (s.full_name || '').toLowerCase().includes(q) ||
            (s.email || '').toLowerCase().includes(q) ||
            (s.parent_email || '').toLowerCase().includes(q)
        );
    });

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Student Lesson Credits</h2>
                    <p className="text-sm text-gray-500">
                        Track manual package balances (M-Pesa / Bank Transfer). Credits auto-deduct by 1 when a booking is marked completed.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={loadData}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 self-start"
                >
                    <RefreshCw size={15} />
                    Refresh
                </button>
            </div>

            <div className="relative max-w-md mb-6">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search student by name or email..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-primary focus:ring-primary bg-white"
                />
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading students & credit balances...</div>
            ) : filteredStudents.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-300 py-14 px-6 text-center">
                    <UserCheck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-gray-800 mb-1">No Students Found</h3>
                    <p className="text-sm text-gray-500">
                        Registered student accounts will appear here so you can add paid lesson credits.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredStudents.map((s) => {
                        const creditInfo = creditsMap[s.id] || { balance: 0, note: '' };
                        const isBusy = busyId === s.id;
                        const lowBalance = creditInfo.balance <= 1;

                        return (
                            <div
                                key={s.id}
                                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-base font-bold text-gray-900">{s.full_name || 'Student'}</h3>
                                        <span
                                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                                                lowBalance
                                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                            }`}
                                        >
                                            <Coins size={12} />
                                            {creditInfo.balance} {creditInfo.balance === 1 ? 'credit' : 'credits'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        {s.grade_level || 'Grade not set'} • {s.email || s.parent_email || 'No email'}
                                    </p>
                                    {creditInfo.note && (
                                        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-2.5 py-1 inline-block">
                                            Last note: {creditInfo.note}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                                    <input
                                        type="text"
                                        value={noteInputs[s.id] || ''}
                                        onChange={(e) => setNoteInputs((prev) => ({ ...prev, [s.id]: e.target.value }))}
                                        placeholder="Payment note (optional)"
                                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs w-full sm:w-44 focus:border-primary focus:ring-primary"
                                    />
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <button
                                            type="button"
                                            disabled={isBusy || creditInfo.balance <= 0}
                                            onClick={() => handleAdjust(s.id, -1, 'Manual deduction')}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold disabled:opacity-40"
                                        >
                                            <Minus size={12} />1
                                        </button>
                                        <button
                                            type="button"
                                            disabled={isBusy}
                                            onClick={() => handleAdjust(s.id, 1, 'Added +1 class')}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold disabled:opacity-40"
                                        >
                                            <Plus size={12} />1
                                        </button>
                                        <button
                                            type="button"
                                            disabled={isBusy}
                                            onClick={() => handleAdjust(s.id, 4, 'Starter Package (+4)')}
                                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold disabled:opacity-40"
                                        >
                                            +4 Starter
                                        </button>
                                        <button
                                            type="button"
                                            disabled={isBusy}
                                            onClick={() => handleAdjust(s.id, 8, 'Standard Package (+8)')}
                                            className="px-2.5 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 text-gray-900 text-xs font-bold disabled:opacity-40"
                                        >
                                            +8 Standard
                                        </button>
                                        <button
                                            type="button"
                                            disabled={isBusy}
                                            onClick={() => handleAdjust(s.id, 12, 'Premium Package (+12)')}
                                            className="px-2.5 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold disabled:opacity-40"
                                        >
                                            +12 Premium
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => openReportModal(s)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold"
                                            title="Send weekly parent progress report"
                                        >
                                            <FileText size={12} />
                                            Parent Report
                                        </button>
                                        {lowBalance && (
                                            <button
                                                type="button"
                                                onClick={() => handleSendRenewalWhatsApp(s, creditInfo.balance)}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold"
                                                title="Send low-credit renewal reminder via WhatsApp"
                                            >
                                                <MessageCircle size={12} />
                                                Renewal Alert
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {reportStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
                        <button
                            type="button"
                            onClick={() => setReportStudent(null)}
                            className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full"
                        >
                            <X size={18} />
                        </button>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                            Weekly Parent Progress Report
                        </h3>
                        <p className="text-xs text-gray-500 mb-4">
                            For <strong>{reportStudent.full_name}</strong> • {creditsMap[reportStudent.id]?.balance || 0} credits remaining • {reportStudent.stars || 0} stars earned
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Topics / Surahs Covered This Week
                                </label>
                                <textarea
                                    rows={3}
                                    value={reportTopics}
                                    onChange={(e) => setReportTopics(e.target.value)}
                                    placeholder="e.g., Completed Surah Al-Mulk Ayahs 1-10 with strong Tajweed pronunciation; practiced Algebra linear equations."
                                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-primary focus:ring-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Next Practice / Homework (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={reportHomework}
                                    onChange={(e) => setReportHomework(e.target.value)}
                                    placeholder="e.g., Revise Ayahs 1-10 daily for 10 minutes before Thursday's class."
                                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-primary focus:ring-primary"
                                />
                            </div>
                            <div className="flex flex-wrap justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={handleSendReportEmail}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700"
                                >
                                    <Mail size={14} />
                                    Send via Email
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSendReportWhatsApp}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white"
                                >
                                    <MessageCircle size={14} />
                                    Send via WhatsApp
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCreditsTab;
