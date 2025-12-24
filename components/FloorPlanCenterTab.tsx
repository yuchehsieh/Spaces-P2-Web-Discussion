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
  CheckCircle, 
  ZoomIn, 
  ZoomOut, 
  Maximize,
  Search,
  Plus,
  Info,
  Pencil,
  Eye,
  XCircle,
  AlertTriangle,
  Undo2,
  Server,
  FolderOpen,
  Layout,
  Globe,
  Check,
  MousePointer2,
  Navigation,
  Move,
  Settings,
  Square,
  Grab
} from 'lucide-react';
import { SiteNode, FloorPlanData, SensorPosition } from '../types';
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
}

const TreeItem: React.FC<TreeItemProps> = ({ node, level, selectedId, onSelect, searchTerm }) => {
  const [isOpen, setIsOpen] = useState(node.isOpen ?? true);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;

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
      </div>

      {hasChildren && isOpen && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
          {node.children!.map(child => (
            <TreeItem key={child.id} node={child} level={level + 1} selectedId={selectedId} onSelect={onSelect} searchTerm={searchTerm} />
          ))}
        </div>
      )}
    </div>
  );
};

// --- Main Component ---

const FloorPlanCenterTab: React.FC = () => {
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>('zone-hq-office');
  const [floorPlans, setFloorPlans] = useState<FloorPlanData[]>(INITIAL_FLOOR_PLANS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editMode, setEditMode] = useState<'source' | 'placement'>('source');
  const [sourceType, setSourceType] = useState<'image' | 'map'>('image');
  const [isSelectionToolActive, setIsSelectionToolActive] = useState(false);
  const [sensorToRemove, setSensorToRemove] = useState<string | null>(null);

  // Zoom & Pan States
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Map Refs
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const selectionLayerRef = useRef<any>(null);
  const cornerMarkersRef = useRef<any[]>([]); 
  const centerMarkerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredTreeData = useMemo(() => {
    const filter = (nodes: SiteNode[]): SiteNode[] => {
      return nodes
        .filter(n => n.type !== 'device')
        .map(n => ({
          ...n,
          children: n.children ? filter(n.children) : []
        }));
    };
    return filter(SITE_TREE_DATA);
  }, []);

  const activeFloorPlan = useMemo(() => floorPlans.find(p => p.siteId === selectedSiteId), [floorPlans, selectedSiteId]);

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

  const allDevicesForActiveContext = useMemo(() => {
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
    if (!activeFloorPlan) return allDevicesForActiveContext;
    return allDevicesForActiveContext.filter(d => !activeFloorPlan.sensors.find(p => p.id === d.id));
  }, [allDevicesForActiveContext, activeFloorPlan]);

  // Leaflet Logic for Polygon with 4 Handles and Center Move
  useEffect(() => {
    if (isEditing && sourceType === 'map' && editMode === 'source' && mapContainerRef.current) {
      if (!mapRef.current) {
        const map = L.map(mapContainerRef.current, { zoomControl: false }).setView([25.0629, 121.5796], 17);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; CARTO'
        }).addTo(map);
        mapRef.current = map;
      }

      const map = mapRef.current;
      
      // Helper function for cleanup
      const clearSelectionUI = () => {
        if (selectionLayerRef.current) map.removeLayer(selectionLayerRef.current);
        cornerMarkersRef.current.forEach(m => map.removeLayer(m));
        if (centerMarkerRef.current) map.removeLayer(centerMarkerRef.current);
        cornerMarkersRef.current = [];
        selectionLayerRef.current = null;
        centerMarkerRef.current = null;
      };

      if (!isSelectionToolActive) {
        clearSelectionUI();
        return;
      }

      // Initial coordinates for a quadrilateral
      let bounds = map.getBounds().pad(-0.4);
      let coords = [
        bounds.getNorthWest(),
        bounds.getNorthEast(),
        bounds.getSouthEast(),
        bounds.getSouthWest()
      ];

      const updatePolygon = () => {
        const newCoords = cornerMarkersRef.current.map(m => m.getLatLng());
        selectionLayerRef.current.setLatLngs(newCoords);
        
        // Update center marker position
        const latSum = newCoords.reduce((sum, c) => sum + c.lat, 0);
        const lngSum = newCoords.reduce((sum, c) => sum + c.lng, 0);
        centerMarkerRef.current.setLatLng([latSum / 4, lngSum / 4]);
      };

      const handleStyle = `
        width: 14px; height: 14px; 
        background: white; border: 3px solid #3b82f6; 
        border-radius: 50%; box-shadow: 0 4px 8px rgba(0,0,0,0.5);
      `;

      // Create Corner Handles
      coords.forEach((latlng, i) => {
        const marker = L.marker(latlng, {
          draggable: true,
          icon: L.divIcon({
            className: 'custom-handle',
            html: `<div style="${handleStyle}"></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7]
          })
        }).addTo(map);

        marker.on('drag', updatePolygon);
        cornerMarkersRef.current.push(marker);
      });

      // Create Center Handle for moving the whole box
      const centerLat = coords.reduce((sum, c) => sum + c.lat, 0) / 4;
      const centerLng = coords.reduce((sum, c) => sum + c.lng, 0) / 4;
      
      const centerMarker = L.marker([centerLat, centerLng], {
        draggable: true,
        icon: L.divIcon({
          className: 'center-handle',
          html: `
            <div style="width: 32px; height: 32px; background: #3b82f6; border-radius: 10px; display: flex; items-center; justify-content: center; color: white; border: 2px solid white; box-shadow: 0 4px 15px rgba(0,0,0,0.4);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 9 2 12 5 15"></polyline><polyline points="9 5 12 2 15 5"></polyline><polyline points="15 19 12 22 9 19"></polyline><polyline points="19 9 22 12 19 15"></polyline><line x1="2" y1="12" x2="22" y2="12"></line><line x1="12" y1="2" x2="12" y2="22"></line></svg>
            </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })
      }).addTo(map);

      centerMarker.on('dragstart', (e) => {
        centerMarker._startPos = e.target.getLatLng();
        centerMarker._startCorners = cornerMarkersRef.current.map(m => m.getLatLng());
      });

      centerMarker.on('drag', (e) => {
        const currentPos = e.target.getLatLng();
        const deltaLat = currentPos.lat - centerMarker._startPos.lat;
        const deltaLng = currentPos.lng - centerMarker._startPos.lng;
        
        cornerMarkersRef.current.forEach((m, i) => {
          m.setLatLng([
            centerMarker._startCorners[i].lat + deltaLat,
            centerMarker._startCorners[i].lng + deltaLng
          ]);
        });
        selectionLayerRef.current.setLatLngs(cornerMarkersRef.current.map(m => m.getLatLng()));
      });

      centerMarkerRef.current = centerMarker;

      const polygon = L.polygon(coords, {
        color: '#3b82f6',
        weight: 3,
        fillColor: '#3b82f6',
        fillOpacity: 0.2,
        dashArray: '8, 8'
      }).addTo(map);
      
      selectionLayerRef.current = polygon;
    } else {
      if (mapRef.current) {
        cornerMarkersRef.current.forEach(m => mapRef.current.removeLayer(m));
        if (selectionLayerRef.current) mapRef.current.removeLayer(selectionLayerRef.current);
        if (centerMarkerRef.current) mapRef.current.removeLayer(centerMarkerRef.current);
        cornerMarkersRef.current = [];
        selectionLayerRef.current = null;
        centerMarkerRef.current = null;
        
        if (!isEditing) {
          mapRef.current.remove();
          mapRef.current = null;
          setIsSelectionToolActive(false);
        }
      }
    }
  }, [isEditing, sourceType, editMode, isSelectionToolActive]);

  const handleSiteSelect = (id: string) => {
    setSelectedSiteId(id);
    setIsEditing(false);
    setScale(1);
    setOffset({ x: 0, y: 0 });
    const plan = floorPlans.find(p => p.siteId === id);
    if (plan) setSourceType(plan.type);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedSiteId) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setFloorPlans(prev => {
          const next = [...prev];
          const idx = next.findIndex(p => p.siteId === selectedSiteId);
          if (idx > -1) next[idx] = { ...next[idx], type: 'image', imageUrl, mapConfig: undefined };
          else next.push({ siteId: selectedSiteId, type: 'image', imageUrl, sensors: [] });
          return next;
        });
        setSourceType('image');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveMapArea = () => {
    if (!mapRef.current || !selectionLayerRef.current || !selectedSiteId) return;
    const center = mapRef.current.getCenter();
    const zoom = mapRef.current.getZoom();
    const bounds = selectionLayerRef.current.getBounds();
    
    setFloorPlans(prev => {
      const next = [...prev];
      const idx = next.findIndex(p => p.siteId === selectedSiteId);
      const mapConfig = {
        center: [center.lat, center.lng] as [number, number],
        zoom,
        bounds: [[bounds.getSouthWest().lat, bounds.getSouthWest().lng], [bounds.getNorthEast().lat, bounds.getNorthEast().lng]] as [[number, number], [number, number]]
      };
      if (idx > -1) next[idx] = { ...next[idx], type: 'map', mapConfig, imageUrl: undefined };
      else next.push({ siteId: selectedSiteId, type: 'map', mapConfig, sensors: [] });
      return next;
    });
    setSourceType('map');
  };

  const handleDragOver = (e: React.DragEvent) => { 
    if (!isEditing || editMode !== 'placement') return;
    e.preventDefault(); 
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!isEditing || editMode !== 'placement' || !selectedSiteId || !containerRef.current) return;
    e.preventDefault();
    const sensorId = e.dataTransfer.getData('sensorId');
    if (!sensorId) return;

    const rect = containerRef.current.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));

    setFloorPlans(prev => {
      const next = [...prev];
      const idx = next.findIndex(p => p.siteId === selectedSiteId);
      if (idx === -1) return prev;
      const newSensors = [...next[idx].sensors];
      const existing = newSensors.findIndex(s => s.id === sensorId);
      if (existing > -1) newSensors[existing] = { ...newSensors[existing], x, y };
      else newSensors.push({ id: sensorId, x, y });
      next[idx] = { ...next[idx], sensors: newSensors };
      return next;
    });
  };

  const confirmRemoveSensor = () => {
    if (!sensorToRemove || !selectedSiteId) return;
    setFloorPlans(prev => {
      const idx = prev.findIndex(p => p.siteId === selectedSiteId);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], sensors: next[idx].sensors.filter(s => s.id !== sensorToRemove) };
      return next;
    });
    setSensorToRemove(null);
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
      
      {/* Sidebar: Hierarchy Tree */}
      <div className="w-80 border-r border-slate-800 bg-[#0b1121] flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800/50">
          <h2 className="text-xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/40">
              <MapIcon size={18} />
            </div>
            Floor Plan Center
          </h2>
        </div>
        
        <div className="p-4 border-b border-slate-800/50">
          <div className="relative">
            <input 
              type="text" placeholder="搜尋區域或分區..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#111827] border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-all shadow-inner"
            />
            <Search size={14} className="absolute left-3.5 top-3 text-slate-600" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
          <div className="px-3 mb-4 flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">區域架構樹 (至分區層級)</span>
          </div>
          {filteredTreeData.map(node => (
            <TreeItem key={node.id} node={node} level={0} selectedId={selectedSiteId} onSelect={handleSiteSelect} searchTerm={searchTerm} />
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#050914]">
        {selectedSiteId ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header Toolbar */}
            <div className="p-4 bg-[#111827] border-b border-slate-800 flex items-center justify-between z-50 shrink-0">
              <div className="flex items-center gap-5">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">編輯目標區域</span>
                  <h3 className="text-lg font-black text-white italic tracking-tight">{activeNodeLabel}</h3>
                </div>
                <div className="h-8 w-px bg-slate-800"></div>
                <div className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border flex items-center gap-2 transition-all ${isEditing ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-slate-800/50 border-slate-700 text-slate-400'}`}>
                  {isEditing ? <><Pencil size={12}/> 編輯中</> : <><Eye size={12}/> 檢視中</>}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {isEditing ? (
                  <>
                    <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800 mr-2">
                       <button onClick={() => setEditMode('source')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2 ${editMode === 'source' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
                          <Globe size={12} /> 圖資配置
                       </button>
                       <button onClick={() => { if (sourceType === 'map') handleSaveMapArea(); setEditMode('placement'); }} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2 ${editMode === 'placement' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
                          <Move size={12} /> 設備標定
                       </button>
                    </div>
                    <button onClick={() => { setIsEditing(false); setEditMode('source'); setIsSelectionToolActive(false); }} className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs border border-slate-700 transition-all uppercase tracking-widest">取消</button>
                    <button onClick={() => { if (editMode==='source' && sourceType==='map') handleSaveMapArea(); setIsEditing(false); setEditMode('source'); setIsSelectionToolActive(false); }} className="px-10 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/40 transition-all ring-1 ring-white/10">儲存配置</button>
                  </>
                ) : (
                  <button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/40 flex items-center gap-3 transition-all group">
                    <Pencil size={16} className="group-hover:rotate-12 transition-transform" /> 進入編輯模式
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Left Panel for Editing Controls */}
              {isEditing && (
                <div className="w-80 bg-[#0b1121] border-r border-slate-800 flex flex-col shrink-0 animate-in slide-in-from-left-2">
                  {editMode === 'source' ? (
                    <div className="p-6 space-y-8">
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">選擇圖資來源</label>
                          <div className="grid grid-cols-2 gap-3">
                             <button onClick={() => setSourceType('map')} className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all gap-2 ${sourceType === 'map' ? 'bg-blue-600/10 border-blue-500 text-blue-400' : 'bg-black/20 border-slate-800 text-slate-600 hover:border-slate-700'}`}>
                                <Globe size={24} />
                                <span className="text-[10px] font-black">地圖選取</span>
                             </button>
                             <button onClick={() => setSourceType('image')} className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all gap-2 ${sourceType === 'image' ? 'bg-blue-600/10 border-blue-500 text-blue-400' : 'bg-black/20 border-slate-800 text-slate-600 hover:border-slate-700'}`}>
                                <Upload size={24} />
                                <span className="text-[10px] font-black">影像上傳</span>
                             </button>
                          </div>
                       </div>
                       
                       {sourceType === 'image' && (
                         <div className="space-y-4 animate-in fade-in duration-300">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">上傳影像檔案</label>
                            <div className="border-2 border-dashed border-slate-800 rounded-3xl p-8 flex flex-col items-center gap-4 bg-black/20">
                               <Upload size={32} className="text-slate-700" />
                               <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                  選取圖片
                                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                               </label>
                               <p className="text-[9px] text-slate-600 text-center">支援 JPG, PNG, WEBP (最大 5MB)</p>
                            </div>
                         </div>
                       )}

                       {sourceType === 'map' && (
                         <div className="space-y-4 animate-in fade-in duration-300">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">範圍選取說明</label>
                            <div className="p-5 bg-blue-600/5 border border-blue-500/20 rounded-2xl space-y-3">
                               <div className="flex items-start gap-3">
                                  <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">1</div>
                                  <p className="text-[10px] text-slate-400 leading-relaxed font-bold">點擊右下角<span className="text-blue-400">方框圖示</span>開啟選取框</p>
                               </div>
                               <div className="flex items-start gap-3">
                                  <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">2</div>
                                  <p className="text-[10px] text-slate-400 leading-relaxed font-bold">拖動中心手柄移動位置，拖動四角進行<span className="text-blue-400">不規則變形</span></p>
                               </div>
                               <div className="flex items-start gap-3">
                                  <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">3</div>
                                  <p className="text-[10px] text-slate-400 leading-relaxed font-bold">調整完畢後切換至「設備標定」</p>
                               </div>
                            </div>
                         </div>
                       )}
                    </div>
                  ) : (
                    <div className="flex flex-col h-full">
                       <div className="p-4 border-b border-slate-800 bg-black/20 flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">待配置設備 ({unplacedDevices.length})</span>
                       </div>
                       <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                          {unplacedDevices.map(device => (
                            <div key={device.id} draggable onDragStart={e => { e.dataTransfer.setData('sensorId', device.id); }} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl cursor-grab active:cursor-grabbing hover:border-blue-500 transition-all group shadow-lg">
                               <div className="flex items-center gap-3">
                                  <div className="p-2 bg-slate-800 rounded-lg text-slate-400 group-hover:text-blue-400">{getDeviceIcon(device.deviceType)}</div>
                                  <div className="flex-1 min-w-0">
                                     <div className="text-xs font-bold text-slate-200 truncate">{device.label}</div>
                                     <div className="text-[9px] text-slate-600 font-mono tracking-tighter">NODE_ID: {device.id}</div>
                                  </div>
                               </div>
                            </div>
                          ))}
                          {unplacedDevices.length === 0 && (
                            <div className="flex flex-col items-center justify-center p-10 opacity-20 italic">
                               <CheckCircle size={32} className="mb-2 text-green-500" />
                               <span className="text-[10px] font-bold">區域設備已全數就緒</span>
                            </div>
                          )}
                       </div>
                    </div>
                  )}
                </div>
              )}

              {/* Viewport */}
              <div className="flex-1 bg-black relative overflow-hidden flex items-center justify-center select-none" onDragOver={handleDragOver} onDrop={handleDrop}>
                {isEditing && sourceType === 'map' && editMode === 'source' ? (
                  <div className="w-full h-full relative">
                    <div ref={mapContainerRef} className="w-full h-full z-10" />
                    
                    {/* Map Editor Toolbars */}
                    <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                       <div className="bg-[#111827]/90 backdrop-blur-md border border-slate-800 p-3 rounded-2xl flex items-center gap-3 shadow-2xl">
                          <Navigation size={18} className="text-blue-500 animate-pulse" />
                          <span className="text-[11px] font-black text-white uppercase tracking-widest">OSM Region Selection</span>
                       </div>
                    </div>

                    {/* Floating Toolbar */}
                    <div className="absolute bottom-8 right-8 z-[500] flex flex-col gap-3">
                        {/* Area Selection Tool Toggle */}
                        <div className="flex flex-col bg-[#1e293b]/90 backdrop-blur-md border border-slate-700 rounded-xl overflow-hidden shadow-2xl">
                           <button 
                             onClick={() => setIsSelectionToolActive(!isSelectionToolActive)}
                             className={`p-3.5 transition-all ${isSelectionToolActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                           >
                              <Square size={20} />
                           </button>
                        </div>

                        {/* Settings Button */}
                        <div className="flex flex-col bg-[#1e293b]/90 backdrop-blur-md border border-slate-700 rounded-xl overflow-hidden shadow-2xl">
                           <button className="p-3.5 text-slate-400 hover:text-white transition-all">
                              <Settings size={20} />
                           </button>
                        </div>

                        {/* Zoom Group */}
                        <div className="flex flex-col bg-[#1e293b]/90 backdrop-blur-md border border-slate-700 rounded-xl overflow-hidden shadow-2xl">
                           <button onClick={() => mapRef.current?.zoomIn()} className="p-3.5 text-slate-300 hover:text-white border-b border-slate-700 transition-all">
                              <Plus size={20} strokeWidth={3} />
                           </button>
                           <button onClick={() => mapRef.current?.zoomOut()} className="p-3.5 text-slate-300 hover:text-white transition-all">
                              <Minus size={20} strokeWidth={3} />
                           </button>
                        </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
                    {activeFloorPlan ? (
                      <div 
                        ref={containerRef}
                        className="relative shadow-2xl transition-transform duration-300"
                        style={{ transform: `scale(${scale}) translate(${offset.x}px, ${offset.y}px)` }}
                      >
                         {activeFloorPlan.type === 'image' ? (
                           <img src={activeFloorPlan.imageUrl} className="max-w-[85vw] max-h-[80vh] block rounded-lg border border-slate-700 bg-slate-900/50 pointer-events-none shadow-2xl" />
                         ) : (
                           <div className="relative border-4 border-blue-500 shadow-[0_0_100px_rgba(59,130,246,0.2)] rounded-lg overflow-hidden">
                              <img src={`https://static-maps.yandex.ru/1.x/?ll=${activeFloorPlan.mapConfig?.center[1]},${activeFloorPlan.mapConfig?.center[0]}&z=${activeFloorPlan.mapConfig?.zoom}&l=map&size=600,450&theme=dark`} className="w-[600px] h-[450px] object-cover opacity-80" />
                              <div className="absolute inset-0 bg-blue-500/10 pointer-events-none"></div>
                              <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                                 <Globe size={14} className="text-blue-400" />
                                 <span className="text-[10px] font-mono font-black text-white tracking-widest uppercase">Sync: Active</span>
                              </div>
                           </div>
                         )}

                         {activeFloorPlan.sensors.map(pos => {
                           const device = allDevicesForActiveContext.find(d => d.id === pos.id);
                           return (
                             <div key={pos.id} draggable={isEditing && editMode==='placement'} onDragStart={e => e.dataTransfer.setData('sensorId', pos.id)} className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 group ${isEditing && editMode==='placement' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`} style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
                                <div className={`w-10 h-10 rounded-full border-2 border-white/20 bg-blue-600/80 flex items-center justify-center shadow-lg transition-all ${isEditing && editMode==='placement' ? 'hover:scale-125 hover:bg-blue-500 ring-2 ring-white/10' : ''}`}>
                                   {getDeviceIcon(device?.deviceType)}
                                   {isEditing && editMode==='placement' && (
                                     <button onClick={() => setSensorToRemove(pos.id)} className="absolute -top-2 -right-2 bg-red-600 rounded-full p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={10}/></button>
                                   )}
                                   <div className="absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 px-2 py-1 rounded text-[9px] font-black text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/10 shadow-2xl uppercase tracking-widest">{device?.label}</div>
                                </div>
                             </div>
                           );
                         })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-10 animate-in fade-in duration-700">
                        <div className="w-32 h-32 rounded-full bg-slate-900 border-4 border-slate-800 flex items-center justify-center text-slate-700 animate-pulse">
                           <Layout size={64} />
                        </div>
                        <div className="text-center space-y-2">
                           <p className="text-2xl font-black text-slate-300 italic tracking-tighter uppercase">未配置區域圖資</p>
                           <p className="text-sm text-slate-600 max-w-md font-medium">請選取 GIS 地圖範圍或上傳自訂平面圖影像以開始配置。</p>
                        </div>
                        <div className="flex gap-6 mt-4">
                           <button onClick={() => { setSourceType('map'); setIsEditing(true); setEditMode('source'); }} className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl transition-all border border-slate-700 shadow-xl flex items-center gap-3 font-black text-xs uppercase tracking-widest">
                              <Globe size={18} className="text-blue-500"/> 從地圖選取
                           </button>
                           <button onClick={() => { setSourceType('image'); setIsEditing(true); setEditMode('source'); }} className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all shadow-xl shadow-blue-900/40 flex items-center gap-3 font-black text-xs uppercase tracking-widest ring-1 ring-white/10">
                              <Upload size={18}/> 上傳影像配置
                           </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Viewport Controls (Image Mode) */}
                {activeFloorPlan && !isEditing && (
                  <div className="absolute bottom-8 right-8 flex flex-col gap-3">
                     <button onClick={() => setScale(prev => Math.min(prev + 0.2, 5))} className="p-3 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl backdrop-blur-md border border-slate-700"><ZoomIn size={18}/></button>
                     <button onClick={() => setScale(prev => Math.max(prev - 0.2, 0.5))} className="p-3 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl backdrop-blur-md border border-slate-700"><ZoomOut size={18}/></button>
                     <button onClick={() => { setScale(1); setOffset({x:0,y:0}); }} className="p-3 bg-blue-600/80 hover:bg-blue-500 text-white rounded-xl backdrop-blur-md border border-blue-500"><Maximize size={18}/></button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-20 animate-in fade-in duration-1000">
            <Layout size={100} />
            <span className="text-sm font-black uppercase tracking-[0.5em] mt-6">Select a region to manage</span>
          </div>
        )}
      </div>

      {/* Remove Confirmation Modal */}
      {sensorToRemove && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-[#1e293b] border border-slate-700 rounded-[2rem] shadow-2xl max-w-sm w-full p-8 animate-in zoom-in duration-200">
              <div className="flex items-center gap-4 mb-6">
                 <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500"><AlertTriangle size={28} /></div>
                 <h3 className="text-xl font-black text-white tracking-tight italic">移除設備標註？</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed mb-8">您即將撤回此設備在平面圖上的座標資訊，這不會影響設備的實際連線狀態。</p>
              <div className="flex gap-4">
                 <button onClick={() => setSensorToRemove(null)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-sm border border-slate-700">返回</button>
                 <button onClick={confirmRemoveSensor} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black text-sm shadow-xl active:scale-95">確認移除</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

// Custom Minus Icon
const Minus = ({ size, className, strokeWidth = 2 }: { size: number, className?: string, strokeWidth?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

export default FloorPlanCenterTab;
