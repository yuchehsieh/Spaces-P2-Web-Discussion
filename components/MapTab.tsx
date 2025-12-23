
import React, { useEffect, useRef, useMemo, useState } from 'react';
import { MapPin, Navigation, Video, Cpu, DoorOpen, Bell, AlertTriangle, Clock, ChevronRight, Layout, Home, Building2, Server } from 'lucide-react';
import { SITE_TREE_DATA, MOCK_EVENTS, INITIAL_FLOOR_PLANS } from '../constants';
import { SiteNode, SecurityEvent, FloorPlanData } from '../types';
import FloorPlanView from './FloorPlanModal';

// Declare Leaflet global variable since it's loaded via CDN
declare const L: any;

interface SiteStats {
  camera: number;
  sensor: number;
  door: number;
  emergency: number;
}

interface MapTabProps {
  activeEventId: string | null;
  onEventSelect: (id: string | null) => void;
  onViewingSiteChange: (siteId: string | null) => void;
}

const LOCATIONS = [
  {
    id: 'site-hq',
    label: 'SKS 總公司',
    address: '114臺北市內湖區行愛路128號',
    coords: [25.0629, 121.5796], 
    type: 'hq'
  },
  {
    id: 'site-zhongshan',
    label: '新光保全-中山處',
    address: '10489臺北市中山區建國北路一段126號',
    coords: [25.0519, 121.5368], 
    type: 'branch'
  },
  {
    id: 'site-beitun',
    label: '新光保全-北屯處',
    address: '406臺中市北屯區興安路一段90號',
    coords: [24.1731, 120.6942],
    type: 'branch'
  },
  {
    id: 'site-dajia',
    label: '新光保全-大甲處',
    address: '437臺中市大甲區鎮瀾街55號',
    coords: [24.3463, 120.6225],
    type: 'branch'
  }
];

const MapTab: React.FC<MapTabProps> = ({ activeEventId, onEventSelect, onViewingSiteChange }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const hqOpenedRef = useRef<boolean>(false);
  const lastViewedSiteIdRef = useRef<string | null>(null);
  
  const [selectedSiteForPlan, setSelectedSiteForPlan] = useState<SiteNode | null>(null);
  const [floorPlans, setFloorPlans] = useState<FloorPlanData[]>(INITIAL_FLOOR_PLANS);

  // Use a ref to store the latest SITE_TREE_DATA for the Leaflet popup callback
  const siteTreeRef = useRef(SITE_TREE_DATA);

  // 通知父組件當前檢視狀態
  useEffect(() => {
    onViewingSiteChange(selectedSiteForPlan?.id || null);
  }, [selectedSiteForPlan, onViewingSiteChange]);

  // Global callback for Leaflet buttons (needed since popup HTML is a string)
  useEffect(() => {
    (window as any).openFloorPlan = (siteId: string) => {
      const findSite = (nodes: SiteNode[]): SiteNode | undefined => {
        for (const node of nodes) {
          if (node.id === siteId) return node;
          if (node.children) {
            const found = findSite(node.children);
            if (found) return found;
          }
        }
        return undefined;
      };

      const site = findSite(siteTreeRef.current);
      if (site) {
        lastViewedSiteIdRef.current = site.id; 
        setSelectedSiteForPlan(site);
      }
    };
  }, []);

  const siteEvents = useMemo(() => {
    const eventsBySite: Record<string, SecurityEvent[]> = {};
    LOCATIONS.forEach(loc => eventsBySite[loc.id] = []);

    MOCK_EVENTS.forEach(event => {
      const loc = event.location.toLowerCase();
      if (loc.includes('商研中心') || loc.includes('大辦公區') || loc.includes('總公司')) {
        eventsBySite['site-hq'].push(event);
      } else if (loc.includes('中山')) {
        eventsBySite['site-zhongshan'].push(event);
      } else if (loc.includes('北屯')) {
        eventsBySite['site-beitun'].push(event);
      } else if (loc.includes('大甲')) {
        eventsBySite['site-dajia'].push(event);
      }
    });

    return eventsBySite;
  }, []);

  const siteDeviceStats = useMemo(() => {
    const statsMap: Record<string, SiteStats> = {};

    const countDevices = (node: SiteNode, stats: SiteStats) => {
      if (node.type === 'device') {
        if (node.deviceType === 'camera') stats.camera++;
        if (['sensor', 'door', 'emergency'].includes(node.deviceType || '')) stats.sensor++;
      }
      node.children?.forEach(c => countDevices(c, stats));
    };

    const traverse = (nodes: SiteNode[]) => {
      nodes.forEach(node => {
        if (node.type === 'site') {
          const stats: SiteStats = { camera: 0, sensor: 0, door: 0, emergency: 0 };
          countDevices(node, stats);
          statsMap[node.id] = stats;
        }
        if (node.children) traverse(node.children);
      });
    };

    traverse(SITE_TREE_DATA);
    return statsMap;
  }, []);

  useEffect(() => {
    if (selectedSiteForPlan) return; 
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current).setView([25.057, 121.558], 13);
        mapInstanceRef.current = map;
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { 
          attribution: '&copy; CARTO', 
          subdomains: 'abcd', 
          maxZoom: 20 
        }).addTo(map);
    }

    const map = mapInstanceRef.current;
    setTimeout(() => {
        map.invalidateSize();
        if (lastViewedSiteIdRef.current) {
          const marker = markersRef.current[lastViewedSiteIdRef.current];
          if (marker) marker.openPopup();
        }
    }, 100);

    Object.values(markersRef.current).forEach((m: any) => { if (m && typeof m.remove === 'function') m.remove(); });
    markersRef.current = {};

    const createIcon = (color: string, hasAlert: boolean) => {
        return L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;">${hasAlert ? `<div style="position: absolute; width: 100%; height: 100%; background-color: #ef4444; border-radius: 50%; opacity: 0.6; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}<div style="position: relative; background-color: ${hasAlert ? '#ef4444' : color}; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3);"></div></div>`,
            iconSize: [22, 22], iconAnchor: [11, 11], popupAnchor: [0, -14]
        });
    };

    LOCATIONS.forEach(loc => {
        const events = siteEvents[loc.id] || [];
        const abnormalEvents = events.filter(e => e.type === 'alert' || e.type === 'vlm' || e.type === 'warning');
        const hasAlert = abnormalEvents.length > 0;
        const color = loc.type === 'hq' ? '#3b82f6' : '#22c55e'; 
        const stats = siteDeviceStats[loc.id] || { camera: 0, sensor: 0, door: 0, emergency: 0 };
        const marker = L.marker(loc.coords, { icon: createIcon(color, hasAlert) }).addTo(map);
        markersRef.current[loc.id] = marker;
        
        const alertSectionHtml = hasAlert ? `
            <div style="margin-top: 16px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
                <div style="display: flex; align-items: center; gap: 8px; color: #f87171; font-size: 14px; font-weight: 900; margin-bottom: 12px;">
                   <span style="font-size: 16px;">🚨</span> 最新異常事件告警 (${abnormalEvents.length})
                </div>
                <div style="background: #fff5f5; border-left: 4px solid #ef4444; border-radius: 4px; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                   <span style="color: #fca5a5; font-size: 14px; font-weight: 800;">${abnormalEvents[0].message}</span>
                   <span style="color: #94a3b8; font-size: 12px; font-family: monospace;">${abnormalEvents[0].timestamp}</span>
                </div>
            </div>
        ` : `
            <div style="margin-top: 16px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
                <div style="background: #f0fdf4; border: 1px solid #dcfce7; border-radius: 8px; padding: 12px; display: flex; align-items: center; gap: 8px; color: #166534; font-size: 12px; font-weight: 700;">
                   ✅ 設備運行正常，無即時異常
                </div>
            </div>
        `;

        const popupContent = `
            <div style="min-width: 280px; font-family: 'Inter', sans-serif; background: white; border-radius: 12px; padding: 4px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; position: relative;">
                    <h4 style="margin: 0; font-size: 18px; color: #cbd5e1; font-weight: 900; letter-spacing: -0.01em;">${loc.label}</h4>
                    <span style="background: #eff6ff; color: #3b82f6; padding: 4px 12px; border-radius: 99px; font-size: 11px; font-weight: 800;">${loc.type === 'hq' ? '總部' : '據點'}</span>
                </div>
                <div style="width: 100%; height: 1px; background: #e2e8f0; margin-bottom: 16px;"></div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 16px;">
                    <div style="background: #1e293b; color: white; padding: 12px; border-radius: 10px; display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 18px;">📹</span>
                        <span style="font-size: 18px; font-weight: 800;">${stats.camera}</span>
                    </div>
                    <div style="background: #1e293b; color: white; padding: 12px; border-radius: 10px; display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 18px;">📡</span>
                        <span style="font-size: 18px; font-weight: 800;">${stats.sensor}</span>
                    </div>
                </div>
                ${alertSectionHtml}
                <div style="margin-top: 20px;">
                    <button 
                      onclick="window.openFloorPlan('${loc.id}')"
                      style="width: 100%; background: #2563eb; border: none; color: white; padding: 14px; border-radius: 10px; cursor: pointer; font-size: 16px; font-weight: 800; transition: all 0.2s; box-shadow: 0 4px 12px rgba(37,99,235,0.25);"
                    >
                        開啟 2D 平面圖
                    </button>
                </div>
            </div>`;

        const popupOptions = { maxWidth: 320, className: 'custom-white-popup' };
        marker.bindPopup(popupContent, popupOptions);
        if (loc.id === 'site-hq' && !hqOpenedRef.current) { marker.openPopup(); hqOpenedRef.current = true; }
    });
  }, [siteDeviceStats, siteEvents, selectedSiteForPlan]);

  const handleSiteClick = (loc: typeof LOCATIONS[0]) => {
    if (mapInstanceRef.current) { mapInstanceRef.current.flyTo(loc.coords, 16, { duration: 1.5 }); const marker = markersRef.current[loc.id]; if (marker) marker.openPopup(); }
  };

  const handleSaveFloorPlan = (data: FloorPlanData) => {
    setFloorPlans(prev => { const idx = prev.findIndex(p => p.siteId === data.siteId); if (idx > -1) { const next = [...prev]; next[idx] = data; return next; } return [...prev, data]; });
  };

  return (
    <div className="flex h-full w-full relative overflow-hidden">
        <style>{`
          .custom-white-popup .leaflet-popup-content-wrapper {
            background: white !important;
            color: #1e293b !important;
            border-radius: 16px !important;
            padding: 8px !important;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3) !important;
            border: none !important;
          }
          .custom-white-popup .leaflet-popup-tip { background: white !important; }
          .custom-white-popup .leaflet-popup-close-button { top: 12px !important; right: 12px !important; color: #94a3b8 !important; }
        `}</style>

        <div className={`h-full w-full relative animate-in fade-in slide-in-from-left-4 duration-300 ${selectedSiteForPlan ? 'hidden' : 'flex'}`}>
            <div ref={mapContainerRef} className="flex-1 h-full z-0 bg-[#0f172a]" />
            <div className="absolute top-4 right-4 z-[400] flex flex-col gap-4">
                <div className="bg-[#1e293b]/95 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-2xl p-6 w-80">
                    <div className="flex items-center justify-between mb-6 border-b border-slate-700/50 pb-4">
                        <h3 className="text-white font-black text-lg flex items-center gap-2 italic">
                            <MapPin size={20} className="text-blue-400" />
                            監控據點狀態列表
                        </h3>
                    </div>
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-1">
                        {LOCATIONS.map(loc => {
                            const stats = siteDeviceStats[loc.id] || { camera: 0, sensor: 0, door: 0, emergency: 0 };
                            const events = siteEvents[loc.id] || [];
                            const hasAlert = events.some(e => e.type === 'alert' || e.type === 'vlm');
                            return (
                                <div key={loc.id} className={`p-5 rounded-[1.5rem] border transition-all cursor-pointer relative overflow-hidden ${hasAlert ? 'bg-[#ef444415] border-[#ef444450] shadow-lg shadow-red-900/10' : 'bg-[#1b2235] border-slate-800 hover:border-slate-600'}`} onClick={() => handleSiteClick(loc)}>
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="min-w-0 pr-6">
                                            <span className={`text-base font-black truncate block tracking-tight mb-1 ${hasAlert ? 'text-[#f87171]' : 'text-slate-100'}`}>
                                              {loc.label}
                                            </span>
                                            <span className="text-[11px] text-slate-500 font-medium block leading-relaxed line-clamp-1 opacity-80">
                                              {loc.address}
                                            </span>
                                        </div>
                                        <div className={`w-3 h-3 rounded-full absolute top-5 right-5 shadow-inner ${hasAlert ? 'bg-[#ef4444] shadow-[0_0_12px_#ef4444]' : 'bg-[#22c55e] shadow-[0_0_12px_#22c55e]'}`}></div>
                                    </div>
                                    
                                    <div className="flex items-end justify-between mt-5">
                                      <div className="flex items-center gap-3">
                                          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0f172a]/60 border border-white/5 rounded-xl">
                                             <Video size={14} className="text-[#3b82f6]"/> 
                                             <span className="text-sm font-black text-slate-400">{stats.camera}</span>
                                          </div>
                                          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0f172a]/60 border border-white/5 rounded-xl">
                                             <Cpu size={14} className="text-[#fbbf24]"/> 
                                             <span className="text-sm font-black text-slate-400">{stats.sensor}</span>
                                          </div>
                                      </div>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); (window as any).openFloorPlan(loc.id); }} 
                                        className="p-3 bg-[#242d48] hover:bg-[#3b82f6] border border-white/5 rounded-2xl text-slate-400 hover:text-white transition-all shadow-xl"
                                      >
                                        <Layout size={18} />
                                      </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
        {selectedSiteForPlan && (
          <FloorPlanView 
            site={selectedSiteForPlan} 
            onBack={() => setSelectedSiteForPlan(null)} 
            initialData={floorPlans.find(p => p.siteId === selectedSiteForPlan.id)} 
            onSave={handleSaveFloorPlan} 
            events={MOCK_EVENTS}
            selectedEventId={activeEventId}
          />
        )}
    </div>
  );
};

export default MapTab;
