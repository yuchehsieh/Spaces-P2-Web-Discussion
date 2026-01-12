import React, { useState, useMemo } from 'react';
import { GridSize, MainNavType } from '../types';
import { 
  X, 
  Activity, 
  Wifi, 
  Bell, 
  Cpu, 
  MousePointer2, 
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
  AlertTriangle,
  Radio,
  Info,
  Maximize2,
  FileText,
  Settings,
  History as HistoryIcon,
  TrendingUp,
  BarChart3,
  MapPin,
  Shield,
  Zap,
  ChevronRight,
  Video,
  ExternalLink,
  CalendarClock,
  Clock,
  LayoutGrid,
  ArrowRight,
  Server,
  Plug2
} from 'lucide-react';

export interface VideoSlotData {
  id: string;
  label: string;
  isRecording: boolean;
  deviceType?: string; 
  nodeType?: string; // 新增：判斷是否為主機
  siteGroup?: string; // 新增：所屬 Site Group
  siteName?: string; // 新增：所屬 Site
}

interface VideoGridProps {
  gridSize: GridSize;
  activeSlots: Record<number, VideoSlotData>;
  onDropCamera: (index: number, camera: { id: string; label: string; deviceType?: string; nodeType?: string; siteGroup?: string; siteName?: string }) => void;
  onRemoveCamera: (index: number) => void;
  onMoveCamera?: (fromIndex: number, toIndex: number) => void; // 新增：宮格移動回呼
  onToggleRecording: (index: number) => void;
  onJumpToNav?: (nav: MainNavType, nodeId?: string) => void;
}

const MOCK_CAMERA_IMAGES = [
  'https://github.com/yuchehsieh/Spaces-P2-Assets/blob/main/images/mock_camera_1.jpg?raw=true',
  'https://github.com/yuchehsieh/Spaces-P2-Assets/blob/main/images/mock_camera_2.jpg?raw=true',
  'https://github.com/yuchehsieh/Spaces-P2-Assets/blob/main/images/mock_camera_3.jpg?raw=true',
  'https://github.com/yuchehsieh/Spaces-P2-Assets/blob/main/images/mock_camera_4.jpg?raw=true',
];

const VideoGrid: React.FC<VideoGridProps> = ({ 
  gridSize, 
  activeSlots, 
  onDropCamera, 
  onRemoveCamera,
  onMoveCamera,
  onToggleRecording,
  onJumpToNav
}) => {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [detailModalSlot, setDetailModalSlot] = useState<VideoSlotData | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState('');

  const getCameraImage = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return MOCK_CAMERA_IMAGES[Math.abs(hash) % MOCK_CAMERA_IMAGES.length];
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
        // 如果帶有 sourceSlotIndex，代表是宮格間的移動
        if (data.sourceSlotIndex !== undefined) {
          onMoveCamera?.(data.sourceSlotIndex, index);
        } else {
          // 從 SiteTree 拖入
          onDropCamera(index, { 
            id: data.id, 
            label: data.label, 
            deviceType: data.deviceType, 
            nodeType: data.nodeType,
            siteGroup: data.siteGroup, 
            siteName: data.siteName 
          });
        }
      }
    } catch (err) { console.error('Invalid drop data', err); }
  };

  const handleDragStartFromSlot = (e: React.DragEvent, index: number, slotData: VideoSlotData) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      ...slotData,
      type: 'device',
      sourceSlotIndex: index
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const availableTabs = useMemo(() => {
    if (!detailModalSlot) return [];
    
    const label = detailModalSlot.label;
    const specializedTabs = [];
    const universalTabs = [
      { id: 'security_info', label: '保全資訊', icon: <Shield size={14}/> },
      { id: 'scenario_info', label: '情境資訊', icon: <Zap size={14}/> },
      { id: 'device_info', label: '設備資訊', icon: <Cpu size={14}/> }
    ];

    if (label === '空間偵測器') {
      specializedTabs.push({ id: 'coordinate_plot', label: '座標圖', icon: <LayoutGrid size={14}/> });
      specializedTabs.push({ id: 'history_trend', label: '歷史趨勢', icon: <TrendingUp size={14}/> });
    }
    else if (label === '環境偵測器') {
      specializedTabs.push({ id: 'history_trend', label: '歷史趨勢', icon: <TrendingUp size={14}/> });
      specializedTabs.push({ id: 'trigger_logs', label: '觸發紀錄', icon: <HistoryIcon size={14}/> });
    }
    else if (['門磁', 'PIR', '多功能按鈕', '緊急按鈕', 'SOS按鈕', 'SOS'].includes(label)) {
      specializedTabs.push({ id: 'trigger_logs', label: '觸發紀錄', icon: <HistoryIcon size={14}/> });
    }

    return [...specializedTabs, ...universalTabs];
  }, [detailModalSlot]);

  const openModal = (slot: VideoSlotData) => {
    setDetailModalSlot(slot);
    const tabs = getAvailableTabs(slot.label);
    if (tabs.length > 0) setActiveDetailTab(tabs[0].id);
  };

  const getAvailableTabs = (label: string) => {
    const spec = [];
    if (label === '空間偵測器') spec.push({ id: 'coordinate_plot' }, { id: 'history_trend' });
    else if (label === '環境偵測器') spec.push({ id: 'history_trend' }, { id: 'trigger_logs' });
    else if (['門磁', 'PIR', '多功能按鈕', '緊急按鈕', 'SOS按鈕', 'SOS'].includes(label)) spec.push({ id: 'trigger_logs' });
    return [...spec, { id: 'security_info' }, { id: 'scenario_info' }, { id: 'device_info' }];
  };

  const renderDeviceCard = (data: VideoSlotData) => {
    const isSmall = gridSize >= 9;
    const isTiny = gridSize === 16;

    // --- 主機卡片渲染 ---
    if (data.nodeType === 'host') {
      const isOnline = true; // 模擬主機皆在線
      return (
        <div className={`flex flex-col items-center justify-center h-full w-full bg-[#0a0f1e] p-6 pb-16 transition-all duration-500`}>
           <div className={`relative ${isSmall ? 'mb-2' : 'mb-6'}`}>
              <div className={`${isSmall ? 'p-4' : 'p-8'} rounded-[2.5rem] border ${isOnline ? 'border-green-500/30' : 'border-slate-800'} bg-black/40 shadow-2xl transition-all`}>
                 <div className={isOnline ? 'text-green-400' : 'text-slate-600'}>
                    <Server size={isSmall ? 32 : 56} />
                 </div>
              </div>
              {isOnline && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-4 border-[#0a0f1e] animate-pulse"></div>
              )}
           </div>
           
           <div className="text-center space-y-1">
              {!isTiny && (
                <h4 className={`${isSmall ? 'text-xs' : 'text-xl'} font-black text-white italic tracking-tight uppercase`}>
                  {data.label}
                </h4>
              )}
              <div className={`px-4 py-1 rounded-full text-[10px] font-black tracking-[0.2em] border ${isOnline ? 'bg-green-600 text-white border-green-400' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                 {isOnline ? 'ONLINE' : 'OFFLINE'}
              </div>
           </div>
        </div>
      );
    }

    // 環境偵測器卡片 - 更新外接插頭圖示
    if (data.label === '環境偵測器') {
      const metrics = [
        { icon: <Thermometer size={isTiny ? 12 : 14}/>, label: "溫度", value: "24.5", unit: "°C", color: "text-orange-400" },
        { icon: <Droplets size={isTiny ? 12 : 14}/>, label: "濕度", value: "55", unit: "%", color: "text-blue-400" },
        { icon: <Sun size={isTiny ? 12 : 14}/>, label: "光照", value: "420", unit: "lux", color: "text-yellow-400" },
        { icon: <Waves size={isTiny ? 12 : 14}/>, label: "水浸(正)", value: "正常", color: "text-emerald-400", isStatus: true },
        { icon: <Waves size={isTiny ? 12 : 14}/>, label: "水浸(背)", value: "正常", color: "text-emerald-400", isStatus: true },
        { icon: <Plug2 size={isTiny ? 12 : 14}/>, label: "外接：溫度", value: "26.1", unit: "°C", color: "text-blue-400" },
        { icon: <Mic size={isTiny ? 12 : 14}/>, label: "警報音辨識", value: "正常", color: "text-emerald-400", isStatus: true }
      ];

      return (
        <div className={`flex flex-col h-full w-full bg-[#0a0f1e] ${isSmall ? 'p-2' : 'p-4'} pb-16`}>
          {!isTiny && (
            <div className={`flex items-center gap-2 ${isSmall ? 'mb-1.5' : 'mb-3'} border-b border-white/5 pb-1.5`}>
               <div className={`${isSmall ? 'p-1' : 'p-2'} bg-cyan-500/10 text-cyan-400 rounded-lg`}><Thermometer size={isSmall ? 14 : 18}/></div>
               <span className={`${isSmall ? 'text-[10px]' : 'text-sm'} font-black text-white italic`}>環境偵測器</span>
            </div>
          )}
          <div className={`grid ${isSmall ? 'grid-cols-1' : 'grid-cols-2'} gap-1.5 flex-1 overflow-y-auto no-scrollbar`}>
             {metrics.map((m, idx) => {
               // 判斷是否為外接孔或最後一項，使其在宮格較大時顯眼一點
               const isSpecial = idx === 5 || idx === 6;
               return (
                 <div key={idx} className={`bg-white/5 border border-white/5 rounded-xl ${isSmall ? 'px-2 py-1 flex items-center justify-between' : 'p-2.5 flex flex-col justify-between'} hover:bg-white/10 transition-colors ${!isSmall && isSpecial ? 'col-span-1' : ''}`}>
                    <div className="flex items-center gap-1.5">
                      <div className={m.color}>{m.icon}</div>
                      <span className="text-[9px] font-bold text-slate-500 whitespace-nowrap leading-none uppercase tracking-tighter">{m.label}</span>
                    </div>
                    <div className={`flex items-baseline gap-1 ${isSmall ? '' : 'mt-1'}`}>
                      <span className={`${isSmall ? 'text-[10px]' : 'text-base'} font-black font-mono tracking-tighter ${m.color}`}>{m.value}</span>
                      {m.unit && <span className="text-[7px] font-black text-slate-600 uppercase">{m.unit}</span>}
                    </div>
                 </div>
               );
             })}
          </div>
        </div>
      );
    }

    // 空間偵測器卡片
    if (data.label === '空間偵測器') {
      return (
        <div className="flex flex-col h-full w-full bg-[#0a0f1e] p-6 pb-16 justify-center">
          <div className={`flex flex-col items-center ${isSmall ? 'gap-2' : 'gap-6'}`}>
             <div className={`${isSmall ? 'px-2 py-0.5 text-[8px]' : 'px-5 py-2 text-[11px]'} bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 font-black uppercase tracking-[0.2em]`}>模式：人流進出</div>
             <div className="relative">
                <div className={`${isSmall ? 'w-16 h-16 border-2' : 'w-32 h-32 border-4'} rounded-full border-emerald-500/20 flex items-center justify-center animate-pulse`}><Users size={isSmall ? 32 : 64} className="text-emerald-500" /></div>
                <div className={`absolute ${isSmall ? '-bottom-1 -right-1 w-6 h-6 text-xs' : '-bottom-2 -right-2 w-12 h-12 text-2xl'} bg-emerald-500 text-white rounded-lg flex items-center justify-center font-black shadow-xl`}>12</div>
             </div>
             {!isTiny && <h4 className={`${isSmall ? 'text-xs' : 'text-2xl'} font-black text-white italic tracking-tighter`}>空間人數</h4>}
          </div>
        </div>
      );
    }

    // 多功能按鈕、PIR、門磁、SOS 專屬卡片與觸發狀態
    const isTriggeredDevice = ['多功能按鈕', 'PIR', '門磁', '緊急按鈕', 'SOS按鈕', 'SOS'].includes(data.label);
    
    if (isTriggeredDevice) {
      const isTriggered = data.id.endsWith('1') || data.label.includes('SOS') || data.label.includes('PIR');
      
      const getSensorIcon = () => {
        if (data.label === '多功能按鈕') return <Pill size={isSmall ? 32 : 56} />;
        if (data.label === 'PIR') return <Activity size={isSmall ? 32 : 56} />;
        if (data.label === '門磁') return isTriggered ? <DoorOpen size={isSmall ? 32 : 56} /> : <DoorClosed size={isSmall ? 32 : 56} />;
        if (data.label.includes('SOS') || data.label.includes('緊急')) return <Bell size={isSmall ? 32 : 56} />;
        return <Cpu size={isSmall ? 32 : 56} />;
      };

      const themeColor = isTriggered ? 'text-red-500' : 'text-blue-400';
      const bgGlow = isTriggered ? 'bg-red-500/10 shadow-[0_0_40px_rgba(239,68,68,0.2)]' : 'bg-blue-500/5';

      return (
        <div className={`flex flex-col items-center justify-center h-full w-full bg-[#0a0f1e] p-6 pb-16 transition-all duration-500 ${isTriggered ? 'ring-inset ring-2 ring-red-500/30' : ''}`}>
           <div className={`relative ${isSmall ? 'mb-2' : 'mb-6'}`}>
              <div className={`${isSmall ? 'p-4' : 'p-8'} rounded-[2.5rem] border ${isTriggered ? 'border-red-500/50 animate-pulse' : 'border-white/10'} ${bgGlow} transition-all`}>
                 <div className={themeColor}>
                    {getSensorIcon()}
                 </div>
              </div>
              {isTriggered && (
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
              )}
           </div>
           
           <div className="text-center space-y-1">
              {!isTiny && (
                <h4 className={`${isSmall ? 'text-xs' : 'text-xl'} font-black text-white italic tracking-tight uppercase`}>
                  {data.label}
                </h4>
              )}
              <div className={`px-4 py-1 rounded-full text-[10px] font-black tracking-[0.2em] border ${isTriggered ? 'bg-red-600 text-white border-green-400' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                 {isTriggered ? 'TRIGGERED' : 'NORMAL'}
              </div>
           </div>
        </div>
      );
    }

    // 通用卡片
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-[#0a0f1e] p-6 pb-16 space-y-4">
        <div className="p-5 bg-white/5 rounded-[2rem] border border-white/10 shadow-2xl"><Cpu size={48} className="text-slate-400" /></div>
        <h4 className="text-xl font-black text-white italic tracking-tight">{data.label}</h4>
      </div>
    );
  };

  return (
    <div className={`flex-1 grid ${getGridCols()} gap-[1px] bg-slate-800 h-full overflow-hidden p-[1px]`}>
      {slots.map((index) => {
        const slotData = activeSlots[index];
        const isDragOver = dragOverIndex === index;
        
        return (
          <div 
            key={index} 
            className={`relative bg-[#0a0f1e] border border-slate-800 flex items-center justify-center group overflow-hidden transition-colors ${isDragOver ? 'border-2 border-blue-500 bg-blue-900/20' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOverIndex(index); }}
            onDragLeave={() => setDragOverIndex(null)}
            onDrop={(e) => handleDrop(e, index)}
          >
            {slotData ? (
              <div 
                className="relative w-full h-full cursor-pointer" 
                onClick={() => onToggleRecording(index)}
                draggable
                onDragStart={(e) => handleDragStartFromSlot(e, index, slotData)}
              >
                {slotData.deviceType === 'camera' ? (
                  <>
                    <img src={getCameraImage(slotData.id)} alt="Camera Feed" className="w-full h-full object-cover pointer-events-none" />
                    <div className="absolute top-2 right-8 text-white text-[10px] bg-black/50 px-2 py-1 rounded font-mono pointer-events-none">2025-12-17 17:00:40</div>
                  </>
                ) : renderDeviceCard(slotData)}

                <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                    <button onClick={(e) => { e.stopPropagation(); onRemoveCamera(index); }} className="w-7 h-7 flex items-center justify-center bg-red-600/90 hover:bg-red-500 text-white rounded-lg shadow-xl"><X size={16} strokeWidth={3} /></button>
                    <button onClick={(e) => { e.stopPropagation(); openModal(slotData); }} className="w-7 h-7 flex items-center justify-center bg-blue-600/90 hover:bg-blue-500 text-white rounded-lg shadow-xl"><Info size={16} strokeWidth={3} /></button>
                </div>
                
                {/* 底部位置標籤區 */}
                <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 pointer-events-none z-10">
                   {(slotData.siteGroup || slotData.siteName) && (
                     <div className="flex items-center gap-1.5 text-[10px] font-black text-blue-400 uppercase tracking-widest bg-black/80 backdrop-blur-md px-2.5 py-1 rounded border border-white/10 w-fit shadow-2xl">
                        <MapPin size={10} className="shrink-0" /> {slotData.siteGroup} > {slotData.siteName}
                     </div>
                   )}
                   <div className="text-white text-[10px] font-black uppercase tracking-[0.1em] bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 w-fit shadow-2xl">{slotData.label}</div>
                </div>

                <div className="absolute inset-0 border border-transparent group-hover:border-blue-500/50 pointer-events-none transition-colors"></div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center opacity-20 select-none pointer-events-none"><MousePointer2 size={40} className="text-slate-500 mb-3" /><span className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black">Drop Device Here</span></div>
            )}
          </div>
        );
      })}

      {/* --- 詳情彈窗實作 --- */}
      {detailModalSlot && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-in fade-in duration-300">
           <div className="relative max-w-6xl w-full bg-[#111827] border border-slate-700 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[88vh] ring-1 ring-white/5 animate-in zoom-in-95">
              
              <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-[#1e293b]/40 shrink-0">
                 <div className="flex items-center gap-5">
                    <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-900/40">
                       {detailModalSlot.nodeType === 'host' ? <Server size={28}/> : detailModalSlot.deviceType === 'camera' ? <Video size={28}/> : <Cpu size={28}/>}
                    </div>
                    <div>
                       <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">{detailModalSlot.label}</h2>
                       <div className="flex items-center gap-3 mt-1">
                          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">SKS Smart Node / UID: {detailModalSlot.id}</p>
                          {(detailModalSlot.siteGroup || detailModalSlot.siteName) && (
                            <>
                               <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
                               <div className="flex items-center gap-1.5 text-[10px] font-black text-blue-400 uppercase tracking-widest">
                                  <MapPin size={10} /> {detailModalSlot.siteGroup} > {detailModalSlot.siteName}
                               </div>
                            </>
                          )}
                       </div>
                    </div>
                 </div>
                 <button onClick={() => setDetailModalSlot(null)} className="p-2 hover:bg-red-500/20 rounded-xl text-slate-500 hover:text-red-500 transition-all"><X size={32} /></button>
              </div>

              <div className="flex bg-black/20 border-b border-slate-800 px-8 shrink-0 overflow-x-auto no-scrollbar justify-between">
                 <div className="flex">
                    {availableTabs.map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveDetailTab(tab.id)}
                        className={`px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-all relative whitespace-nowrap
                        ${activeDetailTab === tab.id ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}
                        `}
                    >
                        {tab.icon} {tab.label}
                        {activeDetailTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>}
                    </button>
                    ))}
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-10 bg-[#0a0f1e]/50">
                 
                 {activeDetailTab === 'coordinate_plot' && (
                    <div className="flex flex-col h-full animate-in fade-in duration-500">
                       <div className="flex items-center justify-between mb-8">
                          <h4 className="text-sm font-black text-blue-500 uppercase tracking-widest">即時空間分布座標圖</h4>
                          <div className="flex gap-4">
                             <span className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> 人流進出點</span>
                             <span className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase"><div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div> 熱力集中區</span>
                          </div>
                       </div>
                       <div className="flex-1 bg-black/60 rounded-[3rem] border border-slate-800 shadow-inner relative overflow-hidden">
                          <div className="absolute inset-0 grid grid-cols-12 grid-rows-8 opacity-10">
                             {Array.from({length: 96}).map((_, i) => <div key={i} className="border-[0.5px] border-white/20"></div>)}
                          </div>
                          <div className="absolute inset-0 p-20 flex items-center justify-center">
                             <div className="relative w-full h-full border border-blue-500/20 rounded-2xl">
                                <HeatPoint x="20%" y="30%" size="100px" intensity="bg-orange-500/20" />
                                <HeatPoint x="65%" y="45%" size="150px" intensity="bg-orange-500/40 animate-pulse" />
                                <UserMarker x="15%" y="35%" />
                                <UserMarker x="70%" y="50%" />
                             </div>
                          </div>
                       </div>
                    </div>
                 )}

                 {activeDetailTab === 'history_trend' && (
                    <div className="flex flex-col h-full animate-in zoom-in-95 duration-500">
                       <div className="flex items-center justify-between mb-8">
                          <h4 className="text-sm font-black text-blue-500 uppercase tracking-widest">歷史數據趨勢 (24H 回溯)</h4>
                       </div>
                       
                       {detailModalSlot.label === '環境偵測器' ? (
                         <div className="grid grid-cols-1 gap-10">
                            <TrendLineCard label="溫度趨勢 (°C)" values={[22, 23.5, 24, 25, 24.5, 23, 22.5]} color="#fb923c" />
                            <div className="grid grid-cols-2 gap-8">
                               <TrendLineCard label="濕度趨勢 (%)" values={[50, 55, 52, 58, 60, 55, 54]} color="#60a5fa" />
                               <TrendLineCard label="光照強度 (lux)" values={[100, 300, 450, 500, 400, 200, 50]} color="#facc15" />
                            </div>
                         </div>
                       ) : (
                         <div className="space-y-6">
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-4">人流進出分析 (每小時)</span>
                            <div className="h-64 bg-black/40 border border-slate-800 rounded-[2.5rem] flex items-end justify-between p-10 gap-2">
                               {[0.3, 0.5, 0.8, 0.4, 0.6, 0.9, 0.7, 0.4, 0.3, 0.5, 0.8, 0.9, 0.5].map((v, i) => (
                                 <div key={i} className="flex-1 bg-gradient-to-t from-blue-600/50 to-blue-400 rounded-t-lg transition-all hover:scale-110 relative group/bar" style={{ height: `${v * 100}%` }}>
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity">{(v*50).toFixed(0)}</div>
                                 </div>
                               ))}
                            </div>
                         </div>
                       )}
                    </div>
                 )}

                 {activeDetailTab === 'trigger_logs' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                       <h4 className="text-sm font-black text-blue-500 uppercase tracking-widest">設備專屬觸發歷史</h4>
                       <div className="space-y-3">
                          {[
                            { 
                              time: '17:05:22', 
                              event: detailModalSlot.label === '環境偵測器' ? '溫度超過閾值 (35.2°C)' : 
                                     ['多功能按鈕', '緊急按鈕', 'SOS按鈕', 'SOS'].includes(detailModalSlot.label) ? '偵測按壓觸發' : 
                                     detailModalSlot.label === '門磁' ? '偵測門磁觸發' : '偵測人員活動', 
                              status: '自動結案' 
                            },
                            { 
                              time: '16:42:15', 
                              event: detailModalSlot.label === '環境偵測器' ? '濕度異常下降' : 
                                     ['多功能按鈕', '緊急按鈕', 'SOS按鈕', 'SOS'].includes(detailModalSlot.label) ? '偵測按壓觸發' : 
                                     detailModalSlot.label === '門磁' ? '偵測門磁觸發' : '偵測異常觸發', 
                              status: '管理員檢視' 
                            },
                            { time: '12:05:30', event: '系統手動自檢', status: '正常' }
                          ].map((log, i) => (
                            <div key={i} className="flex items-center justify-between p-6 bg-black/30 border border-slate-800 rounded-[1.8rem] hover:bg-white/5 transition-all group">
                               <div className="flex items-center gap-8">
                                  <div className="text-xs font-mono font-black text-slate-500 bg-slate-900 px-3 py-1 rounded-lg">2025-12-18 {log.time}</div>
                                  <div className="flex items-center gap-3">
                                     <div className="w-2 h-2 rounded-full bg-blue-500 group-hover:animate-ping"></div>
                                     <span className="text-sm font-bold text-slate-200">{log.event}</span>
                                  </div>
                               </div>
                               <div className="flex items-center gap-4">
                                  <span className="text-[10px] font-black text-slate-600 uppercase">{log.status}</span>
                                  <button className="p-2 text-slate-700 hover:text-blue-500 transition-colors"><HistoryIcon size={16}/></button>
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                 )}

                 {activeDetailTab === 'scenario_info' && (
                    <div className="grid grid-cols-2 gap-10 animate-in fade-in duration-500">
                       <div className="space-y-8">
                          <h4 className="text-sm font-black text-blue-500 uppercase tracking-widest">關聯自動化情境</h4>
                          <div className="space-y-4">
                             {[
                               { name: `${detailModalSlot.label} 異常連動`, role: '觸發源 (Trigger)', desc: '當此感測器發報時，自動開啟全區影像錄影並通知保安', icon: <Zap size={18}/> },
                               { name: '緊急撤防安全鎖', role: '連動項 (Action)', desc: '系統進入撤防模式時，此感測器將自動進入節電模式', icon: <Shield size={18}/> }
                             ].map((s, i) => (
                               <div key={i} className="bg-[#1e293b]/40 border border-slate-800 p-6 rounded-3xl flex items-center justify-between group hover:border-blue-500/50 transition-all">
                                  <div className="flex items-center gap-4">
                                     <div className="p-3 bg-slate-800 rounded-2xl text-blue-400 group-hover:scale-110 transition-transform">{s.icon}</div>
                                     <div>
                                        <div className="flex items-center gap-2">
                                           <span className="text-sm font-black text-slate-200">{s.name}</span>
                                           <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-blue-900/30 text-blue-400 border border-blue-800/50">{s.role}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-500 leading-tight block mt-1">{s.desc}</span>
                                     </div>
                                  </div>
                                  <ChevronRight size={16} className="text-slate-700" />
                               </div>
                             ))}
                          </div>
                       </div>
                       <div className="flex flex-col items-center justify-center p-12 bg-purple-600/5 border border-dashed border-purple-500/20 rounded-[3rem] text-center gap-6">
                          <Zap size={64} className="text-purple-500/50" />
                          <h5 className="text-xl font-black text-white italic">情境模式管理中心</h5>
                          <button onClick={() => { setDetailModalSlot(null); onJumpToNav?.('event-center'); }} className="px-10 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all active:scale-95 shadow-xl">進入情境編輯 <ExternalLink size={16}/></button>
                       </div>
                    </div>
                 )}

                 {activeDetailTab === 'security_info' && (
                    <div className="grid grid-cols-2 gap-10 animate-in fade-in duration-500">
                       <div className="space-y-8">
                          <h4 className="text-sm font-black text-blue-500 uppercase tracking-widest">分區排程設定</h4>
                          <div className="bg-[#1e293b]/40 border border-slate-800 rounded-3xl p-8 space-y-6">
                             <div className="flex justify-between items-center"><span className="text-slate-500 text-xs font-bold">當前安防狀態</span><span className="text-green-500 font-black text-sm px-3 py-1 bg-green-500/10 rounded-lg border border-green-500/20">設防中 (Armed)</span></div>
                             <div className="h-px bg-white/5"></div>
                             <div className="space-y-4">
                                <span className="block text-[10px] text-slate-600 font-black uppercase">今日排程任務</span>
                                <div className="flex items-center gap-3 bg-black/20 p-4 rounded-2xl border border-white/5">
                                   <CalendarClock size={20} className="text-blue-400" />
                                   <div className="flex flex-col"><span className="text-xs font-bold text-slate-200">夜間安防自動化</span><span className="text-[10px] text-slate-500">Daily • 22:00 ~ 08:00</span></div>
                                </div>
                             </div>
                          </div>
                       </div>
                       <div className="flex flex-col items-center justify-center p-12 bg-blue-600/5 border border-dashed border-purple-500/20 rounded-[3rem] text-center gap-6">
                          <Shield size={64} className="text-blue-500/50" />
                          <button onClick={() => { setDetailModalSlot(null); onJumpToNav?.('security-center'); }} className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 active:scale-95 shadow-xl">跳轉保全排程 <ExternalLink size={16}/></button>
                       </div>
                    </div>
                 )}

                 {activeDetailTab === 'device_info' && (
                    <div className="grid grid-cols-2 gap-10 animate-in fade-in duration-500">
                       <div className="flex flex-col gap-8">
                         <div className="bg-[#1e293b]/40 border border-slate-800 rounded-[2.5rem] p-8 space-y-8">
                            <h4 className="text-sm font-black text-blue-500 uppercase tracking-widest border-b border-white/5 pb-4">硬體底層規格</h4>
                            <div className="grid grid-cols-2 gap-y-8 gap-x-10">
                               <InfoItem label="序列號 (S/N)" value="SKS-SEC-8841-B" />
                               <InfoItem label="韌體版本" value="v2.4.8-LATEST" />
                               <InfoItem label="通訊協定" value="Zigbee 3.0 / Matter" />
                               <InfoItem label="連線時數" value="1,248 Hours" />
                               <InfoItem label="剩餘電量" value="92% (CR123A)" />
                               <InfoItem label="網路延遲" value="14ms" />
                            </div>
                         </div>
                         
                         {detailModalSlot.label === '多功能按鈕' && (
                           <div className="bg-[#1e293b]/40 border border-slate-800 rounded-[2.5rem] p-8 space-y-6">
                             <h4 className="text-sm font-black text-amber-500 uppercase tracking-widest border-b border-white/5 pb-4">圖示配置詳情</h4>
                             <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-blue-600/10 border border-blue-500/30 rounded-2xl flex items-center justify-center text-blue-400 shadow-xl">
                                   <Pill size={32} />
                                </div>
                                <div>
                                   <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">當前圖示標籤</span>
                                   <span className="text-lg font-black text-white italic">用藥提醒</span>
                                </div>
                             </div>
                           </div>
                         )}
                       </div>
                       
                       <div className="flex flex-col items-center justify-center p-12 bg-slate-800/30 border border-dashed border-slate-700 rounded-[3rem] text-center gap-6">
                          <Cpu size={64} className="text-slate-600" />
                          <button onClick={() => { setDetailModalSlot(null); onJumpToNav?.('device-center'); }} className="px-10 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 active:scale-95 shadow-xl">跳轉設備中心 <ExternalLink size={16}/></button>
                       </div>
                    </div>
                 )}

              </div>

              <div className="p-8 bg-[#0b1121] border-t border-slate-800 flex justify-end shrink-0 gap-5">
                 <button onClick={() => setDetailModalSlot(null)} className="px-14 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl transition-all active:scale-95 ring-1 ring-white/10">關閉面板</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

// --- Helper Components for IoT Modal ---

const TrendLineCard: React.FC<{ label: string; values: number[]; color: string }> = ({ label, values, color }) => {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const points = values.map((v, i) => `${(i * 100) / (values.length - 1)},${100 - ((v - min) * 100) / range}`).join(' ');

  return (
    <div className="bg-[#1e293b]/40 border border-slate-800 p-6 rounded-[2.5rem] space-y-4 group">
       <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
          <div className="flex items-center gap-4">
             <span className="text-xs font-mono font-bold text-slate-400 italic">MAX: {max}</span>
             <span className="text-xs font-mono font-bold text-blue-500 italic">CUR: {values[values.length-1]}</span>
          </div>
       </div>
       <div className="h-40 w-full relative pt-4">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
             <defs>
                <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
                   <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                   <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
             </defs>
             <path 
                d={`M 0 100 L ${points} L 100 100 Z`} 
                fill={`url(#grad-${color.replace('#','')})`}
             />
             <polyline
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
                style={{ filter: `drop-shadow(0 0 5px ${color})` }}
             />
             {values.map((v, i) => (
                <circle 
                  key={i}
                  cx={(i * 100) / (values.length - 1)}
                  cy={100 - ((v - min) * 100) / range}
                  r="1.5"
                  fill="white"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                />
             ))}
          </svg>
       </div>
    </div>
  );
};

const InfoItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="space-y-1.5">
     <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">{label}</span>
     <span className="text-sm font-black text-slate-200 italic tracking-tight">{value}</span>
  </div>
);

const HeatPoint: React.FC<{ x: string; y: string; size: string; intensity: string }> = ({ x, y, size, intensity }) => (
  <div className={`absolute rounded-full blur-2xl ${intensity}`} style={{ left: x, top: y, width: size, height: size, transform: 'translate(-50%, -50%)' }}></div>
);

const UserMarker: React.FC<{ x: string; y: string }> = ({ x, y }) => (
  <div className="absolute w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-lg" style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}>
     <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-50"></div>
  </div>
);

export default VideoGrid;