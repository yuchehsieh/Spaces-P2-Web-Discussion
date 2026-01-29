import React, { useState, useEffect, useMemo } from 'react';
import { 
  FolderOpen, 
  Cpu, 
  Shield, 
  History, 
  ChevronRight, 
  ChevronLeft,
  Clock, 
  CheckCircle2, 
  Battery, 
  Wifi, 
  Video, 
  Activity, 
  DoorClosed,
  AlertTriangle,
  Zap,
  LayoutList,
  Calendar,
  Tag,
  Settings2,
  CheckSquare,
  Square as SquareIcon,
  Download,
  Trash2,
  Pill,
  Bell,
  Sparkles,
  BarChart3,
  TrendingUp,
  History as HistoryIcon,
  ListRestart,
  CalendarDays,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { SITE_TREE_DATA } from '../constants';
import { SiteNode } from '../types';

interface ZoneDetailViewProps {
  zoneId: string;
  zoneLabel: string;
  selectedDeviceIds: Set<string>;
  showArmedPeriods: boolean;
  showScenarioPeriods: boolean;
  showScenarioTriggers: boolean;
  statsDurationFilter?: Set<string>;
  statsFrequencyFilter?: Set<string>;
  onTabChange?: (tab: string) => void;
}

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const WEEKS = [
  { id: 'w3', label: '2025年 12月 第 1 週' },
  { id: 'prev', label: '上週 (12/08 - 12/14)' },
  { id: 'curr', label: '本週 (12/15 - 12/21)' },
];

const ZoneDetailView: React.FC<ZoneDetailViewProps> = ({ 
  zoneId, 
  zoneLabel, 
  selectedDeviceIds,
  showArmedPeriods,
  showScenarioPeriods,
  showScenarioTriggers,
  statsDurationFilter = new Set(['armed', 'scenario']),
  statsFrequencyFilter = new Set(['general', 'security', 'scenario']),
  onTabChange
}) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'logs'>('schedule');
  const [weekIdx, setWeekIdx] = useState(2); // 預設指向 WEEKS[2] (本週)
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleTabChange = (tab: 'schedule' | 'logs') => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const selectedWeek = WEEKS[weekIdx];

  // --- 設備數據獲取 ---
  const zoneChildDevices = useMemo(() => {
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
    const traverse = (node: SiteNode) => {
      if (node.type === 'device') {
        const label = node.label.toUpperCase();
        const isExcluded = label.includes('WEB CAM') || 
                           label.includes('IPC') || 
                           label.includes('人流') || 
                           label.includes('熱度');
        if (!isExcluded) devices.push(node);
      }
      node.children?.forEach(traverse);
    };
    const zoneNode = findNode(SITE_TREE_DATA, zoneId);
    if (zoneNode) traverse(zoneNode);
    return devices;
  }, [zoneId]);

  // --- 模擬統計數據 ---
  const weeklyStats = useMemo(() => {
    const seed = selectedWeek.id === 'curr' ? 1 : selectedWeek.id === 'prev' ? 1.2 : 0.8;
    return DAYS.map((day, i) => {
      const isWeekend = i === 0 || i === 6;
      const genCount = (8 + Math.floor(Math.random() * 12)) * seed;
      const secCount = (isWeekend ? 2 + Math.floor(Math.random() * 5) : 0) * seed;
      const sceCount = (isWeekend ? 0 : 3 + Math.floor(Math.random() * 5)) * seed;

      return {
        day,
        duration: {
          armed: isWeekend ? 24 : (10 + Math.random() * 4) * seed,
          scenario: isWeekend ? 0 : (4 + Math.random() * 3) * seed
        },
        frequency: {
          general: genCount,
          security: secCount,
          scenario: sceCount,
          generalBreakdown: [
            { label: '門磁', count: Math.floor(genCount * 0.4), color: 'bg-sky-500', pct: 40 },
            { label: 'PIR', count: Math.ceil(genCount * 0.6), color: 'bg-sky-300', pct: 60 }
          ],
          securityBreakdown: secCount > 0 ? (
            isWeekend ? [
              { label: 'PIR', count: Math.round(secCount), color: 'bg-red-500', pct: 100 }
            ] : [
              { label: '門磁', count: Math.floor(secCount * 0.3), color: 'bg-red-600', pct: 30 },
              { label: 'PIR', count: Math.ceil(secCount * 0.7), color: 'bg-red-400', pct: 70 }
            ]
          ) : [],
          scenarioBreakdown: sceCount > 0 ? [
            { label: '接待模式', count: Math.floor(sceCount * 0.6), color: 'bg-fuchsia-600', pct: 60 },
            { label: '節能模式', count: Math.ceil(sceCount * 0.4), color: 'bg-fuchsia-400', pct: 40 }
          ] : []
        }
      };
    });
  }, [selectedWeek]);

  // --- TAB2 時序數據保持不變 ---
  const designedEvents = useMemo(() => {
    const events: Record<string, { day: number, hourPct: number, deviceName: string, timeLabel: string }[]> = {};
    zoneChildDevices.forEach(dev => {
      const devEvents = [];
      const label = dev.label;
      if (label.includes('門磁')) {
        [1, 2, 3, 4, 5].forEach(day => {
          devEvents.push({ day, hourPct: (8.5 / 24) * 100, deviceName: '門磁', timeLabel: "08:30" });
          devEvents.push({ day, hourPct: (21.5 / 24) * 100, deviceName: '門磁', timeLabel: "21:30" });
        });
      } else if (label.includes('PIR')) {
        [2, 4].forEach(day => { devEvents.push({ day, hourPct: (2.25 / 24) * 100, deviceName: 'PIR', timeLabel: "02:15" }); });
        [1, 2, 3, 4, 5].forEach(day => { devEvents.push({ day, hourPct: (12.5 / 24) * 100, deviceName: 'PIR', timeLabel: "12:30" }); });
      } else if (label.includes('按鈕')) {
        devEvents.push({ day: 3, hourPct: (10 / 24) * 100, deviceName: '按鈕', timeLabel: "10:00" });
      }
      events[dev.id] = devEvents;
    });
    return events;
  }, [zoneChildDevices]);

  const scenarioData = {
    periods: [{ day: [1, 2, 3, 4, 5], start: 10, end: 12, label: '訪客接待模式' }, { day: [0, 1, 2, 3, 4, 5, 6], start: 0, end: 6, label: '極低耗能模式' }],
    triggers: [{ day: 1, hour: 9, label: '自動鐵捲門開啟' }, { day: 3, hour: 14.5, label: '系統自動巡檢' }, { day: 5, hour: 17.75, label: '後勤補給照明啟動' }]
  };

  const handlePrevWeek = () => {
    if (weekIdx > 0) setWeekIdx(weekIdx - 1);
  };

  const handleNextWeek = () => {
    if (weekIdx < WEEKS.length - 1) setWeekIdx(weekIdx + 1);
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <div className="flex bg-[#0a0f1e] border-b border-slate-800 px-8 shrink-0">
        {[
          { id: 'schedule', label: '保全與情境時序', icon: <Shield size={16}/> },
          { id: 'logs', label: '數據統計比較', icon: <BarChart3 size={16}/> }
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => handleTabChange(tab.id as any)}
            className={`px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-all relative ${activeTab === tab.id ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {tab.icon} {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#050914]/50 relative">
        {/* --- Sticky Week Selector for TAB 2 & TAB 3 --- */}
        <div className="sticky top-0 z-50 bg-[#0a0f1e]/90 backdrop-blur-md border-b border-slate-800 px-10 py-5 flex items-center justify-between shadow-2xl">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                  <CalendarDays size={18} className="text-blue-500" />
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">數據統計週次：</span>
              </div>
              <div className="flex items-center gap-4 bg-black/40 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
                  <button 
                    onClick={handlePrevWeek} 
                    disabled={weekIdx === 0}
                    className={`p-2 rounded-xl transition-all ${weekIdx === 0 ? 'text-slate-700' : 'text-blue-500 hover:bg-blue-600/10 active:scale-90'}`}
                  >
                    <ChevronLeft size={20} strokeWidth={3} />
                  </button>
                  <div className="min-w-[180px] text-center">
                    <span className="text-sm font-black text-white tracking-wide">{selectedWeek.label}</span>
                  </div>
                  <button 
                    onClick={handleNextWeek} 
                    disabled={weekIdx === WEEKS.length - 1}
                    className={`p-2 rounded-xl transition-all ${weekIdx === WEEKS.length - 1 ? 'text-slate-700' : 'text-blue-500 hover:bg-blue-600/10 active:scale-90'}`}
                  >
                    <ChevronRight size={20} strokeWidth={3} />
                  </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold text-slate-600 italic">資料更新：{now.toLocaleTimeString()}</span>
              <button onClick={() => alert("正在同步雲端最新數據...")} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg border border-slate-700 transition-all"><RefreshCw size={14}/></button>
            </div>
        </div>

        <div className="p-10">
        {activeTab === 'schedule' && (
          <div className="space-y-8 flex flex-col animate-in fade-in duration-500 text-left">
            <div className="bg-black/30 border border-slate-800 rounded-[3rem] p-8 lg:p-12 shadow-2xl relative flex flex-col">
                <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-8 shrink-0 text-left">
                  <div className="flex items-center gap-6">
                    <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-900/40"><Calendar size={24} /></div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Historical Weekly Activity Mapping</span>
                      <h2 className="text-lg font-black text-white italic uppercase tracking-tighter mt-1">{selectedWeek.label}</h2>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-black/40 px-6 py-3 rounded-2xl border border-white/5 shadow-inner"><div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-emerald-500/30 rounded-sm"></div><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">保全時段</span></div><div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-indigo-500/40 rounded-sm"></div><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">情境時段</span></div><div className="flex items-center gap-2"><div className="w-2 h-2 bg-sky-500 rounded-full"></div><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">一般觸發</span></div><div className="flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.6)]"></div><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">保全告警</span></div><div className="flex items-center gap-2"><div className="w-2 h-2 bg-fuchsia-500 rounded-full shadow-[0_0_8px_rgba(217,70,239,0.6)]"></div><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">情境觸發</span></div></div>
                </div>
                <div className="w-full flex flex-col space-y-3.5 flex-1 min-h-0">
                  {DAYS.map((day, idx) => {
                      const isToday = idx === now.getDay();
                      // Fix: Changed undefined variable 'dIdx' to 'idx' to match map parameter
                      const isWeekday = idx >= 1 && idx <= 5;
                      const currentHourPct = (now.getHours() * 60 + now.getMinutes()) / 1440 * 100;
                      return (
                        <div key={day} className="flex items-center gap-8 w-full group/row text-left">
                          <div className={`w-12 text-[12px] font-black transition-colors shrink-0 ${isToday ? 'text-blue-400 scale-110' : 'text-slate-600 group-hover/row:text-slate-400'}`}>{day}</div>
                          <div className="flex-1 h-14 bg-slate-900/60 rounded-[10px] border border-white/5 relative transition-all group-hover/row:border-white/10 shadow-inner">
                              <div className="absolute inset-0 rounded-[10px] overflow-hidden pointer-events-none z-10">{showArmedPeriods && (isWeekday ? (<><div className="absolute left-0 w-[33%] h-full bg-emerald-500/30"></div><div className="absolute right-0 w-[15%] h-full bg-emerald-500/30"></div></>) : (<div className="absolute inset-0 bg-emerald-500/30"></div>))}</div>
                              {showScenarioPeriods && (<div className="absolute inset-0 rounded-[10px] pointer-events-none z-20">{scenarioData.periods.filter(p => p.day.includes(idx)).map((p, pIdx) => (<div key={pIdx} className="absolute h-full top-0 bg-indigo-500/40 border-x border-indigo-400/20 group/sceblock pointer-events-auto cursor-pointer rounded-[10px]" style={{ left: `${(p.start/24)*100}%`, width: `${((p.end-p.start)/24)*100}%` }}><div className="absolute bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2 px-4 py-2.5 bg-indigo-900/95 backdrop-blur-xl border border-indigo-400 rounded-xl text-[11px] font-black text-white whitespace-nowrap opacity-0 group-hover/sceblock:opacity-100 transition-all duration-200 z-[1000] shadow-2xl pointer-events-none scale-90 group-hover/sceblock:scale-100 ring-1 ring-white/10"><div className="flex items-center gap-2"><Sparkles size={14} className="text-indigo-300" /><span>{p.label}</span></div><div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-indigo-900 rotate-45 border-r border-b border-indigo-400"></div></div></div>))}</div>)}
                              {Array.from(selectedDeviceIds).map(devId => {
                                const events = designedEvents[devId] || [];
                                return events.filter(e => e.day === idx).map((evt, eIdx) => {
                                    const isArmedAtThisTime = isWeekday ? (evt.hourPct < 33 || evt.hourPct > 85) : true;
                                    const triggerLabel = isArmedAtThisTime ? "保全告警" : "一般觸發";
                                    return (
                                        <div key={`${devId}-${idx}-${eIdx}`} className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center z-30 group/point" style={{ left: `${evt.hourPct}%` }}>
                                          <div className={`absolute bottom-5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded border mb-1 pointer-events-none transition-transform group-hover/point:scale-110 z-40 ${isArmedAtThisTime ? "bg-red-600 border-red-300 shadow-[0_0_15px_rgba(239,68,68,0.6)]" : "bg-sky-600 border-sky-300 shadow-[0_0_10px_rgba(14,165,233,0.4)]"}`}><span className="text-[10px] font-black text-white uppercase leading-none whitespace-nowrap">{evt.deviceName} ({triggerLabel})</span></div>
                                          <div className={`w-2.5 h-2.5 rounded-full cursor-pointer hover:scale-150 transition-all border-2 border-white ${isArmedAtThisTime ? "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,1)]" : "bg-sky-500 shadow-[0_0_12px_rgba(14,165,233,1)]"}`}></div>
                                        </div>
                                    );
                                });
                              })}
                              {showScenarioTriggers && scenarioData.triggers.filter(t => t.day === idx).map((t, tIdx) => (<div key={`st-${tIdx}`} className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center z-40 group/sce" style={{ left: `${(t.hour / 24) * 100}%` }}><div className="absolute bottom-5 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-fuchsia-700 rounded border border-fuchsia-300 shadow-2xl mb-1 pointer-events-none transition-transform group-hover/sce:scale-110 z-[60]"><span className="text-[10px] font-black text-white uppercase leading-none whitespace-nowrap">{t.label}</span></div><div className="w-3 h-3 bg-fuchsia-500 rounded-full shadow-2xl cursor-pointer hover:scale-150 transition-all border-2 border-white z-50"></div></div>))}
                              {isToday && (<div className="absolute top-0 bottom-0 w-0.5 bg-red-500 shadow-[0_0_20px_rgba(239,68,68,1)] z-[50]" style={{ left: `${currentHourPct}%` }}><div className="absolute -top-3 -left-[7px] w-4 h-4 bg-red-500 rounded-full ring-4 ring-white/10 shadow-lg"></div></div>)}
                              <div className="absolute inset-0 grid grid-cols-24 pointer-events-none opacity-[0.03]">{Array.from({length: 24}).map((_, i) => <div key={i} className="border-r border-white h-full"></div>)}</div>
                          </div>
                        </div>
                      );
                  })}
                </div>
                <div className="mt-10 flex justify-center shrink-0"><div className="grid grid-cols-6 w-full max-w-[calc(100%-6rem)] ml-20 text-[11px] font-black text-slate-700 uppercase tracking-[0.5em] px-4"><span>00:00</span><span>04:00</span><span>08:00</span><span>12:00</span><span>16:00</span><span>20:00</span></div></div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-10 animate-in fade-in duration-500 text-left">
            {/* 1. 週時長分佈對比 (Duration Analysis) */}
            <div className="bg-black/30 border border-slate-800 rounded-[3rem] p-10 shadow-2xl flex flex-col gap-10">
               <div className="flex items-center justify-between border-b border-white/5 pb-8 text-left">
                  <div className="flex items-center gap-6">
                    <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-900/40"><Clock size={24} /></div>
                    <div className="text-left">
                       <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">週活動時長分佈對比</h3>
                       <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">每日保全設防與情境啟動累積時數</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-black/40 px-6 py-2.5 rounded-2xl border border-white/5">
                     <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">保全設防時長</span></div>
                     <div className="flex items-center gap-2 ml-4"><div className="w-2.5 h-2.5 bg-indigo-600 rounded-sm"></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">情境活動時長</span></div>
                  </div>
               </div>

               <div className="space-y-6">
                  {DAYS.map((day, i) => {
                     const data = weeklyStats[i];
                     return (
                        <div key={day} className="flex items-start gap-8 group/row text-left">
                           <div className="w-12 text-[12px] font-black text-slate-600 pt-1 group-hover/row:text-blue-400 transition-colors shrink-0 text-left">{day}</div>
                           <div className="flex-1 flex flex-col gap-3">
                              {statsDurationFilter.has('armed') && (
                                <div className="space-y-1 animate-in slide-in-from-left-4 text-left">
                                   <div className="flex justify-between items-center px-1">
                                      <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">保全設防時長</span>
                                      <span className="text-[10px] font-mono font-black text-emerald-400">{data.duration.armed.toFixed(1)}小時</span>
                                   </div>
                                   <div className="h-4 bg-slate-900 rounded-full p-0.5 border border-white/5 shadow-inner">
                                      <div className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all duration-1000" style={{ width: `${(data.duration.armed/24)*100}%` }}></div>
                                   </div>
                                </div>
                              )}
                              {statsDurationFilter.has('scenario') && (
                                <div className="space-y-1 animate-in slide-in-from-left-4 text-left">
                                   <div className="flex justify-between items-center px-1">
                                      <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">情境模式活動</span>
                                      <span className="text-[10px] font-mono font-black text-indigo-400">{data.duration.scenario.toFixed(1)}小時</span>
                                   </div>
                                   <div className="h-4 bg-slate-900 rounded-full p-0.5 border border-white/5 shadow-inner">
                                      <div className="h-full bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.3)] transition-all duration-1000" style={{ width: `${(data.duration.scenario/24)*100}%` }}></div>
                                   </div>
                                </div>
                              )}
                           </div>
                        </div>
                     );
                  })}
               </div>
               <div className="flex justify-center shrink-0 border-t border-white/5 pt-8 text-left">
                  <div className="grid grid-cols-5 w-full max-w-[calc(100%-6rem)] ml-20 text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] px-4 text-left">
                      <span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>24h</span>
                  </div>
               </div>
            </div>

            {/* 2. 週活動觸發頻率對照 (Frequency Analysis) */}
            <div className="bg-black/30 border border-slate-800 rounded-[3rem] p-10 shadow-2xl flex flex-col gap-10 text-left">
               <div className="flex items-center justify-between border-b border-white/5 pb-8 text-left">
                  <div className="flex items-center gap-6 text-left">
                    <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-900/40"><ListRestart size={24} /></div>
                    <div className="text-left">
                       <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">週活動觸發頻率對照</h3>
                       <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">各類別事件觸發次數與設備占比分佈</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4 bg-black/40 px-6 py-2.5 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-sky-500 rounded-sm"></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">一般觸發</span></div>
                        <div className="flex items-center gap-2 ml-4"><div className="w-2.5 h-2.5 bg-red-600 rounded-sm"></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">保全告警</span></div>
                        <div className="flex items-center gap-2 ml-4"><div className="w-2.5 h-2.5 bg-fuchsia-600 rounded-sm"></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">情境觸發</span></div>
                    </div>
                  </div>
               </div>

               {/* 調整間距 space-y-14 -> space-y-8 */}
               <div className="space-y-8">
                  {DAYS.map((day, i) => {
                     const data = weeklyStats[i];
                     return (
                        <div key={day} className="flex items-start gap-8 group/row text-left">
                           <div className="w-12 text-[12px] font-black text-slate-600 pt-1 group-hover/row:text-indigo-400 transition-colors shrink-0 text-left">{day}</div>
                           
                           {/* 調整子項目間距 gap-6 -> gap-3 */}
                           <div className="flex-1 flex flex-col gap-3">
                              
                              {/* 一般觸發：分段比例條 */}
                              {statsFrequencyFilter.has('general') && (
                                <div className="space-y-1.5 animate-in slide-in-from-left-4">
                                   <div className="flex justify-between items-center px-1">
                                      <span className="text-[11px] font-black text-sky-400 uppercase tracking-widest flex items-center gap-2">一般觸發次數：<span className="font-mono text-base">{Math.round(data.frequency.general)}次</span></span>
                                   </div>
                                   {/* 高度調整 h-6 -> h-4, 移除 overflow-hidden 確保 tooltip 可見 */}
                                   <div className="h-4 bg-slate-900 rounded-full p-0.5 border border-white/5 shadow-inner flex">
                                      {data.frequency.generalBreakdown.map((seg, sIdx) => (
                                        <div 
                                          key={sIdx} 
                                          className={`${seg.color} h-full first:rounded-l-full last:rounded-r-full transition-all duration-1000 relative group/seg border-r border-black/20 last:border-0 cursor-pointer`}
                                          style={{ width: `${(seg.count / 40) * 100}%` }}
                                        >
                                           {/* Tooltip 呈現 */}
                                           <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-[#1e293b] border border-slate-700 rounded-xl p-3 shadow-2xl opacity-0 group-hover/seg:opacity-100 transition-all pointer-events-none z-[100] translate-y-2 group-hover/seg:translate-y-0 text-left min-w-max whitespace-nowrap">
                                              <div className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1 pb-1 border-b border-white/5">{seg.label}</div>
                                              <div className="flex justify-between items-baseline gap-4">
                                                 <span className="text-[14px] font-black text-white font-mono">{seg.count}次</span>
                                                 <span className="text-[10px] text-slate-500 font-bold">{seg.pct}%</span>
                                              </div>
                                              <div className="absolute top-full left-1/2 -translate-x-1/2 -translate-y-px w-2 h-2 bg-[#1e293b] rotate-45 border-r border-b border-slate-700"></div>
                                           </div>
                                        </div>
                                      ))}
                                   </div>
                                </div>
                              )}

                              {/* 保全告警：分段比例條 */}
                              {statsFrequencyFilter.has('security') && (
                                <div className="space-y-1.5 animate-in slide-in-from-left-4">
                                   <div className="flex justify-between items-center px-1">
                                      <span className="text-[11px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">保全告警次數：<span className="font-mono text-base">{Math.round(data.frequency.security)}次</span></span>
                                   </div>
                                   {/* 高度調整 h-6 -> h-4, 移除 overflow-hidden */}
                                   <div className="h-4 bg-slate-900 rounded-full p-0.5 border border-white/5 shadow-inner flex">
                                      {data.frequency.securityBreakdown.length > 0 ? data.frequency.securityBreakdown.map((seg, sIdx) => (
                                        <div 
                                          key={sIdx} 
                                          className={`${seg.color} h-full first:rounded-l-full last:rounded-r-full transition-all duration-1000 relative group/seg border-r border-black/20 last:border-0 cursor-pointer`}
                                          style={{ width: `${(seg.count / 40) * 100}%` }}
                                        >
                                           {/* Tooltip 呈現 */}
                                           <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-[#1e293b] border border-slate-700 rounded-xl p-3 shadow-2xl opacity-0 group-hover/seg:opacity-100 transition-all pointer-events-none z-[100] translate-y-2 group-hover/seg:translate-y-0 text-left min-w-max whitespace-nowrap">
                                              <div className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1 pb-1 border-b border-white/5">{seg.label}</div>
                                              <div className="flex justify-between items-baseline gap-4">
                                                 <span className="text-[14px] font-black text-white font-mono">{seg.count}次</span>
                                                 <span className="text-[10px] text-slate-500 font-bold">{seg.pct}%</span>
                                              </div>
                                              <div className="absolute top-full left-1/2 -translate-x-1/2 -translate-y-px w-2 h-2 bg-[#1e293b] rotate-45 border-r border-b border-slate-700"></div>
                                           </div>
                                        </div>
                                      )) : <div className="w-full h-full bg-slate-800 opacity-20 rounded-full"></div>}
                                   </div>
                                </div>
                              )}

                              {/* 情境觸發：分段比例條 (更新為分段 Tooltip樣式) */}
                              {statsFrequencyFilter.has('scenario') && (
                                <div className="space-y-1.5 animate-in slide-in-from-left-4">
                                   <div className="flex justify-between items-center px-1">
                                      <span className="text-[11px] font-black text-fuchsia-400 uppercase tracking-widest flex items-center gap-2">情境觸發次數：<span className="font-mono text-base">{Math.round(data.frequency.scenario)}次</span></span>
                                   </div>
                                   <div className="h-4 bg-slate-900 rounded-full p-0.5 border border-white/5 shadow-inner flex">
                                      {data.frequency.scenarioBreakdown.length > 0 ? data.frequency.scenarioBreakdown.map((seg, sIdx) => (
                                        <div 
                                          key={sIdx} 
                                          className={`${seg.color} h-full first:rounded-l-full last:rounded-r-full transition-all duration-1000 relative group/seg border-r border-black/20 last:border-0 cursor-pointer`}
                                          style={{ width: `${(seg.count / 40) * 100}%` }}
                                        >
                                           {/* Tooltip 呈現 */}
                                           <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-[#1e293b] border border-slate-700 rounded-xl p-3 shadow-2xl opacity-0 group-hover/seg:opacity-100 transition-all pointer-events-none z-[100] translate-y-2 group-hover/seg:translate-y-0 text-left min-w-max whitespace-nowrap">
                                              <div className="text-[10px] font-black text-fuchsia-400 uppercase tracking-widest mb-1 pb-1 border-b border-white/5">{seg.label}</div>
                                              <div className="flex justify-between items-baseline gap-4">
                                                 <span className="text-[14px] font-black text-white font-mono">{seg.count}次</span>
                                                 <span className="text-[10px] text-slate-500 font-bold">{seg.pct}%</span>
                                              </div>
                                              <div className="absolute top-full left-1/2 -translate-x-1/2 -translate-y-px w-2 h-2 bg-[#1e293b] rotate-45 border-r border-b border-slate-700"></div>
                                           </div>
                                        </div>
                                      )) : <div className="w-full h-full bg-slate-800 opacity-20 rounded-full"></div>}
                                   </div>
                                </div>
                              )}

                           </div>
                        </div>
                     );
                  })}
               </div>
               {/* 調整底部刻度間距 pt-10 -> pt-8 */}
               <div className="flex justify-center shrink-0 border-t border-white/5 pt-8 text-left">
                  <div className="grid grid-cols-5 w-full max-w-[calc(100%-6rem)] ml-20 text-[11px] font-black text-slate-700 uppercase tracking-[0.5em] px-4 text-left">
                      <span>0次</span><span>10次</span><span>20次</span><span>30次</span><span>40+次</span>
                  </div>
               </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default ZoneDetailView;