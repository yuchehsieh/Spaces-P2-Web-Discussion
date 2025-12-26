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
  Smartphone,
  MousePointer2,
  ArrowRightCircle
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
  placedDeviceIds: Set<string>;
  representedSubNodeIds: Set<string>; 
  isEditing: boolean;
  selectedNodeType: string | undefined;
  parentId: string | null; 
}

const TreeItem: React.FC<TreeItemProps> = ({ 
  node, 
  level, 
  selectedId, 
  onSelect, 
  searchTerm, 
  idsWithFloorPlan, 
  placedDeviceIds, 
  representedSubNodeIds,
  isEditing,
  selectedNodeType,
  parentId
}) => {
  const [isOpen, setIsOpen] = useState(node.isOpen ?? true);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;
  const hasFloorPlan = idsWithFloorPlan.has(node.id);
  const isDevice = node.type === 'device';
  
  // 反灰邏輯：設備且已配置才反灰
  const isPlaced = isDevice && placedDeviceIds.has(node.id);
  
  // 檢查是否為「目前選中節點的直接子節點」
  const isDirectChild = parentId === selectedId && !isDevice;
  const isAlreadyRepresented = representedSubNodeIds.has(node.id);

  // 拖拽權限：設備或未標記的直接子節點
  const canDrag = isEditing && (
    (isDevice && !isPlaced && parentId === selectedId && (selectedNodeType === 'zone' || selectedNodeType === 'host')) ||
    (isDirectChild && !isAlreadyRepresented)
  );

  const shouldShow = useMemo(() => {
    if (!searchTerm) return true;
    const matchSelf = node.label.toLowerCase().includes(searchTerm.toLowerCase());
    const matchChild = (nodes: SiteNode[]): boolean => nodes.some(n => (n.label.toLowerCase().includes(searchTerm.toLowerCase()) || (n.children && matchChild(n.children))));
    return matchSelf || (node.children ? matchChild(node.children) : false);
  }, [node, searchTerm]);

  if (!shouldShow) return null;

  const getIcon = () => {
    if (isDevice) {
      const colorClass = isPlaced ? 'text-slate-600' : isSelected ? 'text-white' : 'text-slate-400';
      switch (node.deviceType) {
        case 'camera': return <Video size={14} className={colorClass} />;
        case 'sensor': return <Cpu size={14} className={colorClass} />;
        case 'door': return <DoorOpen size={14} className={colorClass} />;
        case 'emergency': return <Bell size={14} className={colorClass} />;
        default: return <Cpu size={14} className={colorClass} />;
      }
    }
    const colorClass = isSelected ? 'text-white' : '';
    switch (node.type) {
      case 'group': return <Layout size={16} className={colorClass || "text-blue-500"} />;
      case 'site': return <Building2 size={16} className={colorClass || "text-blue-400"} />;
      case 'host': return <Server size={14} className={colorClass || "text-slate-400"} />;
      case 'zone': return <FolderOpen size={14} className={colorClass || (isSelected ? 'text-white' : 'text-slate-500')} />;
      default: return null;
    }
  };

  return (
    <div className="select-none">
      <div 
        onClick={() => onSelect(node.id)}
        draggable={canDrag}
        onDragStart={(e) => {
          if (canDrag) {
            if (isDevice) {
              e.dataTransfer.setData('sensorId', node.id);
            } else {
              e.dataTransfer.setData('nodeId', node.id);
              e.dataTransfer.setData('nodeType', node.type);
              e.dataTransfer.setData('nodeLabel', node.label);
            }
          }
        }}
        className={`flex items-center py-2 pr-2 transition-all rounded-xl group mb-0.5 
          ${isSelected ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400'}
          ${isPlaced ? 'opacity-40 grayscale' : 'cursor-pointer'}
          ${canDrag ? 'cursor-grab active:cursor-grabbing ring-1 ring-blue-500/0 hover:ring-blue-500/30' : ''}
          ${isEditing && !canDrag && isDevice ? 'opacity-20 grayscale cursor-not-allowed' : ''}
          ${isEditing && isDirectChild && !isAlreadyRepresented ? 'ring-2 ring-blue-500/50 bg-blue-500/10' : ''}
          ${isEditing && isDirectChild && isAlreadyRepresented ? 'bg-blue-900/20' : ''}
        `}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
      >
        <span 
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          className={`mr-1 p-0.5 rounded hover:bg-white/10 ${hasChildren ? 'cursor-pointer' : 'opacity-0 pointer-events-none'}`}
        >
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <span className="mr-2 shrink-0">{getIcon()}</span>
        <div className="flex flex-col min-w-0">
          <span className={`text-xs truncate ${isSelected ? 'font-black' : 'font-bold'}`}>{node.label}</span>
          {isDevice && isPlaced && <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter italic">已標註於圖資</span>}
          {isEditing && isDirectChild && !isAlreadyRepresented && (
             <span className="text-[8px] font-black text-blue-400 uppercase tracking-tighter italic flex items-center gap-1 animate-pulse">
               <ArrowRightCircle size={8} /> 可拖曳至圖資標註
             </span>
          )}
          {isEditing && isDirectChild && isAlreadyRepresented && <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter italic">已配置於上層圖資</span>}
        </div>
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
            <TreeItem 
              key={child.id} 
              node={child} 
              level={level + 1} 
              selectedId={selectedId} 
              onSelect={onSelect} 
              searchTerm={searchTerm} 
              idsWithFloorPlan={idsWithFloorPlan} 
              placedDeviceIds={placedDeviceIds}
              representedSubNodeIds={representedSubNodeIds}
              isEditing={isEditing} 
              selectedNodeType={selectedNodeType}
              parentId={node.id}
            />
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
  const [addressSearch, setAddressSearch] = useState('');
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  
  // 核心交互狀態
  const [deviceToDelete, setDeviceToDelete] = useState<{id: string, label: string} | null>(null);
  const [imgScale, setImgScale] = useState(1);
  const [imgOffset, setImgOffset] = useState({ x: 0, y: 0 });
  const [draggingDeviceId, setDraggingDeviceId] = useState<string | null>(null);

  // 拖拽後的形式選擇狀態
  const [pendingPlacement, setPendingPlacement] = useState<{
    id: string;
    label: string;
    type: string;
    x: number; // 百分比或經度
    y: number; // 百分比或緯度
  } | null>(null);

  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const viewMapContainerRef = useRef<HTMLDivElement>(null);
  const viewMapRef = useRef<any>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  // 全域已放置設備 ID 集合
  const placedDeviceIds = useMemo(() => {
    const ids = new Set<string>();
    floorPlans.forEach(plan => plan.sensors.forEach(s => ids.add(s.id)));
    return ids;
  }, [floorPlans]);

  // 目前節點已標註子節點的集合
  const representedSubNodeIds = useMemo(() => {
    const ids = new Set<string>();
    if (activeFloorPlan?.mapConfig) {
      activeFloorPlan.mapConfig.pins?.forEach(p => ids.add(p.id));
      activeFloorPlan.mapConfig.regions?.forEach(r => ids.add(r.id));
    }
    return ids;
  }, [activeFloorPlan]);

  const addressSuggestions = useMemo(() => {
    if (!selectedSiteId) return [];
    const node = findNodeById(SITE_TREE_DATA, selectedSiteId);
    if (!node) return [];
    const suggestions: { label: string; address: string }[] = [];
    const findSites = (n: SiteNode) => {
        if (n.type === 'site' && n.address) suggestions.push({ label: n.label, address: n.address });
        n.children?.forEach(findSites);
    };
    if (node.type === 'group') node.children?.forEach(findSites);
    else {
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
        if (siteNode && siteNode.address) suggestions.push({ label: siteNode.label, address: siteNode.address });
    }
    return suggestions;
  }, [selectedSiteId]);

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
        } else alert("找不到該地址位置");
    } catch (error) { console.error("Geocoding failed:", error); } 
    finally { setIsMapLoading(false); }
  };

  useEffect(() => {
    if (activeFloorPlan) setSourceType(activeFloorPlan.type);
    else if (!isEditing) setSourceType(null);
    if (activeFloorPlan?.type !== 'map' && !isEditing) setIsMapLoading(false);
  }, [selectedSiteId, activeFloorPlan, isEditing]);

  useEffect(() => setAddressSearch(''), [selectedSiteId, isEditing]);

  const getTileUrl = (provider: MapProvider, style: MapLayerStyle) => {
    if (provider === 'osm') return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    if (provider === 'google') return 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
    return style === 'dark' 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedSiteId) {
      const url = URL.createObjectURL(file);
      setFloorPlans(prev => {
        const next = [...prev];
        const idx = next.findIndex(p => p.siteId === selectedSiteId);
        if (idx > -1) next[idx] = { ...next[idx], type: 'image', imageUrl: url };
        else next.push({ siteId: selectedSiteId, type: 'image', imageUrl: url, sensors: [] });
        return next;
      });
      setSourceType('image');
    }
  };

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

  const createMapPin = (map: any, pinConfig: MapPinType, isViewMode: boolean = false) => {
    const icon = L.divIcon({ 
      className: 'map-site-pin', 
      html: `<div style="position:relative;width:42px;height:42px;display:flex;align-items:center;justify-content:center;">
               <div style="width:32px;height:32px;background:#ef4444;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 10px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;color:white;">
                 <div style="transform:rotate(45deg);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><rect width="18" height="18" x="3" y="3" rx="2"/></svg></div>
               </div>
               ${!isViewMode ? `<button onclick="window.deleteMapPin('${pinConfig.id}')" style="position:absolute;top:-5px;right:-5px;width:18px;height:18px;background:white;border:1.5px solid #ef4444;border-radius:50%;color:#ef4444;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:500;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><line x1="18" y1="6" x2="6" y2="18"/></svg></button>` : ''}
             </div>`, 
      iconSize: [42, 42], iconAnchor: [21, 42] 
    });
    const marker = L.marker([pinConfig.lat, pinConfig.lng], { icon, draggable: !isViewMode }).addTo(map);
    marker.bindTooltip(pinConfig.label, { permanent: true, direction: 'bottom', className: 'map-label-tooltip', offset: [0, 5] });
    if (isViewMode) {
      marker.on('click', () => setSelectedSiteId(pinConfig.id));
      marker.getElement()?.style.setProperty('cursor', 'pointer');
    }
    activePinsRef.current.push({ id: pinConfig.id, marker, label: pinConfig.label });
  };

  const createMapRegion = (map: any, regionConfig: MapRegion, label: string = '區域範圍', isViewMode: boolean = false) => {
    let coords = regionConfig.coords.map(c => L.latLng(c[0], c[1]));
    const polygon = L.polygon(coords, { 
      color: '#3b82f6', weight: 3, fillColor: '#3b82f6', fillOpacity: isViewMode ? 0.2 : 0.1, dashArray: isViewMode ? null : '8, 8' 
    }).addTo(map);
    if (isViewMode) {
        polygon.on('click', () => setSelectedSiteId(regionConfig.id));
        polygon.bindTooltip(label, { permanent: true, direction: 'center', className: 'map-label-tooltip-region' });
        polygon.getElement()?.style.setProperty('cursor', 'pointer');
        activeRegionsRef.current.push({ id: regionConfig.id, polygon });
        return;
    }
    const markers: any[] = [];
    const updatePolygon = () => {
      const newCoords = markers.map(m => m.getLatLng());
      polygon.setLatLngs(newCoords);
      const latSum = newCoords.reduce((s, c) => s + c.lat, 0) / newCoords.length;
      const lngSum = newCoords.reduce((s, c) => s + c.lng, 0) / newCoords.length;
      centerMarker.setLatLng([latSum, lngSum]);
    };
    coords.forEach(latlng => {
      const m = L.marker(latlng, { draggable: true, icon: L.divIcon({ className: 'hnd', html: `<div style="width:14px;height:14px;background:white;border:3px solid #3b82f6;border-radius:50%;"></div>`, iconSize:[14,14], iconAnchor:[7,7] }) }).addTo(map);
      m.on('drag', updatePolygon); markers.push(m);
    });
    const centerMarker = L.marker([coords.reduce((s, c) => s + c.lat, 0) / coords.length, coords.reduce((s, c) => s + c.lng, 0) / coords.length], { draggable: true, icon: L.divIcon({ className: 'ctr', html: `<div style="position:relative;width:32px;height:32px;"><div style="width:32px;height:32px;background:#3b82f6;border-radius:10px;display:flex;align-items:center;justify-content:center;color:white;border:2px solid white;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="5 9 2 12 5 15"></polyline><polyline points="9 5 12 2 15 5"></polyline><polyline points="15 19 12 22 9 19"></polyline><polyline points="19 9 22 12 19 15"></polyline><line x1="2" y1="12" x2="22" y2="12"></line><line x1="12" y1="2" x2="12" y2="22"></line></svg></div><button onclick="window.deleteMapRegion('${regionConfig.id}')" style="position:absolute;top:-10px;right:-10px;width:22px;height:22px;background:#ef4444;border:2px solid white;border-radius:50%;color:white;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:600;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button><div style="position:absolute;top:38px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:white;padding:1px 5px;border-radius:3px;font-size:8px;font-weight:900;white-space:nowrap;border:1px solid rgba(255,255,255,0.1);">${label}</div></div>`, iconSize: [32, 32], iconAnchor: [16, 16] }) }).addTo(map);
    centerMarker.on('dragstart', (e: any) => { centerMarker._startPos = e.target.getLatLng(); centerMarker._startCorners = markers.map(m => m.getLatLng()); });
    centerMarker.on('drag', (e: any) => {
        const cur = e.target.getLatLng(); const dLat = cur.lat - centerMarker._startPos.lat; const dLng = cur.lng - centerMarker._startPos.lng;
        markers.forEach((m, i) => m.setLatLng([centerMarker._startCorners[i].lat + dLat, centerMarker._startCorners[i].lng + dLng]));
        polygon.setLatLngs(markers.map(m => m.getLatLng()));
    });
    activeRegionsRef.current.push({ id: regionConfig.id, polygon, markers, centerMarker });
  };

  const handleImgWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setImgScale(prev => Math.min(Math.max(0.5, prev + delta), 5));
  };
  const resetImgView = () => { setImgScale(1); setImgOffset({ x: 0, y: 0 }); };
  const handleImgMouseMove = (e: React.MouseEvent) => {
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
  const stopImgInteraction = () => setDraggingDeviceId(null);

  const deleteBmpPin = (id: string) => {
    setFloorPlans(prev => {
        const next = [...prev];
        const i = next.findIndex(p => p.siteId === selectedSiteId);
        if (i > -1 && next[i].mapConfig) {
            next[i].mapConfig = { ...next[i].mapConfig!, pins: next[i].mapConfig?.pins?.filter(p => p.id !== id) || [] };
        }
        return next;
    });
  };

  const deleteBmpRegion = (id: string) => {
    setFloorPlans(prev => {
        const next = [...prev];
        const i = next.findIndex(p => p.siteId === selectedSiteId);
        if (i > -1 && next[i].mapConfig) {
            next[i].mapConfig = { ...next[i].mapConfig!, regions: next[i].mapConfig?.regions?.filter(r => r.id !== id) || [] };
        }
        return next;
    });
  };

  useEffect(() => {
    (window as any).confirmDeleteDevice = (id: string, label: string) => setDeviceToDelete({ id, label });
    (window as any).deleteMapPin = (id: string) => { 
        setFloorPlans(prev => {
            const next = [...prev]; const i = next.findIndex(p => p.siteId === selectedSiteId);
            if (i > -1 && next[i].mapConfig) next[i].mapConfig = { ...next[i].mapConfig!, pins: next[i].mapConfig?.pins?.filter(p => p.id !== id) || [] };
            return next;
        });
    };
    (window as any).deleteMapRegion = (id: string) => { 
        setFloorPlans(prev => {
            const next = [...prev]; const i = next.findIndex(p => p.siteId === selectedSiteId);
            if (i > -1 && next[i].mapConfig) next[i].mapConfig = { ...next[i].mapConfig!, regions: next[i].mapConfig?.regions?.filter(r => r.id !== id) || [] };
            return next;
        });
    };
    return () => { delete (window as any).confirmDeleteDevice; delete (window as any).deleteMapPin; delete (window as any).deleteMapRegion; };
  }, [selectedSiteId]);

  useEffect(() => {
    if (isEditing && sourceType === 'map' && mapContainerRef.current) {
      setIsMapLoading(true);
      const timer = setTimeout(() => {
        if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
        const config = activeFloorPlan?.mapConfig || { center: [25.0629, 121.5796], zoom: 17 };
        const map = L.map(mapContainerRef.current, { zoomControl: false }).setView(config.center, config.zoom);
        L.tileLayer(getTileUrl(mapProvider, mapLayerStyle)).addTo(map);
        activeRegionsRef.current = []; activePinsRef.current = []; activeDeviceMarkersRef.current = [];
        if (activeFloorPlan?.mapConfig?.regions) activeFloorPlan.mapConfig.regions.forEach(r => createMapRegion(map, r, findNodeById(SITE_TREE_DATA, r.id)?.label));
        if (activeFloorPlan?.mapConfig?.pins) activeFloorPlan.mapConfig.pins.forEach(p => createMapPin(map, p));
        if (activeFloorPlan?.sensors) activeFloorPlan.sensors.forEach(s => createDeviceMarker(map, s, findNodeById(SITE_TREE_DATA, s.id)?.label || '設備', true));
        mapRef.current = map; map.invalidateSize(); setIsMapLoading(false);
      }, 300);
      return () => { clearTimeout(timer); if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
    }
  }, [isEditing, sourceType, selectedSiteId, mapProvider, mapLayerStyle, activeFloorPlan?.mapConfig?.pins?.length, activeFloorPlan?.mapConfig?.regions?.length, activeFloorPlan?.sensors?.length]);

  useEffect(() => {
    if (!isEditing && sourceType === 'map' && viewMapContainerRef.current) {
      setIsMapLoading(true);
      const timer = setTimeout(() => {
        if (viewMapRef.current) { viewMapRef.current.remove(); viewMapRef.current = null; }
        const config = activeFloorPlan?.mapConfig || { center: [25.0629, 121.5796], zoom: 17 };
        const map = L.map(viewMapContainerRef.current, { zoomControl: false, attributionControl: false }).setView(config.center, config.zoom);
        L.tileLayer(getTileUrl(mapProvider, mapLayerStyle)).addTo(map);
        activeFloorPlan?.mapConfig?.regions?.forEach((r:any) => createMapRegion(map, r, findNodeById(SITE_TREE_DATA, r.id)?.label || '', true));
        activeFloorPlan?.mapConfig?.pins?.forEach((p:any) => createMapPin(map, p, true));
        activeFloorPlan?.sensors.forEach(s => createDeviceMarker(map, s, findNodeById(SITE_TREE_DATA, s.id)?.label || '', false));
        viewMapRef.current = map; map.invalidateSize(); setIsMapLoading(false);
      }, 500);
      return () => { clearTimeout(timer); if (viewMapRef.current) { viewMapRef.current.remove(); viewMapRef.current = null; } };
    } else if (!isEditing && sourceType !== 'map') setIsMapLoading(false);
  }, [isEditing, selectedSiteId, sourceType, mapProvider, mapLayerStyle, activeFloorPlan?.sensors.length, activeFloorPlan?.mapConfig?.pins.length, activeFloorPlan?.mapConfig?.regions.length]);

  const handleSaveAllConfig = () => {
    if (!selectedSiteId) return;
    if (sourceType === 'map' && mapRef.current) {
      const map = mapRef.current;
      const savedRegions: MapRegion[] = activeRegionsRef.current.map(r => { 
          const raw = r.polygon.getLatLngs(); const outer = Array.isArray(raw[0]) ? raw[0] : raw; 
          return { id: r.id, coords: outer.map((l: any) => [l.lat, l.lng]) }; 
      });
      const savedPins: MapPinType[] = activePinsRef.current.map(p => ({ id: p.id, label: p.label, lat: p.marker.getLatLng().lat, lng: p.marker.getLatLng().lng }));
      const currentSensors = activeFloorPlan?.sensors || [];
      setFloorPlans(prev => { 
          const next = [...prev]; const idx = next.findIndex(p => p.siteId === selectedSiteId); 
          const mapConfig = { center: [map.getCenter().lat, map.getCenter().lng] as [number, number], zoom: map.getZoom(), regions: savedRegions, pins: savedPins }; 
          if (idx > -1) next[idx] = { ...next[idx], type: 'map', mapConfig, sensors: currentSensors }; 
          else next.push({ siteId: selectedSiteId, type: 'map', mapConfig, sensors: currentSensors }); 
          return next; 
      });
    }
    setIsEditing(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!isEditing || !selectedSiteId) return;
    e.preventDefault();
    const sensorId = e.dataTransfer.getData('sensorId');
    const nodeId = e.dataTransfer.getData('nodeId');
    const nodeType = e.dataTransfer.getData('nodeType');
    const nodeLabel = e.dataTransfer.getData('nodeLabel');
    if (sourceType === 'map' && mapRef.current) {
      const rect = mapContainerRef.current!.getBoundingClientRect();
      const latlng = mapRef.current.containerPointToLatLng(L.point(e.clientX - rect.left, e.clientY - rect.top));
      if (nodeId && nodeType !== 'device') { setPendingPlacement({ id: nodeId, label: nodeLabel, type: nodeType, x: latlng.lng, y: latlng.lat }); return; }
      if (sensorId && selectedNode?.type === 'zone') {
        const newSensor = { id: sensorId, x: latlng.lng, y: latlng.lat };
        createDeviceMarker(mapRef.current, newSensor, findNodeById(SITE_TREE_DATA, sensorId)?.label || '設備', true);
        setFloorPlans(prev => { 
          const next = [...prev]; const idx = next.findIndex(p => p.siteId === selectedSiteId); 
          if (idx === -1) next.push({ siteId: selectedSiteId, type: 'map', sensors: [newSensor], mapConfig: { center: [latlng.lat, latlng.lng], zoom: 17, regions: [], pins: [] } }); 
          else { const ns = [...next[idx].sensors]; const si = ns.findIndex(s => s.id === sensorId); if (si > -1) ns[si] = newSensor; else ns.push(newSensor); next[idx] = { ...next[idx], sensors: ns }; } 
          return next; 
        });
      }
    } else if (sourceType === 'image' && imgRef.current) {
      const rect = imgRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      if (nodeId && nodeType !== 'device') { setPendingPlacement({ id: nodeId, label: nodeLabel, type: nodeType, x, y }); return; }
      if (sensorId && (selectedNode?.type === 'zone' || selectedNode?.type === 'host')) {
        setFloorPlans(prev => { 
            const next = [...prev]; const idx = next.findIndex(p => p.siteId === selectedSiteId); const newS = { id: sensorId, x, y }; 
            if (idx > -1) { const ns = [...next[idx].sensors]; const si = ns.findIndex(s => s.id === sensorId); if (si > -1) ns[si] = newS; else ns.push(newS); next[idx] = { ...next[idx], sensors: ns }; } 
            return next; 
        });
      }
    }
  };

  const handlePlacementChoice = (choice: 'pin' | 'region') => {
    if (!pendingPlacement) return;
    const { id, label, x, y } = pendingPlacement;
    if (sourceType === 'map' && mapRef.current) {
        if (choice === 'pin') {
            const newPin = { id, label, lat: y, lng: x }; createMapPin(mapRef.current, newPin);
            setFloorPlans(prev => {
                const next = [...prev]; const idx = next.findIndex(p => p.siteId === selectedSiteId);
                if (idx === -1) next.push({ siteId: selectedSiteId, type: 'map', sensors: [], mapConfig: { center: [y, x], zoom: 17, regions: [], pins: [newPin] } });
                else { const mc = next[idx].mapConfig || { center: [y, x], zoom: 17, regions: [], pins: [] }; next[idx] = { ...next[idx], mapConfig: { ...mc, pins: [...(mc.pins || []), newPin] } }; }
                return next;
            });
        } else {
            const offset = 0.0004; const newRegion = { id, coords: [[y + offset, x - offset], [y + offset, x + offset], [y - offset, x + offset], [y - offset, x - offset]] as [number, number][] };
            createMapRegion(mapRef.current, newRegion, label);
            setFloorPlans(prev => {
                const next = [...prev]; const idx = next.findIndex(p => p.siteId === selectedSiteId);
                if (idx === -1) next.push({ siteId: selectedSiteId, type: 'map', sensors: [], mapConfig: { center: [y, x], zoom: 17, regions: [newRegion], pins: [] } });
                else { const mc = next[idx].mapConfig || { center: [y, x], zoom: 17, regions: [], pins: [] }; next[idx] = { ...next[idx], mapConfig: { ...mc, regions: [...(mc.regions || []), newRegion] } }; }
                return next;
            });
        }
    } else if (sourceType === 'image') {
        if (choice === 'pin') {
            const newPin = { id, label, lat: y, lng: x };
            setFloorPlans(prev => {
                const next = [...prev]; const idx = next.findIndex(p => p.siteId === selectedSiteId);
                const mc = next[idx].mapConfig || { center: [0, 0], zoom: 0, regions: [], pins: [] };
                next[idx] = { ...next[idx], mapConfig: { ...mc, pins: [...(mc.pins || []), newPin] } };
                return next;
            });
        } else {
            const size = 10; const newRegion = { id, coords: [[y - size/2, x - size/2], [y - size/2, x + size/2], [y + size/2, x + size/2], [y + size/2, x - size/2]] as [number, number][] };
            setFloorPlans(prev => {
                const next = [...prev]; const idx = next.findIndex(p => p.siteId === selectedSiteId);
                const mc = next[idx].mapConfig || { center: [0, 0], zoom: 0, regions: [], pins: [] };
                next[idx] = { ...next[idx], mapConfig: { ...mc, regions: [...(mc.regions || []), newRegion] } };
                return next;
            });
        }
    }
    setPendingPlacement(null);
  };

  return (
    <div className="flex h-full w-full bg-[#050914] text-slate-200 overflow-hidden relative font-sans">
      <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
      <div className="w-80 border-r border-slate-800 bg-[#0b1121] flex flex-col shrink-0 overflow-hidden relative z-50">
        <div className="p-4 border-b border-slate-800/50 bg-[#0b1121]">
          <div className="relative">
            <input type="text" placeholder="搜尋區域或設備..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-[#111827] border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-200 outline-none focus:border-blue-500 shadow-inner" />
            <Search size={14} className="absolute left-3.5 top-3 text-slate-600" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
          {SITE_TREE_DATA.map(node => (
            <TreeItem key={node.id} node={node} level={0} selectedId={selectedSiteId} onSelect={(id) => { setSelectedSiteId(id); setIsEditing(false); }} searchTerm={searchTerm} idsWithFloorPlan={idsWithFloorPlan} placedDeviceIds={placedDeviceIds} representedSubNodeIds={representedSubNodeIds} isEditing={isEditing} selectedNodeType={selectedNode?.type} parentId={null} />
          ))}
        </div>
        <div className="p-3 border-t border-slate-800/50 bg-black/20 text-center"><span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] italic">{isEditing ? 'DRAG SUB-SITES OR DEVICES TO GIS' : 'SITE HIERARCHY'}</span></div>
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
                {selectedNode?.type !== 'device' && (
                    isEditing ? (
                    <>
                        {!!activeFloorPlan && <button onClick={() => setIsResetting(true)} className="px-5 py-2.5 bg-red-950/20 hover:bg-red-600/20 text-red-500 rounded-xl font-bold text-xs border border-red-900/30 flex items-center gap-2 transition-all"><RefreshCw size={14}/> 重新配置圖資</button>}
                        <button onClick={() => { setIsEditing(false); setIsMapLoading(false); }} className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs border border-slate-700">取消</button>
                        <button onClick={handleSaveAllConfig} className="px-10 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs uppercase shadow-xl">儲存變更</button>
                    </>
                    ) : <button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2.5 rounded-xl font-black text-xs uppercase shadow-xl flex items-center gap-3 active:scale-95 transition-all"><Pencil size={16} /> 進入編輯模式</button>
                )}
              </div>
            </div>

            <div className={`flex-1 bg-black relative overflow-hidden flex items-center justify-center select-none ${draggingDeviceId ? 'cursor-grabbing' : 'cursor-default'}`} onDragOver={e => e.preventDefault()} onDrop={handleDrop} onWheel={handleImgWheel} onMouseMove={handleImgMouseMove} onMouseUp={stopImgInteraction} onMouseLeave={stopImgInteraction}>
                {isMapLoading && (
                  <div className="absolute inset-0 z-[600] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-6">
                     <Loader2 size={48} className="text-blue-500 animate-spin" />
                     <span className="text-[11px] font-black text-blue-400 uppercase tracking-widest animate-pulse">Rendering GIS Intelligence...</span>
                  </div>
                )}
                {selectedNode?.type === 'device' ? (
                   <div className="flex flex-col items-center justify-center h-full gap-8 animate-in zoom-in-95 duration-500">
                        <div className="w-48 h-48 rounded-[3.5rem] bg-slate-900/50 border border-slate-800 flex items-center justify-center text-slate-700 shadow-2xl"><Cpu size={80} strokeWidth={1} /></div>
                        <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2">設備不支援直接配置圖資</h2>
                        <p className="text-slate-500 text-sm max-w-sm text-center">請選擇「分區 (Zone)」或「據點 (Site)」層級來進行平面圖與設備佈署。</p>
                    </div>
                ) : (
                    <>
                        {!activeFloorPlan && !isEditing && (
                            <div className="flex flex-col items-center justify-center h-full gap-8 animate-in zoom-in-95 duration-500">
                                <div className="w-48 h-48 rounded-[3.5rem] bg-[#0b1121]/80 border border-slate-800 flex items-center justify-center text-slate-800 shadow-[inset_0_0_60px_rgba(0,0,0,0.7)]"><Layout size={80} strokeWidth={1} /></div>
                                <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-2">未配置區域圖資</h2>
                                <button onClick={() => setIsEditing(true)} className="px-14 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-black text-sm uppercase tracking-widest active:scale-95 transition-all">進入編輯模式</button>
                            </div>
                        )}
                        {isEditing && !sourceType && !activeFloorPlan && (
                        <div className="flex flex-col items-center gap-10 animate-in zoom-in-95">
                            <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">選取平面圖來源</h2>
                            <div className="flex gap-8">
                                <button onClick={() => setSourceType('map')} className="w-64 h-64 flex flex-col items-center justify-center gap-6 bg-[#111827] border-2 border-slate-800 rounded-[3.5rem] hover:border-blue-500 hover:bg-blue-600/5 transition-all group shadow-2xl"><div className="p-6 bg-slate-800 rounded-3xl text-slate-400 group-hover:text-blue-400 shadow-inner"><Database size={28} /></div><span className="text-lg font-black text-white uppercase tracking-widest">地圖選取 (GIS)</span></button>
                                <button onClick={() => setSourceType('image')} className="w-64 h-64 flex flex-col items-center justify-center gap-6 bg-[#111827] border-2 border-slate-800 rounded-[3.5rem] hover:border-blue-500 hover:bg-blue-600/5 transition-all group shadow-2xl"><div className="p-6 bg-slate-800 rounded-3xl text-slate-400 group-hover:text-blue-400 shadow-inner"><Upload size={28} /></div><span className="text-lg font-black text-white uppercase tracking-widest">影像上傳 (BMP)</span></button>
                            </div>
                        </div>
                        )}
                        {isEditing && sourceType === 'image' && !activeFloorPlan?.imageUrl && (
                          <div className="flex flex-col items-center gap-8 animate-in zoom-in-95">
                              <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">上傳 BMP 平面圖影像</h2>
                              <div onClick={() => fileInputRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const file = e.dataTransfer.files?.[0]; if (file) { const ev = { target: { files: [file] } } as any; handleFileSelect(ev); } }} className="w-[32rem] h-80 bg-[#111827] border-4 border-dashed border-slate-800 rounded-[3.5rem] hover:border-blue-500 hover:bg-blue-600/5 transition-all group cursor-pointer flex flex-col items-center justify-center gap-6 shadow-2xl relative overflow-hidden">
                                  <div className="p-8 bg-slate-800 rounded-3xl text-slate-400 group-hover:text-blue-400 transition-all shadow-inner group-hover:scale-110"><Upload size={48} /></div>
                                  <div className="text-center space-y-2"><span className="text-xl font-black text-white uppercase tracking-widest block">點擊或拖曳檔案至此</span><p className="text-xs text-slate-500 font-bold uppercase tracking-widest">支援 JPG, PNG, BMP 格式 (建議 1920x1080 以上)</p></div>
                              </div>
                              <button onClick={() => setSourceType(null)} className="text-xs font-black text-slate-600 hover:text-slate-400 uppercase tracking-widest transition-colors">返回選擇來源</button>
                          </div>
                        )}
                        {sourceType === 'map' && (
                        <div className="w-full h-full relative">
                            {isEditing && (
                            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[500] w-full max-w-xl px-4 animate-in slide-in-from-top-4">
                                <div className="relative bg-[#1e293b]/90 backdrop-blur-xl border border-slate-700 rounded-2xl flex flex-col shadow-2xl overflow-visible">
                                    <div className="flex items-center p-1.5">
                                        <div className="p-2.5 text-blue-400"><Navigation size={20} className="animate-pulse" /></div>
                                        <input type="text" placeholder="搜尋地址或快速定位..." value={addressSearch} onChange={e => setAddressSearch(e.target.value)} onFocus={() => setShowAddressSuggestions(true)} onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 200)} onKeyDown={e => e.key === 'Enter' && performAddressSearch(addressSearch)} className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-white px-2 placeholder:text-slate-600" />
                                        <button onClick={() => performAddressSearch(addressSearch)} className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg active:scale-95 transition-all"><Search size={18} /></button>
                                    </div>
                                    {showAddressSuggestions && addressSuggestions.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-[#1e293b] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-[600] animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="p-3 border-b border-slate-800 bg-black/20"><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><History size={10}/> 快速地址選取</span></div>
                                            <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                                {addressSuggestions.map((s, idx) => (
                                                    <button key={idx} onClick={() => { setAddressSearch(s.address); performAddressSearch(s.address); }} className="w-full text-left p-4 hover:bg-blue-600/10 border-b border-slate-800/50 last:border-none transition-colors group flex items-start gap-4">
                                                        <div className="p-2 bg-slate-800 rounded-lg text-slate-400 group-hover:text-blue-400 transition-all"><MapPin size={16} /></div>
                                                        <div className="flex flex-col min-w-0"><span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors truncate">{s.label}</span><span className="text-[10px] text-slate-500 font-medium truncate">{s.address}</span></div>
                                                        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"><ExternalLink size={12} className="text-blue-500" /></div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            )}
                            <div ref={isEditing ? mapContainerRef : viewMapContainerRef} className="w-full h-full" />
                            {pendingPlacement && (
                                <div className="absolute inset-0 z-[700] bg-black/40 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-200">
                                    <div className="bg-[#1e293b] border border-slate-700 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 w-full max-w-sm flex flex-col gap-6 ring-1 ring-white/5">
                                        <div className="text-center"><span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] block mb-2">GIS PLACEMENT MODE</span><h3 className="text-xl font-black text-white italic tracking-tighter truncate">「{pendingPlacement.label}」</h3><p className="text-xs text-slate-500 font-bold mt-2 leading-relaxed px-4">請選取要在目前 GIS 圖資上標註的形式，此標註將作為下層區域之入口點。</p></div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button onClick={() => handlePlacementChoice('pin')} className="flex flex-col items-center justify-center gap-4 p-6 bg-slate-900 border border-slate-800 rounded-3xl hover:border-red-500 hover:bg-red-500/10 transition-all group"><div className="p-3 bg-red-600 text-white rounded-xl shadow-lg shadow-red-900/40 group-hover:scale-110"><MapPinIcon size={24}/></div><span className="text-[11px] font-black uppercase tracking-widest text-slate-400 group-hover:text-red-400">據點標註</span></button>
                                            <button onClick={() => handlePlacementChoice('region')} className="flex flex-col items-center justify-center gap-4 p-6 bg-slate-900 border border-slate-800 rounded-3xl hover:border-blue-500 hover:bg-blue-500/10 transition-all group"><div className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-900/40 group-hover:scale-110"><Square size={24}/></div><span className="text-[11px] font-black uppercase tracking-widest text-slate-400 group-hover:text-red-400">區域範圍</span></button>
                                        </div>
                                        <button onClick={() => setPendingPlacement(null)} className="py-3 text-[11px] font-black text-slate-600 hover:text-slate-400 uppercase tracking-widest border-t border-slate-800 mt-2 transition-colors">取消置放</button>
                                    </div>
                                </div>
                            )}
                            <div className="absolute bottom-8 right-8 flex flex-col gap-3 z-[500]">
                            {isEditing && <button onClick={() => setIsMapSettingsOpen(true)} className="p-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl shadow-xl border border-slate-700"><Settings size={24} /></button>}
                            {!isEditing && <button onClick={() => { if (viewMapRef.current) { const all:any[] = []; activeFloorPlan?.mapConfig?.regions.forEach((r:any) => r.coords.forEach((c:any) => all.push(c))); activeFloorPlan?.mapConfig?.pins?.forEach((p:any) => all.push([p.lat, p.lng])); if (all.length) viewMapRef.current.fitBounds(L.latLngBounds(all), { padding: [50, 50], animate: true }); } }} className="p-4 bg-blue-600 text-white rounded-2xl shadow-xl active:scale-95"><Maximize size={24} /></button>}
                            <div className="flex flex-col bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
                                <button onClick={() => (isEditing ? mapRef.current : viewMapRef.current)?.zoomIn()} className="p-4 text-slate-300 hover:text-white hover:bg-blue-600 border-b border-slate-800"><Plus size={24}/></button>
                                <button onClick={() => (isEditing ? mapRef.current : viewMapRef.current)?.zoomOut()} className="p-4 text-slate-300 hover:text-white hover:bg-blue-600"><Minus size={24}/></button>
                            </div>
                            </div>
                        </div>
                        )}
                        {sourceType === 'image' && activeFloorPlan?.imageUrl && (
                        <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
                            <div className="relative transition-transform duration-75 ease-out inline-block" style={{ transform: `translate(${imgOffset.x}px, ${imgOffset.y}px) scale(${imgScale})` }}>
                                <img ref={imgRef} src={activeFloorPlan.imageUrl} className="max-w-[85vw] max-h-[80vh] block rounded-lg border border-slate-700 shadow-2xl" />
                                <div className="absolute inset-0 z-20 pointer-events-none">
                                    {activeFloorPlan.mapConfig?.pins?.map(pin => (
                                        <div key={pin.id} onClick={() => !isEditing && setSelectedSiteId(pin.id)} className={`absolute -translate-x-1/2 -translate-y-full pointer-events-auto group ${!isEditing ? 'cursor-pointer' : ''}`} style={{ left: `${pin.lng}%`, top: `${pin.lat}%` }}>
                                            <div className="w-10 h-10 bg-red-600 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-white relative">
                                                <div className="rotate-45 -mt-1"><Building2 size={18}/></div>
                                                {isEditing && <button onClick={(e) => { e.stopPropagation(); deleteBmpPin(pin.id); }} className="absolute -top-2 -right-2 w-5 h-5 bg-white border border-red-600 rounded-full text-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={10}/></button>}
                                            </div>
                                            <div className="absolute top-1 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-0.5 rounded text-[9px] font-black text-white whitespace-nowrap border border-white/10 shadow-xl">{pin.label}</div>
                                        </div>
                                    ))}
                                    {activeFloorPlan.mapConfig?.regions?.map(region => {
                                        const node = findNodeById(SITE_TREE_DATA, region.id);
                                        const minX = Math.min(...region.coords.map(c => c[1])); const minY = Math.min(...region.coords.map(c => c[0]));
                                        const maxX = Math.max(...region.coords.map(c => c[1])); const maxY = Math.max(...region.coords.map(c => c[0]));
                                        return (
                                            <div key={region.id} onClick={() => !isEditing && setSelectedSiteId(region.id)} className={`absolute border-2 border-blue-500 bg-blue-500/10 pointer-events-auto group transition-all ${!isEditing ? 'cursor-pointer hover:bg-blue-500/30' : ''}`} style={{ left: `${minX}%`, top: `${minY}%`, width: `${maxX - minX}%`, height: `${maxY - minY}%` }}>
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest shadow-lg pointer-events-none">{node?.label}</div>
                                                {isEditing && <button onClick={(e) => { e.stopPropagation(); deleteBmpRegion(region.id); }} className="absolute -top-2 -right-2 w-5 h-5 bg-white border border-blue-600 rounded-full text-blue-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-50"><X size={10}/></button>}
                                            </div>
                                        );
                                    })}
                                    {activeFloorPlan.sensors.map(pos => {
                                        const n = findNodeById(SITE_TREE_DATA, pos.id);
                                        return (
                                            <div key={pos.id} className={`absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto group ${isEditing ? 'cursor-move' : ''}`} style={{ left: `${pos.x}%`, top: `${pos.y}%` }} onMouseDown={(e) => { if(isEditing) { e.stopPropagation(); setDraggingDeviceId(pos.id); } }}>
                                                <div className="w-10 h-10 rounded-full border-2 border-white bg-blue-600 flex items-center justify-center shadow-xl text-white relative shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                                                    {n?.deviceType === 'camera' ? <Video size={18}/> : <Cpu size={18}/>}
                                                    {isEditing && <button onMouseDown={(e) => e.stopPropagation()} onClick={() => setDeviceToDelete({id: pos.id, label: n?.label || ''})} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full border border-white text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={10}/></button>}
                                                </div>
                                                <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-0.5 rounded text-[9px] font-black text-white whitespace-nowrap border border-white/10 shadow-xl">{n?.label}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            {pendingPlacement && (
                                <div className="absolute inset-0 z-[700] bg-black/40 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-200">
                                    <div className="bg-[#1e293b] border border-slate-700 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 w-full max-w-sm flex flex-col gap-6 ring-1 ring-white/5">
                                        <div className="text-center"><span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] block mb-2">BMP PLACEMENT MODE</span><h3 className="text-xl font-black text-white italic tracking-tighter truncate">「{pendingPlacement.label}」</h3><p className="text-xs text-slate-500 font-bold mt-2 leading-relaxed px-4">請選取要在目前 BMP 平面圖上標註的形式，此標註將作為下層區域之導覽入口。</p></div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button onClick={() => handlePlacementChoice('pin')} className="flex flex-col items-center justify-center gap-4 p-6 bg-slate-900 border border-slate-800 rounded-3xl hover:border-red-500 hover:bg-red-500/10 transition-all group"><div className="p-3 bg-red-600 text-white rounded-xl shadow-lg shadow-red-900/40 group-hover:scale-110"><MapPinIcon size={24}/></div><span className="text-[11px] font-black uppercase tracking-widest text-slate-400 group-hover:text-red-400">據點標註</span></button>
                                            <button onClick={() => handlePlacementChoice('region')} className="flex flex-col items-center justify-center gap-4 p-6 bg-slate-900 border border-slate-800 rounded-3xl hover:border-blue-500 hover:bg-blue-500/10 transition-all group"><div className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-900/40 group-hover:scale-110"><Square size={24}/></div><span className="text-[11px] font-black uppercase tracking-widest text-slate-400 group-hover:text-red-400">區域方框</span></button>
                                        </div>
                                        <button onClick={() => setPendingPlacement(null)} className="py-3 text-[11px] font-black text-slate-600 hover:text-slate-400 uppercase tracking-widest border-t border-slate-800 mt-2 transition-colors">取消置放</button>
                                    </div>
                                </div>
                            )}
                            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-[#1e293b]/90 backdrop-blur-md border border-slate-700 p-2 rounded-2xl flex items-center gap-3 shadow-2xl z-[100]">
                                <button onClick={() => setImgScale(p => Math.max(0.5, p - 0.2))} className="p-2.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl"><ZoomOut size={20}/></button>
                                <div className="w-12 text-center text-xs font-mono font-black text-blue-400">{(imgScale * 100).toFixed(0)}%</div>
                                <button onClick={() => setImgScale(p => Math.min(5, p + 0.2))} className="p-2.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl"><ZoomIn size={20}/></button>
                                <div className="w-px h-6 bg-slate-700 mx-1"></div>
                                <button onClick={resetImgView} className="px-4 py-2 hover:bg-slate-700 rounded-xl text-slate-300 font-black text-[10px] uppercase tracking-widest flex items-center gap-2"><Maximize size={16}/> Reset</button>
                            </div>
                        </div>
                        )}
                    </>
                )}
            </div>
          </div>
        ) : <div className="flex-1 flex flex-col items-center justify-center opacity-20"><Layout size={100} /><span className="text-sm font-black uppercase mt-6 tracking-[0.2em]">Select an Area to Configure</span></div>}
      </div>

      {deviceToDelete && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
           <div className="bg-[#1e293b] border border-slate-700 rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl ring-1 ring-white/5 animate-in zoom-in">
              <div className="flex items-center gap-4 mb-6 text-red-500"><AlertTriangle size={32} /><h3 className="text-2xl font-black italic uppercase tracking-tighter">移除設備？</h3></div>
              <p className="text-sm text-slate-400 mb-10 leading-relaxed font-medium">您確定要將「{deviceToDelete.label}」從當前位置移除嗎？</p>
              <div className="flex gap-4">
                 <button onClick={() => setDeviceToDelete(null)} className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black uppercase text-xs transition-all">取消</button>
                 <button onClick={() => { setFloorPlans(p => { const next = [...p]; const i = next.findIndex(x => x.siteId === selectedSiteId); if (i > -1) next[i] = { ...next[i], sensors: next[i].sensors.filter(s => s.id !== deviceToDelete.id) }; return next; }); setDeviceToDelete(null); }} className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all">確認移除</button>
              </div>
           </div>
        </div>
      )}

      {isResetting && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
           <div className="bg-[#1e293b] border border-slate-700 rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl ring-1 ring-white/5 animate-in zoom-in">
              <div className="flex items-center gap-4 mb-6 text-red-500"><RefreshCw size={32} /><h3 className="text-2xl font-black italic uppercase tracking-tighter">重新配置圖資？</h3></div>
              <p className="text-sm text-slate-400 mb-10 leading-relaxed font-medium">這將清空此區域所有的圖資來源與標註，讓您可以重新選擇「GIS 地圖」或「BMP 影像」進行配置。</p>
              <div className="flex gap-4">
                 <button onClick={() => setIsResetting(false)} className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black uppercase text-xs transition-all">取消</button>
                 <button onClick={() => { setFloorPlans(p => p.filter(x => x.siteId !== selectedSiteId)); setSourceType(null); setIsResetting(false); setIsEditing(true); }} className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all">確認重新配置</button>
              </div>
           </div>
        </div>
      )}

      {isMapSettingsOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in">
           <div className="bg-[#111827] border border-slate-700 rounded-[2.5rem] shadow-2xl max-w-3xl w-full flex flex-col overflow-hidden ring-1 ring-white/5 animate-in zoom-in-95">
              <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-[#1e293b]/40">
                 <div className="flex items-center gap-5"><div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl"><Globe size={28}/></div><div><h2 className="text-2xl font-black text-white tracking-tighter italic uppercase">地圖服務配置</h2><p className="text-[10px] text-slate-500 font-black mt-1 uppercase tracking-widest">MAP SERVICE PROVIDER & VISUALIZATION SETTINGS</p></div></div>
                 <button onClick={() => setIsMapSettingsOpen(false)} className="p-2 text-slate-500 hover:text-red-500 transition-colors"><X size={32}/></button>
              </div>
              <div className="p-10 space-y-12 overflow-y-auto custom-scrollbar max-h-[70vh]">
                 {!activeFloorPlan && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 text-blue-500 font-black text-[11px] uppercase tracking-[0.2em]"><MapIcon size={16}/> 地圖服務提供者</div>
                        <div className="grid grid-cols-3 gap-5">
                        {[{id:'opensource', label:'OPENSOURCE MAP', icon:<Database size={24}/>}, {id:'osm', label:'OPENSTREET MAP', icon:<Globe size={24}/>}, {id:'google', label:'GOOGLE MAPS', icon:<MapIcon size={24}/>}].map(p => (
                            <button key={p.id} onClick={() => setMapProvider(p.id as MapProvider)} className={`flex flex-col items-center justify-center p-8 rounded-[2rem] border-2 transition-all gap-4 relative ${mapProvider === p.id ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-xl' : 'bg-black/20 border-slate-800 text-slate-500 hover:border-slate-700'}`}>{p.icon}<span className="text-[10px] font-black uppercase tracking-widest">{p.label}</span>{mapProvider === p.id && <div className="absolute top-4 right-4 bg-blue-500 rounded-full p-0.5 text-white shadow-lg"><Check size={10} strokeWidth={4} /></div>}</button>
                        ))}
                        </div>
                    </div>
                 )}
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
        .map-label-tooltip { background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(59, 130, 246, 0.4); border-radius: 6px; color: white; font-size: 10px; font-weight: 900; padding: 2px 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); white-space: nowrap; }
        .map-label-tooltip-region { background: rgba(37, 99, 235, 0.9); border: 1px solid white; border-radius: 4px; color: white; font-size: 10px; font-weight: 900; padding: 2px 6px; box-shadow: 0 2px 10px rgba(0,0,0,0.3); pointer-events: none; }
      `}</style>
    </div>
  );
};

const History = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M12 7v5l4 2"></path></svg>
);

export default FloorPlanCenterTab;