
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, Upload, Plus, Video, Cpu, DoorOpen, Bell, AlertTriangle, Link as LinkIcon, Move, Trash2, CheckCircle, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { SiteNode, FloorPlanData, SensorPosition, SecurityEvent } from '../types';

interface FloorPlanViewProps {
  site: SiteNode;
  onBack: () => void;
  initialData?: FloorPlanData;
  onSave: (data: FloorPlanData) => void;
  events: SecurityEvent[];
}

const FloorPlanView: React.FC<FloorPlanViewProps> = ({ site, onBack, initialData, onSave, events }) => {
  const [isEditing, setIsEditing] = useState(!initialData);
  const [floorPlan, setFloorPlan] = useState<FloorPlanData>(initialData || { siteId: site.id, imageUrl: '', sensors: [] });
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  
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

  const unplacedDevices = useMemo(() => {
    return allDevices.filter(d => !floorPlan.sensors.find(p => p.id === d.id));
  }, [allDevices, floorPlan.sensors]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFloorPlan(prev => ({ ...prev, imageUrl: event.target?.result as string }));
        setScale(1);
        setOffset({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
  };

  // Zoom logic
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.min(Math.max(0.5, scale + delta), 5);
    setScale(newScale);
  };

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 5));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const handleResetZoom = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  // Pan logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing && e.button !== 1 && !(e.target as HTMLElement).classList.contains('bg-slate-900/50')) {
       // Only allow panning with middle click or if target is the background when editing
       return;
    }
    setIsPanning(true);
    setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setOffset({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y
    });
  };

  const handleMouseUp = () => setIsPanning(false);

  const handleDragOver = (e: React.DragEvent) => {
    if (!isEditing) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!isEditing || !containerRef.current) return;
    e.preventDefault();

    const sensorId = e.dataTransfer.getData('sensorId');
    if (!sensorId) return;

    const rect = containerRef.current.getBoundingClientRect();
    
    // Correct dropping position considering scale and offset
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;

    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));

    const existingIndex = floorPlan.sensors.findIndex(s => s.id === sensorId);
    if (existingIndex > -1) {
      const newSensors = [...floorPlan.sensors];
      newSensors[existingIndex] = { ...newSensors[existingIndex], x, y };
      setFloorPlan({ ...floorPlan, sensors: newSensors });
    } else {
      setFloorPlan({ ...floorPlan, sensors: [...floorPlan.sensors, { id: sensorId, x, y }] });
    }
  };

  const handleSensorDragStart = (e: React.DragEvent, id: string) => {
    if (!isEditing) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('sensorId', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const removeSensor = (id: string) => {
    setFloorPlan({ ...floorPlan, sensors: floorPlan.sensors.filter(s => s.id !== id) });
  };

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
    <div className="flex flex-col h-full w-full bg-[#0f172a] animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#1e293b] z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors bg-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-700"
            >
              <ChevronLeft size={16} /> 返回地圖
            </button>
            <div className="h-6 w-px bg-slate-700"></div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Move className="text-blue-400" size={18} /> {site.label} - 2D 平面管理
            </h2>
            <div className="flex bg-black/40 p-1 rounded-lg ml-2">
              <button 
                onClick={() => setIsEditing(false)} 
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${!isEditing ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                查看模式
              </button>
              <button 
                onClick={() => setIsEditing(true)} 
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${isEditing ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                編輯配置
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isEditing && (
              <button 
                onClick={() => { onSave(floorPlan); setIsEditing(false); }}
                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-green-900/20"
              >
                <CheckCircle size={16} /> 儲存配置
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Main Plan Area with Pan & Zoom */}
          <div 
            ref={viewportRef}
            className={`flex-1 bg-black/80 relative overflow-hidden flex items-center justify-center select-none ${isPanning ? 'cursor-grabbing' : isEditing ? 'cursor-default' : 'cursor-grab'}`}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {floorPlan.imageUrl ? (
              <div 
                ref={containerRef}
                className="relative shadow-2xl transition-transform duration-75 ease-out"
                style={{ 
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                  transformOrigin: 'center center'
                }}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <img 
                  src={floorPlan.imageUrl} 
                  alt="Floor Plan" 
                  className="max-w-[80vw] max-h-[70vh] block rounded-lg pointer-events-none border border-slate-700 bg-slate-900/50" 
                />
                
                {linkPath && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                    <line 
                      x1={`${linkPath.x1}%`} y1={`${linkPath.y1}%`} 
                      x2={`${linkPath.x2}%`} y2={`${linkPath.y2}%`} 
                      stroke="#ef4444" 
                      strokeWidth={3 / scale} // Adjust stroke width for scale
                      strokeDasharray="5,5"
                      className="animate-[dash_1s_linear_infinite]"
                    />
                    <circle cx={`${linkPath.x1}%`} cy={`${linkPath.y1}%`} r={4 / scale} fill="#ef4444" />
                    <circle cx={`${linkPath.x2}%`} cy={`${linkPath.y2}%`} r={4 / scale} fill="#ef4444" />
                  </svg>
                )}

                {floorPlan.sensors.map(pos => {
                  const device = allDevices.find(d => d.id === pos.id);
                  const hasAlert = events.some(e => e.sensorId === pos.id && e.type === 'alert');
                  const isHighlighted = activeEvent?.sensorId === pos.id || activeEvent?.linkedSensorId === pos.id;

                  return (
                    <div 
                      key={pos.id}
                      draggable={isEditing}
                      onDragStart={(e) => handleSensorDragStart(e, pos.id)}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 transition-transform duration-100 ${isEditing ? 'cursor-grab active:cursor-grabbing hover:scale-125' : 'cursor-pointer'}`}
                      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                    >
                      <div 
                        className={`
                          p-2 rounded-full border-2 flex items-center justify-center relative transition-transform
                          ${hasAlert ? 'bg-red-600 border-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.8)]' : 'bg-blue-600/80 border-white/20 shadow-lg'}
                          ${isHighlighted ? 'scale-150 z-30 ring-4 ring-yellow-400 ring-offset-2 ring-offset-[#0f172a]' : ''}
                        `}
                        style={{ transform: `scale(${1 / Math.sqrt(scale)})` }} // Anti-scaling to keep markers readable
                      >
                        {getDeviceIcon(pos.id)}
                        {!isEditing && (
                          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-black/90 text-[10px] text-white px-2 py-0.5 rounded whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity font-bold border border-slate-700">
                            {device?.label}
                          </div>
                        )}
                        {isEditing && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); removeSensor(pos.id); }}
                            className="absolute -top-2 -right-2 bg-red-500 rounded-full p-0.5 text-white shadow-md hover:bg-red-600 transition-colors"
                          >
                            <Trash2 size={10} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 text-slate-500 italic">
                <Upload size={64} className="opacity-20" />
                <p>請先上傳平面圖以開始配置</p>
                <label className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full cursor-pointer transition-colors font-bold shadow-lg">
                  選擇平面圖檔案
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              </div>
            )}

            {/* Zoom Controls Overlay */}
            {floorPlan.imageUrl && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#1e293b]/90 backdrop-blur-md border border-slate-700 p-2 rounded-xl flex items-center gap-2 shadow-2xl z-40">
                <button onClick={handleZoomOut} className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors" title="縮小"><ZoomOut size={18}/></button>
                <div className="w-12 text-center text-xs font-mono font-bold text-blue-400">{(scale * 100).toFixed(0)}%</div>
                <button onClick={handleZoomIn} className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors" title="放大"><ZoomIn size={18}/></button>
                <div className="w-px h-4 bg-slate-700 mx-1"></div>
                <button onClick={handleResetZoom} className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors flex items-center gap-1.5" title="重設視角">
                  <Maximize size={16}/> <span className="text-[10px] font-bold">RESET</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="w-80 border-l border-slate-800 bg-[#0a0f1e] flex flex-col z-20">
            {isEditing ? (
              <div className="flex-1 flex flex-col p-4">
                <h3 className="text-sm font-bold text-slate-400 mb-4 flex items-center gap-2">
                  <Plus size={16} /> 尚未部署設備 ({unplacedDevices.length})
                </h3>
                <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                  {unplacedDevices.map(d => (
                    <div 
                      key={d.id}
                      draggable
                      onDragStart={(e) => handleSensorDragStart(e, d.id)}
                      className="bg-slate-800/50 border border-slate-700 p-3 rounded-xl flex items-center gap-3 cursor-grab active:cursor-grabbing hover:bg-slate-700 transition-colors"
                    >
                      <div className="p-2 bg-slate-900 rounded-lg text-blue-400 pointer-events-none">
                        {getDeviceIcon(d.id)}
                      </div>
                      <div className="flex-1 min-w-0 pointer-events-none">
                        <div className="text-xs font-bold text-slate-200 truncate">{d.label}</div>
                        <div className="text-[10px] text-slate-500">{d.deviceType}</div>
                      </div>
                    </div>
                  ))}
                  {unplacedDevices.length === 0 && (
                    <div className="text-center p-8 bg-slate-900/30 rounded-xl border border-dashed border-slate-800 text-slate-600 text-xs">
                      所有設備皆已配置完成
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className="p-4 border-b border-slate-800 bg-[#162032]">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-red-400" /> 近期安全事件
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                  {events.filter(e => e.location.includes(site.label) || site.children?.some(c => e.location.includes(c.label))).map(e => (
                    <div 
                      key={e.id}
                      onClick={() => setSelectedEventId(e.id)}
                      className={`
                        p-3 rounded-xl border transition-all cursor-pointer relative group
                        ${selectedEventId === e.id ? 'bg-blue-600/20 border-blue-500 shadow-lg' : 'bg-slate-800/40 border-slate-700 hover:border-slate-500'}
                      `}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${e.type === 'alert' ? 'bg-red-900/50 text-red-400' : 'bg-blue-900/50 text-blue-400'}`}>
                          {e.type.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">{e.timestamp}</span>
                      </div>
                      <div className="text-xs font-bold text-slate-200 mb-1">{e.message}</div>
                      <div className="text-[10px] text-slate-500 italic">{e.location}</div>
                      
                      {e.linkedSensorId && (
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-red-400 font-bold bg-red-400/10 px-2 py-1 rounded">
                          <LinkIcon size={12} /> 連動觸發確認
                        </div>
                      )}
                    </div>
                  ))}
                  {events.length === 0 && (
                    <div className="text-center p-12 opacity-20 italic text-sm">無歷史事件記錄</div>
                  )}
                </div>
              </div>
            )}
            
            <div className="p-4 border-t border-slate-800 bg-[#0f172a] text-center">
              <p className="text-[9px] text-slate-600 font-bold tracking-widest uppercase">
                SKS Security Intelligence Layer
              </p>
            </div>
          </div>
        </div>
      <style>{`
        @keyframes dash {
          to { stroke-dashoffset: -10; }
        }
      `}</style>
    </div>
  );
};

export default FloorPlanView;
