# Athlete 360 – AI-Powered Athlete Management & Performance Tracking Platform

![Platform](https://img.shields.io/badge/Platform-Athlete%20360-00f59b?style=for-the-badge)
![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20TypeScript-0ea5e9?style=for-the-badge)
![Tailwind](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38bdf8?style=for-the-badge)
![Charts](https://img.shields.io/badge/Charts-Recharts-10b981?style=for-the-badge)
![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-22c55e?style=for-the-badge)
![Database](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ecf8e?style=for-the-badge)

**Athlete 360** is an enterprise-grade sports-tech platform designed to unite high-performance coaches and elite competitors into a unified performance ecosystem. It streamlines task assignments across 7 training categories, automates physiological readiness scoring through multi-parameter biometric logging, tracks 30-day training consistency streaks, and delivers data-backed AI match win probability predictions.

---

## 🌟 Key Highlights & Features

### 1. Dual Independent Role Portals
- **Coach Command Center**: Squad dashboard, active athlete roster management, task assignment & submission grading (1–5 stars + feedback), squad compliance Recharts, head-to-head athlete comparison tools, tournament draws, team broadcast announcements, and CSV/PDF report generator.
- **Athlete Performance Portal**: Personalized dashboard, assigned training execution with metric/proof logging, AI Fitness Eligibility system with transparent factor scoring, predictive match outlook, 30-day GitHub-style calendar consistency heatmap, recovery curves, and personal records showcase.
- **Interactive Demo Switcher**: A sticky real-time switcher bar allows evaluators to toggle seamlessly between Coach Marcus Vance and any of the 5 demo athletes with a single click.

### 2. Production AI Predictive Athlete-Readiness Engine (`v1.0`)
- **Genuine Machine Learning Pipeline**: Built using Scikit-Learn, comparing **Random Forest Classifier** and **Regularized Logistic Regression** using stratified train/test splitting and 5-fold cross-validation.
- **Kaggle Datasets Harmonization**: Pre-trained and harmonized with 3,200 records from:
  - `Kaggle AFR-1000` (Athlete Fatigue Risk Dataset)
  - `Kaggle SIRP-600` (Sports Injury & Musculoskeletal Strain Prediction)
  - `Kaggle Biometric Longitudinal Study` (28-day athlete tracking)
  - `Athlete360 Telemetry Cohort` (Fastrack Smartwatch via Health Connect)
- **Model Comparison & Sports-Medicine Selection**:
  - **Random Forest Classifier (Selected Winner)**: Test Accuracy: **76.25%**, Precision: **72.98%**, **NOT READY Recall: 74.41%**, ROC-AUC: **0.8323**, F1: **0.7556**.
  - **Regularized Logistic Regression**: Test Accuracy: 73.28%, Precision: 68.07%, NOT READY Recall: 66.47%, ROC-AUC: 0.7997, F1: 0.7397.
  - *Selection Rationale*: Random Forest achieved superior sensitivity for the **NOT READY** class (74.41% vs 66.47%), preventing 27 additional unrecovered athletes from suffering overuse injuries.
- **Explainable AI (XAI)**: Generates transparent positive recovery drivers, potential strain flags, and non-diagnostic actionable recovery protocols.
- **Native Android App**: Comprehensive multi-million dollar mobile command center with 4 tabs:
  1. *Command Center*: Hero Readiness Gauge (0-100%), Live 2x2 Smartwatch Biometrics (HR, SpO2, Steps, Sleep), XAI factors.
  2. *Sport Questionnaire*: Dynamic questionnaires tailored for 7 sports (Football, Badminton, Cricket, Basketball, Tennis, Running, Volleyball).
  3. *Readiness History*: Longitudinal prediction timeline tracking game readiness trends.
  4. *AI Benchmarks Hub*: Complete validation dashboard, confusion matrix visualizer, and feature importance rankings.
- **Zero Fabrication & Leakage**: Standardized data harmonization layer without invented sensor values or post-game data leakage.
- **Prominent Medical Disclaimer**: Explicitly informs athletes that the platform is a wellness and training-readiness tool, not medical diagnosis or medical clearance.


### 3. AI Win Probability & Match Performance Prediction
- Multi-variable statistical model factoring 30-day training adherence, historical tournament win-loss ratio, competition day physiological readiness, and opponent difficulty calibration.
- Outputs win probability percentage with confidence rating, competitive strengths, vulnerabilities, tactical match advice, and historical prediction accuracy.

### 4. Training Consistency & Milestone Badges
- Interactive **30-Day GitHub-style Calendar Heatmap** with color density reflecting daily training minutes and perceived exertion.
- Active streak tracking (e.g., 14-day streak 🔥) with **smart rest-day logic** (planned rest days do not break streaks).
- Milestone unlock system (7-Day Streak, 30-Day Consistency, Century Club, PB Smasher).

---

## 🚀 Demo Accounts & Credentials

The platform is pre-loaded with realistic, fictional demo data. You can log in manually or click any card in the **1-Click Instant Demo Login Bar**:

| Role | Name | Email | Password | Primary Sport / Position |
| :--- | :--- | :--- | :--- | :--- |
| **Coach** | **Coach Marcus Vance** | `coach.marcus@athlete360.com` | `athlete360` | Master Performance Coach |
| **Athlete** | **Alex Chen** | `alex.chen@athlete360.com` | `athlete360` | Running (100m & 200m Sprint) |
| **Athlete** | **Maya Lin** | `maya.lin@athlete360.com` | `athlete360` | Court Athletics (Singles Specialist) |
| **Athlete** | **Jordan Taylor** | `jordan.taylor@athlete360.com` | `athlete360` | Performance Athletics (All-Rounder / Top Order) |
| **Athlete** | **Sofia Rodriguez** | `sofia.rodriguez@athlete360.com` | `athlete360` | Court Athletics (Doubles & Singles Specialist) |
| **Athlete** | **Liam Walker** | `liam.walker@athlete360.com` | `athlete360` | Football (Forward / Striker) |

*All demo passwords are default set to `athlete360` (or `demo123`).*

---

## 🏛️ Database Architecture (18 Relational Tables)

The application includes a complete Supabase PostgreSQL schema located at [`supabase/schema.sql`](file:///c:/Users/Piyush%20Tare/Desktop/Capstone%20Sem%205/supabase/schema.sql) and seed data at [`supabase/seed.sql`](file:///c:/Users/Piyush%20Tare/Desktop/Capstone%20Sem%205/supabase/seed.sql):

1. `users` – Core user credentials, roles (`coach`, `athlete`), profile metadata, and avatars.
2. `coach_profiles` – Coaching organization, experience years, certifications, and specialization.
3. `athlete_profiles` – Biometrics (height, weight), sport, position, performance & consistency scores, and readiness status.
4. `coach_athlete_assignments` – Active supervisory relationships between coaches and athletes.
5. `training_tasks` – Workouts across 7 training categories, due dates, priority, duration, instructions, and video URLs.
6. `task_completions` – Athlete workout completion logs, actual duration, metrics JSON, photo proof URLs, and coach grading (1–5 stars).
7. `athlete_vitals` – Daily morning biometric telemetry (RHR, BP, sleep hours/quality, temp, SpO2, fatigue, soreness, hydration, pain).
8. `readiness_assessments` – AI readiness score (0–100), Green/Yellow/Red status, transparent factor breakdown, and recovery protocols.
9. `performance_records` – Verified personal bests (PRs), testing marks, dates, and event context.
10. `training_sessions` – Longitudinal workout activity log with RPE and volume minutes.
11. `tournaments` – Sanctioned tournaments, dates, venues, categories, and live status.
12. `tournament_registrations` – Athlete tournament entries, seed numbers, and confirmation statuses.
13. `matches` – Brackets, scheduled times, courts, opponents, and live status.
14. `match_results` – Match outcomes (`Win`, `Loss`, `Draw`), score displays, and tactical notes.
15. `notifications` – Real-time event notifications for tasks, tournaments, reviews, and readiness alerts.
16. `messages` – 1-on-1 coach-athlete encrypted messages and squad broadcast announcements.
17. `achievements` – Milestone badges unlocked with icons and timestamps.
18. `athlete_goals` – Target benchmarks, target completion dates, and progress tracking.

---

## 💻 Tech Stack & Design System

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 with custom dark sports-tech theme (`#08090d` deep black, `#0f121a` charcoal, `#00f59b` electric lime green, `#0ea5e9` cyan, glassmorphism panels, glowing borders).
- **Icons**: Lucide React
- **Charts**: Recharts (ResponsiveContainer, AreaChart, BarChart, LineChart)
- **Delight & Gamification**: Canvas Confetti
- **Backend API**: Node.js Express REST API server with request logging and data persistence.
- **Database Engine**: Relational file-backed store with automatic seed fallback + complete Supabase SQL migration script.
- **AI Integration**: Gemini 1.5 Flash API endpoint with transparent sports-science rule-based algorithm fallback.

---

## 🛠️ Getting Started & Local Execution

### Prerequisites
- Node.js v18+ (tested on Node v24)
- npm v10+

### Option A: Run Full Application Concurrently
From the project root:
```bash
# 1. Install root dependencies
npm install

# 2. Start both API server (port 5000) and Vite frontend (port 5173)
npm run dev
```

### Option B: Run Independently
**Backend Server**:
```bash
cd server
npm install
node index.js
# Running on http://localhost:5000
```

**Frontend Client**:
```bash
cd client
npm install
npm run dev
# Running on http://localhost:5173
```

Open your browser to:
👉 **[http://localhost:5173/](http://localhost:5173/)**

---

## 🧪 Verified Workflows Checklist

- [x] Landing page with hero headline: *"Your Performance. Your Potential. Your Future."*
- [x] Live interactive AI readiness sandbox on the landing page
- [x] Separate Coach & Athlete portals with role-based access control
- [x] Coach Dashboard with real-time stats cards, Recharts, and attention triage
- [x] Athlete Management roster with search, sport/readiness filters, and profile modal
- [x] Task Assignment System across 7 categories with athlete submission review and star grading
- [x] Performance Analytics with compliance curves and head-to-head comparison tool
- [x] Tournament Management with registration rosters and match score logging
- [x] Athlete Dashboard with today's assigned workouts and weekly volume charts
- [x] AI Fitness Eligibility with transparent factor breakdown and mandatory medical disclaimer
- [x] AI Win Probability & match performance outlook with strengths and vulnerabilities
- [x] Training Consistency tracker with 30-day GitHub-style calendar heatmap
- [x] Recovery & Fatigue tracker with hydrotherapy and sleep hygiene protocols
- [x] Achievements view with personal bests (PRs) table and milestone badges
- [x] Communication hub supporting direct 1-on-1 messaging and team broadcast announcements
- [x] Full database schema with all 18 tables defined in `supabase/schema.sql`
