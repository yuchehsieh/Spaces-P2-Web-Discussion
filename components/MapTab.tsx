import React, { useEffect, useMemo, useState, useRef } from 'react';
import { 
  Star,
  ExternalLink,
  Map as MapIcon,
  MousePointer2,
  Loader2,
  Globe,
  Plus,
  Minus,
  Maximize,
  AlertCircle,
  FolderOpen,
  Filter,
  Video,
  Cpu,
  DoorOpen,
  Bell,
  ChevronLeft,
  ChevronRight,
  Camera,
  Thermometer,
  UserSearch,
  Tablet,
  Activity,
  DoorClosed,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { SITE_TREE_DATA, MOCK_EVENTS, INITIAL_FLOOR_PLANS } from '../constants';
import { SiteNode, FloorPlanData, SensorPosition } from '../types';
import FloorPlanView from './FloorPlanModal';

// Declare Leaflet global variable
declare const L: any;

interface MapTabProps {
  activeNodeId: string | null;
  activeEventId: string | null;
  onEventSelect: (id: string | null) => void;
  onViewingSiteChange: (siteId: string | null) => void;
  defaultViewId: string | null;
  onSetDefaultView: (id: string | null) => void;
  onJumpToFloorPlan?: (siteId: string) => void;
  onAutoSelectNode?: (id: string) => void;
}

// 定義過濾器清單與對應的匹配關鍵字
const FILTER_ITEMS = [
  { id: '門磁', label: '門磁', icon: <DoorClosed size={14}/> },
  { id: 'PIR', label: 'PIR', icon: <Activity size={14}/> },
  { id: '緊急按鈕', label: '緊急按鈕', icon: <Bell size={14}/>, aliases: ['SOS'] },
  { id: 'IPC', label: 'IPC', icon: <Video size={14}/> },
  { id: 'WEB CAM', label: 'WEB CAM', icon: <Camera size={14}/>, aliases: ['Web Cam'] },
  { id: '環境偵測器', label: '環境偵測器', icon: <Thermometer size={14}/> },
  { id: '空間偵測器', label: '空間偵測器', icon: <UserSearch size={14}/> },
  { id: '多功能按鈕', label: '多功能按鈕', icon: <Tablet size={14}/> },
];

const MapTab: React.FC<MapTabProps> = ({ 
  activeNodeId, 
  activeEventId, 
  onEventSelect, 
  onViewingSiteChange,
  defaultViewId,
  onSetDefaultView,
  onJumpToFloorPlan,
  onAutoSelectNode
}) => {
  const [selectedSite, setSelectedSite] = useState<SiteNode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [originalSelectionId, setOriginalSelectionId] = useState<string | null>(null);
  
  // 設備過濾狀態 (預設全選)
  const [activeDeviceFilters, setActiveDeviceFilters] = useState<Set<string>>(
    new Set(FILTER_ITEMS.map(f => f.id))
  );
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);

  const isFirstLoad = useRef(true);
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // --- Helpers ---
  const findNodeById = (nodes: SiteNode[], id: string): SiteNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNodeById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const getParentNode = (id: string): SiteNode | null => {
    let parent: SiteNode | null = null;
    const traverse = (nodes: SiteNode[], targetId: string, currentParent: SiteNode | null) => {
      for (const n of nodes) {
        if (n.id === targetId) { parent = currentParent; return; }
        if (n.children) traverse(n.children, targetId, n);
      }
    };
    traverse(SITE_TREE_DATA, id, null);
    return parent;
  };

  const findBestViewNode = (id: string): SiteNode | null => {
    const node = findNodeById(SITE_TREE_DATA, id);
    if (!node) return null;
    if (INITIAL_FLOOR_PLANS.find(p => p.siteId === node.id)) return node;
    if (node.type === 'device') {
      let current: SiteNode | null = getParentNode(id);
      while (current) {
        if (INITIAL_FLOOR_PLANS.find(p => p.siteId === current!.id)) return current;
        current = getParentNode(current!.id);
      }
      return getParentNode(id);
    }
    return node;
  };

  const getFilterIdFromLabel = (label: string) => {
    for (const item of FILTER_ITEMS) {
      if (label.includes(item.label)) return item.id;
      if (item.aliases?.some(a => label.includes(a))) return item.id;
    }
    return null;
  };

  // --- 核心邏輯：自動解除隱藏過濾器 ---
  useEffect(() => {
    if (activeEventId) {
      const event = MOCK_EVENTS.find(e => e.id === activeEventId);
      if (event && event.sensorId) {
        const deviceNode = findNodeById(SITE_TREE_DATA, event.sensorId);
        if (deviceNode) {
          const filterId = getFilterIdFromLabel(deviceNode.label);
          if (filterId && !activeDeviceFilters.has(filterId)) {
            setActiveDeviceFilters(prev => {
              const next = new Set(prev);
              next.add(filterId);
              return next;
            });
          }
        }
      }
    }
  }, [activeEventId]);

  // --- 導航與地圖切換邏輯 ---
  useEffect(() => {
    let targetId: string | null = null;
    let fallbackAlertNeeded = false;

    if (activeEventId) {
        const event = MOCK_EVENTS.find(e => e.id === activeEventId);
        if (event && event.sensorId) {
            const node = findBestViewNode(event.sensorId);
            if (node) {
                const hasActualPlan = INITIAL_FLOOR_PLANS.some(p => p.siteId === node.id);
                if (hasActualPlan) targetId = node.id;
                else if (defaultViewId) {
                    targetId = defaultViewId;
                    fallbackAlertNeeded = isFirstLoad.current;
                } else targetId = node.id;
            }
        }
    } 
    
    if (!targetId && isFirstLoad.current && defaultViewId) targetId = defaultViewId;
    if (!targetId) targetId = activeNodeId;

    if (targetId) {
        if (onAutoSelectNode && activeNodeId !== targetId) onAutoSelectNode(targetId);
        handleNodeChange(targetId);
        if (fallbackAlertNeeded) alert("因其所選事件所在區域無圖資，切換到預設圖資");
    }

    isFirstLoad.current = false;
  }, [activeEventId, activeNodeId]);

  const handleNodeChange = (id: string) => {
    const targetNode = findBestViewNode(id);
    if (!targetNode) return;

    if (targetNode.id !== selectedSite?.id || id !== originalSelectionId) {
      setIsLoading(true);
      setSelectedSite(null);
      setOriginalSelectionId(id);
      
      const timer = setTimeout(() => {
        setSelectedSite(targetNode);
        onViewingSiteChange(targetNode.id);
        const plan = INITIAL_FLOOR_PLANS.find(p => p.siteId === targetNode.id);
        if (!plan || plan.type !== 'map') setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  };

  // --- GIS 地圖渲染邏輯 ---
  const activePlanData = useMemo(() => 
    selectedSite ? INITIAL_FLOOR_PLANS.find(p => p.siteId === selectedSite.id) : null
  , [selectedSite]);

  useEffect(() => {
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    if (activePlanData?.type === 'map' && selectedSite) {
      const initTimer = setTimeout(() => {
        if (!mapContainerRef.current) return;
        try {
          const config = activePlanData.mapConfig || { center: [25.0629, 121.5796], zoom: 17 };
          const map = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false }).setView(config.center, config.zoom);
          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
          config.regions?.forEach(region => {
            const node = findNodeById(SITE_TREE_DATA, region.id);
            const polygon = L.polygon(region.coords, { color: '#3b82f6', weight: 3, fillColor: '#3b82f6', fillOpacity: 0.15 }).addTo(map);
            if (node) {
              polygon.bindTooltip(node.label, { permanent: true, direction: 'center', className: 'map-label-tooltip-solid' });
              polygon.on('click', () => { if (onAutoSelectNode) onAutoSelectNode(region.id); });
              polygon.getElement()?.style.setProperty('cursor', 'pointer');
            }
          });
          config.pins?.forEach(pin => {
              const icon = L.divIcon({ className: 'site-view-pin', html: `<div style="width:32px;height:32px;background:#ef4444;border:2px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 10px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;color:white;"><div style="transform:rotate(45deg);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><rect width="18" height="18" x="3" y="3" rx="2"/></svg></div></div>`, iconSize: [32, 32], iconAnchor: [16, 32] });
              const marker = L.marker([pin.lat, pin.lng], { icon }).addTo(map);
              marker.bindTooltip(pin.label, { permanent: true, direction: 'bottom', className: 'map-label-tooltip-pin', offset: [0, 5] });
              marker.on('click', () => { if (onAutoSelectNode) onAutoSelectNode(pin.id); });
              marker.getElement()?.style.setProperty('cursor', 'pointer');
          });
          mapRef.current = map; map.invalidateSize(); setIsLoading(false);
        } catch (err) { setIsLoading(false); }
      }, 500);
      return () => clearTimeout(initTimer);
    }
  }, [selectedSite, activePlanData, onAutoSelectNode]);

  const toggleFilter = (id: string) => {
    setActiveDeviceFilters(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleToggleAllFilters = () => {
     if (activeDeviceFilters.size === FILTER_ITEMS.length) setActiveDeviceFilters(new Set());
     else setActiveDeviceFilters(new Set(FILTER_ITEMS.map(i => i.id)));
  };

  return (
    <div className="flex h-full w-full relative overflow-hidden bg-black">
        <style>{`
          .map-label-tooltip-solid { background: rgba(37, 99, 235, 0.9); border: 1px solid white; border-radius: 4px; color: white; font-size: 10px; font-weight: 900; padding: 2px 6px; box-shadow: 0 2px 10px rgba(0,0,0,0.3); pointer-events: none; }
          .map-label-tooltip-pin { background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(59, 130, 246, 0.4); border-radius: 6px; color: white; font-size: 10px; font-weight: 900; padding: 2px 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); white-space: nowrap; }
          .custom-filter-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-filter-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-filter-scrollbar::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.3); border-radius: 10px; }
        `}</style>
        
        <div className="absolute top-6 right-6 z-[500] flex items-center gap-3">
           <div className="px-4 py-2 bg-[#1e293b]/80 backdrop-blur-md border border-slate-700 rounded-xl text-blue-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl">
              <MousePointer2 size={12}/> 操作連動中
           </div>
           {selectedSite && activePlanData && (
             <button onClick={() => { if (defaultViewId === selectedSite.id) onSetDefaultView(null); else onSetDefaultView(selectedSite.id); }} className={`p-2.5 rounded-xl border transition-all shadow-xl active:scale-95 ${defaultViewId === selectedSite.id ? 'bg-amber-500 border-amber-400 text-white' : 'bg-slate-800/90 border-slate-700 text-slate-400 hover:text-white'}`}>
                <Star size={16} fill={defaultViewId === selectedSite.id ? 'currentColor' : 'none'} />
             </button>
           )}
        </div>

        {/* --- Device Filter Panel --- */}
        <div className={`absolute top-6 left-6 z-[500] flex flex-col transition-all duration-300 ${isFilterExpanded ? 'w-56' : 'w-12'}`}>
           <div className="bg-[#111827]/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
              <div className="flex items-center justify-between hover:bg-white/5 transition-colors border-b border-slate-800">
                <button 
                  onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                  className="flex-1 p-3.5 flex items-center gap-3"
                >
                   <Filter size={16} className="text-blue-400" />
                   {isFilterExpanded && <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">設備圖層篩選</span>}
                </button>
                {isFilterExpanded && (
                  <button onClick={handleToggleAllFilters} className="pr-4 text-[9px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-tighter">
                     {activeDeviceFilters.size === FILTER_ITEMS.length ? 'NONE' : 'ALL'}
                  </button>
                )}
              </div>
              
              {isFilterExpanded && (
                <div className="p-2 space-y-1.5 overflow-y-auto custom-filter-scrollbar animate-in fade-in slide-in-from-top-1 duration-200">
                   {FILTER_ITEMS.map(item => (
                     <FilterToggleItem 
                        key={item.id}
                        icon={item.icon} 
                        label={item.label} 
                        active={activeDeviceFilters.has(item.id)} 
                        onClick={() => toggleFilter(item.id)} 
                     />
                   ))}
                </div>
              )}
           </div>
        </div>

        {isLoading && (
            <div className="absolute inset-0 z-[100] bg-[#050914] flex flex-col items-center justify-center gap-6">
                <Loader2 size={48} className="text-blue-500 animate-spin" />
                <span className="text-[11px] font-black text-blue-400 uppercase tracking-widest">Rendering Map...</span>
            </div>
        )}

        <div className="flex-1 relative">
            {selectedSite ? (
                <>
                    {activePlanData ? (
                        activePlanData.type === 'map' ? (
                            <div className="w-full h-full relative border-4 border-blue-500 shadow-[inset_0_0_100px_rgba(59,130,246,0.2)]">
                                <div ref={mapContainerRef} className="w-full h-full bg-[#0b1121]" />
                                <div className="absolute bottom-8 right-8 flex flex-col gap-3 z-[500]">
                                    <div className="flex flex-col bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
                                        <button onClick={() => mapRef.current?.zoomIn()} className="p-3.5 text-slate-300 hover:text-white hover:bg-blue-600 border-b border-slate-800 transition-all"><Plus size={20}/></button>
                                        <button onClick={() => mapRef.current?.zoomOut()} className="p-3.5 text-slate-300 hover:text-white hover:bg-blue-600 transition-all"><Minus size={20}/></button>
                                    </div>
                                    <button onClick={() => { if (!mapRef.current || !activePlanData?.mapConfig) return; const all: any[] = []; activePlanData.mapConfig.regions.forEach(r => r.coords.forEach(c => all.push(c))); activePlanData.mapConfig.pins?.forEach(p => all.push([p.lat, p.lng])); if (all.length > 0) mapRef.current.fitBounds(L.latLngBounds(all), { padding: [50, 50], animate: true }); }} className="p-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-xl border border-blue-400 transition-all active:scale-95 group"><Maximize size={20} /></button>
                                </div>
                            </div>
                        ) : (
                            <FloorPlanView 
                              site={selectedSite} 
                              onBack={() => {}} 
                              initialData={activePlanData} 
                              onSave={() => {}} 
                              events={MOCK_EVENTS} 
                              selectedEventId={activeEventId}
                              activeDeviceFilters={activeDeviceFilters}
                            />
                        )
                    ) : (
                        <div className="h-full w-full bg-[#050914] flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
                            {/* Fix: use selectedSite instead of undefined selectedNode */}
                            {selectedSite?.type === 'zone' ? <FolderOpen size={64} className="text-slate-800 mb-10" /> : <AlertCircle size={64} className="text-slate-800 mb-10" />}
                            {/* Fix: use selectedSite instead of undefined selectedNode */}
                            <h2 className="text-2xl font-black text-white uppercase mb-4 text-center">{selectedSite?.type === 'zone' ? "分區不支援配置圖資" : "區域尚未配置圖資"}</h2>
                            {/* Fix: use selectedSite instead of undefined selectedNode */}
                            <p className="text-slate-500 text-sm mb-10 max-w-md text-center">{selectedSite?.type === 'zone' ? "分區層級不再提供獨立圖資配置功能，請直接於上層「主機」節點檢視或配置。" : `區域「${selectedSite.label}」目前無圖資資料，請至中心進行配置。`}</p>
                            {/* Fix: use selectedSite instead of undefined selectedNode */}
                            {selectedSite?.type !== 'zone' && <button onClick={() => onJumpToFloorPlan?.(selectedSite.id)} className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 active:scale-95 transition-all shadow-xl shadow-blue-900/20"><ExternalLink size={18}/> 點此進行配置</button>}
                        </div>
                    )}
                </>
            ) : (
                <div className="h-full w-full bg-[#050914] flex flex-col items-center justify-center opacity-30 italic select-none">
                    <MapIcon size={48} className="mb-6 text-slate-700" />
                    <p className="text-sm font-bold text-slate-500 tracking-widest uppercase">請從左側 Site Tree 選擇欲檢視的區域</p>
                </div>
            )}
        </div>
    </div>
  );
};

const FilterToggleItem: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  active: boolean; 
  onClick: () => void 
}> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all group ${active ? 'bg-blue-600/10 border border-blue-500/20' : 'hover:bg-white/5'}`}
  >
    <div className="flex items-center gap-3">
       <div className={`${active ? 'text-blue-400' : 'text-slate-600'} transition-colors`}>{icon}</div>
       <span className={`text-[10px] font-bold ${active ? 'text-slate-200' : 'text-slate-500'}`}>{label}</span>
    </div>
    <div className={`w-3.5 h-3.5 rounded border transition-all flex items-center justify-center ${active ? 'bg-blue-600 border-blue-500' : 'border-slate-800 bg-black/40'}`}>
       {active && <Check size={10} strokeWidth={4} className="text-white" />}
    </div>
  </button>
);

const Check = ({ size, className, strokeWidth }: { size: number, className?: string, strokeWidth?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

export default MapTab;