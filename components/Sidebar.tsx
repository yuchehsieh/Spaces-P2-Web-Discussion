
import React from 'react';
import { Server, Bell, User, Shield, Settings, Layout, History } from 'lucide-react';
import { MainNavType } from '../types';

interface SidebarProps {
  activeNav: MainNavType;
  setActiveNav: (nav: MainNavType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeNav, setActiveNav }) => {
  const topItems: { id: MainNavType; label: string; icon: React.ReactNode }[] = [
    { id: 'security-center', label: '安防\n中心', icon: <Shield size={20} /> },
    { id: 'playback-center', label: '回放\n中心', icon: <History size={20} /> },
    { id: 'device-center', label: '設備\n中心', icon: <Server size={20} /> },
    { id: 'event-center', label: '事件\n中心', icon: <Bell size={20} /> },
    { id: 'account-center', label: '帳號\n中心', icon: <User size={20} /> },
    { id: 'floorplan-center', label: '平面圖\n中心', icon: <Layout size={20} /> },
  ];

  const bottomItems: { id: MainNavType; label: string; icon: React.ReactNode }[] = [
    { id: 'setting-center', label: '設定', icon: <Settings size={20} /> },
  ];

  const NavButton: React.FC<{ item: typeof topItems[0] }> = ({ item }) => (
    <button
      onClick={() => setActiveNav(item.id)}
      className={`flex flex-col items-center justify-center w-full py-4 space-y-1 transition-all border-l-2 ${
        activeNav === item.id 
          ? 'bg-[#1e293b] text-blue-400 border-blue-500 font-bold shadow-inner' 
          : 'bg-transparent text-slate-400 border-transparent hover:bg-[#1e293b]/50 hover:text-slate-200'
      }`}
    >
      <div className="mb-1">{item.icon}</div>
      <span className="text-[10px] text-center whitespace-pre-line leading-tight">{item.label}</span>
    </button>
  );

  return (
    <div className="w-16 bg-[#0f172a] flex flex-col justify-between py-2 border-r border-slate-800 text-white flex-shrink-0 z-20">
      <div className="flex flex-col items-center w-full">
        {topItems.map((item) => (
          <NavButton key={item.id} item={item} />
        ))}
      </div>

      <div className="flex flex-col items-center w-full">
        {bottomItems.map((item) => (
          <NavButton key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
