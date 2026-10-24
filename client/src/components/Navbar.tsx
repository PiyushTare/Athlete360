import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, User, LogOut, LayoutDashboard, Menu, X, Sparkles, Activity } from 'lucide-react';

interface NavbarProps {
  onOpenAuth: (role: 'coach' | 'athlete') => void;
  activeSection?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 w-full bg-[#08090d]/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <a href="#" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 p-[1.5px] shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition">
                <div className="w-full h-full bg-[#090b10] rounded-[10px] flex items-center justify-center">
                  <Activity className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition duration-300" />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-black text-white tracking-tight">ATHLETE</span>
                  <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-tight">
                    360
                  </span>
                </div>
                <span className="text-[9px] font-semibold text-slate-400 tracking-widest uppercase">
                  AI Performance Hub
                </span>
              </div>
            </a>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
            <a href="#features" className="hover:text-emerald-400 transition">
              Platform Features
            </a>
            <a href="#ai-readiness" className="hover:text-emerald-400 transition flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" /> AI Readiness Engine
            </a>
            <a href="#analytics" className="hover:text-emerald-400 transition">
              Performance Analytics
            </a>
            <a href="#tournaments" className="hover:text-emerald-400 transition">
              Tournaments
            </a>
            <a href="#about" className="hover:text-emerald-400 transition">
              About
            </a>
          </div>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <a
                  href="#dashboard"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  {user.role === 'coach' ? 'Coach Dashboard' : 'Athlete Dashboard'}
                </a>
                <button
                  onClick={logout}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => onOpenAuth('coach')}
                  className="px-3.5 py-1.5 rounded-lg border border-emerald-500/40 hover:border-emerald-400 text-emerald-400 hover:bg-emerald-500/10 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Coach Login
                </button>
                <button
                  onClick={() => onOpenAuth('athlete')}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                >
                  <User className="w-3.5 h-3.5" />
                  Athlete Login
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0d1017] border-b border-white/10 px-4 pt-2 pb-6 space-y-3">
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm text-slate-300 hover:text-emerald-400"
          >
            Platform Features
          </a>
          <a
            href="#ai-readiness"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm text-slate-300 hover:text-emerald-400"
          >
            AI Readiness Engine
          </a>
          <a
            href="#analytics"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm text-slate-300 hover:text-emerald-400"
          >
            Performance Analytics
          </a>
          <a
            href="#tournaments"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm text-slate-300 hover:text-emerald-400"
          >
            Tournaments
          </a>
          <a
            href="#about"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm text-slate-300 hover:text-emerald-400"
          >
            About
          </a>

          <div className="pt-4 border-t border-white/10 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAuth('coach');
              }}
              className="w-full py-2.5 rounded-lg border border-emerald-500/40 text-emerald-400 font-bold text-xs flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" /> Coach Portal
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAuth('athlete');
              }}
              className="w-full py-2.5 rounded-lg bg-emerald-500 text-black font-bold text-xs flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4" /> Athlete Portal
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
