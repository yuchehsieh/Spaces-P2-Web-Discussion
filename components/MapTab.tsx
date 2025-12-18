
import React, { useEffect, useRef, useMemo } from 'react';
import { MapPin, Navigation, Video, Cpu, DoorOpen, Bell, AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import { SITE_TREE_DATA, MOCK_EVENTS } from '../constants';
import { SiteNode, SecurityEvent } from '../types';

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

  // Map events to sites based on location string matching
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
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
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
                ${abnormalEvents.slice(0, 2).map(e => `
                  <div style="background: #ef444412; border-left: 3px solid #ef4444; padding: 6px 10px; border-radius: 4px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                      <span style="color: #fecaca; font-size: 11px; font-weight: 600;">${e.message}</span>
                      <span style="color: #64748b; font-size: 9px; font-family: monospace;">${e.timestamp}</span>
                    </div>
                    <div style="font-size: 10px; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${e.location}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` 
          : `
            <div style="margin-top: 12px; padding: 8px; background: #064e3b22; border: 1px solid #065f4655; border-radius: 6px; display: flex; align-items: center; gap: 8px;">
               <span style="color: #34d399; font-size: 12px;">✅</span>
               <span style="color: #34d399; font-size: 11px; font-weight: 500;">據點狀態良好，查無異常事件</span>
            </div>
          `;

        const popupContent = `
            <div style="min-width: 260px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 4px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #334155; padding-bottom: 8px;">
                    <div>
                        <h4 style="margin: 0; font-size: 15px; color: #f8fafc; font-weight: 700;">${loc.label}</h4>
                        <div style="font-size: 10px; color: #64748b; margin-top: 2px;">${loc.address}</div>
                    </div>
                    <span style="font-size: 10px; background: ${color}20; color: ${color}; padding: 2px 8px; border-radius: 99px; font-weight: 700; white-space: nowrap; border: 1px solid ${color}40;">
                      ${loc.type === 'hq' ? '總部' : '分處'}
                    </span>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; margin-bottom: 8px;">
                    <div style="background: #1e293b; padding: 6px 10px; border-radius: 6px; border: 1px solid #334155; display: flex; align-items: center; gap: 8px;">
                        <span style="color: #60a5fa; font-size: 14px;">📹</span>
                        <div>
                          <div style="font-size: 9px; color: #64748b; line-height: 1;">攝影機</div>
                          <div style="font-size: 13px; font-weight: 700; color: #f1f5f9;">${stats.camera}</div>
                        </div>
                    </div>
                    <div style="background: #1e293b; padding: 6px 10px; border-radius: 6px; border: 1px solid #334155; display: flex; align-items: center; gap: 8px;">
                        <span style="color: #fbbf24; font-size: 14px;">📡</span>
                         <div>
                          <div style="font-size: 9px; color: #64748b; line-height: 1;">感測器</div>
                          <div style="font-size: 13px; font-weight: 700; color: #f1f5f9;">${stats.sensor}</div>
                        </div>
                    </div>
                </div>

                ${eventsHtml}
                
                <div style="display: flex; gap: 8px; margin-top: 14px;">
                    <button style="flex: 1; background: #2563eb; border: none; color: #ffffff; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <span>即時預覽</span>
                    </button>
                    <button style="flex: 1; background: transparent; border: 1px solid #475569; color: #94a3b8; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500;">
                        站點詳情
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
        if (marker) {
            marker.openPopup();
        }
    }
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
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    </div>
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
                                    ? 'bg-red-500/5 border-red-500/30 hover:border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.05)]' 
                                    : 'bg-[#0f172a]/60 border-slate-800 hover:border-blue-500/50'
                                } cursor-pointer`}
                                onClick={() => handleSiteClick(loc)}
                            >
                                {hasAlert && (
                                  <div className="absolute top-0 left-0 w-1 h-full bg-red-500 rounded-l-xl"></div>
                                )}

                                <div className="flex items-start justify-between mb-2">
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-sm font-bold truncate transition-colors ${
                                          hasAlert ? 'text-red-400 group-hover:text-red-300' : 'text-slate-200 group-hover:text-blue-400'
                                        }`}>
                                          {loc.label}
                                        </span>
                                      </div>
                                      <div className="text-[10px] text-slate-500 truncate w-48">{loc.address}</div>
                                    </div>
                                    <div className="flex flex-col items-end shrink-0">
                                      <div className={`w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${hasAlert ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : (loc.type === 'hq' ? 'bg-blue-500' : 'bg-green-500')}`}></div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-3">
                                  <div className="flex items-center gap-2.5">
                                      <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-900/50 px-1.5 py-0.5 rounded border border-slate-800/50"><Video size={11} className="text-blue-400"/> {stats.camera}</div>
                                      <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-900/50 px-1.5 py-0.5 rounded border border-slate-800/50"><Cpu size={11} className="text-yellow-400"/> {stats.sensor}</div>
                                  </div>
                                  
                                  {hasAlert ? (
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-red-500 animate-pulse bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30">
                                      <AlertTriangle size={12} /> {abnormalCount} 異常
                                    </div>
                                  ) : (
                                    <ChevronRight size={14} className="text-slate-700 group-hover:text-blue-500 transition-colors" />
                                  )}
                                </div>

                                {hasAlert && events.length > 0 && (
                                  <div className="mt-2 text-[10px] text-red-400/70 border-t border-red-500/10 pt-2 flex items-center gap-1.5 italic">
                                    <Clock size={10} className="shrink-0" /> 
                                    <span className="truncate">{events[0].message} ({events[0].timestamp})</span>
                                  </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
            
            {/* Legend */}
            <div className="bg-[#1e293b]/95 backdrop-blur-md border border-slate-700/50 rounded-xl p-3 shadow-xl w-72">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-800 pb-1.5">圖例說明</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-white/20"></div>
                      <span className="text-[11px] text-slate-300">總公司</span>
                  </div>
                  <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500 border border-white/20"></div>
                      <span className="text-[11px] text-slate-300">營業據點</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2 mt-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse border border-white/40 shadow-[0_0_8px_#ef4444]"></div>
                      <span className="text-[11px] text-red-400 font-bold">當前有未處理告警</span>
                  </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default MapTab;
