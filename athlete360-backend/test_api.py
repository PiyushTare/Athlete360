import requests

BASE_URL = "http://127.0.0.1:5000"

print("--- 1. Testing Home Route ---")
r = requests.get(f"{BASE_URL}/")
print(f"Status: {r.status_code}, Body: {r.json()}")

print("\n--- 2. Testing User Login ---")
login_payload = {
    "email": "athlete@test.com",
    "password": "securepassword"
}
r_login = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload)
print(f"Status: {r_login.status_code}, Body: {r_login.json()}")
token = r_login.json().get("access_token")

if token:
    headers = {"Authorization": f"Bearer {token}"}

    print("\n--- 3. Testing 10-Question Daily Log Submission with Self-Learning ---")
    log_payload = {
        "sport": "Badminton",
        "injury_type": "None / Healthy",
        "uninterrupted_sleep_hours": 8.5,
        "sleep_quality_rating": 4,
        "joint_stiffness_score": 1,
        "stiffness_subsidence_hours": 1,
        "fluid_intake_liters": 4.0,
        "caloric_nutrition_met": 3,
        "external_stress_level": 2,
        "circadian_rhythm_disruption": 1,
        "physical_readiness_rating": 4,
        "mental_focus_rating": 5,
        "attendance_status": "present"
    }
    r_log = requests.post(f"{BASE_URL}/api/athlete/daily-log", json=log_payload, headers=headers)
    print(f"Status: {r_log.status_code}, Response: {r_log.text}")

    print("\n--- 4. Testing GET /api/athlete/analytics ---")
    r_analytics = requests.get(f"{BASE_URL}/api/athlete/analytics", headers=headers)
    print(f"Status: {r_analytics.status_code}, Analytics: {r_analytics.json()}")

    print("\n--- 5. Testing POST /api/athlete/train ---")
    r_train = requests.post(f"{BASE_URL}/api/athlete/train", headers=headers)
    print(f"Status: {r_train.status_code}, Train Output: {r_train.text}")