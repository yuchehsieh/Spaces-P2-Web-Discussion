import React, { useState } from 'react';
import { ArrowLeftRight, RefreshCw, Layers, ArrowRightLeft, TrendingUp } from 'lucide-react';

const SiteTimeComparison: React.FC = () => {
  const [comparisonType, setComparisonType] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('day');
  const [periodA, setPeriodA] = useState('2025-12-18');
  const [periodB, setPeriodB] = useState('2024-12-18');

  const handleComparisonTypeChange = (type: any) => {
    setComparisonType(type);
    if (type === 'day') { setPeriodA('2025-12-18'); setPeriodB('2025-12-17'); }
    else if (type === 'week') { setPeriodA('2025-W51'); setPeriodB('2025-W50'); }
    else if (type === 'month') { setPeriodA('2025-12'); setPeriodB('2025-11'); }
    else if (type === 'quarter') { setPeriodA('2025-Q4'); setPeriodB('2025-Q3'); }
    else if (type === 'year') { setPeriodA('2025'); setPeriodB('2024'); }
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 h-full">
       <div className="flex flex-col gap-6 bg-black/20 p-8 rounded-[2.5rem] border border-slate-800 shrink-0 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2 p-1 bg-[#050914] border border-slate-800 rounded-2xl shadow-inner">
               {['day', 'week', 'month', 'quarter', 'year'].map(type => (
                 <button key={type} onClick={() => handleComparisonTypeChange(type as any)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${comparisonType === type ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>{type === 'day' ? '日比較' : type === 'week' ? '週比較' : type === 'month' ? '月比較' : type === 'quarter' ? '季比較' : '年比較'}</button>
               ))}
            </div>
            <div className="flex items-center gap-4">
               <button className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-700 transition-all">套用預設 (去年同期)</button>
               <button className="p-2.5 bg-blue-600/10 text-blue-500 rounded-xl border border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all"><RefreshCw size={18}/></button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
             <div className="space-y-4"><label className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> 選取基準時段 (A)</label><input type="date" value={periodA} onChange={e => setPeriodA(e.target.value)} className="w-full bg-[#111827] border border-slate-700 rounded-xl py-3 px-5 text-sm font-black text-white outline-none focus:border-blue-500 [color-scheme:dark]" /></div>
             <div className="space-y-4"><label className="text-[10px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-2"><div className="w-2 h-2 rounded-full border border-purple-500"></div> 選取對比時段 (B)</label><input type="date" value={periodB} onChange={e => setPeriodB(e.target.value)} className="w-full bg-[#111827] border border-slate-700 rounded-xl py-3 px-5 text-sm font-black text-white outline-none focus:border-purple-500 [color-scheme:dark]" /></div>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 min-h-0">
          <div className="lg:col-span-1 space-y-6">
             <div className="bg-[#1e293b]/40 border border-slate-800 rounded-[2.5rem] p-8 space-y-10 shadow-xl flex flex-col h-full">
                <div className="space-y-4">
                   <div className="flex items-center gap-3 text-blue-400"><div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div><span className="text-[10px] font-black uppercase tracking-widest">時段 A (基準)</span></div>
                   <div className="flex flex-col"><span className="text-lg font-black text-white italic truncate">{periodA}</span><span className="text-2xl font-black text-slate-400 font-mono">1,248 <span className="text-[10px] uppercase">Pax</span></span></div>
                </div>
                <div className="flex justify-center"><ArrowRightLeft size={24} className="text-slate-700 rotate-90" /></div>
                <div className="space-y-4">
                   <div className="flex items-center gap-3 text-purple-400"><div className="w-3 h-3 rounded-full border-2 border-purple-500 bg-transparent"></div><span className="text-[10px] font-black uppercase tracking-widest">時段 B (對比)</span></div>
                   <div className="flex flex-col"><span className="text-lg font-black text-white italic truncate">{periodB}</span><span className="text-2xl font-black text-slate-400 font-mono">1,112 <span className="text-[10px] uppercase">Pax</span></span></div>
                </div>
                <div className="mt-auto pt-8 border-t border-white/5 space-y-4">
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">總體差異分析</span>
                   <div className="flex items-center gap-3">
                      <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl"><TrendingUp size={24}/></div>
                      <div><span className="text-3xl font-black text-emerald-400 font-mono">+12.2%</span><p className="text-[9px] font-bold text-slate-500 uppercase">成長幅度</p></div>
                   </div>
                </div>
             </div>
          </div>
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
                   <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span className="text-[10px] font-black text-slate-400 uppercase">時段 A</span></div>
                   <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border-2 border-purple-500"></div><span className="text-[10px] font-black text-slate-400 uppercase">時段 B</span></div>
                </div>
             </div>
             <div className="flex-1 relative min-h-[300px]">
                <svg className="w-full h-full" viewBox="0 0 1000 400" preserveAspectRatio="none">
                   {Array.from({length: 5}).map((_, i) => (<line key={i} x1="0" y1={i * 100} x2="1000" y2={i * 100} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />))}
                   <path d="M0,350 Q100,320 200,340 T400,280 T600,200 T800,250 T1000,320" fill="none" stroke="#a855f7" strokeWidth="3" strokeDasharray="8,5" opacity="0.6" />
                   <path d="M0,340 Q100,300 200,310 T400,220 T600,120 T800,180 T1000,300" fill="url(#gradient-blue-overlay)" stroke="#3b82f6" strokeWidth="4" />
                   <circle cx="600" cy="120" r="6" fill="#3b82f6" className="animate-pulse shadow-2xl" />
                   <defs><linearGradient id="gradient-blue-overlay" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" /><stop offset="100%" stopColor="#3b82f6" stopOpacity="0" /></linearGradient></defs>
                </svg>
                <div className="absolute top-[80px] left-[610px] bg-blue-600 text-white p-3 rounded-xl shadow-2xl z-20 animate-in zoom-in-95">
                   <div className="text-[8px] font-black uppercase mb-1">高峰差異對比</div>
                   <div className="flex items-center gap-3"><span className="text-lg font-black font-mono">+32%</span><span className="text-[10px] opacity-70">高峰時段</span></div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

export default SiteTimeComparison;