
import { SiteNode, SecurityEvent, FloorPlanData } from './types';

export const SITE_TREE_DATA: SiteNode[] = [
  {
    id: 'taipei',
    label: '台北市',
    type: 'group',
    isOpen: true,
    children: [
      {
        id: 'hq',
        label: '總公司',
        type: 'site',
        isOpen: true,
        children: [
          {
            id: 'commercial',
            label: '商研中心',
            type: 'zone',
            isOpen: true,
            children: [
              { id: 'c-ipc-1', label: 'IPC-01', type: 'device', deviceType: 'camera' },
              { id: 'c-ipc-2', label: 'IPC-02', type: 'device', deviceType: 'camera' },
              { id: 'c-webcam', label: 'Web Cam', type: 'device', deviceType: 'camera' },
              { id: 'c-pir', label: 'PIR 感應器', type: 'device', deviceType: 'sensor' },
            ],
          },
          {
            id: 'office',
            label: '大辦公區',
            type: 'zone',
            isOpen: false,
            children: [
              { id: 'o-pir', label: 'PIR-Office', type: 'device', deviceType: 'sensor' },
              { id: 'o-webcam', label: 'Web Cam', type: 'device', deviceType: 'camera' },
              { id: 'o-ipc', label: 'IPC-Main', type: 'device', deviceType: 'camera' },
              { id: 'o-door', label: '門磁', type: 'device', deviceType: 'door' },
              { id: 'o-btn', label: '緊急按鈕', type: 'device', deviceType: 'emergency' },
            ],
          },
        ],
      },
      {
        id: 'zhongshan-branch',
        label: '新光保全-中山處',
        type: 'site',
        isOpen: true,
        children: [
          {
            id: 'zhongshan-zone',
            label: '中山駐區',
            type: 'zone',
            isOpen: true,
            children: [
              { id: 'z-btn', label: '緊急按鈕', type: 'device', deviceType: 'emergency' },
              { id: 'z-wdi', label: 'WDI', type: 'device', deviceType: 'sensor' },
              { id: 'z-reader', label: '讀卡機', type: 'device', deviceType: 'sensor' },
              { id: 'z-bullet', label: '槍型攝影機', type: 'device', deviceType: 'camera' },
            ],
          },
          {
            id: 'warehouse',
            label: '倉庫',
            type: 'zone',
            isOpen: true,
            children: [
              { id: 'w-door', label: '門磁', type: 'device', deviceType: 'door' },
              { id: 'w-ipc', label: 'IPC', type: 'device', deviceType: 'camera' },
              { id: 'w-bullet', label: '槍型攝影機', type: 'device', deviceType: 'camera' },
            ],
          },
        ],
      },
    ],
  },
];

export const MOCK_EVENTS: SecurityEvent[] = [
  { 
    id: 'e-vlm-1', 
    timestamp: '16:55:00', 
    type: 'vlm', 
    message: 'Linked: PIR Triggered', 
    location: '商研中心', 
    sensorId: 'c-pir', 
    linkedSensorId: 'c-ipc-2',
    vlmData: {
      captureUrl: 'https://github.com/yuchehsieh/Spaces-P2-Assets/blob/main/images/VLM-Male.png?raw=true',
      fullSceneUrl: 'https://github.com/yuchehsieh/Spaces-P2-Assets/blob/main/images/VLM-Male-Full.png?raw=true',
      features: ['青年'],
      gender: 'male',
      siteName: '櫃台',
      timestamp: '2025-12-18 15:46:53'
    }
  },
  { 
    id: 'e-sos-1', 
    timestamp: '17:15:30', 
    type: 'alert', 
    message: 'SOS 緊急救助請求', 
    location: '大辦公區 - 門口緊急按鈕', 
    sensorId: 'o-btn' 
  },
  { 
    id: 'e-normal-cam', 
    timestamp: '17:05:22', 
    type: 'alert', 
    message: '越界偵測告警', 
    location: '總公司 - 商研中心', 
    sensorId: 'c-ipc-1' 
  },
  { 
    id: 'e-info-1', 
    timestamp: '16:40:15', 
    type: 'info', 
    message: '系統日常巡檢完成', 
    location: '中山處', 
    sensorId: 'z-reader'
  }
];

export const MOCK_SYSTEM_LOGS = [
  { id: 'l1', timestamp: '14:02:11', level: 'INFO', message: 'User login successful (Admin)' },
  { id: 'l2', timestamp: '13:58:22', level: 'WARN', message: 'Camera 2 high latency detected' },
  { id: 'l3', timestamp: '13:55:01', level: 'INFO', message: 'System check complete' },
  { id: 'l4', timestamp: '13:50:00', level: 'INFO', message: 'Cloud sync started' },
  { id: 'l5', timestamp: '12:30:15', level: 'ERROR', message: 'Database connection failed at Node-B' },
  { id: 'l6', timestamp: '11:15:44', level: 'INFO', message: 'Firmware update pushed to 12 devices' },
  { id: 'l7', timestamp: '10:05:12', level: 'WARN', message: 'Storage capacity reaching 90% threshold' },
];

export const MOCK_AUTHORIZATIONS = [
  {
    id: 'auth-1',
    granter: 'AndyChen',
    email: 'andychen.1973@gmail.com',
    units: ['總公司', '商研中心', '大辦公區'],
    validity: 'Permanent',
    grantDate: '2024-05-20',
    type: 'Personal',
    permissions: {
      enabled: true,
      permanent: true,
      allowResharing: true,
      security: {
        view: true,
        settings: true,
        schedule: true,
        cardEdit: false,
        contactEdit: false
      },
      camera: {
        view: true,
        settings: true,
        ptz: true,
        playback: true
      },
      events: true
    }
  },
  {
    id: 'auth-2',
    granter: '新光保全-中山處',
    email: 'service.zs@sks.com.tw',
    units: ['中山駐區', '倉庫'],
    validity: '2025-12-31',
    grantDate: '2024-11-15',
    type: 'Corporate',
    permissions: {
      enabled: true,
      permanent: false,
      allowResharing: false,
      security: {
        view: true,
        settings: false,
        schedule: false,
        cardEdit: false,
        contactEdit: false
      },
      camera: {
        view: true,
        settings: false,
        ptz: false,
        playback: true
      },
      events: true
    }
  },
  {
    id: 'auth-3',
    granter: 'System Admin',
    email: 'system.admin@sks.com.tw',
    units: ['全域監控節點', '緊急應變中心'],
    validity: 'Permanent',
    grantDate: '2023-01-01',
    type: 'System',
    permissions: {
      enabled: true,
      permanent: true,
      allowResharing: true,
      security: {
        view: true,
        settings: true,
        schedule: true,
        cardEdit: true,
        contactEdit: true
      },
      camera: {
        view: true,
        settings: true,
        ptz: true,
        playback: true
      },
      events: true
    }
  }
];

export const INITIAL_FLOOR_PLANS: FloorPlanData[] = [
  {
    siteId: 'hq',
    imageUrl: 'https://github.com/yuchehsieh/Spaces-P2-Assets/blob/main/images/Floor%20Plan.png?raw=true',
    sensors: [
      { id: 'c-ipc-1', x: 25, y: 30 },
      { id: 'c-ipc-2', x: 70, y: 25 },
      { id: 'c-pir', x: 45, y: 45 },
      { id: 'o-door', x: 15, y: 80 },
    ]
  }
];
