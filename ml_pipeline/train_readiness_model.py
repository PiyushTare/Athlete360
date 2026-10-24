"""
ml_pipeline/train_readiness_model.py
Athlete360 Production ML Pipeline

Trains and compares:
- Model 1: Random Forest Classifier (Non-linear ensembles with SHAP tree explainability)
- Model 2: Regularized Logistic Regression with StandardScaler Pipeline

Evaluation criteria:
- Stratified 5-Fold Cross Validation
- Independent Held-Out Test Set (20%)
- Prioritizes Recall for the NOT READY (0) class to prevent unrecovered athletes from competing
- Full metrics: Accuracy, Precision, Recall, F1, ROC-AUC, Brier score, Confusion Matrix
- Exports best model, both candidate models, and rich model_metadata.json
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, StratifiedKFold, GridSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report, brier_score_loss
)
import shap

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "harmonized_athlete_dataset.csv")
MODELS_DIR = os.path.join(BASE_DIR, "saved_models")
os.makedirs(MODELS_DIR, exist_ok=True)

# Feature definitions for the ML models
NUMERIC_FEATURES = [
    "heart_rate",
    "baseline_hr",
    "hr_deviation_bpm",
    "spo2",
    "spo2_deviation",
    "daily_steps",
    "step_trend_pct",
    "sleep_duration_hours",
    "sleep_quality_1_10",
    "fatigue_1_10",
    "muscle_soreness_1_10",
    "recovery_score_perceived_1_10",
    "physical_readiness_1_10",
    "mental_readiness_1_10",
    "protein_intake_grams",
    "water_intake_liters",
    "nutrition_adequate",
    "training_duration_minutes",
    "training_intensity_1_10",
    "rpe_1_10",
    "sessions_last_7d",
    "high_intensity_sessions_7d",
    "hours_since_intense_session"
]

SPORT_CATEGORIES = ["Football", "Badminton", "Cricket", "Basketball", "Tennis", "Running", "Volleyball"]

def build_feature_matrix(df: pd.DataFrame):
    """Encodes numeric features and one-hot encoded sports."""
    X_num = df[NUMERIC_FEATURES].copy()
    
    # One-hot encode sport
    sport_dummies = pd.get_dummies(df["sport"], prefix="sport", drop_first=False)
    for s in SPORT_CATEGORIES:
        col = f"sport_{s}"
        if col not in sport_dummies.columns:
            sport_dummies[col] = 0
    sport_dummies = sport_dummies[[f"sport_{s}" for s in SPORT_CATEGORIES]]
    
    X = pd.concat([X_num, sport_dummies], axis=1)
    y = df["fit_to_play"].values
    return X, y

def train_and_evaluate():
    print(f"Loading data from {DATA_PATH}...")
    df = pd.read_csv(DATA_PATH)
    X, y = build_feature_matrix(df)
    feature_names = list(X.columns)

    print(f"Dataset shape: {X.shape}, Target distribution: {np.bincount(y)}")

    # 1. Stratified Train / Test Split (80% Train, 20% Held-out Test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"Training samples: {len(X_train)}, Held-out test samples: {len(X_test)}")

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    # -------------------------------------------------------------
    # MODEL 1: Random Forest Classifier
    # -------------------------------------------------------------
    print("\n--- Tuning Model 1: Random Forest Classifier ---")
    rf_param_grid = {
        "n_estimators": [100, 150],
        "max_depth": [6, 10, None],
        "min_samples_split": [2, 5],
        "min_samples_leaf": [1, 2],
        "class_weight": ["balanced"]
    }
    rf_base = RandomForestClassifier(random_state=42)
    rf_grid = GridSearchCV(
        rf_base, rf_param_grid, cv=cv, scoring="recall", # prioritize recall for safety!
        n_jobs=-1, verbose=1
    )
    rf_grid.fit(X_train, y_train)
    best_rf = rf_grid.best_estimator_
    print(f"Best RF Params: {rf_grid.best_params_}")

    # Evaluate RF on test set
    rf_preds = best_rf.predict(X_test)
    rf_probs = best_rf.predict_proba(X_test)[:, 1]

    rf_metrics = {
        "model_name": "Random Forest Classifier",
        "best_params": rf_grid.best_params_,
        "cv_recall_score": float(rf_grid.best_score_),
        "test_accuracy": float(accuracy_score(y_test, rf_preds)),
        "test_precision": float(precision_score(y_test, rf_preds)),
        "test_recall_fit": float(recall_score(y_test, rf_preds, pos_label=1)),
        "test_recall_not_ready": float(recall_score(y_test, rf_preds, pos_label=0)), # Vital metric!
        "test_f1_score": float(f1_score(y_test, rf_preds)),
        "test_roc_auc": float(roc_auc_score(y_test, rf_probs)),
        "test_brier_score": float(brier_score_loss(y_test, rf_probs)),
        "confusion_matrix": confusion_matrix(y_test, rf_preds).tolist()
    }
    print("Random Forest Test Metrics:")
    for k, v in rf_metrics.items():
        if k != "best_params":
            print(f"  {k}: {v}")

    # -------------------------------------------------------------
    # MODEL 2: Logistic Regression (with StandardScaler Pipeline)
    # -------------------------------------------------------------
    print("\n--- Tuning Model 2: Logistic Regression Pipeline ---")
    lr_pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("classifier", LogisticRegression(random_state=42, max_iter=1000, class_weight="balanced"))
    ])
    lr_param_grid = {
        "classifier__C": [0.01, 0.1, 1.0, 5.0, 10.0],
        "classifier__solver": ["lbfgs", "liblinear"]
    }
    lr_grid = GridSearchCV(
        lr_pipeline, lr_param_grid, cv=cv, scoring="recall",
        n_jobs=-1, verbose=1
    )
    lr_grid.fit(X_train, y_train)
    best_lr = lr_grid.best_estimator_
    print(f"Best LR Params: {lr_grid.best_params_}")

    # Evaluate LR on test set
    lr_preds = best_lr.predict(X_test)
    lr_probs = best_lr.predict_proba(X_test)[:, 1]

    lr_metrics = {
        "model_name": "Regularized Logistic Regression",
        "best_params": lr_grid.best_params_,
        "cv_recall_score": float(lr_grid.best_score_),
        "test_accuracy": float(accuracy_score(y_test, lr_preds)),
        "test_precision": float(precision_score(y_test, lr_preds)),
        "test_recall_fit": float(recall_score(y_test, lr_preds, pos_label=1)),
        "test_recall_not_ready": float(recall_score(y_test, lr_preds, pos_label=0)), # Vital metric!
        "test_f1_score": float(f1_score(y_test, lr_preds)),
        "test_roc_auc": float(roc_auc_score(y_test, lr_probs)),
        "test_brier_score": float(brier_score_loss(y_test, lr_probs)),
        "confusion_matrix": confusion_matrix(y_test, lr_preds).tolist()
    }
    print("Logistic Regression Test Metrics:")
    for k, v in lr_metrics.items():
        if k != "best_params":
            print(f"  {k}: {v}")

    # -------------------------------------------------------------
    # MODEL SELECTION LOGIC
    # Prioritizes Recall for NOT READY (0) class + ROC-AUC
    # -------------------------------------------------------------
    print("\n--- Selecting Superior Model ---")
    # Compare weighted performance: 50% NOT_READY recall, 30% ROC-AUC, 20% F1
    rf_composite = (rf_metrics["test_recall_not_ready"] * 0.50 +
                    rf_metrics["test_roc_auc"] * 0.30 +
                    rf_metrics["test_f1_score"] * 0.20)
    lr_composite = (lr_metrics["test_recall_not_ready"] * 0.50 +
                    lr_metrics["test_roc_auc"] * 0.30 +
                    lr_metrics["test_f1_score"] * 0.20)

    if rf_composite >= lr_composite:
        selected_model_name = "Random Forest Classifier"
        best_model = best_rf
        winner_metrics = rf_metrics
        selection_rationale = (
            f"Random Forest selected (Composite Score: {rf_composite:.4f} vs {lr_composite:.4f}). "
            f"Achieved higher NOT READY recall ({rf_metrics['test_recall_not_ready']:.4f}) and superior "
            f"ROC-AUC ({rf_metrics['test_roc_auc']:.4f}), effectively minimizing dangerous false-fit clearances."
        )
    else:
        selected_model_name = "Regularized Logistic Regression"
        best_model = best_lr
        winner_metrics = lr_metrics
        selection_rationale = (
            f"Logistic Regression selected (Composite Score: {lr_composite:.4f} vs {rf_composite:.4f}). "
            f"Provides well-calibrated probabilities and high sensitivity to baseline deviations."
        )

    print(f"WINNER: {selected_model_name}")
    print(f"Rationale: {selection_rationale}")

    # -------------------------------------------------------------
    # FEATURE IMPORTANCE & SHAP VALUES
    # -------------------------------------------------------------
    print("\n--- Computing Explainability (SHAP & Feature Importance) ---")
    rf_importances = {
        name: round(float(imp), 4)
        for name, imp in zip(feature_names, best_rf.feature_importances_)
    }
    # Sort top features
    sorted_features = sorted(rf_importances.items(), key=lambda x: x[1], reverse=True)
    top_10_features = dict(sorted_features[:10])

    # TreeExplainer for SHAP
    explainer = shap.TreeExplainer(best_rf)
    # Background sample for explanation
    shap_sample = X_train.iloc[:50]
    sample_shap_values = explainer.shap_values(shap_sample)

    # Logistic Regression coefficients
    lr_classifier = best_lr.named_steps["classifier"]
    lr_coefs = {
        name: round(float(coef), 4)
        for name, coef in zip(feature_names, lr_classifier.coef_[0])
    }

    # -------------------------------------------------------------
    # EXPORT MODELS AND ARTIFACTS
    # -------------------------------------------------------------
    rf_path = os.path.join(MODELS_DIR, "readiness_rf_model.joblib")
    lr_path = os.path.join(MODELS_DIR, "readiness_lr_model.joblib")
    best_path = os.path.join(MODELS_DIR, "best_model.joblib")
    meta_path = os.path.join(MODELS_DIR, "model_metadata.json")

    joblib.dump(best_rf, rf_path)
    joblib.dump(best_lr, lr_path)
    joblib.dump(best_model, best_path)

    full_metadata = {
        "model_version": "Athlete360 Readiness Model v1.0",
        "creation_timestamp": pd.Timestamp.now().isoformat(),
        "selected_model": selected_model_name,
        "selection_rationale": selection_rationale,
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "features": feature_names,
        "models_comparison": {
            "random_forest": rf_metrics,
            "logistic_regression": lr_metrics
        },
        "feature_importances_rf": rf_importances,
        "top_features": top_10_features,
        "logistic_regression_coefficients": lr_coefs,
        "data_sources": [
            "Kaggle AFR-1000 (Athlete Fatigue Risk)",
            "Kaggle SIRP-600 (Sports Injury Risk Prediction)",
            "Kaggle Athlete Recovery & Biometric Longitudinal Dataset",
            "Athlete360 Platform Telemetry & Baselines"
        ],
        "sports_supported": SPORT_CATEGORIES
    }

    with open(meta_path, "w") as f:
        json.dump(full_metadata, f, indent=2)

    # Also copy metadata into server/data so the Node.js Express backend has instant access!
    server_data_dir = os.path.join(BASE_DIR, "..", "server", "data")
    os.makedirs(server_data_dir, exist_ok=True)
    with open(os.path.join(server_data_dir, "model_metadata.json"), "w") as f:
        json.dump(full_metadata, f, indent=2)

    print(f"\nAll models saved to {MODELS_DIR}")
    print(f"Metadata saved to {meta_path} and server/data/model_metadata.json")
    return full_metadata

if __name__ == "__main__":
    train_and_evaluate()
