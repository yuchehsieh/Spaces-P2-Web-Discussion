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
  // Added missing Minus icon
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
  Key,
  Database,
  Loader2 
} from 'lucide-react';
import { SiteNode, FloorPlanData, MapRegion, SensorPosition } from '../types';
import { SITE_TREE_DATA, INITIAL_FLOOR_PLANS } from '../constants';

// Declare Leaflet global variable
declare const L: any;

// --- Helper Components for Tree ---

interface TreeItemProps {
  node: SiteNode;
  level: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchTerm: string;
  idsWithFloorPlan: Set<string>; 
}

const TreeItem: React.FC<TreeItemProps> = ({ node, level, selectedId, onSelect, searchTerm, idsWithFloorPlan }) => {
  const [isOpen, setIsOpen] = useState(node.isOpen ?? true);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;
  const hasFloorPlan = idsWithFloorPlan.has(node.id);

  // 外部強迫開啟邏輯：若子節點被選中，則父節點必須開啟
  useEffect(() => {
    if (selectedId && node.children) {
        const containsSelected = (nodes: SiteNode[]): boolean => nodes.some(n => n.id === selectedId || (n.children && containsSelected(n.children)));
        if (containsSelected(node.children)) {
            setIsOpen(true);
        }
    }
  }, [selectedId]);

  const shouldShow = useMemo(() => {
    if (!searchTerm) return true;
    const matchSelf = node.label.toLowerCase().includes(searchTerm.toLowerCase());
    const matchChild = (nodes: SiteNode[]): boolean => {
      return nodes.some(n => n.label.toLowerCase().includes(searchTerm.toLowerCase()) || (n.children && matchChild(n.children)));
    };
    return matchSelf || (node.children ? matchChild(node.children) : false);
  }, [node, searchTerm]);

  if (!shouldShow) return null;

  const getIcon = () => {
    switch (node.type) {
      case 'group': return <Layout size={16} className="text-blue-500" />;
      case 'site': return <Building2 size={16} className="text-blue-400" />;
      case 'host': return <Server size={14} className="text-slate-400" />;
      case 'zone': return <FolderOpen size={14} className="text-slate-500" />;
      default: return null;
    }
  };

  return (
    <div className="select-none">
      <div 
        onClick={() => onSelect(node.id)}
        className={`flex items-center py-2 pr-2 cursor-pointer transition-all rounded-xl group mb-0.5 ${isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-800 text-slate-400'}`}
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
          <div className="ml-auto flex items-center" title="此區域已配置圖資">
            <div className={`p-1 rounded-md ${isSelected ? 'bg-white/20 text-white' : 'bg-blue-500/10 text-blue-400 animate-pulse'}`}>
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
              onSelect={id => onSelect(id)} 
              searchTerm={searchTerm} 
              idsWithFloorPlan={idsWithFloorPlan}
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

interface FloorPlanCenterTabProps {
  initialSiteId?: string | null;
}

const FloorPlanCenterTab: React.FC<FloorPlanCenterTabProps> = ({ initialSiteId }) => {
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(initialSiteId || 'zone-hq-office');
  const [floorPlans, setFloorPlans] = useState<FloorPlanData[]>(INITIAL_FLOOR_PLANS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [sourceType, setSourceType] = useState<'image' | 'map' | null>(null);
  const [sensorToRemove, setSensorToRemove] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  
  const [isMapLoading, setIsMapLoading] = useState(false);

  const [isMapSettingsOpen, setIsMapSettingsOpen] = useState(false);
  const [mapProvider, setMapProvider] = useState<MapProvider>('opensource');
  const [mapLayerStyle, setMapLayerStyle] = useState<MapLayerStyle>('dark');
  const [googleApiKey, setGoogleApiKey] = useState('');

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const viewMapContainerRef = useRef<HTMLDivElement>(null);
  const viewMapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentTileLayerRef = useRef<any>(null);
  const mapDeviceMarkersRef = useRef<Record<string, any>>({});
  
  const activeRegionsRef = useRef<any[]>([]);

  // 監聽來自外部的跳轉指令
  useEffect(() => {
    if (initialSiteId) {
        setSelectedSiteId(initialSiteId);
        setIsEditing(false);
    }
  }, [initialSiteId]);

  const idsWithFloorPlan = useMemo(() => new Set(floorPlans.map(p => p.siteId)), [floorPlans]);

  const filteredTreeData = useMemo(() => {
    const filter = (nodes: SiteNode[]): SiteNode[] => {
      return nodes.filter(n => n.type !== 'device').map(n => ({
        ...n,
        children: n.children ? filter(n.children) : []
      }));
    };
    return filter(SITE_TREE_DATA);
  }, []);

  const activeFloorPlan = useMemo(() => floorPlans.find(p => p.siteId === selectedSiteId), [floorPlans, selectedSiteId]);

  useEffect(() => {
    if (activeFloorPlan) setSourceType(activeFloorPlan.type);
    else if (!isEditing) setSourceType(null);
  }, [activeFloorPlan, isEditing]);

  const activeNodeLabel = useMemo(() => {
    let label = '未選取區域';
    const find = (nodes: SiteNode[]) => {
      for (const n of nodes) {
        if (n.id === selectedSiteId) { label = n.label; return; }
        if (n.children) find(n.children);
      }
    };
    find(filteredTreeData);
    return label;
  }, [selectedSiteId, filteredTreeData]);

  const allDevicesInContext = useMemo(() => {
    if (!selectedSiteId) return [];
    const devices: SiteNode[] = [];
    const findNode = (nodes: SiteNode[]): SiteNode | null => {
      for (const n of nodes) {
        if (n.id === selectedSiteId) return n;
        if (n.children) {
          const res = findNode(n.children);
          if (res) return res;
        }
      }
      return null;
    };
    const targetNode = findNode(SITE_TREE_DATA);
    const traverse = (node: SiteNode) => {
      if (node.type === 'device') devices.push(node);
      node.children?.forEach(traverse);
    };
    if (targetNode) traverse(targetNode);
    return devices;
  }, [selectedSiteId]);

  const unplacedDevices = useMemo(() => {
    if (!activeFloorPlan) return allDevicesInContext;
    return allDevicesInContext.filter(d => !activeFloorPlan.sensors.find(p => p.id === d.id));
  }, [allDevicesInContext, activeFloorPlan]);

  const getDeviceIconString = (type: string | undefined) => {
    switch (type) {
      case 'camera': return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"></path><rect width="14" height="12" x="2" y="6" rx="2" ry="2"></rect></svg>';
      case 'sensor': return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"></rect><rect width="6" height="6" x="9" y="9" rx="1"></rect><path d="M15 2v2"></path><path d="M15 20v2"></path><path d="M2 15h2"></path><path d="M2 9h2"></path><path d="M20 15h2"></path><path d="M20 9h2"></path><path d="M9 2v2"></path><path d="M9 20v2"></path></svg>';
      case 'door': return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 4h3a2 2 0 0 1 2 2v14"></path><path d="M2 20h20"></path><path d="M13 20V4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v16"></path></svg>';
      default: return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"></rect><rect width="6" height="6" x="9" y="9" rx="1"></rect><path d="M15 2v2"></path><path d="M15 20v2"></path><path d="M2 15h2"></path><path d="M2 9h2"></path><path d="M20 15h2"></path><path d="M20 9h2"></path><path d="M9 2v2"></path><path d="M9 20v2"></path></svg>';
    }
  };

  const getTileUrl = (provider: MapProvider, style: MapLayerStyle) => {
    if (provider === 'osm') return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    if (provider === 'opensource') {
      return style === 'dark' 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    }
    return style === 'dark' 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
  };

  const createMapDeviceMarker = (map: any, pos: SensorPosition, editable: boolean) => {
    const device = allDevicesInContext.find(d => d.id === pos.id);
    const markerIcon = L.divIcon({
      className: 'map-device-marker',
      html: `
        <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: rgba(59, 130, 246, 0.8); border: 2px solid rgba(255, 255, 255, 0.2); box-shadow: 0 4px 12px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white;">
            ${getDeviceIconString(device?.deviceType)}
          </div>
          ${editable ? `
          <button onclick="window.removeDeviceFromMap('${pos.id}')" style="position: absolute; top: -5px; right: -5px; width: 18px; height: 18px; background: #ef4444; border: 2px solid white; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 500; font-size: 10px;">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          ` : ''}
          <div class="marker-label" style="position: absolute; top: 45px; left: 50%; transform: translateX(-50%); white-space: nowrap; background: rgba(0,0,0,0.8); color: white; font-size: 9px; font-weight: 900; padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1); opacity: 0; pointer-events: none; transition: opacity 0.2s;">
            ${device?.label}
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    const marker = L.marker([pos.y, pos.x], { icon: markerIcon, draggable: editable }).addTo(map);
    
    if (editable) {
        marker.on('dragend', (e: any) => {
            const newLatLng = e.target.getLatLng();
            setFloorPlans(prev => {
                const next = [...prev];
                const idx = next.findIndex(p => p.siteId === selectedSiteId);
                if (idx > -1) {
                    const newSensors = [...next[idx].sensors];
                    const sIdx = newSensors.findIndex(s => s.id === pos.id);
                    if (sIdx > -1) newSensors[sIdx] = { ...newSensors[sIdx], x: newLatLng.lng, y: newLatLng.lat };
                    next[idx] = { ...next[idx], sensors: newSensors };
                }
                return next;
            });
        });
    }

    return marker;
  };

  const createMapRegion = (regionConfig?: MapRegion) => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const regionId = regionConfig?.id || `region-${Date.now()}`;
    
    let coords;
    if (regionConfig) {
      coords = regionConfig.coords.map(c => L.latLng(c[0], c[1]));
    } else {
      const bounds = map.getBounds().pad(-0.4);
      coords = [
        bounds.getNorthWest(),
        bounds.getNorthEast(),
        bounds.getSouthEast(),
        bounds.getSouthWest()
      ];
    }

    const handleStyle = `width: 14px; height: 14px; background: white; border: 3px solid #3b82f6; border-radius: 50%; box-shadow: 0 4px 8px rgba(0,0,0,0.5); cursor: pointer;`;
    const markers: any[] = [];
    const polygon = L.polygon(coords, {
      color: '#3b82f6',
      weight: 3,
      fillColor: '#3b82f6',
      fillOpacity: 0.2,
      dashArray: '8, 8'
    }).addTo(map);

    const updatePolygon = () => {
      const newCoords = markers.map(m => m.getLatLng());
      polygon.setLatLngs(newCoords);
      const latSum = newCoords.reduce((sum, c) => sum + c.lat, 0);
      const lngSum = newCoords.reduce((sum, c) => sum + c.lng, 0);
      centerMarker.setLatLng([latSum / 4, lngSum / 4]);
    };

    coords.forEach(latlng => {
      const marker = L.marker(latlng, {
        draggable: true,
        icon: L.divIcon({ className: 'custom-handle', html: `<div style="${handleStyle}"></div>`, iconSize: [14, 14], iconAnchor: [7, 7] })
      }).addTo(map);
      marker.on('drag', updatePolygon);
      markers.push(marker);
    });

    const centerMarker = L.marker([coords.reduce((s, c) => s + c.lat, 0) / 4, coords.reduce((s, c) => s + c.lng, 0) / 4], {
      draggable: true,
      icon: L.divIcon({
        className: 'center-handle',
        html: `
          <div style="position: relative; width: 32px; height: 32px;">
            <div style="width: 32px; height: 32px; background: #3b82f6; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; border: 2px solid white; box-shadow: 0 4px 15px rgba(0,0,0,0.4);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 9 2 12 5 15"></polyline><polyline points="9 5 12 2 15 5"></polyline><polyline points="15 19 12 22 9 19"></polyline><polyline points="19 9 22 12 19 15"></polyline><line x1="2" y1="12" x2="22" y2="12"></line><line x1="12" y1="2" x2="12" y2="22"></line></svg>
            </div>
            <button onclick="window.deleteMapRegion('${regionId}')" style="position: absolute; top: -10px; right: -10px; width: 22px; height: 22px; background: #ef4444; border: 2px solid white; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 500; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      })
    }).addTo(map);

    centerMarker.on('dragstart', (e: any) => {
        centerMarker._startPos = e.target.getLatLng();
        centerMarker._startCorners = markers.map(m => m.getLatLng());
    });

    centerMarker.on('drag', (e: any) => {
        const currentPos = e.target.getLatLng();
        const deltaLat = currentPos.lat - centerMarker._startPos.lat;
        const deltaLng = currentPos.lng - centerMarker._startPos.lng;
        markers.forEach((m, i) => {
            m.setLatLng([centerMarker._startCorners[i].lat + deltaLat, centerMarker._startCorners[i].lng + deltaLng]);
        });
        polygon.setLatLngs(markers.map(m => m.getLatLng()));
    });

    activeRegionsRef.current.push({ id: regionId, polygon, markers, centerMarker });
  };

  // Leaflet initialization (EDIT MODE)
  useEffect(() => {
    if (isEditing && sourceType === 'map' && mapContainerRef.current) {
      if (!mapRef.current) {
        const config = activeFloorPlan?.mapConfig || { center: [25.0629, 121.5796], zoom: 17 };
        const map = L.map(mapContainerRef.current, { zoomControl: false }).setView(config.center, config.zoom);
        
        currentTileLayerRef.current = L.tileLayer(getTileUrl(mapProvider, mapLayerStyle), { 
          attribution: mapProvider === 'osm' ? '&copy; OSM' : '&copy; CARTO' 
        }).addTo(map);

        (window as any).deleteMapRegion = (id: string) => {
            const idx = activeRegionsRef.current.findIndex(r => r.id === id);
            if (idx > -1) {
                const r = activeRegionsRef.current[idx];
                map.removeLayer(r.polygon);
                r.markers.forEach((m: any) => map.removeLayer(m));
                map.removeLayer(r.centerMarker);
                activeRegionsRef.current.splice(idx, 1);
            }
        };

        (window as any).removeDeviceFromMap = (deviceId: string) => {
            setSensorToRemove(deviceId);
        };

        mapRef.current = map;
        setTimeout(() => map.invalidateSize(), 300);

        if (activeFloorPlan?.mapConfig?.regions) {
          activeFloorPlan.mapConfig.regions.forEach(r => createMapRegion(r));
        }
      } else {
        if (currentTileLayerRef.current) {
           mapRef.current.removeLayer(currentTileLayerRef.current);
        }
        currentTileLayerRef.current = L.tileLayer(getTileUrl(mapProvider, mapLayerStyle)).addTo(mapRef.current);
      }

      // Sync markers
      Object.values(mapDeviceMarkersRef.current).forEach(m => mapRef.current.removeLayer(m));
      mapDeviceMarkersRef.current = {};
      if (activeFloorPlan?.sensors) {
        activeFloorPlan.sensors.forEach(pos => {
            mapDeviceMarkersRef.current[pos.id] = createMapDeviceMarker(mapRef.current, pos, true);
        });
      }

    } else if (mapRef.current) {
      activeRegionsRef.current.forEach(r => {
          mapRef.current.removeLayer(r.polygon);
          r.markers.forEach((m: any) => mapRef.current.removeLayer(m));
          mapRef.current.removeLayer(r.centerMarker);
      });
      activeRegionsRef.current = [];
      Object.values(mapDeviceMarkersRef.current).forEach(m => mapRef.current.removeLayer(m));
      mapDeviceMarkersRef.current = {};
      if (!isEditing || sourceType !== 'map') {
        mapRef.current.remove();
        mapRef.current = null;
      }
    }
  }, [isEditing, sourceType, mapProvider, mapLayerStyle, activeFloorPlan?.sensors.length]);

  // Leaflet initialization (VIEW MODE)
  useEffect(() => {
    if (viewMapRef.current) {
      viewMapRef.current.remove();
      viewMapRef.current = null;
    }

    if (!isEditing && activeFloorPlan?.type === 'map') {
      setIsMapLoading(true);

      const initTimer = setTimeout(() => {
        if (!viewMapContainerRef.current) return;
        
        try {
          const config = activeFloorPlan.mapConfig || { center: [25.0629, 121.5796], zoom: 17, regions: [] };
          const map = L.map(viewMapContainerRef.current, { 
            zoomControl: false, 
            attributionControl: false 
          }).setView(config.center, config.zoom);
          
          L.tileLayer(getTileUrl(mapProvider, mapLayerStyle)).addTo(map);
          
          config.regions?.forEach(region => {
            L.polygon(region.coords, { 
              color: '#3b82f6', 
              weight: 3, 
              fillColor: '#3b82f6', 
              fillOpacity: 0.15, 
              dashArray: '8, 8', 
              interactive: false 
            }).addTo(map);
          });

          activeFloorPlan.sensors?.forEach(pos => {
              createMapDeviceMarker(map, pos, false);
          });

          viewMapRef.current = map;
          map.invalidateSize();
          setIsMapLoading(false);
          setTimeout(() => map.invalidateSize(), 100);

        } catch (err) {
          console.error("Map initialization failed", err);
          setIsMapLoading(false);
        }
      }, 500); 

      return () => clearTimeout(initTimer);
    }

    return () => { 
      if (viewMapRef.current) { 
        viewMapRef.current.remove(); 
        viewMapRef.current = null; 
      } 
    };
  }, [isEditing, selectedSiteId, activeFloorPlan?.type, mapProvider, mapLayerStyle]);

  const handleLocateRegions = () => {
    if (!viewMapRef.current || !activeFloorPlan?.mapConfig?.regions?.length) return;
    
    const map = viewMapRef.current;
    const allCoords: [number, number][] = [];
    
    activeFloorPlan.mapConfig.regions.forEach(region => {
        region.coords.forEach(coord => allCoords.push(coord));
    });

    if (allCoords.length > 0) {
        const bounds = L.latLngBounds(allCoords);
        map.fitBounds(bounds, { 
            padding: [50, 50], 
            animate: true,
            duration: 1.5 
        });
    }
  };

  const handleSiteSelect = (id: string) => {
    setSelectedSiteId(id);
    setIsEditing(false);
    setScale(1);
    setOffset({ x: 0, y: 0 });
    const target = floorPlans.find(p => p.siteId === id);
    if (target?.type === 'map') {
      setIsMapLoading(true);
    }
  };

  const handleSaveAllConfig = () => {
    if (!selectedSiteId) return;
    if (sourceType === 'map' && mapRef.current) {
        const savedRegions: MapRegion[] = activeRegionsRef.current.map(r => {
            const rawLatLngs = r.polygon.getLatLngs();
            const latLngs = Array.isArray(rawLatLngs[0]) ? rawLatLngs[0] : rawLatLngs;
            return { 
              id: r.id, 
              coords: latLngs.map((ll: any) => [ll.lat, ll.lng] as [number, number]) 
            };
        });
        const center = mapRef.current.getCenter();
        setFloorPlans(prev => {
            const next = [...prev];
            const idx = next.findIndex(p => p.siteId === selectedSiteId);
            const mapConfig = { center: [center.lat, center.lng] as [number, number], zoom: mapRef.current.getZoom(), regions: savedRegions };
            if (idx > -1) next[idx] = { ...next[idx], type: 'map', mapConfig };
            else next.push({ siteId: selectedSiteId, type: 'map', mapConfig, sensors: [] });
            return next;
        });
    }
    setIsEditing(false);
  };

  const handleDragOver = (e: React.DragEvent) => { if (!isEditing) return; e.preventDefault(); };
  const handleDrop = (e: React.DragEvent) => {
    if (!isEditing || !selectedSiteId) return;
    e.preventDefault();
    const sensorId = e.dataTransfer.getData('sensorId');
    if (!sensorId) return;

    let x, y;
    if (sourceType === 'map' && mapRef.current) {
        const rect = mapContainerRef.current!.getBoundingClientRect();
        const point = L.point(e.clientX - rect.left, e.clientY - rect.top);
        const latlng = mapRef.current.containerPointToLatLng(point);
        x = latlng.lng;
        y = latlng.lat;
    } else if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        x = ((e.clientX - rect.left) / rect.width) * 100;
        y = ((e.clientX - rect.top) / rect.height) * 100;
        x = Math.max(0, Math.min(100, x));
        y = Math.max(0, Math.min(100, y));
    } else return;

    setFloorPlans(prev => {
      const next = [...prev];
      const idx = next.findIndex(p => p.siteId === selectedSiteId);
      if (idx === -1) next.push({ siteId: selectedSiteId, type: sourceType || 'image', sensors: [{ id: sensorId, x, y }] });
      else {
        const newSensors = [...next[idx].sensors];
        const existing = newSensors.findIndex(s => s.id === sensorId);
        if (existing > -1) newSensors[existing] = { ...newSensors[existing], x, y };
        else newSensors.push({ id: sensorId, x, y });
        next[idx] = { ...next[idx], sensors: newSensors, type: sourceType || 'image' };
      }
      return next;
    });
  };

  const getDeviceIcon = (type: string | undefined) => {
    switch (type) {
      case 'camera': return <Video size={14} />;
      case 'sensor': return <Cpu size={14} />;
      case 'door': return <DoorOpen size={14} />;
      case 'emergency': return <Bell size={14} />;
      default: return <Cpu size={14} />;
    }
  };

  return (
    <div className="flex h-full w-full bg-[#050914] text-slate-200 overflow-hidden relative font-sans">
      <style>{`
        .map-device-marker:hover .marker-label { opacity: 1 !important; }
        .map-device-marker { transition: transform 0.2s; }
        .map-device-marker:hover { transform: scale(1.1); z-index: 1000 !important; }
        @keyframes scan-line { 0% { top: 0%; } 100% { top: 100%; } }
      `}</style>
      
      {/* Sidebar */}
      <div className="w-80 border-r border-slate-800 bg-[#0b1121] flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800/50">
          <div className="relative">
            <input type="text" placeholder="搜尋區域或分區..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-[#111827] border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-200 outline-none focus:border-blue-500 shadow-inner" />
            <Search size={14} className="absolute left-3.5 top-3 text-slate-600" />
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className={`overflow-y-auto custom-scrollbar p-3 transition-all duration-500 ${isEditing ? 'flex-1' : 'h-full'}`}>
            {filteredTreeData.map(node => (
              <TreeItem 
                key={node.id} 
                node={node} 
                level={0} 
                selectedId={selectedSiteId} 
                onSelect={handleSiteSelect} 
                searchTerm={searchTerm} 
                idsWithFloorPlan={idsWithFloorPlan}
              />
            ))}
          </div>

          {isEditing && (
            <div className="h-1/3 border-t border-slate-800 bg-[#0a0f1e] overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom-2 duration-300">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      待配置設備 ({unplacedDevices.length})
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                      {unplacedDevices.map(device => (
                      <div key={device.id} draggable onDragStart={e => e.dataTransfer.setData('sensorId', device.id)} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl transition-all group shadow-lg cursor-grab active:cursor-grabbing hover:border-blue-500">
                          <div className="flex items-center gap-3">
                              <div className="p-2 bg-slate-800 rounded-lg text-slate-400 group-hover:text-blue-400">{getDeviceIcon(device.deviceType)}</div>
                              <div className="flex-1 min-w-0"><div className="text-xs font-bold text-slate-200 truncate">{device.label}</div><div className="text-[9px] text-slate-600 font-mono">ID: {device.id}</div></div>
                          </div>
                      </div>
                      ))}
                      {unplacedDevices.length === 0 && <div className="p-8 opacity-20 italic text-center text-[10px] font-bold">區域設備已全數就緒</div>}
                  </div>
                </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#050914]">
        {selectedSiteId ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header Toolset */}
            <div className="p-4 bg-[#111827] border-b border-slate-800 flex items-center justify-between z-50 shrink-0">
              <div className="flex items-center gap-5">
                <div className="flex flex-col"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">區域配置狀態</span><h3 className="text-lg font-black text-white italic tracking-tight">{activeNodeLabel}</h3></div>
                <div className="h-8 w-px bg-slate-800"></div>
                <div className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border flex items-center gap-2 transition-all ${isEditing ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-slate-800/50 border-slate-700 text-slate-400'}`}>
                  {isEditing ? <><Pencil size={12}/> 編輯模式</> : <><Eye size={12}/> 檢視模式</>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isEditing ? (
                  <>
                    {activeFloorPlan && (
                      <button onClick={() => setIsResetting(true)} className="px-5 py-2.5 bg-red-950/20 hover:bg-red-600/20 text-red-500 rounded-xl font-bold text-xs border border-red-900/30 transition-all uppercase tracking-widest flex items-center gap-2"><RefreshCw size={14}/> 初始化</button>
                    )}
                    <button onClick={() => setIsEditing(false)} className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs border border-slate-700 uppercase tracking-widest transition-all">取消</button>
                    <button onClick={handleSaveAllConfig} className="px-10 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/40 ring-1 ring-white/10 transition-all">儲存配置</button>
                  </>
                ) : (
                  <button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/40 flex items-center gap-3 transition-all group"><Pencil size={16} className="group-hover:rotate-12 transition-transform" /> 進入編輯模式</button>
                )}
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 bg-black relative overflow-hidden flex items-center justify-center select-none" onDragOver={handleDragOver} onDrop={handleDrop}>
                
                {/* 1. INITIAL SOURCE SELECTION */}
                {isEditing && !sourceType && (
                  <div className="flex flex-col items-center gap-10 animate-in zoom-in-95 duration-500">
                    <div className="text-center space-y-2">
                       <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">選取平面圖來源</h2>
                       <p className="text-sm text-slate-500 font-bold uppercase tracking-[0.2em]">請指定此分區使用的地理資訊圖層</p>
                    </div>
                    <div className="flex gap-8">
                       <button onClick={() => setSourceType('map')} className="w-64 h-64 flex flex-col items-center justify-center gap-6 bg-[#111827] border-2 border-slate-800 rounded-[3rem] hover:border-blue-500 hover:bg-blue-600/5 transition-all group">
                          <div className="p-6 bg-slate-800 rounded-3xl text-slate-400 group-hover:text-blue-400 transition-colors"><Database size={24} /></div>
                          <div className="text-center">
                             <span className="block text-lg font-black text-white uppercase tracking-widest">地圖選取</span>
                             <span className="text-[10px] text-slate-600 font-bold uppercase mt-1 block">使用 GIS 地理座標系統</span>
                          </div>
                       </button>
                       <button onClick={() => setSourceType('image')} className="w-64 h-64 flex flex-col items-center justify-center gap-6 bg-[#111827] border-2 border-slate-800 rounded-[3rem] hover:border-blue-500 hover:bg-blue-600/5 transition-all group">
                          <div className="p-6 bg-slate-800 rounded-3xl text-slate-400 group-hover:text-blue-400 transition-colors"><Upload size={48} /></div>
                          <div className="text-center">
                             <span className="block text-lg font-black text-white uppercase tracking-widest">影像上傳</span>
                             <span className="text-[10px] text-slate-600 font-bold uppercase mt-1 block">使用 自定義平面圖圖檔</span>
                          </div>
                       </button>
                    </div>
                  </div>
                )}

                {/* 2. IMAGE CONTENT (EDIT & VIEW) */}
                {sourceType === 'image' && activeFloorPlan?.imageUrl && (
                   <div className="w-full h-full flex items-center justify-center">
                      <div className="relative inline-block" style={{ transform: `scale(${scale}) translate(${offset.x}px, ${offset.y}px)`, transition: 'transform 0.3s' }}>
                        <img src={activeFloorPlan.imageUrl} className="max-w-[85vw] max-h-[80vh] block rounded-lg border border-slate-700 bg-slate-900/50 pointer-events-none shadow-2xl" />
                        <div ref={containerRef} className="absolute inset-0 z-20 pointer-events-none">
                           {activeFloorPlan.sensors.map(pos => {
                             const device = allDevicesInContext.find(d => d.id === pos.id);
                             return (
                               <div key={pos.id} draggable={isEditing} onDragStart={e => e.dataTransfer.setData('sensorId', pos.id)} className={`absolute -translate-x-1/2 -translate-y-1/2 z-40 group pointer-events-auto ${isEditing ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`} style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
                                  <div className={`w-10 h-10 rounded-full border-2 border-white/20 bg-blue-600/80 flex items-center justify-center shadow-lg transition-all ${isEditing ? 'hover:scale-125 hover:bg-blue-500' : ''}`}>
                                     {getDeviceIcon(device?.deviceType)}
                                     {isEditing && <button onClick={() => setSensorToRemove(pos.id)} className="absolute -top-2 -right-2 bg-red-600 rounded-full p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={10}/></button>}
                                     <div className="absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 px-2 py-1 rounded text-[9px] font-black text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/10 shadow-2xl uppercase tracking-widest">{device?.label}</div>
                                  </div>
                               </div>
                             );
                           })}
                        </div>
                      </div>
                   </div>
                )}

                {/* 3. MAP EDITING INTERFACE */}
                {isEditing && sourceType === 'map' && (
                  <div className="w-full h-full relative">
                    <div ref={mapContainerRef} className="w-full h-full z-10" />
                    <div className="absolute bottom-8 right-8 z-[500] flex flex-col gap-3">
                        <div className="flex flex-col bg-[#1e293b]/90 backdrop-blur-md border border-slate-700 rounded-xl overflow-hidden shadow-2xl">
                           <button onClick={() => createMapRegion()} title="新增藍色選取框" className="p-3.5 text-slate-300 hover:text-white hover:bg-blue-600 transition-all group">
                              <Square size={20} className="group-active:scale-90 transition-transform" />
                           </button>
                        </div>
                        <div className="flex flex-col bg-[#1e293b]/90 backdrop-blur-md border border-slate-700 rounded-xl overflow-hidden shadow-2xl">
                           <button 
                             onClick={() => setIsMapSettingsOpen(true)}
                             title="地圖進階設定" 
                             className={`p-3.5 transition-all group ${isMapSettingsOpen ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}
                           >
                              <Settings size={20} className="group-hover:rotate-45 transition-transform" />
                           </button>
                        </div>
                        <div className="flex flex-col bg-[#1e293b]/90 backdrop-blur-md border border-slate-700 rounded-xl overflow-hidden shadow-2xl">
                           <button onClick={() => mapRef.current?.zoomIn()} className="p-3.5 text-slate-300 hover:text-white border-b border-slate-700 transition-all"><Plus size={20} /></button>
                           {/* Fixed Minus icon usage */}
                           <button onClick={() => mapRef.current?.zoomOut()} className="p-3.5 text-slate-300 hover:text-white transition-all"><Minus size={20} /></button>
                        </div>
                    </div>
                  </div>
                )}

                {/* 4. MAP VIEW MODE (NON-EDITING) */}
                {!isEditing && sourceType === 'map' && activeFloorPlan?.mapConfig && (
                   <div className="w-full h-full relative border-4 border-blue-500 shadow-[inset_0_0_100px_rgba(59,130,246,0.3)]">
                      {isMapLoading && (
                        <div className="absolute inset-0 z-[100] bg-[#0b1121] flex flex-col items-center justify-center gap-6">
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
                              <span className="text-[9px] text-slate-600 font-bold uppercase mt-1 block">Rendering Distributed Map Layers...</span>
                           </div>
                        </div>
                      )}
                      
                      <div ref={viewMapContainerRef} className="w-full h-full bg-slate-900" />
                      <div className="absolute bottom-4 left-4 bg-black/70 px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3 z-50 shadow-2xl pointer-events-none">
                         <Globe size={14} className="text-blue-400 animate-pulse" />
                         <span className="text-[11px] font-mono font-black text-white tracking-widest uppercase">GIS Active Layer: {activeNodeLabel}</span>
                      </div>
                      <div className="absolute bottom-8 right-8 flex flex-col gap-3 z-[500]">
                         <div className="flex flex-col bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
                            <button onClick={() => viewMapRef.current?.zoomIn()} className="p-3.5 text-slate-300 hover:text-white hover:bg-blue-600 border-b border-slate-800 transition-all"><Plus size={20}/></button>
                            {/* Fixed Minus icon usage */}
                            <button onClick={() => viewMapRef.current?.zoomOut()} className="p-3.5 text-slate-300 hover:text-white hover:bg-blue-600 transition-all"><Minus size={20}/></button>
                         </div>
                         <button onClick={handleLocateRegions} title="快速定位藍色虛線框" className="p-3.5 bg-blue-600/90 backdrop-blur-md hover:bg-blue-500 text-white rounded-2xl shadow-xl shadow-blue-900/40 border border-blue-400 transition-all active:scale-95 group">
                            <Maximize size={20} className="group-hover:scale-110 transition-transform" />
                         </button>
                      </div>
                   </div>
                )}

                {/* Common Viewport Controls for non-map source */}
                {sourceType === 'image' && activeFloorPlan?.imageUrl && (
                   <div className="absolute bottom-8 right-8 flex flex-col gap-3 z-50">
                      <button onClick={() => setScale(prev => Math.min(prev + 0.2, 5))} className="p-3 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl backdrop-blur-md border border-slate-700 shadow-xl"><ZoomIn size={18}/></button>
                      <button onClick={() => setScale(prev => Math.max(prev - 0.2, 0.5))} className="p-3 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl backdrop-blur-md border border-slate-700 shadow-xl"><ZoomOut size={18}/></button>
                      <button onClick={() => { setScale(1); setOffset({x:0,y:0}); }} className="p-3 bg-blue-600/80 hover:bg-blue-500 text-white rounded-xl backdrop-blur-md border border-blue-500 shadow-xl"><Maximize size={18}/></button>
                   </div>
                )}

                {/* Empty states */}
                {!isEditing && !activeFloorPlan && (
                  <div className="flex flex-col items-center gap-10 animate-in fade-in duration-700">
                    <div className="w-32 h-32 rounded-[2.5rem] bg-slate-900 border-4 border-slate-800 flex items-center justify-center text-slate-700 animate-pulse"><Layout size={64} /></div>
                    <div className="text-center space-y-2"><p className="text-2xl font-black text-slate-300 italic tracking-tighter uppercase">未配置區域圖資</p></div>
                    <button onClick={() => setIsEditing(true)} className="px-12 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-[1.5rem] shadow-xl shadow-blue-900/40 flex items-center gap-3 font-black text-xs uppercase tracking-widest ring-1 ring-white/10 transition-all">進入編輯模式</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-20 animate-in fade-in duration-1000"><Layout size={100} /><span className="text-sm font-black uppercase tracking-[0.5em] mt-6">Select a region to manage</span></div>
        )}
      </div>

      {/* Map Service Settings Modal */}
      {isMapSettingsOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-[#111827] border border-slate-700 rounded-[2.5rem] shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-white/5">
              <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-[#1e293b]/40">
                 <div className="flex items-center gap-5">
                    <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-900/40"><Globe size={28} /></div>
                    <div>
                       <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">地圖服務配置</h2>
                       <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Map Service Provider & Visualization Settings</p>
                    </div>
                 </div>
                 <button onClick={() => setIsMapSettingsOpen(false)} className="p-2 hover:bg-red-500/20 rounded-xl text-slate-500 hover:text-red-500 transition-all"><X size={28} /></button>
              </div>
              <div className="p-8 space-y-10 overflow-y-auto max-h-[70vh] custom-scrollbar">
                 <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2"><MapIcon size={14} className="text-blue-500" /> 地圖服務提供者</label>
                    <div className="grid grid-cols-3 gap-4">
                       <button onClick={() => setMapProvider('opensource')} className={`flex flex-col items-center justify-center p-6 rounded-3xl border transition-all gap-3 ${mapProvider === 'opensource' ? 'bg-blue-600/10 border-blue-500 text-blue-400' : 'bg-black/20 border-slate-800 text-slate-500 hover:border-slate-700'}`}><Database size={24} /><span className="text-xs font-black uppercase tracking-widest text-center">OpenSource Map</span></button>
                       <button onClick={() => setMapProvider('osm')} className={`flex flex-col items-center justify-center p-6 rounded-3xl border transition-all gap-3 ${mapProvider === 'osm' ? 'bg-blue-600/10 border-blue-500 text-blue-400' : 'bg-black/20 border-slate-800 text-slate-500 hover:border-slate-700'}`}><Globe size={24} /><span className="text-xs font-black uppercase tracking-widest text-center">OpenStreet Map</span></button>
                       <button onClick={() => setMapProvider('google')} className={`flex flex-col items-center justify-center p-6 rounded-3xl border transition-all gap-3 ${mapProvider === 'google' ? 'bg-blue-600/10 border-blue-500 text-blue-400' : 'bg-black/20 border-slate-800 text-slate-500 hover:border-slate-700'}`}><MapIcon size={24} /><span className="text-xs font-black uppercase tracking-widest text-center">Google Maps</span></button>
                    </div>
                 </div>
                 {mapProvider === 'google' && (
                    <div className="space-y-6 animate-in slide-in-from-top-4 duration-300 bg-blue-600/5 p-6 rounded-3xl border border-blue-500/20">
                       <div className="flex flex-col gap-6 lg:flex-row">
                          <div className="flex-1 space-y-3">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Key size={14} className="text-blue-500" /> Google Maps API Key</label>
                             <input type="password" value={googleApiKey} onChange={e => setGoogleApiKey(e.target.value)} placeholder="輸入您的 Google API 金鑰..." className="w-full bg-[#050914] border border-slate-700 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500 transition-all shadow-inner" />
                          </div>
                          <div className="w-full lg:w-64 space-y-3">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Info size={14} className="text-blue-500" /> 金鑰取得方式</label>
                             <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700">
                                <ul className="text-[10px] text-slate-400 space-y-2 leading-relaxed font-bold">
                                   <li className="flex gap-2"><span className="text-blue-500">1.</span> 前往 GCP 控制台</li>
                                   <li className="flex gap-2"><span className="text-blue-500">2.</span> 啟用 Maps JavaScript API</li>
                                   <li className="flex gap-2"><span className="text-blue-500">3.</span> 在憑證頁面建立 API Key</li>
                                   <li className="flex gap-2 mt-2"><a href="https://console.cloud.google.com/google/maps-apis" target="_blank" className="text-blue-400 hover:underline flex items-center gap-1">開啟控制台 <ExternalLink size={10} /></a></li>
                                </ul>
                             </div>
                          </div>
                       </div>
                    </div>
                 )}
                 <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2"><Layers size={14} className="text-blue-500" /> 圖層視覺風格</label>
                    <div className="grid grid-cols-2 gap-4">
                       <button onClick={() => setMapLayerStyle('dark')} className={`flex items-center gap-4 p-5 rounded-2xl border transition-all ${mapLayerStyle === 'dark' ? 'bg-blue-600/10 border-blue-500 text-white shadow-lg' : 'bg-black/20 border-slate-800 text-slate-500 hover:border-slate-700'}`}><div className="w-10 h-10 bg-black border border-slate-800 rounded-xl shadow-inner"></div><div className="text-left"><span className="block text-sm font-black uppercase tracking-widest">地圖 (深色)</span><span className="text-[9px] opacity-60">Dark Visualization</span></div></button>
                       <button onClick={() => setMapLayerStyle('light')} className={`flex items-center gap-4 p-5 rounded-2xl border transition-all ${mapLayerStyle === 'light' ? 'bg-blue-600/10 border-blue-500 text-white shadow-lg' : 'bg-black/20 border-slate-800 text-slate-500 hover:border-slate-700'}`}><div className="w-10 h-10 bg-slate-200 border border-white rounded-xl shadow-inner"></div><div className="text-left"><span className="block text-sm font-black uppercase tracking-widest">地圖 (淺色)</span><span className="text-[9px] opacity-60">Standard Light Mode</span></div></button>
                    </div>
                 </div>
              </div>
              <div className="p-8 bg-[#0b1121] border-t border-slate-800 flex justify-end gap-5">
                 <button onClick={() => setIsMapSettingsOpen(false)} className="px-10 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl transition-all font-black text-sm border border-slate-700 uppercase tracking-widest">取消</button>
                 <button onClick={() => { setIsMapSettingsOpen(false); }} className="px-14 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-blue-900/40 ring-1 ring-white/10 active:scale-95 transition-all flex items-center gap-3"><CheckCircle2 size={20} /> 儲存配置</button>
              </div>
           </div>
        </div>
      )}

      {/* Initialization Confirmation */}
      {isResetting && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-[#1e293b] border border-slate-700 rounded-[2.5rem] shadow-2xl max-w-sm w-full p-10 animate-in zoom-in duration-200">
              <div className="flex flex-col items-center text-center gap-6">
                 <div className="w-20 h-20 bg-red-500/10 rounded-[2rem] flex items-center justify-center text-red-500 shadow-inner"><RefreshCw size={40} className="animate-spin" style={{ animationDuration: '4s' }} /></div>
                 <h3 className="text-2xl font-black text-white tracking-tight italic uppercase">初始化圖資？</h3>
                 <p className="text-sm text-slate-400 leading-relaxed">這將會「永久清空」當前區域的圖資與座標配置。</p>
              </div>
              <div className="flex gap-4 mt-10">
                 <button onClick={() => setIsResetting(false)} className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-bold text-sm border border-slate-700">取消</button>
                 <button onClick={() => { setFloorPlans(prev => prev.filter(p => p.siteId !== selectedSiteId)); setSourceType(null); setIsResetting(false); setIsEditing(false); }} className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-red-900/40 active:scale-95">確認初始化</button>
              </div>
           </div>
        </div>
      )}

      {/* Remove Sensor Modal */}
      {sensorToRemove && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-[#1e293b] border border-slate-700 rounded-[2rem] shadow-2xl max-sm w-full p-8 animate-in zoom-in duration-200">
              <div className="flex items-center gap-4 mb-6">
                 <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500"><AlertTriangle size={28} /></div>
                 <h3 className="text-xl font-black text-white tracking-tight italic">移除設備標註？</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed mb-8">您即將撤回此設備在平面圖上的座標資訊。</p>
              <div className="flex gap-4">
                 <button onClick={() => setSensorToRemove(null)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-sm border border-slate-700">返回</button>
                 <button onClick={() => {
                    setFloorPlans(prev => {
                      const idx = prev.findIndex(p => p.siteId === selectedSiteId);
                      if (idx === -1) return prev;
                      const next = [...prev];
                      next[idx] = { ...next[idx], sensors: next[idx].sensors.filter(s => s.id !== sensorToRemove) };
                      return next;
                    });
                    setSensorToRemove(null);
                 }} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black text-sm shadow-xl active:scale-95">確認移除</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default FloorPlanCenterTab;