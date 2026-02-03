import React, { useEffect, useMemo, useState, useRef } from 'react';
import { 
  Star,
  ExternalLink,
  Map as MapIcon,
  MousePointer2,
  Loader2,
  Plus,
  Minus,
  Maximize,
  AlertCircle,
  FolderOpen,
  Filter,
  Video,
  Bell,
  Camera,
  Thermometer,
  UserSearch,
  Tablet,
  Activity,
  DoorClosed,
  Check
} from 'lucide-react';
import { SITE_TREE_DATA, MOCK_EVENTS, INITIAL_FLOOR_PLANS } from '../constants';
import { SiteNode, FloorPlanData } from '../types';
import FloorPlanView from './FloorPlanModal';

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
  onOpenDetail?: (slot: { id: string; label: string; nodeType?: string }) => void;
}

const FILTER_ITEMS = [
  { id: '門磁', label: '門磁', icon: <DoorClosed size={14}/> },
  { id: 'PIR', label: 'PIR', icon: <Activity size={14}/> },
  { id: '緊急按鈕', label: '緊急按鈕', icon: <Bell size={14}/>, aliases: ['SOS'] },
  { id: 'IPC', label: 'IPC', icon: <Video size={14}/> },
  { id: 'WEB CAM', label: 'WEB CAM', icon: <Camera size={14}/>, aliases: ['Web Cam', 'WebCam'] },
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
  onAutoSelectNode,
  onOpenDetail
}) => {
  const [selectedSite, setSelectedSite] = useState<SiteNode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [originalSelectionId, setOriginalSelectionId] = useState<string | null>(null);
  const [activeDeviceFilters, setActiveDeviceFilters] = useState<Set<string>>(new Set(FILTER_ITEMS.map(f => f.id)));
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);

  const isFirstLoad = useRef(true);
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

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

  const getFilterIdFromLabel = (label: string) => {
    const lUpper = label.toUpperCase();
    for (const item of FILTER_ITEMS) {
      if (lUpper.includes(item.label.toUpperCase())) return item.id;
      if (item.aliases?.some(a => lUpper.includes(a.toUpperCase()))) return item.id;
    }
    return null;
  };

  const findBestViewNode = (id: string): SiteNode | null => {
    const node = findNodeById(SITE_TREE_DATA, id);
    if (!node) return null;
    if (INITIAL_FLOOR_PLANS.find(p => p.siteId === node.id)) return node;
    const getParent = (targetId: string): SiteNode | null => {
      let p: SiteNode | null = null;
      const traverse = (nodes: SiteNode[], tid: string, currentP: SiteNode | null) => {
        for (const n of nodes) {
          if (n.id === tid) { p = currentP; return; }
          if (n.children) traverse(n.children, tid, n);
        }
      };
      traverse(SITE_TREE_DATA, targetId, null);
      return p;
    };
    if (node.type === 'device') {
      let current: SiteNode | null = getParent(id);
      while (current) {
        if (INITIAL_FLOOR_PLANS.find(p => p.siteId === current!.id)) return current;
        current = getParent(current!.id);
      }
      return getParent(id);
    }
    return node;
  };

  useEffect(() => {
    if (activeNodeId) {
      const node = findNodeById(SITE_TREE_DATA, activeNodeId);
      if (node?.type === 'device') {
        const filterId = getFilterIdFromLabel(node.label);
        if (filterId && !activeDeviceFilters.has(filterId)) {
          setActiveDeviceFilters(prev => {
            const next = new Set(prev);
            next.add(filterId);
            return next;
          });
        }
      }
    }
  }, [activeNodeId]);

  useEffect(() => {
    if (activeEventId) {
      const event = MOCK_EVENTS.find(e => e.id === activeEventId);
      if (event) {
        const nextFilters = new Set(activeDeviceFilters);
        let changed = false;
        if (event.sensorId) {
          const mainNode = findNodeById(SITE_TREE_DATA, event.sensorId);
          if (mainNode) {
            const fid = getFilterIdFromLabel(mainNode.label);
            if (fid && !nextFilters.has(fid)) { nextFilters.add(fid); changed = true; }
          }
        }
        if (event.linkedSensorId) {
          const linkedNode = findNodeById(SITE_TREE_DATA, event.linkedSensorId);
          if (linkedNode) {
            const fid = getFilterIdFromLabel(linkedNode.label);
            if (fid && !nextFilters.has(fid)) { nextFilters.add(fid); changed = true; }
          }
        }
        if (changed) setActiveDeviceFilters(nextFilters);
      }
    }
  }, [activeEventId]);

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
                else if (defaultViewId) { targetId = defaultViewId; fallbackAlertNeeded = isFirstLoad.current; }
                else targetId = node.id;
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

  const activePlanData = useMemo(() => selectedSite ? INITIAL_FLOOR_PLANS.find(p => p.siteId === selectedSite.id) : null, [selectedSite]);

  useEffect(() => {
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    if (activePlanData?.type === 'map' && selectedSite) {
      const initTimer = setTimeout(() => {
        if (!mapContainerRef.current) return;
        try {
          /* DO add comment above each fix. */
          /* Fix: Added regions and pins properties to the fallback object to ensure it matches the mapConfig structure and satisfies TypeScript requirements. */
          const config = activePlanData.mapConfig || { center: [25.0629, 121.5796], zoom: 17, regions: [], pins: [] };
          const map = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false }).setView(config.center, config.zoom);
          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
          config.regions?.forEach(region => {
            const polygon = L.polygon(region.coords, { color: '#3b82f6', weight: 3, fillColor: '#3b82f6', fillOpacity: 0.15 }).addTo(map);
            polygon.on('click', () => { if (onAutoSelectNode) onAutoSelectNode(region.id); });
          });
          config.pins?.forEach(pin => {
              const icon = L.divIcon({ className: 'site-view-pin', html: `<div style="width:32px;height:32px;background:#ef4444;border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><rect width="18" height="18" x="3" y="3" rx="2"/></svg></div>`, iconSize: [32, 32], iconAnchor: [16, 32] });
              const marker = L.marker([pin.lat, pin.lng], { icon }).addTo(map);
              marker.on('click', () => { if (onAutoSelectNode) onAutoSelectNode(pin.id); });
          });
          mapRef.current = map; map.invalidateSize(); setIsLoading(false);
        } catch (err) { setIsLoading(false); }
      }, 500);
      return () => clearTimeout(initTimer);
    }
  }, [selectedSite, activePlanData, onAutoSelectNode]);

  const handleToggleAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    const allIds = FILTER_ITEMS.map(f => f.id);
    const isAllActive = activeDeviceFilters.size === allIds.length;
    if (isAllActive) {
      setActiveDeviceFilters(new Set());
    } else {
      setActiveDeviceFilters(new Set(allIds));
    }
  };

  return (
    <div className="flex h-full w-full relative overflow-hidden bg-black">
        <div className="absolute top-6 right-6 z-[500] flex items-center gap-3">
           <div className="px-4 py-2 bg-[#1e293b]/80 backdrop-blur-md border border-slate-700 rounded-xl text-blue-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl"><MousePointer2 size={12}/> 操作連動中</div>
           {selectedSite && activePlanData && (
             <button onClick={() => { if (defaultViewId === selectedSite.id) onSetDefaultView(null); else onSetDefaultView(selectedSite.id); }} className={`p-2.5 rounded-xl border transition-all shadow-xl ${defaultViewId === selectedSite.id ? 'bg-amber-500 border-amber-400 text-white' : 'bg-slate-800/90 border-slate-700 text-slate-400'}`}><Star size={16} fill={defaultViewId === selectedSite.id ? 'currentColor' : 'none'} /></button>
           )}
        </div>
        
        {/* Device Layer Filter Panel */}
        <div className={`absolute top-6 left-6 z-[500] flex flex-col transition-all duration-300 ${isFilterExpanded ? 'w-56' : 'w-12'}`}>
           <div className="bg-[#111827]/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
              <div className="flex items-center justify-between border-b border-slate-800 p-3.5 bg-black/20">
                <button onClick={() => setIsFilterExpanded(!isFilterExpanded)} className="flex items-center gap-3 text-left">
                  <Filter size={16} className="text-blue-400" />
                  {isFilterExpanded && <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">設備圖層篩選</span>}
                </button>
                {isFilterExpanded && (
                  <button 
                    onClick={handleToggleAll}
                    className="text-[10px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest transition-colors"
                  >
                    {activeDeviceFilters.size === FILTER_ITEMS.length ? 'NONE' : 'ALL'}
                  </button>
                )}
              </div>
              {isFilterExpanded && ( 
                <div className="p-2 space-y-0.5 overflow-y-auto custom-filter-scrollbar">
                  {FILTER_ITEMS.map(item => ( 
                    <FilterToggleItem 
                      key={item.id} 
                      icon={item.icon} 
                      label={item.label} 
                      active={activeDeviceFilters.has(item.id)} 
                      onClick={() => setActiveDeviceFilters(prev => { 
                        const n = new Set(prev); 
                        if (n.has(item.id)) n.delete(item.id); 
                        else n.add(item.id); 
                        return n; 
                      })} 
                    /> 
                  ))}
                </div> 
              )}
           </div>
        </div>

        <div className="flex-1 relative">
            {selectedSite ? (
                <>
                    {activePlanData ? (
                        activePlanData.type === 'map' ? (
                            <div className="w-full h-full relative border-4 border-blue-500 shadow-[inset_0_0_100px_rgba(59,130,246,0.2)]"><div ref={mapContainerRef} className="w-full h-full bg-[#0b1121]" /></div>
                        ) : (
                            <FloorPlanView site={selectedSite} onBack={() => {}} initialData={activePlanData} onSave={() => {}} events={MOCK_EVENTS} selectedEventId={activeEventId} activeDeviceFilters={activeDeviceFilters} onDeviceClick={onOpenDetail} />
                        )
                    ) : (
                        <div className="h-full w-full bg-[#050914] flex flex-col items-center justify-center animate-in zoom-in-95"><AlertCircle size={64} className="text-slate-800 mb-10" /><h2 className="text-2xl font-black text-white uppercase mb-4 text-center">區域尚未配置圖資</h2>{selectedSite?.type !== 'zone' && <button onClick={() => onJumpToFloorPlan?.(selectedSite.id)} className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3"><ExternalLink size={18}/> 點此進行配置</button>}</div>
                    )}
                </>
            ) : <div className="h-full w-full bg-[#050914] flex flex-col items-center justify-center opacity-30 italic"><MapIcon size={48} className="mb-6 text-slate-700" /><p className="text-sm font-bold text-slate-500 tracking-widest uppercase">請從左側 Site Tree 選擇欲檢視的區域</p></div>}
        </div>
    </div>
  );
};

const FilterToggleItem: React.FC<{ icon: React.ReactNode; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all group ${active ? 'bg-blue-600/10 border border-blue-500/10' : 'hover:bg-white/5'}`}>
    <div className="flex items-center gap-3">
      <div className={`${active ? 'text-blue-400' : 'text-slate-600'}`}>{icon}</div>
      <span className={`text-[10px] font-bold ${active ? 'text-slate-200' : 'text-slate-500'}`}>{label}</span>
    </div>
    <div className={`w-4 h-4 border rounded transition-all flex items-center justify-center ${active ? 'bg-blue-600 border-blue-600' : 'border-slate-800 bg-black/40'}`}>
      {active && <Check size={12} strokeWidth={4} className="text-white" />}
    </div>
  </button>
);

export default MapTab;