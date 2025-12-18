
import React, { useEffect, useRef, useMemo } from 'react';
import { MapPin, Navigation, Video, Cpu, DoorOpen, Bell } from 'lucide-react';
import { SITE_TREE_DATA } from '../constants';
import { SiteNode } from '../types';

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

  // Helper to calculate device stats for a site ID
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

    // Initialize Map centered between the two points
    const map = L.map(mapContainerRef.current).setView([25.057, 121.558], 13);
    mapInstanceRef.current = map;

    // Add Dark Mode Tile Layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    // Custom Icon Definition
    const createIcon = (color: string) => {
        return L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 12px ${color};"></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
            popupAnchor: [0, -10]
        });
    };

    // Add Markers
    LOCATIONS.forEach(loc => {
        const color = loc.type === 'hq' ? '#3b82f6' : '#22c55e'; 
        const stats = siteDeviceStats[loc.id] || { camera: 0, sensor: 0, door: 0, emergency: 0 };
        
        const marker = L.marker(loc.coords, { icon: createIcon(color) }).addTo(map);
        markersRef.current[loc.id] = marker;
        
        // Custom Popup Content with Device Summary
        const popupContent = `
            <div style="min-width: 220px; font-family: sans-serif;">
                <div style="display: flex; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #334155; padding-bottom: 6px;">
                    <strong style="font-size: 15px; color: white;">${loc.label}</strong>
                    <span style="margin-left: auto; font-size: 10px; background: ${color}33; color: ${color}; padding: 2px 8px; border-radius: 4px; font-weight: bold;">${loc.type === 'hq' ? '總部' : '分處'}</span>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 12px;">
                    <div style="background: #0f172a; padding: 6px; border-radius: 6px; border: 1px solid #334155; display: flex; align-items: center; gap: 6px;">
                        <span style="color: #60a5fa;">📹</span>
                        <span style="font-size: 11px; color: #94a3b8;">攝影機: <b style="color: white;">${stats.camera}</b></span>
                    </div>
                    <div style="background: #0f172a; padding: 6px; border-radius: 6px; border: 1px solid #334155; display: flex; align-items: center; gap: 6px;">
                        <span style="color: #fbbf24;">📡</span>
                        <span style="font-size: 11px; color: #94a3b8;">感測器: <b style="color: white;">${stats.sensor}</b></span>
                    </div>
                    <div style="background: #0f172a; padding: 6px; border-radius: 6px; border: 1px solid #334155; display: flex; align-items: center; gap: 6px;">
                        <span style="color: #4ade80;">🚪</span>
                        <span style="font-size: 11px; color: #94a3b8;">門磁: <b style="color: white;">${stats.door}</b></span>
                    </div>
                    <div style="background: #0f172a; padding: 6px; border-radius: 6px; border: 1px solid #334155; display: flex; align-items: center; gap: 6px;">
                        <span style="color: #f87171;">🚨</span>
                        <span style="font-size: 11px; color: #94a3b8;">緊急: <b style="color: white;">${stats.emergency}</b></span>
                    </div>
                </div>

                <div style="display: flex; align-items: start; gap: 6px; font-size: 11px; color: #64748b; margin-bottom: 12px; line-height: 1.4;">
                    <span>📍</span>
                    <span>${loc.address}</span>
                </div>
                
                <div style="display: flex; gap: 6px;">
                    <button style="flex: 1; background: #2563eb; border: none; color: white; padding: 6px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500;">
                        查看攝影機
                    </button>
                    <button style="flex: 1; background: #1e293b; border: 1px solid #334155; color: #94a3b8; padding: 6px; border-radius: 6px; cursor: pointer; font-size: 12px;">
                        導航
                    </button>
                </div>
            </div>
        `;

        marker.bindPopup(popupContent);

        if (loc.type === 'hq') {
            marker.openPopup();
        }
    });

  }, [siteDeviceStats]);

  const handleSiteClick = (loc: typeof LOCATIONS[0]) => {
    if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo(loc.coords, 16, { duration: 1.5 });
        
        // Find the marker and open its popup
        const marker = markersRef.current[loc.id];
        if (marker) {
            marker.openPopup();
        }
    }
  };

  return (
    <div className="flex h-full w-full relative">
        <div ref={mapContainerRef} className="flex-1 h-full z-0 bg-[#0f172a]" />
        
        <div className="absolute top-4 right-4 z-[400] bg-[#1e293b]/90 backdrop-blur-sm border border-slate-700 rounded-lg shadow-xl p-4 w-72">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <MapPin size={18} className="text-blue-400" />
                監控據點列表
            </h3>
            <div className="space-y-3">
                {LOCATIONS.map(loc => {
                    const stats = siteDeviceStats[loc.id] || { camera: 0, sensor: 0, door: 0, emergency: 0 };
                    return (
                        <div 
                            key={loc.id} 
                            className="p-3 rounded-xl bg-[#0f172a]/50 border border-slate-700 hover:border-blue-500/50 cursor-pointer transition-all group"
                            onClick={() => handleSiteClick(loc)}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-bold text-slate-200 group-hover:text-blue-300 transition-colors">{loc.label}</span>
                                <div className={`w-2 h-2 rounded-full ${loc.type === 'hq' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                            </div>
                            <div className="flex items-center gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                <div className="flex items-center gap-1 text-[10px] text-slate-300"><Video size={10}/> {stats.camera}</div>
                                <div className="flex items-center gap-1 text-[10px] text-slate-300"><Cpu size={10}/> {stats.sensor}</div>
                                <div className="flex items-center gap-1 text-[10px] text-slate-300"><DoorOpen size={10}/> {stats.door}</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        <div className="absolute bottom-6 right-4 z-[400] bg-[#1e293b]/90 backdrop-blur-sm border border-slate-700 rounded-lg p-2 text-[10px] text-slate-300">
            <div className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-white"></div>
                <span>總公司 (HQ)</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 border border-white"></div>
                <span>分公司 (Branch)</span>
            </div>
        </div>
    </div>
  );
};

export default MapTab;
