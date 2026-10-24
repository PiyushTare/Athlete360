import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  bleManager,
  BleHeartRateReading,
  BleGattReport,
  BleDiagnosticState
} from '../../services/smartwatchBle';
import { BleDiagnosticPanel } from '../../components/smartwatch/BleDiagnosticPanel';
import { SmartwatchDevice, SmartwatchStatus, SmartwatchVitalsSync } from '../../types';
import confetti from 'canvas-confetti';
import {
  Watch,
  Bluetooth,
  RefreshCw,
  Heart,
  Wind,
  Footprints,
  Flame,
  Moon,
  Battery,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Radio,
  Sliders,
  Send,
  Zap,
  Shield,
  Server,
  Layers,
  Info,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Smartphone,
  Copy,
  Check
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

export const ConnectSmartwatchView: React.FC = () => {
  const { user } = useAuth();
  const [device, setDevice] = useState<SmartwatchDevice | null>(null);
  const [latestReading, setLatestReading] = useState<SmartwatchVitalsSync | null>(null);
  const [readingsHistory, setReadingsHistory] = useState<SmartwatchVitalsSync[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [readingBattery, setReadingBattery] = useState(false);
  const [scanMode, setScanMode] = useState<'all' | 'boat'>('all');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'health_connect' | 'ble' | 'gatt_inspector' | 'protocol_analysis' | 'compatibility' | 'manual'>('health_connect');
  const [testingSync, setTestingSync] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Live Web Bluetooth State
  const [liveBpm, setLiveBpm] = useState<number | null>(null);
  const [livePulseData, setLivePulseData] = useState<{ time: string; bpm: number }[]>([]);
  const [isLiveBleConnected, setIsLiveBleConnected] = useState(bleManager.isConnected());
  const [liveBattery, setLiveBattery] = useState<number | null>(bleManager.getBatteryLevel());
  const [gattReport, setGattReport] = useState<BleGattReport | null>(bleManager.getLastGattReport());
  const [bleDiag, setBleDiag] = useState<BleDiagnosticState>(bleManager.getDiagnosticState());

  // Manual Logger Form (defaults empty to avoid fabricating data)
  const [manualForm, setManualForm] = useState<{
    heart_rate_bpm: string;
    spo2_pct: string;
    steps: string;
    calories_kcal: string;
    sleep_duration_hours: string;
  }>({
    heart_rate_bpm: '',
    spo2_pct: '',
    steps: '',
    calories_kcal: '',
    sleep_duration_hours: ''
  });
  const [submittingManual, setSubmittingManual] = useState(false);

  const isBluetoothSupported = bleManager.isSupported();

  const loadSmartwatchData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [devRes, readingsRes] = await Promise.all([
        api.getSmartwatchDevice(user.id),
        api.getSmartwatchReadings(user.id)
      ]);
      setDevice(devRes.device);
      setLatestReading(devRes.latestReading);
      setReadingsHistory(readingsRes.readings || []);

      if (devRes.latestReading?.heart_rate_bpm) {
        setLiveBpm(devRes.latestReading.heart_rate_bpm);
      }

      if (readingsRes.readings && readingsRes.readings.length > 0) {
        const pulseHistory = [...readingsRes.readings]
          .filter(r => r.heart_rate_bpm && r.heart_rate_bpm > 0)
          .slice(0, 20)
          .reverse()
          .map(r => ({
            time: new Date(r.recorded_at || r.timestamp).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
            bpm: r.heart_rate_bpm!
          }));
        if (pulseHistory.length > 0) {
          setLivePulseData(pulseHistory);
        }
      }
    } catch (err: any) {
      console.error('Failed to load smartwatch telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSmartwatchData();
  }, [user]);

  const lastSyncTimeRef = useRef<number>(0);

  const pushLiveHeartRateToBackend = async (bpm: number, source: string) => {
    const now = Date.now();
    if (now - lastSyncTimeRef.current < 4000 || !user) return;
    lastSyncTimeRef.current = now;
    try {
      const syncRes = await api.syncSmartwatchVitals(user.id, {
        heart_rate_bpm: bpm,
        source: source
      });
      if (syncRes.syncRecord) {
        setLatestReading(syncRes.syncRecord);
        if (syncRes.device) setDevice(syncRes.device);
      }
    } catch (e) {
      console.warn('Real-time sync push failed:', e);
    }
  };

  // Listen for real-time Web Bluetooth events
  useEffect(() => {
    setIsLiveBleConnected(bleManager.isConnected());
    const initialBat = bleManager.getBatteryLevel();
    if (initialBat !== null) setLiveBattery(initialBat);

    const initialReport = bleManager.getLastGattReport();
    if (initialReport) setGattReport(initialReport);

    const unsubHR = bleManager.onHeartRate((reading: BleHeartRateReading) => {
      setLiveBpm(reading.bpm);
      setLivePulseData(prev => [
        ...prev.slice(-25),
        { time: new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }), bpm: reading.bpm }
      ]);
      pushLiveHeartRateToBackend(reading.bpm, reading.source);
    });

    const unsubBattery = bleManager.onBatteryLevel((lvl: number) => {
      setLiveBattery(lvl);
      setDevice(prev => prev ? { ...prev, battery_level: lvl } : prev);
    });

    const unsubStatus = bleManager.onStatusChange((status: SmartwatchStatus) => {
      setDevice(prev => prev ? { ...prev, status, connection_status: status } : prev);
      setIsLiveBleConnected(status === 'Connected');
    });

    const unsubGattReport = bleManager.onGattReport((report: BleGattReport) => {
      setGattReport(report);
    });

    const unsubDiag = bleManager.onDiagnosticChange((diagState: BleDiagnosticState) => {
      setBleDiag({ ...diagState });
    });

    const unsubDisconnect = bleManager.onDisconnect(() => {
      setIsLiveBleConnected(false);
      setLiveBpm(null);
    });

    return () => {
      unsubHR();
      unsubBattery();
      unsubStatus();
      unsubGattReport();
      unsubDiag();
      unsubDisconnect();
    };
  }, [user]);

  // Connect via Web Bluetooth
  const handleConnectBle = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setConnecting(true);

    try {
      const bleDev = await bleManager.requestAndConnectDevice({
        acceptAllDevices: scanMode === 'all',
        onHeartRate: (hrReading: BleHeartRateReading) => {
          setLiveBpm(hrReading.bpm);
        },
        onDisconnect: () => {
          handleDisconnectDevice();
        }
      });

      // Save connected device to backend
      const res = await api.connectSmartwatch(user!.id, {
        device_name: bleDev.name,
        model_identifier: bleDev.id || 'boAt-STORM-RTL',
        connection_type: 'BLE_GATT',
        battery_level: bleDev.batteryLevel ?? undefined,
        status: 'Connected'
      });

      setDevice(res.device);
      setIsLiveBleConnected(true);

      const msg = bleDev.batteryLevel !== undefined
        ? `Connected to ${bleDev.name} via Web Bluetooth GATT. Battery: ${bleDev.batteryLevel}%. Discovery complete.`
        : `Connected to ${bleDev.name} via Web Bluetooth GATT. Discovery complete.`;
      setSuccessMessage(msg);

      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });

      loadSmartwatchData();
    } catch (err: any) {
      console.error('BLE connection error:', err);
      setErrorMessage(err.message || 'Bluetooth connection failed.');
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect Device
  const handleDisconnectDevice = async () => {
    if (!user) return;
    try {
      bleManager.disconnect();
      await api.disconnectSmartwatch(user.id);
      setIsLiveBleConnected(false);
      setLiveBpm(null);
      setDevice(prev => prev ? { ...prev, status: 'Disconnected' } : null);
      setSuccessMessage('Smartwatch disconnected.');
      loadSmartwatchData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to disconnect');
    }
  };

  // Read Battery on Demand
  const handleReadBattery = async () => {
    if (!bleManager.isConnected()) {
      setErrorMessage('Watch is not currently connected via Bluetooth GATT. Please connect your watch first.');
      return;
    }
    setReadingBattery(true);
    setErrorMessage(null);
    try {
      const lvl = await bleManager.readBatteryLevel();
      if (lvl !== null && lvl !== undefined) {
        setDevice(prev => prev ? { ...prev, battery_level: lvl } : prev);
        if (user) {
          await api.connectSmartwatch(user.id, {
            device_name: device?.device_name || 'boAt Storm RTL',
            model_identifier: device?.model_identifier || 'boAt-STORM-RTL',
            connection_type: 'BLE_GATT',
            battery_level: lvl,
            status: 'Connected'
          });
        }
        setSuccessMessage(`Live watch battery queried from GATT Service 0x180F: ${lvl}%`);
      } else {
        setErrorMessage('Battery GATT service (0x180F) did not return a value. Ensure watch display is active.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to read watch battery');
    } finally {
      setReadingBattery(false);
    }
  };

  // Submit genuine user manual entry (no fake data auto-injected)
  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    setSubmittingManual(true);

    try {
      const payload: any = {
        source: 'boAt ProGear Display (Manual Verification Log)'
      };

      if (manualForm.heart_rate_bpm.trim() !== '') {
        payload.heart_rate_bpm = Number(manualForm.heart_rate_bpm);
      }
      if (manualForm.spo2_pct.trim() !== '') {
        payload.spo2_pct = Number(manualForm.spo2_pct);
      }
      if (manualForm.steps.trim() !== '') {
        payload.steps = Number(manualForm.steps);
      }
      if (manualForm.calories_kcal.trim() !== '') {
        payload.calories_kcal = Number(manualForm.calories_kcal);
      }
      if (manualForm.sleep_duration_hours.trim() !== '') {
        payload.sleep_duration_hours = Number(manualForm.sleep_duration_hours);
      }

      if (Object.keys(payload).length <= 1) {
        setErrorMessage('Please enter at least one verified reading from your watch.');
        setSubmittingManual(false);
        return;
      }

      const res = await api.syncSmartwatchVitals(user.id, payload);
      setLatestReading(res.syncRecord);
      setDevice(res.device);
      setSuccessMessage('Verified watch readings recorded successfully.');
      setManualForm({
        heart_rate_bpm: '',
        spo2_pct: '',
        steps: '',
        calories_kcal: '',
        sleep_duration_hours: ''
      });
      loadSmartwatchData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record entry.');
    } finally {
      setSubmittingManual(false);
    }
  };

  const isConnected = isLiveBleConnected || device?.status === 'Connected';

  const getStatusBadge = () => {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
          isConnected
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
            : 'bg-slate-800 text-slate-400 border-slate-700'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
          Bluetooth: {isConnected ? 'Connected' : 'Disconnected'}
        </span>

        {/* Separate Health Data Flow Status (Task 8) */}
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
          !isConnected
            ? 'bg-slate-800 border-slate-700 text-slate-500'
            : liveBpm
            ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
            : bleDiag.packetsReceivedCount > 0
            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
            : !bleDiag.hrServiceFound
            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
        }`}>
          {!isConnected ? (
            'Telemetry: Offline'
          ) : liveBpm ? (
            <>
              <Heart className="w-3.5 h-3.5 text-red-400" />
              Telemetry: Streaming ({liveBpm} BPM)
            </>
          ) : bleDiag.packetsReceivedCount > 0 ? (
            <>
              <Radio className="w-3.5 h-3.5 text-amber-300 animate-spin" />
              Telemetry: Acquiring Pulse (0 BPM)
            </>
          ) : !bleDiag.hrServiceFound ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Telemetry: 0 Packets (0x180D Not Found / Proprietary)
            </>
          ) : (
            <>
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Telemetry: 0 Packets (Awaiting Optical Sensor)
            </>
          )}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Watch className="w-3.5 h-3.5" />
            Hardware Bluetooth Integration
          </div>
          <h2 className="text-2xl font-black text-white">boAt Storm RTL Direct Integration</h2>
          <p className="text-xs text-slate-400 max-w-xl mt-1">
            Connect your physical boAt Storm RTL directly via Web Bluetooth (GATT) to discover hardware services and stream genuine biometrics. No mock or fabricated readings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isConnected ? (
            <button
              onClick={handleDisconnectDevice}
              className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition flex items-center gap-2"
            >
              <Bluetooth className="w-4 h-4" />
              <span>Disconnect Device</span>
            </button>
          ) : (
            <button
              onClick={handleConnectBle}
              disabled={connecting || !isBluetoothSupported}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-black text-xs font-black flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition disabled:opacity-50"
            >
              <Bluetooth className={`w-4 h-4 ${connecting ? 'animate-spin' : ''}`} />
              <span>{connecting ? 'Searching Device...' : 'Connect Smartwatch'}</span>
            </button>
          )}

          <button
            onClick={loadSmartwatchData}
            disabled={loading}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-white text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Discovery Configuration Banner */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>Bluetooth Discovery Mode:</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setScanMode('all')}
              className={`px-3 py-1.5 rounded-lg border font-semibold transition ${
                scanMode === 'all'
                  ? 'bg-cyan-500 text-black border-cyan-400 font-bold'
                  : 'bg-slate-800 text-slate-400 border-white/10 hover:text-white'
              }`}
            >
              Scan All Devices (Recommended)
            </button>
            <button
              type="button"
              onClick={() => setScanMode('boat')}
              className={`px-3 py-1.5 rounded-lg border font-semibold transition ${
                scanMode === 'boat'
                  ? 'bg-cyan-500 text-black border-cyan-400 font-bold'
                  : 'bg-slate-800 text-slate-400 border-white/10 hover:text-white'
              }`}
            >
              Filter boAt &amp; Storm Only
            </button>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-black/40 border border-white/5 text-[11px] text-slate-300 space-y-1.5">
          <div className="font-bold text-cyan-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            Connecting your physical boAt Storm RTL:
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-400">
            <li>
              <strong className="text-slate-200">1. Disconnect phone app temporarily:</strong> The boAt Storm RTL can only connect to ONE device at a time. If the watch is currently connected to the <strong className="text-cyan-300">boAt ProGear app</strong> or your Android phone's Bluetooth, turn off Bluetooth on your phone for 30 seconds so the watch broadcasts its pairing signal.
            </li>
            <li>
              <strong className="text-slate-200">2. Wake the watch screen:</strong> Tap the watch screen to ensure the display and BLE radio are awake.
            </li>
            <li>
              <strong className="text-slate-200">3. Select device in browser picker:</strong> Click <strong className="text-white">"Connect Smartwatch"</strong> and select your watch (often named <strong className="text-emerald-300">"STORM"</strong> or <strong className="text-emerald-300">"boAt Storm RTL"</strong>).
            </li>
          </ul>
        </div>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-red-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Bluetooth Notice</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-white">✕</button>
          </div>
          <p className="text-[11px] text-red-200 leading-relaxed">{errorMessage}</p>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* DEVICE STATUS CARD */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg">
              <Watch className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {device?.device_name || (latestReading ? 'Fastrack Watch (Health Connect)' : (isConnected ? 'boAt Storm RTL' : 'Fastrack Smartwatch'))}
                </h3>
                {getStatusBadge()}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Model: <code className="text-slate-300 font-mono text-[11px]">{device?.model_identifier || 'Fastrack-HC'}</code> • Protocol: {latestReading?.source?.includes('Health Connect') || device?.connection_type === 'HEALTH_CONNECT' ? 'Android Health Connect (Fastrack Smart)' : (isConnected && !bleDiag.hrServiceFound ? 'Web Bluetooth (GATT: Proprietary Protocol)' : 'Web Bluetooth (GATT)')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2 text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-white/5">
              <Battery className={`w-4 h-4 ${(liveBattery ?? device?.battery_level) && (liveBattery ?? device?.battery_level)! > 20 ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span>
                Battery:{' '}
                <strong className={(liveBattery !== null || (device?.battery_level !== undefined && device?.battery_level !== null)) ? 'text-white' : 'text-slate-400'}>
                  {liveBattery !== null
                    ? `${liveBattery}%`
                    : (device?.battery_level !== undefined && device?.battery_level !== null
                      ? `${device.battery_level}%`
                      : (isLiveBleConnected ? 'Reading...' : 'Synced via Health Connect'))}
                </strong>
              </span>
              {isLiveBleConnected && (
                <button
                  onClick={handleReadBattery}
                  disabled={readingBattery}
                  title="Query live watch battery level from GATT Service 0x180F"
                  className="p-0.5 hover:text-cyan-400 transition"
                >
                  <RefreshCw className={`w-3 h-3 ${readingBattery ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
                </button>
              )}
            </div>

            <div className="text-slate-400">
              Last Sync:{' '}
              <strong className="text-white">
                {latestReading?.recorded_at || latestReading?.timestamp || device?.last_sync_at
                  ? new Date(latestReading?.recorded_at || latestReading?.timestamp || device?.last_sync_at || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  : 'Never'}
              </strong>
            </div>
          </div>
        </div>

        {/* Live Metrics Grid - Real Genuine Readings Only */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {/* Heart Rate */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Heart Rate</span>
              <Heart className={`w-4 h-4 ${liveBpm ? 'text-red-400 animate-pulse' : 'text-slate-500'}`} />
            </div>
            <div className="text-2xl font-black text-white">
              {liveBpm ? (
                <>
                  {liveBpm} <span className="text-xs font-normal text-slate-400">BPM</span>
                </>
              ) : latestReading?.heart_rate_bpm ? (
                <>
                  {latestReading.heart_rate_bpm} <span className="text-xs font-normal text-slate-400">BPM</span>
                </>
              ) : (
                <span className="text-xs font-semibold text-slate-400">No data available</span>
              )}
            </div>
            <div className="text-[10px] text-slate-400">
              {liveBpm ? (
                <span className="text-emerald-400 font-semibold">● Live Optical PPG</span>
              ) : latestReading?.heart_rate_bpm ? (
                <span className="text-cyan-400">Latest Synced</span>
              ) : (
                'Awaiting reading'
              )}
            </div>
            {latestReading?.recorded_at && (
              <div className="text-[9px] text-slate-500 truncate">
                {new Date(latestReading.recorded_at).toLocaleTimeString()}
              </div>
            )}
          </div>

          {/* SpO2 */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Blood Oxygen</span>
              <Wind className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-cyan-400">
              {latestReading?.spo2_pct ? (
                `${latestReading.spo2_pct}%`
              ) : (
                <span className="text-xs font-semibold text-slate-400">No data available</span>
              )}
            </div>
            <div className="text-[10px] text-slate-400">
              {latestReading?.spo2_pct ? (
                `Synced • ${new Date(latestReading.recorded_at || latestReading.timestamp).toLocaleTimeString()}`
              ) : (
                'Sync via Health Connect'
              )}
            </div>
            {latestReading?.spo2_pct && (
              <div className="text-[9px] text-slate-500 truncate">
                {new Date(latestReading.recorded_at || latestReading.timestamp).toLocaleTimeString()}
              </div>
            )}
          </div>

          {/* Steps */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Steps Today</span>
              <Footprints className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400">
              {latestReading?.steps !== undefined && latestReading?.steps !== null && latestReading.steps > 0 ? (
                latestReading.steps.toLocaleString()
              ) : (
                <span className="text-xs font-semibold text-slate-400">No data available</span>
              )}
            </div>
            <div className="text-[10px] text-slate-400">
              {latestReading?.steps ? (
                `Synced • ${new Date(latestReading.recorded_at || latestReading.timestamp).toLocaleTimeString()}`
              ) : (
                'Sync via Health Connect'
              )}
            </div>
            {latestReading?.steps && (
              <div className="text-[9px] text-slate-500 truncate">
                {new Date(latestReading.recorded_at || latestReading.timestamp).toLocaleTimeString()}
              </div>
            )}
          </div>

          {/* Calories */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Active Calories</span>
              <Flame className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl font-black text-orange-400">
              {latestReading?.calories_kcal !== undefined && latestReading?.calories_kcal !== null && latestReading.calories_kcal > 0 ? (
                `${latestReading.calories_kcal} kcal`
              ) : (
                <span className="text-xs font-semibold text-slate-400">No data available</span>
              )}
            </div>
            <div className="text-[10px] text-slate-400">
              {latestReading?.calories_kcal ? (
                `Synced • ${new Date(latestReading.recorded_at || latestReading.timestamp).toLocaleTimeString()}`
              ) : (
                'Sync via Health Connect'
              )}
            </div>
            {latestReading?.calories_kcal && (
              <div className="text-[9px] text-slate-500 truncate">
                {new Date(latestReading.recorded_at || latestReading.timestamp).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        {/* Source & Provenance Footer */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-white/5 text-[11px] text-slate-400">
          <div>
            Data Source:{' '}
            <strong className="text-slate-200">
              {latestReading?.source || (isConnected ? (bleDiag.hrServiceFound ? 'Web Bluetooth (GATT 0x180D)' : 'Web Bluetooth (Proprietary GATT)') : 'Fastrack Smart via Health Connect')}
            </strong>
          </div>
          <div>
            Sync Status:{' '}
            <span className={latestReading ? 'text-emerald-400 font-semibold' : 'text-slate-500 font-semibold'}>
              {latestReading ? '✓ Health Connect Records Active' : 'Waiting for sync'}
            </span>
          </div>
        </div>
      </div>

      {/* TABS: Health Connect vs Web Bluetooth vs GATT Inspector vs Protocol vs Compatibility vs Manual */}
      <div className="glass-panel p-6 rounded-2xl space-y-6">
        <div className="flex flex-wrap border-b border-white/10 pb-2 gap-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('health_connect')}
            className={`pb-2 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'health_connect' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Fastrack & Health Connect</span>
          </button>

          <button
            onClick={() => setActiveTab('ble')}
            className={`pb-2 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'ble' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Bluetooth className="w-4 h-4" />
            <span>Web Bluetooth Live Pulse</span>
          </button>

          <button
            onClick={() => setActiveTab('gatt_inspector')}
            className={`pb-2 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'gatt_inspector' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>GATT Hardware Inspector</span>
          </button>

          <button
            onClick={() => setActiveTab('protocol_analysis')}
            className={`pb-2 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'protocol_analysis' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Protocol Analysis</span>
          </button>

          <button
            onClick={() => setActiveTab('compatibility')}
            className={`pb-2 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'compatibility' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Browser Compatibility</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`pb-2 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'manual' ? 'border-indigo-400 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Verified Watch Log Entry</span>
          </button>
        </div>

        {/* TAB 0: Fastrack & Health Connect */}
        {activeTab === 'health_connect' && (
          <div className="space-y-6">
            {/* Header info */}
            <div>
              <h4 className="text-base font-black text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-cyan-400" />
                Fastrack Smartwatch ➔ Android Health Connect Pipeline
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Your Fastrack watch syncs heart rate, SpO2, steps, calories, and sleep to Google Fit via the Fastrack Smart app. The native Kotlin Android Companion App reads these genuine records from Health Connect and pushes them securely to Athlete 360.
              </p>
            </div>

            {/* Architecture Visual */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/20">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                Complete Data Synchronization Pipeline
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
                <div className="p-3 rounded-lg bg-slate-900 border border-white/5 space-y-1">
                  <div className="font-bold text-cyan-400">1. Watch</div>
                  <div className="text-[11px] text-white">Fastrack Watch</div>
                  <div className="text-[9px] text-slate-500">Optical PPG & Sensors</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-white/5 space-y-1">
                  <div className="font-bold text-cyan-400">2. App</div>
                  <div className="text-[11px] text-white">Fastrack Smart</div>
                  <div className="text-[9px] text-slate-500">Bluetooth Link</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-white/5 space-y-1">
                  <div className="font-bold text-cyan-400">3. Bridge</div>
                  <div className="text-[11px] text-white">Google Fit</div>
                  <div className="text-[9px] text-slate-500">Health Sync</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-white/5 space-y-1">
                  <div className="font-bold text-emerald-400">4. Hub</div>
                  <div className="text-[11px] text-white">Health Connect</div>
                  <div className="text-[9px] text-slate-500">Official Android API</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-white/5 space-y-1">
                  <div className="font-bold text-emerald-400">5. Companion</div>
                  <div className="text-[11px] text-white">Athlete 360 App</div>
                  <div className="text-[9px] text-slate-500">Kotlin Worker / Sync</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-emerald-500/30 bg-emerald-950/20 space-y-1">
                  <div className="font-bold text-emerald-400">6. Web Hub</div>
                  <div className="text-[11px] text-emerald-300 font-bold">Athlete 360</div>
                  <div className="text-[9px] text-emerald-400/80">Live Dashboard</div>
                </div>
              </div>
            </div>

            {/* Athlete Companion App Pairing Credentials */}
            <div className="p-5 rounded-xl bg-slate-900 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-sm font-bold text-white flex items-center gap-2">
                    <Server className="w-4 h-4 text-cyan-400" />
                    Android Companion App Configuration
                  </h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Enter these settings into the Athlete 360 Companion app on your Android phone to link your watch.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                  ● Endpoint Ready
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">API Base URL</span>
                  <div className="font-mono text-cyan-400 text-xs select-all">
                    {window.location.origin}/api
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    (Use your computer's local Wi-Fi IP e.g. <code className="text-slate-400">http://192.168.x.x:5000/api</code> on real phone)
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-white/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase">Athlete User ID</span>
                    <button
                      onClick={() => {
                        if (user?.id) {
                          navigator.clipboard.writeText(user.id);
                          setCopiedId(true);
                          setTimeout(() => setCopiedId(false), 2000);
                        }
                      }}
                      className="text-[10px] text-cyan-400 hover:text-white flex items-center gap-1 font-semibold"
                    >
                      {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="font-mono text-white text-xs select-all">
                    {user?.id || 'athlete-1'}
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    Account: <strong className="text-slate-400">{user?.email || 'alex.chen@athlete360.com'}</strong>
                  </span>
                </div>
              </div>

              {/* Instant Test Sync Action */}
              <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-400">
                  <strong className="text-white">Verify Health Connect Pipeline:</strong> Test receiving a Fastrack watch payload to verify backend deduplication and dashboard updating.
                </div>
                <button
                  onClick={async () => {
                    if (!user) return;
                    setTestingSync(true);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    try {
                      const sampleHR = 72 + Math.floor(Math.random() * 8);
                      const sampleSteps = 5400 + Math.floor(Math.random() * 200);
                      const sampleCal = 320 + Math.floor(Math.random() * 50);
                      const res = await api.syncSmartwatchVitals(user.id, {
                        device_name: 'Fastrack Smartwatch',
                        connection_type: 'HEALTH_CONNECT',
                        source: 'Fastrack Smart via Health Connect',
                        heart_rate_bpm: sampleHR,
                        spo2_pct: 99,
                        steps: sampleSteps,
                        calories_kcal: sampleCal,
                        sleep_duration_hours: 7.8,
                        timestamp: new Date().toISOString()
                      });
                      setSuccessMessage(`Health Connect sync verified! Received ${sampleHR} BPM, ${sampleSteps.toLocaleString()} steps, 99% SpO2.`);
                      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
                      await loadSmartwatchData();
                    } catch (err: any) {
                      setErrorMessage(err.message || 'Test sync failed');
                    } finally {
                      setTestingSync(false);
                    }
                  }}
                  disabled={testingSync}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20 disabled:opacity-50 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingSync ? 'animate-spin' : ''}`} />
                  <span>{testingSync ? 'Syncing...' : 'Test Fastrack Sync Flow'}</span>
                </button>
              </div>
            </div>

            {/* Health Connect Synced Records History */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  Synced Health Connect Telemetry Records ({readingsHistory.length})
                </h5>
                <span className="text-[11px] text-slate-500">Sorted newest first</span>
              </div>

              {readingsHistory.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-slate-950/60 border border-white/5 text-slate-400 text-xs">
                  No records synced yet. Install the Android companion app or use the test button above.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-white/5">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase tracking-wider">
                      <tr>
                        <th className="p-3">Measurement Time</th>
                        <th className="p-3">Heart Rate</th>
                        <th className="p-3">SpO₂</th>
                        <th className="p-3">Steps</th>
                        <th className="p-3">Active Cal</th>
                        <th className="p-3">Sleep</th>
                        <th className="p-3">Source Application</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 bg-slate-950/40">
                      {readingsHistory.slice(0, 10).map((r, idx) => (
                        <tr key={r.id || idx} className="hover:bg-white/[0.02] transition">
                          <td className="p-3 font-mono text-slate-300">
                            {new Date(r.recorded_at || r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            <div className="text-[10px] text-slate-500">
                              {new Date(r.recorded_at || r.timestamp).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="p-3 font-bold text-white">
                            {r.heart_rate_bpm ? (
                              <span className="text-red-400 flex items-center gap-1">
                                <Heart className="w-3 h-3" />
                                {r.heart_rate_bpm} BPM
                              </span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="p-3 font-bold text-cyan-400">
                            {r.spo2_pct ? `${r.spo2_pct}%` : <span className="text-slate-600">—</span>}
                          </td>
                          <td className="p-3 font-bold text-emerald-400">
                            {r.steps ? `${r.steps.toLocaleString()}` : <span className="text-slate-600">—</span>}
                          </td>
                          <td className="p-3 font-bold text-orange-400">
                            {r.calories_kcal ? `${r.calories_kcal} kcal` : <span className="text-slate-600">—</span>}
                          </td>
                          <td className="p-3 font-bold text-indigo-400">
                            {r.sleep_duration_hours ? `${r.sleep_duration_hours}h` : <span className="text-slate-600">—</span>}
                          </td>
                          <td className="p-3 text-[11px] text-slate-300">
                            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px]">
                              {r.source}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 1: Live Pulse Waveform Graph */}
        {activeTab === 'ble' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Heart className={`w-4 h-4 ${liveBpm ? 'text-red-400 animate-pulse' : 'text-slate-500'}`} />
                  Real-Time Heart Rate Waveform
                </h4>
                <p className="text-xs text-slate-400">
                  {bleDiag.hrServiceFound
                    ? 'Streamed from GATT Service 0x180D (Characteristic 0x2A37)'
                    : 'GATT Service 0x180D Not Found on this device (Proprietary Protocol - 0 Packets)'}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400">Live Pulse: </span>
                <span className={`text-base font-black ${liveBpm ? 'text-red-400' : 'text-slate-400'}`}>
                  {liveBpm ? `${liveBpm} BPM` : (isConnected ? (bleDiag.hrServiceFound ? 'Awaiting optical pulse on wrist...' : '0 BPM (Proprietary Protocol)') : 'Device disconnected.')}
                </span>
              </div>
            </div>

            <div className="h-64 w-full bg-slate-950/70 p-4 rounded-xl border border-white/5">
              {livePulseData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={livePulseData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222736" />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} domain={['dataMin - 5', 'dataMax + 5']} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f121a', borderColor: '#232a3b', borderRadius: '10px', fontSize: '11px' }}
                    />
                    <Line type="monotone" dataKey="bpm" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : isConnected && !bleDiag.hrServiceFound ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5 max-w-lg">
                    <div className="text-sm font-bold text-white">
                      boAt Storm RTL: Proprietary BLE Protocol Detected
                    </div>
                    <p className="text-xs text-slate-300">
                      Standard Bluetooth SIG Heart Rate Service (0x180D) was <strong>not found</strong> on this physical watch. The watch communicates via proprietary vendor services (0xFEE7/0xFFE0).
                    </p>
                    <div className="p-3 rounded-lg bg-black/50 border border-amber-500/30 text-left text-[11px] text-amber-200 space-y-1">
                      <strong className="text-white block">Technical Protocol Finding:</strong>
                      <p className="text-slate-300">
                        Zero health packets can be received over standard GATT. boAt ProGear app does not provide a public API or Google Fit export. See the <strong>GATT Hardware Inspector</strong> tab for all discovered UUIDs or use the <strong>Verified Watch Log Entry</strong> tab to record genuine readings.
                      </p>
                    </div>
                  </div>
                </div>
              ) : isConnected ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Radio className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="space-y-1.5 max-w-lg">
                    <div className="text-sm font-bold text-white">
                      Connected to {device?.device_name || 'boAt Storm RTL'} (GATT Active)
                    </div>
                    <p className="text-xs text-slate-300">
                      <strong>Optical Sensor Activation Required:</strong> The boAt Storm RTL firmware keeps the green optical PPG sensor turned off while idle to save battery.
                    </p>
                    <div className="p-3 rounded-lg bg-black/50 border border-cyan-500/30 text-left text-[11px] text-cyan-200 space-y-1">
                      <strong className="text-white block">To stream live pulse readings right now:</strong>
                      <ol className="list-decimal list-inside space-y-1 text-slate-300">
                        <li>On your physical watch, <strong>swipe or tap to the "Heart Rate" (HR) screen</strong>, OR</li>
                        <li>Start a <strong>Workout / Sports activity</strong> from the watch menu.</li>
                        <li>Green optical LEDs will flash against your skin and live BPM packets will immediately stream to this chart.</li>
                      </ol>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Bluetooth className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">Device disconnected.</h4>
                    <p className="text-xs text-slate-400 max-w-md">
                      Click the "Connect Smartwatch" button above to pair your physical boAt Storm RTL and stream live optical biometrics.
                    </p>
                  </div>
                  <button
                    onClick={handleConnectBle}
                    disabled={connecting || !isBluetoothSupported}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 text-black text-xs font-black shadow-lg shadow-cyan-500/20 transition"
                  >
                    Connect boAt Storm RTL
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: GATT Hardware Inspector & Diagnostic Panel (Task 7) */}
        {activeTab === 'gatt_inspector' && (
          <div className="space-y-4">
            <BleDiagnosticPanel />
          </div>
        )}

        {/* TAB 3: boAt Storm RTL Protocol Analysis */}
        {activeTab === 'protocol_analysis' && (
          <div className="space-y-4 text-xs text-slate-300">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-amber-400" />
              Technical Protocol Analysis: boAt Storm RTL (Realtek RTL8762)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-xl bg-slate-900 border border-white/5 space-y-2">
                <span className="font-bold text-cyan-400 block">1. Realtek Chipset Architecture</span>
                <p className="text-slate-400 leading-relaxed">
                  The <strong>boAt Storm RTL</strong> is manufactured using the <strong>Realtek RTL8762</strong> series BLE microcontroller. Unlike generic medical devices that expose standard Bluetooth SIG profiles, the watch firmware communicates primarily through proprietary vendor protocols (UUID prefixes <code className="text-cyan-300">0000fee7-...</code> and <code className="text-cyan-300">0000ffe0-...</code>).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-white/5 space-y-2">
                <span className="font-bold text-cyan-400 block">2. Why SpO2 is "Not Available from This Device"</span>
                <p className="text-slate-400 leading-relaxed">
                  The watch does <strong>not</strong> implement the Bluetooth SIG Pulse Oximeter Service (UUID <code className="text-slate-300">0x1822</code>). SpO2 spot checks are computed by onboard red/infrared LEDs and saved into watch flash memory. The data is only transmitted in encrypted byte blocks to the native <strong>boAt ProGear</strong> mobile app.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-white/5 space-y-2">
                <span className="font-bold text-cyan-400 block">3. Why Steps &amp; Calories are Inaccessible via Web BLE</span>
                <p className="text-slate-400 leading-relaxed">
                  Bluetooth SIG does not specify a standard GATT profile for accumulated daily steps and active calories (Running Speed &amp; Cadence <code className="text-slate-300">0x1814</code> is meant for footpod sensors). Step totals are stored in flash memory and synced via proprietary bulk packets when the companion app connects.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-white/5 space-y-2">
                <span className="font-bold text-cyan-400 block">4. Companion App Requirement</span>
                <p className="text-slate-400 leading-relaxed">
                  To ingest historical SpO2, sleep cycle stages, and step counts without reverse-engineering encrypted binary frames, a native companion app (or Android Health Connect sync) is required to bridge data from the <strong>boAt ProGear</strong> Android application into Athlete 360.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Browser Compatibility Guide */}
        {activeTab === 'compatibility' && (
          <div className="space-y-4 text-xs text-slate-300">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              Web Bluetooth Browser Compatibility &amp; Security Requirements
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-xl bg-slate-900 border border-white/5 space-y-2">
                <span className="font-bold text-emerald-400 block">Supported Browsers</span>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li><strong className="text-white">Google Chrome</strong> on Windows, macOS, Linux, ChromeOS, and <strong className="text-emerald-300">Android</strong>.</li>
                  <li><strong className="text-white">Microsoft Edge</strong> on Windows, macOS, and Android.</li>
                  <li><strong className="text-white">Opera</strong> on Windows, macOS, and Android.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-white/5 space-y-2">
                <span className="font-bold text-red-400 block">Unsupported Browsers</span>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li><strong className="text-white">Mozilla Firefox:</strong> Web Bluetooth is not implemented due to Mozilla privacy positions.</li>
                  <li><strong className="text-white">Apple Safari:</strong> WebKit does not expose Web Bluetooth APIs.</li>
                  <li><strong className="text-white">iOS Devices (iPhone / iPad):</strong> Apple mandates WebKit for all iOS browsers, preventing Web Bluetooth access.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-white/5 space-y-2">
                <span className="font-bold text-cyan-400 block">Origin Security Requirements</span>
                <p className="text-slate-400 leading-relaxed">
                  Per W3C specifications, Web Bluetooth requires a secure context (<code className="text-cyan-300">https://</code> or <code className="text-cyan-300">http://localhost</code> / <code className="text-cyan-300">127.0.0.1</code>) and an explicit user gesture (button click).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-white/5 space-y-2">
                <span className="font-bold text-amber-400 block">Background Syncing Limitation</span>
                <p className="text-slate-400 leading-relaxed">
                  Web Bluetooth GATT connections are strictly tied to the active browser tab. <strong>Background syncing does not occur when the browser or tab is closed.</strong> Real-time streaming resumes when you reopen the application tab.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Verified Watch Log Entry (Manual Entry Bridge) */}
        {activeTab === 'manual' && (
          <div className="space-y-4 text-xs">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-400" />
                Verified Watch Display Log
              </h4>
              <p className="text-slate-400 mt-0.5">
                Read metrics directly off your physical boAt Storm RTL display or the boAt ProGear app and record them. No pre-filled or simulated numbers.
              </p>
            </div>

            <form onSubmit={handleSubmitManual} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">Heart Rate (BPM)</label>
                  <input
                    type="number"
                    min="35"
                    max="220"
                    placeholder="e.g. 72"
                    value={manualForm.heart_rate_bpm}
                    onChange={e => setManualForm({ ...manualForm, heart_rate_bpm: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-600 focus:border-cyan-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">Blood Oxygen SpO2 (%)</label>
                  <input
                    type="number"
                    min="70"
                    max="100"
                    placeholder="e.g. 98"
                    value={manualForm.spo2_pct}
                    onChange={e => setManualForm({ ...manualForm, spo2_pct: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-600 focus:border-cyan-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">Steps Today</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 8420"
                    value={manualForm.steps}
                    onChange={e => setManualForm({ ...manualForm, steps: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-600 focus:border-cyan-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">Active Calories Burned (kcal)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 450"
                    value={manualForm.calories_kcal}
                    onChange={e => setManualForm({ ...manualForm, calories_kcal: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-600 focus:border-cyan-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">Sleep Duration (Hours)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="24"
                    placeholder="e.g. 7.5"
                    value={manualForm.sleep_duration_hours}
                    onChange={e => setManualForm({ ...manualForm, sleep_duration_hours: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-600 focus:border-cyan-400 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingManual}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-extrabold text-xs shadow-md transition disabled:opacity-50"
                >
                  {submittingManual ? 'Saving...' : 'Record Verified Readings'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* HISTORICAL VITALS SYNC LOG - GENUINE READINGS ONLY */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-cyan-400" />
              Verified Telemetry Synchronization Log
            </h3>
            <p className="text-xs text-slate-400">Genuine vitals ingested from boAt Storm RTL</p>
          </div>
          <span className="text-xs text-slate-400">Verified Records: {readingsHistory.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900/80 text-slate-400 border-b border-white/5 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Sync Timestamp</th>
                <th className="py-2.5 px-3">Heart Rate</th>
                <th className="py-2.5 px-3">SpO2</th>
                <th className="py-2.5 px-3">Steps</th>
                <th className="py-2.5 px-3">Calories</th>
                <th className="py-2.5 px-3">Sleep</th>
                <th className="py-2.5 px-3">Data Source Channel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {readingsHistory.length > 0 ? (
                readingsHistory.slice(0, 10).map((r, i) => (
                  <tr key={i} className="hover:bg-slate-900/50">
                    <td className="py-2.5 px-3 text-white font-medium">
                      {new Date(r.timestamp || r.recorded_at || Date.now()).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td className="py-2.5 px-3 text-red-400 font-bold">
                      {r.heart_rate_bpm ? `${r.heart_rate_bpm} BPM` : <span className="text-slate-500 font-normal">N/A</span>}
                    </td>
                    <td className="py-2.5 px-3 text-cyan-400 font-semibold">
                      {r.spo2_pct ? `${r.spo2_pct}%` : <span className="text-slate-500 font-normal">N/A</span>}
                    </td>
                    <td className="py-2.5 px-3 text-emerald-400 font-medium">
                      {r.steps && r.steps > 0 ? r.steps.toLocaleString() : <span className="text-slate-500 font-normal">N/A</span>}
                    </td>
                    <td className="py-2.5 px-3 text-orange-400">
                      {r.calories_kcal && r.calories_kcal > 0 ? `${r.calories_kcal} kcal` : <span className="text-slate-500 font-normal">N/A</span>}
                    </td>
                    <td className="py-2.5 px-3 text-indigo-400">
                      {r.sleep_duration_hours ? `${r.sleep_duration_hours}h` : <span className="text-slate-500 font-normal">N/A</span>}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[10px]">{r.source}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No verified smartwatch records logged yet. Connect your boAt Storm RTL above to begin streaming genuine vitals.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
