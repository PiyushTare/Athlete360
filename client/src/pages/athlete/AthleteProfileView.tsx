import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  User,
  Shield,
  Edit2,
  Calendar,
  Sparkles,
  Award,
  Zap,
  CheckCircle2,
  X,
  Target,
  Clock,
  Dumbbell
} from 'lucide-react';

export const AthleteProfileView: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    sport: '',
    position_specialization: '',
    dob: '',
    gender: '',
    height_cm: 180,
    weight_kg: 75,
    preferred_category: '',
    experience_level: '',
    training_goals: '',
    injury_history: ''
  });

  const loadProfile = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await api.getAthleteProfile(user.id);
      setProfileData(res);
      const p = res.profile || {};
      setEditForm({
        full_name: res.user?.full_name || '',
        phone: res.user?.phone || '',
        sport: p.sport || '',
        position_specialization: p.position_specialization || '',
        dob: p.dob || '',
        gender: p.gender || 'Male',
        height_cm: p.height_cm || 180,
        weight_kg: p.weight_kg || 75,
        preferred_category: p.preferred_category || 'Speed and Agility',
        experience_level: p.experience_level || 'Elite',
        training_goals: p.training_goals || '',
        injury_history: p.injury_history || ''
      });
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await api.updateAthleteProfile(user.id, editForm);
      setIsEditing(false);
      await refreshUser();
      loadProfile();
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-500 text-xs">Loading athlete profile...</div>;
  }

  const u = profileData?.user || user;
  const p = profileData?.profile || {};
  const coach = profileData?.assignedCoach;
  const pbs = profileData?.personalBests || [];
  const goals = profileData?.goals || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner Card */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <img
            src={u?.avatar_url}
            alt={u?.full_name}
            className="w-20 h-20 rounded-2xl object-cover border-2 border-cyan-400 shadow-xl"
          />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black text-cyan-400 uppercase tracking-wider">{p.sport}</span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400">{p.position_specialization}</span>
            </div>
            <h2 className="text-2xl font-black text-white">{u?.full_name}</h2>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
              <span>{p.experience_level || 'Elite'} Athlete</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">{p.consistency_score}% Adherence</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsEditing(true)}
          className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit Profile</span>
        </button>
      </div>

      {/* Physical Specs & Assigned Coach */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <div className="p-4 rounded-xl bg-slate-900 border border-white/5">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Height</span>
          <div className="text-lg font-black text-white">{p.height_cm} cm</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-white/5">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Weight</span>
          <div className="text-lg font-black text-white">{p.weight_kg} kg</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-white/5">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Performance Score</span>
          <div className="text-lg font-black text-emerald-400">{p.performance_score}/100</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-white/5">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Streak</span>
          <div className="text-lg font-black text-orange-400">🔥 {p.streak_days || 14} Days</div>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Goals & Training Focus */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-400" />
            Active Training Goals & Focus
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-3 rounded-xl border border-white/5">
            {p.training_goals || 'No training goals defined.'}
          </p>

          {goals.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Benchmarked Milestones:
              </span>
              {goals.map((g: any) => (
                <div
                  key={g.id}
                  className="p-2.5 rounded-lg bg-slate-900 border border-white/5 text-xs flex items-center justify-between"
                >
                  <span className="text-white font-medium">{g.title}</span>
                  <span className="text-emerald-400 font-bold">{g.current_value} / {g.metric_target}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Coach & Private Medical/Injury History */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            Assigned Coach & Private Medical History
          </h3>

          {/* Coach Card */}
          {coach && (
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/20 flex items-center gap-3">
              <img
                src={coach.avatar}
                alt={coach.name}
                className="w-10 h-10 rounded-full object-cover border border-emerald-400"
              />
              <div>
                <span className="text-[10px] text-emerald-400 font-bold uppercase">Supervising Coach</span>
                <div className="text-xs font-bold text-white">{coach.name}</div>
                <div className="text-[10px] text-slate-400">{coach.email}</div>
              </div>
            </div>
          )}

          {/* Private Injury Record */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/20 text-xs space-y-1">
            <span className="font-bold text-amber-400 flex items-center gap-1.5 text-[11px]">
              <Shield className="w-3.5 h-3.5" /> Confidential Injury & Recovery Log:
            </span>
            <p className="text-slate-300 leading-relaxed italic">
              {p.injury_history && p.injury_history !== 'None'
                ? p.injury_history
                : 'No active soft tissue or orthopedic restrictions.'}
            </p>
            <span className="text-[10px] text-slate-500 block pt-1">
              Encrypted: accessible only by you and your assigned coach.
            </span>
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0f121a] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">Edit Athlete Profile</h3>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.full_name}
                  onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Athletic Discipline</label>
                  <select
                    value={editForm.sport}
                    onChange={e => setEditForm({ ...editForm, sport: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  >
                    <option value="Court Athletics">Court Athletics</option>
                    <option value="Singles Specialist">Singles Specialist</option>
                    <option value="Doubles Specialist">Doubles Specialist</option>
                    <option value="Court Footwork & Agility">Court Footwork & Agility</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Position / Event</label>
                  <input
                    type="text"
                    value={editForm.position_specialization}
                    onChange={e => setEditForm({ ...editForm, position_specialization: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={editForm.height_cm}
                    onChange={e => setEditForm({ ...editForm, height_cm: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={editForm.weight_kg}
                    onChange={e => setEditForm({ ...editForm, weight_kg: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Training Goals</label>
                <textarea
                  rows={2}
                  value={editForm.training_goals}
                  onChange={e => setEditForm({ ...editForm, training_goals: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Injury History (Private to Coach)</label>
                <textarea
                  rows={2}
                  value={editForm.injury_history}
                  onChange={e => setEditForm({ ...editForm, injury_history: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
