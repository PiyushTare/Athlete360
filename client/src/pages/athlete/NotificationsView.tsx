import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Bell,
  CheckCircle2,
  Calendar,
  Award,
  Activity,
  MessageSquare,
  Clock,
  Filter,
  Trash2
} from 'lucide-react';

interface NotificationsViewProps {
  onNavigate?: (tab: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ onNavigate }) => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useAuth();
  const [filterType, setFilterType] = useState<string>('all');

  const filteredNotifs = notifications.filter(n => {
    if (filterType === 'all') return true;
    if (filterType === 'unread') return !n.is_read;
    return n.type === filterType;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'tournament':
        return <Calendar className="w-4 h-4 text-amber-400" />;
      case 'readiness':
        return <Activity className="w-4 h-4 text-red-400" />;
      case 'achievement':
        return <Award className="w-4 h-4 text-purple-400" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-cyan-400" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-cyan-400" />
            Performance Notifications & Alerts
          </h2>
          <p className="text-xs text-slate-400">
            Real-time feed for task reviews, tournament bracket updates, readiness warnings, and achievements.
          </p>
        </div>

        <button
          onClick={markAllNotificationsAsRead}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-white/10 transition"
        >
          Mark All as Read
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex p-1 bg-slate-900 rounded-xl border border-white/5 text-xs font-semibold overflow-x-auto">
        {(['all', 'unread', 'task', 'tournament', 'readiness', 'achievement', 'message'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilterType(tab)}
            className={`px-3.5 py-1.5 rounded-lg transition capitalize whitespace-nowrap ${
              filterType === tab ? 'bg-cyan-500 text-black font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="glass-panel p-6 rounded-2xl space-y-3">
        {filteredNotifs.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">No notifications found in this category.</div>
        ) : (
          <div className="divide-y divide-white/5 space-y-2">
            {filteredNotifs.map(n => (
              <div
                key={n.id}
                onClick={() => markNotificationAsRead(n.id)}
                className={`pt-3 p-3 rounded-xl transition cursor-pointer flex items-start justify-between gap-4 ${
                  n.is_read
                    ? 'hover:bg-white/[0.02] text-slate-400'
                    : 'bg-slate-900/90 border border-cyan-500/20 text-white shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                    {getIcon(n.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{n.title}</span>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block"></span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{n.message}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(n.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {!n.is_read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markNotificationAsRead(n.id);
                    }}
                    className="text-[10px] text-cyan-400 hover:underline shrink-0 font-semibold"
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
