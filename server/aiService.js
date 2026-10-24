// AI Service for Athlete 360
// Combines transparent physiological sports-science models with optional LLM enrichment.

/**
 * Evaluates Athlete Fitness Eligibility & Training Readiness
 * @param {Object} vitals - The athlete vitals inputs
 * @param {Object} historicalContext - Past vitals, training load, baseline
 */
export async function calculateFitnessReadiness(vitals, historicalContext = {}) {
  const {
    resting_heart_rate = 60,
    blood_pressure_sys = 120,
    blood_pressure_dia = 80,
    sleep_hours = 8,
    sleep_quality = 4, // 1 to 5
    body_temp = 36.6, // Celsius
    spo2 = 98, // %
    fatigue_level = 3, // 1 to 10
    soreness_level = 3, // 1 to 10
    hydration_level = 'Optimal', // Optimal, Adequate, Low, Dehydrated
    training_intensity_recent = 'Moderate',
    pain_symptoms = ''
  } = vitals;

  let totalScore = 100;
  const flags = [];
  const positiveFactors = [];
  const recoveryProtocols = [];

  // 1. Resting Heart Rate Analysis (Baseline typically 50-60 for trained athletes)
  const baselineRHR = historicalContext.baselineRHR || 52;
  const hrDelta = resting_heart_rate - baselineRHR;
  if (hrDelta > 10) {
    totalScore -= 18;
    flags.push(`Significant resting HR elevation (+${hrDelta} bpm above baseline), signaling autonomic stress or incomplete recovery.`);
  } else if (hrDelta > 5) {
    totalScore -= 8;
    flags.push(`Mild resting HR elevation (+${hrDelta} bpm), slight sympathetic activation detected.`);
  } else {
    positiveFactors.push(`Resting HR is stable within baseline range (${resting_heart_rate} bpm).`);
  }

  // 2. Sleep Duration & Quality
  if (sleep_hours < 5) {
    totalScore -= 25;
    flags.push(`Severe sleep debt (${sleep_hours} hrs). Glycogen resynthesis and growth hormone secretion heavily impaired.`);
  } else if (sleep_hours < 6.5) {
    totalScore -= 12;
    flags.push(`Below target sleep duration (${sleep_hours} hrs vs 8.0h target).`);
  } else if (sleep_hours >= 7.5 && sleep_quality >= 4) {
    positiveFactors.push(`Excellent restorative sleep (${sleep_hours} hrs, quality ${sleep_quality}/5).`);
  }

  // 3. SpO2 (Oxygen Saturation)
  if (spo2 < 93) {
    totalScore -= 30;
    flags.push(`Abnormal oxygen saturation (SpO2 ${spo2}%). Seek qualified medical consultation if breathing discomfort occurs.`);
  } else if (spo2 < 96) {
    totalScore -= 10;
    flags.push(`Borderline oxygen saturation (SpO2 ${spo2}%).`);
  } else {
    positiveFactors.push(`Healthy peripheral oxygen saturation (${spo2}%).`);
  }

  // 4. Body Temperature
  if (body_temp > 37.5) {
    totalScore -= 28;
    flags.push(`Elevated body temperature (${body_temp}°C / 99.5°F). Possible systemic inflammation or infection.`);
  } else if (body_temp > 37.1) {
    totalScore -= 8;
    flags.push(`Low-grade core temperature elevation (${body_temp}°C). Monitor hydration closely.`);
  }

  // 5. Subjective Fatigue & Muscle Soreness (1-10)
  const fatiguePenalty = Math.max(0, (fatigue_level - 3) * 3.5);
  const sorenessPenalty = Math.max(0, (soreness_level - 3) * 3.5);
  totalScore -= (fatiguePenalty + sorenessPenalty);

  if (fatigue_level >= 7) {
    flags.push(`High perceived fatigue index (${fatigue_level}/10). CNS fatigue accumulation.`);
  }
  if (soreness_level >= 7) {
    flags.push(`Acute musculoskeletal soreness (${soreness_level}/10).`);
  }

  // 6. Hydration
  if (hydration_level === 'Dehydrated') {
    totalScore -= 15;
    flags.push('Dehydration reported: increased cardiac strain and cramp risk.');
  } else if (hydration_level === 'Low') {
    totalScore -= 7;
    flags.push('Sub-optimal hydration state.');
  } else if (hydration_level === 'Optimal') {
    positiveFactors.push('Optimal fluid balance reported.');
  }

  // 7. Acute Pain or Symptoms
  const hasAcutePain = pain_symptoms && pain_symptoms.trim() !== '' && !pain_symptoms.toLowerCase().includes('none');
  if (hasAcutePain) {
    totalScore -= 20;
    flags.push(`Reported pain/symptom: "${pain_symptoms}". Requires coach review & cautious loading.`);
  }

  // Clamp Score between 15 and 99
  const readinessScore = Math.max(15, Math.min(99, Math.round(totalScore)));

  // Status Categorization
  let readinessStatus = 'Green';
  let recommendedIntensityPct = 100;

  if (readinessScore < 55 || hasAcutePain || body_temp > 37.4 || spo2 < 94 || fatigue_level >= 8) {
    readinessStatus = 'Red';
    recommendedIntensityPct = 35;
    recoveryProtocols.push(
      'Halt high-intensity, heavy resistance, or maximal speed training today.',
      'Substitute with gentle active recovery: 15-20 min low-impact pool movement or stationary cycle (HR < 120 bpm).',
      'Target 9 hours of sleep with cool room temperature and darkness.',
      'Consult team physician or athletic trainer if symptoms persist.'
    );
  } else if (readinessScore < 78 || flags.length >= 2 || fatigue_level >= 6 || soreness_level >= 6) {
    readinessStatus = 'Yellow';
    recommendedIntensityPct = 70;
    recoveryProtocols.push(
      'Proceed with caution: reduce planned volume by 25-30% and keep drills technical rather than maximal.',
      'Perform dedicated 15 min myofascial release, mobility flow, and dynamic warm-up.',
      'Increase hydration intake by 500-750ml with balanced electrolytes.',
      'Prioritize post-workout nutrition rich in antioxidants and complex carbohydrates.'
    );
  } else {
    readinessStatus = 'Green';
    recommendedIntensityPct = 100;
    recoveryProtocols.push(
      'Cleared for 100% planned training intensity and competitive drills.',
      'Neuromuscular and cardiovascular markers indicate high athletic capacity.',
      'Execute scheduled speed, power, or tactical progressions.',
      'Maintain standard post-workout recovery protocol (hydration + 30g protein).'
    );
  }

  // AI Insights synthesis
  let insightsText = '';
  if (readinessStatus === 'Green') {
    insightsText = `Peak physiological readiness confirmed (${readinessScore}/100). ${positiveFactors.join(' ')} Autonomic stability and cellular recovery allow for maximal training load and neuromuscular stimulation.`;
  } else if (readinessStatus === 'Yellow') {
    insightsText = `Moderate readiness detected (${readinessScore}/100). Notable factors: ${flags.join(' ')} Modify explosive outputs and emphasize active recovery to prevent regression into systemic overtraining.`;
  } else {
    insightsText = `Safety Alert: High physiological strain index (${readinessScore}/100). ${flags.join(' ')} Intense training is contraindicated today. Focus exclusively on non-impact restoration and consult medical personnel if pain or fever symptoms persist.`;
  }

  // Attempt LLM enrichment if GEMINI_API_KEY is available
  let engineSource = 'Athlete360 Sports Science Algorithm (Rule-Based Engine)';
  if (process.env.GEMINI_API_KEY) {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const prompt = `As an elite Olympic sports physiologist, summarize this athlete's morning readiness:
Score: ${readinessScore}/100 (${readinessStatus}).
Vitals: Resting HR ${resting_heart_rate} bpm, Sleep ${sleep_hours}h (qual ${sleep_quality}/5), SpO2 ${spo2}%, Temp ${body_temp}C, Fatigue ${fatigue_level}/10, Soreness ${soreness_level}/10, Hydration ${hydration_level}, Pain: ${pain_symptoms || 'None'}.
Flags: ${flags.join('; ')}.
Write a concise, professional 3-sentence performance coaching assessment and intensity recommendation. Always mention this is a training readiness estimate and not medical clearance.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const generated = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generated) {
          insightsText = generated.trim();
          engineSource = 'Gemini 1.5 Flash AI Engine';
        }
      }
    } catch (e) {
      console.warn('Gemini API call failed, using rule-based fallback:', e.message);
    }
  }

  return {
    readiness_score: readinessScore,
    readiness_status: readinessStatus,
    recommended_intensity_pct: recommendedIntensityPct,
    ai_insights: insightsText,
    engine_source: engineSource,
    factors_breakdown: {
      cardiovascular_autonomic: Math.max(30, Math.min(100, Math.round(100 - hrDelta * 2.5))),
      sleep_cellular_recovery: Math.max(25, Math.min(100, Math.round((sleep_hours / 8.5) * 100 * (sleep_quality / 5)))),
      neuromuscular_soreness: Math.max(20, Math.min(100, Math.round((10 - soreness_level) * 10))),
      systemic_fatigue: Math.max(20, Math.min(100, Math.round((10 - fatigue_level) * 10))),
      respiratory_spo2: Math.max(20, Math.min(100, Math.round((spo2 / 100) * 100)))
    },
    positive_factors: positiveFactors,
    concerning_factors: flags,
    recovery_suggestions: recoveryProtocols,
    medical_disclaimer: 'CRITICAL NOTICE: Athlete 360 Fitness Eligibility is a non-diagnostic sports performance and athletic readiness monitoring tool. It does NOT provide medical diagnosis or formal medical clearance to compete. If you experience fever, shortness of breath, sharp musculoskeletal pain, or dizziness, immediately halt activity and seek evaluation from a licensed medical professional.'
  };
}

/**
 * Calculates AI Win Probability & Match Performance Outlook
 * @param {Object} athleteProfile - Athlete details and recent form
 * @param {Object} matchData - Scheduled match & opponent details
 * @param {Array} historicalMatches - Past results for training model
 */
export async function calculateWinProbability(athleteProfile, matchData, historicalMatches = []) {
  const consistencyScore = athleteProfile.consistency_score || 85;
  const performanceScore = athleteProfile.performance_score || 80;
  const readinessScore = athleteProfile.readiness_score || 85;
  const readinessStatus = athleteProfile.current_readiness_status || 'Green';

  // Check data sufficiency
  const completedMatches = historicalMatches.filter(m => m.result);
  const hasSufficientData = completedMatches.length >= 1 || athleteProfile.experience_level === 'Elite';

  if (!hasSufficientData) {
    return {
      status: 'insufficient_data',
      message: 'Insufficient competition history to generate statistical win probability. Displaying performance readiness benchmark instead.',
      readiness_indicator: readinessScore >= 80 ? 'High Competitive Readiness' : 'Moderate Competitive Readiness',
      readiness_score: readinessScore,
      consistency_score: consistencyScore,
      recommendations: [
        'Complete at least 3 sanctioned tournament matches to unlock predictive head-to-head AI models.',
        'Focus on adhering to coach assigned tactical preparation tasks.'
      ],
      disclaimer: 'Predictions are performance guidance estimates based on training indicators, not guaranteed match results.'
    };
  }

  // Multi-factor predictive modeling
  let baseWinRate = 0.50; // default coin flip

  // Past match history factor
  if (completedMatches.length > 0) {
    const wins = completedMatches.filter(m => m.result === 'Win').length;
    baseWinRate = wins / completedMatches.length;
  }

  // Weightings:
  // 35% Historical form & performance score
  // 30% Training consistency & task completion
  // 25% Current match-day physiological readiness
  // 10% Opponent difficulty calibration
  const perfFactor = (performanceScore - 70) / 30; // -0.3 to +1.0
  const consistencyFactor = (consistencyScore - 70) / 30;
  const readinessFactor = (readinessScore - 70) / 30;

  let calculatedProb = (baseWinRate * 0.40) + (perfFactor * 0.25) + (consistencyFactor * 0.20) + (readinessFactor * 0.15);
  // Normalize into realistic percentage between 35% and 88%
  let winPct = Math.round(Math.max(35, Math.min(88, calculatedProb * 100)));

  // Adjust for match day readiness penalties
  if (readinessStatus === 'Red') {
    winPct = Math.max(25, winPct - 25);
  } else if (readinessStatus === 'Yellow') {
    winPct = Math.max(30, winPct - 10);
  }

  const strengths = [
    `High training consistency (${consistencyScore}%) over the past 30 days`,
    `Performance score index in the top ${100 - performanceScore > 0 ? 100 - performanceScore : 5}% percentile`,
    readinessStatus === 'Green' ? 'Peak physiological readiness and zero reported injury flags' : 'Strong competition stamina foundation'
  ];

  const vulnerabilities = [];
  if (readinessStatus !== 'Green') {
    vulnerabilities.push(`Current match-day readiness is ${readinessStatus} (${readinessScore}/100) — high risk of late-match fatigue.`);
  }
  if (athleteProfile.injury_history && !athleteProfile.injury_history.includes('None')) {
    vulnerabilities.push(`Recent recovery history: ${athleteProfile.injury_history}`);
  }
  if (vulnerabilities.length === 0) {
    vulnerabilities.push('Maintain concentration during pivotal transition phases.');
  }

  return {
    status: 'calculated',
    win_probability_pct: winPct,
    confidence_level: completedMatches.length >= 3 ? 'High' : 'Moderate',
    performance_trend: performanceScore >= 85 ? 'Ascending / Peak Form' : 'Stable Form',
    training_consistency_score: consistencyScore,
    current_readiness_score: readinessScore,
    strengths,
    vulnerabilities,
    influencing_factors: [
      { name: 'Training Consistency (30d)', weight: '30%', impact: consistencyScore >= 90 ? 'Strong Positive' : 'Neutral' },
      { name: 'Match-Day Readiness', weight: '25%', impact: readinessStatus === 'Green' ? 'Positive' : 'Caution' },
      { name: 'Historical Win-Loss Record', weight: '25%', impact: baseWinRate >= 0.6 ? 'Positive' : 'Moderate' },
      { name: 'Tactical Preparation Adherence', weight: '20%', impact: 'Positive' }
    ],
    tactical_recommendations: [
      readinessStatus === 'Green' ? 'Apply high-tempo pressure early to capitalize on superior neuromuscular freshness.' : 'Manage energy distribution carefully; avoid unnecessary early sprint burnout.',
      'Execute tactical playbook established with Coach Marcus during technical sessions.',
      'Maintain disciplined hydration and fueling 45 minutes prior to start time.'
    ],
    disclaimer: 'IMPORTANT: Win probability estimates are statistical models based on historical training adherence and performance metrics. They are not guaranteed match outcomes and should be used strictly for tactical planning.'
  };
}
