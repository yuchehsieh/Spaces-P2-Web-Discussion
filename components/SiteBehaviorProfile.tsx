import React, { useState, useMemo } from 'react';
import { User, RefreshCw, Timer, Clock, Trophy, ArrowRight, Navigation } from 'lucide-react';
import { MainNavType } from '../types';

interface SiteBehaviorProfileProps {
  onJumpToNav?: (nav: MainNavType, nodeId?: string) => void;
}

// 定義單個數據點的介面
interface DataPoint {
  value: number;
  isPeak: boolean;
  isBusy: boolean;
}

const SiteBehaviorProfile: React.FC<SiteBehaviorProfileProps> = ({ onJumpToNav }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // 1. 使用 useMemo 預先生成穩定的 24小時 x 7天 數據，防止 Hover 時數據亂跳
  const heatmapData = useMemo(() => {
    const data: DataPoint[] = [];
    for (let h = 0; h < 24; h++) {
      for (let d = 0; d < 7; d++) {
        // 判斷時段屬性
        const isPeak = (d >= 2 && d <= 4) && (h >= 14 && h <= 16);
        const isBusy = (d >= 1 && d <= 5) && (h >= 9 && h <= 18);
        
        let val = 0;
        if (isPeak) {
          val = 55 + Math.floor(Math.random() * 10); // 高峰: 55-65
        } else if (isBusy) {
          val = 15 + Math.floor(Math.random() * 20); // 營業: 15-35
        } else {
          val = Math.floor(Math.random() * 8);       // 離峰: 0-8
        }
        
        data.push({ value: val, isPeak, isBusy });
      }
    }
    return data;
  }, []);

  const timeLabels = [
    '12am', '2am', '4am', '6am', '8am', '10am', 
    '12pm', '2pm', '4pm', '6pm', '8pm', '10pm'
  ];

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
       <div className="flex flex-col lg:flex-row items-end justify-between gap-6 pb-6 border-b border-white/5">
          <div className="space-y-1">
             <h4 className="text-2xl font-black text-white italic tracking-tighter uppercase">人流時序行為輪廓 (Week x Hour)</h4>
             <p className="text-sm text-slate-500 font-medium italic">主要回答決策者：「一天之中，人什麼時候最多？」以此優化人力排班、保全啟閉時段。</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 p-1 bg-[#050914] border border-slate-800 rounded-2xl shadow-inner">
                {['ALL', 'STAFF', 'VISITOR'].map(filter => (
                  <button key={filter} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filter === 'ALL' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600 hover:text-slate-400'}`}>
                    {filter === 'ALL' ? '全體人員' : filter === 'STAFF' ? '內部人員' : '訪客'}
                  </button>
                ))}
             </div>
             <button className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl border border-slate-700 transition-all"><RefreshCw size={18}/></button>
          </div>
       </div>

       <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          <div className="xl:col-span-3 bg-[#111827] border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                   <Timer size={14} className="text-blue-500" /> Hourly Flow Density Map
                </div>
                <div className="flex items-center gap-4">
                   <span className="text-[9px] font-black text-slate-600 uppercase">Density Scale</span>
                   <div className="flex h-3 gap-1">
                      <div className="w-8 bg-blue-400/20 rounded-sm"></div>
                      <div className="w-8 bg-blue-500/40 rounded-sm"></div>
                      <div className="w-8 bg-blue-600/70 rounded-sm"></div>
                      <div className="w-8 bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)] rounded-sm"></div>
                   </div>
                   <div className="flex gap-4 text-[8px] font-black text-slate-700 uppercase ml-2">
                      <span>0</span><span>15</span><span>30</span><span>45</span><span>60+</span>
                   </div>
                </div>
             </div>

             <div className="flex">
                <div className="w-16 flex flex-col justify-between py-2 pr-4 border-r border-white/5">
                   {timeLabels.map(h => (
                     <span key={h} className="text-[10px] font-black text-slate-600 uppercase text-right h-12 flex items-center justify-end">{h}</span>
                   ))}
                </div>

                <div className="flex-1 flex flex-col pl-4">
                   <div className="flex justify-between mb-6 px-1">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <span key={d} className="flex-1 text-center text-[11px] font-black text-slate-500 uppercase tracking-widest">{d}</span>
                      ))}
                   </div>

                   <div className="grid grid-cols-7 gap-1.5 h-[600px]">
                      {heatmapData.map((point, i) => {
                        // 根據穩定數值決定視覺強度
                        let intensityClass = 'bg-slate-800/40';
                        if (point.value >= 45) intensityClass = 'bg-blue-500 shadow-[inset_0_0_10px_rgba(255,255,255,0.1)]';
                        else if (point.value >= 30) intensityClass = 'bg-blue-600/80';
                        else if (point.value >= 15) intensityClass = 'bg-blue-700/50';
                        else if (point.value >= 5) intensityClass = 'bg-blue-900/30';
                        
                        return (
                          <div 
                            key={i} 
                            onMouseEnter={() => setHoveredIndex(i)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            className={`rounded-sm transition-all relative cursor-crosshair ${intensityClass} ${hoveredIndex === i ? 'ring-2 ring-white/40 z-10 scale-[1.05]' : ''}`}
                          >
                             {hoveredIndex === i && (
                               <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-2 rounded-lg text-[10px] font-black shadow-2xl whitespace-nowrap z-[100] border border-white/20 animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
                                  Avg: {point.value} Pax {point.isPeak ? '(Peak)' : ''}
                                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-600 rotate-45 border-r border-b border-white/20"></div>
                               </div>
                             )}
                          </div>
                        );
                      })}
                   </div>
                </div>
             </div>
          </div>

          <div className="xl:col-span-1 space-y-6">
             <div className="bg-[#1e293b]/40 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
                <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-3">
                   <Trophy size={16} className="text-amber-500" /> Peak Time Insight
                </h4>
                <div className="space-y-8">
                   <div className="space-y-4">
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">每週最繁忙時段</span>
                      <div className="flex items-center gap-4">
                         <div className="p-4 bg-blue-600/10 text-blue-500 rounded-2xl shadow-inner"><Clock size={24}/></div>
                         <div>
                            <span className="text-xl font-black text-white italic">Tue 15:00</span>
                            <span className="block text-[10px] text-emerald-500 font-bold uppercase tracking-tight">+14% ABOVE AVG</span>
                         </div>
                      </div>
                   </div>
                   <div className="h-px bg-white/5"></div>
                   <div className="space-y-4">
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">人力調度建議</span>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">
                         數據反映 <span className="text-white font-black">週二至週四 下午時段</span> 為人流高峰，建議將清潔或補貨任務移至上午 09:00 前執行。
                      </p>
                   </div>
                </div>
             </div>

             <div className="bg-gradient-to-br from-blue-600 to-indigo-700 border border-blue-400/30 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
                <div className="relative z-10 space-y-6">
                   <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                      安防最佳化建議
                   </h4>
                   <div className="space-y-2">
                      <span className="text-[10px] font-black text-blue-100 uppercase tracking-widest opacity-80 italic">推薦設防時段 (ARMED)</span>
                      <div className="text-3xl font-black text-white font-mono tracking-tighter">22:00 - 06:30</div>
                   </div>
                   <p className="text-xs text-blue-100 leading-relaxed font-bold opacity-90">
                      此時段歷史無人員活動紀錄。建議同步更新至「事件排程中心」進行自動化設防。
                   </p>
                   <button onClick={() => onJumpToNav?.('event-center', 'security-schedule')} className="w-full py-4 bg-white text-blue-600 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2">
                      同步排程中心 <ArrowRight size={14}/>
                   </button>
                </div>
             </div>

             <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-blue-600/10 text-blue-500 rounded-lg flex items-center justify-center"><Navigation size={16}/></div>
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">適用業態場景</span>
                </div>
                <div className="flex flex-wrap gap-2">
                   {['SMB', '零售商場', '校園園區', '工廠後勤'].map(tag => (
                      <span key={tag} className="px-3 py-1 bg-black/40 border border-slate-800 rounded-lg text-[9px] font-bold text-slate-400">{tag}</span>
                   ))}
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

export default SiteBehaviorProfile;