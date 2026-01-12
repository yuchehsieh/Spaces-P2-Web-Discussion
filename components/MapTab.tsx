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
  FolderOpen
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
  
  const isFirstLoad = useRef(true);
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

  // --- 核心邏輯：決定目前要呈現的 Node ---
  useEffect(() => {
    let targetId: string | null = null;
    let fallbackAlertNeeded = false;

    if (activeEventId) {
        const event = MOCK_EVENTS.find(e => e.id === activeEventId);
        if (event && event.sensorId) {
            const node = findBestViewNode(event.sensorId);
            if (node) {
                const hasActualPlan = INITIAL_FLOOR_PLANS.some(p => p.siteId === node.id);
                if (hasActualPlan) {
                    targetId = node.id;
                } else if (defaultViewId) {
                    targetId = defaultViewId;
                    fallbackAlertNeeded = isFirstLoad.current;
                } else {
                    targetId = node.id;
                }
            }
        }
    } 
    
    if (!targetId && isFirstLoad.current && defaultViewId) {
        targetId = defaultViewId;
    }

    if (!targetId) {
        targetId = activeNodeId;
    }

    if (targetId) {
        if (onAutoSelectNode && activeNodeId !== targetId) {
            onAutoSelectNode(targetId);
        }
        handleNodeChange(targetId);
        if (fallbackAlertNeeded) {
            alert("因其所選事件所在區域無圖資，切換到預設圖資");
        }
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
          
          // 渲染區域範圍 (Polygon)
          config.regions?.forEach(region => {
            const node = findNodeById(SITE_TREE_DATA, region.id);
            const polygon = L.polygon(region.coords, { 
              color: '#3b82f6', 
              weight: 3, 
              fillColor: '#3b82f6', 
              fillOpacity: 0.15,
            }).addTo(map);

            // 顯示區域名稱標籤
            if (node) {
              polygon.bindTooltip(node.label, { 
                permanent: true, 
                direction: 'center', 
                className: 'map-label-tooltip-solid' 
              });
              
              // 點擊區域導航
              polygon.on('click', () => {
                if (onAutoSelectNode) onAutoSelectNode(region.id);
              });
              polygon.getElement()?.style.setProperty('cursor', 'pointer');
            }
          });

          // 據點標註渲染 (Pins)
          config.pins?.forEach(pin => {
              const icon = L.divIcon({ 
                className: 'site-view-pin', 
                html: `<div style="width:32px;height:32px;background:#ef4444;border:2px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 10px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;color:white;"><div style="transform:rotate(45deg);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><rect width="18" height="18" x="3" y="3" rx="2"/></svg></div></div>`,
                iconSize: [32, 32], iconAnchor: [16, 32]
              });
              
              const marker = L.marker([pin.lat, pin.lng], { icon }).addTo(map);
              
              // 顯示標題標籤
              marker.bindTooltip(pin.label, { 
                permanent: true, 
                direction: 'bottom', 
                className: 'map-label-tooltip-pin',
                offset: [0, 5]
              });

              // 點擊標籤導航
              marker.on('click', () => {
                if (onAutoSelectNode) onAutoSelectNode(pin.id);
              });
              marker.getElement()?.style.setProperty('cursor', 'pointer');
          });

          // 設備標記
          activePlanData.sensors?.forEach(pos => {
              const markerIcon = L.divIcon({
                className: 'map-device-marker',
                html: `<div style="width: 32px; height: 32px; background: rgba(59, 130, 246, 0.8); border: 2px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 10px rgba(0,0,0,0.4);">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                      </div>`,
                iconSize: [32, 32], iconAnchor: [16, 16]
              });
              L.marker([pos.y, pos.x], { icon: markerIcon }).addTo(map);
          });

          mapRef.current = map;
          map.invalidateSize();
          setIsLoading(false);
        } catch (err) {
          setIsLoading(false);
        }
      }, 500);

      return () => clearTimeout(initTimer);
    }
  }, [selectedSite, activePlanData, onAutoSelectNode]);

  // 更新：預設功能切換邏輯 (Toggle Logic)
  const handleSetDefault = () => {
    if (selectedSite) {
      if (defaultViewId === selectedSite.id) {
          onSetDefaultView(null);
          alert(`已取消「${selectedSite.label}」的預設狀態`);
      } else {
          onSetDefaultView(selectedSite.id);
          alert(`已將「${selectedSite.label}」設為預設進入點`);
      }
    }
  };

  const handleFitRegions = () => {
    if (!mapRef.current || !activePlanData?.mapConfig) return;
    const all: any[] = [];
    activePlanData.mapConfig.regions.forEach(r => r.coords.forEach(c => all.push(c)));
    activePlanData.mapConfig.pins?.forEach(p => all.push([p.lat, p.lng]));
    if (all.length > 0) {
        mapRef.current.fitBounds(L.latLngBounds(all), { padding: [50, 50], animate: true });
    }
  };

  const emptyStateInfo = useMemo(() => {
    if (!selectedSite || activePlanData) return null;
    const originalNode = originalSelectionId ? findNodeById(SITE_TREE_DATA, originalSelectionId) : null;
    
    // 如果是分區層級且無圖資
    if (selectedSite.type === 'zone') {
       return { 
         targetId: selectedSite.id, 
         title: "分區不支援配置圖資", 
         desc: "分區層級不再提供獨立圖資配置功能，請直接於上層「主機」節點檢視或配置所有關聯標註。", 
         isZoneLevel: true 
       };
    }

    if (originalNode?.type === 'device') {
        const parentZone = getParentNode(originalNode.id);
        return { targetId: parentZone?.id || originalNode.id, title: "設備尚未配置視覺定位", desc: `此設備及其上層區域皆無圖資，請至「平面圖中心」配置。`, guide: `請配置圖資` };
    }
    return { targetId: selectedSite.id, title: "區域尚未配置圖資", desc: `區域「${selectedSite.label}」目前無圖資資料，請至中心進行配置。`, guide: `點此進行配置` };
  }, [selectedSite, activePlanData, originalSelectionId]);

  return (
    <div className="flex h-full w-full relative overflow-hidden bg-black">
        <style>{`
          @keyframes scan-line { 0% { top: 0%; } 100% { top: 100%; } }
          
          .map-label-tooltip-solid {
            background: rgba(37, 99, 235, 0.9);
            border: 1px solid white;
            border-radius: 4px;
            color: white;
            font-size: 10px;
            font-weight: 900;
            padding: 2px 6px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            pointer-events: none;
          }
          .map-label-tooltip-pin {
            background: rgba(15, 23, 42, 0.9);
            border: 1px solid rgba(59, 130, 246, 0.4);
            border-radius: 6px;
            color: white;
            font-size: 10px;
            font-weight: 900;
            padding: 2px 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            white-space: nowrap;
          }
        `}</style>
        <div className="absolute top-6 right-6 z-[500] flex items-center gap-3">
           <div className="px-4 py-2 bg-[#1e293b]/80 backdrop-blur-md border border-slate-700 rounded-xl text-blue-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl">
              <MousePointer2 size={12}/> 操作連動中
           </div>
           {selectedSite && activePlanData && (
             <button onClick={handleSetDefault} className={`p-2.5 rounded-xl border transition-all shadow-xl active:scale-95 ${defaultViewId === selectedSite.id ? 'bg-amber-500 border-amber-400 text-white' : 'bg-slate-800/90 border-slate-700 text-slate-400 hover:text-white'}`}>
                <Star size={16} fill={defaultViewId === selectedSite.id ? 'currentColor' : 'none'} />
             </button>
           )}
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
                                    <button onClick={handleFitRegions} className="p-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-xl border border-blue-400 transition-all active:scale-95 group"><Maximize size={20} /></button>
                                </div>
                            </div>
                        ) : (
                            <FloorPlanView site={selectedSite} onBack={() => {}} initialData={activePlanData} onSave={() => {}} events={MOCK_EVENTS} selectedEventId={activeEventId} />
                        )
                    ) : (
                        <div className="h-full w-full bg-[#050914] flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
                            {emptyStateInfo?.isZoneLevel ? (
                               <FolderOpen size={64} className="text-slate-800 mb-10" />
                            ) : (
                               <AlertCircle size={64} className="text-slate-800 mb-10" />
                            )}
                            <h2 className="text-2xl font-black text-white uppercase mb-4 text-center">{emptyStateInfo?.title}</h2>
                            <p className="text-slate-500 text-sm mb-10 max-w-md text-center">{emptyStateInfo?.desc}</p>
                            
                            {!emptyStateInfo?.isZoneLevel && (
                               <button onClick={() => onJumpToFloorPlan?.(emptyStateInfo?.targetId!)} className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 active:scale-95 transition-all shadow-xl shadow-blue-900/20"><ExternalLink size={18}/> {emptyStateInfo?.guide}</button>
                            )}
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