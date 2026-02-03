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
  zoneId?: string; // 新增：關聯的分區ID
}

export interface MapRegion {
  id: string;
  coords: [number, number][]; // 儲存精確的頂點經緯度陣列
}

// 用於平面圖上的自訂多邊形範圍 (百分比座標)
export interface ZonePolygon {
  zoneId: string;
  label: string;
  color: string;
  points: {x: number, y: number}[];
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
  hostPosition?: { x: number; y: number };
  mapConfig?: {
    center: [number, number];
    zoom: number;
    regions: MapRegion[]; 
    pins?: MapPin[];      
  };
  sensors: SensorPosition[];
  zoneRegions?: ZonePolygon[]; // 新增：分區範圍多邊形定義
}

export type GridSize = number; // 擴展為支援 1-26
export type TabType = 'camera' | 'security' | 'map' | 'vlm';
export type MainNavType = 'security-center' | 'playback-center' | 'device-center' | 'event-center' | 'account-center' | 'floorplan-center' | 'setting-center';