import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Upload, 
  Map as MapIcon, 
  ChevronRight, 
  ChevronDown,
  Building2, 
  Video, 
  Cpu, 
  DoorOpen, 
  Bell, 
  Trash2, 
  ZoomIn, 
  ZoomOut, 
  Maximize,
  Search,
  Plus,
  Minus,
  Pencil,
  Eye,
  AlertTriangle,
  Server,
  FolderOpen,
  Layout,
  Globe,
  Square,
  RefreshCw,
  X,
  Image as ImageIcon,
  Move,
  Settings,
  ExternalLink,
  Info,
  CheckCircle2,
  Layers,
  Database,
  Loader2,
  MapPin as MapPinIcon,
  Navigation,
  MapPin,
  Check,
  Smartphone
} from 'lucide-react';
import { SiteNode, FloorPlanData, MapRegion, SensorPosition, MapPin as MapPinType } from '../types';
import { SITE_TREE_DATA, INITIAL_FLOOR_PLANS } from '../constants';

declare const L: any;

// --- Helper Components for Tree ---

interface TreeItemProps {
  node: SiteNode;
  level: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchTerm: string;
  idsWithFloorPlan: Set<string>; 
  isEditing: boolean;
}

const TreeItem: React.FC<TreeItemProps> = ({ node, level, selectedId, onSelect, searchTerm, idsWithFloorPlan, isEditing }) => {
  const [isOpen, setIsOpen] = useState(node.isOpen ?? true);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;
  const hasFloorPlan = idsWithFloorPlan.has(node.id);

  const shouldShow = useMemo(() => {
    if (node.type === 'device') return false;
    if (!searchTerm) return true;
    const matchSelf = node.label.toLowerCase().includes(searchTerm.toLowerCase());
    const matchChild = (nodes: SiteNode[]): boolean => nodes.some(n => n.type !== 'device' && (n.label.toLowerCase().includes(searchTerm.toLowerCase()) || (n.children && matchChild(n.children))));
    return matchSelf || (node.children ? matchChild(node.children) : false);
  }, [node, searchTerm]);

  if (!shouldShow) return null;

  const getIcon = () => {
    switch (node.type) {
      case 'group': return <Layout size={16} className="text-blue-500" />;
      case 'site': return <Building2 size={16} className="text-blue-400" />;
      case 'host': return <Server size={14} className="text-slate-400" />;
      case 'zone': return <FolderOpen size={14} className={isSelected ? 'text-white' : 'text-slate-500'} />;
      default: return null;
    }
  };

  return (
    <div className="select-none">
      <div 
        onClick={() => onSelect(node.id)}
        className={`flex items-center py-2 pr-2 cursor-pointer transition-all rounded-xl group mb-0.5 ${isSelected ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400'}`}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
      >
        <span 
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          className={`mr-1 p-0.5 rounded hover:bg-white/10 ${hasChildren ? 'cursor-pointer' : 'opacity-0 pointer-events-none'}`}
        >
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <span className="mr-2 shrink-0">{getIcon()}</span>
        <span className={`text-xs truncate ${isSelected ? 'font-black' : 'font-bold'}`}>{node.label}</span>
        {hasFloorPlan && (
          <div className="ml-auto pr-1">
             <div className={`p-1 rounded-md ${isSelected ? 'bg-white/20 text-white' : 'bg-blue-500/10 text-blue-400'}`}>
                <ImageIcon size={10} strokeWidth={3} />
             </div>
          </div>
        )}
      </div>
      {hasChildren && isOpen && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
          {node.children!.map(child => (
            <TreeItem key={child.id} node={child} level={level + 1} selectedId={selectedId} onSelect={onSelect} searchTerm={searchTerm} idsWithFloorPlan={idsWithFloorPlan} isEditing={isEditing} />
          ))}
        </div>
      )}
    </div>
  );
};

// --- Main Component ---

type MapProvider = 'opensource' | 'osm' | 'google';
type MapLayerStyle = 'dark' | 'light';

const FloorPlanCenterTab: React.FC<{ initialSiteId?: string | null }> = ({ initialSiteId }) => {
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(initialSiteId || 'zone-hq-office');
  const [floorPlans, setFloorPlans] = useState<FloorPlanData[]>(INITIAL_FLOOR_PLANS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [sourceType, setSourceType] = useState<'image' | 'map' | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [isMapSettingsOpen, setIsMapSettingsOpen] = useState(false);
  const [mapProvider, setMapProvider] = useState<MapProvider>('opensource');
  const [mapLayerStyle, setMapLayerStyle] = useState<MapLayerStyle>('dark');
  const [googleApiKey, setGoogleApiKey] = useState('');
  const [addressSearch, setAddressSearch] = useState('');
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  
  // 核心交互狀態
  const [deviceToDelete, setDeviceToDelete] = useState<{id: string, label: string} | null>(null);
  const [imgScale, setImgScale] = useState(1);
  const [imgOffset, setImgOffset] = useState({ x: 0, y: 0 });
  const [draggingDeviceId, setDraggingDeviceId] = useState<string | null>(null);

  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const viewMapContainerRef = useRef<HTMLDivElement>(null);
  const viewMapRef = useRef<any>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  
  const activeRegionsRef = useRef<any[]>([]);
  const activePinsRef = useRef<any[]>([]);
  const activeDeviceMarkersRef = useRef<any[]>([]);

  const idsWithFloorPlan = useMemo(() => new Set(floorPlans.map(p => p.siteId)), [floorPlans]);

  const findNodeById = (nodes: SiteNode[], id: string): SiteNode | null => {
    for (const n of nodes) {
      if (n.id === id) return n;
      if (n.children) {
        const res = findNodeById(n.children, id);
        if (res) return res;
      }
    }
    return null;
  };

  const selectedNode = useMemo(() => selectedSiteId ? findNodeById(SITE_TREE_DATA, selectedSiteId) : null, [selectedSiteId]);
  const activeFloorPlan = useMemo(() => floorPlans.find(p => p.siteId === selectedSiteId), [floorPlans, selectedSiteId]);

  // 地址建議邏輯
  const addressSuggestions = useMemo(() => {
    if (!selectedSiteId) return [];
    const node = findNodeById(SITE_TREE_DATA, selectedSiteId);
    if (!node) return [];

    const suggestions: { label: string; address: string }[] = [];

    const findSites = (n: SiteNode) => {
        if (n.type === 'site' && n.address) {
            suggestions.push({ label: n.label, address: n.address });
        }
        n.children?.forEach(findSites);
    };

    if (node.type === 'group') {
        // 如果是 Site Group，列出其下所有 Site
        node.children?.forEach(findSites);
    } else {
        // 如果是 Site 層級或以下，尋找其所屬的祖先 Site
        const getSiteAncestor = (nodes: SiteNode[], targetId: string, currentSite: SiteNode | null): SiteNode | null => {
            for (const n of nodes) {
                const nextSite = n.type === 'site' ? n : currentSite;
                if (n.id === targetId) return nextSite;
                if (n.children) {
                    const res = getSiteAncestor(n.children, targetId, nextSite);
                    if (res) return res;
                }
            }
            return null;
        };
        const siteNode = getSiteAncestor(SITE_TREE_DATA, selectedSiteId, null);
        if (siteNode && siteNode.address) {
            suggestions.push({ label: siteNode.label, address: siteNode.address });
        }
    }
    return suggestions;
  }, [selectedSiteId]);

  // 地址搜尋導航邏輯
  const performAddressSearch = async (query: string) => {
    if (!query || !mapRef.current) return;
    setIsMapLoading(true);
    setShowAddressSuggestions(false);
    
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data && data.length > 0) {
            const { lat, lon } = data[0];
            mapRef.current.flyTo([parseFloat(lat), parseFloat(lon)], 18, { animate: true, duration: 1.5 });
        } else {
            alert("找不到該地址位置");
        }
    } catch (error) {
        console.error("Geocoding failed:", error);
    } finally {
        setIsMapLoading(false);
    }
  };

  useEffect(() => {
    if (activeFloorPlan) {
      setSourceType(activeFloorPlan.type);
    } else if (!isEditing) {
      setSourceType(null);
    }
    if (activeFloorPlan?.type !== 'map' && !isEditing) {
      setIsMapLoading(false);
    }
  }, [selectedSiteId, activeFloorPlan, isEditing]);

  // 每次重新 loading (切換站點或切換編輯模式) 時，清空搜尋輸入框
  useEffect(() => {
    setAddressSearch('');
  }, [selectedSiteId, isEditing]);

  const allDevicesInContext = useMemo(() => {
    if (!selectedSiteId) return [];
    const targetNode = findNodeById(SITE_TREE_DATA, selectedSiteId);
    const devices: SiteNode[] = [];
    const traverse = (node: SiteNode) => { if (node.type === 'device') devices.push(node); node.children?.forEach(traverse); };
    if (targetNode) traverse(targetNode);
    return devices;
  }, [selectedSiteId]);

  const unplacedDevices = useMemo(() => {
    if (!activeFloorPlan) return allDevicesInContext;
    return allDevicesInContext.filter(d => !activeFloorPlan.sensors.find(p => p.id === d.id));
  }, [allDevicesInContext, activeFloorPlan]);

  const getTileUrl = (provider: MapProvider, style: MapLayerStyle) => {
    if (provider === 'osm') return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    if (provider === 'google') return 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
    return style === 'dark' 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
  };

  // --- GIS 核心渲染邏輯 ---

  const createDeviceMarker = (map: any, pos: SensorPosition, label: string, draggable: boolean = false) => {
    const icon = L.divIcon({
      className: 'map-device-placement',
      html: `<div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
               <div style="width:32px;height:32px;background:rgba(37,99,235,0.9);border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;box-shadow:0 0 15px rgba(37,99,235,0.6);">
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
               </div>
               ${draggable ? `<button onclick="window.confirmDeleteDevice('${pos.id}', '${label}')" style="position:absolute;top:-5px;right:-5px;width:18px;height:18px;background:#ef4444;border:1.5px solid white;border-radius:50%;color:white;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:500;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>` : ''}
               <div style="position:absolute;top:35px;background:rgba(0,0,0,0.8);color:white;padding:1px 5px;border-radius:3px;font-size:8px;font-weight:900;white-space:nowrap;border:1px solid rgba(255,255,255,0.1);">${label}</div>
             </div>`,
      iconSize: [40, 40], iconAnchor: [20, 20]
    });
    const marker = L.marker([pos.y, pos.x], { icon, draggable }).addTo(map);
    if (draggable) {
      marker.on('dragend', (e: any) => {
        const nl = e.target.getLatLng();
        setFloorPlans(p => { const next = [...p]; const i = next.findIndex(x => x.siteId === selectedSiteId); if (i > -1) { const s = [...next[i].sensors]; const si = s.findIndex(v => v.id === pos.id); if (si > -1) s[si] = { ...s[si], x: nl.lng, y: nl.lat }; next[i] = { ...next[i], sensors: s }; } return next; });
      });
    }
    activeDeviceMarkersRef.current.push(marker);
  };

  const createMapPin = (map: any, pinConfig?: MapPinType | { lat: number, lng: number }) => {
    const latlng = (pinConfig && 'lat' in pinConfig) ? [pinConfig.lat, pinConfig.lng] : map.getCenter();
    const pinId = (pinConfig as MapPinType)?.id || `pin-${Date.now()}`;
    const label = (pinConfig as MapPinType)?.label || '據點標註';
    
    const icon = L.divIcon({ 
      className: 'map-site-pin', 
      html: `<div style="position:relative;width:42px;height:42px;display:flex;align-items:center;justify-content:center;">
               <div style="width:32px;height:32px;background:#ef4444;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 10px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;color:white;">
                 <div style="transform:rotate(45deg);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><rect width="18" height="18" x="3" y="3" rx="2"/></svg></div>
               </div>
               <button onclick="window.deleteMapPin('${pinId}')" style="position:absolute;top:-5px;right:-5px;width:18px;height:18px;background:white;border:1px solid #ef4444;border-radius:50%;color:#ef4444;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:500;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
               <div style="position:absolute;top:40px;white-space:nowrap;background:rgba(0,0,0,0.8);color:white;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:900;border:1px solid rgba(255,255,255,0.1);">${label}</div>
             </div>`, 
      iconSize: [42, 42], iconAnchor: [21, 42] 
    });
    const marker = L.marker(latlng, { icon, draggable: true }).addTo(map);
    activePinsRef.current.push({ id: pinId, marker, label });
    (window as any).deleteMapPin = (id: string) => { const idx = activePinsRef.current.findIndex(p => p.id === id); if (idx > -1) { map.removeLayer(activePinsRef.current[idx].marker); activePinsRef.current.splice(idx, 1); } };
  };

  const createMapRegion = (map: any, regionConfig?: MapRegion) => {
    const regionId = regionConfig?.id || `region-${Date.now()}`;
    let coords = regionConfig ? regionConfig.coords.map(c => L.latLng(c[0], c[1])) : [map.getBounds().pad(-0.4).getNorthWest(), map.getBounds().pad(-0.4).getNorthEast(), map.getBounds().pad(-0.4).getSouthEast(), map.getBounds().pad(-0.4).getSouthWest()];
    const polygon = L.polygon(coords, { color: '#3b82f6', weight: 3, fillColor: '#3b82f6', fillOpacity: 0.1, dashArray: '8, 8' }).addTo(map);
    const markers: any[] = [];
    const updatePolygon = () => {
      const newCoords = markers.map(m => m.getLatLng());
      polygon.setLatLngs(newCoords);
      const latSum = newCoords.reduce((s, c) => s + c.lat, 0) / newCoords.length;
      const lngSum = newCoords.reduce((s, c) => s + c.lng, 0) / newCoords.length;
      centerMarker.setLatLng([latSum, lngSum]);
    };
    coords.forEach(latlng => {
      const m = L.marker(latlng, { draggable: true, icon: L.divIcon({ className: 'hnd', html: `<div style="width:14px;height:14px;background:white;border:3px solid #3b82f6;border-radius:50%;box-shadow:0 0 5px rgba(0,0,0,0.5);"></div>`, iconSize:[14,14], iconAnchor:[7,7] }) }).addTo(map);
      m.on('drag', updatePolygon); markers.push(m);
    });
    const centerMarker = L.marker([coords.reduce((s, c) => s + c.lat, 0) / coords.length, coords.reduce((s, c) => s + c.lng, 0) / coords.length], { draggable: true, icon: L.divIcon({ className: 'ctr', html: `<div style="position:relative;width:32px;height:32px;"><div style="width:32px;height:32px;background:#3b82f6;border-radius:10px;display:flex;align-items:center;justify-content:center;color:white;border:2px solid white;box-shadow:0 5px 15px rgba(0,0,0,0.5);"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="5 9 2 12 5 15"></polyline><polyline points="9 5 12 2 15 5"></polyline><polyline points="15 19 12 22 9 19"></polyline><polyline points="19 9 22 12 19 15"></polyline><line x1="2" y1="12" x2="22" y2="12"></line><line x1="12" y1="2" x2="12" y2="22"></line></svg></div><button onclick="window.deleteMapRegion('${regionId}')" style="position:absolute;top:-10px;right:-10px;width:22px;height:22px;background:#ef4444;border:2px solid white;border-radius:50%;color:white;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:600;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div>`, iconSize: [32, 32], iconAnchor: [16, 16] }) }).addTo(map);
    centerMarker.on('dragstart', (e: any) => { centerMarker._startPos = e.target.getLatLng(); centerMarker._startCorners = markers.map(m => m.getLatLng()); });
    centerMarker.on('drag', (e: any) => {
        const cur = e.target.getLatLng(); const dLat = cur.lat - centerMarker._startPos.lat; const dLng = cur.lng - centerMarker._startPos.lng;
        markers.forEach((m, i) => m.setLatLng([centerMarker._startCorners[i].lat + dLat, centerMarker._startCorners[i].lng + dLng]));
        polygon.setLatLngs(markers.map(m => m.getLatLng()));
    });
    activeRegionsRef.current.push({ id: regionId, polygon, markers, centerMarker });
    (window as any).deleteMapRegion = (id: string) => { const idx = activeRegionsRef.current.findIndex(r => r.id === id); if (idx > -1) { const r = activeRegionsRef.current[idx]; map.removeLayer(r.polygon); r.markers.forEach((m:any) => map.removeLayer(m)); map.removeLayer(r.centerMarker); activeRegionsRef.current.splice(idx, 1); } };
  };

  // --- BMP 座標引擎 ---

  const handleImgWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setImgScale(prev => Math.min(Math.max(0.5, prev + delta), 5));
  };
  const resetImgView = () => { setImgScale(1); setImgOffset({ x: 0, y: 0 }); };

  const handleImgMouseMove = (e: React.MouseEvent) => {
    // 修正：移除平移邏輯，僅保留設備拖移邏輯
    if (draggingDeviceId && selectedSiteId && imgRef.current) {
      const rect = imgRef.current.getBoundingClientRect();
      const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
      const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
      setFloorPlans(prev => {
        const next = [...prev];
        const idx = next.findIndex(p => p.siteId === selectedSiteId);
        if (idx > -1) {
          const ns = [...next[idx].sensors];
          const si = ns.findIndex(s => s.id === draggingDeviceId);
          if (si > -1) ns[si] = { ...ns[si], x: xPercent, y: yPercent };
          next[idx] = { ...next[idx], sensors: ns };
        }
        return next;
      });
    }
  };

  const stopImgInteraction = () => { setDraggingDeviceId(null); };

  // 全域回調
  useEffect(() => {
    (window as any).confirmDeleteDevice = (id: string, label: string) => setDeviceToDelete({ id, label });
    return () => { delete (window as any).confirmDeleteDevice; };
  }, []);

  // --- 地圖實例管理 ---

  useEffect(() => {
    if (isEditing && sourceType === 'map' && mapContainerRef.current) {
      setIsMapLoading(true);
      const timer = setTimeout(() => {
        if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
        const config = activeFloorPlan?.mapConfig || { center: [25.0629, 121.5796], zoom: 17 };
        const map = L.map(mapContainerRef.current, { zoomControl: false }).setView(config.center, config.zoom);
        L.tileLayer(getTileUrl(mapProvider, mapLayerStyle)).addTo(map);
        activeRegionsRef.current = []; activePinsRef.current = []; activeDeviceMarkersRef.current = [];
        if (activeFloorPlan?.mapConfig?.regions) activeFloorPlan.mapConfig.regions.forEach((r:any) => createMapRegion(map, r));
        if (activeFloorPlan?.mapConfig?.pins) activeFloorPlan.mapConfig.pins.forEach((p:any) => createMapPin(map, p));
        if (activeFloorPlan?.sensors) activeFloorPlan.sensors.forEach(s => { const n = allDevicesInContext.find(d => d.id === s.id); createDeviceMarker(map, s, n?.label || '未知設備', true); });
        mapRef.current = map; map.invalidateSize(); setIsMapLoading(false);
      }, 300);
      return () => { clearTimeout(timer); if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
    }
  }, [isEditing, sourceType, selectedSiteId, activeFloorPlan?.sensors.length, mapProvider, mapLayerStyle]);

  useEffect(() => {
    if (!isEditing && sourceType === 'map' && viewMapContainerRef.current) {
      setIsMapLoading(true);
      const timer = setTimeout(() => {
        if (viewMapRef.current) { viewMapRef.current.remove(); viewMapRef.current = null; }
        const config = activeFloorPlan?.mapConfig || { center: [25.0629, 121.5796], zoom: 17 };
        const map = L.map(viewMapContainerRef.current, { zoomControl: false, attributionControl: false }).setView(config.center, config.zoom);
        L.tileLayer(getTileUrl(mapProvider, mapLayerStyle)).addTo(map);
        config.regions?.forEach((r:any) => L.polygon(r.coords, { color: '#3b82f6', weight: 3, fillColor: '#3b82f6', fillOpacity: 0.1, dashArray: '8, 8', interactive: false }).addTo(map));
        config.pins?.forEach((p:any) => {
          const icon = L.divIcon({ className: 'v-p', html: `<div style="width:32px;height:32px;background:#ef4444;border:2px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;color:white;"><div style="transform:rotate(45deg);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><rect width="18" height="18" x="3" y="3" rx="2"/></svg></div></div>`, iconSize:[32,32], iconAnchor:[16,32] });
          L.marker([p.lat, p.lng], { icon }).addTo(map);
        });
        activeFloorPlan?.sensors.forEach(s => { const n = allDevicesInContext.find(d => d.id === s.id); createDeviceMarker(map, s, n?.label || '', false); });
        viewMapRef.current = map; map.invalidateSize(); setIsMapLoading(false);
      }, 500);
      return () => { clearTimeout(timer); if (viewMapRef.current) { viewMapRef.current.remove(); viewMapRef.current = null; } };
    } else if (!isEditing && sourceType !== 'map') {
      setIsMapLoading(false);
    }
  }, [isEditing, selectedSiteId, sourceType, mapProvider, mapLayerStyle]);

  const handleSaveAllConfig = () => {
    if (!selectedSiteId) return;
    if (sourceType === 'map' && mapRef.current) {
      const map = mapRef.current;
      const savedRegions: MapRegion[] = activeRegionsRef.current.map(r => { const raw = r.polygon.getLatLngs(); const outer = Array.isArray(raw[0]) ? raw[0] : raw; return { id: r.id, coords: outer.map((l: any) => [l.lat, l.lng]) }; });
      const savedPins: MapPinType[] = activePinsRef.current.map(p => ({ id: p.id, label: p.label, lat: p.marker.getLatLng().lat, lng: p.marker.getLatLng().lng }));
      setFloorPlans(prev => { const next = [...prev]; const idx = next.findIndex(p => p.siteId === selectedSiteId); const mapConfig = { center: [map.getCenter().lat, map.getCenter().lng] as [number, number], zoom: map.getZoom(), regions: savedRegions, pins: savedPins }; if (idx > -1) next[idx] = { ...next[idx], type: 'map', mapConfig }; else next.push({ siteId: selectedSiteId, type: 'map', mapConfig, sensors: [] }); return next; });
    }
    setIsEditing(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!isEditing || !selectedSiteId) return;
    e.preventDefault();
    const sensorId = e.dataTransfer.getData('sensorId');
    const toolType = e.dataTransfer.getData('toolType');
    
    if (sourceType === 'map' && mapRef.current) {
      const rect = mapContainerRef.current!.getBoundingClientRect();
      const latlng = mapRef.current.containerPointToLatLng(L.point(e.clientX - rect.left, e.clientY - rect.top));
      
      // 關鍵修復：從當前的 Ref 提取最新的地圖配置，確保不會因為 React 重新渲染而丟失
      const savedRegions: MapRegion[] = activeRegionsRef.current.map(r => { 
        const raw = r.polygon.getLatLngs(); 
        const outer = Array.isArray(raw[0]) ? raw[0] : raw; 
        return { id: r.id, coords: outer.map((l: any) => [l.lat, l.lng]) }; 
      });
      const savedPins: MapPinType[] = activePinsRef.current.map(p => ({ 
        id: p.id, label: p.label, lat: p.marker.getLatLng().lat, lng: p.marker.getLatLng().lng 
      }));
      
      const mapConfig = { 
        center: [mapRef.current.getCenter().lat, mapRef.current.getCenter().lng] as [number, number], 
        zoom: mapRef.current.getZoom(), 
        regions: savedRegions, 
        pins: savedPins 
      };

      if (toolType === 'map-pin') { 
        const newPinId = `pin-${Date.now()}`;
        const newPin = { id: newPinId, label: '據點標註', lat: latlng.lat, lng: latlng.lng };
        createMapPin(mapRef.current, newPin); 
        
        // 立即同步回 State，防止掉入下一個元素時消失
        setFloorPlans(prev => {
          const next = [...prev];
          const idx = next.findIndex(p => p.siteId === selectedSiteId);
          const updatedConfig = { ...mapConfig, pins: [...savedPins, newPin] };
          if (idx === -1) next.push({ siteId: selectedSiteId, type: 'map', mapConfig: updatedConfig, sensors: [] });
          else next[idx] = { ...next[idx], mapConfig: updatedConfig, type: 'map' };
          return next;
        });
      }
      else if (toolType === 'map-region') {
        const newRegionId = `region-${Date.now()}`;
        // 以拖放位置為中心建立一個預設大小的方框 (約 50m)
        const offset = 0.0004;
        const newCoords: [number, number][] = [
            [latlng.lat + offset, latlng.lng - offset],
            [latlng.lat + offset, latlng.lng + offset],
            [latlng.lat - offset, latlng.lng + offset],
            [latlng.lat - offset, latlng.lng - offset]
        ];
        const newRegion = { id: newRegionId, coords: newCoords };
        createMapRegion(mapRef.current, newRegion);
        
        setFloorPlans(prev => {
          const next = [...prev];
          const idx = next.findIndex(p => p.siteId === selectedSiteId);
          const updatedConfig = { ...mapConfig, regions: [...savedRegions, newRegion] };
          if (idx === -1) next.push({ siteId: selectedSiteId, type: 'map', mapConfig: updatedConfig, sensors: [] });
          else next[idx] = { ...next[idx], mapConfig: updatedConfig, type: 'map' };
          return next;
        });
      }
      else if (sensorId) {
        setFloorPlans(prev => { 
          const next = [...prev]; 
          const idx = next.findIndex(p => p.siteId === selectedSiteId); 
          const newSensor = { id: sensorId, x: latlng.lng, y: latlng.lat }; 
          
          if (idx === -1) {
            next.push({ siteId: selectedSiteId, type: 'map', mapConfig, sensors: [newSensor] }); 
          } else { 
            const ns = [...next[idx].sensors]; 
            const si = ns.findIndex(s => s.id === sensorId); 
            if (si > -1) ns[si] = newSensor; else ns.push(newSensor); 
            next[idx] = { ...next[idx], sensors: ns, type: 'map', mapConfig }; 
          } 
          return next; 
        });
      }
    } else if (sourceType === 'image' && imgRef.current) {
      const rect = imgRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setFloorPlans(prev => { const next = [...prev]; const idx = next.findIndex(p => p.siteId === selectedSiteId); const newS = { id: sensorId, x, y }; if (idx > -1) { const ns = [...next[idx].sensors]; const si = ns.findIndex(s => s.id === sensorId); if (si > -1) ns[si] = newS; else ns.push(newS); next[idx] = { ...next[idx], sensors: ns }; } return next; });
    }
  };

  return (
    <div className="flex h-full w-full bg-[#050914] text-slate-200 overflow-hidden relative font-sans">
      
      {/* Sidebar - Site Tree & 待配置設備區 */}
      <div className="w-80 border-r border-slate-800 bg-[#0b1121] flex flex-col shrink-0 overflow-hidden relative z-50">
        <div className="p-4 border-b border-slate-800/50 bg-[#0b1121]">
          <div className="relative">
            <input type="text" placeholder="搜尋區域或分區..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-[#111827] border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-200 outline-none focus:border-blue-500 shadow-inner" />
            <Search size={14} className="absolute left-3.5 top-3 text-slate-600" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
          {SITE_TREE_DATA.map(node => (
            <TreeItem key={node.id} node={node} level={0} selectedId={selectedSiteId} onSelect={(id) => { setSelectedSiteId(id); setIsEditing(false); }} searchTerm={searchTerm} idsWithFloorPlan={idsWithFloorPlan} isEditing={isEditing} />
          ))}
        </div>

        {/* 待配置設備區塊 (下滑動畫) */}
        {isEditing && (
           <div className="h-2/5 border-t border-slate-800 bg-[#070b14] flex flex-col animate-in slide-in-from-top-full duration-1000 ease-out shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
              <div className="p-4 flex items-center justify-between border-b border-slate-800/30">
                 <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Cpu size={14} className="text-blue-500"/> 待配置設備 ({unplacedDevices.length})</span>
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                 {unplacedDevices.map(dev => (
                   <div 
                    key={dev.id} draggable onDragStart={e => e.dataTransfer.setData('sensorId', dev.id)}
                    className="bg-[#111827] border border-slate-800 rounded-2xl p-3 flex items-center gap-4 cursor-grab active:cursor-grabbing hover:border-blue-500/50 hover:bg-blue-600/5 transition-all group shadow-md"
                   >
                      <div className="w-11 h-11 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-[0_0_15px_rgba(37,99,235,0.15)]">
                         {dev.deviceType === 'camera' ? <Video size={18}/> : <Cpu size={18}/>}
                      </div>
                      <div className="flex flex-col min-w-0">
                         <span className="text-[13px] font-black text-slate-200 truncate">{dev.label}</span>
                         <span className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter truncate">SN: {dev.id.toUpperCase()}</span>
                      </div>
                   </div>
                 ))}
                 {unplacedDevices.length === 0 && (
                   <div className="flex flex-col items-center justify-center h-full opacity-10"><CheckCircle2 size={40}/><span className="text-[10px] font-black uppercase mt-2">All Clear</span></div>
                 )}
              </div>
           </div>
        )}
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-[#050914]">
        {selectedSiteId ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 bg-[#111827] border-b border-slate-800 flex items-center justify-between z-[100] shrink-0">
              <div className="flex items-center gap-5">
                <div className="flex flex-col"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">區域配置狀態</span><h3 className="text-lg font-black text-white italic tracking-tight">{selectedNode?.label}</h3></div>
                <div className="h-8 w-px bg-slate-800"></div>
                <div className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border flex items-center gap-2 ${isEditing ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-slate-800/50 border-slate-700 text-slate-400'}`}>
                  {isEditing ? <><Pencil size={12}/> 編輯模式</> : <><Eye size={12}/> 檢視模式</>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isEditing ? (
                  <>
                    {!!activeFloorPlan && (
                       <button onClick={() => setIsResetting(true)} className="px-5 py-2.5 bg-red-950/20 hover:bg-red-600/20 text-red-500 rounded-xl font-bold text-xs border border-red-900/30 flex items-center gap-2 transition-all shadow-lg"><RefreshCw size={14}/> 初始化配置</button>
                    )}
                    <button onClick={() => { setIsEditing(false); setIsMapLoading(false); }} className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs border border-slate-700">取消</button>
                    <button onClick={handleSaveAllConfig} className="px-10 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs uppercase shadow-xl ring-1 ring-white/10 transition-all">儲存變更</button>
                  </>
                ) : (
                  <button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2.5 rounded-xl font-black text-xs uppercase shadow-xl flex items-center gap-3 active:scale-95 transition-all"><Pencil size={16} /> 進入編輯模式</button>
                )}
              </div>
            </div>

            <div 
              className={`flex-1 bg-black relative overflow-hidden flex items-center justify-center select-none ${draggingDeviceId ? 'cursor-grabbing' : 'cursor-default'}`} 
              onDragOver={e => e.preventDefault()} 
              onDrop={handleDrop}
              onWheel={handleImgWheel}
              onMouseMove={handleImgMouseMove}
              onMouseUp={stopImgInteraction}
              onMouseLeave={stopImgInteraction}
            >
                {isMapLoading && (
                  <div className="absolute inset-0 z-[600] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-6">
                     <Loader2 size={48} className="text-blue-500 animate-spin" />
                     <span className="text-[11px] font-black text-blue-400 uppercase tracking-widest animate-pulse">Rendering GIS Intelligence...</span>
                  </div>
                )}

                {/* 1. 未配置狀態 */}
                {!activeFloorPlan && !isEditing && (
                    <div className="flex flex-col items-center justify-center h-full gap-8 animate-in zoom-in-95 duration-500">
                        <div className="w-48 h-48 rounded-[3.5rem] bg-[#0b1121]/80 border border-slate-800 flex items-center justify-center text-slate-800 shadow-[inset_0_0_60px_rgba(0,0,0,0.7)] ring-1 ring-white/5">
                            <Layout size={80} strokeWidth={1} />
                        </div>
                        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-2">未配置區域圖資</h2>
                        <button onClick={() => setIsEditing(true)} className="px-14 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-black text-sm uppercase tracking-widest shadow-[0_10px_40px_rgba(37,99,235,0.4)] active:scale-95 transition-all ring-1 ring-white/10">進入編輯模式</button>
                    </div>
                )}

                {/* 2. GIS 檢視/編輯 (搜尋框) */}
                {sourceType === 'map' && (
                  <div className="w-full h-full relative">
                    {isEditing && (
                      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[500] w-full max-w-xl px-4 animate-in slide-in-from-top-4">
                        <div className="relative bg-[#1e293b]/90 backdrop-blur-xl border border-slate-700 rounded-2xl flex flex-col shadow-2xl overflow-visible">
                             <div className="flex items-center p-1.5">
                                 <div className="p-2.5 text-blue-400"><Navigation size={20} className="animate-pulse" /></div>
                                 <input 
                                   type="text" 
                                   placeholder="搜尋地址或快速定位..." 
                                   value={addressSearch} 
                                   onChange={e => setAddressSearch(e.target.value)} 
                                   onFocus={() => setShowAddressSuggestions(true)}
                                   onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 200)}
                                   onKeyDown={e => e.key === 'Enter' && performAddressSearch(addressSearch)}
                                   className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-white px-2 placeholder:text-slate-600" 
                                 />
                                 <button 
                                   onClick={() => performAddressSearch(addressSearch)}
                                   className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg active:scale-95 transition-all"
                                 >
                                   <Search size={18} />
                                 </button>
                             </div>

                             {/* 地址建議下拉清單 (類似搜尋紀錄) */}
                             {showAddressSuggestions && addressSuggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1e293b] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-[600] animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="p-3 border-b border-slate-800 bg-black/20">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><History size={10}/> 快速地址選取</span>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                        {addressSuggestions.map((s, idx) => (
                                            <button 
                                                key={idx}
                                                onClick={() => {
                                                    setAddressSearch(s.address);
                                                    performAddressSearch(s.address);
                                                }}
                                                className="w-full text-left p-4 hover:bg-blue-600/10 border-b border-slate-800/50 last:border-none transition-colors group flex items-start gap-4"
                                            >
                                                <div className="p-2 bg-slate-800 rounded-lg text-slate-400 group-hover:text-blue-400 group-hover:bg-blue-600/10 transition-all">
                                                    <MapPin size={16} />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors truncate">{s.label}</span>
                                                    <span className="text-[10px] text-slate-500 font-medium truncate">{s.address}</span>
                                                </div>
                                                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ExternalLink size={12} className="text-blue-500" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                             )}
                        </div>
                      </div>
                    )}
                    <div ref={isEditing ? mapContainerRef : viewMapContainerRef} className="w-full h-full" />
                    <div className="absolute bottom-8 right-8 flex flex-col gap-3 z-[500]">
                       {isEditing && (
                         <>
                           <button draggable onDragStart={e => e.dataTransfer.setData('toolType', 'map-pin')} onClick={() => createMapPin(mapRef.current)} className="p-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl shadow-xl transition-all active:scale-90 cursor-grab active:cursor-grabbing"><MapPinIcon size={24} /></button>
                           <button draggable onDragStart={e => e.dataTransfer.setData('toolType', 'map-region')} onClick={() => createMapRegion(mapRef.current)} className="p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-xl transition-all active:scale-90 cursor-grab active:cursor-grabbing"><Square size={24} /></button>
                           <button onClick={() => setIsMapSettingsOpen(true)} className="p-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl shadow-xl transition-all"><Settings size={24} /></button>
                         </>
                       )}
                       {!isEditing && <button onClick={() => { if (viewMapRef.current) { const all:any[] = []; activeFloorPlan?.mapConfig?.regions.forEach((r:any) => r.coords.forEach((c:any) => all.push(c))); if (all.length) viewMapRef.current.fitBounds(L.latLngBounds(all), { padding: [50, 50], animate: true }); } }} className="p-4 bg-blue-600 text-white rounded-2xl shadow-xl active:scale-95"><Maximize size={24} /></button>}
                       <div className="flex flex-col bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
                          <button onClick={() => (isEditing ? mapRef.current : viewMapRef.current)?.zoomIn()} className="p-4 text-slate-300 hover:text-white hover:bg-blue-600 border-b border-slate-800"><Plus size={24}/></button>
                          <button onClick={() => (isEditing ? mapRef.current : viewMapRef.current)?.zoomOut()} className="p-4 text-slate-300 hover:text-white hover:bg-blue-600"><Minus size={24}/></button>
                       </div>
                    </div>
                  </div>
                )}

                {/* 3. BMP 檢視與編輯 */}
                {sourceType === 'image' && activeFloorPlan?.imageUrl && (
                  <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
                    {/* 修正：移除平移用的 translate 變量中的滑鼠交互部分 */}
                    <div className="relative transition-transform duration-75 ease-out inline-block" style={{ transform: `translate(${imgOffset.x}px, ${imgOffset.y}px) scale(${imgScale})` }}>
                      <img ref={imgRef} src={activeFloorPlan.imageUrl} className="max-w-[85vw] max-h-[80vh] block rounded-lg border border-slate-700 shadow-2xl" />
                      <div className="absolute inset-0 z-20 pointer-events-none">
                         {activeFloorPlan.sensors.map(pos => {
                           const n = allDevicesInContext.find(d => d.id === pos.id);
                           return (
                             <div key={pos.id} className={`absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto group ${isEditing ? 'cursor-move' : ''}`} style={{ left: `${pos.x}%`, top: `${pos.y}%` }} onMouseDown={(e) => { if(isEditing) { e.stopPropagation(); setDraggingDeviceId(pos.id); } }}>
                                <div className="w-10 h-10 rounded-full border-2 border-white bg-blue-600 flex items-center justify-center shadow-xl text-white relative shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                                   {n?.deviceType === 'camera' ? <Video size={18}/> : <Cpu size={18}/>}
                                   {isEditing && (
                                     <button onMouseDown={(e) => e.stopPropagation()} onClick={() => setDeviceToDelete({id: pos.id, label: n?.label || ''})} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full border border-white text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={10}/></button>
                                   )}
                                </div>
                                <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-0.5 rounded text-[9px] font-black text-white whitespace-nowrap border border-white/10 shadow-xl">{n?.label}</div>
                             </div>
                           );
                         })}
                      </div>
                    </div>
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-[#1e293b]/90 backdrop-blur-md border border-slate-700 p-2 rounded-2xl flex items-center gap-3 shadow-2xl z-[100]">
                       <button onClick={() => setImgScale(p => Math.max(0.5, p - 0.2))} className="p-2.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl"><ZoomOut size={20}/></button>
                       <div className="w-12 text-center text-xs font-mono font-black text-blue-400">{(imgScale * 100).toFixed(0)}%</div>
                       <button onClick={() => setImgScale(p => Math.min(5, p + 0.2))} className="p-2.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl"><ZoomIn size={20}/></button>
                       <div className="w-px h-6 bg-slate-700 mx-1"></div>
                       <button onClick={resetImgView} className="px-4 py-2 hover:bg-slate-700 rounded-xl text-slate-300 font-black text-[10px] uppercase tracking-widest flex items-center gap-2"><Maximize size={16}/> Reset</button>
                    </div>
                  </div>
                )}

                {/* 4. 來源選取 */}
                {isEditing && !sourceType && (
                   <div className="flex flex-col items-center gap-10 animate-in zoom-in-95">
                     <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">選取平面圖來源</h2>
                     <div className="flex gap-8">
                        <button onClick={() => setSourceType('map')} className="w-64 h-64 flex flex-col items-center justify-center gap-6 bg-[#111827] border-2 border-slate-800 rounded-[3.5rem] hover:border-blue-500 hover:bg-blue-600/5 transition-all group shadow-2xl"><div className="p-6 bg-slate-800 rounded-3xl text-slate-400 group-hover:text-blue-400 transition-colors shadow-inner"><Database size={28} /></div><span className="text-lg font-black text-white uppercase tracking-widest">地圖選取 (GIS)</span></button>
                        <button onClick={() => setSourceType('image')} className="w-64 h-64 flex flex-col items-center justify-center gap-6 bg-[#111827] border-2 border-slate-800 rounded-[3.5rem] hover:border-blue-500 hover:bg-blue-600/5 transition-all group shadow-2xl"><div className="p-6 bg-slate-800 rounded-3xl text-slate-400 group-hover:text-blue-400 transition-colors shadow-inner"><Upload size={28} /></div><span className="text-lg font-black text-white uppercase tracking-widest">影像上傳 (BMP)</span></button>
                     </div>
                   </div>
                )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-20"><Layout size={100} /><span className="text-sm font-black uppercase mt-6 tracking-[0.2em]">Select an Area to Configure</span></div>
        )}
      </div>

      {/* 刪除/初始化彈窗 */}
      {deviceToDelete && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
           <div className="bg-[#1e293b] border border-slate-700 rounded-[2.5rem] p-10 max-w-sm w-full animate-in zoom-in shadow-2xl ring-1 ring-white/5">
              <div className="flex items-center gap-4 mb-6 text-red-500"><AlertTriangle size={32} /><h3 className="text-2xl font-black italic uppercase tracking-tighter">移除設備？</h3></div>
              <p className="text-sm text-slate-400 mb-10 leading-relaxed font-medium">您確定要將「{deviceToDelete.label}」從當前位置移除嗎？</p>
              <div className="flex gap-4">
                 <button onClick={() => setDeviceToDelete(null)} className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black uppercase text-xs transition-all">取消</button>
                 <button onClick={() => { setFloorPlans(p => { const next = [...p]; const i = next.findIndex(x => x.siteId === selectedSiteId); if (i > -1) next[i].sensors = next[i].sensors.filter(s => s.id !== deviceToDelete.id); return next; }); setDeviceToDelete(null); }} className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase text-xs shadow-xl shadow-red-900/20 active:scale-95 transition-all">確認移除</button>
              </div>
           </div>
        </div>
      )}

      {isResetting && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
           <div className="bg-[#1e293b] border border-slate-700 rounded-[2.5rem] p-10 max-w-sm w-full animate-in zoom-in shadow-2xl ring-1 ring-white/5">
              <div className="flex items-center gap-4 mb-6 text-red-500"><RefreshCw size={32} /><h3 className="text-2xl font-black italic uppercase tracking-tighter">初始化配置？</h3></div>
              <p className="text-sm text-slate-400 mb-10 leading-relaxed font-medium">這將清空此區域所有的圖資與設備擺放設定，且無法還原。</p>
              <div className="flex gap-4">
                 <button onClick={() => setIsResetting(false)} className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black uppercase text-xs transition-all">取消</button>
                 <button onClick={() => { setFloorPlans(p => p.filter(x => x.siteId !== selectedSiteId)); setSourceType(null); setIsResetting(false); setIsEditing(false); }} className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase text-xs shadow-xl shadow-red-900/20 active:scale-95 transition-all">確認清空</button>
              </div>
           </div>
        </div>
      )}

      {/* GIS 完整設定彈窗 - 對齊附件截圖樣式 */}
      {isMapSettingsOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in">
           <div className="bg-[#111827] border border-slate-700 rounded-[2.5rem] shadow-2xl max-w-3xl w-full flex flex-col overflow-hidden ring-1 ring-white/5 animate-in zoom-in-95 duration-200">
              <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-[#1e293b]/40">
                 <div className="flex items-center gap-5"><div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl"><Globe size={28}/></div><div><h2 className="text-2xl font-black text-white tracking-tighter italic uppercase">地圖服務配置</h2><p className="text-[10px] text-slate-500 font-black mt-1 uppercase tracking-widest">MAP SERVICE PROVIDER & VISUALIZATION SETTINGS</p></div></div>
                 <button onClick={() => setIsMapSettingsOpen(false)} className="p-2 text-slate-500 hover:text-red-500 transition-colors"><X size={32}/></button>
              </div>
              
              <div className="p-10 space-y-12 overflow-y-auto custom-scrollbar max-h-[70vh]">
                 {/* 1. 地圖服務提供者 */}
                 <div className="space-y-6">
                    <div className="flex items-center gap-3 text-blue-500 font-black text-[11px] uppercase tracking-[0.2em]"><MapIcon size={16}/> 地圖服務提供者</div>
                    <div className="grid grid-cols-3 gap-5">
                       {[
                         {id:'opensource', label:'OPENSOURCE MAP', icon:<Database size={24}/>}, 
                         {id:'osm', label:'OPENSTREET MAP', icon:<Globe size={24}/>}, 
                         {id:'google', label:'GOOGLE MAPS', icon:<MapIcon size={24}/>}
                       ].map(p => (
                         <button key={p.id} onClick={() => setMapProvider(p.id as MapProvider)} className={`flex flex-col items-center justify-center p-8 rounded-[2rem] border-2 transition-all gap-4 relative ${mapProvider === p.id ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-xl ring-1 ring-blue-500/30' : 'bg-black/20 border-slate-800 text-slate-500 hover:border-slate-700'}`}>{p.icon}<span className="text-[10px] font-black uppercase tracking-widest">{p.label}</span>{mapProvider === p.id && <div className="absolute top-4 right-4 bg-blue-500 rounded-full p-0.5 text-white shadow-lg"><Check size={10} strokeWidth={4} /></div>}</button>
                       ))}
                    </div>
                 </div>

                 {/* 2. Google API Key 區塊 (僅在選取 Google 時出現) */}
                 {mapProvider === 'google' && (
                    <div className="bg-blue-900/10 border border-blue-500/20 rounded-[2rem] p-8 animate-in slide-in-from-top-4 duration-300">
                        <div className="flex gap-10">
                            <div className="flex-1 space-y-5">
                                <div className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest"><Navigation size={14}/> GOOGLE MAPS API KEY</div>
                                <input type="text" placeholder="輸入您的 Google API 金鑰..." value={googleApiKey} onChange={e => setGoogleApiKey(e.target.value)} className="w-full bg-[#050914] border border-slate-700 rounded-xl py-3.5 px-5 text-sm font-bold text-white focus:border-blue-500 outline-none shadow-inner" />
                            </div>
                            <div className="w-64 space-y-4">
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest"><Info size={14}/> 金鑰取得方式</div>
                                <div className="bg-black/30 rounded-2xl p-5 border border-slate-800 text-[11px] space-y-3 font-bold text-slate-400">
                                   <div className="flex gap-2"><span>1.</span><span>前往 GCP 控制台</span></div>
                                   <div className="flex gap-2"><span>2.</span><span>啟用 Maps JavaScript API</span></div>
                                   <div className="flex gap-2"><span>3.</span><span>在憑證頁面建立 API Key</span></div>
                                   <a href="https://console.cloud.google.com/" target="_blank" className="block pt-2 text-blue-400 hover:underline flex items-center gap-1.5 uppercase text-[9px] font-black">開啟控制台 <ExternalLink size={10}/></a>
                                </div>
                            </div>
                        </div>
                    </div>
                 )}

                 {/* 3. 圖層視覺風格 */}
                 <div className="space-y-6">
                    <div className="flex items-center gap-3 text-blue-500 font-black text-[11px] uppercase tracking-[0.2em]"><Layers size={16}/> 圖層視覺風格</div>
                    <div className="grid grid-cols-2 gap-5">
                       <button onClick={() => setMapLayerStyle('dark')} className={`flex items-center gap-6 p-6 rounded-[2rem] border-2 transition-all ${mapLayerStyle === 'dark' ? 'bg-blue-600/10 border-blue-500 shadow-xl' : 'bg-black/20 border-slate-800 text-slate-500'}`}><div className="w-14 h-14 bg-black rounded-2xl border border-slate-800 shadow-inner flex items-center justify-center"><div className="w-6 h-6 bg-slate-900 rounded-lg"></div></div><div className="text-left"><span className="block text-sm font-black text-slate-100 uppercase tracking-tight">地圖 (深色)</span><span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Dark Visualization</span></div></button>
                       <button onClick={() => setMapLayerStyle('light')} className={`flex items-center gap-6 p-6 rounded-[2rem] border-2 transition-all ${mapLayerStyle === 'light' ? 'bg-blue-600/10 border-blue-500 shadow-xl' : 'bg-black/20 border-slate-800 text-slate-500'}`}><div className="w-14 h-14 bg-slate-200 rounded-2xl border border-white shadow-inner flex items-center justify-center"><div className="w-6 h-6 bg-white rounded-lg"></div></div><div className="text-left"><span className="block text-sm font-black text-slate-100 uppercase tracking-tight">地圖 (淺色)</span><span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Standard Light Mode</span></div></button>
                    </div>
                 </div>
              </div>

              <div className="p-8 bg-[#0b1121] border-t border-slate-800 flex justify-end gap-5 shrink-0">
                 <button onClick={() => setIsMapSettingsOpen(false)} className="px-10 py-4 bg-[#1e293b] hover:bg-slate-800 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest border border-slate-800 transition-all">取消</button>
                 <button onClick={() => setIsMapSettingsOpen(false)} className="px-14 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl transition-all active:scale-95 ring-1 ring-white/10 flex items-center gap-3"><CheckCircle2 size={20}/> 儲存配置</button>
              </div>
           </div>
        </div>
      )}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

const History = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
    <path d="M3 3v5h5"></path>
    <path d="M12 7v5l4 2"></path>
  </svg>
);

export default FloorPlanCenterTab;