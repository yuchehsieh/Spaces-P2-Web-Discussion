
import { SiteNode, SecurityEvent, FloorPlanData } from './types';

export const SITE_TREE_DATA: SiteNode[] = [
  {
    id: 'taipei-group',
    label: '台北市 (Site Group)',
    type: 'group',
    isOpen: true,
    children: [
      {
        id: 'site-hq',
        label: '總公司 (Site)',
        type: 'site',
        isOpen: true,
        address: '台北市內湖區內湖路一段123號',
        children: [
          {
            id: 'host-hq-1',
            label: '商研中心 (主機1)',
            type: 'host',
            isOpen: true,
            children: [
              {
                id: 'zone-hq-office',
                label: '大辦公區 (分區1)',
                type: 'zone',
                isOpen: true,
                children: [
                  { id: 'c-pir', label: 'PIR', type: 'device', deviceType: 'sensor' },
                  { id: 'c-webcam', label: 'Web Cam', type: 'device', deviceType: 'camera' },
                  { id: 'c-ipc-1', label: 'IPC', type: 'device', deviceType: 'camera' },
                  { id: 'o-door', label: '門磁', type: 'device', deviceType: 'door' },
                  { id: 'o-btn', label: '緊急按鈕', type: 'device', deviceType: 'emergency' },
                  { id: 'c-env', label: '環境偵測器', type: 'device', deviceType: 'sensor' },
                  { id: 'c-space', label: '空間偵測器', type: 'device', deviceType: 'sensor' },
                  { id: 'c-multi-btn', label: '多功能按鈕', type: 'device', deviceType: 'emergency' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'site-zhongshan',
        label: '新光保全-中山處 (Site)',
        type: 'site',
        isOpen: true,
        address: '台北市中山區南京東路二段100號',
        children: [
          {
            id: 'host-zs-1',
            label: '中山駐區 (主機1)',
            type: 'host',
            isOpen: true,
            children: [
              {
                id: 'zone-zs-warehouse',
                label: '倉庫 (分區1)',
                type: 'zone',
                isOpen: true,
                children: [
                  { id: 'w-door-1', label: '門磁', type: 'device', deviceType: 'door' },
                  { id: 'w-ipc-1', label: 'IPC', type: 'device', deviceType: 'camera' },
                ],
              },
              {
                id: 'zone-zs-manager',
                label: '部長室 (分區2)',
                type: 'zone',
                isOpen: true,
                children: [
                  { id: 'm-door-1', label: '門磁', type: 'device', deviceType: 'door' },
                  { id: 'm-sos-1', label: 'SOS按鈕', type: 'device', deviceType: 'emergency' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'taichung-group',
    label: '台中市 (Site Group)',
    type: 'group',
    isOpen: true,
    children: [
      {
        id: 'site-beitun',
        label: '新光保全-北屯處 (Site)',
        type: 'site',
        isOpen: true,
        address: '台中市北屯區崇德路三段1號',
        children: [
          {
            id: 'host-bt-1',
            label: '北屯駐區 (主機1)',
            type: 'host',
            isOpen: true,
            children: [
              {
                id: 'zone-bt-office',
                label: '大辦公區 (分區1)',
                type: 'zone',
                isOpen: false,
                children: [
                  { id: 'bt-pir', label: 'PIR', type: 'device', deviceType: 'sensor' },
                  { id: 'bt-webcam', label: 'Web Cam', type: 'device', deviceType: 'camera' },
                  { id: 'bt-door', label: '門磁', type: 'device', deviceType: 'door' },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'site-dajia',
        label: '新光保全-大甲處 (Site)',
        type: 'site',
        isOpen: true,
        address: '台中市大甲區經國路1000號',
        children: [
          {
            id: 'host-dj-1',
            label: '大甲駐區 (主機1)',
            type: 'host',
            isOpen: true,
            children: [
              {
                id: 'zone-dj-warehouse',
                label: '倉庫 (分區1)',
                type: 'zone',
                isOpen: false,
                children: [
                  { id: 'dj-door-1', label: '門磁', type: 'device', deviceType: 'door' },
                  { id: 'dj-ipc-1', label: 'IPC', type: 'device', deviceType: 'camera' },
                ],
              },
              {
                id: 'zone-dj-manager',
                label: '部長室 (分區2)',
                type: 'zone',
                isOpen: false,
                children: [
                  { id: 'dj-m-door-1', label: '門磁', type: 'device', deviceType: 'door' },
                ],
              },
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
    location: '大辦公區 (分區1)', 
    sensorId: 'c-pir', 
    linkedSensorId: 'c-ipc-1',
    vlmData: {
      captureUrl: 'https://github.com/yuchehsieh/Spaces-P2-Assets/blob/main/images/VLM-Male.png?raw=true',
      fullSceneUrl: 'https://github.com/yuchehsieh/Spaces-P2-Assets/blob/main/images/VLM-Male-Full.png?raw=true',
      features: ['青年'],
      gender: 'male',
      siteName: '大辦公區 (分區1)',
      timestamp: '2025-12-18 16:55:00'
    }
  },
  { 
    id: 'e-sos-1', 
    timestamp: '17:15:30', 
    type: 'alert', 
    message: 'SOS 緊急救助請求', 
    location: '大辦公區 - 門口緊急按鈕', 
    sensorId: 'bt-btn-1' 
  },
  { 
    id: 'e-normal-cam', 
    timestamp: '17:05:22', 
    type: 'alert', 
    message: '越界偵測告警', 
    location: '總公司 - 大辦公區 (分區1)', 
    sensorId: 'c-webcam' 
  }
];

export const INITIAL_FLOOR_PLANS: FloorPlanData[] = [
  // --- 台北市群組 ---
  {
    siteId: 'taipei-group',
    type: 'map',
    mapConfig: {
      center: [25.055, 121.55],
      zoom: 13,
      regions: [],
      pins: [
        { id: 'site-hq', label: '總公司', lat: 25.0629, lng: 121.5796 },
        { id: 'site-zhongshan', label: '新光保全-中山處', lat: 25.0528, lng: 121.5332 }
      ]
    },
    sensors: []
  },
  // --- 台中市群組 ---
  {
    siteId: 'taichung-group',
    type: 'map',
    mapConfig: {
      center: [24.25, 120.65],
      zoom: 11,
      regions: [],
      pins: [
        { id: 'site-beitun', label: '新光保全-北屯處', lat: 24.1732, lng: 120.6845 },
        { id: 'site-dajia', label: '新光保全-大甲處', lat: 24.3486, lng: 120.6225 }
      ]
    },
    sensors: []
  },
  // --- 各 Site 預設地圖 ---
  {
    siteId: 'site-hq',
    type: 'map',
    mapConfig: {
      center: [25.0629, 121.5796],
      zoom: 17,
      regions: [],
      pins: [{ id: 'site-hq', label: '總公司', lat: 25.0629, lng: 121.5796 }]
    },
    sensors: []
  },
  {
    siteId: 'site-zhongshan',
    type: 'map',
    mapConfig: {
      center: [25.0528, 121.5332],
      zoom: 17,
      regions: [],
      pins: [{ id: 'site-zhongshan', label: '新光保全-中山處', lat: 25.0528, lng: 121.5332 }]
    },
    sensors: []
  },
  {
    siteId: 'site-beitun',
    type: 'map',
    mapConfig: {
      center: [24.1732, 120.6845],
      zoom: 17,
      regions: [],
      pins: [{ id: 'site-beitun', label: '新光保全-北屯處', lat: 24.1732, lng: 120.6845 }]
    },
    sensors: []
  },
  {
    siteId: 'site-dajia',
    type: 'map',
    mapConfig: {
      center: [24.3486, 120.6225],
      zoom: 17,
      regions: [],
      pins: [{ id: 'site-dajia', label: '新光保全-大甲處', lat: 24.3486, lng: 120.6225 }]
    },
    sensors: []
  },
  // --- 主機層級為影像 (BMP) ---
  {
    siteId: 'host-hq-1',
    type: 'image',
    imageUrl: 'https://github.com/yuchehsieh/Spaces-P2-Assets/blob/main/images/Floor%20Plan.png?raw=true',
    hostPosition: { x: 75, y: 50 },
    sensors: [
      { id: 'c-webcam', x: 23.5, y: 41.5 },  
      { id: 'c-ipc-1', x: 44.8, y: 38.2 },   
      { id: 'c-pir', x: 33.6, y: 50.8 },     
      { id: 'o-door', x: 18.5, y: 71.2 },    
    ]
  },
  {
    siteId: 'host-zs-1',
    type: 'image',
    imageUrl: 'https://github.com/yuchehsieh/Spaces-P2-Assets/blob/main/images/Floor%20Plan%202.png?raw=true',
    hostPosition: { x: 70, y: 30 },
    sensors: [
      { id: 'w-door-1', x: 20, y: 25 },  
      { id: 'w-ipc-1', x: 40, y: 20 },   
      { id: 'm-door-1', x: 25, y: 65 },  
      { id: 'm-sos-1', x: 50, y: 75 },   
    ]
  }
];

export const MOCK_SYSTEM_LOGS = [
  { id: '1', timestamp: '17:45:12', level: 'INFO', message: 'User Admin logged in from 192.168.1.105' },
  { id: '2', timestamp: '17:48:05', level: 'WARN', message: 'Repeated failed login attempt from 10.0.4.22' },
  { id: '3', timestamp: '17:50:30', level: 'INFO', message: 'Zone "大辦公區" armed by Admin' },
  { id: '4', timestamp: '17:55:00', level: 'ERROR', message: 'Camera IPC-1 connection lost' },
  { id: '5', timestamp: '18:02:15', level: 'INFO', message: 'System backup completed successfully' },
];

export const MOCK_AUTHORIZATIONS = [
  {
    id: 'auth-1',
    granter: 'SKS System Admin',
    email: 'admin@sks.com.tw',
    type: 'System',
    validity: 'Permanent',
    grantDate: '2025-01-10',
    units: ['總公司 (Site)', '商研中心 (主機1)', '大辦公區 (分區1)'],
    permissions: {
      enabled: true,
      permanent: true,
      allowResharing: true,
      security: { view: true, settings: true, schedule: true, cardEdit: true, contactEdit: true },
      camera: { view: true, settings: true, ptz: true, playback: true },
      events: true
    }
  }
];
