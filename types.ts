
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
  x: number; // percentage 0-100 or relative to map bounds
  y: number; // percentage 0-100 or relative to map bounds
}

export interface FloorPlanData {
  siteId: string;
  type: 'image' | 'map';
  imageUrl?: string;
  mapConfig?: {
    center: [number, number];
    zoom: number;
    bounds?: [[number, number], [number, number]]; // 選取的地理範圍
  };
  sensors: SensorPosition[];
}

export type GridSize = 1 | 4 | 9 | 16;
export type TabType = 'camera' | 'security' | 'map' | 'vlm';
export type MainNavType = 'security-center' | 'playback-center' | 'device-center' | 'event-center' | 'account-center' | 'floorplan-center' | 'setting-center';
