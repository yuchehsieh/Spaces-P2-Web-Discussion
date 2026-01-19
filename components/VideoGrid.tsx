import React, { useState, useMemo, useEffect } from 'react';
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
  ChevronLeft,
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
  RefreshCw,
  UserSearch,
  CheckCircle2,
  Settings2,
  Download,
  CheckSquare,
  Square as SquareIcon,
  ChevronDown,
  Loader2,
  Crosshair
} from 'lucide-react';

// --- Import Site Specific Tabs ---
import SiteDailyOverview from './SiteDailyOverview';
import SiteCumulativeAnalysis from './SiteCumulativeAnalysis';
import SiteTimeComparison from './SiteTimeComparison';
import SiteDeviceComparison from './SiteDeviceComparison';
import SiteBehaviorProfile from './SiteBehaviorProfile';

// --- Import Device Specific Tabs ---
import SecurityInfo from './SecurityInfo';
import ScenarioInfo from './ScenarioInfo';
import DeviceInfo from './DeviceInfo';
import HistoricalTrends from './HistoricalTrends';
import SpaceFlowTrends from './SpaceFlowTrends';
import SpaceHeatTrends from './SpaceHeatTrends';
import SpaceCoordinateMap from './SpaceCoordinateMap';
import TriggerHistory from './TriggerHistory';

import { SITE_TREE_DATA } from '../constants';
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

// 統一且高對比的橘色系比例尺
const HEATMAP_SCALE = [
  { range: '0', hex: '#334155', label: '0人' },
  { range: '1-2', hex: '#fdba74', label: '1-2人' },
  { range: '3-4', hex: '#f97316', label: '3-4人' },
  { range: '5-6', hex: '#ea580c', label: '5-6人' },
  { range: '7-8', hex: '#c2410c', label: '7-8人' },
  { range: '8+', hex: '#9a3412', label: '8人以上' },
];

interface VideoGridProps {
  gridSize: GridSize;
  activeSlots: Record<number, VideoSlotData>;
  onDropCamera: (index: number, camera: { id: string; label: string; deviceType?: string; nodeType?: string; siteGroup?: string; siteName?: string }) => void;
  onRemoveCamera: (index: number) => void;
  onMoveCamera?: (fromIndex: number, toIndex: number) => void; 
  onToggleRecording: (index: number) => void;
  onJumpToNav?: (nav: MainNavType, subTab?: string) => void;
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

  const [confirmedStatsDevices, setConfirmedStatsDevices] = useState<Set<string>>(new Set()); 
  const [pendingStatsDevices, setPendingStatsDevices] = useState<Set<string>>(new Set());     
  const [isRecalculating, setIsRecalculating] = useState(false);                             
  
  const [exportTabs, setExportTabs] = useState<Set<string>>(new Set(['daily', 'cumulative', 'comparison', 'device', 'behavior']));
  const [isExporting, setIsExporting] = useState(false);

  const eligibleStatsDevices = useMemo(() => {
    if (!detailModalSlot || detailModalSlot.nodeType !== 'site') return [];
    const devices: SiteNode[] = [];
    const findNode = (nodes: SiteNode[], targetId: string): SiteNode | null => {
      for (const n of nodes) {
        if (n.id === targetId) return n;
        if (n.children) {
          const res = findNode(n.children, targetId);
          if (res) return res;
        }
      }
      return null;
    };
    const traverseForEligible = (node: SiteNode) => {
      if (node.type === 'device' && node.label.includes('空間偵測器') && node.label.includes('人流')) {
        devices.push(node);
      }
      node.children?.forEach(traverseForEligible);
    };
    const siteNode = findNode(SITE_TREE_DATA, detailModalSlot.id);
    if (siteNode) traverseForEligible(siteNode);
    return devices;
  }, [detailModalSlot]);

  useEffect(() => {
    if (detailModalSlot?.nodeType === 'site' && eligibleStatsDevices.length > 0) {
      const allIds = eligibleStatsDevices.map(d => d.id);
      const initialSelection = new Set(allIds);
      setConfirmedStatsDevices(initialSelection);
      setPendingStatsDevices(initialSelection);
    }
  }, [detailModalSlot?.id, eligibleStatsDevices]);

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
    if (detailModalSlot.nodeType === 'site') {
       return [
          { id: 'site_daily_overview', label: '當日人流總覽', icon: <LayoutList size={14}/> },
          { id: 'site_cumulative_analysis', label: '歷史累計趨勢', icon: <BarChart3 size={14}/> },
          { id: 'site_time_comparison', label: '多時段對比分析', icon: <ArrowLeftRight size={14}/> },
          { id: 'site_device_comparison', label: '入口貢獻排行', icon: <Monitor size={14}/> },
          { id: 'site_behavior_profile', label: '行為輪廓特徵', icon: <User size={14}/> }
       ];
    }
    const tabs = [];
    
    // 新增：特定設備的「觸發紀錄」分頁
    const hasTriggerHistory = ['多功能按鈕', '門磁', 'PIR', 'SOS'].some(kw => detailModalSlot.label.includes(kw));
    if (hasTriggerHistory) {
      tabs.push({ id: 'trigger_history', label: '觸發紀錄', icon: <HistoryIcon size={14}/> });
    }

    // 空間偵測器專屬：座標圖
    if (detailModalSlot.label.includes('空間偵測器')) {
        tabs.push({ id: 'coordinate_map', label: '座標圖', icon: <Crosshair size={14}/> });
    }

    // 歷史趨勢
    if (detailModalSlot.label.includes('環境偵測器')) {
        tabs.push({ id: 'historical_trends', label: '歷史趨勢', icon: <TrendingUp size={14}/> });
    } else if (detailModalSlot.label.includes('空間偵測器')) {
        tabs.push({ id: 'space_trends', label: '歷史趨勢', icon: <TrendingUp size={14}/> });
    }
    
    tabs.push(
      { id: 'security_info', label: '保全資訊', icon: <Shield size={14}/> },
      { id: 'scenario_info', label: '情境資訊', icon: <Zap size={14}/> },
      { id: 'device_info', label: '設備資訊', icon: <Cpu size={14}/> }
    );
    return tabs;
  }, [detailModalSlot]);

  const openModal = (slot: VideoSlotData) => {
    setDetailModalSlot(slot);
    // 更新預設顯示分頁邏輯
    if (slot.nodeType === 'site') {
      setActiveDetailTab('site_daily_overview');
    } else {
      const isTriggerType = ['多功能按鈕', '門磁', 'PIR', 'SOS'].some(kw => slot.label.includes(kw));
      if (isTriggerType) {
        setActiveDetailTab('trigger_history');
      } else if (slot.label.includes('空間偵測器')) {
        setActiveDetailTab('coordinate_map');
      } else if (slot.label.includes('環境偵測器')) {
        setActiveDetailTab('historical_trends');
      } else {
        setActiveDetailTab('security_info');
      }
    }
  };

  const togglePendingDevice = (id: string) => {
    const next = new Set(pendingStatsDevices);
    if (next.has(id)) next.delete(id); else next.add(id);
    setPendingStatsDevices(next);
  };

  const applyStatsDeviceSelection = () => {
    setIsRecalculating(true);
    setTimeout(() => {
      setConfirmedStatsDevices(new Set(pendingStatsDevices));
      setIsRecalculating(false);
    }, 1200);
  };

  const toggleExportTab = (tabId: string) => {
    const next = new Set(exportTabs);
    if (next.has(tabId)) next.delete(tabId); else next.add(tabId);
    setExportTabs(next);
  };

  const handleExport = () => {
    if (exportTabs.size === 0) {
      alert("請至少選擇一個分析項進行匯出");
      return;
    }
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert("數據報告匯出成功！檔案已準備下載。");
    }, 1500);
  };

  const isStatsChanged = useMemo(() => {
    if (confirmedStatsDevices.size !== pendingStatsDevices.size) return true;
    for (let id of Array.from(confirmedStatsDevices)) {
      if (!pendingStatsDevices.has(id)) return true;
    }
    return false;
  }, [confirmedStatsDevices, pendingStatsDevices]);

  const handleJumpToSecurity = () => {
    setDetailModalSlot(null);
    onJumpToNav?.('event-center', 'security-schedule');
  };

  const handleJumpToScenario = () => {
    setDetailModalSlot(null);
    onJumpToNav?.('event-center', 'settings');
  };

  const handleJumpToDeviceCenter = () => {
    setDetailModalSlot(null);
    onJumpToNav?.('device-center');
  };

  const renderDeviceCard = (data: VideoSlotData) => {
    const isSmall = gridSize >= 9;
    const isTiny = gridSize === 16;

    if (data.label.includes('空間偵測器') && data.label.includes('人流')) {
      const mockCount = 12; 
      return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-[#0a0f1e] p-6 pb-20 relative overflow-hidden group">
          <div className="absolute top-10 left-1/2 -translate-x-1/2">
             <div className="px-5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center">
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">模式：人流進出</span>
             </div>
          </div>
          <div className="flex flex-col items-center gap-6 mt-4">
             <div className="relative">
                <div className={`${isSmall ? 'w-24 h-24' : 'w-36 h-36'} rounded-full border-2 border-emerald-500/10 flex items-center justify-center bg-emerald-500/5 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]`}>
                   <Users size={isSmall ? 40 : 64} className="text-emerald-400 opacity-90" />
                </div>
                <div className={`absolute bottom-0 right-0 ${isSmall ? 'px-2 py-1' : 'px-4 py-2'} bg-emerald-500 rounded-xl shadow-2xl border border-emerald-400 transform translate-x-2 translate-y-2 animate-in zoom-in duration-500`}>
                   <span className={`${isSmall ? 'text-lg' : 'text-3xl'} font-black text-white font-mono tracking-tighter`}>{mockCount}</span>
                </div>
             </div>
             <h4 className={`${isSmall ? 'text-xl' : 'text-4xl'} font-black text-white italic tracking-tighter uppercase mt-4`}>空間人數</h4>
          </div>
        </div>
      );
    }

    if (data.label.includes('空間偵測器') && data.label.includes('熱度')) {
      const currentLevel = 2; 
      const currentHeat = HEATMAP_SCALE[currentLevel];
      return (
        <div className={`flex h-full w-full bg-[#0a0f1e] relative overflow-hidden transition-all duration-500 ${isSmall ? 'p-3' : 'p-6'} flex-col items-center justify-center`}>
           <div className="flex flex-col items-center justify-center w-full">
              <div className="mb-8">
                 <div className="px-5 py-1.5 bg-orange-500/10 border border-orange-500/30 rounded-full flex items-center justify-center shadow-inner">
                    <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">模式：空間熱度</span>
                 </div>
              </div>

              <div className="flex w-full items-center justify-center gap-10">
                 <div className="flex flex-col items-center gap-6">
                    <div className="relative group/heat">
                       <div 
                         className={`rounded-full border-4 border-white/20 transition-all duration-1000 shadow-2xl ${isSmall ? 'w-24 h-24' : 'w-40 h-40'}`}
                         style={{ 
                            backgroundColor: currentHeat.hex,
                            boxShadow: `0 0 60px ${currentHeat.hex}66, inset 0 0 30px rgba(255,255,255,0.1)` 
                         }}
                       />
                       <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className={`${isSmall ? 'text-xl' : 'text-4xl'} font-black text-white italic tracking-tighter font-mono drop-shadow-lg`}>{currentHeat.range}</span>
                          {!isTiny && <span className="text-[9px] font-black text-white/60 uppercase tracking-[0.2em] mt-1">PAX</span>}
                       </div>
                    </div>
                    <div className="text-center">
                       <h4 className={`${isSmall ? 'text-xs' : 'text-xl'} font-black text-white italic tracking-tighter uppercase`}>區域狀態：{currentHeat.label}</h4>
                    </div>
                 </div>

                 {!isTiny && (
                   <div className="w-16 border-l border-white/10 flex flex-col justify-between py-1 pl-6 shrink-0 h-44">
                      {HEATMAP_SCALE.slice().reverse().map((item, idx) => {
                        const isCurrent = item.range === currentHeat.range;
                        return (
                          <div key={idx} className={`w-full flex items-center gap-3 group/mark transition-all ${isCurrent ? 'scale-110 translate-x-1' : 'opacity-40'}`}>
                             <div 
                               className={`w-3.5 h-3.5 rounded-sm shadow-[0_0_10px_rgba(0,0,0,0.5)] border border-white/20 ${isCurrent ? 'ring-2 ring-white shadow-[0_0_15px_rgba(255,255,255,0.4)]' : ''}`}
                               style={{ backgroundColor: item.hex }}
                             />
                             {!isSmall && (
                               <span className={`text-[10px] font-black tracking-tighter whitespace-nowrap ${isCurrent ? 'text-white' : 'text-slate-500'}`}>
                                 {item.range} PAX
                               </span>
                             )}
                          </div>
                        );
                      })}
                   </div>
                 )}
              </div>
           </div>
        </div>
      );
    }

    if (data.nodeType === 'site') {
      const currentHour = 15; // 固定在 15 點以符合附件圖片
      const avgData = [5, 3, 2, 4, 10, 25, 45, 70, 85, 60, 55, 62, 65, 58, 55, 55, 95, 105, 98, 75, 45, 30, 15, 8];
      const realTimeVal = 70; // 當前狀態
      const avgValForCurrentHour = avgData[currentHour]; // 平均狀態 (55)
      const isBusierThanAvg = realTimeVal > avgValForCurrentHour;
      const busierPct = Math.round(((realTimeVal - avgValForCurrentHour) / avgValForCurrentHour) * 100);

      return (
        <div className={`flex flex-col h-full w-full bg-[#0a0f1e] text-slate-200 ${isSmall ? 'p-3' : 'p-6'} justify-between transition-all duration-500 relative overflow-hidden group`}>
           <div className="flex items-center gap-2 shrink-0">
              <div className="p-2 bg-blue-600/10 text-blue-400 rounded-lg"><Building2 size={isSmall ? 14 : 18}/></div>
              <span className={`${isSmall ? 'text-[10px]' : 'text-sm'} font-black italic tracking-tighter uppercase truncate`}>{data.label} (SITE)</span>
           </div>
           
           <div className="flex-1 flex flex-col items-center justify-center -mt-4">
              <div className="flex items-center gap-2 mb-4 animate-in fade-in slide-in-from-bottom-1 duration-700">
                 <div className="px-2 py-0.5 bg-red-600 text-white text-[9px] font-black rounded border border-red-500 shadow-lg shadow-red-900/20">即時資料</div>
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{isBusierThanAvg ? '略為繁忙' : '人流平穩'}</span>
              </div>
              <div className="relative">
                 <div className={`${isSmall ? 'w-24 h-24 border-2' : 'w-32 h-32 border-4'} rounded-full border-blue-500/10 flex flex-col items-center justify-center relative shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]`}>
                    <span className={`${isSmall ? 'text-3xl' : 'text-5xl'} font-black text-white font-mono tracking-tighter`}>{realTimeVal}</span>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest -mt-1">PEOPLE TOTAL</span>
                 </div>
                 <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-blue-900/40 animate-pulse border border-blue-400">
                    <TrendingUp size={16} />
                 </div>
              </div>
           </div>

           <div className="space-y-3 shrink-0">
              <div className={`h-12 w-full flex items-end gap-[4px] ${isSmall ? 'px-2' : 'px-4'}`}>
                 {avgData.map((val, idx) => {
                    const isCurrent = idx === currentHour;
                    const maxPossible = 110;
                    const avgHeight = (val / maxPossible) * 100;
                    const realHeight = (realTimeVal / maxPossible) * 100;
                    
                    return (
                      <div key={idx} className="flex-1 group/bar relative h-full flex flex-col justify-end">
                         {isCurrent ? (
                           <div className="w-full relative h-full flex flex-col justify-end">
                              {/* 歷史平均：灰色柱狀 (依照附件二) */}
                              <div className="absolute bottom-0 w-full bg-slate-700/60 rounded-t-sm" style={{ height: `${avgHeight}%` }}></div>
                              {/* 當前狀態：粉色柱狀 (依照附件二) */}
                              <div className="relative w-full bg-[#ff70a0] rounded-t-sm shadow-[0_0_10px_rgba(255,112,160,0.4)]" style={{ height: `${realHeight}%` }}></div>
                           </div>
                         ) : (
                           // 非當前時段：顯示深藍色平均柱狀 (依照附件一)
                           <div className="w-full rounded-t-sm transition-all duration-500 bg-[#162a5c]" style={{ height: `${avgHeight}%` }}></div>
                         )}
                      </div>
                    );
                 })}
              </div>
              
              <div className="flex justify-between items-end border-t border-white/5 pt-3">
                 <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1 text-[8px] font-black text-blue-500 uppercase tracking-[0.2em]">
                       <MapPin size={8}/> {data.siteGroup} > {data.siteName}
                    </div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{data.label} (SITE)</div>
                 </div>
                 {!isTiny && (
                    <div className={`text-[10px] font-black ${isBusierThanAvg ? 'text-red-500' : 'text-emerald-500'} italic flex items-center gap-1`}>
                       {isBusierThanAvg ? <><ArrowUpRight size={12}/> 較平均多 {busierPct}%</> : '▼ 較平均少 8%'}
                    </div>
                 )}
              </div>
           </div>
        </div>
      );
    }

    if (data.label === '環境偵測器') {
      const metrics = [
        { icon: <Thermometer size={14} className="text-orange-400"/>, label: "溫度", value: "24.5", unit: "°C", color: "text-orange-400" },
        { icon: <Droplets size={14} className="text-blue-400"/>, label: "濕度", value: "55", unit: "%", color: "text-blue-400" },
        { icon: <Sun size={14} className="text-amber-400"/>, label: "光照", value: "明亮", unit: "(420 LUX)", color: "text-amber-400" },
        { icon: <Waves size={14} className="text-emerald-400"/>, label: "水浸(正)", value: "正常", color: "text-emerald-400" },
        { icon: <Waves size={14} className="text-emerald-400"/>, label: "水浸(背)", value: "正常", color: "text-emerald-400" },
        { icon: <Plug2 size={14} className="text-blue-400"/>, label: "外接：溫度", value: "26.1", unit: "°C", color: "text-blue-400" },
        { icon: <Mic size={14} className="text-emerald-400"/>, label: "警報音辨識", value: "正常", color: "text-emerald-400" }
      ];
      return (
        <div className={`flex flex-col h-full w-full bg-[#0a0f1e] ${isSmall ? 'p-2' : 'p-4'} pb-12`}>
          <div className="grid grid-cols-2 gap-2 flex-1 content-start">
             {metrics.map((m, idx) => {
               const isFullWidth = idx === metrics.length - 1 && metrics.length % 2 !== 0;
               return (
                 <div key={idx} className={`bg-white/5 border border-white/5 rounded-xl p-2.5 flex flex-col justify-between hover:bg-white/10 transition-colors ${isFullWidth ? 'col-span-2' : ''}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {m.icon}
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter truncate">{m.label}</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-sm font-black ${m.color}`}>{m.value}</span>
                      {m.unit && <span className={`text-[8px] font-bold ${m.color} opacity-60 uppercase`}>{m.unit}</span>}
                    </div>
                 </div>
               );
             })}
          </div>
        </div>
      );
    }

    const isTriggeredDevice = ['多功能按鈕', 'PIR', '門磁', '緊急按鈕', 'SOS按鈕', 'SOS'].includes(data.label);
    if (isTriggeredDevice) {
      const isTriggered = data.id.endsWith('1') || data.label.includes('SOS') || data.label.includes('PIR');
      const getSensorIcon = () => {
        if (data.label === '多功能按鈕') return <Pill size={isSmall ? 32 : 56} />;
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
                <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-50"><button onClick={(e) => { e.stopPropagation(); onRemoveCamera(index); }} className="w-7 h-7 flex items-center justify-center bg-red-600/90 hover:bg-red-500 text-white rounded-lg shadow-xl"><X size={16} strokeWidth={3} /></button><button onClick={(e) => { e.stopPropagation(); openModal(slotData); }} className="w-7 h-7 flex items-center justify-center bg-blue-600/90 hover:bg-blue-500 text-white rounded-lg shadow-xl"><Info size={16} strokeWidth={3} /></button></div>
                
                {slotData.nodeType !== 'site' && (
                   <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 pointer-events-none z-10">
                      {(slotData.siteGroup || slotData.siteName) && (
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-blue-400 uppercase tracking-widest bg-black/80 backdrop-blur-md px-2.5 py-1 rounded border border-white/10 w-fit shadow-2xl">
                           <MapPin size={10} className="shrink-0" /> {slotData.siteGroup} > {slotData.siteName}
                        </div>
                      )}
                      <div className="text-white text-[10px] font-black uppercase tracking-[0.1em] bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 w-fit shadow-2xl">
                         {slotData.label}
                      </div>
                   </div>
                )}
              </div>
            ) : <div className="flex flex-col items-center justify-center opacity-20 select-none pointer-events-none"><MousePointer2 size={40} className="text-slate-500 mb-3" /><span className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black">Drop Site or Device Here</span></div>}
          </div>
        );
      })}

      {detailModalSlot && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <div className="relative max-w-[1600px] w-full bg-[#111827] border border-slate-700 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[90vh] ring-1 ring-white/5 animate-in zoom-in-95 duration-200 ring-1 ring-white/5 animate-in zoom-in-95 duration-200">
              <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-[#1e293b]/40 shrink-0">
                 <div className="flex items-center gap-5">
                    <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-900/40">{detailModalSlot.nodeType === 'site' ? <Building2 size={28}/> : <Cpu size={28}/>}</div>
                    <div><h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">{detailModalSlot.label}</h2><p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">SKS Infrastructure Node / UID: {detailModalSlot.id}</p></div>
                 </div>
                 <button onClick={() => setDetailModalSlot(null)} className="p-2 hover:bg-red-500/20 rounded-xl text-slate-500 hover:text-red-500 transition-all"><X size={32} /></button>
              </div>

              <div className="flex bg-black/20 border-b border-slate-800 px-8 shrink-0 overflow-x-auto no-scrollbar justify-between">
                 <div className="flex">
                    {availableTabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveDetailTab(tab.id)} className={`px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-all relative whitespace-nowrap ${activeDetailTab === tab.id ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}>{tab.icon} {tab.label}{activeDetailTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>}</button>
                    ))}
                 </div>
              </div>

              <div className="flex-1 overflow-hidden flex">
                 <div className="flex-1 relative overflow-hidden flex flex-col bg-[#0a0f1e]/50">
                    {isRecalculating && (
                       <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-md flex flex-col items-center justify-center gap-6 animate-in fade-in duration-300">
                          <div className="relative w-20 h-20">
                             <div className="absolute inset-0 border-4 border-blue-500/10 rounded-full"></div>
                             <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                             <div className="absolute inset-0 flex items-center justify-center text-blue-500">
                                <Cpu size={32} className="animate-pulse" />
                             </div>
                          </div>
                          <div className="text-center space-y-2">
                             <h4 className="text-xl font-black text-white italic tracking-tighter uppercase">數據重新計算中...</h4>
                             <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] animate-pulse">SKS AI Core is processing statistics</p>
                          </div>
                          <div className="w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-4">
                             <div className="h-full bg-blue-600 animate-[progress_1.2s_ease-in-out_infinite]"></div>
                          </div>
                       </div>
                    )}
                    <div className={`flex-1 overflow-y-auto custom-scrollbar p-10 transition-all duration-700 ${isRecalculating ? 'blur-sm grayscale opacity-50 scale-[0.98]' : ''}`}>
                       {activeDetailTab === 'site_daily_overview' && <SiteDailyOverview />}
                       {activeDetailTab === 'site_cumulative_analysis' && <SiteCumulativeAnalysis />}
                       {activeDetailTab === 'site_time_comparison' && <SiteTimeComparison />}
                       {activeDetailTab === 'site_device_comparison' && <SiteDeviceComparison />}
                       {activeDetailTab === 'site_behavior_profile' && <SiteBehaviorProfile onJumpToNav={onJumpToNav} />}
                       {activeDetailTab === 'historical_trends' && <HistoricalTrends />}
                       {activeDetailTab === 'coordinate_map' && <SpaceCoordinateMap />}
                       {activeDetailTab === 'trigger_history' && <TriggerHistory deviceLabel={detailModalSlot.label} />}
                       {activeDetailTab === 'space_trends' && (
                         detailModalSlot.label.includes('人流') ? <SpaceFlowTrends /> : <SpaceHeatTrends />
                       )}
                       {activeDetailTab === 'security_info' && <SecurityInfo onJump={handleJumpToSecurity} />}
                       {activeDetailTab === 'scenario_info' && <ScenarioInfo onJump={handleJumpToScenario} />}
                       {activeDetailTab === 'device_info' && <DeviceInfo onJump={handleJumpToDeviceCenter} />}
                    </div>
                 </div>

                 {detailModalSlot.nodeType === 'site' && (
                    <div className="w-[380px] border-l border-slate-800 bg-[#0b1121] flex flex-col shrink-0 p-8 overflow-y-auto custom-scrollbar">
                       <div className="space-y-10">
                          <div className="space-y-6">
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                   <Settings2 size={18} className="text-blue-500" />
                                   <h4 className="text-xs font-black text-white uppercase tracking-widest">統計參與設備設定</h4>
                                </div>
                                {isStatsChanged && (
                                   <span className="text-[9px] font-black bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded border border-amber-500/20 animate-pulse">待更新</span>
                                )}
                             </div>
                             <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">勾選後需點擊下方的「確認套用」按鈕以重新計算 5 個 TAB 的分析數據。</p>
                             <div className="space-y-2">
                                {eligibleStatsDevices.length > 0 ? eligibleStatsDevices.map(dev => (
                                   <button 
                                      key={dev.id}
                                      onClick={() => togglePendingDevice(dev.id)}
                                      className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${pendingStatsDevices.has(dev.id) ? 'bg-blue-600/10 border-blue-500/50 shadow-lg shadow-blue-900/10' : 'bg-black/20 border-slate-800 text-slate-600'}`}
                                   >
                                      <div className="flex items-center gap-3 min-w-0">
                                         <UserSearch size={16} className={pendingStatsDevices.has(dev.id) ? 'text-blue-400' : 'text-slate-700'} />
                                         <span className={`text-[11px] font-bold truncate ${pendingStatsDevices.has(dev.id) ? 'text-slate-200' : 'text-slate-600'}`}>{dev.label}</span>
                                      </div>
                                      {pendingStatsDevices.has(dev.id) ? <CheckSquare size={16} className="text-blue-500" /> : <SquareIcon size={16} className="text-slate-800" />}
                                   </button>
                                )) : (
                                   <div className="py-8 text-center text-[10px] text-slate-700 border border-dashed border-slate-800 rounded-2xl">
                                      此區域無符合條件的偵測設備
                                   </div>
                                )}
                             </div>
                             <button 
                                onClick={applyStatsDeviceSelection}
                                disabled={!isStatsChanged || isRecalculating}
                                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl border
                                   ${!isStatsChanged || isRecalculating 
                                      ? 'bg-slate-800/30 border-slate-800 text-slate-700 cursor-not-allowed' 
                                      : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400 shadow-blue-900/40 ring-4 ring-blue-600/10 animate-in zoom-in-95'}
                                `}
                             >
                                {isRecalculating ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle2 size={18}/> 確認套用選取</>}
                             </button>
                          </div>
                          <div className="h-px bg-slate-800"></div>
                          <div className="space-y-6">
                             <div className="flex items-center gap-3">
                                <Download size={18} className="text-emerald-500" />
                                <h4 className="text-xs font-black text-white uppercase tracking-widest">數據資料匯出設定</h4>
                             </div>
                             <p className="text-[10px] text-slate-500 font-medium italic">請選擇欲匯出之分析報表項 (Excel / CSV / PDF)。</p>
                             <div className="space-y-2">
                                {[
                                   { id: 'daily', label: '當日人流總覽 (Daily Overview)' },
                                   { id: 'cumulative', label: '歷史累計趨勢 (Cumulative)' },
                                   { id: 'comparison', label: '多時段對比分析 (Comparison)' },
                                   { id: 'device', label: '入口貢獻排行 (Performance)' },
                                   { id: 'behavior', label: '行為輪廓特徵 (Behavior)' }
                                ].map(tab => (
                                   <button 
                                      key={tab.id}
                                      onClick={() => toggleExportTab(tab.id)}
                                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all ${exportTabs.has(tab.id) ? 'bg-emerald-600/10 border-emerald-500/40' : 'bg-black/10 border-slate-800/50 text-slate-700'}`}
                                   >
                                      <span className={`text-[10px] font-black uppercase tracking-tight ${exportTabs.has(tab.id) ? 'text-slate-200' : 'text-slate-700'}`}>{tab.label}</span>
                                      {exportTabs.has(tab.id) ? <CheckCircle2 size={16} className="text-emerald-500" /> : <div className="w-4 h-4 rounded-full border border-slate-800"></div>}
                                   </button>
                                ))}
                             </div>
                             <button 
                                onClick={handleExport}
                                disabled={isExporting}
                                className={`w-full py-4 mt-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl
                                   ${isExporting ? 'bg-slate-800 text-slate-600' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20'}
                                `}
                             >
                                {isExporting ? <RefreshCw size={18} className="animate-spin" /> : <><Download size={18}/> 執行匯出任務</>}
                             </button>
                          </div>
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

      <style>{`
        @keyframes progress {
           0% { transform: translateX(-100%); }
           100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default VideoGrid;