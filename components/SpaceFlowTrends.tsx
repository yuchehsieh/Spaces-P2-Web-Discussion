import React, { useState, useMemo } from 'react';
import { Users, Info, Clock } from 'lucide-react';

type TimeRange = 'day' | 'week' | 'month' | 'half_year' | 'year';

const SpaceFlowTrends: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('day');
  const currentHour = new Date().getHours();

  const timeOptions = [
    { id: 'day', label: '日' },
    { id: 'week', label: '週' },
    { id: 'month', label: '月' },
    { id: 'half_year', label: '半年' },
    { id: 'year', label: '年' }
  ];

  // 模擬加總數據
  const mockData = useMemo(() => {
    const generate = (len: number, base: number) => Array.from({ length: len }, (_, i) => ({
      label: i.toString(),
      val: Math.floor(base + Math.random() * (base * 0.8))
    }));

    return {
      day: generate(24, 40),
      week: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => ({ label: d, val: 800 + Math.random() * 400 })),
      month: generate(30, 600),
      half_year: ['1月', '2月', '3月', '4月', '5月', '6月'].map(m => ({ label: m, val: 12000 + Math.random() * 5000 })),
      year: ['Q1', 'Q2', 'Q3', 'Q4'].map(q => ({ label: q, val: 45000 + Math.random() * 15000 }))
    };
  }, []);

  const currentData = mockData[timeRange];
  const maxVal = Math.max(...currentData.map(d => d.val)) * 1.2;

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between bg-black/20 p-5 rounded-[2.5rem] border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600/10 text-blue-400 rounded-2xl border border-blue-500/20 shadow-inner">
             <Users size={20} />
          </div>
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-widest">人流進出歷史趨勢 (加總人數)</h4>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mt-0.5">Total hourly/period volumetric activity</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 p-1 bg-[#050914] border border-slate-800 rounded-2xl shadow-inner">
           {timeOptions.map(opt => (
             <button 
               key={opt.id}
               onClick={() => setTimeRange(opt.id as TimeRange)}
               className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeRange === opt.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
             >
               {opt.label}
             </button>
           ))}
        </div>
      </div>

      <div className="bg-[#1e293b]/30 border border-slate-800 rounded-[3rem] p-10 pt-16 shadow-2xl relative overflow-hidden">
         <div className="absolute top-8 right-10 flex items-center gap-4">
            <div className="flex items-center gap-2">
               <div className="w-2.5 h-2.5 rounded-full bg-blue-600/30"></div>
               <span className="text-[9px] font-black text-slate-500 uppercase">歷史平均</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
               <span className="text-[9px] font-black text-slate-500 uppercase">今日即時</span>
            </div>
         </div>

         <div className="h-64 w-full flex items-end gap-[4px] relative border-b border-white/5 pb-8">
            {currentData.map((d, i) => {
               const isCurrent = timeRange === 'day' && i === currentHour;
               const heightPct = (d.val / maxVal) * 100;
               
               return (
                 <div key={i} className="flex-1 group/bar relative h-full flex flex-col justify-end items-center">
                    <div 
                      className={`w-full rounded-t-sm transition-all duration-700 relative z-10 ${
                        isCurrent 
                          ? 'bg-[#ff70a0] shadow-[0_0_20px_rgba(255,112,160,0.6)]' 
                          : 'bg-blue-600/60 group-hover/bar:bg-blue-500'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    >
                       {isCurrent && (
                         <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <div className="w-2 h-2 bg-[#ff0055] rounded-full ring-4 ring-[#ff70a0]/30 animate-pulse"></div>
                         </div>
                       )}
                    </div>

                    <div className={`absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-black font-mono ${isCurrent ? 'text-white' : 'text-slate-600'} uppercase`}>
                       {timeRange === 'day' ? (i < 10 ? `0${i}` : i) : d.label}
                    </div>

                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-black shadow-2xl opacity-0 group-hover/bar:opacity-100 transition-all pointer-events-none z-50 whitespace-nowrap border border-white/10">
                       {Math.round(d.val)} Pax
                       <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-600 rotate-45"></div>
                    </div>
                 </div>
               );
            })}
         </div>
      </div>

      <div className="flex items-center gap-4 px-6 py-4 bg-blue-600/5 border border-dashed border-blue-500/20 rounded-2xl">
         <Info size={16} className="text-blue-500 shrink-0" />
         <p className="text-[10px] font-bold text-slate-500 leading-relaxed italic uppercase tracking-widest">
            {timeRange === 'day' ? `目前標註顯示 24 小時時序加總人數，目前時間為 ${currentHour}:00。` : `目前顯示${timeOptions.find(o => o.id === timeRange)?.label}時段之數據。`}
         </p>
      </div>
    </div>
  );
};

export default SpaceFlowTrends;