import React, { useState, useMemo, useEffect, useRef } from 'react';
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
import { Grid2x2, Grid3x3, Square, User as UserIcon, LayoutGrid, ChevronDown, Check } from 'lucide-react';

const App: React.FC = () => {
  const [activeNav, setActiveNav] = useState<MainNavType>('security-center');
  const [activeTab, setActiveTab] = useState<TabType>('camera');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState<GridSize>(4);
  const [isGridMenuOpen, setIsGridMenuOpen] = useState(false);
  const gridMenuRef = useRef<HTMLDivElement>(null);

  const [events, setEvents] = useState<SecurityEvent[]>(MOCK_EVENTS);
  const [viewingSiteId, setViewingSiteId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [defaultViewId, setDefaultViewId] = useState<string | null>(() => localStorage.getItem('sks_default_map_view'));

  const [videoSlots, setVideoSlots] = useState<Record<number, VideoSlotData>>({});
  const [detailModalSlot, setDetailModalSlot] = useState<{ id: string; label: string; nodeType?: string } | null>(null);
  const [eventCenterInitialTab, setEventCenterInitialTab] = useState<'list' | 'settings' | 'security-schedule'>('list');

  const idsWithFloorPlan = useMemo(() => new Set(INITIAL_FLOOR_PLANS.map(p => p.siteId)), []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (gridMenuRef.current && !gridMenuRef.current.contains(e.target as Node)) {
        setIsGridMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    setDetailModalSlot(null);
    if (nav === 'event-center') {
      if (subTab === 'security-schedule') setEventCenterInitialTab('security-schedule');
      else if (subTab === 'settings') setEventCenterInitialTab('settings');
      else setEventCenterInitialTab('list');
    }
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

  // --- 宮格預覽圖示元件：符合附件 1-10 宮格樣式並加深選中效果 ---
  const GridPreviewIcon = ({ size, isSelected }: { size: number; isSelected: boolean }) => {
    const stroke = isSelected ? "white" : "currentColor";
    const strokeWidth = isSelected ? 2.5 : 1;
    const fill = "none";
    
    return (
      <div className={`w-10 h-6 shrink-0 transition-colors ${isSelected ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`}>
        <svg viewBox="0 0 100 60" className="w-full h-full">
          {size === 1 && (
            <rect x="2" y="2" width="96" height="56" rx="2" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
          )}
          {size === 2 && (
            <>
              <rect x="2" y="2" width="46" height="56" rx="2" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
              <rect x="52" y="2" width="46" height="56" rx="2" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
            </>
          )}
          {size === 3 && (
            <>
              <rect x="2" y="2" width="46" height="56" rx="2" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
              <rect x="52" y="2" width="46" height="26" rx="2" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
              <rect x="52" y="32" width="46" height="26" rx="2" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
            </>
          )}
          {size === 4 && (
            <>
              <rect x="2" y="2" width="46" height="26" rx="2" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
              <rect x="52" y="2" width="46" height="26" rx="2" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
              <rect x="2" y="32" width="46" height="26" rx="2" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
              <rect x="52" y="32" width="46" height="26" rx="2" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
            </>
          )}
          {size === 5 && (
            <>
              {/* 五宮格: 左一大, 右四小 (符合附件圖片) */}
              <rect x="2" y="2" width="46" height="56" rx="2" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
              <rect x="52" y="2" width="22" height="26" rx="1" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
              <rect x="76" y="2" width="22" height="26" rx="1" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
              <rect x="52" y="32" width="22" height="26" rx="1" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
              <rect x="76" y="32" width="22" height="26" rx="1" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
            </>
          )}
          {size === 6 && (
            <>
              {/* 六宮格: 1大(2x2)+5小 */}
              <rect x="2" y="2" width="62" height="36" rx="1.5" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
              <rect x="68" y="2" width="30" height="16" rx="1" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
              <rect x="68" y="21" width="30" height="16" rx="1" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
              <rect x="2" y="42" width="30" height="16" rx="1" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
              <rect x="35" y="42" width="30" height="16" rx="1" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
              <rect x="68" y="42" width="30" height="16" rx="1" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
            </>
          )}
          {size === 7 && (
            <>
              {/* 七宮格: 1大(3x2)+2右+4下 (精確符合附件圖片 2) */}
              <rect x="2" y="2" width="71" height="36" rx="1.5" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
              <rect x="76" y="2" width="22" height="16" rx="1" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
              <rect x="76" y="21" width="22" height="16" rx="1" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
              <rect x="2" y="42" width="22" height="16" rx="1" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
              <rect x="26" y="42" width="23" height="16" rx="1" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
              <rect x="52" y="42" width="22" height="16" rx="1" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
              <rect x="76" y="42" width="22" height="16" rx="1" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
            </>
          )}
          {size === 8 && (
            <>
              {/* 八宮格: 1大(4x2)+2右+5下 */}
              <rect x="2" y="2" width="78" height="36" rx="1.5" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
              <rect x="83" y="2" width="15" height="16" rx="1" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
              <rect x="83" y="21" width="15" height="16" rx="1" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
              <rect x="2" y="42" width="16" height="16" rx="1" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
              <rect x="22" y="42" width="17" height="16" rx="1" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
              <rect x="42" y="42" width="16" height="16" rx="1" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
              <rect x="62" y="42" width="16" height="16" rx="1" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
              <rect x="82" y="42" width="16" height="16" rx="1" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
            </>
          )}
          {size === 9 && (
            <>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <rect key={i} x={(i % 3) * 33 + 2} y={Math.floor(i / 3) * 20 + 2} width="29" height="16" rx="1" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
              ))}
            </>
          )}
          {size === 10 && (
            <>
              {/* 十宮格: 上2大(2x2), 下8小 */}
              <rect x="2" y="2" width="46" height="26" rx="1.5" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
              <rect x="52" y="2" width="46" height="26" rx="1.5" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
              <rect x="2" y="32" width="22" height="12" rx="1" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
              <rect x="26" y="32" width="22" height="12" rx="1" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
              <rect x="50" y="32" width="22" height="12" rx="1" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
              <rect x="74" y="32" width="22" height="12" rx="1" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
              <rect x="2" y="46" width="22" height="12" rx="1" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
              <rect x="26" y="46" width="22" height="12" rx="1" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
              <rect x="50" y="46" width="22" height="12" rx="1" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
              <rect x="74" y="46" width="22" height="12" rx="1" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
            </>
          )}
          {size > 10 && (
            Array.from({ length: 12 }).map((_, i) => (
              <rect key={i} x={(i % 4) * 24 + 2} y={Math.floor(i / 4) * 20 + 2} width="20" height="16" rx="1" stroke={stroke} strokeWidth={strokeWidth} fill={fill} />
            ))
          )}
        </svg>
      </div>
    );
  };

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

                    {/* 宮格選擇器 (1-26) */}
                    {activeTab === 'camera' && (
                    <div className="ml-auto relative" ref={gridMenuRef}>
                        <button 
                          onClick={() => setIsGridMenuOpen(!isGridMenuOpen)}
                          className={`flex items-center gap-3 px-4 py-2.5 bg-[#050914] border border-slate-800 rounded-xl transition-all shadow-inner hover:border-blue-500 group ${isGridMenuOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
                        >
                           <LayoutGrid size={16} className="text-blue-500" />
                           <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">{gridSize} Cameras</span>
                           <ChevronDown size={14} className={`text-slate-600 transition-transform ${isGridMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isGridMenuOpen && (
                          <div className="absolute top-full right-0 mt-3 w-64 bg-[#0f172a]/95 backdrop-blur-xl border border-slate-700 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-[100] overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-white/10">
                             <div className="p-4 bg-black/20 border-b border-slate-800">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">選擇畫面配置 (1~26)</span>
                             </div>
                             <div className="max-h-[450px] overflow-y-auto custom-scrollbar p-2 space-y-1">
                                {Array.from({ length: 26 }, (_, i) => i + 1).map((num) => {
                                  const isSelected = gridSize === num;
                                  return (
                                    <button 
                                      key={num}
                                      onClick={() => { setGridSize(num); setIsGridMenuOpen(false); }}
                                      className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all group ${isSelected ? 'bg-blue-600 text-white shadow-xl ring-2 ring-white/40 scale-[1.02] z-10' : 'hover:bg-white/5 text-slate-400 hover:text-slate-100'}`}
                                    >
                                       <div className="flex items-center gap-4">
                                          <GridPreviewIcon size={num} isSelected={isSelected} />
                                          <span className={`text-sm font-black italic tracking-tighter ${isSelected ? 'text-white' : ''}`}>{num} Camera{num > 1 ? 's' : ''}</span>
                                       </div>
                                       {isSelected && <Check size={16} strokeWidth={4} className="text-white" />}
                                    </button>
                                  );
                                })}
                             </div>
                          </div>
                        )}
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