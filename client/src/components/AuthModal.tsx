import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Shield, User, ArrowRight, Sparkles, CheckCircle2, Lock, Mail, Phone, Trophy } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: 'coach' | 'athlete';
  defaultTab?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'coach',
  defaultTab = 'login',
}) => {
  const { login, register, quickDemoLogin, demoUsers } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab);
  const [selectedRole, setSelectedRole] = useState<'coach' | 'athlete'>(defaultRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('athlete360');
  const [fullName, setFullName] = useState('');
  const [sport, setSport] = useState('Court Athletics');
  const [position, setPosition] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForgotPwd, setShowForgotPwd] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (tab === 'login') {
        await login({ email, password, role: selectedRole });
        onClose();
      } else {
        await register({
          email,
          password,
          role: selectedRole,
          full_name: fullName,
          sport,
          position,
          phone,
        });
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = async (userId: string) => {
    setError(null);
    setLoading(true);
    try {
      await quickDemoLogin(userId);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to switch demo account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#0f121a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#141824]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <span className="font-black text-emerald-400 text-sm tracking-wider">360</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-wide">
                {selectedRole === 'coach' ? 'Coach Command Center' : 'Athlete Performance Portal'}
              </h3>
              <p className="text-xs text-slate-400">
                {tab === 'login' ? 'Access your high performance workspace' : 'Create your athlete or coach account'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Toggle Selector */}
        <div className="px-6 pt-4 pb-2">
          <div className="grid grid-cols-2 p-1 bg-black/40 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => {
                setSelectedRole('coach');
                if (tab === 'login') setEmail('coach.marcus@athlete360.com');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition ${
                selectedRole === 'coach'
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4" />
              Coach Portal
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedRole('athlete');
                if (tab === 'login') setEmail('alex.chen@athlete360.com');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition ${
                selectedRole === 'athlete'
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              Athlete Portal
            </button>
          </div>
        </div>

        {/* Quick Demo Access Bar */}
        <div className="px-6 py-2">
          <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> 1-Click Instant Demo Login:
              </span>
              <span className="text-[10px] text-slate-400">Click any card to load</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {demoUsers
                .filter(u => u.role === selectedRole)
                .map(u => (
                  <button
                    key={u.id}
                    onClick={() => handleDemoSelect(u.id)}
                    className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/80 hover:bg-emerald-950/40 hover:border-emerald-500/50 border border-slate-700/50 text-left transition group"
                  >
                    <img
                      src={u.avatar_url}
                      alt={u.full_name}
                      className="w-7 h-7 rounded-full object-cover border border-slate-600 group-hover:border-emerald-400"
                    />
                    <div className="truncate">
                      <div className="text-xs font-semibold text-white group-hover:text-emerald-400 truncate">
                        {u.full_name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {u.role === 'coach' ? 'Master Coach' : (u.profile as any)?.sport || 'Athlete'}
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* Auth Mode Tabs */}
        <div className="px-6 pt-2 flex border-b border-white/5 text-xs font-medium">
          <button
            onClick={() => setTab('login')}
            className={`pb-2.5 px-3 border-b-2 transition ${
              tab === 'login'
                ? 'border-emerald-400 text-white font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In with Email
          </button>
          <button
            onClick={() => setTab('register')}
            className={`pb-2.5 px-3 border-b-2 transition ${
              tab === 'register'
                ? 'border-emerald-400 text-white font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Create New Account
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
          {tab === 'register' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Vance"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="email"
                required
                placeholder={selectedRole === 'coach' ? 'coach.marcus@athlete360.com' : 'alex.chen@athlete360.com'}
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-medium text-slate-300">Password</label>
              {tab === 'login' && (
                <button
                  type="button"
                  onClick={() => setShowForgotPwd(!showForgotPwd)}
                  className="text-[11px] text-emerald-400 hover:underline"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="password"
                required
                placeholder="Demo: athlete360"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-400"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Default demo password for all accounts is: <code>athlete360</code></p>
          </div>

          {tab === 'register' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Primary Discipline</label>
                <select
                  value={sport}
                  onChange={e => setSport(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-400"
                >
                  <option value="Court Athletics">Court Athletics</option>
                  <option value="Singles Specialist">Singles Specialist</option>
                  <option value="Doubles Specialist">Doubles Specialist</option>
                  <option value="Court Agility & Footwork">Court Agility & Footwork</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Position / Specialization</label>
                <input
                  type="text"
                  placeholder="e.g. 100m Dash / Point Guard"
                  value={position}
                  onChange={e => setPosition(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          )}

          {/* Forgot password simulated modal */}
          {showForgotPwd && (
            <div className="p-3 bg-slate-900/90 border border-amber-500/30 rounded-lg text-xs space-y-2">
              <p className="text-slate-300">
                Enter your email address to receive password reset instructions:
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="name@athlete360.com"
                  defaultValue={email}
                  className="flex-1 px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700 text-white text-xs"
                />
                <button
                  type="button"
                  onClick={() => setResetSent(true)}
                  className="px-3 py-1.5 bg-amber-500 text-black font-semibold rounded text-xs"
                >
                  Send
                </button>
              </div>
              {resetSent && (
                <p className="text-emerald-400 text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Password reset link sent to {email || 'your email'}.
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                Processing...
              </span>
            ) : (
              <>
                <span>{tab === 'login' ? `Sign In as ${selectedRole === 'coach' ? 'Coach' : 'Athlete'}` : `Register ${selectedRole === 'coach' ? 'Coach' : 'Athlete'} Profile`}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
