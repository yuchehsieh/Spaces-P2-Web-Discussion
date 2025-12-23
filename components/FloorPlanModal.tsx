
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, Upload, Video, Cpu, DoorOpen, Bell, CheckCircle, ZoomIn, ZoomOut, Maximize, MousePointer2 } from 'lucide-react';
import { SiteNode, FloorPlanData, SecurityEvent } from '../types';

interface FloorPlanViewProps {
  site: SiteNode;
  onBack: () => void;
  initialData?: FloorPlanData;
  onSave: (data: FloorPlanData) => void;
  events: SecurityEvent[];
  selectedEventId: string | null;
}

const FloorPlanView: React.FC<FloorPlanViewProps> = ({ site, onBack, initialData, onSave, events, selectedEventId }) => {
  const [floorPlan, setFloorPlan] = useState<FloorPlanData>(initialData || { siteId: site.id, imageUrl: '', sensors: [] });
  
  // Zoom & Pan States
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Flatten all devices in this site
  const allDevices = useMemo(() => {
    const devices: SiteNode[] = [];
    const traverse = (node: SiteNode) => {
      if (node.type === 'device') devices.push(node);
      node.children?.forEach(traverse);
    };
    traverse(site);
    return devices;
  }, [site]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.min(Math.max(0.5, scale + delta), 5);
    setScale(newScale);
  };

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 5));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const handleResetZoom = () => { setScale(1); setOffset({ x: 0, y: 0 }); };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  };

  const handleMouseUp = () => setIsPanning(false);

  const getDeviceIcon = (id: string) => {
    const device = allDevices.find(d => d.id === id);
    switch (device?.deviceType) {
      case 'camera': return <Video size={14} />;
      case 'sensor': return <Cpu size={14} />;
      case 'door': return <DoorOpen size={14} />;
      case 'emergency': return <Bell size={14} />;
      default: return <Cpu size={14} />;
    }
  };

  const activeEvent = useMemo(() => events.find(e => e.id === selectedEventId), [selectedEventId, events]);
  const linkPath = useMemo(() => {
    if (!activeEvent || !activeEvent.sensorId || !activeEvent.linkedSensorId) return null;
    const s1 = floorPlan.sensors.find(s => s.id === activeEvent.sensorId);
    const s2 = floorPlan.sensors.find(s => s.id === activeEvent.linkedSensorId);
    if (!s1 || !s2) return null;
    return { x1: s1.x, y1: s1.y, x2: s2.x, y2: s2.y };
  }, [activeEvent, floorPlan.sensors]);

  return (
    <div className="flex flex-col h-full w-full bg-[#050914] animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#1e293b] z-30">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors bg-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-700">
              <ChevronLeft size={16} /> 返回地圖
            </button>
            <div className="h-6 w-px bg-slate-700"></div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2 italic">
               {site.label} - 平面圖檢視模式
            </h2>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <MousePointer2 size={12}/> 操作面板連動中
             </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden relative">
          <div 
            ref={viewportRef}
            className={`flex-1 bg-black/90 relative overflow-hidden flex items-center justify-center select-none ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
            onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
          >
            {floorPlan.imageUrl ? (
              <div 
                ref={containerRef}
                className="relative shadow-2xl transition-transform duration-75 ease-out"
                style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: 'center center' }}
              >
                <img src={floorPlan.imageUrl} alt="Floor Plan" className="max-w-[85vw] max-h-[80vh] block rounded-lg pointer-events-none border border-slate-700 bg-slate-900/50" />
                
                {linkPath && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                    <line 
                      x1={`${linkPath.x1}%`} y1={`${linkPath.y1}%`} 
                      x2={`${linkPath.x2}%`} y2={`${linkPath.y2}%`} 
                      stroke="#ef4444" strokeWidth={3} strokeDasharray="6,4"
                      className="animate-[dash_1s_linear_infinite]"
                    />
                    <circle cx={`${linkPath.x1}%`} cy={`${linkPath.y1}%`} r="4" fill="#ef4444" className="animate-pulse" />
                    <circle cx={`${linkPath.x2}%`} cy={`${linkPath.y2}%`} r="4" fill="#ef4444" className="animate-pulse" />
                  </svg>
                )}

                {floorPlan.sensors.map(pos => {
                  const isHighlighted = activeEvent?.sensorId === pos.id || activeEvent?.linkedSensorId === pos.id;
                  const isMainAlert = activeEvent?.sensorId === pos.id;
                  const isLinkedDevice = activeEvent?.linkedSensorId === pos.id;

                  return (
                    <div 
                      key={pos.id} 
                      className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 transition-all duration-300`}
                      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                    >
                      <div className={`
                          w-12 h-12 rounded-full border-2 flex items-center justify-center relative transition-all duration-500
                          ${isMainAlert ? 'bg-red-500 border-white shadow-[0_0_30px_rgba(239,68,68,0.8)] scale-125 z-40 animate-pulse' : 
                            isLinkedDevice ? 'bg-orange-500 border-white shadow-[0_0_20px_rgba(249,115,22,0.6)] scale-110 z-30' :
                            'bg-blue-600/60 border-white/20 shadow-lg'}
                        `}>
                        {getDeviceIcon(pos.id)}
                        
                        {isMainAlert && (
                           <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded shadow-2xl whitespace-nowrap border border-white/20 animate-bounce">
                              偵測點: {activeEvent.message}
                           </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 text-slate-500 italic">
                <p>請至平面圖中心進行配置</p>
              </div>
            )}

            {floorPlan.imageUrl && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#1e293b]/90 backdrop-blur-md border border-slate-700 p-2 rounded-xl flex items-center gap-2 shadow-2xl z-40">
                <button onClick={handleZoomOut} className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"><ZoomOut size={18}/></button>
                <div className="w-12 text-center text-xs font-mono font-bold text-blue-400">{(scale * 100).toFixed(0)}%</div>
                <button onClick={handleZoomIn} className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"><ZoomIn size={18}/></button>
                <div className="w-px h-4 bg-slate-700 mx-1"></div>
                <button onClick={handleResetZoom} className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors flex items-center gap-1.5"><Maximize size={16}/><span className="text-[10px] font-bold">RESET</span></button>
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
