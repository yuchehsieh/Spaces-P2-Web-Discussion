import React from 'react';
import { Monitor, RefreshCw, PieChart, Medal, ArrowUpRight, TrendingDown, Zap, Shield, Navigation, ExternalLink } from 'lucide-react';

const SiteDeviceComparison: React.FC = () => {
  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-500">
       <div className="flex items-center justify-between bg-black/20 p-6 rounded-[2.5rem] border border-slate-800 shrink-0 shadow-lg">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-blue-600/10 text-blue-500 rounded-2xl"><Monitor size={20}/></div>
             <div>
                <h4 className="text-sm font-black text-white uppercase tracking-widest">入口流量貢獻分析</h4>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">定位空間效率與安全需求分布</span>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 p-1 bg-[#050914] border border-slate-800 rounded-2xl shadow-inner mr-2">
               {['day', 'week', 'month'].map(period => (
                 <button key={period} className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${period === 'week' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-600 hover:text-slate-400'}`}>
                   {period === 'day' ? '當日' : period === 'week' ? '本週' : '本月'}
                 </button>
               ))}
             </div>
             <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-900/40">選取對比設備</button>
             <button className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl border border-slate-700 transition-all"><RefreshCw size={18}/></button>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-[#1e293b]/40 border border-slate-800 rounded-[2.5rem] p-10 flex flex-col items-center justify-center shadow-xl relative overflow-hidden group">
             <div className="absolute top-6 left-6 text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <PieChart size={14} className="text-blue-500" /> 入口人流占比 (Share)
             </div>
             <div className="relative w-48 h-48 mb-10 group-hover:scale-105 transition-transform duration-700">
                <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 100 100">
                   <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="14" />
                   <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="14" strokeDasharray="113 251.2" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
                   <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="14" strokeDasharray="75 251.2" strokeDashoffset="-113" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                   <circle cx="50" cy="50" r="40" fill="none" stroke="#a855f7" strokeWidth="14" strokeDasharray="63 251.2" strokeDashoffset="-188" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                   <span className="text-4xl font-black text-white font-mono tracking-tighter">100%</span>
                   <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mt-1 italic">Normalized</span>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-x-10 gap-y-5 w-full border-t border-white/5 pt-8">
                {[
                   { label: '大門', pct: 45, color: 'bg-blue-500', total: '12.5k' },
                   { label: '後門', pct: 30, color: 'bg-emerald-500', total: '8.2k' },
                   { label: '側門A', pct: 25, color: 'bg-purple-500', total: '6.8k' }
                ].map((item, idx) => (
                   <div key={idx} className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${item.color} shadow-lg shadow-black/40`}></div>
                      <div className="flex flex-col">
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.label}</span>
                         <div className="flex items-baseline gap-2">
                            <span className="text-base font-black text-white font-mono">{item.pct}%</span>
                            <span className="text-[9px] font-bold text-slate-600 italic">({item.total})</span>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
             <div className="bg-[#1e293b]/40 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden flex flex-col h-full">
                <h4 className="text-sm font-black text-white uppercase tracking-widest mb-10 flex items-center gap-3">
                   <Medal size={20} className="text-amber-500" /> 入口貢獻度排行 (Entrance Performance)
                </h4>
                <div className="space-y-10 flex-1">
                   {[
                      { name: '大門偵測點 (Main Entrance)', val: 452, pct: 45, trend: 'up', trendVal: '15%', color: 'from-blue-600 to-blue-400', desc: '核心流量入口，主要顧客動線' },
                      { name: '後門偵測點 (Staff Exit)', val: 284, pct: 28, trend: 'down', trendVal: '4%', color: 'from-emerald-600 to-emerald-400', desc: '員工與後勤進出，流量穩定' },
                      { name: '側門A (Delivery Bay)', val: 182, pct: 18, trend: 'up', trendVal: '32%', color: 'from-purple-600 to-purple-400', desc: '物料配送區，近期物流密度增加' },
                      { name: '側門B (Emergency)', val: 92, pct: 9, trend: 'normal', trendVal: '-', color: 'from-slate-700 to-slate-500', desc: '僅供緊急或特殊時段開啟' }
                   ].map((item, idx) => (
                      <div key={idx} className="space-y-3 group/row">
                         <div className="flex justify-between items-end">
                            <div className="flex items-center gap-4">
                               <span className="text-3xl font-black text-slate-800 italic group-hover/row:text-blue-500 transition-colors duration-500">0{idx+1}</span>
                               <div className="flex flex-col">
                                  <span className="text-xs font-black text-slate-200 uppercase tracking-tight">{item.name}</span>
                                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{item.desc}</span>
                               </div>
                            </div>
                            <div className="flex items-baseline gap-6">
                               <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tighter ${item.trend === 'up' ? 'text-red-500 bg-red-500/10' : item.trend === 'down' ? 'text-blue-500 bg-blue-500/10' : 'text-slate-600'} px-2 py-0.5 rounded-md`}>
                                  {item.trend === 'up' ? <ArrowUpRight size={12}/> : item.trend === 'down' ? <TrendingDown size={12}/> : null}
                                  {item.trendVal}
                               </div>
                               <div className="flex flex-col items-end">
                                  <span className="text-2xl font-black text-white font-mono leading-none tracking-tighter">{item.val}</span>
                                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Daily Average</span>
                               </div>
                            </div>
                         </div>
                         <div className="h-3 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5 shadow-inner">
                            <div className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(0,0,0,0.5)]`} style={{ width: `${item.pct}%` }}></div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
       </div>

       <div className="bg-[#1e293b] border border-slate-700 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
          <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
             <div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] flex items-center justify-center text-white shrink-0 shadow-2xl shadow-blue-900/50 group-hover:rotate-[10deg] transition-transform duration-500">
                <Zap size={50} />
             </div>
             <div className="flex-1 space-y-6">
                <div className="flex items-center gap-4">
                   <h4 className="text-2xl font-black text-white italic tracking-tighter uppercase">AI 空間配置與人力優化建議</h4>
                   <div className="px-3 py-1 bg-blue-600 text-[10px] font-black text-white rounded-lg tracking-widest animate-pulse">STRATEGY READY</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-3">
                      <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-widest"><Shield size={16}/> 安防與人力配置</div>
                      <p className="text-sm text-slate-400 leading-relaxed font-medium">數據顯示 <span className="text-white font-black">大門偵測點</span> 承載了總體 45% 的流量。建議在下午 <span className="text-blue-400 font-bold">15:00~17:00</span> 尖峰時段增派 <span className="text-white font-black">1 名保全人員</span> 於前廳值勤。</p>
                   </div>
                   <div className="space-y-3">
                      <div className="flex items-center gap-2 text-purple-400 font-black text-xs uppercase tracking-widest"><Navigation size={16}/> 動線與空間調整</div>
                      <p className="text-sm text-slate-400 leading-relaxed font-medium">偵測到 <span className="text-white font-black">側門A (物料區)</span> 流量近期增長 32%。建議將非急迫性之 <span className="text-blue-400 font-bold">物流配送任務</span> 調整至上午 10:00 前執行。</p>
                   </div>
                </div>
             </div>
             <div className="shrink-0 flex flex-col gap-3">
                <button className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2">生成詳細報告 <ExternalLink size={14}/></button>
             </div>
          </div>
       </div>
    </div>
  );
};

export default SiteDeviceComparison;