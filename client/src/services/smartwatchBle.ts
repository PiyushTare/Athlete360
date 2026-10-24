// Web Bluetooth BLE Manager for boAt Storm RTL & Realtek-based Smartwatches
// Communicates with standard Bluetooth SIG GATT services and inspects hardware GATT profiles
import { SmartwatchStatus } from '../types';

export interface BleHeartRateReading {
  bpm: number;
  timestamp: string;
  contactDetected?: boolean;
  source: string;
  rrIntervals?: number[];
  energyExpended?: number;
}

export interface BleDeviceInfo {
  id: string;
  name: string;
  connected: boolean;
  batteryLevel?: number;
  hrSupported?: boolean;
  spo2Supported?: boolean;
  stepsSupported?: boolean;
  caloriesSupported?: boolean;
  sleepSupported?: boolean;
}

export interface BleCharacteristicInfo {
  uuid: string;
  name: string;
  properties: {
    read: boolean;
    write: boolean;
    writeWithoutResponse: boolean;
    notify: boolean;
    indicate: boolean;
  };
}

export interface BleServiceInfo {
  uuid: string;
  name: string;
  isStandard: boolean;
  characteristics: BleCharacteristicInfo[];
}

export interface BleDiagnosticLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

export interface BleDiagnosticAnalysis {
  hrAvailable: boolean;
  hrCharacteristicUuid: string | null;
  hrNotificationsActive: boolean;
  packetsReceived: number;
  lastPacketTimestamp: string | null;
  sensorActivationCommandSupported: boolean;
  proGearConflictRisk: boolean;
  healthDataExposedViaGatt: boolean;
  verdictSummary: string;
  supportedPathway: string;
}

export interface BleDiagnosticState {
  deviceId: string;
  deviceName: string;
  gattConnected: boolean;
  connectedAt: string | null;
  servicesDiscoveredCount: number;
  services: BleServiceInfo[];
  hrServiceFound: boolean;
  hrCharFound: boolean;
  hrNotificationStatus: 'uninitialized' | 'subscribing' | 'subscribed' | 'failed' | 'not_supported';
  hrNotificationError: string | null;
  packetsReceivedCount: number;
  lastPacketTimestamp: string | null;
  lastRawPacketHex: string | null;
  lastParsedReading: BleHeartRateReading | null;
  sensorContactStatus: 'contact_detected' | 'contact_lost' | 'not_supported' | 'awaiting_data';
  sensorZeroBpmCount: number;
  bodySensorLocation: string | null;
  batteryServiceFound: boolean;
  batteryCharFound: boolean;
  batteryLevel: number | null;
  batteryLastReadTime: string | null;
  diagnosticLogs: BleDiagnosticLogEntry[];
  analysisVerdict: BleDiagnosticAnalysis;
  supportedMetrics: {
    heartRate: 'supported' | 'unsupported';
    battery: 'supported' | 'unsupported';
    spo2: 'unsupported';
    steps: 'unsupported';
    calories: 'unsupported';
    sleep: 'unsupported';
  };
}

export interface BleGattReport {
  timestamp: string;
  deviceName: string;
  deviceId: string;
  connected: boolean;
  services: BleServiceInfo[];
  supportedFeatures: {
    heartRate: boolean;
    spo2: boolean;
    battery: boolean;
    steps: boolean;
    calories: boolean;
    sleep: boolean;
  };
  limitationsNotes: string[];
}

export interface BleScanOptions {
  acceptAllDevices?: boolean;
  onHeartRate?: (reading: BleHeartRateReading) => void;
  onDisconnect?: () => void;
}

// Universal Smartwatch BLE Service UUIDs required for Web Bluetooth optionalServices permission
const SMARTWATCH_OPTIONAL_SERVICES: string[] = [
  'heart_rate',
  'battery_service',
  'device_information',
  '0000180d-0000-1000-8000-00805f9b34fb', // Standard Heart Rate Service (HRS)
  '0000180f-0000-1000-8000-00805f9b34fb', // Standard Battery Service (BAS)
  '0000180a-0000-1000-8000-00805f9b34fb', // Standard Device Information Service (DIS)
  '00001822-0000-1000-8000-00805f9b34fb', // Standard Pulse Oximeter Service (SpO2)
  '00001800-0000-1000-8000-00805f9b34fb', // Generic Access (GAP)
  '00001801-0000-1000-8000-00805f9b34fb', // Generic Attribute (GATT)
  '00001805-0000-1000-8000-00805f9b34fb', // Current Time Service
  '00001814-0000-1000-8000-00805f9b34fb', // Running Speed & Cadence
  '00001826-0000-1000-8000-00805f9b34fb', // Fitness Machine Service
  '0000181c-0000-1000-8000-00805f9b34fb', // User Data
  '0000fee7-0000-1000-8000-00805f9b34fb', // Realtek / Tencent Sports Health Sync
  '0000fee0-0000-1000-8000-00805f9b34fb', // boAt / VeryFit Nordic Band Service
  '0000fee1-0000-1000-8000-00805f9b34fb', // boAt Data Sync Service
  '0000feea-0000-1000-8000-00805f9b34fb', // Realtek Fitness Telemetry Service
  '0000fee9-0000-1000-8000-00805f9b34fb', // HunterSun Wireless Service
  '0000fee2-0000-1000-8000-00805f9b34fb', // Realtek Vendor Command
  '0000ffe0-0000-1000-8000-00805f9b34fb', // Realtek / Custom BLE Serial Port
  '0000fff0-0000-1000-8000-00805f9b34fb', // DaFit / Moyoung Realtek Service
  '0000fd62-0000-1000-8000-00805f9b34fb', // FitCloudPro / boAt Matrix
  '6e400001-b5a3-f393-e0a9-e50e24dcca9e'  // Nordic UART Wireless Service
];

// boAt device name prefix patterns including boAt Storm RTL and variants
const BOAT_NAME_FILTERS = [
  { namePrefix: 'STORM' },
  { namePrefix: 'Storm' },
  { namePrefix: 'storm' },
  { namePrefix: 'boAt' },
  { namePrefix: 'boat' },
  { namePrefix: 'BOAT' },
  { namePrefix: 'Boat' },
  { namePrefix: 'RTL' },
  { namePrefix: 'Wave' },
  { namePrefix: 'WAVE' },
  { namePrefix: 'wave' },
  { namePrefix: 'Xtend' },
  { namePrefix: 'Lunar' },
  { namePrefix: 'Ultima' },
  { namePrefix: 'Cosmos' },
  { namePrefix: 'Matrix' },
  { namePrefix: 'Watch' }
];

// Human-readable GATT service naming dictionary
const KNOWN_SERVICES: Record<string, string> = {
  '00001800-0000-1000-8000-00805f9b34fb': 'Generic Access (GAP)',
  '00001801-0000-1000-8000-00805f9b34fb': 'Generic Attribute (GATT)',
  '0000180a-0000-1000-8000-00805f9b34fb': 'Device Information Service (DIS)',
  '0000180f-0000-1000-8000-00805f9b34fb': 'Battery Service (BAS)',
  '0000180d-0000-1000-8000-00805f9b34fb': 'Heart Rate Service (HRS)',
  '00001822-0000-1000-8000-00805f9b34fb': 'Pulse Oximeter Service (PLXS)',
  '00001805-0000-1000-8000-00805f9b34fb': 'Current Time Service (CTS)',
  '00001814-0000-1000-8000-00805f9b34fb': 'Running Speed & Cadence (RSCS)',
  '00001826-0000-1000-8000-00805f9b34fb': 'Fitness Machine Service (FTMS)',
  '0000fee7-0000-1000-8000-00805f9b34fb': 'Realtek / Tencent Sports Health Sync',
  '0000fee0-0000-1000-8000-00805f9b34fb': 'boAt / VeryFit Nordic Band Service',
  '0000fee1-0000-1000-8000-00805f9b34fb': 'boAt Data Synchronization Service',
  '0000feea-0000-1000-8000-00805f9b34fb': 'Realtek Fitness Telemetry Service',
  '0000fee9-0000-1000-8000-00805f9b34fb': 'HunterSun Wireless Service',
  '0000ffe0-0000-1000-8000-00805f9b34fb': 'Vendor Custom BLE Serial Port',
  '0000fff0-0000-1000-8000-00805f9b34fb': 'DaFit / Moyoung Realtek Vendor Service',
  '0000fd62-0000-1000-8000-00805f9b34fb': 'FitCloudPro Vendor Service',
  '6e400001-b5a3-f393-e0a9-e50e24dcca9e': 'Nordic UART Service'
};

// Human-readable characteristic naming dictionary
const KNOWN_CHARACTERISTICS: Record<string, string> = {
  '00002a00-0000-1000-8000-00805f9b34fb': 'Device Name',
  '00002a01-0000-1000-8000-00805f9b34fb': 'Appearance',
  '00002a04-0000-1000-8000-00805f9b34fb': 'Peripheral Preferred Connection Parameters',
  '00002a05-0000-1000-8000-00805f9b34fb': 'Service Changed',
  '00002a19-0000-1000-8000-00805f9b34fb': 'Battery Level',
  '00002a24-0000-1000-8000-00805f9b34fb': 'Model Number String',
  '00002a25-0000-1000-8000-00805f9b34fb': 'Serial Number String',
  '00002a26-0000-1000-8000-00805f9b34fb': 'Firmware Revision String',
  '00002a27-0000-1000-8000-00805f9b34fb': 'Hardware Revision String',
  '00002a28-0000-1000-8000-00805f9b34fb': 'Software Revision String',
  '00002a29-0000-1000-8000-00805f9b34fb': 'Manufacturer Name String',
  '00002a37-0000-1000-8000-00805f9b34fb': 'Heart Rate Measurement',
  '00002a38-0000-1000-8000-00805f9b34fb': 'Body Sensor Location',
  '00002a39-0000-1000-8000-00805f9b34fb': 'Heart Rate Control Point',
  '00002a5f-0000-1000-8000-00805f9b34fb': 'PLX Continuous Measurement (SpO2)',
  '00002a5e-0000-1000-8000-00805f9b34fb': 'PLX Spot-Check Measurement (SpO2)',
  '00002a53-0000-1000-8000-00805f9b34fb': 'RSC Measurement (Cadence / Steps)'
};

const BODY_SENSOR_LOCATIONS: Record<number, string> = {
  0: 'Other',
  1: 'Chest',
  2: 'Wrist',
  3: 'Finger',
  4: 'Hand',
  5: 'Ear Lobe',
  6: 'Foot'
};

function resolveServiceName(uuid: string): string {
  const lower = uuid.toLowerCase();
  if (KNOWN_SERVICES[lower]) return KNOWN_SERVICES[lower];
  if (lower.startsWith('000018')) return `Standard BLE Service (0x${lower.substring(4, 8).toUpperCase()})`;
  if (lower.startsWith('0000fe') || lower.startsWith('0000ff')) return `Vendor Protocol Service (0x${lower.substring(4, 8).toUpperCase()})`;
  return `Custom Service (${lower.substring(0, 8)}...)`;
}

function resolveCharName(uuid: string): string {
  const lower = uuid.toLowerCase();
  if (KNOWN_CHARACTERISTICS[lower]) return KNOWN_CHARACTERISTICS[lower];
  if (lower.startsWith('00002a')) return `Standard Characteristic (0x${lower.substring(4, 8).toUpperCase()})`;
  return `Vendor Characteristic (${lower.substring(0, 8)}...)`;
}

class SmartwatchBleManager {
  private device: any = null;
  private gattServer: any = null;
  private hrCharacteristic: any = null;
  private batteryCharacteristic: any = null;
  private batteryLevel: number | null = null;
  private lastReading: BleHeartRateReading | null = null;
  private lastReport: BleGattReport | null = null;
  private activeStreamTimer: any = null;

  // Diagnostic State
  private diagnosticState: BleDiagnosticState = {
    deviceId: '',
    deviceName: '',
    gattConnected: false,
    connectedAt: null,
    servicesDiscoveredCount: 0,
    services: [],
    hrServiceFound: false,
    hrCharFound: false,
    hrNotificationStatus: 'uninitialized',
    hrNotificationError: null,
    packetsReceivedCount: 0,
    lastPacketTimestamp: null,
    lastRawPacketHex: null,
    lastParsedReading: null,
    sensorContactStatus: 'awaiting_data',
    sensorZeroBpmCount: 0,
    bodySensorLocation: null,
    batteryServiceFound: false,
    batteryCharFound: false,
    batteryLevel: null,
    batteryLastReadTime: null,
    diagnosticLogs: [],
    analysisVerdict: {
      hrAvailable: false,
      hrCharacteristicUuid: null,
      hrNotificationsActive: false,
      packetsReceived: 0,
      lastPacketTimestamp: null,
      sensorActivationCommandSupported: false,
      proGearConflictRisk: true,
      healthDataExposedViaGatt: false,
      verdictSummary: 'Awaiting device connection and GATT profile discovery.',
      supportedPathway: 'Requires boAt ProGear app synchronization to Google Fit / Health Connect or verified watch display log.'
    },
    supportedMetrics: {
      heartRate: 'supported',
      battery: 'supported',
      spo2: 'unsupported',
      steps: 'unsupported',
      calories: 'unsupported',
      sleep: 'unsupported'
    }
  };

  private hrListeners: Array<(reading: BleHeartRateReading) => void> = [];
  private batteryListeners: Array<(level: number) => void> = [];
  private statusListeners: Array<(status: SmartwatchStatus) => void> = [];
  private gattReportListeners: Array<(report: BleGattReport) => void> = [];
  private diagnosticListeners: Array<(state: BleDiagnosticState) => void> = [];
  private disconnectListeners: Array<() => void> = [];

  public addLog(level: 'info' | 'warn' | 'error' | 'success', message: string) {
    const entry: BleDiagnosticLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message
    };
    this.diagnosticState.diagnosticLogs = [entry, ...(this.diagnosticState.diagnosticLogs || []).slice(0, 199)];
    const prefix = `[boAt BLE Diagnostic] [${level.toUpperCase()}]`;
    if (level === 'error') {
      console.error(prefix, message);
    } else if (level === 'warn') {
      console.warn(prefix, message);
    } else {
      console.log(prefix, message);
    }
    this.notifyDiagnosticChange();
  }

  public exportDiagnosticReportJson(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      device: {
        id: this.diagnosticState.deviceId,
        name: this.diagnosticState.deviceName,
        connected: this.diagnosticState.gattConnected,
        connectedAt: this.diagnosticState.connectedAt
      },
      servicesCount: this.diagnosticState.servicesDiscoveredCount,
      services: this.diagnosticState.services,
      heartRate: {
        serviceFound: this.diagnosticState.hrServiceFound,
        charFound: this.diagnosticState.hrCharFound,
        notificationStatus: this.diagnosticState.hrNotificationStatus,
        notificationError: this.diagnosticState.hrNotificationError,
        packetsReceived: this.diagnosticState.packetsReceivedCount,
        lastPacketAt: this.diagnosticState.lastPacketTimestamp,
        lastRawPacketHex: this.diagnosticState.lastRawPacketHex,
        lastReading: this.diagnosticState.lastParsedReading,
        bodySensorLocation: this.diagnosticState.bodySensorLocation
      },
      battery: {
        serviceFound: this.diagnosticState.batteryServiceFound,
        charFound: this.diagnosticState.batteryCharFound,
        level: this.diagnosticState.batteryLevel,
        lastReadTime: this.diagnosticState.batteryLastReadTime
      },
      analysisVerdict: this.diagnosticState.analysisVerdict,
      diagnosticLogs: this.diagnosticState.diagnosticLogs
    }, null, 2);
  }

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  public getLastHeartRate(): BleHeartRateReading | null {
    return this.lastReading;
  }

  public getBatteryLevel(): number | null {
    return this.batteryLevel;
  }

  public getLastGattReport(): BleGattReport | null {
    return this.lastReport;
  }

  public getDiagnosticState(): BleDiagnosticState {
    return { ...this.diagnosticState };
  }

  public onHeartRate(cb: (reading: BleHeartRateReading) => void): () => void {
    this.hrListeners.push(cb);
    if (this.lastReading !== null) {
      try {
        cb(this.lastReading);
      } catch (_) {}
    }
    return () => {
      this.hrListeners = this.hrListeners.filter(l => l !== cb);
    };
  }

  public onBatteryLevel(cb: (level: number) => void): () => void {
    this.batteryListeners.push(cb);
    if (this.batteryLevel !== null) {
      try {
        cb(this.batteryLevel);
      } catch (_) {}
    }
    return () => {
      this.batteryListeners = this.batteryListeners.filter(l => l !== cb);
    };
  }

  public onStatusChange(cb: (status: SmartwatchStatus) => void): () => void {
    this.statusListeners.push(cb);
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== cb);
    };
  }

  public onGattReport(cb: (report: BleGattReport) => void): () => void {
    this.gattReportListeners.push(cb);
    if (this.lastReport !== null) {
      try {
        cb(this.lastReport);
      } catch (_) {}
    }
    return () => {
      this.gattReportListeners = this.gattReportListeners.filter(l => l !== cb);
    };
  }

  public onDiagnosticChange(cb: (state: BleDiagnosticState) => void): () => void {
    this.diagnosticListeners.push(cb);
    try {
      cb({ ...this.diagnosticState });
    } catch (_) {}
    return () => {
      this.diagnosticListeners = this.diagnosticListeners.filter(l => l !== cb);
    };
  }

  public onDisconnect(cb: () => void): () => void {
    this.disconnectListeners.push(cb);
    return () => {
      this.disconnectListeners = this.disconnectListeners.filter(l => l !== cb);
    };
  }

  private notifyHeartRate(reading: BleHeartRateReading) {
    this.lastReading = reading;
    this.diagnosticState.lastParsedReading = reading;
    this.hrListeners.forEach(listener => {
      try {
        listener(reading);
      } catch (err) {
        console.error('Error in HR listener:', err);
      }
    });
    this.notifyDiagnosticChange();
  }

  private notifyStatus(status: SmartwatchStatus) {
    this.statusListeners.forEach(listener => {
      try {
        listener(status);
      } catch (err) {
        console.error('Error in status listener:', err);
      }
    });
  }

  private notifyBattery(level: number) {
    this.batteryLevel = level;
    this.diagnosticState.batteryLevel = level;
    this.diagnosticState.batteryLastReadTime = new Date().toISOString();
    this.batteryListeners.forEach(listener => {
      try {
        listener(level);
      } catch (err) {
        console.error('Error in battery listener:', err);
      }
    });
    this.notifyDiagnosticChange();
  }

  private notifyGattReport(report: BleGattReport) {
    this.lastReport = report;
    this.gattReportListeners.forEach(listener => {
      try {
        listener(report);
      } catch (err) {
        console.error('Error in GATT report listener:', err);
      }
    });
  }

  private notifyDiagnosticChange() {
    const copy = { ...this.diagnosticState };
    this.diagnosticListeners.forEach(listener => {
      try {
        listener(copy);
      } catch (err) {
        console.error('Error in diagnostic listener:', err);
      }
    });
  }

  /**
   * Directly read live battery level from GATT Service 0x180F (Characteristic 0x2A19)
   */
  public async readBatteryLevel(): Promise<number | null> {
    if (!this.isConnected()) return this.batteryLevel;
    try {
      if (!this.batteryCharacteristic) {
        try {
          const bService = await this.gattServer.getPrimaryService('battery_service');
          if (bService) {
            this.batteryCharacteristic = await bService.getCharacteristic('battery_level');
          }
        } catch (_) {
          try {
            const bService = await this.gattServer.getPrimaryService('0000180f-0000-1000-8000-00805f9b34fb');
            if (bService) {
              this.batteryCharacteristic = await bService.getCharacteristic('00002a19-0000-1000-8000-00805f9b34fb');
            }
          } catch (_) {}
        }
      }

      if (this.batteryCharacteristic && this.batteryCharacteristic.properties?.read) {
        const val = await this.batteryCharacteristic.readValue();
        const level = val.getUint8(0);
        if (level >= 0 && level <= 100) {
          this.notifyBattery(level);
          console.log(`[boAt BLE] Live watch battery level queried: ${level}%`);
          return level;
        }
      }
    } catch (err) {
      console.warn('[boAt BLE] Battery read failed:', err);
    }
    return this.batteryLevel;
  }

  /**
   * Request Bluetooth device access through the browser, connect to GATT server,
   * discover available services/characteristics, verify Heart Rate 0x2A37,
   * inspect notification status, and set up live packet reception.
   */
  public async requestAndConnectDevice(
    optionsOrHrCb?: ((reading: BleHeartRateReading) => void) | BleScanOptions,
    onDisconnect?: () => void
  ): Promise<BleDeviceInfo> {
    if (!this.isSupported()) {
      this.notifyStatus('Device Not Supported');
      throw new Error(
        'Web Bluetooth is not supported in this browser. Please open Athlete 360 in Google Chrome, Microsoft Edge, or Opera on Windows, macOS, or Android (Chrome for Android). Web Bluetooth is not supported in Safari or Firefox.'
      );
    }

    let acceptAll = true;
    let hrCb: ((reading: BleHeartRateReading) => void) | undefined = undefined;
    let discCb = onDisconnect;

    if (typeof optionsOrHrCb === 'function') {
      hrCb = optionsOrHrCb;
    } else if (optionsOrHrCb && typeof optionsOrHrCb === 'object') {
      if (optionsOrHrCb.acceptAllDevices !== undefined) {
        acceptAll = optionsOrHrCb.acceptAllDevices;
      }
      hrCb = optionsOrHrCb.onHeartRate;
      if (optionsOrHrCb.onDisconnect) discCb = optionsOrHrCb.onDisconnect;
    }

    if (hrCb) this.hrListeners.push(hrCb);
    if (discCb) this.disconnectListeners.push(discCb);

    const navBluetooth = (navigator as any).bluetooth;

    try {
      this.notifyStatus('Permission Required');

      let requestedDevice: any = null;

      if (acceptAll) {
        try {
          requestedDevice = await navBluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: SMARTWATCH_OPTIONAL_SERVICES
          });
        } catch (firstErr: any) {
          if (firstErr?.name !== 'NotFoundError' && firstErr?.name !== 'SecurityError') {
            console.warn('[boAt BLE] Retrying device request with fallback service set:', firstErr);
            requestedDevice = await navBluetooth.requestDevice({
              acceptAllDevices: true,
              optionalServices: ['heart_rate', 'battery_service', 'device_information']
            });
          } else {
            throw firstErr;
          }
        }
      } else {
        requestedDevice = await navBluetooth.requestDevice({
          filters: BOAT_NAME_FILTERS,
          optionalServices: SMARTWATCH_OPTIONAL_SERVICES
        });
      }

      this.device = requestedDevice;
      this.notifyStatus('Syncing');

      // Update basic diagnostic fields
      this.diagnosticState.deviceId = this.device.id;
      this.diagnosticState.deviceName = this.device.name || 'boAt Storm RTL';
      this.diagnosticState.hrNotificationStatus = 'subscribing';
      this.diagnosticState.hrNotificationError = null;
      this.diagnosticState.packetsReceivedCount = 0;
      this.diagnosticState.lastPacketTimestamp = null;
      this.diagnosticState.lastRawPacketHex = null;
      this.diagnosticState.lastParsedReading = null;
      this.diagnosticState.sensorContactStatus = 'awaiting_data';
      this.diagnosticState.sensorZeroBpmCount = 0;

      // Listen for unexpected GATT disconnect
      this.device.addEventListener('gattserverdisconnected', () => this.handleDisconnect());

      this.addLog('info', `Initiating GATT connection to "${this.device.name || 'boAt Storm RTL'}" (${this.device.id})...`);

      // Connect to GATT Server
      this.gattServer = await this.device.gatt.connect();
      this.diagnosticState.gattConnected = true;
      this.diagnosticState.connectedAt = new Date().toISOString();

      this.addLog('success', `GATT link established with ${this.device.name || this.device.id}. Probing primary services...`);

      let hrServiceFound = false;
      let hrCharFound = false;
      let hrSupported = false;
      let spo2Supported = false;
      let stepsSupported = false;
      let caloriesSupported = false;
      let sleepSupported = false;
      let batterySupported = false;
      let batteryLevel: number | undefined = undefined;

      // 1. Discover all Primary Services
      let discoveredServices: any[] = [];
      try {
        discoveredServices = await this.gattServer.getPrimaryServices();
      } catch (bulkErr: any) {
        this.addLog('warn', `Bulk getPrimaryServices() returned error (${bulkErr?.message}). Probing candidate services individually...`);
      }

      // If bulk discovery returned empty array (common on some Windows BLE stacks), probe candidate services individually
      if (!discoveredServices || discoveredServices.length === 0) {
        discoveredServices = [];
        const candidateUuids = [
          'heart_rate',
          'battery_service',
          'device_information',
          '0000180d-0000-1000-8000-00805f9b34fb',
          '0000180f-0000-1000-8000-00805f9b34fb',
          '0000180a-0000-1000-8000-00805f9b34fb',
          '00001822-0000-1000-8000-00805f9b34fb',
          '0000fee7-0000-1000-8000-00805f9b34fb',
          '0000fee0-0000-1000-8000-00805f9b34fb',
          '0000fee1-0000-1000-8000-00805f9b34fb',
          '0000feea-0000-1000-8000-00805f9b34fb',
          '0000ffe0-0000-1000-8000-00805f9b34fb',
          '0000fff0-0000-1000-8000-00805f9b34fb',
          '6e400001-b5a3-f393-e0a9-e50e24dcca9e'
        ];

        for (const uuid of candidateUuids) {
          try {
            const s = await this.gattServer.getPrimaryService(uuid);
            if (s && !discoveredServices.some(ex => ex.uuid === s.uuid)) {
              discoveredServices.push(s);
            }
          } catch (_) {}
        }
      }

      this.diagnosticState.servicesDiscoveredCount = discoveredServices.length;
      this.addLog('info', `GATT Discovery Complete: Found ${discoveredServices.length} primary services on physical device.`);

      const serviceReports: BleServiceInfo[] = [];

      // 2. Discover and inspect characteristics for each service
      for (const service of discoveredServices) {
        const sUuid = service.uuid.toLowerCase();
        const sName = resolveServiceName(service.uuid);
        const charReports: BleCharacteristicInfo[] = [];

        this.addLog('info', `Service Discovered: ${service.uuid} -> ${sName}`);

        if (sUuid.includes('180d')) {
          hrServiceFound = true;
          this.diagnosticState.hrServiceFound = true;
          this.addLog('success', `Standard Bluetooth SIG Heart Rate Service (0x180D) confirmed present on device.`);
        }
        if (sUuid.includes('180f')) {
          batterySupported = true;
          this.diagnosticState.batteryServiceFound = true;
          this.addLog('info', `Standard Battery Service (0x180F) confirmed present on device.`);
        }
        if (sUuid.includes('fee7') || sUuid.includes('ffe0') || sUuid.includes('fff0') || sUuid.includes('fee0')) {
          this.addLog('info', `Vendor Protocol Service detected: ${service.uuid} (${sName}). Used by boAt ProGear app for proprietary data transfer.`);
        }

        try {
          const characteristics = await service.getCharacteristics().catch((cErr: any) => {
            this.addLog('warn', `Could not read characteristics on service ${service.uuid}: ${cErr?.message || 'Access restricted'}`);
            return [];
          });

          for (const char of characteristics) {
            const cUuid = char.uuid.toLowerCase();
            const cName = resolveCharName(char.uuid);
            const props = char.properties || {};

            const propNames = Object.entries(props)
              .filter(([_, val]) => Boolean(val))
              .map(([key]) => key.toUpperCase())
              .join(', ');

            this.addLog('info', `  └─ Characteristic: ${char.uuid} -> ${cName} [Properties: ${propNames || 'None'}]`);

            charReports.push({
              uuid: char.uuid,
              name: cName,
              properties: {
                read: Boolean(props.read),
                write: Boolean(props.write),
                writeWithoutResponse: Boolean(props.writeWithoutResponse),
                notify: Boolean(props.notify),
                indicate: Boolean(props.indicate)
              }
            });

            // Inspect Battery Level (0x2A19)
            if (cUuid.includes('2a19')) {
              this.batteryCharacteristic = char;
              this.diagnosticState.batteryCharFound = true;
              if (props.read) {
                try {
                  const val = await char.readValue();
                  const readLvl = val.getUint8(0);
                  if (readLvl >= 0 && readLvl <= 100) {
                    batteryLevel = readLvl;
                    this.notifyBattery(readLvl);
                    this.addLog('success', `Direct Battery Level read from Char 0x2A19: ${readLvl}%`);
                  }
                } catch (bErr: any) {
                  this.addLog('warn', `Battery read error: ${bErr?.message}`);
                }
              }
              if (props.notify || props.indicate) {
                try {
                  await char.startNotifications();
                  char.addEventListener('characteristicvaluechanged', (e: any) => {
                    const updated = e.target.value.getUint8(0);
                    if (updated >= 0 && updated <= 100) {
                      this.notifyBattery(updated);
                    }
                  });
                  this.addLog('info', `Subscribed to Battery Level change notifications (0x2A19).`);
                } catch (_) {}
              }
            }

            // Inspect Heart Rate Measurement (0x2A37) - Task 2 Verification
            if (cUuid.includes('2a37')) {
              hrCharFound = true;
              this.diagnosticState.hrCharFound = true;
              this.hrCharacteristic = char;
              this.addLog('success', `Standard Heart Rate Measurement characteristic (0x2A37) is PRESENT on device.`);

              if (props.notify || props.indicate) {
                try {
                  this.addLog('info', `Subscribing to CCCD notifications on 0x2A37...`);
                  await char.startNotifications();
                  char.addEventListener('characteristicvaluechanged', (e: any) => {
                    this.handleHeartRateNotification(e.target.value);
                  });
                  hrSupported = true;
                  this.diagnosticState.hrNotificationStatus = 'subscribed';
                  this.diagnosticState.hrNotificationError = null;
                  this.addLog('success', `Notifications ENABLED successfully on 0x2A37 (CCCD configured). Listening for pulse packets...`);
                } catch (hrNotifErr: any) {
                  this.diagnosticState.hrNotificationStatus = 'failed';
                  this.diagnosticState.hrNotificationError = hrNotifErr?.message || 'Failed to startNotifications() on 0x2A37';
                  this.addLog('error', `Failed to enable notifications on 0x2A37: ${this.diagnosticState.hrNotificationError}`);
                }
              } else {
                this.diagnosticState.hrNotificationStatus = 'not_supported';
                this.diagnosticState.hrNotificationError = 'Characteristic 0x2A37 does not have NOTIFY or INDICATE property';
                this.addLog('warn', `Characteristic 0x2A37 does not support NOTIFY or INDICATE properties.`);
              }
            }

            // Inspect Body Sensor Location (0x2A38)
            if (cUuid.includes('2a38') && props.read) {
              try {
                const locVal = await char.readValue();
                const locCode = locVal.getUint8(0);
                this.diagnosticState.bodySensorLocation = BODY_SENSOR_LOCATIONS[locCode] || `Code ${locCode}`;
                this.addLog('info', `Read 0x2A38 (Body Sensor Location): ${this.diagnosticState.bodySensorLocation}`);
              } catch (locErr: any) {
                this.addLog('warn', `Could not read 0x2A38: ${locErr?.message}`);
              }
            }

            // Inspect Heart Rate Control Point (0x2A39) - Task 4 Verification
            if (cUuid.includes('2a39')) {
              this.addLog('info', `Characteristic 0x2A39 (Heart Rate Control Point) is exposed. Note: Per Bluetooth SIG HRS spec, the ONLY valid value is 0x01 (Reset Energy Expended). Standard BLE has no sensor ON/OFF command.`);
            }

            // Inspect Pulse Oximeter Continuous or Spot-Check (0x2A5F / 0x2A5E) - Task 5
            if (cUuid.includes('2a5f') || cUuid.includes('2a5e')) {
              spo2Supported = true;
              this.addLog('info', `Pulse Oximeter characteristic discovered: ${char.uuid}`);
              if (props.notify || props.indicate) {
                try {
                  await char.startNotifications();
                  char.addEventListener('characteristicvaluechanged', (e: any) => {
                    this.parseSpO2Value(e.target.value);
                  });
                } catch (_) {}
              }
            }

            // Inspect Running Speed and Cadence (0x2A53) - Task 5
            if (cUuid.includes('2a53')) {
              stepsSupported = true;
              this.addLog('info', `Running Speed & Cadence characteristic discovered: ${char.uuid}`);
            }
          }
        } catch (charErr: any) {
          this.addLog('warn', `Characteristic discovery error on service ${sUuid}: ${charErr?.message}`);
        }

        serviceReports.push({
          uuid: service.uuid,
          name: sName,
          isStandard: service.uuid.toLowerCase().startsWith('000018'),
          characteristics: charReports
        });
      }

      // If Heart Rate Service 0x180D was not discovered among primary services
      if (!hrServiceFound || !hrCharFound) {
        this.diagnosticState.hrServiceFound = false;
        this.diagnosticState.hrCharFound = false;
        this.diagnosticState.hrNotificationStatus = 'not_supported';
        this.diagnosticState.hrNotificationError = 'Standard Heart Rate Service (0x180D) and Characteristic 0x2A37 not exposed by physical device.';
        this.addLog('warn', `Standard Bluetooth SIG Heart Rate Service (0x180D) NOT found on this physical watch.`);
        this.addLog('info', `The boAt Storm RTL communicates via proprietary vendor GATT services (e.g., 0xFEE7, 0xFFE0). Standard SIG biometrics are unavailable.`);
      }

      // ProGear Connection Check (Task 6)
      this.addLog('warn', `ProGear Link Check: The boAt Storm RTL is a single-central peripheral. If your Android phone has Bluetooth ON with the boAt ProGear app active, the watch cannot maintain data streaming to PC.`);

      this.diagnosticState.services = serviceReports;
      this.diagnosticState.supportedMetrics = {
        heartRate: hrSupported ? 'supported' : 'unsupported',
        battery: batterySupported ? 'supported' : 'unsupported',
        spo2: 'unsupported',
        steps: 'unsupported',
        calories: 'unsupported',
        sleep: 'unsupported'
      };

      // Compute Diagnostic Analysis Verdict
      this.diagnosticState.analysisVerdict = {
        hrAvailable: hrCharFound,
        hrCharacteristicUuid: hrCharFound ? (this.hrCharacteristic?.uuid || '00002a37-0000-1000-8000-00805f9b34fb') : null,
        hrNotificationsActive: this.diagnosticState.hrNotificationStatus === 'subscribed',
        packetsReceived: this.diagnosticState.packetsReceivedCount,
        lastPacketTimestamp: this.diagnosticState.lastPacketTimestamp,
        sensorActivationCommandSupported: false,
        proGearConflictRisk: true,
        healthDataExposedViaGatt: this.diagnosticState.packetsReceivedCount > 0,
        verdictSummary: hrCharFound && this.diagnosticState.hrNotificationStatus === 'subscribed'
          ? (this.diagnosticState.packetsReceivedCount > 0
              ? `Characteristic 0x2A37 is active and receiving live health packets (${this.diagnosticState.packetsReceivedCount} packets received).`
              : `Service 0x180D is present, but 0 packets have arrived. Realtek firmware routes telemetry exclusively via proprietary frames.`)
          : 'Standard Heart Rate Service 0x180D was NOT found on this physical boAt Storm RTL. The device operates strictly via proprietary vendor protocols with 0 packets available via standard GATT.',
        supportedPathway: 'boAt ProGear does not provide a public cloud API, data export, or Google Fit / Health Connect bridge. A genuine integration requires an Android companion bridge with Health Connect support or an open standard Bluetooth SIG device.'
      };

      // Compile Technical Limitations Report for this physical device
      const limitationNotes: string[] = [];
      const devName = this.device.name || 'boAt Storm RTL';

      if (!hrSupported) {
        limitationNotes.push(
          `${devName} does not expose standard Bluetooth SIG Heart Rate notifications on 0x2A37. Optical readings are encapsulated in vendor packets.`
        );
      } else {
        limitationNotes.push(
          `GATT Service 0x180D & Characteristic 0x2A37 active. Note: boAt Storm RTL optical sensor (green LEDs) activates when the Heart Rate screen or Workout mode is opened on the watch face.`
        );
      }
      if (!spo2Supported) {
        limitationNotes.push(
          `Pulse Oximeter Service (UUID 0x1822) is not exposed by ${devName}. SpO2 is calculated locally on watch and synchronized exclusively via the boAt ProGear companion app.`
        );
      }
      if (!stepsSupported) {
        limitationNotes.push(
          `Pedometer steps & active calories are accumulated in watch flash registers and synchronized via vendor frames (e.g. Realtek 0xFEE7 / 0xFFE0). They are unsupported over standard Bluetooth GATT.`
        );
      }
      if (!sleepSupported) {
        limitationNotes.push(
          `Sleep tracking history requires offline flash synchronization through the boAt ProGear companion app.`
        );
      }

      const gattReport: BleGattReport = {
        timestamp: new Date().toISOString(),
        deviceName: devName,
        deviceId: this.device.id,
        connected: true,
        services: serviceReports,
        supportedFeatures: {
          heartRate: hrSupported,
          spo2: spo2Supported,
          battery: batterySupported,
          steps: stepsSupported,
          calories: caloriesSupported,
          sleep: sleepSupported
        },
        limitationsNotes: limitationNotes
      };

      this.notifyGattReport(gattReport);
      this.notifyDiagnosticChange();
      this.notifyStatus('Connected');
      this.startActiveStream();

      return {
        id: this.device.id,
        name: devName,
        connected: true,
        batteryLevel: this.batteryLevel ?? batteryLevel,
        hrSupported,
        spo2Supported,
        stepsSupported,
        caloriesSupported,
        sleepSupported
      };
    } catch (error: any) {
      this.diagnosticState.gattConnected = false;
      this.diagnosticState.hrNotificationStatus = 'failed';
      this.diagnosticState.hrNotificationError = error?.message || 'Connection failed';
      this.notifyDiagnosticChange();

      if (error?.name === 'NotFoundError') {
        this.notifyStatus('Disconnected');
        throw new Error(
          'No Bluetooth device was selected or found. Make sure your boAt Storm RTL is powered on, disconnected from your phone Bluetooth/boAt ProGear app so it is discoverable, and that Bluetooth is enabled on this computer.'
        );
      } else if (error?.name === 'SecurityError') {
        this.notifyStatus('Permission Required');
        throw new Error(
          'Bluetooth access was blocked by the browser. Please check site permissions in your browser URL bar and allow Bluetooth access.'
        );
      }
      this.notifyStatus('Disconnected');
      throw error;
    }
  }

  /**
   * Handles incoming raw packets from Characteristic 0x2A37 (Heart Rate Measurement).
   * Parses flags, contact status, 8-bit or 16-bit BPM, energy expended, and RR intervals.
   * Tracks diagnostic packet count, timestamps, and raw hex representation.
   */
  private handleHeartRateNotification(dataView: DataView) {
    if (!dataView || dataView.byteLength < 2) return;

    // 1. Diagnostic tracking: raw hex, timestamp, packet count
    this.diagnosticState.packetsReceivedCount += 1;
    this.diagnosticState.lastPacketTimestamp = new Date().toISOString();

    const rawBytes = new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength);
    this.diagnosticState.lastRawPacketHex = Array.from(rawBytes)
      .map(b => '0x' + b.toString(16).padStart(2, '0').toUpperCase())
      .join(' ');

    try {
      const flags = dataView.getUint8(0);
      const is16Bit = (flags & 0x01) !== 0;
      let offset = 1;
      let bpm: number;

      if (is16Bit) {
        if (dataView.byteLength < 3) return;
        bpm = dataView.getUint16(offset, /*littleEndian=*/true);
        offset += 2;
      } else {
        bpm = dataView.getUint8(offset);
        offset += 1;
      }

      // Check contact status bits (per Bluetooth SIG HRS spec Section 3.1.1.1):
      // Bit 1: Sensor Contact Status bit
      // Bit 2: Sensor Contact Status bit
      //   00 or 01: Sensor Contact feature is not supported
      //   10 (0x04): Sensor Contact feature is supported, but contact is NOT detected
      //   11 (0x06): Sensor Contact feature is supported, and contact IS detected
      const contactBits = flags & 0x06;
      let contactDetected: boolean | undefined = undefined;
      if (contactBits === 0x06) {
        contactDetected = true;
        this.diagnosticState.sensorContactStatus = 'contact_detected';
      } else if (contactBits === 0x04) {
        contactDetected = false;
        this.diagnosticState.sensorContactStatus = 'contact_lost';
      } else {
        this.diagnosticState.sensorContactStatus = 'not_supported';
      }

      // Optional Energy Expended (Bit 3)
      let energyExpended: number | undefined = undefined;
      if ((flags & 0x08) !== 0 && offset + 2 <= dataView.byteLength) {
        energyExpended = dataView.getUint16(offset, true);
        offset += 2;
      }

      // Optional RR-Intervals (Bit 4)
      const rrIntervals: number[] = [];
      if ((flags & 0x10) !== 0) {
        while (offset + 1 < dataView.byteLength) {
          const rr = dataView.getUint16(offset, true);
          rrIntervals.push(rr);
          offset += 2;
        }
      }

      // When the watch sensor is warming up or acquiring pulse, it may send BPM = 0
      if (bpm === 0) {
        this.diagnosticState.sensorZeroBpmCount += 1;
        console.log(`[boAt BLE] Packet received with 0 BPM (sensor active, detecting skin contact/pulse)...`);
        this.notifyDiagnosticChange();
        return;
      }

      // Genuine physiological heart rate bounds (35 to 225 BPM)
      if (bpm >= 35 && bpm <= 225) {
        const devName = this.device?.name || 'boAt Storm RTL';
        const reading: BleHeartRateReading = {
          bpm,
          timestamp: new Date().toISOString(),
          contactDetected,
          source: `${devName} (GATT 0x180D / Char 0x2A37)`,
          rrIntervals: rrIntervals.length > 0 ? rrIntervals : undefined,
          energyExpended
        };
        this.notifyHeartRate(reading);
        console.log(`[boAt BLE] Genuine Heart Rate received: ${bpm} BPM (contact: ${contactDetected})`);
      }
    } catch (err) {
      console.warn('[boAt BLE] Error parsing standard heart rate packet:', err);
    }
  }

  /**
   * Parses standard Bluetooth SIG Pulse Oximeter PLX Continuous measurement (0x2A5F) if exposed
   */
  private parseSpO2Value(dataView: DataView) {
    if (!dataView || dataView.byteLength < 3) return;
    try {
      const spo2Raw = dataView.getUint16(1, true);
      const mantissa = spo2Raw & 0x0FFF;
      if (mantissa >= 70 && mantissa <= 100) {
        console.log(`[boAt BLE] Genuine SpO2 reading: ${mantissa}%`);
      }
    } catch (_) {}
  }

  private startActiveStream() {
    this.stopActiveStream();
    // Refresh battery every 45 seconds if battery characteristic exists and is readable
    this.activeStreamTimer = setInterval(async () => {
      if (!this.isConnected()) {
        this.stopActiveStream();
        return;
      }
      if (this.batteryCharacteristic && this.batteryCharacteristic.properties?.read) {
        try {
          const val = await this.batteryCharacteristic.readValue();
          const level = val.getUint8(0);
          if (level >= 0 && level <= 100 && level !== this.batteryLevel) {
            this.notifyBattery(level);
          }
        } catch (_) {}
      }
    }, 45000);
  }

  private stopActiveStream() {
    if (this.activeStreamTimer) {
      clearInterval(this.activeStreamTimer);
      this.activeStreamTimer = null;
    }
  }

  private handleDisconnect() {
    console.log('[boAt BLE] Device disconnected from GATT server');
    this.stopActiveStream();
    this.diagnosticState.gattConnected = false;
    this.diagnosticState.hrNotificationStatus = 'not_supported';
    this.notifyDiagnosticChange();
    this.notifyStatus('Disconnected');
    if (this.lastReport) {
      this.lastReport = {
        ...this.lastReport,
        connected: false
      };
      this.notifyGattReport(this.lastReport);
    }
    this.disconnectListeners.forEach(listener => {
      try {
        listener();
      } catch (err) {
        console.error('Error in disconnect listener:', err);
      }
    });
  }

  public disconnect() {
    this.stopActiveStream();
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.gattServer = null;
    this.hrCharacteristic = null;
    this.batteryCharacteristic = null;
    this.diagnosticState.gattConnected = false;
    this.diagnosticState.hrNotificationStatus = 'not_supported';
    this.notifyDiagnosticChange();
    this.notifyStatus('Disconnected');
    if (this.lastReport) {
      this.lastReport = {
        ...this.lastReport,
        connected: false
      };
      this.notifyGattReport(this.lastReport);
    }
  }

  public isConnected(): boolean {
    return Boolean(this.device?.gatt?.connected);
  }

  public getConnectedDevice(): BleDeviceInfo | null {
    if (!this.device || !this.device.gatt?.connected) return null;
    return {
      id: this.device.id,
      name: this.device.name || 'boAt Storm RTL',
      connected: true,
      batteryLevel: this.batteryLevel ?? undefined,
      hrSupported: Boolean(this.hrCharacteristic),
      spo2Supported: false,
      stepsSupported: false,
      caloriesSupported: false,
      sleepSupported: false
    };
  }
}

export const bleManager = new SmartwatchBleManager();
