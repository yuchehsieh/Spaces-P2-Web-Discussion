
export interface SiteNode {
  id: string;
  label: string;
  type: 'group' | 'site' | 'host' | 'zone' | 'device';
  deviceType?: 'camera' | 'sensor' | 'door' | 'emergency';
  children?: SiteNode[];
  isOpen?: boolean; // Initial state
  address?: string; // 據點地址 (用於 GIS 導航)
}

export interface Schedule {
  id: string;
  name: string;
  siteId: string;
  siteLabel: string;
  hostId: string;
  hostLabel: string;
  zoneId: string; 
  zoneLabel: string;
  armTime: string;    
  disarmTime: string; 
  days: string[]; 
  isActive: boolean;
  createdBy: string;
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

export interface MapRegion {
  id: string;
  coords: [number, number][]; // 儲存精確的頂點經緯度陣列
}

export interface MapPin {
  id: string;
  label: string;
  lat: number;
  lng: number;
}

export interface FloorPlanData {
  siteId: string;
  type: 'image' | 'map';
  imageUrl?: string;
  hostPosition?: { x: number; y: number }; // 新增：主機在 BMP 上的位置
  mapConfig?: {
    center: [number, number];
    zoom: number;
    regions: MapRegion[]; 
    pins?: MapPin[];      
  };
  sensors: SensorPosition[];
}

export type GridSize = 1 | 4 | 9 | 16;
export type TabType = 'camera' | 'security' | 'map' | 'vlm';
export type MainNavType = 'security-center' | 'playback-center' | 'device-center' | 'event-center' | 'account-center' | 'floorplan-center' | 'setting-center';
