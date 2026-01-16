import React, { useState, useMemo } from 'react';
import { GridSize, MainNavType } from '../types';
import { 
  X, 
  Activity, 
  Wifi, 
  Bell, 
  Cpu, 
  MousePointer2, 
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
  Building2,
  TrendingDown,
  LayoutList,
  User,
  Layers,
  Monitor,
  ArrowLeftRight,
  Trophy,
  ArrowUpRight,
  Target,
  CalendarDays,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CalendarRange,
  ArrowRightLeft,
  ChevronDown as ChevronDownIcon,
  // Fix: Added missing RefreshCw import from lucide-react
  RefreshCw
} from 'lucide-react';

export interface VideoSlotData {
  id: string;
  label: string;
  isRecording: boolean;
  deviceType?: string; 
  nodeType?: string; // 新增：判斷是否為主機或據點
  siteGroup?: string; 
  siteName?: string; 
}

interface VideoGridProps {
  gridSize: GridSize;
  activeSlots: Record<number, VideoSlotData>;
  onDropCamera: (index: number, camera: { id: string; label: string; deviceType?: string; nodeType?: string; siteGroup?: string; siteName?: string }) => void;
  onRemoveCamera: (index: number) => void;
  onMoveCamera?: (fromIndex: number, toIndex: number) => void; 
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
  
  // 時段比較專用狀態
  const [comparisonType, setComparisonType] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('day');

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
        if (data.sourceSlotIndex !== undefined) {
          onMoveCamera?.(data.sourceSlotIndex, index);
        } else {
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

    if (detailModalSlot.nodeType === 'site') {
       return [
          { id: 'site_daily_overview', label: '當日總覽', icon: <LayoutList size={14}/> },
          { id: 'site_cumulative_analysis', label: '累計分析', icon: <BarChart3 size={14}/> },
          { id: 'site_time_comparison', label: '時段比較', icon: <ArrowLeftRight size={14}/> },
          { id: 'site_device_comparison', label: '設備比較', icon: <Monitor size={14}/> },
          { id: 'site_behavior_profile', label: '行為輪廓', icon: <User size={14}/> },
          { id: 'site_structural_metrics', label: '結構指標', icon: <Layers size={14}/> }
       ];
    } else if (label.includes('空間偵測器')) {
      specializedTabs.push({ id: 'coordinate_plot', label: '座標圖', icon: <LayoutGrid size={14}/> });
      specializedTabs.push({ id: 'history_trend', label: '歷史趨勢', icon: <TrendingUp size={14}/> });
    } else if (label === '環境偵測器') {
      specializedTabs.push({ id: 'history_trend', label: '歷史趨勢', icon: <TrendingUp size={14}/> });
      specializedTabs.push({ id: 'trigger_logs', label: '觸發紀錄', icon: <HistoryIcon size={14}/> });
    } else if (['門磁', 'PIR', '多功能按鈕', '緊急按鈕', 'SOS按鈕', 'SOS'].includes(label)) {
      specializedTabs.push({ id: 'trigger_logs', label: '觸發紀錄', icon: <HistoryIcon size={14}/> });
    }

    return [...specializedTabs, ...universalTabs];
  }, [detailModalSlot]);

  const openModal = (slot: VideoSlotData) => {
    setDetailModalSlot(slot);
    const tabs = getAvailableTabs(slot);
    if (tabs.length > 0) setActiveDetailTab(tabs[0].id);
  };

  const getAvailableTabs = (slot: VideoSlotData) => {
    if (slot.nodeType === 'site') {
       return [
         { id: 'site_daily_overview' },
         { id: 'site_cumulative_analysis' },
         { id: 'site_time_comparison' },
         { id: 'site_device_comparison' },
         { id: 'site_behavior_profile' },
         { id: 'site_structural_metrics' }
       ];
    }
    const spec = [];
    if (slot.label.includes('空間偵測器')) spec.push({ id: 'coordinate_plot' }, { id: 'history_trend' });
    else if (slot.label === '環境偵測器') spec.push({ id: 'history_trend' }, { id: 'trigger_logs' });
    else if (['門磁', 'PIR', '多功能按鈕', '緊急按鈕', 'SOS按鈕', 'SOS'].includes(slot.label)) spec.push({ id: 'trigger_logs' });
    return [...spec, { id: 'security_info' }, { id: 'scenario_info' }, { id: 'device_info' }];
  };

  const renderDeviceCard = (data: VideoSlotData) => {
    const isSmall = gridSize >= 9;
    const isTiny = gridSize === 16;

    // --- 據點綜觀卡片 (Site Overview) ---
    if (data.nodeType === 'site') {
      const isHQ = data.label.includes('總公司');
      const totalFlow = isHQ ? 70 : 18;
      
      const trendData = [5, 12, 18, 35, 28, 15, 10, 14, 18, 20, 22, 25, 45, 60, 70, 65, 50, 40, 30, 20, 15, 10, 5, 3];
      const currentHourIdx = 14; // 15 時

      return (
        <div className={`flex flex-col h-full w-full bg-[#0a0f1e] ${isSmall ? 'p-3' : 'p-6'} pb-16 justify-between transition-all duration-500`}>
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <div className="p-2 bg-blue-600/10 text-blue-400 rounded-lg"><Building2 size={isSmall ? 14 : 18}/></div>
                 <span className={`${isSmall ? 'text-[10px]' : 'text-sm'} font-black text-white italic tracking-tighter uppercase truncate max-w-[120px]`}>{data.label}</span>
              </div>
           </div>

           <div className="flex flex-col items-center">
              {!isTiny && (
                <div className="flex items-center gap-2 mb-3 animate-in fade-in slide-in-from-bottom-1 duration-700">
                   <div className="px-2 py-0.5 bg-red-600 text-white text-[9px] font-black rounded border border-red-500 shadow-lg shadow-red-900/20">即時資料</div>
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">略為繁忙</span>
                </div>
              )}
              
              <div className="relative">
                 <div className={`${isSmall ? 'w-20 h-20 border-2' : 'w-28 h-28 border-4'} rounded-full border-blue-500/20 flex flex-col items-center justify-center`}>
                    <span className={`${isSmall ? 'text-2xl' : 'text-4xl'} font-black text-white font-mono`}>{totalFlow}</span>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest -mt-1">People Total</span>
                 </div>
                 <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg animate-pulse">
                    <TrendingUp size={12} />
                 </div>
              </div>
           </div>

           <div className="space-y-2">
              {!isTiny && <div className="flex justify-between items-center text-[8px] font-black text-slate-600 uppercase tracking-widest px-2"><span>24H Flow Trend</span> <span className="text-blue-500">Updated: 17:00</span></div>}
              <div className={`h-16 w-full flex items-end gap-[2px] ${isSmall ? 'px-2' : 'px-4'}`}>
                 {trendData.map((val, idx) => {
                   const isCurrent = idx === currentHourIdx;
                   const height = (val / 80) * 100;
                   return (
                     <div key={idx} className="flex-1 group/bar relative h-full flex flex-col justify-end">
                        <div 
                          className={`w-full rounded-t-sm transition-all duration-500 ${isCurrent ? 'bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]' : 'bg-blue-600/40 group-hover/bar:bg-blue-600/70'}`}
                          style={{ height: `${height}%` }}
                        ></div>
                        {isCurrent && !isTiny && <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[7px] font-black text-pink-500 whitespace-nowrap">15時</div>}
                     </div>
                   );
                 })}
              </div>
              {!isTiny && (
                <div className="flex justify-between text-[7px] font-black text-slate-700 px-2 uppercase">
                   <span>06時</span><span>12時</span><span>18時</span><span>00時</span>
                </div>
              )}
           </div>
        </div>
      );
    }

    // --- 主機卡片渲染 ---
    if (data.nodeType === 'host') {
      const isOnline = true; 
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

    // 環境偵測器卡片
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
    if (data.label.includes('空間偵測器')) {
      let flowValue = 12; 
      if (data.label.includes('大門')) flowValue = 32;
      else if (data.label.includes('後門')) flowValue = 24;
      else if (data.label.includes('側門A')) flowValue = 6;
      else if (data.label.includes('側門B')) flowValue = 8;

      return (
        <div className="flex flex-col h-full w-full bg-[#0a0f1e] p-6 pb-16 justify-center">
          <div className={`flex flex-col items-center ${isSmall ? 'gap-2' : 'gap-6'}`}>
             <div className={`${isSmall ? 'px-2 py-0.5 text-[8px]' : 'px-5 py-2 text-[11px]'} bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 font-black uppercase tracking-[0.2em]`}>模式：人流進出</div>
             <div className="relative">
                <div className={`${isSmall ? 'w-16 h-16 border-2' : 'w-32 h-32 border-4'} rounded-full border-emerald-500/20 flex items-center justify-center animate-pulse`}><Users size={isSmall ? 32 : 64} className="text-emerald-500" /></div>
                <div className={`absolute ${isSmall ? '-bottom-1 -right-1 w-6 h-6 text-xs' : '-bottom-2 -right-2 w-12 h-12 text-2xl'} bg-emerald-500 text-white rounded-lg flex items-center justify-center font-black shadow-xl`}>{flowValue}</div>
             </div>
             {!isTiny && <h4 className={`${isSmall ? 'text-xs font-black' : 'text-xl font-black'} text-white italic tracking-tighter text-center leading-tight mt-2`}>{data.label}</h4>}
          </div>
        </div>
      );
    }

    // 多功能按鈕、PIR、門磁、SOS 專屬卡片
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
              <div className="flex flex-col items-center justify-center opacity-20 select-none pointer-events-none"><MousePointer2 size={40} className="text-slate-500 mb-3" /><span className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black">Drop Site or Device Here</span></div>
            )}
          </div>
        );
      })}

      {/* --- 詳情彈窗 --- */}
      {detailModalSlot && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-in fade-in duration-300">
           <div className="relative max-w-6xl w-full bg-[#111827] border border-slate-700 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[88vh] ring-1 ring-white/5 animate-in zoom-in-95 duration-200">
              
              <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-[#1e293b]/40 shrink-0">
                 <div className="flex items-center gap-5">
                    <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-900/40">
                       {detailModalSlot.nodeType === 'site' ? <Building2 size={28}/> : detailModalSlot.nodeType === 'host' ? <Server size={28}/> : detailModalSlot.deviceType === 'camera' ? <Video size={28}/> : <Cpu size={28}/>}
                    </div>
                    <div>
                       <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">{detailModalSlot.label}</h2>
                       <div className="flex items-center gap-3 mt-1">
                          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">SKS {detailModalSlot.nodeType === 'site' ? 'Infrastructure Node' : 'Smart Node'} / UID: {detailModalSlot.id}</p>
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
                 
                 {/* --- 當日總覽 --- */}
                 {activeDetailTab === 'site_daily_overview' && (
                    <div className="flex flex-col gap-10 animate-in fade-in duration-500">
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="bg-[#1e293b]/40 border border-slate-800 p-8 rounded-[2.5rem] flex items-center gap-6 group hover:border-blue-500/30 transition-all shadow-xl">
                             <div className="p-5 bg-blue-600/10 text-blue-500 rounded-[1.8rem] group-hover:scale-110 transition-transform shadow-inner"><Users size={32}/></div>
                             <div>
                                <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">今日人流總數</span>
                                <div className="flex items-baseline gap-2">
                                   <span className="text-4xl font-black text-white font-mono tracking-tighter">1,248</span>
                                   <span className="text-[10px] font-black text-blue-400 uppercase italic">Pax Today</span>
                                </div>
                             </div>
                          </div>

                          <div className="bg-[#1e293b]/40 border border-slate-800 p-8 rounded-[2.5rem] flex items-center gap-6 group hover:border-emerald-500/30 transition-all shadow-xl">
                             <div className="p-5 bg-emerald-600/10 text-emerald-500 rounded-[1.8rem] group-hover:scale-110 transition-transform shadow-inner"><Activity size={32}/></div>
                             <div>
                                <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">當前場內人數</span>
                                <div className="flex items-baseline gap-2">
                                   <span className="text-4xl font-black text-emerald-400 font-mono tracking-tighter">70</span>
                                   <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 rounded-md border border-emerald-500/20">
                                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                      <span className="text-[8px] font-black text-emerald-500 uppercase">Live Now</span>
                                   </div>
                                </div>
                             </div>
                          </div>

                          <div className="bg-[#1e293b]/40 border border-slate-800 p-8 rounded-[2.5rem] flex items-center gap-6 group hover:border-pink-500/30 transition-all shadow-xl">
                             <div className="p-5 bg-pink-600/10 text-pink-500 rounded-[1.8rem] group-hover:scale-110 transition-transform shadow-inner"><TrendingUp size={32}/></div>
                             <div>
                                <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">今日流量峰值</span>
                                <div className="flex items-baseline gap-2">
                                   <span className="text-4xl font-black text-white font-mono tracking-tighter">142</span>
                                   <span className="text-[10px] font-black text-pink-500 uppercase italic">@ 15:00</span>
                                </div>
                             </div>
                          </div>
                       </div>

                       <div className="bg-[#1e293b]/40 border border-slate-800 rounded-[3rem] p-10 space-y-10 shadow-2xl relative overflow-hidden">
                          <div className="flex items-center justify-between relative z-10">
                             <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl"><BarChart3 size={20}/></div>
                                <div>
                                   <h4 className="text-lg font-black text-white tracking-tight uppercase italic">今日人流活動趨勢 (24H)</h4>
                                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">每小時流量活動密度分布</span>
                                </div>
                             </div>
                             <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-600/40"></div><span className="text-[10px] font-black text-slate-500 uppercase">平均人流</span></div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]"></div><span className="text-[10px] font-black text-pink-500 uppercase italic">當前時段 (15:00)</span></div>
                             </div>
                          </div>

                          <div className="h-64 w-full flex items-end gap-[6px] px-4 relative z-10">
                             {[12, 8, 15, 42, 60, 35, 20, 18, 25, 30, 45, 80, 110, 125, 142, 130, 95, 70, 50, 35, 20, 15, 10, 5].map((val, idx) => {
                                const isCurrent = idx === 14; 
                                const height = (val / 160) * 100;
                                return (
                                  <div key={idx} className="flex-1 group/bar relative h-full flex flex-col justify-end">
                                     <div 
                                       className={`w-full rounded-t-lg transition-all duration-700 ${isCurrent ? 'bg-gradient-to-t from-pink-600 to-pink-400 shadow-[0_0_25px_rgba(236,72,153,0.4)]' : 'bg-blue-600/20 group-hover/bar:bg-blue-600/50'}`}
                                       style={{ height: `${height}%` }}
                                     ></div>
                                     <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[9px] font-black text-slate-600 group-hover/bar:text-slate-200 transition-colors uppercase">{idx < 10 ? `0${idx}` : idx}</div>
                                  </div>
                                );
                             })}
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                          <div className="space-y-6">
                             <div className="flex items-center gap-3">
                                <Trophy size={18} className="text-amber-500" />
                                <h4 className="text-sm font-black text-white uppercase tracking-widest">今日尖峰時段 TOP 3</h4>
                             </div>
                             <div className="space-y-4">
                                {[
                                  { rank: 1, time: '15:00 - 16:00', val: 142, trend: 'up' },
                                  { rank: 2, time: '16:00 - 17:00', val: 130, trend: 'down' },
                                  { rank: 3, time: '14:00 - 15:00', val: 125, trend: 'up' }
                                ].map((item, idx) => (
                                  <div key={idx} className="bg-black/30 border border-slate-800 p-6 rounded-[2rem] flex items-center justify-between hover:border-blue-500/50 transition-all group">
                                     <div className="flex items-center gap-6">
                                        <div className={`text-4xl font-black italic tracking-tighter ${idx === 0 ? 'text-blue-500' : 'text-slate-700'} opacity-50`}>0{item.rank}</div>
                                        <span className="text-lg font-black text-white font-mono italic">{item.time}</span>
                                     </div>
                                     <div className="text-right">
                                        <div className="flex items-center justify-end gap-2 text-blue-400 mb-1">
                                           <span className="text-2xl font-black font-mono">{item.val}</span>
                                           <span className="text-[10px] font-black uppercase">Pax</span>
                                        </div>
                                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[8px] font-black uppercase ${item.trend === 'up' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                           {item.trend === 'up' ? <ArrowUpRight size={10}/> : <TrendingDown size={10}/>}
                                           {item.trend === 'up' ? '比昨日上升 12%' : '比昨日下降 4%'}
                                        </div>
                                     </div>
                                  </div>
                                ))}
                             </div>
                          </div>
                          <div className="space-y-6">
                             <div className="flex items-center gap-3">
                                <LayoutGrid size={18} className="text-emerald-500" />
                                <h4 className="text-sm font-black text-white uppercase tracking-widest">今日設備入口流量排行</h4>
                             </div>
                             <div className="bg-black/30 border border-slate-800 rounded-[2.5rem] p-8 space-y-8 shadow-inner">
                                {[
                                  { name: '大門偵測點', val: 452, pct: 45, color: 'bg-blue-500' },
                                  { name: '後門偵測點', val: 284, pct: 28, color: 'bg-emerald-500' },
                                  { name: '側門A', val: 182, pct: 18, color: 'bg-purple-500' }
                                ].map((item, idx) => (
                                  <div key={idx} className="space-y-3">
                                     <div className="flex justify-between items-end">
                                        <span className="text-xs font-bold text-slate-300 uppercase tracking-tighter">{item.name}</span>
                                        <div className="flex items-baseline gap-2">
                                           <span className="text-sm font-black text-white font-mono">{item.val}</span>
                                           <span className="text-[10px] font-black text-slate-600 uppercase">{item.pct}%</span>
                                        </div>
                                     </div>
                                     <div className="h-2 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5">
                                        <div className={`h-full ${item.color} rounded-full transition-all duration-1000`} style={{ width: `${item.pct}%` }}></div>
                                     </div>
                                  </div>
                                ))}
                             </div>
                          </div>
                       </div>
                    </div>
                 )}

                 {/* --- 累計分析 --- */}
                 {activeDetailTab === 'site_cumulative_analysis' && (
                    <div className="flex flex-col gap-10 animate-in fade-in duration-500">
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <CumulativeCard icon={<CalendarDays size={32}/>} label="本月累計人流" value="32,480" unit="Pax" trend="up" trendVal="12.5%" trendLabel="MoM" color="blue" />
                          <CumulativeCard icon={<BarChart3 size={32}/>} label="本季累計人流" value="98,125" unit="Pax" trend="up" trendVal="8.2%" trendLabel="QoQ" color="emerald" />
                          <CumulativeCard icon={<Target size={32}/>} label="本年度累計" value="385,000" unit="Pax" trend="down" trendVal="2.1%" trendLabel="YoY" color="amber" />
                       </div>
                       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          <div className="lg:col-span-1 space-y-6">
                             <div className="bg-[#1e293b]/40 border border-slate-800 rounded-[2.5rem] p-8 space-y-8 h-full shadow-xl">
                                <h4 className="text-sm font-black text-white uppercase tracking-widest border-b border-white/5 pb-4">平均運營指標 (AVG)</h4>
                                <div className="space-y-8">
                                   <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-4">
                                         <div className="p-3 bg-blue-600/10 text-blue-500 rounded-2xl"><Clock size={20}/></div>
                                         <div className="flex flex-col"><span className="text-[10px] font-black text-slate-500 uppercase">每日平均人流</span><span className="text-xl font-black text-white font-mono">1,082</span></div>
                                      </div>
                                      <span className="text-[10px] font-black text-green-500 bg-green-500/10 px-2 py-1 rounded">穩健</span>
                                   </div>
                                   <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-4">
                                         <div className="p-3 bg-purple-600/10 text-purple-500 rounded-2xl"><CalendarDays size={20}/></div>
                                         <div className="flex flex-col"><span className="text-[10px] font-black text-slate-500 uppercase">每週平均人流</span><span className="text-xl font-black text-white font-mono">7,580</span></div>
                                      </div>
                                      <span className="text-[10px] font-black text-red-400 bg-red-400/10 px-2 py-1 rounded">接近極限</span>
                                   </div>
                                </div>
                             </div>
                          </div>
                          <div className="lg:col-span-2 bg-[#1e293b]/40 border border-slate-800 rounded-[2.5rem] p-10 space-y-10 shadow-2xl relative overflow-hidden">
                             <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-4"><div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl"><TrendingUpIcon size={20}/></div><div><h4 className="text-lg font-black text-white tracking-tight uppercase italic">年度累計流量對比 (2025 vs 2024)</h4><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">逐月累積曲線分佈</span></div></div>
                                <div className="flex gap-4"><div className="flex items-center gap-2"><div className="w-3 h-0.5 bg-slate-600 border border-dashed border-slate-500"></div><span className="text-[10px] font-black text-slate-500">2024 (去年)</span></div><div className="flex items-center gap-2"><div className="w-3 h-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div><span className="text-[10px] font-black text-blue-500">2025 (今年)</span></div></div>
                             </div>
                             <div className="h-64 w-full flex items-end gap-[8px] px-2 relative z-10">
                                {[15, 28, 45, 60, 85, 110, 140, 180, 220, 260, 310, 385].map((val, idx) => {
                                   const prevVal = [12, 25, 40, 58, 80, 105, 130, 165, 205, 245, 290, 340][idx];
                                   const height = (val / 400) * 100;
                                   const prevHeight = (prevVal / 400) * 100;
                                   return (
                                     <div key={idx} className="flex-1 group/bar relative h-full flex items-end justify-center">
                                        <div className="w-full rounded-t-lg transition-all duration-700 bg-gradient-to-t from-blue-900/50 to-blue-500 shadow-xl group-hover/bar:from-blue-600 group-hover/bar:to-blue-400" style={{ height: `${height}%` }}></div>
                                        <div className="absolute w-full border-t-2 border-dashed border-slate-700 z-20 pointer-events-none" style={{ bottom: `${prevHeight}%` }}></div>
                                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[9px] font-black text-slate-600 uppercase">{idx+1}月</div>
                                     </div>
                                   );
                                })}
                             </div>
                          </div>
                       </div>
                    </div>
                 )}

                 {/* --- 時段比較 (Overlay Comparison) --- */}
                 {activeDetailTab === 'site_time_comparison' && (
                    <div className="flex flex-col gap-8 animate-in fade-in duration-500 h-full">
                       
                       {/* 顆粒度與控制項 */}
                       <div className="flex items-center justify-between bg-black/20 p-6 rounded-[2.5rem] border border-slate-800 shrink-0 shadow-lg">
                          <div className="flex items-center gap-2 p-1 bg-[#050914] border border-slate-800 rounded-2xl">
                             {[
                               { id: 'day', label: '日比較' },
                               { id: 'week', label: '週比較' },
                               { id: 'month', label: '月比較' },
                               { id: 'quarter', label: '季比較' },
                               { id: 'year', label: '年比較' }
                             ].map(type => (
                               <button 
                                 key={type.id}
                                 onClick={() => setComparisonType(type.id as any)}
                                 className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${comparisonType === type.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-500 hover:text-slate-300'}`}
                               >
                                 {type.label}
                               </button>
                             ))}
                          </div>
                          
                          <div className="flex items-center gap-4">
                             <div className="flex items-center gap-3 px-5 py-2.5 bg-slate-900 border border-slate-700 rounded-2xl text-xs font-bold text-slate-300 cursor-pointer hover:bg-slate-800 transition-colors">
                                <CalendarRange size={16} className="text-blue-500" />
                                <span>選取對比範圍</span>
                                <ChevronDownIcon size={14} className="text-slate-600" />
                             </div>
                             <button className="p-2.5 bg-blue-600/10 text-blue-500 rounded-xl border border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all"><RefreshCw size={18}/></button>
                          </div>
                       </div>

                       <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 min-h-0">
                          
                          {/* 左側：對比摘要 */}
                          <div className="lg:col-span-1 space-y-6">
                             <div className="bg-[#1e293b]/40 border border-slate-800 rounded-[2.5rem] p-8 space-y-10 shadow-xl">
                                <div className="space-y-4">
                                   <div className="flex items-center gap-3 text-blue-400">
                                      <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                                      <span className="text-[10px] font-black uppercase tracking-widest">時段 A (基準)</span>
                                   </div>
                                   <div className="flex flex-col">
                                      <span className="text-lg font-black text-white italic">2025-12-18 (四)</span>
                                      <span className="text-2xl font-black text-slate-400 font-mono">1,248 <span className="text-[10px] uppercase">Pax</span></span>
                                   </div>
                                </div>

                                <div className="flex justify-center"><ArrowRightLeft size={24} className="text-slate-700 rotate-90" /></div>

                                <div className="space-y-4">
                                   <div className="flex items-center gap-3 text-purple-400">
                                      <div className="w-3 h-3 rounded-full border-2 border-purple-500 bg-transparent"></div>
                                      <span className="text-[10px] font-black uppercase tracking-widest">時段 B (對比)</span>
                                   </div>
                                   <div className="flex flex-col">
                                      <span className="text-lg font-black text-white italic">2024-12-18 (三)</span>
                                      <span className="text-2xl font-black text-slate-400 font-mono">1,112 <span className="text-[10px] uppercase">Pax</span></span>
                                   </div>
                                </div>

                                <div className="pt-8 border-t border-white/5 space-y-4">
                                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">總體差異 analysis</span>
                                   <div className="flex items-center gap-3">
                                      <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl"><TrendingUp size={24}/></div>
                                      <div>
                                         <span className="text-3xl font-black text-emerald-400 font-mono">+12.2%</span>
                                         <p className="text-[9px] font-bold text-slate-500 uppercase">YoY 成長幅度</p>
                                      </div>
                                   </div>
                                </div>
                             </div>
                          </div>

                          {/* 右側：疊圖曲線圖 */}
                          <div className="lg:col-span-3 bg-[#1e293b]/40 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl relative flex flex-col">
                             <div className="flex items-center justify-between mb-10 shrink-0">
                                <div className="flex items-center gap-4">
                                   <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl"><Layers size={20}/></div>
                                   <div>
                                      <h4 className="text-lg font-black text-white tracking-tight uppercase italic">多時段活動疊圖 (Overlay)</h4>
                                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">分析高峰偏移與成長原因</span>
                                   </div>
                                </div>
                                <div className="flex gap-6">
                                   <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span className="text-[10px] font-black text-slate-400 uppercase">2025 (本年度)</span></div>
                                   <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border-2 border-purple-500"></div><span className="text-[10px] font-black text-slate-400 uppercase">2024 (去年度)</span></div>
                                </div>
                             </div>

                             <div className="flex-1 relative min-h-[300px]">
                                {/* 模擬 SVG 曲線疊圖 */}
                                <svg className="w-full h-full" viewBox="0 0 1000 400" preserveAspectRatio="none">
                                   {/* 網格線 */}
                                   {Array.from({length: 5}).map((_, i) => (
                                     <line key={i} x1="0" y1={i * 100} x2="1000" y2={i * 100} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                                   ))}
                                   
                                   {/* 2024 曲線 (紫色) */}
                                   <path 
                                     d="M0,350 Q100,320 200,340 T400,280 T600,200 T800,250 T1000,320" 
                                     fill="none" stroke="#a855f7" strokeWidth="3" strokeDasharray="8,5" opacity="0.6"
                                   />
                                   
                                   {/* 2025 曲線 (藍色) */}
                                   <path 
                                     d="M0,340 Q100,300 200,310 T400,220 T600,120 T800,180 T1000,300" 
                                     fill="url(#gradient-blue-overlay)" stroke="#3b82f6" strokeWidth="4"
                                   />

                                   {/* 標註點 */}
                                   <circle cx="600" cy="120" r="6" fill="#3b82f6" className="animate-pulse shadow-2xl" />
                                   
                                   <defs>
                                      <linearGradient id="gradient-blue-overlay" x1="0%" y1="0%" x2="0%" y2="100%">
                                         <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                                         <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                      </linearGradient>
                                   </defs>
                                </svg>
                                
                                {/* 數據點資訊彈窗 (模擬) */}
                                <div className="absolute top-[80px] left-[610px] bg-blue-600 text-white p-3 rounded-xl shadow-2xl z-20 animate-in zoom-in-95">
                                   <div className="text-[8px] font-black uppercase mb-1">高峰差異對比</div>
                                   <div className="flex items-center gap-3">
                                      <span className="text-lg font-black font-mono">+32%</span>
                                      <span className="text-[10px] opacity-70">15:00 時段</span>
                                   </div>
                                </div>

                                <div className="absolute bottom-0 w-full flex justify-between px-2 text-[10px] font-black text-slate-700 uppercase tracking-widest">
                                   <span>06:00</span><span>10:00</span><span>14:00</span><span>18:00</span><span>22:00</span><span>02:00</span>
                                </div>
                             </div>

                             <div className="mt-10 p-6 bg-blue-600/5 border border-dashed border-blue-500/20 rounded-3xl flex items-center gap-6 shrink-0">
                                <div className="p-3 bg-blue-600/10 text-blue-500 rounded-2xl"><Zap size={20}/></div>
                                <div>
                                   <h5 className="text-sm font-black text-white italic">AI 時段洞察：高峰偏移偵測</h5>
                                   <p className="text-[11px] text-slate-500 leading-tight mt-1">相較於 2024 年，今年度據點的高峰活動時段延後了約 45 分鐘，且在 15:00 ~ 17:00 間展現出更強的活動持續性。</p>
                                </div>
                             </div>
                          </div>
                       </div>

                    </div>
                 )}

                 {activeDetailTab === 'site_device_comparison' && (
                    <div className="flex flex-col items-center justify-center h-full opacity-40 animate-in fade-in">
                       <Monitor size={64} className="mb-4" />
                       <h3 className="text-xl font-black uppercase italic text-white">設備效能比較載入中...</h3>
                    </div>
                 )}

                 {activeDetailTab === 'site_behavior_profile' && (
                    <div className="flex flex-col items-center justify-center h-full opacity-40 animate-in fade-in">
                       <User size={64} className="mb-4" />
                       <h3 className="text-xl font-black uppercase italic text-white">行為輪廓特徵分析中...</h3>
                    </div>
                 )}

                 {activeDetailTab === 'site_structural_metrics' && (
                    <div className="flex flex-col items-center justify-center h-full opacity-40 animate-in fade-in">
                       <Layers size={64} className="mb-4" />
                       <h3 className="text-xl font-black uppercase italic text-white">結構指標數據計算中...</h3>
                    </div>
                 )}

                 {/* --- 設備原有 Tab 內容 --- */}
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
                       <div className="space-y-6">
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-4">人流活動密度分析 (每小時)</span>
                          <div className="h-64 bg-black/40 border border-slate-800 rounded-[2.5rem] flex items-end justify-between p-10 gap-2 shadow-inner">
                             {[0.1, 0.2, 0.4, 0.7, 0.6, 0.3, 0.2, 0.3, 0.4, 0.5, 0.8, 0.9, 1.0, 0.9, 0.7, 0.5, 0.4, 0.3, 0.2].map((v, i) => (
                               <div key={i} className="flex-1 bg-gradient-to-t from-blue-900/50 via-blue-600/50 to-blue-400 rounded-t-lg transition-all hover:scale-110 relative group/bar" style={{ height: `${v * 100}%` }}>
                                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap shadow-xl">{(v*70).toFixed(0)} Pax</div>
                               </div>
                             ))}
                          </div>
                          <div className="flex justify-between text-[10px] font-black text-slate-700 px-12 uppercase tracking-widest">
                             <span>06:00</span><span>12:00</span><span>18:00</span><span>00:00</span>
                          </div>
                       </div>
                    </div>
                 )}

                 {activeDetailTab === 'trigger_logs' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                       <h4 className="text-sm font-black text-blue-500 uppercase tracking-widest">設備專屬觸發歷史</h4>
                       <div className="space-y-3">
                          {[
                            { time: '17:05:22', event: '偵測人員活動密度增加', status: '自動結案' },
                            { time: '16:42:15', event: '觸發人流進出告警', status: '管理員檢視' },
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
                               { name: `人流高密度告警`, role: '觸發源 (Trigger)', desc: '當此據點總人流超過 100 人時，自動通知區域主管', icon: <Zap size={18}/> },
                               { name: '夜間能源節約', role: '連動項 (Action)', desc: '據點偵測為零人流超過 30 分鐘，自動關閉公共區照明', icon: <Sun size={18}/> }
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
                          <h5 className="text-xl font-black text-white italic">據點自動化規則庫</h5>
                          <button onClick={() => { setDetailModalSlot(null); onJumpToNav?.('event-center'); }} className="px-10 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all active:scale-95 shadow-xl">進入規則編輯 <ExternalLink size={16}/></button>
                       </div>
                    </div>
                 )}

                 {activeDetailTab === 'security_info' && (
                    <div className="grid grid-cols-2 gap-10 animate-in fade-in duration-500">
                       <div className="space-y-8">
                          <h4 className="text-sm font-black text-blue-500 uppercase tracking-widest">據點安防狀態綜觀</h4>
                          <div className="bg-[#1e293b]/40 border border-slate-800 rounded-3xl p-8 space-y-6">
                             <div className="flex justify-between items-center"><span className="text-slate-500 text-xs font-bold">當前安防狀態</span><span className="text-green-500 font-black text-sm px-3 py-1 bg-green-500/10 rounded-lg border border-green-500/20">正常執行 (Active)</span></div>
                             <div className="h-px bg-white/5"></div>
                             <div className="space-y-4">
                                <span className="block text-[10px] text-slate-600 font-black uppercase">最近安防事件</span>
                                <div className="flex items-center gap-3 bg-black/20 p-4 rounded-2xl border border-white/5">
                                   <Shield size={20} className="text-blue-400" />
                                   <div className="flex flex-col"><span className="text-xs font-bold text-slate-200">全區佈防成功</span><span className="text-[10px] text-slate-500">12/18 22:00 • 系統自動</span></div>
                                </div>
                             </div>
                          </div>
                       </div>
                       <div className="flex flex-col items-center justify-center p-12 bg-blue-600/5 border border-dashed border-purple-500/20 rounded-[3rem] text-center gap-6">
                          <Shield size={64} className="text-blue-500/50" />
                          <button onClick={() => { setDetailModalSlot(null); onJumpToNav?.('security-center'); }} className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 active:scale-95 shadow-xl">跳轉安防狀態 <ExternalLink size={16}/></button>
                       </div>
                    </div>
                 )}

                 {activeDetailTab === 'device_info' && (
                    <div className="grid grid-cols-2 gap-10 animate-in fade-in duration-500">
                       <div className="flex flex-col gap-8">
                         <div className="bg-[#1e293b]/40 border border-slate-800 rounded-[2.5rem] p-8 space-y-8">
                            <h4 className="text-sm font-black text-blue-500 uppercase tracking-widest border-b border-white/5 pb-4">據點基礎架構</h4>
                            <div className="grid grid-cols-2 gap-y-8 gap-x-10">
                               <InfoItem label="連線節點數" value="12 Nodes" />
                               <InfoItem label="通訊主機" value="3 Units" />
                               <InfoItem label="供電狀態" value="正常 (UPS 100%)" />
                               <InfoItem label="網路頻寬" value="850 Mbps" />
                            </div>
                         </div>
                       </div>
                       <div className="flex flex-col items-center justify-center p-12 bg-slate-800/30 border border-dashed border-slate-700 rounded-[3rem] text-center gap-6">
                          <Cpu size={64} className="text-slate-600" />
                          <button onClick={() => { setDetailModalSlot(null); onJumpToNav?.('device-center'); }} className="px-10 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 active:scale-95 shadow-xl">跳轉設備清單 <ExternalLink size={16}/></button>
                       </div>
                    </div>
                 )}

              </div>

              <div className="p-8 bg-[#0b1121] border-t border-slate-800 flex justify-end shrink-0 gap-5">
                 <button onClick={() => setDetailModalSlot(null)} className="px-14 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl transition-all active:scale-95 ring-1 ring-white/10">關閉綜觀面板</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

// --- Helper Components for IoT Modal ---

const CumulativeCard: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  unit: string; 
  trend: 'up' | 'down'; 
  trendVal: string; 
  trendLabel: string;
  color: 'blue' | 'emerald' | 'amber';
}> = ({ icon, label, value, unit, trend, trendVal, trendLabel, color }) => {
  const colorMap = {
    blue: 'text-blue-500 bg-blue-600/10 border-blue-500/30',
    emerald: 'text-emerald-500 bg-emerald-600/10 border-emerald-500/30',
    amber: 'text-amber-500 bg-amber-600/10 border-amber-500/30'
  };

  return (
    <div className="bg-[#1e293b]/40 border border-slate-800 p-8 rounded-[2.5rem] flex flex-col gap-6 group hover:border-slate-600 transition-all shadow-xl relative overflow-hidden">
       <div className="flex items-center justify-between relative z-10">
          <div className={`p-4 rounded-2xl ${colorMap[color].split(' ')[1]} ${colorMap[color].split(' ')[0]}`}>{icon}</div>
          <div className={`flex flex-col items-end gap-1`}>
             <div className={`flex items-center gap-1 text-[11px] font-black uppercase ${trend === 'up' ? 'text-red-500' : 'text-blue-500'}`}>
                {trend === 'up' ? <TrendingUpIcon size={14}/> : <TrendingDownIcon size={14}/>}
                {trendVal}
             </div>
             <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{trendLabel} Growth</span>
          </div>
       </div>
       <div className="relative z-10">
          <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</span>
          <div className="flex items-baseline gap-2">
             <span className="text-4xl font-black text-white font-mono tracking-tighter">{value}</span>
             <span className="text-[10px] font-black text-slate-500 uppercase italic">{unit}</span>
          </div>
       </div>
       <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-5 blur-3xl ${colorMap[color].split(' ')[1]}`}></div>
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