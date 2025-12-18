
export interface SiteNode {
  id: string;
  label: string;
  type: 'group' | 'site' | 'zone' | 'device';
  deviceType?: 'camera' | 'sensor' | 'door' | 'emergency';
  children?: SiteNode[];
  isOpen?: boolean; // Initial state
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  type: 'alert' | 'info' | 'warning';
  message: string;
  location: string;
}

export type GridSize = 1 | 4 | 9 | 16;
export type TabType = 'camera' | 'security' | 'map';
export type MainNavType = 'security-center' | 'device-center' | 'event-center' | 'account-center';
