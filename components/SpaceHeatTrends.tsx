import React, { useState, useMemo } from 'react';
import { Layers, Flame, Clock } from 'lucide-react';

type TimeRange = 'day' | 'week' | 'month' | 'half_year' | 'year';

// 統一且高對比的橘色系比例尺
const HEATMAP_COLORS = [
  { range: '0', label: '0人', color: 'rgba(51, 65, 85, 0.4)', hex: '#334155' },
  { range: '1-2', label: '1-2人', color: 'rgba(253, 186, 116, 0.65)', hex: '#fdba74' },
  { range: '3-4', label: '3-4人', color: 'rgba(249, 115, 22, 0.75)', hex: '#f97316' },
  { range: '5-6', label: '5-6人', color: 'rgba(234, 88, 12, 0.85)', hex: '#ea580c' },
  { range: '7-8', label: '7-8人', color: 'rgba(194, 65, 12, 0.9)', hex: '#c2410c' },
  { range: '8+', label: '8人以上', color: 'rgba(154, 52, 18, 0.95)', hex: '#9a3412' },
];

const SpaceHeatTrends: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const timeOptions = [
    { id: 'day', label: '日' },
    { id: 'week', label: '週' },
    { id: 'month', label: '月' },
    { id: 'half_year', label: '半年' },
    { id: 'year', label: '年' }
  ];

  const matrixData = useMemo(() => {
    const rows = 12;
    const cols = timeRange === 'day' ? 1 : (timeRange === 'week' ? 7 : (timeRange === 'month' ? 30 : (timeRange === 'half_year' ? 24 : 12)));
    return Array.from({ length: rows * cols }, () => Math.floor(Math.random() * 6));
  }, [timeRange]);

  const yLabels = ['12AM', '2AM', '4AM', '6AM', '8AM', '10AM', '12PM', '2PM', '4PM', '6PM', '8PM', '10PM'];
  const xLabels = useMemo(() => {
    if (timeRange === 'day') return ['Today'];
    if (timeRange === 'week') return ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    if (timeRange === 'month') return ['1', '5', '10', '15', '20', '25', '30'];
    return ['Q1', 'Q2', 'Q3', 'Q4'];
  }, [timeRange]);

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between bg-black/20 p-5 rounded-[2.5rem] border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-600/10 text-orange-500 rounded-2xl border border-orange-500/20">
             <Flame size={20} />
          </div>
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-widest">空間熱度歷史趨勢分析</h4>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mt-0.5">Average spatial occupancy heat matrix</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 p-1 bg-[#050914] border border-slate-800 rounded-2xl">
           {timeOptions.map(opt => (
             <button 
               key={opt.id}
               onClick={() => setTimeRange(opt.id as TimeRange)}
               className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeRange === opt.id ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
             >
               {opt.label}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
         <div className="xl:col-span-3 bg-[#111827] border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl relative">
            <div className="flex">
               <div className="w-16 flex flex-col justify-between py-2 pr-4 border-r border-white/5">
                  {yLabels.map(label => (
                    <span key={label} className="text-[10px] font-black text-slate-600 uppercase text-right h-10 flex items-center justify-end">{label}</span>
                  ))}
               </div>
               <div className="flex-1 flex flex-col pl-4">
                  <div className="flex justify-between mb-6 px-1">
                     {xLabels.map(label => (
                       <span key={label} className="flex-1 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
                     ))}
                  </div>
                  <div className={`grid gap-1.5 h-[500px] ${timeRange === 'day' ? 'grid-cols-1' : timeRange === 'week' ? 'grid-cols-7' : 'grid-cols-[repeat(auto-fit,minmax(10px,1fr))]'}`}>
                     {matrixData.map((level, i) => (
                        <div 
                           key={i} 
                           onMouseEnter={() => setHoveredIdx(i)}
                           onMouseLeave={() => setHoveredIdx(null)}
                           className="rounded-sm transition-all relative cursor-crosshair hover:ring-2 hover:ring-white/40 hover:z-10"
                           style={{ backgroundColor: HEATMAP_COLORS[level].hex }}
                        >
                           {hoveredIdx === i && (
                              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-3 py-2 rounded-lg text-[10px] font-black shadow-2xl whitespace-nowrap z-[100] border border-white/10 animate-in zoom-in-95">
                                 平均熱度：{HEATMAP_COLORS[level].label}
                                 <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-800 rotate-45"></div>
                              </div>
                           )}
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>

         <div className="bg-[#1e293b]/40 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl flex flex-col">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
               <Layers size={16} className="text-orange-500" />
               <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">熱度比例尺對照</span>
            </div>
            <div className="space-y-4 flex-1">
               {HEATMAP_COLORS.slice().reverse().map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 bg-black/20 rounded-xl border border-white/5 group hover:bg-black/40 transition-colors">
                     <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded shadow-[0_0_10px_rgba(0,0,0,0.5)] border border-white/20" style={{ backgroundColor: item.hex }}></div>
                        <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{item.label}</span>
                     </div>
                     <span className="text-[10px] font-mono font-black text-slate-600 uppercase italic">{item.range} Pax</span>
                  </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};

export default SpaceHeatTrends;