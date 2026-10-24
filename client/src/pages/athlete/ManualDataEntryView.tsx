import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import confetti from 'canvas-confetti';
import {
  FileEdit,
  Heart,
  Wind,
  Footprints,
  Flame,
  Moon,
  Clock,
  Trophy,
  Activity,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  Zap,
  Calendar,
  Send,
  Layers,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Info
} from 'lucide-react';

export const ManualDataEntryView: React.FC = () => {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recentEntries, setRecentEntries] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Form Fields
  const now = new Date();
  const defaultDate = now.toISOString().split('T')[0];
  const defaultTime = now.toTimeString().slice(0, 5);

  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);

  // Health Vitals
  const [heartRate, setHeartRate] = useState('');
  const [spo2, setSpo2] = useState('');
  const [steps, setSteps] = useState('');
  const [calories, setCalories] = useState('');
  const [sleepHours, setSleepHours] = useState('');

  // Court Training
  const [trainingDuration, setTrainingDuration] = useState('60');
  const [trainingType, setTrainingType] = useState('Court Footwork & Agility');

  // Match Performance
  const [includeMatch, setIncludeMatch] = useState(false);
  const [opponent, setOpponent] = useState('');
  const [matchResult, setMatchResult] = useState<'Win' | 'Loss'>('Win');
  const [matchScore, setMatchScore] = useState('');
  const [courtMovementRating, setCourtMovementRating] = useState('8');
  const [matchNotes, setMatchNotes] = useState('');

  // Recovery Details
  const [fatigueLevel, setFatigueLevel] = useState(3);
  const [sorenessLevel, setSorenessLevel] = useState(2);
  const [hydrationLevel, setHydrationLevel] = useState<'Optimal' | 'Adequate' | 'Low' | 'Dehydrated'>('Optimal');
  const [recoveryNotes, setRecoveryNotes] = useState('');

  const loadHistory = async () => {
    if (!user) return;
    try {
      setLoadingHistory(true);
      const res = await api.getManualEntries(user.id);
      setRecentEntries(res.entries || []);
    } catch (err) {
      console.error('Failed to load manual entries:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [user]);

  // Live assessment calculator for preview before submitting
  const calculateLiveReadiness = () => {
    const hr = heartRate !== '' ? Number(heartRate) : null;
    const o2 = spo2 !== '' ? Number(spo2) : null;
    const sl = sleepHours !== '' ? Number(sleepHours) : null;

    if (hr === null || (o2 === null && sl === null)) {
      return {
        status: 'INSUFFICIENT_DATA',
        label: 'Insufficient Data',
        color: 'text-slate-400 bg-slate-800/80 border-slate-700',
        summary: 'Heart Rate and at least one recovery vital (SpO₂ or Sleep) required to assess readiness.'
      };
    }

    const issues: string[] = [];
    if (o2 !== null && o2 < 95) issues.push(`SpO₂ below 95% (${o2}%)`);
    if (hr > 95) issues.push(`Resting pulse elevated (${hr} BPM)`);
    else if (hr < 42) issues.push(`Pulse unusually low (${hr} BPM)`);
    if (sl !== null && sl < 6.0) issues.push(`Sleep deficit (${sl}h)`);
    if (fatigueLevel >= 7) issues.push(`Severe fatigue (${fatigueLevel}/10)`);
    if (sorenessLevel >= 7) issues.push(`Acute soreness (${sorenessLevel}/10)`);

    if (issues.length > 0) {
      return {
        status: 'NEEDS_RECOVERY',
        label: 'Needs Recovery (Unfit for High Load)',
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        summary: issues.join(' • ') + ' — Rest or active recovery recommended.'
      };
    }

    return {
      status: 'FIT',
      label: 'Fit (Optimal Readiness)',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      summary: 'Cardiovascular vitals and recovery markers are within optimal athletic readiness zones.'
    };
  };

  const liveAssessment = calculateLiveReadiness();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setErrorMessage(null);
    setSuccessBanner(null);
    setSubmitting(true);

    try {
      const payload: any = {
        date,
        time,
        heart_rate_bpm: heartRate !== '' ? Number(heartRate) : null,
        spo2_pct: spo2 !== '' ? Number(spo2) : null,
        steps: steps !== '' ? Number(steps) : null,
        calories_kcal: calories !== '' ? Number(calories) : null,
        sleep_duration_hours: sleepHours !== '' ? Number(sleepHours) : null,
        training_duration_mins: trainingDuration !== '' ? Number(trainingDuration) : null,
        training_type: trainingType,
        recovery_details: {
          fatigue_level: fatigueLevel,
          soreness_level: sorenessLevel,
          hydration_level: hydrationLevel,
          notes: recoveryNotes
        }
      };

      if (includeMatch && opponent.trim()) {
        payload.match_performance = {
          opponent: opponent.trim(),
          result: matchResult,
          score: matchScore.trim(),
          performance_rating: Number(courtMovementRating),
          court_movement_notes: matchNotes.trim()
        };
      }

      const res = await api.submitManualEntry(user.id, payload);

      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 }
      });

      setSuccessBanner(
        `Entry recorded successfully with tag [MANUAL ENTRY]. Readiness status updated to ${res.readiness?.status || 'Active'}.`
      );

      // Reset form vitals
      setHeartRate('');
      setSpo2('');
      setSteps('');
      setCalories('');
      setSleepHours('');
      setMatchNotes('');
      setOpponent('');
      setMatchScore('');
      setIncludeMatch(false);

      loadHistory();
    } catch (err: any) {
      console.error('Failed to submit manual entry:', err);
      setErrorMessage(err.message || 'Failed to submit manual data. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Executive Header */}
      <div className="p-6 rounded-2xl bg-[#0d111a] border border-white/10 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <FileEdit className="w-3 h-3" />
              Manual Telemetry Logging
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-xs text-slate-400 font-semibold">Distinguished from Health Connect</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Manual Health & Performance Entry</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Log genuine vitals, court sessions, match results, and recovery markers when not synced via your smartwatch. All records are explicitly tagged as <strong className="text-purple-300">MANUAL ENTRY</strong> and automatically refresh your athletic Fit / Unfit status.
          </p>
        </div>

        {/* Live Readiness Pill */}
        <div className={`p-4 rounded-xl border ${liveAssessment.color} shrink-0 max-w-xs space-y-1`}>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            {liveAssessment.status === 'FIT' && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
            {liveAssessment.status === 'NEEDS_RECOVERY' && <ShieldAlert className="w-4 h-4 text-amber-400" />}
            {liveAssessment.status === 'INSUFFICIENT_DATA' && <HelpCircle className="w-4 h-4 text-slate-400" />}
            <span>Readiness Preview</span>
          </div>
          <div className="text-sm font-extrabold text-white">{liveAssessment.label}</div>
          <p className="text-[11px] text-slate-300 leading-snug">{liveAssessment.summary}</p>
        </div>
      </div>

      {/* Success / Error Banners */}
      {successBanner && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="text-emerald-400 hover:text-white font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-white font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Main Entry Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Timestamp & Date */}
        <div className="p-5 rounded-2xl bg-[#0e121c] border border-white/10 space-y-4">
          <div className="flex items-center gap-2 text-xs font-black text-white uppercase tracking-wider">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span>1. Entry Date & Time</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Date of Measurement *</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Time of Measurement *</label>
              <input
                type="time"
                required
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Health Vitals (Heart Rate, SpO2, Steps, Calories, Sleep) */}
        <div className="p-5 rounded-2xl bg-[#0e121c] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-black text-white uppercase tracking-wider">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>2. Health & Physiological Vitals</span>
            </div>
            <span className="text-[11px] text-slate-400">Required for Fit / Unfit readiness evaluation</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {/* Heart Rate */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-red-500/20 space-y-2">
              <label className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Heart Rate</span>
                <Heart className="w-3.5 h-3.5 text-red-400" />
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="35"
                  max="225"
                  placeholder="e.g. 58"
                  value={heartRate}
                  onChange={e => setHeartRate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-bold text-sm focus:outline-none focus:border-red-400"
                />
                <span className="absolute right-2.5 top-2.5 text-[10px] text-slate-500">BPM</span>
              </div>
              <span className="text-[10px] text-slate-400">Resting or post-session</span>
            </div>

            {/* SpO2 */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/20 space-y-2">
              <label className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Blood Oxygen</span>
                <Wind className="w-3.5 h-3.5 text-cyan-400" />
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="70"
                  max="100"
                  placeholder="e.g. 98"
                  value={spo2}
                  onChange={e => setSpo2(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-bold text-sm focus:outline-none focus:border-cyan-400"
                />
                <span className="absolute right-2.5 top-2.5 text-[10px] text-slate-500">%</span>
              </div>
              <span className="text-[10px] text-slate-400">Target ≥ 95%</span>
            </div>

            {/* Steps */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/20 space-y-2">
              <label className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Daily Steps</span>
                <Footprints className="w-3.5 h-3.5 text-emerald-400" />
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 9400"
                  value={steps}
                  onChange={e => setSteps(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-bold text-sm focus:outline-none focus:border-emerald-400"
                />
                <span className="absolute right-2.5 top-2.5 text-[10px] text-slate-500">steps</span>
              </div>
              <span className="text-[10px] text-slate-400">Court & daily movement</span>
            </div>

            {/* Calories */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-orange-500/20 space-y-2">
              <label className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Calories Burned</span>
                <Flame className="w-3.5 h-3.5 text-orange-400" />
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 620"
                  value={calories}
                  onChange={e => setCalories(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-bold text-sm focus:outline-none focus:border-orange-400"
                />
                <span className="absolute right-2.5 top-2.5 text-[10px] text-slate-500">kcal</span>
              </div>
              <span className="text-[10px] text-slate-400">Active workout burn</span>
            </div>

            {/* Sleep */}
            <div className="col-span-2 md:col-span-1 p-3.5 rounded-xl bg-slate-900/90 border border-indigo-500/20 space-y-2">
              <label className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Sleep Duration</span>
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  placeholder="e.g. 7.5"
                  value={sleepHours}
                  onChange={e => setSleepHours(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-bold text-sm focus:outline-none focus:border-indigo-400"
                />
                <span className="absolute right-2.5 top-2.5 text-[10px] text-slate-500">hours</span>
              </div>
              <span className="text-[10px] text-slate-400">Target ≥ 7.0 hours</span>
            </div>
          </div>
        </div>

        {/* Section 3: Court Training Details */}
        <div className="p-5 rounded-2xl bg-[#0e121c] border border-white/10 space-y-4">
          <div className="flex items-center gap-2 text-xs font-black text-white uppercase tracking-wider">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>3. Court Training & Conditioning Details</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Court Training Focus</label>
              <select
                value={trainingType}
                onChange={e => setTrainingType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
              >
                <option value="Court Footwork & Agility">Court Footwork & Agility Drills</option>
                <option value="Speed & Court Coverage">Speed & Multi-Corner Court Coverage</option>
                <option value="Stamina & High-Intensity Rallies">Stamina & High-Intensity Rallies</option>
                <option value="Reaction Time & Reflex Drills">Reaction Time & Reflex Drills</option>
                <option value="Match Simulation & Tactical Play">Match Simulation & Tactical Play</option>
                <option value="Active Recovery & Mobility">Active Recovery & Mobility</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Session Duration (minutes)</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={trainingDuration}
                  onChange={e => setTrainingDuration(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-500">mins</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Match Performance (Optional Toggle) */}
        <div className="p-5 rounded-2xl bg-[#0e121c] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-black text-white uppercase tracking-wider">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span>4. Match Performance (Optional)</span>
            </div>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeMatch}
                onChange={e => setIncludeMatch(e.target.checked)}
                className="rounded border-slate-700 text-cyan-500 focus:ring-0 w-4 h-4"
              />
              <span className="text-xs text-slate-300 font-semibold">Include Court Match Log</span>
            </label>
          </div>

          {includeMatch && (
            <div className="space-y-4 pt-2 border-t border-white/5 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Opponent Name</label>
                  <input
                    type="text"
                    placeholder="e.g. J. Miller"
                    value={opponent}
                    onChange={e => setOpponent(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Match Result</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMatchResult('Win')}
                      className={`py-2 rounded-lg text-xs font-bold transition ${
                        matchResult === 'Win'
                          ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                          : 'bg-slate-900 text-slate-400 border border-slate-700'
                      }`}
                    >
                      Win
                    </button>
                    <button
                      type="button"
                      onClick={() => setMatchResult('Loss')}
                      className={`py-2 rounded-lg text-xs font-bold transition ${
                        matchResult === 'Loss'
                          ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                          : 'bg-slate-900 text-slate-400 border border-slate-700'
                      }`}
                    >
                      Loss
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Score Display</label>
                  <input
                    type="text"
                    placeholder="e.g. 21-19, 21-18"
                    value={matchScore}
                    onChange={e => setMatchScore(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Court Movement Efficiency (1-10)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={courtMovementRating}
                    onChange={e => setCourtMovementRating(e.target.value)}
                    className="w-full accent-cyan-400"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>1 (Sluggish)</span>
                    <span className="text-cyan-400 font-bold">{courtMovementRating}/10 Rating</span>
                    <span>10 (Flawless Footwork)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Match Tactical Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Excellent front-court anticipation and reaction speed."
                    value={matchNotes}
                    onChange={e => setMatchNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 5: Recovery & Wellness Markers */}
        <div className="p-5 rounded-2xl bg-[#0e121c] border border-white/10 space-y-4">
          <div className="flex items-center gap-2 text-xs font-black text-white uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>5. Recovery & Physiological Wellness Markers</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Fatigue */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Perceived Fatigue</span>
                <span className={`font-bold ${fatigueLevel >= 7 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {fatigueLevel}/10
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={fatigueLevel}
                onChange={e => setFatigueLevel(Number(e.target.value))}
                className="w-full accent-teal-400"
              />
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>Fresh (1)</span>
                <span>Exhausted (10)</span>
              </div>
            </div>

            {/* Muscle Soreness */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Muscle Soreness</span>
                <span className={`font-bold ${sorenessLevel >= 7 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {sorenessLevel}/10
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={sorenessLevel}
                onChange={e => setSorenessLevel(Number(e.target.value))}
                className="w-full accent-teal-400"
              />
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>None (1)</span>
                <span>Acute Soreness (10)</span>
              </div>
            </div>

            {/* Hydration */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/5 space-y-2">
              <label className="block text-xs font-semibold text-slate-300">Hydration Status</label>
              <select
                value={hydrationLevel}
                onChange={e => setHydrationLevel(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-teal-400"
              >
                <option value="Optimal">Optimal (Hydrated)</option>
                <option value="Adequate">Adequate</option>
                <option value="Low">Low (Mild Thirst)</option>
                <option value="Dehydrated">Dehydrated</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Additional Recovery Notes</label>
            <input
              type="text"
              placeholder="e.g. Foam rolled calves; mild tightness in right hamstring after lateral lunges."
              value={recoveryNotes}
              onChange={e => setRecoveryNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500 hover:opacity-95 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-500/20 transition disabled:opacity-50"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Saving Manual Record...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Save Manual Entry & Recalculate Readiness</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* History Log with Explicit Badging */}
      <div className="p-5 rounded-2xl bg-[#0e121c] border border-white/10 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2 text-xs font-black text-white uppercase tracking-wider">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Recent Manual Data Entries</span>
          </div>
          <span className="text-[11px] text-slate-400">
            {recentEntries.length} manual record{recentEntries.length === 1 ? '' : 's'} logged
          </span>
        </div>

        {loadingHistory ? (
          <div className="text-center py-6 text-slate-500 text-xs">Loading entry history...</div>
        ) : recentEntries.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-900/50 border border-white/5 text-center text-xs text-slate-400">
            No manual records found. Use the form above to log your genuine vitals and session details.
          </div>
        ) : (
          <div className="space-y-3">
            {recentEntries.map(entry => {
              const payload = entry.raw_payload_json || {};
              const dateStr = new Date(entry.timestamp || entry.recorded_at).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });
              const timeStr = new Date(entry.timestamp || entry.recorded_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={entry.id}
                  className="p-4 rounded-xl bg-slate-900/80 border border-white/5 hover:border-purple-500/30 transition space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {/* Prominent Distinction Badge */}
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                        <FileEdit className="w-3 h-3" />
                        MANUAL ENTRY
                      </span>

                      <span className="text-xs font-bold text-white">
                        {payload.training_type || 'Court Training Session'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono">
                      {dateStr} • {timeStr}
                    </div>
                  </div>

                  {/* Vitals Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-slate-950/70 border border-white/5">
                      <span className="text-[10px] text-slate-500 block">Heart Rate</span>
                      <span className="font-bold text-white">
                        {entry.heart_rate_bpm ? `${entry.heart_rate_bpm} BPM` : '—'}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-950/70 border border-white/5">
                      <span className="text-[10px] text-slate-500 block">SpO₂</span>
                      <span className="font-bold text-white">
                        {entry.spo2_pct ? `${entry.spo2_pct}%` : '—'}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-950/70 border border-white/5">
                      <span className="text-[10px] text-slate-500 block">Steps</span>
                      <span className="font-bold text-white">
                        {entry.steps ? entry.steps.toLocaleString() : '—'}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-950/70 border border-white/5">
                      <span className="text-[10px] text-slate-500 block">Calories</span>
                      <span className="font-bold text-white">
                        {entry.calories_kcal ? `${entry.calories_kcal} kcal` : '—'}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-950/70 border border-white/5">
                      <span className="text-[10px] text-slate-500 block">Sleep</span>
                      <span className="font-bold text-white">
                        {entry.sleep_duration_hours ? `${entry.sleep_duration_hours}h` : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Readiness & Notes Details */}
                  {payload.readiness_status && (
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] pt-1 border-t border-white/5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">Resulting Status:</span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                            payload.readiness_status === 'FIT'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : payload.readiness_status === 'NEEDS_RECOVERY'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {payload.readiness_status} ({payload.readiness_score || 50}/100)
                        </span>
                      </div>

                      {payload.match_performance && (
                        <span className="text-slate-300 font-semibold">
                          Match vs {payload.match_performance.opponent}:{' '}
                          <strong className={payload.match_performance.result === 'Win' ? 'text-emerald-400' : 'text-red-400'}>
                            {payload.match_performance.result}
                          </strong>{' '}
                          ({payload.match_performance.score || 'Recorded'})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
