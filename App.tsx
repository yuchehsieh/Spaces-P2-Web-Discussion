import React, { useState, useMemo, useEffect } from 'react';
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
import FloorPlanCenterTab from './components/FloorPlanCenterTab';
import PlaybackTab from './components/PlaybackTab';
import VLMTab from './components/VLMTab'; 
import DeviceDetailModal from './components/DeviceDetailModal';
import { SITE_TREE_DATA, MOCK_EVENTS, INITIAL_FLOOR_PLANS } from './constants';
import { MainNavType, SiteNode, TabType, GridSize, SecurityEvent } from './types';
import { Grid2x2, Grid3x3, Square, User as UserIcon } from 'lucide-react';

const App: React.FC = () => {
  const [activeNav, setActiveNav] = useState<MainNavType>('security-center');
  const [activeTab, setActiveTab] = useState<TabType>('camera');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState<GridSize>(4);
  const [events, setEvents] = useState<SecurityEvent[]>(MOCK_EVENTS);
  
  const [viewingSiteId, setViewingSiteId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [defaultViewId, setDefaultViewId] = useState<string | null>(() => localStorage.getItem('sks_default_map_view'));

  const [videoSlots, setVideoSlots] = useState<Record<number, VideoSlotData>>({});
  const [detailModalSlot, setDetailModalSlot] = useState<{ id: string; label: string; nodeType?: string } | null>(null);
  
  const [eventCenterInitialTab, setEventCenterInitialTab] = useState<'list' | 'settings' | 'security-schedule'>('list');

  const idsWithFloorPlan = useMemo(() => new Set(INITIAL_FLOOR_PLANS.map(p => p.siteId)), []);

  const handleNodeSelect = (node: SiteNode) => {
    setSelectedNodeId(node.id);
    if (activeTab === 'map' && selectedEventId) {
      setSelectedEventId(null);
    }
  };

  const handleSetDefaultView = (id: string | null) => {
    if (id) {
        localStorage.setItem('sks_default_map_view', id);
        setDefaultViewId(id);
    } else {
        localStorage.removeItem('sks_default_map_view');
        setDefaultViewId(null);
    }
  };

  const handleJumpToFloorPlan = (siteId: string) => {
    setSelectedNodeId(siteId);
    setActiveNav('floorplan-center');
  };

  const handleJumpToNav = (nav: MainNavType, subTab?: string) => {
    // 1. 強制立即關閉詳情 Modal，釋放 DOM 佔用
    setDetailModalSlot(null);
    
    // 2. 設定目標子分頁的初始狀態（如有需要）
    if (nav === 'event-center') {
      if (subTab === 'security-schedule') {
        setEventCenterInitialTab('security-schedule');
      } else if (subTab === 'settings') {
        setEventCenterInitialTab('settings');
      } else {
        setEventCenterInitialTab('list');
      }
    }
    
    // 3. 增加關鍵延遲 (150ms)，確保 Modal 完全卸載後再執行頁面切換
    setTimeout(() => {
        setActiveNav(prev => nav);
    }, 150);
  };

  const findHierarchy = (targetId: string) => {
    let result = { siteGroup: '', siteName: '' };
    const traverse = (nodes: SiteNode[], groupLabel: string = '', siteLabel: string = ''): boolean => {
      for (const node of nodes) {
        const currentGroup = node.type === 'group' ? node.label : groupLabel;
        const currentSite = node.type === 'site' ? node.label : siteLabel;
        if (node.id === targetId) {
          result = { siteGroup: currentGroup.replace(' (Site Group)', ''), siteName: currentSite.replace(' (Site)', '') };
          return true;
        }
        if (node.children && traverse(node.children, currentGroup, currentSite)) return true;
      }
      return false;
    };
    traverse(SITE_TREE_DATA);
    return result;
  };

  const handleDropCamera = (index: number, camera: { id: string; label: string; deviceType?: string; nodeType?: string }) => {
    const hierarchy = findHierarchy(camera.id);
    setVideoSlots(prev => ({
      ...prev,
      [index]: { 
        ...camera, 
        isRecording: false,
        siteGroup: hierarchy.siteGroup,
        siteName: hierarchy.siteName
      }
    }));
  };

  const handleMoveCamera = (fromIndex: number, toIndex: number) => {
    setVideoSlots(prev => {
      const next = { ...prev };
      const sourceData = next[fromIndex];
      const targetData = next[toIndex];
      if (sourceData) {
        next[toIndex] = sourceData;
        if (targetData) next[fromIndex] = targetData;
        else delete next[fromIndex];
      }
      return next;
    });
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
        return { ...prev, [index]: { ...prev[index], isRecording: !prev[index].isRecording } };
    });
  };

  const handleClearEvents = () => setEvents([]);

  return (
    <div className="flex flex-col h-screen w-screen bg-black text-slate-200 overflow-hidden font-sans">
      <header className="h-14 bg-[#004a99] flex items-center justify-between px-4 border-b border-slate-800 shrink-0 z-30 shadow-md">
         <div className="flex items-center">
            <div className="flex items-center justify-center p-1">
               <img src="https://github.com/yuchehsieh/Spaces-P2-Assets/blob/main/images/LOGO_SKS_NEW2.png?raw=true" alt="SKS Logo" className="h-9 w-auto object-contain" />
            </div>
            <span className="ml-3 text-sm text-blue-200 font-medium tracking-wide opacity-80 border-l border-blue-400/30 pl-3">Security Dashboard Draft</span>
         </div>
         <div className="flex items-center space-x-6 text-sm">
             <div className="flex items-center text-white font-medium bg-blue-800/50 px-3 py-1.5 rounded-full border border-blue-700">
                <UserIcon size={16} className="mr-2" />
                <span>Admin</span>
             </div>
         </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} />

        {activeNav === 'security-center' ? (
          <>
            <SiteTree data={SITE_TREE_DATA} onSelect={handleNodeSelect} selectedId={selectedNodeId} showFloorPlanIcons={activeTab === 'map'} idsWithFloorPlan={idsWithFloorPlan} defaultViewId={defaultViewId} onSetDefaultView={handleSetDefaultView} />
            <div className="flex-1 flex flex-col min-w-0 bg-[#050914] relative border-r border-slate-800">
                <div className="flex items-center bg-[#0f172a] border-b border-slate-800 h-16 px-4 shrink-0">
                    <div className="flex items-center bg-[#050914] p-1 rounded-2xl border border-slate-800/50 shadow-inner">
                        {[
                            { id: 'camera', label: 'Tab1 Camera' },
                            { id: 'security', label: 'Tab2 Security' },
                            { id: 'map', label: 'Tab3 Map' },
                            { id: 'vlm', label: 'Tab4 VLM' },
                        ].map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                              <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)} className={`px-6 py-2.5 rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center min-w-[120px] ${isActive ? 'bg-blue-600 text-white font-black shadow-lg shadow-blue-900/40 ring-1 ring-white/10' : 'text-slate-500 font-bold hover:text-slate-300 hover:bg-white/5'}`}>{tab.label}</button>
                            );
                        })}
                    </div>
                    {activeTab === 'camera' && (
                    <div className="ml-auto flex items-center bg-[#050914] p-1 rounded-2xl border border-slate-800/50 shadow-inner gap-0.5">
                        <button onClick={() => setGridSize(1)} className={`p-2 rounded-xl transition-all active:scale-90 ${gridSize === 1 ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`} title="Single View"><Square size={14} strokeWidth={3} /></button>
                        <button onClick={() => setGridSize(4)} className={`p-2 rounded-xl transition-all active:scale-90 ${gridSize === 4 ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`} title="2x2 Grid"><Grid2x2 size={14} /></button>
                        <button onClick={() => setGridSize(9)} className={`p-2 rounded-xl transition-all active:scale-90 ${gridSize === 9 ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`} title="3x3 Grid"><Grid3x3 size={14} /></button>
                        <button onClick={() => setGridSize(16)} className={`p-2 rounded-xl transition-all active:scale-90 ${gridSize === 16 ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`} title="4x4 Grid"><Square size={14} /></button>
                    </div>
                    )}
                </div>
                <div className="flex-1 relative overflow-hidden">
                    {activeTab === 'camera' && (
                        <VideoGrid gridSize={gridSize} activeSlots={videoSlots} onDropCamera={handleDropCamera} onMoveCamera={handleMoveCamera} onRemoveCamera={handleRemoveCamera} onToggleRecording={handleToggleRecording} onJumpToNav={handleJumpToNav} onOpenDetail={setDetailModalSlot} />
                    )}
                    {activeTab === 'security' && <SecurityTab onJumpToNav={(nav) => handleJumpToNav(nav, 'security-schedule')} />}
                    {activeTab === 'map' && (
                        <MapTab activeNodeId={selectedNodeId} activeEventId={selectedEventId} onEventSelect={setSelectedEventId} onViewingSiteChange={setViewingSiteId} defaultViewId={defaultViewId} onSetDefaultView={handleSetDefaultView} onJumpToFloorPlan={handleJumpToFloorPlan} onAutoSelectNode={(id) => setSelectedNodeId(id)} onOpenDetail={setDetailModalSlot} />
                    )}
                    {activeTab === 'vlm' && <VLMTab />}
                </div>
            </div>
            <EventPanel events={events} onClearEvents={handleClearEvents} activeSiteId={viewingSiteId} selectedEventId={selectedEventId} onEventSelect={setSelectedEventId} />
          </>
        ) : (
          <div className="flex-1 flex overflow-hidden relative">
             {activeNav === 'playback-center' ? <PlaybackTab /> : activeNav === 'setting-center' ? <SettingTab /> : activeNav === 'account-center' ? <AccountTab /> : activeNav === 'floorplan-center' ? <FloorPlanCenterTab initialSiteId={selectedNodeId} /> : activeNav === 'event-center' ? <EventTab initialSubTab={eventCenterInitialTab} /> : activeNav === 'device-center' ? <DeviceTab /> : <div className="flex-1 flex items-center justify-center bg-[#050914] text-slate-500 italic">資料載入中...</div>}
          </div>
        )}
      </div>

      {detailModalSlot && (
        <DeviceDetailModal slot={detailModalSlot} onClose={() => setDetailModalSlot(null)} onJumpToNav={handleJumpToNav} />
      )}
    </div>
  );
};

export default App;