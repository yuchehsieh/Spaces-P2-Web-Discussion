
import React, { useState, useMemo, useRef } from 'react';
import { 
  Upload, 
  Map as MapIcon, 
  ChevronRight, 
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
  AlertTriangle
} from 'lucide-react';
import { SiteNode, FloorPlanData, SensorPosition } from '../types';
import { SITE_TREE_DATA, INITIAL_FLOOR_PLANS } from '../constants';

const FloorPlanCenterTab: React.FC = () => {
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(SITE_TREE_DATA[0]?.children?.[0]?.id || null);
  const [floorPlans, setFloorPlans] = useState<FloorPlanData[]>(INITIAL_FLOOR_PLANS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Zoom & Pan States
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  // Flatten all sites
  const allSites = useMemo(() => {
    const sites: SiteNode[] = [];
    const traverse = (nodes: SiteNode[]) => {
      nodes.forEach(node => {
        if (node.type === 'site') sites.push(node);
        if (node.children) traverse(node.children);
      });
    };
    traverse(SITE_TREE_DATA);
    return sites;
  }, []);

  // Pre-calculate device counts for all sites for status indicators
  const siteDeviceStatusMap = useMemo(() => {
    const statusMap: Record<string, { total: number; unplaced: number; hasImage: boolean }> = {};
    
    allSites.forEach(site => {
      let devicesCount = 0;
      const traverse = (node: SiteNode) => {
        if (node.type === 'device') devicesCount++;
        node.children?.forEach(traverse);
      };
      traverse(site);

      const plan = floorPlans.find(p => p.siteId === site.id);
      const placedCount = plan?.sensors.length || 0;
      
      statusMap[site.id] = {
        total: devicesCount,
        unplaced: devicesCount - placedCount,
        hasImage: !!plan?.imageUrl
      };
    });
    
    return statusMap;
  }, [allSites, floorPlans]);

  const activeSite = useMemo(() => allSites.find(s => s.id === selectedSiteId), [allSites, selectedSiteId]);
  const activeFloorPlan = useMemo(() => floorPlans.find(p => p.siteId === selectedSiteId), [floorPlans, selectedSiteId]);

  const allDevicesForActiveSite = useMemo(() => {
    if (!activeSite) return [];
    const devices: SiteNode[] = [];
    const traverse = (node: SiteNode) => {
      if (node.type === 'device') devices.push(node);
      node.children?.forEach(traverse);
    };
    traverse(activeSite);
    return devices;
  }, [activeSite]);

  const unplacedDevices = useMemo(() => {
    if (!activeFloorPlan) return allDevicesForActiveSite;
    return allDevicesForActiveSite.filter(d => !activeFloorPlan.sensors.find(p => p.id === d.id));
  }, [allDevicesForActiveSite, activeFloorPlan]);

  const handleSiteSelect = (id: string) => {
    setSelectedSiteId(id);
    setIsEditing(false); // 切換據點時重設為檢視模式
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedSiteId) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setFloorPlans(prev => {
          const existing = prev.findIndex(p => p.siteId === selectedSiteId);
          if (existing > -1) {
            const next = [...prev];
            next[existing] = { ...next[existing], imageUrl };
            return next;
          }
          return [...prev, { siteId: selectedSiteId, imageUrl, sensors: [] }];
        });
        setScale(1);
        setOffset({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => { 
    if (!isEditing) return;
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'move'; 
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!isEditing || !selectedSiteId || !containerRef.current) return;
    e.preventDefault();
    const sensorId = e.dataTransfer.getData('sensorId');
    if (!sensorId) return;

    const rect = containerRef.current.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));

    setFloorPlans(prev => {
      const planIdx = prev.findIndex(p => p.siteId === selectedSiteId);
      if (planIdx === -1) {
        return [...prev, { siteId: selectedSiteId, imageUrl: '', sensors: [{ id: sensorId, x, y }] }];
      }
      const plan = prev[planIdx];
      const existingSensorIdx = plan.sensors.findIndex(s => s.id === sensorId);
      const newSensors = [...plan.sensors];
      if (existingSensorIdx > -1) {
        newSensors[existingSensorIdx] = { ...newSensors[existingSensorIdx], x, y };
      } else {
        newSensors.push({ id: sensorId, x, y });
      }
      const next = [...prev];
      next[planIdx] = { ...plan, sensors: newSensors };
      return next;
    });
  };

  const removeSensor = (sensorId: string) => {
    if (!isEditing || !selectedSiteId) return;
    setFloorPlans(prev => {
      const planIdx = prev.findIndex(p => p.siteId === selectedSiteId);
      if (planIdx === -1) return prev;
      const next = [...prev];
      next[planIdx] = { ...next[planIdx], sensors: next[planIdx].sensors.filter(s => s.id !== sensorId) };
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
    <div className="flex h-full w-full bg-[#050914] text-slate-200 overflow-hidden">
      {/* Left Sidebar: Site List */}
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
              type="text" placeholder="搜尋據點..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#111827] border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-all"
            />
            <Search size={14} className="absolute left-3.5 top-2.5 text-slate-600" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
          {allSites.filter(s => s.label.includes(searchTerm)).map(site => {
            const status = siteDeviceStatusMap[site.id];
            const isSelected = selectedSiteId === site.id;
            
            return (
              <button 
                key={site.id} onClick={() => handleSiteSelect(site.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border group relative ${isSelected ? 'bg-blue-600 border-blue-500 text-white shadow-xl' : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'}`}
              >
                <div className="relative">
                  <Building2 size={18} className={isSelected ? 'text-white' : 'text-slate-600'} />
                  {!status.hasImage && (
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center border-2 border-[#0b1121] shadow-lg animate-pulse">
                      <AlertTriangle size={8} className="text-white" />
                    </div>
                  )}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">{site.label}</div>
                  <div className={`text-[10px] flex items-center gap-1.5 ${isSelected ? 'text-blue-100' : 'text-slate-600'}`}>
                    <span>{status.total - status.unplaced} / {status.total} 設備</span>
                    {status.hasImage && status.unplaced > 0 && (
                      <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter ${isSelected ? 'bg-white/20 text-white' : 'bg-orange-500/20 text-orange-400'}`}>
                        {status.unplaced} 待配置
                      </span>
                    )}
                  </div>
                </div>
                {isSelected && <ChevronRight size={16} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area: Editor */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#050914]">
        {activeSite ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Toolbar */}
            <div className="p-4 bg-[#111827] border-b border-slate-800 flex items-center justify-between z-10">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-black text-white">{activeSite.label}</h3>
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border flex items-center gap-1.5 transition-all ${isEditing ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-green-500/10 border-green-500/30 text-green-400'}`}>
                  {isEditing ? <><Pencil size={10}/> 編輯模式</> : <><Eye size={10}/> 檢視模式</>}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {isEditing ? (
                  <>
                    <label className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl cursor-pointer transition-all font-bold text-xs border border-slate-700 flex items-center gap-2">
                      <Upload size={14} /> 更換平面圖
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                    <div className="h-4 w-px bg-slate-800"></div>
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl transition-all font-bold text-xs border border-slate-700 flex items-center gap-2"
                    >
                       <XCircle size={14} /> 取消編輯
                    </button>
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl transition-all font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/40 flex items-center gap-2"
                    >
                      <CheckCircle size={14} /> 儲存目前配置
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl transition-all font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/40 flex items-center gap-2 group"
                  >
                    <Pencil size={14} className="group-hover:rotate-12 transition-transform" /> 編輯設備位置
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Device Palette - Only shown in Editing mode */}
              <div className={`bg-[#0b1121] border-r border-slate-800 flex flex-col transition-all duration-500 ease-in-out overflow-hidden ${isEditing ? 'w-72' : 'w-0 opacity-0'}`}>
                <div className="p-4 border-b border-slate-800 bg-black/20 flex items-center justify-between whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Cpu size={16} className="text-blue-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">待配置設備</span>
                  </div>
                  {unplacedDevices.length > 0 && (
                    <span className="px-2 py-0.5 bg-orange-500 text-white text-[10px] font-black rounded-md shadow-lg shadow-orange-900/20">
                      {unplacedDevices.length}
                    </span>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {unplacedDevices.map(device => (
                    <div 
                      key={device.id} draggable
                      onDragStart={e => { e.dataTransfer.setData('sensorId', device.id); }}
                      className="p-4 bg-slate-900 border border-slate-800 rounded-2xl cursor-grab active:cursor-grabbing hover:border-blue-500 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-800 rounded-lg text-slate-400 group-hover:text-blue-400 transition-colors">
                          {getDeviceIcon(device.deviceType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-200 truncate">{device.label}</div>
                          <div className="text-[9px] text-slate-600 font-mono">ID: {device.id}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {unplacedDevices.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-8 text-center opacity-20 italic">
                      <CheckCircle size={32} className="mb-2" />
                      <span className="text-xs">所有設備皆已配置完成</span>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-blue-600/5 border-t border-slate-800">
                   <div className="flex items-start gap-3">
                      <Info size={14} className="text-blue-400 mt-0.5" />
                      <p className="text-[10px] text-slate-500 leading-relaxed font-medium">提示：將左側設備拖曳至右側平面圖中對應位置即可完成配置。</p>
                   </div>
                </div>
              </div>

              {/* Viewport */}
              <div 
                className={`flex-1 bg-black relative overflow-hidden flex items-center justify-center select-none ${isEditing ? 'cursor-crosshair' : 'cursor-grab'}`}
                onDragOver={handleDragOver} onDrop={handleDrop}
              >
                {activeFloorPlan?.imageUrl ? (
                  <div 
                    ref={containerRef}
                    className="relative shadow-2xl transition-transform duration-75 ease-out"
                    style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: 'center center' }}
                  >
                    <img src={activeFloorPlan.imageUrl} alt="Floor Plan" className="max-w-[80vw] max-h-[70vh] block rounded-lg pointer-events-none border border-slate-700 bg-slate-900/50" />
                    
                    {activeFloorPlan.sensors.map(pos => {
                      const device = allDevicesForActiveSite.find(d => d.id === pos.id);
                      return (
                        <div 
                          key={pos.id} draggable={isEditing}
                          onDragStart={e => { if (isEditing) e.dataTransfer.setData('sensorId', pos.id); }}
                          className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 transition-all group ${isEditing ? 'cursor-grab active:cursor-grabbing hover:scale-125' : 'cursor-default'}`}
                          style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                        >
                          <div className={`w-10 h-10 rounded-full border-2 border-white/20 bg-blue-600/80 flex items-center justify-center shadow-lg relative ${isEditing ? 'ring-2 ring-blue-500/20' : ''}`}>
                             {getDeviceIcon(device?.deviceType)}
                             {isEditing && (
                               <button 
                                  onClick={e => { e.stopPropagation(); removeSensor(pos.id); }}
                                  className="absolute -top-2 -right-2 bg-red-500 rounded-full p-0.5 text-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                               >
                                 <Trash2 size={10} />
                               </button>
                             )}
                             {/* Label hover */}
                             <div className="absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 px-2 py-1 rounded text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/10 shadow-2xl">
                                {device?.label}
                             </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 text-slate-500 italic p-12 border-2 border-dashed border-slate-800 rounded-[2.5rem]">
                    {isEditing ? (
                      <>
                        <Upload size={64} className="opacity-10" />
                        <p className="text-sm font-bold">請先上傳平面圖以開始配置</p>
                        <label className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl cursor-pointer transition-all font-black text-xs tracking-widest uppercase shadow-xl shadow-blue-900/30">
                          選擇平面圖檔案
                          <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </label>
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={64} className="text-red-500/20" />
                        <p className="text-sm font-bold text-slate-400">此站點尚未上傳平面圖</p>
                        <button onClick={() => setIsEditing(true)} className="mt-2 text-blue-500 font-black text-xs uppercase tracking-widest hover:underline flex items-center gap-2">
                          <Pencil size={12}/> 進入編輯模式以上傳
                        </button>
                      </>
                    )}
                  </div>
                )}

                {activeFloorPlan?.imageUrl && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#1e293b]/90 backdrop-blur-md border border-slate-700 p-2 rounded-2xl flex items-center gap-2 shadow-2xl z-40">
                    <button onClick={() => setScale(prev => Math.max(prev - 0.2, 0.5))} className="p-2 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors"><ZoomOut size={18}/></button>
                    <div className="w-12 text-center text-xs font-mono font-bold text-blue-400">{(scale * 100).toFixed(0)}%</div>
                    <button onClick={() => setScale(prev => Math.min(prev + 0.2, 5))} className="p-2 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors"><ZoomIn size={18}/></button>
                    <div className="w-px h-4 bg-slate-700 mx-1"></div>
                    <button onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }} className="p-2 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors flex items-center gap-1.5"><Maximize size={16}/><span className="text-[10px] font-bold">RESET</span></button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-600 italic">
            請從左側列表選擇據點以管理平面圖
          </div>
        )}
      </div>
    </div>
  );
};

export default FloorPlanCenterTab;
