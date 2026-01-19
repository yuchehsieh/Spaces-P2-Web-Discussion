import React from 'react';
import { CalendarDays, BarChart3, Target, Clock, TrendingUp as TrendingUpIcon } from 'lucide-react';

const CumulativeCard = ({ 
  icon, label, value, unit, trend, trendVal, trendLabel, color 
}: { 
  icon: React.ReactNode; label: string; value: string; unit: string; trend: 'up' | 'down'; trendVal: string; trendLabel: string; color: 'blue' | 'emerald' | 'amber';
}) => {
  const colorMap = {
    blue: 'text-blue-500 bg-blue-600/10 border-blue-500/30',
    emerald: 'text-emerald-500 bg-emerald-600/10 border-emerald-500/30',
    amber: 'text-amber-500 bg-amber-600/10 border-amber-500/30'
  };
  return (
    <div className="bg-[#1e293b]/40 border border-slate-800 p-8 rounded-[2.5rem] flex flex-col gap-6 group hover:border-slate-600 transition-all shadow-xl relative overflow-hidden">
       <div className="flex items-center justify-between relative z-10">
          <div className={`p-4 rounded-2xl ${colorMap[color].split(' ')[1]} ${colorMap[color].split(' ')[0]}`}>{icon}</div>
          <div className="flex flex-col items-end gap-1">
             <div className={`flex items-center gap-1 text-[11px] font-black uppercase ${trend === 'up' ? 'text-red-500' : 'text-blue-500'}`}>
                {trend === 'up' ? <TrendingUpIcon size={14}/> : <TrendingUpIcon size={14}/>} {trendVal}
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
    </div>
  );
};

const SiteCumulativeAnalysis: React.FC = () => {
  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-500">
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CumulativeCard icon={<CalendarDays size={32}/>} label="本月累計人流" value="32,480" unit="Pax" trend="up" trendVal="12.5%" trendLabel="MoM" color="blue" />
          <CumulativeCard icon={<BarChart3 size={32}/>} label="本季累計人流" value="98,125" unit="Pax" trend="up" trendVal="8.2%" trendLabel="QoQ" color="emerald" />
          <CumulativeCard icon={<Target size={32}/>} label="本年度累計" value="385,000" unit="Pax" trend="down" trendVal="2.1%" trendLabel="YoY" color="amber" />
       </div>
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-[#1e293b]/40 border border-slate-800 rounded-[2.5rem] p-8 space-y-8 h-full shadow-xl">
             <h4 className="text-sm font-black text-white uppercase tracking-widest border-b border-white/5 pb-4">平均運營指標 (AVG)</h4>
             <div className="space-y-8">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-600/10 text-blue-500 rounded-2xl"><Clock size={20}/></div>
                      <div className="flex flex-col">
                         <span className="text-[10px] font-black text-slate-500 uppercase">每日平均人流</span>
                         <span className="text-xl font-black text-white font-mono">1,082</span>
                      </div>
                   </div>
                   <span className="text-[10px] font-black text-green-500 bg-green-500/10 px-2 py-1 rounded">穩健</span>
                </div>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-600/10 text-purple-500 rounded-2xl"><CalendarDays size={20}/></div>
                      <div className="flex flex-col">
                         <span className="text-[10px] font-black text-slate-500 uppercase">每週平均人流</span>
                         <span className="text-xl font-black text-white font-mono">7,580</span>
                      </div>
                   </div>
                   <span className="text-[10px] font-black text-red-400 bg-red-400/10 px-2 py-1 rounded">接近極限</span>
                </div>
             </div>
          </div>
          <div className="lg:col-span-2 bg-[#1e293b]/40 border border-slate-800 rounded-[2.5rem] p-10 space-y-10 shadow-2xl relative overflow-hidden">
             <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl"><TrendingUpIcon size={20}/></div>
                   <div>
                      <h4 className="text-lg font-black text-white tracking-tight uppercase italic">年度累計流量對比 (2025 vs 2024)</h4>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">逐月累積曲線分佈</span>
                   </div>
                </div>
                <div className="flex gap-4">
                   <div className="flex items-center gap-2"><div className="w-3 h-0.5 bg-slate-600 border border-dashed border-slate-500"></div><span className="text-[10px] font-black text-slate-500">2024 (去年)</span></div>
                   <div className="flex items-center gap-2"><div className="w-3 h-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div><span className="text-[10px] font-black text-blue-500">2025 (今年)</span></div>
                </div>
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
  );
};

export default SiteCumulativeAnalysis;