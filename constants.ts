
import { SiteNode, SecurityEvent } from './types';

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
              { id: 'c-ipc-1', label: 'IPC', type: 'device', deviceType: 'camera' },
              { id: 'c-ipc-2', label: 'IPC', type: 'device', deviceType: 'camera' },
              { id: 'c-webcam', label: 'Web Cam', type: 'device', deviceType: 'camera' },
              { id: 'c-pir', label: 'PIR', type: 'device', deviceType: 'sensor' },
            ],
          },
          {
            id: 'office',
            label: '大辦公區',
            type: 'zone',
            isOpen: false,
            children: [
              { id: 'o-pir', label: 'PIR', type: 'device', deviceType: 'sensor' },
              { id: 'o-webcam', label: 'Web Cam', type: 'device', deviceType: 'camera' },
              { id: 'o-ipc', label: 'IPC', type: 'device', deviceType: 'camera' },
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
          {
            id: 'manager-office',
            label: '部長室',
            type: 'zone',
            isOpen: true,
            children: [
              { id: 'm-door', label: '門磁', type: 'device', deviceType: 'door' },
            ],
          },
        ],
      },
    ],
  },
];

export const MOCK_EVENTS: SecurityEvent[] = [
  { id: 'e1', timestamp: '17:00:40', type: 'alert', message: 'Motion Detected', location: '商研中心 - IPC' },
  { id: 'e2', timestamp: '16:58:12', type: 'info', message: 'Door Normal', location: '倉庫 - 門磁' },
  { id: 'e3', timestamp: '16:45:00', type: 'info', message: 'System Check', location: '中山駐區' },
  { id: 'e4', timestamp: '16:30:22', type: 'alert', message: 'Line Cross', location: '大辦公區 - IPC' },
  { id: 'e5', timestamp: '16:15:10', type: 'info', message: 'User Login', location: 'Admin' },
];
