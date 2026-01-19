import React from 'react';
import { 
  Users, 
  Activity, 
  TrendingUp as TrendingUpIcon, 
  BarChart3, 
  ArrowLeftRight, 
  Target, 
  Compass, 
  Layers, 
  ArrowUpCircle,
  Timer
} from 'lucide-react';

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
                <TrendingUpIcon size={14}/> {trendVal}
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

const MetricBox = ({ title, children, icon }: { title: string; children?: React.ReactNode, icon?: React.ReactNode }) => (
  <div className="bg-[#0f172a]/60 border border-slate-800 p-6 rounded-[2rem] space-y-4 flex flex-col justify-between hover:border-blue-500/30 transition-all group shadow-lg">
    <div className="flex items-center gap-2">
      {icon && <div className="text-blue-500">{icon}</div>}
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</span>
    </div>
    {children}
  </div>
);

const SiteDailyOverview: React.FC = () => {
  const currentHour = new Date().getHours();
  // 模擬歷史平均數據
  const avgFlowData = [12, 8, 15, 42, 60, 35, 20, 18, 25, 30, 45, 80, 110, 125, 142, 130, 95, 70, 50, 35, 20, 15, 10, 5];
  // 模擬今日即時數據
  const todayFlowData = avgFlowData.map((v, i) => i <= currentHour ? v + (Math.random() * 20 - 5) : 0);
  
  const currentRealVal = Math.round(avgFlowData[currentHour] + 15); // 強制模擬一個繁忙的當前小時
  const currentAvgVal = avgFlowData[currentHour];
  const isBusier = currentRealVal > currentAvgVal;

  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-500 pb-10">
       {/* 第一層：核心指標卡片 */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CumulativeCard icon={<Users size={32}/>} label="今日人流總數" value="1,248" unit="Pax Today" trend="up" trendVal="5.4%" trendLabel="Vs Yesterday" color="blue" />
          <CumulativeCard icon={<Activity size={32}/>} label="當前場內人數" value="70" unit="Live Now" trend="up" trendVal="Live" trendLabel="Realtime" color="emerald" />
          <CumulativeCard icon={<TrendingUpIcon size={32}/>} label="今日流量峰值" value="142" unit="@ 15:00" trend="up" trendVal="Peak" trendLabel="Target" color="amber" />
       </div>

       {/* 第二層：24H 活動趨勢圖 (優化對比顯示) */}
       <div className="bg-[#1e293b]/40 border border-slate-800 rounded-[3rem] p-10 space-y-10 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-xl"><BarChart3 size={20}/></div>
                <div>
                   <h4 className="text-lg font-black text-white tracking-tight uppercase italic">今日人流活動趨勢 (24H)</h4>
                   <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">每小時流量活動密度對比</span>
                      <div className="flex items-center gap-3 px-3 py-1 bg-black/40 rounded-lg border border-white/5">
                         <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-600/30"></div><span className="text-[8px] font-bold text-slate-500 uppercase">歷史平均</span></div>
                         <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div><span className="text-[8px] font-bold text-slate-500 uppercase">今日即時</span></div>
                      </div>
                   </div>
                </div>
             </div>
             <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                   <div className="px-2 py-0.5 bg-red-600 text-white text-[9px] font-black rounded border border-red-500 shadow-lg shadow-red-900/20">即時資料</div>
                   <span className={`text-sm font-black italic ${isBusier ? 'text-red-500' : 'text-emerald-500'}`}>
                      {isBusier ? '▲ 較平均多 12%' : '▼ 較平均少 5%'}
                   </span>
                </div>
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">當前時段動態對比</span>
             </div>
          </div>

          <div className="h-64 w-full flex items-end gap-[6px] px-4 relative z-10 border-b border-white/5 pb-8">
             {avgFlowData.map((avgVal, idx) => { 
                const isCurrent = idx === currentHour;
                const isPast = idx < currentHour;
                
                const avgHeight = (avgVal / 160) * 100;
                const todayVal = isCurrent ? currentRealVal : (isPast ? todayFlowData[idx] : 0);
                const todayHeight = (todayVal / 160) * 100;

                return (
                  <div key={idx} className="flex-1 group/bar relative h-full flex flex-col justify-end items-center">
                     {/* 歷史平均底色 */}
                     <div className="absolute bottom-0 w-full bg-blue-600/10 rounded-t-sm" style={{ height: `${avgHeight}%` }}></div>
                     
                     {/* 今日數據條 */}
                     <div 
                        className={`w-full rounded-t-sm transition-all duration-700 relative z-10 ${
                           isCurrent 
                              ? 'bg-[#ff70a0] shadow-[0_0_15px_rgba(255,112,160,0.5)]' 
                              : isPast 
                                 ? 'bg-blue-600/60' 
                                 : 'bg-transparent'
                        }`} 
                        style={{ height: `${todayHeight}%` }}
                     >
                        {isCurrent && (
                           <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#ff0055] rounded-full ring-2 ring-white z-20 animate-pulse"></div>
                        )}
                     </div>

                     <div className={`absolute -bottom-8 left-1/2 -translate-x-1/2 text-[9px] font-black ${isCurrent ? 'text-white' : 'text-slate-600'} group-hover/bar:text-slate-200 transition-colors uppercase`}>
                        {idx < 10 ? `0${idx}` : idx}
                     </div>
                  </div>
                );
             })}
          </div>
       </div>

       {/* 第三層：進階人流特徵分析 */}
       <div className="space-y-6">
          <div className="flex items-center gap-4 px-2">
             <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
             <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Advanced Flow Analytics / 進階人流分析</h4>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {/* 1. 進出比 (In-Out Ratio) */}
             <MetricBox title="進出比 (In-Out Ratio)" icon={<ArrowLeftRight size={14}/>}>
                <div className="flex items-center justify-between">
                   <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white font-mono">1.06</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter italic">Ratio</span>
                   </div>
                   <div className="flex flex-col items-end">
                      <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 rounded-lg text-[9px] font-black uppercase tracking-widest mb-1">
                         穩定流動 (Stable)
                      </div>
                      <span className="text-[8px] text-slate-600 font-bold uppercase">無異常滯留風險</span>
                   </div>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                   <div className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: '51%' }}></div>
                   <div className="h-full bg-slate-700" style={{ width: '49%' }}></div>
                </div>
             </MetricBox>

             {/* 2. 人流集中度 (Flow Concentration) */}
             <MetricBox title="人流集中度 (Concentration)" icon={<Target size={14}/>}>
                <div className="flex items-center justify-between">
                   <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white font-mono">11.4</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase italic">%</span>
                   </div>
                   <div className="px-3 py-1 bg-blue-500/10 text-blue-500 border border-blue-500/30 rounded-lg text-[9px] font-black uppercase tracking-widest">
                      中度集中 (Balanced)
                   </div>
                </div>
                <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                   <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-blue-400" style={{ width: '11.4%' }}></div>
                   <div className="absolute top-0 left-[25%] w-px h-full bg-white/10" title="高集中度閾值"></div>
                </div>
                <p className="text-[9px] text-slate-600 font-bold leading-tight">尖峰時段佔今日總量之 11.4%，人流分布相對平衡。</p>
             </MetricBox>

             {/* 3. 尖峰偏移分析 (Peak Shift) */}
             <MetricBox title="尖峰偏移分析 (Peak Shift)" icon={<Compass size={14}/>}>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-600/10 text-blue-500 rounded-xl"><Timer size={18}/></div>
                      <div className="flex flex-col">
                         <span className="text-lg font-black text-white font-mono tracking-tighter">15:00 <span className="text-[10px] text-slate-600">Today</span></span>
                         <span className="text-[9px] font-bold text-slate-600 uppercase">Avg: 15:30</span>
                      </div>
                   </div>
                   <div className="flex items-center gap-1.5 text-blue-400">
                      <ArrowUpCircle size={20} className="animate-pulse" />
                      <div className="flex flex-col items-end">
                         <span className="text-sm font-black font-mono">30 min</span>
                         <span className="text-[8px] font-black uppercase italic">Preceded</span>
                      </div>
                   </div>
                </div>
                <p className="text-[9px] text-slate-600 font-bold leading-tight">今日人潮高峰較歷史平均提前 30 分鐘出現。</p>
             </MetricBox>

             {/* 4. 區域貢獻度 (Contribution) */}
             <MetricBox title="主要入口貢獻度 (Contribution)" icon={<Layers size={14}/>}>
                <div className="space-y-3">
                   {[
                      { name: '大門 Entrance', pct: 45, color: 'bg-blue-500' },
                      { name: '後門 Staff', pct: 30, color: 'bg-blue-600/60' },
                      { name: '側門A Logistic', pct: 25, color: 'bg-blue-800/40' }
                   ].map((item, i) => (
                      <div key={i} className="space-y-1">
                         <div className="flex justify-between text-[9px] font-black uppercase tracking-tight">
                            <span className="text-slate-400">{item.name}</span>
                            <span className="text-white">{item.pct}%</span>
                         </div>
                         <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full ${item.color}`} style={{ width: `${item.pct}%` }}></div>
                         </div>
                      </div>
                   ))}
                </div>
             </MetricBox>
          </div>
       </div>

       {/* 底部說明文字 */}
       <div className="bg-blue-600/5 border border-blue-500/10 p-5 rounded-2xl flex items-start gap-4">
          <div className="p-2 bg-blue-600/10 text-blue-500 rounded-lg shrink-0"><BarChart3 size={16}/></div>
          <div className="space-y-1">
             <h5 className="text-[11px] font-black text-white uppercase tracking-widest">智能空間洞察提示</h5>
             <p className="text-xs text-slate-500 font-medium leading-relaxed italic">
                根據今日數據特徵，區域進出比接近 1.0 且尖峰時間偏移顯示活動提早開始。目前空間流動效率極佳，建議持續觀測側門 A 的物流流量變化。
             </p>
          </div>
       </div>
    </div>
  );
};

export default SiteDailyOverview;