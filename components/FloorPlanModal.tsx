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
  Layers,
  Moon,
  Timer,
  Droplets,
  Sun,
  Waves,
  Mic,
  Plug2,
  ArrowUpRight,
  ArrowDownLeft,
  Map as MapIcon
} from 'lucide-react';
import { SiteNode, FloorPlanData, SecurityEvent, SensorPosition, ZonePolygon } from '../types';
import { SITE_TREE_DATA } from '../constants';

interface FloorPlanViewProps {
  site: SiteNode;
  onBack: () => void;
  initialData?: FloorPlanData;
  onSave: (data: FloorPlanData) => void;
  events: SecurityEvent[];
  selectedEventId: string | null;
  activeDeviceFilters: Set<string>; 
  onDeviceClick?: (slot: { id: string; label: string; nodeType?: string }) => void;
}

const HEATMAP_COLORS = [
  { range: '0', label: '0人', color: 'rgba(51, 65, 85, 0.4)', hex: '#334155' },
  { range: '1-2', label: '1-2人', color: 'rgba(253, 186, 116, 0.65)', hex: '#fdba74' },
  { range: '3-4', label: '3-4人', color: 'rgba(249, 115, 22, 0.75)', hex: '#f97316' },
  { range: '5-6', label: '5-6人', color: 'rgba(234, 88, 12, 0.85)', hex: '#ea580c' },
  { range: '7-8', label: '7-8人', color: 'rgba(194, 65, 12, 0.9)', hex: '#c2410c' },
  { range: '8+', label: '8人以上', color: 'rgba(154, 52, 18, 0.95)', hex: '#9a3412' },
];

const FloorPlanView: React.FC<FloorPlanViewProps> = ({ 
  site, onBack, initialData, onSave, events, selectedEventId, activeDeviceFilters, onDeviceClick 
}) => {
  const [floorPlan, setFloorPlan] = useState<FloorPlanData>(initialData || { siteId: site.id, type: 'image', imageUrl: '', sensors: [] });
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [hoveredDeviceId, setHoveredDeviceId] = useState<string | null>(null);
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);
  
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // 防閃爍計時器
  const hoverTimer = useRef<number | null>(null);

  const findNodeById = (nodes: SiteNode[], id: string): SiteNode | null => {
    for (const n of nodes) {
      if (n.id === id) return n;
      if (n.children) {
        const res = findNodeById(n.children || [], id);
        if (res) return res;
      }
    }
    return null;
  };

  const getDeviceIcon = (label: string) => {
    const l = label.toUpperCase();
    if (l.includes('門磁')) return <DoorClosed size={16} />;
    if (l.includes('PIR')) return <Activity size={16} />;
    if (l.includes('緊急按鈕') || l.includes('SOS')) return <Bell size={16} />;
    if (l.includes('IPC')) return <Video size={16} />;
    if (l.includes('WEB CAM')) return <Camera size={16} />;
    if (l.includes('環境偵測器')) return <Thermometer size={16} />;
    if (l.includes('空間偵測器')) return <UserSearch size={16} />;
    if (l.includes('多功能按鈕')) return <Tablet size={16} />;
    return <Cpu size={16} />;
  };

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.min(Math.max(0.5, prev + delta), 5));
  };

  const activeEvent = useMemo(() => events.find(e => e.id === selectedEventId), [selectedEventId, events]);

  const mainSensorPos = useMemo(() => {
    if (!activeEvent?.sensorId) return null;
    return floorPlan.sensors.find(s => s.id === activeEvent.sensorId);
  }, [activeEvent, floorPlan.sensors]);

  const linkedSensorPos = useMemo(() => {
    if (!activeEvent?.linkedSensorId) return null;
    return floorPlan.sensors.find(s => s.id === activeEvent.linkedSensorId);
  }, [activeEvent, floorPlan.sensors]);

  const deviceHeatValues = useMemo(() => {
    const vals: Record<string, number> = {};
    floorPlan.sensors.forEach(s => { vals[s.id] = Math.floor(Math.random() * 10); });
    return vals;
  }, [floorPlan.sensors]);

  const flowMockData = useMemo(() => {
    const data: Record<string, { current: number, in: number, out: number }> = {};
    floorPlan.sensors.forEach(s => {
      const baseIn = 120 + Math.floor(Math.random() * 50);
      const baseOut = 100 + Math.floor(Math.random() * 40);
      data[s.id] = {
        in: baseIn,
        out: baseOut,
        current: Math.max(0, baseIn - baseOut)
      };
    });
    return data;
  }, [floorPlan.sensors]);

  const getHeatColor = (count: number) => {
    if (count === 0) return HEATMAP_COLORS[0];
    if (count <= 2) return HEATMAP_COLORS[1];
    if (count <= 4) return HEATMAP_COLORS[2];
    if (count <= 6) return HEATMAP_COLORS[3];
    if (count <= 8) return HEATMAP_COLORS[4];
    return HEATMAP_COLORS[5];
  };

  const hasHeatmapCapability = useMemo(() => floorPlan.sensors.some(s => {
    const node = findNodeById(SITE_TREE_DATA, s.id);
    return node?.label?.includes('熱度') ?? false;
  }), [floorPlan.sensors]);

  // 平滑 Hover 處理
  const handleMouseEnter = (pos: SensorPosition) => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    setHoveredDeviceId(pos.id);
    if(pos.zoneId) setHoveredZoneId(pos.zoneId);
  };

  const handleMouseLeave = () => {
    hoverTimer.current = window.setTimeout(() => {
      setHoveredDeviceId(null);
      setHoveredZoneId(null);
    }, 100);
  };

  return (
    <div className="flex h-full w-full bg-[#050914] animate-in fade-in duration-500 relative text-left">
        {/* 左下角：分區圖例面板 */}
        {floorPlan.zoneRegions && (
          <div className="absolute bottom-6 left-6 z-[60] bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl animate-in slide-in-from-left-4 duration-500 flex flex-col gap-4">
             <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <MapIcon size={14} className="text-blue-500" />
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">分區導覽圖例</span>
             </div>
             <div className="space-y-2">
                {floorPlan.zoneRegions.map(zone => (
                   <button 
                    key={zone.zoneId}
                    onMouseEnter={() => setHoveredZoneId(zone.zoneId)}
                    onMouseLeave={() => setHoveredZoneId(null)}
                    className={`flex items-center justify-between gap-6 px-3 py-1.5 rounded-lg border transition-all ${hoveredZoneId === zone.zoneId ? 'bg-white/10 border-white/20' : 'bg-transparent border-transparent'}`}
                   >
                      <div className="flex items-center gap-3">
                         <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: zone.color }}></div>
                         <span className="text-[11px] font-black text-slate-300 whitespace-nowrap">{zone.label}</span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-500 uppercase">{floorPlan.sensors.filter(s => s.zoneId === zone.zoneId).length} Units</span>
                   </button>
                ))}
             </div>
          </div>
        )}

        {showHeatmap && hasHeatmapCapability && (
           <div className="absolute top-6 right-6 z-[60] bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl animate-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10"><Layers size={16} className="text-orange-500" /><span className="text-[11px] font-black text-slate-200 uppercase tracking-widest">熱度分佈說明</span></div>
              <div className="space-y-4">
                 {HEATMAP_COLORS.slice().reverse().map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-10">
                       <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: item.hex }}></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{item.label}</span></div>
                       <span className="text-[10px] font-mono font-black text-slate-500">{item.range} PAX</span>
                    </div>
                 ))}
              </div>
           </div>
        )}

        <div className="flex-1 flex overflow-hidden relative">
          <div 
            className={`flex-1 bg-black/90 relative overflow-hidden flex items-center justify-center select-none ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
            onWheel={handleWheel} onMouseDown={(e) => { setIsPanning(true); setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y }); }} onMouseMove={(e) => { if(isPanning) setOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y }); }} onMouseUp={() => setIsPanning(false)} onMouseLeave={() => setIsPanning(false)}
          >
            {floorPlan.imageUrl && (
              <div className="relative shadow-2xl transition-transform duration-75 ease-out inline-block" style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}>
                <img src={floorPlan.imageUrl} alt="Floor Plan" className="max-w-[90vw] max-h-[80vh] block rounded-lg pointer-events-none border border-slate-700 bg-slate-900/50" />
                
                {/* SVG 連結連線層 */}
                {selectedEventId && mainSensorPos && linkedSensorPos && (
                  <svg className="absolute inset-0 z-[25] pointer-events-none" width="100%" height="100%">
                    <line 
                      x1={`${mainSensorPos.x}%`} y1={`${mainSensorPos.y}%`} 
                      x2={`${linkedSensorPos.x}%`} y2={`${linkedSensorPos.y}%`} 
                      stroke="#ef4444" strokeWidth="3" strokeDasharray="8,6"
                      className="animate-[dash_2s_linear_infinite]"
                    />
                    <style>{`
                      @keyframes dash {
                        to { stroke-dashoffset: -14; }
                      }
                    `}</style>
                  </svg>
                )}

                <div className="absolute inset-0 z-20 pointer-events-none">
                  {floorPlan.sensors.map((pos: SensorPosition) => {
                    const deviceNode = findNodeById(SITE_TREE_DATA, pos.id);
                    if (!deviceNode) return null;
                    
                    const filterKeywords = Array.from(activeDeviceFilters);
                    const devLabelUpper = (deviceNode.label || '').toUpperCase();
                    
                    const isVisible = filterKeywords.some((f: string) => {
                       const fUpper = f.toUpperCase();
                       if (fUpper === 'WEB CAM' && devLabelUpper.includes('WEB CAM')) return true;
                       if (devLabelUpper.includes(fUpper)) return true;
                       if (fUpper === '緊急按鈕' && devLabelUpper.includes('SOS')) return true;
                       return false;
                    });
                    
                    const isPartOfActiveEvent = activeEvent?.sensorId === pos.id || activeEvent?.linkedSensorId === pos.id;
                    if (!isVisible && !isPartOfActiveEvent) return null;

                    const isMainAlert = (activeEvent?.sensorId || '') === pos.id;
                    const isLinkedTarget = (activeEvent?.linkedSensorId || '') === pos.id;
                    
                    const deviceLabel = deviceNode.label;
                    const isEnv = deviceLabel.includes('環境偵測器');
                    const isFlow = deviceLabel.includes('空間偵測器') && deviceLabel.includes('人流');
                    const isTimeBtn = deviceLabel.includes('多功能按鈕(時段)');
                    
                    const isHovered = hoveredDeviceId === pos.id;
                    const zoneInfo = floorPlan.zoneRegions?.find(z => z.zoneId === pos.zoneId);
                    const isZoneHovered = hoveredZoneId === pos.zoneId;

                    const heatCount = deviceHeatValues[pos.id] || 0;
                    const heatConfig = getHeatColor(heatCount);

                    return (
                      <div 
                        key={pos.id} 
                        className={`absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto transition-all duration-300 w-12 h-12 flex items-center justify-center
                          ${isHovered ? 'z-[150]' : isZoneHovered ? 'z-30' : 'z-20'}`}
                        style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                        onMouseEnter={() => handleMouseEnter(pos)}
                        onMouseLeave={handleMouseLeave}
                      >
                        {/* 視覺呈現層 */}
                        <div className={`flex flex-col items-center gap-2 group relative transition-transform duration-300 ${isHovered ? 'scale-105' : 'scale-100'}`}>
                            
                            {/* 事件動態氣泡標籤 (偵測點) */}
                            {isMainAlert && (
                              <div className="absolute bottom-[calc(100%+28px)] left-1/2 -translate-x-1/2 bg-red-600 text-white px-5 py-2.5 rounded-2xl text-[11px] font-black whitespace-nowrap shadow-[0_8px_25px_rgba(220,38,38,0.5)] animate-bounce z-50 flex items-center gap-2 border border-red-400/50 pointer-events-none">
                                 偵測點：{activeEvent.message}
                              </div>
                            )}

                            {deviceNode.label.includes('熱度') && showHeatmap && (
                               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none mix-blend-screen opacity-100 animate-pulse duration-[3000ms] z-0" style={{ width: '240px', height: '240px', background: `radial-gradient(circle, ${heatConfig.color} 0%, ${heatConfig.color.replace('0.', '0.1')} 40%, transparent 80%)` }} />
                            )}

                            {/* 懸停詳情面板 - 已優化為可點擊 (pointer-events-auto) */}
                            {isEnv && isHovered && (
                              <div 
                                onClick={() => onDeviceClick?.({id: deviceNode.id, label: deviceNode.label, nodeType: deviceNode.type})}
                                className="absolute bottom-[calc(100%+15px)] left-1/2 -translate-x-1/2 w-48 bg-[#1e293b] border border-slate-700 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[200] animate-in zoom-in-95 duration-200 text-left pointer-events-auto cursor-pointer hover:bg-[#283548] transition-colors ring-1 ring-white/10 group/tooltip"
                              >
                                 <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2 mb-3 flex justify-between items-center">
                                    <span>深度診斷資訊</span>
                                    <ArrowUpRight size={10} className="text-blue-500 group-hover/tooltip:translate-x-0.5 group-hover/tooltip:-translate-y-0.5 transition-transform" />
                                 </div>
                                 <div className="space-y-2.5">
                                    <div className="flex justify-between"><div className="flex gap-2 text-[10px] text-emerald-400 font-bold"><Waves size={12}/>水浸(前/後)</div><span className="text-[10px] text-white">正常</span></div>
                                    <div className="flex justify-between"><div className="flex gap-2 text-[10px] text-blue-400 font-bold"><Plug2 size={12}/>外接溫度</div><span className="text-[10px] text-white">26.1°C</span></div>
                                    <div className="flex justify-between"><div className="flex gap-2 text-[10px] text-indigo-400 font-bold"><Mic size={12}/>聲音模式</div><span className="text-[10px] text-white">背景音</span></div>
                                 </div>
                              </div>
                            )}

                            {isFlow && isHovered && (
                              <div 
                                onClick={() => onDeviceClick?.({id: deviceNode.id, label: deviceNode.label, nodeType: deviceNode.type})}
                                className="absolute bottom-[calc(100%+15px)] left-1/2 -translate-x-1/2 w-56 bg-[#1e293b] border border-slate-700 rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[200] animate-in zoom-in-95 duration-200 text-left pointer-events-auto cursor-pointer hover:bg-[#283548] transition-colors ring-1 ring-white/10 group/tooltip"
                              >
                                 <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest border-b border-slate-800 pb-2 mb-3 flex justify-between items-center">
                                    <span className="whitespace-normal truncate">完整名稱：{deviceLabel}</span>
                                    <ArrowUpRight size={12} className="shrink-0 text-blue-400 group-hover/tooltip:translate-x-0.5 group-hover/tooltip:-translate-y-0.5 transition-transform" />
                                 </div>
                                 <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                      <div className="flex gap-2 text-[10px] text-blue-400 font-bold"><ArrowUpRight size={12}/> 進場累計</div>
                                      <span className="text-xs font-black text-white font-mono">{flowMockData[pos.id]?.in}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <div className="flex gap-2 text-[10px] text-amber-500 font-bold"><ArrowDownLeft size={12}/> 出場累計</div>
                                      <span className="text-xs font-black text-white font-mono">{flowMockData[pos.id]?.out}</span>
                                    </div>
                                 </div>
                                 <div className="mt-3 pt-2 border-t border-slate-800 flex justify-between items-center">
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">目前留存</span>
                                    <span className="text-sm font-black text-emerald-400 font-mono">{flowMockData[pos.id]?.current}</span>
                                 </div>
                              </div>
                            )}

                            {/* 預覽狀態面板 (常駐小標籤) */}
                            {isEnv && !isHovered && (
                              <div className="flex gap-1.5 mb-1 animate-in fade-in slide-in-from-bottom-1">
                                 <div className="px-2 py-1 bg-orange-600/90 backdrop-blur-md rounded border border-white/10 flex items-center gap-1.5 shadow-xl"><Thermometer size={10} className="text-white"/><span className="text-[9px] font-black text-white">24.5°C</span></div>
                                 <div className="px-2 py-1 bg-blue-600/90 backdrop-blur-md rounded border border-white/10 flex items-center gap-1.5 shadow-xl"><Droplets size={10} className="text-white"/><span className="text-[9px] font-black text-white">55%</span></div>
                                 <div className="px-2 py-1 bg-amber-600/90 backdrop-blur-md rounded border border-white/10 flex items-center gap-1.5 shadow-xl"><Sun size={10} className="text-white"/><span className="text-[9px] font-black text-white">420L</span></div>
                              </div>
                            )}

                            {isFlow && !isHovered && (
                              <div className="mb-1 px-3 py-1 bg-emerald-600/90 backdrop-blur-md rounded-lg border border-white/10 flex items-center justify-center shadow-xl animate-in zoom-in duration-300">
                                 <span className="text-[11px] font-black text-white font-mono tracking-tighter">{flowMockData[pos.id]?.current} <span className="text-[8px] opacity-60">PAX</span></span>
                              </div>
                            )}

                            {isTimeBtn && (
                               <div className="mb-1 px-3 py-1 bg-indigo-600/90 backdrop-blur-md rounded-lg border border-white/10 flex items-center gap-2 shadow-xl animate-in zoom-in duration-300">
                                  <Moon size={10} className="text-white animate-pulse" />
                                  <span className="text-[9px] font-black text-white font-mono tracking-tighter">睡眠中</span>
                               </div>
                            )}

                            {/* 主圖標 */}
                            <div 
                              onClick={() => onDeviceClick?.({id: deviceNode.id, label: deviceNode.label, nodeType: deviceNode.type})} 
                              className={`w-11 h-11 rounded-full border-2 flex items-center justify-center text-white shadow-lg cursor-pointer hover:scale-110 transition-all relative overflow-hidden
                                ${isMainAlert ? 'bg-red-600 border-white animate-pulse scale-110 z-40' : 
                                  isLinkedTarget ? 'bg-orange-500 border-white/40 ring-4 ring-orange-500/20' : 
                                  isFlow ? 'bg-emerald-900/60 border-emerald-400' :
                                  isEnv ? 'bg-cyan-600 border-white/30' :
                                  isTimeBtn ? 'bg-indigo-900/60 border-indigo-400' :
                                  'bg-blue-600 border-white/20'}`}
                            >
                               {getDeviceIcon(deviceLabel)}
                            </div>

                            {/* 名稱標籤：修正截斷問題並優化 Hover 拉伸感 */}
                            <div 
                               onClick={(e) => {
                                  e.stopPropagation();
                                  onDeviceClick?.({id: deviceNode.id, label: deviceNode.label, nodeType: deviceNode.type});
                               }}
                               className={`bg-black/80 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden transition-all duration-300 shadow-2xl flex pointer-events-auto cursor-pointer hover:bg-slate-800/90 active:scale-95
                              ${isHovered ? 'flex-col max-w-[220px] z-[160] ring-2 ring-white/60' : 'flex-row items-center max-w-[160px] min-w-0 z-50'}`}>
                               {zoneInfo && (
                                 <div className={`shrink-0 ${isHovered ? 'h-1 w-full' : 'w-1 self-stretch'}`} style={{ backgroundColor: zoneInfo.color }}></div>
                               )}
                               <div className={`flex flex-col min-w-0 overflow-hidden ${isHovered ? 'p-2 gap-0.5' : 'px-2 py-1.5'}`}>
                                  {zoneInfo && isHovered && (
                                    <span className="font-black text-slate-500 uppercase tracking-widest text-[8px] truncate">
                                      {zoneInfo.label}
                                    </span>
                                  )}
                                  <span className="font-black text-slate-100 uppercase tracking-tight leading-tight text-[10px] truncate whitespace-nowrap overflow-hidden text-ellipsis">
                                    {deviceLabel}
                                  </span>
                               </div>
                            </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {floorPlan.imageUrl && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-[#1e293b]/90 backdrop-blur-md border border-slate-700 p-2 rounded-xl flex items-center gap-2 shadow-2xl z-40">
                {hasHeatmapCapability && (
                  <button onClick={() => setShowHeatmap(!showHeatmap)} className={`p-2 rounded-lg transition-all flex items-center gap-2 mr-2 ${showHeatmap ? 'bg-orange-600 text-white shadow-lg' : 'bg-slate-700 text-slate-400 hover:text-slate-200'}`} title="切換熱力圖層">
                    <Layers size={18}/><span className="text-[10px] font-black uppercase">Heatmap</span>
                  </button>
                )}
                <button onClick={() => setScale(prev => Math.max(prev - 0.2, 0.5))} className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"><ZoomOut size={18}/></button>
                <div className="w-12 text-center text-xs font-mono font-bold text-orange-400">{(scale * 100).toFixed(0)}%</div>
                <button onClick={() => setScale(prev => Math.min(prev + 0.2, 5))} className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"><ZoomIn size={18}/></button>
                <button onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }} className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 flex items-center gap-1.5"><Maximize size={16}/><span className="text-[10px] font-bold uppercase">Reset</span></button>
              </div>
            )}
          </div>
        </div>
    </div>
  );
};

export default FloorPlanView;