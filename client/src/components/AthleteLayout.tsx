import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DemoSwitcher } from './DemoSwitcher';
import {
  LayoutDashboard,
  Activity,
  CheckSquare,
  Brain,
  Trophy,
  Moon,
  FileEdit,
  User,
  LogOut,
  Menu,
  X,
  Bell,
  Sparkles
} from 'lucide-react';

interface AthleteLayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  children: React.ReactNode;
}

export const AthleteLayout: React.FC<AthleteLayoutProps> = ({
  currentTab,
  onSelectTab,
  children,
}) => {
  const { user, logout, notifications, unreadCount, markNotificationAsRead, markAllNotificationsAsRead } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const athleteProfile = user?.profile as any;

  // Strict 8-Item Menu requested by User
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vitals', label: 'Health & Vitals', icon: Activity },
    { id: 'training', label: 'Training', icon: CheckSquare },
    { id: 'performance', label: 'Performance', icon: Brain },
    { id: 'match-stats', label: 'Match Statistics', icon: Trophy },
    { id: 'recovery', label: 'Recovery', icon: Moon },
    { id: 'manual-entry', label: 'Manual Data Entry', icon: FileEdit },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-100 flex flex-col">
      {/* Demo Switcher */}
      <DemoSwitcher />

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0d1017] border-r border-white/10 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } flex flex-col justify-between`}
        >
          <div>
            {/* Logo */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 p-[1.5px]">
                  <div className="w-full h-full bg-[#090b10] rounded-[10px] flex items-center justify-center">
                    <Activity className="w-4 h-4 text-cyan-400" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 font-black text-white text-base tracking-tight">
                    ATHLETE <span className="text-cyan-400">360</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    Competitor Hub
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Athlete Profile Card */}
            <div className="p-4 mx-3 my-3 rounded-xl bg-slate-900/80 border border-cyan-500/20 flex items-center gap-3">
              <img
                src={user?.avatar_url}
                alt={user?.full_name}
                className="w-10 h-10 rounded-full object-cover border border-cyan-400/50 shadow"
              />
              <div className="truncate">
                <div className="text-xs font-bold text-white truncate">{user?.full_name}</div>
                <div className="text-[10px] text-cyan-400 font-semibold flex items-center gap-1">
                  <span>{athleteProfile?.sport || 'Court Athlete'}</span>
                </div>
                <div className="text-[9px] text-slate-400">Coach: Marcus Vance</div>
              </div>
            </div>

            {/* Nav Links */}
            <nav className="px-3 space-y-1 mt-2">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                      isActive
                        ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Logout Option */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={logout}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-red-500/10 hover:border-red-500/30 border border-transparent text-xs font-bold transition"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* MAIN VIEW */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Header */}
          <header className="sticky top-0 z-30 bg-[#0a0c12]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-base sm:text-lg font-black text-white capitalize flex items-center gap-2">
                  <span>{navItems.find(i => i.id === currentTab)?.label || 'Athlete Dashboard'}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      athleteProfile?.current_readiness_status === 'Fit' || athleteProfile?.current_readiness_status === 'Green'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : athleteProfile?.current_readiness_status === 'Needs Recovery' || athleteProfile?.current_readiness_status === 'Yellow'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    Readiness: {athleteProfile?.current_readiness_status || 'Insufficient Data'}
                  </span>
                </h1>
              </div>
            </div>

            {/* Quick Actions & Notifications */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => onSelectTab('manual-entry')}
                className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              >
                <FileEdit className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Manual Data Entry</span>
              </button>

              {/* Notification Popover Toggle */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-lg bg-slate-900 border border-white/10 text-slate-300 hover:text-white hover:border-slate-600 transition"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-400 text-black text-[9px] font-black flex items-center justify-center animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#11141e] border border-white/15 rounded-2xl shadow-2xl p-4 z-50 animate-fadeIn">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                      <div className="flex items-center gap-1.5">
                        <Bell className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-bold text-white">Notifications</span>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllNotificationsAsRead}
                          className="text-[10px] text-cyan-400 hover:underline font-semibold"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-4">No notifications yet.</p>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            onClick={() => markNotificationAsRead(n.id)}
                            className={`p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                              n.is_read
                                ? 'bg-slate-900/50 border-white/5 text-slate-400'
                                : 'bg-slate-800/90 border-cyan-500/30 text-white'
                            }`}
                          >
                            <div className="font-semibold flex items-center justify-between mb-1">
                              <span className="text-cyan-400 text-[11px]">{n.title}</span>
                              <span className="text-[9px] text-slate-500">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-300 leading-snug">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className="flex-1 p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
};
