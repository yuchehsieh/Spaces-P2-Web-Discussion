
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Upload, 
  Map as MapIcon, 
  Building2, 
  Video, 
  Cpu, 
  DoorOpen, 
  Bell, 
  Trash2, 
  Search,
  Plus,
  Minus,
  Pencil,
  Eye,
  Server,
  FolderOpen,
  Layout,
  Loader2,
  RefreshCw,
  X,
  Image as ImageIcon,
  ChevronDown,
  ChevronRight,
  MapPin,
  Maximize,
  Thermometer,
  UserSearch,
  Tablet,
  Activity,
  DoorClosed,
  Wifi
} from 'lucide-react';
import { SiteNode, FloorPlanData, SensorPosition } from '../types';
import { SITE_TREE_DATA, INITIAL_FLOOR_PLANS } from '../constants';

declare const L: any;

// --- Helpers ---
const getPositionalZoneColor = (zoneId: string, parentHost: SiteNode | null) => {
  if (!parentHost || !parentHost.children) return 'bg-blue-600 shadow-blue-600/50';
  const zoneIndex = parentHost.children.findIndex(c => c.id === zoneId);
  if (zoneIndex <= 0) return 'bg-blue-600 shadow-blue-600/50';
  return 'bg-pink-500 shadow-pink-500/50';
};

const isDescendant = (childId: string, parentNode: SiteNode | null): boolean => {
  if (!parentNode || !parentNode.children) return false;
  return parentNode.children.some(child => {
    if (child.id === childId) return true;
    return isDescendant(childId, child);
  });
};

// --- Tree Components ---
interface TreeItemProps {
  node: SiteNode;
  level: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchTerm: string;
  idsWithFloorPlan: Set<string>; 
  placedDeviceIds: Set<string>;
  isEditing: boolean;
  selectedNode: SiteNode | null;
}

const TreeItem: React.FC<TreeItemProps> = ({ 
  node, level, selectedId, onSelect, searchTerm, idsWithFloorPlan, placedDeviceIds, isEditing, selectedNode
}) => {
  const [isOpen, setIsOpen] = useState(node.isOpen ?? true);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;
  const isDevice = node.type === 'device';
  const isPlaced = isDevice && placedDeviceIds.has(node.id);

  const canDrag = isEditing && selectedNode?.type === 'host' && isDevice && !isPlaced && isDescendant(node.id, selectedNode);

  const shouldShow = useMemo(() => {
    if (!searchTerm) return true;
    const lowerTerm = searchTerm.toLowerCase();
    return node.label.toLowerCase().includes(lowerTerm) || 
           node.children?.some(c => c.label.toLowerCase().includes(lowerTerm));
  }, [node, searchTerm]);

  if (!shouldShow) return null;

  const getIcon = () => {
    if (isDevice) {
      // 特定設備標籤與顏色同步 (與安防中心 SiteTree.tsx 一致)
      if (node.label === '環境偵測器') return <Thermometer size={14} className={isPlaced ? 'text-slate-600' : 'text-cyan-400'} />;
      if (node.label === '空間偵測器') return <UserSearch size={14} className={isPlaced ? 'text-slate-600' : 'text-emerald-400'} />;
      if (node.label === '多功能按鈕') return <Tablet size={14} className={isPlaced ? 'text-slate-600' : 'text-amber-400'} />;
      if (node.label === 'PIR') return <Activity size={14} className={isPlaced ? 'text-slate-600' : 'text-blue-400'} />;
      if (node.label === '門磁') return <DoorClosed size={14} className={isPlaced ? 'text-slate-600' : 'text-orange-400'} />;

      const colorClass = isPlaced ? 'text-slate-600' : isSelected ? 'text-white' : 'text-slate-400';
      switch (node.deviceType) {
        case 'camera': return <Video size={14} className={colorClass} />;
        case 'sensor': return <Cpu size={14} className={colorClass} />;
        case 'door': return <DoorOpen size={14} className={colorClass} />;
        case 'emergency': return <Bell size={14} className={colorClass} />;
        default: return <Wifi size={14} className={colorClass} />;
      }
    }
    const colorClass = isSelected ? 'text-white' : '';
    switch (node.type) {
      case 'group': return <Layout size={16} className={colorClass || "text-blue-500"} />;
      case 'site': return <Building2 size={16} className={colorClass || "text-blue-400"} />;
      case 'host': return <Server size={14} className={colorClass || "text-slate-400"} />;
      case 'zone': return <FolderOpen size={14} className={colorClass || "text-slate-500"} />;
      default: return null;
    }
  };

  const showPlanIcon = idsWithFloorPlan.has(node.id) && node.type !== 'zone';

  return (
    <div className="select-none">
      <div 
        onClick={() => onSelect(node.id)}
        draggable={canDrag}
        onDragStart={(e) => { if (canDrag) e.dataTransfer.setData('sensorId', node.id); }}
        className={`flex items-center py-2 pr-2 transition-all rounded-xl group mb-0.5 
          ${isSelected ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-400'}
          ${isPlaced ? 'opacity-40 grayscale' : 'cursor-pointer'}
          ${canDrag ? 'cursor-grab active:cursor-grabbing ring-1 ring-blue-500/50 bg-blue-500/10' : ''}
        `}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
      >
        <span onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} className={`mr-1 p-0.5 rounded hover:bg-white/10 ${hasChildren ? 'cursor-pointer' : 'opacity-0 pointer-events-none'}`}>
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <span className="mr-2 shrink-0">{getIcon()}</span>
        <div className="flex flex-col min-w-0">
          <span className={`text-xs truncate ${isSelected ? 'font-black' : 'font-bold'}`}>{node.label}</span>
          {canDrag && <span className="text-[8px] font-black text-blue-300 uppercase tracking-tighter italic animate-pulse">可拖曳標註</span>}
        </div>
        {showPlanIcon && (
          <div className="ml-auto pr-1">
             <div className={`p-1 rounded-md ${isSelected ? 'bg-white/20 text-white' : 'bg-blue-500/10 text-blue-400'}`}><ImageIcon size={10} strokeWidth={3} /></div>
          </div>
        )}
      </div>
      {hasChildren && isOpen && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
          {node.children!.map(child => (
            <TreeItem key={child.id} node={child} level={level + 1} selectedId={selectedId} onSelect={onSelect} searchTerm={searchTerm} idsWithFloorPlan={idsWithFloorPlan} placedDeviceIds={placedDeviceIds} isEditing={isEditing} selectedNode={selectedNode} />
          ))}
        </div>
      )}
    </div>
  );
};

// --- Main ---

const FloorPlanCenterTab: React.FC<{ initialSiteId?: string | null }> = ({ initialSiteId }) => {
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(initialSiteId || 'taipei-group');
  const [floorPlans, setFloorPlans] = useState<FloorPlanData[]>(INITIAL_FLOOR_PLANS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [sourceType, setSourceType] = useState<'image' | 'map' | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(false);
  
  const [deviceToDelete, setDeviceToDelete] = useState<{id: string, label: string} | null>(null);
  const [imgScale, setImgScale] = useState(1);
  const [imgOffset, setImgOffset] = useState({ x: 0, y: 0 });

  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const viewMapContainerRef = useRef<HTMLDivElement>(null);
  const viewMapRef = useRef<any>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const findNodeById = (nodes: SiteNode[], id: string): SiteNode | null => {
    for (const n of nodes) { if (n.id === id) return n; if (n.children) { const res = findNodeById(n.children, id); if (res) return res; } }
    return null;
  };

  const getParentNode = (id: string): SiteNode | null => {
    let result: SiteNode | null = null;
    const search = (nodes: SiteNode[], targetId: string, p: SiteNode | null): boolean => {
      for (const n of nodes) {
        if (n.id === targetId) { result = p; return true; }
        if (n.children && search(n.children, targetId, n)) return true;
      }
      return false;
    };
    search(SITE_TREE_DATA, id, null);
    return result;
  };

  const selectedNode = useMemo(() => selectedSiteId ? findNodeById(SITE_TREE_DATA, selectedSiteId) : null, [selectedSiteId]);
  const activeFloorPlan = useMemo(() => floorPlans.find(p => p.siteId === selectedSiteId), [floorPlans, selectedSiteId]);
  const idsWithFloorPlan = useMemo(() => new Set(floorPlans.map(p => p.siteId)), [floorPlans]);

  const placedDeviceIds = useMemo(() => {
    const ids = new Set<string>();
    activeFloorPlan?.sensors.forEach(s => ids.add(s.id));
    return ids;
  }, [activeFloorPlan]);

  const isGroupLevel = selectedNode?.type === 'group';
  const isSiteLevel = selectedNode?.type === 'site';
  const isHostLevel = selectedNode?.type === 'host';
  const isZoneLevel = selectedNode?.type === 'zone';
  
  const canEdit = (isSiteLevel || isHostLevel) && !isZoneLevel;

  useEffect(() => {
    if (isGroupLevel || isSiteLevel) setSourceType('map');
    else if (activeFloorPlan) setSourceType(activeFloorPlan.type);
    else setSourceType(null);
    setIsEditing(false); 
  }, [selectedSiteId]);

  // --- GIS Mapping ---
  const renderMap = (container: HTMLDivElement, isEdit: boolean) => {
    if (!container || !selectedNode) return;
    setIsMapLoading(true);
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    if (viewMapRef.current) { viewMapRef.current.remove(); viewMapRef.current = null; }

    const config = activeFloorPlan?.mapConfig || { center: [25.0629, 121.5796], zoom: isGroupLevel ? 11 : 17 };
    const map = L.map(container, { zoomControl: false, attributionControl: false }).setView(config.center, config.zoom);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);

    // 渲染標註點
    if (config.pins && config.pins.length > 0) {
       config.pins.forEach((p: any) => {
          const icon = L.divIcon({ 
            className: 'site-view-pin', 
            html: `<div style="width:32px;height:32px;background:#ef4444;border:2px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 10px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;color:white;"><div style="transform:rotate(45deg);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><rect width="18" height="18" x="3" y="3" rx="2"/></svg></div></div>`,
            iconSize: [32, 32], iconAnchor: [16, 32]
          });
          const marker = L.marker([p.lat, p.lng], { icon }).addTo(map);
          marker.bindTooltip(p.label, { permanent: true, direction: 'bottom', className: 'map-label-tooltip', offset: [0, 5] });
          if (isGroupLevel) marker.on('click', () => setSelectedSiteId(p.id));
       });
    }

    if (isEdit) mapRef.current = map; else viewMapRef.current = map;
    map.invalidateSize();
    setIsMapLoading(false);
  };

  useEffect(() => {
    if (sourceType === 'map' && !isEditing && viewMapContainerRef.current) renderMap(viewMapContainerRef.current, false);
    if (sourceType === 'map' && isEditing && mapContainerRef.current) renderMap(mapContainerRef.current, true);
  }, [selectedSiteId, isEditing, sourceType]);

  // --- BMP Logic ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedSiteId) {
      const url = URL.createObjectURL(file);
      setFloorPlans(prev => {
        const next = [...prev];
        const idx = next.findIndex(p => p.siteId === selectedSiteId);
        const newPlan: FloorPlanData = { siteId: selectedSiteId, type: 'image', imageUrl: url, sensors: [], hostPosition: { x: 75, y: 50 } };
        if (idx > -1) next[idx] = newPlan; else next.push(newPlan);
        return next;
      });
      setSourceType('image');
    }
  };

  const handleHostDragStart = (e: React.DragEvent) => {
    if (!isEditing || !isHostLevel) return;
    e.stopPropagation();
    e.dataTransfer.setData('isHost', 'true');
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDeviceDragStart = (e: React.DragEvent, sensorId: string) => {
    if (!isEditing) return;
    e.stopPropagation();
    e.dataTransfer.setData('sensorId', sensorId);
    e.dataTransfer.setData('isMoving', 'true'); 
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!isEditing || !selectedSiteId || sourceType !== 'image' || !imgRef.current) return;
    e.preventDefault();
    const isHost = e.dataTransfer.getData('isHost') === 'true';
    const sensorId = e.dataTransfer.getData('sensorId');
    const isMoving = e.dataTransfer.getData('isMoving') === 'true';
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setFloorPlans(prev => {
      const next = [...prev];
      const idx = next.findIndex(p => p.siteId === selectedSiteId);
      if (idx > -1) {
        if (isHost) next[idx] = { ...next[idx], hostPosition: { x, y } };
        else if (sensorId) {
          const ns = [...next[idx].sensors];
          const si = ns.findIndex(s => s.id === sensorId);
          if (si > -1) ns[si] = { ...ns[si], x, y };
          else if (isDescendant(sensorId, selectedNode)) ns.push({ id: sensorId, x, y });
          next[idx] = { ...next[idx], sensors: ns };
        }
      }
      return next;
    });
  };

  return (
    <div className="flex h-full w-full bg-[#050914] text-slate-200 overflow-hidden relative">
      <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
      
      <div className="w-80 border-r border-slate-800 bg-[#0b1121] flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800/50">
          <div className="relative">
            <input type="text" placeholder="搜尋據點或設備..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-[#111827] border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-200 outline-none focus:border-blue-500 shadow-inner" />
            <Search size={14} className="absolute left-3.5 top-3 text-slate-600" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
          {SITE_TREE_DATA.map(node => (
            <TreeItem key={node.id} node={node} level={0} selectedId={selectedSiteId} onSelect={setSelectedSiteId} searchTerm={searchTerm} idsWithFloorPlan={idsWithFloorPlan} placedDeviceIds={placedDeviceIds} isEditing={isEditing} selectedNode={selectedNode} />
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-[#050914]">
        {selectedSiteId && (
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <div className="h-16 bg-[#111827] border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-50 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-600/10 text-blue-400 rounded-lg">
                  {isGroupLevel ? <Layout size={20}/> : isSiteLevel ? <Building2 size={20}/> : <Server size={20}/>}
                </div>
                <div>
                   <h3 className="text-lg font-black text-white italic tracking-tight">{selectedNode?.label}</h3>
                   <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{isEditing ? 'Editing Mode' : 'View Mode'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {canEdit && (
                  isEditing ? (
                    <>
                      <button onClick={() => setIsResetting(true)} className="px-5 py-2.5 bg-red-950/20 hover:bg-red-600/20 text-red-500 rounded-xl font-bold text-xs border border-red-900/30 flex items-center gap-2 transition-all"><RefreshCw size={14}/> 重新配置圖資</button>
                      <button onClick={() => setIsEditing(false)} className="px-10 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs uppercase shadow-xl">完成編輯</button>
                    </>
                  ) : <button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2.5 rounded-xl font-black text-xs uppercase shadow-xl flex items-center gap-3 active:scale-95 transition-all"><Pencil size={16} /> 編輯圖資</button>
                )}
              </div>
            </div>

            <div className="flex-1 bg-black relative overflow-hidden flex items-center justify-center" onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
                {isMapLoading && <div className="absolute inset-0 z-[600] bg-black/60 backdrop-blur-sm flex items-center justify-center gap-3"><Loader2 size={32} className="animate-spin text-blue-500"/><span className="text-xs font-bold uppercase tracking-widest text-blue-400">Loading Map Data...</span></div>}
                
                {isZoneLevel ? (
                   <div className="flex flex-col items-center gap-8 opacity-40">
                       <FolderOpen size={80} strokeWidth={1} />
                       <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase text-center">分區層級不再提供獨立圖資<br/><span className="text-sm">請於上層主機節點進行配置</span></h2>
                   </div>
                ) : (
                  <>
                    {!activeFloorPlan && !isEditing && (
                        <div className="flex flex-col items-center gap-8 opacity-40">
                            <Layout size={80} strokeWidth={1} />
                            <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">尚未配置區域平面圖</h2>
                        </div>
                    )}
                    {isEditing && !sourceType && (
                        <div className="flex flex-col items-center gap-10 animate-in zoom-in-95">
                            <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">選取平面圖來源</h2>
                            <div className="flex gap-8">
                                {(isSiteLevel || isGroupLevel) && (
                                  <button onClick={() => { setSourceType('map'); setFloorPlans(prev => [...prev.filter(p => p.siteId !== selectedSiteId), { siteId: selectedSiteId!, type: 'map', sensors: [] }]); }} className="w-64 h-64 flex flex-col items-center justify-center gap-6 bg-[#111827] border-2 border-slate-800 rounded-[3.5rem] hover:border-blue-500 hover:bg-blue-600/5 transition-all group shadow-2xl"><div className="p-6 bg-slate-800 rounded-3xl text-slate-400 group-hover:text-blue-400 shadow-inner"><MapIcon size={28} /></div><span className="text-lg font-black text-white uppercase tracking-widest">地圖選取 (GIS)</span></button>
                                )}
                                <button onClick={() => setSourceType('image')} className="w-64 h-64 flex flex-col items-center justify-center gap-6 bg-[#111827] border-2 border-slate-800 rounded-[3.5rem] hover:border-blue-500 hover:bg-blue-600/5 transition-all group shadow-2xl"><div className="p-6 bg-slate-800 rounded-3xl text-slate-400 group-hover:text-blue-400 shadow-inner"><Upload size={28} /></div><span className="text-lg font-black text-white uppercase tracking-widest">影像上傳 (BMP)</span></button>
                            </div>
                        </div>
                    )}
                    
                    {sourceType === 'map' && (
                        <div className="w-full h-full relative">
                           <div ref={isEditing ? mapContainerRef : viewMapContainerRef} className="w-full h-full" />
                           {/* GIS 縮放按鈕 */}
                           <div className="absolute bottom-10 right-10 flex flex-col gap-3 z-[600]">
                              <div className="flex flex-col bg-[#111827]/80 backdrop-blur-md border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
                                 <button onClick={() => { (isEditing ? mapRef.current : viewMapRef.current)?.zoomIn(); }} className="p-4 text-slate-300 hover:text-white hover:bg-blue-600 border-b border-slate-800 transition-all active:scale-90"><Plus size={20}/></button>
                                 <button onClick={() => { (isEditing ? mapRef.current : viewMapRef.current)?.zoomOut(); }} className="p-4 text-slate-300 hover:text-white hover:bg-blue-600 transition-all active:scale-90"><Minus size={20}/></button>
                              </div>
                           </div>
                        </div>
                    )}

                    {sourceType === 'image' && activeFloorPlan?.imageUrl && (
                      <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
                         <div className="relative" style={{ transform: `scale(${imgScale}) translate(${imgOffset.x}px, ${imgOffset.y}px)` }}>
                            <img ref={imgRef} src={activeFloorPlan.imageUrl} className="max-w-[85vw] max-h-[80vh] block rounded-lg border border-slate-700 shadow-2xl select-none" />
                            {isHostLevel && (
                              <div draggable={isEditing} onDragStart={handleHostDragStart} className={`absolute -translate-x-1/2 -translate-y-1/2 z-50 ${isEditing ? 'cursor-grab active:cursor-grabbing' : ''}`} style={{ left: `${activeFloorPlan.hostPosition?.x ?? 75}%`, top: `${activeFloorPlan.hostPosition?.y ?? 50}%` }}>
                                <div className="w-11 h-11 bg-blue-600 rounded-2xl border-2 border-white shadow-[0_0_20px_rgba(37,99,235,0.5)] flex items-center justify-center text-white ring-4 ring-blue-600/10"><Server size={20} /></div>
                                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/80 rounded text-[9px] font-black text-white whitespace-nowrap uppercase tracking-widest border border-white/10">{selectedNode?.label} {isEditing && '(可拖移)'}</div>
                              </div>
                            )}
                            <div className="absolute inset-0 pointer-events-none z-40">
                               {activeFloorPlan.sensors.map(s => {
                                  const deviceNode = findNodeById(SITE_TREE_DATA, s.id);
                                  const parentZone = getParentNode(s.id);
                                  const parentHost = parentZone ? getParentNode(parentZone.id) : null;
                                  const zoneColor = parentZone ? getPositionalZoneColor(parentZone.id, parentHost) : 'bg-slate-600';
                                  return (
                                    <div key={s.id} className={`absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto group ${isEditing ? 'cursor-grab active:cursor-grabbing' : ''}`} style={{ left: `${s.x}%`, top: `${s.y}%` }} draggable={isEditing} onDragStart={(e) => handleDeviceDragStart(e, s.id)}>
                                       <div className={`w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-white shadow-xl relative ${zoneColor} group-hover:scale-110 transition-transform`}>
                                          {deviceNode?.deviceType === 'camera' ? <Video size={18}/> : <Cpu size={18}/>}
                                          {isEditing && (<button onClick={(e) => { e.stopPropagation(); setDeviceToDelete({id: s.id, label: deviceNode?.label || ''}) }} className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 rounded-full text-white border border-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg"><Trash2 size={10}/></button>)}
                                       </div>
                                       <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-0.5 rounded text-[9px] font-black text-white whitespace-nowrap border border-white/5 shadow-xl">{deviceNode?.label} {isEditing && '(可移動)'}</div>
                                    </div>
                                  );
                               })}
                            </div>
                         </div>
                      </div>
                    )}
                  </>
                )}
            </div>
          </div>
        )}
      </div>

      {deviceToDelete && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
           <div className="bg-[#1e293b] border border-slate-700 rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl animate-in zoom-in">
              <h3 className="text-xl font-black text-white italic mb-4">移除設備標註？</h3>
              <p className="text-sm text-slate-400 mb-8 font-medium">確定要從平面圖中移除「{deviceToDelete.label}」嗎？</p>
              <div className="flex gap-4">
                 <button onClick={() => setDeviceToDelete(null)} className="flex-1 py-4 bg-slate-800 text-slate-300 rounded-2xl font-bold text-xs uppercase transition-all">取消</button>
                 <button onClick={() => { setFloorPlans(prev => { const next = [...prev]; const i = next.findIndex(p => p.siteId === selectedSiteId); if (i > -1) { next[i] = { ...next[i], sensors: next[i].sensors.filter(s => s.id !== deviceToDelete.id) }; } return next; }); setDeviceToDelete(null); }} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold text-xs uppercase shadow-xl transition-all">確認移除</button>
              </div>
           </div>
        </div>
      )}

      {isResetting && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
           <div className="bg-[#1e293b] border border-slate-700 rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl animate-in zoom-in">
              <h3 className="text-xl font-black text-white italic mb-4">重新配置圖資？</h3>
              <p className="text-sm text-slate-400 mb-8 font-medium">這將清空此區域所有的標註數據。建議在裝潢變動或需要重新選擇 GIS/BMP 時使用。</p>
              <div className="flex gap-4">
                 <button onClick={() => setIsResetting(false)} className="flex-1 py-4 bg-slate-800 text-slate-300 rounded-2xl font-bold text-xs uppercase transition-all">取消</button>
                 <button onClick={() => { setFloorPlans(prev => prev.filter(p => p.siteId !== selectedSiteId)); setSourceType(null); setIsResetting(false); }} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold text-xs uppercase shadow-xl transition-all">確認重置</button>
              </div>
           </div>
        </div>
      )}

      <style>{`
        .map-label-tooltip { background: #111827; border: 1px solid #ef4444; border-radius: 4px; color: white; font-size: 10px; font-weight: 900; padding: 2px 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); pointer-events: none; white-space: nowrap; }
      `}</style>
    </div>
  );
};

export default FloorPlanCenterTab;
