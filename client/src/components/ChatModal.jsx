import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { MessageSquare, Send, X, User, Shield } from 'lucide-react';

export const ChatModal = ({ isOpen, onClose, bookingId, recipientName }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { socket, joinBookingRoom } = useSocket();
  const { user } = useAuth();
  const { language } = useLanguage();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    if (!bookingId) return;
    try {
      setLoading(true);
      const res = await api.getChatMessages(bookingId);
      if (res.success) {
        setMessages(res.data);
      }
    } catch (err) {
      console.warn('Failed to load chat messages:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && bookingId) {
      loadMessages();
      joinBookingRoom(bookingId);
    }
  }, [isOpen, bookingId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on('new_message', handleNewMessage);
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !bookingId) return;

    try {
      const msgText = inputMessage;
      setInputMessage('');
      const res = await api.sendChatMessage(bookingId, msgText);
      if (res.success) {
        // Appended or received via socket
      }
    } catch (err) {
      console.error('Send error:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl flex flex-col h-[520px] overflow-hidden border border-emerald-100">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-emerald-800 to-green-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">
                {recipientName ? `Chat with ${recipientName}` : 'Booking Live Chat'}
              </h3>
              <p className="text-[11px] text-emerald-200">
                {language === 'te'
                  ? 'రైతు, డ్రైవర్ & అడ్మిన్ ప్రత్యక్ష సంభాషణ'
                  : language === 'hi'
                  ? 'किसान, ड्राइवर एवं एडमिन लाइव चैट'
                  : 'Farmer, Rider & Admin Live Discussion'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-emerald-200 hover:text-white hover:bg-emerald-700/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message history */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {loading ? (
            <div className="text-center py-10 text-xs text-gray-500">Loading chat...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-xs">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30 text-emerald-600" />
              <span>
                {language === 'te'
                  ? 'ఇంకా సంభాషణ ప్రారంభం కాలేదు. హలో చెప్పండి!'
                  : language === 'hi'
                  ? 'अभी कोई संदेश नहीं है। नमस्ते कहें!'
                  : 'No messages yet. Say hello to coordinate farm arrival!'}
              </span>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.sender === user?._id;
              return (
                <div
                  key={m._id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-0.5">
                    <span className="font-bold text-gray-600">{m.senderName}</span>
                    <span className="uppercase text-[9px] px-1 py-0.2 rounded bg-gray-200 text-gray-700 font-mono">
                      {m.senderRole}
                    </span>
                  </div>
                  <div
                    className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      isMe
                        ? 'bg-emerald-600 text-white rounded-br-none'
                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                    }`}
                  >
                    {m.message}
                  </div>
                  <span className="text-[9px] text-gray-400 mt-0.5">
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              language === 'te'
                ? 'సందేశాన్ని టైప్ చేయండి...'
                : language === 'hi'
                ? 'संदेश लिखें...'
                : 'Type instructions or directions...'
            }
            className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white p-2.5 rounded-xl shadow transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatModal;
