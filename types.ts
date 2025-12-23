
export interface SiteNode {
  id: string;
  label: string;
  type: 'group' | 'site' | 'host' | 'zone' | 'device';
  deviceType?: 'camera' | 'sensor' | 'door' | 'emergency';
  children?: SiteNode[];
  isOpen?: boolean; // Initial state
}

export interface VLMData {
  captureUrl: string;
  fullSceneUrl: string;
  features: string[];
  gender?: 'male' | 'female';
  siteName: string;
  timestamp: string;
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  type: 'alert' | 'info' | 'warning' | 'vlm';
  message: string;
  location: string;
  sensorId?: string; // Associated sensor ID
  linkedSensorId?: string; // For linked events
  vlmData?: VLMData; // Data for VLM events
}

export interface SensorPosition {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
}

export interface FloorPlanData {
  siteId: string;
  imageUrl: string;
  sensors: SensorPosition[];
}

export type GridSize = 1 | 4 | 9 | 16;
export type TabType = 'camera' | 'security' | 'map';
export type MainNavType = 'security-center' | 'device-center' | 'event-center' | 'account-center' | 'setting-center';
