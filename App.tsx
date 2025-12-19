import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import SiteTree from './components/SiteTree';
import VideoGrid, { VideoSlotData } from './components/VideoGrid';
import EventPanel from './components/EventPanel';
import SecurityTab from './components/SecurityTab';
import MapTab from './components/MapTab'; 
import SettingTab from './components/SettingTab';
import AccountTab from './components/AccountTab';
import EventTab from './components/EventTab';
import DeviceTab from './components/DeviceTab';
import { SITE_TREE_DATA, MOCK_EVENTS } from './constants';
import { MainNavType, SiteNode, TabType, GridSize, SecurityEvent } from './types';
import { Grid2x2, Grid3x3, Square, User as UserIcon } from 'lucide-react';

const App: React.FC = () => {
  const [activeNav, setActiveNav] = useState<MainNavType>('security-center');
  const [activeTab, setActiveTab] = useState<TabType>('camera');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState<GridSize>(4);
  const [events, setEvents] = useState<SecurityEvent[]>(MOCK_EVENTS);
  
  // State to track which camera is in which slot. Key is slot index.
  const [videoSlots, setVideoSlots] = useState<Record<number, VideoSlotData>>({});

  const handleNodeSelect = (node: SiteNode) => {
    setSelectedNodeId(node.id);
  };

  const handleDropCamera = (index: number, camera: { id: string; label: string }) => {
    setVideoSlots(prev => ({
      ...prev,
      [index]: { ...camera, isRecording: false }
    }));
  };

  const handleRemoveCamera = (index: number) => {
    setVideoSlots(prev => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });
  };

  const handleToggleRecording = (index: number) => {
    setVideoSlots(prev => {
        if (!prev[index]) return prev;
        return {
            ...prev,
            [index]: {
                ...prev[index],
                isRecording: !prev[index].isRecording
            }
        };
    });
  };

  const handleClearEvents = () => {
    setEvents([]);
  };

  // Fixed 4x4 Grid Icon SVG path
  const Grid4x4Icon = ({ size = 16, className = "" }) => (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 16 16" 
      fill="currentColor" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M1 1h2.5v2.5H1V1zm3.5 0h2.5v2.5H4.5V1zm3.5 0h2.5v2.5H8V1zm3.5 0H14v2.5h-2.5V1zM1 4.5h2.5v2.5H1v-2.5zm3.5 0h2.5v2.5H4.5v-2.5zm3.5 0h2.5v2.5H8v-2.5zm3.5 0H14v2.5h-2.5v-2.5zM1 8h2.5v2.5H1V8zm3.5 0h2.5v2.5H4.5V8zm3.5 0h2.5v2.5H8V8zm3.5 0H14v2.5h-2.5V8zm-10.5 3.5h2.5v2.5H1v-2.5zm3.5 0h2.5v2.5H4.5v-2.5zm3.5 0h2.5v2.5H8v-2.5zm3.5 0H14v2.5h-2.5v-2.5z" />
    </svg>
  );

  return (
    <div className="flex flex-col h-screen w-screen bg-black text-slate-200 overflow-hidden font-sans">
      
      {/* 0. Top Header Bar */}
      <header className="h-14 bg-[#004a99] flex items-center justify-between px-4 border-b border-slate-800 shrink-0 z-30 shadow-md">
         {/* Left: Logo */}
         <div className="flex items-center">
            <div className="flex items-center justify-center p-1">
               <img 
                 src="https://github.com/yuchehsieh/Spaces-P2-Assets/blob/main/images/LOGO_SKS_NEW2.png?raw=true" 
                 alt="SKS Logo" 
                 className="h-9 w-auto object-contain"
                 onError={(e) => {
                    // Fallback to text if image fails to load
                    (e.target as any).style.display = 'none';
                    const parent = (e.target as any).parentElement;
                    if (parent) {
                        const textLogo = document.createElement('div');
                        textLogo.className = "font-bold text-xl text-white";
                        textLogo.innerText = "SKS";
                        parent.appendChild(textLogo);
                    }
                 }}
               />
            </div>
            <span className="ml-3 text-sm text-blue-200 font-medium tracking-wide opacity-80 border-l border-blue-400/30 pl-3">
              Security Dashboard Draft
            </span>
         </div>

         {/* Right: User Info */}
         <div className="flex items-center space-x-6 text-sm">
             <div className="flex items-center text-white font-medium bg-blue-800/50 px-3 py-1.5 rounded-full border border-blue-700">
                <UserIcon size={16} className="mr-2" />
                <span>Admin</span>
             </div>
         </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0">
        {/* 1. Sidebar (Regrouped) */}
        <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} />

        {/* 2. Center Presentation Areas based on activeNav */}
        {activeNav === 'security-center' ? (
          <>
            <SiteTree 
                data={SITE_TREE_DATA} 
                onSelect={handleNodeSelect} 
                selectedId={selectedNodeId} 
            />

            <div className="flex-1 flex flex-col min-w-0 bg-[#050914] relative">
                {/* Tab Navigation */}
                <div className="flex items-end bg-black border-b border-slate-800 h-10 px-2 pt-2">
                    {[
                        { id: 'camera', label: 'Tab1 Camera' },
                        { id: 'security', label: 'Tab2 Security' },
                        { id: 'map', label: 'Tab3 Map' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`px-4 py-1.5 text-sm mr-1 rounded-t-md transition-all ${
                                activeTab === tab.id 
                                ? 'bg-[#1e293b] text-white border-t border-x border-slate-700' 
                                : 'bg-black text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                    
                    {/* Grid Controls */}
                    {activeTab === 'camera' && (
                    <div className="ml-auto flex items-center space-x-1 pb-1 pr-2">
                        <button onClick={() => setGridSize(1)} className={`p-1 rounded ${gridSize === 1 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`} title="Single View"><Square size={16} strokeWidth={2.5} /></button>
                        <button onClick={() => setGridSize(4)} className={`p-1 rounded ${gridSize === 4 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`} title="2x2 Grid"><Grid2x2 size={16} /></button>
                        <button onClick={() => setGridSize(9)} className={`p-1 rounded ${gridSize === 9 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`} title="3x3 Grid"><Grid3x3 size={16} /></button>
                        <button onClick={() => setGridSize(16)} className={`p-1 rounded ${gridSize === 16 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`} title="4x4 Grid"><Grid4x4Icon size={16} /></button>
                    </div>
                    )}
                </div>

                <div className="flex-1 relative overflow-hidden">
                    {activeTab === 'camera' && (
                        <VideoGrid 
                        gridSize={gridSize} 
                        activeSlots={videoSlots}
                        onDropCamera={handleDropCamera}
                        onRemoveCamera={handleRemoveCamera}
                        onToggleRecording={handleToggleRecording}
                        />
                    )}
                    {activeTab === 'security' && <SecurityTab />}
                    {activeTab === 'map' && <MapTab />}
                    
                    <div className="absolute bottom-2 left-0 w-full text-center text-xs text-gray-500 pointer-events-none z-10">
                        (內容呈現區)
                    </div>
                </div>
            </div>
          </>
        ) : (
          /* Real content for other navigation sections */
          <div className="flex-1 flex overflow-hidden">
             {activeNav === 'setting-center' ? (
                <SettingTab />
             ) : activeNav === 'account-center' ? (
                <AccountTab />
             ) : activeNav === 'event-center' ? (
                <EventTab />
             ) : activeNav === 'device-center' ? (
                <DeviceTab />
             ) : (
                <div className="flex-1 flex items-center justify-center bg-[#050914] text-slate-500 italic">
                   資料載入中...
                </div>
             )}
          </div>
        )}

        {/* 4. Event Presentation Area (Right) */}
        <EventPanel events={events} onClearEvents={handleClearEvents} />
      </div>

    </div>
  );
};

export default App;