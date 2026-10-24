# Athlete 360 Android Companion App

Native Kotlin Android Companion App integrating **Android Health Connect** with the **Athlete 360** platform.

This app bridges genuine health telemetry recorded by your **Fastrack Smartwatch** (synced through the Fastrack Smart app and Google Fit into Health Connect) directly to the Athlete 360 Express backend and React dashboard.

---

## Architecture & Data Flow

```
[Fastrack Watch]
       │
       ▼ (Bluetooth)
[Fastrack Smart Android App]
       │
       ▼ (Google Fit Integration)
[Google Fit / Health Connect]
       │
       ▼ (androidx.health.connect:connect-client)
[Athlete 360 Android Companion App]
       │
       ▼ (HTTPS / HTTP REST API: /api/smartwatch/:athleteId/sync)
[Athlete 360 Express Backend]
       │
       ▼ (Real-time polling / WebSocket)
[Athlete 360 React Dashboard]
```

---

## Supported Health Metrics

The companion app queries genuine records from Health Connect and strictly forbids fabricating fake readings:

1. **Heart Rate (BPM)** – `HeartRateRecord` (with measurement timestamp and source package)
2. **Blood Oxygen (SpO2 %)** – `OxygenSaturationRecord`
3. **Daily Steps** – `StepsRecord` (aggregated for the day)
4. **Active / Total Calories Burned (kcal)** – `ActiveCaloriesBurnedRecord` / `TotalCaloriesBurnedRecord`
5. **Sleep Duration (hours)** – `SleepSessionRecord` (session duration and finish time)

---

## Prerequisites on Your Android Phone

1. **Android OS**: Android 9.0 (API 28) or higher (Android 14+ has Health Connect built into system settings; on Android 9–13, install **Health Connect** from the Google Play Store).
2. **Fastrack Smart App**: Installed and paired with your Fastrack watch.
3. **Google Fit App**: Installed on your phone.
4. **Health Connect App**: Installed and configured.

---

## Step-by-Step Phone Configuration

### Step 1: Link Fastrack Smart to Google Fit
1. Open the **Fastrack Smart** app on your phone.
2. Go to **Profile / Settings > Third-party Apps / Cloud Sync**.
3. Select **Google Fit** and sign in with your Google account.
4. Verify that step count and heart rate records are syncing to Google Fit.

### Step 2: Enable Google Fit in Health Connect
1. Open phone **Settings > Security & Privacy > Health Connect** (or open the standalone Health Connect app).
2. Tap **App permissions**.
3. Tap **Google Fit** and toggle **Allow all** (or Heart Rate, Steps, Oxygen Saturation, Calories, Sleep).

---

## Building and Running the Android Companion App

### Option A: Open in Android Studio (Recommended)
1. Open **Android Studio**.
2. Select **Open** and choose the `android-companion` directory:
   `c:\Users\Piyush Tare\Desktop\Capstone Sem 5\android-companion`
3. Let Gradle sync project dependencies.
4. Connect your Android phone via USB and enable **USB Debugging** (in Developer Options).
5. Click the green **Run (Play)** button in Android Studio to install and launch the app directly on your phone.

### Option B: Build APK via Command Line
```powershell
cd "c:\Users\Piyush Tare\Desktop\Capstone Sem 5\android-companion"
.\gradlew assembleDebug
```
The output APK will be generated at:
`app\build\outputs\apk\debug\app-debug.apk`

Install on phone via ADB:
```powershell
adb install -r app\build\outputs\apk\debug\app-debug.apk
```

---

## Connecting the Companion App to Athlete 360

1. **Find your computer's local Wi-Fi IP address**:
   In PowerShell on your PC:
   ```powershell
   ipconfig
   ```
   Note your `IPv4 Address` (e.g. `192.168.1.15`).

2. **Ensure your Athlete 360 backend is running**:
   ```powershell
   npm run server
   ```
   Server listens on port `5000`.

3. **In the Athlete 360 Companion App on your phone**:
   - Tap the **Settings (gear)** icon at the top right.
   - Enter your **API Base URL**: `http://192.168.1.15:5000/api` (replace with your computer's IP).
   - Enter your **Athlete ID**: `athlete-1` (or your account's ID).
   - Tap **Test Ping** to verify connectivity with your computer.
   - Tap **Save**.

4. **Grant Health Connect Permissions**:
   - In the app, tap **Grant Permissions**.
   - Health Connect system prompt will appear.
   - Toggle **Allow All** (Heart Rate, SpO2, Steps, Calories, Sleep).
   - Tap **Allow**.

5. **Synchronize Health Data**:
   - Tap **Sync to Athlete 360**.
   - The app reads actual readings from Health Connect and transmits them securely.
   - You can also leave **Background Periodic Sync** enabled so WorkManager syncs your watch records every 15 minutes automatically!

6. **View in Athlete 360 Web Dashboard**:
   - Open Athlete 360 in your browser: `http://localhost:5173`.
   - Log into the Athlete portal (`alex.chen@athlete360.com`).
   - The Smartwatch section will immediately display:
     - Genuine Fastrack Heart Rate (BPM)
     - Blood Oxygen (SpO2 %)
     - Daily Steps
     - Active Calories
     - Sleep Duration
     - Last Sync timestamp and source label (`Fastrack Smart via Health Connect`).
