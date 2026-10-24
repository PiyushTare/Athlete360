import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Settings,
  Shield,
  RotateCcw,
  CheckCircle2,
  Bell,
  Lock,
  Moon,
  Database,
  Sliders,
  Sparkles
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [vitalsReminders, setVitalsReminders] = useState(true);

  const handleResetData = async () => {
    if (!confirm('Reset demo database to fresh initial state? This resets all 18 tables back to sample demo data.')) return;
    try {
      setResetting(true);
      const res = await api.resetDemoData();
      setResetMessage(res.message || 'Demo data has been reset successfully.');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      alert(err.message || 'Failed to reset demo data');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-400" />
          Platform & Account Settings
        </h2>
        <p className="text-xs text-slate-400">
          Manage system preferences, role-based authorization parameters, and database sandbox state.
        </p>
      </div>

      {/* Account Info */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          Active Account & Security Role
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">User Role</span>
            <div className="text-sm font-bold text-white capitalize">{user?.role}</div>
            <div className="text-[11px] text-emerald-400 font-medium">Role-Based Access Control Active</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Authenticated Email</span>
            <div className="text-sm font-bold text-white truncate">{user?.email}</div>
            <div className="text-[11px] text-slate-400">Password protected (demo123 / athlete360)</div>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Bell className="w-4 h-4 text-cyan-400" />
          Push Telemetry & Notification Preferences
        </h3>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-white/5">
            <div>
              <div className="font-semibold text-white">Daily Morning Vitals Reminder</div>
              <p className="text-[11px] text-slate-400">Prompt athlete to log Resting HR and SpO2 before 9:00 AM</p>
            </div>
            <input
              type="checkbox"
              checked={vitalsReminders}
              onChange={e => setVitalsReminders(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-500 bg-slate-800 border-slate-700"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-white/5">
            <div>
              <div className="font-semibold text-white">Task Completion & Coach Review Alerts</div>
              <p className="text-[11px] text-slate-400">Receive instant push notification when coach leaves feedback or rating</p>
            </div>
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={e => setNotificationsEnabled(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-500 bg-slate-800 border-slate-700"
            />
          </div>
        </div>
      </div>

      {/* Database Sandbox Management */}
      <div className="glass-panel p-6 rounded-2xl border-red-500/20 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-400" />
              Demo Database Sandbox Management
            </h3>
            <p className="text-xs text-slate-400">
              Reset all tasks, completions, readiness logs, and messages back to the initial 1-coach + 5-athlete pristine demo state.
            </p>
          </div>
        </div>

        {resetMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{resetMessage}</span>
          </div>
        )}

        <button
          onClick={handleResetData}
          disabled={resetting}
          className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-xs flex items-center gap-2 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{resetting ? 'Resetting Database...' : 'Reset Demo Database to Initial State'}</span>
        </button>
      </div>
    </div>
  );
};
