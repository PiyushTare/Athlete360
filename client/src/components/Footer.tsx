import React from 'react';
import { Activity, Mail, Phone, MapPin, Shield, Sparkles, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#06070a] border-t border-white/10 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-lg font-black text-white tracking-tight">
                ATHLETE <span className="text-emerald-400">360</span>
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              The next-generation athletic intelligence platform connecting elite coaches and competitors through physiological vitals, AI readiness scoring, and predictive match analytics.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400/90 font-medium">
              <Shield className="w-3.5 h-3.5" />
              <span>Role-Based Secure Architecture</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">Platform Modules</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="hover:text-emerald-400 transition">Smart Athlete Tracking</a></li>
              <li><a href="#ai-readiness" className="hover:text-emerald-400 transition">AI Fitness Eligibility</a></li>
              <li><a href="#analytics" className="hover:text-emerald-400 transition">Performance Analytics</a></li>
              <li><a href="#tournaments" className="hover:text-emerald-400 transition">Tournament Management</a></li>
              <li><a href="#features" className="hover:text-emerald-400 transition">Training Consistency & Streaks</a></li>
            </ul>
          </div>

          {/* Roles */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">Portals</h4>
            <ul className="space-y-2">
              <li><a href="#coach" className="hover:text-emerald-400 transition">Coach Command Center</a></li>
              <li><a href="#athlete" className="hover:text-cyan-400 transition">Athlete Performance Portal</a></li>
              <li><a href="#demo" className="hover:text-emerald-400 transition">Demo Environment & Sandbox</a></li>
              <li><a href="#about" className="hover:text-emerald-400 transition">Sports Science Methodology</a></li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">Contact & Inquiries</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span>support@athlete360.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>+1 (800) 360-PERF</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Olympic Performance Campus, Suite 400</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Safety Disclaimer Banner */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 text-[11px] text-slate-400 leading-relaxed mb-8">
          <p className="font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-red-400" />
            Medical & Performance Disclaimer:
          </p>
          Athlete 360 Fitness Eligibility and AI Insights are non-diagnostic wellness and athletic readiness support tools designed exclusively to assist training periodization and recovery tracking. They do not constitute medical diagnosis, treatment, or formal medical clearance to compete. Athletes reporting chest pain, severe dizziness, fever, or acute musculoskeletal distress should immediately consult licensed physicians.
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© 2026 Athlete 360 Technologies Inc. All rights reserved. Capstone Edition.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer">HIPAA & Data Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
