import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Video, 
  Cpu, 
  DoorOpen, 
  Bell, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Server, 
  Camera, 
  Thermometer, 
  UserSearch, 
  Tablet, 
  Activity, 
  DoorClosed,
  Wifi,
  Layers
} from 'lucide-react';
import { SiteNode, FloorPlanData, SecurityEvent, SensorPosition } from '../types';
import { SITE_TREE_DATA } from '../constants';

interface FloorPlanViewProps {
  site: SiteNode;
  onBack: () => void;
  initialData?: FloorPlanData;
  onSave: (data: FloorPlanData) => void;
  events: SecurityEvent[];
  selectedEventId: string | null;
  activeDeviceFilters: Set<string>; 
}

// 熱度人數顏色配置 - 已調深顏色與增加透明度 Alpha 值
const HEATMAP_COLORS = [
  { range: '0', label: '0人', color: 'rgba(51, 65, 85, 0.4)', hex: '#334155' },
  { range: '1-2', label: '1-2人', color: 'rgba(16, 185, 129, 0.65)', hex: '#10b981' },
  { range: '3-4', label: '3-4人', color: 'rgba(245, 158, 11, 0.75)', hex: '#f59e0b' },
  { range: '5-6', label: '5-6人', color: 'rgba(249, 115, 22, 0.85)', hex: '#f97316' },
  { range: '7-8', label: '7-8人', color: 'rgba(239, 68, 68, 0.9)', hex: '#ef4444' },
  { range: '8+', label: '8人以上', color: 'rgba(127, 29, 29, 0.95)', hex: '#7f1d1d' },
];

const FloorPlanView: React.FC<FloorPlanViewProps> = ({ 
  site, onBack, initialData, onSave, events, selectedEventId, activeDeviceFilters 
}) => {
  const [floorPlan, setFloorPlan] = useState<FloorPlanData>(initialData || { siteId: site.id, imageUrl: '', sensors: [] });
  const [showHeatmap, setShowHeatmap] = useState(true);
  
  // Zoom & Pan States
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const viewportRef = useRef<HTMLDivElement>(null);

  // 模擬每個熱度偵測器的隨機人數數據
  const deviceHeatValues = useMemo(() => {
    const vals: Record<string, number> = {};
    floorPlan.sensors.forEach(s => {
       vals[s.id] = Math.floor(Math.random() * 10); // 0-9人
    });
    return vals;
  }, [floorPlan.sensors]);

  // --- Helpers ---
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

  const getPositionalZoneColor = (zoneId: string, parentHost: SiteNode | null) => {
    if (!parentHost || !parentHost.children) return 'bg-blue-600 shadow-blue-600/50';
    const zoneIndex = parentHost.children.findIndex(c => c.id === zoneId);
    if (zoneIndex <= 0) return 'bg-blue-600 shadow-blue-600/50';
    return 'bg-pink-500 shadow-pink-500/50';
  };

  const allDevices = useMemo(() => {
    const devices: SiteNode[] = [];
    const traverse = (node: SiteNode) => {
      if (node.type === 'device') devices.push(node);
      node.children?.forEach(traverse);
    };
    traverse(site);
    return devices;
  }, [site]);

  const getDeviceIcon = (label: string) => {
    if (label.includes('門磁')) return <DoorClosed size={16} />;
    if (label.includes('PIR')) return <Activity size={16} />;
    if (label.includes('緊急按鈕') || label.includes('SOS')) return <Bell size={16} />;
    if (label.includes('IPC')) return <Video size={16} />;
    if (label.includes('Web Cam') || label.includes('WEB CAM')) return <Camera size={16} />;
    if (label.includes('環境偵測器')) return <Thermometer size={16} />;
    if (label.includes('空間偵測器')) return <UserSearch size={16} />;
    if (label.includes('多功能按鈕')) return <Tablet size={16} />;
    return <Cpu size={16} />;
  };

  const isDeviceVisible = (label: string) => {
    const filters = Array.from(activeDeviceFilters);
    return filters.some(f => {
      const filterItem = f as string;
      if (filterItem === '緊急按鈕' && label.includes('SOS')) return true;
      if (filterItem === 'WEB CAM' && label.includes('Web Cam')) return true;
      return label.includes(filterItem);
    });
  };

  const getHeatColor = (count: number) => {
    if (count === 0) return HEATMAP_COLORS[0];
    if (count <= 2) return HEATMAP_COLORS[1];
    if (count <= 4) return HEATMAP_COLORS[2];
    if (count <= 6) return HEATMAP_COLORS[3];
    if (count <= 8) return HEATMAP_COLORS[4];
    return HEATMAP_COLORS[5];
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.min(Math.max(0.5, scale + delta), 5);
    setScale(newScale);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  };

  const handleMouseUp = () => setIsPanning(false);

  const activeEvent = useMemo(() => events.find(e => e.id === selectedEventId), [selectedEventId, events]);
  
  const linkPath = useMemo(() => {
    if (!activeEvent) return null;
    const sId = activeEvent.sensorId;
    const lId = activeEvent.linkedSensorId;
    if (!sId || !lId) return null;
    
    const s1 = floorPlan.sensors.find((s: SensorPosition) => s.id === sId);
    const s2 = floorPlan.sensors.find((s: SensorPosition) => s.id === lId);
    if (!s1 || !s2) return null;
    
    const d1 = allDevices.find(d => d.id === s1.id);
    const d2 = allDevices.find(d => d.id === s2.id);
    if (d1 && !isDeviceVisible(d1.label)) return null;
    if (d2 && !isDeviceVisible(d2.label)) return null;

    return { x1: s1.x, y1: s1.y, x2: s2.x, y2: s2.y };
  }, [activeEvent, floorPlan.sensors, activeDeviceFilters, allDevices]);

  return (
    <div className="flex flex-col h-full w-full bg-[#050914] animate-in fade-in duration-500 relative">
        {/* --- 熱度人數圖例 (Legend) --- */}
        {showHeatmap && (
           <div className="absolute top-6 right-6 z-[60] bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/5">
                 <Layers size={14} className="text-blue-500" />
                 <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">熱度分佈說明</span>
              </div>
              <div className="space-y-3">
                 {HEATMAP_COLORS.slice().reverse().map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-6">
                       <div className="flex items-center gap-2.5">
                          <div className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: item.hex }}></div>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{item.label}</span>
                       </div>
                       <span className="text-[9px] font-mono font-black text-slate-400">{item.range} PAX</span>
                    </div>
                 ))}
              </div>
              <div className="mt-4 pt-2 border-t border-white/5">
                 <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Radius: 6-8 Meters (AI Sim)</span>
              </div>
           </div>
        )}

        <div className="flex-1 flex overflow-hidden relative">
          <div 
            ref={viewportRef}
            className={`flex-1 bg-black/90 relative overflow-hidden flex items-center justify-center select-none ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
            onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
          >
            {floorPlan.imageUrl ? (
              <div 
                className="relative shadow-2xl transition-transform duration-75 ease-out inline-block"
                style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: 'center center' }}
              >
                <img src={floorPlan.imageUrl} alt="Floor Plan" className="max-w-[90vw] max-h-[80vh] block rounded-lg pointer-events-none border border-slate-700 bg-slate-900/50" />
                
                <div className="absolute inset-0 z-20 pointer-events-none">
                  {site.type === 'host' && floorPlan.hostPosition && (
                    <div 
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-auto"
                      style={{ left: `${floorPlan.hostPosition.x}%`, top: `${floorPlan.hostPosition.y}%` }}
                    >
                      <div className="w-10 h-10 bg-blue-600 rounded-xl border-2 border-white shadow-[0_0_20px_rgba(37,99,235,0.5)] flex items-center justify-center text-white ring-4 ring-blue-600/10">
                        <Server size={18} />
                      </div>
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black/80 rounded text-[8px] font-black text-white whitespace-nowrap uppercase tracking-widest border border-white/10">{site.label}</div>
                    </div>
                  )}

                  {linkPath && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                      <line x1={`${linkPath.x1}%`} y1={`${linkPath.y1}%`} x2={`${linkPath.x2}%`} y2={`${linkPath.y2}%`} stroke="#ef4444" strokeWidth={3} strokeDasharray="6,4" className="animate-[dash_1s_linear_infinite]" />
                      <circle cx={`${linkPath.x1}%`} cy={`${linkPath.y1}%`} r="4" fill="#ef4444" className="animate-pulse" />
                      <circle cx={`${linkPath.x2}%`} cy={`${linkPath.y2}%`} r="4" fill="#ef4444" className="animate-pulse" />
                    </svg>
                  )}

                  {floorPlan.sensors.map(pos => {
                    const deviceNode = allDevices.find(d => d.id === pos.id);
                    if (!deviceNode) return null;
                    if (!isDeviceVisible(deviceNode.label)) return null;

                    const isMainAlert = activeEvent?.sensorId === pos.id;
                    const isLinkedDevice = activeEvent?.linkedSensorId === pos.id;
                    const isHeatSensor = deviceNode.label.includes('熱度');
                    const heatCount = deviceHeatValues[pos.id] || 0;
                    const heatConfig = getHeatColor(heatCount);
                    
                    const parentZone = getParentNode(pos.id);
                    const parentHost = parentZone ? getParentNode(parentZone.id) : null;
                    const zoneColor = parentZone ? getPositionalZoneColor(parentZone.id, parentHost) : 'bg-blue-600 shadow-blue-600/50';

                    const deviceLabel = deviceNode.label || '未知設備';
                    const isFlowSensor = deviceLabel.includes('人流');

                    return (
                      <div 
                        key={pos.id} 
                        className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 transition-all duration-300 pointer-events-auto`}
                        style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                      >
                        {/* --- 空間熱度圖 (Heatmap Overlay) --- */}
                        {/* 優化漸層：減少外圍透明度，增強核心顏色的凝聚力與深度 */}
                        {isHeatSensor && showHeatmap && (
                           <div 
                             className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none mix-blend-screen opacity-100 animate-pulse duration-[3000ms] z-0"
                             style={{ 
                               width: '240px', // 稍微擴大光暈範圍
                               height: '240px',
                               background: `radial-gradient(circle, ${heatConfig.color} 0%, ${heatConfig.color.replace('0.', '0.1')} 40%, transparent 80%)`
                             }}
                           />
                        )}

                        <div className="flex flex-col items-center gap-2 relative z-10">
                           {isFlowSensor && (
                             <div className="absolute -right-24 top-0 translate-x-2 bg-black/80 backdrop-blur-md border border-white/10 rounded-xl p-2.5 flex flex-col gap-1 shadow-2xl z-50 animate-in slide-in-from-left-2 duration-700 group">
                               <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-1.5"><div className="w-1 h-3 bg-emerald-500 rounded-full"></div><span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">IN</span></div>
                                  <span className="text-[11px] font-mono font-black text-emerald-400">{Math.floor(Math.abs(Math.sin(pos.x)) * 500) + 100}</span>
                               </div>
                               <div className="h-px bg-white/5 w-full"></div>
                               <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-1.5"><div className="w-1 h-3 bg-blue-500 rounded-full"></div><span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">OUT</span></div>
                                  <span className="text-[11px] font-mono font-black text-blue-400">{Math.floor(Math.abs(Math.cos(pos.y)) * 400) + 50}</span>
                               </div>
                               <div className="absolute -left-1.5 top-3 w-3 h-3 bg-black/80 border-l border-t border-white/10 rotate-[-45deg]"></div>
                             </div>
                           )}

                           <div className={`
                               w-12 h-12 rounded-full border-2 flex items-center justify-center relative transition-all duration-500
                               ${isMainAlert ? 'bg-red-500 border-white shadow-[0_0_30px_rgba(239,68,68,0.8)] scale-125 z-40 animate-pulse' : 
                                 isLinkedDevice ? 'bg-orange-500 border-white shadow-[0_0_20px_rgba(249,115,22,0.6)] scale-110 z-30' :
                                 `${zoneColor} border-white/20 shadow-lg`}
                             `}>
                             <div className="text-white">{getDeviceIcon(deviceLabel)}</div>
                             {isMainAlert && (<div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded shadow-2xl whitespace-nowrap border border-white/20 animate-bounce z-50">偵測點: {activeEvent.message}</div>)}
                           </div>
                           
                           <div className="bg-black/70 backdrop-blur-sm border border-white/10 px-2 py-0.5 rounded text-[9px] font-black text-slate-200 uppercase tracking-tighter shadow-xl whitespace-nowrap">
                              {deviceLabel}
                           </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 text-slate-500 italic"><p>此分區尚未配置影像圖資</p></div>
            )}

            {floorPlan.imageUrl && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-[#1e293b]/90 backdrop-blur-md border border-slate-700 p-2 rounded-xl flex items-center gap-2 shadow-2xl z-40">
                <button onClick={() => setShowHeatmap(!showHeatmap)} className={`p-2 rounded-lg transition-all flex items-center gap-2 mr-2 ${showHeatmap ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'bg-slate-700 text-slate-400 hover:text-slate-200'}`} title="切換熱力圖層">
                   <Layers size={18}/>
                   <span className="text-[10px] font-black uppercase">Heatmap</span>
                </button>
                <div className="w-px h-6 bg-slate-700 mx-1"></div>
                <button onClick={() => setScale(prev => Math.max(prev - 0.2, 0.5))} className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"><ZoomOut size={18}/></button>
                <div className="w-12 text-center text-xs font-mono font-bold text-blue-400">{(scale * 100).toFixed(0)}%</div>
                <button onClick={() => setScale(prev => Math.min(prev + 0.2, 5))} className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"><ZoomIn size={18}/></button>
                <div className="w-px h-4 bg-slate-700 mx-1"></div>
                <button onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }} className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors flex items-center gap-1.5"><Maximize size={16}/><span className="text-[10px] font-bold">RESET</span></button>
              </div>
            )}
          </div>
        </div>
      <style>{`
        @keyframes dash { to { stroke-dashoffset: -20; } }
      `}</style>
    </div>
  );
};

export default FloorPlanView;