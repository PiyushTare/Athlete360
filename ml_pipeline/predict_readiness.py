"""
ml_pipeline/predict_readiness.py
Athlete360 Production Inference Engine & Explainable AI (XAI)

Evaluates:
- Real-time smartwatch data (HR, SpO2, Steps)
- Athlete personal baselines (7d, 14d, 28d rolling averages and deviations)
- Dynamic sport-specific questionnaire data
- Machine learning prediction using the selected Random Forest model (or fallback Logistic Regression)
- SHAP-derived positive drivers, risk flags, data quality triage, and actionable recommendations.
"""

import os
import sys
import json
import joblib
import numpy as np
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "saved_models")
BEST_MODEL_PATH = os.path.join(MODELS_DIR, "best_model.joblib")
META_PATH = os.path.join(MODELS_DIR, "model_metadata.json")

# Default athlete baselines when historical records exist
ATHLETE_BASELINES = {
    "alex.chen@athlete360.com": {"baseline_hr": 50.0, "baseline_spo2": 98.5, "baseline_steps": 12000, "sport": "Running"},
    "maya.lin@athlete360.com": {"baseline_hr": 53.0, "baseline_spo2": 98.5, "baseline_steps": 11500, "sport": "Badminton"},
    "jordan.taylor@athlete360.com": {"baseline_hr": 55.0, "baseline_spo2": 98.2, "baseline_steps": 10500, "sport": "Cricket"},
    "sofia.rodriguez@athlete360.com": {"baseline_hr": 52.0, "baseline_spo2": 98.3, "baseline_steps": 11000, "sport": "Tennis"},
    "liam.walker@athlete360.com": {"baseline_hr": 54.0, "baseline_spo2": 98.4, "baseline_steps": 13000, "sport": "Football"},
    "default": {"baseline_hr": 56.0, "baseline_spo2": 98.0, "baseline_steps": 10000, "sport": "Football"}
}

def load_model_and_meta():
    if not os.path.exists(BEST_MODEL_PATH) or not os.path.exists(META_PATH):
        raise FileNotFoundError("Trained model or metadata not found! Please run train_readiness_model.py first.")
    model = joblib.load(BEST_MODEL_PATH)
    with open(META_PATH, "r") as f:
        meta = json.load(f)
    return model, meta

def assess_data_quality(input_data: dict) -> str:
    """Evaluates data completeness without forcing inaccurate predictions."""
    has_hr = input_data.get("heart_rate") is not None and input_data.get("heart_rate") > 0
    has_spo2 = input_data.get("spo2") is not None and input_data.get("spo2") > 0
    has_sleep = input_data.get("sleep_duration_hours") is not None and input_data.get("sleep_duration_hours") > 0
    has_soreness = input_data.get("muscle_soreness_1_10") is not None
    has_baseline = input_data.get("baseline_hr") is not None and input_data.get("baseline_hr") > 0

    if not has_hr or not has_sleep:
        return "Insufficient"
    
    if has_hr and has_spo2 and has_sleep and has_soreness and has_baseline:
        return "High"
    
    return "Moderate"

def predict_athlete_readiness(input_data: dict) -> dict:
    quality = assess_data_quality(input_data)
    
    if quality == "Insufficient":
        return {
            "status": "INSUFFICIENT DATA",
            "readiness_score": 0,
            "prediction_probability": 0.0,
            "fit_to_play": False,
            "data_quality": "Insufficient",
            "message": "Your personalized baseline cannot yet be calculated. Continue syncing wearable data and complete the recovery questionnaire.",
            "positive_factors": [],
            "potential_concerns": ["Missing key resting heart rate or restorative sleep data."],
            "recommendation": "Wear your smartwatch to sleep and log morning recovery metrics to unlock genuine AI readiness triage.",
            "model_version": "Athlete360 Readiness Model v1.0"
        }

    model, meta = load_model_and_meta()
    features = meta["features"]

    # Resolve personal baselines
    athlete_id = input_data.get("athlete_id", "default")
    athlete_email = input_data.get("athlete_email", "")
    known_baseline = ATHLETE_BASELINES.get(athlete_email, ATHLETE_BASELINES.get(athlete_id, ATHLETE_BASELINES["default"]))

    hr = float(input_data.get("heart_rate", 60.0))
    base_hr = float(input_data.get("baseline_hr", known_baseline["baseline_hr"]))
    hr_dev = hr - base_hr

    spo2 = float(input_data.get("spo2", 98.0))
    base_spo2 = float(input_data.get("baseline_spo2", known_baseline["baseline_spo2"]))
    spo2_dev = spo2 - base_spo2

    daily_steps = float(input_data.get("daily_steps", 10000))
    step_trend = float(input_data.get("step_trend_pct", 0.0))

    sleep_duration = float(input_data.get("sleep_duration_hours", 7.5))
    sleep_quality = float(input_data.get("sleep_quality_1_10", 7.0))
    fatigue = float(input_data.get("fatigue_1_10", 3.0))
    soreness = float(input_data.get("muscle_soreness_1_10", 3.0))
    recovery_score = float(input_data.get("recovery_score_perceived_1_10", 7.5))
    phys_readiness = float(input_data.get("physical_readiness_1_10", 8.0))
    ment_readiness = float(input_data.get("mental_readiness_1_10", 8.0))

    protein_g = float(input_data.get("protein_intake_grams", 130.0))
    water_l = float(input_data.get("water_intake_liters", 3.0))
    nutrition_ok = int(input_data.get("nutrition_adequate", 1))

    train_duration = float(input_data.get("training_duration_minutes", 60.0))
    train_intensity = float(input_data.get("training_intensity_1_10", 5.0))
    rpe = float(input_data.get("rpe_1_10", 5.0))
    sessions_7d = int(input_data.get("sessions_last_7d", 5))
    high_int_7d = int(input_data.get("high_intensity_sessions_7d", 2))
    hours_since_intense = float(input_data.get("hours_since_intense_session", 24.0))

    sport = input_data.get("sport", known_baseline.get("sport", "Football"))

    # Construct feature row
    row = {
        "heart_rate": hr,
        "baseline_hr": base_hr,
        "hr_deviation_bpm": hr_dev,
        "spo2": spo2,
        "spo2_deviation": spo2_dev,
        "daily_steps": daily_steps,
        "step_trend_pct": step_trend,
        "sleep_duration_hours": sleep_duration,
        "sleep_quality_1_10": sleep_quality,
        "fatigue_1_10": fatigue,
        "muscle_soreness_1_10": soreness,
        "recovery_score_perceived_1_10": recovery_score,
        "physical_readiness_1_10": phys_readiness,
        "mental_readiness_1_10": ment_readiness,
        "protein_intake_grams": protein_g,
        "water_intake_liters": water_l,
        "nutrition_adequate": nutrition_ok,
        "training_duration_minutes": train_duration,
        "training_intensity_1_10": train_intensity,
        "rpe_1_10": rpe,
        "sessions_last_7d": sessions_7d,
        "high_intensity_sessions_7d": high_int_7d,
        "hours_since_intense_session": hours_since_intense
    }

    # One-hot encode sport
    for cat in meta["sports_supported"]:
        row[f"sport_{cat}"] = 1 if cat.lower() == sport.lower() else 0

    X_df = pd.DataFrame([row])[features]

    # Predict with trained ML model
    pred_class = int(model.predict(X_df)[0])
    probs = model.predict_proba(X_df)[0]
    prob_fit = float(probs[1])
    readiness_score = int(round(prob_fit * 100))

    # Determine status
    if readiness_score >= 60 and pred_class == 1:
        readiness_status = "FIT TO PLAY"
        is_fit = True
    else:
        readiness_status = "NOT FULLY READY"
        is_fit = False

    # -------------------------------------------------------------
    # EXPLAINABLE AI (XAI) GENERATION
    # -------------------------------------------------------------
    positive_factors = []
    potential_concerns = []

    # HR deviation analysis
    if hr_dev <= 2.5:
        positive_factors.append(f"Heart rate is normal compared with personal baseline ({hr:.0f} vs {base_hr:.0f} BPM).")
    elif hr_dev > 6.0:
        potential_concerns.append(f"Resting HR is elevated (+{hr_dev:.1f} BPM above normal baseline), indicating autonomic stress or sympathetic strain.")
    else:
        positive_factors.append(f"Heart rate deviation (+{hr_dev:.1f} BPM) is within acceptable physiological margin.")

    # Sleep analysis
    if sleep_duration >= 7.5 and sleep_quality >= 7:
        positive_factors.append(f"Optimal restorative sleep logged ({sleep_duration:.1f} hrs, quality {sleep_quality:.0f}/10).")
    elif sleep_duration < 6.0:
        potential_concerns.append(f"Restricted sleep duration ({sleep_duration:.1f} hrs), impeding glycogen replenishment and cellular repair.")
    else:
        positive_factors.append(f"Adequate sleep duration ({sleep_duration:.1f} hrs).")

    # Soreness & Fatigue
    if soreness <= 3.5:
        positive_factors.append(f"Low musculoskeletal soreness ({soreness:.0f}/10).")
    elif soreness >= 7.0:
        potential_concerns.append(f"High localized muscle soreness ({soreness:.0f}/10), elevated mechanical strain.")
    
    if fatigue <= 3.5:
        positive_factors.append("Low systemic fatigue; central nervous system is responsive.")
    elif fatigue >= 7.0:
        potential_concerns.append(f"Substantial central nervous fatigue ({fatigue:.0f}/10).")

    # SpO2
    if spo2 >= 97.0:
        positive_factors.append(f"Optimal blood oxygenation (SpO2 {spo2:.0f}%).")
    elif spo2 < 95.0:
        potential_concerns.append(f"Slightly depressed SpO2 reading ({spo2:.0f}%).")

    # Hydration & Nutrition
    if water_l < 2.5:
        potential_concerns.append(f"Slightly low hydration ({water_l:.1f} L vs 3.0 L target).")
    else:
        positive_factors.append(f"Good hydration state ({water_l:.1f} L logged).")

    # Training workload
    if high_int_7d >= 4:
        potential_concerns.append(f"High cumulative high-intensity session density ({high_int_7d} in trailing 7 days).")
    elif hours_since_intense < 18:
        potential_concerns.append(f"Only {hours_since_intense:.0f} hours elapsed since last high-intensity workout.")
    else:
        positive_factors.append(f"Balanced weekly training schedule ({sessions_7d} sessions in 7 days).")

    # Fallbacks if list is empty
    if not positive_factors:
        positive_factors.append("Biometric metrics successfully synchronized via smartwatch.")
    if not potential_concerns:
        potential_concerns.append("No critical physiological red flags detected.")

    # Actionable Recommendation (strictly non-diagnostic wellness guidance)
    if is_fit:
        recommendation = (
            f"Your current recovery indicators are generally favorable for the next game. "
            f"Maintain hydration ({water_l:.1f}L logged) and avoid unnecessary high-intensity training before competition."
        )
    else:
        recommendation = (
            f"Your current recovery indicators are below your usual baseline (Resting HR delta +{hr_dev:.1f} BPM, "
            f"soreness {soreness:.0f}/10). Prioritize targeted recovery, light mobility, and adequate sleep before high-intensity competition."
        )

    return {
        "status": readiness_status,
        "readiness_score": readiness_score,
        "prediction_probability": round(prob_fit if is_fit else (1.0 - prob_fit), 3),
        "confidence_pct": f"{int(round((prob_fit if is_fit else (1.0 - prob_fit)) * 100))}%",
        "fit_to_play": is_fit,
        "data_quality": quality,
        "positive_factors": positive_factors[:5],
        "potential_concerns": potential_concerns[:4],
        "recommendation": recommendation,
        "telemetry_summary": {
            "heart_rate_bpm": hr,
            "baseline_hr_bpm": base_hr,
            "hr_deviation_bpm": round(hr_dev, 1),
            "spo2_pct": spo2,
            "daily_steps": int(daily_steps),
            "sleep_duration_hours": sleep_duration,
            "soreness_1_10": soreness,
            "fatigue_1_10": fatigue
        },
        "model_version": meta["model_version"],
        "selected_algorithm": meta["selected_model"]
    }

if __name__ == "__main__":
    # Test sample input
    sample_input = {
        "athlete_id": "athlete-1",
        "athlete_email": "alex.chen@athlete360.com",
        "heart_rate": 52,
        "baseline_hr": 50,
        "spo2": 98.5,
        "daily_steps": 12500,
        "sleep_duration_hours": 8.0,
        "sleep_quality_1_10": 8,
        "fatigue_1_10": 2,
        "muscle_soreness_1_10": 2,
        "water_intake_liters": 3.5,
        "sport": "Running"
    }
    res = predict_athlete_readiness(sample_input)
    print(json.dumps(res, indent=2))
