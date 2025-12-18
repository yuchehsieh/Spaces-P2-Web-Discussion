
import React, { useEffect, useRef, useMemo, useState } from 'react';
import { MapPin, Navigation, Video, Cpu, DoorOpen, Bell, AlertTriangle, Clock, ChevronRight, Layout } from 'lucide-react';
import { SITE_TREE_DATA, MOCK_EVENTS, INITIAL_FLOOR_PLANS } from '../constants';
import { SiteNode, SecurityEvent, FloorPlanData } from '../types';
import FloorPlanModal from './FloorPlanModal';

// Declare Leaflet global variable since it's loaded via CDN
declare const L: any;

interface SiteStats {
  camera: number;
  sensor: number;
  door: number;
  emergency: number;
}

const LOCATIONS = [
  {
    id: 'hq',
    label: 'SKS 總公司',
    address: '114臺北市內湖區行愛路128號',
    coords: [25.0629, 121.5796], 
    type: 'hq'
  },
  {
    id: 'zhongshan-branch',
    label: '新光保全-中山處',
    address: '10489臺北市中山區建國北路一段126號新光保全大樓4樓',
    coords: [25.0519, 121.5368], 
    type: 'branch'
  }
];

const MapTab: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  
  const [selectedSiteForPlan, setSelectedSiteForPlan] = useState<SiteNode | null>(null);
  const [floorPlans, setFloorPlans] = useState<FloorPlanData[]>(INITIAL_FLOOR_PLANS);

  // Global callback for Leaflet buttons
  useEffect(() => {
    (window as any).openFloorPlan = (siteId: string) => {
      const site = SITE_TREE_DATA[0].children?.find(c => c.id === siteId);
      if (site) setSelectedSiteForPlan(site);
    };
  }, []);

  const siteEvents = useMemo(() => {
    const eventsBySite: Record<string, SecurityEvent[]> = {
      'hq': [],
      'zhongshan-branch': []
    };

    MOCK_EVENTS.forEach(event => {
      const loc = event.location.toLowerCase();
      if (loc.includes('商研中心') || loc.includes('大辦公區') || loc.includes('hq')) {
        eventsBySite['hq'].push(event);
      } else if (loc.includes('中山') || loc.includes('倉庫') || loc.includes('部長')) {
        eventsBySite['zhongshan-branch'].push(event);
      }
    });

    return eventsBySite;
  }, []);

  const siteDeviceStats = useMemo(() => {
    const statsMap: Record<string, SiteStats> = {};

    const countDevices = (node: SiteNode, stats: SiteStats) => {
      if (node.type === 'device') {
        if (node.deviceType === 'camera') stats.camera++;
        if (node.deviceType === 'sensor') stats.sensor++;
        if (node.deviceType === 'door') stats.door++;
        if (node.deviceType === 'emergency') stats.emergency++;
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
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current).setView([25.057, 121.558], 13);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    const createIcon = (color: string, hasAlert: boolean) => {
        return L.divIcon({
            className: 'custom-div-icon',
            html: `
              <div style="position: relative; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center;">
                ${hasAlert ? `<div style="position: absolute; width: 100%; height: 100%; background-color: #ef4444; border-radius: 50%; opacity: 0.6; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
                <div style="position: relative; background-color: ${hasAlert ? '#ef4444' : color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${hasAlert ? '#ef4444' : color};"></div>
              </div>
            `,
            iconSize: [18, 18],
            iconAnchor: [9, 9],
            popupAnchor: [0, -12]
        });
    };

    LOCATIONS.forEach(loc => {
        const events = siteEvents[loc.id] || [];
        const abnormalEvents = events.filter(e => e.type === 'alert' || e.type === 'warning');
        const hasAlert = abnormalEvents.length > 0;
        const color = loc.type === 'hq' ? '#3b82f6' : '#22c55e'; 
        const stats = siteDeviceStats[loc.id] || { camera: 0, sensor: 0, door: 0, emergency: 0 };
        
        const marker = L.marker(loc.coords, { icon: createIcon(color, hasAlert) }).addTo(map);
        markersRef.current[loc.id] = marker;
        
        const eventsHtml = abnormalEvents.length > 0 
          ? `
            <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #334155;">
              <div style="display: flex; align-items: center; gap: 6px; color: #f87171; font-size: 11px; font-weight: 700; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">
                <span>🚨 最新異常事件告警 (${abnormalEvents.length})</span>
              </div>
              <div style="display: flex; flex-direction: column; gap: 4px;">
                ${abnormalEvents.slice(0, 1).map(e => `
                  <div style="background: #ef444412; border-left: 3px solid #ef4444; padding: 6px 10px; border-radius: 4px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                      <span style="color: #fecaca; font-size: 11px; font-weight: 600;">${e.message}</span>
                      <span style="color: #64748b; font-size: 9px; font-family: monospace;">${e.timestamp}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` 
          : `
            <div style="margin-top: 12px; padding: 8px; background: #064e3b22; border: 1px solid #065f4655; border-radius: 6px; display: flex; align-items: center; gap: 8px;">
               <span style="color: #34d399; font-size: 11px; font-weight: 500;">✅ 據點狀態良好</span>
            </div>
          `;

        const popupContent = `
            <div style="min-width: 240px; font-family: sans-serif; padding: 4px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #334155; padding-bottom: 8px;">
                    <h4 style="margin: 0; font-size: 14px; color: #f8fafc; font-weight: 700;">${loc.label}</h4>
                    <span style="font-size: 9px; background: ${color}20; color: ${color}; padding: 2px 8px; border-radius: 99px; font-weight: 700;">
                      ${loc.type === 'hq' ? '總部' : '分處'}
                    </span>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; margin-bottom: 8px;">
                    <div style="background: #1e293b; padding: 6px; border-radius: 6px; border: 1px solid #334155; display: flex; align-items: center; gap: 6px;">
                        <span style="color: #60a5fa; font-size: 12px;">📹</span>
                        <div style="font-size: 11px; font-weight: 700; color: #f1f5f9;">${stats.camera}</div>
                    </div>
                    <div style="background: #1e293b; padding: 6px; border-radius: 6px; border: 1px solid #334155; display: flex; align-items: center; gap: 6px;">
                        <span style="color: #fbbf24; font-size: 12px;">📡</span>
                        <div style="font-size: 11px; font-weight: 700; color: #f1f5f9;">${stats.sensor}</div>
                    </div>
                </div>

                ${eventsHtml}
                
                <div style="display: flex; gap: 8px; margin-top: 14px;">
                    <button 
                      onclick="window.openFloorPlan('${loc.id}')"
                      style="flex: 1; background: #2563eb; border: none; color: #ffffff; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 4px;"
                    >
                        <span>開啟 2D 平面圖</span>
                    </button>
                </div>
            </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 300 });

        if (loc.id === 'hq') {
            marker.openPopup();
        }
    });

  }, [siteDeviceStats, siteEvents]);

  const handleSiteClick = (loc: typeof LOCATIONS[0]) => {
    if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo(loc.coords, 16, { duration: 1.5 });
        const marker = markersRef.current[loc.id];
        if (marker) marker.openPopup();
    }
  };

  const handleSaveFloorPlan = (data: FloorPlanData) => {
    setFloorPlans(prev => {
      const idx = prev.findIndex(p => p.siteId === data.siteId);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = data;
        return next;
      }
      return [...prev, data];
    });
  };

  return (
    <div className="flex h-full w-full relative">
        <div ref={mapContainerRef} className="flex-1 h-full z-0 bg-[#0f172a]" />
        
        {/* Monitoring Site List Overlay */}
        <div className="absolute top-4 right-4 z-[400] flex flex-col gap-4">
            <div className="bg-[#1e293b]/95 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-2xl p-4 w-72">
                <div className="flex items-center justify-between mb-4 border-b border-slate-700/50 pb-3">
                    <h3 className="text-white font-bold text-sm flex items-center gap-2">
                        <MapPin size={16} className="text-blue-400" />
                        監控據點狀態列表
                    </h3>
                </div>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
                    {LOCATIONS.map(loc => {
                        const stats = siteDeviceStats[loc.id] || { camera: 0, sensor: 0, door: 0, emergency: 0 };
                        const events = siteEvents[loc.id] || [];
                        const abnormalCount = events.filter(e => e.type === 'alert' || e.type === 'warning').length;
                        const hasAlert = abnormalCount > 0;

                        return (
                            <div 
                                key={loc.id} 
                                className={`p-3.5 rounded-xl transition-all group relative border ${
                                  hasAlert 
                                    ? 'bg-red-500/5 border-red-500/30 hover:border-red-500/60' 
                                    : 'bg-[#0f172a]/60 border-slate-800 hover:border-blue-500/50'
                                } cursor-pointer`}
                                onClick={() => handleSiteClick(loc)}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-sm font-bold truncate ${hasAlert ? 'text-red-400' : 'text-slate-200'}`}>
                                          {loc.label}
                                        </span>
                                      </div>
                                      <div className="text-[10px] text-slate-500 truncate w-48">{loc.address}</div>
                                    </div>
                                    <div className={`w-2.5 h-2.5 rounded-full ${hasAlert ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : (loc.type === 'hq' ? 'bg-blue-500' : 'bg-green-500')}`}></div>
                                </div>

                                <div className="flex items-center justify-between mt-3">
                                  <div className="flex items-center gap-2.5">
                                      <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-900/50 px-1.5 py-0.5 rounded border border-slate-800/50"><Video size={11} className="text-blue-400"/> {stats.camera}</div>
                                      <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-900/50 px-1.5 py-0.5 rounded border border-slate-800/50"><Cpu size={11} className="text-yellow-400"/> {stats.sensor}</div>
                                  </div>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); (window as any).openFloorPlan(loc.id); }}
                                    className="p-1.5 bg-slate-800 hover:bg-blue-600 rounded text-slate-400 hover:text-white transition-colors"
                                    title="開啟平面圖"
                                  >
                                    <Layout size={14} />
                                  </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>

        {/* Floor Plan Modal */}
        {selectedSiteForPlan && (
          <FloorPlanModal 
            site={selectedSiteForPlan}
            onClose={() => setSelectedSiteForPlan(null)}
            initialData={floorPlans.find(p => p.siteId === selectedSiteForPlan.id)}
            onSave={handleSaveFloorPlan}
            events={MOCK_EVENTS}
          />
        )}
    </div>
  );
};

export default MapTab;
