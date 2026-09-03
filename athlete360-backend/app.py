import os
from datetime import datetime, timedelta
from functools import wraps
import jwt
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash

import database
import ml_model

app = Flask(__name__)
# Enable CORS globally for all routes
CORS(app, resources={r"/api/*": {"origins": "*"}})

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "athlete360-super-secret-jwt-key-2026")

# Initialize SQLite database tables on startup
database.init_db()

# Ensure default test user exists for easy testing
def ensure_default_user():
    test_user = database.get_user_by_email("athlete@test.com")
    if not test_user:
        hashed = generate_password_hash("securepassword")
        database.create_user("Test Athlete", "athlete@test.com", hashed, role="athlete", sport="General")

ensure_default_user()

# Initial self-learning training on startup
if not os.path.exists(ml_model.MODEL_FILE) or not os.path.exists(ml_model.INJURY_MODEL_FILE):
    df_logs = database.get_all_daily_logs_dataframe()
    ml_model.train_model(df_logs)

# ---------------------------------------------------------------------------
# Bearer Token Decorator (PyJWT)
# ---------------------------------------------------------------------------

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get("Authorization")
        
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            
        if not token:
            return jsonify({"error": "Authorization token is missing"}), 401
            
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            current_user = database.get_user_by_id(payload["user_id"])
            if not current_user:
                return jsonify({"error": "User not found"}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
            
        return f(current_user, *args, **kwargs)
    return decorated

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Athlete360 Self-Learning Scikit-Learn API is running",
        "status": "online",
        "self_learning": True,
        "version": "2.6.0"
    }), 200

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    name = data.get("name", "Athlete").strip()
    role = data.get("role", "athlete").strip().lower()
    sport = data.get("sport", "General").strip()

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    if database.get_user_by_email(email):
        return jsonify({"error": "User already exists with this email"}), 409

    password_hash = generate_password_hash(password)
    user = database.create_user(name=name, email=email, password_hash=password_hash, role=role, sport=sport)

    if not user:
        return jsonify({"error": "Failed to create user"}), 500

    return jsonify({
        "message": "User registered successfully",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "sport": user["sport"]
        }
    }), 201

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = database.get_user_by_email(email)

    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Invalid email or password"}), 401

    token_payload = {
        "user_id": user["id"],
        "email": user["email"],
        "role": user["role"],
        "exp": datetime.utcnow() + timedelta(days=1)
    }
    
    access_token = jwt.encode(token_payload, SECRET_KEY, algorithm="HS256")

    return jsonify({
        "access_token": access_token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "sport": user.get("sport", "General")
        }
    }), 200

@app.route("/api/athlete/daily-log", methods=["POST"])
@token_required
def submit_daily_log(current_user):
    data = request.get_json() or {}
    
    data_dict = {
        "sport": data.get("sport", current_user.get("sport", "General")),
        "injury_type": data.get("injury_type", "None / Healthy"),
        "uninterrupted_sleep_hours": float(data.get("uninterrupted_sleep_hours", 8.0)),
        "sleep_quality_rating": int(data.get("sleep_quality_rating", 4)),
        "joint_stiffness_score": int(data.get("joint_stiffness_score", 1)),
        "stiffness_subsidence_hours": int(data.get("stiffness_subsidence_hours", 1)),
        "fluid_intake_liters": float(data.get("fluid_intake_liters", 3.5)),
        "caloric_nutrition_met": int(data.get("caloric_nutrition_met", 3)),
        "external_stress_level": int(data.get("external_stress_level", 2)),
        "circadian_rhythm_disruption": int(data.get("circadian_rhythm_disruption", 1)),
        "physical_readiness_rating": int(data.get("physical_readiness_rating", 4)),
        "mental_focus_rating": int(data.get("mental_focus_rating", 4)),
        "diet_adherence": int(data.get("diet_adherence", 4)),
        "soreness_level": int(data.get("joint_stiffness_score", 1)) * 2,
        "workload": int(data.get("workload", 50)),
        "attendance_status": data.get("attendance_status", "present")
    }

    # 1. Run inference using current Scikit-Learn RandomForest estimator
    analytics = ml_model.predict_recovery(data_dict)

    recommendations_str = " | ".join(analytics["recommendations"])

    # 2. Save new log to SQLite database
    saved_log = database.save_daily_log(
        athlete_id=current_user["id"],
        data_dict=data_dict,
        recovery_score=analytics["recovery_score"],
        risk_level=analytics["injury_risk"],
        recommendations=recommendations_str
    )

    # 3. AUTOMATED SELF-LEARNING STEP: Automatically relearn from updated DB dataset!
    relearn_result = ml_model.auto_relearn_from_database(database.get_all_daily_logs_dataframe)

    return jsonify({
        "message": "Daily log recorded & model self-learned automatically from new entry!",
        "log": saved_log,
        "analytics": analytics,
        "self_learning": {
            "status": "relearned",
            "samples_trained": int(relearn_result.get("samples_trained", 0)),
            "training_cycles": int(relearn_result.get("training_cycles", 1))
        }
    }), 201

@app.route("/api/athlete/daily-log", methods=["GET"])
@token_required
def get_daily_logs(current_user):
    logs = database.get_athlete_daily_logs(current_user["id"])
    return jsonify({
        "logs": logs
    }), 200

@app.route("/api/athlete/analytics", methods=["GET"])
@token_required
def get_athlete_analytics(current_user):
    logs = database.get_athlete_daily_logs(current_user["id"], limit=1)
    
    if logs and len(logs) > 0:
        latest_log = logs[0]
        features = latest_log
    else:
        latest_log = None
        features = {
            "uninterrupted_sleep_hours": 8.0,
            "sleep_quality_rating": 4,
            "joint_stiffness_score": 1,
            "stiffness_subsidence_hours": 1,
            "fluid_intake_liters": 3.5,
            "caloric_nutrition_met": 3,
            "external_stress_level": 2,
            "circadian_rhythm_disruption": 1,
            "physical_readiness_rating": 4,
            "mental_focus_rating": 4,
            "sport": current_user.get("sport", "General"),
            "injury_type": "None / Healthy"
        }

    prediction = ml_model.predict_recovery(features)

    return jsonify({
        "athlete_id": current_user["id"],
        "athlete_name": current_user["name"],
        "latest_log": latest_log,
        "prediction": prediction
    }), 200

@app.route("/api/athlete/train", methods=["POST"])
@token_required
def train_model_endpoint(current_user):
    df_logs = database.get_all_daily_logs_dataframe()
    result = ml_model.train_model(df_logs)
    return jsonify({
        "status": result.get("status", "success"),
        "message": result.get("message", "Model trained"),
        "samples_trained": int(result.get("samples_trained", 0)),
        "training_cycles": int(result.get("training_cycles", 1))
    }), 200

if __name__ == "__main__":
    app.run(debug=True, port=5000)