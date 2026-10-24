import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { bleManager, BleHeartRateReading, BleDiagnosticState } from '../../services/smartwatchBle';
import { BleDiagnosticPanel } from '../../components/smartwatch/BleDiagnosticPanel';
import { SmartwatchDevice, SmartwatchStatus, SmartwatchVitalsSync } from '../../types';
import {
  Flame,
  Award,
  Activity,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Trophy,
  Sparkles,
  Zap,
  Dumbbell,
  Star,
  Watch,
  Heart,
  Wind,
  Footprints,
  Moon,
  RefreshCw,
  Bluetooth,
  Battery,
  AlertTriangle,
  Radio,
  Sliders,
  Terminal
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';

interface AthleteDashboardProps {
  onNavigate: (tab: string) => void;
}

export const AthleteDashboard: React.FC<AthleteDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Smartwatch State
  const [watchDevice, setWatchDevice] = useState<SmartwatchDevice | null>(null);
  const [watchReadings, setWatchReadings] = useState<SmartwatchVitalsSync[]>([]);
  const [liveBpm, setLiveBpm] = useState<number | null>(null);
  const [isLiveBleConnected, setIsLiveBleConnected] = useState(bleManager.isConnected());
  const [liveBattery, setLiveBattery] = useState<number | null>(bleManager.getBatteryLevel());
  const [connectingWatch, setConnectingWatch] = useState(false);
  const [watchError, setWatchError] = useState<string | null>(null);
  const [vitalChartMetric, setVitalChartMetric] = useState<'heart_rate' | 'calories'>('heart_rate');
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [bleDiag, setBleDiag] = useState<BleDiagnosticState>(bleManager.getDiagnosticState());

  useEffect(() => {
    async function loadDashboard() {
      if (!user) return;
      try {
        setLoading(true);
        const [dashRes, devRes, readRes] = await Promise.allSettled([
          api.getAthleteDashboard(user.id),
          api.getSmartwatchDevice(user.id),
          api.getSmartwatchReadings(user.id)
        ]);

        if (dashRes.status === 'fulfilled') setData(dashRes.value);
        if (devRes.status === 'fulfilled' && devRes.value.device) setWatchDevice(devRes.value.device);
        if (readRes.status === 'fulfilled' && readRes.value.readings) setWatchReadings(readRes.value.readings);
      } catch (err) {
        console.error('Failed to load athlete dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [user]);

  const lastBlePushRef = useRef<number>(0);

  // Listen for real-time Web Bluetooth events if active
  useEffect(() => {
    setIsLiveBleConnected(bleManager.isConnected());
    const initialBat = bleManager.getBatteryLevel();
    if (initialBat !== null) setLiveBattery(initialBat);

    const unsubHR = bleManager.onHeartRate((reading: BleHeartRateReading) => {
      setLiveBpm(reading.bpm);
      // Strictly genuine record: no fabricated steps, SpO2, or calories
      const genuineSyncRecord: SmartwatchVitalsSync = {
        id: 'ble-live-' + Date.now(),
        athlete_id: user?.id || '',
        device_id: watchDevice?.id || 'ble-dev',
        heart_rate_bpm: reading.bpm,
        recorded_at: reading.timestamp || new Date().toISOString(),
        timestamp: reading.timestamp || new Date().toISOString(),
        source: reading.source || 'boAt Storm RTL (GATT 0x180D / 0x2A37)'
      };

      setWatchReadings(prev => [genuineSyncRecord, ...(prev || []).slice(0, 19)]);

      // Debounce sync push to backend (at most once every 4 seconds)
      const now = Date.now();
      if (user && now - lastBlePushRef.current > 4000) {
        lastBlePushRef.current = now;
        api.syncSmartwatchVitals(user.id, {
          source: genuineSyncRecord.source,
          sync_type: 'automatic',
          heart_rate_bpm: reading.bpm,
          timestamp: genuineSyncRecord.timestamp
        }).catch(err => console.debug('BLE background sync push ignored:', err));
      }
    });

    const unsubStatus = bleManager.onStatusChange((status: SmartwatchStatus) => {
      setWatchDevice(prev => prev ? { ...prev, connection_status: status, status } : prev);
      setIsLiveBleConnected(status === 'Connected');
    });

    const unsubBattery = bleManager.onBatteryLevel((lvl: number) => {
      setLiveBattery(lvl);
      setWatchDevice(prev => prev ? { ...prev, battery_level: lvl } : prev);
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
      unsubStatus();
      unsubBattery();
      unsubDiag();
      unsubDisconnect();
    };
  }, [user, watchDevice?.id]);

  // Periodic polling for real-time vitals updates when watch is connected
  useEffect(() => {
    if (!user || (!bleManager.isConnected() && watchDevice?.status !== 'Connected' && watchDevice?.connection_status !== 'Connected')) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const [devRes, readRes] = await Promise.allSettled([
          api.getSmartwatchDevice(user.id),
          api.getSmartwatchReadings(user.id)
        ]);
        if (devRes.status === 'fulfilled' && devRes.value?.device) {
          setWatchDevice(devRes.value.device);
        }
        if (readRes.status === 'fulfilled' && Array.isArray(readRes.value?.readings) && readRes.value.readings.length > 0) {
          setWatchReadings(readRes.value.readings);
          if (!liveBpm && readRes.value.readings[0].heart_rate_bpm) {
            setLiveBpm(readRes.value.readings[0].heart_rate_bpm);
          }
        }
      } catch (err) {
        // silent polling error
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [user, watchDevice?.status, watchDevice?.connection_status]);

  const handleConnectDevice = async () => {
    if (!bleManager.isSupported()) {
      setWatchError(
        'Web Bluetooth is not supported in this browser. Please open Athlete 360 in Google Chrome, Microsoft Edge, or Opera on Windows, macOS, or Android (Chrome for Android).'
      );
      return;
    }
    setWatchError(null);
    setConnectingWatch(true);
    try {
      const bleDev = await bleManager.requestAndConnectDevice({
        acceptAllDevices: true,
        onHeartRate: (reading: BleHeartRateReading) => {
          setLiveBpm(reading.bpm);
        },
        onDisconnect: () => {
          setIsLiveBleConnected(false);
          setLiveBpm(null);
        }
      });

      if (user) {
        const res = await api.connectSmartwatch(user.id, {
          device_name: bleDev.name || 'boAt Storm RTL',
          model_identifier: bleDev.id || 'boAt-STORM-RTL',
          connection_type: 'BLE_GATT',
          battery_level: bleDev.batteryLevel,
          status: 'Connected'
        });
        setWatchDevice(res.device);
      }
      setIsLiveBleConnected(true);
    } catch (err: any) {
      console.error('BLE connection failed:', err);
      setWatchError(err.message || 'Failed to connect device.');
    } finally {
      setConnectingWatch(false);
    }
  };

  const handleDisconnectDevice = async () => {
    setWatchError(null);
    try {
      bleManager.disconnect();
      if (user) {
        await api.disconnectSmartwatch(user.id);
      }
      setIsLiveBleConnected(false);
      setLiveBpm(null);
      setWatchDevice(prev => prev ? { ...prev, status: 'Disconnected', connection_status: 'Disconnected' } : null);
    } catch (err: any) {
      console.error('BLE disconnect failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-cyan-400">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold tracking-wider uppercase">Loading Athlete Hub...</span>
        </div>
      </div>
    );
  }

  const athlete = data?.athlete || {};
  const todayTasks = data?.todayTasks || [];
  const upcomingTournaments = data?.upcomingTournaments || [];
  const weeklyActivity = data?.weeklyActivity || [];
  const latestAssessment = data?.latestAssessment;

  // Latest smartwatch telemetry (most recent genuine sync record)
  const latestWatch = watchReadings && watchReadings.length > 0 ? watchReadings[0] : null;
  const displayBpm = liveBpm || latestWatch?.heart_rate_bpm || null;

  // Telemetry chart format (only genuine non-null points)
  const telemetryData = watchReadings.length > 0
    ? [...watchReadings].reverse().map(r => ({
        time: new Date(r.recorded_at || r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        heart_rate: r.heart_rate_bpm || null,
        calories: r.calories_kcal || r.calories_burned || null,
        spo2: r.spo2_pct || null
      }))
    : [];

  const isConnected = isLiveBleConnected || watchDevice?.status === 'Connected' || watchDevice?.connection_status === 'Connected';
  const connectionStatus: SmartwatchStatus = (isLiveBleConnected
    ? 'Connected'
    : (watchDevice?.status || watchDevice?.connection_status || 'Disconnected')) as SmartwatchStatus;

  const statusBadgeConfig: Record<SmartwatchStatus, { bg: string; text: string; dot: string; label: string }> = {
    Connected: { bg: 'bg-emerald-500/15 border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-400 animate-pulse', label: 'Connected' },
    Syncing: { bg: 'bg-cyan-500/15 border-cyan-500/30', text: 'text-cyan-400', dot: 'bg-cyan-400 animate-spin', label: 'Syncing Data' },
    Disconnected: { bg: 'bg-slate-800 border-white/10', text: 'text-slate-400', dot: 'bg-slate-500', label: 'Disconnected' },
    'Permission Required': { bg: 'bg-amber-500/15 border-amber-500/30', text: 'text-amber-400', dot: 'bg-amber-400', label: 'Permission Required' },
    'Device Not Supported': { bg: 'bg-red-500/15 border-red-500/30', text: 'text-red-400', dot: 'bg-red-400', label: 'Not Supported' }
  };

  const statusInfo = statusBadgeConfig[connectionStatus] || statusBadgeConfig['Disconnected'];

  const lastSyncFormatted = latestWatch?.recorded_at || latestWatch?.timestamp || watchDevice?.last_sync_at
    ? new Date(latestWatch?.recorded_at || latestWatch?.timestamp || watchDevice?.last_sync_at || '').toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    : 'Never';

  return (
    <div className="space-y-6">
      {/* Executive Welcome Header */}
      <div className="p-6 rounded-2xl bg-[#0d111a] border border-white/10 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold uppercase tracking-wider">
              Athlete Performance Hub
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-xs text-slate-400 font-semibold">{athlete.sport || 'Running'}</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Welcome Back, {athlete.name || 'Athlete'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            {athlete.streak_days || 14}-day training streak active. Sync your Fastrack smartwatch vitals via Android Health Connect to track genuine health readings.
          </p>
        </div>

        <div className="flex items-center gap-2.5 relative z-10">
          <button
            onClick={() => onNavigate('smartwatch')}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-white/10 hover:border-cyan-500/40 transition flex items-center gap-2"
          >
            <Watch className="w-4 h-4 text-cyan-400" />
            <span>Smartwatch Hub</span>
          </button>
          <button
            onClick={() => onNavigate('fitness-eligibility')}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
          >
            <Activity className="w-4 h-4" />
            <span>AI Readiness</span>
          </button>
        </div>
      </div>

      {/* DEDICATED SMARTWATCH SECTION - HEALTH CONNECT & BLUETOOTH INTEGRATION */}
      <div className="p-5 rounded-2xl bg-[#0e121c] border border-cyan-500/25 space-y-5 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Watch className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-black text-white tracking-tight">
                  {watchDevice?.device_name || 'Fastrack Smartwatch'}
                </h3>
                {/* Connection Status Badge */}
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  isLiveBleConnected
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : latestWatch
                    ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                    : statusInfo.bg + ' ' + statusInfo.text
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    isLiveBleConnected
                      ? 'bg-emerald-400 animate-pulse'
                      : latestWatch
                      ? 'bg-cyan-400'
                      : statusInfo.dot
                  }`} />
                  {isLiveBleConnected
                    ? 'Bluetooth: Connected (Live)'
                    : latestWatch
                    ? 'Health Connect: Synced'
                    : `Status: ${statusInfo.label}`}
                </span>

                {/* Telemetry Stream / Sync Status */}
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  isLiveBleConnected && displayBpm
                    ? 'bg-red-500/15 border-red-500/30 text-red-400 animate-pulse'
                    : latestWatch
                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                    : 'bg-slate-800 border-white/10 text-slate-500'
                }`}>
                  {isLiveBleConnected && displayBpm ? (
                    <>
                      <Heart className="w-3 h-3 text-red-400" />
                      Stream: Live Real-Time ({displayBpm} BPM)
                    </>
                  ) : latestWatch ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Telemetry: Latest Synced Record
                    </>
                  ) : (
                    'Telemetry: Awaiting Sync'
                  )}
                </span>

                {(liveBattery !== null || (watchDevice?.battery_level !== undefined && watchDevice?.battery_level !== null)) && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <Battery className="w-3 h-3" />
                    {liveBattery !== null ? liveBattery : watchDevice?.battery_level}%
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Source: <strong className="text-slate-300">{latestWatch?.source || 'Fastrack Smart via Health Connect'}</strong>
                {' • '}Last Sync: <strong className="text-slate-200">{lastSyncFormatted}</strong>
                {latestWatch && !isLiveBleConnected && (
                  <span className="text-cyan-400/80 ml-1.5 text-[10px] font-mono">
                    (Health Connect record snapshot)
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Refresh Button */}
            <button
              onClick={async () => {
                if (!user) return;
                const [dRes, rRes] = await Promise.allSettled([
                  api.getSmartwatchDevice(user.id),
                  api.getSmartwatchReadings(user.id)
                ]);
                if (dRes.status === 'fulfilled' && dRes.value?.device) setWatchDevice(dRes.value.device);
                if (rRes.status === 'fulfilled' && rRes.value?.readings) setWatchReadings(rRes.value.readings);
              }}
              title="Refresh readings from server"
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Diagnostics Panel Toggle Button */}
            <button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className={`px-3 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
                showDiagnostics
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-900 hover:bg-slate-800 border-white/10 text-slate-300'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>{showDiagnostics ? 'Hide Diagnostics' : 'BLE Diagnostics'}</span>
            </button>

            {isConnected && isLiveBleConnected ? (
              <button
                onClick={handleDisconnectDevice}
                className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold transition flex items-center gap-1.5"
              >
                <Bluetooth className="w-3.5 h-3.5" />
                <span>Disconnect BLE</span>
              </button>
            ) : (
              <button
                onClick={handleConnectDevice}
                disabled={connectingWatch}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Bluetooth className={`w-3.5 h-3.5 ${connectingWatch ? 'animate-spin' : ''}`} />
                <span>{connectingWatch ? 'Scanning BLE...' : 'Direct BLE (Optional)'}</span>
              </button>
            )}

            <button
              onClick={() => onNavigate('smartwatch')}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-black text-xs font-black transition flex items-center gap-1 shadow-md shadow-cyan-500/20"
            >
              <Watch className="w-3.5 h-3.5" />
              <span>Smartwatch Hub</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </div>

        {/* Error / Compatibility Banner */}
        {watchError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{watchError}</span>
            </div>
            <button onClick={() => setWatchError(null)} className="text-red-400 hover:text-white text-xs">
              ✕
            </button>
          </div>
        )}

        {/* Toggleable Live BLE Diagnostic Panel */}
        {showDiagnostics && (
          <div className="pt-1 pb-2">
            <BleDiagnosticPanel />
          </div>
        )}

        {/* 5 Real-Time Vital Cards - Strictly Genuine Readings Only */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {/* 1. Heart Rate */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-red-500/20 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Heart Rate</span>
              <Heart className={`w-4 h-4 text-red-400 ${isLiveBleConnected && displayBpm ? 'animate-ping' : ''}`} />
            </div>
            <div className="flex items-baseline gap-1">
              {displayBpm ? (
                <>
                  <span className="text-2xl font-black text-white">{displayBpm}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">BPM</span>
                </>
              ) : (
                <span className="text-xs text-slate-400 font-medium">No data available</span>
              )}
            </div>
            <div className="text-[10px]">
              {isLiveBleConnected && displayBpm ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Real-Time Stream
                </span>
              ) : latestWatch?.heart_rate_bpm ? (
                <span className="text-cyan-400 font-medium">
                  Latest Synced ({new Date(latestWatch.recorded_at || latestWatch.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                </span>
              ) : (
                <span className="text-slate-500">Awaiting sync</span>
              )}
            </div>
            {latestWatch?.heart_rate_bpm && (
              <div className="text-[9px] text-slate-500 truncate">
                {latestWatch.source || 'Fastrack Smart via Health Connect'}
              </div>
            )}
          </div>

          {/* 2. Blood Oxygen SpO2 */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/20 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Blood Oxygen</span>
              <Wind className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-1">
              {latestWatch?.spo2_pct ? (
                <>
                  <span className="text-2xl font-black text-white">{latestWatch.spo2_pct}%</span>
                  <span className="text-[10px] text-slate-400 font-semibold">SpO₂</span>
                </>
              ) : (
                <span className="text-xs text-slate-400 font-medium">No data available</span>
              )}
            </div>
            <div className="text-[10px]">
              {latestWatch?.spo2_pct ? (
                <span className="text-cyan-400 font-medium">
                  Recorded: {new Date(latestWatch.recorded_at || latestWatch.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              ) : (
                <span className="text-slate-500">Awaiting Health Connect sync</span>
              )}
            </div>
            {latestWatch?.spo2_pct && (
              <div className="text-[9px] text-slate-500 truncate">
                {latestWatch.source || 'Fastrack Smart via Health Connect'}
              </div>
            )}
          </div>

          {/* 3. Daily Steps */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/20 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Steps Today</span>
              <Footprints className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-1">
              {latestWatch?.steps !== undefined && latestWatch?.steps !== null && latestWatch.steps > 0 ? (
                <>
                  <span className="text-2xl font-black text-white">{latestWatch.steps.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">steps</span>
                </>
              ) : (
                <span className="text-xs text-slate-400 font-medium">No data available</span>
              )}
            </div>
            <div className="text-[10px]">
              {latestWatch?.steps ? (
                <span className="text-emerald-400 font-medium">
                  Recorded: {new Date(latestWatch.recorded_at || latestWatch.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              ) : (
                <span className="text-slate-500">Awaiting Health Connect sync</span>
              )}
            </div>
            {latestWatch?.steps && (
              <div className="text-[9px] text-slate-500 truncate">
                {latestWatch.source || 'Fastrack Smart via Health Connect'}
              </div>
            )}
          </div>

          {/* 4. Active Calories */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-orange-500/20 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Active Calories</span>
              <Flame className="w-4 h-4 text-orange-400" />
            </div>
            <div className="flex items-baseline gap-1">
              {latestWatch?.calories_kcal !== undefined && latestWatch?.calories_kcal !== null && latestWatch.calories_kcal > 0 ? (
                <>
                  <span className="text-2xl font-black text-white">{latestWatch.calories_kcal}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">kcal</span>
                </>
              ) : (
                <span className="text-xs text-slate-400 font-medium">No data available</span>
              )}
            </div>
            <div className="text-[10px]">
              {latestWatch?.calories_kcal ? (
                <span className="text-orange-400 font-medium">
                  Recorded: {new Date(latestWatch.recorded_at || latestWatch.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              ) : (
                <span className="text-slate-500">Awaiting Health Connect sync</span>
              )}
            </div>
            {latestWatch?.calories_kcal && (
              <div className="text-[9px] text-slate-500 truncate">
                {latestWatch.source || 'Fastrack Smart via Health Connect'}
              </div>
            )}
          </div>

          {/* 5. Sleep Duration */}
          <div className="col-span-2 md:col-span-1 p-3.5 rounded-xl bg-slate-900/90 border border-indigo-500/20 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Sleep</span>
              <Moon className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex items-baseline gap-1">
              {latestWatch?.sleep_duration_hours !== undefined && latestWatch?.sleep_duration_hours !== null && latestWatch.sleep_duration_hours > 0 ? (
                <>
                  <span className="text-2xl font-black text-white">{latestWatch.sleep_duration_hours}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">hours</span>
                </>
              ) : (
                <span className="text-xs text-slate-400 font-medium">No data available</span>
              )}
            </div>
            <div className="text-[10px]">
              {latestWatch?.sleep_duration_hours ? (
                <span className="text-indigo-400 font-medium">
                  Recorded: {new Date(latestWatch.recorded_at || latestWatch.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              ) : (
                <span className="text-slate-500">Awaiting Health Connect sync</span>
              )}
            </div>
            {latestWatch?.sleep_duration_hours && (
              <div className="text-[9px] text-slate-500 truncate">
                {latestWatch.source || 'Fastrack Smart via Health Connect'}
              </div>
            )}
          </div>
        </div>

        {/* Real-time Telemetry Trend Graph */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              Real-Time Heart Rate Stream
            </span>

            <span className="text-[11px] text-slate-400">
              {isConnected ? (
                displayBpm ? (
                  <span className="text-emerald-400 font-bold">● Streaming live from watch optical sensor</span>
                ) : bleDiag.packetsReceivedCount > 0 ? (
                  <span className="text-amber-300 font-bold">● Sensor active • Acquiring pulse...</span>
                ) : (
                  'Connected to GATT • Open HR screen on watch to stream pulse'
                )
              ) : (
                'Device disconnected.'
              )}
            </span>
          </div>

          <div className="h-40 w-full">
            {telemetryData.length > 0 && telemetryData.some(d => d.heart_rate !== null) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={telemetryData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="vitalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2433" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f121a', borderColor: '#232a3b', borderRadius: '10px', fontSize: '11px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="heart_rate"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#vitalGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-center p-4 rounded-xl bg-slate-950/60 border border-white/5 text-slate-400 text-xs">
                {latestWatch || isConnected ? (
                  <div className="space-y-1">
                    <p className="text-white font-semibold">{watchDevice?.device_name || 'Fastrack Smartwatch'} Linked</p>
                    <p className="text-[11px] text-slate-400">
                      Telemetry syncs from Health Connect when measurements are recorded by your watch. Trigger a sync from the companion app to view trend charts.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="font-semibold text-slate-300">No smartwatch readings recorded yet.</p>
                    <button
                      onClick={() => onNavigate('smartwatch')}
                      className="px-3.5 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25 text-xs font-bold transition"
                    >
                      Connect Health Companion App
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KEY PERFORMANCE TILES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Readiness Score */}
        <div
          onClick={() => onNavigate('fitness-eligibility')}
          className="glass-panel glass-panel-hover p-4 rounded-xl border-emerald-500/30 bg-emerald-950/10 cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">AI Readiness</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{athlete.readiness_score || 92}/100</div>
          <div className="text-[10px] text-emerald-400 font-semibold mt-1">
            Status: {athlete.readiness_status || 'Green'} (Optimal)
          </div>
        </div>

        {/* Training Consistency */}
        <div
          onClick={() => onNavigate('consistency')}
          className="glass-panel glass-panel-hover p-4 rounded-xl cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Consistency</span>
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-white">{athlete.consistency_score || 96}%</div>
          <div className="text-[10px] text-orange-400 font-semibold mt-1">🔥 {athlete.streak_days || 14}-Day Streak</div>
        </div>

        {/* Weekly Volume */}
        <div
          onClick={() => onNavigate('recovery')}
          className="glass-panel glass-panel-hover p-4 rounded-xl cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Weekly Volume</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">{athlete.weekly_training_hours || 14.5}h</div>
          <div className="text-[10px] text-slate-400 mt-1">Target: 14.0h completed</div>
        </div>

        {/* Performance Benchmark Score */}
        <div
          onClick={() => onNavigate('profile')}
          className="glass-panel glass-panel-hover p-4 rounded-xl cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Performance Index</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white">{athlete.performance_score || 94}/100</div>
          <div className="text-[10px] text-cyan-400 font-semibold mt-1">Tier 1 Benchmark</div>
        </div>
      </div>

      {/* TODAY'S TASKS & WEEKLY VOLUME CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Today's Assigned Tasks */}
        <div className="lg:col-span-7 glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-cyan-400" />
                Assigned Training Sessions
              </h3>
              <p className="text-[11px] text-slate-400">Coach Marcus Vance</p>
            </div>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs text-cyan-400 hover:underline font-semibold"
            >
              View All ({todayTasks.length}) →
            </button>
          </div>

          <div className="space-y-3">
            {todayTasks.slice(0, 3).map((task: any) => (
              <div
                key={task.completion_id}
                className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 space-y-2 hover:border-cyan-500/30 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider">
                        {task.category}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {task.duration} mins
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white">{task.title}</h4>
                  </div>

                  <span
                    className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase ${
                      task.status === 'Completed'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : task.status === 'In Progress'
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {task.status}
                  </span>
                </div>

                {task.coach_feedback && (
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-300 flex items-center gap-1.5">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                    <span>Coach Feedback: "{task.coach_feedback}" ({task.coach_rating}/5 ⭐)</span>
                  </div>
                )}

                <div className="pt-1 flex justify-end">
                  <button
                    onClick={() => onNavigate('tasks')}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                  >
                    <span>{task.status === 'Completed' ? 'View Details' : 'Open Workout'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Training Volume Chart */}
        <div className="lg:col-span-5 glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Weekly Activity Hours
              </h3>
              <p className="text-[11px] text-slate-400">Total: 14.5 Hours completed</p>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">Target Met</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2433" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f121a', borderColor: '#232a3b', borderRadius: '10px', fontSize: '11px' }}
                />
                <Bar dataKey="hours" fill="#00f59b" radius={[4, 4, 0, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI READINESS INSIGHTS & UPCOMING EVENT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Latest AI Assessment */}
        <div className="lg:col-span-8 glass-panel p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Latest AI Readiness Assessment
            </h3>
            <span className="text-[10px] text-slate-400">Coach Marcus Vance Access</span>
          </div>

          {latestAssessment ? (
            <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-emerald-400">{latestAssessment.readiness_score}/100</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                    {latestAssessment.readiness_status} Readiness
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-medium">Capacity: {latestAssessment.recommended_intensity_pct || 100}%</span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed italic">
                "{latestAssessment.ai_insights}"
              </p>

              {latestAssessment.recovery_suggestions?.length > 0 && (
                <div className="pt-2 border-t border-white/5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Directives:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                    {latestAssessment.recovery_suggestions.slice(0, 2).map((sug: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 bg-slate-950/60 p-2 rounded-lg border border-white/5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{sug}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400">No readiness logged today. Click "AI Readiness" to log vitals.</p>
          )}
        </div>

        {/* Upcoming Tournament */}
        <div className="lg:col-span-4 glass-panel p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                Target Tournament
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold uppercase">Registered</span>
            </div>

            {upcomingTournaments.length > 0 ? (
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-900 border border-white/5 text-xs">
                <div className="font-bold text-white">{upcomingTournaments[0].name}</div>
                <div className="text-slate-400 text-[11px]">{upcomingTournaments[0].venue}</div>
                <div className="text-emerald-400 font-semibold text-[11px]">Starts: {upcomingTournaments[0].start_date}</div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No active tournament registrations.</p>
            )}
          </div>

          <button
            onClick={() => onNavigate('performance-insights')}
            className="w-full mt-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-black text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <span>AI Match Prediction</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
