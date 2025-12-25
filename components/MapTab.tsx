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
  AlertCircle
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
  
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // --- Helpers: 尋找節點 ---
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

    // 如果該節點本身就有圖資，直接返回
    if (INITIAL_FLOOR_PLANS.find(p => p.siteId === node.id)) return node;

    // 只有「設備」層級才支援往上找
    if (node.type === 'device') {
      let current: SiteNode | null = getParentNode(id);
      while (current) {
        if (INITIAL_FLOOR_PLANS.find(p => p.siteId === current!.id)) return current;
        current = getParentNode(current!.id);
      }
      // 如果直到 Site 都沒找到圖資，返回其直屬父層 (通常是 Zone) 以顯示錯誤引導
      return getParentNode(id);
    }

    // 非設備節點（Host, Zone, Site, Group）若本身無圖資，則不回溯，返回自身顯示「無圖資」
    return node;
  };

  // --- 監聽事件點擊 (自動跳轉地圖 + 同步樹狀圖) ---
  useEffect(() => {
    if (!activeEventId) return;
    const event = MOCK_EVENTS.find(e => e.id === activeEventId);
    if (!event || !event.sensorId) return;

    const targetNode = findBestViewNode(event.sensorId);
    if (targetNode) {
       // 1. 同步左側樹狀圖選中狀態
       if (onAutoSelectNode && targetNode.id !== activeNodeId) {
          onAutoSelectNode(targetNode.id);
       }
       // 2. 更新地圖顯示區域 (如果已經是同一個 Node，handleNodeChange 內部會處理穩定化)
       if (targetNode.id !== selectedSite?.id) {
          handleNodeChange(targetNode.id);
       }
    }
  }, [activeEventId]);

  // --- 處理切換與加載穩定化 ---
  useEffect(() => {
    const targetId = activeNodeId || defaultViewId;
    if (!targetId) return;
    handleNodeChange(targetId);
  }, [activeNodeId]);

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
        if (!plan || plan.type !== 'map') {
            setIsLoading(false);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  };

  // --- GIS 地圖渲染邏輯 ---
  const activePlanData = useMemo(() => 
    selectedSite ? INITIAL_FLOOR_PLANS.find(p => p.siteId === selectedSite.id) : null
  , [selectedSite]);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    if (activePlanData?.type === 'map' && selectedSite) {
      const initTimer = setTimeout(() => {
        if (!mapContainerRef.current) return;
        
        try {
          const config = activePlanData.mapConfig || { center: [25.0629, 121.5796], zoom: 17 };
          const map = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false }).setView(config.center, config.zoom);
          
          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
          
          config.regions?.forEach(region => {
            L.polygon(region.coords, { 
              color: '#3b82f6', 
              weight: 3, 
              fillColor: '#3b82f6', 
              fillOpacity: 0.15, 
              dashArray: '8, 8' 
            }).addTo(map);
          });

          // 設備標記
          activePlanData.sensors?.forEach(pos => {
              const markerIcon = L.divIcon({
                className: 'map-device-marker',
                html: `<div style="width: 32px; height: 32px; background: rgba(59, 130, 246, 0.8); border: 2px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 10px rgba(0,0,0,0.4);">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                      </div>`,
                iconSize: [32, 32], iconAnchor: [16, 16]
              });
              L.marker([pos.y, pos.x], { icon: markerIcon }).addTo(map);
          });

          mapRef.current = map;
          map.invalidateSize();
          setIsLoading(false);
        } catch (err) {
          console.error("GIS Render Fail", err);
          setIsLoading(false);
        }
      }, 500);

      return () => clearTimeout(initTimer);
    }
  }, [selectedSite, activePlanData]);

  const handleSetDefault = () => {
    if (selectedSite) {
      onSetDefaultView(selectedSite.id);
      alert(`已將「${selectedSite.label}」設為預設進入點`);
    }
  };

  const handleFitRegions = () => {
    if (!mapRef.current || !activePlanData?.mapConfig?.regions?.length) return;
    const allCoords: [number, number][] = [];
    activePlanData.mapConfig.regions.forEach(r => r.coords.forEach(c => allCoords.push(c)));
    if (allCoords.length > 0) {
        mapRef.current.fitBounds(L.latLngBounds(allCoords), { padding: [50, 50], animate: true });
    }
  };

  // 動態生成空狀態文字
  const emptyStateInfo = useMemo(() => {
    if (!selectedSite || activePlanData) return null;
    
    const originalNode = originalSelectionId ? findNodeById(SITE_TREE_DATA, originalSelectionId) : null;
    
    if (originalNode?.type === 'device') {
        const parentZone = getParentNode(originalNode.id);
        return {
            targetId: parentZone?.id || originalNode.id,
            title: "設備尚未配置視覺定位",
            desc: `此設備所屬之「${parentZone?.label || '分區'}」及其上層區域皆無圖資，請至「平面圖中心」進行配置。`,
            guide: `請配置「${parentZone?.label || '此分區'}」圖資`
        };
    }

    return {
        targetId: selectedSite.id,
        title: "區域尚未配置圖資",
        desc: `區域「${selectedSite.label}」目前無任何 GIS 或 BMP 平面圖資料，請至「平面圖中心」進行配置。`,
        guide: `請至「平面圖中心」配置`
    };
  }, [selectedSite, activePlanData, originalSelectionId]);

  return (
    <div className="flex h-full w-full relative overflow-hidden bg-black">
        <style>{`
            @keyframes scan-line { 0% { top: 0%; } 100% { top: 100%; } }
        `}</style>

        {/* --- Top Control Bar --- */}
        <div className="absolute top-6 right-6 z-[500] flex items-center gap-3">
           <div className="px-4 py-2 bg-[#1e293b]/80 backdrop-blur-md border border-slate-700 rounded-xl text-blue-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl">
              <MousePointer2 size={12}/> 操作連動中
           </div>

           {selectedSite && activePlanData && (
             <button 
               onClick={handleSetDefault}
               title="設為預設視角"
               className={`p-2.5 rounded-xl border transition-all shadow-xl active:scale-95 ${
                 defaultViewId === selectedSite.id
                 ? 'bg-amber-500 border-amber-400 text-white shadow-amber-900/20' 
                 : 'bg-slate-800/90 border-slate-700 text-slate-400 hover:text-white'
               }`}
             >
                <Star size={16} fill={defaultViewId === selectedSite.id ? 'currentColor' : 'none'} />
             </button>
           )}
        </div>

        {/* --- Loading Spinner --- */}
        {isLoading && (
            <div className="absolute inset-0 z-[100] bg-[#050914] flex flex-col items-center justify-center gap-6">
                <div className="relative w-24 h-24">
                    <div className="absolute inset-0 border-4 border-blue-600/10 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-blue-500">
                        <Loader2 size={32} className="animate-pulse" />
                    </div>
                    <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
                        <div className="w-full h-1 bg-blue-400/50 blur-sm absolute animate-[scan-line_2s_linear_infinite]"></div>
                    </div>
                </div>
                <div className="text-center">
                    <span className="text-[11px] font-black text-blue-400 uppercase tracking-[0.3em] block animate-pulse">GIS Data Syncing</span>
                    <span className="text-[9px] text-slate-600 font-bold uppercase mt-1 block">Rendering Security Layers...</span>
                </div>
            </div>
        )}

        {/* --- Content Area --- */}
        <div className="flex-1 relative">
            {selectedSite ? (
                <>
                    {activePlanData ? (
                        activePlanData.type === 'map' ? (
                            <div className="w-full h-full relative border-4 border-blue-500 shadow-[inset_0_0_100px_rgba(59,130,246,0.2)]">
                                <div ref={mapContainerRef} className="w-full h-full bg-[#0b1121]" />
                                <div className="absolute bottom-4 left-4 bg-black/70 px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3 z-50 shadow-2xl pointer-events-none">
                                    <Globe size={14} className="text-blue-400 animate-pulse" />
                                    <span className="text-[11px] font-mono font-black text-white tracking-widest uppercase">GIS Active: {selectedSite.label}</span>
                                </div>
                                <div className="absolute bottom-8 right-8 flex flex-col gap-3 z-[500]">
                                    <div className="flex flex-col bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
                                        <button onClick={() => mapRef.current?.zoomIn()} className="p-3.5 text-slate-300 hover:text-white hover:bg-blue-600 border-b border-slate-800 transition-all"><Plus size={20}/></button>
                                        <button onClick={() => mapRef.current?.zoomOut()} className="p-3.5 text-slate-300 hover:text-white hover:bg-blue-600 transition-all"><Minus size={20}/></button>
                                    </div>
                                    <button onClick={handleFitRegions} className="p-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-xl shadow-blue-900/40 border border-blue-400 transition-all active:scale-95 group">
                                        <Maximize size={20} className="group-hover:scale-110 transition-transform" />
                                    </button>
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
                            />
                        )
                    ) : (
                        <div className="h-full w-full bg-[#050914] flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
                            <div className="w-32 h-32 rounded-[2.5rem] bg-slate-900 border-4 border-slate-800 flex items-center justify-center text-slate-700 mb-10 shadow-inner">
                                <AlertCircle size={64} className="text-slate-800" />
                            </div>
                            <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-4">{emptyStateInfo?.title}</h2>
                            <p className="text-slate-500 text-sm font-bold mb-10 max-w-md text-center leading-relaxed px-6">
                                {emptyStateInfo?.desc}
                            </p>
                            <button 
                                onClick={() => onJumpToFloorPlan?.(emptyStateInfo?.targetId!)}
                                className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 active:scale-95 transition-all shadow-xl shadow-blue-900/20"
                            >
                                <ExternalLink size={18}/> {emptyStateInfo?.guide}
                            </button>
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

export default MapTab;