import sqlite3
import os
from datetime import datetime
import pandas as pd

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "athlete360.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create Users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'athlete',
            sport TEXT DEFAULT 'General',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    # Create DailyLogs table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS daily_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            athlete_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            sport TEXT DEFAULT 'General',
            injury_type TEXT DEFAULT 'None / Healthy',
            uninterrupted_sleep_hours REAL DEFAULT 8.0,
            sleep_quality_rating INTEGER DEFAULT 4,
            joint_stiffness_score INTEGER DEFAULT 1,
            stiffness_subsidence_hours INTEGER DEFAULT 1,
            fluid_intake_liters REAL DEFAULT 3.5,
            caloric_nutrition_met INTEGER DEFAULT 3,
            external_stress_level INTEGER DEFAULT 2,
            circadian_rhythm_disruption INTEGER DEFAULT 1,
            physical_readiness_rating INTEGER DEFAULT 4,
            mental_focus_rating INTEGER DEFAULT 4,
            diet_adherence INTEGER DEFAULT 4,
            soreness_level INTEGER DEFAULT 3,
            sleep_hours REAL DEFAULT 8.0,
            workload INTEGER DEFAULT 50,
            recovery_score REAL NOT NULL,
            risk_level TEXT NOT NULL,
            recommendations TEXT,
            attendance_status TEXT DEFAULT 'present',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (athlete_id) REFERENCES users (id)
        );
    """)

    # Check for column migrations
    cursor.execute("PRAGMA table_info(daily_logs);")
    columns = [row["name"] for row in cursor.fetchall()]
    new_cols = [
        ("uninterrupted_sleep_hours", "REAL DEFAULT 8.0"),
        ("sleep_quality_rating", "INTEGER DEFAULT 4"),
        ("joint_stiffness_score", "INTEGER DEFAULT 1"),
        ("stiffness_subsidence_hours", "INTEGER DEFAULT 1"),
        ("fluid_intake_liters", "REAL DEFAULT 3.5"),
        ("caloric_nutrition_met", "INTEGER DEFAULT 3"),
        ("external_stress_level", "INTEGER DEFAULT 2"),
        ("circadian_rhythm_disruption", "INTEGER DEFAULT 1"),
        ("physical_readiness_rating", "INTEGER DEFAULT 4"),
        ("mental_focus_rating", "INTEGER DEFAULT 4")
    ]
    for col_name, col_type in new_cols:
        if col_name not in columns:
            cursor.execute(f"ALTER TABLE daily_logs ADD COLUMN {col_name} {col_type};")
    
    conn.commit()
    conn.close()

def create_user(name, email, password_hash, role="athlete", sport="General"):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (name, email, password_hash, role, sport) VALUES (?, ?, ?, ?, ?)",
            (name, email, password_hash, role, sport)
        )
        conn.commit()
        user_id = cursor.lastrowid
        return {"id": user_id, "name": name, "email": email, "role": role, "sport": sport}
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()

def get_user_by_email(email):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def get_user_by_id(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def save_daily_log(athlete_id, data_dict, recovery_score, risk_level, recommendations, date_str=None):
    if not date_str:
        date_str = datetime.now().strftime("%Y-%m-%d")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO daily_logs 
        (athlete_id, date, sport, injury_type, uninterrupted_sleep_hours, sleep_quality_rating, joint_stiffness_score, stiffness_subsidence_hours, fluid_intake_liters, caloric_nutrition_met, external_stress_level, circadian_rhythm_disruption, physical_readiness_rating, mental_focus_rating, diet_adherence, soreness_level, sleep_hours, workload, recovery_score, risk_level, recommendations, attendance_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            athlete_id,
            date_str,
            data_dict.get("sport", "General"),
            data_dict.get("injury_type", "None / Healthy"),
            float(data_dict.get("uninterrupted_sleep_hours", 8.0)),
            int(data_dict.get("sleep_quality_rating", 4)),
            int(data_dict.get("joint_stiffness_score", 1)),
            int(data_dict.get("stiffness_subsidence_hours", 1)),
            float(data_dict.get("fluid_intake_liters", 3.5)),
            int(data_dict.get("caloric_nutrition_met", 3)),
            int(data_dict.get("external_stress_level", 2)),
            int(data_dict.get("circadian_rhythm_disruption", 1)),
            int(data_dict.get("physical_readiness_rating", 4)),
            int(data_dict.get("mental_focus_rating", 4)),
            int(data_dict.get("diet_adherence", 4)),
            int(data_dict.get("soreness_level", 3)),
            float(data_dict.get("uninterrupted_sleep_hours", 8.0)),
            int(data_dict.get("workload", 50)),
            recovery_score,
            risk_level,
            recommendations,
            data_dict.get("attendance_status", "present")
        )
    )
    conn.commit()
    log_id = cursor.lastrowid
    conn.close()
    
    return {
        "id": log_id,
        "athlete_id": athlete_id,
        "date": date_str,
        "recovery_score": recovery_score,
        "risk_level": risk_level,
        "recommendations": recommendations,
        **data_dict
    }

def get_athlete_daily_logs(athlete_id, limit=20):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM daily_logs WHERE athlete_id = ? ORDER BY id DESC LIMIT ?",
        (athlete_id, limit)
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_all_daily_logs_dataframe() -> pd.DataFrame:
    conn = get_db_connection()
    query = """
        SELECT 
            uninterrupted_sleep_hours,
            sleep_quality_rating,
            joint_stiffness_score,
            stiffness_subsidence_hours,
            fluid_intake_liters,
            caloric_nutrition_met,
            external_stress_level,
            circadian_rhythm_disruption,
            physical_readiness_rating,
            mental_focus_rating,
            recovery_score
        FROM daily_logs
        ORDER BY id ASC
    """
    df = pd.read_sql_query(query, conn)
    conn.close()
    return df
