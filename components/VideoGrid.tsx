import React, { useState, useEffect } from 'react';
import { 
  X, 
  Activity, 
  Wifi, 
  Bell, 
  Cpu, 
  MousePointer2, 
  Video, 
  Server,
  Plug2,
  Thermometer, 
  Droplets, 
  Sun, 
  Waves, 
  Mic, 
  Users, 
  Tablet, 
  Pill,
  DoorOpen,
  DoorClosed,
  Info,
  MapPin,
  Building2,
  TrendingUp,
  Moon,
  Timer,
  UserSearch
} from 'lucide-react';

import { SiteNode, GridSize, MainNavType } from '../types';

export interface VideoSlotData {
  id: string;
  label: string;
  isRecording: boolean;
  deviceType?: string; 
  nodeType?: string; 
  siteGroup?: string; 
  siteName?: string; 
}

export interface VideoGridProps {
  gridSize: GridSize;
  activeSlots: Record<number, VideoSlotData>;
  onDropCamera: (index: number, camera: { 
    id: string; 
    label: string; 
    deviceType?: string; 
    nodeType?: string;
    siteGroup?: string;
    siteName?: string;
  }) => void;
  onRemoveCamera: (index: number) => void;
  onMoveCamera?: (fromIndex: number, toIndex: number) => void;
  onToggleRecording: (index: number) => void;
  onJumpToNav?: (nav: MainNavType, subTab?: string) => void;
  onOpenDetail?: (slot: { id: string; label: string; nodeType?: string }) => void;
}

const VideoGrid: React.FC<VideoGridProps> = ({ 
  gridSize, 
  activeSlots, 
  onDropCamera, 
  onRemoveCamera,
  onMoveCamera,
  onToggleRecording,
  onJumpToNav,
  onOpenDetail
}) => {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getCameraImage = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    const index = Math.abs(hash) % 4 + 1;
    return `https://github.com/yuchehsieh/Spaces-P2-Assets/blob/main/images/mock_camera_${index}.jpg?raw=true`;
  };

  const slots = Array.from({ length: gridSize }, (_, i) => i);
  const getGridCols = () => {
    switch (gridSize) {
      case 1: return 'grid-cols-1 grid-rows-1';
      case 4: return 'grid-cols-2 grid-rows-2';
      case 9: return 'grid-cols-3 grid-rows-3';
      case 16: return 'grid-cols-4 grid-rows-4';
      default: return 'grid-cols-2';
    }
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault(); 
    setDragOverIndex(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data.type === 'device') {
        if (data.sourceSlotIndex !== undefined) onMoveCamera?.(data.sourceSlotIndex, index);
        else onDropCamera(index, data);
      }
    } catch (err) {}
  };

  const handleDragStartFromSlot = (e: React.DragEvent, index: number, slotData: VideoSlotData) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ ...slotData, type: 'device', sourceSlotIndex: index }));
  };

  const renderDeviceCard = (data: VideoSlotData) => {
    const isSmall = gridSize >= 9;

    // --- 空間偵測器：人流進出模式 (還原 UI) ---
    if (data.label.includes('空間偵測器') && data.label.includes('人流')) {
      const occupancy = 12; 
      return (
        <div className="flex flex-col h-full w-full bg-[#050914] relative overflow-hidden group">
           <div className="absolute top-6 left-1/2 -translate-x-1/2">
              <div className="px-4 py-1.5 bg-emerald-950/40 border border-emerald-500/30 rounded-full">
                 <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">模式：人流進出</span>
              </div>
           </div>
           
           <div className="flex-1 flex flex-col items-center justify-center pt-8">
              <div className="relative">
                 <div className="w-32 h-32 rounded-full border-2 border-emerald-500/10 flex items-center justify-center bg-emerald-500/5">
                    <Users size={isSmall ? 48 : 64} className="text-emerald-500/60" />
                 </div>
                 <div className="absolute bottom-1 -right-1 bg-emerald-500 px-3 py-1.5 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.6)] border-2 border-white">
                    <span className="text-xl font-black text-white font-mono">{occupancy}</span>
                 </div>
              </div>
              <div className="mt-8 text-center">
                 <h4 className="text-3xl font-black text-white italic tracking-tighter uppercase">空間人數</h4>
              </div>
           </div>

           <div className="p-6 shrink-0 mt-auto border-t border-white/5 bg-black/60">
              <div className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest">
                 <MapPin size={12} className="shrink-0" />
                 <span className="truncate">台北市 > 總公司</span>
              </div>
              <div className="text-slate-400 text-[10px] font-bold mt-1 truncate">{data.label}</div>
           </div>
        </div>
      );
    }

    // --- 空間偵測器：空間熱度模式 (還原 UI) ---
    if (data.label.includes('空間偵測器') && data.label.includes('熱度')) {
      const paxRange = '3-4';
      return (
        <div className="flex flex-col h-full w-full bg-[#050914] relative overflow-hidden group">
           <div className="absolute top-6 left-1/2 -translate-x-1/2">
              <div className="px-4 py-1.5 bg-orange-950/40 border border-orange-500/30 rounded-full">
                 <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">模式：空間熱度</span>
              </div>
           </div>

           <div className="flex-1 flex items-center justify-center pt-8 relative">
              <div className="relative flex flex-col items-center">
                 <div className="w-36 h-36 rounded-full bg-orange-600/90 shadow-[0_0_50px_rgba(249,115,22,0.4)] border-4 border-orange-500/40 flex flex-col items-center justify-center animate-in zoom-in duration-700">
                    <span className="text-4xl font-black text-white italic font-mono">{paxRange}</span>
                    <span className="text-[10px] font-black text-white/70 tracking-widest">PAX</span>
                 </div>
                 <div className="mt-10 text-center">
                    <h4 className="text-xl font-black text-white italic tracking-tighter uppercase">區域狀態：{paxRange}人</h4>
                 </div>
              </div>

              <div className="absolute right-10 top-1/2 -translate-y-1/2 flex gap-4 h-48 border-l border-white/10 pl-6">
                 <div className="flex flex-col justify-between py-1 h-full">
                    {['8+ PAX', '7-8 PAX', '5-6 PAX', '3-4 PAX', '1-2 PAX', '0 PAX'].map((lvl, idx) => {
                       const isCurrent = lvl.includes(paxRange);
                       return (
                        <div key={idx} className="flex items-center gap-3">
                           <div className={`w-2.5 h-4 rounded-sm transition-all ${isCurrent ? 'bg-white shadow-[0_0_15px_white]' : 'bg-slate-800'}`}></div>
                           <span className={`text-[10px] font-black uppercase tracking-tighter transition-colors ${isCurrent ? 'text-white' : 'text-slate-700'}`}>{lvl}</span>
                        </div>
                       );
                    })}
                 </div>
              </div>
           </div>

           <div className="p-6 shrink-0 mt-auto border-t border-white/5 bg-black/60">
              <div className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest">
                 <MapPin size={12} className="shrink-0" />
                 <span className="truncate">台北市 > 新光保全-中山處</span>
              </div>
              <div className="text-slate-400 text-[10px] font-bold mt-1 truncate">{data.label}</div>
           </div>
        </div>
      );
    }

    if (data.label.includes('多功能按鈕') && data.label.includes('時段')) {
      const startTime = new Date(now.getTime() - (6 * 3600 + 42 * 60) * 1000);
      const diff = now.getTime() - startTime.getTime();
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-[#0a0f1e] p-6 pb-20 relative overflow-hidden group ring-inset ring-2 ring-indigo-500/30">
           <div className="absolute top-10 left-1/2 -translate-x-1/2 flex gap-2">
              <div className="px-4 py-1.5 rounded-full flex items-center justify-center border bg-indigo-500/10 border-indigo-500/40 shadow-lg">
                 <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">狀態：睡眠計時中</span>
              </div>
           </div>
           <div className="flex flex-col items-center gap-6 mt-6">
              <div className="relative">
                 <div className={`${isSmall ? 'w-24 h-24' : 'w-36 h-36'} rounded-[2.5rem] border-2 border-indigo-500 shadow-[0_0_40px_rgba(99,102,241,0.2)] transition-all flex items-center justify-center bg-black/40`}>
                    <Moon size={isSmall ? 40 : 64} className="text-indigo-400 animate-pulse" />
                 </div>
                 <div className="absolute -bottom-2 -right-2 bg-indigo-600 p-2.5 rounded-xl shadow-2xl border border-indigo-400"><Timer size={isSmall ? 14 : 18} className="text-white" /></div>
              </div>
              <div className="text-center space-y-2">
                 <h4 className={`${isSmall ? 'text-lg' : 'text-3xl'} font-black text-white italic tracking-tighter uppercase`}>睡眠時間</h4>
                 <span className={`${isSmall ? 'text-2xl' : 'text-4xl'} font-mono font-black text-indigo-400 tracking-tighter`}>{h.toString().padStart(2, '0')}:{m.toString().padStart(2, '0')}<span className="text-sm opacity-50 ml-1">:{s.toString().padStart(2, '0')}</span></span>
              </div>
           </div>
        </div>
      );
    }

    if (data.nodeType === 'zone') {
       const currentDay = now.getDay();
       const currentHourPct = (now.getHours() * 60 + now.getMinutes()) / 1440 * 100;
       return (
         <div className="flex flex-col h-full w-full bg-[#0a0f1e] text-slate-200 overflow-y-auto custom-scrollbar group p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                 <div className="p-2.5 bg-blue-600/10 text-blue-400 rounded-xl border border-blue-500/20"><Building2 size={20}/></div>
                 <span className="text-sm font-black italic tracking-tighter uppercase truncate">{data.label}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div><span className="text-[8px] font-black text-green-500 uppercase tracking-widest">ARMED</span></div>
            </div>
            <div className="flex-1 w-full bg-black/30 border border-slate-800/50 rounded-3xl p-6 mb-4">
               {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, dIdx) => (
                 <div key={day} className="flex items-center gap-4 w-full h-4 mb-1">
                    <span className="w-6 text-[8px] font-black text-slate-600">{day}</span>
                    <div className="flex-1 h-2 bg-slate-900/60 rounded-full relative overflow-hidden">
                       {(dIdx >= 1 && dIdx <= 5) ? <><div className="absolute left-0 w-[33%] h-full bg-emerald-500/20"></div><div className="absolute right-0 w-[15%] h-full bg-emerald-500/20"></div></> : <div className="absolute inset-0 bg-emerald-500/20"></div>}
                       {dIdx === currentDay && <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10" style={{ left: `${currentHourPct}%` }}></div>}
                    </div>
                 </div>
               ))}
            </div>
         </div>
       );
    }

    const isTriggeredDevice = ['多功能按鈕', 'PIR', '門磁', 'SOS按鈕', 'SOS'].some(kw => data.label.includes(kw));
    if (isTriggeredDevice) {
      const isTriggered = data.id.endsWith('1') || data.label.includes('SOS') || data.label.includes('PIR');
      const getSensorIcon = () => {
        if (data.label.includes('多功能按鈕')) return <Pill size={isSmall ? 32 : 56} />;
        if (data.label === 'PIR') return <Activity size={isSmall ? 32 : 56} />;
        if (data.label === '門磁') return isTriggered ? <DoorOpen size={isSmall ? 32 : 56} /> : <DoorClosed size={isSmall ? 32 : 56} />;
        return <Bell size={isSmall ? 32 : 56} />;
      };
      return (
        <div className={`flex flex-col items-center justify-center h-full w-full bg-[#0a0f1e] p-6 pb-16 transition-all duration-500 ${isTriggered ? 'ring-inset ring-2 ring-red-500/30' : ''}`}>
           <div className={`relative mb-6`}><div className={`${isSmall ? 'p-4' : 'p-8'} rounded-[2.5rem] border ${isTriggered ? 'border-red-500/50 animate-pulse' : 'border-white/10'} bg-black/40 transition-all`}><div className={isTriggered ? 'text-red-500' : 'text-blue-400'}>{getSensorIcon()}</div></div></div>
           <div className="text-center italic uppercase font-black text-white">{data.label}</div>
        </div>
      );
    }

    return <div className="flex flex-col items-center justify-center h-full w-full bg-[#0a0f1e] p-6 pb-16 space-y-4"><div className="p-5 bg-white/5 rounded-[2rem] border border-white/10 shadow-2xl"><Cpu size={48} className="text-slate-400" /></div><h4 className="text-xl font-black text-white italic tracking-tight">{data.label}</h4></div>;
  };

  return (
    <div className={`flex-1 grid ${getGridCols()} gap-[1px] bg-slate-800 h-full overflow-hidden p-[1px]`}>
      {slots.map((index) => {
        const slotData = activeSlots[index];
        const isDragOver = dragOverIndex === index;
        return (
          <div key={index} className={`relative bg-[#0a0f1e] border border-slate-800 flex items-center justify-center group overflow-hidden transition-colors ${isDragOver ? 'border-2 border-blue-500 bg-blue-900/20' : ''}`} onDragOver={(e) => { e.preventDefault(); setDragOverIndex(index); }} onDragLeave={() => setDragOverIndex(null)} onDrop={(e) => handleDrop(e, index)}>
            {slotData ? (
              <div className="relative w-full h-full cursor-pointer" onClick={() => onToggleRecording(index)} draggable onDragStart={(e) => handleDragStartFromSlot(e, index, slotData)}>
                {slotData.deviceType === 'camera' ? (
                  <>
                    <img src={getCameraImage(slotData.id)} alt="Camera Feed" className="w-full h-full object-cover pointer-events-none" />
                    <div className="absolute top-2 right-8 text-white text-[10px] bg-black/50 px-2 py-1 rounded font-mono pointer-events-none">2025-12-17 17:00:40</div>
                  </>
                ) : renderDeviceCard(slotData)}
                <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                  <button onClick={(e) => { e.stopPropagation(); onRemoveCamera(index); }} className="w-7 h-7 flex items-center justify-center bg-red-600/90 hover:bg-red-500 text-white rounded-lg shadow-xl"><X size={16} strokeWidth={3} /></button>
                  <button onClick={(e) => { e.stopPropagation(); onOpenDetail?.(slotData); }} className="w-7 h-7 flex items-center justify-center bg-blue-600/90 hover:bg-blue-500 text-white rounded-lg shadow-xl"><Info size={16} strokeWidth={3} /></button>
                </div>
                {slotData.nodeType !== 'site' && slotData.nodeType !== 'zone' && !slotData.label.includes('空間偵測器') && (
                   <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 pointer-events-none z-10">
                      {(slotData.siteGroup || slotData.siteName) && <div className="flex items-center gap-1.5 text-[10px] font-black text-blue-400 uppercase tracking-widest bg-black/80 backdrop-blur-md px-2.5 py-1 rounded border border-white/10 w-fit shadow-2xl"><MapPin size={10} className="shrink-0" /> {slotData.siteGroup} > {slotData.siteName}</div>}
                      <div className="text-white text-[10px] font-black uppercase bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 w-fit shadow-2xl">{slotData.label}</div>
                   </div>
                )}
              </div>
            ) : <div className="flex flex-col items-center justify-center opacity-20 select-none pointer-events-none"><MousePointer2 size={40} className="text-slate-500 mb-3" /><span className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black">Drop Site or Device Here</span></div>}
          </div>
        );
      })}
    </div>
  );
};

export default VideoGrid;