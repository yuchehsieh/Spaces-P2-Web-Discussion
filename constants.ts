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
                isOpen: true,
                children: [
                  { id: 'bt-pir', label: 'PIR', type: 'device', deviceType: 'sensor' },
                  { id: 'bt-btn-1', label: '緊急按鈕', type: 'device', deviceType: 'emergency' },
                  { id: 'bt-webcam', label: 'Web Cam', type: 'device', deviceType: 'camera' },
                  { id: 'bt-ipc-1', label: 'IPC', type: 'device', deviceType: 'camera' },
                  { id: 'bt-ipc-2', label: 'IPC', type: 'device', deviceType: 'camera' },
                  { id: 'bt-door', label: '門磁', type: 'device', deviceType: 'door' },
                  { id: 'bt-btn-2', label: '緊急按鈕', type: 'device', deviceType: 'emergency' },
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
                isOpen: true,
                children: [
                  { id: 'dj-door-1', label: '門磁', type: 'device', deviceType: 'door' },
                  { id: 'dj-ipc-1', label: 'IPC', type: 'device', deviceType: 'camera' },
                  { id: 'dj-ipc-2', label: 'IPC', type: 'device', deviceType: 'camera' },
                  { id: 'dj-pir-1', label: 'PIR', type: 'device', deviceType: 'sensor' },
                ],
              },
              {
                id: 'zone-dj-manager',
                label: '部長室 (分區2)',
                type: 'zone',
                isOpen: true,
                children: [
                  { id: 'dj-m-door-1', label: '門磁', type: 'device', deviceType: 'door' },
                  { id: 'dj-m-door-2', label: '門磁', type: 'device', deviceType: 'door' },
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

export const MOCK_SYSTEM_LOGS = [
  { id: 'l1', timestamp: '14:02:11', level: 'INFO', message: 'User login successful (Admin)' },
  { id: 'l2', timestamp: '13:58:22', level: 'WARN', message: 'Camera 2 high latency detected' },
  { id: 'l3', timestamp: '13:55:01', level: 'INFO', message: 'System check complete' },
];

export const MOCK_AUTHORIZATIONS = [
  {
    id: 'auth-1',
    granter: 'AndyChen',
    email: 'andychen.1973@gmail.com',
    units: ['總公司 (Site)', '商研中心 (主機1)'],
    validity: 'Permanent',
    grantDate: '2024-05-20',
    type: 'Personal',
    permissions: {
      enabled: true,
      permanent: true,
      allowResharing: true,
      security: { view: true, settings: true, schedule: true, cardEdit: false, contactEdit: false },
      camera: { view: true, settings: true, ptz: true, playback: true },
      events: true
    }
  }
];

export const INITIAL_FLOOR_PLANS: FloorPlanData[] = [
  {
    siteId: 'site-hq',
    imageUrl: 'https://github.com/yuchehsieh/Spaces-P2-Assets/blob/main/images/Floor%20Plan.png?raw=true',
    sensors: [
      { id: 'c-ipc-1', x: 45, y: 39 },    // 連動攝影機 (藍色圈)
      { id: 'c-pir', x: 33, y: 52 },      // PIR 感測器 (中心連動點)
      { id: 'c-webcam', x: 23, y: 43 },   // 越界偵測攝影機 (紅色圈)
      { id: 'o-door', x: 18, y: 73 },     // 門磁 (左下角)
    ]
  }
];