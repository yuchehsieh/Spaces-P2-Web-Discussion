import React, { useState, useMemo, useEffect } from 'react';
import { 
  History, 
  Clock, 
  BarChart3, 
  LayoutList, 
  CalendarDays,
  Timer,
  Moon,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

interface PeriodBlock {
  day: number;
  start: number; // 0-24
  end: number;   // 0-24
}

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const WEEKS = [
  { id: 'w3', label: '2025年 12月 第 1 週' },
  { id: 'prev', label: '上週 (12/08 - 12/14)' },
  { id: 'curr', label: '本週 (12/15 - 12/21)' },
];

const PeriodHistory: React.FC<{ deviceLabel: string }> = ({ deviceLabel }) => {
  const [viewMode, setViewMode] = useState<'timeline' | 'stats'>('timeline');
  const [weekIdx, setWeekIdx] = useState(2); // 預設指向 WEEKS[2] (本週)
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const selectedWeek = WEEKS[weekIdx];

  // 模擬睡眠時段數據 (22:00 ~ 07:00 左右)
  // 根據週次調整數據種子
  const periodData: PeriodBlock[] = useMemo(() => {
    const seed = selectedWeek.id === 'curr' ? 1 : selectedWeek.id === 'prev' ? 1.1 : 0.9;
    
    return [
      { day: 1, start: 22.5 * seed, end: 24 }, { day: 2, start: 0, end: 7.2 * seed },
      { day: 2, start: 23 * seed, end: 24 }, { day: 3, start: 0, end: 6.8 * seed },
      { day: 3, start: 22.8 * seed, end: 24 }, { day: 4, start: 0, end: 7.5 * seed },
      { day: 4, start: 23.2 * seed, end: 24 }, { day: 5, start: 0, end: 6.5 * seed },
      { day: 5, start: 22.0 * seed, end: 24 }, { day: 6, start: 0, end: 8.0 * seed }
    ];
  }, [selectedWeek]);

  // 計算每日總時長
  const dailyStats = useMemo(() => {
    return DAYS.map((_, idx) => {
      const hours = periodData
        .filter(p => p.day === idx)
        .reduce((acc, curr) => acc + (curr.end - curr.start), 0);
      return { day: DAYS[idx], hours: parseFloat(hours.toFixed(1)) };
    });
  }, [periodData]);

  const handlePrevWeek = () => {
    if (weekIdx > 0) setWeekIdx(weekIdx - 1);
  };

  const handleNextWeek = () => {
    if (weekIdx < WEEKS.length - 1) setWeekIdx(weekIdx + 1);
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 text-left">
      {/* 頂部切換與標題 */}
      <div className="flex items-center justify-between bg-black/20 p-5 rounded-t-[2rem] border-x border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-blue-600/10 text-blue-400 rounded-xl border border-blue-500/20 shadow-inner">
             <History size={18} />
          </div>
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-widest">睡眠時段紀錄歷史</h4>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mt-0.5">Sleep duration & period mapping</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 p-1 bg-[#050914] border border-slate-800 rounded-2xl shadow-inner">
           <button 
             onClick={() => setViewMode('timeline')}
             className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'timeline' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
           >
             <LayoutList size={14}/> 時序分佈
           </button>
           <button 
             onClick={() => setViewMode('stats')}
             className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'stats' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
           >
             <BarChart3 size={14}/> 時長統計
           </button>
        </div>
      </div>

      {/* --- Sticky Week Selector (與分區設計一致) --- */}
      <div className="sticky top-0 z-50 bg-[#0a0f1e]/90 backdrop-blur-md border-x border-b border-slate-800 px-8 py-4 flex items-center justify-between shadow-2xl">
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
                  <ChevronLeft size={18} strokeWidth={3} />
                </button>
                <div className="min-w-[160px] text-center">
                  <span className="text-sm font-black text-white tracking-wide">{selectedWeek.label}</span>
                </div>
                <button 
                  onClick={handleNextWeek} 
                  disabled={weekIdx === WEEKS.length - 1}
                  className={`p-2 rounded-xl transition-all ${weekIdx === WEEKS.length - 1 ? 'text-slate-700' : 'text-blue-500 hover:bg-blue-600/10 active:scale-90'}`}
                >
                  <ChevronRight size={18} strokeWidth={3} />
                </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold text-slate-600 italic">更新：{now.toLocaleTimeString()}</span>
            <button onClick={() => alert("正在同步個人健康雲數據...")} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg border border-slate-700 transition-all"><RefreshCw size={14}/></button>
          </div>
      </div>

      <div className="flex-1 p-8 space-y-6">
        <div className="bg-[#111827] border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
          {viewMode === 'timeline' ? (
            <div className="space-y-4 animate-in slide-in-from-left-4 duration-300">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Weekly Sleep Timeline Overlay</span>
                  <span className="text-xs font-black text-blue-400 uppercase tracking-widest italic">{selectedWeek.label}</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-indigo-500/40 rounded-sm"></div><span className="text-[10px] font-black text-slate-500 uppercase">睡眠區間</span></div>
                </div>
              </div>
              {DAYS.map((day, idx) => (
                <div key={day} className="flex items-center gap-6 group/row">
                  <div className="w-10 text-[11px] font-black text-slate-600 group-hover/row:text-blue-400 transition-colors">{day}</div>
                  <div className="flex-1 h-10 bg-slate-900/60 rounded-lg relative border border-white/5 overflow-hidden">
                    {periodData.filter(p => p.day === idx).map((p, pIdx) => (
                      <div 
                        key={pIdx}
                        className="absolute h-full bg-indigo-500/40 border-x border-indigo-400/20 flex items-center justify-center group/block"
                        style={{ left: `${(p.start / 24) * 100}%`, width: `${((p.end - p.start) / 24) * 100}%` }}
                      >
                         <div className="opacity-0 group-hover/block:opacity-100 transition-opacity bg-indigo-900 px-2 py-0.5 rounded text-[8px] font-black text-white whitespace-nowrap shadow-xl border border-indigo-500">
                            {p.start.toFixed(1)}h - {p.end.toFixed(1)}h
                         </div>
                      </div>
                    ))}
                    {/* 時刻線 */}
                    <div className="absolute inset-0 grid grid-cols-6 pointer-events-none opacity-[0.05]">
                      {Array.from({length: 6}).map((_, i) => <div key={i} className="border-r border-white h-full"></div>)}
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex justify-between mt-6 pt-4 border-t border-white/5 text-[9px] font-black text-slate-700 uppercase tracking-widest px-16">
                 <span>00:00</span><span>04:00</span><span>08:00</span><span>12:00</span><span>16:00</span><span>20:00</span><span>24:00</span>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
               <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                 <div className="flex flex-col gap-1">
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Daily Accumulated Duration</span>
                   <span className="text-xs font-black text-blue-400 uppercase tracking-widest italic">{selectedWeek.label}</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <Timer size={14} className="text-blue-500" />
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Avg: {(dailyStats.reduce((a, b) => a + b.hours, 0) / 7).toFixed(1)} Hours / Day</span>
                 </div>
              </div>
              {dailyStats.map((stat, i) => (
                <div key={stat.day} className="flex items-center gap-6 group/row">
                   <div className="w-10 text-[11px] font-black text-slate-600 group-hover/row:text-blue-400 transition-colors">{stat.day}</div>
                   <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-center px-1">
                         <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">睡眠總時長</span>
                         <span className="text-[10px] font-mono font-black text-indigo-400">{stat.hours} 小時</span>
                      </div>
                      <div className="h-4 bg-slate-900 rounded-full p-0.5 border border-white/5 shadow-inner">
                         <div 
                           className="h-full bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.3)] transition-all duration-1000" 
                           style={{ width: `${(stat.hours / 12) * 100}%` }}
                         ></div>
                      </div>
                   </div>
                </div>
              ))}
              <div className="flex justify-between mt-6 pt-4 border-t border-white/5 text-[9px] font-black text-slate-700 uppercase tracking-widest px-16">
                 <span>0h</span><span>3h</span><span>6h</span><span>9h</span><span>12h</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-indigo-600/5 border border-dashed border-indigo-500/20 p-6 rounded-[2rem] flex items-center gap-5">
           <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-500 shadow-inner">
              <Moon size={24} />
           </div>
           <div className="space-y-1">
              <h5 className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Sparkles size={12} className="text-indigo-400" /> 睡眠品質分析報告 ({selectedWeek.id === 'curr' ? '本週' : '歷史'})
              </h5>
              <p className="text-xs text-slate-500 font-medium leading-relaxed italic">
                根據 {selectedWeek.label} 數據，平均睡眠時長為 {(dailyStats.reduce((a, b) => a + b.hours, 0) / 7).toFixed(1)} 小時。
                {weekIdx === 1 ? " 上週活動量較大，睡眠品質呈現輕微波動。" : " 本週睡眠規律度維持在 85% 以上。"}
              </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PeriodHistory;