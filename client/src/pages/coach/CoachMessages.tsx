import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Message } from '../../types';
import {
  MessageSquare,
  Send,
  Radio,
  Users,
  User,
  Clock,
  Sparkles,
  CheckCheck
} from 'lucide-react';

export const CoachMessages: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [athletes, setAthletes] = useState<any[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<string>('broadcast');
  const [messageContent, setMessageContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadMessages = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [mRes, aRes] = await Promise.all([
        api.getMessages(user.id),
        api.getCoachAthletes(user.id)
      ]);
      setMessages(mRes.messages || []);
      setAthletes(aRes.athletes || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !messageContent.trim()) return;

    try {
      setSending(true);
      const isBroadcast = selectedRecipient === 'broadcast';
      await api.sendMessage({
        sender_id: user.id,
        receiver_id: isBroadcast ? null : selectedRecipient,
        content: messageContent,
        is_broadcast: isBroadcast
      });
      setMessageContent('');
      loadMessages();
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Filter conversation with selected recipient or broadcast
  const activeConversation = messages.filter(m => {
    if (selectedRecipient === 'broadcast') {
      return m.is_broadcast;
    }
    return (
      (m.sender_id === user?.id && m.receiver_id === selectedRecipient) ||
      (m.sender_id === selectedRecipient && m.receiver_id === user?.id)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-emerald-400" />
          Coach-Athlete Communication & Broadcast Hub
        </h2>
        <p className="text-xs text-slate-400">
          Transmit training instructions, provide 1-on-1 performance feedback, or broadcast squad announcements.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 h-[620px]">
        {/* Recipient Roster Selector */}
        <div className="md:col-span-4 glass-panel rounded-2xl p-4 flex flex-col justify-between overflow-hidden">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
              Conversation Threads
            </span>

            {/* Broadcast Channel Option */}
            <div
              onClick={() => setSelectedRecipient('broadcast')}
              className={`p-3 rounded-xl border cursor-pointer transition mb-2 flex items-center gap-3 ${
                selectedRecipient === 'broadcast'
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-white'
                  : 'bg-slate-900/60 border-white/5 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Squad Announcement</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500 text-black font-extrabold uppercase">
                    ALL
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">Broadcast to all 5 athletes</div>
              </div>
            </div>

            {/* Individual Athletes */}
            <div className="space-y-1.5 overflow-y-auto max-h-[440px] pr-1">
              {athletes.map(ath => {
                const isSelected = selectedRecipient === ath.id;
                return (
                  <div
                    key={ath.id}
                    onClick={() => setSelectedRecipient(ath.id)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center gap-3 ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-white'
                        : 'bg-slate-900/40 border-white/5 text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    <img
                      src={ath.avatar}
                      alt={ath.name}
                      className="w-8 h-8 rounded-full object-cover border border-slate-700"
                    />
                    <div className="truncate flex-1">
                      <div className="text-xs font-bold text-white truncate">{ath.name}</div>
                      <div className="text-[10px] text-slate-400">{ath.sport}</div>
                    </div>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        ath.readiness_status === 'Green'
                          ? 'bg-emerald-400'
                          : ath.readiness_status === 'Yellow'
                          ? 'bg-amber-400'
                          : 'bg-red-400'
                      }`}
                    ></span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Message Thread & Input Box */}
        <div className="md:col-span-8 glass-panel rounded-2xl p-5 flex flex-col justify-between overflow-hidden">
          {/* Thread Header */}
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2.5">
              {selectedRecipient === 'broadcast' ? (
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Radio className="w-4 h-4" />
                </div>
              ) : (
                <img
                  src={athletes.find(a => a.id === selectedRecipient)?.avatar}
                  alt="Recipient"
                  className="w-8 h-8 rounded-full object-cover border border-emerald-400"
                />
              )}
              <div>
                <h4 className="text-sm font-bold text-white">
                  {selectedRecipient === 'broadcast'
                    ? 'Squad Announcement Broadcast'
                    : athletes.find(a => a.id === selectedRecipient)?.name || 'Direct Message'}
                </h4>
                <p className="text-[10px] text-slate-400">
                  {selectedRecipient === 'broadcast'
                    ? 'Transmits instantly to all enrolled athlete dashboards & push feeds'
                    : 'Encrypted 1-on-1 coach-athlete performance channel'}
                </p>
              </div>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto my-4 space-y-3 pr-2">
            {activeConversation.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No messages in this channel yet. Type below to send instructions or notes.
              </div>
            ) : (
              activeConversation.map(msg => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-md p-3 rounded-2xl text-xs leading-relaxed ${
                        isMe
                          ? 'bg-emerald-500 text-black font-medium shadow-md shadow-emerald-500/10 rounded-tr-none'
                          : 'bg-slate-800 text-white border border-white/10 rounded-tl-none'
                      }`}
                    >
                      <div className="text-[9px] font-bold opacity-75 mb-0.5">
                        {isMe ? 'Coach Marcus' : msg.sender_name}
                      </div>
                      <p>{msg.content}</p>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-slate-500 mt-1 px-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isMe && <CheckCheck className="w-3 h-3 text-emerald-400" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Send Input Bar */}
          <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-white/5 pt-3">
            <input
              type="text"
              required
              placeholder={
                selectedRecipient === 'broadcast'
                  ? 'Send team announcement (e.g. Schedule update or hydration reminder)...'
                  : 'Type direct training instruction or feedback...'
              }
              value={messageContent}
              onChange={e => setMessageContent(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-emerald-400"
            />
            <button
              type="submit"
              disabled={sending}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
