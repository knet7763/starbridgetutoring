import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageSquare, User } from 'lucide-react';

const ChatPanel = ({ messages, onSendMessage, onClose }) => {
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef(null);

    // Auto-scroll to the bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;
        onSendMessage(inputText);
        setInputText('');
    };

    const formatTime = (timestamp) => {
        try {
            return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '';
        }
    };

    return (
        <div className="w-[360px] border-l border-white/5 bg-gray-950/95 backdrop-blur-xl shrink-0 flex flex-col h-full z-50">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <MessageSquare size={18} className="text-primary" />
                    <span className="font-black text-sm uppercase tracking-widest text-white">Classroom Chat</span>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-white/5 text-gray-400 hover:text-white rounded-lg transition-colors"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
                        <MessageSquare size={48} className="text-gray-700 mb-3" />
                        <h4 className="text-sm font-bold text-gray-400">Classroom chat is empty</h4>
                        <p className="text-xs text-gray-600 mt-1 max-w-[200px]">Send a message to share links, spelling, or coordinates!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isSelf = msg.isLocal;
                        return (
                            <div
                                key={msg.id}
                                className={`flex flex-col max-w-[85%] ${isSelf ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                            >
                                <span className="text-[10px] font-bold text-gray-500 mb-1">
                                    {isSelf ? 'You' : msg.senderName}
                                </span>
                                <div
                                    className={`px-4 py-2.5 rounded-2xl text-sm font-medium shadow-md ${
                                        isSelf
                                            ? 'bg-primary text-gray-950 rounded-tr-none font-semibold'
                                            : 'bg-gray-900 text-white rounded-tl-none border border-white/5'
                                    }`}
                                >
                                    <p className="break-words leading-relaxed">{msg.text}</p>
                                </div>
                                <span className="text-[9px] text-gray-600 mt-1">
                                    {formatTime(msg.timestamp)}
                                </span>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-white/5 bg-gray-950/80">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Send message to class..."
                        className="w-full bg-gray-900 text-white text-sm pl-4 pr-12 py-3.5 rounded-2xl border border-white/5 focus:border-primary/50 focus:outline-none placeholder-gray-500 transition-colors shadow-inner"
                    />
                    <button
                        type="submit"
                        disabled={!inputText.trim()}
                        className="absolute right-2 p-2 bg-primary hover:bg-yellow-600 disabled:opacity-30 text-gray-900 disabled:text-gray-900 rounded-xl transition-all active:scale-95 disabled:scale-100 flex items-center justify-center shadow-lg"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatPanel;
