import React, { useState, useEffect, useRef } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Send, X, MessageSquare, User, Shield, Truck } from 'lucide-react';

const ChatModal = ({ booking, isOpen, onClose }) => {
  const { user } = useAuth();
  const { socket, isConnected, joinBookingChat, leaveBookingChat } = useSocket();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!isOpen || !booking?._id) return;

    joinBookingChat(booking._id);

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const res = await client.get(`/chat/${booking._id}`);
        if (res.data.success) {
          setMessages(res.data.data.messages);
        }
      } catch (err) {
        console.error('Failed to load chat:', err);
      } finally {
        setLoading(false);
        scrollToBottom();
      }
    };

    fetchMessages();

    return () => {
      leaveBookingChat(booking._id);
    };
  }, [isOpen, booking?._id]);

  useEffect(() => {
    if (!socket || !isOpen) return;

    const handleNewMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
      scrollToBottom();
    };

    socket.on('new_chat_message', handleNewMessage);

    return () => {
      socket.off('new_chat_message', handleNewMessage);
    };
  }, [socket, isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    setInputText('');

    try {
      await client.post(`/chat/${booking._id}/message`, {
        text: textToSend
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  if (!isOpen) return null;

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return (
          <span className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded font-bold flex items-center space-x-1">
            <Shield className="w-3 h-3" />
            <span>Admin Support</span>
          </span>
        );
      case 'rider':
        return (
          <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded font-bold flex items-center space-x-1">
            <Truck className="w-3 h-3" />
            <span>Tractor Rider</span>
          </span>
        );
      default:
        return (
          <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded font-bold flex items-center space-x-1">
            <User className="w-3 h-3" />
            <span>Farmer</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg flex flex-col h-[560px] overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-samba-900 text-white flex justify-between items-center shadow-md">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-samba-800 rounded-xl text-harvest-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm tracking-wide">Farm Dispatch Chat</h3>
                <span className="text-[11px] bg-samba-800 px-2 py-0.5 rounded font-mono text-samba-200">
                  #{booking?.bookingNumber}
                </span>
              </div>
              <p className="text-[11px] text-samba-300">
                {user?.role === 'farmer'
                  ? `Rider: ${booking?.assignedRider?.name || 'Awaiting assignment'}`
                  : `Farmer: ${booking?.farmerName}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-samba-300 hover:text-white hover:bg-samba-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
          {loading ? (
            <div className="flex justify-center items-center h-full text-xs text-slate-400">
              Loading chat messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400">
              <MessageSquare className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-600">No messages yet</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Say hello, provide directions, or confirm farm arrival details!
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.sender?._id === user?._id || m.sender === user?._id;
              const senderRole = m.senderRole || m.sender?.role || 'farmer';
              const senderName = m.sender?.name || (isMe ? 'You' : 'User');

              return (
                <div
                  key={m._id || Math.random()}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center space-x-1.5 mb-1">
                    <span className="text-[11px] font-bold text-slate-600">
                      {isMe ? 'You' : senderName}
                    </span>
                    {getRoleBadge(senderRole)}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs shadow-sm ${
                      isMe
                        ? 'bg-samba-600 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                    <span
                      className={`block text-[9px] mt-1 ${
                        isMe ? 'text-samba-200 text-right' : 'text-slate-400'
                      }`}
                    >
                      {new Date(m.createdAt || Date.now()).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Field */}
        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message or directions to farm..."
            className="flex-1 text-xs sm:text-sm p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-samba-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-3 bg-samba-600 hover:bg-samba-700 disabled:opacity-40 text-white rounded-xl shadow-md transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatModal;
