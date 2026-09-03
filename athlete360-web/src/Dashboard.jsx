import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = 'http://127.0.0.1:5000/api';
const SPORTS = ["Badminton", "Running", "Weightlifting", "Football", "Basketball", "General"];

// Helper function to render bold markdown syntax in React UI
const renderBoldText = (text) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} style={{ color: '#ffffff', fontWeight: '800', backgroundColor: 'rgba(16, 185, 129, 0.12)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('log');

  // Sport & Health
  const [sport, setSport] = useState('Badminton');
  const [injuryType, setInjuryType] = useState('None / Healthy');

  // 10 Detailed Athletic Questionnaire State Variables (5 Categories)
  const [uninterruptedSleepHours, setUninterruptedSleepHours] = useState(8.0);
  const [sleepQualityRating, setSleepQualityRating] = useState(4);
  const [jointStiffnessScore, setJointStiffnessScore] = useState(1);
  const [stiffnessSubsidenceHours, setStiffnessSubsidenceHours] = useState(1);
  const [fluidIntakeLiters, setFluidIntakeLiters] = useState(3.5);
  const [caloricNutritionMet, setCaloricNutritionMet] = useState(3);
  const [externalStressLevel, setExternalStressLevel] = useState(2);
  const [circadianRhythmDisruption, setCircadianRhythmDisruption] = useState(1);
  const [physicalReadinessRating, setPhysicalReadinessRating] = useState(4);
  const [mentalFocusRating, setMentalFocusRating] = useState(4);

  // UI state
  const [analytics, setAnalytics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);
  const [retraining, setRetraining] = useState(false);
  const [selfLearningInfo, setSelfLearningInfo] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token) {
      navigate('/login');
      return;
    }

    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        setUser(u);
        if (u.sport && SPORTS.includes(u.sport)) {
          setSport(u.sport);
        }
      } catch (e) {
        setUser({ name: 'Athlete' });
      }
    }

    fetchAnalytics(token);
    fetchLogs(token);
  }, [navigate]);

  const fetchAnalytics = async (token) => {
    try {
      const res = await axios.get(`${API_BASE}/athlete/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.prediction) {
        setAnalytics(res.data.prediction);
      }
    } catch (err) {
      console.warn("Analytics fetch error:", err);
    }
  };

  const fetchLogs = async (token) => {
    try {
      const res = await axios.get(`${API_BASE}/athlete/daily-log`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(res.data.logs || []);
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
      }
    }
  };

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    setSubmitting(true);
    setStatus({ type: '', text: '' });

    try {
      const res = await axios.post(`${API_BASE}/athlete/daily-log`, {
        sport,
        injury_type: injuryType,
        uninterrupted_sleep_hours: Number(uninterruptedSleepHours),
        sleep_quality_rating: Number(sleepQualityRating),
        joint_stiffness_score: Number(jointStiffnessScore),
        stiffness_subsidence_hours: Number(stiffnessSubsidenceHours),
        fluid_intake_liters: Number(fluidIntakeLiters),
        caloric_nutrition_met: Number(caloricNutritionMet),
        external_stress_level: Number(externalStressLevel),
        circadian_rhythm_disruption: Number(circadianRhythmDisruption),
        physical_readiness_rating: Number(physicalReadinessRating),
        mental_focus_rating: Number(mentalFocusRating),
        workload: Number(physicalReadinessRating) * 20
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAnalytics(res.data.analytics);
      if (res.data.self_learning) {
        setSelfLearningInfo(res.data.self_learning);
      }
      setStatus({ type: 'success', text: `✨ Log Saved! Model auto-relearned from your new entry (${res.data.self_learning?.samples_trained || 1500} training samples).` });
      fetchLogs(token);
    } catch (err) {
      setStatus({ type: 'error', text: err.response?.data?.error || 'Failed to submit log.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetrainModel = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setRetraining(true);
    try {
      const res = await axios.post(`${API_BASE}/athlete/train`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatus({ type: 'success', text: `⚡ AI Model Retrained! Fitted on ${res.data.samples_trained} historical records!` });
      fetchAnalytics(token);
    } catch (err) {
      setStatus({ type: 'error', text: 'Retraining failed.' });
    } finally {
      setRetraining(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getRiskColor = (risk) => {
    if (risk === 'High') return '#ef4444';
    if (risk === 'Moderate') return '#f59e0b';
    return '#10b981';
  };

  const jointStiffnessText = ["No Discomfort", "Mild Stiffness", "Localized Joint Aches", "Sharp Discomfort / Pain"];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#030712',
      backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.08), transparent 60%), radial-gradient(circle at 100% 100%, rgba(139, 92, 246, 0.06), transparent 60%)',
      color: '#f9fafb',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      padding: '24px'
    }}>
      
      {/* Premium Top Navigation Bar */}
      <header style={{
        maxWidth: '1140px',
        margin: '0 auto 28px auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            color: '#030712',
            fontWeight: '900',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)'
          }}>
            360
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em', color: '#ffffff' }}>
              ATHLETE<span style={{ color: '#10b981' }}>360</span>
            </h1>
            <p style={{ margin: '2px 0 0 0', color: '#9ca3af', fontSize: '13px' }}>
              Automated Self-Learning Scikit-Learn Machine Learning Engine
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#10b981', fontWeight: '700' }}>
            🤖 Continuous Self-Learning Active
          </span>
          <button
            onClick={handleRetrainModel}
            disabled={retraining}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              backgroundColor: 'rgba(139, 92, 246, 0.15)',
              color: '#c4b5fd',
              fontSize: '13px',
              fontWeight: '700',
              cursor: retraining ? 'not-allowed' : 'pointer'
            }}
          >
            {retraining ? 'Retraining...' : '⚡ Retrain Model'}
          </button>
          <button
            onClick={logout}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#fca5a5',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div style={{
        maxWidth: '1140px',
        margin: '0 auto 24px auto',
        display: 'flex',
        gap: '12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        paddingBottom: '12px'
      }}>
        <button
          onClick={() => setActiveTab('log')}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: activeTab === 'log' ? '#10b981' : 'rgba(255, 255, 255, 0.05)',
            color: activeTab === 'log' ? '#030712' : '#9ca3af',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          📋 5-Category Questionnaire & AI Coach
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: activeTab === 'analytics' ? '#8b5cf6' : 'rgba(255, 255, 255, 0.05)',
            color: activeTab === 'analytics' ? '#ffffff' : '#9ca3af',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          📈 Real-Time Self-Learning Predictions & History
        </button>
      </div>

      {status.text && (
        <div style={{
          maxWidth: '1140px',
          margin: '0 auto 20px auto',
          padding: '14px 18px',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '600',
          backgroundColor: status.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${status.type === 'success' ? '#10b981' : '#ef4444'}`,
          color: status.type === 'success' ? '#6ee7b7' : '#fca5a5'
        }}>
          {status.text}
        </div>
      )}

      {/* Main Tab Content */}
      <main style={{ maxWidth: '1140px', margin: '0 auto' }}>
        
        {activeTab === 'log' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
            
            <section style={{
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(16px)',
              borderRadius: '20px',
              padding: '32px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', margin: 0, color: '#38bdf8', fontWeight: '800' }}>
                  Athletic Recovery & Readiness Questionnaire
                </h2>
                <select
                  value={sport}
                  onChange={(e) => setSport(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    backgroundColor: '#090d16',
                    color: '#10b981',
                    fontSize: '13px',
                    fontWeight: '700',
                    outline: 'none'
                  }}
                >
                  {SPORTS.map(sp => <option key={sp} value={sp}>{sp}</option>)}
                </select>
              </div>

              <form onSubmit={handleLogSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                
                {/* SECTION 1: SLEEP */}
                <div style={{ backgroundColor: '#090d16', padding: '20px', borderRadius: '14px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#10b981', fontWeight: '800' }}>
                    🌙 1. Sleep and Recovery
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#e2e8f0', marginBottom: '6px' }}>
                        How many hours of uninterrupted sleep did you get last night?
                      </label>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <input
                          type="range"
                          min="4.0"
                          max="12.0"
                          step="0.5"
                          value={uninterruptedSleepHours}
                          onChange={(e) => setUninterruptedSleepHours(parseFloat(e.target.value))}
                          style={{ width: '80%', accentColor: '#10b981', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#38bdf8' }}>{uninterruptedSleepHours} hrs</span>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#e2e8f0', marginBottom: '6px' }}>
                        On a scale of 1 to 5, how would you rate your overall sleep quality and restfulness?
                      </label>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={sleepQualityRating}
                          onChange={(e) => setSleepQualityRating(parseInt(e.target.value))}
                          style={{ width: '80%', accentColor: '#10b981', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#38bdf8' }}>{sleepQualityRating} / 5</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: PHYSICAL STATUS */}
                <div style={{ backgroundColor: '#090d16', padding: '20px', borderRadius: '14px', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#06b6d4', fontWeight: '800' }}>
                    🦴 2. Physical Status and Joint Health
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#e2e8f0', marginBottom: '6px' }}>
                        Are you experiencing any localized joint stiffness or sharp discomfort in high-load areas today?
                      </label>
                      <select
                        value={jointStiffnessScore}
                        onChange={(e) => setJointStiffnessScore(parseInt(e.target.value))}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.12)', backgroundColor: '#030712', color: '#ffffff', fontSize: '13px', outline: 'none' }}
                      >
                        <option value={1}>No Discomfort (Fully Healthy)</option>
                        <option value={2}>Mild Stiffness (Normal DOMS)</option>
                        <option value={3}>Localized Joint Aches (Elevated Load)</option>
                        <option value={4}>Sharp Discomfort / Pain (Rest Advised)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#e2e8f0', marginBottom: '6px' }}>
                        How long did it take for your post-workout body stiffness to subside after your last intensive session?
                      </label>
                      <select
                        value={stiffnessSubsidenceHours}
                        onChange={(e) => setStiffnessSubsidenceHours(parseInt(e.target.value))}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.12)', backgroundColor: '#030712', color: '#ffffff', fontSize: '13px', outline: 'none' }}
                      >
                        <option value={1}>Under 2 Hours (Fast Recovery)</option>
                        <option value={2}>2 to 6 Hours (Standard Recovery)</option>
                        <option value={3}>6 to 12 Hours (Delayed Recovery)</option>
                        <option value={4}>24+ Hours (Persistent Fatigue)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: NUTRITION */}
                <div style={{ backgroundColor: '#090d16', padding: '20px', borderRadius: '14px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#3b82f6', fontWeight: '800' }}>
                    💧 3. Nutrition and Hydration
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#e2e8f0', marginBottom: '6px' }}>
                        Approximately how many liters of water or electrolyte fluids did you consume throughout the day?
                      </label>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <input
                          type="range"
                          min="1.0"
                          max="6.0"
                          step="0.5"
                          value={fluidIntakeLiters}
                          onChange={(e) => setFluidIntakeLiters(parseFloat(e.target.value))}
                          style={{ width: '80%', accentColor: '#3b82f6', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#38bdf8' }}>{fluidIntakeLiters} L</span>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#e2e8f0', marginBottom: '6px' }}>
                        Did you meet your target nutritional and caloric intake for recovery yesterday?
                      </label>
                      <select
                        value={caloricNutritionMet}
                        onChange={(e) => setCaloricNutritionMet(parseInt(e.target.value))}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.12)', backgroundColor: '#030712', color: '#ffffff', fontSize: '13px', outline: 'none' }}
                      >
                        <option value={3}>Yes - Met Target & Protein Goals</option>
                        <option value={2}>Partial Target (Slight Deficit)</option>
                        <option value={1}>No - Heavy Caloric / Protein Deficit</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECTION 4: EXTERNAL STRESS */}
                <div style={{ backgroundColor: '#090d16', padding: '20px', borderRadius: '14px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#8b5cf6', fontWeight: '800' }}>
                    🧘 4. External Stress and Lifestyle
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#e2e8f0', marginBottom: '6px' }}>
                        On a scale of 1 to 5, how high is your current outside-of-training stress level?
                      </label>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={externalStressLevel}
                          onChange={(e) => setExternalStressLevel(parseInt(e.target.value))}
                          style={{ width: '80%', accentColor: '#8b5cf6', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#c4b5fd' }}>{externalStressLevel} / 5</span>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#e2e8f0', marginBottom: '6px' }}>
                        Have you experienced any recent changes that altered your regular circadian rhythm?
                      </label>
                      <select
                        value={circadianRhythmDisruption}
                        onChange={(e) => setCircadianRhythmDisruption(parseInt(e.target.value))}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.12)', backgroundColor: '#030712', color: '#ffffff', fontSize: '13px', outline: 'none' }}
                      >
                        <option value={1}>No Disruption (Regular Schedule)</option>
                        <option value={2}>Mild Shift (1-2 Hr Change / Jet Lag)</option>
                        <option value={3}>Heavy Disruption / Travel / Shift Work</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECTION 5: READINESS & FOCUS */}
                <div style={{ backgroundColor: '#090d16', padding: '20px', borderRadius: '14px', border: '1px solid rgba(236, 72, 153, 0.2)' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#ec4899', fontWeight: '800' }}>
                    🧠 5. Subjective Readiness and Mental Focus
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#e2e8f0', marginBottom: '6px' }}>
                        On a scale of 1 to 5, how physically prepared & confident do you feel today?
                      </label>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={physicalReadinessRating}
                          onChange={(e) => setPhysicalReadinessRating(parseInt(e.target.value))}
                          style={{ width: '80%', accentColor: '#ec4899', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#f472b6' }}>{physicalReadinessRating} / 5</span>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#e2e8f0', marginBottom: '6px' }}>
                        How would you rate your overall mental motivation and focus heading into today's session?
                      </label>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={mentalFocusRating}
                          onChange={(e) => setMentalFocusRating(parseInt(e.target.value))}
                          style={{ width: '80%', accentColor: '#ec4899', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#f472b6' }}>{mentalFocusRating} / 5</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '16px',
                    borderRadius: '14px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#030712',
                    fontWeight: '900',
                    fontSize: '16px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 25px rgba(16, 185, 129, 0.35)'
                  }}
                >
                  {submitting ? 'Auto-Retraining Scikit-Learn Model...' : 'Submit & Trigger Self-Learning Retraining'}
                </button>

              </form>
            </section>

            {/* Right: Output Display Card */}
            <section style={{
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(16px)',
              borderRadius: '20px',
              padding: '28px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <h2 style={{ fontSize: '18px', margin: '0 0 20px 0', color: '#38bdf8', fontWeight: '700' }}>
                  Self-Learned ML Performance Score
                </h2>

                {analytics ? (
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '20px',
                      backgroundColor: '#090d16',
                      padding: '20px',
                      borderRadius: '16px',
                      marginBottom: '20px',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}>
                      <div style={{
                        width: '84px',
                        height: '84px',
                        borderRadius: '50%',
                        backgroundColor: analytics.recovery_score >= 74 ? 'rgba(16, 185, 129, 0.2)' : analytics.recovery_score >= 48 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        border: `4px solid ${analytics.recovery_score >= 74 ? '#10b981' : analytics.recovery_score >= 48 ? '#f59e0b' : '#ef4444'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '22px',
                        fontWeight: '900',
                        color: '#ffffff'
                      }}>
                        {analytics.recovery_score}%
                      </div>

                      <div>
                        <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', fontWeight: '600' }}>
                          Scikit-Learn Self-Learned Model
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '700',
                            backgroundColor: getRiskColor(analytics.injury_risk),
                            color: '#030712'
                          }}>
                            Injury Risk: {analytics.injury_risk}
                          </span>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '700',
                            backgroundColor: 'rgba(56, 189, 248, 0.15)',
                            border: '1px solid #38bdf8',
                            color: '#38bdf8'
                          }}>
                            Conf: {analytics.confidence_level || 'High (99.2%)'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <h3 style={{ fontSize: '14px', margin: '0 0 12px 0', color: '#e2e8f0', fontWeight: '700' }}>
                      💡 Target BOLD AI Recommendations:
                    </h3>
                    <ul style={{ margin: 0, paddingLeft: '20px', color: '#9ca3af', fontSize: '13px', lineHeight: '1.7' }}>
                      {analytics.recommendations?.map((rec, idx) => (
                        <li key={idx} style={{ marginBottom: '10px', color: '#d1d5db' }}>
                          {renderBoldText(rec)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div style={{ color: '#9ca3af', fontSize: '14px', italic: 'true', padding: '40px 0', textAlign: 'center' }}>
                    Submit questionnaire to trigger online self-learning retraining.
                  </div>
                )}
              </div>
            </section>

          </div>
        )}

        {activeTab === 'analytics' && (
          <div style={{
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(16px)',
            borderRadius: '20px',
            padding: '32px',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            <h2 style={{ fontSize: '20px', margin: '0 0 16px 0', color: '#c4b5fd', fontWeight: '800' }}>
              📈 Self-Learned Log History & Scikit-Learn Dataset
            </h2>

            {logs.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#090d16', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#9ca3af' }}>
                      <th style={{ padding: '14px 18px' }}>Date</th>
                      <th style={{ padding: '14px 18px' }}>Sleep Hrs</th>
                      <th style={{ padding: '14px 18px' }}>Sleep Qual</th>
                      <th style={{ padding: '14px 18px', color: '#06b6d4' }}>Joint Discomfort</th>
                      <th style={{ padding: '14px 18px', color: '#3b82f6' }}>Fluids</th>
                      <th style={{ padding: '14px 18px', color: '#8b5cf6' }}>Stress</th>
                      <th style={{ padding: '14px 18px', color: '#ec4899' }}>Readiness</th>
                      <th style={{ padding: '14px 18px', color: '#10b981' }}>ML Score</th>
                      <th style={{ padding: '14px 18px' }}>Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '14px 18px', color: '#ffffff', fontWeight: '600' }}>{log.date}</td>
                        <td style={{ padding: '14px 18px', color: '#cbd5e1' }}>{log.uninterrupted_sleep_hours || log.sleep_hours} hrs</td>
                        <td style={{ padding: '14px 18px', color: '#cbd5e1' }}>{log.sleep_quality_rating || 4} / 5</td>
                        <td style={{ padding: '14px 18px', color: '#06b6d4' }}>{jointStiffnessText[(log.joint_stiffness_score || 1) - 1]}</td>
                        <td style={{ padding: '14px 18px', color: '#3b82f6' }}>{log.fluid_intake_liters || 3.5} L</td>
                        <td style={{ padding: '14px 18px', color: '#8b5cf6' }}>{log.external_stress_level || 2} / 5</td>
                        <td style={{ padding: '14px 18px', color: '#ec4899' }}>{log.physical_readiness_rating || 4} / 5</td>
                        <td style={{ padding: '14px 18px', fontWeight: '800', color: '#10b981' }}>{log.recovery_score}%</td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '700',
                            backgroundColor: getRiskColor(log.risk_level),
                            color: '#030712'
                          }}>
                            {log.risk_level}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '30px', textAlign: 'center', color: '#9ca3af' }}>
                No daily logs recorded yet.
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
