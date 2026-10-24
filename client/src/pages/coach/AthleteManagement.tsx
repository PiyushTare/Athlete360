import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Users,
  Search,
  Filter,
  Plus,
  AlertTriangle,
  CheckCircle,
  Eye,
  Edit2,
  Trash2,
  Activity,
  Heart,
  Calendar,
  X,
  Dumbbell,
  Shield,
  Clock,
  Sparkles
} from 'lucide-react';

export const AthleteManagement: React.FC = () => {
  const { user } = useAuth();
  const [athletes, setAthletes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sportFilter, setSportFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [selectedAthlete, setSelectedAthlete] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add athlete form state
  const [newAthleteData, setNewAthleteData] = useState({
    full_name: '',
    email: '',
    sport: 'Running',
    position: '',
    dob: '2003-05-15',
    gender: 'Male',
    height_cm: 180,
    weight_kg: 75,
    experience_level: 'Elite',
    training_goals: 'Olympic trials qualification'
  });

  const loadAthletes = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await api.getCoachAthletes(user.id);
      setAthletes(res.athletes || []);
    } catch (err) {
      console.error('Failed to load athletes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAthletes();
  }, [user]);

  // Filtering
  const filteredAthletes = athletes.filter(a => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.sport.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.position.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSport = sportFilter === 'all' || a.sport.toLowerCase().includes(sportFilter.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.readiness_status === statusFilter;

    return matchesSearch && matchesSport && matchesStatus;
  });

  // Handle Add Athlete
  const handleAddAthlete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await api.addAthlete(user.id, newAthleteData);
      setIsAddModalOpen(false);
      setNewAthleteData({
        full_name: '',
        email: '',
        sport: 'Running',
        position: '',
        dob: '2003-05-15',
        gender: 'Male',
        height_cm: 180,
        weight_kg: 75,
        experience_level: 'Elite',
        training_goals: 'Olympic trials qualification'
      });
      loadAthletes();
    } catch (err: any) {
      alert(err.message || 'Failed to add athlete');
    }
  };

  // Handle Update Athlete
  const handleUpdateAthlete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedAthlete) return;
    try {
      await api.updateAthlete(user.id, selectedAthlete.id, {
        full_name: selectedAthlete.name,
        sport: selectedAthlete.sport,
        position_specialization: selectedAthlete.position,
        height_cm: selectedAthlete.height_cm,
        weight_kg: selectedAthlete.weight_kg,
        injury_history: selectedAthlete.injury_history,
        training_goals: selectedAthlete.training_goals,
      });
      setIsEditModalOpen(false);
      loadAthletes();
    } catch (err: any) {
      alert(err.message || 'Failed to update athlete');
    }
  };

  // Handle Remove Athlete
  const handleRemoveAthlete = async (athleteId: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to remove this athlete from your active roster?')) return;
    try {
      await api.deleteAthlete(user.id, athleteId);
      if (selectedAthlete?.id === athleteId) setSelectedAthlete(null);
      loadAthletes();
    } catch (err: any) {
      alert(err.message || 'Failed to remove athlete');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            Athlete Roster Management
          </h2>
          <p className="text-xs text-slate-400">
            Monitor, evaluate, and manage all competitors under your coaching supervision.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add New Athlete</span>
        </button>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by athlete name, sport, or position..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-emerald-400"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={sportFilter}
            onChange={e => setSportFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-emerald-400"
          >
            <option value="all">All Disciplines</option>
            <option value="Court Athletics">Court Athletics</option>
            <option value="Singles Specialist">Singles Specialist</option>
            <option value="Doubles Specialist">Doubles Specialist</option>
            <option value="Court Footwork & Agility">Court Footwork & Agility</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-emerald-400"
          >
            <option value="all">All Readiness Statuses</option>
            <option value="Green">Green (Ready)</option>
            <option value="Yellow">Yellow (Caution)</option>
            <option value="Red">Red (Needs Attention)</option>
          </select>
        </div>
      </div>

      {/* ATHLETE CARDS GRID */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-xs">Loading athlete roster...</div>
      ) : filteredAthletes.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-white/5 text-slate-400 text-xs">
          No athletes found matching your search and filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAthletes.map(athlete => {
            return (
              <div
                key={athlete.id}
                className="glass-panel glass-panel-hover p-5 rounded-2xl space-y-4 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar with Status Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={athlete.avatar}
                        alt={athlete.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-700 shadow"
                      />
                      <div>
                        <h3 className="text-sm font-bold text-white hover:text-emerald-400 transition cursor-pointer" onClick={() => setSelectedAthlete(athlete)}>
                          {athlete.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {athlete.sport} • {athlete.position}
                        </p>
                        <span className="text-[10px] text-slate-500 font-medium">Age {athlete.age}</span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        athlete.readiness_status === 'Green'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : athlete.readiness_status === 'Yellow'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                      }`}
                    >
                      {athlete.readiness_status}
                    </span>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-3 gap-2 my-4 p-2.5 rounded-xl bg-slate-900/80 border border-white/5 text-center">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Performance</div>
                      <div className="text-sm font-black text-white">{athlete.performance_score}/100</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Consistency</div>
                      <div className="text-sm font-black text-emerald-400">{athlete.consistency_score}%</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Readiness</div>
                      <div
                        className={`text-sm font-black ${
                          athlete.readiness_status === 'Green'
                            ? 'text-emerald-400'
                            : athlete.readiness_status === 'Yellow'
                            ? 'text-amber-400'
                            : 'text-red-400'
                        }`}
                      >
                        {athlete.readiness_score || 85}
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">{athlete.recent_activity}</span>
                  </div>

                  {/* Warning tag if flagged */}
                  {athlete.readiness_status !== 'Green' && (
                    <div className="mt-2.5 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] text-red-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
                      <span className="truncate">
                        {athlete.injury_history && athlete.injury_history !== 'None'
                          ? athlete.injury_history
                          : 'Reported high fatigue or physical discomfort'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedAthlete(athlete)}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    <span>View Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedAthlete(athlete);
                      setIsEditModalOpen(true);
                    }}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    title="Edit Athlete"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleRemoveAthlete(athlete.id)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition"
                    title="Remove from Roster"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAILED ATHLETE MODAL */}
      {selectedAthlete && !isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0f121a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-4">
                <img
                  src={selectedAthlete.avatar}
                  alt={selectedAthlete.name}
                  className="w-16 h-16 rounded-2xl object-cover border border-emerald-400/50 shadow-lg"
                />
                <div>
                  <h3 className="text-xl font-black text-white">{selectedAthlete.name}</h3>
                  <p className="text-xs text-slate-400">{selectedAthlete.sport} • {selectedAthlete.position}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                      {selectedAthlete.experience_level || 'Elite'} Level
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        selectedAthlete.readiness_status === 'Green'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : selectedAthlete.readiness_status === 'Yellow'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      Readiness: {selectedAthlete.readiness_status} ({selectedAthlete.readiness_score || 85}/100)
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedAthlete(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Physical Specs & Contact */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-900 border border-white/5">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Height</span>
                <div className="text-sm font-bold text-white">{selectedAthlete.height_cm || 180} cm</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-white/5">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Weight</span>
                <div className="text-sm font-bold text-white">{selectedAthlete.weight_kg || 75} kg</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-white/5">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Training Streak</span>
                <div className="text-sm font-bold text-orange-400">🔥 {selectedAthlete.streak_days || 7} Days</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-white/5">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Weekly Load</span>
                <div className="text-sm font-bold text-cyan-400">{selectedAthlete.weekly_training_hours || 12}h / wk</div>
              </div>
            </div>

            {/* Training Goals & Injury History */}
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-white/5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Training Goals
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedAthlete.training_goals || 'No specific goals set yet.'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-white/5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5 mb-1">
                  <Shield className="w-3.5 h-3.5 text-amber-400" /> Private Injury Record (Coach & Athlete Only)
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedAthlete.injury_history || 'No recorded injuries.'}
                </p>
              </div>

              {/* Latest Vitals if available */}
              {selectedAthlete.latest_vitals && (
                <div className="p-3 rounded-xl bg-slate-900 border border-white/5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5 mb-2">
                    <Heart className="w-3.5 h-3.5 text-red-400" /> Latest Logged Biometrics
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>Resting HR: <strong className="text-emerald-400">{selectedAthlete.latest_vitals.resting_heart_rate} BPM</strong></div>
                    <div>Sleep: <strong className="text-cyan-400">{selectedAthlete.latest_vitals.sleep_hours} Hours</strong></div>
                    <div>SpO2: <strong className="text-emerald-400">{selectedAthlete.latest_vitals.spo2}%</strong></div>
                    <div>Fatigue: <strong className="text-amber-400">{selectedAthlete.latest_vitals.fatigue_level}/10</strong></div>
                    <div>Soreness: <strong className="text-amber-400">{selectedAthlete.latest_vitals.soreness_level}/10</strong></div>
                    <div>Hydration: <strong className="text-white">{selectedAthlete.latest_vitals.hydration_level}</strong></div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
              <button
                onClick={() => {
                  setIsEditModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Edit Information
              </button>
              <button
                onClick={() => setSelectedAthlete(null)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ATHLETE MODAL */}
      {isEditModalOpen && selectedAthlete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0f121a] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">Edit Athlete: {selectedAthlete.name}</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateAthlete} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={selectedAthlete.name}
                  onChange={e => setSelectedAthlete({ ...selectedAthlete, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Sport</label>
                  <select
                    value={selectedAthlete.sport}
                    onChange={e => setSelectedAthlete({ ...selectedAthlete, sport: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  >
                    <option value="Court Athletics">Court Athletics</option>
                    <option value="Singles Specialist">Singles Specialist</option>
                    <option value="Doubles Specialist">Doubles Specialist</option>
                    <option value="Court Footwork & Agility">Court Footwork & Agility</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Position / Specialization</label>
                  <input
                    type="text"
                    value={selectedAthlete.position}
                    onChange={e => setSelectedAthlete({ ...selectedAthlete, position: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={selectedAthlete.height_cm || 180}
                    onChange={e => setSelectedAthlete({ ...selectedAthlete, height_cm: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={selectedAthlete.weight_kg || 75}
                    onChange={e => setSelectedAthlete({ ...selectedAthlete, weight_kg: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Injury History (Private)</label>
                <textarea
                  rows={2}
                  value={selectedAthlete.injury_history || ''}
                  onChange={e => setSelectedAthlete({ ...selectedAthlete, injury_history: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Training Goals</label>
                <textarea
                  rows={2}
                  value={selectedAthlete.training_goals || ''}
                  onChange={e => setSelectedAthlete({ ...selectedAthlete, training_goals: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD ATHLETE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0f121a] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Add Athlete to Roster
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAthlete} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Athlete Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cameron Smith"
                  value={newAthleteData.full_name}
                  onChange={e => setNewAthleteData({ ...newAthleteData, full_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="athlete@athlete360.com"
                  value={newAthleteData.email}
                  onChange={e => setNewAthleteData({ ...newAthleteData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Sport *</label>
                  <select
                    value={newAthleteData.sport}
                    onChange={e => setNewAthleteData({ ...newAthleteData, sport: e.target.value })}
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
                    placeholder="e.g. 200m Sprint"
                    value={newAthleteData.position}
                    onChange={e => setNewAthleteData({ ...newAthleteData, position: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={newAthleteData.height_cm}
                    onChange={e => setNewAthleteData({ ...newAthleteData, height_cm: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={newAthleteData.weight_kg}
                    onChange={e => setNewAthleteData({ ...newAthleteData, weight_kg: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Training Goals</label>
                <textarea
                  rows={2}
                  value={newAthleteData.training_goals}
                  onChange={e => setNewAthleteData({ ...newAthleteData, training_goals: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold"
                >
                  Enroll Athlete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
