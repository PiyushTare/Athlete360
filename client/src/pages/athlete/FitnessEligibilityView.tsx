import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { AthleteVitals, ReadinessAssessment, SmartwatchVitalsSync } from '../../types';
import confetti from 'canvas-confetti';
import {
  Activity,
  Heart,
  Moon,
  Thermometer,
  Wind,
  AlertTriangle,
  CheckCircle2,
  Brain,
  Shield,
  Clock,
  Sparkles,
  TrendingUp,
  Watch,
  HelpCircle,
  AlertOctagon,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export const FitnessEligibilityView: React.FC = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<{ vitals: AthleteVitals[]; assessments: ReadinessAssessment[] }>({
    vitals: [],
    assessments: []
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [latestAssessment, setLatestAssessment] = useState<ReadinessAssessment | null>(null);

  // Smartwatch Auto-fill state
  const [watchSyncing, setWatchSyncing] = useState(false);
  const [watchSourceInfo, setWatchSourceInfo] = useState<{
    deviceName: string;
    syncedAt: string;
    source: string;
  } | null>(null);

  // Form State
  const [rhr, setRhr] = useState(52);
  const [sysBP, setSysBP] = useState(118);
  const [diaBP, setDiaBP] = useState(76);
  const [sleepHours, setSleepHours] = useState(7.5);
  const [sleepQuality, setSleepQuality] = useState(4);
  const [bodyTemp, setBodyTemp] = useState(36.6);
  const [spo2, setSpo2] = useState(98);
  const [fatigueLevel, setFatigueLevel] = useState(3);
  const [sorenessLevel, setSorenessLevel] = useState(2);
  const [hydrationLevel, setHydrationLevel] = useState<'Optimal' | 'Adequate' | 'Low' | 'Dehydrated'>('Optimal');
  const [trainingIntensity, setTrainingIntensity] = useState<'Rest Day' | 'Light' | 'Moderate' | 'High' | 'Maximum/Competition'>('Moderate');
  const [painSymptoms, setPainSymptoms] = useState('None');
  const [shareWithCoach, setShareWithCoach] = useState(true);

  const loadVitalsHistory = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await api.getVitalsHistory(user.id);
      setHistory(res);
      if (res.assessments && res.assessments.length > 0) {
        setLatestAssessment(res.assessments[res.assessments.length - 1]);
      }
    } catch (err) {
      console.error('Failed to load vitals history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVitalsHistory();
  }, [user]);

  // Auto-fill from boAt Smartwatch
  const handleAutoFillFromWatch = async () => {
    if (!user) return;
    setWatchSyncing(true);
    try {
      const [devRes, readRes] = await Promise.all([
        api.getSmartwatchDevice(user.id),
        api.getSmartwatchReadings(user.id)
      ]);

      const device = devRes.device;
      const latestReading: SmartwatchVitalsSync | undefined = readRes.readings?.[0];

      if (!latestReading) {
        alert('No synced readings found from your smartwatch yet. Please pair your boAt Storm RTL on the "Connect Smartwatch" page or stream a live heart rate reading.');
        return;
      }

      if (latestReading.heart_rate_bpm) setRhr(latestReading.heart_rate_bpm);
      if (latestReading.spo2_pct) setSpo2(Math.round(latestReading.spo2_pct));
      if (latestReading.sleep_duration_hours) setSleepHours(Number(latestReading.sleep_duration_hours.toFixed(1)));
      if (latestReading.sleep_quality_score) {
        const mappedScore = Math.max(1, Math.min(5, Math.round(latestReading.sleep_quality_score / 20)));
        setSleepQuality(mappedScore);
      }

      setWatchSourceInfo({
        deviceName: device?.device_name || 'boAt Storm RTL',
        syncedAt: new Date(latestReading.recorded_at || latestReading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: latestReading.source || 'boAt Storm RTL Web Bluetooth'
      });
    } catch (err) {
      console.error('Failed to auto-fill from watch:', err);
    } finally {
      setWatchSyncing(false);
    }
  };

  // Submit Daily Vitals & Run AI Readiness Engine
  const handleSubmitVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSubmitting(true);
      const res = await api.submitVitalsAndReadiness(user.id, {
        resting_heart_rate: Number(rhr),
        blood_pressure_sys: Number(sysBP),
        blood_pressure_dia: Number(diaBP),
        sleep_hours: Number(sleepHours),
        sleep_quality: Number(sleepQuality),
        body_temp: Number(bodyTemp),
        spo2: Number(spo2),
        fatigue_level: Number(fatigueLevel),
        soreness_level: Number(sorenessLevel),
        hydration_level: hydrationLevel,
        training_intensity_recent: trainingIntensity,
        pain_symptoms: painSymptoms,
        shared_with_coach: shareWithCoach
      } as any);

      setLatestAssessment(res.assessment);

      if (res.assessment.readiness_status === 'Green') {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 }
        });
      }

      loadVitalsHistory();
    } catch (err: any) {
      alert(err.message || 'Failed to submit vitals');
    } finally {
      setSubmitting(false);
    }
  };

  // Health risk warnings based on vital thresholds
  const concerningFlags: string[] = [];
  if (rhr > 95) concerningFlags.push(`Elevated resting heart rate (${rhr} BPM). May indicate acute physical strain or infection.`);
  if (rhr < 42) concerningFlags.push(`Very low resting heart rate (${rhr} BPM). Common in athletes, but monitor for lightheadedness.`);
  if (spo2 < 95) concerningFlags.push(`Low blood oxygen saturation (${spo2}% SpO₂). Advise seeking medical evaluation if accompanied by dyspnea.`);
  if (sleepHours < 5) concerningFlags.push(`Insufficient restorative sleep (${sleepHours}h). High risk of neuromuscular fatigue.`);

  // Build Chart Data from History
  const chartData = history.assessments.map(ass => {
    const matchedVitals = history.vitals.find(v => v.recorded_date === ass.date);
    return {
      date: ass.date.slice(5),
      readiness: ass.readiness_score,
      rhr: matchedVitals ? matchedVitals.resting_heart_rate : 50,
      sleep: matchedVitals ? matchedVitals.sleep_hours : 8
    };
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <Brain className="w-3 h-3" />
            Physiological Diagnostics
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Fitness Eligibility & Readiness Assessment
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Log morning biometrics or sync directly from your boAt smartwatch to compute your daily capacity cap.
          </p>
        </div>

        {/* boAt Smartwatch Quick Auto-Fill */}
        <button
          onClick={handleAutoFillFromWatch}
          disabled={watchSyncing}
          className="px-4 py-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-50"
        >
          <Watch className={`w-4 h-4 text-cyan-400 ${watchSyncing ? 'animate-spin' : ''}`} />
          <span>{watchSyncing ? 'Reading Watch Data...' : 'Auto-Fill from boAt Watch'}</span>
        </button>
      </div>

      {/* Watch Pre-fill attribution */}
      {watchSourceInfo && (
        <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30 flex items-center justify-between text-xs text-cyan-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              Pre-filled from <strong>{watchSourceInfo.deviceName}</strong> ({watchSourceInfo.source}) • Synced at {watchSourceInfo.syncedAt}
            </span>
          </div>
          <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 font-semibold">
            Verified Smartwatch Telemetry
          </span>
        </div>
      )}

      {/* Safety Disclaimer */}
      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200/90 flex items-start gap-2.5">
        <AlertOctagon className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="leading-snug">
          <strong className="text-amber-300 font-bold">Sports-Science Advisory: </strong>
          Smartwatch measurements and AI readiness evaluations are for athletic load management and do not constitute clinical diagnoses or formal competition clearance. Consult a medical professional if acute symptoms occur.
        </div>
      </div>

      {/* Concerning Readings Alerts */}
      {concerningFlags.length > 0 && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-200 space-y-1.5">
          <div className="flex items-center gap-2 text-red-400 font-bold">
            <AlertTriangle className="w-4 h-4" />
            <span>Biometric Flags Detected in Current Entry</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-red-300">
            {concerningFlags.map((flag, idx) => (
              <li key={idx}>{flag}</li>
            ))}
          </ul>
        </div>
      )}

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Daily Biometrics Logging Form */}
        <div className="lg:col-span-7 glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Morning Physiological Vitals
            </h3>
            <span className="text-[10px] text-slate-400">All fields validated</span>
          </div>

          <form onSubmit={handleSubmitVitals} className="space-y-4 text-xs">
            {/* Cardiovascular Row: Resting HR & BP */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Resting HR (BPM) *
                </label>
                <div className="relative">
                  <Heart className="w-3.5 h-3.5 absolute left-3 top-2.5 text-red-400" />
                  <input
                    type="number"
                    min="35"
                    max="140"
                    required
                    value={rhr}
                    onChange={e => setRhr(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Blood Pressure Sys</label>
                <input
                  type="number"
                  placeholder="118"
                  value={sysBP}
                  onChange={e => setSysBP(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Blood Pressure Dia</label>
                <input
                  type="number"
                  placeholder="76"
                  value={diaBP}
                  onChange={e => setDiaBP(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>
            </div>

            {/* Sleep Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-slate-300 font-medium mb-1">
                  <span>Sleep: <strong className="text-cyan-400">{sleepHours} Hours</strong></span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="12"
                  step="0.25"
                  value={sleepHours}
                  onChange={e => setSleepHours(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                  <span>4.0h</span>
                  <span>7.5h (Target)</span>
                  <span>12.0h</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Sleep Quality (1-5)</label>
                <div className="flex items-center gap-1.5 pt-1">
                  {[1, 2, 3, 4, 5].map(q => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setSleepQuality(q)}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition ${
                        sleepQuality === q
                          ? 'bg-cyan-500 text-black border-cyan-400'
                          : 'bg-slate-900 text-slate-400 border-slate-700'
                      }`}
                    >
                      {q} ★
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Biomarkers: Temp & SpO2 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Body Temperature (°C)</label>
                <div className="relative">
                  <Thermometer className="w-3.5 h-3.5 absolute left-3 top-2.5 text-amber-400" />
                  <input
                    type="number"
                    step="0.1"
                    min="35.0"
                    max="40.0"
                    value={bodyTemp}
                    onChange={e => setBodyTemp(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Oxygen Saturation SpO2 (%)</label>
                <div className="relative">
                  <Wind className="w-3.5 h-3.5 absolute left-3 top-2.5 text-emerald-400" />
                  <input
                    type="number"
                    min="80"
                    max="100"
                    value={spo2}
                    onChange={e => setSpo2(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Fatigue Slider */}
            <div>
              <div className="flex justify-between text-slate-300 font-medium mb-1">
                <span>Perceived Central Fatigue (1-10)</span>
                <span className="text-amber-400 font-bold">{fatigueLevel} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={fatigueLevel}
                onChange={e => setFatigueLevel(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>

            {/* Muscle Soreness Slider */}
            <div>
              <div className="flex justify-between text-slate-300 font-medium mb-1">
                <span>Musculoskeletal Soreness (1-10)</span>
                <span className="text-orange-400 font-bold">{sorenessLevel} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={sorenessLevel}
                onChange={e => setSorenessLevel(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-400"
              />
            </div>

            {/* Hydration & Intensity */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Hydration State</label>
                <select
                  value={hydrationLevel}
                  onChange={e => setHydrationLevel(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                >
                  <option value="Optimal">Optimal (Clear)</option>
                  <option value="Adequate">Adequate</option>
                  <option value="Low">Low (Mild Thirst)</option>
                  <option value="Dehydrated">Dehydrated</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Recent Training Intensity</label>
                <select
                  value={trainingIntensity}
                  onChange={e => setTrainingIntensity(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                >
                  <option value="Rest Day">Rest Day</option>
                  <option value="Light">Light Technical</option>
                  <option value="Moderate">Moderate</option>
                  <option value="High">High Volume</option>
                  <option value="Maximum/Competition">Maximum / Competition</option>
                </select>
              </div>
            </div>

            {/* Pain / Symptoms */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Acute Discomfort / Symptoms
              </label>
              <input
                type="text"
                placeholder="e.g. None or Minor right calf tightness"
                value={painSymptoms}
                onChange={e => setPainSymptoms(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
              />
            </div>

            {/* Share with Coach */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-white/5">
              <span className="text-slate-300 text-xs">Share assessment with Coach</span>
              <input
                type="checkbox"
                checked={shareWithCoach}
                onChange={e => setShareWithCoach(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 bg-slate-800 border-slate-700"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-extrabold text-xs shadow-md shadow-emerald-500/20 transition flex items-center justify-center gap-2"
            >
              {submitting ? (
                <span>Computing Readiness Diagnosis...</span>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  <span>Compute Readiness & Eligibility</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Diagnostic Assessment Output */}
        <div className="lg:col-span-5 space-y-5">
          {latestAssessment ? (
            <div className="glass-panel p-5 rounded-2xl border-emerald-500/30 space-y-4 relative">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Readiness Diagnostic
                  </span>
                  <span className="text-xs text-slate-300">{latestAssessment.date}</span>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                    latestAssessment.readiness_status === 'Green'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : latestAssessment.readiness_status === 'Yellow'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-red-500/20 text-red-400 border border-red-500/40'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      latestAssessment.readiness_status === 'Green'
                        ? 'bg-emerald-400'
                        : latestAssessment.readiness_status === 'Yellow'
                        ? 'bg-amber-400'
                        : 'bg-red-400'
                    }`}
                  />
                  {latestAssessment.readiness_status === 'Green'
                    ? 'READY TO TRAIN'
                    : latestAssessment.readiness_status === 'Yellow'
                    ? 'CAUTION (REDUCED LOAD)'
                    : 'STOP INTENSE LOAD'}
                </span>
              </div>

              {/* Score Display */}
              <div className="text-center py-1">
                <div className="text-5xl font-black text-white tracking-tight">
                  {latestAssessment.readiness_score}
                  <span className="text-lg text-slate-500 font-normal">/100</span>
                </div>
                <div className="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider mt-1">
                  Capacity Score
                </div>
              </div>

              {/* Capacity Progress Bar */}
              <div className="p-3 rounded-xl bg-slate-900 border border-white/5 space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Session Intensity Cap:</span>
                  <span className="text-emerald-400 font-bold">{latestAssessment.recommended_intensity_pct}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      latestAssessment.readiness_status === 'Green'
                        ? 'bg-emerald-400 w-full'
                        : latestAssessment.readiness_status === 'Yellow'
                        ? 'bg-amber-400 w-[70%]'
                        : 'bg-red-400 w-[35%]'
                    }`}
                  />
                </div>
              </div>

              {/* AI Insights & Source Attribution */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-2 text-xs leading-relaxed">
                <div className="flex items-center justify-between text-emerald-400 font-bold text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5" /> AI Diagnostic Analysis
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {latestAssessment.engine_source || 'Multi-Factor Engine'}
                  </span>
                </div>
                <p className="text-slate-200">{latestAssessment.ai_insights}</p>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-white/5">
                  Parameters used: Resting HR ({rhr} BPM), SpO₂ ({spo2}%), Sleep ({sleepHours}h), Soreness ({sorenessLevel}/10).
                </div>
              </div>

              {/* Factor Breakdown */}
              <div className="space-y-1.5 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Scoring Breakdown:
                </span>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cardiovascular:</span>
                    <span className="text-white font-bold">{latestAssessment.factors_breakdown?.cardiovascular_autonomic || 95}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sleep & Recovery:</span>
                    <span className="text-white font-bold">{latestAssessment.factors_breakdown?.sleep_cellular_recovery || 92}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Neuromuscular Freshness:</span>
                    <span className="text-white font-bold">{latestAssessment.factors_breakdown?.neuromuscular_soreness || 90}%</span>
                  </div>
                </div>
              </div>

              {/* Recovery Suggestions */}
              {latestAssessment.recovery_suggestions?.length > 0 && (
                <div className="space-y-1.5 text-xs pt-2 border-t border-white/5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Recovery Directives:
                  </span>
                  <ul className="space-y-1">
                    {latestAssessment.recovery_suggestions.map((rec: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel p-8 rounded-2xl text-center text-slate-400 text-xs space-y-2">
              <Activity className="w-8 h-8 text-emerald-400 mx-auto" />
              <p>Submit vitals on the left to evaluate readiness.</p>
            </div>
          )}
        </div>
      </div>

      {/* HISTORICAL READINESS TRENDS */}
      <div className="glass-panel p-5 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Historical Readiness & Vitals Trajectory
            </h3>
            <p className="text-[11px] text-slate-400">Readiness score vs resting heart rate</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block"></span> Readiness
            </span>
            <span className="text-red-400 flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block"></span> Resting HR
            </span>
          </div>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2433" vertical={false} />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} domain={[40, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f121a', borderColor: '#232a3b', borderRadius: '10px', fontSize: '11px' }}
              />
              <Line type="monotone" dataKey="readiness" stroke="#00f59b" strokeWidth={2.5} dot={{ r: 4 }} name="Readiness" />
              <Line type="monotone" dataKey="rhr" stroke="#ef4444" strokeWidth={1.5} dot={{ r: 3 }} name="Resting HR" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
