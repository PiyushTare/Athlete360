import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, User, ArrowRightLeft, Sparkles } from 'lucide-react';

export const DemoSwitcher: React.FC = () => {
  const { user, demoUsers, quickDemoLogin } = useAuth();

  if (!user) return null;

  return (
    <div className="bg-[#0b0e17] border-b border-emerald-500/20 px-4 py-1.5 flex flex-wrap items-center justify-between text-xs text-slate-300">
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="font-semibold text-emerald-400 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" />
          Interactive Demo Switcher:
        </span>
        <span className="text-slate-400 hidden sm:inline">Active session:</span>
        <span className="text-white font-medium bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 flex items-center gap-1.5">
          {user.role === 'coach' ? (
            <Shield className="w-3 h-3 text-emerald-400" />
          ) : (
            <User className="w-3 h-3 text-cyan-400" />
          )}
          {user.full_name} ({user.role.toUpperCase()})
        </span>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto py-1 sm:py-0">
        <span className="text-slate-400 text-[11px] hidden md:inline flex items-center gap-1">
          <ArrowRightLeft className="w-3 h-3" /> Quick Switch:
        </span>
        {demoUsers.map(u => (
          <button
            key={u.id}
            onClick={() => quickDemoLogin(u.id)}
            className={`px-2 py-0.5 rounded transition text-[11px] font-medium flex items-center gap-1 ${
              u.id === user.id
                ? 'bg-emerald-500 text-black font-semibold shadow-sm'
                : 'bg-slate-800/60 hover:bg-slate-700 text-slate-300 border border-slate-700/50'
            }`}
          >
            {u.role === 'coach' ? '🛡️' : '🏃'}
            <span>{u.full_name.split(' ')[0]}</span>
            <span className="opacity-70 text-[9px]">({u.role === 'coach' ? 'Coach' : (u.profile as any)?.sport?.split(' ')[0] || 'Ath'})</span>
          </button>
        ))}
      </div>
    </div>
  );
};
